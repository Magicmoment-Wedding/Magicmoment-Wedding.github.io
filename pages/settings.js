export function renderSettingsPage(state) {
  return `
    <section class="w-full flex flex-col gap-4">
      <div class="glass-panel rounded-DEFAULT p-4">
        <h2 class="font-display text-[20px]">설정</h2>
      </div>

      <div class="flex flex-col gap-3">
        <button class="rounded-DEFAULT p-4 glass-panel flex items-center justify-between" data-action="show-alert" data-message="로그인 기능은 준비 중입니다.">
          <div>
            <p class="font-display">로그인 / 가입</p>
            <p class="text-sm text-on-surface-variant mt-1">결과물을 저장하고 다시 확인하세요</p>
          </div>
          <span class="material-symbols-outlined">chevron_right</span>
        </button>

        <button class="rounded-DEFAULT p-4 glass-panel flex items-center justify-between" data-route="credits">
          <div>
            <p class="font-display">남은 제작 횟수</p>
            <p class="text-sm text-on-surface-variant mt-1">현재 남은 이용권을 확인하세요</p>
          </div>
          <div class="text-right">
            <div class="font-medium text-primary">${Math.max(0, Math.floor(Number(state.credits || 0) / 25))}회</div>
            <span class="material-symbols-outlined">chevron_right</span>
          </div>
        </button>

        <button class="rounded-DEFAULT p-4 glass-panel flex items-center justify-between" data-action="show-alert" data-message="스타일 갤러리는 준비 중입니다.">
          <div>
            <p class="font-display">생성된 이미지</p>
            <p class="text-sm text-on-surface-variant mt-1">저장된 결과물을 확인하세요</p>
          </div>
          <span class="material-symbols-outlined">chevron_right</span>
        </button>

        <div class="rounded-DEFAULT p-4 glass-panel flex items-center justify-between">
          <div>
            <p class="font-display">알림 설정</p>
            <p class="text-sm text-on-surface-variant mt-1">새로운 기능 안내 받기</p>
          </div>
          <label class="swap swap-rotate">
            <input type="checkbox" data-action="toggle-notifications" />
            <div class="swap-on">ON</div>
            <div class="swap-off">OFF</div>
          </label>
        </div>

        <button class="rounded-DEFAULT p-4 glass-panel flex items-center justify-between" data-action="open-assistant-chat">
          <div>
            <p class="font-display">고객센터 / 문의</p>
            <p class="text-sm text-on-surface-variant mt-1">서비스 이용 중 궁금한 점을 문의하세요</p>
          </div>
          <span class="material-symbols-outlined">chevron_right</span>
        </button>

        <button class="rounded-DEFAULT p-4 glass-panel flex items-center justify-between" data-action="show-alert" data-message="이용약관은 준비 중입니다.">
          <div>
            <p class="font-display">이용약관</p>
            <p class="text-sm text-on-surface-variant mt-1">서비스 약관 확인</p>
          </div>
          <span class="material-symbols-outlined">chevron_right</span>
        </button>

        <button class="rounded-DEFAULT p-4 glass-panel flex items-center justify-between" data-action="show-alert" data-message="개인정보처리방침은 준비 중입니다.">
          <div>
            <p class="font-display">개인정보처리방침</p>
            <p class="text-sm text-on-surface-variant mt-1">개인정보 처리 기준 확인</p>
          </div>
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </section>
  `;
}
