const IMAGE_PATHS = {
  before: {
    outdoor: "./mock-images/before/before_studio_couple_01.jpg",
    studio: "./mock-images/before/before_studio_bride_01.png",
  },
  after: {
    paris1: "./mock-images/after/after_paris_couple_01.png",
    paris2: "./mock-images/after/after_paris_couple_02.png",
    disney1: "./mock-images/after/after_disney_bride_01.png",
    disney2: "./mock-images/after/after_disney_bride_02.png",
    dramaOutdoor1: "./mock-images/after/after_drama_couple_01.png",
    dramaOutdoor2: "./mock-images/after/after_drama_couple_02.png",
    dramaStudio1: "./mock-images/after/after_drama_bride_01.png",
    dramaStudio2: "./mock-images/after/after_drama_bride_02.png",
  },
  home: {
    parisEiffel: "./mock-images/home/home_paris_couple_01.png",
    disney: "./mock-images/home/home_disney_bride_01.png",
    drama: "./mock-images/home/home_drama_couple_01.png",
  },
  gallery: {
    outdoor: "./mock-images/gallery/gallery_outdoor_wedding_snap_01.png",
    studio: "./mock-images/gallery/gallery_studio_original_01.png",
    parisEiffel: "./mock-images/gallery/gallery_paris_mood_01.png",
    disney: "./mock-images/gallery/gallery_disney_mood_01.png",
    drama: "./mock-images/gallery/gallery_drama_romance_01.png",
  },
  services: {
    concierge: "./mock-images/services/service_concierge_01.png",
    studio: "./mock-images/services/service_studio_01.png",
    assistant: "./mock-images/services/service_assistant_01.png",
    suggestions: "./mock-images/services/service_suggestions_01.jpg",
  },
};

function createMockEntry(config) {
  return {
    id: config.id,
    title: config.title,
    preset: config.preset,
    mood: config.mood,
    beforeImage: config.beforeImage,
    afterImage: config.afterImage,
    thumbnail: config.thumbnail,
    tags: config.tags,
    ...config.extra,
  };
}

export const PROFILE_IMAGE = IMAGE_PATHS.services.assistant;

export const SOURCE_IMAGES = [
  {
    id: "source-outdoor",
    title: "야외 웨딩 스냅",
    subtitle: "야외 웨딩 스냅 샘플",
    url: IMAGE_PATHS.before.outdoor,
    mood: "야외 웨딩 스냅",
    tags: ["야외 웨딩 스냅", "파리 에펠탑"],
  },
  {
    id: "source-studio",
    title: "스튜디오 원본",
    subtitle: "스튜디오 원본 샘플",
    url: IMAGE_PATHS.before.studio,
    mood: "스튜디오 원본",
    tags: ["스튜디오 원본", "디즈니 무드"],
  },
];

export const PRESETS = [
  {
    id: "paris_eiffel",
    name: "파리 에펠탑",
    description: "야외 웨딩 스냅의 배경을 에펠탑이 보이는 파리 장면으로 정리합니다.",
    supportedSourceIds: ["source-outdoor"],
  },
  {
    id: "disney",
    name: "디즈니 무드",
    description: "스튜디오 원본을 동화 같은 웨딩 장면으로 정리합니다.",
    supportedSourceIds: ["source-studio"],
  },
  {
    id: "drama",
    name: "드라마 로맨스",
    description: "영화 같은 역광과 로맨틱한 웨딩 톤으로 정리합니다.",
    supportedSourceIds: ["source-outdoor", "source-studio"],
  },
  {
    id: "custom",
    name: "커스텀 요청",
    description: "원하는 웨딩 무드를 적고 대행 서비스로 연결합니다.",
    supportedSourceIds: ["source-outdoor", "source-studio"],
    isCustom: true,
  },
];

