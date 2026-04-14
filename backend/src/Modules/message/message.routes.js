const express = require('express');
const validate = require('../../middleware/validation');
const { auth, allowTo } = require('../../middleware/auth');
const { asyncHandler } = require('../../utils/errorhandling');
const controller = require('./message.controller');
const {
  createMessageSchema,
  updateMessageStatusSchema,
  deleteMessageSchema,
  replyMessageSchema,
} = require('./message.validation');

const router = express.Router();

router.post('/', validate(createMessageSchema), asyncHandler(controller.createMessage));
router.get('/admin/all', auth, allowTo('admin', 'super_admin'), asyncHandler(controller.listMessages));
router.patch('/admin/:messageId/status', auth, allowTo('admin', 'super_admin'), validate(updateMessageStatusSchema), asyncHandler(controller.updateMessageStatus));
router.delete('/admin/:messageId', auth, allowTo('admin', 'super_admin'), validate(deleteMessageSchema), asyncHandler(controller.deleteMessage));
router.post('/admin/:messageId/reply', auth, allowTo('admin', 'super_admin'), validate(replyMessageSchema), asyncHandler(controller.replyMessage));

module.exports = router;
