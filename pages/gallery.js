import { STYLE_GALLERY } from "../mock/gallery.js";
import { formatNumber } from "../services/format.js";

export function renderGalleryPage(state) {
  return `
    <section class="w-full glass-panel glow-shadow rounded-DEFAULT p-5 flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">STYLE GALLERY</span>
        <span class="font-label-caps text-label-caps text-primary">${STYLE_GALLERY.length} STYLES</span>
      </div>
      <h1 class="font-display text-[32px] leading-none text-on-surface">웨딩 스타일을 먼저 탐색해보세요</h1>
      <p class="text-sm text-on-surface-variant">사용자 결과 기반 mock 카드로 구성된 갤러리입니다. 마음에 드는 무드를 고르면 바로 생성 플로우로 이어집니다.</p>
    </section>

    <section class="grid grid-cols-1 gap-4">
      ${STYLE_GALLERY.map((style) => `
        <article class="glass-panel glow-shadow rounded-xl overflow-hidden">
          <div class="relative aspect-[4/3]">
            <img alt="${style.title}" class="absolute inset-0 w-full h-full object-cover" src="${style.thumbnail}" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            <div class="absolute top-4 left-4 glass-panel rounded-full px-4 py-2 text-label-caps font-label-caps text-on-surface tracking-widest">
              ${style.badge}
            </div>
            <div class="absolute bottom-4 left-4 right-4">
              <h2 class="font-display text-[30px] leading-none text-white">${style.title}</h2>
              <p class="text-sm text-white/80 mt-2">${style.description}</p>
            </div>
          </div>
          <div class="p-5 flex items-center justify-between gap-4">
            <div>
              <p class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">USER PICK</p>
              <p class="text-sm text-on-surface mt-2">${style.preset} · ${style.mood}</p>
            </div>
            <button class="px-4 py-3 rounded-full bg-primary text-on-primary text-sm whitespace-nowrap" data-gallery-style-id="${style.id}">
              이 스타일로 만들기
            </button>
          </div>
        </article>
      `).join("")}
    </section>

    <section class="w-full glass-panel glow-shadow rounded-DEFAULT p-5 flex items-center justify-between">
      <div>
        <p class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">CURRENT CREDIT</p>
        <p class="font-display text-[28px] leading-none text-on-surface mt-2">${formatNumber(state.credits)}</p>
      </div>
      <button class="h-12 px-5 rounded-full glass-panel text-primary font-button" data-route="create">
        생성 플로우 열기
      </button>
    </section>
  `;
}
