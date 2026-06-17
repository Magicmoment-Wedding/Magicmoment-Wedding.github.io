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
    title: "결과 확인하기",
    paragraphs: [
      "생성된 결과 4장을 확인하고, 크게보기를 눌러 마음에 드는 사진을 자세히 확인하세요.",
      "AI가 추천한 사진도 함께 표시되니 자연스러운 결과를 고르는 데 참고할 수 있어요.",
    ],
    highlights: ["4장", "크게보기", "AI가 추천한 사진"],
  },
  {
    icon: "touch_app",
    title: "사진 저장하기",
    paragraphs: [
      "크게보기 화면에서 사진을 길게 눌러 휴대폰 사진 앱에 저장해 주세요.",
      "다운로드 폴더보다 사진 앱에 바로 저장하는 방식을 권장합니다.",
    ],
    highlights: ["길게 눌러", "사진 앱에 저장"],
  },
  {
    icon: "cloud_upload",
    title: "스타일 갤러리에 올리기",
    badge: "5크레딧 지급",
    paragraphs: [
      "완성된 사진 중 마음에 드는 1장을 스타일 갤러리에 올릴 수 있어요.",
      "갤러리에 업로드하면 5크레딧을 지급해드려요.",
      "다른 예비 신랑신부가 스타일을 고르는 데 도움이 되고, 추가 크레딧도 받을 수 있어요.",
      "신규회원은 이용안내 완료 후 워터마크가 포함된 무료 1회 제작을 시작할 수 있어요.",
    ],
    highlights: ["1장", "5크레딧", "5크레딧 지급", "추가 크레딧", "무료 1회 제작", "워터마크"],
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
