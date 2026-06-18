import { getApiUrl } from "./config.js";

function toBoolean(value, fallback = false) {
  if (value === true || value === "true" || value === 1 || value === "1") {
    return true;
  }
  if (value === false || value === "false" || value === 0 || value === "0") {
    return false;
  }
  return fallback;
}

function toNullableUses(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? Math.max(0, Math.floor(numericValue)) : null;
}

function normalizeGenerationUsage(user) {
  const source = user?.generationUsage ?? user?.generation_usage ?? {};
  const remainingGenerationUses = toNullableUses(
    source.remainingGenerationUses ?? source.remaining_generation_uses,
  );
  const paidRemainingGenerationUses = toNullableUses(
    source.paidRemainingGenerationUses ?? source.paid_remaining_generation_uses,
  );

  return {
    ...source,
    remainingGenerationUses,
    paidRemainingGenerationUses,
    freeGenerationAvailable: toBoolean(
      source.freeGenerationAvailable ?? source.free_generation_available,
      false,
    ),
    freeGenerationUsed: toBoolean(
      source.freeGenerationUsed ?? source.free_generation_used,
      false,
    ),
    nearestPassExpiresAt: source.nearestPassExpiresAt ?? source.nearest_pass_expires_at ?? "",
  };
}

export function normalizeUser(user) {
  if (!user || typeof user !== "object") {
    return null;
  }

  const generationUsage = normalizeGenerationUsage(user);
  const isAdmin = toBoolean(user.isAdmin ?? user.is_admin, false);
  const isLegacyUser = toBoolean(user.isLegacyUser ?? user.is_legacy_user, false);
  const consentRequired = toBoolean(user.consentRequired ?? user.consent_required, false);
  const normalized = {
    ...user,
    isAdmin,
    isLegacyUser,
    consentRequired: isAdmin || isLegacyUser ? false : consentRequired,
    hasRequiredConsents: isAdmin || isLegacyUser
      ? true
      : toBoolean(user.hasRequiredConsents ?? user.has_required_consents, true),
    onboardingCompleted: toBoolean(user.onboardingCompleted ?? user.onboarding_completed, false),
    freeGenerationEligible: toBoolean(user.freeGenerationEligible ?? user.free_generation_eligible, false),
    freeGenerationUsed: generationUsage.freeGenerationUsed,
    freeGenerationAvailable: generationUsage.freeGenerationAvailable,
    generationUsage,
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

  return user.onboardingCompleted === false;
}

export function hasFreeGeneration(user) {
  return Boolean(user?.generationUsage?.freeGenerationAvailable === true);
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

  const rawUser = data?.user ?? data?.data?.user ?? data;
  const generationUsage = rawUser?.generationUsage
    ?? rawUser?.generation_usage
    ?? data?.generationUsage
    ?? data?.generation_usage
    ?? data?.data?.generationUsage
    ?? data?.data?.generation_usage;

  return normalizeUser({
    ...rawUser,
    generationUsage,
  });
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
