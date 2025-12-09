// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import {
  registerRequest,
  loginRequest,
  storeAccessToken,
  clearAccessToken,
  getAccessToken,
  fetchCurrentUser
} from "../api/auth";

const AuthContext = createContext(null);

// Helper functions outside component to avoid dependency issues
function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to parse JWT", e);
    return null;
  }
}

function isTokenExpired(token) {
  try {
    const payload = parseJwt(token);
    if (!payload || !payload.exp) {
      return true;
    }
    // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
    return payload.exp * 1000 < Date.now();
  } catch (e) {
    console.error("Failed to check token expiration", e);
    return true;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    async function init() {
      const token = getAccessToken();
      // console.log("[Auth init] token from localStorage:", token);

      if (!token) {
        setLoadingUser(false);
        return;
      }

      // Check if token is expired before making API call
      if (isTokenExpired(token)) {
        console.log("[Auth init] Token is expired, clearing...");
        clearAccessToken();
        setUser(null);
        setLoadingUser(false);
        return;
      }

      try {
        const currentUser = await fetchCurrentUser();
        // console.log("[Auth init] fetched current user:", currentUser);
        setUser(currentUser);
      } catch (err) {
        console.error("[Auth init] fetchCurrentUser error:", err);

        // Only clear token if it's an authentication error (401/403)
        // Don't clear on network errors or temporary issues
        if (err.message && (err.message.includes("401") || err.message.includes("Session expired") || err.message.includes("User not found"))) {
          console.log("[Auth init] Token is invalid, clearing...");
          clearAccessToken();
          setUser(null);
        } else {
          // For network errors or other issues, keep the token and try again later
          // This prevents logging users out due to temporary network issues
          console.log("[Auth init] Non-auth error, keeping token for retry");
        }
      }

      setLoadingUser(false);
    }

    init();
  }, []);

  // Periodic token validation - check every minute if token is still valid
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      const token = getAccessToken();
      if (!token || isTokenExpired(token)) {
        console.log("[Auth] Token expired during session, logging out...");
        logout();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user]);
  
  async function register({ username, email, password }) {
    return registerRequest({ username, email, password });
  }

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------
  async function login({ email, password }) {
    const data = await loginRequest({ email, password });
    // console.log("Inital Data: ",data)


    if (data.token) {
      // console.log("Acces token now: ", data.token)
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
