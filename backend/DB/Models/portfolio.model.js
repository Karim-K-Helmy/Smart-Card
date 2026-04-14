const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100, // اسم العمل
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000, // تم التعديل: يسمح بأكثر من سطر وشرح وافي براحة العميل
    },
    link: {
      type: String,
      trim: true,
      default: '', // رابط للعمل لو العميل حابب يضيفه
    },
    image: {
      type: String,
      default: '', // صورة العمل
    },
    imagePublicId: {
      type: String,
      default: '',
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0, 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Portfolio', portfolioSchema);