const slugify = require('slugify');
const User = require('../../../DB/Models/user.model');
const PersonalProfile = require('../../../DB/Models/personalProfile.model');
const BusinessProfile = require('../../../DB/Models/businessProfile.model');
const SocialLink = require('../../../DB/Models/socialLink.model');
const Product = require('../../../DB/Models/product.model');
const DataRequest = require('../../../DB/Models/dataRequest.model');
const Category = require('../../../DB/Models/category.model');
const CardOrder = require('../../../DB/Models/cardOrder.model');
const PaymentReceipt = require('../../../DB/Models/paymentReceipt.model');
const Card = require('../../../DB/Models/card.model');
const { AppError } = require('../../utils/errorhandling');
const { signUserToken } = require('../../services/token.service');
const { optimizeAndUpload, removeFromCloudinary } = require('../../services/MulterLocally');
const { issueCode, consumeCode, findValidCode } = require('../../services/verification.service');

const MAX_BUSINESS_LOCATIONS = 2;
const MAX_PRODUCTS = 10;


const maskEmail = (email = '') => {
  const [name, domain] = String(email || '').split('@');
  if (!name || !domain) return email;
  const visible = name.length <= 2 ? name[0] || '*' : `${name.slice(0, 2)}***`;
  return `${visible}@${domain}`;
};

const findUserByIdentifier = async (identifier, selectPassword = false) => {
  const normalized = String(identifier || '').trim();
  const email = normalized.toLowerCase();
  let query = User.findOne({
    $or: [{ email }, { phone: normalized }],
  });
  if (selectPassword) query = query.select('+passwordHash');
  return query;
};

const sanitizeUser = (user) => {
  const object = user.toObject ? user.toObject() : { ...user };
  delete object.passwordHash;
  delete object.profileImagePublicId;
  delete object.__v;
  return object;
};


const normalizeBusinessLocations = (businessLocations) => {
  if (businessLocations === undefined) {
    return undefined;
  }

  if (typeof businessLocations === 'string') {
    if (!businessLocations.trim()) {
      return [];
    }
    try {
      return JSON.parse(businessLocations);
    } catch (error) {
      throw new AppError('businessLocations must be a valid JSON array', 400);
    }
  }

  if (!Array.isArray(businessLocations)) {
    throw new AppError('businessLocations must be an array', 400);
  }

  return businessLocations;
};

const normalizeStoredBusinessLocations = (businessProfile) => {
  if (Array.isArray(businessProfile?.businessLocations) && businessProfile.businessLocations.length) {
    return businessProfile.businessLocations;
  }

  const fallbackImages = businessProfile?.logo ? [{ url: businessProfile.logo, publicId: businessProfile.logoPublicId || '' }] : [];
  const hasFallbackData = businessProfile?.businessName || businessProfile?.businessDescription || businessProfile?.address || businessProfile?.googleMapsLink || businessProfile?.phone || businessProfile?.whatsappNumber || businessProfile?.facebookLink || businessProfile?.email || fallbackImages.length;

  if (!hasFallbackData) {
    return [];
  }

  return [{
    name: businessProfile.businessName || '',
    description: businessProfile.businessDescription || '',
    address: businessProfile.address || '',
    googleMapsLink: businessProfile.googleMapsLink || '',
    phone: businessProfile.phone || '',
    whatsappNumber: businessProfile.whatsappNumber || '',
    facebookLink: businessProfile.facebookLink || '',
    email: businessProfile.email || '',
    images: fallbackImages,
    sortOrder: 0,
  }];
};


const normalizeSocialLinks = (socialLinks) => {
  if (socialLinks === undefined) {
    return undefined;
  }

  if (typeof socialLinks === 'string') {
    if (!socialLinks.trim()) {
      return [];
    }
    try {
      return JSON.parse(socialLinks);
    } catch (error) {
      throw new AppError('socialLinks must be a valid JSON array', 400);
    }
  }

  if (!Array.isArray(socialLinks)) {
    throw new AppError('socialLinks must be an array', 400);
  }

  return socialLinks;
};

