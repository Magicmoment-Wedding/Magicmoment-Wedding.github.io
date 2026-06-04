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
    return Array.isArray(data) ? data : data.items || data.images || data.data || [];
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
      styleCategory: metadata.styleCategory || metadata.style || "",
      presetKey: metadata.presetKey || metadata.locationPreset || "",
      presetLabel: metadata.presetLabel || "",
      resultLabel: metadata.resultLabel || metadata.title || "Uploaded Result",
      isRecommended: Boolean(metadata.isRecommended),
      originalImageUrl: metadata.originalImageUrl,
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
