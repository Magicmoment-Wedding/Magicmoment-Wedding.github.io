import { renderBrandLogo } from "./brand-logo.js";

function isKakaoInAppBrowser() {
  return typeof navigator !== "undefined" && /KAKAOTALK/i.test(navigator.userAgent || "");
}

export function renderLoadingOverlay(state = {}) {
  const message = state.generationStatusMessage || "사진을 만들고 있어요.";
  const isPaused = state.generationNetworkPaused === true;
  const isKakao = isKakaoInAppBrowser();

  return `
    <div class="fixed inset-0 z-[70] bg-background/75 backdrop-blur-xl flex items-center justify-center px-6">
      <div class="w-full max-w-sm glass-panel glow-shadow rounded-xl p-6 flex flex-col items-center gap-4 text-center">
        <div class="w-14 h-14 rounded-full border-[3px] border-primary/20 border-t-primary animate-spin"></div>
        <div class="space-y-1">
          ${renderBrandLogo({ variant: "horizontal", size: "md" })}
          <p class="text-base font-semibold text-on-surface">${message}</p>
          <p class="text-sm text-on-surface-variant">앱을 잠시 닫아도 괜찮아요.</p>
          <p class="text-sm text-on-surface-variant">완성되면 마이포토박스에서 다시 확인할 수 있어요.</p>
        </div>
        ${isKakao ? `
          <div class="w-full rounded-DEFAULT bg-white/55 border border-white/60 p-3 text-xs leading-5 text-on-surface-variant">
            <p>카카오톡에서 열어도 생성은 계속 진행됩니다.</p>
            <p>다시 돌아오면 자동으로 결과를 확인해요.</p>
            <p class="mt-2">카카오톡 브라우저에서도 사용할 수 있어요.</p>
            <p>더 안정적인 이용을 원하시면 Safari/Chrome에서 열어 주세요.</p>
          </div>
        ` : ""}
        ${isPaused ? `
          <p class="w-full rounded-full bg-white/60 px-4 py-2 text-xs font-semibold text-primary">생성 상태를 다시 확인하고 있어요.</p>
        ` : ""}
        <div class="w-full rounded-full bg-white/60 h-2 overflow-hidden">
          <div class="h-full w-2/3 rounded-full bg-primary animate-pulse"></div>
        </div>
      </div>
    </div>
  `;
}
