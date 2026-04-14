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
const { signUserToken } = require('../../services/token.service');
const { optimizeAndUpload, removeFromCloudinary } = require('../../services/MulterLocally');
const { issueCode, consumeCode } = require('../../services/verification.service');

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

const ensureActiveVerifiedUser = (user) => {
  if (!user) {
    throw new AppError('User not found', 404);
  }
  if (!user.emailVerified || user.status === 'pending') {
    throw new AppError('يرجى تفعيل الحساب أولاً من خلال البريد الإلكتروني', 403);
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
    status: 'pending',
    emailVerified: false,
  });

  await Promise.all([
    PersonalProfile.create({ userId: user._id }),
    BusinessProfile.create({ userId: user._id }),
  ]);

  const activation = await issueCode({
    email: user.email,
    purpose: 'activate_account',
    accountModel: 'User',
    title: 'تفعيل حسابك في LineStart',
    greeting: `مرحبًا ${user.fullName}،`,
    intro: 'شكرًا لتسجيلك معنا. استخدم رمز التفعيل التالي لإكمال إنشاء الحساب وتفعيل الوصول إلى لوحة المستخدم.',
    helpText: 'رسالة التفعيل تُرسل مرة واحدة فقط عند إنشاء الحساب لأول مرة، لذلك احتفظ بهذا الرمز حتى تنتهي عملية التفعيل.',
  });

  user.activationEmailSentAt = new Date();
  user.activationEmailSentCount = 1;
  await user.save();

  return {
    user: sanitizeUser(user),
    activation,
  };
};

const verifyActivation = async (email, code) => {
  await consumeCode({ email, code, purpose: 'activate_account', accountModel: 'User' });
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new AppError('User not found', 404);
  }

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

const resendActivation = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new AppError('User not found', 404);
  }
  if (user.emailVerified) {
    throw new AppError('هذا الحساب مفعل بالفعل', 409);
  }

  throw new AppError('رسالة التفعيل تُرسل مرة واحدة فقط عند إنشاء الحساب لأول مرة، ولا يمكن إعادة إرسالها.', 403);
};

const login = async ({ emailOrPhone, password }) => {
  const user = await User.findOne({
    $or: [{ email: emailOrPhone.toLowerCase() }, { phone: emailOrPhone }],
  }).select('+passwordHash');

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  ensureActiveVerifiedUser(user);

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

const forgotPassword = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  return issueCode({
    email: user.email,
    purpose: 'reset_password',
    accountModel: 'User',
    title: 'إعادة تعيين كلمة المرور',
    greeting: `مرحبًا ${user.fullName}،`,
    intro: 'وصلنا طلب لإعادة تعيين كلمة المرور الخاصة بحسابك. استخدم رمز التحقق التالي لإكمال العملية.',
    helpText: 'إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل الرسالة ولن يتم تغيير أي شيء على حسابك.',
  });
};

const resetPassword = async (email, code, newPassword) => {
  await consumeCode({ email, code, purpose: 'reset_password', accountModel: 'User' });
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.passwordHash = newPassword;
  await user.save();

  return { changed: true };
};

const requestSensitiveOtp = async (currentUser, purpose) => {
  const user = await User.findById(currentUser._id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  return issueCode({
    email: user.email,
    purpose,
    accountModel: 'User',
    title: purpose === 'change_password' ? 'تأكيد تغيير كلمة المرور' : 'تأكيد تعديل بيانات الحساب',
    greeting: `مرحبًا ${user.fullName}،`,
    intro:
      purpose === 'change_password'
        ? 'استخدم رمز التحقق التالي لإتمام تغيير كلمة المرور بأمان.'
        : 'استخدم رمز التحقق التالي لتأكيد تعديل بيانات حسابك.',
    helpText:
      purpose === 'change_password'
        ? 'تم إرسال هذا الرمز لحماية حسابك قبل اعتماد كلمة المرور الجديدة.'
        : 'لن يتم حفظ التعديلات الحساسة على الحساب قبل إدخال هذا الرمز بشكل صحيح.',
  });
};

const getMyProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return buildProfileResponse(user);
};

