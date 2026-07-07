export const CREDIT_PRICING = {
  base: 25,
  ratioTransform: 10,
  upscale: 50,
};

export const CREDIT_PACKAGES = [
  {
    id: "open_first_spark_pass_8",
    productCode: "open_first_spark_pass_8",
    passUses: 12,
    servicePeriodMonths: 3,
    credits: 200,
    price: 9900,
    originalPrice: 49800,
    badge: "기간 한정 할인",
    name: "첫 설렘 패스",
    description: "처음이라면 가볍게 체험해보세요.\nAI 웨딩사진 제작 12회",
    servicePeriodLabel: "구매일로부터 3개월",
    cta: "이용권 선택하기",
    orderName: "첫 설렘 패스 - AI 웨딩사진 제작 이용권 12회",
  },
  {
    id: "wedding_photo_pass_20",
    productCode: "wedding_photo_pass_20",
    passUses: 20,
    servicePeriodMonths: 3,
    credits: 500,
    price: 99000,
    badge: "STANDARD",
    name: "포토테이블 준비 패스",
    description: "스튜디오 사진이 부족하거나, 포토테이블용 사진이 필요할 때.\nAI 웨딩사진 제작 20회",
    servicePeriodLabel: "구매일로부터 3개월",
    cta: "이용권 선택하기",
    orderName: "포토테이블 준비 패스 - AI 웨딩사진 제작 이용권 20회",
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

export function getGenerationAccess(state) {
  const cost = getCreditBreakdown(state).total;
  const remainingUsesValue = state.currentUser?.generationUsage?.remainingGenerationUses;
  const remainingUses = Number.isFinite(Number(remainingUsesValue))
    ? Math.max(0, Math.floor(Number(remainingUsesValue)))
    : null;
  const canUseFreeGeneration = state.currentUser?.generationUsage?.freeGenerationAvailable === true;

  if (canUseFreeGeneration) {
    return {
      mode: "free",
      cost: 0,
      freeRemaining: 1,
      nextFreeNumber: 1,
      requiresAds: false,
      adsToWatch: 0,
      canAfford: true,
      shortfall: 0,
    };
  }

  return {
    mode: "paid",
    cost,
    freeRemaining: 0,
    nextFreeNumber: null,
    requiresAds: false,
    adsToWatch: 0,
    canAfford: remainingUses !== null && remainingUses > 0,
    shortfall: remainingUses === null || remainingUses < 1 ? 1 : 0,
  };
}
