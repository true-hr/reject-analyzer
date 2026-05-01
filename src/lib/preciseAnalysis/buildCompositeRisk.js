// src/lib/preciseAnalysis/buildCompositeRisk.js
// [PRECISE-RISK-V1] composite/top3 집계 엔진
// Input : 개별 엔진 5개의 RiskResult 배열 (createRiskResult shape)
// Output: { summary, topRisks, supporting, meta }
//
// overallBand 단계:
//   "high_risk" — fatal 엔진 중 critical 또는 high 발생
//   "warning"   — medium 이상 triggered 존재 (fatal 포함)
//   "caution"   — low만 triggered
//   "pass"      — triggered 없음

const SEVERITY_RANK = { critical: 4, high: 3, medium: 2, low: 1, none: 0 };
const CATEGORY_RANK = { fatal: 2, important: 1, bonus: 0, composite: 0 };

// 엔진 선언 순서 기반 tie-break 우선순위
const ENGINE_PRIORITY = {
  must_requirements_gap:    0,
  experience_level_gap:     1,
  achievement_evidence_gap: 2,
  gap_explanation_missing:  3,
  jd_keyword_coverage_gap:  4,
};

// ── insufficient-data 감지 ────────────────────────────────────────────────────
/**
 * 엔진의 raw.***PolicyMode 가 "insufficient-data" 면 true.
 * must 엔진은 insufficient-data 모드 없음 — 항상 false.
 */
function _isInsufficient(r) {
  const raw = r?.raw ?? {};
  return (
    raw.experiencePolicyMode  === "insufficient-data" ||
    raw.achievementPolicyMode === "insufficient-data" ||
    raw.keywordPolicyMode     === "insufficient-data" ||
    raw.gapPolicyMode         === "insufficient-data"
  );
}

// ── overall band ──────────────────────────────────────────────────────────────
function _computeOverallBand(allRisks) {
  const hasFatalCriticalOrHigh = allRisks.some(
    (r) => r.category === "fatal" && (r.severity === "critical" || r.severity === "high")
  );
  if (hasFatalCriticalOrHigh) return "high_risk";

  const hasMediumOrAboveTriggered = allRisks.some(
    (r) =>
      r.triggered &&
      (r.severity === "critical" || r.severity === "high" || r.severity === "medium")
  );
  if (hasMediumOrAboveTriggered) return "warning";

  const hasLowTriggered = allRisks.some((r) => r.triggered && r.severity === "low");
  if (hasLowTriggered) return "caution";

  return "pass";
}

const OVERALL_LABEL = {
  high_risk: "서류 통과 저해 리스크 있음",
  warning:   "보완이 필요한 리스크 존재",
  caution:   "경미한 리스크 주의",
  pass:      "전반적으로 양호",
};

