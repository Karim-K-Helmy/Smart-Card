const mongoose = require('mongoose');

const cardOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    cardPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CardPlan',
      required: true,
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'waiting_payment', 'under_review', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CardOrder', cardOrderSchema);
