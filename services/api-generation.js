import { assertApiBaseUrlConfigured } from "./config.js";

function getGenerationMode(presetKey) {
  if (presetKey === "disney") return "disneyLive";
  return "parisSnap";
}

function getBackendPresetKey(presetKey) {
  if (presetKey === "disney") return "fairytale_royal_wedding";
  return presetKey || "paris_eiffel";
}

async function loadImageAsBlob(imageUrl) {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(`이미지 로드 실패: ${imageUrl}`);
  }

  return response.blob();
}

export async function generateImages(prompt, options = {}) {
  const {
    sourceImageUrl,
    count = 4,
    presetKey = "default",
  } = options;

  assertApiBaseUrlConfigured();
  const sourceImageBlob = await loadImageAsBlob(sourceImageUrl);
  const generationMode = getGenerationMode(presetKey);
  const backendPresetKey = getBackendPresetKey(presetKey);
  const formData = new FormData();
  formData.append("image", sourceImageBlob, "source.png");
  formData.append("mode", generationMode);
  formData.append("presetKey", backendPresetKey);
  formData.append("count", String(count));
  if (typeof prompt === "string" && prompt.trim()) {
    formData.append("prompt", prompt.trim());
  }

  const requestUrl = `${window.API_BASE_URL}/api/generate`;
  console.log("[generation] api generate request", {
    API_BASE_URL: window.API_BASE_URL,
    requestUrl,
    mode: generationMode,
    presetKey: backendPresetKey,
    promptLength: typeof prompt === "string" ? prompt.trim().length : 0,
  });
  const response = await fetch(`${window.API_BASE_URL}/api/generate`, {
    method: "POST",
    body: formData,
  });
  const payload = await response.json();

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.message || "image generation failed");
  }

  const resultItems = Array.isArray(payload.results) ? payload.results : [];
  const failedImages = Array.isArray(payload.failedImages) ? payload.failedImages : [];

  return resultItems.map((item, index) => {
    const failed = failedImages.find((failedImage) => failedImage?.index === item?.index);
    const url = item?.imageBase64 || "";

    if (item?.ok === false || !url) {
      return {
        url: "",
        status: "failed",
        errorMessage: item?.message || failed?.message || "이미지를 생성하지 못했어요.",
        variantLabel: item?.label || failed?.label || `결과 ${index + 1}`,
      };
    }

    return {
      url,
      status: "success",
      score: null,
      variantLabel: item?.label || `결과 ${index + 1}`,
    };
  });
}

export async function generateParisEiffelImage({ sourceImageUrl, prompt, presetKey = "paris_eiffel", analyzedMeta, ratioOption, customText, count = 4 }) {
  console.log("[generation] api request start", {
    presetKey,
    ratioOption,
    customText,
    analysisSource: analyzedMeta.source,
  });

  const generatedImages = await generateImages(prompt, {
    sourceImageUrl,
    count,
    presetKey,
  });

  console.log("[generation] api request complete", {
    presetKey,
    imageCount: generatedImages.length,
  });

  return generatedImages;
}
