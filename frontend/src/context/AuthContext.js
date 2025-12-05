// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import {
  registerRequest,
  loginRequest,
  fetchCurrentUser,
  storeAccessToken,
  clearAccessToken,
  getAccessToken,
} from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const isAuthenticated = !!user;

  // --------------------------------------------------
  // INITIAL LOAD → IF TOKEN EXISTS, LOAD THE USER
  // --------------------------------------------------
  useEffect(() => {
    async function init() {
      const token = getAccessToken();
      if (!token) {
        setLoadingUser(false);
        return;
      }

      try {
        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
      } catch (err) {
        clearAccessToken();
        setUser(null);
      }

      setLoadingUser(false);
    }

    init();
  }, []);

  // --------------------------------------------------
  // REGISTER
  // --------------------------------------------------
  async function register({ username, email, password }) {
    return registerRequest({ username, email, password });
  }

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------
  async function login({ email, password }) {
    const data = await loginRequest({ email, password });

    if (data.token) {
      storeAccessToken(data.token);
    }
    if (data.user) {
      setUser(data.user);
    }

    return data;
  }

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------
  function logout() {
    clearAccessToken();
    setUser(null);
  }

  const value = {
    user,
    isAuthenticated,
    loadingUser,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
