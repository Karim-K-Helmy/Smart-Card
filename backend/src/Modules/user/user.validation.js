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

const businessLocationSchema = Joi.object({
  name: Joi.string().allow('', null),
  description: Joi.string().allow('', null),
  address: Joi.string().allow('', null),
  googleMapsLink: Joi.string().allow('', null),
  phone: Joi.string().allow('', null),
  whatsappNumber: Joi.string().allow('', null),
  facebookLink: Joi.string().allow('', null),
  email: Joi.string().allow('', null),
  existingImages: Joi.array().items(Joi.string().allow('', null)).max(5),
  sortOrder: Joi.number(),
});

const socialLinkSchema = Joi.object({
  platformName: Joi.string().max(100).required(),
  url: Joi.string().allow('', null).required(),
  sortOrder: Joi.number(),
});

const updateProfileSchema = Joi.object({
  body: Joi.object({
    fullName: Joi.string().min(2).max(100),
    phone: Joi.string().min(6).max(20),
    whatsappNumber: Joi.string().allow('', null),
    bio: Joi.string().max(2000).allow('', null),
    jobTitle: Joi.string().allow('', null),
    aboutText: Joi.string().allow('', null),
    birthDate: Joi.date().allow('', null),
    currentPlan: Joi.string().valid('NONE', 'STAR', 'PRO'),
    personalProfile: Joi.object({
      jobTitle: Joi.string().allow('', null),
      companyName: Joi.string().allow('', null),
      shortBio: Joi.string().allow('', null),
      about: Joi.string().allow('', null),
      address: Joi.string().allow('', null),
      website: Joi.string().allow('', null),
    }),
    businessProfile: Joi.object({
      businessName: Joi.string().allow('', null),
      businessDescription: Joi.string().allow('', null),
      address: Joi.string().allow('', null),
      googleMapsLink: Joi.string().allow('', null),
      phone: Joi.string().allow('', null),
      whatsappNumber: Joi.string().allow('', null),
      facebookLink: Joi.string().allow('', null),
      email: Joi.string().allow('', null),
      businessLocations: Joi.alternatives().try(
        Joi.array().max(2).items(businessLocationSchema),
        Joi.string().allow('', null)
      ),
    }),
    businessLocations: Joi.alternatives().try(
      Joi.array().max(2).items(businessLocationSchema),
      Joi.string().allow('', null)
    ),
    socialLinks: Joi.alternatives().try(
      Joi.array().items(socialLinkSchema),
      Joi.string().allow('', null)
    ),
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
    name: Joi.string().min(2).max(200).required(),
    title: Joi.string().allow('', null),
    description: Joi.string().allow('', null),
    price: Joi.number().min(0).allow('', null),
    currency: Joi.string().max(20).allow('', null),
    ctaText: Joi.string().allow('', null),
    ctaUrl: Joi.string().allow('', null),
    sortOrder: Joi.number().allow('', null),
    categoryId: mongoId.allow('', null),
    isVisible: Joi.boolean(),
  }).required(),
  params: Joi.object({}),
  query: Joi.object({}),
});

const updateProductSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).max(200),
    title: Joi.string().allow('', null),
    description: Joi.string().allow('', null),
    price: Joi.number().min(0).allow('', null),
    currency: Joi.string().max(20).allow('', null),
    ctaText: Joi.string().allow('', null),
    ctaUrl: Joi.string().allow('', null),
    sortOrder: Joi.number().allow('', null),
    categoryId: mongoId.allow('', null),
    isVisible: Joi.boolean(),
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

const checkPhoneSchema = Joi.object({
  body: Joi.object({
    phone: Joi.string().min(6).max(20).required(),
  }).required(),
  params: Joi.object({}),
  query: Joi.object({}),
});

const createDataRequestSchema = Joi.object({
  body: Joi.object({
    phone: Joi.string().min(6).max(20).required(),
    notes: Joi.string().allow('', null),
  }).required(),
  params: Joi.object({}),
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
  checkPhoneSchema,
  createDataRequestSchema,
};
