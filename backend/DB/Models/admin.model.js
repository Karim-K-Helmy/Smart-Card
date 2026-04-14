const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
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
    avatarUrl: {
      type: String,
      default: '',
    },
    avatarPublicId: {
      type: String,
      default: '',
    },
    passwordHash: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      required: true,
      trim: true,
      default: 'admin',
      maxlength: 50,
    },
    notificationSeenAt: {
      messages: {
        type: Date,
        default: null,
      },
      orders: {
        type: Date,
        default: null,
      },
      users: {
        type: Date,
        default: null,
      },
      payments: {
        type: Date,
        default: null,
      },
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

adminSchema.pre('save', async function preSave(next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }

  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  return next();
});

adminSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('Admin', adminSchema);
