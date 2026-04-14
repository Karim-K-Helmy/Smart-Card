const Category = require('../../../DB/Models/category.model');
const Product = require('../../../DB/Models/product.model');
const { AppError } = require('../../utils/errorhandling');

const listCategories = async () => {
  const categories = await Category.find().sort({ name: 1 });
  return Promise.all(
    categories.map(async (category) => ({
      ...category.toObject(),
      productsCount: await Product.countDocuments({ categoryId: category._id }),
    }))
  );
};

const createCategory = async (payload) => {
  const exists = await Category.findOne({ slug: payload.slug });
  if (exists) {
    throw new AppError('Category slug already exists', 409);
  }
  return Category.create(payload);
};

const updateCategory = async (categoryId, payload) => {
  const category = await Category.findById(categoryId);
  if (!category) {
    throw new AppError('Category not found', 404);
  }

  if (payload.slug && payload.slug !== category.slug) {
    const slugExists = await Category.findOne({ slug: payload.slug, _id: { $ne: categoryId } });
    if (slugExists) {
      throw new AppError('Category slug already exists', 409);
    }
  }

  Object.assign(category, payload);
  await category.save();
  return category;
};

const deleteCategory = async (categoryId) => {
  const category = await Category.findById(categoryId);
  if (!category) {
    throw new AppError('Category not found', 404);
  }
  await category.deleteOne();
  return { deleted: true };
};

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
