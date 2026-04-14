const express = require('express');
const Joi = require('joi');
const validate = require('../../middleware/validation');
const { auth, allowTo } = require('../../middleware/auth');
const { asyncHandler } = require('../../utils/errorhandling');
const { uploadSingle } = require('../../services/MulterLocally');
const controller = require('./admin.controller');
const {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  userStatusSchema,
  userUpdateSchema,
  adminProfileUpdateSchema,
  createAdminSchema,
  updateAdminSchema,
} = require('./admin.validation');

const router = express.Router();

const toggleCardSchema = Joi.object({
  body: Joi.object({
    isActive: Joi.boolean().required(),
  }).required(),
  params: Joi.object({
    cardId: Joi.string().length(24).hex().required(),
  }).required(),
  query: Joi.object({}),
});

const deleteEntitySchema = Joi.object({
  body: Joi.object({}),
  params: Joi.object({
    userId: Joi.string().length(24).hex(),
    adminId: Joi.string().length(24).hex(),
  }).required(),
  query: Joi.object({}),
});

const notificationTypeSchema = Joi.object({
  body: Joi.object({}),
  params: Joi.object({
    type: Joi.string().valid('messages', 'orders', 'users', 'payments').required(),
  }).required(),
  query: Joi.object({}),
});

router.post('/login', validate(loginSchema), asyncHandler(controller.login));
router.post('/forgot-password', validate(forgotPasswordSchema), asyncHandler(controller.forgotPassword));
router.post('/reset-password', validate(resetPasswordSchema), asyncHandler(controller.resetPassword));
router.get('/dashboard', auth, allowTo('admin', 'super_admin'), asyncHandler(controller.dashboard));
router.get('/notifications/summary', auth, allowTo('admin', 'super_admin'), asyncHandler(controller.notificationSummary));
router.get('/notifications/:type/count', auth, allowTo('admin', 'super_admin'), validate(notificationTypeSchema), asyncHandler(controller.getNotificationCount));
router.patch('/notifications/:type/read', auth, allowTo('admin', 'super_admin'), validate(notificationTypeSchema), asyncHandler(controller.markNotificationAsRead));
router.get('/me', auth, allowTo('admin', 'super_admin'), asyncHandler(controller.getMe));
router.post('/me/request-otp', auth, allowTo('admin', 'super_admin'), asyncHandler(controller.requestProfileOtp));
router.put('/me', auth, allowTo('admin', 'super_admin'), uploadSingle('avatar'), validate(adminProfileUpdateSchema), asyncHandler(controller.updateMe));
router.get('/admins', auth, allowTo('admin', 'super_admin'), asyncHandler(controller.listAdmins));
router.post('/admins', auth, allowTo('admin', 'super_admin'), validate(createAdminSchema), asyncHandler(controller.createAdmin));
router.put('/admins/:adminId', auth, allowTo('admin', 'super_admin'), validate(updateAdminSchema), asyncHandler(controller.updateAdmin));
router.delete('/admins/:adminId', auth, allowTo('admin', 'super_admin'), validate(deleteEntitySchema), asyncHandler(controller.deleteAdmin));
router.get('/users', auth, allowTo('admin', 'super_admin'), asyncHandler(controller.listUsers));
router.put('/users/:userId', auth, allowTo('admin', 'super_admin'), validate(userUpdateSchema), asyncHandler(controller.updateUser));
router.patch('/users/:userId/status', auth, allowTo('admin', 'super_admin'), validate(userStatusSchema), asyncHandler(controller.updateUserStatus));
router.delete('/users/:userId', auth, allowTo('admin', 'super_admin'), validate(deleteEntitySchema), asyncHandler(controller.deleteUser));
router.get('/orders', auth, allowTo('admin', 'super_admin'), asyncHandler(controller.listOrders));
router.get('/cards', auth, allowTo('admin', 'super_admin'), asyncHandler(controller.listCards));
router.patch('/cards/:cardId/status', auth, allowTo('admin', 'super_admin'), validate(toggleCardSchema), asyncHandler(controller.toggleCardStatus));
router.get('/actions', auth, allowTo('admin', 'super_admin'), asyncHandler(controller.listActions));

module.exports = router;
