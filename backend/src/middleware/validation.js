const { AppError } = require('../utils/errorhandling');

const validate = (schema) => (req, res, next) => {
  const payload = {
    body: req.body,
    params: req.params,
    query: req.query,
  };

  const { error, value } = schema.validate(payload, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return next(new AppError(error.details.map((item) => item.message).join(', '), 400));
  }

  req.body = value.body || {};
  req.params = value.params || {};
  req.query = value.query || {};
  return next();
};

module.exports = validate;
