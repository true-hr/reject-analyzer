// src/lib/analysis/careerTransitionCaseProfiles.js
// Career transition profile data registry.
// Engine is in careerTransitionCaseOverlays.js.
//
// Each profile:
//   status: "IMPLEMENTED" | "PROPOSED"
//   sourceJobIds / targetJobIds: direct matching (no classifyTransition)
//   overlays: { axisKey: { slot: text } } — injected into axisPack.axes[key].explanation
//   smoke: activation / boundaryCopy / nonfire test contract
//   conflict: overlap metadata for conflict guard

export const CAREER_TRANSITION_CASE_PROFILES = [
  // ─── CS → 서비스기획 ────────────────────────────────────────────────────────

  {
    id: "CUSTOMER_SUPPORT_TO_SERVICE_PLANNING",
    status: "IMPLEMENTED",
    priority: "P0",
    sourceJobIds: [
      "JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS",
    ],
    targetJobIds: [
      "JOB_BUSINESS_SERVICE_PLANNING",
    ],
    transitionType: "ADJACENT",
    bridgeTags: ["VOC", "반복 문의", "고객 불편", "문제 발견"],
    limitationTags: ["기획 산출물 없음", "요구사항 미작성"],
    evidenceTags: ["VOC 분석표", "화면흐름도", "기능정의서", "개선안"],
    targetAxes: ["jobStructure", "responsibilityScope"],
    targetSlots: {
      jobStructure: ["lead", "scoreReason", "criteria"],
      responsibilityScope: ["lead", "liftOrLimit"],
    },
    overlays: {
      jobStructure: {
        lead: "고객 응대 경험은 서비스기획과 연결될 수 있습니다. 고객 불편과 반복 문의를 직접 봤다는 점은 문제를 발견하는 감각의 근거가 됩니다.",
        scoreReason: "다만 서비스기획에서는 고객 문제를 단순히 이해하는 것을 넘어, 요구사항·개선안·화면 흐름처럼 제품으로 바꾸는 과정이 중요합니다.",
        criteria: "확인 가능한 근거는 VOC 분석표, 개선안, 기능정의서, 화면흐름도, 우선순위 판단 근거입니다.",
      },
      responsibilityScope: {
        lead: "CS 경험을 기획 직무 근거로 살리려면, 응대 경험을 VOC 분석이나 개선안으로 정리한 흔적이 필요합니다.",
        liftOrLimit: "다음 보완은 반복 문의 3~5개를 묶어 문제 원인, 개선 아이디어, 기능 우선순위, 간단한 화면 흐름으로 정리한 산출물 1개를 만드는 것입니다.",
      },
    },
    smokeInput: {
      currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
      targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
    },
    smoke: {
      activation: {
        expectedAxisSlots: {
          jobStructure: ["lead", "scoreReason", "criteria"],
          responsibilityScope: ["lead", "liftOrLimit"],
        },
        shouldMention: [
          "고객 응대 경험은 서비스기획과 연결될 수 있습니다",
          "VOC 분석표",
          "반복 문의 3~5개",
        ],
        shouldNotMention: ["회계", "재무", "퍼포먼스마케팅", "SQL", "Python"],
      },
      boundaryCopy: {
        shouldMention: ["고객 불편", "개선안", "산출물"],
        shouldNotMention: [
          "서비스기획 경험으로 볼 수 있습니다",
          "PM 경험으로 볼 수 있습니다",
          "기획 역량이 충분합니다",
        ],
      },
      nonfire: {
        shouldNotMention: [
          "고객 응대 경험은 서비스기획과 연결될 수 있습니다",
          "VOC 분석표",
          "반복 문의 3~5개",
        ],
      },
    },
    conflict: {
      targetOverlapRisk: "MEDIUM",
      sharedTargetWith: ["PERFORMANCE_MARKETING_TO_SERVICE_PLANNING"],
      notes: "CS와 Marketing은 JOB_BUSINESS_SERVICE_PLANNING을 공유 target으로 가짐. source set이 분리되어 있어 동일 입력에서 co-fire 불가.",
    },
    notes: "F-2A 구현. currentJobId 필수 — career mode 전용.",
  },

  // ─── Finance → 데이터분석 ──────────────────────────────────────────────────

  {
    id: "FINANCE_ACCOUNTING_TO_DATA_ANALYSIS",
    status: "IMPLEMENTED",
    priority: "P0",
    sourceJobIds: [
      "JOB_FINANCE_ACCOUNTING_ACCOUNTING",
      "JOB_FINANCE_ACCOUNTING_FP_AND_A",
    ],
    targetJobIds: [
      "JOB_IT_DATA_DIGITAL_DATA_ANALYSIS",
    ],
    transitionType: "ADJACENT",
    bridgeTags: ["숫자 해석", "지표 분석", "의사결정 자료", "재무 데이터"],
    limitationTags: ["SQL/Python 없음", "재현 가능 산출물 없음"],
    evidenceTags: ["SQL 쿼리", "Python 분석", "재무 데이터 대시보드", "분석 리포트"],
    targetAxes: ["jobStructure", "industryContext"],
    targetSlots: {
      jobStructure: ["lead", "scoreReason", "criteria"],
      industryContext: ["lead", "liftOrLimit"],
    },
    overlays: {
      jobStructure: {
        lead: "회계·재무 경험은 데이터분석과 바로 같은 일은 아니지만, 숫자와 지표를 해석해 의사결정 자료로 정리했다는 점에서 연결될 수 있습니다.",
        scoreReason: "다만 데이터분석 직무에서는 숫자를 읽는 감각을 넘어, 데이터를 직접 추출·가공하고 분석 결과를 재현 가능한 형태로 남기는 과정이 중요합니다.",
        criteria: "확인 가능한 근거는 SQL 쿼리, Python 분석, 재무 데이터 대시보드, 분석 리포트, 반복 보고 자동화 산출물입니다.",
      },
      industryContext: {
        lead: "금융·재무 데이터를 다뤄본 경험은 데이터의 정확성, 기준값, 지표 해석을 이해하는 데 도움이 됩니다.",
        liftOrLimit: "다음 보완은 재무 지표 하나를 정해 원천 데이터 정리, 계산 기준, 해석 결과, 시각화 화면까지 연결한 작은 분석 산출물을 만드는 것입니다.",
      },
    },
    smokeInput: {
      currentIndustryId: "IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING",
      targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_AI_DATA_CLOUD",
    },
    smoke: {
      activation: {
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
      },
      boundaryCopy: {
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
      },
      nonfire: {
        shouldNotMention: [
          "회계·재무 경험은 데이터분석과",
          "SQL 쿼리",
          "재무 데이터 대시보드",
        ],
      },
    },
    conflict: {
      targetOverlapRisk: "LOW",
      sharedTargetWith: [],
      notes: "target(JOB_IT_DATA_DIGITAL_DATA_ANALYSIS)이 다른 구현 profile과 겹치지 않음.",
    },
    notes: "F-2B 구현. responsibilityScope/roleCharacter는 already high(100) — 미적용 (과잉 설명 방지).",
  },

  // ─── Performance Marketing → 서비스기획 ──────────────────────────────────

  {
    id: "PERFORMANCE_MARKETING_TO_SERVICE_PLANNING",
    status: "IMPLEMENTED",
    priority: "P0",
    sourceJobIds: [
      "JOB_MARKETING_PERFORMANCE_MARKETING",
    ],
    targetJobIds: [
      "JOB_BUSINESS_SERVICE_PLANNING",
    ],
    transitionType: "ADJACENT",
    bridgeTags: ["퍼널 분석", "전환율", "캠페인 성과", "고객 행동 데이터", "A/B 테스트"],
    limitationTags: ["기획 산출물 없음", "제품 요구사항 미작성"],
    evidenceTags: ["퍼널 분석", "A/B 테스트 결과", "전환율 개선 산출물", "PRD", "화면 흐름"],
    targetAxes: ["jobStructure", "responsibilityScope"],
    targetSlots: {
      jobStructure: ["lead", "scoreReason", "criteria"],
      responsibilityScope: ["lead", "liftOrLimit"],
    },
    overlays: {
      jobStructure: {
        lead: "마케팅 경험은 서비스기획과 바로 같은 일은 아니지만, 고객 행동 데이터와 전환 흐름을 해석했다는 점에서 문제 발견과 개선 가설 수립으로 연결될 수 있습니다.",
        scoreReason: "다만 서비스기획에서는 캠페인 성과를 보는 것을 넘어, 그 인사이트를 제품 요구사항·기능 우선순위·화면 흐름으로 바꾸는 과정이 중요합니다.",
        criteria: "확인 가능한 근거는 퍼널 분석, 전환율 변화, A/B 테스트 결과, 고객 세그먼트 분석, 기능 개선안, PRD 또는 화면 흐름 산출물입니다.",
      },
      responsibilityScope: {
        lead: "마케팅 경험을 기획 직무 근거로 살리려면, 성과 지표를 제품 개선 가설이나 기능 제안으로 전환한 흔적이 필요합니다.",
        liftOrLimit: "다음 보완은 캠페인 성과 1개를 골라 문제 지표, 사용자 행동 해석, 기능 개선 아이디어, 우선순위 판단 근거까지 정리한 산출물을 만드는 것입니다.",
      },
    },
    smokeInput: {
      currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
      targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
    },
    smoke: {
      activation: {
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
      },
      boundaryCopy: {
        shouldMention: ["캠페인 성과", "기능 개선안", "산출물"],
        shouldNotMention: [
          "서비스기획 경험으로 볼 수 있습니다",
          "PM 경험으로 볼 수 있습니다",
          "기획 역량이 충분합니다",
        ],
      },
      nonfire: {
        shouldNotMention: [
          "마케팅 경험은 서비스기획과 바로 같은 일은 아니지만",
          "퍼널 분석",
          "전환율 변화",
          "A/B 테스트 결과",
        ],
      },
    },
    conflict: {
      targetOverlapRisk: "MEDIUM",
      sharedTargetWith: ["CUSTOMER_SUPPORT_TO_SERVICE_PLANNING"],
      notes: "CS와 Marketing은 JOB_BUSINESS_SERVICE_PLANNING을 공유 target으로 가짐. source set이 분리되어 있어 동일 입력에서 co-fire 불가. CS bridge(VOC/반복문의/고객불편) 재사용 금지.",
    },
    notes: "F-2C 구현. CS profile의 VOC/반복문의/고객불편 문구 재사용 금지.",
  },
];

export const CAREER_TRANSITION_PROFILE_IDS = CAREER_TRANSITION_CASE_PROFILES
  .filter((p) => p.status === "IMPLEMENTED")
  .map((p) => p.id);
