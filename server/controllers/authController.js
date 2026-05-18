const { validationResult } = require('express-validator');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  res.status(statusCode).json({
    success: true,
    token,
    user,
  });
};

const validateRequest = (req) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new AppError(errors.array().map((error) => error.msg).join(', '), 400);
  }
};

exports.register = asyncHandler(async (req, res) => {
  validateRequest(req);

  const { name, email, password, role, phone } = req.body;
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AppError('Email is already registered', 409);
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    phone,
  });

  sendTokenResponse(user, 201, res);
});

exports.login = asyncHandler(async (req, res) => {
  validateRequest(req);

  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('This account is inactive', 403);
  }

  user.password = undefined;
  sendTokenResponse(user, 200, res);
});

exports.getCurrentUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});
