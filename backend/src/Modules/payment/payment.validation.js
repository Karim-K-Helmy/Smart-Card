const Joi = require('joi');

const mongoId = Joi.string().length(24).hex();

const createMethodSchema = Joi.object({
  body: Joi.object({
    methodName: Joi.string().min(2).max(100).required(),
    phoneNumber: Joi.string().allow('', null),
    accountName: Joi.string().allow('', null),
    instructions: Joi.string().allow('', null),
    isActive: Joi.boolean().default(true),
  }).required(),
  params: Joi.object({}),
  query: Joi.object({}),
});

const updateMethodSchema = Joi.object({
  body: Joi.object({
    methodName: Joi.string().min(2).max(100),
    phoneNumber: Joi.string().allow('', null),
    accountName: Joi.string().allow('', null),
    instructions: Joi.string().allow('', null),
    isActive: Joi.boolean(),
  }).required(),
  params: Joi.object({
    methodId: mongoId.required(),
  }).required(),
  query: Joi.object({}),
});

const createReceiptSchema = Joi.object({
  body: Joi.object({
    cardOrderId: mongoId.required(),
    paymentMethodId: mongoId.required(),
    senderName: Joi.string().min(2).max(100).required(),
    senderPhone: Joi.string().min(6).max(20).required(),
    transferredAmount: Joi.number().min(0).required(),
    transferDate: Joi.date().iso().allow('', null),
    note: Joi.string().allow('', null),
  }).required(),
  params: Joi.object({}),
  query: Joi.object({}),
});

const reviewReceiptSchema = Joi.object({
  body: Joi.object({
    reviewStatus: Joi.string().valid('approved', 'rejected').required(),
    reviewNote: Joi.string().allow('', null),
  }).required(),
  params: Joi.object({
    receiptId: mongoId.required(),
  }).required(),
  query: Joi.object({}),
});

module.exports = {
  createMethodSchema,
  updateMethodSchema,
  createReceiptSchema,
  reviewReceiptSchema,
};
