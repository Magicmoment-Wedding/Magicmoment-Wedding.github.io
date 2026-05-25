# DESIGN.md: Magic AI Studio - Bloom Cinematic

## 1. Brand Identity
**Magic AI Studio**는 AI 기술을 통해 소중한 웨딩의 순간을 영화 같은 고품질 예술 작품으로 변환해주는 프리미엄 웨딩 사진 보정 서비스입니다. 'Bloom Cinematic' 디자인 시스템을 기반으로, 20-30대 여성 사용자들이 선호하는 러블리하고 우아한 감성을 시각적으로 구현합니다.

---

## 2. Visual Language

### Color Palette
- **Primary (Rose Gold):** `#C48B97` - 주요 CTA 버튼, 활성 상태, 강조 포인트.
- **Background (Pearl White):** `#FCFBF9` - 전체 앱의 배경색으로, 따뜻하고 부드러운 진주빛 톤.
- **Surface (Glassmorphism):** `rgba(255, 255, 255, 0.5)` - 카드, 모달, 툴바에 적용되는 반투명 글래스 효과.
- **Text (Slate Rose):** `#4A3F41` - 제목 및 본문 텍스트에 사용되는 깊이 있는 장미색 계열의 차콜.
- **Accent (Pastel Pink):** `#F9E0E3` - 은은한 그림자 및 배경 그라데이션, 하이라이트.

### Typography
- **Headings:** `Newsreader`, Serif, Italic/Medium - 우아하고 고전적인 럭셔리 분위기.
- **Body & UI:** `Pretendard`, Sans-serif - 높은 가독성과 현대적인 세련미.
- **Detail:** `Newsreader`, Uppercase, Letter-spacing 0.1em - 기술적 정보나 라벨에 고급스러움 부여.

### Style Tokens
- **Radius:** `32px` (카드), `100px` (알약 형태 버튼) - 매우 둥근 모서리로 부드러운 인상 강조.
- **Shadows:** `shadow-[0_20_50px_rgba(196,139,151,0.2)]` - 발광(Glow) 효과가 있는 부드러운 그림자.
- **Blur:** `backdrop-blur-2xl` - 투명 레이어 아래의 배경을 부드럽게 뭉개 시각적 깊이 형성.

---

## 3. Core Components

### Top App Bar
- **Style:** 반투명 글래스(`bg-white/60`), `Newsreader` 이탈릭 폰트의 로고 타이틀.
- **Interactions:** 스크롤 시 상단에 고정되며 부드러운 그림자 생성.

### Bottom Navigation Bar
- **Style:** 알약 형태의 플로팅 바 디자인, 활성 탭은 원형 배경과 함께 강조.
- **Order:** 홈, 갤러리, AI 어시스턴트.

### Style Selection Cards
- **Structure:** 썸네일 이미지 + 하단 텍스트 라벨.
- **State:** 선택 시 로즈 골드 테두리와 스케일 업 효과.

### Before/After Slider
- **Mechanic:** 중앙의 세로 라인을 드래그하여 원본과 AI 보정본을 실시간으로 비교.
- **Visual:** 화이트 핸들과 부드러운 마스크 애니메이션.

---

## 4. Design Guidelines
- **Atmosphere:** 단순한 편집 도구가 아닌, 고급 웨딩 매거진을 넘겨보는 듯한 사용자 경험(UX)을 지향합니다.
- **Spacing:** 최소 `32px` 이상의 여유로운 여백을 사용하여 시각적 피로도를 낮추고 '공간감'을 제공합니다.
- **Hierarchy:** 이미지 중심의 레이아웃을 유지하되, 중요한 행동(업로드, 생성)은 로즈 골드 컬러의 대형 버튼으로 유도합니다.

---

## 5. Screen Inventory
- **Home Feed:** 스타일 탐색 및 서비스 가이드.
- **Edit Studio:** 사진 업로드 및 배경 스타일(유럽/디즈니) 선택.
- **Result Preview:** 비포/애프터 비교 및 프리미엄 액자 제작 제안.
- **Welcome Screen:** 서비스 진입 인트로 및 권한 설정.
