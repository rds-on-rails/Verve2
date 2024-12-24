// src/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import config from './config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authData, setAuthData] = useState(() => {
    const token = localStorage.getItem(config.AUTH_TOKEN_KEY);
    const user = localStorage.getItem(config.USER_KEY);
    return token && user ? { token, user: JSON.parse(user) } : null;
  });

  useEffect(() => {
    if (authData) {
      localStorage.setItem(config.AUTH_TOKEN_KEY, authData.token);
      localStorage.setItem(config.USER_KEY, JSON.stringify(authData.user));
    } else {
      localStorage.removeItem(config.AUTH_TOKEN_KEY);
      localStorage.removeItem(config.USER_KEY);
    }
  }, [authData]);

  const logout = () => {
    setAuthData(null);
  };

  return (
    <AuthContext.Provider value={{ authData, setAuthData, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
