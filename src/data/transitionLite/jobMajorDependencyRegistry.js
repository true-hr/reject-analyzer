function toStr(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

export const JOB_MAJOR_DEPENDENCY_REGISTRY = Object.freeze({
  JOB_ENGINEERING_DEVELOPMENT_SOFTWARE_DEVELOPMENT: Object.freeze({
    tier: "high",
    reason: "전공지식이 실제 과업 수행의 기본 토대가 되는 직무",
  }),
  JOB_ENGINEERING_DEVELOPMENT_MECHANICAL_DESIGN: Object.freeze({
    tier: "high",
    reason: "전공 기반 기술 이해와 과업 정합성이 매우 중요한 직무",
  }),
  JOB_ENGINEERING_DEVELOPMENT_CIRCUIT_DESIGN: Object.freeze({
    tier: "high",
    reason: "전공 기반 하드스킬과 기술 이해가 직접 연결되는 직무",
  }),
  JOB_FINANCE_ACCOUNTING_ACCOUNTING: Object.freeze({
    tier: "high",
    reason: "회계 전공 기반 기술 이해와 실무 적용이 직결되는 직무로, 전공 의존도가 높다",
  }),
  JOB_FINANCE_ACCOUNTING_TAX: Object.freeze({
    tier: "high",
    reason: "세무회계 전공 지식이 직무 수행의 핵심 토대가 되는 직무",
  }),
  JOB_RESEARCH_PROFESSIONAL_POLICY_RESEARCH: Object.freeze({
    tier: "high",
    reason: "공공정책·행정학 전공 기반 정책 분석·개발 과업과 직결되는 직무로, 전공 의존도가 높다",
  }),
  JOB_MANUFACTURING_QUALITY_PRODUCTION_PROCESS_ENGINEERING: Object.freeze({
    tier: "high",
    reason: "이공계 전공 기반 공정설계·양산이관 과업 수행과 직결되는 직무로, 전공 의존도가 높다",
  }),
  JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_ENGINEERING: Object.freeze({
    tier: "high",
    reason: "생산공정 최적화·설비 이해가 이공계 전공과 직접 연결되는 직무",
  }),
  JOB_IT_DATA_DIGITAL_DATA_ANALYSIS: Object.freeze({
    tier: "medium",
    reason: "전공이 유리할 수 있으나 프로젝트와 도구 활용 근거도 중요하게 본다",
  }),
  JOB_BUSINESS_SERVICE_PLANNING: Object.freeze({
    tier: "medium",
    reason: "전공보다 문제정의와 기획 실행 근거도 함께 중요하게 본다",
  }),
  JOB_HR_ORGANIZATION_HR_OPS: Object.freeze({
    tier: "low",
    reason: "전공보다 실제 경험과 역할 수행 맥락을 더 중요하게 보는 직무",
  }),
  JOB_HR_ORGANIZATION_RECRUITING: Object.freeze({
    tier: "low",
    reason: "전공보다 실제 경험과 역할 수행 맥락을 더 중요하게 보는 직무",
  }),
  JOB_HR_ORGANIZATION_TALENT_DEVELOPMENT: Object.freeze({
    tier: "low",
    reason: "전공보다 실제 경험과 역할 수행 맥락을 더 중요하게 보는 직무",
  }),
  JOB_SALES_B2B_SALES: Object.freeze({
    tier: "low",
    reason: "전공보다 실제 경험과 역할 수행 맥락을 더 중요하게 보는 직무",
  }),
  JOB_SALES_B2C_SALES: Object.freeze({
    tier: "low",
    reason: "전공보다 실제 경험과 역할 수행 맥락을 더 중요하게 보는 직무",
  }),
  JOB_SALES_GENERAL_SALES: Object.freeze({
    tier: "low",
    reason: "전공보다 실제 경험과 역할 수행 맥락을 더 중요하게 보는 직무",
  }),
  JOB_SALES_SALES_OPERATIONS: Object.freeze({
    tier: "low",
    reason: "전공보다 실제 경험과 역할 수행 맥락을 더 중요하게 보는 직무",
  }),
  JOB_CUSTOMER_OPERATIONS_SERVICE_OPERATIONS: Object.freeze({
    tier: "low",
    reason: "전공보다 실제 경험과 역할 수행 맥락을 더 중요하게 보는 직무",
  }),
  JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS: Object.freeze({
    tier: "low",
    reason: "전공보다 실제 경험과 역할 수행 맥락을 더 중요하게 보는 직무",
  }),
  JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUCCESS: Object.freeze({
    tier: "low",
    reason: "전공보다 실제 경험과 역할 수행 맥락을 더 중요하게 보는 직무",
  }),
  JOB_RESEARCH_PROFESSIONAL_LEGAL: Object.freeze({
    tier: "high",
    reason: "법학 전공 기반 법무·계약·컴플라이언스 과업 수행과 직결되는 직무로, 전공 의존도가 높다",
  }),
  JOB_RESEARCH_PROFESSIONAL_TECHNICAL_RESEARCH: Object.freeze({
    tier: "high",
    reason: "이공계 전공 기반 기술조사·분석·자문 과업 수행과 직결되는 직무로, 전공 의존도가 높다",
  }),
  JOB_RESEARCH_PROFESSIONAL_REGULATORY_AFFAIRS: Object.freeze({
    tier: "high",
    reason: "약학·생명과학 전공 기반 인허가·규제대응·RA 과업 수행과 직결되는 직무로, 전공 의존도가 높다",
  }),
  JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_CONTROL: Object.freeze({
    tier: "high",
    reason: "이공계(화학·바이오·약학) 전공 기반 품질관리·시험분석 과업 수행과 직결되는 직무로, 전공 의존도가 높다",
  }),
  JOB_MANUFACTURING_QUALITY_PRODUCTION_ENVIRONMENT_HEALTH_SAFETY: Object.freeze({
    tier: "high",
    reason: "환경/안전공학 전공 기반 EHS·산업안전·환경관리 과업 수행과 직결되는 직무로, 전공 의존도가 높다",
  }),
});

const DEFAULT_JOB_MAJOR_DEPENDENCY = Object.freeze({
  tier: "medium",
  reason: "전공 적합성도 보지만 실제 과업 연결 근거를 함께 평가하는 직무",
});

export function getJobMajorDependencyProfile(targetJobId) {
  const safeId = toStr(targetJobId).toUpperCase();
  if (!safeId) {
    return {
      ...DEFAULT_JOB_MAJOR_DEPENDENCY,
      matchedJobId: "",
      matched: false,
    };
  }

  const item = JOB_MAJOR_DEPENDENCY_REGISTRY[safeId];
  if (!item) {
    return {
      ...DEFAULT_JOB_MAJOR_DEPENDENCY,
      matchedJobId: safeId,
      matched: false,
    };
  }

  return {
    ...item,
    matchedJobId: safeId,
    matched: true,
  };
}
