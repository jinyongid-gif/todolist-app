require('dotenv').config();

const isTest = process.env.NODE_ENV === 'test';

const config = {
  db: {
    url: (isTest ? process.env.TEST_DATABASE_URL : null) || process.env.DATABASE_URL || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiry: process.env.JWT_EXPIRY || '1h',
  },
  server: {
    port: parseInt(process.env.SERVER_PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
};

function validateEnv() {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`필수 환경변수 누락: ${missing.join(', ')}`);
    process.exit(1);
  }
}

module.exports = { config, validateEnv };
