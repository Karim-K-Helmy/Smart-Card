const Joi = require('joi');

const mongoId = Joi.string().length(24).hex();

const loginSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }).required(),
  params: Joi.object({}),
  query: Joi.object({}),
});

const forgotPasswordSchema = Joi.object({
  body: Joi.object({}).required(),
  params: Joi.object({}),
  query: Joi.object({}),
});

const resetPasswordSchema = Joi.object({
  body: Joi.object({
    code: Joi.string().length(6).required(),
    newPassword: Joi.string().min(6).max(100).required(),
  }).required(),
  params: Joi.object({}),
  query: Joi.object({}),
});

const userStatusSchema = Joi.object({
  body: Joi.object({
    status: Joi.string().valid('active', 'pending', 'frozen', 'deleted').required(),
    notes: Joi.string().allow('', null),
  }).required(),
  params: Joi.object({
    userId: mongoId.required(),
  }).required(),
  query: Joi.object({}),
});

const userUpdateSchema = Joi.object({
  body: Joi.object({
    fullName: Joi.string().min(2).max(100),
    email: Joi.string().email(),
    phone: Joi.string().min(6).max(20),
    whatsappNumber: Joi.string().allow('', null),
    currentPlan: Joi.string().valid('NONE', 'STAR', 'PRO'),
    status: Joi.string().valid('active', 'pending', 'frozen', 'deleted'),
  }).required(),
  params: Joi.object({
    userId: mongoId.required(),
  }).required(),
  query: Joi.object({}),
});

const adminProfileUpdateSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).max(100),
    otpCode: Joi.string().length(6).allow('', null),
    currentPassword: Joi.string().allow('', null),
    newPassword: Joi.string().min(6).max(100).allow('', null),
  }).required(),
  params: Joi.object({}),
  query: Joi.object({}),
});

const createAdminSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(100).required(),
    role: Joi.string().max(50).default('admin'),
  }).required(),
  params: Joi.object({}),
  query: Joi.object({}),
});

const updateAdminSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).max(100),
    email: Joi.string().email(),
    password: Joi.string().min(6).max(100).allow('', null),
    role: Joi.string().max(50),
  }).required(),
  params: Joi.object({
    adminId: mongoId.required(),
  }).required(),
  query: Joi.object({}),
});

module.exports = {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  userStatusSchema,
  userUpdateSchema,
  adminProfileUpdateSchema,
  createAdminSchema,
  updateAdminSchema,
};
