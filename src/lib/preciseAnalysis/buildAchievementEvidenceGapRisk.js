// src/lib/preciseAnalysis/buildAchievementEvidenceGapRisk.js
// [PRECISE-RISK-V1] 성과 검증 불가 엔진 — achievement_evidence_gap
// 입력: parseWithAI() 반환 parsedResume 객체
//
// achievementPolicyMode:
//   "achievement-check"  — achievements / bullets 기반 성과 근거 실제 판정
//   "insufficient-data"  — parsedResume 없거나 achievements + bullets 모두 비어 보수 처리

import { createRiskResult } from "./createRiskResult.js";

const SUMMARY_TEXT = {
  critical: "이력서에서 수치나 결과로 검증되는 성과 항목이 확인되지 않습니다.",
  high:     "성과를 뒷받침하는 구체적인 수치 또는 결과 표현이 부족해 보입니다.",
  medium:   "일부 성과 근거는 보이지만, 전반적으로 검증 가능한 표현이 더 필요해 보입니다.",
  none:     "성과를 뒷받침하는 구체적인 근거가 이력서에 포함되어 있습니다.",
};

const DETAIL_TEXT = {
  critical:
    "서류 검토자가 지원자의 성과를 판단할 수 있는 수치, 비율, 결과 표현이 이력서에서 직접 확인되지 않습니다. '업무를 수행했다' 수준의 서술보다, 어떤 결과를 만들었는지 드러나는 표현이 필요합니다.",
  high:
    "일부 경험은 보이지만, 성과를 입증할 수 있는 수치나 결과 표현이 부족할 수 있습니다. 실제 성과가 있었다면 변화 폭, 건수, 비율, 금액 등을 더 직접적으로 드러내는 것이 좋습니다.",
  medium:
    "성과 근거가 일부 보이지만, 전반적으로는 검증 가능한 표현이 더 있으면 좋습니다. 특히 중요한 경험부터 결과 중심 문장으로 보완해보는 것이 좋습니다.",
  none:
    "성과를 설명하는 수치나 결과 표현이 일정 수준 이상 확인됩니다.",
};

// ── 내부 helper ──────────────────────────────────────────────────────────────

/**
 * 정량 표현 감지 — 숫자 OR 성과 동사 존재 시 true.
 * 단순 regex 기반. NLP/의미 확장 없음.
 */
const _QUANT_RE = /\d+|%|배(?!\s*경)|건|명|원|억|증가|감소|개선|향상|절감|달성|확대|축소|성장|상승|감축/;

