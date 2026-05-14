jest.mock('dotenv', () => ({ config: jest.fn() }));
jest.mock('../../../../src/config/env', () => ({
  config: { jwt: { secret: 'test-secret', expiry: '1h' } },
}));
jest.mock('../../../../src/config/db', () => ({ query: jest.fn(), end: jest.fn() }));
jest.mock('../../../../src/modules/auth/auth.repository', () => ({
  findByEmail: jest.fn(),
  createUser: jest.fn(),
}));
jest.mock('../../../../src/utils/password.utils');
jest.mock('../../../../src/utils/jwt.utils');

const { register, login } = require('../../../../src/modules/auth/auth.service');
const { findByEmail, createUser } = require('../../../../src/modules/auth/auth.repository');
const { hashPassword, comparePassword } = require('../../../../src/utils/password.utils');
const { signToken } = require('../../../../src/utils/jwt.utils');
const { AppError } = require('../../../../src/utils/app-error');

describe('auth.service - register', () => {
  beforeEach(() => jest.clearAllMocks());

  it('신규 이메일이면 유저를 생성하고 반환한다', async () => {
    findByEmail.mockResolvedValue(null);
    hashPassword.mockResolvedValue('hashed-pw');
    createUser.mockResolvedValue({ id: 1, email: 'a@b.com', name: '홍길동', created_at: new Date() });

    const result = await register({ email: 'a@b.com', password: '1234', name: '홍길동' });

    expect(createUser).toHaveBeenCalledWith({ email: 'a@b.com', password: 'hashed-pw', name: '홍길동' });
    expect(result.email).toBe('a@b.com');
    expect(result.password).toBeUndefined();
  });

  it('이미 존재하는 이메일이면 AppError(409)를 throw한다', async () => {
    findByEmail.mockResolvedValue({ id: 1, email: 'a@b.com' });

    await expect(register({ email: 'a@b.com', password: '1234', name: '홍길동' }))
      .rejects.toBeInstanceOf(AppError);

    await expect(register({ email: 'a@b.com', password: '1234', name: '홍길동' }))
      .rejects.toMatchObject({ status: 409 });
  });

  it('비밀번호는 bcrypt로 해시하여 저장한다', async () => {
    findByEmail.mockResolvedValue(null);
    hashPassword.mockResolvedValue('$2b$10$hashed');
    createUser.mockResolvedValue({ id: 1, email: 'a@b.com', name: '홍길동' });

    await register({ email: 'a@b.com', password: 'plaintext', name: '홍길동' });

    expect(hashPassword).toHaveBeenCalledWith('plaintext');
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({ password: '$2b$10$hashed' })
    );
  });

  it('createUser의 반환값(비밀번호 미포함)을 그대로 반환한다', async () => {
    findByEmail.mockResolvedValue(null);
    hashPassword.mockResolvedValue('hashed');
    const mockUser = { id: 2, email: 'b@c.com', name: '김철수', created_at: '2026-01-01' };
    createUser.mockResolvedValue(mockUser);

    const result = await register({ email: 'b@c.com', password: 'pw', name: '김철수' });
    expect(result).toEqual(mockUser);
  });
});

describe('auth.service - login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('올바른 자격증명이면 access_token과 user를 반환한다', async () => {
    findByEmail.mockResolvedValue({ id: 1, email: 'a@b.com', password: 'hashed', name: '홍길동' });
    comparePassword.mockResolvedValue(true);
    signToken.mockReturnValue('jwt.token.here');

    const result = await login({ email: 'a@b.com', password: '1234' });

    expect(result.access_token).toBe('jwt.token.here');
    expect(result.token_type).toBe('Bearer');
    expect(result.user).toEqual({ id: 1, email: 'a@b.com', name: '홍길동' });
  });

  it('존재하지 않는 이메일이면 AppError(401)를 throw한다', async () => {
    findByEmail.mockResolvedValue(null);

    await expect(login({ email: 'none@b.com', password: '1234' }))
      .rejects.toBeInstanceOf(AppError);
    await expect(login({ email: 'none@b.com', password: '1234' }))
      .rejects.toMatchObject({ status: 401 });
  });

  it('비밀번호 불일치 시 AppError(401)를 throw한다', async () => {
    findByEmail.mockResolvedValue({ id: 1, email: 'a@b.com', password: 'hashed', name: '홍' });
    comparePassword.mockResolvedValue(false);

    await expect(login({ email: 'a@b.com', password: 'wrong' }))
      .rejects.toMatchObject({ status: 401 });
  });

  it('이메일 미존재와 비밀번호 불일치의 에러 메시지가 동일하다 (이메일 존재 여부 노출 금지)', async () => {
    findByEmail.mockResolvedValue(null);
    let err1;
    try { await login({ email: 'no@b.com', password: 'pw' }); } catch (e) { err1 = e; }

    findByEmail.mockResolvedValue({ id: 1, email: 'a@b.com', password: 'h', name: '홍' });
    comparePassword.mockResolvedValue(false);
    let err2;
    try { await login({ email: 'a@b.com', password: 'wrong' }); } catch (e) { err2 = e; }

    expect(err1.message).toBe(err2.message);
  });

  it('JWT payload에 user_id와 email이 포함된다', async () => {
    findByEmail.mockResolvedValue({ id: 5, email: 'x@y.com', password: 'h', name: '이름' });
    comparePassword.mockResolvedValue(true);
    signToken.mockReturnValue('token');

    await login({ email: 'x@y.com', password: 'pw' });

    expect(signToken).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 5, email: 'x@y.com' })
    );
  });

  it('응답 user 객체에 password가 포함되지 않는다', async () => {
    findByEmail.mockResolvedValue({ id: 1, email: 'a@b.com', password: 'hashed', name: '홍' });
    comparePassword.mockResolvedValue(true);
    signToken.mockReturnValue('token');

    const result = await login({ email: 'a@b.com', password: 'pw' });
    expect(result.user.password).toBeUndefined();
  });
});
