const { Router } = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const { validateRequired } = require('../../middleware/validation.middleware');
const todosController = require('./todos.controller');

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => todosController.list(req, res, next));
router.get('/:id', (req, res, next) => todosController.get(req, res, next));
router.post('/', validateRequired(['title', 'category_id']), (req, res, next) => todosController.create(req, res, next));
router.put('/:id', validateRequired(['title', 'category_id']), (req, res, next) => todosController.update(req, res, next));
router.patch('/:id/complete', (req, res, next) => todosController.complete(req, res, next));
router.delete('/:id', (req, res, next) => todosController.remove(req, res, next));

module.exports = router;
