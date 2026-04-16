const mongoose = require('mongoose');

const businessLocationImageSchema = new mongoose.Schema(
  {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
  },
  { _id: false }
);

const businessLocationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: '',
      maxlength: 100,
    },
    description: {
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
    googleMapsLink: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1000,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
      maxlength: 30,
    },
    whatsappNumber: {
      type: String,
      trim: true,
      default: '',
      maxlength: 30,
    },
    facebookLink: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1000,
    },
    email: {
      type: String,
      trim: true,
      default: '',
      maxlength: 255,
    },
    images: {
      type: [businessLocationImageSchema],
      default: [],
      validate: {
        validator: (value) => Array.isArray(value) && value.length <= 5,
        message: 'Each business location can only contain up to 5 images',
      },
    },
    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

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
    googleMapsLink: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1000,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
      maxlength: 30,
    },
    whatsappNumber: {
      type: String,
      trim: true,
      default: '',
      maxlength: 30,
    },
    facebookLink: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1000,
    },
    email: {
      type: String,
      trim: true,
      default: '',
      maxlength: 255,
    },
    businessLocations: {
      type: [businessLocationSchema],
      default: [],
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('BusinessProfile', businessProfileSchema);
