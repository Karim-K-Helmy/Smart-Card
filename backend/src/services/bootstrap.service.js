const CardPlan = require('../../DB/Models/cardPlan.model');
const PaymentMethod = require('../../DB/Models/paymentMethod.model');
const User = require('../../DB/Models/user.model');
const PersonalProfile = require('../../DB/Models/personalProfile.model');
const BusinessProfile = require('../../DB/Models/businessProfile.model');
const SocialLink = require('../../DB/Models/socialLink.model');
const Product = require('../../DB/Models/product.model');

const defaultPlans = [
  {
    planCode: 'STAR',
    name: 'Star',
    description: 'بطاقة ذكية احترافية للأفراد مع صفحة تعريفية وروابط أساسية.',
    features: ['بروفايل شخصي احترافي', 'روابط تواصل أساسية', 'QR ورابط مباشر', 'صلاحية لمدة 30 يوم'],
    price: 199,
    durationDays: 30,
    isActive: true,
  },
  {
    planCode: 'PRO',
    name: 'Pro',
    description: 'الخطة الكاملة لعرض البيانات التجارية والمنتجات داخل صفحة واحدة.',
    features: ['كل مميزات Star', 'بروفايل تجاري متكامل', 'عرض المنتجات والأعمال', 'أولوية في التفعيل والدعم'],
    price: 399,
    durationDays: 30,
    isActive: true,
  },
];

const defaultPaymentMethods = [
  {
    methodName: 'Vodafone Cash',
    phoneNumber: '01063877700',
    accountName: 'LineStart',
    instructions: 'حوّل المبلغ المطلوب على الرقم ثم ارفع صورة الإيصال داخل نفس الطلب.',
    isActive: true,
  },
];

const bootstrapPlans = async () => {
  const existing = await CardPlan.find({}).select('planCode');
  const existingCodes = new Set(existing.map((item) => item.planCode));

  for (const plan of defaultPlans) {
    if (!existingCodes.has(plan.planCode)) {
      await CardPlan.create(plan);
    }
  }

  await CardPlan.deleteMany({ planCode: { $nin: defaultPlans.map((item) => item.planCode) } });
};

const bootstrapPaymentMethods = async () => {
  const count = await PaymentMethod.countDocuments();
  if (!count) {
    await PaymentMethod.insertMany(defaultPaymentMethods);
  }
};

const cleanupUnverifiedAccounts = async () => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const staleUsers = await User.find({
    emailVerified: false,
    status: 'pending',
    createdAt: { $lt: sevenDaysAgo },
  }).select('_id');

  if (!staleUsers.length) {
    return { deletedUsers: 0 };
  }

  const ids = staleUsers.map((item) => item._id);
  await Promise.all([
    PersonalProfile.deleteMany({ userId: { $in: ids } }),
    BusinessProfile.deleteMany({ userId: { $in: ids } }),
    SocialLink.deleteMany({ userId: { $in: ids } }),
    Product.deleteMany({ userId: { $in: ids } }),
    User.deleteMany({ _id: { $in: ids } }),
  ]);

  return { deletedUsers: ids.length };
};

const bootstrapAppData = async () => {
  await bootstrapPlans();
  await bootstrapPaymentMethods();
  await cleanupUnverifiedAccounts();
};

module.exports = {
  bootstrapAppData,
  cleanupUnverifiedAccounts,
};
