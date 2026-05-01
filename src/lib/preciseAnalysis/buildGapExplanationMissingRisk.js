// src/lib/preciseAnalysis/buildGapExplanationMissingRisk.js
// [PRECISE-RISK-V1] 공백/이직 설명 부재 엔진 — gap_explanation_missing
// 입력: buildJdResumeFit() 반환 fit object + parseWithAI() parsedResume
//
// gapPolicyMode:
//   "gap-check"         — employmentPeriods 기반 실제 gap 계산 수행
//   "insufficient-data" — periods 부족해 강한 판정 보류

import { createRiskResult } from "./createRiskResult.js";

const SUMMARY_TEXT = {
  critical: "이력서에서 긴 공백 기간이 확인되며, 해당 기간에 대한 설명이 보이지 않습니다.",
  high:     "이력서에서 설명이 없는 공백 기간이 비교적 길게 확인됩니다.",
  medium:   "이력서에서 설명이 없는 공백 기간이 감지됩니다.",
  none:     "공백 기간에 대한 명확한 설명 부재는 확인되지 않았습니다.",
};

const DETAIL_TEXT = {
  critical:
    "6개월 이상 공백이 있더라도 이유가 이력서에 드러나지 않으면 서류 단계에서 의구심이 생길 수 있습니다. 학습, 프로젝트, 프리랜서, 휴식 등 어떤 이유든 간단히 설명하는 것이 도움이 됩니다.",
  high:
    "이력서에서 공백 기간은 보이지만, 해당 시기의 활동이나 이유가 직접적으로 확인되지 않습니다. 짧게라도 설명을 추가하면 검토자의 부담을 줄일 수 있습니다.",
  medium:
    "설명이 없는 공백 기간이 일부 보입니다. 이 기간에 대한 활동이나 사유를 간단히 덧붙이면 더 자연스럽게 읽힐 수 있습니다.",
  none:
    "공백 설명 측면에서 큰 결격 사유는 확인되지 않았습니다.",
};

// ── 내부 helper ──────────────────────────────────────────────────────────────

/**
 * "YYYY-MM" → 총 월 수 정수 (year*12 + month-1).
 * 파싱 실패 시 null.
 */
