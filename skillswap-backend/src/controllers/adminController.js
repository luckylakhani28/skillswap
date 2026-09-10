const User = require('../models/User');
const Skill = require('../models/Skill');
const SwapRequest = require('../models/SwapRequest');
const Review = require('../models/Review');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @route GET /api/admin/stats  — platform analytics
const getStats = asyncHandler(async (req, res) => {
  const [users, skills, swaps, completed, reviews, banned] = await Promise.all([
    User.countDocuments(),
    Skill.countDocuments(),
    SwapRequest.countDocuments(),
    SwapRequest.countDocuments({ status: 'completed' }),
    Review.countDocuments(),
    User.countDocuments({ isBanned: true }),
  ]);

  const swapsByStatus = await SwapRequest.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  res.json({
    success: true,
    stats: { users, skills, swaps, completedSwaps: completed, reviews, bannedUsers: banned },
    swapsByStatus,
  });
});

// @route GET /api/admin/users  — list all users
const getAllUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
  const filter = {};
  if (req.query.search) {
    const rx = new RegExp(req.query.search, 'i');
    filter.$or = [{ name: rx }, { username: rx }, { email: rx }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, total, page, pages: Math.ceil(total / limit), users });
});

// Guard against an admin acting on themselves for destructive ops.
const assertNotSelf = (req) => {
  if (req.params.id === req.user._id.toString()) {
    throw new ApiError(400, 'Admins cannot perform this action on themselves');
  }
};

// @route PUT /api/admin/users/:id/ban
const banUser = asyncHandler(async (req, res) => {
  assertNotSelf(req);
  const user = await User.findByIdAndUpdate(req.params.id, { isBanned: true }, { new: true });
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, user });
});

// @route PUT /api/admin/users/:id/unban
const unbanUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isBanned: false }, { new: true });
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, user });
});

// @route DELETE /api/admin/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  assertNotSelf(req);
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  await Promise.all([
    Skill.deleteMany({ user: user._id }),
    SwapRequest.deleteMany({ $or: [{ fromUser: user._id }, { toUser: user._id }] }),
    Review.deleteMany({ $or: [{ reviewer: user._id }, { reviewee: user._id }] }),
  ]);
  await user.deleteOne();
  res.json({ success: true, message: 'User and related data removed' });
});

// @route GET /api/admin/reviews  — moderate reviews
const getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .populate('reviewer', 'username')
    .populate('reviewee', 'username')
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ success: true, count: reviews.length, reviews });
});

// @route DELETE /api/admin/reviews/:id
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found');
  // Keep the user's aggregate rating accurate after removal.
  await Review.recomputeUserRating(review.reviewee);
  res.json({ success: true, message: 'Review deleted' });
});

module.exports = {
  getStats,
  getAllUsers,
  banUser,
  unbanUser,
  deleteUser,
  getAllReviews,
  deleteReview,
};
