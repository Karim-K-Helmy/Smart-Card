const mongoose = require('mongoose');

const adminActionSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    actionType: {
      type: String,
      enum: ['create', 'freeze', 'unfreeze', 'edit', 'delete', 'approve_payment', 'reject_payment'],
      required: true,
    },
    targetTable: {
      type: String,
      trim: true,
      default: '',
      maxlength: 50,
    },
    targetId: {
      type: String,
      trim: true,
      default: '',
      maxlength: 100,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('AdminAction', adminActionSchema);
