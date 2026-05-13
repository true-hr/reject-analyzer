// industryExperienceTagProfileRegistry.js
// Maps industry sector/archetype keys to prioritized experience tag profiles.
// Tags come from experienceTagRegistry.js (18 first-wave tags).
// Not wired into axis scoring yet. Do not import from analysis logic.

// ── REGISTRY ────────────────────────────────────────────────────────────────

export const INDUSTRY_EXPERIENCE_TAG_PROFILE_REGISTRY = Object.freeze({

  // ── COMMERCE / CONSUMER GOODS / RETAIL ──────────────────────────────────

  IND_COMMERCE_CONSUMER_RETAIL: Object.freeze({
    industryKey: "IND_COMMERCE_CONSUMER_RETAIL",
    primaryTags: ["conversion", "channel_operation", "retention_activation"],
    secondaryTags: ["content_message", "data_decision", "user_insight", "market_sensing"],
    cautionTags: ["technical_evidence", "sales_enablement"],
    profileBasis: "구매 전환과 채널 운영이 핵심; 고객 재구매·이탈방지도 중요한 지표",
    notes: "리테일·이커머스 기반 직무에서 채널 성과와 전환율은 기본 검증 영역",
  }),

  // ── FINANCE / FINTECH / INSURANCE / SECURITIES ──────────────────────────

  IND_FINANCE_FINTECH_INSURANCE: Object.freeze({
    industryKey: "IND_FINANCE_FINTECH_INSURANCE",
    primaryTags: ["trust_risk", "data_decision", "retention_activation"],
    secondaryTags: ["product_value_translation", "user_insight", "conversion", "workflow_policy"],
    cautionTags: ["content_message", "channel_operation"],
    profileBasis: "신뢰·리스크 관리와 데이터 기반 의사결정이 기본 전제; 고객 이탈 방지도 핵심",
    notes: "policy_compliance, 규제 대응은 2차 태그 후보 — 현재 태그셋에 미포함",
  }),

  // ── B2B SAAS / IT PLATFORM / ENTERPRISE SOFTWARE ────────────────────────

  IND_B2B_SAAS_IT_PLATFORM: Object.freeze({
    industryKey: "IND_B2B_SAAS_IT_PLATFORM",
    primaryTags: ["lead_generation", "sales_enablement", "retention_activation"],
    secondaryTags: ["workflow_policy", "stakeholder_alignment", "product_value_translation", "technical_evidence"],
    cautionTags: ["content_message", "channel_operation"],
    profileBasis: "파이프라인 확보와 영업 지원이 입증 기준; 고객 온보딩·지속 사용 유지도 핵심",
    notes: "B2B SaaS에서 technical_evidence는 솔루션 복잡도에 따라 비중 차이 있음",
  }),

  // ── HEALTHCARE / PHARMA / MEDICAL / BIO ─────────────────────────────────

  IND_HEALTHCARE_PHARMA_BIO: Object.freeze({
    industryKey: "IND_HEALTHCARE_PHARMA_BIO",
    primaryTags: ["trust_risk", "technical_evidence", "data_decision"],
    secondaryTags: ["workflow_policy", "product_value_translation", "stakeholder_alignment"],
    cautionTags: ["conversion", "channel_operation"],
    profileBasis: "안전·신뢰·증거 기반이 기본 전제; 데이터 해석과 프로세스 설계도 중요",
    notes: "policy_compliance, quality_governance는 2차 태그 후보 — 현재 태그셋에 미포함",
  }),

  // ── EDUCATION / EDTECH / LEARNING / COACHING ────────────────────────────

  IND_EDUCATION_EDTECH_LEARNING: Object.freeze({
    industryKey: "IND_EDUCATION_EDTECH_LEARNING",
    primaryTags: ["learning_design", "content_message", "retention_activation"],
    secondaryTags: ["user_insight", "data_decision", "trust_risk"],
    cautionTags: ["conversion", "lead_generation"],
    profileBasis: "학습 설계와 콘텐츠 제작이 핵심; 수강 지속률·재활성화 관리도 주요 지표",
    notes: "에듀테크는 conversion도 중요하나 교육 맥락에서는 신뢰·설계 역량이 우선",
  }),

  // ── MANUFACTURING / INDUSTRIAL GOODS / MATERIALS ────────────────────────

  IND_MANUFACTURING_INDUSTRIAL_GOODS: Object.freeze({
    industryKey: "IND_MANUFACTURING_INDUSTRIAL_GOODS",
    primaryTags: ["technical_evidence", "operation_efficiency", "partner_management"],
    secondaryTags: ["data_decision", "workflow_policy", "trust_risk"],
    cautionTags: ["content_message", "conversion"],
    profileBasis: "기술 근거 기반 수행과 운영 효율이 기본; 외부 협력사 관리도 핵심 영역",
    notes: "quality_governance는 2차 태그 후보 — 현재 태그셋에 미포함",
  }),

  // ── LOGISTICS / MOBILITY / FULFILLMENT ──────────────────────────────────

  IND_LOGISTICS_MOBILITY_FULFILLMENT: Object.freeze({
    industryKey: "IND_LOGISTICS_MOBILITY_FULFILLMENT",
    primaryTags: ["operation_efficiency", "workflow_policy", "data_decision"],
    secondaryTags: ["partner_management", "stakeholder_alignment", "trust_risk"],
    cautionTags: ["content_message", "lead_generation"],
    profileBasis: "운영 효율과 프로세스 정확성이 핵심; 파트너사·내부 부서 조율도 중요",
    notes: null,
  }),

  // ── MEDIA / CONTENT / ENTERTAINMENT ─────────────────────────────────────

  IND_MEDIA_CONTENT_ENTERTAINMENT: Object.freeze({
    industryKey: "IND_MEDIA_CONTENT_ENTERTAINMENT",
    primaryTags: ["content_message", "market_sensing", "channel_operation"],
    secondaryTags: ["user_insight", "conversion", "retention_activation"],
    cautionTags: ["technical_evidence", "workflow_policy"],
    profileBasis: "메시지 설계·콘텐츠 제작과 채널 성과 관리가 핵심; 시장 감도도 주요 역량",
    notes: null,
  }),

  // ── PUBLIC / NONPROFIT / GOVERNMENT / ASSOCIATION ───────────────────────

  IND_PUBLIC_NONPROFIT_GOVERNMENT: Object.freeze({
    industryKey: "IND_PUBLIC_NONPROFIT_GOVERNMENT",
    primaryTags: ["trust_risk", "stakeholder_alignment", "workflow_policy"],
    secondaryTags: ["content_message", "data_decision", "operation_efficiency"],
    cautionTags: ["conversion", "lead_generation"],
    profileBasis: "다양한 이해관계자 조율과 정책·프로세스 정합성이 기본 전제; 신뢰 형성 필수",
    notes: "policy_compliance, external_communication은 2차 태그 후보 — 현재 태그셋에 미포함",
  }),

  // ── HR / RECRUITMENT / PEOPLE SERVICE ───────────────────────────────────

  IND_HR_RECRUITMENT_PEOPLE_SERVICE: Object.freeze({
    industryKey: "IND_HR_RECRUITMENT_PEOPLE_SERVICE",
    primaryTags: ["trust_risk", "user_insight", "stakeholder_alignment"],
    secondaryTags: ["workflow_policy", "operation_efficiency", "content_message"],
    cautionTags: ["conversion", "technical_evidence"],
    profileBasis: "구성원·지원자 신뢰와 이해관계자 조율이 핵심; 사람 중심 판단이 우선",
    notes: "candidate_journey는 2차 태그 후보 — 현재 태그셋에 미포함",
  }),

});

// ── MISSING IDS ──────────────────────────────────────────────────────────────
// First-wave profiles are sector/archetype-level keys, not exact industry registry IDs.
// These 10 sector profiles do not map 1:1 to the ~97 granular industry IDs.
// Exact missing industryId coverage will be added when an industryId → archetype
// mapping is introduced. Until then, this array is intentionally empty.
export const INDUSTRY_EXPERIENCE_TAG_PROFILE_MISSING_IDS = Object.freeze([]);

// ── ACCESSORS ────────────────────────────────────────────────────────────────

export function getIndustryExperienceTagProfile(industryKey) {
  if (!industryKey || typeof industryKey !== "string") return null;
  return INDUSTRY_EXPERIENCE_TAG_PROFILE_REGISTRY[industryKey.trim()] ?? null;
}

export function getIndustryExperienceTagProfileSummary(industryKey) {
  const profile = getIndustryExperienceTagProfile(industryKey);
  if (!profile) return null;
  return Object.freeze({
    industryKey: profile.industryKey,
    primaryTags: profile.primaryTags,
    profileBasis: profile.profileBasis,
  });
}
