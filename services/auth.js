import { getApiUrl } from "./config.js";

export function normalizeUser(user) {
  if (!user || typeof user !== "object") {
    return null;
  }

  const creditBalance = Number(user.creditBalance ?? user.credit_balance ?? user.credits ?? 0);
  const normalized = {
    ...user,
    isAdmin: user.isAdmin === true || user.is_admin === true,
    onboardingCompleted: user.onboardingCompleted ?? user.onboarding_completed ?? false,
    freeGenerationEligible: user.freeGenerationEligible ?? user.free_generation_eligible ?? false,
    freeGenerationUsed: user.freeGenerationUsed ?? user.free_generation_used ?? false,
    freeGenerationAvailable: user.freeGenerationAvailable ?? user.free_generation_available ?? false,
    creditBalance: Number.isFinite(creditBalance) ? creditBalance : 0,
  };

  return normalized;
}

export function isAdminUser(user) {
  return user?.isAdmin === true ||
    String(user?.email || "").toLowerCase().trim() === "vamprub@gmail.com";
}

export function isFirstTimeOnboardingTarget(user) {
  if (!user) {
    return false;
  }

  if (isAdminUser(user)) {
    return false;
  }

  return (
    user.onboardingCompleted === false &&
    user.freeGenerationEligible === true &&
    user.freeGenerationUsed !== true
  );
}

export function hasFreeGeneration(user) {
  if (!user) {
    return false;
  }

  if (isAdminUser(user)) {
    return false;
  }

  return (
    user.onboardingCompleted === true &&
    user.freeGenerationEligible === true &&
    user.freeGenerationUsed !== true
  );
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
