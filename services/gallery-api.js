/**
 * Gallery API Service
 * Handles communication with backend gallery endpoints
 */

import { getApiUrl } from "./config.js";

const ANONYMOUS_ID_STORAGE_KEY = "magic_ai_anonymous_id";

function createAnonymousId() {
  const randomString = Math.random().toString(36).slice(2, 10);
  return `anonymous_${Date.now()}_${randomString}`;
}

function getAnonymousId() {
  if (typeof localStorage === "undefined") {
    return createAnonymousId();
  }

  const storedId = localStorage.getItem(ANONYMOUS_ID_STORAGE_KEY);
  if (storedId) return storedId;

  const nextId = createAnonymousId();
  localStorage.setItem(ANONYMOUS_ID_STORAGE_KEY, nextId);
  return nextId;
}

function normalizeUrlValue(value) {
  if (value === null || typeof value === "undefined") return "";

  const url = String(value).trim();
  if (!url || url.toLowerCase() === "null" || url.toLowerCase() === "undefined") return "";
  return url;
}

function firstUrlValue(...values) {
  return values.map(normalizeUrlValue).find(Boolean) || null;
}

function normalizeBrowserImageUrlValue(value) {
  const url = normalizeUrlValue(value);
  if (!url) return "";
  if (/^(https?:|data:image\/|blob:)/i.test(url) || url.startsWith("/")) return url;
  if (/^uploads\//i.test(url)) return "";
  return url;
}

function firstBrowserImageUrlValue(...values) {
  return values.map(normalizeBrowserImageUrlValue).find(Boolean) || null;
}

function normalizeGalleryItem(item) {
  if (!item) return null;

  const originalImageUrl = firstBrowserImageUrlValue(item.originalImageUrl, item.original_image_url);
  const originalThumbnailUrl = firstBrowserImageUrlValue(
    item.originalThumbnailUrl,
    item.originalImageUrl,
    item.original_thumbnail_url,
    item.original_image_url
  );

  return {
    ...item,
    originalImageUrl,
    originalThumbnailUrl,
    original_image_url: originalImageUrl,
    original_thumbnail_url: originalThumbnailUrl,
    generationType: item.generationType || item.generation_type || item.result_payload?.generationType || item.resultPayload?.generationType || "",
    isFreeGeneration: item.isFreeGeneration === true || item.is_free_generation === true,
    hasWatermark: item.hasWatermark === true || item.has_watermark === true || item.watermarked === true,
    watermarkRequired: item.watermarkRequired === true || item.watermark_required === true || item.result_payload?.watermarkRequired === true || item.result_payload?.watermark_required === true || item.resultPayload?.watermarkRequired === true || item.resultPayload?.watermark_required === true,
    watermarkStrategy: item.watermarkStrategy || item.watermark_strategy || item.result_payload?.watermarkStrategy || item.resultPayload?.watermarkStrategy || "",
  };
}

export async function fetchGalleryImages() {
  try {
    const response = await fetch(getApiUrl("/api/gallery"), {
      headers: {
        "X-Anonymous-Id": getAnonymousId(),
      },
    });
    if (!response.ok) {
      throw new Error(`Gallery fetch failed: ${response.status}`);
    }
    const data = await response.json();
    const items = Array.isArray(data) ? data : data.items || data.images || data.data || [];
    return items.map(normalizeGalleryItem).filter(Boolean);
  } catch (error) {
    console.error("[gallery-api] fetch failed:", error);
    return [];
  }
}

export async function uploadGalleryImage(imageUrl, metadata = {}) {
  try {
    const payload = {
      imageUrl,
      imagePath: metadata.imagePath,
      generationId: metadata.generationId || metadata.jobId || "",
      resultIndex: metadata.resultIndex,
      styleCategory: metadata.styleCategory || metadata.style || "",
      presetKey: metadata.presetKey || metadata.locationPreset || "",
      presetLabel: metadata.presetLabel || "",
      resultLabel: metadata.resultLabel || metadata.title || "Uploaded Result",
      isRecommended: Boolean(metadata.isRecommended),
      generationType: metadata.generationType || metadata.generation_type || "",
      isFreeGeneration: metadata.isFreeGeneration === true || metadata.is_free_generation === true,
      hasWatermark: metadata.hasWatermark === true || metadata.has_watermark === true,
      watermarkRequired: metadata.watermarkRequired === true || metadata.watermark_required === true,
      watermarkStrategy: metadata.watermarkStrategy || metadata.watermark_strategy || "",
      originalImageUrl: firstUrlValue(metadata.originalImageUrl),
      originalImagePath: metadata.originalImagePath ?? null,
      originalThumbnailUrl: firstUrlValue(metadata.originalThumbnailUrl, metadata.originalImageUrl),
    };

    const response = await fetch(getApiUrl("/api/gallery/upload"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Anonymous-Id": metadata.anonymousId || getAnonymousId(),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Upload failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("[gallery-api] upload failed:", error);
    throw error;
  }
}

export async function deleteGalleryImage(imageId) {
  try {
    const response = await fetch(getApiUrl(`/api/gallery/${imageId}`), {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error("[gallery-api] delete failed:", error);
    return false;
  }
}
