// src/api/auth.js

const API_PREFIX = "/api/v1";

const ACCESS_TOKEN_KEY = "access_token";

// ----------------------
// TOKEN HELPERS
// ----------------------
export function storeAccessToken(token) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

// Kleine Hilfsfunktion für URLs
function makeUrl(path) {
  // path immer mit "/" beginnen: z.B. "/auth/login/"
  return `${API_PREFIX}${path}`;
}

// ----------------------
// REGISTER
// ----------------------
export async function registerRequest({ username, email, password }) {
  const res = await fetch(makeUrl("/auth/register/"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, email, password }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    console.error("Registration error details:", errorBody);
    const message =
      errorBody.detail?.[0]?.msg ||
      errorBody.detail ||
      errorBody.message ||
      "Registration failed";
    throw new Error(message);
  }

  return res.json();
}

// ----------------------
// LOGIN
// ----------------------
export async function loginRequest({ email, password }) {
  const res = await fetch(makeUrl("/auth/login/"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    console.error("Login error details:", errorBody);
    const message =
      errorBody.detail?.[0]?.msg ||
      errorBody.detail ||
      errorBody.message ||
      "Login failed";
    throw new Error(message);
  }

  
  return res.json(); // { token, user }
}

// ----------------------
// AUTH-FETCH
// ----------------------
export async function authFetch(path, options = {}) {
  const token = getAccessToken();

  console.log("==================================================");
  console.log("[authFetch] REQUEST OUT");
  console.log("→ URL:", path);
  console.log("→ Token from localStorage:", token);
  console.log("→ Full Authorization header:", `Bearer ${token}`);
  console.log("==================================================");

  const headers = {
    ...(options.headers || {}),
  };

  
  console.log("HEADERRRR before token:::___________________", headers)

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  console.log("HEADERRRR after token:::___________________", headers)

  const response = await fetch(path, {
    ...options,
    headers,
  });

  console.log("[authFetch] RESPONSE STATUS:", response.status);
  console.log("==================================================");

  return response;
}


// ----------------------
// CURRENT USER
// ----------------------
export async function fetchCurrentUser() {
  const res = await authFetch("/api/v1/auth/me/", {
    method: "GET",
  });

  if (!res.ok) {
    console.error("fetchCurrentUser failed with status:", res.status);
    throw new Error("Failed to fetch current user");
  }

  return res.json(); // direkt der User laut Doku
}
