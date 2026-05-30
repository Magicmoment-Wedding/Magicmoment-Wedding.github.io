import { renderBottomNav } from "./bottom-nav.js";
import { renderLoadingOverlay } from "./loading-overlay.js";
import { renderModal } from "./modal.js";
import { renderTopBar } from "./top-bar.js";

export function renderLayout({ route, title, content, state }) {
  return `
    ${renderTopBar({ route, title, credits: state.credits })}
    <main class="w-full max-w-md mx-auto pt-20 pb-32 px-container-padding flex flex-col gap-stack-gap-lg relative z-10">
      ${content}
    </main>
    ${route === "credits" || route === "settings" ? "" : renderBottomNav({ route, hasResults: state.results.length > 0 })}
    ${renderModal(state)}
    ${state.isGenerating ? renderLoadingOverlay() : ""}
  `;
}
