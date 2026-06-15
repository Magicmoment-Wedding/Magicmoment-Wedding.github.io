import { CREDIT_PACKAGES } from "../services/credit.js";
import { escapeHtml, formatCurrency, formatNumber } from "../services/format.js";

function renderShell(content, dismissable = true) {
  return `
    <div class="fixed inset-0 z-[75] bg-black/20 backdrop-blur-md flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
      <div class="w-full max-w-md glass-panel glow-shadow rounded-[2rem] border border-white/60 overflow-hidden">
        ${dismissable ? `
          <div class="flex justify-end p-4 pb-0">
            <button class="w-9 h-9 rounded-full bg-white/60 text-on-surface flex items-center justify-center" data-action="close-modal">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        ` : ""}
        <div class="px-6 ${dismissable ? "pb-6 pt-2" : "py-6"}">
          ${content}
        </div>
      </div>
    </div>
  `;
}

function getCreditTitle(modal) {
  if (modal.reason === "upscale") {
    return "고해상도 변환에는 추가 크레딧이 필요합니다";
  }

  if (modal.reason === "post-free") {
    return "무료 생성이 모두 완료되었습니다";
  }

  if (modal.reason === "shortage") {
    return "크레딧이 부족합니다";
  }

  return "크레딧을 충전하고 계속 생성해보세요";
}

function getCreditDescription(modal, credits) {
  if (modal.reason === "upscale") {
    return `업스케일에는 50 크레딧이 필요합니다. 현재 잔액은 ${formatNumber(credits)} 크레딧입니다.`;
  }

  if (modal.reason === "post-free") {
    return "이제부터는 크레딧으로 생성, 비율 변환, 업스케일을 이어갈 수 있습니다.";
  }

  if (modal.reason === "shortage") {
    return `현재 작업에는 ${formatNumber(modal.requiredCredits ?? 0)} 크레딧이 필요합니다. 부족한 크레딧을 충전해 주세요.`;
  }

  return "실제 결제 연동 전 테스트 충전으로 잔액을 확인할 수 있습니다.";
}

function renderAdsModal(modal) {
  const isComplete = modal.status === "complete";

  return renderShell(`
    <div class="flex flex-col items-center text-center gap-4">
      <div class="w-14 h-14 rounded-full border-[3px] border-primary/20 border-t-primary ${isComplete ? "" : "animate-spin"}"></div>
      <div class="space-y-2">
        <p class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">AD MOCK</p>
        <h3 class="font-display text-[30px] leading-none text-primary">${isComplete ? "광고 시청 완료" : "광고 시청 중..."}</h3>
        <p class="text-sm text-on-surface">
          ${isComplete ? `무료 생성 조건이 충족되었습니다. 잠시 후 자동으로 생성이 시작됩니다.` : `${modal.step}/${modal.total} 광고를 mock으로 재생하고 있습니다.`}
        </p>
      </div>
      <div class="w-full rounded-full bg-white/60 h-2 overflow-hidden">
        <div class="h-full rounded-full bg-primary transition-all duration-500" style="width: ${(modal.step / modal.total) * 100}%"></div>
      </div>
      <button class="w-full h-12 rounded-full bg-primary text-on-primary font-button ${isComplete ? "" : "opacity-50 pointer-events-none"}" data-action="close-modal">
        ${isComplete ? "닫기" : "광고 진행 중"}
      </button>
    </div>
  `, false);
}

function renderCreditsModal(modal, state) {
  return renderShell(`
    <div class="flex flex-col gap-5">
      <div class="space-y-2">
        <p class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">CREDIT SHOP</p>
        <h3 class="font-display text-[30px] leading-none text-on-surface">${getCreditTitle(modal)}</h3>
        <p class="text-sm text-on-surface-variant">${getCreditDescription(modal, state.credits)}</p>
      </div>
      <div class="rounded-DEFAULT bg-white/45 p-4 flex items-center justify-between">
        <span class="text-sm text-on-surface-variant">현재 보유 크레딧</span>
        <span class="text-lg font-semibold text-primary">${formatNumber(state.credits)}</span>
      </div>
      <div class="space-y-3">
        ${CREDIT_PACKAGES.map((pack) => {
          const isCharging = state.chargingCreditPackageId === pack.id;

          return `
          <div class="rounded-DEFAULT bg-white/55 border border-white/50 p-4 flex items-center justify-between gap-4">
            <div>
              <p class="font-display text-[24px] leading-none text-on-surface">${escapeHtml(pack.name)}</p>
              <p class="text-sm text-on-surface-variant mt-2">${escapeHtml(pack.description)}</p>
              <p class="text-sm text-primary mt-2">${formatCurrency(pack.price)}</p>
            </div>
            <button
              class="px-4 py-3 rounded-full bg-primary text-on-primary text-sm whitespace-nowrap disabled:opacity-60 disabled:pointer-events-none"
              data-credit-package="${pack.id}"
              ${state.chargingCreditPackageId ? "disabled" : ""}
            >
              ${isCharging ? "충전 중..." : "테스트 충전"}
            </button>
          </div>
          `;
        }).join("")}
      </div>
      <button class="w-full h-12 rounded-full glass-panel text-primary font-button" data-action="close-modal">
        나중에 하기
      </button>
    </div>
  `);
}

