export const PRESET_PROMPT_INTENTS = {
  paris_eiffel: [
    "keep the people unchanged",
    "preserve face, pose, body proportions, hands, bouquet, and composition",
    "replace only the background with an outdoor Paris Eiffel Tower wedding scene",
    "adapt lighting naturally to match the outdoor environment",
    "maintain premium romantic wedding editorial quality",
  ],
  disney: [
    "인물은 그대로 유지",
    "배경을 동화 같은 웨딩 장면으로 변경",
    "조명을 부드럽고 화사하게 정리",
  ],
  drama: [
    "인물은 그대로 유지",
    "배경을 영화 같은 로맨스 장면으로 변경",
    "명암과 역광을 자연스럽게 보정",
  ],
  custom: [
    "인물은 그대로 유지",
    "사용자 요청에 맞게 배경만 변경",
    "조명은 웨딩 톤에 맞게 자연스럽게 정리",
  ],
};

export function getPresetPromptIntent(presetKey) {
  return PRESET_PROMPT_INTENTS[presetKey] ?? [
    "keep the people unchanged",
    "replace only the requested background",
    "adapt lighting naturally",
  ];
}
