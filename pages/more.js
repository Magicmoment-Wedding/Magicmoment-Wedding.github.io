import { SERVICE_CARDS } from "../mock/wedding-data.js";

export function renderMorePage() {
  const items = SERVICE_CARDS;

  return `
    <section class="w-full glass-panel glow-shadow rounded-DEFAULT p-5 flex flex-col gap-3">
      <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">MORE FEATURES</span>
      <h1 class="font-display text-[32px] leading-none text-on-surface">제작, 대행, 상담까지 한 곳에서</h1>
      <p class="text-sm text-on-surface-variant">단순 생성 앱을 넘어 웨딩 사진 제작과 확장 서비스를 자연스럽게 이어주는 메뉴 허브입니다.</p>
    </section>

    <section class="w-full glass-panel glow-shadow rounded-DEFAULT p-5 flex items-center justify-between gap-4">
      <div>
        <p class="font-label-caps text-label-caps text-primary tracking-widest">GUIDE</p>
        <p class="font-display text-[28px] leading-none text-on-surface mt-2">사이트 이용안내</p>
        <p class="text-sm text-on-surface-variant mt-3">업로드, 스타일 선택, 저장, 이용권 안내를 확인합니다.</p>
      </div>
      <button class="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center flex-shrink-0" data-route="site-guide" aria-label="사이트 이용안내 보기">
        <span class="material-symbols-outlined">arrow_forward</span>
      </button>
    </section>

    <section class="grid grid-cols-1 gap-4">
      ${items.map((item) => `
        <button class="w-full glass-panel glow-shadow rounded-xl p-5 text-left flex items-center justify-between gap-4 transition-transform active:scale-[0.98]" ${item.route === "assistant" ? 'data-action="open-assistant-chat"' : `data-route="${item.route}"`}>
          <div class="flex-1">
            <p class="font-label-caps text-label-caps text-primary tracking-widest">${item.preset} · ${item.mood}</p>
            <p class="font-display text-[28px] leading-none text-on-surface mt-2">${item.title}</p>
            <p class="text-sm text-on-surface-variant mt-3">${item.description}</p>
          </div>
          <div class="w-20 h-20 rounded-2xl overflow-hidden border border-white/60 flex items-center justify-center flex-shrink-0 bg-white/40">
            <img alt="${item.title}" class="w-full h-full object-cover" src="${item.thumbnail}" />
          </div>
        </button>
      `).join("")}
    </section>
  `;
}