function renderPaywallModal() {
  return renderShell(`
    <div class="flex flex-col gap-5 text-center">
      <div class="space-y-2">
        <p class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">FREE LIMIT</p>
        <h3 class="font-display text-[32px] leading-none text-on-surface">무료 생성이 모두 완료되었습니다</h3>
        <p class="text-sm text-on-surface-variant">이제부터는 크레딧 충전 후 같은 생성 흐름을 이어갈 수 있습니다.</p>
      </div>
      <button class="w-full h-12 rounded-full bg-primary text-on-primary font-button" data-action="open-credits" data-modal-reason="post-free">
        크레딧 충전하기
      </button>
      <button class="w-full h-12 rounded-full glass-panel text-primary font-button" data-action="close-modal">
        나중에 하기
      </button>
    </div>
  `);
}

function renderSuccessModal(modal) {
  return renderShell(`
    <div class="flex flex-col gap-5 text-center">
      <div class="w-14 h-14 mx-auto rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
        <span class="material-symbols-outlined text-primary text-[28px]" style="font-variation-settings: 'FILL' 1;">check_circle</span>
      </div>
      <div class="space-y-2">
        <p class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">MOCK COMPLETE</p>
        <h3 class="font-display text-[30px] leading-none text-on-surface">${escapeHtml(modal.title ?? "처리가 완료되었습니다")}</h3>
        <p class="text-sm text-on-surface-variant">${escapeHtml(modal.description ?? "mock 응답으로 완료 상태만 표현합니다.")}</p>
      </div>
      <button class="w-full h-12 rounded-full bg-primary text-on-primary font-button" data-action="close-modal">
        확인
      </button>
    </div>
  `);
}

function renderPhotoSaveGuideModal(modal) {
  return `
    <div class="fixed inset-0 z-[100] bg-[#171113]/95 px-4 py-5 sm:p-8">
      <div class="mx-auto flex h-full w-full max-w-3xl flex-col gap-4">
        <div class="flex items-center justify-between gap-3 text-white">
          <div class="min-w-0">
            <p class="font-display text-[24px] leading-tight">사진으로 저장하기</p>
            <p class="mt-1 text-xs leading-5 text-white/70">${escapeHtml(modal.label ?? "이미지 저장 안내")}</p>
          </div>
          <button class="h-10 shrink-0 rounded-full bg-white/15 px-4 text-sm font-bold text-white hover:bg-white/25" data-action="close-modal" type="button">돌아가기</button>
        </div>
        <div class="min-h-0 flex-1 overflow-auto rounded-[24px] bg-black/30 p-3">
          <img alt="${escapeHtml(modal.label ?? "저장할 이미지")}" class="mx-auto block max-h-[70vh] max-w-full rounded-[18px] object-contain shadow-2xl" src="${escapeHtml(modal.imageUrl ?? "")}" />
        </div>
        <div class="rounded-[22px] bg-white px-4 py-4 text-[#3a2a2e] shadow-2xl">
          <p class="text-base font-bold">이미지를 길게 눌러 ‘사진에 저장’ 또는 ‘이미지 저장’을 선택해 주세요.</p>
          <p class="mt-1 text-sm leading-6 text-[#6f5b60]">앱에 따라 메뉴 이름이 다를 수 있어요.</p>
          <p class="mt-3 rounded-[16px] bg-[#f8eef1] px-3 py-2 text-sm leading-6 text-[#701e34]">저장 메뉴가 보이지 않으면 외부 브라우저로 열어 다시 시도해 주세요.</p>
        </div>
      </div>
    </div>
  `;
}

function renderCustomPresetModal(state) {
  return renderShell(`
    <div class="flex flex-col gap-5">
      <div class="space-y-2">
        <p class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">CUSTOM PRESET</p>
        <h3 class="font-display text-[30px] leading-none text-on-surface">원하는 스타일을 전문가에게 맡겨보세요</h3>
        <p class="text-sm text-on-surface-variant">자동 생성 대신 대행 서비스로 연결되는 커스텀 요청 모달입니다.</p>
      </div>
      <label class="flex flex-col gap-2">
        <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">원하는 스타일</span>
        <input class="w-full rounded-full bg-white/70 border-white/60 focus:border-primary focus:ring-primary text-on-surface px-5 py-4" data-custom-style placeholder="예: 야외 웨딩 스냅 + 파리 에펠탑" value="${escapeHtml(state.customPresetDraft.style)}" />
      </label>
      <label class="flex flex-col gap-2">
        <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">추가 요청</span>
        <textarea class="w-full min-h-[110px] rounded-[1.5rem] bg-white/70 border-white/60 focus:border-primary focus:ring-primary text-on-surface px-5 py-4" data-custom-extra placeholder="예: 디즈니 무드로 바꾸고 꽃 장식을 더 풍성하게">${escapeHtml(state.customPresetDraft.extra)}</textarea>
      </label>
      <button class="w-full h-12 rounded-full bg-primary text-on-primary font-button" data-action="submit-custom-preset">
        전문가에게 맡기기
      </button>
    </div>
  `);
}

