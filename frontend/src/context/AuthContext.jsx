// context/AuthContext.jsx
// Global authentication state management

import React, { createContext, useContext, useState, useCallback } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("gw_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem("gw_token") || null);

  const login = useCallback(async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    const { token: newToken, user: newUser } = response.data;

    localStorage.setItem("gw_token", newToken);
    localStorage.setItem("gw_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);

    return response.data;
  }, []);

  const signup = useCallback(async (email, password) => {
    const response = await api.post("/auth/signup", { email, password });
    const { token: newToken, user: newUser } = response.data;

    localStorage.setItem("gw_token", newToken);
    localStorage.setItem("gw_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);

    return response.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("gw_token");
    localStorage.removeItem("gw_user");
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = Boolean(token && user);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export default AuthContext;
