import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { getResourceMonitoring } from '../../services/api/admin';
import { extractApiError, formatDate } from '../../utils/api';

const formatBytes = (bytes) => {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value <= 0) return '0 MB';
  if (value < 1024) return `${value.toFixed(0)} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let size = value / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 100 ? 0 : size >= 10 ? 1 : 2)} ${units[unitIndex]}`;
};

const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

const getToneLabel = (tone) => {
  if (tone === 'danger') return 'خطر';
  if (tone === 'warning') return 'تنبيه';
  return 'آمن';
};

const MetricRow = ({ label, value, hint }) => (
  <div className="resource-metric-row">
    <div>
      <strong>{value}</strong>
      {hint ? <small>{hint}</small> : null}
    </div>
    <span>{label}</span>
  </div>
);

const ProgressSection = ({ title, icon, badgeTone, badgeLabel, alertText, percent, children }) => (
  <Card title={title} icon={icon}>
    <div className="stack-md">
      <div className="resource-panel-head">
        <Badge tone={badgeTone}>{badgeLabel}</Badge>
        <p className="muted resource-alert-text">{alertText}</p>
      </div>
      <div className="resource-progress-block">
        <div className="resource-progress-meta">
          <strong>{formatPercent(percent)}</strong>
          <span>النسبة المستهلكة</span>
        </div>
        <div className="resource-progress-track">
          <div
            className={`resource-progress-fill tone-${badgeTone}`}
            style={{ width: `${Math.min(Math.max(Number(percent || 0), 0), 100)}%` }}
          />
        </div>
      </div>
      <div className="resource-metric-grid">{children}</div>
    </div>
  </Card>
);

export default function AdminResourceMonitoringPage() {
  const [snapshot, setSnapshot] = useState(null);
  const [status, setStatus] = useState({ loading: true, refreshing: false, error: '' });

  const load = async ({ silent = false } = {}) => {
    setStatus((prev) => ({
      loading: silent ? prev.loading : true,
      refreshing: silent,
      error: '',
    }));

    try {
      const { data } = await getResourceMonitoring();
      setSnapshot(data.data || null);
      setStatus({ loading: false, refreshing: false, error: '' });
    } catch (error) {
      setStatus({ loading: false, refreshing: false, error: extractApiError(error) });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cloudinary = snapshot?.cloudinary || {};
  const email = snapshot?.email || {};

  const headerBadge = useMemo(() => {
    const levels = [cloudinary.alertLevel, email.alertLevel];
    if (levels.includes('danger')) return { tone: 'danger', label: 'يتطلب متابعة عاجلة' };
    if (levels.includes('warning')) return { tone: 'warning', label: 'يوجد اقتراب من الحد' };
    return { tone: 'success', label: 'الحالة مستقرة' };
  }, [cloudinary.alertLevel, email.alertLevel]);

  return (
    <div className="stack-lg">
      <PageHeader
        title="حالة النظام"
        text="مراقبة استهلاك التخزين والبريد الإلكتروني لتجنب توقف رفع الملفات أو رسائل التحقق."
        badge={headerBadge}
        icon="fa-chart-line"
        actions={(
          <Button variant="secondary" onClick={() => load({ silent: true })} disabled={status.loading || status.refreshing}>
            {status.refreshing ? 'جارٍ التحديث...' : 'تحديث الآن'}
          </Button>
        )}
      />

      {status.error ? (
        <Card>
          <p className="error-text">{status.error}</p>
        </Card>
      ) : null}

      <div className="grid grid-2 resource-grid">
        <ProgressSection
          title="مراقبة استهلاك التخزين"
          icon="fa-cloud-arrow-up"
          badgeTone={cloudinary.alertLevel || 'success'}
          badgeLabel={getToneLabel(cloudinary.alertLevel || 'success')}
          alertText={cloudinary.alertText || 'جارٍ تحميل بيانات التخزين...'}
          percent={cloudinary.usagePercent || 0}
        >
          <MetricRow label="المستخدم حالياً" value={cloudinary.usageText || formatBytes(cloudinary.usageBytes)} hint={cloudinary.configured ? 'على Cloudinary' : 'على التخزين المحلي'} />
          <MetricRow label="الحد الأقصى" value={cloudinary.limitText || formatBytes(cloudinary.limitBytes)} hint="Quota Limit" />
          <MetricRow label="المتبقي" value={cloudinary.remainingText || formatBytes(cloudinary.remainingBytes)} hint="المساحة المتاحة" />
          <MetricRow label="مصدر البيانات" value={cloudinary.configured ? 'Cloudinary API' : 'Local uploads fallback'} hint={snapshot?.generatedAt ? `آخر تحديث: ${formatDate(snapshot.generatedAt)}` : ''} />
        </ProgressSection>

        <ProgressSection
          title="مراقبة استهلاك البريد الإلكتروني"
          icon="fa-envelope-circle-check"
          badgeTone={email.alertLevel || 'success'}
          badgeLabel={getToneLabel(email.alertLevel || 'success')}
          alertText={email.alertText || 'جارٍ تحميل بيانات البريد...'}
          percent={email.usagePercent || 0}
        >
          <MetricRow label="المرسل اليوم" value={String(email.sent ?? 0)} hint={email.mode === 'smtp' ? 'مرسلة عبر SMTP' : 'وضع معاينة / تطوير'} />
          <MetricRow label="الحد اليومي" value={String(email.limit ?? 0)} hint="Daily Limit" />
          <MetricRow label="المتبقي اليوم" value={String(email.remaining ?? 0)} hint="قبل الوصول للحد" />
          <MetricRow label="آخر إرسال" value={email.lastSentAt ? formatDate(email.lastSentAt) : 'لا يوجد'} hint={`SMTP: ${email.smtpCount ?? 0} | Preview: ${email.previewCount ?? 0}`} />
        </ProgressSection>
      </div>
    </div>
  );
}
