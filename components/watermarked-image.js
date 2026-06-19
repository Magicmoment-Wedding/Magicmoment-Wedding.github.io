import { escapeHtml } from "../services/format.js";

export const WATERMARK_LOGO_SRC = "/images/brand/magic-ai-studio-watermark-white.png";

function normalizeWatermarkStrategy(value) {
  return String(value || "").trim().toLowerCase();
}

export function shouldShowWatermarkOverlay(itemOrResult = {}) {
  const generationType =
    itemOrResult?.generationType ||
    itemOrResult?.generation_type ||
    itemOrResult?.result_payload?.generationType ||
    itemOrResult?.resultPayload?.generationType;

  const hasWatermark =
    itemOrResult?.hasWatermark === true ||
    itemOrResult?.has_watermark === true ||
    itemOrResult?.watermarkRequired === true ||
    itemOrResult?.watermark_required === true ||
    itemOrResult?.result_payload?.hasWatermark === true ||
    itemOrResult?.result_payload?.watermarkRequired === true ||
    itemOrResult?.result_payload?.watermark_required === true ||
    itemOrResult?.resultPayload?.hasWatermark === true ||
    itemOrResult?.resultPayload?.watermarkRequired === true ||
    itemOrResult?.resultPayload?.watermark_required === true;

  const watermarkStrategy =
    normalizeWatermarkStrategy(
      itemOrResult?.watermarkStrategy ||
      itemOrResult?.watermark_strategy ||
      itemOrResult?.result_payload?.watermarkStrategy ||
      itemOrResult?.resultPayload?.watermarkStrategy,
    );
  const hasExplicitPaidType = generationType === "paid";
  const hasFrontendOverlay = watermarkStrategy === "frontend_overlay";
  const hasNoFrontendOverlay = watermarkStrategy === "none" || watermarkStrategy === "backend_baked";
  const hasWatermarkRequiredTrue =
    itemOrResult?.watermarkRequired === true ||
    itemOrResult?.watermark_required === true ||
    itemOrResult?.result_payload?.watermarkRequired === true ||
    itemOrResult?.result_payload?.watermark_required === true ||
    itemOrResult?.resultPayload?.watermarkRequired === true ||
    itemOrResult?.resultPayload?.watermark_required === true;
  const hasExplicitFreeFalse =
    itemOrResult?.isFreeGeneration === false ||
    itemOrResult?.is_free_generation === false ||
    itemOrResult?.usedFreeGeneration === false ||
    itemOrResult?.used_free_generation === false ||
    itemOrResult?.watermarkRequired === false ||
    itemOrResult?.watermark_required === false ||
    itemOrResult?.result_payload?.isFreeGeneration === false ||
    itemOrResult?.result_payload?.is_free_generation === false ||
    itemOrResult?.result_payload?.watermarkRequired === false ||
    itemOrResult?.result_payload?.watermark_required === false ||
    itemOrResult?.resultPayload?.isFreeGeneration === false ||
    itemOrResult?.resultPayload?.is_free_generation === false ||
    itemOrResult?.resultPayload?.watermarkRequired === false ||
    itemOrResult?.resultPayload?.watermark_required === false;

  if (hasExplicitPaidType || hasNoFrontendOverlay || (hasExplicitFreeFalse && !hasFrontendOverlay && !hasWatermarkRequiredTrue)) {
    return false;
  }

  const isFree =
    itemOrResult?.isFreeGeneration === true ||
    itemOrResult?.is_free_generation === true ||
    itemOrResult?.usedFreeGeneration === true ||
    itemOrResult?.used_free_generation === true ||
    generationType === "free";

  return isFree || hasWatermark || hasFrontendOverlay || hasWatermarkRequiredTrue;
}

export function renderWatermarkOverlay({ compact = false } = {}) {
  const style = compact
    ? "right:10px;bottom:10px;width:clamp(56px,16%,86px);opacity:.58;filter:brightness(0) invert(1) drop-shadow(0 2px 8px rgba(0,0,0,.38));pointer-events:none;user-select:none;"
    : "right:18px;bottom:18px;width:clamp(56px,11%,110px);opacity:.58;filter:brightness(0) invert(1) drop-shadow(0 2px 8px rgba(0,0,0,.38));pointer-events:none;user-select:none;";

  return `
    <div class="free-watermark-overlay free-watermark-logo absolute z-20" style="${style}">
      <img
        src="${WATERMARK_LOGO_SRC}"
        alt=""
        decoding="async"
        class="block w-full h-auto"
        onerror="console.warn('[watermark] logo image failed to load', this.currentSrc || this.src); this.closest('.free-watermark-overlay')?.remove();"
      />
    </div>
  `;
}

export function renderWatermarkedImage({
  src,
  alt,
  imageClassName,
  showWatermark,
  compact = false,
}) {
  return `
    <img alt="${escapeHtml(alt ?? "")}" class="${escapeHtml(imageClassName ?? "")}" src="${escapeHtml(src ?? "")}" />
    ${showWatermark ? renderWatermarkOverlay({ compact }) : ""}
  `;
}
