import { renderLayout } from "./components/layout.js";
import { buildAssistantReply } from "./mock/assistant.js";
import { STYLE_GALLERY } from "./mock/gallery.js";
import { resolvePresetForSource } from "./mock/presets.js";
import { renderAssistantPage } from "./pages/assistant.js";
import { renderConciergePage } from "./pages/concierge.js";
import { renderCreatePage } from "./pages/create.js";
import { renderGalleryPage } from "./pages/gallery.js";
import { renderHomePage } from "./pages/home.js";
import { renderMorePage } from "./pages/more.js";
import { renderOptionsPage } from "./pages/options.js";
import { renderResultPage } from "./pages/result.js";
import { renderStudioPage } from "./pages/studio.js";
import { renderSuggestionsPage } from "./pages/suggestions.js";
import { CREDIT_PACKAGES, CREDIT_PRICING, FREE_POLICY, PRINT_PRODUCTS, getCreditBreakdown, getGenerationAccess, getRemainingFreeGenerations } from "./services/credit.js";
import { formatNumber } from "./services/format.js";
import { generateResults, generateStudioResults } from "./services/generator.js";
import { getPresetPromptIntent } from "./services/prompt-intents.js";
import { navigate, PREVIOUS_ROUTE, ROUTES, getRouteFromHash, initRouter } from "./services/router.js";
import { getState, subscribe, updateState } from "./services/store.js";

const app = document.getElementById("app");

function renderRoute(route, state) {
  if (route === ROUTES.RESULT && state.results.length === 0) {
    navigate(ROUTES.HOME);
    return;
  }

  if (route === ROUTES.RESULT) {
    console.log("[render] 결과 화면 진입", {
      resultsCount: state.results.length,
      generationMeta: state.generationMeta,
    });
  }

  const page = getPage(route, state);
  app.innerHTML = renderLayout({
    route,
    title: page.title,
    content: page.content,
    state,
  });
}

function getPage(route, state) {
  switch (route) {
    case ROUTES.CREATE:
      return { title: "샘플 이미지 선택", content: renderCreatePage(state) };
    case ROUTES.OPTIONS:
      return { title: "생성 옵션 선택", content: renderOptionsPage(state, getCreditBreakdown(state)) };
    case ROUTES.RESULT:
      return { title: "생성 결과", content: renderResultPage(state) };
    case ROUTES.GALLERY:
      return { title: "스타일 갤러리", content: renderGalleryPage(state) };
    case ROUTES.MORE:
      return { title: "더 많은 기능", content: renderMorePage(state) };
    case ROUTES.CONCIERGE:
      return { title: "대행 서비스", content: renderConciergePage(state) };
    case ROUTES.STUDIO:
      return { title: "방구석 스튜디오", content: renderStudioPage(state) };
    case ROUTES.ASSISTANT:
      return { title: "AI 어시스턴트", content: renderAssistantPage(state) };
    case ROUTES.SUGGESTIONS:
      return { title: "프리셋 제안", content: renderSuggestionsPage(state) };
    case ROUTES.HOME:
    default:
      return { title: "웨딩 배경 생성", content: renderHomePage(state) };
  }
}

