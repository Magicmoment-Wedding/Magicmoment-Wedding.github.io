import { getApiUrl } from "./config.js";

export const ANONYMOUS_ID_STORAGE_KEY = "magic_ai_anonymous_id";

function createAnonymousId() {
  const randomString = Math.random().toString(36).slice(2, 10);
  return `anonymous_${Date.now()}_${randomString}`;
}

export function getAnonymousId() {
  if (typeof window === "undefined") {
    return "";
  }

  const storedId = window.localStorage.getItem(ANONYMOUS_ID_STORAGE_KEY);
  if (storedId) {
    return storedId;
  }

  const nextId = createAnonymousId();
  window.localStorage.setItem(ANONYMOUS_ID_STORAGE_KEY, nextId);
  return nextId;
}

function normalizeCreditBalance(payload) {
  const value = payload?.credits ?? payload?.balance;
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : null;
}

async function parseJsonResponse(response) {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.message || `Credit API request failed: ${response.status}`);
  }

  return {
    ...payload,
    credits: normalizeCreditBalance(payload),
  };
}

export async function getCredits() {
  const response = await fetch(getApiUrl("/api/credits"), {
    headers: {
      "X-Anonymous-Id": getAnonymousId(),
    },
  });

  return parseJsonResponse(response);
}

export async function testChargeCredits(amount) {
  const response = await fetch(getApiUrl("/api/credits/test-charge"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Anonymous-Id": getAnonymousId(),
    },
    body: JSON.stringify({ amount }),
  });

  return parseJsonResponse(response);
}
