import { GUIDE_COPY_ITEMS, renderGuideBody } from "../services/guide-copy.js";

const STEPS = GUIDE_COPY_ITEMS;

export function renderFirstTimeOnboarding(state) {
  if (!state.firstTimeOnboardingOpen) {
    return "";
  }

  const stepIndex = Math.min(Math.max(state.firstTimeOnboardingStep ?? 0, 0), STEPS.length - 1);
  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;
  const ctaLabel = isLastStep ? "이용안내 완료하고 무료 제작 시작하기" : "다음";

  return `
    <div class="first-onboarding-page fixed inset-0 z-[80] bg-[#fbf7f8]/95 backdrop-blur-xl overflow-y-auto px-4 pt-20">
      <style>
        .first-onboarding-page { padding-bottom: 150px; }
        .first-onboarding-cta {
          position: fixed;
          left: 50%;
          transform: translateX(-50%);
          bottom: 92px;
          width: min(340px, calc(100% - 32px));
          z-index: 90;
          padding: 12px 0;
        }
        @media (min-width: 768px) {
          .first-onboarding-cta { bottom: 24px; }
        }
      </style>

      <div class="mx-auto w-full max-w-md flex flex-col gap-4">
        <section class="glass-panel glow-shadow rounded-DEFAULT p-5 flex flex-col gap-3">
          <div class="flex items-center justify-between gap-3">
            <span class="font-label-caps text-label-caps text-primary tracking-widest">${stepIndex + 1}/${STEPS.length}</span>
            <div class="flex gap-1.5" aria-hidden="true">
              ${STEPS.map((_, index) => `
                <span class="h-2 w-7 rounded-full ${index <= stepIndex ? "bg-primary" : "bg-white/70 border border-white"}"></span>
              `).join("")}
            </div>
          </div>
          <h2 class="font-display text-[32px] leading-none text-on-surface">첫 제작 전 이용안내</h2>
          <p class="text-sm leading-6 text-on-surface-variant">무료 1회 제작을 시작하기 전에 핵심 흐름만 빠르게 확인해 주세요.</p>
        </section>

        <section class="glass-panel glow-shadow rounded-DEFAULT p-6 min-h-[430px] flex flex-col justify-center text-center">
          <div class="mx-auto w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <span class="material-symbols-outlined text-[34px]" style="font-variation-settings: 'FILL' 1;">${step.icon}</span>
          </div>
          <p class="font-label-caps text-label-caps text-primary tracking-widest mt-6">STEP ${stepIndex + 1}</p>
          <div class="mt-2 flex flex-col items-center gap-2">
            <h3 class="font-display text-[30px] sm:text-[34px] leading-tight text-on-surface">${step.title}</h3>
            ${step.badge ? `
              <span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">${step.badge}</span>
            ` : ""}
          </div>
          <div class="mt-5 text-left">
            ${renderGuideBody(step, "text-[15px] leading-7 text-on-surface-variant")}
          </div>
          ${state.onboardingErrorMessage ? `
            <p class="mt-5 rounded-[18px] bg-red-50 px-4 py-3 text-sm leading-6 text-red-700 border border-red-100">${state.onboardingErrorMessage}</p>
          ` : ""}
        </section>
      </div>

      <div class="first-onboarding-cta">
        <button
          class="w-full min-h-14 rounded-full bg-primary text-on-primary font-button text-button shadow-[0_12px_28px_rgba(129,80,92,0.28)] flex items-center justify-center gap-2 px-5 disabled:opacity-70 disabled:pointer-events-none"
          data-action="${isLastStep ? "complete-first-onboarding" : "next-first-onboarding"}"
          ${state.onboardingCompleting ? "disabled" : ""}
        >
          <span class="material-symbols-outlined">${isLastStep ? "check_circle" : "arrow_forward"}</span>
          <span>${state.onboardingCompleting ? "이용안내 완료 처리 중..." : ctaLabel}</span>
        </button>
      </div>
    </div>
  `;
}
