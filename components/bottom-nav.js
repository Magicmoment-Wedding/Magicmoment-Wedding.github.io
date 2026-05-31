function navButton({ label, icon, isActive, route, isHome = false }) {
  if (isHome) {
    return `
      <button
        class="flex flex-col items-center justify-center gap-1 text-[11px] text-on-surface-variant"
        data-route="${route}"
      >
        <span class="-mt-6 w-14 h-14 rounded-full bg-primary text-on-primary shadow-[0_12px_28px_rgba(129,80,92,0.24)] flex items-center justify-center">
          <span class="material-symbols-outlined text-[22px]" style="font-variation-settings: 'FILL' ${isActive ? 1 : 0};">${icon}</span>
        </span>
        <span class="font-label-caps text-[11px] leading-none">홈</span>
      </button>
    `;
  }

  return `
    <button
      class="flex flex-col items-center justify-center gap-1 text-[11px] transition-colors ${isActive ? "text-primary" : "text-on-surface-variant hover:text-primary"}"
      data-route="${route}"
    >
      <span class="material-symbols-outlined text-[21px] active:scale-105 transition-transform" style="font-variation-settings: 'FILL' ${isActive ? 1 : 0};">${icon}</span>
      <span class="font-label-caps text-[11px] leading-none">${label}</span>
    </button>
  `;
}

export function renderBottomNav({ route }) {
  const isCreateActive = ["create", "options"].includes(route);
  const isAssistantActive = route === "assistant";

  return `
    <nav class="fixed bottom-3 left-4 right-4 max-w-md mx-auto z-50 grid grid-cols-3 items-center h-[64px] rounded-[24px] bg-white/80 backdrop-blur-2xl border border-white/70 shadow-[0_-10px_38px_rgba(129,80,92,0.12)] md:hidden">
      ${navButton({ label: "사진편집", icon: "add_photo_alternate", isActive: isCreateActive, route: "create" })}
      ${navButton({ label: "홈", icon: "home", isActive: route === "home", route: "home", isHome: true })}
      ${navButton({ label: "어시스턴트", icon: "smart_toy", isActive: isAssistantActive, route: "assistant" })}
    </nav>
  `;
}
