function toStr(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function toArr(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalizeToken(value) {
  return toStr(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s/()[\]{}.,:&+_-]+/g, "");
}

function registerToken(index, token, entry) {
  const normalized = normalizeToken(token);
  if (!normalized) return;
  if (!index.has(normalized)) {
    index.set(normalized, entry);
  }
}

export const NEWGRAD_EXPERIENCE_TYPE_REGISTRY = [
  {
    id: "course_team_project",
    label: "수업 팀프로젝트",
    aliases: ["수업 프로젝트", "팀프로젝트"],
    sourceFields: ["type"],
    allowedInputGroups: ["projects"],
    industrySignalLevel: "weak",
    axisEligible: ["axis2"],
    notes: "산업 문맥 직접성은 낮지만 초기 신호로 반영",
  },
  {
    id: "capstone_graduation_project",
    label: "캡스톤 / 졸업프로젝트",
    aliases: ["캡스톤", "졸업프로젝트"],
    sourceFields: ["type"],
    allowedInputGroups: ["projects"],
    industrySignalLevel: "weak",
    axisEligible: ["axis2"],
    notes: "실전형 과제이지만 산업 문맥은 보조 신호로 사용",
  },
  {
    id: "bootcamp_project",
    label: "부트캠프 프로젝트",
    aliases: ["부트캠프"],
    sourceFields: ["type"],
    allowedInputGroups: ["projects"],
    industrySignalLevel: "weak",
    axisEligible: ["axis2"],
    notes: "학습형 실전 프로젝트 신호",
  },
  {
    id: "side_project",
    label: "사이드프로젝트",
    aliases: ["사이드 프로젝트"],
    sourceFields: ["type"],
    allowedInputGroups: ["projects"],
    industrySignalLevel: "weak",
    axisEligible: ["axis2"],
    notes: "자발성은 높지만 산업 문맥은 보조 신호로 사용",
  },
  {
    id: "contest_hackathon",
    label: "공모전 / 해커톤",
    aliases: ["공모전", "해커톤"],
    sourceFields: ["type"],
    allowedInputGroups: ["projects"],
    industrySignalLevel: "weak",
    axisEligible: ["axis2"],
    notes: "짧은 실전형 과제 신호",
  },
  {
    id: "thesis_research",
    label: "논문 / 연구",
    aliases: ["논문", "연구"],
    sourceFields: ["type"],
    allowedInputGroups: ["projects"],
    industrySignalLevel: "weak",
    axisEligible: ["axis2"],
    notes: "학업 기반 연구 산출물; 산업 맥락은 보조 신호",
  },
  {
    id: "capstone_independent",
    label: "졸업과제",
    aliases: ["졸업 과제", "졸업작품"],
    sourceFields: ["type"],
    allowedInputGroups: ["projects"],
    industrySignalLevel: "weak",
    axisEligible: ["axis2"],
    notes: "학업 기반 최종 과제; 실전형에 준하지만 산업 문맥은 보조 신호",
  },
  {
    id: "seasonal_internship",
    label: "여름 / 겨울 인턴",
    aliases: ["계절 인턴", "방학 인턴"],
    sourceFields: ["type"],
    allowedInputGroups: ["internships"],
    industrySignalLevel: "direct",
    axisEligible: ["axis2"],
    notes: "명시적 실무 문맥",
  },
  {
    id: "semester_internship",
    label: "학기 중 인턴",
    aliases: ["학기 인턴"],
    sourceFields: ["type"],
    allowedInputGroups: ["internships"],
    industrySignalLevel: "direct",
    axisEligible: ["axis2"],
    notes: "지속형 실무 문맥",
  },
  {
    id: "field_practicum",
    label: "현장실습",
    aliases: ["실습", "산학 실습"],
    sourceFields: ["type"],
    allowedInputGroups: ["internships"],
    industrySignalLevel: "direct",
    axisEligible: ["axis2"],
    notes: "현업 접점이 전제된 실전 경험",
  },
  {
    id: "experiential_internship",
    label: "체험형 인턴",
    aliases: ["체험형"],
    sourceFields: ["type"],
    allowedInputGroups: ["internships"],
    industrySignalLevel: "medium",
    axisEligible: ["axis2"],
    notes: "실무 관찰/보조 성격",
  },
  {
    id: "conversion_internship",
    label: "채용연계형 인턴",
    aliases: ["채용연계 인턴"],
    sourceFields: ["type"],
    allowedInputGroups: ["internships"],
    industrySignalLevel: "direct",
    axisEligible: ["axis2"],
    notes: "가장 강한 실무형 인턴 문맥",
  },
  {
    id: "short_term_contract",
    label: "단기 계약직",
    aliases: ["계약직"],
    sourceFields: ["type"],
    allowedInputGroups: ["contractExperiences"],
    industrySignalLevel: "direct",
    axisEligible: ["axis2"],
    notes: "인턴과 별개로 실무 투입형 계약 경험",
  },
  {
    id: "office_assistant_part_time",
    label: "사무 보조 / 파트타임",
    aliases: ["사무 보조", "파트타임"],
    sourceFields: ["type"],
    allowedInputGroups: ["contractExperiences"],
    industrySignalLevel: "medium",
    axisEligible: ["axis2"],
    notes: "지원형 실무 경험",
  },
  {
    id: "freelance_outsource",
    label: "프리랜서 / 외주",
    aliases: ["외주", "프리랜서"],
    sourceFields: ["type"],
    allowedInputGroups: ["contractExperiences"],
    industrySignalLevel: "direct",
    axisEligible: ["axis2"],
    notes: "외부 이해관계자 대응 가능성이 큰 실무 경험",
  },
  {
    id: "project_based_assignment",
    label: "프로젝트성 업무",
    aliases: ["프로젝트 업무"],
    sourceFields: ["type"],
    allowedInputGroups: ["contractExperiences"],
    industrySignalLevel: "direct",
    axisEligible: ["axis2"],
    notes: "정해진 실무 과업 중심 계약 경험",
  },
  {
    id: "other_practical_experience",
    label: "기타 실무 경험",
    aliases: ["기타 실무"],
    sourceFields: ["type"],
    allowedInputGroups: ["contractExperiences"],
    industrySignalLevel: "medium",
    axisEligible: ["axis2"],
    notes: "기타 실전형 경험",
  },
  {
    id: "practical_part_time",
    label: "실무성 아르바이트",
    aliases: ["실무 아르바이트", "직무 관련 아르바이트"],
    sourceFields: ["type"],
    allowedInputGroups: ["contractExperiences"],
    industrySignalLevel: "medium",
    axisEligible: ["axis2"],
    notes: "직무/산업 관련 실무성 있는 아르바이트; 단순 사무보조와 구분",
  },
];

const TYPE_BY_ID = new Map(NEWGRAD_EXPERIENCE_TYPE_REGISTRY.map((entry) => [entry.id, entry]));
const TYPE_ALIAS_INDEX = (() => {
  const index = new Map();
  for (const entry of NEWGRAD_EXPERIENCE_TYPE_REGISTRY) {
    registerToken(index, entry.id, entry);
    registerToken(index, entry.label, entry);
    for (const alias of toArr(entry.aliases)) {
      registerToken(index, alias, entry);
    }
  }
  return index;
})();

function isAllowed(entry, options = {}) {
  const sourceField = toStr(options.sourceField);
  const inputGroup = toStr(options.inputGroup);
  if (sourceField && !toArr(entry.sourceFields).includes(sourceField)) return false;
  if (inputGroup && !toArr(entry.allowedInputGroups).includes(inputGroup)) return false;
  return true;
}

export function getNewgradExperienceTypeById(id) {
  return TYPE_BY_ID.get(toStr(id)) || null;
}

export function normalizeNewgradExperienceType(value, options = {}) {
  const rawLabel = toStr(value);
  if (!rawLabel) return null;

  const matched = TYPE_ALIAS_INDEX.get(normalizeToken(rawLabel)) || null;
  const entry = matched && isAllowed(matched, options) ? matched : null;

  return {
    id: entry?.id || "",
    label: entry?.label || rawLabel,
    rawLabel,
    sourceField: toStr(options.sourceField),
    inputGroup: toStr(options.inputGroup),
    matched: Boolean(entry),
    industrySignalLevel: toStr(entry?.industrySignalLevel) || "none",
    axisEligible: toArr(entry?.axisEligible),
    notes: toStr(entry?.notes),
  };
}
