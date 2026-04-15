const Joi = require('joi');

const mongoId = Joi.string().length(24).hex();

const registerSchema = Joi.object({
  body: Joi.object({
    fullName: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().min(6).max(20).required(),
    whatsappNumber: Joi.string().allow('', null),
    password: Joi.string().min(6).max(100).required(),
  }).required(),
  params: Joi.object({}),
  query: Joi.object({}),
});

const loginSchema = Joi.object({
  body: Joi.object({
    emailOrPhone: Joi.string().required(),
    password: Joi.string().required(),
  }).required(),
  params: Joi.object({}),
  query: Joi.object({}),
});

const forgotPasswordSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    phone: Joi.string().min(6).max(20).required(),
  }).required(),
  params: Joi.object({}),
  query: Joi.object({}),
});

const resetPasswordSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    resetToken: Joi.string().required(),
    newPassword: Joi.string().min(6).max(100).required(),
  }).required(),
  params: Joi.object({}),
  query: Joi.object({}),
});

const updateProfileSchema = Joi.object({
  body: Joi.object({
    fullName: Joi.string().min(2).max(100),
    email: Joi.string().email(),
    phone: Joi.string().min(6).max(20),
    whatsappNumber: Joi.string().allow('', null),
    bio: Joi.string().max(2000).allow('', null),
    socialLinks: Joi.alternatives().try(
      Joi.array().items(
        Joi.object({
          platformName: Joi.string().required(),
          url: Joi.string().uri().required(),
          sortOrder: Joi.number().integer().min(0),
        })
      ),
      Joi.string()
    ),
    jobTitle: Joi.string().allow('', null),
    aboutText: Joi.string().allow('', null),
    birthDate: Joi.date().iso().allow('', null),
    businessName: Joi.string().allow('', null),
    businessDescription: Joi.string().allow('', null),
    address: Joi.string().allow('', null),
    categoryId: mongoId.allow('', null),
    promoBoxText: Joi.string().allow('', null),
  }).required(),
  params: Joi.object({}),
  query: Joi.object({}),
});

const changePasswordSchema = Joi.object({
  body: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).max(100).required(),
  }).required(),
  params: Joi.object({}),
  query: Joi.object({}),
});

const createProductSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(120).allow('', null),
    categoryId: mongoId.allow('', null),
    price: Joi.number().min(0).default(0),
    isVisible: Joi.boolean().default(true),
    sortOrder: Joi.number().integer().min(0).default(0),
  }).required(),
  params: Joi.object({}),
  query: Joi.object({}),
});

const updateProductSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).max(100),
    description: Joi.string().max(120).allow('', null),
    categoryId: mongoId.allow('', null),
    price: Joi.number().min(0),
    isVisible: Joi.boolean(),
    sortOrder: Joi.number().integer().min(0),
  }).required(),
  params: Joi.object({
    productId: mongoId.required(),
  }).required(),
  query: Joi.object({}),
});

const deleteProductSchema = Joi.object({
  body: Joi.object({}),
  params: Joi.object({
    productId: mongoId.required(),
  }).required(),
  query: Joi.object({}),
});

const publicProfileSchema = Joi.object({
  body: Joi.object({}),
  params: Joi.object({
    slug: Joi.string().required(),
  }).required(),
  query: Joi.object({}),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
  createProductSchema,
  updateProductSchema,
  deleteProductSchema,
  publicProfileSchema,
};
