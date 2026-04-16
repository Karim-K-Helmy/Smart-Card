const fs = require('fs/promises');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');
const EmailQuotaStat = require('../../DB/Models/emailQuotaStat.model');
const { hasRealCloudinaryConfig } = require('./MulterLocally');

const DEFAULT_LOCAL_STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024;
const DEFAULT_SMTP_DAILY_LIMIT = 500;

const configureCloudinaryApi = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clampPercent = (value) => {
  const numeric = toNumber(value, 0);
  if (numeric < 0) return 0;
  if (numeric > 100) return 100;
  return Number(numeric.toFixed(2));
};

const getAlertLevel = (percent) => {
  if (percent >= 95) return 'danger';
  if (percent >= 80) return 'warning';
  return 'success';
};

const getAlertText = (percent, label) => {
  if (percent >= 95) return `تنبيه حرج: ${label} أوشكت على الوصول إلى الحد الأقصى.`;
  if (percent >= 80) return `تنبيه: ${label} تقترب من الحد الأقصى ويُنصح بالمراجعة.`;
  return `${label} ضمن النطاق الآمن حالياً.`;
};

const formatBytes = (bytes) => {
  const numeric = Math.max(toNumber(bytes, 0), 0);
  if (numeric < 1024) return `${numeric.toFixed(0)} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let size = numeric / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 100 ? 0 : size >= 10 ? 1 : 2)} ${units[unitIndex]}`;
};

const getDirectorySize = async (directoryPath) => {
  let stats;
  try {
    stats = await fs.stat(directoryPath);
  } catch (error) {
    return 0;
  }

  if (stats.isFile()) {
    return stats.size;
  }

  const entries = await fs.readdir(directoryPath, { withFileTypes: true }).catch(() => []);
  const totals = await Promise.all(
    entries.map((entry) => getDirectorySize(path.join(directoryPath, entry.name)))
  );
  return totals.reduce((sum, value) => sum + value, 0);
};

const buildStorageMetric = ({ usageBytes, limitBytes, provider, configured }) => {
  const usage = Math.max(toNumber(usageBytes, 0), 0);
  const limit = Math.max(toNumber(limitBytes, 0), 0);
  const remaining = Math.max(limit - usage, 0);
  const usagePercent = clampPercent(limit > 0 ? (usage / limit) * 100 : 0);

  return {
    provider,
    configured,
    usageBytes: usage,
    limitBytes: limit,
    remainingBytes: remaining,
    usagePercent,
    usageText: formatBytes(usage),
    limitText: formatBytes(limit),
    remainingText: formatBytes(remaining),
    alertLevel: getAlertLevel(usagePercent),
    alertText: getAlertText(usagePercent, 'استهلاك التخزين'),
  };
};

const getCloudinaryStorageUsage = async () => {
  if (!hasRealCloudinaryConfig()) {
    const uploadsDirectory = path.join(process.cwd(), 'uploads');
    const limitMb = toNumber(process.env.LOCAL_STORAGE_QUOTA_MB || process.env.CLOUDINARY_STORAGE_LIMIT_MB, 1024);
    const usageBytes = await getDirectorySize(uploadsDirectory);
    const limitBytes = Math.max(limitMb, 1) * 1024 * 1024 || DEFAULT_LOCAL_STORAGE_LIMIT_BYTES;

    return buildStorageMetric({
      usageBytes,
      limitBytes,
      provider: 'local_uploads',
      configured: false,
    });
  }

  configureCloudinaryApi();
  const usageResponse = await cloudinary.api.usage();
  const storage = usageResponse?.storage || {};

  const usageBytes =
    storage.usage_bytes ??
    storage.used_bytes ??
    storage.usage ??
    storage.used ??
    usageResponse?.storage_usage ??
    0;

  const limitBytes =
    storage.limit_bytes ??
    storage.max_bytes ??
    storage.limit ??
    usageResponse?.storage_limit ??
    0;

  const metric = buildStorageMetric({
    usageBytes,
    limitBytes,
    provider: 'cloudinary',
    configured: true,
  });

  if (storage.used_percent !== undefined && storage.used_percent !== null) {
    metric.usagePercent = clampPercent(storage.used_percent);
    metric.alertLevel = getAlertLevel(metric.usagePercent);
    metric.alertText = getAlertText(metric.usagePercent, 'استهلاك التخزين');
  }

  metric.raw = {
    plan: usageResponse?.plan || null,
    lastUpdatedAt: new Date().toISOString(),
  };

  return metric;
};

const getDayBounds = () => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const dayKey = start.toISOString().slice(0, 10);
  return { start, end, dayKey };
};

const recordSentEmail = async ({ mode = 'smtp' } = {}) => {
  const { start, dayKey } = getDayBounds();
  const isPreview = String(mode) === 'preview';

  await EmailQuotaStat.findOneAndUpdate(
    { dayKey },
    {
      $setOnInsert: { dayKey, date: start },
      $inc: {
        count: 1,
        smtpCount: isPreview ? 0 : 1,
        previewCount: isPreview ? 1 : 0,
      },
      $set: { lastSentAt: new Date() },
    },
    { upsert: true, new: true }
  );
};

const getEmailQuotaUsage = async () => {
  const { dayKey } = getDayBounds();
  const limit = Math.max(toNumber(process.env.SMTP_DAILY_LIMIT, DEFAULT_SMTP_DAILY_LIMIT), 1);
  const stats = await EmailQuotaStat.findOne({ dayKey }).lean();

  const sent = toNumber(stats?.count, 0);
  const smtpCount = toNumber(stats?.smtpCount, 0);
  const previewCount = toNumber(stats?.previewCount, 0);
  const remaining = Math.max(limit - sent, 0);
  const usagePercent = clampPercent((sent / limit) * 100);

  return {
    provider: process.env.SMTP_HOST || 'smtp',
    configured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
    mode: process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS ? 'smtp' : 'preview',
    sent,
    smtpCount,
    previewCount,
    limit,
    remaining,
    usagePercent,
    lastSentAt: stats?.lastSentAt || null,
    dayKey,
    alertLevel: getAlertLevel(usagePercent),
    alertText: getAlertText(usagePercent, 'استهلاك البريد الإلكتروني اليومي'),
  };
};

const getResourceMonitoringSnapshot = async () => {
  const [cloudinary, email] = await Promise.all([getCloudinaryStorageUsage(), getEmailQuotaUsage()]);

  return {
    generatedAt: new Date().toISOString(),
    cloudinary,
    email,
  };
};

module.exports = {
  getResourceMonitoringSnapshot,
  recordSentEmail,
};
