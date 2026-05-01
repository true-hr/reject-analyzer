export const TRANSITION_LITE_STRENGTH_TEXT_REGISTRY = {
  STRENGTH_JOB_CONTINUITY: {
    title: "직무 연속성",
    body: "핵심 기능이 크게 끊기지 않아, 기존 경험을 비교적 자연스럽게 이어서 설명할 수 있는 전환입니다.",
  },
  STRENGTH_FUNCTIONAL_EXPANSION: {
    title: "기능 확장 가능성",
    body: "기존 기능을 버리는 이동이라기보다, 인접 역할로 범위를 넓혀 해석할 수 있는 전환입니다.",
  },
  STRENGTH_DOMAIN_ADJACENCY: {
    title: "도메인 인접성",
    body: "산업이 완전히 낯선 방향이라기보다, 운영 구조나 시장 흐름의 연결점을 만들 수 있는 이동으로 읽힐 수 있습니다.",
  },
  STRENGTH_STRATEGY_TO_EXECUTION: {
    title: "상위 시야의 실행 연결",
    body: "구조와 방향을 보는 관점을 실제 실행 흐름과 연결할 수 있다는 점이 강점으로 작동할 수 있습니다.",
  },
  STRENGTH_EXECUTION_TO_STRATEGY: {
    title: "현장 감각의 판단 확장",
    body: "실행 경험을 바탕으로 더 넓은 우선순위 판단과 기획 관점으로 확장할 수 있다는 점이 긍정적으로 읽힐 수 있습니다.",
  },
  STRENGTH_GROWTH_SCOPE: {
    title: "범위 확장 스토리",
    body: "책임 범위가 넓어지는 이동은 성장 방향이 분명한 전환으로도 해석될 수 있습니다.",
  },
};

export function getTransitionLiteStrengthText(strengthKey) {
  return TRANSITION_LITE_STRENGTH_TEXT_REGISTRY[strengthKey] || null;
}
