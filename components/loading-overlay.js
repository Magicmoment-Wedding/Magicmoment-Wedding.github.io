export function renderLoadingOverlay() {
  return `
    <div class="fixed inset-0 z-[70] bg-background/75 backdrop-blur-xl flex items-center justify-center px-6">
      <div class="w-full max-w-sm glass-panel glow-shadow rounded-xl p-6 flex flex-col items-center gap-4 text-center">
        <div class="w-14 h-14 rounded-full border-[3px] border-primary/20 border-t-primary animate-spin"></div>
        <div class="space-y-1">
          <p class="font-display text-[28px] leading-none text-primary">Bloom Cinematic</p>
          <p class="text-sm text-on-surface">4개의 결과를 생성하고 있어요.</p>
        </div>
        <div class="w-full rounded-full bg-white/60 h-2 overflow-hidden">
          <div class="h-full w-2/3 rounded-full bg-primary animate-pulse"></div>
        </div>
      </div>
    </div>
  `;
}
