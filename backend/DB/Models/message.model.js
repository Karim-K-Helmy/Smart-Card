const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
      maxlength: 20,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    status: {
      type: String,
      enum: ['new', 'read', 'archived'],
      default: 'new',
      index: true,
    },
    lastReplyText: {
      type: String,
      trim: true,
      default: '',
      maxlength: 5000,
    },
    repliedByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    repliedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
