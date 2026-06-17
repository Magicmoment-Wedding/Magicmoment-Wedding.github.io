import { escapeHtml } from "../services/format.js";

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

  if (generationType === "paid" && hasWatermark !== true && watermarkStrategy !== "frontend_overlay") {
    return false;
  }

  const isFree =
    itemOrResult?.isFreeGeneration === true ||
    itemOrResult?.is_free_generation === true ||
    generationType === "free";

  return isFree || hasWatermark || watermarkStrategy === "frontend_overlay";
}

export function renderWatermarkOverlay({ compact = false } = {}) {
  const style = compact
    ? "right:8px;bottom:8px;padding:6px 9px;border-radius:999px;background:rgba(255,255,255,0.68);color:#8f4f62;font-size:10px;font-weight:800;line-height:1;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:0 8px 24px rgba(0,0,0,0.12);pointer-events:none;"
    : "right:14px;bottom:14px;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,0.68);color:#8f4f62;font-size:12px;font-weight:800;line-height:1.1;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:0 8px 24px rgba(0,0,0,0.12);pointer-events:none;";

  return `
    <div class="free-watermark-overlay absolute z-20 flex flex-col items-center justify-center text-center" style="${style}">
      <strong class="block">Magic AI Studio</strong>
      ${compact ? "" : `<span class="block text-[10px] font-extrabold">Free Preview</span>`}
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
