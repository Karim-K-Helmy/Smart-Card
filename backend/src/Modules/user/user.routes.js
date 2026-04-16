const express = require('express');
const Joi = require('joi');
const validate = require('../../middleware/validation');
const { auth } = require('../../middleware/auth');
const { asyncHandler } = require('../../utils/errorhandling');
const { uploadFields } = require('../../services/MulterLocally');
const controller = require('./user.controller');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
  createProductSchema,
  updateProductSchema,
  deleteProductSchema,
  publicProfileSchema,
  checkPhoneSchema,
  createDataRequestSchema,
} = require('./user.validation');

const router = express.Router();

const profileUploader = uploadFields([
  { name: 'profileImage', maxCount: 1 },
  ...Array.from({ length: 20 }, (_, index) => ({ name: `businessLocationImages_${index}`, maxCount: 5 })),
]);
const productUploader = uploadFields([{ name: 'productImage', maxCount: 1 }]);

const notificationTypeSchema = Joi.object({
  body: Joi.object({}),
  params: Joi.object({
    type: Joi.string().valid('orders', 'notifications').required(),
  }).required(),
  query: Joi.object({}),
});

router.post('/register', validate(registerSchema), asyncHandler(controller.register));
router.post('/login', validate(loginSchema), asyncHandler(controller.login));
router.post('/forgot-password', validate(forgotPasswordSchema), asyncHandler(controller.forgotPassword));
router.post('/reset-password', validate(resetPasswordSchema), asyncHandler(controller.resetPassword));
router.post('/check-phone', validate(checkPhoneSchema), asyncHandler(controller.checkPhoneExists));
router.post('/data-requests', validate(createDataRequestSchema), asyncHandler(controller.createDataRequest));
router.get('/profile', auth, asyncHandler(controller.getMyProfile));
router.get('/notifications', auth, asyncHandler(controller.getMyNotifications));
router.get('/notifications/:type/count', auth, validate(notificationTypeSchema), asyncHandler(controller.getMyNotificationCount));
router.patch('/notifications/:type/read', auth, validate(notificationTypeSchema), asyncHandler(controller.markMyNotificationAsRead));
router.put('/profile', auth, profileUploader, validate(updateProfileSchema), asyncHandler(controller.updateProfile));
router.patch('/change-password', auth, validate(changePasswordSchema), asyncHandler(controller.changePassword));
router.post('/products', auth, productUploader, validate(createProductSchema), asyncHandler(controller.createProduct));
router.get('/products', auth, asyncHandler(controller.getMyProducts));
router.put('/products/:productId', auth, productUploader, validate(updateProductSchema), asyncHandler(controller.updateProduct));
router.delete('/products/:productId', auth, validate(deleteProductSchema), asyncHandler(controller.deleteProduct));
router.get('/public/:slug', validate(publicProfileSchema), asyncHandler(controller.getPublicProfile));

module.exports = router;
