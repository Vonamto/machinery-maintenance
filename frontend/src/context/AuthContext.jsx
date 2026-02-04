// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { login as apiLogin } from '../api/api';
import CONFIG from '../config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  // Keep localStorage in sync
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  // Check token expiration on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiresAt = payload.exp * 1000; // Convert to milliseconds
        
        // Check if token is already expired
        if (Date.now() >= expiresAt) {
          console.log('Token expired on load, logging out...');
          // Clear everything
          setToken(null);
          setUser(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Redirect to login
          window.location.href = '/login';
        }
      } catch (e) {
        console.error('Invalid token format on load:', e);
        // Clear invalid token
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
  }, []); // Run once on mount

  // login helper - calls backend and stores token + user
  async function login(username, password) {
    setLoading(true);
    try {
      const res = await apiLogin(username, password);
      if (res && res.status === 'success') {
        setToken(res.token);
        setUser(res.user);
        return { ok: true, user: res.user };
      } else {
        // backend returns { message }
        return { ok: false, message: res?.message || 'Login failed' };
      }
    } catch (err) {
      return { ok: false, message: String(err) };
    } finally {
      setLoading(false);
    }
  }

  // logout helper
  function logout() {
    setToken(null);
    setUser(null);
    // localStorage is synced by useEffect above
    // redirect handled by pages that call logout
  }

  // simple wrapper to get authenticated fetch headers
  function authHeaders() {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }

  const value = {
    token,
    user,
    loading,
    login,
    logout,
    authHeaders,
    isLoggedIn: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
