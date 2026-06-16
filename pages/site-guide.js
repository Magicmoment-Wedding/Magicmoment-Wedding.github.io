import { GUIDE_COPY_ITEMS, renderGuideBody } from "../services/guide-copy.js";

export function renderSiteGuidePage() {
  const guideItems = GUIDE_COPY_ITEMS;

  return `
    <section class="w-full glass-panel glow-shadow rounded-DEFAULT p-5 flex flex-col gap-3">
      <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">SITE GUIDE</span>
      <h1 class="font-display text-[32px] leading-none text-on-surface">사이트 이용안내</h1>
      <p class="text-sm text-on-surface-variant">Magic Ai Studio의 기본 사용 흐름과 크레딧 안내를 확인할 수 있습니다.</p>
    </section>

    <section class="grid grid-cols-1 gap-3">
      ${guideItems.map((item) => `
        <article class="w-full glass-panel glow-shadow rounded-DEFAULT p-5 flex gap-4">
          <div class="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <span class="material-symbols-outlined text-[22px]" style="font-variation-settings: 'FILL' 1;">${item.icon}</span>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="font-display text-[24px] leading-tight text-on-surface">${item.title}</h2>
              ${item.badge ? `
                <span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">${item.badge}</span>
              ` : ""}
            </div>
            <div class="mt-2">
              ${renderGuideBody(item)}
            </div>
          </div>
        </article>
      `).join("")}
    </section>

    <section class="w-full flex flex-col gap-3 mt-2">
      <button class="w-full h-14 rounded-full bg-primary/90 hover:bg-primary text-on-primary font-button text-button shadow-[0_8px_20px_rgba(129,80,92,0.3)] flex items-center justify-center gap-2 transition-all active:scale-95" data-action="back">
        <span class="material-symbols-outlined">arrow_back</span>
        편집 화면으로 돌아가기
      </button>
      <button class="w-full h-14 rounded-full glass-panel text-primary font-button text-button hover:bg-white/50 transition-all active:scale-95" data-route="home">
        확인
      </button>
    </section>
  `;
}
