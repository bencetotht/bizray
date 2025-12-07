


import { API_PREFIX } from "./config";

const ACCESS_TOKEN_KEY = "access_token";




export function storeAccessToken(token) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}


function makeUrl(path) {
  return `${API_PREFIX}${path}`;
}

export async function registerRequest({ username, email, password }) {
  console.log("makeURL FOR REGISTER:: ::: ", makeUrl("/auth/register/"))
  
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



export async function authFetch(path, options = {}) {
  const token = getAccessToken();

  console.log("==================================================");
  console.log("[authFetch] REQUEST");
  console.log("→ URL:", path);
  console.log("→ Token exists:", !!token);
  console.log("→ Token preview:", token ? token.substring(0, 20) + "..." : "NO TOKEN");
  console.log("==================================================");

  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    console.error("⚠️ NO TOKEN FOUND - Request will fail!");
  }

  console.log("→ Headers being sent:", headers);

  const response = await fetch(path, {
    ...options,
    headers,
  });

  console.log("[authFetch] RESPONSE STATUS:", response.status);
  console.log("==================================================");

  return response;
}



export async function fetchCurrentUser() {
  const res = await authFetch("/api/v1/auth/me", {
    method: "GET",
  });

  if (!res.ok) {
    console.error("fetchCurrentUser failed with status:", res.status);
    throw new Error("Failed to fetch current user");
  }

  return res.json();
  
}
