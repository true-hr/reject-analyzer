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
  };
}

export const NEWGRAD_STRENGTH_REGISTRY = [
  makeEntry({
    id: "analytical_thinking",
    label: "분석적",
    category: "analysis",
    aliases: ["분석적 사고"],
    normalizedFrom: ["분석적"],
    scoringEligibleAxes: ["roleCharacter"],
    explanationEligibleAxes: ["roleCharacter"],
    excludeAxes: ["jobStructure", "industryContext", "responsibilityScope", "customerType"],
  }),
  makeEntry({
    id: "attention_to_detail",
    label: "꼼꼼함",
    category: "structured_execution",
    aliases: ["세밀함"],
    normalizedFrom: ["꼼꼼함"],
    scoringEligibleAxes: ["roleCharacter"],
    explanationEligibleAxes: ["roleCharacter"],
    excludeAxes: ["jobStructure", "industryContext", "responsibilityScope", "customerType"],
  }),
  makeEntry({
    id: "execution_speed",
    label: "빠른 실행력",
    category: "execution",
    aliases: ["실행력"],
    normalizedFrom: ["빠른 실행력"],
    scoringEligibleAxes: ["roleCharacter"],
    explanationEligibleAxes: ["roleCharacter"],
    excludeAxes: ["jobStructure", "industryContext", "responsibilityScope", "customerType"],
  }),
  makeEntry({
    id: "ownership",
    label: "책임감",
    category: "ownership",
    aliases: ["책임 의식"],
    normalizedFrom: ["책임감"],
    scoringEligibleAxes: ["roleCharacter"],
    explanationEligibleAxes: ["roleCharacter"],
    excludeAxes: ["jobStructure", "industryContext", "responsibilityScope", "customerType"],
  }),
  makeEntry({
    id: "communication",
    label: "커뮤니케이션",
    category: "communication",
    aliases: ["소통"],
    normalizedFrom: ["커뮤니케이션"],
    scoringEligibleAxes: ["roleCharacter"],
    explanationEligibleAxes: ["roleCharacter", "customerType"],
    evidenceOnlyAxes: ["customerType"],
    excludeAxes: ["jobStructure", "industryContext", "responsibilityScope"],
  }),
  makeEntry({
    id: "persuasion",
    label: "설득력",
    category: "communication",
    aliases: ["설득"],
    normalizedFrom: ["설득력"],
    scoringEligibleAxes: ["roleCharacter"],
    explanationEligibleAxes: ["roleCharacter", "customerType"],
    evidenceOnlyAxes: ["customerType"],
    excludeAxes: ["jobStructure", "industryContext", "responsibilityScope"],
  }),
  makeEntry({
    id: "empathy",
    label: "공감 능력",
    category: "interpersonal",
    aliases: ["공감"],
    normalizedFrom: ["공감 능력"],
    scoringEligibleAxes: ["roleCharacter"],
    explanationEligibleAxes: ["roleCharacter", "customerType"],
    evidenceOnlyAxes: ["customerType"],
    excludeAxes: ["jobStructure", "industryContext", "responsibilityScope"],
  }),
  makeEntry({
    id: "problem_solving",
    label: "문제 해결",
    category: "analysis",
    aliases: ["문제해결"],
    normalizedFrom: ["문제 해결"],
    scoringEligibleAxes: ["roleCharacter"],
    explanationEligibleAxes: ["roleCharacter"],
    excludeAxes: ["jobStructure", "industryContext", "responsibilityScope", "customerType"],
  }),
  makeEntry({
    id: "creativity",
    label: "창의성",
    category: "creative_improvement",
    aliases: ["창의"],
    normalizedFrom: ["창의성"],
    scoringEligibleAxes: ["roleCharacter"],
    explanationEligibleAxes: ["roleCharacter"],
    excludeAxes: ["jobStructure", "industryContext", "responsibilityScope", "customerType"],
  }),
  makeEntry({
    id: "collaboration_orientation",
    label: "협업 지향",
    category: "interpersonal",
    aliases: ["협업 선호"],
    normalizedFrom: ["협업 지향"],
    scoringEligibleAxes: ["roleCharacter"],
    explanationEligibleAxes: ["roleCharacter", "customerType"],
    evidenceOnlyAxes: ["customerType"],
    excludeAxes: ["jobStructure", "industryContext", "responsibilityScope"],
  }),
  makeEntry({
    id: "initiative",
    label: "주도성",
    category: "execution",
    aliases: ["주도"],
    normalizedFrom: ["주도성"],
    scoringEligibleAxes: ["roleCharacter"],
    explanationEligibleAxes: ["roleCharacter"],
    excludeAxes: ["jobStructure", "industryContext", "responsibilityScope", "customerType"],
  }),
  makeEntry({
    id: "learning_agility",
    label: "빠르게 배우는 편",
    category: "execution",
    aliases: ["빠르게 배우는", "빠르게배우는편"],
    normalizedFrom: ["빠르게 배우는 편"],
    scoringEligibleAxes: ["roleCharacter"],
    explanationEligibleAxes: ["roleCharacter"],
    excludeAxes: ["jobStructure", "industryContext", "responsibilityScope", "customerType"],
  }),
  makeEntry({
    id: "prioritization",
    label: "우선순위를 잘 정하는 편",
    category: "structured_execution",
    aliases: ["우선순위를 잘 정하는", "우선순위 잘 정하는 편"],
    normalizedFrom: ["우선순위를 잘 정하는 편"],
    scoringEligibleAxes: ["roleCharacter"],
    explanationEligibleAxes: ["roleCharacter"],
    excludeAxes: ["jobStructure", "industryContext", "responsibilityScope", "customerType"],
  }),
  makeEntry({
    id: "adaptability",
    label: "새로운 환경에 빨리 적응하는 편",
    category: "execution",
    aliases: ["새로운 환경에 빨리 적응하는", "빠르게 적응하는 편"],
    normalizedFrom: ["새로운 환경에 빨리 적응하는 편"],
    scoringEligibleAxes: ["roleCharacter"],
    explanationEligibleAxes: ["roleCharacter"],
    excludeAxes: ["jobStructure", "industryContext", "responsibilityScope", "customerType"],
  }),
  makeEntry({
    id: "diligence",
    label: "성실함",
    category: "ownership",
    aliases: ["성실성"],
    normalizedFrom: ["성실함"],
    scoringEligibleAxes: ["roleCharacter"],
    explanationEligibleAxes: ["roleCharacter"],
    excludeAxes: ["jobStructure", "industryContext", "responsibilityScope", "customerType"],
  }),
];

function normalizeToken(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s/()[\]{}.,:&+_-]+/g, "");
}

const STRENGTH_BY_ID = new Map(NEWGRAD_STRENGTH_REGISTRY.map((entry) => [entry.id, entry]));
const STRENGTH_BY_TOKEN = (() => {
  const map = new Map();
  for (const entry of NEWGRAD_STRENGTH_REGISTRY) {
    const tokens = [entry.label, ...entry.aliases, ...entry.normalizedFrom];
    for (const token of tokens) {
      const normalized = normalizeToken(token);
      if (!normalized || map.has(normalized)) continue;
      map.set(normalized, entry);
    }
  }
  return map;
})();

export function getNewgradStrengthEntryById(id) {
  return STRENGTH_BY_ID.get(String(id || "").trim()) || null;
}

export function findNewgradStrengthEntry(value) {
  const normalized = normalizeToken(value);
  return normalized ? (STRENGTH_BY_TOKEN.get(normalized) || null) : null;
}
