const cardService = require('./card.service');

const listPlans = async (req, res) => {
  const data = await cardService.listPlans();
  res.status(200).json({ success: true, message: 'Card plans fetched successfully', data });
};

const createPlan = async (req, res) => {
  const data = await cardService.createPlan(req.body);
  res.status(201).json({ success: true, message: 'Card plan created successfully', data });
};

const updatePlan = async (req, res) => {
  const data = await cardService.updatePlan(req.params.planId, req.body);
  res.status(200).json({ success: true, message: 'Card plan updated successfully', data });
};

const deletePlan = async (req, res) => {
  const data = await cardService.deletePlan(req.params.planId);
  res.status(200).json({ success: true, message: 'Card plan deleted successfully', data });
};

const createOrder = async (req, res) => {
  const data = await cardService.createOrder(req.user, req.body);
  res.status(201).json({ success: true, message: 'Card order created successfully', data });
};

const checkout = async (req, res) => {
  const data = await cardService.checkout(req.user, req.body, req.file);
  res.status(201).json({ success: true, message: 'تم إرسال طلب البطاقة والإيصال بنجاح', data });
};

const getMyOrders = async (req, res) => {
  const data = await cardService.getMyOrders(req.user);
  res.status(200).json({ success: true, message: 'Orders fetched successfully', data });
};

const getMyCard = async (req, res) => {
  const data = await cardService.getMyCard(req.user);
  res.status(200).json({ success: true, message: 'Card fetched successfully', data });
};


const getMyCardPreview = async (req, res) => {
  const buffer = await cardService.getMyCardPreview(req.user);
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Content-Disposition', 'inline; filename="my-card-preview.png"');
  res.status(200).send(buffer);
};

const getMyCardPdf = async (req, res) => {
  const buffer = await cardService.getMyCardPdf(req.user);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="my-card.pdf"');
  res.status(200).send(buffer);
};

const getCardByCode = async (req, res) => {
  const data = await cardService.getCardByCode(req.params.cardCode);
  res.status(200).json({ success: true, message: 'Card fetched successfully', data });
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