const generateUniqueSlug = async (fullName, currentUserId = null) => {
  const baseSlug = slugify(fullName, { lower: true, strict: true, trim: true }) || `user-${Date.now()}`;
  let finalSlug = baseSlug;
  let counter = 1;

  while (
    await User.findOne({
      profileSlug: finalSlug,
      ...(currentUserId ? { _id: { $ne: currentUserId } } : {}),
    })
  ) {
    finalSlug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return finalSlug;
};

const getCategoryIfExists = async (categoryId) => {
  if (!categoryId) {
    return null;
  }
  const category = await Category.findById(categoryId);
  if (!category) {
    throw new AppError('Category not found', 404);
  }
  return category;
};

const replaceSocialLinks = async (userId, socialLinks) => {
  if (socialLinks === undefined) {
    return;
  }

  await SocialLink.deleteMany({ userId });
  if (!socialLinks.length) {
    return;
  }

  const prepared = socialLinks.map((item, index) => ({
    userId,
    platformName: item.platformName,
    url: item.url,
    sortOrder: item.sortOrder ?? index,
  }));

  await SocialLink.insertMany(prepared);
};

const buildProfileResponse = async (userDoc) => {
  const user = sanitizeUser(userDoc);
  const [personalProfile, businessProfile, socialLinks, products] = await Promise.all([
    PersonalProfile.findOne({ userId: userDoc._id }),
    BusinessProfile.findOne({ userId: userDoc._id }),
    SocialLink.find({ userId: userDoc._id }).sort({ sortOrder: 1 }),
    Product.find({ userId: userDoc._id }).populate('categoryId').sort({ sortOrder: 1, createdAt: -1 }),
  ]);

  const businessProfileObject = businessProfile ? (businessProfile.toObject ? businessProfile.toObject() : { ...businessProfile }) : null;
  if (businessProfileObject) {
    businessProfileObject.businessLocations = normalizeStoredBusinessLocations(businessProfileObject);
  }

  return {
    user,
    personalProfile,
    businessProfile: businessProfileObject,
    socialLinks,
    products: user.currentPlan === 'PRO' ? products : [],
  };
};

const ensureActiveUser = (user) => {
  if (!user) {
    throw new AppError('User not found', 404);
  }
  if (user.status === 'deleted') {
    throw new AppError('هذا الحساب غير متاح حالياً.', 403, 'error', 'ACCOUNT_DELETED');
  }
  if (user.status === 'frozen') {
    throw new AppError('تم إيقاف حسابك، يُرجى الرجوع إلى الإدارة.', 403, 'error', 'ACCOUNT_SUSPENDED');
  }
};

const register = async (payload) => {
  const normalizedEmail = payload.email.toLowerCase();
  const exists = await User.findOne({
    $or: [{ email: normalizedEmail }, { phone: payload.phone }],
  });

  if (exists) {
    throw new AppError('Email or phone already exists', 409);
  }

  const profileSlug = await generateUniqueSlug(payload.fullName);
  const user = await User.create({
    fullName: payload.fullName,
    email: normalizedEmail,
    phone: payload.phone,
    whatsappNumber: payload.whatsappNumber || '',
    passwordHash: payload.password,
    currentPlan: 'NONE',
    profileSlug,
    status: 'pending',
    emailVerified: false,
    emailVerifiedAt: null,
    activationEmailSentAt: new Date(),
    activationEmailSentCount: 1,
  });

  await Promise.all([
    PersonalProfile.create({ userId: user._id }),
    BusinessProfile.create({ userId: user._id }),
  ]);

  const otp = await issueCode({
    email: user.email,
    purpose: 'activate_account',
    accountModel: 'User',
    title: 'تأكيد الحساب الجديد',
    greeting: `مرحبًا ${user.fullName}،`,
    intro: 'تم إنشاء حسابك بنجاح. أدخل رمز التحقق التالي لتأكيد الحساب وتفعيل الدخول إلى لوحة المستخدم.',
    meta: { userId: String(user._id) },
  });

  return {
    user: sanitizeUser(user),
    verification: {
      email: user.email,
      expiresAt: otp.expiresAt,
      sentTo: maskEmail(user.email),
    },
  };
};

const login = async ({ emailOrPhone, password }) => {
  const user = await findUserByIdentifier(emailOrPhone, true);

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  if (!user.emailVerified || user.status === 'pending') {
    throw new AppError('يجب تأكيد الحساب أولاً باستخدام رمز OTP المرسل إلى بريدك الإلكتروني.', 403);
  }

  const matched = await user.comparePassword(password);
  if (!matched) {
    throw new AppError('Invalid credentials', 401);
  }

  if (user.status === 'deleted') {
    throw new AppError('هذا الحساب غير متاح حالياً.', 403, 'error', 'ACCOUNT_DELETED');
  }

  if (user.status === 'frozen') {
    throw new AppError('تم إيقاف حسابك، يُرجى الرجوع إلى الإدارة.', 403, 'error', 'ACCOUNT_SUSPENDED');
  }

  user.lastLoginAt = new Date();
  await user.save();

  return {
    user: sanitizeUser(user),
    token: signUserToken(user._id),
  };
};

const forgotPassword = async (identifier) => {
  const user = await findUserByIdentifier(identifier);
  if (!user) {
    throw new AppError('لا يوجد حساب مطابق لهذا البريد الإلكتروني أو رقم الهاتف', 404);
  }

  if (!user.emailVerified || user.status === 'pending') {
    throw new AppError('هذا الحساب غير مؤكد بعد. يرجى تأكيد الحساب أولاً.', 400);
  }

  ensureActiveUser(user);

  const otp = await issueCode({
    email: user.email,
    purpose: 'reset_password',
    accountModel: 'User',
    title: 'رمز استعادة كلمة المرور',
    greeting: `مرحبًا ${user.fullName}،`,
    intro: 'وصلنا طلب لإعادة تعيين كلمة المرور. استخدم الرمز التالي لإكمال العملية.',
    meta: { userId: String(user._id), identifier: String(identifier || '').trim() },
  });

  return {
    identifier: String(identifier || '').trim(),
    email: user.email,
    sentTo: maskEmail(user.email),
    expiresAt: otp.expiresAt,
  };
};

const verifyForgotPasswordOtp = async (identifier, code) => {
  const user = await findUserByIdentifier(identifier);
  if (!user) {
    throw new AppError('لا يوجد حساب مطابق لهذا البريد الإلكتروني أو رقم الهاتف', 404);
  }

  ensureActiveUser(user);
  await findValidCode({
    email: user.email,
    code,
    purpose: 'reset_password',
    accountModel: 'User',
  });

  return {
    verified: true,
    identifier: String(identifier || '').trim(),
    email: user.email,
  };
};

const resetPassword = async (identifier, code, newPassword) => {
  const user = await findUserByIdentifier(identifier, true);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  ensureActiveUser(user);
  await consumeCode({
    email: user.email,
    code,
    purpose: 'reset_password',
    accountModel: 'User',
  });

  user.passwordHash = newPassword;
  await user.save();

  return { changed: true };
};

const verifyRegistrationOtp = async (email, code) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.emailVerified && user.status === 'active') {
    return {
      user: sanitizeUser(user),
      token: signUserToken(user._id),
      alreadyVerified: true,
    };
  }

  await consumeCode({
    email: normalizedEmail,
    code,
    purpose: 'activate_account',
    accountModel: 'User',
  });

  user.emailVerified = true;
  user.emailVerifiedAt = new Date();
  user.status = 'active';
  user.lastLoginAt = new Date();
  await user.save();

  return {
    user: sanitizeUser(user),
    token: signUserToken(user._id),
  };
};

