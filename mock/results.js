import { getResultVariants, getSourceImage, resolvePresetForSource } from "./wedding-data.js";
import { getCreditBreakdown, getRatioDisplay } from "../services/credit.js";

function createFallbackResults(source, preset, ratioLabel) {
  return [
    {
      id: `fallback-${source.id}-${preset.id}`,
      afterUrl: source.url,
      beforeUrl: source.url,
      title: `${preset.name} 기본 결과`,
      badge: `${ratioLabel} · ${preset.name}`,
      variantLabel: "대표 장소",
      tags: [preset.name, source.title],
      score: 100,
      isRecommended: true,
    },
  ];
}

export function buildMockResults(state) {
  const source = getSourceImage(state.sourceImageId);
  const preset = resolvePresetForSource(state.selectedPresetId, source.id);
  const credits = getCreditBreakdown(state);
  const ratioLabel = getRatioDisplay(state.selectedRatio, state.customRatio);
  const resultVariants = getResultVariants(source.id, preset.id);
  const results = Array.isArray(resultVariants) && resultVariants.length > 0
    ? resultVariants.slice(0, 4).map((variant, index) => ({
      id: `${variant.id}-${preset.id}`,
      afterUrl: variant.afterImage || source.url,
      beforeUrl: variant.beforeImage || source.url,
      title: `${variant.title} ${index + 1}`,
      badge: `${variant.mood} · ${variant.preset}`,
      variantLabel: ["다리 정면", "다리 와이드", "다리 노을", "다리 배경흐림"][index] ?? `결과 ${index + 1}`,
      tags: variant.tags ?? [],
      score: index === 0 ? 100 : 90,
      isRecommended: index === 0,
    }))
    : createFallbackResults(source, preset, ratioLabel);

  return {
    results,
    generationMeta: {
      presetName: preset.name,
      ratioLabel,
      sourceTitle: source.title,
      upscaleIncluded: state.useUpscale,
      totalCredits: credits.total,
      generatedCount: results.length,
      recommendedIndex: 0,
      recommendationStatus: "success",
      recommendationConfidence: "high",
      recommendationReason: "배경이나 분위기가 아니라 원본 얼굴과의 유사도만 기준으로 비교했어요.",
    },
  };
}

export function buildStudioMockResults(state) {
  const beforeSource = getSourceImage("source-studio");
  const resultVariants = getResultVariants(beforeSource.id, "drama");
  const results = Array.isArray(resultVariants) && resultVariants.length > 0
    ? resultVariants.map((variant, index) => ({
      id: `studio-${variant.id}`,
      afterUrl: variant.afterImage || beforeSource.url,
      beforeUrl: variant.beforeImage || beforeSource.url,
      title: `방구석 스튜디오 ${index + 1}`,
      badge: `${variant.preset} · ${variant.mood}`,
    }))
    : createFallbackResults(beforeSource, { id: "drama", name: "방구석 스튜디오" }, "15장 패키지");

  return {
    results,
    generationMeta: {
      presetName: "방구석 스튜디오",
      ratioLabel: "15장 패키지",
      sourceTitle: `${state.studioUploadCount}장 업로드 mock`,
      upscaleIncluded: true,
      totalCredits: 0,
      generatedCount: results.length,
      billingTitle: "방구석 스튜디오 mock 결과가 준비되었습니다",
      billingDescription: "7장 업로드를 기준으로 한 촬영 없는 웨딩사진 제작 결과 예시입니다.",
      qualityLabel: "프리미엄 스튜디오 세트",
      originRoute: "studio",
      usedFreeGeneration: false,
      billedCredits: 0,
      regularCredits: 0,
      remainingCredits: state.credits,
    },
  };
}
