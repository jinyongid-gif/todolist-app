const { validateRequired, validateEmail } = require('../../../src/middleware/validation.middleware');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('validateRequired', () => {
  it('필수 필드가 모두 있으면 next()를 호출한다', () => {
    const middleware = validateRequired(['email', 'password']);
    const req = { body: { email: 'test@test.com', password: '1234' } };
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('필수 필드가 누락되면 400을 반환한다', () => {
    const middleware = validateRequired(['email', 'password']);
    const req = { body: { email: 'test@test.com' } };
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('빈 문자열 필드는 누락으로 처리한다', () => {
    const middleware = validateRequired(['name']);
    const req = { body: { name: '   ' } };
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('validateEmail', () => {
  it('유효한 이메일이면 next()를 호출한다', () => {
    const req = { body: { email: 'user@example.com' } };
    const res = mockRes();
    const next = jest.fn();

    validateEmail(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('유효하지 않은 이메일이면 400을 반환한다', () => {
    const req = { body: { email: 'not-an-email' } };
    const res = mockRes();
    const next = jest.fn();

    validateEmail(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('email 필드가 없으면 next()를 호출한다', () => {
    const req = { body: {} };
    const res = mockRes();
    const next = jest.fn();

    validateEmail(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