const resendActivationCode = async (email) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.emailVerified && user.status === 'active') {
    throw new AppError('تم تأكيد هذا الحساب بالفعل', 400);
  }

  const otp = await issueCode({
    email: user.email,
    purpose: 'activate_account',
    accountModel: 'User',
    title: 'إعادة إرسال رمز تأكيد الحساب',
    greeting: `مرحبًا ${user.fullName}،`,
    intro: 'هذا هو رمز التحقق الجديد لإكمال تأكيد حسابك.',
    meta: { userId: String(user._id) },
  });

  user.activationEmailSentAt = new Date();
  user.activationEmailSentCount = Number(user.activationEmailSentCount || 0) + 1;
  await user.save();

  return {
    email: user.email,
    sentTo: maskEmail(user.email),
    expiresAt: otp.expiresAt,
  };
};


const checkPhoneExists = async (phone) => {
  const user = await User.findOne({ phone: String(phone || '').trim() }).select('_id phone status');

  if (!user || user.status === 'deleted') {
    throw new AppError('هذا الرقم غير مسجل لدينا', 404);
  }

  return { exists: true, phone: user.phone };
};

const createDataRequest = async ({ phone, notes }) => {
  const normalizedPhone = String(phone || '').trim();
  const user = await User.findOne({ phone: normalizedPhone }).select('_id phone status');

  if (!user || user.status === 'deleted') {
    throw new AppError('هذا الرقم غير مسجل لدينا', 404);
  }

  const request = await DataRequest.create({
    phone: normalizedPhone,
    notes: String(notes || '').trim(),
    status: 'pending',
  });

  return request;
};

