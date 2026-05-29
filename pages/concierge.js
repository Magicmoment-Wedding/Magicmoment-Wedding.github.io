import { getServiceCard } from "../mock/wedding-data.js";
import { escapeHtml, formatCurrency } from "../services/format.js";

const MOCK_CONCIERGE_IMAGES = [
  { url: "/mock-images/home/home_paris_couple_01.png", label: "파리 샘플" },
  { url: "/mock-images/home/home_disney_bride_01.png", label: "디즈니 샘플" },
  { url: "/mock-images/home/home_drama_couple_01.png", label: "드라마 샘플" },
];

function getMockConciergeImage(index) {
  return MOCK_CONCIERGE_IMAGES[index % MOCK_CONCIERGE_IMAGES.length];
}

export function renderConciergePage(state) {
  const service = getServiceCard("concierge");
  const hasUpload = state.conciergeUploadCount > 0;
  const uploadedImage = state.conciergeUploadedImage || getMockConciergeImage(0);

  return `
    <section class="w-full glass-panel glow-shadow rounded-DEFAULT p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <img alt="${service.title}" class="w-24 h-28 rounded-2xl object-cover" src="${service.thumbnail}" />
      <div class="flex-1">
      <div class="flex items-center justify-between">
        <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">CONCIERGE SERVICE</span>
        <span class="font-label-caps text-label-caps text-primary">10장 / 100,000원</span>
      </div>
      <h1 class="font-display text-[32px] leading-none text-on-surface">스튜디오 스냅사진을 업로드하면<br />매니저가 직접 배경을 제작해드립니다</h1>
      <p class="text-sm text-on-surface-variant">커스텀 프리셋, AI 상담, 결과 업셀에서 이어지는 대행 서비스 전용 mock 화면입니다.</p>
      </div>
    </section>

    <section class="w-full glass-panel glow-shadow rounded-DEFAULT p-5 flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">UPLOAD MOCK</span>
        <span class="font-label-caps text-label-caps text-primary">${hasUpload ? "업로드 완료" : "대기 중"}</span>
      </div>
      
      ${!hasUpload ? `
        <div class="rounded-DEFAULT bg-white/50 p-5 flex items-center justify-between">
          <div>
            <p class="font-display text-[28px] leading-none text-on-surface">스냅사진을 올려주세요</p>
            <p class="text-sm text-on-surface-variant mt-2">실제 파일 업로드 대신 mock 버튼으로 상태만 반영합니다.</p>
          </div>
          <button class="px-4 py-3 rounded-full bg-primary text-on-primary text-sm whitespace-nowrap" data-action="upload-concierge-photo">
            사진 업로드
          </button>
        </div>
      ` : `
        <div class="relative w-full rounded-lg overflow-hidden glass-panel glow-shadow">
          <img alt="업로드된 스냅사진" class="w-full aspect-[4/3] object-cover" src="${uploadedImage.url}" />
          <button class="absolute top-3 left-3 px-3 py-2 rounded-full bg-white/75 hover:bg-white text-on-surface text-sm font-button shadow-md backdrop-blur-sm transition-colors active:scale-95" data-action="upload-concierge-photo" title="다른 사진으로 변경">
            <span class="material-symbols-outlined align-middle" style="font-size: 16px; vertical-align: middle;">edit</span>
            <span class="ml-1 align-middle">사진 변경하기</span>
          </button>
          <button class="absolute top-3 right-3 px-3 py-2 rounded-full bg-white/75 hover:bg-white text-on-surface text-sm font-button shadow-md backdrop-blur-sm transition-colors active:scale-95" data-action="open-image-modal" data-image-url="${uploadedImage.url}" data-image-label="업로드 사진" title="크게 보기">
            <span class="material-symbols-outlined" style="font-size: 18px;">fullscreen</span>
          </button>
        </div>
      `}
      <input id="concierge-file-input" type="file" accept="image/*" class="hidden" data-file-input="concierge" />
    </section>

    <section class="w-full glass-panel glow-shadow rounded-DEFAULT p-5 flex flex-col gap-4">
      <label class="flex flex-col gap-2">
        <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">원하는 컨셉</span>
        <textarea class="w-full min-h-[120px] rounded-[1.5rem] bg-white/70 border-white/60 focus:border-primary focus:ring-primary text-on-surface px-5 py-4" data-concierge-concept placeholder="예: 야외 웨딩 스냅을 파리 에펠탑으로, 드레스는 그대로 유지">${escapeHtml(state.conciergeConcept)}</textarea>
      </label>
      <label class="flex flex-col gap-2">
        <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">추가 요청</span>
        <textarea class="w-full min-h-[96px] rounded-[1.5rem] bg-white/70 border-white/60 focus:border-primary focus:ring-primary text-on-surface px-5 py-4" data-concierge-extra placeholder="예: 드라마 로맨스 톤 유지, 꽃 장식 강조">${escapeHtml(state.conciergeExtraRequest)}</textarea>
      </label>
    </section>

    <section class="w-full glass-panel glow-shadow rounded-DEFAULT p-5 flex items-center justify-between">
      <div>
        <p class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">PRICE</p>
        <p class="font-display text-[28px] leading-none text-on-surface mt-2">${formatCurrency(100000)}</p>
      </div>
      <button class="h-12 px-5 rounded-full bg-primary text-on-primary font-button" data-action="submit-concierge">
        대행 서비스 신청
      </button>
    </section>
  `;
}
