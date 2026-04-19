const Message = require('../../../DB/Models/message.model');
const { AppError } = require('../../utils/errorhandling');
const sendEmail = require('../../services/sendEmail');
const { emitAdminNotification } = require('../../services/realtime.service');

const createMessage = async (payload) => {
  const message = await Message.create(payload);

  if (process.env.ADMIN_EMAIL) {
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `New contact message: ${payload.subject}`,
      text: `${payload.name} (${payload.email}) sent a message:\n\n${payload.message}`,
      html: `
        <h2>New contact message</h2>
        <p><strong>Name:</strong> ${payload.name}</p>
        <p><strong>Email:</strong> ${payload.email}</p>
        <p><strong>Phone:</strong> ${payload.phone || '-'}</p>
        <p><strong>Subject:</strong> ${payload.subject}</p>
        <p><strong>Message:</strong><br/>${payload.message}</p>
      `,
    }).catch(() => null);
  }

  emitAdminNotification('messages', { key: 'messages', entityId: String(message._id) });
  return message;
};

const listMessages = async ({ page = 1, limit = 10, status, search }) => {
  const parsedPage = Number(page) || 1;
  const parsedLimit = Math.min(Number(limit) || 10, 100);
  const skip = (parsedPage - 1) * parsedLimit;

  const filter = {};
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { subject: { $regex: search, $options: 'i' } },
      { message: { $regex: search, $options: 'i' } },
    ];
  }

  const [data, total] = await Promise.all([
    Message.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parsedLimit),
    Message.countDocuments(filter),
  ]);

  return {
    page: parsedPage,
    limit: parsedLimit,
    total,
    pages: Math.ceil(total / parsedLimit),
    data,
  };
};

const updateMessageStatus = async (messageId, status) => {
  const message = await Message.findById(messageId);
  if (!message) {
    throw new AppError('Message not found', 404);
  }
  message.status = status;
  if (status === 'read') {
    message.repliedAt = message.repliedAt || new Date();
  }
  await message.save();
  return message;
};

const deleteMessage = async (messageId) => {
  const message = await Message.findById(messageId);
  if (!message) {
    throw new AppError('Message not found', 404);
  }

  await message.deleteOne();
  return { deleted: true };
};

const replyMessage = async (admin, messageId, payload) => {
  const message = await Message.findById(messageId);
  if (!message) {
    throw new AppError('Message not found', 404);
  }

  const subject = payload.subject || `رد بخصوص: ${message.subject}`;
  const replyText = payload.replyText;

  await sendEmail({
    to: message.email,
    subject,
    text: replyText,
    html: `<div style="font-family:Tahoma,Arial,sans-serif;line-height:1.8"><p>${replyText.replace(/\n/g, '<br/>')}</p></div>`,
  });

  message.status = 'read';
  message.repliedAt = new Date();
  message.repliedByAdminId = admin?._id || null;
  message.lastReplyText = replyText;
  await message.save();

  return message;
};

module.exports = {
  createMessage,
  listMessages,
  updateMessageStatus,
  deleteMessage,
  replyMessage,
};
