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
  try {
    const res = await fetch(makeUrl("/auth/register"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password }),
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));

      // Extract detailed error message
      let message = "Registration failed";

      if (errorBody.detail) {
        // Handle FastAPI validation errors (array format)
        if (Array.isArray(errorBody.detail)) {
          message = errorBody.detail.map(err => err.msg || err).join(", ");
        } else {
          // Handle string detail message
          message = errorBody.detail;
        }
      } else if (errorBody.message) {
        message = errorBody.message;
      }

      // Add status code for debugging
      if (res.status === 400) {
        // Bad request - validation or duplicate email
        throw new Error(message);
      } else if (res.status === 500) {
        throw new Error(`Server error: ${message}`);
      } else {
        throw new Error(`Registration failed (${res.status}): ${message}`);
      }
    }

    return res.json();
  } catch (error) {
    // Handle network errors
    if (error.message.includes("fetch")) {
      throw new Error("Network error: Unable to connect to server. Please check your connection.");
    }
    throw error;
  }
}



export async function loginRequest({ email, password }) {
  try {
    const res = await fetch(makeUrl("/auth/login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));

      // Extract detailed error message
      let message = "Login failed";

      if (errorBody.detail) {
        // Handle FastAPI validation errors (array format)
        if (Array.isArray(errorBody.detail)) {
          message = errorBody.detail.map(err => err.msg || err).join(", ");
        } else {
          // Handle string detail message
          message = errorBody.detail;
        }
      } else if (errorBody.message) {
        message = errorBody.message;
      }

      // Add status code context
      if (res.status === 401) {
        // Unauthorized - wrong credentials
        throw new Error(message);
      } else if (res.status === 500) {
        throw new Error(`Server error: ${message}`);
      } else {
        throw new Error(`Login failed (${res.status}): ${message}`);
      }
    }

    return res.json(); // { token, user }
  } catch (error) {
    // Handle network errors
    if (error.message.includes("fetch")) {
      throw new Error("Network error: Unable to connect to server. Please check your connection.");
    }
    throw error;
  }
}

export async function authFetch(path, options = {}) {
  const token = getAccessToken();

  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Ensure we're using the full URL with API_PREFIX if path starts with /api
  const url = path.startsWith('/api') ? makeUrl(path.replace('/api/v1', '')) : path;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}

export async function fetchCurrentUser() {
  try {
    const res = await authFetch("/api/v1/auth/me", {
      method: "GET",
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      const message = errorBody.detail || errorBody.message || "Failed to fetch user information";

      if (res.status === 401) {
        throw new Error("Session expired. Please log in again.");
      } else if (res.status === 404) {
        throw new Error("User not found. Please log in again.");
      } else {
        throw new Error(`${message} (${res.status})`);
      }
    }

    return res.json();
  } catch (error) {
    if (error.message.includes("fetch")) {
      throw new Error("Network error: Unable to connect to server. Please check your connection.");
    }
    throw error;
  }
}

export async function changePasswordRequest({ current_password, new_password }) {
  try {
    const res = await authFetch("/api/v1/auth/password", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ current_password, new_password }),
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      let message = "Failed to change password";

      if (errorBody.detail) {
        if (Array.isArray(errorBody.detail)) {
          message = errorBody.detail.map(err => err.msg || err).join(", ");
        } else {
          message = errorBody.detail;
        }
      } else if (errorBody.message) {
        message = errorBody.message;
      }

      if (res.status === 401) {
        throw new Error(message);
      } else if (res.status === 400) {
        throw new Error(message);
      } else if (res.status === 500) {
        throw new Error(`Server error: ${message}`);
      } else {
        throw new Error(`${message} (${res.status})`);
      }
    }

    return res.json();
  } catch (error) {
    if (error.message.includes("fetch")) {
      throw new Error("Network error: Unable to connect to server. Please check your connection.");
    }
    throw error;
  }
}

export async function changeUsernameRequest({ username }) {
  try {
    const res = await authFetch("/api/v1/auth/username", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      let message = "Failed to change username";

      if (errorBody.detail) {
        if (Array.isArray(errorBody.detail)) {
          message = errorBody.detail.map(err => err.msg || err).join(", ");
        } else {
          message = errorBody.detail;
        }
      } else if (errorBody.message) {
        message = errorBody.message;
      }

      if (res.status === 400) {
        throw new Error(message);
      } else if (res.status === 401) {
        throw new Error("Session expired. Please log in again.");
      } else if (res.status === 500) {
        throw new Error(`Server error: ${message}`);
      } else {
        throw new Error(`${message} (${res.status})`);
      }
    }

    return res.json();
  } catch (error) {
    if (error.message.includes("fetch")) {
      throw new Error("Network error: Unable to connect to server. Please check your connection.");
    }
    throw error;
  }
}

export async function deleteAccountRequest() {
  try {
    const res = await authFetch("/api/v1/auth/profile", {
      method: "DELETE",
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      const message = errorBody.detail || errorBody.message || "Failed to delete account";

      if (res.status === 401) {
        throw new Error("Session expired. Please log in again.");
      } else if (res.status === 404) {
        throw new Error("User not found.");
      } else if (res.status === 500) {
        throw new Error(`Server error: ${message}`);
      } else {
        throw new Error(`${message} (${res.status})`);
      }
    }

    return res.json();
  } catch (error) {
    if (error.message.includes("fetch")) {
      throw new Error("Network error: Unable to connect to server. Please check your connection.");
    }
    throw error;
  }
}

export async function toggleSubscriptionRequest() {
  try {
    const res = await authFetch("/api/v1/auth/subscription/toggle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      let message = "Failed to toggle subscription";

      if (errorBody.detail) {
        if (Array.isArray(errorBody.detail)) {
          message = errorBody.detail.map(err => err.msg || err).join(", ");
        } else {
          message = errorBody.detail;
        }
      } else if (errorBody.message) {
        message = errorBody.message;
      }

      if (res.status === 401) {
        throw new Error("Session expired. Please log in again.");
      } else if (res.status === 403) {
        throw new Error(message);
      } else if (res.status === 404) {
        throw new Error("User not found.");
      } else if (res.status === 500) {
        throw new Error(`Server error: ${message}`);
      } else {
        throw new Error(`${message} (${res.status})`);
      }
    }

    return res.json(); // { token, user }
  } catch (error) {
    if (error.message.includes("fetch")) {
      throw new Error("Network error: Unable to connect to server. Please check your connection.");
    }
    throw error;
  }
}
