import { HOME_SHOWCASE, SERVICE_CARDS } from "../mock/wedding-data.js";
import { resolvePresetForSource } from "../mock/presets.js";
import { getGenerationAccess, getRemainingFreeGenerations } from "../services/credit.js";
import { formatNumber } from "../services/format.js";

export function renderHomePage(state) {
  const hasResults = state.results.length > 0;
  const access = getGenerationAccess(state);
  const freeRemaining = getRemainingFreeGenerations(state.freeGenerationsUsed);
  const activePreset = resolvePresetForSource(state.selectedPresetId, state.sourceImageId);
  const heroStory = HOME_SHOWCASE.find((item) => item.presetId === activePreset.id && item.sourceImageId === state.sourceImageId)
    ?? HOME_SHOWCASE.find((item) => item.presetId === activePreset.id)
    ?? HOME_SHOWCASE[0];
  const nextStatusText = access.mode === "free"
    ? access.requiresAds
      ? `${access.adsToWatch}개 광고 후 ${access.nextFreeNumber}번째 무료 생성`
      : "첫 생성은 광고 없이 무료"
    : access.canAfford
      ? `${formatNumber(access.cost)} 크레딧으로 다음 생성 가능`
      : "무료 종료, 크레딧 구매 후 계속 생성";

  return `
    <section class="relative w-full aspect-[4/5] rounded-xl overflow-hidden glass-panel glow-shadow flex flex-col">
      <div class="relative flex-grow w-full h-full">
        <img
          alt="Wedding sample"
          class="absolute inset-0 w-full h-full object-cover"
          src="${heroStory.thumbnail}"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent"></div>
        <div class="absolute top-4 left-4 glass-panel rounded-full px-4 py-2 text-label-caps font-label-caps text-on-surface tracking-widest">
          FREE ${freeRemaining}/3
        </div>
        <div class="absolute bottom-4 left-4 right-4 glass-panel rounded-DEFAULT p-4">
          <p class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">WEDDING SNAP AI</p>
          <h1 class="font-display text-[34px] leading-[1.05] text-on-surface mt-2">배경만 바꿔도<br />새로운 웨딩 화보가 됩니다</h1>
          <p class="text-sm text-on-surface-variant mt-3">${heroStory.title} · ${heroStory.mood}</p>
          <p class="text-sm text-on-surface-variant mt-2">${nextStatusText}</p>
        </div>
      </div>
    </section>

    <section class="w-full glass-panel glow-shadow rounded-DEFAULT p-5 flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">SERVICE FLOW</span>
        <span class="font-label-caps text-label-caps text-primary px-3 py-1 bg-primary-container/20 rounded-full border border-primary-container/30">MVP READY</span>
      </div>
      <div class="grid grid-cols-2 gap-3 text-sm text-on-surface">
        <div class="rounded-DEFAULT bg-white/45 p-4">
          <p class="font-label-caps text-label-caps text-primary">STEP 1</p>
          <p class="mt-2">샘플 이미지를 고르고</p>
        </div>
        <div class="rounded-DEFAULT bg-white/45 p-4">
          <p class="font-label-caps text-label-caps text-primary">STEP 2</p>
          <p class="mt-2">프리셋과 비율을 선택합니다</p>
        </div>
        <div class="rounded-DEFAULT bg-white/45 p-4">
          <p class="font-label-caps text-label-caps text-primary">STEP 3</p>
          <p class="mt-2">AI 생성 mock 로딩을 거칩니다</p>
        </div>
        <div class="rounded-DEFAULT bg-white/45 p-4">
          <p class="font-label-caps text-label-caps text-primary">STEP 4</p>
          <p class="mt-2">대표 결과와 썸네일을 확인합니다</p>
        </div>
      </div>
    </section>

    <section class="w-full glass-panel glow-shadow rounded-DEFAULT p-5 flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">FREE POLICY</span>
        <span class="font-label-caps text-label-caps text-primary">${formatNumber(state.credits)} CREDIT</span>
      </div>
      <p class="text-on-surface">총 3장 무료 체험 후 크레딧 구매로 전환되며, 2~3번째 생성은 광고 2개를 mock 시청한 뒤 이어집니다.</p>
      <div class="flex gap-3">
        <div class="flex-1 rounded-full bg-white/50 px-4 py-3 text-center text-sm">1장: 광고 없음</div>
        <div class="flex-1 rounded-full bg-white/50 px-4 py-3 text-center text-sm">2~3장: 광고 2개</div>
      </div>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div class="rounded-DEFAULT bg-white/45 p-4">
          <p class="font-label-caps text-label-caps text-primary">FREE LEFT</p>
          <p class="mt-2 text-on-surface">${freeRemaining}회 남음</p>
        </div>
        <div class="rounded-DEFAULT bg-white/45 p-4">
          <p class="font-label-caps text-label-caps text-primary">CURRENT CREDIT</p>
          <p class="mt-2 text-on-surface">${formatNumber(state.credits)} 크레딧</p>
        </div>
      </div>
    </section>

    <section class="w-full glass-panel glow-shadow rounded-DEFAULT p-5 flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">STYLE GALLERY</span>
        <button class="font-label-caps text-label-caps text-primary" data-route="gallery">전체 보기</button>
      </div>
      <div class="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
        ${HOME_SHOWCASE.map((style) => `
          <article class="min-w-[15rem] w-[15rem] rounded-xl overflow-hidden glass-panel border border-white/50">
            <div class="relative aspect-[4/5]">
              <img alt="${style.title}" class="absolute inset-0 w-full h-full object-cover" src="${style.thumbnail}" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent"></div>
              <div class="absolute bottom-3 left-3 right-3">
                <p class="font-display text-[24px] leading-none text-white">${style.title}</p>
                <p class="text-xs text-white/80 mt-2">${style.badge}</p>
              </div>
            </div>
            <div class="p-4">
              <button class="w-full h-11 rounded-full bg-primary text-on-primary text-sm" data-gallery-style-id="gallery-${style.presetId}">
                이 스타일로 만들기
              </button>
            </div>
          </article>
        `).join("")}
      </div>
    </section>

    <section class="w-full glass-panel glow-shadow rounded-DEFAULT p-5 flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">EXPANDED SERVICE</span>
        <span class="font-label-caps text-label-caps text-primary">MORE</span>
      </div>
      <div class="grid grid-cols-1 gap-3">
        ${SERVICE_CARDS.filter((item) => ["studio", "assistant", "concierge"].includes(item.route)).map((item) => `
        <button class="rounded-DEFAULT bg-white/45 p-4 text-left flex items-center justify-between gap-4 transition-transform active:scale-[0.98]" data-route="${item.route}">
          <div>
            <p class="font-display text-[26px] leading-none text-on-surface">${item.title}</p>
            <p class="text-sm text-on-surface-variant mt-2">${item.description}</p>
          </div>
          <img alt="${item.title}" class="w-16 h-16 rounded-xl object-cover border border-white/60 flex-shrink-0" src="${item.thumbnail}" />
        </button>
        `).join("")}
      </div>
    </section>

    <section class="w-full flex flex-col gap-3 mt-2">
      <button class="w-full h-14 rounded-full bg-primary/90 hover:bg-primary text-on-primary font-button text-button shadow-[0_8px_20px_rgba(129,80,92,0.3)] backdrop-blur-md border border-white/20 flex items-center justify-center gap-2 transition-all active:scale-95 group" data-route="create">
        <span class="material-symbols-outlined group-hover:rotate-12 transition-transform" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
        생성하기
      </button>
      <button class="w-full h-14 rounded-full glass-panel text-primary font-button text-button hover:bg-white/50 transition-all active:scale-95 flex items-center justify-center gap-2" data-action="open-credits" data-modal-reason="header">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">diamond</span>
        크레딧 구매하기
      </button>
      <button class="w-full h-14 rounded-full glass-panel text-primary font-button text-button hover:bg-white/50 transition-all active:scale-95 flex items-center justify-center gap-2" data-route="${hasResults ? "result" : "create"}">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">photo_library</span>
        ${hasResults ? "최근 결과 보기" : "샘플 선택으로 이동"}
      </button>
    </section>
  `;
}
