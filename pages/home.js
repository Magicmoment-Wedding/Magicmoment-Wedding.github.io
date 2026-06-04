import { renderBeforeAfterSlider } from "../components/before-after-slider.js";
import { HOME_SHOWCASE } from "../mock/wedding-data.js";

export function renderHomePage() {
  const parisImage = HOME_SHOWCASE[0]?.thumbnail ?? "mock-images/home/home_paris_couple_01.png";
  const disneyImage = HOME_SHOWCASE[1]?.thumbnail ?? "mock-images/home/home_disney_bride_01.png";

  return `
    <section class="pt-1">
      <h1 class="font-display text-[28px] leading-tight text-on-surface">웨딩사진을 여행처럼</h1>
      <p class="mt-2 text-sm leading-6 text-on-surface-variant">AI가 당신의 웨딩사진을 새로운 순간으로 바꿔드려요.</p>
      <div class="mt-5">
        ${renderBeforeAfterSlider({
          beforeSrc: "mock-images/before/before_studio_couple_01.jpg",
          afterSrc: parisImage,
          beforeLabel: "BEFORE",
          afterLabel: "AFTER",
          beforeAlt: "편집 전 원본 웨딩사진",
          afterAlt: "AI 편집 후 파리 웨딩사진",
        })}
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
        <button class="min-h-[82px] rounded-[18px] bg-white/75 p-3 text-center shadow-sm border border-white/80 flex flex-col items-center justify-center gap-2 text-on-surface-variant" data-action="open-assistant-chat">
          <span class="material-symbols-outlined text-[22px] text-outline" style="font-variation-settings: 'wght' 300;">auto_awesome</span>
          <span class="text-[11px] font-medium">어시스턴트</span>
        </button>
        <button class="min-h-[82px] rounded-[18px] bg-white/75 p-3 text-center shadow-sm border border-white/80 flex flex-col items-center justify-center gap-2 text-on-surface-variant" data-route="gallery">
          <span class="material-symbols-outlined text-[22px] text-outline" style="font-variation-settings: 'wght' 300;">photo_library</span>
          <span class="text-[10px] font-medium leading-tight">스타일 갤러리</span>
        </button>
        <button class="min-h-[82px] rounded-[18px] bg-white/75 p-3 text-center shadow-sm border border-white/80 flex flex-col items-center justify-center gap-2 text-on-surface-variant" data-route="more">
          <span class="material-symbols-outlined text-[22px] text-outline" style="font-variation-settings: 'wght' 300;">forum</span>
          <span class="text-[11px] font-medium">커뮤니티</span>
        </button>
      </div>
    </section>
  `;
}
