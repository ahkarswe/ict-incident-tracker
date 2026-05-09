import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('ict_auth') ? JSON.parse(localStorage.getItem('ict_auth')).token : '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('ict_auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      setToken(parsed.token);
      setUser(parsed.user);
      api.get('/auth/me').then((res) => setUser(res.data.user)).catch(() => logout());
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('ict_auth', JSON.stringify(data));
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setToken('');
      setUser(null);
      localStorage.removeItem('ict_auth');
    }
  };

  const value = useMemo(() => ({ user, token, loading, login, logout, setUser }), [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
