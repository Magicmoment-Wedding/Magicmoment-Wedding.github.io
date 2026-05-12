const DEFAULT_APP_CONFIG = {
  USE_REAL_AI: false,
  XAI_API_KEY: "",
  XAI_IMAGE_MODEL: "grok-imagine-image",
};

function readWindowConfig() {
  if (typeof window === "undefined" || !window.__APP_ENV__) {
    return {};
  }

  return window.__APP_ENV__;
}

function toBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return false;
}

export function getAppConfig() {
  const runtimeConfig = readWindowConfig();

  return {
    useRealAi: toBoolean(runtimeConfig.USE_REAL_AI ?? DEFAULT_APP_CONFIG.USE_REAL_AI),
    xAiApiKey: runtimeConfig.XAI_API_KEY ?? DEFAULT_APP_CONFIG.XAI_API_KEY,
    xAiImageModel: runtimeConfig.XAI_IMAGE_MODEL ?? DEFAULT_APP_CONFIG.XAI_IMAGE_MODEL,
  };
}

export function canUseRealAiForPreset(presetKey) {
  const config = getAppConfig();

  return config.useRealAi && presetKey === "paris_eiffel";
}
