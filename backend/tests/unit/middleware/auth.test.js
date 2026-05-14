const jwt = require('jsonwebtoken');

const TEST_SECRET = 'test-secret-for-auth-middleware';

jest.mock('dotenv', () => ({ config: jest.fn() }));
jest.mock('../../../src/config/env', () => ({
  config: {
    jwt: { secret: TEST_SECRET, expiry: '1h' },
    db: { url: '' },
    server: { port: 3000, env: 'test' },
    cors: { origin: 'http://localhost:5173' },
  },
}));

const { authenticate } = require('../../../src/middleware/auth.middleware');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function makeToken(payload, expiresIn = '1h') {
  return jwt.sign(payload, TEST_SECRET, { expiresIn });
}

describe('authenticate 미들웨어', () => {
  describe('Authorization 헤더 없음', () => {
    it('헤더 자체가 없으면 401을 반환한다', () => {
      const req = { headers: {} };
      const res = mockRes();
      const next = jest.fn();

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('"Bearer " 접두사 없이 토큰만 있으면 401을 반환한다', () => {
      const token = makeToken({ user_id: 1, email: 'a@b.com' });
      const req = { headers: { authorization: token } };
      const res = mockRes();
      const next = jest.fn();

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('"Basic " 스킴은 401을 반환한다', () => {
      const req = { headers: { authorization: 'Basic dXNlcjpwYXNz' } };
      const res = mockRes();
      const next = jest.fn();

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('유효하지 않은 토큰', () => {
    it('잘못된 서명의 토큰은 401을 반환한다', () => {
      const badToken = jwt.sign({ user_id: 1, email: 'a@b.com' }, 'wrong-secret');
      const req = { headers: { authorization: `Bearer ${badToken}` } };
      const res = mockRes();
      const next = jest.fn();

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('만료된 토큰은 401을 반환한다', () => {
      const expiredToken = makeToken({ user_id: 1, email: 'a@b.com' }, '-1s');
      const req = { headers: { authorization: `Bearer ${expiredToken}` } };
      const res = mockRes();
      const next = jest.fn();

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('임의의 문자열 토큰은 401을 반환한다', () => {
      const req = { headers: { authorization: 'Bearer not.a.valid.token' } };
      const res = mockRes();
      const next = jest.fn();

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('유효한 토큰', () => {
    it('유효한 토큰이면 req.user에 { id, email }을 설정하고 next()를 호출한다', () => {
      const token = makeToken({ user_id: 42, email: 'user@example.com' });
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = mockRes();
      const next = jest.fn();

      authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual({ id: 42, email: 'user@example.com' });
      expect(res.status).not.toHaveBeenCalled();
    });

    it('req.user.id는 JWT payload의 user_id 값이다', () => {
      const token = makeToken({ user_id: 99, email: 'test@test.com' });
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = mockRes();
      const next = jest.fn();

      authenticate(req, res, next);

      expect(req.user.id).toBe(99);
    });

    it('401 응답 바디에 error 필드가 포함된다', () => {
      const req = { headers: {} };
      const res = mockRes();
      const next = jest.fn();

      authenticate(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Unauthorized' })
      );
    });
  });
});