export const HOME_SHOWCASE = [
  createMockEntry({
    id: "home-paris_eiffel",
    title: "파리 에펠탑",
    preset: "파리 에펠탑",
    mood: "야외 웨딩 스냅",
    beforeImage: IMAGE_PATHS.before.outdoor,
    afterImage: IMAGE_PATHS.after.paris1,
    thumbnail: IMAGE_PATHS.home.parisEiffel,
    tags: ["파리 에펠탑", "야외 웨딩 스냅"],
    extra: {
      badge: "야외 웨딩 스냅",
      presetId: "paris_eiffel",
      sourceImageId: "source-outdoor",
      description: "야외 웨딩 스냅을 에펠탑이 보이는 파리 웨딩 컷으로 정리한 결과 예시",
    },
  }),
  createMockEntry({
    id: "home-disney",
    title: "디즈니 무드",
    preset: "디즈니 무드",
    mood: "스튜디오 원본",
    beforeImage: IMAGE_PATHS.before.studio,
    afterImage: IMAGE_PATHS.after.disney1,
    thumbnail: IMAGE_PATHS.home.disney,
    tags: ["디즈니 무드", "스튜디오 원본"],
    extra: {
      badge: "스튜디오 원본",
      presetId: "disney",
      sourceImageId: "source-studio",
      description: "스튜디오 원본을 동화 같은 웨딩 컷으로 정리한 결과 예시",
    },
  }),
  createMockEntry({
    id: "home-drama",
    title: "드라마 로맨스",
    preset: "드라마 로맨스",
    mood: "야외 웨딩 스냅",
    beforeImage: IMAGE_PATHS.before.outdoor,
    afterImage: IMAGE_PATHS.after.dramaOutdoor1,
    thumbnail: IMAGE_PATHS.home.drama,
    tags: ["드라마 로맨스", "야외 웨딩 스냅"],
    extra: {
      badge: "야외 웨딩 스냅",
      presetId: "drama",
      sourceImageId: "source-outdoor",
      description: "야외 웨딩 스냅을 영화 같은 로맨스 톤으로 정리한 결과 예시",
    },
  }),
];

export const STYLE_GALLERY = [
  createMockEntry({
    id: "gallery-outdoor",
    title: "야외 웨딩 스냅",
    preset: "파리 에펠탑",
    mood: "야외 웨딩 스냅",
    beforeImage: IMAGE_PATHS.before.outdoor,
    afterImage: IMAGE_PATHS.after.paris1,
    thumbnail: IMAGE_PATHS.gallery.outdoor,
    tags: ["야외 웨딩 스냅", "파리 에펠탑"],
    extra: {
      presetId: "paris_eiffel",
      sourceImageId: "source-outdoor",
      badge: "야외 웨딩 스냅",
      description: "야외 웨딩 원본에서 시작하는 로케이션 중심 탐색 카드",
    },
  }),
  createMockEntry({
    id: "gallery-studio",
    title: "스튜디오 원본",
    preset: "디즈니 무드",
    mood: "스튜디오 원본",
    beforeImage: IMAGE_PATHS.before.studio,
    afterImage: IMAGE_PATHS.after.disney1,
    thumbnail: IMAGE_PATHS.gallery.studio,
    tags: ["스튜디오 원본", "디즈니 무드"],
    extra: {
      presetId: "disney",
      sourceImageId: "source-studio",
      badge: "스튜디오 원본",
      description: "스튜디오 원본 톤을 유지하면서 웨딩 감성을 탐색하는 카드",
    },
  }),
  createMockEntry({
    id: "gallery-paris_eiffel",
    title: "파리 에펠탑",
    preset: "파리 에펠탑",
    mood: "야외 웨딩 스냅",
    beforeImage: IMAGE_PATHS.before.outdoor,
    afterImage: IMAGE_PATHS.after.paris2,
    thumbnail: IMAGE_PATHS.gallery.parisEiffel,
    tags: ["파리 에펠탑", "야외 웨딩 스냅"],
    extra: {
      presetId: "paris_eiffel",
      sourceImageId: "source-outdoor",
      badge: "파리 에펠탑",
      description: "에펠탑이 보이는 파리 배경으로 정리한 웨딩 카드",
    },
  }),
  createMockEntry({
    id: "gallery-disney",
    title: "디즈니 무드",
    preset: "디즈니 무드",
    mood: "스튜디오 원본",
    beforeImage: IMAGE_PATHS.before.studio,
    afterImage: IMAGE_PATHS.after.disney2,
    thumbnail: IMAGE_PATHS.gallery.disney,
    tags: ["디즈니 무드", "스튜디오 원본"],
    extra: {
      presetId: "disney",
      sourceImageId: "source-studio",
      badge: "디즈니 무드",
      description: "부드러운 빛과 꽃장식으로 정리한 동화 같은 웨딩 카드",
    },
  }),
  createMockEntry({
    id: "gallery-drama",
    title: "드라마 로맨스",
    preset: "드라마 로맨스",
    mood: "스튜디오 원본",
    beforeImage: IMAGE_PATHS.before.studio,
    afterImage: IMAGE_PATHS.after.dramaStudio1,
    thumbnail: IMAGE_PATHS.gallery.drama,
    tags: ["드라마 로맨스", "스튜디오 원본"],
    extra: {
      presetId: "drama",
      sourceImageId: "source-studio",
      badge: "드라마 로맨스",
      description: "영화 같은 깊은 감정선으로 정리한 로맨틱 웨딩 카드",
    },
  }),
];

