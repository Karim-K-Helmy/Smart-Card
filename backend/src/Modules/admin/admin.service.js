const slugify = require('slugify');
const Admin = require('../../../DB/Models/admin.model');
const User = require('../../../DB/Models/user.model');
const CardOrder = require('../../../DB/Models/cardOrder.model');
const PaymentReceipt = require('../../../DB/Models/paymentReceipt.model');
const Card = require('../../../DB/Models/card.model');
const AdminAction = require('../../../DB/Models/adminAction.model');
const Message = require('../../../DB/Models/message.model');
const DataRequest = require('../../../DB/Models/dataRequest.model');
const { AppError } = require('../../utils/errorhandling');
const { signAdminToken } = require('../../services/token.service');
const { issueCode, consumeCode, findValidCode } = require('../../services/verification.service');
const { optimizeAndUpload, removeFromCloudinary } = require('../../services/MulterLocally');
const logAdminAction = require('../../services/admin-log.service');
const { getResourceMonitoringSnapshot } = require('../../services/resource-monitor.service');

const getConfiguredAdminEmails = (fallbackEmail = '') => {
  const raw = [process.env.ADMIN_EMAIL, process.env.ADMIN_SEED_EMAIL, fallbackEmail]
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase());

  return [...new Set(raw)];
};

const getPrimaryAdminEmail = (fallbackEmail = '') => getConfiguredAdminEmails(fallbackEmail)[0] || '';

const isPrimaryAdminEmail = (email = '') => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  return normalizedEmail && normalizedEmail === getPrimaryAdminEmail(normalizedEmail);
};

const findConfiguredAdmin = async ({ fallbackEmail = '', selectPassword = false } = {}) => {
  const candidates = getConfiguredAdminEmails(fallbackEmail);
  for (const candidate of candidates) {
    let query = Admin.findOne({ email: candidate });
    if (selectPassword) {
      query = query.select('+passwordHash');
    }
    const admin = await query;
    if (admin) {
      return admin;
    }
  }
  return null;
};

const sanitizeAdmin = (admin) => {
  const object = admin.toObject ? admin.toObject() : { ...admin };
  delete object.passwordHash;
  delete object.avatarPublicId;
  delete object.__v;
  object.primaryEmail = getPrimaryAdminEmail(object.email || '');
  object.isPrimaryAdmin = isPrimaryAdminEmail(object.email || '');
  return object;
};

const ADMIN_NOTIFICATION_TYPES = ['messages', 'orders', 'users', 'payments'];


const maskEmail = (email = '') => {
  const [name, domain] = String(email || '').split('@');
  if (!name || !domain) return email;
  const visible = name.length <= 2 ? name[0] || '*' : `${name.slice(0, 2)}***`;
  return `${visible}@${domain}`;
};

const ensureValidNotificationType = (type) => {
  if (!ADMIN_NOTIFICATION_TYPES.includes(type)) {
    throw new AppError('Unsupported notification type', 400);
  }
};

const getAdminOrFail = async (adminId) => {
  const admin = await Admin.findById(adminId);
  if (!admin) {
    throw new AppError('Admin not found', 404);
  }
  if (!admin.notificationSeenAt) {
    admin.notificationSeenAt = {};
  }
  return admin;
};

const buildUnreadFilter = (baseFilter, seenAt, dateField = 'createdAt') => ({
  ...baseFilter,
  ...(seenAt ? { [dateField]: { $gt: seenAt } } : {}),
});

