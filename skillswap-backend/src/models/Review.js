const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    swapRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'SwapRequest', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 1000, default: '' },
  },
  { timestamps: true }
);

// One reviewer can review a given swap only once.
reviewSchema.index({ reviewer: 1, swapRequest: 1 }, { unique: true });

/**
 * Recalculate and persist the reviewee's average rating and review count.
 * Called by post-save/post-remove hooks so the User document stays in sync.
 */
reviewSchema.statics.recomputeUserRating = async function recompute(userId) {
  const result = await this.aggregate([
    { $match: { reviewee: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: '$reviewee', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const { avg = 0, count = 0 } = result[0] || {};
  await mongoose.model('User').findByIdAndUpdate(userId, {
    rating: Math.round(avg * 10) / 10,
    numReviews: count,
  });
};

reviewSchema.post('save', function afterSave(doc) {
  doc.constructor.recomputeUserRating(doc.reviewee);
});

reviewSchema.post('findOneAndDelete', function afterDelete(doc) {
  if (doc) mongoose.model('Review').recomputeUserRating(doc.reviewee);
});

module.exports = mongoose.model('Review', reviewSchema);
