const { Schema, model } = require('mongoose');

const emailQuotaStatSchema = new Schema(
  {
    dayKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    count: {
      type: Number,
      default: 0,
      min: 0,
    },
    smtpCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    previewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model('EmailQuotaStat', emailQuotaStatSchema);
