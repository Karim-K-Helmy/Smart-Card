const mongoose = require('mongoose');

const verificationCodeSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    accountModel: {
      type: String,
      enum: ['User', 'Admin'],
      default: 'User',
      index: true,
    },
    purpose: {
      type: String,
      enum: [
        'activate_account',
        'login',
        'reset_password',
        'update_profile',
        'change_password',
        'admin_login',
        'admin_update_profile',
        'admin_change_password',
        'admin_reset_password',
      ],
      required: true,
      index: true,
    },
    codeHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    consumedAt: {
      type: Date,
      default: null,
      index: true,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

verificationCodeSchema.index({ email: 1, purpose: 1, accountModel: 1, createdAt: -1 });

module.exports = mongoose.model('VerificationCode', verificationCodeSchema);
