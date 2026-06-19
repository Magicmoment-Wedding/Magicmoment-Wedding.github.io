import { escapeHtml } from "../services/format.js";

export const WATERMARK_LOGO_SRC = "/images/brand/magic-ai-studio-logo-watermark.png";

export function shouldShowWatermarkOverlay(itemOrResult = {}) {
  const generationType =
    itemOrResult?.generationType ||
    itemOrResult?.generation_type ||
    itemOrResult?.result_payload?.generationType ||
    itemOrResult?.resultPayload?.generationType;

  const hasWatermark =
    itemOrResult?.hasWatermark === true ||
    itemOrResult?.has_watermark === true ||
    itemOrResult?.result_payload?.hasWatermark === true ||
    itemOrResult?.resultPayload?.hasWatermark === true;

  const watermarkStrategy =
    itemOrResult?.watermarkStrategy ||
    itemOrResult?.watermark_strategy ||
    itemOrResult?.result_payload?.watermarkStrategy ||
    itemOrResult?.resultPayload?.watermarkStrategy;
  const hasExplicitPaidType = generationType === "paid";
  const hasExplicitFreeFalse =
    itemOrResult?.isFreeGeneration === false ||
    itemOrResult?.is_free_generation === false ||
    itemOrResult?.usedFreeGeneration === false ||
    itemOrResult?.used_free_generation === false ||
    itemOrResult?.result_payload?.isFreeGeneration === false ||
    itemOrResult?.result_payload?.is_free_generation === false ||
    itemOrResult?.resultPayload?.isFreeGeneration === false ||
    itemOrResult?.resultPayload?.is_free_generation === false;

  if (hasExplicitPaidType || (hasExplicitFreeFalse && watermarkStrategy !== "frontend_overlay")) {
    return false;
  }

  const isFree =
    itemOrResult?.isFreeGeneration === true ||
    itemOrResult?.is_free_generation === true ||
    itemOrResult?.usedFreeGeneration === true ||
    itemOrResult?.used_free_generation === true ||
    generationType === "free";

  return isFree || hasWatermark || watermarkStrategy === "frontend_overlay";
}

export function renderWatermarkOverlay({ compact = false } = {}) {
  const style = compact
    ? "right:8px;bottom:8px;width:72px;max-width:38%;opacity:.84;filter:drop-shadow(0 8px 18px rgba(0,0,0,.16));pointer-events:none;"
    : "right:14px;bottom:14px;width:112px;max-width:34%;opacity:.84;filter:drop-shadow(0 8px 18px rgba(0,0,0,.16));pointer-events:none;";

  return `
    <div class="free-watermark-overlay absolute z-20" style="${style}">
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
