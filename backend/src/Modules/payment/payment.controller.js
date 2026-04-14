const paymentService = require('./payment.service');

const listPaymentMethods = async (req, res) => {
  const data = await paymentService.listPaymentMethods();
  res.status(200).json({ success: true, message: 'Payment methods fetched successfully', data });
};

const listAdminPaymentMethods = async (req, res) => {
  const data = await paymentService.listPaymentMethods({ includeInactive: true });
  res.status(200).json({ success: true, message: 'Admin payment methods fetched successfully', data });
};

const createMethod = async (req, res) => {
  const data = await paymentService.createMethod(req.body);
  res.status(201).json({ success: true, message: 'Payment method created successfully', data });
};

const updateMethod = async (req, res) => {
  const data = await paymentService.updateMethod(req.params.methodId, req.body);
  res.status(200).json({ success: true, message: 'Payment method updated successfully', data });
};

const deleteMethod = async (req, res) => {
  const data = await paymentService.deleteMethod(req.params.methodId);
  res.status(200).json({ success: true, message: 'Payment method deleted successfully', data });
};

const createReceipt = async (req, res) => {
  const data = await paymentService.createReceipt(req.user, req.body, req.file);
  res.status(201).json({ success: true, message: 'Payment receipt uploaded successfully', data });
};

const getMyReceipts = async (req, res) => {
  const data = await paymentService.getMyReceipts(req.user);
  res.status(200).json({ success: true, message: 'Receipts fetched successfully', data });
};

const listAllReceipts = async (req, res) => {
  const data = await paymentService.listAllReceipts(req.query);
  res.status(200).json({ success: true, message: 'Admin receipts fetched successfully', data });
};

const reviewReceipt = async (req, res) => {
  const data = await paymentService.reviewReceipt(req.admin, req.params.receiptId, req.body);
  res.status(200).json({ success: true, message: 'Receipt reviewed successfully', data });
};

module.exports = {
  listPaymentMethods,
  listAdminPaymentMethods,
  createMethod,
  updateMethod,
  deleteMethod,
  createReceipt,
  getMyReceipts,
  listAllReceipts,
  reviewReceipt,
};
