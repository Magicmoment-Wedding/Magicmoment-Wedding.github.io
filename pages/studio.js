import { getServiceCard } from "../mock/wedding-data.js";
import { formatCurrency } from "../services/format.js";

const STUDIO_SHOTS = ["정면", "좌측", "우측", "전신", "상반신", "표정 클로즈업", "드레스 디테일"];

export function renderStudioPage(state) {
  const service = getServiceCard("studio");

  return `
    <section class="w-full glass-panel glow-shadow rounded-DEFAULT p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <img alt="${service.title}" class="w-24 h-28 rounded-2xl object-cover" src="${service.thumbnail}" />
      <div class="flex-1">
      <div class="flex items-center justify-between">
        <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">HOME STUDIO</span>
        <span class="font-label-caps text-label-caps text-primary">15장 / 300,000원</span>
      </div>
      <h1 class="font-display text-[32px] leading-none text-on-surface">촬영 없이 웨딩사진 제작</h1>
      <p class="text-sm text-on-surface-variant">정면, 측면, 전신 등 7장의 기준 사진을 올리면 방구석 스튜디오 mock 결과로 이어집니다.</p>
      </div>
    </section>

    <section class="grid grid-cols-2 gap-3">
      ${STUDIO_SHOTS.map((label, index) => `
        <div class="glass-panel glow-shadow rounded-DEFAULT p-4 ${state.studioUploadCount > index ? "border border-primary/30" : ""}">
          <p class="font-label-caps text-label-caps ${state.studioUploadCount > index ? "text-primary" : "text-on-surface-variant"}">${state.studioUploadCount > index ? "UPLOADED" : "REQUIRED"}</p>
          <p class="text-sm text-on-surface mt-2">${label}</p>
        </div>
      `).join("")}
    </section>

    <section class="w-full glass-panel glow-shadow rounded-DEFAULT p-5 flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">UPLOAD PROGRESS</span>
        <span class="font-label-caps text-label-caps text-primary">${state.studioUploadCount}/7</span>
      </div>
      <div class="w-full rounded-full bg-white/60 h-2 overflow-hidden">
        <div class="h-full rounded-full bg-primary transition-all" style="width: ${(state.studioUploadCount / 7) * 100}%"></div>
      </div>
      <div class="flex gap-3">
        <button class="flex-1 h-12 rounded-full bg-primary text-on-primary font-button" data-action="add-studio-photo">
          사진 추가하기
        </button>
        <button class="flex-1 h-12 rounded-full glass-panel text-primary font-button" data-action="reset-studio-photos">
          다시 시작
        </button>
      </div>
    </section>

    <section class="w-full glass-panel glow-shadow rounded-DEFAULT p-5 flex items-center justify-between">
      <div>
        <p class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">PACKAGE</p>
        <p class="font-display text-[28px] leading-none text-on-surface mt-2">${formatCurrency(300000)}</p>
      </div>
      <button class="h-12 px-5 rounded-full bg-primary text-on-primary font-button" data-action="start-studio">
        사진 만들기 시작
      </button>
    </section>
  `;
}
