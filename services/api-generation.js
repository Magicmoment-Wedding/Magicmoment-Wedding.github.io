import { assertApiBaseUrlConfigured, getApiUrl } from "./config.js";
import { getAnonymousId } from "./anonymous-id.js";

export const CURRENT_GENERATION_JOB_ID_KEY = "magic_ai_current_generation_job_id";
export const CURRENT_GENERATION_STARTED_AT_KEY = "magic_ai_current_generation_started_at";
const GENERATION_STATUS_POLL_INTERVAL_MS = 3500;
const GENERATION_STATUS_PAUSED_INTERVAL_MS = 5000;

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
  const bodyPreview = text.slice(0, 300);

  if (!text) {
    return {
      ok: false,
      parseOk: false,
      data: null,
      rawText: "",
      message: response.status === 404 ? "요청한 API를 찾을 수 없습니다." : "서버 응답이 비어 있습니다.",
    };
  }

  const trimmed = text.trim();
  const looksLikeJson =
    contentType.includes("application/json") ||
    trimmed.startsWith("{") ||
    trimmed.startsWith("[");

  if (!looksLikeJson) {
    const logPayload = {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      contentType,
      bodyPreview,
    };
    console.error(response.ok ? "[client][api][invalid-json-response]" : "[client][api][http-error-response]", logPayload);

    return {
      ok: false,
      parseOk: false,
      data: null,
      rawText: text,
      message: response.status === 404
        ? "요청한 API를 찾을 수 없습니다."
        : "서버가 올바르지 않은 응답을 반환했습니다.",
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
      statusText: response.statusText,
      url: response.url,
      contentType,
      bodyPreview,
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

function isDocumentHidden() {
  return typeof document !== "undefined" && document.visibilityState === "hidden";
}

function isNetworkOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

function isTransientStatusError(error) {
  const message = String(error?.message || "");
  return error?.name === "AbortError" ||
    error?.code === "GENERATION_STATUS_TRANSIENT" ||
    error?.code === "INVALID_SERVER_RESPONSE" ||
    /abort|cancel|cancelled|failed to fetch|network|load failed/i.test(message) ||
    isNetworkOffline();
}

export function saveActiveGenerationJob(jobId) {
  const normalizedJobId = String(jobId || "").trim();
  if (!normalizedJobId || typeof window === "undefined") return;

  try {
    window.localStorage.setItem(CURRENT_GENERATION_JOB_ID_KEY, normalizedJobId);
    window.localStorage.setItem(CURRENT_GENERATION_STARTED_AT_KEY, new Date().toISOString());
  } catch (error) {
    console.warn("[generation] active job save failed", error);
  }
}

export function getStoredActiveGenerationJobId() {
  if (typeof window === "undefined") return "";

  try {
    return String(window.localStorage.getItem(CURRENT_GENERATION_JOB_ID_KEY) || "").trim();
  } catch (error) {
    return "";
  }
}

export function clearActiveGenerationJob(jobId = "") {
  if (typeof window === "undefined") return;

  try {
    const currentJobId = getStoredActiveGenerationJobId();
    if (jobId && currentJobId && currentJobId !== jobId) return;
    window.localStorage.removeItem(CURRENT_GENERATION_JOB_ID_KEY);
    window.localStorage.removeItem(CURRENT_GENERATION_STARTED_AT_KEY);
  } catch (error) {
    console.warn("[generation] active job clear failed", error);
  }
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
    (Array.isArray(candidate.results) || Array.isArray(candidate.imageUrls) || Array.isArray(candidate.image_urls) || Array.isArray(candidate.images))
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

export function requestGenerationRun(jobId) {
  fetch(getApiUrl("/api/generate/run"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId }),
  }).catch((error) => {
    console.warn("[generate-run] request failed", error);
  });
}

export async function fetchGenerationStatus(jobId) {
  const response = await fetch(getApiUrl(`/api/generate/status?jobId=${encodeURIComponent(jobId)}`), {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });
  const parsed = await parseJsonResponseBody(response);
  const payload = parsed.data || {};
  const status = getJobStatus(payload) || "processing";

  if (response.status === 404 || payload?.code === "GENERATION_JOB_NOT_FOUND") {
    return { ok: true, jobId, status: "not_found", payload };
  }

  if (!response.ok || !parsed.parseOk) {
    const error = new Error(parsed.message || "생성 상태를 확인하지 못했습니다.");
    error.statusCode = response.status;
    error.code = !parsed.parseOk ? "INVALID_SERVER_RESPONSE" : "GENERATION_STATUS_TRANSIENT";
    error.response = payload;
    error.rawPreview = parsed.rawText?.slice(0, 300);
    throw error;
  }

  if (payload?.ok === false && ["failed", "error", "canceled", "cancelled"].includes(status)) {
    const code = String(payload?.code || payload?.error || payload?.data?.code || "GENERATION_JOB_FAILED").toUpperCase();
    const message = getJobFailureMessage(code, payload?.message || payload?.data?.message || "");
    const error = new Error(message);
    error.code = code;
    error.publicMessage = message;
    error.response = payload;
    throw error;
  }

  if (payload?.ok === false) {
    const error = new Error(payload?.message || "생성 상태를 확인하지 못했습니다.");
    error.code = String(payload?.code || "GENERATION_STATUS_FAILED").toUpperCase();
    error.response = payload;
    throw error;
  }

  const result = ["succeeded", "success", "completed", "complete"].includes(status)
    ? extractJobResult(payload, jobId)
    : null;

  return { ok: true, jobId, status, payload, result };
}

export async function fetchRecentActiveGenerationJob() {
  const response = await fetch(getApiUrl("/api/generate/recent-active"), {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });
  const parsed = await parseJsonResponseBody(response);
  const payload = parsed.data || {};

  if (!response.ok || !parsed.parseOk || payload?.ok === false) {
    return null;
  }

  const jobId = resolveJobId(payload);
  if (!jobId) {
    return null;
  }

  return {
    jobId,
    status: getJobStatus(payload) || "pending",
    payload,
  };
}

export async function waitForGenerationResult(jobId, { startRun = true, onStatus } = {}) {
  if (!jobId) {
    const error = new Error("생성 작업을 찾을 수 없습니다.");
    error.code = "GENERATION_JOB_NOT_FOUND";
    throw error;
  }

  saveActiveGenerationJob(jobId);
  if (startRun) {
    requestGenerationRun(jobId);
  }

  while (true) {
    if (isDocumentHidden() || isNetworkOffline()) {
      onStatus?.({
        jobId,
        status: "paused",
        message: "생성 상태를 다시 확인하고 있어요.",
        transient: true,
      });
      await wait(GENERATION_STATUS_PAUSED_INTERVAL_MS);
      continue;
    }

    try {
      const statusResult = await fetchGenerationStatus(jobId);
      onStatus?.({
        jobId,
        status: statusResult.status,
        message: statusResult.payload?.message || "",
        transient: false,
      });

      if (["succeeded", "success", "completed", "complete"].includes(statusResult.status)) {
        if (statusResult.result) {
          clearActiveGenerationJob(jobId);
          return statusResult.result;
        }
        const error = new Error("생성 결과를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
        error.code = "GENERATION_JOB_FAILED";
        error.publicMessage = error.message;
        throw error;
      }

      if (statusResult.status === "not_found") {
        clearActiveGenerationJob(jobId);
        const error = new Error("진행 중이던 생성 작업을 찾을 수 없습니다.");
        error.code = "GENERATION_JOB_NOT_FOUND";
        error.publicMessage = error.message;
        throw error;
      }

      await wait(GENERATION_STATUS_POLL_INTERVAL_MS);
    } catch (error) {
      if (isTransientStatusError(error)) {
        onStatus?.({
          jobId,
          status: "paused",
          message: "생성 상태를 다시 확인하고 있어요.",
          transient: true,
        });
        await wait(GENERATION_STATUS_PAUSED_INTERVAL_MS);
        continue;
      }

      clearActiveGenerationJob(jobId);
      throw error;
    }
  }
}

export async function generateImages(prompt, options = {}) {
  const {
    sourceImageUrl,
    count = 4,
    presetKey = "default",
    useFreeGeneration = false,
    onStatus,
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
    onStatus?.({ jobId, status: "pending", message: "사진을 만들고 있어요.", transient: false });
    payload = await waitForGenerationResult(jobId, { startRun: true, onStatus });
  }

  if (!response.ok || !parsed.parseOk || !payload?.ok) {
    const isInsufficientCredits =
      response.status === 402 ||
      payload?.status === 402 ||
      payload?.code === "INSUFFICIENT_CREDITS" ||
      payload?.code === "CREDITS_REQUIRED" ||
      payload?.code === "NO_REMAINING_USES" ||
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
      : Array.isArray(payload.images)
        ? payload.images
        : []);
  const failedImages = Array.isArray(payload.failedImages) ? payload.failedImages : [];
  const generationType = payload.generationType || payload.generation_type || (useFreeGeneration ? "free" : "paid");
  const isFreeGeneration = payload.isFreeGeneration === true || payload.is_free_generation === true || generationType === "free";
  const hasWatermark = payload.hasWatermark === true || payload.has_watermark === true || isFreeGeneration;
  const watermarkRequired = payload.watermarkRequired === true || payload.watermark_required === true || hasWatermark;
  const watermarkStrategy = payload.watermarkStrategy || payload.watermark_strategy || "";

  const normalizedResults = resultItems.map((item, index) => {
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

  Object.defineProperty(normalizedResults, "generationPayload", {
    value: payload,
    enumerable: false,
  });
  Object.defineProperty(normalizedResults, "generationJobId", {
    value: resolveJobId(payload) || jobId,
    enumerable: false,
  });

  return normalizedResults;
}

export async function generateParisEiffelImage({ sourceImageUrl, prompt, presetKey = "paris_eiffel", analyzedMeta, ratioOption, customText, count = 4, useFreeGeneration = false, onStatus }) {
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
    onStatus,
  });

  console.log("[generation] api request complete", {
    presetKey,
    imageCount: generatedImages.length,
  });

  return generatedImages;
}
