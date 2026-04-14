const express = require('express');
const validate = require('../../middleware/validation');
const { auth, allowTo } = require('../../middleware/auth');
const { asyncHandler } = require('../../utils/errorhandling');
const { uploadSingle } = require('../../services/MulterLocally');
const controller = require('./card.controller');
const { createPlanSchema, updatePlanSchema, createOrderSchema, checkoutSchema, cardCodeSchema } = require('./card.validation');

const router = express.Router();

router.get('/plans', asyncHandler(controller.listPlans));
router.post('/plans', auth, allowTo('admin', 'super_admin'), validate(createPlanSchema), asyncHandler(controller.createPlan));
router.put('/plans/:planId', auth, allowTo('admin', 'super_admin'), validate(updatePlanSchema), asyncHandler(controller.updatePlan));
router.delete('/plans/:planId', auth, allowTo('admin', 'super_admin'), asyncHandler(controller.deletePlan));
router.post('/orders', auth, validate(createOrderSchema), asyncHandler(controller.createOrder));
router.post('/checkout', auth, uploadSingle('receiptImage'), validate(checkoutSchema), asyncHandler(controller.checkout));
router.get('/orders/me', auth, asyncHandler(controller.getMyOrders));
router.get('/my-card', auth, asyncHandler(controller.getMyCard));
router.get('/code/:cardCode', validate(cardCodeSchema), asyncHandler(controller.getCardByCode));

module.exports = router;
