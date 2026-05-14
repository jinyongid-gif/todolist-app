jest.mock('dotenv', () => ({ config: jest.fn() }));
jest.mock('../../../../src/config/env', () => ({
  config: { jwt: { secret: 'test-secret', expiry: '1h' } },
}));
jest.mock('../../../../src/config/db', () => ({ query: jest.fn(), end: jest.fn() }));
jest.mock('../../../../src/modules/categories/categories.repository', () => ({
  findByUserId: jest.fn(),
}));

const { getCategories } = require('../../../../src/modules/categories/categories.service');
const { findByUserId } = require('../../../../src/modules/categories/categories.repository');

describe('categories.service - getCategories', () => {
  beforeEach(() => jest.clearAllMocks());

  it('findByUserId를 userId로 호출한다', async () => {
    findByUserId.mockResolvedValue([]);
    await getCategories(42);
    expect(findByUserId).toHaveBeenCalledWith(42);
  });

  it('repository 결과를 그대로 반환한다', async () => {
    const mockCategories = [
      { id: 1, name: '업무', is_default: true },
      { id: 2, name: '개인', is_default: true },
      { id: 5, name: '내카테고리', is_default: false },
    ];
    findByUserId.mockResolvedValue(mockCategories);

    const result = await getCategories(7);
    expect(result).toEqual(mockCategories);
  });

  it('빈 배열이면 빈 배열을 반환한다', async () => {
    findByUserId.mockResolvedValue([]);
    const result = await getCategories(99);
    expect(result).toEqual([]);
  });

  it('repository에서 에러가 발생하면 그대로 throw한다', async () => {
    findByUserId.mockRejectedValue(new Error('DB error'));
    await expect(getCategories(1)).rejects.toThrow('DB error');
  });
});
