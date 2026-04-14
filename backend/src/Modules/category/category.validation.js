const Joi = require('joi');

const categoryBody = {
  name: Joi.string().min(2).max(100).required(),
  slug: Joi.string().min(2).max(100).required(),
  icon: Joi.string().allow('', null),
};

const createCategorySchema = Joi.object({
  body: Joi.object(categoryBody).required(),
  params: Joi.object({}),
  query: Joi.object({}),
});

const updateCategorySchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).max(100),
    slug: Joi.string().min(2).max(100),
    icon: Joi.string().allow('', null),
  }).required(),
  params: Joi.object({
    categoryId: Joi.string().length(24).hex().required(),
  }).required(),
  query: Joi.object({}),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
};
