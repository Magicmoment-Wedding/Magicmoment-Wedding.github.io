import { HOME_SHOWCASE, SERVICE_CARDS } from "../mock/wedding-data.js";

function getServiceCard(route, fallback = {}) {
  return SERVICE_CARDS.find((item) => item.route === route) ?? fallback;
}

export function renderHomePage() {
  const parisImage = HOME_SHOWCASE[0]?.thumbnail ?? "mock-images/home/home_paris_couple_01.png";
  const disneyImage = HOME_SHOWCASE[1]?.thumbnail ?? "mock-images/home/home_disney_bride_01.png";
  const assistant = getServiceCard("assistant", { route: "assistant", title: "어시스턴트" });

  return `
    <section class="pt-1">
      <h1 class="font-display text-[28px] leading-tight text-on-surface">웨딩사진을 여행처럼</h1>
      <p class="mt-2 text-sm leading-6 text-on-surface-variant">AI가 당신의 웨딩사진을 새로운 순간으로 바꿔드려요.</p>
      <div class="mt-5 overflow-hidden rounded-[22px] bg-white shadow-[0_18px_48px_rgba(129,80,92,0.12)] border border-white/80">
        <div class="grid grid-cols-2">
          <div class="relative min-w-0 overflow-hidden">
            <img src="mock-images/before/before_studio_couple_01.jpg" alt="Before" class="h-36 w-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent"></div>
            <span class="absolute left-3 top-3 rounded-full bg-black/35 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-sm">Before</span>
          </div>
          <div class="relative min-w-0 overflow-hidden">
            <img src="${parisImage}" alt="After" class="h-36 w-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent"></div>
            <span class="absolute right-3 top-3 rounded-full bg-black/35 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-sm">After</span>
          </div>
        </div>
      </div>
    </section>

    <section class="mt-7">
      <h2 class="text-[17px] font-semibold text-on-surface">인기 웨딩 스타일</h2>
      <div class="mt-4 space-y-4">
        <article class="overflow-hidden rounded-[18px] bg-white shadow-[0_14px_38px_rgba(129,80,92,0.10)] border border-white/85">
          <img src="${parisImage}" alt="파리 에펠탑" class="h-40 w-full object-cover" />
          <div class="px-5 pb-5 pt-4 text-center">
            <h3 class="font-display text-[25px] leading-none text-on-surface">파리 에펠탑</h3>
            <p class="mt-2 text-sm text-on-surface-variant">유럽 여행 스냅처럼</p>
            <button class="mt-4 h-11 w-full rounded-full bg-[#701e34] text-white text-sm font-semibold shadow-[0_10px_24px_rgba(112,30,52,0.18)]" data-route="create">
              지금 편집하기
            </button>
          </div>
        </article>

        <article class="overflow-hidden rounded-[18px] bg-white shadow-[0_14px_38px_rgba(129,80,92,0.10)] border border-white/85">
          <img src="${disneyImage}" alt="디즈니 공주" class="h-40 w-full object-cover" />
          <div class="px-5 pb-5 pt-4 text-center">
            <h3 class="font-display text-[25px] leading-none text-on-surface">디즈니 공주</h3>
            <p class="mt-2 text-sm text-on-surface-variant">실사 동화풍 웨딩 콘셉트</p>
            <button class="mt-4 h-11 w-full rounded-full bg-[#701e34] text-white text-sm font-semibold shadow-[0_10px_24px_rgba(112,30,52,0.18)]" data-route="create">
              지금 편집하기
            </button>
          </div>
        </article>
      </div>
    </section>

    <section class="mt-7 pb-6">
      <h2 class="text-[17px] font-semibold text-on-surface">더 많은 기능</h2>
      <div class="mt-4 grid grid-cols-3 gap-3">
        <button class="min-h-[82px] rounded-[18px] bg-white/75 p-3 text-center shadow-sm border border-white/80 flex flex-col items-center justify-center gap-2 text-on-surface-variant" data-route="${assistant.route}">
          <span class="material-symbols-outlined text-[22px] text-outline" style="font-variation-settings: 'wght' 300;">auto_awesome</span>
          <span class="text-[11px] font-medium">어시스턴트</span>
        </button>
        <button class="min-h-[82px] rounded-[18px] bg-white/75 p-3 text-center shadow-sm border border-white/80 flex flex-col items-center justify-center gap-2 text-on-surface-variant" data-route="gallery">
          <span class="material-symbols-outlined text-[22px] text-outline" style="font-variation-settings: 'wght' 300;">photo_library</span>
          <span class="text-[11px] font-medium">갤러리</span>
        </button>
        <button class="min-h-[82px] rounded-[18px] bg-white/75 p-3 text-center shadow-sm border border-white/80 flex flex-col items-center justify-center gap-2 text-on-surface-variant" data-route="more">
          <span class="material-symbols-outlined text-[22px] text-outline" style="font-variation-settings: 'wght' 300;">forum</span>
          <span class="text-[11px] font-medium">커뮤니티</span>
        </button>
      </div>
    </section>
  `;
}
