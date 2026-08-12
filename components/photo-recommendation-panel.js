/**
 * photo-recommendation-panel.js
 * ------------------------------------------------------------------
 * "사진 업로드 → 분석 → (필요 시 보정) → 추천 그리드 → 선택" UI를
 * 하나의 컨테이너 엘리먼트 안에 렌더링하는 컴포넌트.
 *
 * 주의: 이 저장소의 components/*.js 는 대부분 ES module(import/export) 방식의
 * 별도 프로토타입 앱용이며, 실제 운영되는 index.html은 모듈이 아닌 하나의
 * 인라인 <script>다. 이 파일은 그 실제 운영 스택에 그대로 <script src="...">
 * 로 꽂을 수 있도록 IIFE + 전역 네임스페이스(window.PhotoReco.ui) 방식으로
 * 작성했다. services/photo-analysis.js, services/photo-matching.js와 동일한
 * 컨벤션이다.
 *
 * 사용법:
 *   const panel = PhotoReco.ui.createRecommendationPanel(containerEl, {
 *     catalog: sampleCatalogJson.samples,
 *     min: 3,
 *     max: 6,
 *     onSelectSample(sample, matchInfo) { ... },
 *     onGenerateRequest(sample, matchInfo) { ... },
 *   });
 */
(function (global) {
  "use strict";

  const STATE = {
    IDLE: "idle",
    ANALYZING: "analyzing",
    REVIEW: "review",
    RESULTS: "results",
  };

  const CATEGORY_LABEL = {
    국내야외: "국내야외",
    해외야외: "해외야외",
    프리미엄스튜디오: "프리미엄 스튜디오",
  };

  const CHIP_OPTIONS = {
    type: [
      { value: "standing", label: "서 있음" },
      { value: "sitting", label: "앉음" },
      { value: "walking", label: "걷는 중" },
      { value: "leaning", label: "기댐" },
      { value: "lying", label: "누움" },
    ],
    bodyDirection: [
      { value: "front", label: "정면" },
      { value: "three_quarter", label: "반측면" },
      { value: "side", label: "측면" },
      { value: "back", label: "뒷모습" },
    ],
    headTilt: [
      { value: "level", label: "정면 응시" },
      { value: "tilt_left", label: "고개 좌측 기울임" },
      { value: "tilt_right", label: "고개 우측 기울임" },
      { value: "look_down", label: "아래 시선" },
      { value: "look_up", label: "위 시선" },
    ],
    interaction: [
      { value: "none", label: "소품 없음" },
      { value: "hand_hold", label: "손 맞잡음" },
      { value: "embrace", label: "포옹" },
      { value: "bouquet", label: "부케" },
      { value: "prop", label: "기타 소품" },
    ],
    cameraLevel: [
      { value: "eye_level", label: "아이레벨" },
      { value: "high_angle", label: "하이앵글" },
      { value: "low_angle", label: "로우앵글" },
    ],
  };

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function createRecommendationPanel(container, options) {
    if (!container) throw new Error("photo-recommendation-panel: container element is required");
    const opts = Object.assign(
      {
        catalog: [],
        min: 3,
        max: 6,
        assetBasePath: "",
        onSelectSample: null,
        onGenerateRequest: null,
      },
      options || {}
    );

    let state = STATE.IDLE;
    let currentImageDataUrl = null;
    let currentFeatures = null;
    let currentOverrides = { pose: {}, angle: {} };
    let currentRecommendations = [];
    let selectedSampleId = null;

    function setState(next) {
      state = next;
      render();
    }

    function resolveImagePath(path) {
      if (!path) return "";
      if (/^https?:\/\//.test(path)) return path;
      return opts.assetBasePath ? opts.assetBasePath.replace(/\/$/, "") + "/" + path : path;
    }

    // -------------------------------------------------------------
    // 렌더링
    // -------------------------------------------------------------

    function render() {
      container.innerHTML = renderState();
      bindEvents();
    }

    function renderState() {
      switch (state) {
        case STATE.ANALYZING:
          return renderAnalyzing();
        case STATE.REVIEW:
          return renderReview();
        case STATE.RESULTS:
          return renderResults();
        case STATE.IDLE:
        default:
          return renderUpload();
      }
    }

    function renderUpload() {
      return `
        <div class="w-full">
          <label for="photo-reco-file-input"
            class="block w-full border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-gray-400 transition-colors bg-white/60">
            <span class="material-symbols-outlined text-[40px] text-gray-400">add_photo_alternate</span>
            <p class="mt-2 text-sm font-medium text-gray-700">스튜디오 웨딩 사진을 업로드해 주세요</p>
            <p class="mt-1 text-xs text-gray-400">인물의 포즈·앵글·조명이 비슷한 배경 샘플을 찾아드려요</p>
          </label>
          <input id="photo-reco-file-input" type="file" accept="image/*" class="hidden" />
        </div>
      `;
    }

    function renderAnalyzing() {
      return `
        <div class="w-full flex flex-col items-center justify-center gap-3 py-10">
          <div class="w-10 h-10 rounded-full border-4 border-gray-200 border-t-gray-800 animate-spin"></div>
          <p class="text-sm text-gray-500">사진의 포즈·앵글·조명을 분석하고 있어요...</p>
        </div>
      `;
    }

    function renderReview() {
      const f = currentFeatures;
      const merged = mergedFeatures();
      return `
        <div class="w-full">
          <div class="flex gap-4 items-start">
            <img src="${currentImageDataUrl}" alt="업로드한 사진" class="w-24 h-32 object-cover rounded-xl border border-gray-200" />
            <div class="flex-1 text-sm text-gray-600">
              <p class="font-medium text-gray-800">자동 분석 결과를 확인해 주세요</p>
              <p class="mt-1 text-xs text-gray-400">
                자신 있게 계산된 값(비율·조명·인물 비율)은 자동으로 적용했고,
                포즈·방향처럼 추정이 어려운 항목은 아래에서 직접 확인/보정해 주세요.
              </p>
              <div class="mt-2 flex flex-wrap gap-1.5 text-[11px] text-gray-500">
                <span class="px-2 py-1 rounded-full bg-gray-100">${orientationLabel(f.composition.orientation)}</span>
                <span class="px-2 py-1 rounded-full bg-gray-100">${shotTypeLabel(f.angle.shotType)}</span>
                <span class="px-2 py-1 rounded-full bg-gray-100">${lightingLabel(f.lighting.direction)}</span>
              </div>
            </div>
          </div>

          ${renderChipGroup("자세", "type", merged.pose.type)}
          ${renderChipGroup("인물 방향", "bodyDirection", merged.pose.bodyDirection)}
          ${renderChipGroup("고개 각도", "headTilt", merged.pose.headTilt)}
          ${renderChipGroup("소품 상호작용", "interaction", merged.pose.interaction)}
          ${renderChipGroup("카메라 앵글", "cameraLevel", merged.angle.cameraLevel)}

          <button data-action="run-recommend"
            class="mt-5 w-full py-3 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors">
            이 정보로 추천받기
          </button>
        </div>
      `;
    }

    function renderChipGroup(label, field, currentValue) {
      const options = CHIP_OPTIONS[field];
      return `
        <div class="mt-4">
          <p class="text-xs font-medium text-gray-500 mb-1.5">${label}</p>
          <div class="flex flex-wrap gap-1.5">
            ${options
              .map(
                (o) => `
              <button data-action="set-chip" data-field="${field}" data-value="${o.value}"
                class="px-3 py-1.5 rounded-full text-xs border transition-colors ${
                  currentValue === o.value
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }">
                ${o.label}
              </button>
            `
              )
              .join("")}
          </div>
        </div>
      `;
    }

    function renderResults() {
      if (currentRecommendations.length === 0) {
        return `
          <div class="w-full text-center py-10">
            <p class="text-sm text-gray-500">조건에 맞는 추천 샘플을 찾지 못했어요.</p>
            <button data-action="back-to-review" class="mt-3 text-xs text-gray-400 underline">조건 다시 확인하기</button>
          </div>
        `;
      }

      const cards = currentRecommendations
        .map(
          (rec) => `
        <button data-action="select-sample" data-sample-id="${rec.sample.id}"
          class="text-left rounded-2xl border-2 overflow-hidden transition-all ${
            selectedSampleId === rec.sample.id ? "border-gray-900 ring-2 ring-gray-900/20" : "border-gray-200 hover:border-gray-400"
          }">
          <div class="relative aspect-[4/5] bg-gray-100">
            <img src="${resolveImagePath(rec.sample.image)}" alt="${escapeHtml(rec.sample.id)}"
              class="absolute inset-0 w-full h-full object-cover" loading="lazy" />
            <span class="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[11px] font-semibold">
              ${rec.score}% 일치
            </span>
            <span class="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/90 text-gray-700 text-[10px] font-medium">
              ${CATEGORY_LABEL[rec.sample.categoryGroup] || rec.sample.categoryGroup}
            </span>
          </div>
          <div class="p-2.5">
            <p class="text-[11px] text-gray-500 leading-snug">${escapeHtml(rec.reasons[0] || "")}</p>
          </div>
        </button>
      `
        )
        .join("");

      const selected = currentRecommendations.find((r) => r.sample.id === selectedSampleId);

      return `
        <div class="w-full">
          <div class="flex items-center justify-between mb-3">
            <p class="text-sm font-medium text-gray-800">추천 결과 ${currentRecommendations.length}개</p>
            <button data-action="back-to-review" class="text-xs text-gray-400 underline">다시 분석하기</button>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">${cards}</div>

          ${
            selected
              ? `
            <div class="mt-4 p-4 rounded-2xl bg-gray-50 border border-gray-200">
              <p class="text-xs font-medium text-gray-700 mb-1">선택한 샘플이 자연스러운 이유</p>
              <ul class="text-xs text-gray-500 list-disc pl-4 space-y-0.5">
                ${selected.reasons.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}
              </ul>
              <button data-action="request-generate" data-sample-id="${selected.sample.id}"
                class="mt-3 w-full py-3 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors">
                이 배경으로 생성하기
              </button>
            </div>
          `
              : `<p class="mt-4 text-xs text-gray-400 text-center">카드를 선택하면 생성 요청을 진행할 수 있어요</p>`
          }
        </div>
      `;
    }

    // -------------------------------------------------------------
    // 라벨 헬퍼
    // -------------------------------------------------------------

    function orientationLabel(v) {
      return { portrait: "세로형", landscape: "가로형", square: "정사각형" }[v] || v;
    }
    function shotTypeLabel(v) {
      return (
        { closeup: "클로즈업", half_body: "반신", three_quarter_body: "3/4신", full_body: "전신" }[v] || v
      );
    }
    function lightingLabel(v) {
      return { front: "정면광", left: "좌측광", right: "우측광", backlight: "역광", flat: "균일광" }[v] || v;
    }

    // -------------------------------------------------------------
    // 상태 병합/전이
    // -------------------------------------------------------------

    function mergedFeatures() {
      if (!currentFeatures) return null;
      return global.PhotoReco.analysis.applyManualOverrides(currentFeatures, currentOverrides);
    }

    async function handleFile(file) {
      currentImageDataUrl = await readFileAsDataUrl(file);
      setState(STATE.ANALYZING);
      try {
        currentFeatures = await global.PhotoReco.analysis.analyzePhoto(currentImageDataUrl);
        currentOverrides = { pose: {}, angle: {} };
        setState(STATE.REVIEW);
      } catch (err) {
        console.error("[PhotoReco] analyze failed", err);
        setState(STATE.IDLE);
      }
    }

    function readFileAsDataUrl(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    function runRecommend() {
      const features = mergedFeatures();
      const results = global.PhotoReco.matching.recommendSamples(features, opts.catalog, {
        min: opts.min,
        max: opts.max,
      });
      currentRecommendations = results;
      selectedSampleId = null;
      setState(STATE.RESULTS);
    }

    function setChip(field, value) {
      if (field in CHIP_OPTIONS && ["type", "bodyDirection", "headTilt", "interaction"].includes(field)) {
        currentOverrides.pose[field] = value;
      } else if (field === "cameraLevel") {
        currentOverrides.angle.cameraLevel = value;
      }
      render();
    }

    function selectSample(sampleId) {
      selectedSampleId = sampleId;
      render();
      const rec = currentRecommendations.find((r) => r.sample.id === sampleId);
      if (rec && typeof opts.onSelectSample === "function") {
        opts.onSelectSample(rec.sample, rec);
      }
    }

    function requestGenerate(sampleId) {
      const rec = currentRecommendations.find((r) => r.sample.id === sampleId);
      if (rec && typeof opts.onGenerateRequest === "function") {
        opts.onGenerateRequest(rec.sample, rec);
      }
    }

    // -------------------------------------------------------------
    // 이벤트 바인딩 (매 render마다 innerHTML을 새로 그리므로 위임 없이 재바인딩)
    // -------------------------------------------------------------

    function bindEvents() {
      const fileInput = container.querySelector("#photo-reco-file-input");
      if (fileInput) {
        fileInput.addEventListener("change", (e) => {
          const file = e.target.files && e.target.files[0];
          if (file) handleFile(file);
        });
      }

      container.querySelectorAll('[data-action="set-chip"]').forEach((btn) => {
        btn.addEventListener("click", () => setChip(btn.dataset.field, btn.dataset.value));
      });

      const runBtn = container.querySelector('[data-action="run-recommend"]');
      if (runBtn) runBtn.addEventListener("click", runRecommend);

      const backBtn = container.querySelector('[data-action="back-to-review"]');
      if (backBtn) backBtn.addEventListener("click", () => setState(STATE.REVIEW));

      container.querySelectorAll('[data-action="select-sample"]').forEach((btn) => {
        btn.addEventListener("click", () => selectSample(btn.dataset.sampleId));
      });

      const genBtn = container.querySelector('[data-action="request-generate"]');
      if (genBtn) genBtn.addEventListener("click", () => requestGenerate(genBtn.dataset.sampleId));
    }

    render();

    return {
      reset() {
        state = STATE.IDLE;
        currentImageDataUrl = null;
        currentFeatures = null;
        currentOverrides = { pose: {}, angle: {} };
        currentRecommendations = [];
        selectedSampleId = null;
        render();
      },
      getState() {
        return state;
      },
    };
  }

  const PhotoRecoUI = { createRecommendationPanel };

  global.PhotoReco = global.PhotoReco || {};
  global.PhotoReco.ui = PhotoRecoUI;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = PhotoRecoUI;
  }
})(typeof window !== "undefined" ? window : globalThis);
