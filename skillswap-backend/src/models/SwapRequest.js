const mongoose = require('mongoose');

const STATUSES = ['pending', 'accepted', 'rejected', 'cancelled', 'completed'];

const swapRequestSchema = new mongoose.Schema(
  {
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Skill the requester offers to teach.
    offeredSkill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
    // Skill (owned by toUser) the requester wants to learn.
    requestedSkill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
    message: { type: String, maxlength: 1000, default: '' },
    status: { type: String, enum: STATUSES, default: 'pending', index: true },
    completedAt: { type: Date },
    // Tracks whether each side has left a review after completion.
    reviewedByFrom: { type: Boolean, default: false },
    reviewedByTo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

swapRequestSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('SwapRequest', swapRequestSchema);
