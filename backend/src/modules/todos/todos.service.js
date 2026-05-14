const todosRepo = require('./todos.repository');
const { existsForUser } = require('../categories/categories.repository');
const { AppError } = require('../../utils/app-error');
const logger = require('../../utils/logger');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function validateDueDate(due_date) {
  if (due_date && !DATE_REGEX.test(due_date)) {
    throw new AppError('due_date는 YYYY-MM-DD 형식이어야 합니다', 400);
  }
}

async function validateCategory(categoryId, userId) {
  const valid = await existsForUser(categoryId, userId);
  if (!valid) {
    logger.warn('유효하지 않은 카테고리', { categoryId, userId });
    throw new AppError('유효하지 않은 카테고리입니다', 400);
  }
}

async function assertOwnership(todoId, userId) {
  const todo = await todosRepo.findById(todoId);
  if (!todo) {
    logger.debug('할일 없음', { todoId });
    throw new AppError('할일을 찾을 수 없습니다', 404);
  }
  if (todo.user_id !== userId) {
    logger.warn('할일 접근 권한 없음', { todoId, ownerId: todo.user_id, requesterId: userId });
    throw new AppError('접근 권한이 없습니다', 403);
  }
  return todo;
}

async function getTodos(userId, query) {
  const filters = {};
  if (query.category_id !== undefined) {
    filters.category_id = parseInt(query.category_id, 10);
  }
  if (query.is_completed !== undefined) {
    filters.is_completed = query.is_completed === 'true';
  }
  if (query.overdue === 'true') {
    filters.overdue = true;
  }
  logger.debug('할일 목록 조회', { userId, filters });
  return todosRepo.findByUserId(userId, filters);
}

async function getTodoById(userId, id) {
  logger.debug('할일 단건 조회', { userId, todoId: id });
  return assertOwnership(id, userId);
}

async function createTodo(userId, { title, category_id, description, due_date }) {
  validateDueDate(due_date);
  await validateCategory(category_id, userId);
  const todo = await todosRepo.create({ user_id: userId, category_id, title, description, due_date });
  logger.info('할일 등록', { userId, todoId: todo.id, title });
  return todo;
}

async function updateTodo(userId, id, { title, category_id, description, due_date }) {
  await assertOwnership(id, userId);
  validateDueDate(due_date);
  await validateCategory(category_id, userId);
  const todo = await todosRepo.update(id, { title, category_id, description, due_date });
  logger.info('할일 수정', { userId, todoId: id, title });
  return todo;
}

async function toggleComplete(userId, id) {
  await assertOwnership(id, userId);
  const result = await todosRepo.updateComplete(id);
  logger.info('할일 완료 토글', { userId, todoId: id, is_completed: result.is_completed });
  return result;
}

async function deleteTodo(userId, id) {
  await assertOwnership(id, userId);
  await todosRepo.remove(id);
  logger.info('할일 삭제', { userId, todoId: id });
}

module.exports = { getTodos, getTodoById, createTodo, updateTodo, toggleComplete, deleteTodo };