export const SERVICE_CARDS = [
  createMockEntry({
    id: "service-concierge",
    title: "대행 서비스",
    preset: "파리 에펠탑",
    mood: "야외 웨딩 스냅",
    beforeImage: IMAGE_PATHS.before.outdoor,
    afterImage: IMAGE_PATHS.after.paris1,
    thumbnail: IMAGE_PATHS.services.concierge,
    tags: ["파리 에펠탑", "야외 웨딩 스냅"],
    extra: {
      route: "concierge",
      headline: "매니저가 웨딩 배경 제작을 직접 정리해드립니다",
      description: "촬영 컷과 요청 사항을 받아 웨딩 전용 결과물로 정리하는 대행형 서비스",
      icon: "support_agent",
      cta: "대행 연결",
    },
  }),
  createMockEntry({
    id: "service-studio",
    title: "방구석 스튜디오",
    preset: "스튜디오 원본",
    mood: "디즈니 무드",
    beforeImage: IMAGE_PATHS.before.studio,
    afterImage: IMAGE_PATHS.after.disney1,
    thumbnail: IMAGE_PATHS.services.studio,
    tags: ["스튜디오 원본", "디즈니 무드"],
    extra: {
      route: "studio",
      headline: "촬영 없이도 웨딩 원본 세트를 준비하는 스튜디오형 서비스",
      description: "정면, 측면, 전신 기준 컷을 모아 웨딩 화보 제작 흐름으로 이어지는 서비스",
      icon: "imagesmode",
      cta: "스튜디오 시작",
    },
  }),
  createMockEntry({
    id: "service-assistant",
    title: "AI 어시스턴트",
    preset: "드라마 로맨스",
    mood: "디즈니 무드",
    beforeImage: IMAGE_PATHS.before.studio,
    afterImage: IMAGE_PATHS.after.dramaStudio1,
    thumbnail: IMAGE_PATHS.services.assistant,
    tags: ["드라마 로맨스", "디즈니 무드"],
    extra: {
      route: "assistant",
      headline: "웨딩 무드 선택부터 출력까지 이어주는 상담형 서비스",
      description: "파리 에펠탑, 디즈니 무드, 드라마 로맨스 중 어울리는 웨딩 톤을 바로 안내하는 서비스",
      icon: "chat",
      cta: "상담 시작",
    },
  }),
  createMockEntry({
    id: "service-suggestions",
    title: "프리셋 제안",
    preset: "드라마 로맨스",
    mood: "야외 웨딩 스냅",
    beforeImage: IMAGE_PATHS.before.outdoor,
    afterImage: IMAGE_PATHS.after.dramaOutdoor1,
    thumbnail: IMAGE_PATHS.services.suggestions,
    tags: ["드라마 로맨스", "야외 웨딩 스냅"],
    extra: {
      route: "suggestions",
      headline: "다음 웨딩 무드를 제안하는 게시판형 서비스",
      description: "웨딩 전용 프리셋 아이디어를 쌓아두는 MVP 게시판",
      icon: "forum",
      cta: "제안 보기",
    },
  }),
];

