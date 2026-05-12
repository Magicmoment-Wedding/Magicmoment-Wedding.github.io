import { PRESETS } from "../mock/presets.js";
import { SOURCE_IMAGES, getSourceImage } from "../mock/sources.js";

export function renderCreatePage(state) {
  const sourceImage = getSourceImage(state.sourceImageId);
  const selectedPreset = PRESETS.find((item) => item.id === state.selectedPresetId);

  return `
    <section class="w-full glass-panel glow-shadow rounded-DEFAULT p-5 flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">STEP 1</span>
        <span class="font-label-caps text-label-caps text-primary">UPLOAD MOCK</span>
      </div>
      <h1 class="font-display text-[32px] leading-none text-on-surface">원본 이미지를 선택하세요</h1>
      <p class="text-sm text-on-surface-variant">실제 업로드 대신 mock 이미지 선택으로 흐름만 구현했습니다.</p>
    </section>

    ${selectedPreset ? `
      <section class="w-full glass-panel glow-shadow rounded-DEFAULT p-5 flex items-center justify-between gap-4">
        <div>
          <p class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">SELECTED STYLE</p>
          <p class="font-display text-[28px] leading-none text-on-surface mt-2">${selectedPreset.name}</p>
          <p class="text-sm text-on-surface-variant mt-2">${selectedPreset.description}</p>
        </div>
        <button class="px-4 py-3 rounded-full glass-panel text-primary text-sm" data-route="${selectedPreset.id === "custom" ? "concierge" : "options"}">
          ${selectedPreset.id === "custom" ? "대행 연결" : "옵션 보기"}
        </button>
      </section>
    ` : ""}

    <section class="relative w-full aspect-[4/5] rounded-xl overflow-hidden glass-panel glow-shadow flex flex-col">
      <div class="relative flex-grow w-full h-full">
        <img
          alt="${sourceImage.title}"
          class="absolute inset-0 w-full h-full object-cover"
          src="${sourceImage.url}"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
        <div class="absolute left-4 bottom-4 right-4 glass-panel rounded-DEFAULT p-4">
          <p class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">SELECTED SOURCE</p>
          <p class="font-display text-[28px] leading-none text-on-surface mt-2">${sourceImage.title}</p>
          <p class="text-sm text-on-surface-variant mt-2">${sourceImage.subtitle}</p>
        </div>
      </div>
    </section>

    <section class="w-full flex gap-3 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-2 pt-1 px-1">
      ${SOURCE_IMAGES.map(
        (item) => `
          <button class="flex-shrink-0 w-24 h-28 rounded-lg overflow-hidden snap-center relative ${item.id === state.sourceImageId ? "border-2 border-primary-container shadow-md" : "border border-white/50 glass-panel opacity-80"} transition-transform active:scale-95" data-source-id="${item.id}">
            <img alt="${item.title}" class="w-full h-full object-cover" src="${item.url}" />
            <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-2 text-left">
              <p class="text-[11px] leading-tight text-white">${item.title}</p>
            </div>
            ${item.id === state.sourceImageId ? `
              <div class="absolute top-1 right-1 bg-primary-container text-on-primary-container rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                <span class="material-symbols-outlined text-[12px]" style="font-variation-settings: 'FILL' 1;">check</span>
              </div>
            ` : ""}
          </button>
        `,
      ).join("")}
    </section>

    <section class="w-full glass-panel glow-shadow rounded-DEFAULT p-5 flex flex-col gap-3">
      <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">GENERATION PROCESS</span>
      <div class="space-y-2 text-sm text-on-surface">
        <p>1. 이미지 업로드</p>
        <p>2. AI 분석</p>
        <p>3. 1차 생성 2장</p>
        <p>4. 실패 시 2차 생성 2장</p>
        <p>5. 총 4장 중 대표 결과 선택</p>
      </div>
    </section>

    <section class="w-full flex flex-col gap-3 mt-2">
      <button class="w-full h-14 rounded-full bg-primary/90 hover:bg-primary text-on-primary font-button text-button shadow-[0_8px_20px_rgba(129,80,92,0.3)] backdrop-blur-md border border-white/20 flex items-center justify-center gap-2 transition-all active:scale-95 group" data-route="options">
        <span class="material-symbols-outlined group-hover:rotate-12 transition-transform" style="font-variation-settings: 'FILL' 1;">tune</span>
        ${selectedPreset?.id === "custom" ? "커스텀 요청 이어가기" : "옵션 선택하기"}
      </button>
    </section>
  `;
}
