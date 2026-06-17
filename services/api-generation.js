import { assertApiBaseUrlConfigured, getApiUrl } from "./config.js";
import { getAnonymousId } from "./anonymous-id.js";

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

async function parseJsonResponseBody(response) {
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (!text) {
    return {
      ok: false,
      parseOk: false,
      data: null,
      rawText: "",
      message: "서버 응답이 비어 있습니다.",
    };
  }

  const trimmed = text.trim();
  const looksLikeJson =
    contentType.includes("application/json") ||
    trimmed.startsWith("{") ||
    trimmed.startsWith("[");

  if (!looksLikeJson) {
    console.error("[client][api][invalid-json-response]", {
      status: response.status,
      contentType,
      preview: text.slice(0, 300),
    });

    return {
      ok: false,
      parseOk: false,
      data: null,
      rawText: text,
      message: "서버가 올바르지 않은 응답을 반환했습니다.",
    };
  }

  try {
    return {
      ok: true,
      parseOk: true,
      data: JSON.parse(text),
      rawText: text,
    };
  } catch (error) {
    console.error("[client][api][json-parse-failed]", {
      status: response.status,
      contentType,
      preview: text.slice(0, 300),
      error,
    });

    return {
      ok: false,
      parseOk: false,
      data: null,
      rawText: text,
      message: "서버 응답을 읽지 못했습니다.",
    };
  }
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

  const requestUrl = getApiUrl("/api/generate");
  const anonymousId = getAnonymousId();
  console.log("[generation] api generate request", {
    API_BASE_URL: requestUrl.replace(/\/api\/generate$/, ""),
    requestUrl,
    mode: generationMode,
    presetKey: backendPresetKey,
    promptLength: typeof prompt === "string" ? prompt.trim().length : 0,
    hasAnonymousId: Boolean(anonymousId),
  });
  const response = await fetch(requestUrl, {
    method: "POST",
    credentials: "include",
    headers: {
      "X-Anonymous-Id": anonymousId,
    },
    body: formData,
  });
  const parsed = await parseJsonResponseBody(response);
  const payload = parsed.data || {};

  if (!response.ok || !parsed.parseOk || !payload?.ok) {
    const isInsufficientCredits =
      response.status === 402 ||
      payload?.status === 402 ||
      payload?.code === "INSUFFICIENT_CREDITS";
    const code = payload?.code || (!parsed.parseOk ? "INVALID_SERVER_RESPONSE" : "GENERATION_FAILED");
    const message =
      payload?.message ||
      parsed.message ||
      "생성 중 서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    console.error("[client][generate][failed]", {
      status: response.status,
      code,
      stage: payload?.stage,
      message,
      rawPreview: parsed.rawText?.slice(0, 300),
    });
    const error = new Error(message);
    error.statusCode = payload?.status || response.status;
    error.code = code || (isInsufficientCredits ? "INSUFFICIENT_CREDITS" : "");
    error.stage = payload?.stage;
    error.response = payload;
    error.rawPreview = parsed.rawText?.slice(0, 300);
    error.isInsufficientCredits = isInsufficientCredits;
    if (isInsufficientCredits) {
      error.publicMessage = payload?.message || "크레딧이 부족합니다. 충전 후 이용해 주세요.";
      error.requiredCredits = payload?.requiredCredits;
      error.currentCredits = payload?.currentCredits;
    } else if (error.code === "INVALID_SERVER_RESPONSE") {
      error.publicMessage = "서버 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    } else if (error.code === "WATERMARK_FAILED") {
      error.publicMessage = "무료 제작 워터마크 처리 중 문제가 발생했습니다. 무료 제작은 사용 처리되지 않았으니 잠시 후 다시 시도해 주세요.";
    } else if (error.code === "GENERATION_FAILED") {
      error.publicMessage = "생성 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    }
    throw error;
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
