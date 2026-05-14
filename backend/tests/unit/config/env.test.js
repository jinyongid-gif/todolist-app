jest.mock('dotenv', () => ({ config: jest.fn() }));

describe('config/env.js', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {};
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('환경변수가 있으면 config 값을 올바르게 읽는다', () => {
    process.env.DATABASE_URL = 'postgresql://localhost/test';
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRY = '2h';
    process.env.SERVER_PORT = '4000';
    process.env.NODE_ENV = 'test';
    process.env.CORS_ORIGIN = 'http://example.com';

    const { config } = require('../../../src/config/env');

    expect(config.db.url).toBe('postgresql://localhost/test');
    expect(config.jwt.secret).toBe('test-secret');
    expect(config.jwt.expiry).toBe('2h');
    expect(config.server.port).toBe(4000);
    expect(config.server.env).toBe('test');
    expect(config.cors.origin).toBe('http://example.com');
  });

  it('JWT_EXPIRY 기본값은 1h이다', () => {
    process.env.DATABASE_URL = 'postgresql://localhost/test';
    process.env.JWT_SECRET = 'secret';
    delete process.env.JWT_EXPIRY;

    const { config } = require('../../../src/config/env');
    expect(config.jwt.expiry).toBe('1h');
  });

  it('SERVER_PORT 기본값은 3000이다', () => {
    delete process.env.SERVER_PORT;
    const { config } = require('../../../src/config/env');
    expect(config.server.port).toBe(3000);
  });

  it('CORS_ORIGIN 기본값은 http://localhost:5173이다', () => {
    delete process.env.CORS_ORIGIN;
    const { config } = require('../../../src/config/env');
    expect(config.cors.origin).toBe('http://localhost:5173');
  });

  it('validateEnv는 필수 환경변수 누락 시 process.exit(1)을 호출한다', () => {
    delete process.env.DATABASE_URL;
    delete process.env.JWT_SECRET;

    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    const { validateEnv } = require('../../../src/config/env');

    validateEnv();
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });

  it('validateEnv는 필수 환경변수가 모두 있으면 process.exit을 호출하지 않는다', () => {
    process.env.DATABASE_URL = 'postgresql://localhost/test';
    process.env.JWT_SECRET = 'secret';

    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    const { validateEnv } = require('../../../src/config/env');

    validateEnv();
    expect(mockExit).not.toHaveBeenCalled();
    mockExit.mockRestore();
  });
});
