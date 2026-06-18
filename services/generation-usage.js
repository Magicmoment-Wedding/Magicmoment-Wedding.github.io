import { formatNumber } from "./format.js";

export function getRemainingGenerationUses(stateOrUser = {}) {
  const user = stateOrUser.currentUser || stateOrUser;
  const value = user?.generationUsage?.remainingGenerationUses
    ?? user?.generation_usage?.remaining_generation_uses;
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? Math.max(0, Math.floor(numericValue)) : null;
}

export function formatRemainingGenerationUses(stateOrUser = {}, fallback = "확인 중...") {
  const remainingUses = getRemainingGenerationUses(stateOrUser);
  return remainingUses === null ? fallback : `${formatNumber(remainingUses)}회`;
}
