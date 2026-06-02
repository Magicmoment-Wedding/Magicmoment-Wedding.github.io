export function renderBeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = "BEFORE",
  afterLabel = "AFTER",
  beforeAlt = "Before image",
  afterAlt = "After image",
  initialSplit = 50,
} = {}) {
  const split = Math.min(92, Math.max(8, Number(initialSplit) || 50));

  return `
    <div class="before-after-compare" data-before-after-slider style="--split: ${split}%;">
      <img class="before-after-after" src="${afterSrc}" alt="${afterAlt}" draggable="false" />
      <img class="before-after-before" src="${beforeSrc}" alt="${beforeAlt}" draggable="false" />
      <div class="before-after-shade"></div>
      <div class="before-after-divider" aria-hidden="true"></div>
      <div class="before-after-handle" aria-hidden="true">
        <span class="material-symbols-outlined text-[22px]">swap_horiz</span>
      </div>
      <span class="before-after-label before">${beforeLabel}</span>
      <span class="before-after-label after">${afterLabel}</span>
      <input class="before-after-input" type="range" min="8" max="92" value="${split}" aria-label="Before After 비교 슬라이더" />
    </div>
  `;
}

export function setupBeforeAfterSliders(root = document) {
  root.querySelectorAll("[data-before-after-slider]").forEach((slider) => {
    if (slider.dataset.beforeAfterReady === "true") return;

    const input = slider.querySelector(".before-after-input");
    if (!(input instanceof HTMLInputElement)) return;

    const updateSplit = (value) => {
      const split = Math.min(Math.max(Number(value) || 50, 8), 92);
      slider.style.setProperty("--split", `${split}%`);
      input.value = String(split);
    };

    input.addEventListener("input", () => updateSplit(input.value));
    slider.addEventListener("pointerdown", (event) => {
      const updateFromPointer = (pointerEvent) => {
        const rect = slider.getBoundingClientRect();
        if (!rect.width) return;
        const split = ((pointerEvent.clientX - rect.left) / rect.width) * 100;
        updateSplit(split);
      };

      updateFromPointer(event);
      slider.setPointerCapture?.(event.pointerId);

      const onPointerMove = (pointerEvent) => updateFromPointer(pointerEvent);
      const onPointerUp = () => {
        slider.removeEventListener("pointermove", onPointerMove);
        slider.removeEventListener("pointerup", onPointerUp);
        slider.removeEventListener("pointercancel", onPointerUp);
      };

      slider.addEventListener("pointermove", onPointerMove);
      slider.addEventListener("pointerup", onPointerUp);
      slider.addEventListener("pointercancel", onPointerUp);
    });

    updateSplit(input.value);
    slider.dataset.beforeAfterReady = "true";
  });
}
