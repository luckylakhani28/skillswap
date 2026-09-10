const mongoose = require('mongoose');

const TYPES = [
  'request_received',
  'request_accepted',
  'request_rejected',
  'request_cancelled',
  'swap_completed',
  'message_received',
  'review_received',
  'profile_viewed',
];

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: TYPES, required: true },
    message: { type: String, required: true },
    link: { type: String, default: '' }, // frontend route to open on click
    isRead: { type: Boolean, default: false },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

notificationSchema.statics.TYPES = TYPES;

module.exports = mongoose.model('Notification', notificationSchema);