function renderLoginRequiredModal() {
  return renderShell(`
    <div class="flex flex-col gap-5 text-center">
      <div class="w-14 h-14 mx-auto rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
        <span class="material-symbols-outlined text-primary text-[28px]" style="font-variation-settings: 'FILL' 1;">person</span>
      </div>
      <div class="space-y-2">
        <p class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">LOGIN REQUIRED</p>
        <h3 class="font-display text-[30px] leading-none text-on-surface">로그인이 필요합니다</h3>
        <p class="text-sm text-on-surface-variant">첫 1회 무료 제작과 크레딧 상태 확인을 위해 로그인 후 다시 시도해 주세요.</p>
      </div>
      <button class="w-full h-12 rounded-full bg-primary text-on-primary font-button" data-action="close-modal">
        확인
      </button>
    </div>
  `);
}

function renderImageModal(imageModal) {
  const items = Array.isArray(imageModal.items) ? imageModal.items : [];
  const hasNavigation = items.length > 1;

  return `
    <div class="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex items-center justify-center px-3 py-5 sm:p-8" data-image-modal-overlay>
      <div class="relative w-full h-full max-w-6xl flex flex-col gap-3" data-image-modal-shell>
        <div class="flex items-center justify-between gap-3 text-white">
          <div class="flex items-center gap-2 min-w-0">
            <span class="font-label-caps text-label-caps tracking-widest truncate">${escapeHtml(imageModal.label ?? "이미지 확대")}</span>
            ${imageModal.isRecommended ? `
              <span class="shrink-0 rounded-full bg-primary text-on-primary px-3 py-1 font-label-caps text-label-caps shadow-md">AI 추천</span>
            ` : ""}
          </div>
          <button class="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors" data-action="close-image-modal" aria-label="닫기">
            <span class="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>
        <div class="relative flex-1 min-h-0 flex items-center justify-center">
          ${hasNavigation ? `
            <button class="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white items-center justify-center transition-colors" data-action="image-modal-prev" aria-label="이전 이미지">
              <span class="material-symbols-outlined">chevron_left</span>
            </button>
            <button class="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white items-center justify-center transition-colors" data-action="image-modal-next" aria-label="다음 이미지">
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
          ` : ""}
          <img alt="${escapeHtml(imageModal.label ?? "확대 이미지")}" class="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none" src="${imageModal.url}" />
        </div>
        ${hasNavigation ? `
          <div class="flex items-center justify-center gap-3">
            <button class="sm:hidden w-12 h-12 rounded-full bg-white/15 text-white flex items-center justify-center" data-action="image-modal-prev" aria-label="이전 이미지">
              <span class="material-symbols-outlined">chevron_left</span>
            </button>
            <span class="text-white/80 text-sm">${(imageModal.index ?? 0) + 1} / ${items.length}</span>
            <button class="sm:hidden w-12 h-12 rounded-full bg-white/15 text-white flex items-center justify-center" data-action="image-modal-next" aria-label="다음 이미지">
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        ` : ""}
        <div class="flex flex-col items-center gap-2">
          <button class="h-12 min-w-52 rounded-full bg-white/90 px-6 text-primary font-button flex items-center justify-center gap-2" data-action="save-image-modal">
            <span class="material-symbols-outlined text-[20px]">photo_library</span>
            <span>${escapeHtml(imageModal.saveLabel ?? "사진으로 저장")}</span>
          </button>
          <p class="max-w-sm text-center text-xs leading-5 text-white/70">${escapeHtml(imageModal.saveHelp ?? "이미지를 길게 눌러 ‘사진에 저장’ 또는 ‘이미지 저장’을 선택해 주세요.")}</p>
        </div>
      </div>
    </div>
  `;
}

export function renderModal(state) {
  const imageModal = state.activeImageModal;
  const modal = state.activeModal;
  const modalHtml = [];

  if (imageModal?.url) {
    modalHtml.push(renderImageModal(imageModal));
  }

  if (!modal) {
    return modalHtml.join("");
  }

  if (modal.type === "ads") {
    modalHtml.push(renderAdsModal(modal));
    return modalHtml.join("");
  }

  if (modal.type === "credits") {
    modalHtml.push(renderCreditsModal(modal, state));
    return modalHtml.join("");
  }

  if (modal.type === "paywall") {
    modalHtml.push(renderPaywallModal());
    return modalHtml.join("");
  }

  if (modal.type === "success") {
    modalHtml.push(renderSuccessModal(modal));
    return modalHtml.join("");
  }

  if (modal.type === "photoSaveGuide") {
    modalHtml.push(renderPhotoSaveGuideModal(modal));
    return modalHtml.join("");
  }

  if (modal.type === "customPreset") {
    modalHtml.push(renderCustomPresetModal(state));
    return modalHtml.join("");
  }

  if (modal.type === "loginRequired") {
    modalHtml.push(renderLoginRequiredModal());
    return modalHtml.join("");
  }

  return modalHtml.join("");
}
