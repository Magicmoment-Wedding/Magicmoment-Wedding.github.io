export const GUIDE_COPY_ITEMS = [
  {
    icon: "add_photo_alternate",
    title: "사진 올리기",
    paragraphs: [
      "좋은 결과는 원본 사진에서 시작돼요.",
      "고화질 사진, 밝은 조명, 흰색 또는 단순한 배경일수록 AI가 얼굴을 더 정확하게 인식해요.",
      "이미 보정이 많이 들어간 사진보다는 원본에 가까운 사진을 올리면 더 자연스럽고 멋진 결과가 나와요.",
    ],
    highlights: ["고화질 사진", "흰색 또는 단순한 배경", "원본에 가까운 사진", "더 자연스럽고 멋진 결과"],
  },
  {
    icon: "palette",
    title: "스타일 선택하기",
    paragraphs: [
      "원하는 스타일에 어울리는 사진을 고르면 결과가 더 좋아져요.",
      "예를 들어 소파샷은 앉아있는 사진, 꽃잎샷은 가까운 커플 사진처럼 원본 포즈와 스타일이 잘 맞을수록 자연스럽게 완성돼요.",
      "스타일마다 예쁨단계가 있어요. 유럽배경은 1단계, 디즈니배경은 3단계처럼 콘셉트에 따라 의상, 분위기, 약간의 예쁨 보정이 들어갈 수 있어요.",
    ],
    highlights: ["스타일에 어울리는 사진", "원본 포즈와 스타일", "예쁨단계", "약간의 예쁨 보정"],
  },
  {
    icon: "photo_library",
    title: "6. 스타일 갤러리에 올리기",
    badge: "5크레딧 지급",
    paragraphs: [
      "완성된 사진 중 마음에 드는 1장을 스타일 갤러리에 올릴 수 있어요.",
      "갤러리에 업로드하면 5크레딧을 지급해드려요.",
      "다른 예비 신랑신부가 스타일을 고르는 데 도움이 되고, 추가 크레딧도 받을 수 있어요.",
    ],
    highlights: ["1장", "5크레딧", "5크레딧 지급", "추가 크레딧"],
  },
  {
    icon: "redeem",
    title: "가입 선물 25크레딧 안내",
    paragraphs: [
      "첫 가입자는 이용안내 확인 후 가입 선물 25크레딧을 받을 수 있습니다.",
      "가입 선물 크레딧으로 만든 사진은 일반 제작과 동일하게 워터마크 없이 제공됩니다.",
      "완료 후 사진편집 화면에서 가입 선물 1회 제작을 시작해 주세요.",
    ],
    highlights: ["가입 선물 25크레딧", "워터마크 없이", "가입 선물 1회 제작"],
  },
];

function emphasizeText(text, highlights = []) {
  const tokens = [...highlights].sort((a, b) => b.length - a.length);
  let result = "";
  let index = 0;

  while (index < text.length) {
    const match = tokens.find((highlight) => text.startsWith(highlight, index));

    if (match) {
      result += `<strong class="font-bold text-primary">${match}</strong>`;
      index += match.length;
      continue;
    }

    result += text[index];
    index += 1;
  }

  return result;
}

export function renderGuideBody(item, className = "text-sm leading-6 text-on-surface-variant") {
  return `
    <div class="flex flex-col gap-2.5">
      ${item.paragraphs.map((paragraph) => `
        <p class="${className}">${emphasizeText(paragraph, item.highlights)}</p>
      `).join("")}
    </div>
  `;
}
