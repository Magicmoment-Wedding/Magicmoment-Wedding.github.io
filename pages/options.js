import { getCompatiblePresets } from "../mock/presets.js";
import { getSourceImage } from "../mock/sources.js";
import { RATIO_OPTIONS, getGenerationAccess } from "../services/credit.js";
import { escapeHtml, formatNumber } from "../services/format.js";

export function renderOptionsPage(state, credits) {
  const sourceImage = getSourceImage(state.sourceImageId);
  const availablePresets = getCompatiblePresets(state.sourceImageId);
  const access = getGenerationAccess(state);
  const isCustomPreset = state.selectedPresetId === "custom";
  const nextFlowTitle = isCustomPreset
    ? "자동 생성 대신 전문가 대행으로 연결됩니다"
    : access.mode === "free"
    ? access.requiresAds
      ? `광고 ${access.adsToWatch}개 시청 후 ${access.nextFreeNumber}번째 무료 생성`
      : "첫 생성은 광고 없이 무료"
    : access.canAfford
      ? `${formatNumber(access.cost)} 크레딧 차감 후 생성`
      : "무료 종료, 크레딧 구매 필요";
  const nextFlowDescription = isCustomPreset
    ? "원하는 스타일과 추가 요청을 남기면 매니저가 직접 배경 제작을 진행합니다."
    : access.mode === "free"
    ? `남은 무료 생성 ${access.freeRemaining}회. 현재 선택 조합의 정가는 ${formatNumber(access.cost)} 크레딧입니다.`
    : access.canAfford
      ? `현재 잔액 ${formatNumber(state.credits)} 크레딧에서 차감됩니다.`
      : `현재 잔액은 ${formatNumber(state.credits)} 크레딧이며 ${formatNumber(access.shortfall)} 크레딧이 부족합니다.`;
  const ctaLabel = isCustomPreset
    ? "전문가에게 맡기기"
    : access.mode === "free"
    ? access.requiresAds
      ? "광고 보고 무료 생성"
      : "무료 생성 시작"
    : access.canAfford
      ? `총 ${credits.total} 크레딧으로 생성 시작`
      : "크레딧 구매 후 생성";

  return `
    <section class="relative w-full rounded-xl overflow-hidden glass-panel glow-shadow p-4 flex gap-4 items-center">
      <img alt="${sourceImage.title}" class="w-20 h-24 rounded-lg object-cover" src="${sourceImage.url}" />
      <div class="flex-1">
        <p class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">STEP 2</p>
        <h1 class="font-display text-[30px] leading-none text-on-surface mt-2">생성 옵션을 선택하세요</h1>
        <p class="text-sm text-on-surface-variant mt-2">${sourceImage.title} 기준으로 생성 비용이 계산됩니다.</p>
      </div>
    </section>

    <section class="w-full glass-panel glow-shadow rounded-DEFAULT p-5 flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">NEXT ACCESS</span>
        <span class="font-label-caps text-label-caps text-primary">${formatNumber(state.credits)} CREDIT</span>
      </div>
      <h2 class="font-display text-[28px] leading-none text-on-surface">${nextFlowTitle}</h2>
      <p class="text-sm text-on-surface-variant">${nextFlowDescription}</p>
    </section>

    <section class="w-full glass-panel glow-shadow rounded-DEFAULT p-5 flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">PRESET</span>
        <span class="font-label-caps text-label-caps text-primary">${Math.max(availablePresets.length - 1, 0)} + CUSTOM</span>
      </div>
      <div class="grid grid-cols-2 gap-3">
        ${availablePresets.map(
          (preset) => `
            <button
              class="rounded-DEFAULT p-4 text-left transition-all active:scale-95 ${preset.id === state.selectedPresetId ? "bg-primary text-on-primary shadow-[0_8px_24px_rgba(129,80,92,0.2)]" : "bg-white/55 text-on-surface border border-white/50"}"
              data-preset-id="${preset.id}"
            >
              <p class="font-label-caps text-label-caps ${preset.id === state.selectedPresetId ? "text-white/80" : "text-primary"}">PRESET</p>
              <p class="font-display text-[24px] leading-[1.05] mt-2">${preset.name}</p>
              <p class="text-xs mt-2 ${preset.id === state.selectedPresetId ? "text-white/80" : "text-on-surface-variant"}">${preset.description}</p>
            </button>
          `,
        ).join("")}
      </div>
    </section>

    ${isCustomPreset ? `
      <section class="w-full glass-panel glow-shadow rounded-DEFAULT p-5 flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">CUSTOM SERVICE</span>
          <span class="font-label-caps text-label-caps text-primary">전문가 연결</span>
        </div>
        <p class="text-on-surface">커스텀 요청은 자동 생성 대신 대행 서비스로 연결됩니다. 야외 웨딩 스냅, 스튜디오 원본, 파리 에펠탑, 디즈니 무드, 드라마 로맨스를 기준으로 원하는 방향을 남기면 매니저가 직접 제작합니다.</p>
        <button class="w-full h-12 rounded-full glass-panel text-primary font-button" data-action="open-custom-preset">
          커스텀 요청 입력하기
        </button>
      </section>
    ` : ""}

    ${!isCustomPreset ? `
      <section class="w-full glass-panel glow-shadow rounded-DEFAULT p-5 flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">RATIO</span>
          <span class="font-label-caps text-label-caps text-primary">변환 시 +10</span>
        </div>
        <div class="flex flex-wrap gap-2">
          ${RATIO_OPTIONS.map(
            (ratio) => `
              <button
                class="px-4 py-3 rounded-full border transition-all active:scale-95 ${ratio.value === state.selectedRatio ? "bg-primary text-on-primary border-primary shadow-[0_8px_24px_rgba(129,80,92,0.2)]" : "glass-panel text-on-surface border-white/60"}"
                data-ratio="${ratio.value}"
              >
                ${ratio.label}
              </button>
            `,
          ).join("")}
        </div>
        ${state.selectedRatio === "custom" ? `
          <label class="flex flex-col gap-2">
            <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">CUSTOM RATIO</span>
            <input
              class="w-full rounded-full bg-white/70 border-white/60 focus:border-primary focus:ring-primary text-on-surface px-5 py-4"
              data-custom-ratio
              placeholder="예: 5:4"
              value="${escapeHtml(state.customRatio)}"
            />
          </label>
        ` : ""}
      </section>

      <section class="w-full glass-panel glow-shadow rounded-DEFAULT p-5 flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">UPSCALE</span>
          <span class="font-label-caps text-label-caps text-primary">+50</span>
        </div>
        <button class="w-full rounded-DEFAULT border border-white/50 ${state.useUpscale ? "bg-primary text-on-primary" : "bg-white/50 text-on-surface"} p-4 flex items-center justify-between transition-all active:scale-[0.98]" data-action="toggle-upscale">
          <div class="text-left">
            <p class="font-display text-[26px] leading-none">${state.useUpscale ? "고해상도 포함" : "기본 해상도"}</p>
            <p class="text-sm mt-2 ${state.useUpscale ? "text-white/80" : "text-on-surface-variant"}">${state.useUpscale ? "결과 화면에서 바로 업스케일 포함 상태로 표시됩니다." : "워터마크 포함 720p 미리보기로 생성합니다."}</p>
          </div>
          <span class="material-symbols-outlined text-[28px]" style="font-variation-settings: 'FILL' ${state.useUpscale ? 1 : 0};">auto_awesome</span>
        </button>
      </section>

      <section class="w-full glass-panel glow-shadow rounded-DEFAULT p-5 flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">CREDITS</span>
          <span class="font-label-caps text-label-caps text-primary">실시간 계산</span>
        </div>
        <div class="space-y-3 text-sm">
          <div class="flex items-center justify-between">
            <span>기본 생성</span>
            <span>25</span>
          </div>
          <div class="flex items-center justify-between">
            <span>비율 변환</span>
            <span>${credits.ratio}</span>
          </div>
          <div class="flex items-center justify-between">
            <span>업스케일</span>
            <span>${credits.upscale}</span>
          </div>
          <div class="flex items-center justify-between border-t border-white/40 pt-3 font-semibold text-primary">
            <span>총 크레딧</span>
            <span>${credits.total}</span>
          </div>
        </div>
      </section>
    ` : ""}

    <section class="w-full flex flex-col gap-3 mt-2">
      <button class="w-full h-14 rounded-full bg-primary/90 hover:bg-primary text-on-primary font-button text-button shadow-[0_8px_20px_rgba(129,80,92,0.3)] backdrop-blur-md border border-white/20 flex items-center justify-center gap-2 transition-all active:scale-95 group" data-action="start-generation">
        <span class="material-symbols-outlined group-hover:rotate-12 transition-transform" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
        ${ctaLabel}
      </button>
      <button class="w-full h-14 rounded-full glass-panel text-primary font-button text-button hover:bg-white/50 transition-all active:scale-95 flex items-center justify-center gap-2" data-action="open-credits" data-modal-reason="${access.mode === "paid" && !access.canAfford ? "shortage" : "header"}">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">diamond</span>
        크레딧 구매하기
      </button>
    </section>
  `;
}
