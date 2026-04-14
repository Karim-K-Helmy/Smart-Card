const messageService = require('./message.service');

const createMessage = async (req, res) => {
  const data = await messageService.createMessage(req.body);
  res.status(201).json({ success: true, message: 'Message sent successfully', data });
};

const listMessages = async (req, res) => {
  const data = await messageService.listMessages(req.query);
  res.status(200).json({ success: true, message: 'Messages fetched successfully', data });
};

const updateMessageStatus = async (req, res) => {
  const data = await messageService.updateMessageStatus(req.params.messageId, req.body.status);
  res.status(200).json({ success: true, message: 'Message status updated successfully', data });
};

const replyMessage = async (req, res) => {
  const data = await messageService.replyMessage(req.admin, req.params.messageId, req.body);
  res.status(200).json({ success: true, message: 'تم إرسال الرد إلى العميل بنجاح', data });
};

module.exports = {
  createMessage,
  listMessages,
  updateMessageStatus,
  replyMessage,
};
