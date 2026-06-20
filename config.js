(() => {
  /*
   * Supabase anon/publishable key 확인 위치:
   * Supabase Dashboard -> Project Settings -> API Keys
   * 또는 Supabase Dashboard -> Project Settings -> Data API / API Keys
   *
   * 프런트에 넣을 수 있는 키:
   * - anon public key
   * - publishable key
   *
   * 프런트에 넣으면 안 되는 키:
   * - service_role
   * - secret key
   * - JWT secret
   * - Google Client Secret
   */
  const LOCAL_API_BASE_URL = "http://localhost:3000";
  const ONLINE_API_BASE_URL = "https://api.magicaistudio.co.kr";
  const ONLINE_APP_ORIGIN = "https://magicaistudio.co.kr";
  const EXPECTED_SUPABASE_URL = "https://rzlvfuyzofzqghzooqsi.supabase.co";

  function normalizeAppOrigin(value) {
    try {
      return new URL(String(value || ONLINE_APP_ORIGIN)).origin;
    } catch (error) {
      return ONLINE_APP_ORIGIN;
    }
  }

  const API_BASE_URL =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? LOCAL_API_BASE_URL
      : ONLINE_API_BASE_URL;

  const APP_ORIGIN = normalizeAppOrigin(
    window.APP_ORIGIN || window.MAGIC_AI_STUDIO_CONFIG?.APP_ORIGIN,
  );
  const SUPABASE_URL = EXPECTED_SUPABASE_URL;
  // 여기에 Supabase Dashboard에서 복사한 anon public key 또는 publishable key를 붙여넣으세요.
  // 절대 service_role / secret key / JWT secret / Google Client Secret을 넣지 마세요.
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6bHZmdXl6b2Z6cWdoem9vcXNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NjkwOTMsImV4cCI6MjA5NDI0NTA5M30.xww7V8foHYvaTV_bbujFF-vvWuOiCUlJ_27FXq9BA3c";
  const GOOGLE_LOGIN_ENABLED = window.GOOGLE_LOGIN_ENABLED !== false;

  window.API_BASE_URL = API_BASE_URL;
  window.APP_ORIGIN = APP_ORIGIN;
  console.log("[front] API_BASE_URL", window.API_BASE_URL);
  console.info("[supabase][config]", {
    supabaseUrl: SUPABASE_URL,
    hasAnonKey: Boolean(SUPABASE_ANON_KEY),
    anonKeyPrefix: SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.slice(0, 8) : null,
    anonKeyLength: SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.length : 0,
  });

  window.MAGIC_AI_STUDIO_CONFIG = {
    API_BASE_URL,
    APP_ORIGIN,
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    GOOGLE_LOGIN_ENABLED,
    IS_API_PLACEHOLDER: false,
    IS_ONLINE_API_PLACEHOLDER: false,
  };
})();
