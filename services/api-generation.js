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

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function resolveJobId(payload = {}) {
  return String(payload.jobId || payload.job_id || payload.data?.jobId || payload.data?.job_id || "").trim();
}

function getJobStatus(payload = {}) {
  return String(payload.status || payload.jobStatus || payload.job_status || payload.state || payload.data?.status || "").toLowerCase();
}

function extractJobResult(payload = {}, jobId = "") {
  const candidates = [
    payload.result,
    payload.generationResult,
    payload.data?.result,
    payload.data?.generationResult,
    payload.data,
    payload,
  ];
  const result = candidates.find((candidate) => (
    candidate &&
    typeof candidate === "object" &&
    (Array.isArray(candidate.results) || Array.isArray(candidate.imageUrls) || Array.isArray(candidate.image_urls))
  ));

  return result ? { ...result, ok: result.ok !== false, jobId } : null;
}

function getJobFailureMessage(code, fallback = "") {
  if (code === "FREE_GENERATION_NOT_AVAILABLE") {
    return "무료 제작을 사용할 수 없습니다. 계정 상태를 다시 확인해 주세요.";
  }
  if (code === "WATERMARK_FAILED" || code === "WATERMARK_LOGO_NOT_FOUND") {
    return "무료 제작 워터마크 처리 중 문제가 발생했습니다. 무료 제작은 사용 처리되지 않았으니 잠시 후 다시 시도해 주세요.";
  }
  if (code === "INVALID_SERVER_RESPONSE") {
    return "서버 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
  }
  return fallback || "생성 중 문제가 발생했습니다. 이용권은 사용 처리되지 않았습니다.";
}

function requestGenerationRun(jobId) {
  fetch(getApiUrl("/api/generate/run"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId }),
  }).catch((error) => {
    console.warn("[generate-run] request failed", error);
  });
}

