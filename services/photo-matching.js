/**
 * photo-matching.js
 * ------------------------------------------------------------------
 * 업로드 사진의 분석 결과(PhotoFeatures)와 샘플 카탈로그(sample-catalog.json)를
 * 비교해 "배경 교체 시 자연스러울 확률이 높은" 샘플을 랭킹으로 반환한다.
 *
 * 점수 100점 배점
 *   - pose(포즈)      40점  bodyDirection 18 + type 14 + headTilt 8
 *   - angle(앵글)     30점  shotType 20 + cameraLevel 10
 *   - lighting(조명)  20점  direction 12 + (quality+colorTemp) 8
 *   - composition     10점  orientation 6 + peopleCount 4
 *
 * 값이 "unknown/미상"이거나 confidence가 낮은 경우에는 0점으로 깎지 않고
 * 중립값(해당 항목 만점의 60%)을 준다. 규칙기반 v1의 추정치 불확실성이
 * 추천 결과를 과도하게 왜곡하지 않도록 하기 위함이다.
 *
 * 확장 포인트
 *   - 샘플에 embedding(벡터)이 채워지면 similarityForSample()이 자동으로
 *     코사인 유사도 경로를 사용하도록 분기를 열어뒀다(현재는 항상 null이라
 *     카테고리 유사도 경로만 동작).
 */
