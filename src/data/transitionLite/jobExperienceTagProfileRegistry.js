// jobExperienceTagProfileRegistry.js
// Maps job IDs to prioritized experience tag profiles.
// Tags come from experienceTagRegistry.js (18 first-wave tags).
// Not wired into axis scoring yet.

import { JOB_ONTOLOGY_ITEMS } from "../job/jobOntology.index.js";

// ── REGISTRY ────────────────────────────────────────────────────────────────

export const JOB_EXPERIENCE_TAG_PROFILE_REGISTRY = Object.freeze({

  // ── SERVICE PLANNING / PM / PRODUCT PLANNING ────────────────────────────

  JOB_BUSINESS_SERVICE_PLANNING: Object.freeze({
    jobId: "JOB_BUSINESS_SERVICE_PLANNING",
    primaryTags: ["requirement_definition", "user_insight", "stakeholder_alignment"],
    secondaryTags: ["workflow_policy", "data_decision", "product_value_translation", "operation_efficiency"],
    cautionTags: ["conversion", "lead_generation"],
    profileBasis: "서비스 흐름 기획과 요구사항 정의가 핵심; 고객 이해 없이 기획서만 쓰는 신호는 caution",
    notes: "deal_structure, executive_briefing은 2차 태그 후보",
  }),

  JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT: Object.freeze({
    jobId: "JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT",
    primaryTags: ["requirement_definition", "user_insight", "stakeholder_alignment"],
    secondaryTags: ["data_decision", "workflow_policy", "product_value_translation", "operation_efficiency"],
    cautionTags: ["technical_evidence", "conversion"],
    profileBasis: "사용자 문제 정의와 우선순위 설계, 부서 조율이 중심; 직접 기술 구현은 보조 신호",
    notes: null,
  }),

  JOB_BUSINESS_PROJECT_MANAGEMENT: Object.freeze({
    jobId: "JOB_BUSINESS_PROJECT_MANAGEMENT",
    primaryTags: ["stakeholder_alignment", "workflow_policy", "operation_efficiency"],
    secondaryTags: ["data_decision", "requirement_definition"],
    cautionTags: ["user_insight", "technical_evidence"],
    profileBasis: "일정·리소스 조율과 실행 거버넌스가 핵심; 제품 기획과 혼동 caution",
    notes: "executive_briefing은 2차 태그 후보",
  }),

  JOB_CUSTOMER_OPERATIONS_CX_PLANNING: Object.freeze({
    jobId: "JOB_CUSTOMER_OPERATIONS_CX_PLANNING",
    primaryTags: ["user_insight", "workflow_policy", "stakeholder_alignment"],
    secondaryTags: ["operation_efficiency", "data_decision", "requirement_definition"],
    cautionTags: ["conversion", "lead_generation"],
    profileBasis: "고객 여정과 VOC 분석 기반 서비스 개선 설계가 핵심",
    notes: null,
  }),

  JOB_CUSTOMER_OPERATIONS_OPERATION_PLANNING: Object.freeze({
    jobId: "JOB_CUSTOMER_OPERATIONS_OPERATION_PLANNING",
    primaryTags: ["workflow_policy", "operation_efficiency", "data_decision"],
    secondaryTags: ["stakeholder_alignment", "user_insight"],
    cautionTags: ["lead_generation", "conversion"],
    profileBasis: "운영 방향 설계와 프로세스 개선 기획이 핵심; 직접 운영 실행보다 기획 비중이 큼",
    notes: null,
  }),

  JOB_IT_DATA_DIGITAL_IT_PLANNING: Object.freeze({
    jobId: "JOB_IT_DATA_DIGITAL_IT_PLANNING",
    primaryTags: ["requirement_definition", "stakeholder_alignment", "workflow_policy"],
    secondaryTags: ["data_decision", "product_value_translation", "technical_evidence"],
    cautionTags: ["user_insight", "lead_generation"],
    profileBasis: "IT 시스템 방향·투자 계획과 내부 요구사항-기술 연결이 핵심",
    notes: null,
  }),

  JOB_BUSINESS_BUSINESS_PLANNING: Object.freeze({
    jobId: "JOB_BUSINESS_BUSINESS_PLANNING",
    primaryTags: ["data_decision", "stakeholder_alignment", "market_sensing"],
    secondaryTags: ["workflow_policy", "requirement_definition", "operation_efficiency"],
    cautionTags: ["lead_generation", "conversion"],
    profileBasis: "시장·사업 정보 구조화와 전략적 방향 설계가 핵심",
    notes: "executive_briefing은 2차 태그 후보",
  }),

  // ── MARKETING ────────────────────────────────────────────────────────────

  JOB_MARKETING_PERFORMANCE_MARKETING: Object.freeze({
    jobId: "JOB_MARKETING_PERFORMANCE_MARKETING",
    primaryTags: ["conversion", "channel_operation", "data_decision"],
    secondaryTags: ["lead_generation", "retention_activation", "market_sensing"],
    cautionTags: ["content_message", "product_value_translation"],
    profileBasis: "채널별 전환율 최적화와 수치 기반 의사결정이 핵심",
    notes: null,
  }),

  JOB_MARKETING_DIGITAL_MARKETING: Object.freeze({
    jobId: "JOB_MARKETING_DIGITAL_MARKETING",
    primaryTags: ["channel_operation", "conversion", "data_decision"],
    secondaryTags: ["content_message", "lead_generation", "market_sensing"],
    cautionTags: ["product_value_translation", "retention_activation"],
    profileBasis: "디지털 채널 전반 운영과 성과 관리; 퍼포먼스마케팅보다 채널 범위가 더 넓음",
    notes: null,
  }),

  JOB_MARKETING_CONTENT_MARKETING: Object.freeze({
    jobId: "JOB_MARKETING_CONTENT_MARKETING",
    primaryTags: ["content_message", "channel_operation", "market_sensing"],
    secondaryTags: ["data_decision", "conversion", "product_value_translation"],
    cautionTags: ["lead_generation", "retention_activation"],
    profileBasis: "메시지를 실제 콘텐츠로 풀어내고 반응 기반으로 개선하는 역할",
    notes: null,
  }),

  JOB_MARKETING_BRAND_MARKETING: Object.freeze({
    jobId: "JOB_MARKETING_BRAND_MARKETING",
    primaryTags: ["market_sensing", "content_message", "stakeholder_alignment"],
    secondaryTags: ["data_decision", "product_value_translation"],
    cautionTags: ["conversion", "channel_operation"],
    profileBasis: "시장·고객 해석 기반 브랜드 방향 설계가 핵심; 직접 채널 집행이 주가 아님",
    notes: null,
  }),

  JOB_MARKETING_CRM_MARKETING: Object.freeze({
    jobId: "JOB_MARKETING_CRM_MARKETING",
    primaryTags: ["retention_activation", "data_decision", "channel_operation"],
    secondaryTags: ["content_message", "user_insight", "conversion"],
    cautionTags: ["lead_generation", "market_sensing"],
    profileBasis: "고객 데이터 기반 라이프사이클 메시지와 재구매 촉진이 핵심",
    notes: null,
  }),

  JOB_MARKETING_PRODUCT_MARKETING_PMM: Object.freeze({
    jobId: "JOB_MARKETING_PRODUCT_MARKETING_PMM",
    primaryTags: ["product_value_translation", "market_sensing", "stakeholder_alignment"],
    secondaryTags: ["content_message", "data_decision", "requirement_definition"],
    cautionTags: ["conversion", "channel_operation"],
    profileBasis: "제품 가치를 시장 언어로 번역하고 제품-영업-마케팅을 연결하는 역할",
    notes: "sales_enablement도 관련 높음",
  }),

  JOB_MARKETING_MARKETING_RESEARCH: Object.freeze({
    jobId: "JOB_MARKETING_MARKETING_RESEARCH",
    primaryTags: ["market_sensing", "data_decision", "user_insight"],
    secondaryTags: ["workflow_policy"],
    cautionTags: ["conversion", "lead_generation"],
    profileBasis: "시장·경쟁·고객 분석 결과를 의사결정 자료로 전달하는 역할",
    notes: "executive_briefing은 2차 태그 후보",
  }),

  JOB_MARKETING_PR_COMMUNICATIONS: Object.freeze({
    jobId: "JOB_MARKETING_PR_COMMUNICATIONS",
    primaryTags: ["content_message", "stakeholder_alignment", "market_sensing"],
    secondaryTags: ["trust_risk"],
    cautionTags: ["conversion", "lead_generation"],
    profileBasis: "외부 미디어·파트너 대상 커뮤니케이션 메시지 설계와 조율이 핵심",
    notes: "external_communication은 2차 태그 후보",
  }),

  // ── SALES / BD ────────────────────────────────────────────────────────────

  JOB_SALES_B2B_SALES: Object.freeze({
    jobId: "JOB_SALES_B2B_SALES",
    primaryTags: ["lead_generation", "trust_risk", "conversion"],
    secondaryTags: ["market_sensing", "retention_activation", "product_value_translation"],
    cautionTags: ["data_decision", "workflow_policy"],
    profileBasis: "신뢰 기반 관계 구축과 고객 니즈 파악 후 전환이 핵심",
    notes: "deal_structure는 2차 태그 후보",
  }),

  JOB_SALES_B2C_SALES: Object.freeze({
    jobId: "JOB_SALES_B2C_SALES",
    primaryTags: ["conversion", "trust_risk", "lead_generation"],
    secondaryTags: ["retention_activation", "product_value_translation"],
    cautionTags: ["data_decision", "stakeholder_alignment"],
    profileBasis: "단건 전환과 고객 신뢰 형성이 핵심; B2B보다 관계 지속성은 낮음",
    notes: null,
  }),

  JOB_SALES_SOLUTION_SALES: Object.freeze({
    jobId: "JOB_SALES_SOLUTION_SALES",
    primaryTags: ["product_value_translation", "trust_risk", "lead_generation"],
    secondaryTags: ["market_sensing", "stakeholder_alignment", "conversion"],
    cautionTags: ["technical_evidence", "data_decision"],
    profileBasis: "고객 문제 해석과 제품/기술 가치 연결 설명력이 핵심",
    notes: "deal_structure는 2차 태그 후보",
  }),

  JOB_SALES_TECHNICAL_SALES: Object.freeze({
    jobId: "JOB_SALES_TECHNICAL_SALES",
    primaryTags: ["product_value_translation", "technical_evidence", "trust_risk"],
    secondaryTags: ["lead_generation", "stakeholder_alignment", "conversion"],
    cautionTags: ["data_decision"],
    profileBasis: "기술 이해 기반 고객 설명과 신뢰 형성이 핵심인 기술 영업",
    notes: "deal_structure는 2차 태그 후보",
  }),

  JOB_SALES_KEY_ACCOUNT_MANAGEMENT: Object.freeze({
    jobId: "JOB_SALES_KEY_ACCOUNT_MANAGEMENT",
    primaryTags: ["trust_risk", "retention_activation", "stakeholder_alignment"],
    secondaryTags: ["data_decision", "product_value_translation", "market_sensing"],
    cautionTags: ["lead_generation", "conversion"],
    profileBasis: "핵심 고객 관계 장기 유지와 전략적 성장이 핵심; 신규 획득보다 관계 심화",
    notes: "executive_briefing, deal_structure는 2차 태그 후보",
  }),

  JOB_SALES_PARTNER_CHANNEL_SALES: Object.freeze({
    jobId: "JOB_SALES_PARTNER_CHANNEL_SALES",
    primaryTags: ["partner_management", "trust_risk", "stakeholder_alignment"],
    secondaryTags: ["lead_generation", "market_sensing", "retention_activation"],
    cautionTags: ["conversion", "technical_evidence"],
    profileBasis: "파트너 네트워크 관리와 생태계 기반 성과 창출이 핵심",
    notes: null,
  }),

  JOB_BUSINESS_BUSINESS_DEVELOPMENT: Object.freeze({
    jobId: "JOB_BUSINESS_BUSINESS_DEVELOPMENT",
    primaryTags: ["market_sensing", "partner_management", "lead_generation"],
    secondaryTags: ["stakeholder_alignment", "product_value_translation", "trust_risk"],
    cautionTags: ["technical_evidence", "operation_efficiency"],
    profileBasis: "시장 기회 발굴과 파트너십·신규사업 구조 설계가 핵심",
    notes: "deal_structure는 2차 태그 후보",
  }),

  // ── CUSTOMER SUCCESS / OPERATIONS ────────────────────────────────────────

  JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUCCESS: Object.freeze({
    jobId: "JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUCCESS",
    primaryTags: ["trust_risk", "retention_activation", "user_insight"],
    secondaryTags: ["stakeholder_alignment", "product_value_translation", "operation_efficiency"],
    cautionTags: ["lead_generation", "conversion"],
    profileBasis: "고객 문제 해결과 제품 가치 실현 지원, 이탈 방지가 핵심",
    notes: null,
  }),

  JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS: Object.freeze({
    jobId: "JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS",
    primaryTags: ["trust_risk", "operation_efficiency"],
    secondaryTags: ["workflow_policy", "data_decision"],
    cautionTags: ["lead_generation", "market_sensing"],
    profileBasis: "고객 문의·불만을 직접 처리하고 빠르게 해결하는 역할; 단건 처리 중심",
    notes: "candidate_journey와 유사한 stakeholder 패턴; 2차 태그 후보",
  }),

  JOB_CUSTOMER_OPERATIONS_SERVICE_OPERATIONS: Object.freeze({
    jobId: "JOB_CUSTOMER_OPERATIONS_SERVICE_OPERATIONS",
    primaryTags: ["operation_efficiency", "workflow_policy", "stakeholder_alignment"],
    secondaryTags: ["data_decision", "user_insight"],
    cautionTags: ["lead_generation", "conversion"],
    profileBasis: "운영 품질과 프로세스 개선, 현업 지원이 중심인 역할",
    notes: null,
  }),

  JOB_CUSTOMER_OPERATIONS_ECOMMERCE_OPERATIONS: Object.freeze({
    jobId: "JOB_CUSTOMER_OPERATIONS_ECOMMERCE_OPERATIONS",
    primaryTags: ["operation_efficiency", "data_decision", "channel_operation"],
    secondaryTags: ["workflow_policy", "stakeholder_alignment", "user_insight"],
    cautionTags: ["lead_generation", "trust_risk"],
    profileBasis: "커머스 구매 흐름 운영과 지표 기반 개선이 핵심",
    notes: null,
  }),

  JOB_CUSTOMER_OPERATIONS_COMMUNITY_OPERATIONS: Object.freeze({
    jobId: "JOB_CUSTOMER_OPERATIONS_COMMUNITY_OPERATIONS",
    primaryTags: ["trust_risk", "content_message", "operation_efficiency"],
    secondaryTags: ["user_insight", "retention_activation", "channel_operation"],
    cautionTags: ["lead_generation", "data_decision"],
    profileBasis: "커뮤니티 관계 형성과 콘텐츠 기반 참여 활성화가 핵심",
    notes: null,
  }),

  // ── DATA / DEVELOPMENT ───────────────────────────────────────────────────

  JOB_IT_DATA_DIGITAL_DATA_ANALYSIS: Object.freeze({
    jobId: "JOB_IT_DATA_DIGITAL_DATA_ANALYSIS",
    primaryTags: ["data_decision", "technical_evidence"],
    secondaryTags: ["user_insight", "operation_efficiency", "stakeholder_alignment"],
    cautionTags: ["lead_generation", "conversion"],
    profileBasis: "데이터 해석과 인사이트 기반 의사결정 지원이 핵심",
    notes: "executive_briefing은 2차 태그 후보",
  }),

  JOB_IT_DATA_DIGITAL_DATA_ENGINEERING: Object.freeze({
    jobId: "JOB_IT_DATA_DIGITAL_DATA_ENGINEERING",
    primaryTags: ["technical_evidence", "operation_efficiency"],
    secondaryTags: ["data_decision", "workflow_policy"],
    cautionTags: ["user_insight", "lead_generation"],
    profileBasis: "파이프라인 구현과 시스템 신뢰성 유지가 핵심; 분석 인사이트보다 인프라 중심",
    notes: "quality_governance는 2차 태그 후보",
  }),

  JOB_IT_DATA_DIGITAL_DATA_SCIENCE: Object.freeze({
    jobId: "JOB_IT_DATA_DIGITAL_DATA_SCIENCE",
    primaryTags: ["technical_evidence", "data_decision"],
    secondaryTags: ["user_insight", "operation_efficiency", "requirement_definition"],
    cautionTags: ["lead_generation", "conversion"],
    profileBasis: "모델링과 실험 기반 기술 산출물 생산이 핵심; 비즈니스 해석 연결도 중요",
    notes: "executive_briefing은 2차 태그 후보",
  }),

  JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT: Object.freeze({
    jobId: "JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT",
    primaryTags: ["technical_evidence"],
    secondaryTags: ["operation_efficiency", "requirement_definition", "workflow_policy"],
    cautionTags: ["lead_generation", "market_sensing"],
    profileBasis: "서버·API 구현과 시스템 안정성이 핵심; 비기술 경험은 보조 신호",
    notes: "quality_governance는 2차 태그 후보",
  }),

  JOB_IT_DATA_DIGITAL_FRONTEND_DEVELOPMENT: Object.freeze({
    jobId: "JOB_IT_DATA_DIGITAL_FRONTEND_DEVELOPMENT",
    primaryTags: ["technical_evidence"],
    secondaryTags: ["user_insight", "requirement_definition", "operation_efficiency"],
    cautionTags: ["lead_generation", "market_sensing"],
    profileBasis: "UI 구현과 사용자 접점 기술 산출물 생산이 핵심",
    notes: null,
  }),

  JOB_IT_DATA_DIGITAL_FULLSTACK_DEVELOPMENT: Object.freeze({
    jobId: "JOB_IT_DATA_DIGITAL_FULLSTACK_DEVELOPMENT",
    primaryTags: ["technical_evidence"],
    secondaryTags: ["operation_efficiency", "requirement_definition", "user_insight"],
    cautionTags: ["lead_generation", "market_sensing"],
    profileBasis: "프론트+백엔드 전 영역 구현 역량이 핵심",
    notes: null,
  }),

  JOB_IT_DATA_DIGITAL_AI_ML_ENGINEERING: Object.freeze({
    jobId: "JOB_IT_DATA_DIGITAL_AI_ML_ENGINEERING",
    primaryTags: ["technical_evidence", "data_decision"],
    secondaryTags: ["operation_efficiency", "requirement_definition"],
    cautionTags: ["lead_generation", "user_insight"],
    profileBasis: "모델 구현·실험·배포 기술 산출물이 핵심; 비즈니스 해석 연결 가능성도 있음",
    notes: "quality_governance는 2차 태그 후보",
  }),

  // ── HR / EDUCATION ───────────────────────────────────────────────────────

  JOB_HR_ORGANIZATION_RECRUITING: Object.freeze({
    jobId: "JOB_HR_ORGANIZATION_RECRUITING",
    primaryTags: ["trust_risk", "stakeholder_alignment", "operation_efficiency"],
    secondaryTags: ["data_decision", "workflow_policy", "user_insight"],
    cautionTags: ["lead_generation", "technical_evidence"],
    profileBasis: "지원자·현업 조율과 채용 프로세스 운영이 핵심; 신뢰 기반 커뮤니케이션 중요",
    notes: "candidate_journey는 2차 태그 후보",
  }),

  JOB_HR_ORGANIZATION_HR_PLANNING: Object.freeze({
    jobId: "JOB_HR_ORGANIZATION_HR_PLANNING",
    primaryTags: ["workflow_policy", "data_decision", "stakeholder_alignment"],
    secondaryTags: ["operation_efficiency", "user_insight"],
    cautionTags: ["lead_generation", "conversion"],
    profileBasis: "인사 전략·정책 설계와 인력 계획 수립이 핵심",
    notes: "executive_briefing은 2차 태그 후보",
  }),

  JOB_HR_ORGANIZATION_HR_OPS: Object.freeze({
    jobId: "JOB_HR_ORGANIZATION_HR_OPS",
    primaryTags: ["operation_efficiency", "workflow_policy"],
    secondaryTags: ["data_decision", "stakeholder_alignment"],
    cautionTags: ["lead_generation", "market_sensing"],
    profileBasis: "인사 프로세스 실행·시스템·행정 관리가 핵심; 전략보다 운영 실행 비중이 큼",
    notes: null,
  }),

  JOB_HR_ORGANIZATION_TALENT_DEVELOPMENT: Object.freeze({
    jobId: "JOB_HR_ORGANIZATION_TALENT_DEVELOPMENT",
    primaryTags: ["learning_design", "user_insight", "stakeholder_alignment"],
    secondaryTags: ["data_decision", "workflow_policy", "operation_efficiency"],
    cautionTags: ["lead_generation", "technical_evidence"],
    profileBasis: "구성원 학습 니즈 파악과 교육 경험 설계가 핵심",
    notes: "candidate_journey는 2차 태그 후보",
  }),

  JOB_EDUCATION_COUNSELING_COACHING_LEARNING_DESIGN: Object.freeze({
    jobId: "JOB_EDUCATION_COUNSELING_COACHING_LEARNING_DESIGN",
    primaryTags: ["learning_design", "user_insight", "requirement_definition"],
    secondaryTags: ["data_decision", "workflow_policy", "stakeholder_alignment"],
    cautionTags: ["lead_generation", "conversion"],
    profileBasis: "학습자 분석 기반 커리큘럼·교육 설계가 핵심",
    notes: null,
  }),

  JOB_EDUCATION_COUNSELING_COACHING_CORPORATE_TRAINING: Object.freeze({
    jobId: "JOB_EDUCATION_COUNSELING_COACHING_CORPORATE_TRAINING",
    primaryTags: ["learning_design", "operation_efficiency", "stakeholder_alignment"],
    secondaryTags: ["user_insight", "workflow_policy", "content_message"],
    cautionTags: ["lead_generation", "technical_evidence"],
    profileBasis: "조직 교육 운영과 학습 효과 달성이 핵심",
    notes: null,
  }),

  JOB_EDUCATION_COUNSELING_COACHING_CAREER_COACHING: Object.freeze({
    jobId: "JOB_EDUCATION_COUNSELING_COACHING_CAREER_COACHING",
    primaryTags: ["trust_risk", "user_insight", "learning_design"],
    secondaryTags: ["data_decision"],
    cautionTags: ["lead_generation", "technical_evidence"],
    profileBasis: "개인 맥락 파악과 신뢰 기반 코칭 관계 형성이 핵심",
    notes: "candidate_journey는 2차 태그 후보",
  }),

  // ── PROCUREMENT / LOGISTICS / MANUFACTURING QUALITY ──────────────────────

  JOB_PROCUREMENT_SCM_PROCUREMENT: Object.freeze({
    jobId: "JOB_PROCUREMENT_SCM_PROCUREMENT",
    primaryTags: ["partner_management", "workflow_policy", "operation_efficiency"],
    secondaryTags: ["data_decision", "trust_risk"],
    cautionTags: ["lead_generation", "conversion"],
    profileBasis: "공급업체 발굴·협상과 조달 프로세스 운영이 핵심",
    notes: "deal_structure는 2차 태그 후보",
  }),

  JOB_PROCUREMENT_SCM_PURCHASING: Object.freeze({
    jobId: "JOB_PROCUREMENT_SCM_PURCHASING",
    primaryTags: ["operation_efficiency", "partner_management"],
    secondaryTags: ["data_decision", "workflow_policy"],
    cautionTags: ["lead_generation", "market_sensing"],
    profileBasis: "구매 실행과 거래처 관리가 핵심; 전략구매보다 실행 비중이 큼",
    notes: null,
  }),

  JOB_PROCUREMENT_SCM_SCM: Object.freeze({
    jobId: "JOB_PROCUREMENT_SCM_SCM",
    primaryTags: ["operation_efficiency", "partner_management", "workflow_policy"],
    secondaryTags: ["data_decision", "stakeholder_alignment"],
    cautionTags: ["lead_generation", "conversion"],
    profileBasis: "공급망 수급 밸런스와 물류 프로세스 전반 관리가 핵심",
    notes: null,
  }),

  JOB_PROCUREMENT_SCM_LOGISTICS: Object.freeze({
    jobId: "JOB_PROCUREMENT_SCM_LOGISTICS",
    primaryTags: ["operation_efficiency", "workflow_policy"],
    secondaryTags: ["partner_management", "data_decision"],
    cautionTags: ["lead_generation", "market_sensing"],
    profileBasis: "물류 실행과 운영 안정성 유지가 핵심",
    notes: null,
  }),

  JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_CONTROL: Object.freeze({
    jobId: "JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_CONTROL",
    primaryTags: ["technical_evidence", "operation_efficiency"],
    secondaryTags: ["workflow_policy", "data_decision"],
    cautionTags: ["lead_generation", "market_sensing"],
    profileBasis: "불량 감지·검수 실행이 핵심; 기준 설계보다 현장 검증 중심",
    notes: "quality_governance는 2차 태그 후보",
  }),

  JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA: Object.freeze({
    jobId: "JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA",
    primaryTags: ["workflow_policy", "technical_evidence", "data_decision"],
    secondaryTags: ["operation_efficiency", "stakeholder_alignment"],
    cautionTags: ["lead_generation", "conversion"],
    profileBasis: "품질 기준 설계와 적합성 검증 체계 운영이 핵심",
    notes: "quality_governance는 2차 태그 후보",
  }),

  JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_MANAGEMENT: Object.freeze({
    jobId: "JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_MANAGEMENT",
    primaryTags: ["operation_efficiency", "workflow_policy", "stakeholder_alignment"],
    secondaryTags: ["data_decision", "partner_management"],
    cautionTags: ["lead_generation", "trust_risk"],
    profileBasis: "생산 일정·자원 계획과 실행 조율이 핵심",
    notes: null,
  }),
});

// ── JOB IDs NOT YET PROFILED ─────────────────────────────────────────────────
const _profiledSet = new Set(Object.keys(JOB_EXPERIENCE_TAG_PROFILE_REGISTRY));
export const JOB_EXPERIENCE_TAG_PROFILE_MISSING_IDS = Object.freeze(
  JOB_ONTOLOGY_ITEMS.map((item) => item.id).filter((id) => !_profiledSet.has(id))
);

// ── ACCESSORS ────────────────────────────────────────────────────────────────

export function getJobExperienceTagProfile(jobId) {
  if (!jobId || typeof jobId !== "string") return null;
  return JOB_EXPERIENCE_TAG_PROFILE_REGISTRY[jobId.trim()] ?? null;
}

export function getJobExperienceTagProfileSummary(jobId) {
  const profile = getJobExperienceTagProfile(jobId);
  if (!profile) return null;
  return Object.freeze({
    jobId: profile.jobId,
    primaryTags: profile.primaryTags,
    profileBasis: profile.profileBasis,
  });
}
