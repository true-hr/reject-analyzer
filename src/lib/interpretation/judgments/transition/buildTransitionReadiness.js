import { JUDGMENT_TYPES, JUDGMENT_STATUS } from "../judgmentTypes.js";

// INPUT SOURCE PRIORITY (이 builder의 소스 우선순위)
// 1순위: interpretationPack.sectionAssemblies.careerAccumulation.primaryThesis
// 2순위: careerInterpretation.currentFlow.transitions (구체적 전환 장면)
// 3순위: careerInterpretation.currentFlow.transitionNarrative / summary
// ※ thesis key는 canonical careerAccumulation 분석 결과
// ※ "strong-accumulation"은 전환 리스크 아님 → topRisk 진입 차단

function __text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function __arr(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

// thesis별 해석 텍스트 — 추상적 표현 지양, 평가 맥락 중심
const THESIS_TEXT = {
  "transition-building": "현재 경력 구조는 전환을 향해 재배치 중으로 읽히며, 기존 역할과 목표 직무 간 연결 맥락을 명확히 설명해야 합니다.",
  "continuity-risk": "경력 이동 배경과 역할 변화가 연속성보다 두드러지며, 전환 필연성과 재사용 가능한 역량을 구체적으로 제시해야 합니다.",
  "related-but-fragmented": "관련 도메인 내에 있으나 직무 연결이 구간별로 분절되어 읽힐 수 있어, 일관된 전문성 축을 하나로 묶어 설명해야 합니다.",
  "strong-accumulation": "경력 축이 안정적으로 이어지는 구조입니다. 전환보다 심화·확장 관점이 적절합니다.",
};

// strong-accumulation은 리스크가 아니므로 topRisk 대상에서 제외
const RISK_THESES = new Set(["transition-building", "continuity-risk", "related-but-fragmented"]);

export function buildTransitionReadiness({ interpretationPack = null, careerInterpretation = null } = {}) {
  const thesis = __text(interpretationPack?.sectionAssemblies?.careerAccumulation?.primaryThesis);
  const transitions = __arr(careerInterpretation?.currentFlow?.transitions).map((item) => __text(item)).filter(Boolean);
  const summary = __text(careerInterpretation?.currentFlow?.transitionNarrative || careerInterpretation?.currentFlow?.summary);

  if (!thesis && transitions.length === 0 && !summary) {
    return {
      key: JUDGMENT_TYPES.TRANSITION_READINESS,
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

  const why = THESIS_TEXT[thesis] || summary || transitions[0] || "";
  const isRiskThesis = RISK_THESES.has(thesis);
  const hasTransitions = transitions.length > 0;

  // status 결정:
  // - 리스크 thesis + transitions 존재: READY
  // - 리스크 thesis만: PARTIAL
  // - thesis 없지만 transitions 존재: PARTIAL (topRisk 진입 가능)
  // - strong-accumulation 또는 데이터 부족: PARTIAL, proofFor/Missing 비워서 topRisk 진입 차단
  let status;
  let proofFor;
  let proofMissing;

  if (isRiskThesis) {
    status = hasTransitions ? JUDGMENT_STATUS.READY : JUDGMENT_STATUS.PARTIAL;
    proofFor = transitions.slice(0, 2);
    proofMissing = [];
  } else if (!thesis && hasTransitions) {
    // thesis 미확인 + transitions 있는 케이스 — 리스크 가능성 있음
    status = JUDGMENT_STATUS.PARTIAL;
    proofFor = transitions.slice(0, 2);
    proofMissing = ["전환 이유와 역량 재사용 근거 설명 필요"];
  } else {
    // strong-accumulation 또는 thesis 미확인 + transitions 없음 → topRisk 진입 차단
    status = JUDGMENT_STATUS.PARTIAL;
    proofFor = [];
    proofMissing = [];
  }

  // confidence: 리스크 thesis이고 전환 장면 2개 이상일 때만 medium
  const confidence = isRiskThesis && transitions.length >= 2 ? "medium" : "low";

  return {
    key: JUDGMENT_TYPES.TRANSITION_READINESS,
    status,
    confidence,
    sourceFamily: isRiskThesis ? "career_accumulation"
      : (hasTransitions && Boolean(why || summary)) ? "career_interpretation"
      : "fallback",
    why: why || null,
    context: summary || null,
    proofFor,
    proofMissing,
    actionHint: isRiskThesis && why
      ? "전환 이유보다 먼저 이어지는 과업 구조와 재사용 가능한 경험을 설명합니다."
      : null,
  };
}
