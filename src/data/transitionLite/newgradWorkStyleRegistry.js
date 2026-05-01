function makeEntry({
  id,
  label,
  category,
  aliases = [],
  normalizedFrom = [],
  allowedAudience = ["newgrad"],
  scoringEligibleAxes = [],
  explanationEligibleAxes = [],
  evidenceOnlyAxes = [],
  excludeAxes = [],
  interactionEligible = false,
}) {
  return {
    id,
    label,
    category,
    aliases,
    normalizedFrom,
    allowedAudience,
    scoringEligibleAxes,
    explanationEligibleAxes,
    evidenceOnlyAxes,
    excludeAxes,
    interactionEligible,
  };
}

export const NEWGRAD_WORKSTYLE_REGISTRY = [
  makeEntry({
    id: "solo_deep_dive",
    label: "혼자 깊게 파고드는 편",
    category: "analysis",
    aliases: ["깊게 파고드는 편"],
    normalizedFrom: ["혼자 깊게 파고드는 편"],
    scoringEligibleAxes: ["roleCharacter"],
    explanationEligibleAxes: ["roleCharacter"],
    excludeAxes: ["jobStructure", "industryContext", "responsibilityScope", "customerType"],
  }),
  makeEntry({
    id: "frequent_communication",
    label: "사람들과 자주 소통하는 편",
    category: "communication",
    aliases: ["자주 소통하는 편"],
    normalizedFrom: ["사람들과 자주 소통하는 편"],
    scoringEligibleAxes: ["roleCharacter", "customerType"],
    explanationEligibleAxes: ["roleCharacter", "customerType"],
    excludeAxes: ["jobStructure", "industryContext", "responsibilityScope"],
    interactionEligible: true,
  }),
  makeEntry({
    id: "structured_working",
    label: "정리하고 구조화하는 편",
    category: "structured_execution",
    aliases: ["구조화하는 편"],
    normalizedFrom: ["정리하고 구조화하는 편"],
    scoringEligibleAxes: ["roleCharacter"],
    explanationEligibleAxes: ["roleCharacter"],
    evidenceOnlyAxes: ["customerType"],
    excludeAxes: ["jobStructure", "industryContext", "responsibilityScope"],
  }),
  makeEntry({
    id: "context_first",
    label: "배경과 맥락을 먼저 파악하는 편",
    category: "analysis",
    aliases: ["배경과 맥락을 먼저 파악하는", "맥락을 먼저 파악하는 편"],
    normalizedFrom: ["배경과 맥락을 먼저 파악하는 편"],
    scoringEligibleAxes: ["roleCharacter"],
    explanationEligibleAxes: ["roleCharacter"],
    evidenceOnlyAxes: ["customerType"],
    excludeAxes: ["jobStructure", "industryContext", "responsibilityScope"],
  }),
  makeEntry({
    id: "evidence_based_judgment",
    label: "데이터·근거를 확인하고 판단하는 편",
    category: "analysis",
    aliases: ["데이터 근거를 확인하고 판단하는 편", "근거를 확인하고 판단하는 편"],
    normalizedFrom: ["데이터·근거를 확인하고 판단하는 편"],
    scoringEligibleAxes: ["roleCharacter"],
    explanationEligibleAxes: ["roleCharacter"],
    evidenceOnlyAxes: ["customerType"],
    excludeAxes: ["jobStructure", "industryContext", "responsibilityScope"],
  }),
  makeEntry({
    id: "rapid_iteration",
    label: "빠르게 시도하고 개선하는 편",
    category: "execution",
    aliases: ["빠르게 개선하는 편"],
    normalizedFrom: ["빠르게 시도하고 개선하는 편"],
    scoringEligibleAxes: ["roleCharacter"],
    explanationEligibleAxes: ["roleCharacter"],
    evidenceOnlyAxes: ["customerType"],
    excludeAxes: ["jobStructure", "industryContext", "responsibilityScope"],
  }),
  makeEntry({
    id: "error_detection",
    label: "세부 오류를 잘 발견하는 편",
    category: "structured_execution",
    aliases: ["오류를 잘 발견하는 편"],
    normalizedFrom: ["세부 오류를 잘 발견하는 편"],
    scoringEligibleAxes: ["roleCharacter"],
    explanationEligibleAxes: ["roleCharacter"],
    evidenceOnlyAxes: ["customerType"],
    excludeAxes: ["jobStructure", "industryContext", "responsibilityScope"],
  }),
  makeEntry({
    id: "need_sensing",
    label: "상대 니즈를 파악하는 편",
    category: "interpersonal",
    aliases: ["니즈를 파악하는 편"],
    normalizedFrom: ["상대 니즈를 파악하는 편"],
    scoringEligibleAxes: ["roleCharacter", "customerType"],
    explanationEligibleAxes: ["roleCharacter", "customerType"],
    excludeAxes: ["jobStructure", "industryContext", "responsibilityScope"],
    interactionEligible: true,
  }),
  makeEntry({
    id: "end_to_end_ownership",
    label: "끝까지 책임지고 마무리하는 편",
    category: "ownership",
    aliases: ["끝까지 마무리하는 편"],
    normalizedFrom: ["끝까지 책임지고 마무리하는 편"],
    scoringEligibleAxes: ["roleCharacter"],
    explanationEligibleAxes: ["roleCharacter"],
    evidenceOnlyAxes: ["customerType"],
    excludeAxes: ["jobStructure", "industryContext", "responsibilityScope"],
  }),
  makeEntry({
    id: "stepwise_prioritization",
    label: "우선순위를 정해 차근차근 처리하는 편",
    category: "structured_execution",
    aliases: ["우선순위를 정해 차근차근 처리하는", "차근차근 처리하는 편"],
    normalizedFrom: ["우선순위를 정해 차근차근 처리하는 편"],
    scoringEligibleAxes: ["roleCharacter"],
    explanationEligibleAxes: ["roleCharacter"],
    evidenceOnlyAxes: ["customerType"],
    excludeAxes: ["jobStructure", "industryContext", "responsibilityScope"],
  }),
  makeEntry({
    id: "idea_generation",
    label: "새로운 아이디어를 자주 내는 편",
    category: "creative_improvement",
    aliases: ["아이디어를 자주 내는 편"],
    normalizedFrom: ["새로운 아이디어를 자주 내는 편"],
    scoringEligibleAxes: ["roleCharacter"],
    explanationEligibleAxes: ["roleCharacter"],
    evidenceOnlyAxes: ["customerType"],
    excludeAxes: ["jobStructure", "industryContext", "responsibilityScope"],
  }),
];

function normalizeToken(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s/()[\]{}.,:&+_-]+/g, "");
}

const WORKSTYLE_BY_ID = new Map(NEWGRAD_WORKSTYLE_REGISTRY.map((entry) => [entry.id, entry]));
const WORKSTYLE_BY_TOKEN = (() => {
  const map = new Map();
  for (const entry of NEWGRAD_WORKSTYLE_REGISTRY) {
    const tokens = [entry.label, ...entry.aliases, ...entry.normalizedFrom];
    for (const token of tokens) {
      const normalized = normalizeToken(token);
      if (!normalized || map.has(normalized)) continue;
      map.set(normalized, entry);
    }
  }
  return map;
})();

export function getNewgradWorkStyleEntryById(id) {
  return WORKSTYLE_BY_ID.get(String(id || "").trim()) || null;
}

export function findNewgradWorkStyleEntry(value) {
  const normalized = normalizeToken(value);
  return normalized ? (WORKSTYLE_BY_TOKEN.get(normalized) || null) : null;
}
