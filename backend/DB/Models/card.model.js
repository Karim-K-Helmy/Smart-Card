const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    cardOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CardOrder',
      required: true,
      unique: true,
    },
    cardCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    qrCodeImage: {
      type: String,
      default: '',
    },
    qrCodeImagePublicId: {
      type: String,
      default: '',
    },
    qrCodeValue: {
      type: String,
      default: '',
    },
    shortLink: {
      type: String,
      default: '',
      unique: true,
      sparse: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    activatedAt: {
      type: Date,
      default: null,
    },
    suspendedAt: {
      type: Date,
      default: null,
    },
    lastStatusChangedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: false }
);

module.exports = mongoose.model('Card', cardSchema);
