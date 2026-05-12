import { getServiceCard } from "../mock/wedding-data.js";
import { escapeHtml } from "../services/format.js";

export function renderAssistantPage(state) {
  const service = getServiceCard("assistant");

  return `
    <section class="w-full glass-panel glow-shadow rounded-DEFAULT p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <img alt="${service.title}" class="w-24 h-28 rounded-2xl object-cover" src="${service.thumbnail}" />
      <div class="flex-1">
      <div class="flex items-center justify-between">
        <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">AI ASSISTANT</span>
        <span class="font-label-caps text-label-caps text-primary">MOCK CHAT</span>
      </div>
      <h1 class="font-display text-[32px] leading-none text-on-surface">무드, 생성, 출력까지 바로 상담</h1>
      <p class="text-sm text-on-surface-variant">질문을 입력하면 더미 응답이 이어지고, 필요하면 전문가 상담으로 바로 연결됩니다.</p>
      </div>
    </section>

    <section class="w-full glass-panel glow-shadow rounded-DEFAULT p-4 flex flex-col gap-3 max-h-[52vh] overflow-y-auto">
      ${state.assistantMessages.map((message) => `
        <div class="flex ${message.role === "user" ? "justify-end" : "justify-start"}">
          <div class="max-w-[85%] rounded-[1.5rem] px-4 py-3 ${message.role === "user" ? "bg-primary text-on-primary" : "bg-white/60 text-on-surface"}">
            <p class="text-sm leading-relaxed">${escapeHtml(message.text)}</p>
          </div>
        </div>
      `).join("")}
    </section>

    <section class="w-full glass-panel glow-shadow rounded-DEFAULT p-5 flex flex-col gap-3">
      <label class="flex flex-col gap-2">
        <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">QUESTION</span>
        <textarea class="w-full min-h-[110px] rounded-[1.5rem] bg-white/70 border-white/60 focus:border-primary focus:ring-primary text-on-surface px-5 py-4" data-assistant-draft placeholder="예: 야외 웨딩 스냅인데 파리 에펠탑으로 정리하고 싶어요">${escapeHtml(state.assistantDraft)}</textarea>
      </label>
      <div class="flex gap-3">
        <button class="flex-1 h-12 rounded-full bg-primary text-on-primary font-button" data-action="assistant-send">
          질문 보내기
        </button>
        <button class="flex-1 h-12 rounded-full glass-panel text-primary font-button" data-action="connect-expert">
          전문가 상담 연결
        </button>
      </div>
    </section>
  `;
}
