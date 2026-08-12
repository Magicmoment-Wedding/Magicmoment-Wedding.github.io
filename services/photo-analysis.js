/**
 * photo-analysis.js
 * ------------------------------------------------------------------
 * 업로드된 원본 사진에서 규칙 기반(rule-based)으로 특징을 추출한다.
 *
 * 설계 원칙
 * - v1은 Canvas 픽셀 연산만 사용하는 순수 휴리스틱이다. 얼굴/포즈 인식 모델을
 *   쓰지 않기 때문에, "자신 있게 계산 가능한 값"과 "추정치라 사용자 확인이
 *   필요한 값"을 구분한다. 각 필드에는 confidence: "measured" | "heuristic"
 *   가 함께 붙는다.
 * - 나중에 Vision 모델/임베딩으로 고도화할 때는 analyzePhoto()의 내부 구현만
 *   교체하면 된다. 반환 스키마(PhotoFeatures)는 그대로 유지하도록 설계했다.
 * - 순수 함수 + 전역 네임스페이스(window.PhotoReco.analysis) 방식으로 작성해
 *   ES module 없이도 <script src="services/photo-analysis.js"> 한 줄로
 *   index.html(인라인 스크립트 방식)에 그대로 꽂을 수 있다.
 *
 * PhotoFeatures 스키마 (photo-matching.js와 sample-catalog.json의 필드명에 맞춤)
 * {
 *   composition: { orientation, aspectRatio, subjectScale, confidence },
 *   angle:       { shotType, cameraLevel, confidence: { shotType, cameraLevel } },
 *   lighting:    { direction, quality, colorTemp, brightness, confidence },
 *   pose:        { peopleCount, type, bodyDirection, headTilt, interaction, confidence },
 *   debug:       { ... 원시 측정값, UI/QA용 }
 * }
 */
