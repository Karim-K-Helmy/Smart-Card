const Joi = require('joi');

const mongoId = Joi.string().length(24).hex();

const createPlanSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    planCode: Joi.string().valid('STAR', 'PRO').required(),
    description: Joi.string().allow('', null),
    features: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).required(),
    price: Joi.number().min(0).required(),
    durationDays: Joi.number().integer().min(0).required(),
    isActive: Joi.boolean().default(true),
  }).required(),
  params: Joi.object({}),
  query: Joi.object({}),
});

const updatePlanSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).max(100),
    description: Joi.string().allow('', null),
    features: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()),
    price: Joi.number().min(0),
    durationDays: Joi.number().integer().min(0),
    isActive: Joi.boolean(),
  }).required(),
  params: Joi.object({
    planId: mongoId.required(),
  }).required(),
  query: Joi.object({}),
});

const createOrderSchema = Joi.object({
  body: Joi.object({
    cardPlanId: mongoId.required(),
    notes: Joi.string().allow('', null),
  }).required(),
  params: Joi.object({}),
  query: Joi.object({}),
});

const checkoutSchema = Joi.object({
  body: Joi.object({
    cardPlanId: mongoId.required(),
    paymentMethodId: mongoId.required(),
    senderName: Joi.string().min(2).max(100).required(),
    senderPhone: Joi.string().min(6).max(20).required(),
    transferredAmount: Joi.number().min(0).required(),
    transferDate: Joi.date().iso().allow('', null),
    note: Joi.string().allow('', null),
    notes: Joi.string().allow('', null),
  }).required(),
  params: Joi.object({}),
  query: Joi.object({}),
});

const cardCodeSchema = Joi.object({
  body: Joi.object({}),
  params: Joi.object({
    cardCode: Joi.string().required(),
  }).required(),
  query: Joi.object({}),
});

module.exports = {
  createPlanSchema,
  updatePlanSchema,
  createOrderSchema,
  checkoutSchema,
  cardCodeSchema,
};
