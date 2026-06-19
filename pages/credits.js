import { CREDIT_PACKAGES } from "../services/credit.js";
import { escapeHtml, formatCurrency } from "../services/format.js";
import { formatRemainingGenerationUses } from "../services/generation-usage.js";

export function renderCreditsPage(state) {
  const statusClass = state.creditStatusType === "error"
    ? "bg-red-50/80 text-red-600 border-red-100"
    : "bg-primary/10 text-primary border-primary/15";

  return `
    <section class="w-full flex flex-col gap-4">
      <div class="glass-panel rounded-DEFAULT p-4 flex items-center justify-between">
        <div>
          <h2 class="font-display text-[20px]">이용권 구매</h2>
          <p class="text-sm text-on-surface-variant mt-1">원하는 웨딩사진을 만들 수 있는 AI 웨딩사진 제작 이용권을 구매하세요.</p>
        </div>
        <div class="text-right">
          <div class="text-xs text-on-surface-variant">남은 제작 횟수</div>
          <div class="font-display text-[20px] text-primary">${state.isCreditsLoading ? "..." : formatRemainingGenerationUses(state)}</div>
        </div>
      </div>

      ${state.creditStatusMessage ? `
        <div class="rounded-DEFAULT border px-4 py-3 text-sm ${statusClass}">
          ${escapeHtml(state.creditStatusMessage)}
        </div>
      ` : ""}

      <div class="rounded-DEFAULT bg-primary/10 border border-primary/15 p-4 text-sm text-primary leading-6">
        <p class="font-semibold">사진 제작 1회마다 이용권 1회가 사용되며, 1회 제작 시 결과 이미지 4장이 생성됩니다.</p>
        <p class="mt-2 font-semibold">모든 이용권은 구매일로부터 3개월간 사용할 수 있습니다.</p>
        <p>사용기한이 지난 이용권은 사용할 수 없습니다.</p>
      </div>

      <div class="grid grid-cols-1 gap-3">
        ${CREDIT_PACKAGES.map((pack) => {
          const isCharging = state.chargingCreditPackageId === pack.id;
          const descriptionLines = String(pack.description || "").split("\n").filter(Boolean);

          return `
            <article class="rounded-DEFAULT p-4 glass-panel glow-shadow">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="inline-flex rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">${escapeHtml(pack.badge)}</p>
                  <p class="font-display text-lg">${escapeHtml(pack.name)}</p>
                  <div class="mt-1 space-y-1">
                    ${descriptionLines.map((line) => `<p class="text-sm text-on-surface-variant">${escapeHtml(line)}</p>`).join("")}
                  </div>
                  <p class="text-xs font-semibold text-primary mt-1">서비스 제공기간: ${escapeHtml(pack.servicePeriodLabel)}</p>
                </div>
                <div class="text-right shrink-0">
                  ${pack.originalPrice ? `
                    <div class="text-sm text-on-surface-variant line-through">${formatCurrency(pack.originalPrice)}</div>
                    <div class="font-display text-primary text-[26px] leading-none">${formatCurrency(pack.price)}</div>
                  ` : `
                    <div class="text-sm text-on-surface-variant">가격</div>
                    <div class="font-medium text-primary text-[18px]">${formatCurrency(pack.price)}</div>
                  `}
                </div>
              </div>
              <div class="mt-4">
                <button
                  class="w-full h-12 rounded-full bg-primary text-on-primary disabled:opacity-60 disabled:pointer-events-none"
                  data-credit-package="${pack.id}"
                  ${state.chargingCreditPackageId ? "disabled" : ""}
                >
                  ${isCharging ? "구매 준비 중..." : escapeHtml(pack.cta)}
                </button>
              </div>
            </article>
          `;
        }).join("")}
      </div>

      <section class="rounded-DEFAULT p-4 glass-panel">
        <h3 class="font-display text-[21px] leading-tight text-on-surface">프리미엄 커스텀 제작</h3>
        <div class="mt-3 space-y-3">
          <p class="text-sm text-on-surface-variant leading-6">더 높은 퀄리티와 원하는 콘셉트를 상담으로 완성해보세요.</p>
          <p class="text-sm text-on-surface-variant leading-6">커스텀 또는 스케일업 상담</p>
        </div>
        <div class="mt-4 flex items-center justify-between gap-4 rounded-[18px] bg-white/55 px-4 py-3">
          <div>
            <p class="text-sm font-bold text-on-surface">프리미엄 커스텀 제작</p>
            <p class="text-xs text-on-surface-variant">원하는 콘셉트를 직접 상담해 완성</p>
          </div>
          <div class="text-right shrink-0">
            <p class="font-bold text-primary text-[18px]">199,000원</p>
          </div>
        </div>
        <button class="mt-4 h-12 w-full rounded-full bg-primary text-on-primary text-sm font-bold shadow-[0_12px_28px_rgba(129,80,92,0.22)]" data-action="open-assistant-chat" type="button">
          커스텀 문의하기
        </button>
      </section>

      <div class="rounded-DEFAULT bg-white/45 p-4 text-sm text-on-surface-variant leading-6">
        <div class="flex items-start gap-2">
          <span class="material-symbols-outlined text-primary text-[18px] mt-0.5" style="font-variation-settings: 'FILL' 0;">info</span>
          <div>
            <p class="mb-2">서비스 제공기간: 모든 이용권은 구매일로부터 3개월입니다.</p>
            <p class="mb-2">사용기한이 지난 이용권은 사용할 수 없습니다.</p>
            <p>사진 제작 1회마다 결과 4장이 생성됩니다.</p>
          </div>
        </div>
      </div>
    </section>
  `;
}
