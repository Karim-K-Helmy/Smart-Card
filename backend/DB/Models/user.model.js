const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    activationEmailSentAt: {
      type: Date,
      default: null,
    },
    activationEmailSentCount: {
      type: Number,
      default: 0,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    whatsappNumber: {
      type: String,
      trim: true,
      default: '',
    },
    passwordHash: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    currentPlan: {
      type: String,
      enum: ['NONE', 'STAR', 'PRO'],
      default: 'NONE',
      index: true,
    },
    profileSlug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    profileImage: {
      type: String,
      default: '',
    },
    profileImagePublicId: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'frozen', 'deleted'],
      default: 'pending',
      index: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    notificationSeenAt: {
      orders: {
        type: Date,
        default: null,
      },
      notifications: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function preSave(next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }

  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