const getNotificationSummary = async (adminId) => {
  const admin = await getAdminOrFail(adminId);
  const seenAt = admin.notificationSeenAt || {};

  const filters = {
    messages: buildUnreadFilter({ status: 'new' }, seenAt.messages),
    orders: buildUnreadFilter({ orderStatus: { $in: ['pending', 'waiting_payment', 'under_review'] } }, seenAt.orders),
    users: buildUnreadFilter({}, seenAt.users),
    payments: buildUnreadFilter({ reviewStatus: 'pending' }, seenAt.payments),
  };

  const [messages, orders, users, payments, latestMessage, latestOrder, latestUser, latestPayment] = await Promise.all([
    Message.countDocuments(filters.messages),
    CardOrder.countDocuments(filters.orders),
    User.countDocuments(filters.users),
    PaymentReceipt.countDocuments(filters.payments),
    Message.findOne(filters.messages).sort({ createdAt: -1 }).select('createdAt'),
    CardOrder.findOne(filters.orders).sort({ createdAt: -1 }).select('createdAt'),
    User.findOne(filters.users).sort({ createdAt: -1 }).select('createdAt'),
    PaymentReceipt.findOne(filters.payments).sort({ createdAt: -1 }).select('createdAt'),
  ]);

  return {
    counts: {
      messages,
      orders,
      users,
      payments,
    },
    latestAt: {
      messages: latestMessage?.createdAt || null,
      orders: latestOrder?.createdAt || null,
      users: latestUser?.createdAt || null,
      payments: latestPayment?.createdAt || null,
    },
    seenAt: {
      messages: seenAt.messages || null,
      orders: seenAt.orders || null,
      users: seenAt.users || null,
      payments: seenAt.payments || null,
    },
  };
};

const getNotificationCount = async (adminId, type) => {
  ensureValidNotificationType(type);
  const summary = await getNotificationSummary(adminId);
  return {
    type,
    count: summary.counts?.[type] || 0,
    latestAt: summary.latestAt?.[type] || null,
    seenAt: summary.seenAt?.[type] || null,
  };
};

const markNotificationAsRead = async (adminId, type) => {
  ensureValidNotificationType(type);
  const admin = await getAdminOrFail(adminId);
  admin.notificationSeenAt[type] = new Date();
  admin.markModified('notificationSeenAt');
  await admin.save();

  return {
    type,
    seenAt: admin.notificationSeenAt[type],
    count: 0,
  };
};

const login = async ({ email, password }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  let admin = await Admin.findOne({ email: normalizedEmail }).select('+passwordHash');

  if (!admin && getConfiguredAdminEmails().includes(normalizedEmail)) {
    admin = await findConfiguredAdmin({ fallbackEmail: normalizedEmail, selectPassword: true });
  }

  if (!admin) {
    throw new AppError('Invalid admin credentials', 401);
  }

  const matched = await admin.comparePassword(password);
  if (!matched) {
    throw new AppError('Invalid admin credentials', 401);
  }

  return {
    admin: sanitizeAdmin(admin),
    token: signAdminToken(admin),
  };
};

const requireCurrentAdmin = async (currentAdmin) => {
  const adminDoc = await Admin.findById(currentAdmin?._id);
  if (!adminDoc) {
    throw new AppError('Admin not found', 404);
  }
  return adminDoc;
};

const requestPasswordReset = async (identifier) => {
  const normalizedEmail = String(identifier || '').trim().toLowerCase();
  const admin = await Admin.findOne({ email: normalizedEmail }).select('+passwordHash');

  if (!admin) {
    throw new AppError('لا يوجد حساب إدارة بهذا البريد الإلكتروني', 404);
  }

  if (!isPrimaryAdminEmail(admin.email)) {
    throw new AppError('يرجى الرجوع إلى المدير العام لإعادة تعيين كلمة المرور الخاصة بك', 403);
  }

  const otp = await issueCode({
    email: admin.email,
    purpose: 'admin_reset_password',
    accountModel: 'Admin',
    title: 'رمز إعادة تعيين كلمة مرور المدير العام',
    intro: 'استخدم رمز التحقق التالي لإعادة تعيين كلمة مرور المدير العام داخل لوحة الإدارة.',
    greeting: `مرحبًا ${admin.name || 'Admin'}،`,
    helpText: 'هذا الرمز مخصص للمدير العام فقط. إذا لم تطلب إعادة التعيين، تجاهل هذه الرسالة.',
    meta: { adminId: String(admin._id), email: admin.email },
  });

  return {
    identifier: String(identifier || '').trim(),
    email: admin.email,
    sentTo: maskEmail(admin.email),
    expiresAt: otp.expiresAt,
  };
};

