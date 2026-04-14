class AppError extends Error {
  constructor(message, statusCode = 500, status = 'error') {
    super(message);
    this.statusCode = statusCode;
    this.status = status;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};

const normalizeKnownErrors = (error) => {
  if (error?.code === 11000) {
    const field = Object.keys(error.keyPattern || error.keyValue || {})[0] || 'value';
    return new AppError(`القيمة المدخلة في حقل ${field} مستخدمة بالفعل`, 409);
  }

  if (error?.name === 'ValidationError') {
    const firstMessage = Object.values(error.errors || {})[0]?.message || 'Validation failed';
    return new AppError(firstMessage, 400);
  }

  if (error?.name === 'MulterError') {
    return new AppError(error.message || 'Upload failed', 400);
  }

  return error;
};

const globalErrorHandler = (incomingError, req, res, next) => {
  const error = normalizeKnownErrors(incomingError);
  const statusCode = error.statusCode || 500;
  const status = error.status || 'error';

  const response = {
    success: false,
    status,
    message: error.message || 'Internal server error',
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = {
  AppError,
  asyncHandler,
  notFoundHandler,
  globalErrorHandler,
};
