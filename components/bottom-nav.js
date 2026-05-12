function navButton({ label, icon, isActive, route }) {
  return `
    <button
      class="flex flex-col items-center justify-center transition-colors group ${isActive ? "text-[#C48B97] bg-[#C48B97]/10 rounded-full px-4 py-1" : "text-zinc-400 dark:text-zinc-500 hover:text-[#C48B97]"}"
      data-route="${route}"
    >
      <span class="material-symbols-outlined group-active:scale-105 transition-transform" style="font-variation-settings: 'FILL' ${isActive ? 1 : 0};">${icon}</span>
      <span class="font-label-caps text-label-caps mt-1">${label}</span>
    </button>
  `;
}

export function renderBottomNav({ route, hasResults }) {
  const active = route === "home"
    ? "home"
    : ["create", "options"].includes(route)
      ? "create"
      : ["gallery", "result"].includes(route)
        ? "gallery"
        : "more";

  return `
    <nav class="fixed bottom-0 w-full z-50 flex justify-around items-center px-4 pt-3 pb-6 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl rounded-t-[32px] border-t border-white/40 shadow-[0_-10px_40px_rgba(196,139,151,0.1)] md:hidden">
      ${navButton({ label: "Home", icon: "home", isActive: active === "home", route: "home" })}
      ${navButton({ label: "Create", icon: "auto_awesome", isActive: active === "create", route: "create" })}
      ${navButton({ label: "Gallery", icon: "photo_library", isActive: active === "gallery", route: hasResults ? "gallery" : "gallery" })}
      ${navButton({ label: "More", icon: "apps", isActive: active === "more", route: "more" })}
    </nav>
  `;
}
