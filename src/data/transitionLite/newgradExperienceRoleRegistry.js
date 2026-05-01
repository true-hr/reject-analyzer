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

export const NEWGRAD_EXPERIENCE_ROLE_REGISTRY = [
  {
    id: "planning",
    label: "기획",
    aliases: ["서비스 기획", "사업 기획", "운영 기획", "전략 기획"],
    sourceFields: ["role", "roleFamily"],
    allowedInputGroups: ["projects", "internships", "contractExperiences"],
    relatedJobFamilies: ["BUSINESS", "FINANCE_ACCOUNTING", "PUBLIC_ADMINISTRATION_SUPPORT"],
    axisEligible: ["axis1"],
    notes: "직무 연결성 중심의 공통 기획 역할군",
  },
  {
    id: "marketing",
    label: "마케팅",
    aliases: ["콘텐츠 마케팅", "퍼포먼스 마케팅", "브랜드 마케팅"],
    sourceFields: ["role", "roleFamily"],
    allowedInputGroups: ["projects", "internships", "contractExperiences"],
    relatedJobFamilies: ["MARKETING", "SALES", "DESIGN"],
    axisEligible: ["axis1"],
    notes: "마케팅/브랜딩 문맥 역할군",
  },
  {
    id: "sales_business_development",
    label: "영업 / 사업개발",
    aliases: ["영업", "사업개발", "세일즈", "bizdev"],
    sourceFields: ["roleFamily"],
    allowedInputGroups: ["internships", "contractExperiences"],
    relatedJobFamilies: ["SALES", "BUSINESS", "CUSTOMER_OPERATIONS"],
    axisEligible: ["axis1"],
    notes: "인턴/계약 실전 경험 전용 역할군",
  },
  {
    id: "data_analytics",
    label: "데이터 / 분석",
    aliases: ["데이터 분석", "데이터/분석", "분석", "리서치"],
    sourceFields: ["role", "roleFamily"],
    allowedInputGroups: ["projects", "internships", "contractExperiences"],
    relatedJobFamilies: ["IT_DATA_DIGITAL", "RESEARCH_PROFESSIONAL", "FINANCE_ACCOUNTING", "MARKETING"],
    axisEligible: ["axis1"],
    notes: "데이터 분석/리서치 역할군",
  },
  {
    id: "design",
    label: "디자인",
    aliases: ["UX 디자인", "UI 디자인", "프로덕트 디자인", "시각 디자인"],
    sourceFields: ["role", "roleFamily"],
    allowedInputGroups: ["projects", "internships", "contractExperiences"],
    relatedJobFamilies: ["DESIGN", "MARKETING", "IT_DATA_DIGITAL"],
    axisEligible: ["axis1"],
    notes: "디자인 역할군",
  },
  {
    id: "frontend_development",
    label: "프론트엔드",
    aliases: ["프론트", "프런트엔드", "frontend"],
    sourceFields: ["role"],
    allowedInputGroups: ["projects"],
    relatedJobFamilies: ["ENGINEERING_DEVELOPMENT", "IT_DATA_DIGITAL", "DESIGN"],
    axisEligible: ["axis1"],
    notes: "프로젝트 입력 전용 세부 개발 역할군",
  },
  {
    id: "backend_development",
    label: "백엔드",
    aliases: ["백엔드 개발", "backend", "서버 개발"],
    sourceFields: ["role"],
    allowedInputGroups: ["projects"],
    relatedJobFamilies: ["ENGINEERING_DEVELOPMENT", "IT_DATA_DIGITAL"],
    axisEligible: ["axis1"],
    notes: "프로젝트 입력 전용 세부 개발 역할군",
  },
  {
    id: "development",
    label: "개발",
    aliases: ["소프트웨어 개발", "웹 개발", "앱 개발", "엔지니어링"],
    sourceFields: ["roleFamily"],
    allowedInputGroups: ["internships", "contractExperiences"],
    relatedJobFamilies: ["ENGINEERING_DEVELOPMENT", "IT_DATA_DIGITAL"],
    axisEligible: ["axis1"],
    notes: "인턴/계약 실전 경험용 포괄 개발 역할군",
  },
  {
    id: "operations_customer_support",
    label: "운영 / 고객지원",
    aliases: ["고객지원", "CS", "서비스 운영", "커뮤니티 운영"],
    sourceFields: ["roleFamily"],
    allowedInputGroups: ["internships", "contractExperiences"],
    relatedJobFamilies: ["CUSTOMER_OPERATIONS", "PROCUREMENT_SCM", "EDUCATION_COUNSELING_COACHING"],
    axisEligible: ["axis1"],
    notes: "대면 접점이 있는 운영 역할군",
  },
  {
    id: "operations_support",
    label: "운영 / 지원",
    aliases: ["운영", "사무 지원", "백오피스", "운영 지원"],
    sourceFields: ["role"],
    allowedInputGroups: ["projects"],
    relatedJobFamilies: ["CUSTOMER_OPERATIONS", "PROCUREMENT_SCM", "MANUFACTURING_QUALITY_PRODUCTION"],
    axisEligible: ["axis1"],
    notes: "프로젝트 입력 전용 운영 역할군",
  },
  {
    id: "hr_management_support",
    label: "인사 / 경영지원",
    aliases: ["인사", "경영지원", "채용", "HR", "총무"],
    sourceFields: ["roleFamily"],
    allowedInputGroups: ["internships", "contractExperiences"],
    relatedJobFamilies: ["HR_ORGANIZATION", "BUSINESS", "PUBLIC_ADMINISTRATION_SUPPORT"],
    axisEligible: ["axis1"],
    notes: "인사/지원 문맥 역할군",
  },
];

const ROLE_BY_ID = new Map(NEWGRAD_EXPERIENCE_ROLE_REGISTRY.map((entry) => [entry.id, entry]));
const ROLE_ALIAS_INDEX = (() => {
  const index = new Map();
  for (const entry of NEWGRAD_EXPERIENCE_ROLE_REGISTRY) {
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

export function getNewgradExperienceRoleById(id) {
  return ROLE_BY_ID.get(toStr(id)) || null;
}

export function normalizeNewgradExperienceRole(value, options = {}) {
  const rawLabel = toStr(value);
  if (!rawLabel) return null;

  const matched = ROLE_ALIAS_INDEX.get(normalizeToken(rawLabel)) || null;
  const entry = matched && isAllowed(matched, options) ? matched : null;

  return {
    id: entry?.id || "",
    label: entry?.label || rawLabel,
    rawLabel,
    sourceField: toStr(options.sourceField),
    inputGroup: toStr(options.inputGroup),
    matched: Boolean(entry),
    relatedJobFamilies: toArr(entry?.relatedJobFamilies),
    axisEligible: toArr(entry?.axisEligible),
    notes: toStr(entry?.notes),
  };
}
