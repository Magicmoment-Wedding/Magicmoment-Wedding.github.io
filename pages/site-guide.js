export function renderSiteGuidePage() {
  const guideItems = [
    {
      icon: "add_photo_alternate",
      title: "사진 업로드",
      body: "얼굴과 포즈가 선명한 사진을 선택하면 AI가 원본 인물의 분위기를 최대한 유지해 변환합니다.",
    },
    {
      icon: "palette",
      title: "스타일 선택",
      body: "Europe Style, Korea Style, Disney Style, Studio Style 등 원하는 분위기를 고른 뒤 옵션을 확인하세요.",
    },
    {
      icon: "auto_awesome",
      title: "AI 제작",
      body: "선택한 스타일과 비율에 맞춰 결과 이미지 4장을 생성하고, 결과 화면에서 추천 이미지를 확인할 수 있습니다.",
    },
    {
      icon: "photo_library",
      title: "저장과 갤러리",
      body: "마음에 드는 이미지는 사진으로 저장하고, 스타일 갤러리에서 다른 예시를 살펴볼 수 있습니다.",
    },
    {
      icon: "diamond",
      title: "크레딧",
      body: "무료 제작 이후에는 크레딧으로 생성, 비율 변환, 고해상도 변환을 이어갈 수 있습니다.",
    },
    {
      icon: "lock",
      title: "개인정보와 사진 보관",
      body: "업로드 사진과 제작 결과는 서비스 처리와 결과 확인을 위해 사용되며, 민감한 사진은 신중히 선택해 주세요.",
    },
  ];

  return `
    <section class="w-full glass-panel glow-shadow rounded-DEFAULT p-5 flex flex-col gap-3">
      <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest">SITE GUIDE</span>
      <h1 class="font-display text-[32px] leading-none text-on-surface">사이트 이용안내</h1>
      <p class="text-sm text-on-surface-variant">Magic Ai Studio의 기본 사용 흐름과 크레딧 안내를 확인할 수 있습니다.</p>
    </section>

    <section class="grid grid-cols-1 gap-3">
      ${guideItems.map((item) => `
        <article class="w-full glass-panel glow-shadow rounded-DEFAULT p-5 flex gap-4">
          <div class="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <span class="material-symbols-outlined text-[22px]" style="font-variation-settings: 'FILL' 1;">${item.icon}</span>
          </div>
          <div>
            <h2 class="font-display text-[25px] leading-none text-on-surface">${item.title}</h2>
            <p class="text-sm text-on-surface-variant mt-2 leading-6">${item.body}</p>
          </div>
        </article>
      `).join("")}
    </section>

    <section class="w-full flex flex-col gap-3 mt-2">
      <button class="w-full h-14 rounded-full bg-primary/90 hover:bg-primary text-on-primary font-button text-button shadow-[0_8px_20px_rgba(129,80,92,0.3)] flex items-center justify-center gap-2 transition-all active:scale-95" data-action="back">
        <span class="material-symbols-outlined">arrow_back</span>
        편집 화면으로 돌아가기
      </button>
      <button class="w-full h-14 rounded-full glass-panel text-primary font-button text-button hover:bg-white/50 transition-all active:scale-95" data-route="home">
        확인
      </button>
    </section>
  `;
}
