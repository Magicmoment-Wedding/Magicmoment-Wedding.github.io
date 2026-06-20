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
  const SUPABASE_URL =
    window.SUPABASE_URL ||
    EXPECTED_SUPABASE_URL;
  const SUPABASE_ANON_KEY =
    window.SUPABASE_ANON_KEY ||
    "REPLACE_WITH_SUPABASE_ANON_OR_PUBLISHABLE_KEY";
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