const verifyPasswordResetOtp = async (identifier, code) => {
  const normalizedEmail = String(identifier || '').trim().toLowerCase();
  const admin = await Admin.findOne({ email: normalizedEmail });

  if (!admin) {
    throw new AppError('لا يوجد حساب إدارة بهذا البريد الإلكتروني', 404);
  }

  if (!isPrimaryAdminEmail(admin.email)) {
    throw new AppError('يرجى الرجوع إلى المدير العام لإعادة تعيين كلمة المرور الخاصة بك', 403);
  }

  await findValidCode({
    email: normalizedEmail,
    code,
    purpose: 'admin_reset_password',
    accountModel: 'Admin',
  });

  return { verified: true, identifier: normalizedEmail, email: admin.email };
};

const resetPassword = async (identifier, code, newPassword) => {
  const normalizedEmail = String(identifier || '').trim().toLowerCase();
  const admin = await Admin.findOne({ email: normalizedEmail }).select('+passwordHash');

  if (!admin) {
    throw new AppError('لا يوجد حساب إدارة بهذا البريد الإلكتروني', 404);
  }

  if (!isPrimaryAdminEmail(admin.email)) {
    throw new AppError('يرجى الرجوع إلى المدير العام لإعادة تعيين كلمة المرور الخاصة بك', 403);
  }

  await consumeCode({
    email: normalizedEmail,
    code,
    purpose: 'admin_reset_password',
    accountModel: 'Admin',
  });

  admin.passwordHash = newPassword;
  await admin.save();

  return { changed: true };
};


const getResourceMonitoring = async () => {
  return getResourceMonitoringSnapshot();
};

const getDashboard = async () => {
  const [users, starUsers, proUsers, orders, pendingReceipts, approvedCards, newMessages] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ currentPlan: 'STAR' }),
    User.countDocuments({ currentPlan: 'PRO' }),
    CardOrder.countDocuments(),
    PaymentReceipt.countDocuments({ reviewStatus: 'pending' }),
    Card.countDocuments({ isActive: true }),
    Message.countDocuments({ status: 'new' }),
  ]);

  return {
    users,
    starUsers,
    proUsers,
    orders,
    pendingReceipts,
    approvedCards,
    newMessages,
  };
};

const getMe = async (adminId) => {
  const admin = await Admin.findById(adminId);
  if (!admin) {
    throw new AppError('Admin not found', 404);
  }
  return sanitizeAdmin(admin);
};

const updateMe = async (currentAdmin, payload, file) => {
  const admin = await Admin.findById(currentAdmin._id).select('+passwordHash');
  if (!admin) {
    throw new AppError('Admin not found', 404);
  }

  const normalizedEmail = payload.email ? payload.email.toLowerCase() : undefined;
  if (normalizedEmail && normalizedEmail !== admin.email) {
    throw new AppError('بريد الأدمن الأساسي ثابت ويتم التحكم فيه من خلال ملف البيئة (.env).', 400);
  }

  if (payload.newPassword) {
    if (!payload.currentPassword) {
      throw new AppError('أدخل كلمة المرور الحالية قبل تعيين كلمة مرور جديدة', 400);
    }

    const matched = await admin.comparePassword(payload.currentPassword);
    if (!matched) {
      throw new AppError('كلمة المرور الحالية غير صحيحة', 400);
    }

    admin.passwordHash = payload.newPassword;
  }

  if (payload.name !== undefined) {
    admin.name = payload.name;
  }

  if (file) {
    const uploaded = await optimizeAndUpload(file.path, 'linestart/admin-avatars');
    if (admin.avatarPublicId) {
      await removeFromCloudinary(admin.avatarPublicId);
    }
    admin.avatarUrl = uploaded.secureUrl;
    admin.avatarPublicId = uploaded.publicId;
  }

  await admin.save();
  return sanitizeAdmin(admin);
};

const listAdmins = async ({ search = '' } = {}) => {
  const filter = {};
  const normalizedSearch = String(search || '').trim();
  if (normalizedSearch) {
    filter.$or = [
      { name: { $regex: normalizedSearch, $options: 'i' } },
      { email: { $regex: normalizedSearch, $options: 'i' } },
    ];
  }
  const data = await Admin.find(filter).sort({ createdAt: -1 });
  return data.map(sanitizeAdmin);
};