(function (global) {
  "use strict";

  const NEUTRAL_RATIO = 0.6; // 값 미상일 때 부여하는 중립 점수 비율

  // ---------------------------------------------------------------
  // 1. 속성별 유사도 테이블
  // ---------------------------------------------------------------

  // 순서형 스케일: 인덱스 거리 기반 유사도 (0~1)
  const ORDINAL_SCALES = {
    shotType: ["closeup", "half_body", "three_quarter_body", "full_body"],
    cameraLevel: ["low_angle", "eye_level", "high_angle"],
  };

  function ordinalSimilarity(scaleName, a, b) {
    const scale = ORDINAL_SCALES[scaleName];
    const ia = scale.indexOf(a);
    const ib = scale.indexOf(b);
    if (ia === -1 || ib === -1) return NEUTRAL_RATIO;
    const maxDist = scale.length - 1;
    return 1 - Math.abs(ia - ib) / maxDist;
  }

  // 인접 관계 테이블: 정확히 같지 않아도 "가까운" 값이면 부분 점수
  const ADJACENCY = {
    bodyDirection: {
      front: { front: 1, three_quarter: 0.6, side: 0.25, back: 0.05 },
      three_quarter: { front: 0.6, three_quarter: 1, side: 0.55, back: 0.2 },
      side: { front: 0.25, three_quarter: 0.55, side: 1, back: 0.4 },
      back: { front: 0.05, three_quarter: 0.2, side: 0.4, back: 1 },
    },
    poseType: {
      standing: { standing: 1, walking: 0.6, leaning: 0.5, sitting: 0.2, lying: 0.05 },
      walking: { standing: 0.6, walking: 1, leaning: 0.4, sitting: 0.15, lying: 0.05 },
      leaning: { standing: 0.5, walking: 0.4, leaning: 1, sitting: 0.5, lying: 0.3 },
      sitting: { standing: 0.2, walking: 0.15, leaning: 0.5, sitting: 1, lying: 0.55 },
      lying: { standing: 0.05, walking: 0.05, leaning: 0.3, sitting: 0.55, lying: 1 },
    },
    headTilt: {
      level: { level: 1, tilt_left: 0.55, tilt_right: 0.55, look_down: 0.45, look_up: 0.35 },
      tilt_left: { level: 0.55, tilt_left: 1, tilt_right: 0.4, look_down: 0.5, look_up: 0.3 },
      tilt_right: { level: 0.55, tilt_left: 0.4, tilt_right: 1, look_down: 0.5, look_up: 0.3 },
      look_down: { level: 0.45, tilt_left: 0.5, tilt_right: 0.5, look_down: 1, look_up: 0.2 },
      look_up: { level: 0.35, tilt_left: 0.3, tilt_right: 0.3, look_down: 0.2, look_up: 1 },
    },
    interaction: {
      none: { none: 1, hand_hold: 0.5, embrace: 0.4, bouquet: 0.4, prop: 0.2 },
      hand_hold: { none: 0.5, hand_hold: 1, embrace: 0.6, bouquet: 0.55, prop: 0.35 },
      embrace: { none: 0.4, hand_hold: 0.6, embrace: 1, bouquet: 0.45, prop: 0.3 },
      bouquet: { none: 0.4, hand_hold: 0.55, embrace: 0.45, bouquet: 1, prop: 0.4 },
      prop: { none: 0.2, hand_hold: 0.35, embrace: 0.3, bouquet: 0.4, prop: 1 },
    },
    lightingDirection: {
      front: { front: 1, left: 0.6, right: 0.6, backlight: 0.25, flat: 0.7 },
      left: { front: 0.6, left: 1, right: 0.35, backlight: 0.3, flat: 0.5 },
      right: { front: 0.6, left: 0.35, right: 1, backlight: 0.3, flat: 0.5 },
      backlight: { front: 0.25, left: 0.3, right: 0.3, backlight: 1, flat: 0.2 },
      flat: { front: 0.7, left: 0.5, right: 0.5, backlight: 0.2, flat: 1 },
    },
  };

  function adjacencySimilarity(tableName, a, b) {
    const table = ADJACENCY[tableName];
    if (!table || !a || !b || !table[a] || !(b in table[a])) return NEUTRAL_RATIO;
    return table[a][b];
  }

  function categoricalMatch(a, b) {
    if (!a || !b) return NEUTRAL_RATIO;
    return a === b ? 1 : 0;
  }

  function colorTempQualitySimilarity(sourceLighting, sampleLighting) {
    const colorTempScore = categoricalMatch(sourceLighting.colorTemp, sampleLighting.colorTemp);
    const qualityAdjacency = {
      soft: { soft: 1, hard: 0.3, golden_hour: 0.6, overcast: 0.6, studio_even: 0.7 },
      hard: { soft: 0.3, hard: 1, golden_hour: 0.4, overcast: 0.2, studio_even: 0.4 },
      golden_hour: { soft: 0.6, hard: 0.4, golden_hour: 1, overcast: 0.3, studio_even: 0.2 },
      overcast: { soft: 0.6, hard: 0.2, golden_hour: 0.3, overcast: 1, studio_even: 0.4 },
      studio_even: { soft: 0.7, hard: 0.4, golden_hour: 0.2, overcast: 0.4, studio_even: 1 },
    };
    const qa = qualityAdjacency[sourceLighting.quality];
    const qualityScore = qa && sampleLighting.quality in qa ? qa[sampleLighting.quality] : NEUTRAL_RATIO;
    return colorTempScore * 0.5 + qualityScore * 0.5;
  }

  // ---------------------------------------------------------------
  // 2. 서브 스코어 계산
  // ---------------------------------------------------------------

  function scorePose(sourcePose, samplePose) {
    const bodyDirSim = adjacencySimilarity("bodyDirection", sourcePose.bodyDirection, samplePose.bodyDirection);
    const typeSim = adjacencySimilarity("poseType", sourcePose.type, samplePose.type);
    const headTiltSim = adjacencySimilarity("headTilt", sourcePose.headTilt, samplePose.headTilt);

    const bodyDirPts = bodyDirSim * 18;
    const typePts = typeSim * 14;
    const headTiltPts = headTiltSim * 8;

    return {
      points: bodyDirPts + typePts + headTiltPts,
      max: 40,
      detail: { bodyDirSim, typeSim, headTiltSim },
    };
  }

  function scoreAngle(sourceAngle, sampleAngle) {
    const shotTypeSim = ordinalSimilarity("shotType", sourceAngle.shotType, sampleAngle.shotType);
    const cameraLevelSim = ordinalSimilarity("cameraLevel", sourceAngle.cameraLevel, sampleAngle.cameraLevel);

    const shotTypePts = shotTypeSim * 20;
    const cameraLevelPts = cameraLevelSim * 10;

    return {
      points: shotTypePts + cameraLevelPts,
      max: 30,
      detail: { shotTypeSim, cameraLevelSim },
    };
  }

  function scoreLighting(sourceLighting, sampleLighting) {
    const directionSim = adjacencySimilarity("lightingDirection", sourceLighting.direction, sampleLighting.direction);
    const qualityTempSim = colorTempQualitySimilarity(sourceLighting, sampleLighting);

    const directionPts = directionSim * 12;
    const qualityTempPts = qualityTempSim * 8;

    return {
      points: directionPts + qualityTempPts,
      max: 20,
      detail: { directionSim, qualityTempSim },
    };
  }

  function scoreComposition(sourceComposition, sourcePose, sampleComposition, samplePose) {
    const orientationSim = categoricalMatch(sourceComposition.orientation, sampleComposition.orientation);
    const peopleCountSim =
      sourcePose.peopleCount && samplePose.peopleCount
        ? sourcePose.peopleCount === samplePose.peopleCount
          ? 1
          : 0.2
        : NEUTRAL_RATIO;

    const orientationPts = orientationSim * 6;
    const peopleCountPts = peopleCountSim * 4;

    return {
      points: orientationPts + peopleCountPts,
      max: 10,
      detail: { orientationSim, peopleCountSim },
    };
  }

  // 임베딩이 준비된 샘플을 위한 확장 지점 (현재 카탈로그는 전부 embedding: null)
  function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return null;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return null;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // ---------------------------------------------------------------
  // 3. 종합 스코어 + 추천 이유 텍스트
  // ---------------------------------------------------------------

  function computeMatchScore(features, sample, sourceEmbedding) {
    // 임베딩이 둘 다 준비되어 있으면 그 유사도를 우선 사용(향후 확장 경로).
    if (sourceEmbedding && sample.embedding) {
      const sim = cosineSimilarity(sourceEmbedding, sample.embedding);
      if (sim !== null) {
        const total = Math.round(clampScore((sim + 1) / 2) * 100);
        return { total, breakdown: null, usedEmbedding: true };
      }
    }

    const pose = scorePose(features.pose, sample.pose);
    const angle = scoreAngle(features.angle, sample.angle);
    const lighting = scoreLighting(features.lighting, sample.lighting);
    const composition = scoreComposition(features.composition, features.pose, sample.composition, sample.pose);

    const total = pose.points + angle.points + lighting.points + composition.points;

    return {
      total: Math.round(total),
      breakdown: { pose, angle, lighting, composition },
      usedEmbedding: false,
    };
  }

  function clampScore(v) {
    return Math.max(0, Math.min(1, v));
  }

  function buildReasons(matchResult, sample) {
    if (matchResult.usedEmbedding) {
      return ["이미지 특징 벡터 기준으로 가장 유사한 샘플이에요."];
    }
    const { pose, angle, lighting, composition } = matchResult.breakdown;
    const reasons = [];

    if (pose.detail.bodyDirSim >= 0.85 && pose.detail.typeSim >= 0.85) {
      reasons.push("인물의 자세와 방향이 원본과 매우 비슷해요");
    } else if (pose.detail.typeSim >= 0.85) {
      reasons.push("서 있는지/앉아 있는지 등 기본 자세가 잘 맞아요");
    }

    if (angle.detail.shotTypeSim >= 0.9) {
      reasons.push("전신·반신 등 인물 비율이 원본과 거의 같아요");
    } else if (angle.detail.shotTypeSim >= 0.6) {
      reasons.push("인물 비율이 비슷해 자연스러운 크롭이 가능해요");
    }

    if (angle.detail.cameraLevelSim >= 0.9) {
      reasons.push("카메라 앵글이 원본과 일치해요");
    }

    if (lighting.detail.directionSim >= 0.85) {
      reasons.push("조명 방향이 비슷해서 합성 시 이질감이 적어요");
    }

    if (composition.detail.orientationSim === 1) {
      reasons.push("가로/세로 비율이 같아 잘림 없이 배치돼요");
    }

    if (reasons.length === 0) {
      reasons.push("전체적인 구도가 원본과 가장 근접한 샘플이에요");
    }
    return reasons.slice(0, 3);
  }

  // ---------------------------------------------------------------
  // 4. 랭킹 (최소 3개 ~ 최대 6개)
  // ---------------------------------------------------------------

  /**
   * @param {Object} features - photo-analysis.js의 analyzePhoto() 결과 (혹은 manual override 반영본)
   * @param {Array} catalog - sample-catalog.json의 samples 배열
   * @param {Object} [options]
   * @param {string} [options.categoryGroup] - "국내야외" | "해외야외" | "프리미엄스튜디오" 로 1차 필터링(선택)
   * @param {number} [options.min=3]
   * @param {number} [options.max=6]
   * @param {Array}  [options.sourceEmbedding] - 향후 확장용
   * @returns {Array<{ sample, score, reasons, breakdown }>}
   */
  function recommendSamples(features, catalog, options) {
    const opts = options || {};
    const min = opts.min || 3;
    const max = opts.max || 6;
    const pool = opts.categoryGroup
      ? catalog.filter((s) => s.categoryGroup === opts.categoryGroup)
      : catalog.slice();

    // 카테고리 필터 결과가 min보다 적으면 전체 카탈로그로 폴백(추천이 아예 안 나오는 상황 방지)
    const effectivePool = pool.length >= min ? pool : catalog.slice();

    const scored = effectivePool.map((sample) => {
      const matchResult = computeMatchScore(features, sample, opts.sourceEmbedding);
      return {
        sample,
        score: matchResult.total,
        breakdown: matchResult.breakdown,
        reasons: buildReasons(matchResult, sample),
      };
    });

    scored.sort((a, b) => b.score - a.score);

    if (scored.length <= min) return scored;

    const topScore = scored[0].score;
    const dynamicCutoff = topScore - 25; // 상위 점수 대비 25점 이상 낮으면 추천 리스트에서 제외 후보
    const aboveCutoff = scored.filter((s) => s.score >= dynamicCutoff);

    const finalCount = clampScore01to(aboveCutoff.length, min, max);
    return scored.slice(0, finalCount);
  }

  function clampScore01to(count, min, max) {
    return Math.max(min, Math.min(max, count));
  }

  const PhotoMatching = {
    computeMatchScore,
    buildReasons,
    recommendSamples,
    cosineSimilarity,
    _internal: { scorePose, scoreAngle, scoreLighting, scoreComposition },
  };

  global.PhotoReco = global.PhotoReco || {};
  global.PhotoReco.matching = PhotoMatching;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = PhotoMatching;
  }
})(typeof window !== "undefined" ? window : globalThis);
