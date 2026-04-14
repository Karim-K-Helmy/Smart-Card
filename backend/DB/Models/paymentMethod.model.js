const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema(
  {
    methodName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: '',
      maxlength: 20,
    },
    accountName: {
      type: String,
      trim: true,
      default: '',
      maxlength: 100,
    },
    instructions: {
      type: String,
      trim: true,
      default: '',
      maxlength: 3000,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: false }
);

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);
