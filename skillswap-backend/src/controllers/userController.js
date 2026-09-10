const User = require('../models/User');
const Skill = require('../models/Skill');
const SwapRequest = require('../models/SwapRequest');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Fields a user is allowed to edit on their own profile.
const EDITABLE_FIELDS = [
  'name', 'profilePicture', 'college', 'degree', 'year', 'bio',
  'skillsCanTeach', 'skillsWantToLearn', 'experienceLevel',
  'linkedin', 'github', 'portfolio', 'availability',
];

// @route GET /api/users  — search users with pagination
const getUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 12);
  const filter = {};

  if (req.query.search) {
    const rx = new RegExp(req.query.search, 'i');
    filter.$or = [{ name: rx }, { username: rx }, { skillsCanTeach: rx }];
  }
  if (req.query.experienceLevel) filter.experienceLevel = req.query.experienceLevel;

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ rating: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    count: users.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    users,
  });
});

// @route GET /api/users/:username  — public profile by username
const getUserByUsername = asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: req.params.username.toLowerCase() });
  if (!user) throw new ApiError(404, 'User not found');

  const skills = await Skill.find({ user: user._id, isActive: true }).sort({ createdAt: -1 });
  res.json({ success: true, user, skills });
});

// @route PUT /api/users/me  — update own profile
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  EDITABLE_FIELDS.forEach((field) => {
    if (req.body[field] !== undefined) user[field] = req.body[field];
  });

  await user.save();
  res.json({ success: true, user });
});

// @route DELETE /api/users/me  — delete own account and related data
const deleteAccount = asyncHandler(async (req, res) => {
  const id = req.user._id;
  await Promise.all([
    Skill.deleteMany({ user: id }),
    SwapRequest.deleteMany({ $or: [{ fromUser: id }, { toUser: id }] }),
    Notification.deleteMany({ user: id }),
    Review.deleteMany({ $or: [{ reviewer: id }, { reviewee: id }] }),
  ]);
  await User.findByIdAndDelete(id);
  res.json({ success: true, message: 'Account deleted' });
});

// @route GET /api/users/me/stats  — dashboard statistics
const getMyStats = asyncHandler(async (req, res) => {
  const id = req.user._id;
  const [listings, incoming, outgoing, accepted, completed, unread] = await Promise.all([
    Skill.countDocuments({ user: id }),
    SwapRequest.countDocuments({ toUser: id, status: 'pending' }),
    SwapRequest.countDocuments({ fromUser: id, status: 'pending' }),
    SwapRequest.countDocuments({
      $or: [{ fromUser: id }, { toUser: id }],
      status: 'accepted',
    }),
    SwapRequest.countDocuments({
      $or: [{ fromUser: id }, { toUser: id }],
      status: 'completed',
    }),
    Notification.countDocuments({ user: id, isRead: false }),
  ]);

  res.json({
    success: true,
    stats: {
      listings,
      incomingRequests: incoming,
      outgoingRequests: outgoing,
      acceptedRequests: accepted,
      completedSwaps: completed,
      unreadNotifications: unread,
      rating: req.user.rating,
      numReviews: req.user.numReviews,
    },
  });
});

module.exports = {
  getUsers,
  getUserByUsername,
  updateProfile,
  deleteAccount,
  getMyStats,
};