const getMyProfile = async (userId) => {

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return buildProfileResponse(user);
};

const USER_NOTIFICATION_TYPES = ['orders', 'notifications'];

const ensureValidUserNotificationType = (type) => {
  if (!USER_NOTIFICATION_TYPES.includes(type)) {
    throw new AppError('Unsupported notification type', 400);
  }
};

const getUserWithNotificationState = async (currentUser) => {
  const user = await User.findById(currentUser._id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  if (!user.notificationSeenAt) {
    user.notificationSeenAt = {};
  }
  return user;
};

const buildOrderNotice = (latestOrder) => {
  if (!latestOrder) return null;

  const orderMap = {
    waiting_payment: {
      title: 'طلبك يحتاج رفع إيصال الدفع',
      text: `تم إنشاء طلب باقة ${latestOrder.cardPlanId?.name || ''} وبانتظار الدفع.`,
      status: 'warning',
    },
    under_review: {
      title: 'إيصال الدفع تحت المراجعة',
      text: 'تم استلام إيصال الدفع وجارٍ مراجعته من الإدارة.',
      status: 'info',
    },
    approved: {
      title: 'تم اعتماد طلب البطاقة',
      text: `تمت الموافقة على طلب ${latestOrder.cardPlanId?.name || 'البطاقة'} ويمكنك الآن استخدام البطاقة.`,
      status: 'success',
    },
    rejected: {
      title: 'تم رفض الإيصال',
      text: 'تم رفض إيصال الدفع الأخير. راجع الطلب وأعد الرفع بصورة أوضح.',
      status: 'danger',
    },
    pending: {
      title: 'تم استلام الطلب',
      text: 'طلبك تم تسجيله داخل النظام.',
      status: 'info',
    },
  };

  return {
    id: `order-${latestOrder._id}`,
    createdAt: latestOrder.updatedAt || latestOrder.createdAt,
    ...(orderMap[latestOrder.orderStatus] || {
      title: 'تحديث على طلبك',
      text: 'هناك تحديث جديد على طلب البطاقة.',
      status: 'info',
    }),
  };
};

const buildReceiptNotice = (latestReceipt) => {
  if (!latestReceipt) return null;

  const receiptMap = {
    pending: 'تم استلام صورة الإيصال وهي بانتظار المراجعة.',
    approved: 'تمت الموافقة على إيصال الدفع بنجاح.',
    rejected: latestReceipt.reviewNote || 'تم رفض إيصال الدفع الأخير.',
  };

  return {
    id: `receipt-${latestReceipt._id}`,
    title: 'حالة إيصال الدفع',
    text: receiptMap[latestReceipt.reviewStatus] || 'هناك تحديث على إيصال الدفع.',
    status: latestReceipt.reviewStatus === 'approved' ? 'success' : latestReceipt.reviewStatus === 'rejected' ? 'danger' : 'warning',
    createdAt: latestReceipt.createdAt,
  };
};

const buildCardNotice = (card) => {
  if (!card) return null;

  if (card.isActive) {
    return {
      id: `card-${card._id}`,
      title: 'بطاقتك مفعلة',
      text: `كود البطاقة: ${card.cardCode}. الرابط جاهز للمشاركة.`,
      status: 'success',
      createdAt: card.lastStatusChangedAt || card.activatedAt || card.createdAt || new Date(),
    };
  }

  if (card.suspendedAt) {
    return {
      id: `card-suspended-${card._id}`,
      title: 'تم إيقاف بطاقتك',
      text: 'تم إيقاف بطاقتك مؤقتًا من الإدارة، وتم تعطيل الصفحة العامة الخاصة بها. يُرجى الرجوع إلى الإدارة.',
      status: 'danger',
      createdAt: card.suspendedAt || card.lastStatusChangedAt || new Date(),
    };
  }

  return null;
};

const buildUserNotificationPayload = async (currentUser) => {
  const user = await getUserWithNotificationState(currentUser);
  const cardNotificationFilter = { userId: user._id };
  if (user.notificationSeenAt?.notifications) {
    cardNotificationFilter.$or = [
      { activatedAt: { $gt: user.notificationSeenAt.notifications } },
      { suspendedAt: { $gt: user.notificationSeenAt.notifications } },
      { lastStatusChangedAt: { $gt: user.notificationSeenAt.notifications } },
    ];
  }

  const [orders, receipts, card, orderUnreadCount, receiptUnreadCount, latestUnreadOrder, latestUnreadReceipt, latestCardEvent] = await Promise.all([
    CardOrder.find({ userId: user._id }).populate('cardPlanId').sort({ createdAt: -1 }).limit(5),
    PaymentReceipt.find({ userId: user._id }).populate('paymentMethodId').sort({ createdAt: -1 }).limit(5),
    Card.findOne({ userId: user._id }).sort({ lastStatusChangedAt: -1, suspendedAt: -1, activatedAt: -1 }),
    CardOrder.countDocuments({ userId: user._id, ...(user.notificationSeenAt?.orders ? { updatedAt: { $gt: user.notificationSeenAt.orders } } : {}) }),
    PaymentReceipt.countDocuments({ userId: user._id, ...(user.notificationSeenAt?.notifications ? { createdAt: { $gt: user.notificationSeenAt.notifications } } : {}) }),
    CardOrder.findOne({ userId: user._id, ...(user.notificationSeenAt?.notifications ? { updatedAt: { $gt: user.notificationSeenAt.notifications } } : {}) })
      .populate('cardPlanId')
      .sort({ updatedAt: -1, createdAt: -1 }),
    PaymentReceipt.findOne({ userId: user._id, ...(user.notificationSeenAt?.notifications ? { createdAt: { $gt: user.notificationSeenAt.notifications } } : {}) })
      .populate('paymentMethodId')
      .sort({ createdAt: -1 }),
    Card.findOne(cardNotificationFilter)
      .sort({ lastStatusChangedAt: -1, suspendedAt: -1, activatedAt: -1 }),
  ]);

  const notices = [];
  const latestOrder = orders[0];
  const latestReceipt = receipts[0];

  const orderNotice = buildOrderNotice(latestOrder);
  const receiptNotice = buildReceiptNotice(latestReceipt);
  const cardNotice = buildCardNotice(card);

  if (orderNotice) notices.push(orderNotice);
  if (receiptNotice) notices.push(receiptNotice);
  if (cardNotice) notices.push(cardNotice);

  if (!notices.length) {
    notices.push({
      id: 'empty-notice',
      title: 'لا توجد إشعارات حالياً',
      text: 'بعد إنشاء الطلب أو مراجعة الدفع ستظهر الإشعارات هنا.',
      status: 'info',
      createdAt: new Date(),
    });
  }

  const unreadNotificationDates = [
    latestUnreadOrder?.updatedAt || latestUnreadOrder?.createdAt || null,
    latestUnreadReceipt?.createdAt || null,
    latestCardEvent?.lastStatusChangedAt || latestCardEvent?.suspendedAt || latestCardEvent?.activatedAt || latestCardEvent?.createdAt || null,
  ]
    .filter(Boolean)
    .map((item) => new Date(item))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b - a);

  const validNoticeDates = notices
    .filter((item) => item.id !== 'empty-notice' && item.createdAt)
    .map((item) => new Date(item.createdAt))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b - a);

  return {
    counts: {
      orders: orderUnreadCount,
      notifications: orderUnreadCount + receiptUnreadCount + (latestCardEvent ? 1 : 0),
    },
    latestAt: {
      orders: latestOrder?.updatedAt || latestOrder?.createdAt || null,
      notifications: unreadNotificationDates[0] || null,
    },
    seenAt: {
      orders: user.notificationSeenAt?.orders || null,
      notifications: user.notificationSeenAt?.notifications || null,
    },
    notices,
  };
};

