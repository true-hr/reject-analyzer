/**
 * career-transition-case-matrix.js
 *
 * Career transition profile smoke runner의 supplemental fixture 목록.
 * F-SCALE-1 이후: registry auto smoke가 primary — 여기는 수동 설계 edge case 전용.
 *
 * status:
 *   SUPPLEMENTAL_LOCKED  - 과거 LOCKED 케이스. auto smoke로 이미 커버됨 → runner가 SKIP.
 *                          삭제하지 말 것 — 계약 이력 및 edge case 참조용.
 *   PROPOSED             - 미구현 profile 케이스. 실행 대상에서 제외.
 *   SKIPPED_ID_UNRESOLVED - ID resolve 불확실. 실행 대상에서 제외.
 *
 * 새 케이스 추가 기준:
 *   - registry auto smoke로 생성 불가한 입력 조합 (두 번째 sourceJobId, 특수 industry 조합 등)
 *   - bridge 경계 문구의 정밀 검증이 필요한 경우
 *   - auto case가 커버하지 않는 nonfire 조합
 */

export const CAREER_TRANSITION_SUPPLEMENTAL_CASES = [
  // ─── CS → 서비스기획 (supplemental — auto-covered) ────────────────────────

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
    status: "SUPPLEMENTAL_LOCKED",
  },

  {
    caseId: "TR-BOUNDARY-CS-TO-SERVICE-001",
    caseType: "BOUNDARY_COPY",
    description: "CS → 서비스기획: 과대평가 문구 금지 확인",
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
    status: "SUPPLEMENTAL_LOCKED",
  },

  // ─── Nonfire: CS profile (supplemental — auto-covered) ───────────────────

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
    status: "SUPPLEMENTAL_LOCKED",
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
    status: "SUPPLEMENTAL_LOCKED",
  },

  // ─── Finance → 데이터분석 (supplemental — auto-covered) ──────────────────

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
    status: "SUPPLEMENTAL_LOCKED",
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
    status: "SUPPLEMENTAL_LOCKED",
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
    status: "SUPPLEMENTAL_LOCKED",
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
    status: "SUPPLEMENTAL_LOCKED",
  },

  // ─── Performance Marketing → 서비스기획 (supplemental — auto-covered) ────

  {
    caseId: "TR-PROFILE-MARKETING-TO-SERVICE-001",
    caseType: "ACTIVATION",
    description: "퍼포먼스마케팅 → 서비스기획: PERFORMANCE_MARKETING_TO_SERVICE_PLANNING 발화 확인",
    currentJobId: "JOB_MARKETING_PERFORMANCE_MARKETING",
    currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
    targetJobId: "JOB_BUSINESS_SERVICE_PLANNING",
    targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
    expectedProfileIds: ["PERFORMANCE_MARKETING_TO_SERVICE_PLANNING"],
    forbiddenProfileIds: [],
    expectedAxisSlots: {
      jobStructure: ["lead", "scoreReason", "criteria"],
      responsibilityScope: ["lead", "liftOrLimit"],
    },
    shouldMention: [
      "마케팅 경험은 서비스기획과 바로 같은 일은 아니지만",
      "퍼널 분석",
      "전환율 변화",
      "A/B 테스트 결과",
    ],
    shouldNotMention: [
      "고객 응대 경험은 서비스기획과 연결될 수 있습니다",
      "VOC 분석표",
      "반복 문의 3~5개",
      "회계·재무 경험은 데이터분석과",
      "SQL 쿼리",
    ],
    status: "SUPPLEMENTAL_LOCKED",
  },

  {
    caseId: "TR-BOUNDARY-MARKETING-TO-SERVICE-001",
    caseType: "BOUNDARY_COPY",
    description: "퍼포먼스마케팅 → 서비스기획: 과대평가 문구 금지 확인",
    currentJobId: "JOB_MARKETING_PERFORMANCE_MARKETING",
    currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
    targetJobId: "JOB_BUSINESS_SERVICE_PLANNING",
    targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
    expectedProfileIds: ["PERFORMANCE_MARKETING_TO_SERVICE_PLANNING"],
    forbiddenProfileIds: [],
    expectedAxisSlots: {},
    shouldMention: [
      "캠페인 성과",
      "기능 개선안",
      "산출물",
    ],
    shouldNotMention: [
      "서비스기획 경험으로 볼 수 있습니다",
      "PM 경험으로 볼 수 있습니다",
      "기획 역량이 충분합니다",
    ],
    status: "SUPPLEMENTAL_LOCKED",
  },

  {
    caseId: "TR-NONFIRE-CS-TO-SERVICE-MARKETING-PROFILE-001",
    caseType: "NONFIRE",
    description: "CS → 서비스기획: Marketing profile 오발화 방지",
    currentJobId: "JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS",
    currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
    targetJobId: "JOB_BUSINESS_SERVICE_PLANNING",
    targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
    expectedProfileIds: [],
    forbiddenProfileIds: ["PERFORMANCE_MARKETING_TO_SERVICE_PLANNING"],
    expectedAxisSlots: {},
    shouldMention: [],
    shouldNotMention: [
      "마케팅 경험은 서비스기획과 바로 같은 일은 아니지만",
      "퍼널 분석",
      "전환율 변화",
      "A/B 테스트 결과",
    ],
    status: "SUPPLEMENTAL_LOCKED",
  },

  {
    caseId: "TR-NONFIRE-FINANCE-TO-DATA-MARKETING-PROFILE-001",
    caseType: "NONFIRE",
    description: "회계 → 데이터분석: Marketing profile 오발화 방지",
    currentJobId: "JOB_FINANCE_ACCOUNTING_ACCOUNTING",
    currentIndustryId: "IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING",
    targetJobId: "JOB_IT_DATA_DIGITAL_DATA_ANALYSIS",
    targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_AI_DATA_CLOUD",
    expectedProfileIds: [],
    forbiddenProfileIds: ["PERFORMANCE_MARKETING_TO_SERVICE_PLANNING"],
    expectedAxisSlots: {},
    shouldMention: [],
    shouldNotMention: [
      "마케팅 경험은 서비스기획과 바로 같은 일은 아니지만",
      "퍼널 분석",
      "전환율 변화",
    ],
    status: "SUPPLEMENTAL_LOCKED",
  },
];
