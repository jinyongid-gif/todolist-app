const { findByEmail, createUser } = require('./auth.repository');
const { hashPassword, comparePassword } = require('../../utils/password.utils');
const { signToken } = require('../../utils/jwt.utils');
const { AppError } = require('../../utils/app-error');
const logger = require('../../utils/logger');

async function register({ email, password, name }) {
  logger.debug('회원가입 시도', { email });

  const existing = await findByEmail(email);
  if (existing) {
    logger.warn('회원가입 실패: 중복 이메일', { email });
    throw new AppError('이미 사용 중인 이메일입니다', 409);
  }

  const hashed = await hashPassword(password);
  const user = await createUser({ email, password: hashed, name });
  logger.info('회원가입 완료', { userId: user.id, email });
  return user;
}

async function login({ email, password }) {
  logger.debug('로그인 시도', { email });

  const user = await findByEmail(email);
  if (!user) {
    logger.warn('로그인 실패: 존재하지 않는 이메일', { email });
    throw new AppError('이메일 또는 비밀번호가 올바르지 않습니다', 401);
  }

  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    logger.warn('로그인 실패: 비밀번호 불일치', { userId: user.id, email });
    throw new AppError('이메일 또는 비밀번호가 올바르지 않습니다', 401);
  }

  const token = signToken({ user_id: user.id, email: user.email });
  logger.info('로그인 성공', { userId: user.id, email });
  return {
    access_token: token,
    token_type: 'Bearer',
    user: { id: user.id, email: user.email, name: user.name },
  };
}

module.exports = { register, login };
