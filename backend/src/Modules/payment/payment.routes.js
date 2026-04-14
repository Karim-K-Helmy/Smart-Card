const express = require('express');
const validate = require('../../middleware/validation');
const { auth, allowTo } = require('../../middleware/auth');
const { asyncHandler } = require('../../utils/errorhandling');
const { uploadSingle } = require('../../services/MulterLocally');
const controller = require('./payment.controller');
const { createMethodSchema, updateMethodSchema, createReceiptSchema, reviewReceiptSchema } = require('./payment.validation');

const router = express.Router();

router.get('/methods', asyncHandler(controller.listPaymentMethods));
router.get('/methods/admin/all', auth, allowTo('admin', 'super_admin'), asyncHandler(controller.listAdminPaymentMethods));
router.post('/methods', auth, allowTo('admin', 'super_admin'), validate(createMethodSchema), asyncHandler(controller.createMethod));
router.put('/methods/:methodId', auth, allowTo('admin', 'super_admin'), validate(updateMethodSchema), asyncHandler(controller.updateMethod));
router.delete('/methods/:methodId', auth, allowTo('admin', 'super_admin'), asyncHandler(controller.deleteMethod));
router.post('/receipts', auth, uploadSingle('receiptImage'), validate(createReceiptSchema), asyncHandler(controller.createReceipt));
router.get('/receipts/me', auth, asyncHandler(controller.getMyReceipts));
router.get('/receipts/admin/all', auth, allowTo('admin', 'super_admin'), asyncHandler(controller.listAllReceipts));
router.patch('/receipts/:receiptId/review', auth, allowTo('admin', 'super_admin'), validate(reviewReceiptSchema), asyncHandler(controller.reviewReceipt));

module.exports = router;
