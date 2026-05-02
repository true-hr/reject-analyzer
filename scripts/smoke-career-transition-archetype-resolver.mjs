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
      resolutionStatus: 'ARCHETYPE_MATCH',
      selectedArchetypeId: 'ACCOUNTING_TO_BUSINESS_FINANCE',
      requiredPhrases: ['회계 경험은 FP&A의 재무 분석 역량', '예산 수립'],
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
      requiredPhrases: ['인사 제도 운영 경험', '현업 협업'],
      forbiddenPhrases: [],
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
