/**
 * Smoke test runner for careerTransitionArchetypeResolver.
 * 12 cases from ARCHETYPE_RESOLVER_SMOKE_SPEC.md Phase 2.6.
 * Exit code 1 if any case fails.
 */

import { resolveCareerTransitionArchetype } from '../src/lib/analysis/careerTransitionArchetypeResolver.js';

const CASES = [
  // ── Group A: CURATED_MATCH ────────────────────────────────────────────────
  {
    id: 'SC-A1',
    input: {
      sourceJobId: 'JOB_BUSINESS_SERVICE_PLANNING',
      targetJobId: 'JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT',
      sourceSubType: 'service_planning',
      targetSubType: 'PM',
      yearsOfExperience: 5,
      sourceIndustryId: 'INDUSTRY_IT_PLATFORM',
      targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'CURATED_MATCH',
      selectedArchetypeId: 'PLANNING_OUTPUT_TO_PRODUCT_OWNERSHIP',
      requiredPhrases: ['서비스기획 경험은 PM 직무와 기본 구조가 많이 겹칩니다', '문제정의'],
      forbiddenPhrases: ['PO'],
    },
  },
  {
    id: 'SC-A2',
    input: {
      sourceJobId: 'JOB_BUSINESS_SERVICE_PLANNING',
      targetJobId: 'JOB_BUSINESS_BUSINESS_PLANNING',
      sourceSubType: 'service_planning',
      targetSubType: null,
      yearsOfExperience: 6,
      sourceIndustryId: 'INDUSTRY_ECOMMERCE',
      targetIndustryId: 'INDUSTRY_ECOMMERCE',
      candidateEvidencePack: { hasMetricEvidence: true, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'CURATED_MATCH',
      selectedArchetypeId: 'PLANNING_OUTPUT_TO_BUSINESS_STRATEGY',
      requiredPhrases: ['서비스기획 경험은 사업기획의 서비스·시장 이해 역량', '수익모델'],
      forbiddenPhrases: [],
    },
  },
  {
    id: 'SC-A3',
    input: {
      sourceJobId: 'JOB_MARKETING_PERFORMANCE_MARKETING',
      targetJobId: 'JOB_BUSINESS_SERVICE_PLANNING',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 4,
      sourceIndustryId: 'INDUSTRY_IT_PLATFORM',
      targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: true, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'CURATED_MATCH',
      selectedArchetypeId: 'PERFORMANCE_MARKETING_TO_SERVICE_PLANNING',
      requiredPhrases: ['퍼포먼스마케팅 경험은 서비스기획과 연결될 수 있습니다', '사용자 행동 데이터'],
      forbiddenPhrases: [],
    },
  },

  // ── Group B: BLOCKED_TAXONOMY ─────────────────────────────────────────────
  {
    id: 'SC-B1',
    input: {
      sourceJobId: 'JOB_BUSINESS_SERVICE_PLANNING',
      targetJobId: 'JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT',
      sourceSubType: 'service_planning',
      targetSubType: 'PO',
      yearsOfExperience: 5,
      sourceIndustryId: 'INDUSTRY_IT_PLATFORM',
      targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'BLOCKED_TAXONOMY',
      selectedArchetypeId: null,
      requiredPhrases: ['PM과 PO 역할은 동일한 직무 코드를 공유'],
      forbiddenPhrases: ['서비스기획 경험은 PM'],
    },
  },
  {
    id: 'SC-B2',
    input: {
      sourceJobId: 'JOB_MARKETING_PERFORMANCE_MARKETING',
      targetJobId: 'JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT',
      sourceSubType: null,
      targetSubType: 'PO',
      yearsOfExperience: 3,
      sourceIndustryId: 'INDUSTRY_IT_PLATFORM',
      targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'BLOCKED_TAXONOMY',
      selectedArchetypeId: null,
      requiredPhrases: ['taxonomy ID가 확정된 이후'],
      forbiddenPhrases: [],
    },
  },
  {
    id: 'SC-B3',
    input: {
      sourceJobId: 'JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT',
      targetJobId: 'JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT',
      sourceSubType: null,
      targetSubType: 'PO',
      yearsOfExperience: 7,
      sourceIndustryId: 'INDUSTRY_FINTECH',
      targetIndustryId: 'INDUSTRY_FINTECH',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'BLOCKED_TAXONOMY',
      selectedArchetypeId: null,
      requiredPhrases: ['PM과 PO 역할은 동일한 직무 코드를 공유'],
      forbiddenPhrases: [],
    },
  },

  // ── Group C: ARCHETYPE_WITH_MODIFIER — customer_success ──────────────────
  {
    id: 'SC-C1',
    input: {
      sourceJobId: 'JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUCCESS',
      targetJobId: 'JOB_BUSINESS_SERVICE_PLANNING',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 4,
      sourceIndustryId: 'INDUSTRY_SAAS',
      targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'CUSTOMER_SUCCESS_TO_SERVICE_PLANNING',
      requiredPhrases: ['Customer Success 경험은 서비스기획 전환에서'],
      forbiddenPhrases: [],
    },
  },
  {
    id: 'SC-C2',
    input: {
      sourceJobId: 'JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUCCESS',
      targetJobId: 'JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 4,
      sourceIndustryId: 'INDUSTRY_SAAS',
      targetIndustryId: 'INDUSTRY_SAAS',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'CUSTOMER_SUCCESS_TO_PRODUCT_MANAGEMENT',
      requiredPhrases: ['Customer Success 경험은 PM 전환에서'],
      forbiddenPhrases: [],
    },
  },

  // ── Group D: ARCHETYPE_MATCH / ARCHETYPE_WITH_MODIFIER ───────────────────
  {
    id: 'SC-D1',
    input: {
      sourceJobId: 'JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS',
      targetJobId: 'JOB_BUSINESS_SERVICE_PLANNING',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 3,
      sourceIndustryId: 'INDUSTRY_ECOMMERCE',
      targetIndustryId: 'INDUSTRY_ECOMMERCE',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: true, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_MATCH',
      selectedArchetypeId: 'CUSTOMER_SUPPORT_TO_SERVICE_PLANNING',
      requiredPhrases: ['반복 VOC', 'VOC 분류·집계를 넘어'],
      forbiddenPhrases: [],
    },
  },
  {
    id: 'SC-D7',
    input: {
      sourceJobId: 'JOB_SALES_SALES_OPERATIONS',
      targetJobId: 'JOB_BUSINESS_BUSINESS_PLANNING',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 5,
      sourceIndustryId: 'INDUSTRY_IT_PLATFORM',
      targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: true, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'SALES_ADMIN_TO_BUSINESS_PLANNING',
      requiredPhrases: ['영업 데이터 집계 경험', '전략적 해석'],
      forbiddenPhrases: [],
    },
  },
  {
    id: 'SC-D9',
    input: {
      sourceJobId: 'JOB_FINANCE_ACCOUNTING_ACCOUNTING',
      targetJobId: 'JOB_FINANCE_ACCOUNTING_FP_AND_A',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 6,
      sourceIndustryId: 'INDUSTRY_MANUFACTURING',
      targetIndustryId: 'INDUSTRY_MANUFACTURING',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'ACCOUNTING_TO_FPA',
      requiredPhrases: ['회계 경험은 FP&A나 재무기획 전환에서', '숫자를 기준으로 사업을 해석해본 경험'],
      forbiddenPhrases: [],
    },
  },
  {
    id: 'SC-D10',
    input: {
      sourceJobId: 'JOB_HR_ORGANIZATION_HR_OPS',
      targetJobId: 'JOB_HR_ORGANIZATION_HRBP',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 5,
      sourceIndustryId: 'INDUSTRY_IT_PLATFORM',
      targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: true, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'HR_OPERATIONS_TO_HRBP',
      requiredPhrases: ['HR운영 경험은 HRBP 전환에서', '조직과 구성원 이슈를 제도·프로세스 관점에서 이해한 경험'],
      forbiddenPhrases: [],
    },
  },
  {
    id: 'SC-D11',
    input: {
      sourceJobId: 'JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS',
      targetJobId: 'JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 4,
      sourceIndustryId: 'INDUSTRY_ECOMMERCE',
      targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: true },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'CUSTOMER_SUPPORT_TO_PRODUCT_MANAGEMENT',
      requiredPhrases: ['고객지원 경험은 PM 전환에서', '고객 문제를 제품 개선 기회로 발견한 경험'],
      forbiddenPhrases: [],
    },
  },
  {
    id: 'SC-D12',
    input: {
      sourceJobId: 'JOB_CUSTOMER_OPERATIONS_ECOMMERCE_OPERATIONS',
      targetJobId: 'JOB_BUSINESS_SERVICE_PLANNING',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 4,
      sourceIndustryId: 'INDUSTRY_ECOMMERCE',
      targetIndustryId: 'INDUSTRY_ECOMMERCE',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: true, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'COMMERCE_OPERATIONS_TO_SERVICE_PLANNING',
      requiredPhrases: ['커머스운영 경험은 서비스기획 전환에서', '구매 흐름과 운영 병목을 이해한 경험'],
      forbiddenPhrases: [],
    },
  },
  {
    id: 'SC-D13',
    input: {
      sourceJobId: 'JOB_CUSTOMER_OPERATIONS_ECOMMERCE_OPERATIONS',
      targetJobId: 'JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 4,
      sourceIndustryId: 'INDUSTRY_ECOMMERCE',
      targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: true },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'COMMERCE_OPERATIONS_TO_PRODUCT_MANAGEMENT',
      requiredPhrases: ['커머스운영 경험은 PM 전환에서', '구매 경험과 운영 맥락을 이해한 도메인 배경'],
      forbiddenPhrases: [],
    },
  },
  {
    id: 'SC-D14',
    input: {
      sourceJobId: 'JOB_BUSINESS_MERCHANDISING',
      targetJobId: 'JOB_BUSINESS_BUSINESS_PLANNING',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 5,
      sourceIndustryId: 'INDUSTRY_ECOMMERCE',
      targetIndustryId: 'INDUSTRY_ECOMMERCE',
      candidateEvidencePack: { hasMetricEvidence: true, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'MD_TO_BUSINESS_PLANNING',
      requiredPhrases: ['MD/머천다이징 경험은 사업기획 전환에서', '상품 구성과 판매 성과를 연결한 상업적 판단력'],
      forbiddenPhrases: [],
    },
  },
  {
    id: 'SC-D15',
    input: {
      sourceJobId: 'JOB_BUSINESS_MERCHANDISING',
      targetJobId: 'JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 5,
      sourceIndustryId: 'INDUSTRY_ECOMMERCE',
      targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: true },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'MD_TO_PRODUCT_MANAGEMENT',
      requiredPhrases: ['MD/머천다이징 경험은 PM 전환에서', '상품과 고객 반응을 이해한 도메인 배경'],
      forbiddenPhrases: [],
    },
  },
  {
    id: 'SC-D16',
    input: {
      sourceJobId: 'JOB_CUSTOMER_OPERATIONS_CX_PLANNING',
      targetJobId: 'JOB_BUSINESS_SERVICE_PLANNING',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 3,
      sourceIndustryId: 'INDUSTRY_IT_PLATFORM',
      targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: true, hasCrossFunctionalEvidence: true, hasCustomerProblemEvidence: true },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_MATCH',
      selectedArchetypeId: 'CX_PLANNING_TO_SERVICE_PLANNING',
      requiredPhrases: ['CX기획 경험은 서비스기획 전환에서', '고객 경험과 서비스 흐름을 개선해본 경험'],
      forbiddenPhrases: [],
    },
  },
  {
    id: 'SC-D17',
    input: {
      sourceJobId: 'JOB_CUSTOMER_OPERATIONS_CX_PLANNING',
      targetJobId: 'JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 4,
      sourceIndustryId: 'INDUSTRY_IT_PLATFORM',
      targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: true, hasCustomerProblemEvidence: true },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'CX_PLANNING_TO_PRODUCT_MANAGEMENT',
      requiredPhrases: ['CX기획 경험은 PM 전환에서', '고객 경험 문제를 제품 개선 과제로 정의한 경험'],
      forbiddenPhrases: [],
    },
  },

  {
    id: 'SC-D18',
    input: {
      sourceJobId: 'JOB_HR_ORGANIZATION_RECRUITING',
      targetJobId: 'JOB_HR_ORGANIZATION_HRBP',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 4,
      sourceIndustryId: 'INDUSTRY_IT_PLATFORM',
      targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: true, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'RECRUITING_TO_HRBP',
      requiredPhrases: ['채용 경험은 HRBP 전환에서', '조직의 인력 수요와 현업 요구를 이해한 경험'],
      forbiddenPhrases: [],
    },
  },
  {
    id: 'SC-D19',
    input: {
      sourceJobId: 'JOB_HR_ORGANIZATION_LEARNING_OD',
      targetJobId: 'JOB_HR_ORGANIZATION_HRBP',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 4,
      sourceIndustryId: 'INDUSTRY_IT_PLATFORM',
      targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: true, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'HRD_TO_HRBP',
      requiredPhrases: ['HRD 경험은 HRBP 전환에서', '구성원 성장과 조직 역량 이슈를 다뤄본 경험'],
      forbiddenPhrases: [],
    },
  },

  {
    id: 'SC-D20',
    input: {
      sourceJobId: 'JOB_FINANCE_ACCOUNTING_TAX',
      targetJobId: 'JOB_FINANCE_ACCOUNTING_FP_AND_A',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 5,
      sourceIndustryId: 'INDUSTRY_MANUFACTURING',
      targetIndustryId: 'INDUSTRY_MANUFACTURING',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'TAX_TO_FPA',
      requiredPhrases: ['세무 경험은 FP&A나 재무기획 전환에서', '비용·리스크·재무 구조를 보는 경험'],
      forbiddenPhrases: [],
    },
  },
  {
    id: 'SC-D21',
    input: {
      sourceJobId: 'JOB_FINANCE_ACCOUNTING_TREASURY',
      targetJobId: 'JOB_FINANCE_ACCOUNTING_FP_AND_A',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 5,
      sourceIndustryId: 'INDUSTRY_MANUFACTURING',
      targetIndustryId: 'INDUSTRY_MANUFACTURING',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'TREASURY_TO_FPA',
      requiredPhrases: ['자금·재무 경험은 FP&A나 재무기획 전환에서', '현금흐름과 재무 구조를 관리해본 경험'],
      forbiddenPhrases: [],
    },
  },
  {
    id: 'SC-D22',
    input: {
      sourceJobId: 'JOB_FINANCE_ACCOUNTING_ACCOUNTING',
      targetJobId: 'JOB_IT_DATA_DIGITAL_DATA_ANALYSIS',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 4,
      sourceIndustryId: 'INDUSTRY_MANUFACTURING',
      targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: true, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'ACCOUNTING_TO_DATA_ANALYTICS',
      requiredPhrases: ['회계·재무 경험은 데이터분석 전환에서', '숫자 기반으로 문제를 해석해본 경험'],
      forbiddenPhrases: [],
    },
  },
  {
    id: 'SC-D23',
    input: {
      sourceJobId: 'JOB_PROCUREMENT_SCM_PURCHASING',
      targetJobId: 'JOB_BUSINESS_BUSINESS_PLANNING',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 5,
      sourceIndustryId: 'INDUSTRY_MANUFACTURING',
      targetIndustryId: 'INDUSTRY_MANUFACTURING',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'PURCHASING_TO_BUSINESS_PLANNING',
      requiredPhrases: ['구매·조달 경험은 사업기획 전환에서', '원가, 공급사, 운영 구조를 이해한 경험'],
      forbiddenPhrases: [],
    },
  },
  {
    id: 'SC-D24',
    input: {
      sourceJobId: 'JOB_PROCUREMENT_SCM_SCM',
      targetJobId: 'JOB_BUSINESS_BUSINESS_PLANNING',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 5,
      sourceIndustryId: 'INDUSTRY_MANUFACTURING',
      targetIndustryId: 'INDUSTRY_MANUFACTURING',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'SCM_TO_BUSINESS_PLANNING',
      requiredPhrases: ['SCM 경험은 사업기획 전환에서', '공급망과 운영 흐름을 사업성과 관점으로'],
      forbiddenPhrases: [],
    },
  },
  {
    id: 'SC-D25',
    input: {
      sourceJobId: 'JOB_PROCUREMENT_SCM_PURCHASING',
      targetJobId: 'JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 5,
      sourceIndustryId: 'INDUSTRY_MANUFACTURING',
      targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'PURCHASING_TO_PRODUCT_MANAGEMENT',
      requiredPhrases: ['구매·조달 경험은 PM 전환에서', '원가, 공급 조건, 파트너 구조를'],
      forbiddenPhrases: [],
    },
  },
  {
    id: 'SC-D26',
    input: {
      sourceJobId: 'JOB_PROCUREMENT_SCM_SCM',
      targetJobId: 'JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 5,
      sourceIndustryId: 'INDUSTRY_MANUFACTURING',
      targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'SCM_TO_PRODUCT_MANAGEMENT',
      requiredPhrases: ['SCM 경험은 PM 전환에서', '운영 흐름과 공급 제약을'],
      forbiddenPhrases: [],
    },
  },
  {
    id: 'SC-D27',
    input: {
      sourceJobId: 'JOB_PROCUREMENT_SCM_PURCHASING',
      targetJobId: 'JOB_BUSINESS_BUSINESS_DEVELOPMENT',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 5,
      sourceIndustryId: 'INDUSTRY_MANUFACTURING',
      targetIndustryId: 'INDUSTRY_MANUFACTURING',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'PURCHASING_TO_BUSINESS_DEVELOPMENT',
      requiredPhrases: ['구매·조달 경험은 BD 전환에서', '외부 파트너와 조건을 조율해본 경험'],
      forbiddenPhrases: [],
    },
  },
  {
    id: 'SC-D28',
    input: {
      sourceJobId: 'JOB_SALES_B2B_SALES',
      targetJobId: 'JOB_BUSINESS_BUSINESS_DEVELOPMENT',
      sourceSubType: null, targetSubType: null,
      yearsOfExperience: 5,
      sourceIndustryId: 'INDUSTRY_IT_PLATFORM', targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: true, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'B2B_SALES_TO_BUSINESS_DEVELOPMENT',
      requiredPhrases: ['B2B영업 경험은 BD 전환에서', '고객사 문제와 외부 의사결정 구조를 이해한 경험'],
      forbiddenPhrases: ['입력된 직무 정보로는 전환 경로를 정확하게 분석하기 어렵습니다'],
    },
  },
  {
    id: 'SC-D29',
    input: {
      sourceJobId: 'JOB_SALES_KEY_ACCOUNT_MANAGEMENT',
      targetJobId: 'JOB_BUSINESS_BUSINESS_DEVELOPMENT',
      sourceSubType: null, targetSubType: null,
      yearsOfExperience: 5,
      sourceIndustryId: 'INDUSTRY_IT_PLATFORM', targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: true, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'ACCOUNT_MANAGEMENT_TO_BUSINESS_DEVELOPMENT',
      requiredPhrases: ['AM 경험은 BD 전환에서', '고객사 관계를 확장하고 추가 기회를 만든 경험'],
      forbiddenPhrases: ['입력된 직무 정보로는 전환 경로를 정확하게 분석하기 어렵습니다'],
    },
  },
  {
    id: 'SC-D30',
    input: {
      sourceJobId: 'JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUCCESS',
      targetJobId: 'JOB_BUSINESS_BUSINESS_DEVELOPMENT',
      sourceSubType: null, targetSubType: null,
      yearsOfExperience: 4,
      sourceIndustryId: 'INDUSTRY_IT_PLATFORM', targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: true, hasCustomerProblemEvidence: true },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'CUSTOMER_SUCCESS_TO_BUSINESS_DEVELOPMENT',
      requiredPhrases: ['Customer Success 경험은 BD 전환에서', '고객의 성공 조건과 확장 기회를 이해한 경험'],
      forbiddenPhrases: ['입력된 직무 정보로는 전환 경로를 정확하게 분석하기 어렵습니다'],
    },
  },
  {
    id: 'SC-D31',
    input: {
      sourceJobId: 'JOB_SALES_SALES_OPERATIONS',
      targetJobId: 'JOB_BUSINESS_BUSINESS_DEVELOPMENT',
      sourceSubType: null, targetSubType: null,
      yearsOfExperience: 4,
      sourceIndustryId: 'INDUSTRY_MANUFACTURING', targetIndustryId: 'INDUSTRY_MANUFACTURING',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'SALES_ADMIN_TO_BUSINESS_DEVELOPMENT',
      requiredPhrases: ['영업관리 경험은 BD 전환에서', '영업 운영 구조와 거래 흐름을 이해한 경험'],
      forbiddenPhrases: ['입력된 직무 정보로는 전환 경로를 정확하게 분석하기 어렵습니다'],
    },
  },
  {
    id: 'SC-D32',
    input: {
      sourceJobId: 'JOB_MARKETING_PERFORMANCE_MARKETING',
      targetJobId: 'JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT',
      sourceSubType: null, targetSubType: null,
      yearsOfExperience: 4,
      sourceIndustryId: 'INDUSTRY_IT_PLATFORM', targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: true, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'PERFORMANCE_MARKETING_TO_PRODUCT_MANAGEMENT',
      requiredPhrases: ['퍼포먼스마케팅 경험은 PM 전환에서', '데이터 기반 실험과 제품 성장 지표를 이해한 경험'],
      forbiddenPhrases: ['입력된 직무 정보로는 전환 경로를 정확하게 분석하기 어렵습니다'],
    },
  },

  // ── Group P: PARTIAL group nonfire ───────────────────────────────────────
  {
    // engineering source: engineering:service_planning entry added → ARCHETYPE_WITH_MODIFIER
    id: 'SC-P1',
    input: {
      sourceJobId: 'JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT',
      targetJobId: 'JOB_BUSINESS_SERVICE_PLANNING',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 5,
      sourceIndustryId: 'INDUSTRY_IT_PLATFORM',
      targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'ENGINEERING_TO_SERVICE_PLANNING',
      requiredPhrases: ['개발 경험은 서비스기획 전환에서도 강점이 될 수 있습니다'],
      forbiddenPhrases: ['입력된 직무 정보로는 전환 경로를 정확하게 분석하기 어렵습니다'],
    },
  },
  {
    // ux_design source: no ARCHETYPE_TABLE entry → generic FALLBACK
    id: 'SC-P2',
    input: {
      sourceJobId: 'JOB_DESIGN_UX_DESIGN',
      targetJobId: 'JOB_BUSINESS_SERVICE_PLANNING',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 4,
      sourceIndustryId: 'INDUSTRY_IT_PLATFORM',
      targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'FALLBACK',
      selectedArchetypeId: null,
      requiredPhrases: ['입력된 직무 정보로는 전환 경로를 정확하게 분석하기 어렵습니다'],
      forbiddenPhrases: ['퍼포먼스마케팅 경험은', 'CS·고객 응대', '반복 VOC'],
    },
  },
  {
    // service_planning → ux_design without ambiguous_service_design subtype
    // must use generic FALLBACK_OVERLAYS, not E12-specific overlays
    id: 'SC-P3',
    input: {
      sourceJobId: 'JOB_BUSINESS_SERVICE_PLANNING',
      targetJobId: 'JOB_DESIGN_UX_DESIGN',
      sourceSubType: 'service_planning',
      targetSubType: null,
      yearsOfExperience: 4,
      sourceIndustryId: 'INDUSTRY_IT_PLATFORM',
      targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'FALLBACK',
      selectedArchetypeId: null,
      requiredPhrases: ['입력된 직무 정보로는 전환 경로를 정확하게 분석하기 어렵습니다'],
      forbiddenPhrases: [
        '목표 직무가 서비스기획인지 서비스디자인인지 불명확하면 자동 해석을 제한해야 한다',
        '서비스기획 경험은 사업기획의',
        '서비스기획 경험은 PM',
      ],
    },
  },
  {
    // research source: no ARCHETYPE_TABLE entry → generic FALLBACK
    id: 'SC-P4',
    input: {
      sourceJobId: 'JOB_RESEARCH_PROFESSIONAL_MARKET_INDUSTRY_RESEARCH',
      targetJobId: 'JOB_BUSINESS_SERVICE_PLANNING',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 3,
      sourceIndustryId: 'INDUSTRY_IT_PLATFORM',
      targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'FALLBACK',
      selectedArchetypeId: null,
      requiredPhrases: ['입력된 직무 정보로는 전환 경로를 정확하게 분석하기 어렵습니다'],
      forbiddenPhrases: ['반복 VOC', '퍼포먼스마케팅 경험은'],
    },
  },

  // ── Group E: FALLBACK ─────────────────────────────────────────────────────
  {
    id: 'SC-E12',
    input: {
      sourceJobId: 'JOB_BUSINESS_SERVICE_PLANNING',
      targetJobId: 'JOB_DESIGN_UX_DESIGN',
      sourceSubType: 'service_planning',
      targetSubType: 'ambiguous_service_design',
      yearsOfExperience: 4,
      sourceIndustryId: 'INDUSTRY_IT_PLATFORM',
      targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'FALLBACK',
      selectedArchetypeId: null,
      requiredPhrases: [
        '목표 직무가 서비스기획인지 서비스디자인인지 불명확하면 자동 해석을 제한해야 한다',
        '화면/기능 요구사항과 리서치/경험설계는 구분해야 한다',
      ],
      forbiddenPhrases: [
        '서비스기획 경험은 서비스디자인과 자연스럽게 연결됩니다',
        'VOC를 기반으로 고객 여정을 설계하면 됩니다',
        '여정 지도',
        '화면 흐름',
        '문제정의',
        '제품 오너십',
      ],
    },
  },

  // ── Group Q: customer_support / customer_success → cx_planning / operations_planning ──
  {
    id: 'SC-Q1',
    input: {
      sourceJobId: 'JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS',
      targetJobId: 'JOB_CUSTOMER_OPERATIONS_CX_PLANNING',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 3,
      sourceIndustryId: 'INDUSTRY_ECOMMERCE',
      targetIndustryId: 'INDUSTRY_ECOMMERCE',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: true, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: true },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'CUSTOMER_SUPPORT_TO_CX_PLANNING',
      requiredPhrases: [
        '고객지원 경험은 CX기획 전환에서',
        '고객 불편과 반복 이슈를 가장 가까이에서 파악한 경험',
      ],
      forbiddenPhrases: [],
    },
  },
  {
    id: 'SC-Q2',
    input: {
      sourceJobId: 'JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUCCESS',
      targetJobId: 'JOB_CUSTOMER_OPERATIONS_CX_PLANNING',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 4,
      sourceIndustryId: 'INDUSTRY_SAAS',
      targetIndustryId: 'INDUSTRY_SAAS',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'CUSTOMER_SUCCESS_TO_CX_PLANNING',
      requiredPhrases: [
        'Customer Success 경험은 CX기획 전환에서',
        '고객의 사용 여정과 성공 조건을 이해한 경험',
      ],
      forbiddenPhrases: [],
    },
  },
  {
    id: 'SC-Q3',
    input: {
      sourceJobId: 'JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS',
      targetJobId: 'JOB_CUSTOMER_OPERATIONS_OPERATION_PLANNING',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 3,
      sourceIndustryId: 'INDUSTRY_ECOMMERCE',
      targetIndustryId: 'INDUSTRY_ECOMMERCE',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: true, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'CUSTOMER_SUPPORT_TO_OPERATIONS_PLANNING',
      requiredPhrases: [
        '고객지원 경험은 운영기획 전환에서',
        '반복 업무와 고객 이슈를 프로세스로 정리한 경험',
      ],
      forbiddenPhrases: [],
    },
  },

  // ── Group IT: IT기획 전환 ─────────────────────────────────────────────────
  {
    id: 'SC-IT1',
    input: {
      sourceJobId: 'JOB_IT_DATA_DIGITAL_IT_PLANNING',
      targetJobId: 'JOB_BUSINESS_SERVICE_PLANNING',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 5,
      sourceIndustryId: 'INDUSTRY_IT_PLATFORM',
      targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_MATCH',
      selectedArchetypeId: 'IT_PLANNING_TO_SERVICE_PLANNING',
      requiredPhrases: ['IT기획 경험은 서비스기획 전환에서 가장 자연스러운 경로 중 하나입니다'],
      forbiddenPhrases: ['입력된 직무 정보로는 전환 경로를 정확하게 분析하기 어렵습니다'],
    },
  },
  {
    id: 'SC-IT2',
    input: {
      sourceJobId: 'JOB_IT_DATA_DIGITAL_IT_PLANNING',
      targetJobId: 'JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 5,
      sourceIndustryId: 'INDUSTRY_IT_PLATFORM',
      targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_MATCH',
      selectedArchetypeId: 'IT_PLANNING_TO_PRODUCT_MANAGEMENT',
      requiredPhrases: ['IT기획 경험은 PM 전환에서 기술 이해와 기획 역량을 동시에 갖춘 강점으로 읽힙니다'],
      forbiddenPhrases: ['입력된 직무 정보로는 전환 경로를 정확하게 분析하기 어렵습니다'],
    },
  },

  // ── Group P (continued): 엔지니어링·QA → PM / 서비스기획 ─────────────────
  {
    id: 'SC-P5',
    input: {
      sourceJobId: 'JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT',
      targetJobId: 'JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 5,
      sourceIndustryId: 'INDUSTRY_IT_PLATFORM',
      targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'ENGINEERING_TO_PRODUCT_MANAGER',
      requiredPhrases: ['개발 경험은 PM 전환에서 분명한 강점이 될 수 있습니다'],
      forbiddenPhrases: ['입력된 직무 정보로는 전환 경로를 정확하게 분析하기 어렵습니다'],
    },
  },
  {
    id: 'SC-P6',
    input: {
      sourceJobId: 'JOB_IT_DATA_DIGITAL_QA_TEST_AUTOMATION',
      targetJobId: 'JOB_BUSINESS_SERVICE_PLANNING',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 4,
      sourceIndustryId: 'INDUSTRY_IT_PLATFORM',
      targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_MATCH',
      selectedArchetypeId: 'QA_ENGINEER_TO_SERVICE_PLANNING',
      requiredPhrases: ['QA 경험은 서비스기획 전환에서 사용자 시나리오와 예외 케이스를 잘 이해한다는 강점으로 연결될 수 있습니다'],
      forbiddenPhrases: ['입력된 직무 정보로는 전환 경로를 정확하게 분析하기 어렵습니다'],
    },
  },
  {
    id: 'SC-P7',
    input: {
      sourceJobId: 'JOB_IT_DATA_DIGITAL_QA_TEST_AUTOMATION',
      targetJobId: 'JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 4,
      sourceIndustryId: 'INDUSTRY_IT_PLATFORM',
      targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'QA_ENGINEER_TO_PRODUCT_MANAGER',
      requiredPhrases: ['QA 경험은 PM 전환에서 품질 기준과 사용자 시나리오를 깊게 이해했다는 강점으로 연결될 수 있습니다'],
      forbiddenPhrases: ['입력된 직무 정보로는 전환 경로를 정확하게 분析하기 어렵습니다'],
    },
  },

  // ── Group DA: 데이터분석·사업기획 전환 ────────────────────────────────────
  {
    id: 'SC-DA1',
    input: {
      sourceJobId: 'JOB_IT_DATA_DIGITAL_DATA_ANALYSIS',
      targetJobId: 'JOB_BUSINESS_SERVICE_PLANNING',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 4,
      sourceIndustryId: 'INDUSTRY_IT_PLATFORM',
      targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'DATA_ANALYTICS_TO_SERVICE_PLANNING',
      requiredPhrases: ["'문제 발견과 개선 근거'를 만드는 강점으로 연결될 수 있습니다"],
      forbiddenPhrases: ['입력된 직무 정보로는 전환 경로를 정확하게 분析하기 어렵습니다'],
    },
  },
  {
    id: 'SC-DA2',
    input: {
      sourceJobId: 'JOB_IT_DATA_DIGITAL_DATA_ANALYSIS',
      targetJobId: 'JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 4,
      sourceIndustryId: 'INDUSTRY_IT_PLATFORM',
      targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'DATA_ANALYTICS_TO_PRODUCT_MANAGEMENT',
      requiredPhrases: ["'제품 문제를 지표로 발견하고 검증하는 강점'으로 연결될 수 있습니다"],
      forbiddenPhrases: ['입력된 직무 정보로는 전환 경로를 정확하게 분析하기 어렵습니다'],
    },
  },
  {
    id: 'SC-DA3',
    input: {
      sourceJobId: 'JOB_IT_DATA_DIGITAL_DATA_ANALYSIS',
      targetJobId: 'JOB_BUSINESS_BUSINESS_PLANNING',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 4,
      sourceIndustryId: 'INDUSTRY_IT_PLATFORM',
      targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'DATA_ANALYTICS_TO_BUSINESS_PLANNING',
      requiredPhrases: ["'사업 문제를 숫자로 구조화한 경험'으로 연결될 수 있습니다"],
      forbiddenPhrases: ['입력된 직무 정보로는 전환 경로를 정확하게 분析하기 어렵습니다'],
    },
  },
  {
    id: 'SC-DA4',
    input: {
      sourceJobId: 'JOB_BUSINESS_BUSINESS_PLANNING',
      targetJobId: 'JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT',
      sourceSubType: null,
      targetSubType: null,
      yearsOfExperience: 5,
      sourceIndustryId: 'INDUSTRY_IT_PLATFORM',
      targetIndustryId: 'INDUSTRY_IT_PLATFORM',
      candidateEvidencePack: { hasMetricEvidence: false, hasProcessImprovementEvidence: false, hasCrossFunctionalEvidence: false, hasCustomerProblemEvidence: false },
    },
    expected: {
      resolutionStatus: 'ARCHETYPE_WITH_MODIFIER',
      selectedArchetypeId: 'BUSINESS_PLANNING_TO_PRODUCT_MANAGEMENT',
      requiredPhrases: ["사업기획 경험은 PM 전환에서 '사업성과와 제품 방향을 연결하는 관점'으로 강점이 될 수 있습니다"],
      forbiddenPhrases: ['입력된 직무 정보로는 전환 경로를 정확하게 분析하기 어렵습니다'],
    },
  },
];

