const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @route GET /api/messages/conversations
// One entry per conversation: the other participant, the last message, unread count.
const getConversations = asyncHandler(async (req, res) => {
  const uid = req.user._id;

  const rows = await Message.aggregate([
    { $match: { $or: [{ sender: uid }, { receiver: uid }] } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$conversationId',
        lastMessage: { $first: '$$ROOT' },
        unread: {
          $sum: {
            $cond: [{ $and: [{ $eq: ['$receiver', uid] }, { $eq: ['$seen', false] }] }, 1, 0],
          },
        },
      },
    },
    { $sort: { 'lastMessage.createdAt': -1 } },
  ]);

  // Resolve the "other" participant for each conversation in one query.
  const otherIds = rows.map((r) => {
    const { sender, receiver } = r.lastMessage;
    return sender.toString() === uid.toString() ? receiver : sender;
  });
  const users = await User.find({ _id: { $in: otherIds } }).select(
    'name username profilePicture'
  );
  const byId = new Map(users.map((u) => [u._id.toString(), u]));

  const conversations = rows.map((r, i) => ({
    conversationId: r._id,
    user: byId.get(otherIds[i].toString()) || null,
    lastMessage: {
      content: r.lastMessage.content,
      image: r.lastMessage.image,
      createdAt: r.lastMessage.createdAt,
      fromMe: r.lastMessage.sender.toString() === uid.toString(),
    },
    unread: r.unread,
  }));

  res.json({ success: true, count: conversations.length, conversations });
});

// @route GET /api/messages/:userId
// Full thread with one user; marks their messages to me as seen.
const getThread = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.isValidObjectId(userId)) throw new ApiError(400, 'Invalid user id');

  const other = await User.findById(userId).select('name username profilePicture');
  if (!other) throw new ApiError(404, 'User not found');

  const conversationId = Message.buildConversationId(req.user._id, userId);

  const [messages] = await Promise.all([
    Message.find({ conversationId }).sort({ createdAt: 1 }).limit(500),
    Message.updateMany(
      { conversationId, receiver: req.user._id, seen: false },
      { seen: true }
    ),
  ]);

  res.json({ success: true, user: other, conversationId, messages });
});

module.exports = { getConversations, getThread };
