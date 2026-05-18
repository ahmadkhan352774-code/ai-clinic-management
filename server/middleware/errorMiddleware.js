const handleDuplicateKey = (error) => {
  const field = Object.keys(error.keyValue || {})[0] || 'field';
  return {
    statusCode: 409,
    message: `${field} already exists`,
  };
};

const handleValidationError = (error) => ({
  statusCode: 400,
  message: Object.values(error.errors)
    .map((err) => err.message)
    .join(', '),
});

const handleJwtError = () => ({
  statusCode: 401,
  message: 'Invalid or expired token',
});

const notFound = (req, _res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (error, _req, res, _next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Server error';

  if (error.code === 11000) {
    ({ statusCode, message } = handleDuplicateKey(error));
  }

  if (error.name === 'ValidationError') {
    ({ statusCode, message } = handleValidationError(error));
  }

  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    ({ statusCode, message } = handleJwtError());
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
  });
};

module.exports = {
  errorHandler,
  notFound,
};