const getMyNotifications = async (currentUser) => buildUserNotificationPayload(currentUser);

const getMyNotificationCount = async (currentUser, type) => {
  ensureValidUserNotificationType(type);
  const payload = await buildUserNotificationPayload(currentUser);
  return {
    type,
    count: payload.counts?.[type] || 0,
    latestAt: payload.latestAt?.[type] || null,
    seenAt: payload.seenAt?.[type] || null,
  };
};

const markMyNotificationAsRead = async (currentUser, type) => {
  ensureValidUserNotificationType(type);
  const user = await getUserWithNotificationState(currentUser);
  user.notificationSeenAt[type] = new Date();
  user.markModified('notificationSeenAt');
  await user.save();

  return {
    type,
    seenAt: user.notificationSeenAt[type],
    count: 0,
  };
};

const updateProfile = async (currentUser, payload, files) => {
  const user = await User.findById(currentUser._id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const socialLinks = normalizeSocialLinks(payload.socialLinks);
  const businessLocations = normalizeBusinessLocations(payload.businessLocations);
  const normalizedEmail = payload.email ? payload.email.toLowerCase() : undefined;


  if (payload.fullName && payload.fullName !== user.fullName) {
    user.profileSlug = await generateUniqueSlug(payload.fullName, user._id);
    user.fullName = payload.fullName;
  }

  if (normalizedEmail !== undefined && normalizedEmail !== user.email) {
    const emailExists = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
    if (emailExists) {
      throw new AppError('Email already exists', 409);
    }
    user.email = normalizedEmail;
  }

  if (payload.phone !== undefined && payload.phone !== user.phone) {
    const phoneExists = await User.findOne({ phone: payload.phone, _id: { $ne: user._id } });
    if (phoneExists) {
      throw new AppError('Phone already exists', 409);
    }
    user.phone = payload.phone;
  }
  if (payload.whatsappNumber !== undefined) user.whatsappNumber = payload.whatsappNumber || '';
  if (payload.bio !== undefined) user.bio = payload.bio || '';

  if (files?.profileImage?.[0]) {
    const uploaded = await optimizeAndUpload(files.profileImage[0].path, 'linestart/profile-images');
    if (user.profileImagePublicId) {
      await removeFromCloudinary(user.profileImagePublicId);
    }
    user.profileImage = uploaded.secureUrl;
    user.profileImagePublicId = uploaded.publicId;
  }

  await user.save();
  await replaceSocialLinks(user._id, socialLinks);

  const personalProfile = (await PersonalProfile.findOne({ userId: user._id })) || new PersonalProfile({ userId: user._id });
  if (payload.jobTitle !== undefined) personalProfile.jobTitle = payload.jobTitle || '';
  if (payload.aboutText !== undefined) {
    personalProfile.aboutText = payload.aboutText || '';
    user.bio = payload.aboutText || '';
    await user.save();
  } else if (payload.bio !== undefined && !personalProfile.aboutText) {
    personalProfile.aboutText = payload.bio || '';
  }
  if (payload.birthDate !== undefined) personalProfile.birthDate = payload.birthDate || null;
  await personalProfile.save();

  const businessProfile = (await BusinessProfile.findOne({ userId: user._id })) || new BusinessProfile({ userId: user._id });

  if (businessLocations !== undefined) {
    if (businessLocations.length > MAX_BUSINESS_LOCATIONS) {
      throw new AppError(`You can add up to ${MAX_BUSINESS_LOCATIONS} business locations only`, 400);
    }
    const previousLocations = normalizeStoredBusinessLocations(businessProfile.toObject ? businessProfile.toObject() : businessProfile);
    const previousImages = previousLocations.flatMap((location) => location.images || []);
    const preparedLocations = [];

    for (let index = 0; index < businessLocations.length; index += 1) {
      const item = businessLocations[index] || {};
      const retainedImages = (item.existingImages || [])
        .map((imageUrl) => previousImages.find((image) => image.url === imageUrl))
        .filter(Boolean);
      const uploadedImages = [];

      for (const file of (files?.[`businessLocationImages_${index}`] || []).slice(0, 5)) {
        const uploaded = await optimizeAndUpload(file.path, 'linestart/business-locations');
        uploadedImages.push({ url: uploaded.secureUrl, publicId: uploaded.publicId });
      }

      preparedLocations.push({
        name: item.name || '',
        description: item.description || '',
        address: item.address || '',
        googleMapsLink: item.googleMapsLink || '',
        phone: item.phone || '',
        whatsappNumber: item.whatsappNumber || '',
        facebookLink: item.facebookLink || '',
        email: item.email || '',
        images: [...retainedImages, ...uploadedImages].slice(0, 5),
        sortOrder: item.sortOrder ?? index,
      });
    }

    const currentImages = preparedLocations.flatMap((location) => location.images || []);
    const removedImages = previousImages.filter((image) => !currentImages.some((currentImage) => currentImage.url === image.url));
    for (const image of removedImages) {
      await removeFromCloudinary(image.publicId);
    }

    businessProfile.businessLocations = preparedLocations;

    const firstLocation = preparedLocations[0] || {};
    const firstImage = firstLocation.images?.[0] || {};
    businessProfile.businessName = firstLocation.name || '';
    businessProfile.businessDescription = firstLocation.description || '';
    businessProfile.address = firstLocation.address || '';
    businessProfile.googleMapsLink = firstLocation.googleMapsLink || '';
    businessProfile.phone = firstLocation.phone || '';
    businessProfile.whatsappNumber = firstLocation.whatsappNumber || '';
    businessProfile.facebookLink = firstLocation.facebookLink || '';
    businessProfile.email = firstLocation.email || '';
    businessProfile.logo = firstImage.url || '';
    businessProfile.logoPublicId = firstImage.publicId || '';
  }

  await businessProfile.save();

  return buildProfileResponse(user);
};

const changePassword = async (currentUser, currentPassword, newPassword) => {
  const user = await User.findById(currentUser._id).select('+passwordHash');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const matched = await user.comparePassword(currentPassword);
  if (!matched) {
    throw new AppError('Current password is incorrect', 400);
  }

  user.passwordHash = newPassword;
  await user.save();

  return { token: signUserToken(user._id) };
};

const ensureProUser = (user) => {

  if (user.currentPlan !== 'PRO') {
    throw new AppError('Works are available for PRO plan only', 403);
  }
};

const resolveProductImageFile = (files) => {
  if (!files) return null;
  if (Array.isArray(files?.productImage) && files.productImage[0]) {
    return files.productImage[0];
  }
  if (files?.productImage && typeof files.productImage === 'object' && files.productImage.path) {
    return files.productImage;
  }
  if (files?.path) {
    return files;
  }
  return null;
};

const createProduct = async (currentUser, payload, files) => {
  const user = await User.findById(currentUser._id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  ensureProUser(user);
  if (payload.categoryId) {
    await getCategoryIfExists(payload.categoryId);
  }

  const productCount = await Product.countDocuments({ userId: user._id });
  if (productCount >= MAX_PRODUCTS) {
    throw new AppError(`You can add up to ${MAX_PRODUCTS} products only`, 400);
  }

  const product = new Product({
    userId: user._id,
    categoryId: payload.categoryId || null,
    name: payload.name,
    description: payload.description || '',
    price: payload.price ?? 0,
    isVisible: payload.isVisible ?? true,
    sortOrder: payload.sortOrder ?? 0,
  });

  const productImageFile = resolveProductImageFile(files);
  if (productImageFile) {
    const uploaded = await optimizeAndUpload(productImageFile.path, 'linestart/products');
    product.image = uploaded.secureUrl;
    product.imagePublicId = uploaded.publicId;
  }

  await product.save();
  return product;
};

const getMyProducts = async (currentUser) => {
  const user = await User.findById(currentUser._id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  ensureProUser(user);
  return Product.find({ userId: currentUser._id }).populate('categoryId').sort({ sortOrder: 1, createdAt: -1 });
};

const updateProduct = async (currentUser, productId, payload, files) => {
  const user = await User.findById(currentUser._id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  ensureProUser(user);
  const product = await Product.findOne({ _id: productId, userId: currentUser._id });
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (payload.categoryId) {
    await getCategoryIfExists(payload.categoryId);
  }

  if (payload.name !== undefined) product.name = payload.name;
  if (payload.description !== undefined) product.description = payload.description || '';
  if (payload.categoryId !== undefined) product.categoryId = payload.categoryId || null;
  if (payload.price !== undefined) product.price = payload.price;
  if (payload.isVisible !== undefined) product.isVisible = payload.isVisible;
  if (payload.sortOrder !== undefined) product.sortOrder = payload.sortOrder;

  const productImageFile = resolveProductImageFile(files);
  if (productImageFile) {
    const uploaded = await optimizeAndUpload(productImageFile.path, 'linestart/products');
    if (product.imagePublicId) {
      await removeFromCloudinary(product.imagePublicId);
    }
    product.image = uploaded.secureUrl;
    product.imagePublicId = uploaded.publicId;
  }

  await product.save();
  return product;
};

const deleteProduct = async (currentUser, productId) => {
  const user = await User.findById(currentUser._id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  ensureProUser(user);
  const product = await Product.findOne({ _id: productId, userId: currentUser._id });
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (product.imagePublicId) {
    await removeFromCloudinary(product.imagePublicId);
  }

  await product.deleteOne();
  return { deleted: true };
};

const getPublicProfile = async (slug) => {
  const user = await User.findOne({ profileSlug: slug });
  if (!user) {
    throw new AppError('Public profile not found', 404);
  }

  if (user.status !== 'active') {
    throw new AppError(
      'هذا الحساب غير متاح حالياً.',
      403,
      'error',
      'ACCOUNT_SUSPENDED',
      {
        unavailableType: 'account',
        title: 'هذا الحساب غير متاح حالياً',
        subtitle: 'Profile Temporarily Unavailable',
      }
    );
  }

  const latestCard = await Card.findOne({ userId: user._id }).sort({ activatedAt: -1, createdAt: -1 });
  if (latestCard && !latestCard.isActive) {
    throw new AppError(
      'تم إيقاف هذه البطاقة، يُرجى الرجوع إلى الإدارة.',
      403,
      'error',
      'CARD_SUSPENDED',
      {
        unavailableType: 'card',
        title: 'تم إيقاف هذه البطاقة',
        subtitle: 'Card Temporarily Unavailable',
      }
    );
  }

  const data = await buildProfileResponse(user);
  if (data.products?.length) {
    data.products = data.products.filter((product) => product.isVisible);
  }

  return data;
};

module.exports = {
  register,
  verifyRegistrationOtp,
  resendActivationCode,
  login,
  forgotPassword,
  verifyForgotPasswordOtp,
  resetPassword,
  checkPhoneExists,
  createDataRequest,
  getMyProfile,
  getMyNotifications,
  getMyNotificationCount,
  markMyNotificationAsRead,
  updateProfile,
  changePassword,
  createProduct,
  getMyProducts,
  updateProduct,
  deleteProduct,
  getPublicProfile,
};