function _parseYm(str) {
  if (!str || typeof str !== "string") return null;
  const m = str.match(/^(\d{4})-(\d{1,2})$/);
  if (!m) return null;
  const y  = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  if (mo < 1 || mo > 12) return null;
  return y * 12 + (mo - 1);
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * 공백/이직 설명 부재 리스크 엔진.
 * @param {object|null|undefined} fit          — buildJdResumeFit() 반환값
 * @param {object|null|undefined} parsedResume — parseWithAI() 반환값
 * @returns {import("./createRiskResult.js").RiskResult}
 */
export function buildGapExplanationMissingRisk(fit, parsedResume) {
  // ── 입력 추출 ──────────────────────────────────────────────────────────────
  const rawPeriods = Array.isArray(fit?.resume?.structured?.employmentPeriods)
    ? fit.resume.structured.employmentPeriods
    : [];

  const parsedGaps = Array.isArray(parsedResume?.gaps)
    ? parsedResume.gaps.filter((g) => g && typeof g === "string")
    : [];
  const transitionNarrative = Array.isArray(parsedResume?.transitionNarrative)
    ? parsedResume.transitionNarrative.filter((t) => t && typeof t === "string")
    : [];

  // ── 기간 파싱 & 유효/제외 분류 ───────────────────────────────────────────
  const validPeriods  = [];
  const skippedPeriods = [];

  for (const p of rawPeriods) {
    const fromM = _parseYm(p?.from);
    const toM   = _parseYm(p?.to);
    if (fromM === null || toM === null) {
      skippedPeriods.push(p);
      continue;
    }
    if (fromM > toM) {
      skippedPeriods.push(p);
      continue;
    }
    validPeriods.push({ fromM, toM, isCurrent: !!p.isCurrent, raw: p });
  }

  const timelinePeriodCount = validPeriods.length;

  // ── insufficient-data: 유효 periods 1개 이하 ─────────────────────────────
  if (timelinePeriodCount <= 1) {
    return createRiskResult({
      key:         "gap_explanation_missing",
      title:       "공백/이직 설명 부재",
      category:    "fatal",
      severity:    "none",
      triggered:   false,
      summaryText: SUMMARY_TEXT.none,
      detailText:  DETAIL_TEXT.none,
      evidence:    [],
      raw: {
        maxGapMonths:       0,
        gapCount:           0,
        describedGapCount:  0,
        timelinePeriodCount,
        skippedPeriods,
        gapPolicyMode:      "insufficient-data",
      },
    });
  }

  // ── 시작일 기준 정렬 ──────────────────────────────────────────────────────
  validPeriods.sort((a, b) => a.fromM - b.fromM);

  // ── 인접 구간 gap 계산 ──────────────────────────────────────────────────��─
  // gapMonths = next.fromM - prev.toM - 1
  // ≤ 1 이면 공백 미인정 (0개월 or 1개월 차이)
  const gaps = [];
  for (let i = 0; i < validPeriods.length - 1; i++) {
    const prev = validPeriods[i];
    const next = validPeriods[i + 1];
    const gapMonths = next.fromM - prev.toM - 1;
    if (gapMonths >= 2) {
      gaps.push(gapMonths);
    }
  }
  // 현재 재직중 구간 이후 gap은 계산하지 않음 — 정렬 후 마지막 이전 구간들만 처리하므로 자연 처리됨
  // (마지막 구간과 "다음 구간"은 없으므로 루프가 validPeriods.length-1 에서 멈춤)

  const gapCount     = gaps.length;
  const maxGapMonths = gapCount > 0 ? Math.max(...gaps) : 0;

  // ── 설명 존재 판정 ─────────────────────────────────────────────────────────
  // gaps (primary) + transitionNarrative (보조)
  const describedGapCount = parsedGaps.length > 0
    ? parsedGaps.length
    : (transitionNarrative.length > 0 ? 1 : 0); // transitionNarrative는 보조 — 최대 1로 제한

  // ── severity 결정 (gap-check) ─────────────────────────────────────────────
  let severity;
  if (gapCount === 0) {
    severity = "none";
  } else if (describedGapCount > 0) {
    // 설명 신호가 있으면 완화 — 단, 12개월 이상 공백은 medium 유지
    severity = (maxGapMonths >= 12) ? "medium" : "none";
  } else if (maxGapMonths >= 12) {
    severity = "critical";
  } else if (maxGapMonths >= 6) {
    severity = "high";
  } else if (maxGapMonths >= 3) {
    severity = "medium";
  } else {
    // gapCount > 0 이지만 maxGap < 3개월 — 정책상 none
    severity = "none";
  }

  const triggered = severity !== "none";

  // ── evidence 구성 ─────────────────────────────────────────────────────────
  const evidence = [];
  if (timelinePeriodCount > 0) {
    evidence.push(`이력서에서 확인된 재직 구간: ${timelinePeriodCount}건`);
  }
  if (gapCount > 0) {
    evidence.push(`설명 확인이 필요한 공백 구간: ${gapCount}건`);
  }
  if (maxGapMonths > 0) {
    evidence.push(`가장 긴 공백 기간: 약 ${maxGapMonths}개월`);
  }
  if (describedGapCount > 0) {
    evidence.push(`공백 설명 신호 확인: ${describedGapCount}건`);
  }
  if (skippedPeriods.length > 0) {
    evidence.push(`기간 확인이 어려워 계산에서 제외된 구간: ${skippedPeriods.length}건`);
  }

  const raw = {
    maxGapMonths,
    gapCount,
    describedGapCount,
    gapDescriptions: parsedGaps,
    transitionNarratives: transitionNarrative,
    timelinePeriodCount,
    skippedPeriods,
    gapPolicyMode: "gap-check",
  };

  return createRiskResult({
    key:         "gap_explanation_missing",
    title:       "공백/이직 설명 부재",
    category:    "fatal",
    severity,
    triggered,
    summaryText: SUMMARY_TEXT[severity] ?? SUMMARY_TEXT.none,
    detailText:  DETAIL_TEXT[severity]  ?? DETAIL_TEXT.none,
    evidence,
    raw,
  });
}
