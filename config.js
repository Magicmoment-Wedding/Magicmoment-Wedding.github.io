const LOCAL_API_BASE_URL = "http://localhost:3000";
const ONLINE_API_BASE_URL = "https://api.magicaistudio.co.kr";

const API_BASE_URL =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? LOCAL_API_BASE_URL
    : ONLINE_API_BASE_URL;

const SUPABASE_URL = window.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || "";
const GOOGLE_LOGIN_ENABLED = window.GOOGLE_LOGIN_ENABLED !== false;

window.API_BASE_URL = API_BASE_URL;
console.log("[front] API_BASE_URL", window.API_BASE_URL);

window.MAGIC_AI_STUDIO_CONFIG = {
  API_BASE_URL,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  GOOGLE_LOGIN_ENABLED,
  IS_API_PLACEHOLDER: false,
  IS_ONLINE_API_PLACEHOLDER: false,
};
