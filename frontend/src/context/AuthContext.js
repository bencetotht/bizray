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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const isAuthenticated = !!user;

  // --------------------------------------------------
  // INITIAL LOAD → IF TOKEN EXISTS, LOAD THE USER
  // --------------------------------------------------

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



  // useEffect(() => {
  //   async function init() {
  //     const token = getAccessToken();
  //     if (!token) {
  //       setLoadingUser(false);
  //       return;
  //     }

  //     try {
  //       const currentUser = await fetchCurrentUser();
  //       setUser(currentUser);
  //     } catch (err) {
  //       clearAccessToken();
  //       setUser(null);
  //     }

  //     setLoadingUser(false);
  //   }

  //   init();
  // }, []);


//   useEffect(() => {
//   function init() {
//     const token = getAccessToken();
//     if (!token) {
//       setLoadingUser(false);
//       return;
//     }

//     const payload = parseJwt(token);
//     if (!payload) {
//       clearAccessToken();
//       setUser(null);
//       setLoadingUser(false);
//       return;
//     }

//     // Build a user object from JWT payload
//     const currentUser = {
//       id: payload.user_id,
//       uuid: payload.uuid,
//       email: payload.email,
//       role: payload.role,
//       username: payload.username
//       // optional: you can add username if backend starts putting it into JWT
//     };

//     setUser(currentUser);
//     setLoadingUser(false);
//   }

//   init();
// }, []);


  // --------------------------------------------------
  // REGISTER
  // --------------------------------------------------
  
  // src/context/AuthContext.jsx
// useEffect(() => {
//   async function init() {
//     const token = getAccessToken();

//     if (!token) {
//       setLoadingUser(false);
//       return;
//     }

//     try {
//       const currentUser = await fetchCurrentUser();  // 👈 uses token
//       setUser(currentUser);
//     } catch (err) {
//       clearAccessToken();
//       setUser(null);
//     }

//     setLoadingUser(false);
//   }

//   init();
// }, []);


useEffect(() => {
  async function init() {
    const token = getAccessToken();
    console.log("[Auth init] token from localStorage:", token);

    if (!token) {
      setLoadingUser(false);
      return;
    }

    try {
      const currentUser = await fetchCurrentUser();
      console.log("[Auth init] fetched current user:", currentUser);
      setUser(currentUser);
    } catch (err) {
      console.error("[Auth init] fetchCurrentUser error:", err);
      // vorübergehend: Token NICHT löschen, damit wir debuggen können
      // clearAccessToken();
      setUser(null);
    }

    setLoadingUser(false);
  }

  init();
}, []);




  
  async function register({ username, email, password }) {
    return registerRequest({ username, email, password });
  }

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------
  async function login({ email, password }) {
    const data = await loginRequest({ email, password });
    console.log("Inital Data: ",data)


    if (data.token) {
      console.log("Acces token now: ", data.token)
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