function overlayText(overlays) {
  return Object.values(overlays)
    .flatMap((axis) => Object.values(axis))
    .join('\n');
}

let passCount = 0;
let failCount = 0;

for (const tc of CASES) {
  const result = resolveCareerTransitionArchetype(tc.input);
  const failures = [];

  if (result.resolutionStatus !== tc.expected.resolutionStatus) {
    failures.push(`resolutionStatus: got "${result.resolutionStatus}", want "${tc.expected.resolutionStatus}"`);
  }

  if (result.resolutionStatus === 'CURATED_MATCH' && result.selectedCaseId === null) {
    failures.push(`CURATED_MATCH must have non-null selectedCaseId`);
  }

  if (result.selectedArchetypeId !== tc.expected.selectedArchetypeId) {
    failures.push(`selectedArchetypeId: got "${result.selectedArchetypeId}", want "${tc.expected.selectedArchetypeId}"`);
  }

  const text = overlayText(result.overlays);

  for (const phrase of tc.expected.requiredPhrases) {
    if (!text.includes(phrase)) {
      failures.push(`requiredPhrase missing: "${phrase}"`);
    }
  }

  for (const phrase of tc.expected.forbiddenPhrases) {
    if (text.includes(phrase)) {
      failures.push(`forbiddenPhrase present: "${phrase}"`);
    }
  }

  if (failures.length === 0) {
    console.log(`PASS  ${tc.id}`);
    passCount++;
  } else {
    console.log(`FAIL  ${tc.id}`);
    for (const f of failures) console.log(`      ${f}`);
    failCount++;
  }
}

console.log(`\n${passCount} passed, ${failCount} failed`);
if (failCount > 0) process.exit(1);
