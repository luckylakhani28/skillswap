const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @route GET /api/notifications
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(100);
  const unread = await Notification.countDocuments({ user: req.user._id, isRead: false });
  res.json({ success: true, unread, count: notifications.length, notifications });
});

// @route PUT /api/notifications/:id/read
const markRead = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!n) throw new ApiError(404, 'Notification not found');
  res.json({ success: true, notification: n });
});

// @route PUT /api/notifications/read-all
const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true, message: 'All notifications marked as read' });
});

// @route DELETE /api/notifications/:id
const deleteNotification = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!n) throw new ApiError(404, 'Notification not found');
  res.json({ success: true, message: 'Notification deleted' });
});

module.exports = { getNotifications, markRead, markAllRead, deleteNotification };
