import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy /api and socket.io to the backend during development so the
// frontend can use same-origin relative URLs.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:5000', ws: true },
    },
  },
});
