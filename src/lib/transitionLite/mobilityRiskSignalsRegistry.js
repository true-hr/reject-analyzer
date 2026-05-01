// transition-lite mobility risk signals registry
//
// Global rules
// 1. 공식 입력은 classification 4축만 사용:
//    - jobDistance
//    - industryDistance
//    - roleWeightShift
//    - responsibilityShift
// 2. risk signal은 유저 문장이 아니라 내부 판정 구조다.
// 3. primary trigger 없이 amplifier만으로 risk 생성 금지.
// 4. suppressor는 risk를 새로 만들지 않고 제거/약화만 한다.
// 5. same/same/similar/similar이면 no-risk 허용.
// 6. RISK_EXECUTION_LINK_CHECK 와 RISK_STRATEGIC_VIEW_CHECK 는 동시 노출 금지.
// 7. RISK_JOB_EXPECTATION_SHIFT 존재 시 RISK_SCOPE_REINTERPRETATION 기본 suppress.
// 8. targetJobRead / targetIndustryRead는 mobility risk signals source가 아니다.
// 9. why는 전체 signal이 아니라 selected top risk 기준으로만 생성한다.
// 10. risk signal 단계에서 사람 평가형 표현 금지:
//     - 부족
//     - 미달
//     - 부적합
//     - 탈락

export const TRANSITION_LITE_RISK_KEYS = [
  "RISK_INDUSTRY_CONTEXT_SHIFT",
  "RISK_JOB_EXPECTATION_SHIFT",
  "RISK_EXECUTION_LINK_CHECK",
  "RISK_STRATEGIC_VIEW_CHECK",
  "RISK_RESPONSIBILITY_EXPANSION",
  "RISK_SCOPE_REINTERPRETATION",
];

