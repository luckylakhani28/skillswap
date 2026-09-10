const jwt = require('jsonwebtoken');
const Message = require('../models/Message');

/**
 * Attach Socket.IO handlers for one-to-one chat.
 * Clients authenticate by sending their JWT in the handshake auth payload:
 *   io('http://host', { auth: { token } })
 *
 * Events (client -> server):
 *   join            join your personal room (auto on connect)
 *   send_message    { to, content, image }
 *   typing          { to }
 *   mark_seen       { conversationId }
 *
 * Events (server -> client):
 *   receive_message, typing, message_seen, online_users
 */
const onlineUsers = new Map(); // userId -> socketId

const initSocket = (io) => {
  // Authenticate every socket connection with the same JWT as the REST API.
  io.use((socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { userId } = socket;
    onlineUsers.set(userId, socket.id);
    socket.join(userId); // personal room for direct delivery
    io.emit('online_users', [...onlineUsers.keys()]);

    socket.on('send_message', async ({ to, content = '', image = '' }) => {
      if (!to || (!content && !image)) return;
      const conversationId = Message.buildConversationId(userId, to);
      const message = await Message.create({
        conversationId,
        sender: userId,
        receiver: to,
        content,
        image,
      });
      io.to(to).emit('receive_message', message);
      socket.emit('receive_message', message); // echo to sender
    });

    socket.on('typing', ({ to }) => {
      if (to) io.to(to).emit('typing', { from: userId });
    });

    socket.on('mark_seen', async ({ conversationId }) => {
      if (!conversationId) return;
      await Message.updateMany(
        { conversationId, receiver: userId, seen: false },
        { seen: true }
      );
      // Clients join their own userId room, not the conversation room, so
      // notify the other participant directly (their id is in conversationId).
      const otherId = conversationId.split('_').find((id) => id !== userId);
      if (otherId) io.to(otherId).emit('message_seen', { conversationId, by: userId });
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      io.emit('online_users', [...onlineUsers.keys()]);
    });
  });
};

module.exports = { initSocket, onlineUsers };
