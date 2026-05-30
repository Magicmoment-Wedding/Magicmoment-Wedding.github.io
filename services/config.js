const DEFAULT_APP_CONFIG = {
  API_ENABLED_PRESETS: ["paris_eiffel", "disney"],
};
const LOCAL_API_BASE_URL = "http://localhost:3000";
const ONLINE_API_BASE_URL = "https://api.magicaistudio.co.kr";

function getRuntimeApiConfig() {
  if (typeof window === "undefined") {
    return {};
  }

  return {
    ...(window.MAGIC_AI_STUDIO_CONFIG || {}),
    API_BASE_URL: window.API_BASE_URL || window.MAGIC_AI_STUDIO_CONFIG?.API_BASE_URL,
  };
}

function getLocalApiBaseUrl() {
  return LOCAL_API_BASE_URL;
}

export function getApiBaseUrl() {
  const runtimeConfig = getRuntimeApiConfig();
  const isLocal =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  const fallbackUrl = isLocal ? getLocalApiBaseUrl() : ONLINE_API_BASE_URL;
  return String(runtimeConfig.API_BASE_URL || fallbackUrl).replace(/\/+$/, "");
}

export function isOnlineApiPlaceholder() {
  return false;
}

export function assertApiBaseUrlConfigured() {
  if (!isOnlineApiPlaceholder()) return;

  const error = new Error("ONLINE_API_BASE_URL_PLACEHOLDER");
  error.publicMessage = "온라인 생성 서버 주소가 아직 설정되지 않았어요.";
  throw error;
}

export function getApiUrl(path) {
  return `${getApiBaseUrl()}${path}`;
}

export function canUseApiGenerationForPreset(presetKey) {
  return DEFAULT_APP_CONFIG.API_ENABLED_PRESETS.includes(presetKey) && !isOnlineApiPlaceholder();
}
