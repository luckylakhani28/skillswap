import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../lib/api';
import { disconnectSocket } from '../lib/socket';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while restoring session

  // Restore the session on first load if a token exists.
  useEffect(() => {
    const token = localStorage.getItem('skillswap_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => localStorage.removeItem('skillswap_token'))
      .finally(() => setLoading(false));
  }, []);

  const persist = (token, u) => {
    localStorage.setItem('skillswap_token', token);
    setUser(u);
  };

  const login = useCallback(async (identifier, password) => {
    const { data } = await api.post('/auth/login', { identifier, password });
    persist(data.token, data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    persist(data.token, data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    disconnectSocket();
    localStorage.removeItem('skillswap_token');
    setUser(null);
  }, []);

  // Let other pages refresh the cached user (e.g. after editing the profile).
  const refreshUser = useCallback(async () => {
    const { data } = await api.get('/auth/me');
    setUser(data.user);
    return data.user;
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
