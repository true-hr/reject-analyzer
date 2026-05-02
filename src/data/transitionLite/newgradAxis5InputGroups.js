/**
 * Axis5 강점/일하는 방식 → 해석 그룹 매핑
 *
 * 역할: 15개 강점 + 11개 일하는 방식을 7+6 해석 그룹으로 정규화
 * 설계 참고: docs/product/newgrad-axis5-input-grouping-design.md
 */

// ===== STRENGTH GROUPS (7개) =====

export const STRENGTH_GROUPS = {
  ANALYTICAL_PROBLEM_SOLVER: {
    id: "ANALYTICAL_PROBLEM_SOLVER",
    label: "분석·문제해결형",
    aliases: ["분석", "문제해결", "데이터기반"],
    description: "논리적 분석과 문제 해결에 강한 유형",
  },
  PRECISION_QUALITY_FOCUSED: {
    id: "PRECISION_QUALITY_FOCUSED",
    label: "정확·품질관리형",
    aliases: ["정확", "꼼꼼", "품질"],
    description: "세부 사항에 주의하고 오류 방지에 강한 유형",
  },
  EXECUTION_RESPONSIBILITY: {
    id: "EXECUTION_RESPONSIBILITY",
    label: "실행·책임형",
    aliases: ["실행", "책임감", "주도성"],
    description: "빠르게 행동하고 끝까지 책임지는 유형",
  },
  PRIORITIZATION_JUDGMENT: {
    id: "PRIORITIZATION_JUDGMENT",
    label: "우선순위·판단형",
    aliases: ["우선순위", "판단", "전략적"],
    description: "중요도를 판단하고 체계적으로 처리하는 유형",
  },
  COMMUNICATION_PERSUASION: {
    id: "COMMUNICATION_PERSUASION",
    label: "소통·설득형",
    aliases: ["소통", "설득", "커뮤니케이션"],
    description: "효과적인 의사전달과 설득에 능한 유형",
  },
  EMPATHY_COLLABORATION: {
    id: "EMPATHY_COLLABORATION",
    label: "공감·협업형",
    aliases: ["공감", "협업", "배려"],
    description: "타인의 감정을 이해하고 함께 일하는 유형",
  },
  CREATIVITY_LEARNING_ADAPTABLE: {
    id: "CREATIVITY_LEARNING_ADAPTABLE",
    label: "창의·학습·적응형",
    aliases: ["창의", "학습", "적응"],
    description: "새로운 아이디어를 내고 빠르게 학습하며 변화에 적응하는 유형",
  },
};

// 강점 key → strengthGroup ID 매핑
export const STRENGTH_KEY_TO_GROUP_ID = {
  analytical_thinking: "ANALYTICAL_PROBLEM_SOLVER",
  problem_solving: "ANALYTICAL_PROBLEM_SOLVER",
  attention_to_detail: "PRECISION_QUALITY_FOCUSED",
  execution_speed: "EXECUTION_RESPONSIBILITY",
  ownership: "EXECUTION_RESPONSIBILITY",
  initiative: "EXECUTION_RESPONSIBILITY",
  prioritization: "PRIORITIZATION_JUDGMENT",
  communication: "COMMUNICATION_PERSUASION",
  persuasion: "COMMUNICATION_PERSUASION",
  empathy: "EMPATHY_COLLABORATION",
  collaboration_orientation: "EMPATHY_COLLABORATION",
  creativity: "CREATIVITY_LEARNING_ADAPTABLE",
  learning_agility: "CREATIVITY_LEARNING_ADAPTABLE",
  adaptability: "CREATIVITY_LEARNING_ADAPTABLE",
  diligence: "EXECUTION_RESPONSIBILITY",
};

// ===== WORKSTYLE GROUPS (6개) =====

export const WORKSTYLE_GROUPS = {
  SOLO_FOCUSED: {
    id: "SOLO_FOCUSED",
    label: "독립몰입형",
    aliases: ["혼자", "집중", "깊이"],
    description: "혼자 깊이 있게 일하는 것을 선호",
  },
  COMMUNICATION_COLLABORATIVE: {
    id: "COMMUNICATION_COLLABORATIVE",
    label: "소통협업형",
    aliases: ["소통", "협업", "상호작용"],
    description: "사람들과 자주 상호작용하고 협력하는 것을 선호",
  },
  STRUCTURED_EXECUTION: {
    id: "STRUCTURED_EXECUTION",
    label: "구조화진행형",
    aliases: ["구조화", "체계적", "순서대로"],
    description: "체계적으로 정리하고 순서대로 처리하는 것을 선호",
  },
  EVIDENCE_BASED: {
    id: "EVIDENCE_BASED",
    label: "근거검증형",
    aliases: ["근거", "검증", "데이터"],
    description: "데이터와 근거를 먼저 확인하고 판단하는 것을 선호",
  },
  RAPID_ITERATION: {
    id: "RAPID_ITERATION",
    label: "실행개선형",
    aliases: ["실행", "개선", "반복"],
    description: "빠르게 시도하고 개선하는 것을 선호",
  },
  IDEA_EXPLORATION: {
    id: "IDEA_EXPLORATION",
    label: "아이디어탐색형",
    aliases: ["아이디어", "새로운", "창의"],
    description: "새로운 아이디어를 탐색하고 발전시키는 것을 선호",
  },
};

// 일하는 방식 key → workStyleGroup ID 매핑
export const WORKSTYLE_KEY_TO_GROUP_ID = {
  solo_deep_dive: "SOLO_FOCUSED",
  frequent_communication: "COMMUNICATION_COLLABORATIVE",
  need_sensing: "COMMUNICATION_COLLABORATIVE",
  structured_working: "STRUCTURED_EXECUTION",
  stepwise_prioritization: "STRUCTURED_EXECUTION",
  error_detection: "STRUCTURED_EXECUTION",
  context_first: "EVIDENCE_BASED",
  evidence_based_judgment: "EVIDENCE_BASED",
  rapid_iteration: "RAPID_ITERATION",
  end_to_end_ownership: "RAPID_ITERATION",
  idea_generation: "IDEA_EXPLORATION",
};

// ===== Utility Functions =====

export function getStrengthGroup(strengthKey) {
  if (!strengthKey) return null;
  const groupId = STRENGTH_KEY_TO_GROUP_ID[strengthKey];
  if (!groupId) return null;
  return STRENGTH_GROUPS[groupId] || null;
}

export function getWorkStyleGroup(workStyleKey) {
  if (!workStyleKey) return null;
  const groupId = WORKSTYLE_KEY_TO_GROUP_ID[workStyleKey];
  if (!groupId) return null;
  return WORKSTYLE_GROUPS[groupId] || null;
}

export function getStrengthGroups(strengthKeys = []) {
  const groups = [];
  const seen = new Set();

  for (const key of strengthKeys) {
    const group = getStrengthGroup(key);
    if (group && !seen.has(group.id)) {
      groups.push(group);
      seen.add(group.id);
    }
  }

  return groups;
}

export function getWorkStyleGroups(workStyleKeys = []) {
  const groups = [];
  const seen = new Set();

  for (const key of workStyleKeys) {
    const group = getWorkStyleGroup(key);
    if (group && !seen.has(group.id)) {
      groups.push(group);
      seen.add(group.id);
    }
  }

  return groups;
}

export default {
  STRENGTH_GROUPS,
  WORKSTYLE_GROUPS,
  STRENGTH_KEY_TO_GROUP_ID,
  WORKSTYLE_KEY_TO_GROUP_ID,
  getStrengthGroup,
  getWorkStyleGroup,
  getStrengthGroups,
  getWorkStyleGroups,
};
