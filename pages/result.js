import { getSourceImage } from "../mock/sources.js";
import { CREDIT_PRICING, PRINT_PRODUCTS } from "../services/credit.js";
import { escapeHtml, formatNumber } from "../services/format.js";

export function markRecommendedImage(bestIndex, index, status = "success") {
  if (!Number.isInteger(bestIndex) || bestIndex !== index) {
    return "";
  }

  const label = "AI 추천";

  return `<div class="absolute top-3 left-3 z-10 rounded-full ${status === "success" ? "bg-primary text-on-primary" : "bg-black/55 text-white"} px-3 py-1 font-label-caps text-label-caps shadow-md">${label}</div>`;
}

function isFailedResult(result) {
  return result?.status === "failed" || !result?.afterUrl;
}

function renderFailedImagePanel(result, size = "large") {
  const compact = size === "compact";
  const message = result?.errorMessage || "이미지를 생성하지 못했어요.";

  return `
    <div class="absolute inset-0 bg-error-container text-on-error-container flex flex-col items-center justify-center gap-2 px-3 text-center">
      <span class="material-symbols-outlined ${compact ? "text-[22px]" : "text-[34px]"}" style="font-variation-settings: 'FILL' 0;">error</span>
      <p class="${compact ? "text-[11px]" : "text-sm"} font-semibold">생성 실패</p>
      ${compact ? "" : `<p class="text-xs leading-relaxed">${escapeHtml(message)}</p>`}
    </div>
  `;
}

