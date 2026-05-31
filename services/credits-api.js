import { getApiUrl } from "./config.js";
import { getAnonymousId } from "./anonymous-id.js";
export { ANONYMOUS_ID_STORAGE_KEY, getAnonymousId } from "./anonymous-id.js";

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
  const creditAmount = Number(amount);

  if (!Number.isFinite(creditAmount) || creditAmount <= 0) {
    throw new Error("Invalid credit charge amount");
  }

  const response = await fetch(getApiUrl("/api/credits/test-charge"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Anonymous-Id": getAnonymousId(),
    },
    body: JSON.stringify({ amount: creditAmount }),
  });

  return parseJsonResponse(response);
}
