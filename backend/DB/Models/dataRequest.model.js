const mongoose = require('mongoose');

const dataRequestSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: 4000,
    },
    status: {
      type: String,
      enum: ['pending', 'in_review', 'completed', 'rejected'],
      default: 'pending',
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

dataRequestSchema.index({ createdAt: -1, status: 1 });

module.exports = mongoose.model('DataRequest', dataRequestSchema);
