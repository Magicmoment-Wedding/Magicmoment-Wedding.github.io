import { buildMockResults, buildStudioMockResults } from "../mock/results.js";
import { getSourceImage } from "../mock/sources.js";
import { getRatioDisplay } from "./credit.js";
import { delay } from "./ai-utils.js";
import { analyzePresetImage } from "./grok-analysis.js";
import { buildParisEiffelPrompt } from "./prompt-builder.js";
import { canUseRealAiForPreset, getAppConfig } from "./config.js";
import { generateParisEiffelImage } from "./xai-generation.js";
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

export async function chooseBestGrokResult(originalImage, generatedImages, prompt) {
  const fallback = {
    bestIndex: 0,
    confidence: "low",
    status: "success",
    reason: RECOMMENDATION_DESCRIPTION,
  };

  try {
    const imageUrls = generatedImages
      .map((image) => typeof image === "string" ? image : image?.url)
      .filter(Boolean)
      .slice(0, DEFAULT_GENERATION_COUNT);

    if (!originalImage || !imageUrls.length) {
      return fallback;
    }

    console.log("[generation] grok choose best result", {
      promptLength: prompt?.length ?? 0,
      imageCount: imageUrls.length,
    });

    const response = await fetch("http://localhost:3000/api/grok/choose-best", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "parisSnap",
        originalImage,
        generatedImages: imageUrls,
      }),
    });
    const payload = await response.json();

    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error || "Grok recommendation failed");
    }

    const bestIndex = Number.isInteger(payload.selection?.recommendedIndex)
      && payload.selection.recommendedIndex >= 0
      && payload.selection.recommendedIndex < imageUrls.length
      ? payload.selection.recommendedIndex
      : 0;

    return {
      bestIndex,
      confidence: payload.fallback ? "low" : "high",
      status: "success",
      reason: payload.selection?.reason || RECOMMENDATION_DESCRIPTION,
    };
  } catch (error) {
    console.error("[generation] grok recommendation failed", error);
    return fallback;
  }
}

function createRealPayload(state, mockPayload, generatedImages, analysisMeta, prompt) {
  const sourceImage = getSourceImage(state.sourceImageId);
  const realResults = generatedImages.map((imageUrl, index) => {
    const normalizedImageUrl = typeof imageUrl === "string" ? imageUrl : imageUrl.url;
    const fallbackResult = mockPayload.results[index] ?? mockPayload.results[0];

    return {
      id: `real-${state.selectedPresetId}-${index + 1}`,
      afterUrl: normalizedImageUrl,
      beforeUrl: sourceImage.url,
      title: fallbackResult?.title ?? `파리 에펠탑 ${index + 1}`,
      badge: imageUrl?.variantLabel || fallbackResult?.badge || (index === 0 ? "대표 장소" : "다른 장소"),
      variantLabel: imageUrl?.variantLabel || (index === 0 ? "대표 장소" : "다른 장소"),
      tags: fallbackResult?.tags ?? ["파리 에펠탑", "야외 웨딩 스냅"],
      score: null,
      isRecommended: false,
    };
  });

  return {
    results: realResults,
    generationMeta: {
      ...mockPayload.generationMeta,
      generatedCount: realResults.length,
      recommendedIndex: null,
      recommendationStatus: realResults.length >= 2 ? "pending" : "unavailable",
      recommendationReason: realResults.length >= 2
        ? RECOMMENDATION_DESCRIPTION
        : RECOMMENDATION_DESCRIPTION,
      evaluationPrompt: prompt,
      analysisMeta,
      resultMode: "real",
      resultProvider: "xai",
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
  const config = getAppConfig();

  if (!canUseRealAiForPreset(state.selectedPresetId)) {
    console.log("[generation] fallback to mock", {
      reason: config.useRealAi ? "preset_not_enabled" : "real_ai_disabled",
      presetKey: state.selectedPresetId,
    });
    return attachMockMeta(mockPayload, analysisMeta, config.useRealAi ? "preset_not_enabled" : "real_ai_disabled");
  }

  if (!config.xAiApiKey) {
    console.log("[generation] fallback to mock", {
      reason: "missing_api_keys",
      presetKey: state.selectedPresetId,
    });
    return attachMockMeta(mockPayload, analysisMeta, "missing_api_keys");
  }

  const prompt = buildParisEiffelPrompt({
    analysisMeta,
    ratioLabel: getRatioDisplay(state.selectedRatio, state.customRatio),
    customText: state.customPresetDraft?.style?.trim() ?? "",
  });

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
        reason: "empty_xai_response",
        presetKey: state.selectedPresetId,
      });
      return attachMockMeta(mockPayload, analysisMeta, "empty_xai_response");
    }

    return createRealPayload(state, mockPayload, generatedImages, analysisMeta, prompt);
  } catch (error) {
    console.error("[generation] xai request failed", error);
    console.log("[generation] fallback to mock", {
      reason: "xai_request_failed",
      presetKey: state.selectedPresetId,
    });
    return attachMockMeta(mockPayload, analysisMeta, "xai_request_failed");
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
        if (state.selectedPresetId !== "paris_eiffel") {
          console.log("[generation] fallback to mock", {
            reason: "mock_only_preset",
            presetKey: state.selectedPresetId,
          });
          return attachMockMeta(mockPayload, null, "mock_only_preset");
        }

        return generateParisEiffelResults(state, mockPayload);
      } catch (error) {
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
