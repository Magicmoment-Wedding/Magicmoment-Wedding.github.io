import { PRESETS } from "../mock/presets.js";
import { resolvePresetForSource } from "../mock/wedding-data.js";
import { INITIAL_ASSISTANT_MESSAGES } from "../mock/assistant.js";
import { SOURCE_IMAGES, getSourceImage } from "../mock/sources.js";
import { DEFAULT_SUGGESTIONS } from "../mock/suggestions.js";
import { ROUTES } from "./router.js";

const STORAGE_KEY = "bloom-cinematic-mvp-state";
const listeners = new Set();

const defaultState = {
  route: ROUTES.HOME,
  sourceImageId: SOURCE_IMAGES[0].id,
  selectedPresetId: PRESETS[0].id,
  selectedRatio: "original",
  customRatio: "",
  credits: 0,
  freeGenerationsUsed: 0,
  useUpscale: false,
  isGenerating: false,
  activeModal: null,
  activeImageModal: null,
  customPresetDraft: {
    style: "",
    extra: "",
  },
  conciergeUploadCount: 0,
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
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return { ...defaultState };
    }

    const parsed = JSON.parse(raw);
    const sourceImageId = getSourceImage(parsed.sourceImageId).id;
    const selectedPresetId = resolvePresetForSource(parsed.selectedPresetId ?? defaultState.selectedPresetId, sourceImageId).id;

    return {
      ...defaultState,
      ...parsed,
      sourceImageId,
      selectedPresetId,
      route: ROUTES.HOME,
      isGenerating: false,
      activeModal: null,
      activeImageModal: null,
      results: [],
      generationMeta: null,
      activePreviewMode: "after",
      selectedThumbnailIndex: 0,
    };
  } catch (error) {
    return { ...defaultState };
  }
}

function persistState() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
