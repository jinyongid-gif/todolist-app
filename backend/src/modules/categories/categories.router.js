const { Router } = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const categoriesController = require('./categories.controller');

const router = Router();

router.get('/', authenticate, (req, res, next) => categoriesController.list(req, res, next));

module.exports = router;
