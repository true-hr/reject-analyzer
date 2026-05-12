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
    aliases: ["서비스 기획", "사업 기획", "운영 기획", "전략 기획", "PM", "PO", "서비스기획", "PM/PO", "프로덕트 매니저"],
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
    aliases: ["UX 디자인", "UI 디자인", "프로덕트 디자인", "시각 디자인", "영상편집", "브랜드 제작", "영상 제작", "콘텐츠 디자인", "그래픽 제작"],
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
    aliases: ["고객지원", "CS", "서비스 운영", "커뮤니티 운영", "고객성공", "CS 운영", "세일즈 운영", "Sales Ops", "Customer Success"],
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
  {
    id: "merchandise_ecommerce_ops",
    label: "상품 / MD / 이커머스 운영",
    aliases: ["상품 운영", "MD", "이커머스 운영", "커머스 운영", "온라인몰 운영", "상품관리"],
    sourceFields: ["role", "roleFamily"],
    allowedInputGroups: ["projects", "internships", "contractExperiences"],
    relatedJobFamilies: ["PROCUREMENT_SCM", "CUSTOMER_OPERATIONS", "BUSINESS"],
    axisEligible: ["axis1"],
    notes: "이커머스/MD/상품 운영 역할군",
  },
  {
    id: "content_sns_media_ops",
    label: "콘텐츠 / SNS 운영",
    aliases: ["콘텐츠 운영", "SNS 운영", "소셜미디어 운영", "미디어 운영", "카드뉴스", "콘텐츠 제작"],
    sourceFields: ["role", "roleFamily"],
    allowedInputGroups: ["projects", "internships", "contractExperiences"],
    relatedJobFamilies: ["MARKETING", "DESIGN"],
    axisEligible: ["axis1"],
    notes: "콘텐츠/SNS/미디어 운영 역할군",
  },
  {
    id: "education_counseling_coaching_ops",
    label: "교육 / 상담 / 코칭",
    aliases: ["교육 운영", "상담 운영", "코칭", "멘토링", "교육 보조", "학습관리"],
    sourceFields: ["role", "roleFamily"],
    allowedInputGroups: ["projects", "internships", "contractExperiences"],
    relatedJobFamilies: ["EDUCATION_COUNSELING_COACHING", "HR_ORGANIZATION"],
    axisEligible: ["axis1"],
    notes: "교육/상담/코칭 운영 역할군",
  },
  {
    id: "finance_accounting_support",
    label: "재무 / 회계 / 세무 보조",
    aliases: ["회계 보조", "재무 보조", "세무 보조", "정산", "전표", "비용처리"],
    sourceFields: ["role", "roleFamily"],
    allowedInputGroups: ["projects", "internships", "contractExperiences"],
    relatedJobFamilies: ["FINANCE_ACCOUNTING"],
    axisEligible: ["axis1"],
    notes: "재무/회계/세무 보조 역할군",
  },
  {
    id: "procurement_scm_logistics",
    label: "구매 / SCM / 물류",
    aliases: ["구매", "SCM", "물류", "발주", "재고관리", "공급망", "물류 운영"],
    sourceFields: ["role", "roleFamily"],
    allowedInputGroups: ["internships", "contractExperiences"],
    relatedJobFamilies: ["PROCUREMENT_SCM"],
    axisEligible: ["axis1"],
    notes: "구매/SCM/물류 역할군",
  },
  {
    id: "manufacturing_quality_production_ops",
    label: "제조 / 생산 / 품질 보조",
    aliases: ["제조", "생산", "품질", "품질관리", "QC", "QA", "공정", "생산관리", "공정관리"],
    sourceFields: ["role", "roleFamily"],
    allowedInputGroups: ["projects", "internships", "contractExperiences"],
    relatedJobFamilies: ["MANUFACTURING_QUALITY_PRODUCTION", "ENGINEERING_DEVELOPMENT"],
    axisEligible: ["axis1"],
    notes: "제조/생산/품질 보조 역할군",
  },
  {
    id: "research_lab_rd_support",
    label: "연구 / R&D / 실험 보조",
    aliases: ["연구", "R&D", "실험", "실험보조", "랩", "연구보조", "분석 보조"],
    sourceFields: ["role", "roleFamily"],
    allowedInputGroups: ["projects", "internships", "contractExperiences"],
    relatedJobFamilies: ["RESEARCH_PROFESSIONAL", "ENGINEERING_DEVELOPMENT"],
    axisEligible: ["axis1"],
    notes: "연구/R&D/실험 보조 역할군",
  },
  {
    id: "legal_compliance_public_admin",
    label: "법무 / 공공행정",
    aliases: ["법무", "컴플라이언스", "준법", "공공행정", "행정", "정책", "민원"],
    sourceFields: ["role", "roleFamily"],
    allowedInputGroups: ["internships", "contractExperiences"],
    relatedJobFamilies: ["PUBLIC_ADMINISTRATION_SUPPORT", "BUSINESS"],
    axisEligible: ["axis1"],
    notes: "법무/컴플라이언스/공공행정 역할군",
  },
  {
    id: "field_service_retail_ops",
    label: "매장 / 현장운영 / 서비스",
    aliases: ["매장 운영", "현장 운영", "서비스", "리테일", "판매", "접객", "현장관리"],
    sourceFields: ["role", "roleFamily"],
    allowedInputGroups: ["internships", "contractExperiences"],
    relatedJobFamilies: ["CUSTOMER_OPERATIONS"],
    axisEligible: ["axis1"],
    notes: "매장/현장운영/서비스 역할군",
  },
  {
    id: "data_labeling_ai_qa_ops",
    label: "데이터 라벨링 / AI 운영 / QA",
    aliases: ["데이터 라벨링", "AI 운영", "AI 데이터", "QA 테스트", "테스트", "검수", "데이터 검수"],
    sourceFields: ["role", "roleFamily"],
    allowedInputGroups: ["internships", "contractExperiences"],
    relatedJobFamilies: ["IT_DATA_DIGITAL", "RESEARCH_PROFESSIONAL"],
    axisEligible: ["axis1"],
    notes: "데이터 라벨링/AI 운영/QA 역할군",
  },
  {
    id: "pr_public_relations_comms",
    label: "홍보 / PR / 대외협력",
    aliases: ["홍보", "PR", "대외협력", "커뮤니케이션", "언론홍보", "보도자료"],
    sourceFields: ["role", "roleFamily"],
    allowedInputGroups: ["projects", "internships", "contractExperiences"],
    relatedJobFamilies: ["MARKETING", "BUSINESS"],
    axisEligible: ["axis1"],
    notes: "홍보/PR/대외협력 역할군",
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
