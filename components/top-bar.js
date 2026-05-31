import { PROFILE_IMAGE } from "../mock/wedding-data.js";
import { formatNumber } from "../services/format.js";

export function renderTopBar({ route, title, credits }) {
  const canGoBack = route !== "home";
  const navigationAttribute = canGoBack ? 'data-action="back"' : 'data-route="home"';

  // When on the home route, show a compact credit entry button on the left.
  const leftButton = canGoBack
    ? `<button
        aria-label="Back"
        class="text-zinc-500 dark:text-zinc-400 scale-95 active:scale-90 transition-transform flex items-center justify-center p-2 rounded-full hover:bg-black/5"
        data-action="back"
      >
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">arrow_back</span>
      </button>`
    : `<button
        aria-label="Credits"
        class="glass-panel rounded-full px-3 py-1 flex items-center gap-2 text-primary text-sm shadow-sm active:scale-95 transition-transform"
        data-route="credits"
      >
        <span class="material-symbols-outlined text-[18px]" style="font-variation-settings: 'FILL' 1;">diamond</span>
        <span class="font-medium">크레딧</span>
      </button>`;

  return `
    <header class="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-2xl border-b border-white/40 shadow-[0_8px_32px_0_rgba(196,139,151,0.15)] md:hidden">
      ${leftButton}
      <div class="flex flex-col items-center">
        <span class="font-display italic font-medium text-primary text-[24px] tracking-wide">Bloom Cinematic</span>
        <span class="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">${title}</span>
      </div>
      <div class="flex items-center gap-2">
        <button
          aria-label="Credits balance"
          class="glass-panel rounded-full px-3 py-2 flex items-center gap-1.5 text-primary text-sm shadow-sm active:scale-95 transition-transform"
          data-route="credits"
        >
          <span class="material-symbols-outlined text-[18px]" style="font-variation-settings: 'FILL' 1;">diamond</span>
          <span>${formatNumber(credits ?? 0)}</span>
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
