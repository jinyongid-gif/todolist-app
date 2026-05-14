jest.mock('../../../src/utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

const { errorHandler } = require('../../../src/middleware/error.middleware');
const { AppError } = require('../../../src/utils/app-error');
const logger = require('../../../src/utils/logger');

function mockReq(overrides = {}) {
  return {
    path: '/api/test',
    method: 'GET',
    user: null,
    ...overrides,
  };
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('errorHandler 미들웨어', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.clearAllMocks();
  });

  describe('AppError (비즈니스 에러)', () => {
    it('AppError의 status 코드로 응답한다', () => {
      const err = new AppError('리소스를 찾을 수 없습니다', 404);
      const req = mockReq();
      const res = mockRes();

      errorHandler(err, req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('AppError의 message를 응답 바디에 포함한다', () => {
      const err = new AppError('이미 존재하는 이메일입니다', 409);
      const req = mockReq();
      const res = mockRes();

      errorHandler(err, req, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: '이미 존재하는 이메일입니다' })
      );
    });

    it('400 AppError를 올바르게 처리한다', () => {
      const err = new AppError('잘못된 입력입니다', 400);
      const req = mockReq();
      const res = mockRes();

      errorHandler(err, req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('403 AppError를 올바르게 처리한다', () => {
      const err = new AppError('권한이 없습니다', 403);
      const req = mockReq();
      const res = mockRes();

      errorHandler(err, req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('일반 에러 (처리되지 않은 에러)', () => {
    it('status가 없는 에러는 500으로 응답한다', () => {
      const err = new Error('예상치 못한 오류');
      const req = mockReq();
      const res = mockRes();

      errorHandler(err, req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('500 응답 메시지는 서버 오류 안내 문구이다', () => {
      const err = new Error('DB connection failed');
      const req = mockReq();
      const res = mockRes();

      errorHandler(err, req, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: '서버 오류가 발생했습니다' })
      );
    });
  });

  describe('production 환경', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('스택 트레이스를 응답 바디에 포함하지 않는다', () => {
      const err = new Error('서버 내부 오류');
      const req = mockReq();
      const res = mockRes();

      errorHandler(err, req, res, jest.fn());

      const body = res.json.mock.calls[0][0];
      expect(body.stack).toBeUndefined();
      expect(body.detail).toBeUndefined();
    });
  });

  describe('development 환경', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('500 에러에 detail 필드가 포함된다', () => {
      const err = new Error('개발환경 상세 오류');
      const req = mockReq();
      const res = mockRes();

      errorHandler(err, req, res, jest.fn());

      const body = res.json.mock.calls[0][0];
      expect(body.detail).toBe('개발환경 상세 오류');
    });

    it('AppError에는 detail 필드가 없다', () => {
      const err = new AppError('권한 없음', 403);
      const req = mockReq();
      const res = mockRes();

      errorHandler(err, req, res, jest.fn());

      const body = res.json.mock.calls[0][0];
      expect(body.detail).toBeUndefined();
    });
  });

  describe('winston 로깅', () => {
    it('모든 에러는 logger.error로 기록된다', () => {
      const err = new Error('어떤 오류');
      const req = mockReq();
      const res = mockRes();

      errorHandler(err, req, res, jest.fn());

      expect(logger.error).toHaveBeenCalled();
    });

    it('AppError도 logger.error로 기록된다', () => {
      const err = new AppError('비즈니스 오류', 422);
      const req = mockReq();
      const res = mockRes();

      errorHandler(err, req, res, jest.fn());

      expect(logger.error).toHaveBeenCalled();
    });

    it('로그에 endpoint와 method가 포함된다', () => {
      const err = new Error('오류');
      const req = mockReq({ path: '/api/todos', method: 'POST' });
      const res = mockRes();

      errorHandler(err, req, res, jest.fn());

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ endpoint: '/api/todos', method: 'POST' })
      );
    });

    it('로그에 userId가 포함된다 (인증된 요청)', () => {
      const err = new Error('오류');
      const req = mockReq({ user: { id: 7, email: 'u@u.com' } });
      const res = mockRes();

      errorHandler(err, req, res, jest.fn());

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 7 })
      );
    });
  });

  describe('AppError 클래스', () => {
    it('Error를 상속한다', () => {
      const err = new AppError('test', 400);
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(AppError);
    });

    it('name이 "AppError"이다', () => {
      const err = new AppError('test', 400);
      expect(err.name).toBe('AppError');
    });

    it('status 속성이 설정된다', () => {
      const err = new AppError('test', 422);
      expect(err.status).toBe(422);
    });

    it('message가 설정된다', () => {
      const err = new AppError('오류 메시지', 400);
      expect(err.message).toBe('오류 메시지');
    });
  });
});
