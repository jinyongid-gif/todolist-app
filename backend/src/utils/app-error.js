class AppError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { AppError };
