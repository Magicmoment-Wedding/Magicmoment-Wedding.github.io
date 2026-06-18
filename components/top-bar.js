import { PROFILE_IMAGE } from "../mock/wedding-data.js";
import { renderBrandLogo } from "./brand-logo.js";
import { formatRemainingGenerationUses } from "../services/generation-usage.js";

export function renderTopBar({ route, title, currentUser }) {
  const canGoBack = route !== "home";
  const navigationAttribute = canGoBack ? 'data-action="back"' : 'data-route="home"';
  const remainingUsesText = formatRemainingGenerationUses({ currentUser });

  // When on the home route, show a compact pass entry button on the left.
  const leftButton = canGoBack
    ? `<button
        aria-label="Back"
        class="text-zinc-500 dark:text-zinc-400 scale-95 active:scale-90 transition-transform flex items-center justify-center p-2 rounded-full hover:bg-black/5"
        data-action="back"
      >
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">arrow_back</span>
      </button>`
    : `<button
        aria-label="이용권"
        class="glass-panel rounded-full px-3 py-1 flex items-center gap-2 text-primary text-sm shadow-sm active:scale-95 transition-transform"
        data-route="credits"
      >
        <span class="material-symbols-outlined text-[18px]" style="font-variation-settings: 'FILL' 1;">diamond</span>
        <span class="font-medium">이용권</span>
      </button>`;

  return `
    <header class="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-2xl border-b border-white/40 shadow-[0_8px_32px_0_rgba(196,139,151,0.15)] md:hidden">
      ${leftButton}
      <button
        aria-label="랜딩페이지로 이동"
        title="랜딩페이지로 이동"
        class="min-h-11 min-w-11 flex flex-col items-center justify-center cursor-pointer bg-transparent border-0 p-0"
        data-route="home"
        type="button"
      >
        ${renderBrandLogo({ variant: "horizontal", size: "sm" })}
        <span class="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">${title}</span>
      </button>
      <div class="flex items-center gap-2">
        <button
          aria-label="남은 제작 횟수"
          class="glass-panel rounded-full px-3 py-2 flex items-center gap-1.5 text-primary text-sm shadow-sm active:scale-95 transition-transform"
          data-route="credits"
        >
          <span class="material-symbols-outlined text-[18px]" style="font-variation-settings: 'FILL' 1;">diamond</span>
          <span>${remainingUsesText}</span>
        </button>
        <button
          aria-label="Settings"
          class="text-zinc-500 dark:text-zinc-400 scale-95 active:scale-90 transition-transform flex items-center justify-center p-2 rounded-full hover:bg-black/5"
          data-route="settings"
        >
          <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">settings</span>
        </button>
      </div>
    </header>
  `;
}
