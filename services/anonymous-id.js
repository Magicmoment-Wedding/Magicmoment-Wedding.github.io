export const ANONYMOUS_ID_STORAGE_KEY = "magic_ai_anonymous_id";

let fallbackAnonymousId = "";

function createAnonymousId() {
  const randomString = Math.random().toString(36).slice(2, 10);
  return `anonymous_${Date.now()}_${randomString}`;
}

function getFallbackAnonymousId() {
  if (!fallbackAnonymousId) {
    fallbackAnonymousId = createAnonymousId();
  }

  return fallbackAnonymousId;
}

export function getAnonymousId() {
  if (typeof window === "undefined") {
    return getFallbackAnonymousId();
  }

  try {
    const storedId = window.localStorage.getItem(ANONYMOUS_ID_STORAGE_KEY);
    if (storedId) {
      return storedId;
    }

    const nextId = createAnonymousId();
    window.localStorage.setItem(ANONYMOUS_ID_STORAGE_KEY, nextId);
    return nextId;
  } catch (error) {
    return getFallbackAnonymousId();
  }
}