export const TRANSITION_LITE_MOBILITY_RISK_SIGNALS_REGISTRY = {
  RISK_INDUSTRY_CONTEXT_SHIFT: {
    riskKey: "RISK_INDUSTRY_CONTEXT_SHIFT",
    userFacingLabel: "새 업계에서 통할 경험인지 확인",
    primaryTriggers: [
      "industryDistance = cross",
    ],
    amplifiers: [
      "jobDistance in (adjacent, cross)",
      "currentIndustryId != targetIndustryId and industry relation asset 없음",
      "targetIndustry customerMarket 차이 큼",
      "targetIndustry buyingMotion 차이 큼",
      "targetIndustry decisionStructure 차이 큼",
      "targetIndustry domainTraits 차이 큼",
    ],
    suppressors: [
      "industryDistance = same",
      "industryDistance = adjacent and jobDistance = same and roleWeightShift = similar and responsibilityShift != meaningfully_up",
      "current/target industry 하위 family 동일",
      "industry relation asset 상 adjacent 명시되고 target context 차이 작음",
    ],
    weakAllowed: true,
    maxPriorityBand: "high",
    preferredWhyFamilies: [
      "INDUSTRY_CONTEXT_LINK",
      "TARGET_ROLE_LOGIC",
    ],
    strengthSideHints: [
      "STRENGTH_DOMAIN_ADJACENCY",
      "STRENGTH_JOB_CONTINUITY",
      "STRENGTH_FUNCTIONAL_EXPANSION",
    ],
    notes: [
      "industry cross일 때 대표 구조 리스크 후보",
      "same/same/similar/similar 상태에서는 뜨면 안 됨",
    ],
  },

  RISK_JOB_EXPECTATION_SHIFT: {
    riskKey: "RISK_JOB_EXPECTATION_SHIFT",
    userFacingLabel: "지원 직무 기준에 맞는 경험인지 확인",
    primaryTriggers: [
      "jobDistance = cross",
    ],
    amplifiers: [
      "industryDistance in (adjacent, cross)",
      "targetJob roleWeight가 currentJob과 다름",
      "targetJob coreTraits 차이 큼",
      "targetJob strongSignals 차이 큼",
      "migration map 부재 + same family 아님",
    ],
    suppressors: [
      "jobDistance = same",
      "jobDistance = adjacent",
      "exact migration map 상 adjacent 명시",
      "same family and same-like target expectation",
    ],
    weakAllowed: false,
    maxPriorityBand: "high",
    preferredWhyFamilies: [
      "TARGET_ROLE_LOGIC",
      "ROLE_SCOPE",
    ],
    strengthSideHints: [
      "STRENGTH_FUNCTIONAL_EXPANSION",
      "STRENGTH_JOB_CONTINUITY",
    ],
    notes: [
      "jobDistance = cross일 때 기본 1순위 후보",
      "존재하면 scope reinterpretation 기본 suppress",
    ],
  },

  RISK_EXECUTION_LINK_CHECK: {
    riskKey: "RISK_EXECUTION_LINK_CHECK",
    userFacingLabel: "실행 단계까지 해본 경험인지 확인",
    primaryTriggers: [
      "jobDistance = adjacent and roleWeightShift = strategy_to_execution",
    ],
    amplifiers: [
      "industryDistance = cross",
      "responsibilityShift in (slightly_up, meaningfully_up)",
      "targetJob strongSignals 중 execution/operation/co-working 비중 높음",
      "targetJob reviewIntent/reportIntent가 실행 연결 강조",
    ],
    suppressors: [
      "roleWeightShift = similar",
      "currentJob roleWeight가 이미 execution-heavy",
      "currentJob strongSignals에 운영/조율/실행 연결 시그널 충분",
      "RISK_STRATEGIC_VIEW_CHECK already selected",
    ],
    weakAllowed: true,
    maxPriorityBand: "mid",
    preferredWhyFamilies: [
      "DIRECT_EXECUTION_LINK",
      "ROLE_SCOPE",
    ],
    strengthSideHints: [
      "STRENGTH_STRATEGY_TO_EXECUTION",
      "STRENGTH_FUNCTIONAL_EXPANSION",
    ],
    notes: [
      "strategic view check와 동시 노출 금지",
      "adjacent 경계형 대표 조건",
    ],
  },

  RISK_STRATEGIC_VIEW_CHECK: {
    riskKey: "RISK_STRATEGIC_VIEW_CHECK",
    userFacingLabel: "운영 경험을 더 큰 그림으로 설명할 수 있는지 확인",
    primaryTriggers: [
      "jobDistance = adjacent and roleWeightShift = execution_to_strategy",
    ],
    amplifiers: [
      "responsibilityShift in (slightly_up, meaningfully_up)",
      "targetJob roleWeight가 strategy/planning 쪽",
      "targetJob reviewIntent/reportIntent가 우선순위/구조 판단 강조",
      "industryDistance = cross",
    ],
    suppressors: [
      "roleWeightShift = similar",
      "currentJob asset에 strategy/planning 성격 강함",
      "currentJob coreTraits에 판단/구조화/우선순위 시그널 충분",
      "RISK_EXECUTION_LINK_CHECK already selected",
    ],
    weakAllowed: true,
    maxPriorityBand: "mid",
    preferredWhyFamilies: [
      "TARGET_ROLE_LOGIC",
      "SENIORITY_DEPTH",
    ],
    strengthSideHints: [
      "STRENGTH_EXECUTION_TO_STRATEGY",
      "STRENGTH_FUNCTIONAL_EXPANSION",
    ],
    notes: [
      "execution link와 배타적",
      "cross+same+execution_to_strategy 조합에서 job expectation 다음 후보",
    ],
  },

  RISK_RESPONSIBILITY_EXPANSION: {
    riskKey: "RISK_RESPONSIBILITY_EXPANSION",
    userFacingLabel: "업무보다 책임 수준이 달라지는 변화",
    primaryTriggers: [
      "responsibilityShift = meaningfully_up",
    ],
    secondaryTriggers: [
      "responsibilityShift = slightly_up",
    ],
    amplifiers: [
      "jobDistance in (same, adjacent)",
      "roleWeightShift in (operator_to_coordinator, execution_to_strategy)",
      "stakeholder breadth 증가",
      "ownership level 증가",
      "decision breadth 증가",
    ],
    suppressors: [
      "responsibilityShift = similar",
      "responsibilityShift = down_or_narrower",
      "same/same/similar/similar",
      "slightly_up only and stronger structure risk 존재",
    ],
    weakAllowed: true,
    maxPriorityBand: "mid",
    preferredWhyFamilies: [
      "SENIORITY_DEPTH",
      "ROLE_SCOPE",
    ],
    strengthSideHints: [
      "STRENGTH_GROWTH_SCOPE",
      "STRENGTH_JOB_CONTINUITY",
    ],
    notes: [
      "slightly_up는 1순위 금지",
      "same/same + meaningfully_up면 mismatch류 대신 responsibility만 약하게 허용 가능",
    ],
  },

  RISK_SCOPE_REINTERPRETATION: {
    riskKey: "RISK_SCOPE_REINTERPRETATION",
    userFacingLabel: "유사해 보이는 직무의 실제 차이",
    primaryTriggers: [
      "jobDistance = adjacent",
    ],
    secondaryTriggers: [
      "jobDistance = cross",
    ],
    amplifiers: [
      "roleWeightShift != similar",
      "responsibilityShift in (slightly_up, meaningfully_up)",
      "targetJob coreTraits 차이 존재",
      "targetJob strongSignals 차이 존재",
      "직무명/패밀리는 가깝지만 실제 산출물 초점 다름",
    ],
    suppressors: [
      "jobDistance = same",
      "RISK_JOB_EXPECTATION_SHIFT 존재",
      "industryDistance = same and roleWeightShift = similar and responsibilityShift = similar",
      "direct structure risk already stronger",
    ],
    weakAllowed: true,
    maxPriorityBand: "low",
    preferredWhyFamilies: [
      "ROLE_SCOPE",
      "TARGET_ROLE_LOGIC",
    ],
    strengthSideHints: [
      "STRENGTH_FUNCTIONAL_EXPANSION",
      "STRENGTH_JOB_CONTINUITY",
    ],
    notes: [
      "기본적으로 보조 리스크",
      "adjacent 설명 필요성을 보여주는 리스크",
      "대형 구조 리스크보다 앞서면 안 됨",
    ],
  },
};

export function isTransitionLiteRiskKey(riskKey) {
  return TRANSITION_LITE_RISK_KEYS.includes(riskKey);
}

export function getTransitionLiteMobilityRiskSignalSpec(riskKey) {
  if (!isTransitionLiteRiskKey(riskKey)) {
    return null;
  }

  return TRANSITION_LITE_MOBILITY_RISK_SIGNALS_REGISTRY[riskKey] || null;
}
