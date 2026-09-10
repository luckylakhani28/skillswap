require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);
    const io = new Server(server, {
      cors: { origin: process.env.CLIENT_URL || '*', credentials: true },
    });
    initSocket(io);

    // Make io reachable from controllers if needed (e.g. push notifications).
    app.set('io', io);

    server.listen(PORT, () =>
      console.log(`SkillSwap API running in ${process.env.NODE_ENV || 'development'} on port ${PORT}`)
    );

    // Graceful shutdown on unhandled rejections.
    process.on('unhandledRejection', (err) => {
      console.error('Unhandled rejection:', err.message);
      server.close(() => process.exit(1));
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

start();