const createAdmin = async (currentAdmin, payload) => {
  const actor = await requireCurrentAdmin(currentAdmin);
  const exists = await Admin.findOne({ email: payload.email.toLowerCase() });
  if (exists) {
    throw new AppError('Admin email already exists', 409);
  }

  const admin = await Admin.create({
    name: payload.name,
    email: payload.email.toLowerCase(),
    passwordHash: payload.password,
    role: payload.role || 'admin',
  });

  await logAdminAction({
    adminId: actor._id,
    actionType: 'create',
    targetTable: 'Admins',
    targetId: admin._id,
    notes: `Created admin ${admin.email}`,
  });

  return sanitizeAdmin(admin);
};

const updateAdmin = async (currentAdmin, adminId, payload) => {
  const actor = await requireCurrentAdmin(currentAdmin);
  const admin = await Admin.findById(adminId).select('+passwordHash');
  if (!admin) {
    throw new AppError('Admin not found', 404);
  }

  const targetIsPrimary = isPrimaryAdminEmail(admin.email);

  if (targetIsPrimary && String(actor._id) !== String(admin._id)) {
    throw new AppError('لا يمكن تعديل حساب المدير الأساسي إلا من داخل حسابه.', 403);
  }

  if (payload.name !== undefined) admin.name = payload.name;
  if (payload.role !== undefined && !targetIsPrimary) admin.role = payload.role;

  if (payload.email !== undefined && payload.email.toLowerCase() !== admin.email) {
    if (targetIsPrimary) {
      throw new AppError('لا يمكن تغيير البريد الإلكتروني للمدير الأساسي لأنه ثابت في ملف البيئة (.env).', 400);
    }

    const exists = await Admin.findOne({ email: payload.email.toLowerCase(), _id: { $ne: admin._id } });
    if (exists) {
      throw new AppError('Admin email already exists', 409);
    }
    admin.email = payload.email.toLowerCase();
  }

  if (payload.password) {
    admin.passwordHash = payload.password;
  }

  await admin.save();

  await logAdminAction({
    adminId: actor._id,
    actionType: 'edit',
    targetTable: 'Admins',
    targetId: admin._id,
    notes: `Updated admin ${admin.email}`,
  });

  return sanitizeAdmin(admin);
};

const deleteAdmin = async (currentAdmin, adminId) => {
  const actor = await requireCurrentAdmin(currentAdmin);
  if (String(actor._id) === String(adminId)) {
    throw new AppError('لا يمكنك حذف حساب الأدمن الحالي', 400);
  }

  const admin = await Admin.findById(adminId);
  if (!admin) {
    throw new AppError('Admin not found', 404);
  }

  if (isPrimaryAdminEmail(admin.email)) {
    throw new AppError('لا يمكن حذف المدير الأساسي المحدد في ملف البيئة (.env).', 400);
  }

  await admin.deleteOne();

  await logAdminAction({
    adminId: actor._id,
    actionType: 'delete',
    targetTable: 'Admins',
    targetId: adminId,
    notes: `Deleted admin ${admin.email}`,
  });

  return { deleted: true };
};

const listUsers = async ({ page = 1, limit = 10, status, accountType, search }) => {
  const parsedPage = Number(page) || 1;
  const parsedLimit = Math.min(Number(limit) || 10, 100);
  const skip = (parsedPage - 1) * parsedLimit;
  const filter = {};

  if (status) filter.status = status;
  if (accountType) filter.currentPlan = accountType;
  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { profileSlug: { $regex: search, $options: 'i' } },
    ];
  }

  const [data, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parsedLimit),
    User.countDocuments(filter),
  ]);

  return {
    page: parsedPage,
    limit: parsedLimit,
    total,
    pages: Math.ceil(total / parsedLimit),
    data,
  };
};

const updateUserStatus = async (admin, userId, { status, notes }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.status = status;
  await user.save();

  const actionType = status === 'frozen' ? 'freeze' : status === 'active' ? 'unfreeze' : status === 'deleted' ? 'delete' : 'edit';
  await logAdminAction({
    adminId: admin._id,
    userId: user._id,
    actionType,
    targetTable: 'Users',
    targetId: user._id,
    notes: notes || `Status changed to ${status}`,
  });

  return user;
};