const getMyNotifications = async (currentUser) => {
  const [orders, receipts, card] = await Promise.all([
    CardOrder.find({ userId: currentUser._id }).populate('cardPlanId').sort({ createdAt: -1 }).limit(5),
    PaymentReceipt.find({ userId: currentUser._id }).populate('paymentMethodId').sort({ createdAt: -1 }).limit(5),
    Card.findOne({ userId: currentUser._id }).sort({ activatedAt: -1 }),
  ]);

  const notices = [];
  const latestOrder = orders[0];
  const latestReceipt = receipts[0];

  if (latestOrder) {
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

    notices.push({
      id: `order-${latestOrder._id}`,
      createdAt: latestOrder.createdAt,
      ...(orderMap[latestOrder.orderStatus] || {
        title: 'تحديث على طلبك',
        text: 'هناك تحديث جديد على طلب البطاقة.',
        status: 'info',
      }),
    });
  }

  if (latestReceipt) {
    const receiptMap = {
      pending: 'تم استلام صورة الإيصال وهي بانتظار المراجعة.',
      approved: 'تمت الموافقة على إيصال الدفع بنجاح.',
      rejected: latestReceipt.reviewNote || 'تم رفض إيصال الدفع الأخير.',
    };
    notices.push({
      id: `receipt-${latestReceipt._id}`,
      title: 'حالة إيصال الدفع',
      text: receiptMap[latestReceipt.reviewStatus] || 'هناك تحديث على إيصال الدفع.',
      status: latestReceipt.reviewStatus === 'approved' ? 'success' : latestReceipt.reviewStatus === 'rejected' ? 'danger' : 'warning',
      createdAt: latestReceipt.createdAt,
    });
  }

  if (card?.isActive) {
    notices.push({
      id: `card-${card._id}`,
      title: 'بطاقتك مفعلة',
      text: `كود البطاقة: ${card.cardCode}. الرابط جاهز للمشاركة.`,
      status: 'success',
      createdAt: card.activatedAt || new Date(),
    });
  }

  if (!notices.length) {
    notices.push({
      id: 'empty-notice',
      title: 'لا توجد إشعارات حالياً',
      text: 'بعد إنشاء الطلب أو مراجعة الدفع ستظهر الإشعارات هنا.',
      status: 'info',
      createdAt: new Date(),
    });
  }

  return {
    counts: {
      orders: orders.filter((item) => ['pending', 'waiting_payment', 'under_review'].includes(item.orderStatus)).length,
      notifications: notices.length,
    },
    notices,
  };
};

const updateProfile = async (currentUser, payload, files) => {
  const user = await User.findById(currentUser._id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const socialLinks = normalizeSocialLinks(payload.socialLinks);
  const normalizedEmail = payload.email ? payload.email.toLowerCase() : undefined;

  const accountFieldsChanged = [
    payload.fullName !== undefined && payload.fullName !== user.fullName,
    normalizedEmail !== undefined && normalizedEmail !== user.email,
    payload.phone !== undefined && payload.phone !== user.phone,
    payload.whatsappNumber !== undefined && String(payload.whatsappNumber || '') !== String(user.whatsappNumber || ''),
  ].some(Boolean);

  if (accountFieldsChanged) {
    if (!payload.otpCode) {
      throw new AppError('يجب إدخال كود التأكيد المرسل إلى بريدك الإلكتروني قبل حفظ البيانات', 400);
    }
    await consumeCode({
      email: user.email,
      code: payload.otpCode,
      purpose: 'update_profile',
      accountModel: 'User',
    });
  }

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

const changePassword = async (currentUser, currentPassword, newPassword, otpCode) => {
  const user = await User.findById(currentUser._id).select('+passwordHash');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const matched = await user.comparePassword(currentPassword);
  if (!matched) {
    throw new AppError('Current password is incorrect', 400);
  }

  await consumeCode({
    email: user.email,
    code: otpCode,
    purpose: 'change_password',
    accountModel: 'User',
  });

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
  verifyActivation,
  resendActivation,
  login,
  forgotPassword,
  resetPassword,
  requestSensitiveOtp,
  getMyProfile,
  getMyNotifications,
  updateProfile,
  changePassword,
  createProduct,
  getMyProducts,
  updateProduct,
  deleteProduct,
  getPublicProfile,
};