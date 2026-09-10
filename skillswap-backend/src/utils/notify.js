const Notification = require('../models/Notification');

/**
 * Create a notification. Never throws into the caller's flow — a failed
 * notification should not roll back the primary action.
 */
const notify = async ({ user, type, message, link = '', meta = {} }) => {
  try {
    return await Notification.create({ user, type, message, link, meta });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
};

module.exports = notify;
