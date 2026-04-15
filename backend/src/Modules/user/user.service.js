const slugify = require('slugify');
const User = require('../../../DB/Models/user.model');
const PersonalProfile = require('../../../DB/Models/personalProfile.model');
const BusinessProfile = require('../../../DB/Models/businessProfile.model');
const SocialLink = require('../../../DB/Models/socialLink.model');
const Product = require('../../../DB/Models/product.model');
const Category = require('../../../DB/Models/category.model');
const CardOrder = require('../../../DB/Models/cardOrder.model');
const PaymentReceipt = require('../../../DB/Models/paymentReceipt.model');
const Card = require('../../../DB/Models/card.model');
const { AppError } = require('../../utils/errorhandling');
const { signUserToken, signPasswordResetToken, verifyPasswordResetToken } = require('../../services/token.service');
const { optimizeAndUpload, removeFromCloudinary } = require('../../services/MulterLocally');

const sanitizeUser = (user) => {
  const object = user.toObject ? user.toObject() : { ...user };
  delete object.passwordHash;
  delete object.profileImagePublicId;
  delete object.__v;
  return object;
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
    BusinessProfile.findOne({ userId: userDoc._id }).populate('categoryId'),
    SocialLink.find({ userId: userDoc._id }).sort({ sortOrder: 1 }),
    Product.find({ userId: userDoc._id }).populate('categoryId').sort({ sortOrder: 1, createdAt: -1 }),
  ]);

  return {
    user,
    personalProfile,
    businessProfile,
    socialLinks,
    products: user.currentPlan === 'PRO' ? products : [],
  };
};

const ensureActiveUser = (user) => {
  if (!user) {
    throw new AppError('User not found', 404);
  }
  if (['deleted', 'frozen'].includes(user.status)) {
    throw new AppError('This account is not allowed to login', 403);
  }
};

const register = async (payload) => {
  const exists = await User.findOne({
    $or: [{ email: payload.email.toLowerCase() }, { phone: payload.phone }],
  });

  if (exists) {
    throw new AppError('Email or phone already exists', 409);
  }

  const profileSlug = await generateUniqueSlug(payload.fullName);
  const user = await User.create({
    fullName: payload.fullName,
    email: payload.email.toLowerCase(),
    phone: payload.phone,
    whatsappNumber: payload.whatsappNumber || '',
    passwordHash: payload.password,
    currentPlan: 'NONE',
    profileSlug,
    status: 'active',
    emailVerified: true,
    emailVerifiedAt: new Date(),
  });

  await Promise.all([
    PersonalProfile.create({ userId: user._id }),
    BusinessProfile.create({ userId: user._id }),
  ]);

  user.lastLoginAt = new Date();
  await user.save();

  return {
    user: sanitizeUser(user),
    token: signUserToken(user._id),
  };
};

const login = async ({ emailOrPhone, password }) => {

  const user = await User.findOne({
    $or: [{ email: emailOrPhone.toLowerCase() }, { phone: emailOrPhone }],
  }).select('+passwordHash');

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  ensureActiveUser(user);

  const matched = await user.comparePassword(password);
  if (!matched) {
    throw new AppError('Invalid credentials', 401);
  }

  user.lastLoginAt = new Date();
  await user.save();

  return {
    user: sanitizeUser(user),
    token: signUserToken(user._id),
  };
};

const forgotPassword = async (email, phone) => {
  const user = await User.findOne({ email: email.toLowerCase(), phone });
  if (!user) {
    throw new AppError('البريد الإلكتروني أو رقم الهاتف غير مطابقين لبيانات الحساب', 404);
  }

  ensureActiveUser(user);

  return {
    resetToken: signPasswordResetToken({
      id: user._id,
      email: user.email,
      phone: user.phone,
      role: 'user',
      accountModel: 'User',
    }),
  };
};

const resetPassword = async (email, resetToken, newPassword) => {
  const decoded = verifyPasswordResetToken(resetToken);
  if (decoded.accountModel !== 'User' || decoded.role !== 'user') {
    throw new AppError('Invalid password reset token', 401);
  }

  const normalizedEmail = email.toLowerCase();
  if (decoded.email !== normalizedEmail) {
    throw new AppError('Invalid password reset token', 401);
  }

  const user = await User.findOne({ _id: decoded.id, email: normalizedEmail, phone: decoded.phone }).select('+passwordHash');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  ensureActiveUser(user);
  user.passwordHash = newPassword;
  await user.save();

  return { changed: true };
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
  if (!card?.isActive) return null;

  return {
    id: `card-${card._id}`,
    title: 'بطاقتك مفعلة',
    text: `كود البطاقة: ${card.cardCode}. الرابط جاهز للمشاركة.`,
    status: 'success',
    createdAt: card.activatedAt || card.createdAt || new Date(),
  };
};

