// src/AuthContext.js
import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({ isLoggedIn: false });

  // Placeholder for login function
  const login = (token) => {
    setAuth({ isLoggedIn: true, token });
  };

  // Placeholder for logout function
  const logout = () => {
    setAuth({ isLoggedIn: false, token: null });
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