const OVERALL_REASON = {
  high_risk: "치명 리스크 중 심각도가 높은 항목이 확인되었습니다.",
  warning:   "복수의 리스크 또는 보완이 필요한 항목이 확인되었습니다.",
  caution:   "큰 결격 사유는 없으나 경미하게 보완할 여지가 있습니다.",
  pass:      "확인된 리스크가 없습니다.",
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * 5개 엔진 RiskResult 를 받아 composite 집계 결과를 반환.
 *
 * @param {import("./createRiskResult.js").RiskResult[]} riskResults
 * @returns {{
 *   summary: {
 *     overallBand: "high_risk"|"warning"|"caution"|"pass",
 *     overallLabel: string,
 *     overallReason: string,
 *     triggeredRiskCount: number,
 *     fatalTriggeredCount: number,
 *   },
 *   topRisks: import("./createRiskResult.js").RiskResult[],
 *   supporting: {
 *     lowRisks: import("./createRiskResult.js").RiskResult[],
 *     insufficientData: import("./createRiskResult.js").RiskResult[],
 *     passedRisks: import("./createRiskResult.js").RiskResult[],
 *   },
 *   meta: {
 *     evaluatedRiskCount: number,
 *     triggeredRiskCount: number,
 *     insufficientDataCount: number,
 *     riskVersion: string,
 *   }
 * }}
 */
export function buildCompositeRisk(riskResults) {
  const all = Array.isArray(riskResults) ? riskResults.filter(Boolean) : [];

  // ── insufficient-data 분리 ────────────────────────────────────────────────
  const insufficientData = all.filter(_isInsufficient);
  const active           = all.filter((r) => !_isInsufficient(r));

  // ── triggered / not-triggered 분리 ───────────────────────────────────────
  const triggered    = active.filter((r) => r.triggered);
  const notTriggered = active.filter((r) => !r.triggered);

  // ── top3 후보 / low 분리 ─────────────────────────────────────────────────
  // top3 후보: severity critical/high/medium
  const topCandidates = triggered.filter((r) => r.severity !== "low");
  const lowRisks      = triggered.filter((r) => r.severity === "low");

  // ── comparisonPack 기반 priority boost 계산 — append-only Round 5 ─────────
  // buildCompositeRisk는 fit을 직접 받지 않으므로
  // Round 4-A/4-B에서 risk.raw에 기록된 fitUnderstandingApplied 값을 역참조
  const _boostMap     = {};
  const _boostedKeys  = [];
  for (const r of topCandidates) {
    const _rRaw = r?.raw ?? {};
    if (
      r.key === "experience_level_gap" &&
      _rRaw.fitUnderstandingApplied === true &&
      _rRaw.comparisonFunctionFit   === "mismatch"
    ) {
      _boostMap[r.key] = 100;
      _boostedKeys.push(r.key);
    } else if (
      r.key === "must_requirements_gap" &&
      _rRaw.fitUnderstandingApplied    === true &&
      _rRaw.comparisonMustRequirementFit === "missing"
    ) {
      _boostMap[r.key] = 50;
      _boostedKeys.push(r.key);
    }
  }
  const _priorityApplied = _boostedKeys.length > 0;

  // ── top3 정렬 ─────────────────────────────────────────────────────────────
  // 1차: comparisonPack boost (Round 5), 2차: severity 내림차순, 3차: category 내림차순, 4차: engine 선언 순서
  topCandidates.sort((a, b) => {
    // append-only Round 5: comparisonPack priority boost 우선 적용
    const boostDiff = (_boostMap[b.key] ?? 0) - (_boostMap[a.key] ?? 0);
    if (boostDiff !== 0) return boostDiff;
    const sevDiff = (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0);
    if (sevDiff !== 0) return sevDiff;
    const catDiff = (CATEGORY_RANK[b.category] ?? 0) - (CATEGORY_RANK[a.category] ?? 0);
    if (catDiff !== 0) return catDiff;
    return (ENGINE_PRIORITY[a.key] ?? 99) - (ENGINE_PRIORITY[b.key] ?? 99);
  });

  const topRisks = topCandidates.slice(0, 3);

  // ── overall band ─────────────────────────────────────────────────────────
  const overallBand = _computeOverallBand(all);

  // ── 집계 ─────────────────────────────────────────────────────────────────
  return {
    summary: {
      overallBand,
      overallLabel:        OVERALL_LABEL[overallBand],
      overallReason:       OVERALL_REASON[overallBand],
      triggeredRiskCount:  triggered.length,
      fatalTriggeredCount: triggered.filter((r) => r.category === "fatal").length,
    },
    topRisks,
    supporting: {
      lowRisks,
      insufficientData,
      passedRisks: notTriggered,
    },
    meta: {
      evaluatedRiskCount:    all.length,
      triggeredRiskCount:    triggered.length,
      insufficientDataCount: insufficientData.length,
      riskVersion:           "precise-risk-v1",
    },
    // append-only Round 5: priority debug
    raw: {
      fitUnderstandingPriorityApplied: _priorityApplied,
      riskPriorityHint:    _boostedKeys,
      priorityBoostedKeys: _boostedKeys,
    },
  };
}
