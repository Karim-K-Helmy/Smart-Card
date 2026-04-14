const mongoose = require('mongoose');

const personalProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    jobTitle: {
      type: String,
      trim: true,
      default: '',
      maxlength: 100,
    },
    aboutText: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000,
    },
    birthDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('PersonalProfile', personalProfileSchema);
