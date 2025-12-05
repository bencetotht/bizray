// src/api/auth.js

import {API_PREFIX} from "./config"

// const API_PREFIX = "/api/v1";

const ACCESS_TOKEN_KEY = "access_token";

// --------------------------------------------------
// TOKEN HELPERS
// --------------------------------------------------

export function storeAccessToken(token) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

// --------------------------------------------------
// REGISTRATION
// --------------------------------------------------

export async function registerRequest({ username, email, password }) {
//   const res = await fetch(`${API_PREFIX}/auth/register/`, {
    const res = await fetch(`https://apibizray.bnbdevelopment.hu/api/v1/auth/register/`, {
    
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || "Registration failed");
  }

  return res.json();
}

// --------------------------------------------------
// LOGIN
// --------------------------------------------------

export async function loginRequest({ email, password }) {
  const res = await fetch(`${API_PREFIX}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || "Login failed");
  }

  return res.json(); // expected: { token, user }
}

// --------------------------------------------------
// AUTHENTICATED FETCH
// --------------------------------------------------

export async function authFetch(path, options = {}) {
  const token = getAccessToken();

  const headers = { ...(options.headers || {}) };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(`${API_PREFIX}${path}`, {
    ...options,
    headers,
  });
}

// --------------------------------------------------
// FETCH CURRENT USER
// --------------------------------------------------

export async function fetchCurrentUser() {
  const res = await authFetch("/auth/me/", { method: "GET" });

  if (!res.ok) {
    throw new Error("Failed to fetch current user");
  }

  return res.json();
}
