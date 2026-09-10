const Review = require('../models/Review');
const SwapRequest = require('../models/SwapRequest');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const notify = require('../utils/notify');

// @route POST /api/reviews  — review the other party of a completed swap
const createReview = asyncHandler(async (req, res) => {
  const { swapRequest, rating, comment } = req.body;

  const swap = await SwapRequest.findById(swapRequest);
  if (!swap) throw new ApiError(404, 'Swap request not found');
  if (swap.status !== 'completed') {
    throw new ApiError(400, 'You can only review completed swaps');
  }

  const uid = req.user._id.toString();
  const isFrom = swap.fromUser.toString() === uid;
  const isTo = swap.toUser.toString() === uid;
  if (!isFrom && !isTo) throw new ApiError(403, 'You were not part of this swap');

  if ((isFrom && swap.reviewedByFrom) || (isTo && swap.reviewedByTo)) {
    throw new ApiError(409, 'You have already reviewed this swap');
  }

  const reviewee = isFrom ? swap.toUser : swap.fromUser;

  const review = await Review.create({
    reviewer: req.user._id,
    reviewee,
    swapRequest,
    rating,
    comment,
  });

  if (isFrom) swap.reviewedByFrom = true;
  else swap.reviewedByTo = true;
  await swap.save();

  await notify({
    user: reviewee,
    type: 'review_received',
    message: `${req.user.name} left you a ${rating}-star review`,
    link: `/profile/${req.user.username}`,
  });

  res.status(201).json({ success: true, review });
});

// @route GET /api/reviews/user/:userId  — reviews received by a user
const getUserReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ reviewee: req.params.userId })
    .populate('reviewer', 'name username profilePicture')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: reviews.length, reviews });
});

module.exports = { createReview, getUserReviews };
