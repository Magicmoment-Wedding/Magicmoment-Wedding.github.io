import { getApiUrl } from "./config.js";

export function normalizeUser(user) {
  if (!user || typeof user !== "object") {
    return null;
  }

  const normalized = {
    ...user,
    onboardingCompleted: user.onboardingCompleted === true,
    freeGenerationEligible: user.freeGenerationEligible !== false,
    freeGenerationUsed: user.freeGenerationUsed === true,
    creditBalance: Number.isFinite(Number(user.creditBalance))
      ? Number(user.creditBalance)
      : Number.isFinite(Number(user.credits))
        ? Number(user.credits)
        : 0,
  };

  return normalized;
}

export async function fetchCurrentUser() {
  const response = await fetch(getApiUrl("/api/auth/me"), {
    method: "GET",
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok || data?.ok === false) {
    throw new Error(data?.message || "사용자 정보를 불러오지 못했습니다.");
  }

  return normalizeUser(data?.user ?? data);
}

export async function completeOnboarding() {
  const response = await fetch(getApiUrl("/api/auth/onboarding/complete"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.ok) {
    throw new Error(data?.message || "이용안내 완료 처리 실패");
  }

  return data;
}
