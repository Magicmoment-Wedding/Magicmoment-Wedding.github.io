import { escapeHtml } from "../services/format.js";

export function renderSuggestionsPage(state) {
  return `
    <section class="w-full glass-panel glow-shadow rounded-DEFAULT p-5 flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">PRESET BOARD</span>
        <span class="font-label-caps text-label-caps text-primary">${state.suggestions.length} POSTS</span>
      </div>
      <h1 class="font-display text-[32px] leading-none text-on-surface">원하는 분위기를 제안해주세요</h1>
      <p class="text-sm text-on-surface-variant">간단한 제안 게시판 MVP로, 작성된 항목은 local mock 상태에 저장됩니다.</p>
    </section>

    <section class="w-full glass-panel glow-shadow rounded-DEFAULT p-5 flex flex-col gap-3">
      <label class="flex flex-col gap-2">
        <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">제안 제목</span>
        <input class="w-full rounded-full bg-white/70 border-white/60 focus:border-primary focus:ring-primary text-on-surface px-5 py-4" data-suggestion-title placeholder="예: 겨울 설원 웨딩 스냅" value="${escapeHtml(state.suggestionDraftTitle)}" />
      </label>
      <label class="flex flex-col gap-2">
        <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">설명</span>
        <textarea class="w-full min-h-[110px] rounded-[1.5rem] bg-white/70 border-white/60 focus:border-primary focus:ring-primary text-on-surface px-5 py-4" data-suggestion-body placeholder="원하는 배경, 조명, 무드 등을 자유롭게 적어주세요">${escapeHtml(state.suggestionDraftBody)}</textarea>
      </label>
      <button class="w-full h-12 rounded-full bg-primary text-on-primary font-button" data-action="submit-suggestion">
        제안하기
      </button>
    </section>

    <section class="grid grid-cols-1 gap-3">
      ${state.suggestions.map((item) => `
        <article class="glass-panel glow-shadow rounded-DEFAULT p-5">
          <p class="font-display text-[26px] leading-none text-on-surface">${escapeHtml(item.title)}</p>
          <p class="text-sm text-on-surface-variant mt-3">${escapeHtml(item.description)}</p>
        </article>
      `).join("")}
    </section>
  `;
}
