import { CREDIT_PACKAGES } from "../services/credit.js";
import { escapeHtml, formatCurrency, formatNumber } from "../services/format.js";

// TODO: Disable free test charge before real payment launch
export function renderCreditsPage(state) {
  const statusClass = state.creditStatusType === "error"
    ? "bg-red-50/80 text-red-600 border-red-100"
    : "bg-primary/10 text-primary border-primary/15";

  return `
    <section class="w-full flex flex-col gap-4">
      <div class="glass-panel rounded-DEFAULT p-4 flex items-center justify-between">
        <div>
          <h2 class="font-display text-[20px]">이용권 구매</h2>
          <p class="text-sm text-on-surface-variant mt-1">사진 제작 1회마다 이용권 1회가 사용됩니다.</p>
        </div>
        <div class="text-right">
          <div class="text-xs text-on-surface-variant">남은 제작 횟수</div>
          <div class="font-display text-[20px] text-primary">${state.isCreditsLoading ? "..." : `${formatNumber(Math.floor((state.credits || 0) / 25))}회`}</div>
        </div>
      </div>

      ${state.creditStatusMessage ? `
        <div class="rounded-DEFAULT border px-4 py-3 text-sm ${statusClass}">
          ${escapeHtml(state.creditStatusMessage)}
        </div>
      ` : ""}

      <div class="grid grid-cols-1 gap-3">
        ${CREDIT_PACKAGES.map((pack) => {
          const isCharging = state.chargingCreditPackageId === pack.id;

          return `
            <article class="rounded-DEFAULT p-4 glass-panel glow-shadow">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <p class="font-display text-lg">${escapeHtml(pack.name)}</p>
                  <p class="text-sm text-on-surface-variant mt-1">${escapeHtml(pack.description)}</p>
                </div>
                <div class="text-right shrink-0">
                  <div class="text-sm text-on-surface-variant">가격</div>
                  <div class="font-medium text-primary text-[18px]">${formatCurrency(pack.price)}</div>
                </div>
              </div>
              <div class="mt-4">
                <button
                  class="w-full h-12 rounded-full bg-primary text-on-primary disabled:opacity-60 disabled:pointer-events-none"
                  data-credit-package="${pack.id}"
                  ${state.chargingCreditPackageId ? "disabled" : ""}
                >
                  ${isCharging ? "구매 준비 중..." : `${escapeHtml(pack.name)} 구매하기`}
                </button>
              </div>
            </article>
          `;
        }).join("")}
      </div>

      <div class="rounded-DEFAULT bg-white/45 p-4 text-sm text-on-surface-variant leading-6">
        <div class="flex items-start gap-2">
          <span class="material-symbols-outlined text-primary text-[18px] mt-0.5" style="font-variation-settings: 'FILL' 0;">info</span>
          <div>
            <p class="mb-2">모든 패스는 구매일로부터 3개월간 사용 가능해요.</p>
            <p>사진 제작 1회마다 결과 4장이 생성됩니다.</p>
          </div>
        </div>
      </div>
    </section>
  `;
}
