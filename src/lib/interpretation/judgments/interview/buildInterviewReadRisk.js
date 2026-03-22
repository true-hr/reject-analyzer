import { JUDGMENT_TYPES, JUDGMENT_STATUS } from "../judgmentTypes.js";

// INPUT SOURCE PRIORITY (이 builder의 소스 우선순위)
// 1순위: vm.interpretationV2.jdCompetitiveness.drivers — conflict driver 최우선
// 2순위: top3WithInterpretation[0].canonicalCard — canonical risk 증빙
// ※ conflict driver: JD가 요구하는데 이력서에서 확인 안 되는 핵심 포인트
// ※ firstRisk: 면접관이 가장 먼저 검증할 canonical risk
// READY: jdComp driver AND canonical firstRisk 모두 존재
// PARTIAL: 둘 중 하나만 존재

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

function __dedup(arr) {
  const seen = new Set();
  return arr.filter((item) => {
    const key = __text(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function __isGeneric(value) {
  const text = __text(value);
  if (!text) return true;
  return [
    /이 리스크가 커질 수 있습니다/,
    /추가 확인/,
    /판단이 필요/,
    /읽히는 흐름/,
    /가능성이 있습니다/,
    /확인이 필요합니다/,
  ].some((re) => re.test(text));
}

export function buildInterviewReadRisk({ vm = null, top3WithInterpretation = [] } = {}) {
  const firstRisk = __arr(top3WithInterpretation).find((risk) => __text(risk?.canonicalCard?.headline) && __text(risk?.canonicalCard?.summary)) || null;
  const jdComp = vm?.interpretationV2?.jdCompetitiveness || null;
  const drivers = __arr(jdComp?.drivers).map((driver) => ({
    type: __text(driver?.type || driver?.kind),
    text: __firstLine(driver?.text || driver),
  }));
  const firstDriver = drivers.find((item) => item.text) || null;
  const conflictDriver = drivers.find((item) => item.type === "conflict" && item.text) || null;

  const riskSummary = __firstLine(firstRisk?.canonicalCard?.summary);
  const why = __firstLine(
    conflictDriver?.text ||
    firstDriver?.text ||
    (!__isGeneric(riskSummary) ? riskSummary : "")
  );
  const context = __firstLine(firstRisk?.canonicalCard?.supportingEvidence || firstDriver?.text);

  if (!why) {
    return {
      key: JUDGMENT_TYPES.INTERVIEW_READ_RISK,
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

  // READY: jdComp driver AND canonical firstRisk 모두 있을 때
  // PARTIAL: 둘 중 하나만 있을 때
  const hasJdSignal = Boolean(conflictDriver?.text || firstDriver?.text);
  const hasRiskSignal = Boolean(firstRisk);
  const status = hasJdSignal && hasRiskSignal
    ? JUDGMENT_STATUS.READY
    : JUDGMENT_STATUS.PARTIAL;

  // confidence: 3-tier
  // high: conflict driver + firstRisk specific / medium: 하나만 / low: generic
  const confidence = conflictDriver?.text && firstRisk && !__isGeneric(riskSummary) ? "high"
    : conflictDriver?.text || (firstRisk && !__isGeneric(riskSummary)) ? "medium"
    : "low";

  // proofFor: resume에서 확인된 것 (dedup, 최대 2개)
  const proofFor = __dedup([
    __firstLine(firstRisk?.resumeEvidence?.[0]),
    __firstLine(firstRisk?.canonicalCard?.supportingEvidence),
  ]).slice(0, 2);

  // proofMissing: JD에서 요구하지만 이력서에서 확인 안 된 것 (dedup, 최대 2개)
  // ※ conflict driver text는 JD 요구 포인트 — proofMissing에 적합
  // ※ firstDriver가 conflict가 아닐 경우 proofMissing 대상이 아님
  const proofMissing = __dedup([
    __firstLine(firstRisk?.jdEvidence?.[0]),
    conflictDriver?.text && !__isGeneric(conflictDriver.text) ? conflictDriver.text : "",
  ]).slice(0, 2);

  return {
    key: JUDGMENT_TYPES.INTERVIEW_READ_RISK,
    status,
    confidence,
    // dominant evidence owner 기준: jdComp driver → jd_competitiveness; risk만 → top3_canonical
    sourceFamily: hasJdSignal ? "jd_competitiveness" : hasRiskSignal ? "top3_canonical" : "fallback",
    why,
    context: context || null,
    proofFor,
    proofMissing,
    actionHint: "면접관이 가장 먼저 물을 가능성이 높은 포인트부터 한 문장으로 준비합니다.",
  };
}
