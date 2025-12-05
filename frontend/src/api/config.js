// src/api/config.js

const hostname = window.location.hostname;

const isLocal =
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname === "";

// In development we use Vite proxy → no need for full URL
const DEV_BASE_URL = "";

// In production we call the real backend
const PROD_BASE_URL = "https://apibizray.bnbdevelopment.hu";

// Choose correct base URL
const BASE_URL = isLocal ? DEV_BASE_URL : PROD_BASE_URL;

// Final API prefix used in every request
export const API_PREFIX = `${BASE_URL}/api/v1`;
