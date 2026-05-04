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
    aliases: ["분석적 사고", "숫자로 해석", "숫자로 분석", "수치 분석", "데이터로 판단", "정량 분석", "지표 해석"],
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
    aliases: ["소통", "논리적 설명", "말로 설명", "설명력"],
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
    aliases: ["문제해결", "구조화", "논리적 사고", "논리적으로 정리", "문제를 나누어 봄", "복잡한 문제 정리", "원인 분석", "프레임워크 사고"],
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
  makeEntry({
    id: "market_trend_analysis",
    label: "시장·트렌드 해석",
    category: "analysis",
    aliases: ["시장 해석", "시장을 해석", "숫자로 시장을 해석", "트렌드 관찰", "소비자 흐름", "소비자 행동 관찰", "시장 흐름 파악", "고객 반응 관찰", "경쟁 상황 관찰"],
    normalizedFrom: ["시장·트렌드 해석", "시장 해석"],
    scoringEligibleAxes: ["roleCharacter"],
    explanationEligibleAxes: ["roleCharacter"],
    excludeAxes: ["jobStructure", "industryContext", "responsibilityScope", "customerType"],
  }),
  makeEntry({
    id: "automation_driven_efficiency",
    label: "자동화·효율화 관심",
    category: "execution",
    aliases: ["자동화 관심", "자동화", "반복 업무 개선", "효율화", "업무 효율화", "프로세스 개선", "데이터 자동화", "엑셀 자동화"],
    normalizedFrom: ["자동화·효율화", "자동화 관심"],
    scoringEligibleAxes: ["roleCharacter"],
    explanationEligibleAxes: ["roleCharacter"],
    excludeAxes: ["jobStructure", "industryContext", "responsibilityScope", "customerType"],
  }),
  makeEntry({
    id: "documentation_clarity",
    label: "문서화·정리",
    category: "communication",
    aliases: ["글로 정리", "문서 정리", "기획서 정리", "보고서 정리", "정리력", "기록"],
    normalizedFrom: ["문서화·정리", "글로 정리"],
    scoringEligibleAxes: ["roleCharacter"],
    explanationEligibleAxes: ["roleCharacter"],
    excludeAxes: ["jobStructure", "industryContext", "responsibilityScope", "customerType"],
  }),
  makeEntry({
    id: "interpersonal_observation_coordination",
    label: "사람 관찰·조율",
    category: "interpersonal",
    aliases: ["사람 관찰", "갈등 조정", "사람의 고민 정리", "고민을 정리", "의견 조율", "커뮤니케이션 조율", "상대방 이해", "관계 조율", "멘토링", "상담"],
    normalizedFrom: ["사람 관찰·조율", "사람 관찰"],
    scoringEligibleAxes: ["roleCharacter"],
    explanationEligibleAxes: ["roleCharacter", "customerType"],
    evidenceOnlyAxes: ["customerType"],
    excludeAxes: ["jobStructure", "industryContext", "responsibilityScope"],
  }),
  makeEntry({
    id: "cost_financial_acumen",
    label: "비용·재무 감각",
    category: "analysis",
    aliases: ["비용 구조 파악", "비용 구조", "원가 감각", "예산 감각", "숫자 꼼꼼함", "비용 검토", "재무 감각", "손익 구조", "매출 비용 구조", "수익성 검토"],
    normalizedFrom: ["비용·재무 감각", "비용 구조 파악"],
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