const regenerateSlug = async (fullName, currentUserId) => {
  const baseSlug = slugify(fullName, { lower: true, strict: true, trim: true }) || `user-${Date.now()}`;
  let finalSlug = baseSlug;
  let counter = 1;

  while (await User.findOne({ profileSlug: finalSlug, _id: { $ne: currentUserId } })) {
    finalSlug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return finalSlug;
};

const updateUser = async (admin, userId, payload, file) => {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (payload.fullName !== undefined && payload.fullName !== user.fullName) {
    user.fullName = payload.fullName;
    user.profileSlug = await regenerateSlug(payload.fullName, user._id);
  }

  if (payload.email !== undefined && payload.email.toLowerCase() !== user.email) {
    const exists = await User.findOne({ email: payload.email.toLowerCase(), _id: { $ne: user._id } });
    if (exists) {
      throw new AppError('Email already exists', 409);
    }
    user.email = payload.email.toLowerCase();
  }

  if (payload.phone !== undefined && payload.phone !== user.phone) {
    const exists = await User.findOne({ phone: payload.phone, _id: { $ne: user._id } });
    if (exists) {
      throw new AppError('Phone already exists', 409);
    }
    user.phone = payload.phone;
  }

  if (payload.whatsappNumber !== undefined) user.whatsappNumber = payload.whatsappNumber || '';
  if (payload.currentPlan !== undefined) user.currentPlan = payload.currentPlan;
  if (payload.status !== undefined) user.status = payload.status;
  if (payload.password) user.passwordHash = payload.password;

  if (file) {
    const uploaded = await optimizeAndUpload(file.path, 'linestart/profile-images');
    if (user.profileImagePublicId) {
      await removeFromCloudinary(user.profileImagePublicId);
    }
    user.profileImage = uploaded.secureUrl;
    user.profileImagePublicId = uploaded.publicId;
  } else if (String(payload.removeProfileImage || '').toLowerCase() === 'true') {
    if (user.profileImagePublicId) {
      await removeFromCloudinary(user.profileImagePublicId);
    }
    user.profileImage = '';
    user.profileImagePublicId = '';
  }

  await user.save();

  await logAdminAction({
    adminId: admin._id,
    userId: user._id,
    actionType: 'edit',
    targetTable: 'Users',
    targetId: user._id,
    notes: `Updated user ${user.email}`,
  });

  return user;
};

const deleteUser = async (admin, userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  await user.deleteOne();

  await logAdminAction({
    adminId: admin._id,
    userId: userId,
    actionType: 'delete',
    targetTable: 'Users',
    targetId: user._id,
    notes: `Hard deleted user ${user.email}`,
  });

  return { deleted: true };
};

const listOrders = async ({ page = 1, limit = 10, orderStatus }) => {
  const parsedPage = Number(page) || 1;
  const parsedLimit = Math.min(Number(limit) || 10, 100);
  const skip = (parsedPage - 1) * parsedLimit;
  const filter = {};
  if (orderStatus) filter.orderStatus = orderStatus;

  const [data, total] = await Promise.all([
    CardOrder.find(filter)
      .populate('userId')
      .populate('cardPlanId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit),
    CardOrder.countDocuments(filter),
  ]);

  return {
    page: parsedPage,
    limit: parsedLimit,
    total,
    pages: Math.ceil(total / parsedLimit),
    data,
  };
};

const listCards = async ({ page = 1, limit = 10, isActive }) => {
  const parsedPage = Number(page) || 1;
  const parsedLimit = Math.min(Number(limit) || 10, 100);
  const skip = (parsedPage - 1) * parsedLimit;
  const filter = {};
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const [data, total] = await Promise.all([
    Card.find(filter)
      .populate('userId')
      .populate({ path: 'cardOrderId', populate: { path: 'cardPlanId' } })
      .sort({ activatedAt: -1 })
      .skip(skip)
      .limit(parsedLimit),
    Card.countDocuments(filter),
  ]);

  return {
    page: parsedPage,
    limit: parsedLimit,
    total,
    pages: Math.ceil(total / parsedLimit),
    data,
  };
};

const toggleCardStatus = async (admin, cardId, isActive) => {
  const card = await Card.findById(cardId);
  if (!card) {
    throw new AppError('Card not found', 404);
  }

  card.isActive = isActive;
  if (isActive) {
    card.activatedAt = card.activatedAt || new Date();
  }
  await card.save();

  await logAdminAction({
    adminId: admin._id,
    userId: card.userId,
    actionType: 'edit',
    targetTable: 'Cards',
    targetId: card._id,
    notes: `Card active state changed to ${isActive}`,
  });

  return card;
};

const resolveActionTargetDisplayName = async (action) => {
  if (action?.userId?.fullName) {
    return action.userId.fullName;
  }

  const targetId = String(action?.targetId || '').trim();
  if (!targetId) {
    return '';
  }

  const tableName = String(action?.targetTable || '').toLowerCase();

  try {
    if (tableName === 'admins') {
      const admin = await Admin.findById(targetId).select('name email');
      return admin?.name || admin?.email || '';
    }

    if (tableName === 'users') {
      const user = await User.findById(targetId).select('fullName email');
      return user?.fullName || user?.email || '';
    }

    if (tableName === 'cards') {
      const card = await Card.findById(targetId).populate('userId', 'fullName email');
      return card?.userId?.fullName || card?.userId?.email || '';
    }

    if (tableName === 'cardorders') {
      const order = await CardOrder.findById(targetId).populate('userId', 'fullName email');
      return order?.userId?.fullName || order?.userId?.email || '';
    }

    if (tableName === 'paymentreceipts') {
      const receipt = await PaymentReceipt.findById(targetId).populate('userId', 'fullName email');
      return receipt?.userId?.fullName || receipt?.userId?.email || '';
    }
  } catch (error) {
    return '';
  }

  return '';
};

const listActions = async ({ page = 1, limit = 20, actionType, adminId, fromDate, toDate, adminName }) => {
  const parsedPage = Number(page) || 1;
  const parsedLimit = Math.min(Number(limit) || 20, 100);
  const skip = (parsedPage - 1) * parsedLimit;

  const filter = {};

  if (actionType) {
    filter.actionType = actionType;
  }

  if (adminId) {
    filter.adminId = adminId;
  }

  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) {
      filter.createdAt.$gte = new Date(fromDate);
    }
    if (toDate) {
      const endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = endDate;
    }
  }

  if (adminName) {
    const admins = await Admin.find({
      name: { $regex: adminName, $options: 'i' },
    }).select('_id');

    filter.adminId = { $in: admins.map((item) => item._id) };
  }

  const [data, total] = await Promise.all([
    AdminAction.find(filter).populate('adminId').populate('userId').sort({ createdAt: -1 }).skip(skip).limit(parsedLimit),
    AdminAction.countDocuments(filter),
  ]);

  const enrichedData = await Promise.all(
    data.map(async (action) => {
      const actionObject = action.toObject ? action.toObject() : { ...action };
      actionObject.targetDisplayName = await resolveActionTargetDisplayName(actionObject);
      return actionObject;
    })
  );

  return {
    page: parsedPage,
    limit: parsedLimit,
    total,
    pages: Math.ceil(total / parsedLimit),
    data: enrichedData,
  };
};


const listDataRequests = async () => {
  return DataRequest.find({}).populate('reviewedBy', 'name email').sort({ createdAt: -1 });
};

const updateDataRequestStatus = async (admin, requestId, status) => {
  const request = await DataRequest.findById(requestId);
  if (!request) {
    throw new AppError('Data request not found', 404);
  }

  request.status = status;
  request.reviewedBy = admin._id;
  request.reviewedAt = new Date();
  await request.save();

  await logAdminAction({
    adminId: admin._id,
    actionType: 'edit',
    targetTable: 'DataRequests',
    targetId: request._id,
    notes: `Updated data request status to ${status} for ${request.phone}`,
  });

  return request.populate('reviewedBy', 'name email');
};

module.exports = {
  login,
  requestPasswordReset,
  verifyPasswordResetOtp,
  resetPassword,
  getDashboard,
  getResourceMonitoring,
  getNotificationSummary,
  getNotificationCount,
  markNotificationAsRead,
  getMe,
  updateMe,
  listAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  listUsers,
  updateUserStatus,
  updateUser,
  deleteUser,
  listOrders,
  listCards,
  toggleCardStatus,
  listActions,
  listDataRequests,
  updateDataRequestStatus,
};
