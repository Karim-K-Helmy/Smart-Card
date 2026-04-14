const mongoose = require('mongoose');

const businessProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    businessName: {
      type: String,
      trim: true,
      default: '',
      maxlength: 100,
    },
    logo: {
      type: String,
      default: '',
    },
    logoPublicId: {
      type: String,
      default: '',
    },
    businessDescription: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000,
    },
    address: {
      type: String,
      trim: true,
      default: '',
      maxlength: 255,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    promoBoxText: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1000,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('BusinessProfile', businessProfileSchema);