const RESULT_VARIANTS = {
  "source-outdoor": {
    paris_eiffel: [
      createMockEntry({
        id: "result-outdoor-paris_eiffel-1",
        title: "파리 에펠탑",
        preset: "파리 에펠탑",
        mood: "야외 웨딩 스냅",
        beforeImage: IMAGE_PATHS.before.outdoor,
        afterImage: IMAGE_PATHS.after.paris1,
        thumbnail: IMAGE_PATHS.after.paris1,
        tags: ["파리 에펠탑", "야외 웨딩 스냅"],
      }),
      createMockEntry({
        id: "result-outdoor-paris_eiffel-2",
        title: "파리 에펠탑",
        preset: "파리 에펠탑",
        mood: "야외 웨딩 스냅",
        beforeImage: IMAGE_PATHS.before.outdoor,
        afterImage: IMAGE_PATHS.after.paris2,
        thumbnail: IMAGE_PATHS.after.paris2,
        tags: ["파리 에펠탑", "야외 웨딩 스냅"],
      }),
      createMockEntry({
        id: "result-outdoor-paris_eiffel-3",
        title: "파리 에펠탑",
        preset: "파리 에펠탑",
        mood: "야외 웨딩 스냅",
        beforeImage: IMAGE_PATHS.before.outdoor,
        afterImage: IMAGE_PATHS.after.paris1,
        thumbnail: IMAGE_PATHS.after.paris1,
        tags: ["파리 에펠탑", "야외 웨딩 스냅"],
      }),
      createMockEntry({
        id: "result-outdoor-paris_eiffel-4",
        title: "파리 에펠탑",
        preset: "파리 에펠탑",
        mood: "야외 웨딩 스냅",
        beforeImage: IMAGE_PATHS.before.outdoor,
        afterImage: IMAGE_PATHS.after.paris2,
        thumbnail: IMAGE_PATHS.after.paris2,
        tags: ["파리 에펠탑", "야외 웨딩 스냅"],
      }),
    ],
    drama: [
      createMockEntry({
        id: "result-outdoor-drama-1",
        title: "드라마 로맨스",
        preset: "드라마 로맨스",
        mood: "야외 웨딩 스냅",
        beforeImage: IMAGE_PATHS.before.outdoor,
        afterImage: IMAGE_PATHS.after.dramaOutdoor1,
        thumbnail: IMAGE_PATHS.after.dramaOutdoor1,
        tags: ["드라마 로맨스", "야외 웨딩 스냅"],
      }),
      createMockEntry({
        id: "result-outdoor-drama-2",
        title: "드라마 로맨스",
        preset: "드라마 로맨스",
        mood: "야외 웨딩 스냅",
        beforeImage: IMAGE_PATHS.before.outdoor,
        afterImage: IMAGE_PATHS.after.dramaOutdoor2,
        thumbnail: IMAGE_PATHS.after.dramaOutdoor2,
        tags: ["드라마 로맨스", "야외 웨딩 스냅"],
      }),
      createMockEntry({
        id: "result-outdoor-drama-3",
        title: "드라마 로맨스",
        preset: "드라마 로맨스",
        mood: "야외 웨딩 스냅",
        beforeImage: IMAGE_PATHS.before.outdoor,
        afterImage: IMAGE_PATHS.after.dramaOutdoor1,
        thumbnail: IMAGE_PATHS.after.dramaOutdoor1,
        tags: ["드라마 로맨스", "야외 웨딩 스냅"],
      }),
      createMockEntry({
        id: "result-outdoor-drama-4",
        title: "드라마 로맨스",
        preset: "드라마 로맨스",
        mood: "야외 웨딩 스냅",
        beforeImage: IMAGE_PATHS.before.outdoor,
        afterImage: IMAGE_PATHS.after.dramaOutdoor2,
        thumbnail: IMAGE_PATHS.after.dramaOutdoor2,
        tags: ["드라마 로맨스", "야외 웨딩 스냅"],
      }),
    ],
  },
  "source-studio": {
    disney: [
      createMockEntry({
        id: "result-studio-disney-1",
        title: "디즈니 무드",
        preset: "디즈니 무드",
        mood: "스튜디오 원본",
        beforeImage: IMAGE_PATHS.before.studio,
        afterImage: IMAGE_PATHS.after.disney1,
        thumbnail: IMAGE_PATHS.after.disney1,
        tags: ["디즈니 무드", "스튜디오 원본"],
      }),
      createMockEntry({
        id: "result-studio-disney-2",
        title: "디즈니 무드",
        preset: "디즈니 무드",
        mood: "스튜디오 원본",
        beforeImage: IMAGE_PATHS.before.studio,
        afterImage: IMAGE_PATHS.after.disney2,
        thumbnail: IMAGE_PATHS.after.disney2,
        tags: ["디즈니 무드", "스튜디오 원본"],
      }),
      createMockEntry({
        id: "result-studio-disney-3",
        title: "디즈니 무드",
        preset: "디즈니 무드",
        mood: "스튜디오 원본",
        beforeImage: IMAGE_PATHS.before.studio,
        afterImage: IMAGE_PATHS.after.disney1,
        thumbnail: IMAGE_PATHS.after.disney1,
        tags: ["디즈니 무드", "스튜디오 원본"],
      }),
      createMockEntry({
        id: "result-studio-disney-4",
        title: "디즈니 무드",
        preset: "디즈니 무드",
        mood: "스튜디오 원본",
        beforeImage: IMAGE_PATHS.before.studio,
        afterImage: IMAGE_PATHS.after.disney2,
        thumbnail: IMAGE_PATHS.after.disney2,
        tags: ["디즈니 무드", "스튜디오 원본"],
      }),
    ],
    drama: [
      createMockEntry({
        id: "result-studio-drama-1",
        title: "드라마 로맨스",
        preset: "드라마 로맨스",
        mood: "스튜디오 원본",
        beforeImage: IMAGE_PATHS.before.studio,
        afterImage: IMAGE_PATHS.after.dramaStudio1,
        thumbnail: IMAGE_PATHS.after.dramaStudio1,
        tags: ["드라마 로맨스", "스튜디오 원본"],
      }),
      createMockEntry({
        id: "result-studio-drama-2",
        title: "드라마 로맨스",
        preset: "드라마 로맨스",
        mood: "스튜디오 원본",
        beforeImage: IMAGE_PATHS.before.studio,
        afterImage: IMAGE_PATHS.after.dramaStudio2,
        thumbnail: IMAGE_PATHS.after.dramaStudio2,
        tags: ["드라마 로맨스", "스튜디오 원본"],
      }),
      createMockEntry({
        id: "result-studio-drama-3",
        title: "드라마 로맨스",
        preset: "드라마 로맨스",
        mood: "스튜디오 원본",
        beforeImage: IMAGE_PATHS.before.studio,
        afterImage: IMAGE_PATHS.after.dramaStudio1,
        thumbnail: IMAGE_PATHS.after.dramaStudio1,
        tags: ["드라마 로맨스", "스튜디오 원본"],
      }),
      createMockEntry({
        id: "result-studio-drama-4",
        title: "드라마 로맨스",
        preset: "드라마 로맨스",
        mood: "스튜디오 원본",
        beforeImage: IMAGE_PATHS.before.studio,
        afterImage: IMAGE_PATHS.after.dramaStudio2,
        thumbnail: IMAGE_PATHS.after.dramaStudio2,
        tags: ["드라마 로맨스", "스튜디오 원본"],
      }),
    ],
  },
};

