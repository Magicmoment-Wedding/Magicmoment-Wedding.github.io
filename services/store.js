import { PRESETS } from "../mock/presets.js";
import { resolvePresetForSource } from "../mock/wedding-data.js";
import { INITIAL_ASSISTANT_MESSAGES } from "../mock/assistant.js";
import { SOURCE_IMAGES, getSourceImage } from "../mock/sources.js";
import { DEFAULT_SUGGESTIONS } from "../mock/suggestions.js";
import { ROUTES } from "./router.js";

const STORAGE_KEY = "bloom-cinematic-mvp-state";
const SESSION_STORAGE_KEY = "bloom-cinematic-session-state";
const listeners = new Set();

const defaultState = {
  route: ROUTES.HOME,
  sourceImageId: SOURCE_IMAGES[0].id,
  selectedPresetId: PRESETS[0].id,
  selectedRatio: "original",
  customRatio: "",
  credits: 0,
  authLoading: true,
  currentUser: null,
  pendingAfterLogin: null,
  pendingGenerate: false,
  firstTimeOnboardingOpen: false,
  firstTimeOnboardingStep: 0,
  onboardingCompleting: false,
  onboardingErrorMessage: "",
  isCreditsLoading: false,
  chargingCreditPackageId: null,
  creditStatusMessage: "",
  creditStatusType: "",
  useUpscale: false,
  isGenerating: false,
  generationJobId: "",
  generationStatusMessage: "",
  generationNetworkPaused: false,
  activeModal: null,
  activeImageModal: null,
  customPresetDraft: {
    style: "",
    extra: "",
  },
  conciergeUploadCount: 0,
  conciergeUploadedImage: null,
  conciergeConcept: "",
  conciergeExtraRequest: "",
  conciergeSource: "direct",
  studioUploadCount: 0,
  assistantMessages: INITIAL_ASSISTANT_MESSAGES,
  assistantDraft: "",
  suggestionDraftTitle: "",
  suggestionDraftBody: "",
  suggestions: DEFAULT_SUGGESTIONS,
  results: [],
  generationMeta: null,
  activePreviewMode: "after",
  selectedThumbnailIndex: 0,
};

let state = loadState();

function loadState() {
  try {
    // 먼저 sessionStorage에서 현재 세션 상태 확인
    const sessionRaw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionRaw) {
      try {
        const sessionState = JSON.parse(sessionRaw);
        // 세션 상태가 있으면 유효성 검사 후 사용
        if (sessionState && typeof sessionState === "object") {
          return {
            ...defaultState,
            ...sessionState,
            route: sessionState.route ?? ROUTES.HOME,
            authLoading: true,
            firstTimeOnboardingOpen: false,
            onboardingCompleting: false,
            isGenerating: false,
            generationNetworkPaused: false,
            activeModal: null,
            activeImageModal: null,
          };
        }
      } catch (e) {
        // sessionStorage 파싱 실패 시 계속 진행
      }
    }

    // sessionStorage가 없으면 localStorage에서 로드
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return { ...defaultState };
    }

    const parsed = JSON.parse(raw);
    const sourceImageId = getSourceImage(parsed.sourceImageId).id;
    const selectedPresetId = resolvePresetForSource(parsed.selectedPresetId ?? defaultState.selectedPresetId, sourceImageId).id;

    // 새로고침 시에는 UI 상태(모달, 로딩)만 초기화, 생성 결과는 유지
    return {
      ...defaultState,
      ...parsed,
      sourceImageId,
      selectedPresetId,
      route: ROUTES.HOME,
      authLoading: true,
      firstTimeOnboardingOpen: false,
      onboardingCompleting: false,
      isGenerating: false,
      generationNetworkPaused: false,
      activeModal: null,
      activeImageModal: null,
    };
  } catch (error) {
    return { ...defaultState };
  }
}

function persistState() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    // 세션 상태도 sessionStorage에 저장하여 뒤로가기/화면 전환 시 유지
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    return;
  }
}

export function getState() {
  return state;
}

export function updateState(patch) {
  state = {
    ...state,
    ...patch,
  };

  persistState();
  listeners.forEach((listener) => listener(state));
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
