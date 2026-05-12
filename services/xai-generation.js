async function loadImageAsBlob(imageUrl) {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(`이미지 로드 실패: ${imageUrl}`);
  }

  return response.blob();
}

export async function generateImages(prompt, options = {}) {
  const {
    sourceImageUrl,
    count = 4,
    presetKey = "default",
  } = options;

  const sourceImageBlob = await loadImageAsBlob(sourceImageUrl);
  const formData = new FormData();
  formData.append("image", sourceImageBlob, "source.png");
  formData.append("prompt", prompt);
  formData.append("count", String(count));
  formData.append("presetKey", presetKey);

  const response = await fetch("http://localhost:3000/api/generate", {
    method: "POST",
    body: formData,
  });
  const payload = await response.json();

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || "xAI generation failed");
  }

  const imageUrls = Array.isArray(payload.imageUrls) ? payload.imageUrls : [];
  const scores = Array.isArray(payload.scores) ? payload.scores : [];
  const variantLabels = Array.isArray(payload.variantLabels) ? payload.variantLabels : [];

  return imageUrls
    .filter(Boolean)
    .map((url, index) => ({
      url,
      score: typeof scores[index] === "number" ? scores[index] : null,
      variantLabel: typeof variantLabels[index] === "string" ? variantLabels[index] : `결과 ${index + 1}`,
    }));
}

export async function generateParisEiffelImage({ sourceImageUrl, prompt, presetKey = "paris_eiffel", analyzedMeta, ratioOption, customText, count = 4 }) {
  console.log("[generation] xai request start", {
    presetKey,
    ratioOption,
    customText,
    analysisSource: analyzedMeta.source,
  });

  const generatedImages = await generateImages(prompt, {
    sourceImageUrl,
    count,
    presetKey,
  });

  console.log("[generation] xai request complete", {
    presetKey,
    imageCount: generatedImages.length,
  });

  return generatedImages;
}