export function renderResultPage(state) {
  const sourceImage = getSourceImage(state.sourceImageId);
  const safeResults = state.results.length > 0
    ? state.results
    : [
      {
        id: `fallback-${sourceImage.id}`,
        afterUrl: sourceImage.url,
        beforeUrl: sourceImage.url,
        title: `${sourceImage.title} 기본 결과`,
        badge: "mock fallback",
        score: 100,
        isRecommended: true,
      },
    ];
  const foundRecommendedIndex = safeResults.findIndex((result) => result.isRecommended);
  const fallbackRecommendedIndex = foundRecommendedIndex >= 0 ? foundRecommendedIndex : null;
  const recommendedIndex = Number.isInteger(state.generationMeta?.recommendedIndex)
    && state.generationMeta.recommendedIndex >= 0
    && state.generationMeta.recommendedIndex < safeResults.length
    ? state.generationMeta.recommendedIndex
    : fallbackRecommendedIndex;
  const selectedIndex = safeResults[state.selectedThumbnailIndex] ? state.selectedThumbnailIndex : 0;
  const currentResult = safeResults[selectedIndex] ?? safeResults[0];
  const mainResultIndex = Number.isInteger(recommendedIndex) ? recommendedIndex : 0;
  const mainResult = safeResults[mainResultIndex] ?? safeResults[0];
  const isMainFailed = isFailedResult(mainResult);
  const isCurrentFailed = isFailedResult(currentResult);
  const recommendationStatus = state.generationMeta?.recommendationStatus ?? "pending";
  const alternateResults = safeResults
    .map((result, index) => ({ result, index }))
    .filter((item) => item.index !== mainResultIndex);
  const getImageModalIndex = (resultIndex) =>
    1 + safeResults.slice(0, resultIndex).filter((result) => !isFailedResult(result)).length;
  const generationMeta = state.generationMeta ?? {
    presetName: "파리 에펠탑",
    ratioLabel: "원본",
    totalCredits: 25,
    upscaleIncluded: false,
    sourceTitle: sourceImage.title,
    generatedCount: state.results.length || 4,
    billedCredits: 0,
    regularCredits: 25,
    usedFreeGeneration: true,
    freeGenerationNumber: 1,
    remainingCredits: state.credits,
    qualityLabel: "720p 미리보기",
    recommendedIndex,
  };
  const billingHeadline = generationMeta.billingTitle ?? (generationMeta.usedFreeGeneration
    ? `${generationMeta.freeGenerationNumber}번째 무료 생성이 적용되었습니다`
    : `${formatNumber(generationMeta.billedCredits ?? generationMeta.totalCredits)} 크레딧이 차감되었습니다`);
  const billingDescription = generationMeta.billingDescription ?? (generationMeta.usedFreeGeneration
    ? `정가 ${formatNumber(generationMeta.regularCredits ?? generationMeta.totalCredits)} 크레딧 기준이며 무료 정책이 적용되었습니다.`
    : `생성 후 잔액은 ${formatNumber(generationMeta.remainingCredits ?? state.credits)} 크레딧입니다.`);

  return `
    <section class="result-recommendation-layout w-full flex flex-col md:grid md:grid-cols-[minmax(0,1fr)_8.5rem] gap-3">
      <article class="recommended-result-card relative rounded-xl overflow-hidden glass-panel glow-shadow border-2 ${selectedIndex === mainResultIndex ? "border-primary" : "border-white/60"}">
        ${isMainFailed ? `
          <div class="relative block w-full aspect-[4/5] overflow-hidden">
            ${renderFailedImagePanel(mainResult)}
          </div>
        ` : `
          <button class="relative block w-full aspect-[4/5] overflow-hidden group" data-action="open-image-modal" data-image-modal-index="${getImageModalIndex(mainResultIndex)}" aria-label="추천 결과 크게 보기">
            <img alt="${escapeHtml(mainResult.title)}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" src="${mainResult.afterUrl}" />
            <span class="absolute inset-x-4 bottom-4 rounded-full bg-black/45 text-white px-3 py-1 text-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">클릭해서 크게 보기</span>
            ${markRecommendedImage(mainResultIndex, mainResultIndex, recommendationStatus)}
            ${selectedIndex === mainResultIndex ? `
              <div class="absolute top-3 right-3 bg-primary-container text-on-primary-container rounded-full w-8 h-8 flex items-center justify-center shadow-sm">
                <span class="material-symbols-outlined text-[18px]" style="font-variation-settings: 'FILL' 1;">check</span>
              </div>
            ` : ""}
          </button>
        `}
        <div class="p-4 bg-white/65 flex flex-col gap-2">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="font-display text-[28px] leading-none text-on-surface">추천 결과</p>
              <p class="text-sm text-on-surface-variant mt-1">가장 자연스러운 이미지입니다.</p>
            </div>
            ${mainResult.variantLabel ? `<span class="shrink-0 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">${escapeHtml(mainResult.variantLabel)}</span>` : ""}
          </div>
          <button class="w-full h-10 rounded-full ${isMainFailed ? "bg-white/45 text-on-surface-variant cursor-not-allowed" : selectedIndex === mainResultIndex ? "bg-primary text-on-primary" : "glass-panel text-primary"} text-sm font-semibold" ${isMainFailed ? "disabled" : `data-thumbnail-index="${mainResultIndex}"`}>
            ${isMainFailed ? "선택 불가" : selectedIndex === mainResultIndex ? "선택됨" : "추천 결과 선택"}
          </button>
        </div>
      </article>

      <aside class="alternate-results-panel w-full glass-panel rounded-DEFAULT p-3 flex flex-col gap-3">
        <p class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">추가 이미지</p>
        <div class="alternate-results-list flex md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
          ${alternateResults.map(
            ({ result, index }, alternateIndex) => `
              <article class="alternate-result-card shrink-0 w-28 md:w-full rounded-lg overflow-hidden bg-white/55 border ${index === selectedIndex ? "border-primary shadow-md" : "border-white/60"}">
                ${isFailedResult(result) ? `
                  <div class="relative block w-full aspect-[4/5] overflow-hidden">
                    ${renderFailedImagePanel(result, "compact")}
                  </div>
                ` : `
                  <button class="relative block w-full aspect-[4/5] overflow-hidden group" data-action="open-image-modal" data-image-modal-index="${getImageModalIndex(index)}" aria-label="추가 ${alternateIndex + 1} 크게 보기">
                    <img alt="${escapeHtml(result.title)}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" src="${result.afterUrl}" />
                    ${index === selectedIndex ? `
                      <div class="absolute top-2 right-2 bg-primary-container text-on-primary-container rounded-full w-6 h-6 flex items-center justify-center shadow-sm">
                        <span class="material-symbols-outlined text-[14px]" style="font-variation-settings: 'FILL' 1;">check</span>
                      </div>
                    ` : ""}
                  </button>
                `}
                <div class="p-2 flex flex-col gap-2">
                  <p class="text-xs font-semibold text-on-surface">추가 ${alternateIndex + 1}</p>
                  ${result.variantLabel ? `<p class="text-[11px] text-primary">${escapeHtml(result.variantLabel)}</p>` : ""}
                  <button class="h-8 rounded-full ${isFailedResult(result) ? "bg-white/45 text-on-surface-variant cursor-not-allowed" : index === selectedIndex ? "bg-primary text-on-primary" : "glass-panel text-primary"} text-xs font-semibold" ${isFailedResult(result) ? "disabled" : `data-thumbnail-index="${index}"`}>
                    ${isFailedResult(result) ? "실패" : index === selectedIndex ? "선택됨" : "이 이미지 선택"}
                  </button>
                </div>
              </article>
            `,
          ).join("")}
        </div>
      </aside>
    </section>

    <section class="w-full grid grid-cols-2 gap-3">
      <div class="glass-panel glow-shadow rounded-DEFAULT p-3 flex flex-col gap-3">
        <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">BEFORE</span>
        <button class="relative w-full aspect-[4/5] rounded-lg overflow-hidden group" data-action="open-image-modal" data-image-modal-index="0" aria-label="원본 이미지 크게 보기">
          <img alt="Before preview" class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" src="${currentResult.beforeUrl}" />
          <span class="absolute inset-x-3 bottom-3 rounded-full bg-black/45 text-white px-3 py-1 text-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">클릭해서 크게 보기</span>
        </button>
        <p class="text-xs text-on-surface-variant">${escapeHtml(generationMeta.sourceTitle)}</p>
      </div>
      <div class="glass-panel glow-shadow rounded-DEFAULT p-3 flex flex-col gap-3">
        <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">AFTER</span>
        <button class="relative w-full aspect-[4/5] rounded-lg overflow-hidden group" ${isCurrentFailed ? "" : `data-action="open-image-modal" data-image-modal-index="${getImageModalIndex(selectedIndex)}"`} aria-label="AI 생성 결과 크게 보기">
          ${isCurrentFailed ? renderFailedImagePanel(currentResult) : `
            <img alt="After preview" class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" src="${currentResult.afterUrl}" />
            <span class="absolute inset-x-3 bottom-3 rounded-full bg-black/45 text-white px-3 py-1 text-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">클릭해서 크게 보기</span>
            ${markRecommendedImage(recommendedIndex, selectedIndex, recommendationStatus)}
          `}
        </button>
        <p class="text-xs text-on-surface-variant">${escapeHtml(currentResult.badge)}</p>
      </div>
    </section>

    <section class="w-full glass-panel glow-shadow rounded-DEFAULT p-5 flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">CURRENT STATUS</span>
        <span class="font-label-caps text-label-caps text-primary px-3 py-1 bg-primary-container/20 rounded-full border border-primary-container/30">${generationMeta.upscaleIncluded ? "UPSCALE INCLUDED" : "FREE PREVIEW"}</span>
      </div>
      <div class="rounded-DEFAULT bg-white/45 border border-white/50 p-3 flex flex-col gap-1">
        <span class="font-label-caps text-label-caps text-primary tracking-widest">AI 추천</span>
        <p class="text-sm text-on-surface">가장 자연스러운 이미지입니다.</p>
      </div>
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-2 text-on-surface">
          <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 0;">water_drop</span>
          <span class="font-body-large text-body-large">워터마크 포함 (Watermarked)</span>
        </div>
        <div class="flex items-center gap-2 text-on-surface">
          <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 0;">sd</span>
          <span class="font-body-large text-body-large">${generationMeta.upscaleIncluded ? "업스케일 포함" : generationMeta.qualityLabel ?? "720p 해상도 (Standard Def)"}</span>
        </div>
        <div class="flex items-center gap-2 text-on-surface">
          <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 0;">style</span>
          <span class="font-body-large text-body-large">${escapeHtml(generationMeta.presetName)} / ${escapeHtml(generationMeta.ratioLabel)}</span>
        </div>
      </div>
      <p class="text-sm text-on-surface-variant font-body-large mt-1 border-t border-white/30 pt-3">
        * 총 ${generationMeta.generatedCount}장 결과 중 선택한 이미지를 다음 단계에 사용합니다.
      </p>
    </section>

    <section class="w-full relative rounded-xl overflow-hidden shadow-lg border border-white/50 group cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]">
      <div class="absolute inset-0 bg-gradient-to-br from-secondary-container to-surface-container-high opacity-80 z-0"></div>
      <div class="relative z-10 p-6 flex items-center justify-between">
        <div class="flex flex-col gap-1 w-2/3">
          <span class="font-label-caps text-label-caps text-on-secondary-container tracking-wider">CREDIT SUMMARY</span>
          <h3 class="font-display text-[22px] leading-tight text-on-surface font-semibold">${billingHeadline}</h3>
          <p class="text-sm text-on-secondary-container">${billingDescription}</p>
        </div>
        <div class="w-14 h-14 rounded-full bg-white/60 shadow-inner flex items-center justify-center border border-white flex-shrink-0 group-hover:bg-white transition-colors">
          <span class="material-symbols-outlined text-primary text-[28px]" style="font-variation-settings: 'FILL' 0;">credit_card</span>
        </div>
      </div>
      <div class="absolute -bottom-4 -right-4 w-24 h-24 bg-white/40 rounded-full blur-xl z-0"></div>
    </section>

    <section class="w-full flex flex-col gap-3">
      <button class="w-full h-14 rounded-full glass-panel text-primary font-button text-button hover:bg-white/50 transition-all active:scale-95 flex items-center justify-center gap-2" data-action="download-result">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">download</span>
        사진/갤러리에 저장
      </button>
      <p class="px-2 text-xs leading-5 text-on-surface-variant">모바일에서는 공유창에서 ‘이미지 저장’을 선택해 주세요. 데스크톱에서는 이미지가 다운로드됩니다.</p>
      <button class="w-full h-14 rounded-full ${generationMeta.upscaleIncluded ? "glass-panel text-primary" : "bg-primary/90 text-on-primary shadow-[0_8px_20px_rgba(129,80,92,0.3)]"} font-button text-button backdrop-blur-md border border-white/20 flex items-center justify-center gap-2 transition-all active:scale-95 group" data-action="purchase-upscale">
        <span class="material-symbols-outlined group-hover:rotate-12 transition-transform" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
        ${generationMeta.upscaleIncluded ? "고해상도 변환 완료" : `고해상도 변환 (${CREDIT_PRICING.upscale} 크레딧)`}
      </button>
      <div class="w-full glass-panel glow-shadow rounded-DEFAULT p-5 flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">PRINT SERVICE</span>
          <span class="font-label-caps text-label-caps text-primary">${formatNumber(state.credits)} CREDIT</span>
        </div>
        ${PRINT_PRODUCTS.map((product) => `
          <div class="rounded-DEFAULT bg-white/45 p-4 border border-white/50 flex flex-col gap-3">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="font-display text-[26px] leading-none text-on-surface">${escapeHtml(product.name)}</p>
                <p class="text-sm text-primary mt-2">${escapeHtml(product.summary)}</p>
                <p class="text-sm text-on-surface-variant mt-2">${escapeHtml(product.description)}</p>
              </div>
              <span class="material-symbols-outlined text-primary text-[28px]" style="font-variation-settings: 'FILL' 0;">local_mall</span>
            </div>
            <button class="w-full h-12 rounded-full ${product.id === "premium-print" ? "bg-primary text-on-primary" : "glass-panel text-primary"} font-button" data-print-product="${product.id}">
              ${escapeHtml(product.cta)}
            </button>
          </div>
        `).join("")}
      </div>
    </section>

    <section class="w-full flex flex-col gap-3 mt-2">
      <button class="w-full h-14 rounded-full glass-panel text-primary font-button text-button hover:bg-white/50 transition-all active:scale-95 flex items-center justify-center gap-2" data-action="open-credits" data-modal-reason="header">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">diamond</span>
        크레딧 충전하기
      </button>
      <button class="w-full h-14 rounded-full bg-primary/90 hover:bg-primary text-on-primary font-button text-button shadow-[0_8px_20px_rgba(129,80,92,0.3)] backdrop-blur-md border border-white/20 flex items-center justify-center gap-2 transition-all active:scale-95 group" data-route="options">
        <span class="material-symbols-outlined group-hover:rotate-12 transition-transform" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
        ${generationMeta.upscaleIncluded ? "옵션 다시 선택하기" : "고해상도 변환 옵션 보기"}
      </button>
      <button class="w-full h-14 rounded-full glass-panel text-primary font-button text-button hover:bg-white/50 transition-all active:scale-95 flex items-center justify-center gap-2" data-route="create">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">refresh</span>
        다른 이미지로 다시 생성
      </button>
    </section>
  `;
}
