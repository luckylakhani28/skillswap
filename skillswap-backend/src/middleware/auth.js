const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Verify the bearer token, load the user, and attach it to req.user.
 * Rejects banned or missing users.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const header = req.headers.authorization;

  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized, no token provided');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, 'Not authorized, token invalid or expired');
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(401, 'User no longer exists');
  if (user.isBanned) throw new ApiError(403, 'Your account has been banned');

  req.user = user;
  next();
});

/**
 * Allow only admins. Must run after `protect`.
 */
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  throw new ApiError(403, 'Admin access required');
};

module.exports = { protect, admin };
