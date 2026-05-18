const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const User = require('../models/User');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('role')
      .optional()
      .isIn(User.roles)
      .withMessage(`Role must be one of: ${User.roles.join(', ')}`),
    body('phone').optional().trim().isLength({ max: 30 }).withMessage('Phone is too long'),
  ],
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  authController.login
);

router.get('/me', protect, authController.getCurrentUser);

router.get('/admin-only', protect, authorize('admin'), (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin access granted',
  });
});

module.exports = router;
