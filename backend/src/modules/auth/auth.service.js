const { findByEmail, createUser } = require('./auth.repository');
const { hashPassword, comparePassword } = require('../../utils/password.utils');
const { signToken } = require('../../utils/jwt.utils');
const { AppError } = require('../../utils/app-error');

async function register({ email, password, name }) {
  const existing = await findByEmail(email);
  if (existing) {
    throw new AppError('이미 사용 중인 이메일입니다', 409);
  }

  const hashed = await hashPassword(password);
  const user = await createUser({ email, password: hashed, name });
  return user;
}

async function login({ email, password }) {
  const user = await findByEmail(email);
  if (!user) {
    throw new AppError('이메일 또는 비밀번호가 올바르지 않습니다', 401);
  }

  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    throw new AppError('이메일 또는 비밀번호가 올바르지 않습니다', 401);
  }

  const token = signToken({ user_id: user.id, email: user.email });
  return {
    access_token: token,
    token_type: 'Bearer',
    user: { id: user.id, email: user.email, name: user.name },
  };
}

module.exports = { register, login };
