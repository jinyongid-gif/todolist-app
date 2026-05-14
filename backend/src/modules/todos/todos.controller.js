const todosService = require('./todos.service');

async function list(req, res, next) {
  try {
    const data = await todosService.getTodos(req.user.id, req.query);
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}

async function get(req, res, next) {
  try {
    const todo = await todosService.getTodoById(req.user.id, parseInt(req.params.id, 10));
    res.status(200).json(todo);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { title, category_id, description, due_date } = req.body;
    const todo = await todosService.createTodo(req.user.id, { title, category_id, description, due_date });
    res.status(201).json(todo);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { title, category_id, description, due_date } = req.body;
    const todo = await todosService.updateTodo(req.user.id, parseInt(req.params.id, 10), { title, category_id, description, due_date });
    res.status(200).json(todo);
  } catch (err) {
    next(err);
  }
}

async function complete(req, res, next) {
  try {
    const result = await todosService.toggleComplete(req.user.id, parseInt(req.params.id, 10));
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await todosService.deleteTodo(req.user.id, parseInt(req.params.id, 10));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, get, create, update, complete, remove };
