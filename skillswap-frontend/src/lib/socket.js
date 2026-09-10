import { io } from 'socket.io-client';

// A single shared socket for the whole app. Created lazily so the JWT
// (set at login) is available, and reconnected after logout/login.
let socket = null;

export const getSocket = () => {
  const token = localStorage.getItem('skillswap_token');
  if (!token) return null;

  if (!socket) {
    // undefined URL => same origin; the Vite dev proxy forwards /socket.io.
    socket = io(import.meta.env.VITE_API_URL || undefined, {
      auth: { token },
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