function _isQuantified(str) {
  if (!str || typeof str !== "string") return false;
  return _QUANT_RE.test(str);
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * 성과 검증 불가 리스크 엔진.
 * @param {object|null|undefined} parsedResume — parseWithAI() 반환값 (parsed 필드 직접)
 * @param {object|null|undefined} resumeCareerInterpretation — P1-A 반환값 (optional)
 * @returns {import("./createRiskResult.js").RiskResult}
 */
export function buildAchievementEvidenceGapRisk(parsedResume, resumeCareerInterpretation = null) {
  // ── 입력 추출 ──────────────────────────────────────────────────────────────
  const achievements = Array.isArray(parsedResume?.achievements)
    ? parsedResume.achievements.filter((x) => x && typeof x === "string")
    : [];

  const allBullets = Array.isArray(parsedResume?.timeline)
    ? parsedResume.timeline.flatMap((item) =>
        Array.isArray(item?.bullets)
          ? item.bullets.filter((b) => b && typeof b === "string")
          : []
      )
    : [];

  const achievementsCount = achievements.length;
  const timelineBulletCount = allBullets.length;

  // ── insufficient-data 판정 ────────────────────────────────────────────────
  if (!parsedResume || (achievementsCount === 0 && timelineBulletCount === 0)) {
    return createRiskResult({
      key:         "achievement_evidence_gap",
      title:       "성과 검증 불가",
      category:    "fatal",
      severity:    "none",
      triggered:   false,
      summaryText: SUMMARY_TEXT.none,
      detailText:  DETAIL_TEXT.none,
      evidence:    [],
      raw: {
        achievementsCount:           0,
        quantifiedAchievementsCount: 0,
        timelineBulletCount:         0,
        quantifiedBulletCount:       0,
        quantifiedBulletRatio:       0,
        achievementPolicyMode:       "insufficient-data",
      },
    });
  }

  // ── 정량 표현 집계 ─────────────────────────────────────────────────────────
  const quantifiedAchievementsCount = achievements.filter(_isQuantified).length;
  const quantifiedBulletCount       = allBullets.filter(_isQuantified).length;
  const quantifiedBulletRatio       =
    timelineBulletCount > 0 ? quantifiedBulletCount / timelineBulletCount : 0;

  // ── severity 결정 (achievement-check) ─────────────────────────────────────
  let severity;
  if (achievementsCount === 0 && quantifiedBulletCount === 0) {
    severity = "critical";
  } else if (achievementsCount <= 1 || quantifiedBulletRatio < 0.2) {
    severity = "high";
  } else if (achievementsCount >= 2 && quantifiedBulletRatio < 0.4) {
    severity = "medium";
  } else {
    severity = "none";
  }

  let triggered = severity !== "none";

  // ── evidence 구성 ─────────────────────────────────────────────────────────
  const evidence = [];
  evidence.push(`성과 항목 확인: ${achievementsCount}개`);
  if (quantifiedAchievementsCount > 0) {
    evidence.push(`정량 표현이 포함된 성과 항목: ${quantifiedAchievementsCount}개`);
  }
  if (timelineBulletCount > 0) {
    evidence.push(`업무/성과 서술 항목: ${timelineBulletCount}개`);
    const pct = Math.round(quantifiedBulletRatio * 100);
    evidence.push(`정량 표현 포함 비율: 약 ${pct}%`);
  }

  const raw = {
    achievementsCount,
    quantifiedAchievementsCount,
    timelineBulletCount,
    quantifiedBulletCount,
    quantifiedBulletRatio,
    achievementPolicyMode: "achievement-check",
  };

  // ── P1-A: resumeCareerInterpretation 보조 블록 ────────────────────────────
  if (resumeCareerInterpretation && Array.isArray(resumeCareerInterpretation.careerEntries)) {
    const _p1aEntries = resumeCareerInterpretation.careerEntries;

    // Flatten all AI-classified achievements across career entries
    const _p1aAllAch = _p1aEntries.flatMap((e) =>
      Array.isArray(e?.achievements) ? e.achievements : []
    );
    const _aiAchievementCount = _p1aAllAch.length;
    const _aiHasMetricCount   = _p1aAllAch.filter((a) => a?.hasMetric === true).length;

    // Weak/strong evidence entries by evidenceStrength field
    const _aiWeakEvidenceEntryCount   = _p1aEntries.filter((e) => e?.evidenceStrength === "weak").length;
    const _aiStrongEvidenceEntryCount = _p1aEntries.filter((e) => e?.evidenceStrength === "strong").length;

    if (_aiAchievementCount > 0) {
      evidence.push(`AI 분석 성과 항목: ${_aiAchievementCount}개`);
      evidence.push(`AI 분석 수치·결과 포함 성과 항목: ${_aiHasMetricCount}개`);
    }
    if (_aiWeakEvidenceEntryCount > 0) {
      evidence.push(`AI 분석에서 근거 표현이 약한 경력: ${_aiWeakEvidenceEntryCount}건`);
    }

    // Severity escalation: AI confirms zero quantified achievements despite sufficient data
    if (severity === "none" && _aiAchievementCount >= 2 && _aiHasMetricCount === 0) {
      severity = "medium";
      triggered = true;
    }

    raw.resumeCareerInterpretationApplied = true;
    raw.aiAchievementCount        = _aiAchievementCount;
    raw.aiHasMetricCount          = _aiHasMetricCount;
    raw.aiWeakEvidenceEntryCount  = _aiWeakEvidenceEntryCount;
    raw.aiStrongEvidenceEntryCount = _aiStrongEvidenceEntryCount;
  }

  // ── 타이틀 결정 (성과 근거 수준 기반, P1-A 반영 후 최종 triggered 기준) ──────
  // 정량 근거가 전혀 없을 때만 절대적 표현 사용, 일부라도 있으면 보완 제안형으로
  const _hasAnyQuantified = quantifiedAchievementsCount > 0 || quantifiedBulletCount > 0;
  const _achievementTitle = !triggered
    ? "성과 검증 불가"
    : (achievementsCount === 0 && quantifiedBulletCount === 0)
      ? "성과 근거 확인 어려움"
      : _hasAnyQuantified
        ? "성과 근거 보강 필요"
        : "성과 근거 부족";

  return createRiskResult({
    key:         "achievement_evidence_gap",
    title:       _achievementTitle,
    category:    "fatal",
    severity,
    triggered,
    summaryText: SUMMARY_TEXT[severity] ?? SUMMARY_TEXT.none,
    detailText:  DETAIL_TEXT[severity]  ?? DETAIL_TEXT.none,
    evidence,
    raw,
  });
}
