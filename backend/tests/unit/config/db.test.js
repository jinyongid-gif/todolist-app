const mockOn = jest.fn();
const mockQuery = jest.fn();
const MockPool = jest.fn().mockReturnValue({ on: mockOn, query: mockQuery });

jest.mock('pg', () => ({ Pool: MockPool, types: { setTypeParser: jest.fn() } }));
jest.mock('dotenv', () => ({ config: jest.fn() }));
jest.mock('../../../src/utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

describe('config/db.js', () => {
  let db;

  beforeAll(() => {
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/todolist_dev';
    db = require('../../../src/config/db');
  });

  it('pg.Pool이 DATABASE_URL을 connectionString으로 사용해 초기화된다', () => {
    expect(MockPool).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionString: 'postgresql://postgres:postgres@localhost:5432/todolist_dev',
      })
    );
  });

  it('Pool 최대 연결 수가 20이다', () => {
    expect(MockPool).toHaveBeenCalledWith(
      expect.objectContaining({ max: 20 })
    );
  });

  it('idleTimeoutMillis가 설정된다', () => {
    expect(MockPool).toHaveBeenCalledWith(
      expect.objectContaining({ idleTimeoutMillis: expect.any(Number) })
    );
  });

  it('connectionTimeoutMillis가 설정된다', () => {
    expect(MockPool).toHaveBeenCalledWith(
      expect.objectContaining({ connectionTimeoutMillis: expect.any(Number) })
    );
  });

  it('error 이벤트 핸들러가 등록된다', () => {
    expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('error 핸들러 호출 시 logger.error가 실행된다', () => {
    const logger = require('../../../src/utils/logger');
    const [, errorHandler] = mockOn.mock.calls.find(([event]) => event === 'error');
    const err = new Error('DB connection refused');
    errorHandler(err);
    expect(logger.error).toHaveBeenCalled();
  });

  it('db 모듈이 Pool 인스턴스를 export한다', () => {
    expect(db).toBeDefined();
    expect(db.query).toBeDefined();
  });
});
