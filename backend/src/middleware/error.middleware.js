const logger = require('../utils/logger');
const { AppError } = require('../utils/app-error');

function errorHandler(err, req, res, next) {
  const isAppError = err instanceof AppError;
  const status = isAppError ? err.status : 500;
  const isDev = process.env.NODE_ENV === 'development';

  logger.error({
    timestamp: new Date().toISOString(),
    userId: req.user?.id,
    endpoint: req.path,
    method: req.method,
    error: err.message,
    stack: isDev ? err.stack : undefined,
  });

  const body = {
    error: err.name || 'InternalServerError',
    message: isAppError ? err.message : '서버 오류가 발생했습니다',
  };

  if (isDev && !isAppError) {
    body.detail = err.message;
  }

  res.status(status).json(body);
}

module.exports = { errorHandler };
