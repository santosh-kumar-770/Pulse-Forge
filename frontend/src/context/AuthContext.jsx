import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('pulseforge_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('pulseforge_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const profile = await authApi.getMe();
          setUser(profile);
          localStorage.setItem('pulseforge_user', JSON.stringify(profile));
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    }

    loadUser();

    const handleLogoutEvent = () => logout();
    window.addEventListener('pulseforge-auth-logout', handleLogoutEvent);
    return () => window.removeEventListener('pulseforge-auth-logout', handleLogoutEvent);
  }, [token]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem('pulseforge_token', res.access_token);
    localStorage.setItem('pulseforge_user', JSON.stringify(res.user));
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const signup = async (userData) => {
    const res = await authApi.signup(userData);
    if (res.access_token && res.user) {
      localStorage.setItem('pulseforge_token', res.access_token);
      localStorage.setItem('pulseforge_user', JSON.stringify(res.user));
      setToken(res.access_token);
      setUser(res.user);
    }
    return res;
  };

  const verifyEmail = async (email, code) => {
    const res = await authApi.verifyEmail({ email, code });
    localStorage.setItem('pulseforge_token', res.access_token);
    localStorage.setItem('pulseforge_user', JSON.stringify(res.user));
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const resendCode = async (email) => {
    return await authApi.resendCode({ email });
  };

  const logout = () => {
    localStorage.removeItem('pulseforge_token');
    localStorage.removeItem('pulseforge_user');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    const updated = await authApi.updateProfile(profileData);
    setUser(updated);
    localStorage.setItem('pulseforge_user', JSON.stringify(updated));
    return updated;
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, verifyEmail, resendCode, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