function syncRoute() {
  updateState({ route: getRouteFromHash() });
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function closeModal() {
  updateState({ activeModal: null });
}

function openCreditsModal(reason = "header", extra = {}) {
  updateState({
    activeModal: {
      type: "credits",
      reason,
      ...extra,
    },
  });
}

function openCustomPresetModal() {
  updateState({
    activeModal: {
      type: "customPreset",
    },
  });
}

function getGalleryStyle(styleId) {
  return STYLE_GALLERY.find((item) => item.id === styleId) ?? STYLE_GALLERY[0];
}

function getLastUserQuestion(messages) {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user");
  return lastUserMessage?.text ?? "";
}

function getRecommendedResultIndex(payload) {
  const resultCount = payload?.results?.length ?? 0;
  const metaIndex = payload?.generationMeta?.recommendedIndex;

  if (Number.isInteger(metaIndex) && metaIndex >= 0 && metaIndex < resultCount) {
    return metaIndex;
  }

  const resultIndex = payload?.results?.findIndex((result) => result.isRecommended);
  return resultIndex >= 0 ? resultIndex : null;
}

function getImageModalItems(state) {
  const selectedResult = state.results[state.selectedThumbnailIndex] ?? state.results[0];
  const sourceUrl = selectedResult?.beforeUrl ?? "";
  const recommendationStatus = state.generationMeta?.recommendationStatus ?? "pending";
  const recommendedIndex = Number.isInteger(state.generationMeta?.recommendedIndex)
    ? state.generationMeta.recommendedIndex
    : getRecommendedResultIndex({ results: state.results, generationMeta: state.generationMeta });
  const recommendedLabel = "AI 추천";

  return [
    {
      url: sourceUrl,
      label: "원본 이미지",
      isRecommended: false,
    },
    ...state.results.map((result, index) => ({
      url: result.afterUrl,
      label: index === recommendedIndex
        ? `${recommendedLabel} · ${result.variantLabel ?? `결과 ${index + 1}`}`
        : `${result.variantLabel ?? `AI 생성 결과 ${index + 1}`}`,
      isRecommended: index === recommendedIndex,
      resultIndex: index,
    })),
  ].filter((item) => item.url);
}

function openImageModal(imageUrl, label) {
  const state = getState();
  const items = getImageModalItems(state);
  const matchedIndex = items.findIndex((item) => item.url === imageUrl && item.label === label);
  const fallbackIndex = items.findIndex((item) => item.url === imageUrl);
  const index = matchedIndex >= 0 ? matchedIndex : Math.max(0, fallbackIndex);
  const item = items[index] ?? {
    url: imageUrl,
    label,
    isRecommended: false,
  };

  updateState({
    activeImageModal: {
      ...item,
      index,
      items,
    },
  });
}

function closeImageModal() {
  updateState({ activeImageModal: null });
}

function moveImageModal(direction) {
  const imageModal = getState().activeImageModal;
  const items = Array.isArray(imageModal?.items) ? imageModal.items : [];

  if (!imageModal || items.length < 2) {
    return;
  }

  const currentIndex = Number.isInteger(imageModal.index) ? imageModal.index : 0;
  const nextIndex = (currentIndex + direction + items.length) % items.length;
  const nextItem = items[nextIndex];

  updateState({
    activeImageModal: {
      ...nextItem,
      index: nextIndex,
      items,
    },
  });
}

async function watchAdsThenContinue(totalAds) {
  for (let index = 1; index <= totalAds; index += 1) {
    updateState({
      activeModal: {
        type: "ads",
        status: "watching",
        step: index,
        total: totalAds,
      },
    });
    await delay(2200);
  }

  updateState({
    activeModal: {
      type: "ads",
      status: "complete",
      step: totalAds,
      total: totalAds,
    },
  });

  await delay(900);
  closeModal();
}

async function performGeneration({ isFree }) {
  const state = getState();
  const generationCost = getCreditBreakdown(state).total;
  const nextCredits = isFree ? state.credits : state.credits - generationCost;
  const nextFreeUsage = isFree ? state.freeGenerationsUsed + 1 : state.freeGenerationsUsed;
  const requestState = {
    ...state,
    credits: nextCredits,
    freeGenerationsUsed: nextFreeUsage,
  };

  updateState({
    activeModal: null,
    isGenerating: true,
    credits: nextCredits,
    freeGenerationsUsed: nextFreeUsage,
  });

  console.log("[generation] 생성 시작", {
    sourceImageId: requestState.sourceImageId,
    selectedPresetId: requestState.selectedPresetId,
    presetKey: requestState.selectedPresetId,
    promptIntent: getPresetPromptIntent(requestState.selectedPresetId),
    selectedRatio: requestState.selectedRatio,
    customRatio: requestState.customRatio,
    useUpscale: requestState.useUpscale,
    isFree,
  });

  try {
    const resultPayload = await generateResults(requestState);

    console.log("[generation] 결과 데이터 세팅", {
      resultsCount: resultPayload?.results?.length ?? 0,
      resultPayload,
    });

    const recommendedIndex = getRecommendedResultIndex(resultPayload);

    updateState({
      isGenerating: false,
      activePreviewMode: "after",
      selectedThumbnailIndex: recommendedIndex ?? 0,
      results: resultPayload.results,
      generationMeta: {
        ...resultPayload.generationMeta,
        billedCredits: isFree ? 0 : generationCost,
        regularCredits: generationCost,
        usedFreeGeneration: isFree,
        freeGenerationNumber: isFree ? nextFreeUsage : null,
        remainingCredits: nextCredits,
        freeRemaining: getRemainingFreeGenerations(nextFreeUsage),
        qualityLabel: requestState.useUpscale ? "고해상도" : "720p 해상도 (Standard Def)",
        originRoute: ROUTES.OPTIONS,
      },
    });

    console.log("[generation] 결과 화면 이동");
    navigate(ROUTES.RESULT);
  } catch (error) {
    console.error("[generation] 결과 처리 실패", error);
    updateState({
      isGenerating: false,
    });
  }
}

async function performStudioGeneration() {
  const state = getState();

  updateState({
    activeModal: null,
    isGenerating: true,
  });

  console.log("[generation] studio 생성 시작", {
    studioUploadCount: state.studioUploadCount,
  });

  try {
    const studioPayload = await generateStudioResults(state);
    const recommendedIndex = getRecommendedResultIndex(studioPayload);

    console.log("[generation] studio 결과 데이터 세팅", {
      resultsCount: studioPayload?.results?.length ?? 0,
      recommendedIndex,
      studioPayload,
    });

    updateState({
      isGenerating: false,
      activePreviewMode: "after",
      selectedThumbnailIndex: recommendedIndex ?? 0,
      results: studioPayload.results,
      generationMeta: {
        ...studioPayload.generationMeta,
        recommendedIndex,
      },
    });

    console.log("[generation] studio 결과 화면 이동");
    navigate(ROUTES.RESULT);
  } catch (error) {
    console.error("[generation] studio 결과 처리 실패", error);
    updateState({
      isGenerating: false,
    });
  }
}

function handleCreditPurchase(packageId) {
  const creditPack = CREDIT_PACKAGES.find((item) => item.id === packageId);

  if (!creditPack) {
    return;
  }

  const nextCredits = getState().credits + creditPack.credits;

  updateState({
    credits: nextCredits,
    activeModal: {
      type: "success",
      title: "크레딧 충전이 완료되었습니다",
      description: `${formatNumber(creditPack.credits)} 크레딧이 추가되어 현재 잔액은 ${formatNumber(nextCredits)}입니다.`,
    },
  });
}

function handlePrintOrder(productId) {
  const product = PRINT_PRODUCTS.find((item) => item.id === productId);

  if (!product) {
    return;
  }

  updateState({
    activeModal: {
      type: "success",
      title: `${product.name} 주문이 접수되었습니다`,
      description: `${product.summary} 기준의 mock 주문 완료 화면입니다. 실제 결제와 배송 연동은 아직 연결되지 않았습니다.`,
    },
  });
}

function downloadSelectedResult() {
  const state = getState();
  const selectedResult = state.results[state.selectedThumbnailIndex] ?? state.results[0];

  if (!selectedResult?.afterUrl) {
    return;
  }

  const link = document.createElement("a");
  link.href = selectedResult.afterUrl;
  link.download = `${selectedResult.id ?? "bloom-result"}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function submitCustomPreset() {
  const state = getState();
  const style = state.customPresetDraft.style.trim();

  if (!style) {
    window.alert("원하는 스타일을 입력해 주세요.");
    return false;
  }

  updateState({
    activeModal: null,
    selectedPresetId: "custom",
    conciergeSource: "custom",
    conciergeConcept: style,
    conciergeExtraRequest: state.customPresetDraft.extra,
  });

  navigate(ROUTES.CONCIERGE);
  return true;
}

function applyGalleryStyle(styleId) {
  const style = getGalleryStyle(styleId);

  updateState({
    sourceImageId: style.sourceImageId,
    selectedPresetId: style.presetId,
  });

  navigate(ROUTES.CREATE);
}

function connectAssistantToExpert() {
  const state = getState();
  const idea = state.assistantDraft.trim() || getLastUserQuestion(state.assistantMessages);

  updateState({
    conciergeSource: "assistant",
    conciergeConcept: idea || state.conciergeConcept,
  });

  navigate(ROUTES.CONCIERGE);
}

async function handleAction(action, target) {
  const state = getState();

  if (action === "back") {
    if (state.route === ROUTES.RESULT && state.generationMeta?.originRoute) {
      navigate(state.generationMeta.originRoute);
      return;
    }

    if (state.route === ROUTES.CONCIERGE) {
      if (state.conciergeSource === "assistant") {
        navigate(ROUTES.ASSISTANT);
        return;
      }

      if (state.conciergeSource === "custom") {
        navigate(ROUTES.OPTIONS);
        return;
      }
    }

    navigate(PREVIOUS_ROUTE[state.route] ?? ROUTES.HOME);
    return;
  }

  if (action === "close-modal") {
    closeModal();
    return;
  }

  if (action === "open-image-modal") {
    // concierge 페이지에서 data-image-url로 직접 전달받는 경우
    if (target?.dataset.imageUrl) {
      openImageModal(target.dataset.imageUrl, target.dataset.imageLabel || "이미지");
      return;
    }
    
    // result 페이지에서 data-thumbnail-index로 전달받는 경우
    const items = getImageModalItems(state);
    const itemIndex = Number.parseInt(target?.dataset.imageModalIndex ?? "", 10);
    const item = Number.isInteger(itemIndex) ? items[itemIndex] : null;

    if (item?.url) {
      openImageModal(item.url, item.label);
    }
    return;
  }

  if (action === "close-image-modal") {
    closeImageModal();
    return;
  }

  if (action === "image-modal-prev") {
    moveImageModal(-1);
    return;
  }

  if (action === "image-modal-next") {
    moveImageModal(1);
    return;
  }

  if (action === "open-credits") {
    openCreditsModal(
      target?.dataset.modalReason ?? "header",
      target?.dataset.modalReason === "shortage"
        ? { requiredCredits: getCreditBreakdown(state).total }
        : {},
    );
    return;
  }

  if (action === "open-custom-preset") {
    openCustomPresetModal();
    return;
  }

  if (action === "submit-custom-preset") {
    submitCustomPreset();
    return;
  }

  if (action === "toggle-upscale") {
    updateState({ useUpscale: !state.useUpscale });
    return;
  }

  if (action === "upload-concierge-photo") {
    const fileInput = document.getElementById("concierge-file-input");
    if (fileInput) {
      fileInput.click();
    }
    return;
  }

  if (action === "submit-concierge") {
    if (state.conciergeUploadCount < 1) {
      window.alert("대행용 스냅사진을 mock 업로드해 주세요.");
      return;
    }

    if (!state.conciergeConcept.trim()) {
      window.alert("원하는 컨셉을 입력해 주세요.");
      return;
    }

    updateState({
      activeModal: {
        type: "success",
        title: "대행 서비스 신청이 완료되었습니다",
        description: "매니저가 스냅 사진과 요청 사항을 검토한 뒤 직접 배경 제작 mock 프로세스를 진행합니다.",
      },
    });
    return;
  }

  if (action === "add-studio-photo") {
    updateState({
      studioUploadCount: Math.min(7, state.studioUploadCount + 1),
    });
    return;
  }

  if (action === "reset-studio-photos") {
    updateState({
      studioUploadCount: 0,
    });
    return;
  }

  if (action === "start-studio") {
    if (state.studioUploadCount < 7) {
      window.alert("방구석 스튜디오는 기준 사진 7장을 모두 업로드해야 시작할 수 있습니다.");
      return;
    }

    await performStudioGeneration();
    return;
  }

  if (action === "assistant-send") {
    const message = state.assistantDraft.trim();

    if (!message) {
      return;
    }

    updateState({
      assistantDraft: "",
      assistantMessages: [
        ...state.assistantMessages,
        {
          id: `user-${Date.now()}`,
          role: "user",
          text: message,
        },
        {
          id: `assistant-${Date.now() + 1}`,
          role: "assistant",
          text: buildAssistantReply(message),
        },
      ],
    });
    return;
  }

  if (action === "connect-expert") {
    connectAssistantToExpert();
    return;
  }

  if (action === "submit-suggestion") {
    if (!state.suggestionDraftTitle.trim() || !state.suggestionDraftBody.trim()) {
      window.alert("제안 제목과 설명을 모두 입력해 주세요.");
      return;
    }

    updateState({
      suggestions: [
        {
          id: `suggestion-${Date.now()}`,
          title: state.suggestionDraftTitle.trim(),
          description: state.suggestionDraftBody.trim(),
        },
        ...state.suggestions,
      ],
      suggestionDraftTitle: "",
      suggestionDraftBody: "",
      activeModal: {
        type: "success",
        title: "프리셋 제안이 저장되었습니다",
        description: "mock 게시판에 새로운 아이디어가 추가되었습니다.",
      },
    });
    return;
  }

  if (action === "start-generation") {
    if (state.selectedPresetId === "custom") {
      if (!state.customPresetDraft.style.trim()) {
        openCustomPresetModal();
        return;
      }

      submitCustomPreset();
      return;
    }

    if (state.selectedRatio === "custom" && !state.customRatio.trim()) {
      window.alert("직접입력 비율을 입력해 주세요. 예: 5:4");
      return;
    }

    if (state.isGenerating) {
      return;
    }

    const access = getGenerationAccess(state);

    if (access.mode === "free") {
      if (access.requiresAds) {
        await watchAdsThenContinue(FREE_POLICY.adsPerLockedFreeGeneration);
      }

      await performGeneration({ isFree: true });
      return;
    }

    if (!access.canAfford) {
      updateState({
        activeModal: {
          type: "paywall",
        },
      });
      return;
    }

    await performGeneration({ isFree: false });
    return;
  }

  if (action === "purchase-upscale") {
    if (!state.generationMeta || state.generationMeta.upscaleIncluded) {
      return;
    }

    if (state.credits < CREDIT_PRICING.upscale) {
      openCreditsModal("upscale");
      return;
    }

    const nextCredits = state.credits - CREDIT_PRICING.upscale;

    updateState({
      credits: nextCredits,
      generationMeta: {
        ...state.generationMeta,
        upscaleIncluded: true,
        totalCredits: (state.generationMeta.totalCredits ?? 0) + CREDIT_PRICING.upscale,
        billedCredits: (state.generationMeta.billedCredits ?? 0) + CREDIT_PRICING.upscale,
        remainingCredits: nextCredits,
        qualityLabel: "고해상도",
      },
      activeModal: {
        type: "success",
        title: "고해상도 변환이 완료되었습니다",
        description: `50 크레딧이 차감되어 현재 잔액은 ${formatNumber(nextCredits)}입니다. 이미지는 mock 상태로 고해상도 표시만 변경했습니다.`,
      },
    });
    return;
  }

  if (action === "download-result") {
    downloadSelectedResult();
  }
}

app.addEventListener("click", async (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }

  if (
    event.target.dataset.imageModalOverlay !== undefined ||
    event.target.dataset.imageModalShell !== undefined
  ) {
    closeImageModal();
    return;
  }

  const target = event.target.closest("[data-route], [data-action], [data-source-id], [data-preset-id], [data-ratio], [data-thumbnail-index], [data-preview-mode], [data-credit-package], [data-print-product], [data-gallery-style-id]");

  if (!target) {
    return;
  }

  if (target.dataset.route) {
    navigate(target.dataset.route);
    return;
  }

  if (target.dataset.sourceId) {
    const nextSourceId = target.dataset.sourceId;
    const nextPreset = resolvePresetForSource(getState().selectedPresetId, nextSourceId);

    updateState({
      sourceImageId: nextSourceId,
      selectedPresetId: nextPreset.id,
    });
    return;
  }

  if (target.dataset.presetId) {
    updateState({ selectedPresetId: target.dataset.presetId });

    if (target.dataset.presetId === "custom") {
      openCustomPresetModal();
    }
    return;
  }

  if (target.dataset.ratio) {
    const nextRatio = target.dataset.ratio;
    updateState({
      selectedRatio: nextRatio,
      customRatio: nextRatio === "custom" ? getState().customRatio : "",
    });
    return;
  }

  if (target.dataset.thumbnailIndex) {
    updateState({
      selectedThumbnailIndex: Number(target.dataset.thumbnailIndex),
      activePreviewMode: "after",
    });
    return;
  }

  if (target.dataset.previewMode) {
    updateState({ activePreviewMode: target.dataset.previewMode });
    return;
  }

  if (target.dataset.creditPackage) {
    handleCreditPurchase(target.dataset.creditPackage);
    return;
  }

  if (target.dataset.printProduct) {
    handlePrintOrder(target.dataset.printProduct);
    return;
  }

  if (target.dataset.galleryStyleId) {
    applyGalleryStyle(target.dataset.galleryStyleId);
    return;
  }

  if (target.dataset.action) {
    await handleAction(target.dataset.action, target);
  }
});

window.addEventListener("keydown", (event) => {
  const state = getState();

  if (!state.activeImageModal) {
    return;
  }

  if (event.key === "Escape") {
    closeImageModal();
    return;
  }

  if (event.key === "ArrowLeft") {
    moveImageModal(-1);
    return;
  }

  if (event.key === "ArrowRight") {
    moveImageModal(1);
  }
});

app.addEventListener("input", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLTextAreaElement)) {
    return;
  }

  if (target.dataset.customRatio !== undefined) {
    updateState({ customRatio: target.value });
    return;
  }

  if (target.dataset.customStyle !== undefined) {
    updateState({
      customPresetDraft: {
        ...getState().customPresetDraft,
        style: target.value,
      },
    });
    return;
  }

  if (target.dataset.customExtra !== undefined) {
    updateState({
      customPresetDraft: {
        ...getState().customPresetDraft,
        extra: target.value,
      },
    });
    return;
  }

  if (target.dataset.conciergeConcept !== undefined) {
    updateState({ conciergeConcept: target.value });
    return;
  }

  if (target.dataset.conciergeExtra !== undefined) {
    updateState({ conciergeExtraRequest: target.value });
    return;
  }

  if (target.dataset.assistantDraft !== undefined) {
    updateState({ assistantDraft: target.value });
    return;
  }

  if (target.dataset.suggestionTitle !== undefined) {
    updateState({ suggestionDraftTitle: target.value });
    return;
  }

  if (target.dataset.suggestionBody !== undefined) {
    updateState({ suggestionDraftBody: target.value });
  }
});

app.addEventListener("change", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLInputElement) || target.type !== "file") {
    return;
  }

  if (target.dataset.fileInput !== "concierge") {
    return;
  }

  const file = target.files?.[0];
  if (!file) {
    return;
  }

  const previousImage = getState().conciergeUploadedImage;
  const previewUrl = URL.createObjectURL(file);

  if (previousImage?.url?.startsWith("blob:")) {
    URL.revokeObjectURL(previousImage.url);
  }

  updateState({
    conciergeUploadCount: Math.max(1, getState().conciergeUploadCount),
    conciergeUploadedImage: {
      url: previewUrl,
      label: file.name || "업로드 사진",
    },
  });

  target.value = "";
});

subscribe((state) => {
  document.body.style.overflow = state.activeImageModal ? "hidden" : "";
  renderRoute(state.route, state);
});

initRouter(syncRoute);
renderRoute(getState().route, getState());