(function (global) {
  "use strict";

  const ANALYSIS_CANVAS_MAX_SIDE = 220; // 성능을 위해 다운스케일링 후 분석

  // ---------------------------------------------------------------
  // 0. 유틸
  // ---------------------------------------------------------------

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function loadImageElement(source) {
    return new Promise((resolve, reject) => {
      if (source instanceof HTMLImageElement) {
        if (source.complete && source.naturalWidth > 0) {
          resolve(source);
        } else {
          source.onload = () => resolve(source);
          source.onerror = reject;
        }
        return;
      }
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      if (source instanceof Blob) {
        img.src = URL.createObjectURL(source);
      } else {
        img.src = source; // data URL 또는 일반 URL
      }
    });
  }

  function drawToAnalysisCanvas(img) {
    const naturalW = img.naturalWidth || img.width;
    const naturalH = img.naturalHeight || img.height;
    const scale = Math.min(1, ANALYSIS_CANVAS_MAX_SIDE / Math.max(naturalW, naturalH));
    const w = Math.max(1, Math.round(naturalW * scale));
    const h = Math.max(1, Math.round(naturalH * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);

    return {
      canvas,
      ctx,
      width: w,
      height: h,
      naturalWidth: naturalW,
      naturalHeight: naturalH,
      imageData: ctx.getImageData(0, 0, w, h),
    };
  }

  // ---------------------------------------------------------------
  // 1. 구도 / 비율 (측정값 - 신뢰도 높음)
  // ---------------------------------------------------------------

  function analyzeComposition(naturalWidth, naturalHeight) {
    const aspectRatio = naturalWidth / naturalHeight;
    let orientation = "square";
    if (aspectRatio > 1.05) orientation = "landscape";
    else if (aspectRatio < 0.95) orientation = "portrait";
    return { orientation, aspectRatio: Math.round(aspectRatio * 1000) / 1000 };
  }

  // ---------------------------------------------------------------
  // 2. 조명 방향 / 색온도 / 밝기 (측정값 - 신뢰도 높음)
  // ---------------------------------------------------------------

  function analyzeLighting(imageData, width, height) {
    const data = imageData.data;
    let sumR = 0, sumG = 0, sumB = 0, sumLum = 0;
    let leftLum = 0, rightLum = 0, leftCount = 0, rightCount = 0;
    let centerLum = 0, edgeLum = 0, centerCount = 0, edgeCount = 0;
    const midX = width / 2;

    // 중심부 사각형(대략 인물이 위치할 가능성이 높은 영역) vs 외곽부 비교로
    // 역광 여부를 추정한다. 정교한 피사체 검출이 아니라 "휘도 분포" 근사치다.
    const centerXMin = width * 0.3, centerXMax = width * 0.7;
    const centerYMin = height * 0.15, centerYMax = height * 0.85;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx], g = data[idx + 1], b = data[idx + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        sumR += r; sumG += g; sumB += b; sumLum += lum;

        if (x < midX) { leftLum += lum; leftCount++; }
        else { rightLum += lum; rightCount++; }

        const inCenter = x >= centerXMin && x <= centerXMax && y >= centerYMin && y <= centerYMax;
        if (inCenter) { centerLum += lum; centerCount++; }
        else { edgeLum += lum; edgeCount++; }
      }
    }

    const totalPx = width * height;
    const avgR = sumR / totalPx, avgB = sumB / totalPx;
    const brightness = clamp(sumLum / totalPx / 255, 0, 1);

    const avgLeft = leftLum / Math.max(1, leftCount);
    const avgRight = rightLum / Math.max(1, rightCount);
    const avgCenter = centerLum / Math.max(1, centerCount);
    const avgEdge = edgeLum / Math.max(1, edgeCount);

    let direction = "flat";
    const lrDiff = avgLeft - avgRight; // 양수면 왼쪽이 더 밝음
    const centerEdgeDiff = avgCenter - avgEdge; // 음수면 중심(피사체 추정 영역)이 주변보다 어두움 = 역광 가능성

    if (centerEdgeDiff < -18) {
      direction = "backlight";
    } else if (Math.abs(lrDiff) > 14) {
      direction = lrDiff > 0 ? "left" : "right";
    } else if (Math.abs(centerEdgeDiff) < 6 && Math.abs(lrDiff) < 6) {
      direction = "flat";
    } else {
      direction = "front";
    }

    let colorTemp = "neutral";
    const rbDiff = avgR - avgB;
    if (rbDiff > 12) colorTemp = "warm";
    else if (rbDiff < -12) colorTemp = "cool";

    let quality = "soft";
    if (direction === "backlight") quality = brightness > 0.55 ? "golden_hour" : "soft";
    else if (brightness < 0.35) quality = "overcast";
    else if (Math.abs(lrDiff) > 30) quality = "hard";
    else quality = "soft";

    return {
      direction,
      quality,
      colorTemp,
      brightness: Math.round(brightness * 100) / 100,
      confidence: "heuristic", // 픽셀 통계 기반 추정치. 실제 조명방향과 다를 수 있음.
      debug: { avgLeft, avgRight, avgCenter, avgEdge, avgR, avgB },
    };
  }

  // ---------------------------------------------------------------
  // 3. 피사체(피부색) 검출 → 인물 수 추정 / 샷 타입 추정 (측정+휴리스틱 혼합)
  // ---------------------------------------------------------------

  function isSkinTone(r, g, b) {
    // YCbCr 기반 피부색 근사 범위 (다양한 톤 커버를 위해 다소 넓게 설정)
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
    return y > 40 && y < 250 && cb > 77 && cb < 135 && cr > 133 && cr < 180;
  }

  function buildSkinMask(imageData, width, height) {
    const data = imageData.data;
    const mask = new Uint8Array(width * height);
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      if (isSkinTone(data[i], data[i + 1], data[i + 2])) mask[p] = 1;
    }
    return mask;
  }

  // 간단한 4-neighbor 연결요소 라벨링 (BFS). 분석 캔버스가 작아 성능 문제 없음.
  function findSkinComponents(mask, width, height) {
    const visited = new Uint8Array(width * height);
    const components = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (!mask[idx] || visited[idx]) continue;

        let minX = x, maxX = x, minY = y, maxY = y, area = 0;
        const stack = [idx];
        visited[idx] = 1;

        while (stack.length) {
          const cur = stack.pop();
          const cy = Math.floor(cur / width);
          const cx = cur % width;
          area++;
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;

          const neighbors = [cur - 1, cur + 1, cur - width, cur + width];
          for (const n of neighbors) {
            if (n < 0 || n >= mask.length) continue;
            // 좌우 경계 넘어가는 것 방지
            if ((n === cur - 1 || n === cur + 1) && Math.floor(n / width) !== cy) continue;
            if (!visited[n] && mask[n]) {
              visited[n] = 1;
              stack.push(n);
            }
          }
        }

        components.push({ minX, maxX, minY, maxY, area });
      }
    }
    return components;
  }

  function analyzeSubject(imageData, width, height) {
    const mask = buildSkinMask(imageData, width, height);
    const totalPx = width * height;
    const minAreaPx = Math.max(6, Math.round(totalPx * 0.003)); // 노이즈 제거 임계값

    const rawComponents = findSkinComponents(mask, width, height);
    const components = rawComponents
      .filter((c) => c.area >= minAreaPx)
      .sort((a, b) => b.area - a.area);

    if (components.length === 0) {
      return {
        peopleCount: null,
        shotType: null,
        subjectScale: null,
        bbox: null,
        confidence: "heuristic",
        debug: { componentCount: 0 },
      };
    }

    // 상위 몇 개 블록(얼굴/목/어깨/손 등)을 병합해 전체 피사체 bbox를 만든다.
    const top = components.slice(0, 6);
    const bbox = top.reduce(
      (acc, c) => ({
        minX: Math.min(acc.minX, c.minX),
        maxX: Math.max(acc.maxX, c.maxX),
        minY: Math.min(acc.minY, c.minY),
        maxY: Math.max(acc.maxY, c.maxY),
      }),
      { minX: width, maxX: 0, minY: height, maxY: 0 }
    );

    const bboxHeightRatio = (bbox.maxY - bbox.minY) / height;
    const bboxTopRatio = bbox.minY / height;
    const bboxAreaRatio = ((bbox.maxX - bbox.minX) * (bbox.maxY - bbox.minY)) / totalPx;

    // 샷 타입 추정: 피부 영역이 프레임에서 수직으로 차지하는 비율 기준
    let shotType;
    if (bboxHeightRatio > 0.62) shotType = "full_body";
    else if (bboxHeightRatio > 0.38) shotType = "three_quarter_body";
    else if (bboxHeightRatio > 0.18) shotType = "half_body";
    else shotType = "closeup";

    // closeup은 반대로 "얼굴이 화면을 꽉 채우는 경우"도 있어 상단 집중 + 면적비로 보정
    if (shotType === "half_body" && bboxTopRatio < 0.12 && bboxAreaRatio > 0.18) {
      shotType = "closeup";
    }

    let subjectScale = "medium";
    if (bboxAreaRatio > 0.16) subjectScale = "large";
    else if (bboxAreaRatio < 0.05) subjectScale = "small";

    // 인물 수 추정: 유의미한 크기의 피부 블록이 서로 수평으로 떨어져 있으면 2인 이상으로 추정.
    // 얼굴 하나에서도 눈/입 주변 등으로 블록이 나뉠 수 있어 상위 2개 블록의 x 중심 거리로만 판단.
    let peopleCount = 1;
    if (top.length >= 2) {
      const [a, b] = top;
      const centerAx = (a.minX + a.maxX) / 2;
      const centerBx = (b.minX + b.maxX) / 2;
      const bothSubstantial = b.area >= a.area * 0.25;
      const farApart = Math.abs(centerAx - centerBx) > width * 0.18;
      if (bothSubstantial && farApart) peopleCount = 2;
    }
    peopleCount = clamp(peopleCount, 1, 2); // v1: 3인 이상 추정은 지원하지 않음(정확도 낮음)

    return {
      peopleCount,
      shotType,
      subjectScale,
      bbox: {
        xRatio: bbox.minX / width,
        yRatio: bbox.minY / height,
        widthRatio: (bbox.maxX - bbox.minX) / width,
        heightRatio: bboxHeightRatio,
      },
      confidence: "heuristic",
      debug: { componentCount: components.length, bboxAreaRatio },
    };
  }

  // ---------------------------------------------------------------
  // 4. 카메라 앵글 추정 (약한 휴리스틱 - 낮은 신뢰도, 기본값 제공)
  // ---------------------------------------------------------------

  function analyzeCameraLevel(subjectInfo) {
    // v1 한계: 진짜 카메라 앵글(하이/로우앵글)은 원근 왜곡·수직선 분석이 필요해
    // 순수 픽셀 통계로는 신뢰도 있게 판단하기 어렵다. 피사체 bbox 위치로
    // "약한 힌트"만 제공하고 기본값은 eye_level로 둔다. UI에서 사용자가 바로
    // 보정할 수 있게 confidence를 "low"로 명시한다.
    if (!subjectInfo || !subjectInfo.bbox) {
      return { cameraLevel: "eye_level", confidence: "default" };
    }
    const { yRatio, heightRatio } = subjectInfo.bbox;
    const bottomRatio = yRatio + heightRatio;

    if (bottomRatio < 0.55 && yRatio > 0.08) {
      return { cameraLevel: "high_angle", confidence: "low" };
    }
    if (yRatio < 0.05 && bottomRatio > 0.92) {
      return { cameraLevel: "low_angle", confidence: "low" };
    }
    return { cameraLevel: "eye_level", confidence: "low" };
  }

  // ---------------------------------------------------------------
  // 5. 포즈(유형/방향/고개 각도/소품) - v1은 기본값 + 낮은 신뢰도 힌트만 제공
  // ---------------------------------------------------------------

  function analyzePosePlaceholder(subjectInfo) {
    // 실제 서있는지/앉아있는지, 정면/측면, 고개 각도는 관절 추정(pose estimation)
    // 없이는 신뢰도 있게 계산할 수 없다. v1에서는 합리적인 기본값을 주고,
    // UI 쪽에서 사용자가 칩을 눌러 즉시 보정하도록 한다(analyzePhoto 문서 참고).
    const shotType = subjectInfo && subjectInfo.shotType;
    // full_body/three_quarter_body 로 넓게 서 있는 케이스가 가장 흔하므로 기본값으로 삼음.
    const defaultType = shotType === "closeup" || shotType === "half_body" ? "standing" : "standing";

    return {
      peopleCount: (subjectInfo && subjectInfo.peopleCount) || 1,
      type: defaultType,
      bodyDirection: "front",
      headTilt: "level",
      interaction: "none",
      confidence: "default", // 사용자가 UI에서 보정하기 전까지의 임시 기본값
    };
  }

  // ---------------------------------------------------------------
  // 6. 종합 엔트리 포인트
  // ---------------------------------------------------------------

  /**
   * @param {HTMLImageElement|Blob|string} source - 이미지 엘리먼트, 파일 Blob, 또는 (data)URL
   * @returns {Promise<Object>} PhotoFeatures
   */
  async function analyzePhoto(source) {
    const img = await loadImageElement(source);
    const { imageData, width, height, naturalWidth, naturalHeight } = drawToAnalysisCanvas(img);

    const composition = analyzeComposition(naturalWidth, naturalHeight);
    const lighting = analyzeLighting(imageData, width, height);
    const subjectInfo = analyzeSubject(imageData, width, height);
    const cameraLevelInfo = analyzeCameraLevel(subjectInfo);
    const posePlaceholder = analyzePosePlaceholder(subjectInfo);

    return {
      composition: {
        orientation: composition.orientation,
        aspectRatio: composition.aspectRatio,
        subjectScale: subjectInfo.subjectScale || "medium",
        confidence: subjectInfo.subjectScale ? "heuristic" : "default",
      },
      angle: {
        shotType: subjectInfo.shotType || "three_quarter_body",
        cameraLevel: cameraLevelInfo.cameraLevel,
        confidence: {
          shotType: subjectInfo.shotType ? "heuristic" : "default",
          cameraLevel: cameraLevelInfo.confidence,
        },
      },
      lighting: {
        direction: lighting.direction,
        quality: lighting.quality,
        colorTemp: lighting.colorTemp,
        brightness: lighting.brightness,
        confidence: lighting.confidence,
      },
      pose: posePlaceholder,
      debug: {
        canvasSize: { width, height },
        naturalSize: { width: naturalWidth, height: naturalHeight },
        subject: subjectInfo.debug,
        lighting: lighting.debug,
      },
    };
  }

  // 사용자가 UI 칩으로 보정한 값을 기존 PhotoFeatures 객체에 병합하는 헬퍼.
  // (photo-recommendation-panel.js에서 사용)
  function applyManualOverrides(features, overrides) {
    const next = JSON.parse(JSON.stringify(features));
    if (overrides.pose) {
      Object.assign(next.pose, overrides.pose, { confidence: "manual" });
    }
    if (overrides.angle) {
      Object.assign(next.angle, overrides.angle);
      next.angle.confidence = Object.assign({}, next.angle.confidence, {
        cameraLevel: overrides.angle.cameraLevel ? "manual" : next.angle.confidence.cameraLevel,
        shotType: overrides.angle.shotType ? "manual" : next.angle.confidence.shotType,
      });
    }
    if (overrides.lighting) {
      Object.assign(next.lighting, overrides.lighting, { confidence: "manual" });
    }
    return next;
  }

  const PhotoAnalysis = {
    analyzePhoto,
    applyManualOverrides,
    // 테스트/디버그 용도로 서브 함수도 노출
    _internal: { analyzeComposition, analyzeLighting, analyzeSubject, analyzeCameraLevel },
  };

  global.PhotoReco = global.PhotoReco || {};
  global.PhotoReco.analysis = PhotoAnalysis;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = PhotoAnalysis;
  }
})(typeof window !== "undefined" ? window : globalThis);