async function pollGenerationStatus(jobId) {
  const startedAt = Date.now();
  const timeoutMs = 180000;
  requestGenerationRun(jobId);

  while (Date.now() - startedAt < timeoutMs) {
    await wait(2000);
    const response = await fetch(getApiUrl(`/api/generate/status?jobId=${encodeURIComponent(jobId)}`), {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    const parsed = await parseJsonResponseBody(response);
    const payload = parsed.data || {};
    const status = getJobStatus(payload) || "processing";

    if (!response.ok || !parsed.parseOk || payload?.ok === false) {
      const code = String(response.status === 504 ? "GENERATION_JOB_TIMEOUT" : (payload?.code || payload?.error || (!parsed.parseOk ? "INVALID_SERVER_RESPONSE" : "GENERATION_JOB_FAILED"))).toUpperCase();
      const message = response.status === 504
        ? "생성이 예상보다 오래 걸리고 있어요. 잠시 후 마이포토박스에서 확인해 주세요."
        : getJobFailureMessage(code, payload?.message || parsed.message);
      const error = new Error(message);
      error.statusCode = response.status;
      error.code = code;
      error.publicMessage = message;
      error.response = payload;
      error.rawPreview = parsed.rawText?.slice(0, 300);
      throw error;
    }

    if (["succeeded", "success", "completed", "complete"].includes(status)) {
      const result = extractJobResult(payload, jobId);
      if (result) return result;
      const error = new Error("생성 결과를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      error.code = "GENERATION_JOB_FAILED";
      error.publicMessage = error.message;
      throw error;
    }

    if (["failed", "error", "canceled", "cancelled"].includes(status)) {
      const code = String(payload?.code || payload?.error || payload?.data?.code || "GENERATION_JOB_FAILED").toUpperCase();
      const message = getJobFailureMessage(code, payload?.message || payload?.data?.message || "");
      const error = new Error(message);
      error.code = code;
      error.publicMessage = message;
      error.response = payload;
      throw error;
    }
  }

  const error = new Error("생성이 지연되고 있어요. 잠시 후 마이포토박스에서 확인해 주세요.");
  error.code = "GENERATION_JOB_TIMEOUT";
  error.publicMessage = error.message;
  error.jobId = jobId;
  throw error;
}

export async function generateImages(prompt, options = {}) {
  const {
    sourceImageUrl,
    count = 4,
    presetKey = "default",
    useFreeGeneration = false,
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
  formData.append("generationType", useFreeGeneration ? "free" : "paid");
  if (useFreeGeneration) {
    formData.append("useFreeGeneration", "true");
    formData.append("watermarkRequired", "true");
  }
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
  let payload = parsed.data || {};
  const jobId = resolveJobId(payload);
  const hasImmediateResults = Array.isArray(payload.results) || Array.isArray(payload.imageUrls) || Array.isArray(payload.image_urls);
  if (response.ok && parsed.parseOk && jobId && !hasImmediateResults) {
    payload = await pollGenerationStatus(jobId);
  }

  if (!response.ok || !parsed.parseOk || !payload?.ok) {
    const isInsufficientCredits =
      response.status === 402 ||
      payload?.status === 402 ||
      payload?.code === "INSUFFICIENT_CREDITS" ||
      payload?.code === "CREDITS_REQUIRED" ||
      payload?.code === "NO_REMAINING_GENERATION_USES";
    const code = response.status === 504 ? "GENERATION_JOB_TIMEOUT" : (payload?.code || (!parsed.parseOk ? "INVALID_SERVER_RESPONSE" : "GENERATION_FAILED"));
    const message =
      (response.status === 504 ? "생성이 예상보다 오래 걸리고 있어요. 잠시 후 마이포토박스에서 확인해 주세요." : "") ||
      payload?.message ||
      parsed.message ||
      "생성 중 서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    console[code === "GENERATION_JOB_TIMEOUT" ? "warn" : "error"](code === "GENERATION_JOB_TIMEOUT" ? "[client][generate][delayed]" : "[client][generate][failed]", {
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
      error.publicMessage = payload?.message || "남은 제작 횟수가 없습니다. 이용권을 구매해 주세요.";
      error.requiredCredits = payload?.requiredCredits;
      error.currentCredits = payload?.currentCredits;
    } else if (error.code === "INVALID_SERVER_RESPONSE") {
      error.publicMessage = "서버 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    } else if (error.code === "GENERATION_JOB_TIMEOUT") {
      error.publicMessage = "생성이 예상보다 오래 걸리고 있어요. 잠시 후 마이포토박스에서 확인해 주세요.";
    } else if (error.code === "FREE_GENERATION_NOT_AVAILABLE") {
      error.publicMessage = "무료 제작을 사용할 수 없습니다. 계정 상태를 다시 확인해 주세요.";
    } else if (error.code === "WATERMARK_FAILED") {
      error.publicMessage = "무료 제작 워터마크 처리 중 문제가 발생했습니다. 무료 제작은 사용 처리되지 않았으니 잠시 후 다시 시도해 주세요.";
    } else if (error.code === "GENERATION_JOB_FAILED" || error.code === "GENERATION_FAILED") {
      error.publicMessage = "생성 중 문제가 발생했습니다. 이용권은 사용 처리되지 않았습니다.";
    }
    throw error;
  }

  const resultItems = Array.isArray(payload.results)
    ? payload.results
    : (Array.isArray(payload.imageUrls || payload.image_urls)
      ? (payload.imageUrls || payload.image_urls).map((url, index) => ({ ok: true, imageBase64: url, index }))
      : []);
  const failedImages = Array.isArray(payload.failedImages) ? payload.failedImages : [];
  const generationType = payload.generationType || payload.generation_type || (useFreeGeneration ? "free" : "paid");
  const isFreeGeneration = payload.isFreeGeneration === true || payload.is_free_generation === true || generationType === "free";
  const hasWatermark = payload.hasWatermark === true || payload.has_watermark === true || isFreeGeneration;
  const watermarkRequired = payload.watermarkRequired === true || payload.watermark_required === true || hasWatermark;
  const watermarkStrategy = payload.watermarkStrategy || payload.watermark_strategy || "";

  return resultItems.map((item, index) => {
    const failed = failedImages.find((failedImage) => failedImage?.index === item?.index);
    const url = item?.imageBase64 || item?.imageUrl || item?.image_url || item?.publicUrl || item?.public_url || item?.url || "";
    const itemGenerationType = item?.generationType || item?.generation_type || generationType;
    const itemIsFreeGeneration = item?.isFreeGeneration === true || item?.is_free_generation === true || isFreeGeneration;
    const itemHasWatermark = item?.hasWatermark === true || item?.has_watermark === true || hasWatermark;
    const itemWatermarkRequired = item?.watermarkRequired === true || item?.watermark_required === true || watermarkRequired;
    const itemWatermarkStrategy = item?.watermarkStrategy || item?.watermark_strategy || watermarkStrategy;

    if (item?.ok === false || !url) {
      return {
        url: "",
        status: "failed",
        errorMessage: item?.message || failed?.message || "이미지를 생성하지 못했어요.",
        variantLabel: item?.label || failed?.label || `결과 ${index + 1}`,
        generationType: itemGenerationType,
        isFreeGeneration: itemIsFreeGeneration,
        hasWatermark: itemHasWatermark,
        watermarkRequired: itemWatermarkRequired,
        watermarkStrategy: itemWatermarkStrategy,
      };
    }

    return {
      url,
      status: "success",
      score: null,
      variantLabel: item?.label || `결과 ${index + 1}`,
      generationType: itemGenerationType,
      isFreeGeneration: itemIsFreeGeneration,
      hasWatermark: itemHasWatermark,
      watermarkRequired: itemWatermarkRequired,
      watermarkStrategy: itemWatermarkStrategy,
    };
  });
}

export async function generateParisEiffelImage({ sourceImageUrl, prompt, presetKey = "paris_eiffel", analyzedMeta, ratioOption, customText, count = 4, useFreeGeneration = false }) {
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
    useFreeGeneration,
  });

  console.log("[generation] api request complete", {
    presetKey,
    imageCount: generatedImages.length,
  });

  return generatedImages;
}
