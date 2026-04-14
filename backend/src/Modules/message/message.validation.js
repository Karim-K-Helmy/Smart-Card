const Joi = require('joi');

const mongoId = Joi.string().length(24).hex();

const createMessageSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().allow('', null),
    subject: Joi.string().min(2).max(150).required(),
    message: Joi.string().min(5).max(5000).required(),
  }).required(),
  params: Joi.object({}),
  query: Joi.object({}),
});

const updateMessageStatusSchema = Joi.object({
  body: Joi.object({
    status: Joi.string().valid('new', 'read', 'archived').required(),
  }).required(),
  params: Joi.object({
    messageId: mongoId.required(),
  }).required(),
  query: Joi.object({}),
});

const deleteMessageSchema = Joi.object({
  body: Joi.object({}),
  params: Joi.object({
    messageId: mongoId.required(),
  }).required(),
  query: Joi.object({}),
});

const replyMessageSchema = Joi.object({
  body: Joi.object({
    replyText: Joi.string().min(2).max(5000).required(),
    subject: Joi.string().max(180).allow('', null),
  }).required(),
  params: Joi.object({
    messageId: mongoId.required(),
  }).required(),
  query: Joi.object({}),
});

module.exports = {
  createMessageSchema,
  updateMessageStatusSchema,
  deleteMessageSchema,
  replyMessageSchema,
};
