export const CREDIT_PRICING = {
  base: 25,
  ratioTransform: 10,
  upscale: 50,
};

export const FREE_POLICY = {
  totalGenerations: 3,
  adsPerLockedFreeGeneration: 2,
};

export const CREDIT_PACKAGES = [
  {
    id: "pack-200",
    credits: 200,
    price: 19800,
    name: "200 크레딧",
    description: "테스트 충전용 기본 패키지",
  },
  {
    id: "pack-500",
    credits: 500,
    price: 39800,
    name: "500 크레딧",
    description: "더 많은 웨딩사진을 만들 수 있는 테스트 패키지",
  },
];

export const PRINT_PRODUCTS = [
  {
    id: "basic-print",
    name: "기본 출력",
    price: 100000,
    summary: "10장 / 100,000원",
    description: "결혼식장 테이블 액자 규격 출력",
    cta: "사진 출력 서비스 신청",
  },
  {
    id: "premium-print",
    name: "프리미엄 출력",
    price: 150000,
    summary: "10장 / 150,000원",
    description: "프리미엄 업스케일 포함 / 결혼식장 테이블 액자 규격 출력",
    cta: "프리미엄 출력 서비스",
  },
];

export const RATIO_OPTIONS = [
  { value: "original", label: "원본" },
  { value: "9:16", label: "9:16" },
  { value: "3:2", label: "3:2" },
  { value: "4:3", label: "4:3" },
  { value: "1:1", label: "1:1" },
  { value: "custom", label: "직접입력" },
];

export function getRatioDisplay(selectedRatio, customRatio) {
  if (selectedRatio === "custom") {
    return customRatio.trim() || "직접입력";
  }

  return RATIO_OPTIONS.find((item) => item.value === selectedRatio)?.label ?? "원본";
}

export function getCreditBreakdown(state) {
  const ratio = state.selectedRatio !== "original" ? CREDIT_PRICING.ratioTransform : 0;
  const upscale = state.useUpscale ? CREDIT_PRICING.upscale : 0;

  return {
    base: CREDIT_PRICING.base,
    ratio,
    upscale,
    total: CREDIT_PRICING.base + ratio + upscale,
  };
}

export function getRemainingFreeGenerations(freeGenerationsUsed) {
  return Math.max(0, FREE_POLICY.totalGenerations - freeGenerationsUsed);
}

export function getGenerationAccess(state) {
  const cost = getCreditBreakdown(state).total;
  const freeRemaining = getRemainingFreeGenerations(state.freeGenerationsUsed);

  if (freeRemaining > 0) {
    const nextFreeNumber = state.freeGenerationsUsed + 1;

    return {
      mode: "free",
      cost,
      freeRemaining,
      nextFreeNumber,
      requiresAds: nextFreeNumber > 1,
      adsToWatch: nextFreeNumber > 1 ? FREE_POLICY.adsPerLockedFreeGeneration : 0,
      canAfford: true,
      shortfall: 0,
    };
  }

  return {
    mode: "paid",
    cost,
    freeRemaining,
    nextFreeNumber: null,
    requiresAds: false,
    adsToWatch: 0,
    canAfford: state.credits >= cost,
    shortfall: Math.max(0, cost - state.credits),
  };
}
