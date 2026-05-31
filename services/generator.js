import { buildMockResults, buildStudioMockResults } from "../mock/results.js";
import { getSourceImage } from "../mock/sources.js";
import { getRatioDisplay } from "./credit.js";
import { delay } from "./ai-utils.js";
import { analyzePresetImage } from "./grok-analysis.js";
import { buildParisEiffelPrompt } from "./prompt-builder.js";
import { canUseApiGenerationForPreset, isOnlineApiPlaceholder } from "./config.js";
import { generateParisEiffelImage } from "./api-generation.js";
import { getPresetPromptIntent } from "./prompt-intents.js";

const DEFAULT_GENERATION_COUNT = 4;
const RECOMMENDATION_DESCRIPTION = "가장 자연스러운 이미지입니다.";

function buildSafeMockPayload(state) {
  try {
    return buildMockResults(state);
  } catch (error) {
    console.error("[generation] mock 결과 생성 실패", error);
    return buildMockResults({
      ...state,
      sourceImageId: state.sourceImageId || "source-outdoor",
      selectedPresetId: state.selectedPresetId || "paris_eiffel",
    });
  }
}

function createRealPayload(state, mockPayload, generatedImages, analysisMeta, prompt) {
  const sourceImage = getSourceImage(state.sourceImageId);
  const firstSuccessfulIndex = generatedImages.findIndex((image) => {
    const imageUrl = typeof image === "string" ? image : image?.url;
    return Boolean(imageUrl);
  });
  const recommendedIndex = firstSuccessfulIndex >= 0 ? firstSuccessfulIndex : null;
  const realResults = generatedImages.map((imageUrl, index) => {
    const normalizedImageUrl = typeof imageUrl === "string" ? imageUrl : imageUrl.url;
    const fallbackResult = mockPayload.results[index] ?? mockPayload.results[0];
    const isFailed = !normalizedImageUrl || imageUrl?.status === "failed";

    return {
      id: `real-${state.selectedPresetId}-${index + 1}`,
      afterUrl: normalizedImageUrl,
      beforeUrl: sourceImage.url,
      title: fallbackResult?.title ?? `파리 에펠탑 ${index + 1}`,
      badge: isFailed ? "생성 실패" : imageUrl?.variantLabel || fallbackResult?.badge || (index === 0 ? "대표 장소" : "다른 장소"),
      variantLabel: imageUrl?.variantLabel || (index === 0 ? "대표 장소" : "다른 장소"),
      tags: fallbackResult?.tags ?? ["파리 에펠탑", "야외 웨딩 스냅"],
      score: null,
      isRecommended: index === recommendedIndex,
      status: isFailed ? "failed" : "success",
      errorMessage: imageUrl?.errorMessage || "",
    };
  });

  return {
    results: realResults,
    generationMeta: {
      ...mockPayload.generationMeta,
      generatedCount: realResults.length,
      recommendedIndex,
      recommendationStatus: recommendedIndex === null ? "unavailable" : "success",
      recommendationReason: RECOMMENDATION_DESCRIPTION,
      evaluationPrompt: prompt,
      analysisMeta,
      resultMode: "real",
      resultProvider: "next-api",
    },
  };
}

function attachMockMeta(mockPayload, analysisMeta, reason) {
  return {
    ...mockPayload,
    generationMeta: {
      ...mockPayload.generationMeta,
      analysisMeta,
      resultMode: "mock",
      resultProvider: "mock",
      fallbackReason: reason,
    },
  };
}

async function generateParisEiffelResults(state, mockPayload) {
  const analysisMeta = await analyzePresetImage(state);

  if (!canUseApiGenerationForPreset(state.selectedPresetId)) {
    const fallbackReason = isOnlineApiPlaceholder() ? "api_base_url_not_configured" : "preset_not_enabled";
    console.log("[generation] fallback to mock", {
      reason: fallbackReason,
      presetKey: state.selectedPresetId,
    });
    return attachMockMeta(mockPayload, analysisMeta, fallbackReason);
  }

  const prompt = state.selectedPresetId === "paris_eiffel"
    ? buildParisEiffelPrompt({
      analysisMeta,
      ratioLabel: getRatioDisplay(state.selectedRatio, state.customRatio),
      customText: state.customPresetDraft?.style?.trim() ?? "",
    })
    : "";

  try {
    const generatedImages = await generateParisEiffelImage({
      sourceImageUrl: getSourceImage(state.sourceImageId).url,
      presetKey: state.selectedPresetId,
      analyzedMeta: analysisMeta,
      ratioOption: state.selectedRatio,
      customText: state.customPresetDraft?.style?.trim() ?? "",
      prompt,
      count: DEFAULT_GENERATION_COUNT,
    });

    if (!generatedImages.length) {
      console.log("[generation] fallback to mock", {
        reason: "empty_api_response",
        presetKey: state.selectedPresetId,
      });
      return attachMockMeta(mockPayload, analysisMeta, "empty_api_response");
    }

    return createRealPayload(state, mockPayload, generatedImages, analysisMeta, prompt);
  } catch (error) {
    if (error?.isInsufficientCredits || error?.code === "INSUFFICIENT_CREDITS" || error?.statusCode === 402) {
      throw error;
    }

    console.error("[generation] api request failed", error);
    console.log("[generation] fallback to mock", {
      reason: "api_request_failed",
      presetKey: state.selectedPresetId,
    });
    return attachMockMeta(mockPayload, analysisMeta, "api_request_failed");
  }
}

function logSelectedResult(payload) {
  console.log("[generation] selected result ready", {
    resultsCount: payload?.results?.length ?? 0,
    selectedResult: payload?.results?.[0] ?? null,
    generationMeta: payload?.generationMeta ?? null,
  });

  return payload;
}

export async function generateResults(state) {
  const mockPayload = buildSafeMockPayload(state);

  console.log("[generation] preset intent", {
    presetKey: state.selectedPresetId,
    promptIntent: getPresetPromptIntent(state.selectedPresetId),
  });

  const [payload] = await Promise.all([
    (async () => {
      try {
        if (!canUseApiGenerationForPreset(state.selectedPresetId)) {
          console.log("[generation] fallback to mock", {
            reason: "mock_only_preset",
            presetKey: state.selectedPresetId,
          });
          return attachMockMeta(mockPayload, null, "mock_only_preset");
        }

        return generateParisEiffelResults(state, mockPayload);
      } catch (error) {
        if (error?.isInsufficientCredits || error?.code === "INSUFFICIENT_CREDITS" || error?.statusCode === 402) {
          throw error;
        }

        console.error("[generation] unexpected error, returning mock", error);
        console.log("[generation] fallback to mock", {
          reason: "unexpected_generation_error",
          presetKey: state.selectedPresetId,
        });
        return attachMockMeta(mockPayload, null, "unexpected_generation_error");
      }
    })(),
    delay(1800),
  ]);

  if (payload.generationMeta?.resultMode === "mock") {
    console.log("[generation] mock 결과 생성 완료", payload);
  }

  return logSelectedResult(payload);
}

export function generateStudioResults(state) {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      try {
        const payload = buildStudioMockResults(state);
        console.log("[generation] studio mock 결과 생성 완료", payload);
        resolve(payload);
      } catch (error) {
        console.error("[generation] studio mock 결과 생성 실패", error);
        resolve(buildStudioMockResults(state));
      }
    }, 1800);
  });
}
