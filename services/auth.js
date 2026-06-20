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

function normalizeLinkedProviders(value, fallbackProvider = "") {
  const values = [];
  const seen = new Set();
  const addValue = (input) => {
    const normalized = String(input || "").trim().toLowerCase();
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    values.push(normalized);
  };

  if (Array.isArray(value)) {
    value.forEach(addValue);
  } else if (typeof value === "string") {
    value.split(/[,\s|/]+/).forEach(addValue);
  }

  if (!values.length && fallbackProvider) {
    addValue(fallbackProvider);
  }

  return values;
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
  const provider = String(user.provider ?? user.authProvider ?? user.auth_provider ?? "").trim().toLowerCase();
  const appUserId = String(user.appUserId ?? user.app_user_id ?? user.app_user?.id ?? "").trim();
  const authUserId = String(user.authUserId ?? user.auth_user_id ?? user.supabaseAuthUserId ?? user.supabase_auth_user_id ?? "").trim();
  const fallbackUserId = String(user.id ?? user.userId ?? user.user_id ?? "").trim();
  const linkedProviders = normalizeLinkedProviders(user.linkedProviders ?? user.linked_providers, provider);
  const normalizedId = appUserId || fallbackUserId || authUserId || "";
  const normalized = {
    ...user,
    id: normalizedId,
    userId: normalizedId,
    user_id: normalizedId,
    appUserId: appUserId || null,
    app_user_id: appUserId || null,
    authUserId: authUserId || fallbackUserId || normalizedId || null,
    auth_user_id: authUserId || fallbackUserId || normalizedId || null,
    provider,
    authProvider: provider,
    auth_provider: provider,
    linkedProviders,
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
  return user?.isAdmin === true;
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
  let accessToken = "";
  try {
    const tokenGetter = window.getMagicAiStudioSupabaseAccessToken;
    if (typeof tokenGetter === "function") {
      accessToken = String(await tokenGetter() || "").trim();
    }
  } catch (error) {
    accessToken = "";
  }

  const headers = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(getApiUrl("/api/auth/me"), {
    method: "GET",
    credentials: "include",
    headers,
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
