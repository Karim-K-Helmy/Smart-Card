const CardPlan = require('../../../DB/Models/cardPlan.model');
const CardOrder = require('../../../DB/Models/cardOrder.model');
const Card = require('../../../DB/Models/card.model');
const User = require('../../../DB/Models/user.model');
const PaymentMethod = require('../../../DB/Models/paymentMethod.model');
const PaymentReceipt = require('../../../DB/Models/paymentReceipt.model');
const { AppError } = require('../../utils/errorhandling');
const { optimizeAndUpload } = require('../../services/MulterLocally');
const { buildMergedBackImage, buildCardPdf } = require('../../services/card-media.service');
const { buildProfileLink } = require('../../services/qr.service');

const normalizeFeatures = (features) => {
  if (Array.isArray(features)) {
    return features;
  }
  if (typeof features === 'string') {
    try {
      const parsed = JSON.parse(features);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      return features.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
};

const listPlans = async () =>
  CardPlan.find({ isActive: true, planCode: { $in: ['STAR', 'PRO'] } }).sort({ price: 1 });

const createPlan = async (payload) =>
  CardPlan.create({
    ...payload,
    features: normalizeFeatures(payload.features),
  });

const updatePlan = async (planId, payload) => {
  const plan = await CardPlan.findById(planId);
  if (!plan) {
    throw new AppError('Card plan not found', 404);
  }

  Object.assign(plan, payload);
  if (payload.features !== undefined) {
    plan.features = normalizeFeatures(payload.features);
  }
  await plan.save();
  return plan;
};

const deletePlan = async (planId) => {
  const plan = await CardPlan.findById(planId);
  if (!plan) {
    throw new AppError('Card plan not found', 404);
  }
  if (['STAR', 'PRO'].includes(plan.planCode)) {
    throw new AppError('لا يمكن حذف باقتي Star و Pro من النظام', 400);
  }
  await plan.deleteOne();
  return { deleted: true };
};

const ensurePlanExists = async (cardPlanId) => {
  const plan = await CardPlan.findById(cardPlanId);
  if (!plan || !plan.isActive) {
    throw new AppError('Card plan not found or inactive', 404);
  }
  return plan;
};

const ensureNoOpenOrder = async (userId) => {
  const openOrder = await CardOrder.findOne({
    userId,
    orderStatus: { $in: ['pending', 'waiting_payment', 'under_review'] },
  });

  if (openOrder) {
    throw new AppError('You already have an open card order', 409);
  }
};

const createOrder = async (user, payload) => {
  const plan = await ensurePlanExists(payload.cardPlanId);
  await ensureNoOpenOrder(user._id);

  return CardOrder.create({
    userId: user._id,
    cardPlanId: plan._id,
    orderStatus: 'waiting_payment',
    totalAmount: plan.price,
    notes: payload.notes || '',
  });
};

const checkout = async (currentUser, payload, file) => {
  if (!file) {
    throw new AppError('Receipt image is required', 400);
  }

  const [user, plan, method] = await Promise.all([
    User.findById(currentUser._id),
    ensurePlanExists(payload.cardPlanId),
    PaymentMethod.findById(payload.paymentMethodId),
  ]);

  if (!user) {
    throw new AppError('User not found', 404);
  }
  if (!method || !method.isActive) {
    throw new AppError('Payment method not found or inactive', 404);
  }

  await ensureNoOpenOrder(user._id);

  const order = await CardOrder.create({
    userId: user._id,
    cardPlanId: plan._id,
    orderStatus: 'waiting_payment',
    totalAmount: plan.price,
    notes: payload.notes || '',
  });

  const uploaded = await optimizeAndUpload(file.path, 'linestart/payment-receipts');

  const receipt = await PaymentReceipt.create({
    cardOrderId: order._id,
    userId: user._id,
    paymentMethodId: method._id,
    senderName: payload.senderName,
    senderPhone: payload.senderPhone,
    transferredAmount: payload.transferredAmount,
    transferDate: payload.transferDate || null,
    receiptImage: uploaded.secureUrl,
    receiptImagePublicId: uploaded.publicId,
    note: payload.note || '',
    reviewStatus: 'pending',
  });

  order.orderStatus = 'under_review';
  await order.save();

  return {
    order: await CardOrder.findById(order._id).populate('cardPlanId'),
    receipt: await PaymentReceipt.findById(receipt._id).populate('paymentMethodId'),
  };
};

const getMyOrders = async (user) =>
  CardOrder.find({ userId: user._id }).populate('cardPlanId').sort({ createdAt: -1 });

const getMyCard = async (user) =>
  Card.findOne({ userId: user._id }).populate({
    path: 'cardOrderId',
    populate: { path: 'cardPlanId' },
  });


const resolveCardTargetUrl = (card, user) => {
  if (card?.shortLink) {
    return card.shortLink;
  }

  if (card?.qrCodeValue && /^https?:\/\//i.test(card.qrCodeValue)) {
    return String(card.qrCodeValue).split('?')[0];
  }

  if (user?.profileSlug) {
    return buildProfileLink(user.profileSlug);
  }

  throw new AppError('تعذر إنشاء رابط الصفحة العامة لهذه البطاقة', 400);
};

const getRenderableCard = async (user) => {
  const card = await getMyCard(user);

  if (!card) {
    throw new AppError('لم يتم العثور على بطاقة مفعلة لهذا المستخدم', 404);
  }

  const planCode = card?.cardOrderId?.cardPlanId?.planCode;
  if (!planCode) {
    throw new AppError('تعذر تحديد نوع الباقة الخاصة بالبطاقة', 400);
  }

  return {
    card,
    planCode,
    qrValue: resolveCardTargetUrl(card, user),
  };
};

const getMyCardPreview = async (user) => {
  const { qrValue } = await getRenderableCard(user);
  return buildMergedBackImage({ qrValue });
};

const getMyCardPdf = async (user) => {
  const { planCode, qrValue } = await getRenderableCard(user);
  return buildCardPdf({ planCode, qrValue });
};

const getCardByCode = async (cardCode) => {
  const card = await Card.findOne({ cardCode }).populate('userId').populate({
    path: 'cardOrderId',
    populate: { path: 'cardPlanId' },
  });

  if (!card) {
    throw new AppError('Card not found', 404);
  }

  const user = await User.findById(card.userId._id);
  return {
    card,
    user,
  };
};

module.exports = {
  listPlans,
  createPlan,
  updatePlan,
  deletePlan,
  createOrder,
  checkout,
  getMyOrders,
  getMyCard,
  getMyCardPreview,
  getMyCardPdf,
  getCardByCode,
};
