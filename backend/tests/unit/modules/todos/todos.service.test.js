jest.mock('dotenv', () => ({ config: jest.fn() }));
jest.mock('../../../../src/config/env', () => ({
  config: { jwt: { secret: 'test-secret', expiry: '1h' } },
}));
jest.mock('../../../../src/config/db', () => ({ query: jest.fn(), end: jest.fn() }));
jest.mock('../../../../src/modules/todos/todos.repository', () => ({
  findByUserId: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateComplete: jest.fn(),
  remove: jest.fn(),
}));
jest.mock('../../../../src/modules/categories/categories.repository', () => ({
  findByUserId: jest.fn(),
  existsForUser: jest.fn(),
}));

const {
  getTodos, getTodoById, createTodo, updateTodo, toggleComplete, deleteTodo,
} = require('../../../../src/modules/todos/todos.service');
const todosRepo = require('../../../../src/modules/todos/todos.repository');
const categoriesRepo = require('../../../../src/modules/categories/categories.repository');
const { AppError } = require('../../../../src/utils/app-error');

const USER_ID = 1;
const OTHER_USER_ID = 2;
const TODO_ID = 10;
const CAT_ID = 3;

const mockTodo = {
  id: TODO_ID, user_id: USER_ID, category_id: CAT_ID,
  title: '테스트 할일', description: null, due_date: null,
  is_completed: false, created_at: new Date(), updated_at: new Date(),
};

beforeEach(() => jest.clearAllMocks());

describe('getTodos', () => {
  it('userId로 findByUserId를 호출한다', async () => {
    todosRepo.findByUserId.mockResolvedValue([]);
    await getTodos(USER_ID, {});
    expect(todosRepo.findByUserId).toHaveBeenCalledWith(USER_ID, {});
  });

  it('category_id 필터를 정수로 변환해서 전달한다', async () => {
    todosRepo.findByUserId.mockResolvedValue([]);
    await getTodos(USER_ID, { category_id: '3' });
    expect(todosRepo.findByUserId).toHaveBeenCalledWith(USER_ID, { category_id: 3 });
  });

  it('is_completed=true 필터를 불리언으로 변환한다', async () => {
    todosRepo.findByUserId.mockResolvedValue([]);
    await getTodos(USER_ID, { is_completed: 'true' });
    expect(todosRepo.findByUserId).toHaveBeenCalledWith(USER_ID, { is_completed: true });
  });

  it('is_completed=false 필터를 불리언으로 변환한다', async () => {
    todosRepo.findByUserId.mockResolvedValue([]);
    await getTodos(USER_ID, { is_completed: 'false' });
    expect(todosRepo.findByUserId).toHaveBeenCalledWith(USER_ID, { is_completed: false });
  });

  it('overdue=true 필터를 전달한다', async () => {
    todosRepo.findByUserId.mockResolvedValue([]);
    await getTodos(USER_ID, { overdue: 'true' });
    expect(todosRepo.findByUserId).toHaveBeenCalledWith(USER_ID, { overdue: true });
  });

  it('결과를 그대로 반환한다', async () => {
    todosRepo.findByUserId.mockResolvedValue([mockTodo]);
    const result = await getTodos(USER_ID, {});
    expect(result).toEqual([mockTodo]);
  });
});

describe('getTodoById', () => {
  it('존재하지 않으면 AppError(404)를 throw한다', async () => {
    todosRepo.findById.mockResolvedValue(null);
    await expect(getTodoById(USER_ID, TODO_ID)).rejects.toMatchObject({ status: 404 });
  });

  it('다른 사용자 소유이면 AppError(403)를 throw한다', async () => {
    todosRepo.findById.mockResolvedValue({ ...mockTodo, user_id: OTHER_USER_ID });
    await expect(getTodoById(USER_ID, TODO_ID)).rejects.toMatchObject({ status: 403 });
  });

  it('소유자가 맞으면 todo를 반환한다', async () => {
    todosRepo.findById.mockResolvedValue(mockTodo);
    const result = await getTodoById(USER_ID, TODO_ID);
    expect(result).toEqual(mockTodo);
  });
});

