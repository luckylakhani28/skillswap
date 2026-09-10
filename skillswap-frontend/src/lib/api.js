import axios from 'axios';

// Uses VITE_API_URL when set (e.g. deployed backend), otherwise the Vite
// dev proxy handles the relative /api path.
const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || '') + '/api',
});

// Attach the JWT to every request if present.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('skillswap_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalize errors so callers can read err.message directly.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Something went wrong';
    // Auto-logout on an expired/invalid session.
    if (error.response?.status === 401 && localStorage.getItem('skillswap_token')) {
      localStorage.removeItem('skillswap_token');
    }
    return Promise.reject(new Error(message));
  }
);

export default api;
