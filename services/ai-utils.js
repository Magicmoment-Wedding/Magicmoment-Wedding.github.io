export function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function fetchJsonWithTimeout(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    const text = await response.text();
    const json = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error(json?.error?.message || `HTTP ${response.status}`);
    }

    return json;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function loadImageAsDataUrl(imageUrl) {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(`이미지 로드 실패: ${imageUrl}`);
  }

  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`이미지 변환 실패: ${imageUrl}`));
    reader.readAsDataURL(blob);
  });
}

export async function resizeImageForVision(imageUrl, maxSize = 512) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      canvas.width = width;
      canvas.height = height;
      context.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };

    image.onerror = () => reject(new Error(`평가용 이미지 리사이즈 실패: ${imageUrl}`));
    image.src = imageUrl;
  });
}

function drawEvaluationImage(image, sourceBox, maxSize = 512) {
  const scale = Math.min(1, maxSize / Math.max(sourceBox.width, sourceBox.height));
  const width = Math.max(1, Math.round(sourceBox.width * scale));
  const height = Math.max(1, Math.round(sourceBox.height * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = width;
  canvas.height = height;
  context.drawImage(
    image,
    sourceBox.x,
    sourceBox.y,
    sourceBox.width,
    sourceBox.height,
    0,
    0,
    width,
    height,
  );

  return canvas.toDataURL("image/jpeg", 0.72);
}

function clampCropBox(box, imageWidth, imageHeight) {
  const x = Math.max(0, Math.min(box.x, imageWidth - 1));
  const y = Math.max(0, Math.min(box.y, imageHeight - 1));
  const width = Math.max(1, Math.min(box.width, imageWidth - x));
  const height = Math.max(1, Math.min(box.height, imageHeight - y));

  return {
    x,
    y,
    width,
    height,
  };
}

function buildFaceCropBox(faceBox, imageWidth, imageHeight) {
  const faceCenterX = faceBox.x + faceBox.width / 2;
  const faceCenterY = faceBox.y + faceBox.height / 2;
  const cropSize = Math.max(faceBox.width, faceBox.height) * 2.15;

  return clampCropBox({
    x: faceCenterX - cropSize / 2,
    y: faceCenterY - cropSize * 0.52,
    width: cropSize,
    height: cropSize,
  }, imageWidth, imageHeight);
}

export async function cropFaceForVision(imageUrl, maxSize = 512) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = async () => {
      try {
        const imageWidth = image.naturalWidth;
        const imageHeight = image.naturalHeight;

        if ("FaceDetector" in window) {
          const detector = new window.FaceDetector({
            fastMode: true,
            maxDetectedFaces: 1,
          });
          const faces = await detector.detect(image);
          const faceBox = faces?.[0]?.boundingBox;

          if (faceBox) {
            const cropBox = buildFaceCropBox(faceBox, imageWidth, imageHeight);
            resolve({
              dataUrl: drawEvaluationImage(image, cropBox, maxSize),
              didCrop: true,
            });
            return;
          }
        }

        resolve({
          dataUrl: drawEvaluationImage(image, {
            x: 0,
            y: 0,
            width: imageWidth,
            height: imageHeight,
          }, maxSize),
          didCrop: false,
        });
      } catch (error) {
        resolve({
          dataUrl: drawEvaluationImage(image, {
            x: 0,
            y: 0,
            width: image.naturalWidth,
            height: image.naturalHeight,
          }, maxSize),
          didCrop: false,
        });
      }
    };

    image.onerror = () => reject(new Error(`얼굴 평가용 이미지 로드 실패: ${imageUrl}`));
    image.src = imageUrl;
  });
}

export function extractResponseText(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const outputItems = Array.isArray(payload?.output) ? payload.output : [];
  const textParts = outputItems.flatMap((item) => {
    if (!Array.isArray(item?.content)) {
      return [];
    }

    return item.content
      .filter((contentItem) => contentItem?.type === "output_text" && typeof contentItem.text === "string")
      .map((contentItem) => contentItem.text);
  });

  return textParts.join("\n").trim();
}

export function safeJsonParse(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[0]);
    } catch (nestedError) {
      return null;
    }
  }
}
