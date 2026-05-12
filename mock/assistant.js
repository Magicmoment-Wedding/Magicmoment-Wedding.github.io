export const INITIAL_ASSISTANT_MESSAGES = [
  {
    id: "assistant-welcome",
    role: "assistant",
    text: "야외 웨딩 스냅, 스튜디오 원본, 파리 에펠탑, 디즈니 무드, 드라마 로맨스 중 원하는 방향을 말씀해주시면 바로 이어서 안내해드릴게요.",
  },
];

export function buildAssistantReply(message) {
  const normalized = (message || "").toLowerCase();

  if (normalized.includes("야외") || normalized.includes("스냅")) {
    return "야외 웨딩 스냅 원본이면 파리 에펠탑이나 드라마 로맨스가 자연스럽습니다. 더 세밀한 요청은 대행 서비스로 바로 이어드릴 수 있어요.";
  }

  if (normalized.includes("스튜디오") || normalized.includes("원본")) {
    return "스튜디오 원본이면 디즈니 무드나 드라마 로맨스가 잘 맞습니다. 꽃 장식이나 조명 톤까지 정리하려면 대행 서비스를 추천드려요.";
  }

  if (normalized.includes("파리") || normalized.includes("유럽")) {
    return "파리 에펠탑은 야외 웨딩 스냅과 연결했을 때 가장 자연스럽습니다. 현재 mock 세트도 그 기준으로 맞춰져 있어요.";
  }

  if (normalized.includes("디즈니") || normalized.includes("동화")) {
    return "디즈니 무드는 스튜디오 원본과 연결했을 때 가장 부드럽고 자연스럽게 보입니다.";
  }

  if (normalized.includes("출력") || normalized.includes("액자")) {
    return "출력 목적이라면 기본 출력 또는 프리미엄 출력 서비스를 같이 보시는 게 좋아요. 결과 화면에서 바로 신청도 가능합니다.";
  }

  return "좋아요. 파리 에펠탑, 디즈니 무드, 드라마 로맨스 중 하나로 먼저 테스트하고, 디테일 조정이 더 필요하면 전문가 대행으로 이어가는 흐름이 가장 자연스럽습니다.";
}
