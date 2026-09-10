const mongoose = require('mongoose');

/**
 * A single chat message between two users.
 * `conversationId` is a deterministic key built from the two user ids
 * (sorted and joined) so both directions map to the same conversation.
 */
const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, default: '' },
    image: { type: String, default: '' },
    seen: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Build the shared conversation id from two user ids.
messageSchema.statics.buildConversationId = (a, b) =>
  [a.toString(), b.toString()].sort().join('_');

module.exports = mongoose.model('Message', messageSchema);
