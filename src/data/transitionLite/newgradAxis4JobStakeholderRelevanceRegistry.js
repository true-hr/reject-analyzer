import { resolveNewgradStakeholderDisplayLabel } from "./newgradStakeholderTaxonomyRegistry.js";

function toStr(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function uniqueKeys(items = []) {
  return [...new Set((Array.isArray(items) ? items : []).map((item) => toStr(item)).filter(Boolean))];
}

const DEFAULT_RELEVANCE = Object.freeze({
  primary: Object.freeze(["customer_user", "cross_function_partner", "manager_reviewer"]),
  secondary: Object.freeze(["internal_team", "external_partner_vendor", "field_practitioner_operator"]),
  tertiary: Object.freeze(["community_audience", "candidate_applicant", "learner_participant", "public_citizen", "executive_decision_maker"]),
  rationale: "대부분의 신입 직무는 외부 상대뿐 아니라 내부 협업 상대와의 직접 소통 경험을 함께 봅니다.",
});

export const NEWGRAD_AXIS4_JOB_STAKEHOLDER_RELEVANCE = Object.freeze({
  JOB_BUSINESS_SERVICE_PLANNING: {
    primary: ["customer_user", "cross_function_partner", "manager_reviewer"],
    secondary: ["internal_team", "field_practitioner_operator"],
    tertiary: ["external_partner_vendor"],
    rationale: "서비스기획은 사용자 이해와 함께 개발·디자인·운영 등 타직무 협업 상대와의 조율 경험이 중요하다.",
  },
  JOB_MARKETING_CONTENT_MARKETING: {
    primary: ["customer_user", "external_partner_vendor", "community_audience"],
    secondary: ["cross_function_partner", "manager_reviewer"],
    tertiary: ["internal_team"],
    rationale: "콘텐츠 마케팅은 사용자 반응, 외부 제작·운영 파트너, 캠페인 실행 협업 상대와의 소통이 중요하다.",
  },
  JOB_MARKETING_PERFORMANCE_MARKETING: {
    primary: ["customer_user", "external_partner_vendor", "manager_reviewer"],
    secondary: ["cross_function_partner", "community_audience"],
    tertiary: ["internal_team"],
    rationale: "퍼포먼스 마케팅은 고객·사용자 데이터 해석과 매체·대행사·내부 의사결정자 커뮤니케이션이 중요하다.",
  },
  JOB_MARKETING_BRAND_MARKETING: {
    primary: ["customer_user", "external_partner_vendor", "community_audience"],
    secondary: ["cross_function_partner", "manager_reviewer"],
    tertiary: ["internal_team"],
    rationale: "브랜드 마케팅은 소비자 반응과 외부 파트너, 내부 협업 상대와의 메시지 조율이 중요하다.",
  },
  JOB_SALES_B2B_SALES: {
    primary: ["customer_user", "executive_decision_maker", "external_partner_vendor"],
    secondary: ["manager_reviewer", "field_practitioner_operator"],
    tertiary: ["internal_team"],
    rationale: "영업은 고객사 실무자와 의사결정자, 외부 파트너와의 직접 접점이 중요하다.",
  },
  JOB_HR_ORGANIZATION_RECRUITING: {
    primary: ["candidate_applicant", "manager_reviewer", "internal_team"],
    secondary: ["external_partner_vendor", "cross_function_partner"],
    tertiary: ["customer_user"],
    rationale: "채용은 지원자와 현업 담당자, 내부 조직과의 조율 경험이 핵심이다.",
  },
  JOB_PROCUREMENT_SCM_PURCHASING: {
    primary: ["external_partner_vendor", "cross_function_partner", "manager_reviewer"],
    secondary: ["field_practitioner_operator", "internal_team"],
    tertiary: ["customer_user"],
    rationale: "구매는 협력사 및 내부 현업과의 조율, 조건 협의, 커뮤니케이션이 중요하다.",
  },
  JOB_PROCUREMENT_SCM_SCM: {
    primary: ["cross_function_partner", "external_partner_vendor", "field_practitioner_operator"],
    secondary: ["internal_team", "manager_reviewer"],
    tertiary: ["customer_user"],
    rationale: "SCM은 공급망 파트너와 내부 운영 부서 간 조율이 중요하다.",
  },
  JOB_PROCUREMENT_SCM_LOGISTICS: {
    primary: ["cross_function_partner", "external_partner_vendor", "field_practitioner_operator"],
    secondary: ["internal_team", "manager_reviewer"],
    tertiary: ["customer_user"],
    rationale: "물류는 운송·협력사와 내부 운영 조율이 중요하다.",
  },
  JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS: {
    primary: ["customer_user", "cross_function_partner", "manager_reviewer"],
    secondary: ["internal_team", "field_practitioner_operator"],
    tertiary: ["external_partner_vendor"],
    rationale: "CS는 고객 응대뿐 아니라 내부 escalation 및 해결 조율이 중요하다.",
  },
  JOB_CUSTOMER_OPERATIONS_OPERATION_PLANNING: {
    primary: ["cross_function_partner", "internal_team", "manager_reviewer"],
    secondary: ["field_practitioner_operator", "customer_user"],
    tertiary: ["external_partner_vendor"],
    rationale: "운영기획은 내부 협업과 운영 조율이 핵심이다.",
  },
  JOB_BUSINESS_OPERATIONS_MANAGEMENT: {
    primary: ["cross_function_partner", "internal_team", "manager_reviewer"],
    secondary: ["field_practitioner_operator", "customer_user"],
    tertiary: ["external_partner_vendor"],
    rationale: "사업운영은 현업 부서와의 반복 조율과 운영 흐름을 맞추는 소통이 중요하다.",
  },
  JOB_IT_DATA_DIGITAL_DATA_ANALYSIS: {
    primary: ["cross_function_partner", "manager_reviewer", "internal_team"],
    secondary: ["customer_user", "field_practitioner_operator"],
    tertiary: ["external_partner_vendor"],
    rationale: "데이터 분석은 내부 이해관계자의 요구 정리와 해석 전달이 중요하다.",
  },
  JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT: {
    primary: ["cross_function_partner", "manager_reviewer", "internal_team"],
    secondary: ["field_practitioner_operator"],
    tertiary: ["customer_user", "external_partner_vendor"],
    rationale: "백엔드 개발은 고객 직접 응대보다 내부 협업과 요구사항 조율 경험이 더 중요하다.",
  },
  JOB_DESIGN_UX_DESIGN: {
    primary: ["customer_user", "cross_function_partner", "manager_reviewer"],
    secondary: ["internal_team", "field_practitioner_operator"],
    tertiary: ["external_partner_vendor"],
    rationale: "UX 디자인은 사용자 이해와 개발·기획 협업이 중요하다.",
  },
  JOB_ENGINEERING_DEVELOPMENT_RESEARCH_AND_DEVELOPMENT: {
    primary: ["cross_function_partner", "manager_reviewer", "field_practitioner_operator"],
    secondary: ["internal_team"],
    tertiary: ["customer_user", "external_partner_vendor"],
    rationale: "R&D는 내부 연구 협업과 검토·보고·실험 조율 경험이 중요하다.",
  },
  JOB_EDUCATION_COUNSELING_COACHING_LEARNING_DESIGN: {
    primary: ["learner_participant", "manager_reviewer", "internal_team"],
    secondary: ["community_audience", "cross_function_partner"],
    tertiary: ["customer_user"],
    rationale: "교육기획은 학습자와 내부 운영·검토자, 프로그램 참여자와의 소통이 중요하다.",
  },
  JOB_PUBLIC_ADMINISTRATION_SUPPORT_PUBLIC_PROGRAM_OPERATIONS: {
    primary: ["public_citizen", "cross_function_partner", "manager_reviewer"],
    secondary: ["community_audience", "internal_team"],
    tertiary: ["customer_user", "external_partner_vendor"],
    rationale: "공공 프로그램 운영은 시민·참여자와 내부 협업, 공공 맥락 조율이 중요하다.",
  },
});

export function getAxis4StakeholderRelevanceByJobId(targetJobId) {
  const normalizedJobId = toStr(targetJobId);
  const entry = NEWGRAD_AXIS4_JOB_STAKEHOLDER_RELEVANCE[normalizedJobId] || DEFAULT_RELEVANCE;
  const primary = uniqueKeys(entry.primary);
  const secondary = uniqueKeys(entry.secondary).filter((key) => !primary.includes(key));
  const tertiary = uniqueKeys(entry.tertiary).filter((key) => !primary.includes(key) && !secondary.includes(key));

  return {
    jobId: normalizedJobId,
    primary,
    secondary,
    tertiary,
    rationale: toStr(entry.rationale || DEFAULT_RELEVANCE.rationale),
    primaryLabels: primary.map((key) => resolveNewgradStakeholderDisplayLabel(key)),
    secondaryLabels: secondary.map((key) => resolveNewgradStakeholderDisplayLabel(key)),
    tertiaryLabels: tertiary.map((key) => resolveNewgradStakeholderDisplayLabel(key)),
  };
}

export function getDefaultAxis4StakeholderRelevance() {
  return getAxis4StakeholderRelevanceByJobId("");
}
