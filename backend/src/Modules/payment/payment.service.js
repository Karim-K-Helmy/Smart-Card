const PaymentMethod = require('../../../DB/Models/paymentMethod.model');
const PaymentReceipt = require('../../../DB/Models/paymentReceipt.model');
const CardOrder = require('../../../DB/Models/cardOrder.model');
const CardPlan = require('../../../DB/Models/cardPlan.model');
const Card = require('../../../DB/Models/card.model');
const User = require('../../../DB/Models/user.model');
const { AppError } = require('../../utils/errorhandling');
const { optimizeAndUpload } = require('../../services/MulterLocally');
const { generateCardCode, generateQrAssets } = require('../../services/qr.service');
const logAdminAction = require('../../services/admin-log.service');

const listPaymentMethods = async ({ includeInactive = false } = {}) => {
  const filter = includeInactive ? {} : { isActive: true };
  return PaymentMethod.find(filter).sort({ isActive: -1, methodName: 1 });
};

const createMethod = async (payload) => PaymentMethod.create(payload);

const updateMethod = async (methodId, payload) => {
  const method = await PaymentMethod.findById(methodId);
  if (!method) {
    throw new AppError('Payment method not found', 404);
  }
  Object.assign(method, payload);
  await method.save();
  return method;
};

const deleteMethod = async (methodId) => {
  const method = await PaymentMethod.findById(methodId);
  if (!method) {
    throw new AppError('Payment method not found', 404);
  }
  await method.deleteOne();
  return { deleted: true };
};

const createReceipt = async (user, payload, file) => {
  if (!file) {
    throw new AppError('Receipt image is required', 400);
  }

  const [order, method] = await Promise.all([
    CardOrder.findOne({ _id: payload.cardOrderId, userId: user._id }).populate('cardPlanId'),
    PaymentMethod.findById(payload.paymentMethodId),
  ]);

  if (!order) {
    throw new AppError('Card order not found', 404);
  }

  if (!method || !method.isActive) {
    throw new AppError('Payment method not found or inactive', 404);
  }

  if (!['pending', 'waiting_payment', 'rejected'].includes(order.orderStatus)) {
    throw new AppError('This order is not available for a new receipt upload', 409);
  }

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

  return receipt;
};

const getMyReceipts = async (user) =>
  PaymentReceipt.find({ userId: user._id })
    .populate('paymentMethodId')
    .populate({ path: 'cardOrderId', populate: { path: 'cardPlanId' } })
    .sort({ createdAt: -1 });

const listAllReceipts = async ({ page = 1, limit = 10, reviewStatus }) => {
  const parsedPage = Number(page) || 1;
  const parsedLimit = Math.min(Number(limit) || 10, 100);
  const skip = (parsedPage - 1) * parsedLimit;
  const filter = {};
  if (reviewStatus) filter.reviewStatus = reviewStatus;

  const [data, total] = await Promise.all([
    PaymentReceipt.find(filter)
      .populate('userId')
      .populate('paymentMethodId')
      .populate({ path: 'cardOrderId', populate: { path: 'cardPlanId' } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit),
    PaymentReceipt.countDocuments(filter),
  ]);

  return {
    page: parsedPage,
    limit: parsedLimit,
    total,
    pages: Math.ceil(total / parsedLimit),
    data,
  };
};

const createCardForOrder = async (order, user) => {
  const existingCard = await Card.findOne({ cardOrderId: order._id });
  const plan = await CardPlan.findById(order.cardPlanId);

  if (!plan) {
    throw new AppError('Card plan not found', 404);
  }

  user.currentPlan = plan.planCode;
  await user.save();

  if (existingCard) {
    existingCard.isActive = true;
    existingCard.activatedAt = new Date();
    existingCard.expiresAt = new Date(Date.now() + Number(plan.durationDays || 30) * 24 * 60 * 60 * 1000);
    await existingCard.save();
    return existingCard;
  }

  const cardCode = generateCardCode();
  const qrAssets = await generateQrAssets({ slug: user.profileSlug, cardCode });
  return Card.create({
    userId: user._id,
    cardOrderId: order._id,
    cardCode,
    qrCodeImage: qrAssets.qrCodeImage,
    qrCodeImagePublicId: qrAssets.qrCodeImagePublicId,
    qrCodeValue: qrAssets.qrCodeValue,
    shortLink: qrAssets.shortLink,
    isActive: true,
    activatedAt: new Date(),
    expiresAt: new Date(Date.now() + Number(plan.durationDays || 30) * 24 * 60 * 60 * 1000),
  });
};

const reviewReceipt = async (admin, receiptId, payload) => {
  const receipt = await PaymentReceipt.findById(receiptId);
  if (!receipt) {
    throw new AppError('Payment receipt not found', 404);
  }

  if (receipt.reviewStatus !== 'pending') {
    throw new AppError('This receipt was already reviewed', 409);
  }

  const [order, user] = await Promise.all([
    CardOrder.findById(receipt.cardOrderId),
    User.findById(receipt.userId),
  ]);

  if (!order || !user) {
    throw new AppError('Related user or order not found', 404);
  }

  receipt.reviewStatus = payload.reviewStatus;
  receipt.reviewNote = payload.reviewNote || '';
  receipt.reviewedByAdminId = admin._id;
  await receipt.save();

  if (payload.reviewStatus === 'approved') {
    order.orderStatus = 'approved';
    await order.save();
    const card = await createCardForOrder(order, user);

    await logAdminAction({
      adminId: admin._id,
      userId: user._id,
      actionType: 'approve_payment',
      targetTable: 'PaymentReceipts',
      targetId: receipt._id,
      notes: payload.reviewNote || 'Payment approved',
    });

    return { receipt, order, card };
  }

  order.orderStatus = 'rejected';
  await order.save();

  await logAdminAction({
    adminId: admin._id,
    userId: user._id,
    actionType: 'reject_payment',
    targetTable: 'PaymentReceipts',
    targetId: receipt._id,
    notes: payload.reviewNote || 'Payment rejected',
  });

  return { receipt, order };
};

module.exports = {
  listPaymentMethods,
  createMethod,
  updateMethod,
  deleteMethod,
  createReceipt,
  getMyReceipts,
  listAllReceipts,
  reviewReceipt,
};
