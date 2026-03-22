import { JUDGMENT_TYPES, JUDGMENT_STATUS } from "../judgmentTypes.js";

// INPUT SOURCE PRIORITY (이 builder의 소스 우선순위)
// 1순위: vm.interpretationV2.evidenceDepth.buckets.result
// 2순위: vm.interpretationV2.evidenceDepth.narrative
// 3순위: top3WithInterpretation — result/achievement 관련 canonical 증빙
// READY: result bucket 확인 + non-generic narrative 또는 top3 concrete evidence
// PARTIAL: 성과 암시 있지만 수치/인과 없이 vague
// UNAVAILABLE: task-only / generic accomplishment wording
// Anti-generic guard: "성과", "기여", "개선", "담당" 단독 wording → READY 차단

function __text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function __arr(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function __firstLine(value) {
  return __text(value)
    .split(/\n+/)
    .map((line) => __text(line))
    .find(Boolean) || "";
}

function __isGeneric(value) {
  const text = __text(value).toLowerCase();
  if (!text) return true;
  // 수치/인과 없는 성과 일반 표현 suppression
  return /추가 확인|판단이 필요|성과를 냈습니다|기여했습니다|개선했습니다|담당했습니다|관련 경험/.test(text);
}

export function buildAchievementProof({ vm = null, top3WithInterpretation = [] } = {}) {
  const evidenceDepth = vm?.interpretationV2?.evidenceDepth || null;
  const depthStatus = __text(evidenceDepth?.status);
  const narrative = __text(evidenceDepth?.narrative);
  const buckets = evidenceDepth?.buckets || null;

  const resultCount = Number(buckets?.result) || 0;
  const challengeCount = Number(buckets?.challenge) || 0;

  const achievementRisk = __arr(top3WithInterpretation).find((risk) => {
    const haystack = [
      risk?.canonicalCard?.headline,
      risk?.canonicalCard?.summary,
    ].map((v) => __text(v).toLowerCase()).join(" ");
    // 직접 성과 시그널은 단독 매칭 허용; 개선/효과는 측정 맥락 동반 필요 (bare keyword inflation 차단)
    if (/(성과|result|achievement|수치|outcome|impact)/.test(haystack)) return true;
    if (/(개선|효과)/.test(haystack) && /(측정|수치|달성|비율|%|배\s|건\s|건$)/.test(haystack)) return true;
    return false;
  }) || null;

  if (resultCount === 0 && !achievementRisk) {
    return {
      key: JUDGMENT_TYPES.ACHIEVEMENT_PROOF,
      status: JUDGMENT_STATUS.UNAVAILABLE,
      confidence: null,
      sourceFamily: "fallback",
      why: null,
      context: null,
      proofFor: [],
      proofMissing: [],
      actionHint: null,
    };
  }

  const rawWhy = __firstLine(
    (!__isGeneric(narrative) ? narrative : "") ||
    achievementRisk?.canonicalCard?.summary ||
    ""
  );
  const why = __isGeneric(rawWhy) ? null : rawWhy;

  const hasStrongResult = resultCount > 0 && (depthStatus === "strong" || depthStatus === "moderate");
  const hasConcreteProof = Boolean(why) || challengeCount > 0;

  const judgmentStatus = hasStrongResult && hasConcreteProof
    ? JUDGMENT_STATUS.READY
    : (resultCount > 0 || achievementRisk)
    ? JUDGMENT_STATUS.PARTIAL
    : JUDGMENT_STATUS.UNAVAILABLE;

  const confidence = hasStrongResult && hasConcreteProof ? "medium" : "low";

  const context = resultCount > 0
    ? `성과 항목 ${resultCount}건 확인${challengeCount > 0 ? `, 문제·과제 맥락 ${challengeCount}건` : ""}`
    : null;

  const proofFor = [
    resultCount > 0 ? `측정 가능한 성과 ${resultCount}건` : "",
    challengeCount > 0 ? `문제·과제 맥락 ${challengeCount}건` : "",
    achievementRisk && !__isGeneric(__firstLine(achievementRisk.resumeEvidence?.[0]))
      ? __firstLine(achievementRisk.resumeEvidence?.[0]).slice(0, 60)
      : "",
  ].filter(Boolean).slice(0, 3);

  const proofMissing = resultCount === 0
    ? ["수치·비율·전후 비교 등 측정 가능한 성과 기술 필요"]
    : !why
    ? ["인과 관계 또는 기여 맥락 연결 필요"]
    : [];

  const sourceFamily = hasStrongResult ? "evidence_fit_meta"
    : achievementRisk ? "per_risk_evidence"
    : "fallback";

  return {
    key: JUDGMENT_TYPES.ACHIEVEMENT_PROOF,
    status: judgmentStatus,
    confidence,
    sourceFamily,
    why,
    context,
    proofFor,
    proofMissing,
    actionHint: resultCount > 0
      ? "수치·범위·전후 변화까지 붙여 성과를 측정 가능하게 서술합니다."
      : "담당 업무 옆에 구체적 성과 1개를 수치로 추가합니다.",
  };
}
