const express = require('express');
const validate = require('../../middleware/validation');
const { auth, allowTo } = require('../../middleware/auth');
const { asyncHandler } = require('../../utils/errorhandling');
const controller = require('./category.controller');
const { createCategorySchema, updateCategorySchema } = require('./category.validation');

const router = express.Router();

router.get('/', asyncHandler(controller.listCategories));
router.post('/', auth, allowTo('admin', 'super_admin'), validate(createCategorySchema), asyncHandler(controller.createCategory));
router.put('/:categoryId', auth, allowTo('admin', 'super_admin'), validate(updateCategorySchema), asyncHandler(controller.updateCategory));
router.delete('/:categoryId', auth, allowTo('admin', 'super_admin'), asyncHandler(controller.deleteCategory));

module.exports = router;
