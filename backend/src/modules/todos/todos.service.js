const todosRepo = require('./todos.repository');
const { existsForUser } = require('../categories/categories.repository');
const { AppError } = require('../../utils/app-error');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function validateDueDate(due_date) {
  if (due_date && !DATE_REGEX.test(due_date)) {
    throw new AppError('due_date는 YYYY-MM-DD 형식이어야 합니다', 400);
  }
}

async function validateCategory(categoryId, userId) {
  const valid = await existsForUser(categoryId, userId);
  if (!valid) {
    throw new AppError('유효하지 않은 카테고리입니다', 400);
  }
}

async function assertOwnership(todoId, userId) {
  const todo = await todosRepo.findById(todoId);
  if (!todo) throw new AppError('할일을 찾을 수 없습니다', 404);
  if (todo.user_id !== userId) throw new AppError('접근 권한이 없습니다', 403);
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
  return todosRepo.findByUserId(userId, filters);
}

async function getTodoById(userId, id) {
  return assertOwnership(id, userId);
}

async function createTodo(userId, { title, category_id, description, due_date }) {
  validateDueDate(due_date);
  await validateCategory(category_id, userId);
  return todosRepo.create({ user_id: userId, category_id, title, description, due_date });
}

async function updateTodo(userId, id, { title, category_id, description, due_date }) {
  await assertOwnership(id, userId);
  validateDueDate(due_date);
  await validateCategory(category_id, userId);
  return todosRepo.update(id, { title, category_id, description, due_date });
}

async function toggleComplete(userId, id) {
  await assertOwnership(id, userId);
  return todosRepo.updateComplete(id);
}

async function deleteTodo(userId, id) {
  await assertOwnership(id, userId);
  await todosRepo.remove(id);
}

module.exports = { getTodos, getTodoById, createTodo, updateTodo, toggleComplete, deleteTodo };
