const STEPS = [
  {
    icon: "add_photo_alternate",
    title: "사진 올리기",
    body: "사진을 업로드하면 AI가 얼굴과 포즈를 최대한 유지해 변환합니다. 좋은 결과를 위해 얼굴이 선명한 사진을 사용해 주세요.",
  },
  {
    icon: "palette",
    title: "스타일 선택하기",
    body: "Europe Style, Korea Style, Disney Style, Studio Style 중 원하는 분위기를 선택합니다. 선택한 스타일에 따라 4장의 결과가 생성됩니다.",
  },
  {
    icon: "redeem",
    title: "첫 1회 무료 제작 안내",
    body: "첫 가입자는 이용안내 확인 후 1회 무료 제작을 시작할 수 있습니다. 무료 제작 결과에는 워터마크가 포함될 수 있습니다. 완료 후 사진편집 화면에서 바로 무료 제작을 시작해 주세요.",
  },
];

export function renderFirstTimeOnboarding(state) {
  if (!state.firstTimeOnboardingOpen) {
    return "";
  }

  const stepIndex = Math.min(Math.max(state.firstTimeOnboardingStep ?? 0, 0), STEPS.length - 1);
  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;
  const ctaLabel = isLastStep ? "이용안내 완료하고 무료 제작 시작" : "다음";

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
            <span class="font-label-caps text-label-caps text-primary tracking-widest">${stepIndex + 1}/3</span>
            <div class="flex gap-1.5" aria-hidden="true">
              ${STEPS.map((_, index) => `
                <span class="h-2 w-8 rounded-full ${index <= stepIndex ? "bg-primary" : "bg-white/70 border border-white"}"></span>
              `).join("")}
            </div>
          </div>
          <h2 class="font-display text-[32px] leading-none text-on-surface">첫 제작 전 이용안내</h2>
          <p class="text-sm leading-6 text-on-surface-variant">무료 1회 제작을 시작하기 전에 핵심 흐름만 빠르게 확인해 주세요.</p>
        </section>

        <section class="glass-panel glow-shadow rounded-DEFAULT p-6 min-h-[360px] flex flex-col justify-center text-center">
          <div class="mx-auto w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <span class="material-symbols-outlined text-[34px]" style="font-variation-settings: 'FILL' 1;">${step.icon}</span>
          </div>
          <p class="font-label-caps text-label-caps text-primary tracking-widest mt-6">STEP ${stepIndex + 1}</p>
          <h3 class="font-display text-[34px] leading-none text-on-surface mt-2">${step.title}</h3>
          <p class="text-base leading-7 text-on-surface-variant mt-4">${step.body}</p>
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
          <span>${state.onboardingCompleting ? "완료 처리 중..." : ctaLabel}</span>
        </button>
      </div>
    </div>
  `;
}
