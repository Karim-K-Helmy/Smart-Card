const mongoose = require('mongoose');

const cardPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    planCode: {
      type: String,
      enum: ['STAR', 'PRO'],
      required: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000,
    },
    features: {
      type: [String],
      default: [],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    durationDays: {
      type: Number,
      required: true,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('CardPlan', cardPlanSchema);