export function getSourceImage(sourceImageId) {
  return SOURCE_IMAGES.find((item) => item.id === sourceImageId) ?? SOURCE_IMAGES[0];
}

export function getCompatiblePresets(sourceImageId) {
  return PRESETS.filter((preset) => preset.isCustom || preset.supportedSourceIds.includes(sourceImageId));
}

export function resolvePresetForSource(presetId, sourceImageId) {
  const compatiblePresets = getCompatiblePresets(sourceImageId);

  return compatiblePresets.find((preset) => preset.id === presetId) ?? compatiblePresets[0] ?? PRESETS[0];
}

export function getResultVariants(sourceImageId, presetId) {
  const source = getSourceImage(sourceImageId);
  const preset = resolvePresetForSource(presetId, source.id);

  if (preset.isCustom) {
    const fallbackPreset = resolvePresetForSource(source.id === "source-studio" ? "drama" : "paris_eiffel", source.id);
    return RESULT_VARIANTS[source.id]?.[fallbackPreset.id] ?? RESULT_VARIANTS[SOURCE_IMAGES[0].id].paris_eiffel;
  }

  return RESULT_VARIANTS[source.id]?.[preset.id] ?? RESULT_VARIANTS[SOURCE_IMAGES[0].id].paris_eiffel;
}

export function getServiceCard(route) {
  return SERVICE_CARDS.find((item) => item.route === route) ?? SERVICE_CARDS[0];
}
