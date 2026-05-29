/**
 * Gallery API Service
 * Handles communication with backend gallery endpoints
 */

const GALLERY_API_BASE = (window.API_BASE_URL || "").replace(/\/+$/, "");

export async function fetchGalleryImages() {
  try {
    const response = await fetch(`${GALLERY_API_BASE}/api/gallery`);
    if (!response.ok) {
      throw new Error(`Gallery fetch failed: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : data.images || [];
  } catch (error) {
    console.error("[gallery-api] fetch failed:", error);
    return [];
  }
}

export async function uploadGalleryImage(imageUrl, metadata = {}) {
  try {
    const payload = {
      imageUrl,
      title: metadata.title || "Uploaded Result",
      style: metadata.style || "",
      createdAt: new Date().toISOString(),
    };

    const response = await fetch(`${GALLERY_API_BASE}/api/gallery`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
    const response = await fetch(`${GALLERY_API_BASE}/api/gallery/${imageId}`, {
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
