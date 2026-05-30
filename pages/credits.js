export function renderCreditsPage(state) {
  return `
    <section class="w-full flex flex-col gap-4">
      <div class="glass-panel rounded-DEFAULT p-4 flex items-center justify-between">
        <div>
          <h2 class="font-display text-[20px]">크레딧</h2>
          <p class="text-sm text-on-surface-variant mt-1">AI 웨딩사진 생성에 사용할 크레딧을 충전하세요.</p>
        </div>
        <div class="text-right">
          <div class="text-xs text-on-surface-variant">보유 크레딧</div>
          <div class="font-display text-[20px] text-primary">${state.credits ?? 0}</div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3">
        <article class="rounded-DEFAULT p-4 glass-panel glow-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-display text-lg">200 크레딧</p>
              <p class="text-sm text-on-surface-variant mt-1">AI 웨딩사진 생성용 기본 패키지</p>
            </div>
            <div class="text-right">
              <div class="text-sm text-on-surface-variant">가격</div>
              <div class="font-medium text-primary text-[18px]">19,800원</div>
            </div>
          </div>
          <div class="mt-4">
            <button class="w-full h-12 rounded-full bg-primary text-on-primary" data-action="show-alert" data-message="결제 기능은 준비 중입니다.">
              구매 준비 중
            </button>
          </div>
        </article>

        <article class="rounded-DEFAULT p-4 glass-panel glow-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-display text-lg">500 크레딧</p>
              <p class="text-sm text-on-surface-variant mt-1">더 많은 웨딩사진을 만들 수 있는 패키지</p>
            </div>
            <div class="text-right">
              <div class="text-sm text-on-surface-variant">가격</div>
              <div class="font-medium text-primary text-[18px]">39,800원</div>
            </div>
          </div>
          <div class="mt-4">
            <button class="w-full h-12 rounded-full bg-primary text-on-primary" data-action="show-alert" data-message="결제 기능은 준비 중입니다.">
              구매 준비 중
            </button>
          </div>
        </article>
      </div>

      <div class="text-sm text-on-surface-variant mt-2">결제 기능은 준비 중입니다.</div>
    </section>
  `;
}
