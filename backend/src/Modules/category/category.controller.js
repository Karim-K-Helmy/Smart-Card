const categoryService = require('./category.service');

const listCategories = async (req, res) => {
  const data = await categoryService.listCategories();
  res.status(200).json({ success: true, message: 'Categories fetched successfully', data });
};

const createCategory = async (req, res) => {
  const data = await categoryService.createCategory(req.body);
  res.status(201).json({ success: true, message: 'Category created successfully', data });
};

const updateCategory = async (req, res) => {
  const data = await categoryService.updateCategory(req.params.categoryId, req.body);
  res.status(200).json({ success: true, message: 'Category updated successfully', data });
};

const deleteCategory = async (req, res) => {
  const data = await categoryService.deleteCategory(req.params.categoryId);
  res.status(200).json({ success: true, message: 'Category deleted successfully', data });
};

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