const buildUserNotificationPayload = async (currentUser) => {
  const user = await getUserWithNotificationState(currentUser);
  const [orders, receipts, card, orderUnreadCount, receiptUnreadCount, latestUnreadOrder, latestUnreadReceipt, latestCard] = await Promise.all([
    CardOrder.find({ userId: user._id }).populate('cardPlanId').sort({ createdAt: -1 }).limit(5),
    PaymentReceipt.find({ userId: user._id }).populate('paymentMethodId').sort({ createdAt: -1 }).limit(5),
    Card.findOne({ userId: user._id }).sort({ activatedAt: -1, createdAt: -1 }),
    CardOrder.countDocuments({ userId: user._id, ...(user.notificationSeenAt?.orders ? { updatedAt: { $gt: user.notificationSeenAt.orders } } : {}) }),
    PaymentReceipt.countDocuments({ userId: user._id, ...(user.notificationSeenAt?.notifications ? { createdAt: { $gt: user.notificationSeenAt.notifications } } : {}) }),
    CardOrder.findOne({ userId: user._id, ...(user.notificationSeenAt?.notifications ? { updatedAt: { $gt: user.notificationSeenAt.notifications } } : {}) })
      .populate('cardPlanId')
      .sort({ updatedAt: -1, createdAt: -1 }),
    PaymentReceipt.findOne({ userId: user._id, ...(user.notificationSeenAt?.notifications ? { createdAt: { $gt: user.notificationSeenAt.notifications } } : {}) })
      .populate('paymentMethodId')
      .sort({ createdAt: -1 }),
    Card.findOne({ userId: user._id, isActive: true, ...(user.notificationSeenAt?.notifications ? { activatedAt: { $gt: user.notificationSeenAt.notifications } } : {}) })
      .sort({ activatedAt: -1, createdAt: -1 }),
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
    latestCard?.activatedAt || latestCard?.createdAt || null,
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
      notifications: orderUnreadCount + receiptUnreadCount + (latestCard ? 1 : 0),
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
  if (payload.aboutText !== undefined) personalProfile.aboutText = payload.aboutText || '';
  if (payload.birthDate !== undefined) personalProfile.birthDate = payload.birthDate || null;
  await personalProfile.save();

  if (payload.categoryId) {
    await getCategoryIfExists(payload.categoryId);
  }

  const businessProfile = (await BusinessProfile.findOne({ userId: user._id })) || new BusinessProfile({ userId: user._id });
  if (payload.businessName !== undefined) businessProfile.businessName = payload.businessName || '';
  if (payload.businessDescription !== undefined) businessProfile.businessDescription = payload.businessDescription || '';
  if (payload.address !== undefined) businessProfile.address = payload.address || '';
  if (payload.categoryId !== undefined) businessProfile.categoryId = payload.categoryId || null;
  if (payload.promoBoxText !== undefined) businessProfile.promoBoxText = payload.promoBoxText || '';

  if (files?.logo?.[0]) {
    const uploadedLogo = await optimizeAndUpload(files.logo[0].path, 'linestart/business-logos');
    if (businessProfile.logoPublicId) {
      await removeFromCloudinary(businessProfile.logoPublicId);
    }
    businessProfile.logo = uploadedLogo.secureUrl;
    businessProfile.logoPublicId = uploadedLogo.publicId;
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

const createProduct = async (currentUser, payload, files) => {
  const user = await User.findById(currentUser._id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  ensureProUser(user);
  if (payload.categoryId) {
    await getCategoryIfExists(payload.categoryId);
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

  if (files?.productImage?.[0]) {
    const uploaded = await optimizeAndUpload(files.productImage[0].path, 'linestart/products');
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

  if (files?.productImage?.[0]) {
    const uploaded = await optimizeAndUpload(files.productImage[0].path, 'linestart/products');
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
    throw new AppError('This profile is not publicly available right now', 403);
  }

  const data = await buildProfileResponse(user);
  if (data.products?.length) {
    data.products = data.products.filter((product) => product.isVisible);
  }

  return data;
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
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