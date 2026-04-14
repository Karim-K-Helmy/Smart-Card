const mongoose = require('mongoose');

const socialLinkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    platformName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: false }
);

module.exports = mongoose.model('SocialLink', socialLinkSchema);
