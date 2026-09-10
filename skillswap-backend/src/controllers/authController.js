const crypto = require('crypto');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');

// Shape a user document for API responses (never leak the hash).
const publicUser = (u) => ({
  _id: u._id,
  name: u.name,
  username: u.username,
  email: u.email,
  profilePicture: u.profilePicture,
  role: u.role,
  rating: u.rating,
  numReviews: u.numReviews,
});

// @route POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, username, email, password } = req.body;

  const exists = await User.findOne({ $or: [{ email }, { username }] });
  if (exists) throw new ApiError(409, 'Email or username already in use');

  const user = await User.create({ name, username, email, password });
  const token = generateToken(user._id);

  res.status(201).json({ success: true, token, user: publicUser(user) });
});

// @route POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body; // identifier = email OR username

  const user = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }],
  }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, 'Invalid credentials');
  }
  if (user.isBanned) throw new ApiError(403, 'Your account has been banned');

  const token = generateToken(user._id);
  res.json({ success: true, token, user: publicUser(user) });
});

// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

// @route POST /api/auth/logout
// Stateless JWT: logout is handled client-side by discarding the token.
// Provided for symmetry and to clear an optional cookie.
const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out' });
});

// @route POST /api/auth/forgot-password  (mock — returns the reset token)
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Do not reveal whether the email exists.
  if (!user) {
    return res.json({ success: true, message: 'If that email exists, a reset link was sent' });
  }

  const resetToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
  await user.save({ validateBeforeSave: false });

  // In production this token would be emailed. For this project we return it.
  res.json({
    success: true,
    message: 'Password reset token generated',
    resetToken,
  });
});

// @route PUT /api/auth/reset-password/:token
const resetPassword = asyncHandler(async (req, res) => {
  const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpire: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpire');

  if (!user) throw new ApiError(400, 'Reset token is invalid or has expired');

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  const token = generateToken(user._id);
  res.json({ success: true, token, message: 'Password reset successful' });
});

// @route PUT /api/auth/update-password
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.matchPassword(currentPassword))) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated' });
});

module.exports = {
  register,
  login,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
  updatePassword,
};
