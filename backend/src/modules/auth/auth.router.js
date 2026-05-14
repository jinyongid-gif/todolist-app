const { Router } = require('express');
const { validateRequired, validateEmail } = require('../../middleware/validation.middleware');
const authController = require('./auth.controller');

const router = Router();

router.post(
  '/register',
  validateRequired(['email', 'password', 'name']),
  validateEmail,
  (req, res, next) => authController.register(req, res, next)
);

router.post(
  '/login',
  validateRequired(['email', 'password']),
  (req, res, next) => authController.login(req, res, next)
);

module.exports = router;
