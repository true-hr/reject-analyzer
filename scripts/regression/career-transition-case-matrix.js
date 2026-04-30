/**
 * career-transition-case-matrix.js
 *
 * Career transition profile smoke runner의 fixture 목록.
 * D/E의 newgrad-core-invariant-cases.js에 해당.
 *
 * caseType 정의:
 *   ACTIVATION    - expectedProfileIds 발화 확인 + slot/shouldMention 검증
 *   BOUNDARY_COPY - profile 발화되지만 shouldNotMention 위반 없어야 함
 *   NONFIRE       - forbiddenProfileIds가 발화하면 안 됨 + shouldNotMention 위반 없어야 함
 *
 * status:
 *   LOCKED   - smoke 실행 대상
 *   PROPOSED - 미구현 profile 케이스. 실행 대상에서 제외 (SKIPPED 출력)
 *   SKIPPED_ID_UNRESOLVED - ID resolve 불확실. 실행 대상에서 제외
 */

export const CAREER_TRANSITION_CASES = [
  // ─── CS → 서비스기획 ────────────────────────────────────────────────────────

  {
    caseId: "TR-PROFILE-CS-TO-SERVICE-001",
    caseType: "ACTIVATION",
    description: "CS → 서비스기획: CUSTOMER_SUPPORT_TO_SERVICE_PLANNING 발화 확인",
    currentJobId: "JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS",
    currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
    targetJobId: "JOB_BUSINESS_SERVICE_PLANNING",
    targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
    expectedProfileIds: ["CUSTOMER_SUPPORT_TO_SERVICE_PLANNING"],
    forbiddenProfileIds: [],
    expectedAxisSlots: {
      jobStructure: ["lead", "scoreReason", "criteria"],
      responsibilityScope: ["lead", "liftOrLimit"],
    },
    shouldMention: [
      "고객 응대 경험은 서비스기획과 연결될 수 있습니다",
      "VOC 분석표",
      "반복 문의 3~5개",
    ],
    shouldNotMention: [
      "회계",
      "재무",
      "퍼포먼스마케팅",
      "SQL",
      "Python",
    ],
    status: "LOCKED",
  },

  {
    caseId: "TR-BOUNDARY-CS-TO-SERVICE-001",
    caseType: "BOUNDARY_COPY",
    description: "CS → 서비스기획: 과대평가 문구 금지 확인 (현재 gate는 jobId 기반이므로 profile은 발화, 문구만 검증)",
    currentJobId: "JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS",
    currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
    targetJobId: "JOB_BUSINESS_SERVICE_PLANNING",
    targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
    expectedProfileIds: ["CUSTOMER_SUPPORT_TO_SERVICE_PLANNING"],
    forbiddenProfileIds: [],
    expectedAxisSlots: {},
    shouldMention: [
      "고객 불편",
      "개선안",
      "산출물",
    ],
    shouldNotMention: [
      "서비스기획 경험으로 볼 수 있습니다",
      "PM 경험으로 볼 수 있습니다",
      "기획 역량이 충분합니다",
    ],
    status: "LOCKED",
  },

  // ─── Nonfire: CS profile이 발화하면 안 되는 케이스 ────────────────────────

  {
    caseId: "TR-NONFIRE-FINANCE-TO-DATA-001",
    caseType: "NONFIRE",
    description: "회계 → 데이터분석: CS profile 오발화 방지",
    currentJobId: "JOB_FINANCE_ACCOUNTING_ACCOUNTING",
    currentIndustryId: "IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING",
    targetJobId: "JOB_IT_DATA_DIGITAL_DATA_ANALYSIS",
    targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_AI_DATA_CLOUD",
    expectedProfileIds: [],
    forbiddenProfileIds: ["CUSTOMER_SUPPORT_TO_SERVICE_PLANNING"],
    expectedAxisSlots: {},
    shouldMention: [],
    shouldNotMention: [
      "고객 응대 경험은 서비스기획과 연결될 수 있습니다",
      "VOC 분석표",
      "반복 문의 3~5개",
    ],
    status: "LOCKED",
  },

  {
    caseId: "TR-NONFIRE-MARKETING-TO-PRODUCT-001",
    caseType: "NONFIRE",
    description: "퍼포먼스마케팅 → 서비스기획: CS profile 오발화 방지",
    currentJobId: "JOB_MARKETING_PERFORMANCE_MARKETING",
    currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
    targetJobId: "JOB_BUSINESS_SERVICE_PLANNING",
    targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
    expectedProfileIds: [],
    forbiddenProfileIds: ["CUSTOMER_SUPPORT_TO_SERVICE_PLANNING"],
    expectedAxisSlots: {},
    shouldMention: [],
    shouldNotMention: [
      "고객 응대 경험은 서비스기획과 연결될 수 있습니다",
      "VOC 분석표",
      "반복 문의 3~5개",
    ],
    status: "LOCKED",
  },

  // ─── Finance → 데이터분석 ──────────────────────────────────────────────────

  {
    caseId: "TR-PROFILE-FINANCE-TO-DATA-001",
    caseType: "ACTIVATION",
    description: "회계 → 데이터분석: FINANCE_ACCOUNTING_TO_DATA_ANALYSIS 발화 확인",
    currentJobId: "JOB_FINANCE_ACCOUNTING_ACCOUNTING",
    currentIndustryId: "IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING",
    targetJobId: "JOB_IT_DATA_DIGITAL_DATA_ANALYSIS",
    targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_AI_DATA_CLOUD",
    expectedProfileIds: ["FINANCE_ACCOUNTING_TO_DATA_ANALYSIS"],
    forbiddenProfileIds: [],
    expectedAxisSlots: {
      jobStructure: ["lead", "scoreReason", "criteria"],
      industryContext: ["lead", "liftOrLimit"],
    },
    shouldMention: [
      "회계·재무 경험은 데이터분석과 바로 같은 일은 아니지만",
      "SQL 쿼리",
      "재무 데이터 대시보드",
      "작은 분석 산출물",
    ],
    shouldNotMention: [
      "고객 응대 경험은 서비스기획과 연결",
      "VOC 분석표",
      "퍼포먼스마케팅",
      "A/B 테스트",
    ],
    status: "LOCKED",
  },

  {
    caseId: "TR-BOUNDARY-FINANCE-TO-DATA-001",
    caseType: "BOUNDARY_COPY",
    description: "회계 → 데이터분석: 숫자 업무 과대평가 문구 금지 확인",
    currentJobId: "JOB_FINANCE_ACCOUNTING_ACCOUNTING",
    currentIndustryId: "IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING",
    targetJobId: "JOB_IT_DATA_DIGITAL_DATA_ANALYSIS",
    targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_AI_DATA_CLOUD",
    expectedProfileIds: ["FINANCE_ACCOUNTING_TO_DATA_ANALYSIS"],
    forbiddenProfileIds: [],
    expectedAxisSlots: {},
    shouldMention: [
      "데이터를 직접 추출·가공",
      "재현 가능한 형태",
      "작은 분석 산출물",
    ],
    shouldNotMention: [
      "데이터분석 역량이 충분합니다",
      "데이터분석 경험으로 볼 수 있습니다",
      "바로 데이터분석 직무에 적합합니다",
    ],
    status: "LOCKED",
  },

  {
    caseId: "TR-NONFIRE-CS-TO-SERVICE-FINANCE-PROFILE-001",
    caseType: "NONFIRE",
    description: "CS → 서비스기획: Finance profile 오발화 방지",
    currentJobId: "JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS",
    currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
    targetJobId: "JOB_BUSINESS_SERVICE_PLANNING",
    targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
    expectedProfileIds: [],
    forbiddenProfileIds: ["FINANCE_ACCOUNTING_TO_DATA_ANALYSIS"],
    expectedAxisSlots: {},
    shouldMention: [],
    shouldNotMention: [
      "회계·재무 경험은 데이터분석과",
      "SQL 쿼리",
      "재무 데이터 대시보드",
    ],
    status: "LOCKED",
  },

  {
    caseId: "TR-NONFIRE-MARKETING-TO-PRODUCT-FINANCE-PROFILE-001",
    caseType: "NONFIRE",
    description: "퍼포먼스마케팅 → 서비스기획: Finance profile 오발화 방지",
    currentJobId: "JOB_MARKETING_PERFORMANCE_MARKETING",
    currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
    targetJobId: "JOB_BUSINESS_SERVICE_PLANNING",
    targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
    expectedProfileIds: [],
    forbiddenProfileIds: ["FINANCE_ACCOUNTING_TO_DATA_ANALYSIS"],
    expectedAxisSlots: {},
    shouldMention: [],
    shouldNotMention: [
      "회계·재무 경험은 데이터분석과",
      "SQL 쿼리",
      "재무 데이터 대시보드",
    ],
    status: "LOCKED",
  },

  // ─── Pending: 미구현 profile (smoke 실행 제외) ───────────────────────────

  {
    caseId: "TR-PROFILE-MARKETING-TO-PRODUCT-001",
    caseType: "ACTIVATION",
    description: "퍼포먼스마케팅 → 서비스기획: PERFORMANCE_MARKETING_TO_SERVICE_PLANNING (미구현)",
    currentJobId: "JOB_MARKETING_PERFORMANCE_MARKETING",
    currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
    targetJobId: "JOB_BUSINESS_SERVICE_PLANNING",
    targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
    expectedProfileIds: ["PERFORMANCE_MARKETING_TO_SERVICE_PLANNING"],
    forbiddenProfileIds: [],
    expectedAxisSlots: {},
    shouldMention: [],
    shouldNotMention: [],
    status: "PROPOSED",
  },
];
