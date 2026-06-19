(() => {
  const LOCAL_API_BASE_URL = "http://localhost:3000";
  const ONLINE_API_BASE_URL = "https://api.magicaistudio.co.kr";

  const API_BASE_URL =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? LOCAL_API_BASE_URL
      : ONLINE_API_BASE_URL;

  const SUPABASE_URL = window.SUPABASE_URL || "https://rzlvfuyzofzqghzooqsi.supabase.co";
  const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6bHZmdXl6b2Z6cWdoem9vcXNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NjkwOTMsImV4cCI6MjA5NDI0NTA5M30.xww7V8foHYvaTV_bbujFF-vvWuOiCUlJ_27FXq9BA3c";
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
})();
