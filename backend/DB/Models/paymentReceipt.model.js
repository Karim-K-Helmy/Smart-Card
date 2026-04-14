const mongoose = require('mongoose');

const paymentReceiptSchema = new mongoose.Schema(
  {
    cardOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CardOrder',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    paymentMethodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentMethod',
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    senderPhone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    transferredAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    transferDate: {
      type: Date,
      default: null,
    },
    receiptImage: {
      type: String,
      required: true,
    },
    receiptImagePublicId: {
      type: String,
      default: '',
    },
    note: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000,
    },
    reviewStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    reviewedByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    reviewNote: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('PaymentReceipt', paymentReceiptSchema);