describe('createTodo', () => {
  it('유효하지 않은 due_date 형식이면 AppError(400)를 throw한다', async () => {
    await expect(createTodo(USER_ID, { title: 'T', category_id: CAT_ID, due_date: '2026/01/01' }))
      .rejects.toMatchObject({ status: 400 });
  });

  it('존재하지 않는 category_id이면 AppError(400)를 throw한다', async () => {
    categoriesRepo.existsForUser.mockResolvedValue(false);
    await expect(createTodo(USER_ID, { title: 'T', category_id: 999 }))
      .rejects.toMatchObject({ status: 400 });
  });

  it('유효한 데이터면 create를 호출하고 결과를 반환한다', async () => {
    categoriesRepo.existsForUser.mockResolvedValue(true);
    todosRepo.create.mockResolvedValue(mockTodo);
    const result = await createTodo(USER_ID, { title: '할일', category_id: CAT_ID });
    expect(todosRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: USER_ID, category_id: CAT_ID, title: '할일' })
    );
    expect(result).toEqual(mockTodo);
  });

  it('YYYY-MM-DD 형식의 due_date는 통과한다', async () => {
    categoriesRepo.existsForUser.mockResolvedValue(true);
    todosRepo.create.mockResolvedValue(mockTodo);
    await expect(createTodo(USER_ID, { title: 'T', category_id: CAT_ID, due_date: '2026-12-31' }))
      .resolves.toBeDefined();
  });
});

describe('updateTodo', () => {
  it('존재하지 않으면 AppError(404)를 throw한다', async () => {
    todosRepo.findById.mockResolvedValue(null);
    await expect(updateTodo(USER_ID, TODO_ID, { title: 'T', category_id: CAT_ID }))
      .rejects.toMatchObject({ status: 404 });
  });

  it('다른 사용자 소유이면 AppError(403)를 throw한다', async () => {
    todosRepo.findById.mockResolvedValue({ ...mockTodo, user_id: OTHER_USER_ID });
    await expect(updateTodo(USER_ID, TODO_ID, { title: 'T', category_id: CAT_ID }))
      .rejects.toMatchObject({ status: 403 });
  });

  it('유효한 요청이면 update를 호출하고 결과를 반환한다', async () => {
    todosRepo.findById.mockResolvedValue(mockTodo);
    categoriesRepo.existsForUser.mockResolvedValue(true);
    todosRepo.update.mockResolvedValue({ ...mockTodo, title: '수정됨' });
    const result = await updateTodo(USER_ID, TODO_ID, { title: '수정됨', category_id: CAT_ID });
    expect(todosRepo.update).toHaveBeenCalledWith(TODO_ID, expect.objectContaining({ title: '수정됨' }));
    expect(result.title).toBe('수정됨');
  });
});

describe('toggleComplete', () => {
  it('존재하지 않으면 AppError(404)를 throw한다', async () => {
    todosRepo.findById.mockResolvedValue(null);
    await expect(toggleComplete(USER_ID, TODO_ID)).rejects.toMatchObject({ status: 404 });
  });

  it('다른 사용자 소유이면 AppError(403)를 throw한다', async () => {
    todosRepo.findById.mockResolvedValue({ ...mockTodo, user_id: OTHER_USER_ID });
    await expect(toggleComplete(USER_ID, TODO_ID)).rejects.toMatchObject({ status: 403 });
  });

  it('소유자면 updateComplete를 호출하고 결과를 반환한다', async () => {
    todosRepo.findById.mockResolvedValue(mockTodo);
    todosRepo.updateComplete.mockResolvedValue({ id: TODO_ID, is_completed: true, updated_at: new Date() });
    const result = await toggleComplete(USER_ID, TODO_ID);
    expect(todosRepo.updateComplete).toHaveBeenCalledWith(TODO_ID);
    expect(result.is_completed).toBe(true);
  });
});

describe('deleteTodo', () => {
  it('존재하지 않으면 AppError(404)를 throw한다', async () => {
    todosRepo.findById.mockResolvedValue(null);
    await expect(deleteTodo(USER_ID, TODO_ID)).rejects.toMatchObject({ status: 404 });
  });

  it('다른 사용자 소유이면 AppError(403)를 throw한다', async () => {
    todosRepo.findById.mockResolvedValue({ ...mockTodo, user_id: OTHER_USER_ID });
    await expect(deleteTodo(USER_ID, TODO_ID)).rejects.toMatchObject({ status: 403 });
  });

  it('소유자면 remove를 호출한다', async () => {
    todosRepo.findById.mockResolvedValue(mockTodo);
    todosRepo.remove.mockResolvedValue();
    await deleteTodo(USER_ID, TODO_ID);
    expect(todosRepo.remove).toHaveBeenCalledWith(TODO_ID);
  });
});
