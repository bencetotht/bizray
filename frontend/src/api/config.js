

const hostname = window.location.hostname;

const isLocal =
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname === "";

const DEV_BASE_URL = "";

const PROD_BASE_URL = "https://apibizray.bnbdevelopment.hu";

const BASE_URL = isLocal ? DEV_BASE_URL : PROD_BASE_URL;

export const API_PREFIX = `${BASE_URL}/api/v1`;
