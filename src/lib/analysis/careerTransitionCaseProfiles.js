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

  // ─── 일반 행정/사무 → 사업기획 ───────────────────────────────────────────

  {
    id: "GENERAL_ADMIN_TO_BUSINESS_PLANNING",
    status: "IMPLEMENTED",
    priority: "P1",
    sourceJobIds: [
      "JOB_PUBLIC_ADMINISTRATION_SUPPORT_ADMINISTRATION",
    ],
    targetJobIds: [
      "JOB_BUSINESS_BUSINESS_PLANNING",
    ],
    transitionType: "ADJACENT",
    bridgeTags: ["운영 흐름 파악", "문서·프로세스 관리", "내부 요청 처리", "실행 운영"],
    limitationTags: ["기획 산출물 없음", "문제 정의 경험 없음", "의사결정 구조화 미흡"],
    evidenceTags: ["기획서", "운영 개선 제안", "업무 흐름 재설계 문서", "정책 초안", "우선순위 판단 근거"],
    targetAxes: ["jobStructure", "responsibilityScope"],
    targetSlots: {
      jobStructure: ["lead", "scoreReason", "criteria"],
      responsibilityScope: ["lead", "liftOrLimit"],
    },
    overlays: {
      jobStructure: {
        lead: "사무·행정 경험은 사업기획과 바로 같은 일은 아니지만, 내부 운영 흐름을 파악하고 문서·일정·요청을 관리했다는 점에서 기획 실행의 운영 측면과 연결될 수 있습니다.",
        scoreReason: "다만 사업기획에서는 운영을 정리하는 것을 넘어, 문제 정의·요구사항 도출·정책 기획서·우선순위 판단 산출물처럼 의사결정을 구조화하는 과정이 중요합니다.",
        criteria: "확인 가능한 근거는 기획서, 운영 개선 제안, 업무 흐름 재설계 문서, 정책 초안, 우선순위 판단 근거입니다.",
      },
      responsibilityScope: {
        lead: "행정 경험을 기획 직무 근거로 살리려면, 단순 처리 업무를 넘어 프로세스 개선이나 운영 구조 재설계를 주도한 흔적이 필요합니다.",
        liftOrLimit: "다음 보완은 담당 영역의 업무 흐름 중 비효율 1개를 골라 문제 원인, 개선 방향, 실행 방안, 기대 효과를 정리한 기획 산출물 1개를 만드는 것입니다.",
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
          "사무·행정 경험은 사업기획과 바로 같은 일은 아니지만",
          "기획 실행의 운영 측면",
          "업무 흐름 재설계",
        ],
        shouldNotMention: [
          "고객 응대 경험은 서비스기획과 연결",
          "회계·재무 경험은 데이터분석과",
          "마케팅 경험은 서비스기획과",
          "SQL 쿼리",
          "VOC 분석표",
        ],
      },
      boundaryCopy: {
        shouldMention: ["문제 정의", "운영 개선", "산출물"],
        shouldNotMention: [
          "기획 역량이 충분합니다",
          "사업기획 경험으로 볼 수 있습니다",
          "바로 기획 직무에 적합합니다",
        ],
      },
      nonfire: {
        shouldNotMention: [
          "사무·행정 경험은 사업기획과 바로 같은 일은 아니지만",
          "기획 실행의 운영 측면",
          "업무 흐름 재설계",
        ],
      },
    },
    conflict: {
      targetOverlapRisk: "LOW",
      sharedTargetWith: [],
      notes: "JOB_BUSINESS_BUSINESS_PLANNING이 다른 구현 profile의 target과 겹치지 않음.",
    },
    notes: "F-3A 구현. industryContext/customerType/roleCharacter는 band 높음 — 미적용 (과잉 설명 방지).",
  },

  // ─── B2B 영업 → 사업개발(BD) ────────────────────────────────────────────

  {
    id: "SALES_TO_BUSINESS_DEVELOPMENT",
    status: "IMPLEMENTED",
    priority: "P1",
    sourceJobIds: [
      "JOB_SALES_B2B_SALES",
      "JOB_SALES_PROPOSAL_SALES",
    ],
    targetJobIds: [
      "JOB_BUSINESS_BUSINESS_DEVELOPMENT",
    ],
    transitionType: "ADJACENT",
    bridgeTags: ["고객 니즈 파악", "제안·협상", "시장 반응 이해", "거래 조건 조율"],
    limitationTags: ["파트너십 구조 설계 없음", "시장/경쟁 분석 없음", "수익모델 검토 없음"],
    evidenceTags: ["파트너십 제안서", "시장·경쟁 분석", "수익모델 검토", "제휴 조건 협의 산출물", "신규 채널 발굴 결과"],
    targetAxes: ["jobStructure", "responsibilityScope"],
    targetSlots: {
      jobStructure: ["lead", "scoreReason", "criteria"],
      responsibilityScope: ["lead", "liftOrLimit"],
    },
    overlays: {
      jobStructure: {
        lead: "B2B 영업 경험은 사업개발과 바로 같은 일은 아니지만, 고객 니즈를 파악하고 조건을 협상하며 거래를 성사시킨 경험이 파트너십 발굴과 제안 구조 설계에 연결될 수 있습니다.",
        scoreReason: "다만 사업개발에서는 판매 성사를 넘어, 파트너십 구조 설계·시장 기회 분석·수익모델 검토·전략적 계약 조건 조율처럼 비즈니스 구조를 설계하는 과정이 중요합니다.",
        criteria: "확인 가능한 근거는 파트너십 제안서, 시장·경쟁 분석 자료, 수익모델 검토 문서, 제휴 조건 협의 산출물, 신규 채널·거래처 발굴 결과입니다.",
      },
      responsibilityScope: {
        lead: "영업 경험을 사업개발 직무 근거로 살리려면, 단순 고객 발굴을 넘어 파트너십 전략이나 제안 구조를 주도한 흔적이 필요합니다.",
        liftOrLimit: "다음 보완은 기존 거래처 또는 새 채널 1곳을 선택해 파트너십 구조, 협업 범위, 기대 수익, 리스크를 정리한 제안서 1건을 만드는 것입니다.",
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
          "B2B 영업 경험은 사업개발과 바로 같은 일은 아니지만",
          "파트너십 발굴",
          "시장 기회 분석",
        ],
        shouldNotMention: [
          "고객 응대 경험은 서비스기획과 연결",
          "회계·재무 경험은 데이터분석과",
          "사무·행정 경험은 사업기획과",
          "SQL 쿼리",
          "VOC 분석표",
        ],
      },
      boundaryCopy: {
        shouldMention: ["파트너십 구조", "수익모델", "산출물"],
        shouldNotMention: [
          "사업개발 역량이 충분합니다",
          "영업 경험으로 바로 BD가 가능합니다",
          "바로 사업개발 직무에 적합합니다",
        ],
      },
      nonfire: {
        shouldNotMention: [
          "B2B 영업 경험은 사업개발과 바로 같은 일은 아니지만",
          "파트너십 발굴",
          "시장 기회 분석",
        ],
      },
    },
    conflict: {
      targetOverlapRisk: "LOW",
      sharedTargetWith: [],
      notes: "JOB_BUSINESS_BUSINESS_DEVELOPMENT가 다른 구현 profile의 target과 겹치지 않음.",
    },
    notes: "F-3A 구현. sourceJobIds에 PROPOSAL_SALES 포함 (제안영업 → BD 전환 유효). industryContext/customerType/roleCharacter는 band 높음 — 미적용.",
  },

  // ─── 운영관리 → 서비스기획 ─────────────────────────────────────────────────

  {
    id: "OPERATIONS_TO_SERVICE_PLANNING",
    status: "IMPLEMENTED",
    priority: "P1",
    sourceJobIds: [
      "JOB_BUSINESS_OPERATIONS_MANAGEMENT",
    ],
    targetJobIds: [
      "JOB_BUSINESS_SERVICE_PLANNING",
    ],
    transitionType: "ADJACENT",
    bridgeTags: ["운영 흐름 파악", "프로세스 병목 발견", "이슈 처리", "내부 협업", "서비스 안정화"],
    limitationTags: ["기획 산출물 없음", "요구사항 미정의", "기능 개선안 없음"],
    evidenceTags: ["요구사항 정의서", "기능 개선안", "화면 흐름", "정책·프로세스 개선안", "우선순위 판단 근거"],
    targetAxes: ["jobStructure", "responsibilityScope"],
    targetSlots: {
      jobStructure: ["lead", "scoreReason", "criteria"],
      responsibilityScope: ["lead", "liftOrLimit"],
    },
    overlays: {
      jobStructure: {
        lead: "운영 경험은 서비스기획과 바로 같은 일은 아니지만, 서비스 흐름을 직접 다루고 프로세스 병목과 내부 이슈를 처리했다는 점에서 서비스기획의 문제 발견과 운영 개선 단계와 연결될 수 있습니다.",
        scoreReason: "다만 서비스기획에서는 운영 경험을 넘어, 요구사항 정의·기능 개선안·화면 흐름·정책 개선안처럼 운영 문제를 제품과 프로세스로 바꾸는 산출물이 중요합니다.",
        criteria: "확인 가능한 근거는 요구사항 정의서, 기능 개선안, 화면 흐름, 정책·프로세스 개선안, 우선순위 판단 근거입니다.",
      },
      responsibilityScope: {
        lead: "운영 경험을 기획 직무 근거로 살리려면, 운영 수행에 그친 것을 넘어 프로세스 병목이나 서비스 이슈를 발견하고 개선 방향을 정리한 흔적이 필요합니다.",
        liftOrLimit: "다음 보완은 운영 중 반복적으로 발생한 이슈 1개를 골라 원인, 개선 방향, 기능 또는 프로세스 변경안, 우선순위 판단 근거를 정리한 산출물 1개를 만드는 것입니다.",
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
          "운영 경험은 서비스기획과 바로 같은 일은 아니지만",
          "프로세스 병목",
          "운영 중 반복적으로 발생한 이슈",
        ],
        shouldNotMention: [
          "고객 응대 경험은 서비스기획과 연결",
          "VOC 분석표",
          "반복 문의 3~5개",
          "퍼널 분석",
          "전환율 변화",
          "사무·행정 경험은 사업기획과",
          "SQL 쿼리",
        ],
      },
      boundaryCopy: {
        shouldMention: ["운영 문제", "개선 방향", "산출물"],
        shouldNotMention: [
          "서비스기획 경험으로 볼 수 있습니다",
          "PM 경험으로 볼 수 있습니다",
          "기획 역량이 충분합니다",
        ],
      },
      nonfire: {
        shouldNotMention: [
          "운영 경험은 서비스기획과 바로 같은 일은 아니지만",
          "프로세스 병목",
          "운영 중 반복적으로 발생한 이슈",
        ],
      },
    },
    conflict: {
      targetOverlapRisk: "MEDIUM",
      sharedTargetWith: [
        "CUSTOMER_SUPPORT_TO_SERVICE_PLANNING",
        "PERFORMANCE_MARKETING_TO_SERVICE_PLANNING",
        "MANUFACTURING_QUALITY_TO_PRODUCT_PLANNING",
      ],
      notes: "JOB_BUSINESS_SERVICE_PLANNING을 CS·Marketing·MFG_QA 프로파일과 공유함. source set 완전 분리로 동일 입력 co-fire 불가. CS bridge(VOC/반복문의) 및 Marketing bridge(퍼널/전환율) 문구 재사용 금지.",
    },
    notes: "F-3B 구현. 운영 흐름·프로세스 병목·이슈 처리를 bridge로 잡음. CS·Marketing profile과 문구 분리 필수.",
  },

  // ─── 제조 품질/QA → 서비스·제품 기획 ───────────────────────────────────

  {
    id: "MANUFACTURING_QUALITY_TO_PRODUCT_PLANNING",
    status: "IMPLEMENTED",
    priority: "P1",
    sourceJobIds: [
      "JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA",
      "JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_CONTROL",
    ],
    targetJobIds: [
      "JOB_BUSINESS_SERVICE_PLANNING",
    ],
    transitionType: "ADJACENT",
    bridgeTags: ["품질 이슈 발견", "고객 클레임 분석", "불량 원인 구조화", "개선 요구사항"],
    limitationTags: ["시장·고객 요구 분석 없음", "제품 요구사항 미정의", "기능 우선순위 없음", "출시 전략 없음"],
    evidenceTags: ["제품 요구사항 정의서", "기능·사양 우선순위", "고객 불만 기반 개선안", "상품 개선 기획서"],
    targetAxes: ["jobStructure", "responsibilityScope"],
    targetSlots: {
      jobStructure: ["lead", "scoreReason", "criteria"],
      responsibilityScope: ["lead", "liftOrLimit"],
    },
    overlays: {
      jobStructure: {
        lead: "제조 품질·QA 경험은 서비스·제품 기획과 바로 같은 일은 아니지만, 제품 결함과 고객 클레임을 구조적으로 분석하고 개선 요구사항을 다뤄온 점에서 서비스기획의 문제 정의와 개선 방향 도출로 연결될 수 있습니다.",
        scoreReason: "다만 서비스·제품 기획 직무에서는 품질 이슈를 아는 것을 넘어, 시장·고객 요구 분석·제품 요구사항 정의·기능 우선순위·상품 개선 기획서처럼 제품과 서비스 방향을 설계하는 산출물이 중요합니다.",
        criteria: "확인 가능한 근거는 제품 요구사항 정의서, 기능·사양 우선순위 문서, 고객 불만 기반 개선안, 상품 개선 기획서입니다.",
      },
      responsibilityScope: {
        lead: "품질 경험을 서비스·제품 기획 직무 근거로 살리려면, 품질 이슈를 발견하는 것에서 한 발 나아가 고객 요구와 연결하고 제품 개선 방향을 제안한 흔적이 필요합니다.",
        liftOrLimit: "다음 보완은 실제 처리한 품질 이슈 1개를 골라 고객 불편 원인, 요구사항 정의, 개선 방향, 우선순위 판단 근거를 정리한 기획 산출물 1개를 만드는 것입니다.",
      },
    },
    smokeInput: {
      currentIndustryId: "IND_MANUFACTURING_ELECTRONICS_APPLIANCES",
      targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
    },
    smoke: {
      activation: {
        expectedAxisSlots: {
          jobStructure: ["lead", "scoreReason", "criteria"],
          responsibilityScope: ["lead", "liftOrLimit"],
        },
        shouldMention: [
          "제조 품질·QA 경험은 서비스·제품 기획과 바로 같은 일은 아니지만",
          "고객 클레임",
          "실제 처리한 품질 이슈",
        ],
        shouldNotMention: [
          "고객 응대 경험은 서비스기획과 연결",
          "VOC 분석표",
          "마케팅 경험은 서비스기획과",
          "퍼널 분석",
          "사무·행정 경험은 사업기획과",
          "SQL 쿼리",
          "운영 경험은 서비스기획과 바로 같은 일은 아니지만",
        ],
      },
      boundaryCopy: {
        shouldMention: ["품질 이슈", "제품 개선", "산출물"],
        shouldNotMention: [
          "제품기획 경험으로 볼 수 있습니다",
          "QA를 하셨으니 제품기획이 가능합니다",
          "기획 역량이 충분합니다",
        ],
      },
      nonfire: {
        shouldNotMention: [
          "제조 품질·QA 경험은 서비스·제품 기획과 바로 같은 일은 아니지만",
          "고객 클레임",
          "실제 처리한 품질 이슈",
        ],
      },
    },
    conflict: {
      targetOverlapRisk: "MEDIUM",
      sharedTargetWith: [
        "CUSTOMER_SUPPORT_TO_SERVICE_PLANNING",
        "PERFORMANCE_MARKETING_TO_SERVICE_PLANNING",
        "OPERATIONS_TO_SERVICE_PLANNING",
      ],
      notes: "JOB_BUSINESS_SERVICE_PLANNING을 CS·Marketing·Operations 프로파일과 공유함. source set 완전 분리로 동일 입력 co-fire 불가. CS bridge(VOC/반복문의), Marketing bridge(퍼널/전환율), Operations bridge(프로세스 병목) 문구 재사용 금지.",
    },
    notes: "F-3B 구현. 품질 이슈 → 고객 불편 → 제품 개선 요구사항 흐름을 bridge로 잡음. 'QA→기획 바로 가능' 과대해석 금지.",
  },
];

export const CAREER_TRANSITION_PROFILE_IDS = CAREER_TRANSITION_CASE_PROFILES
  .filter((p) => p.status === "IMPLEMENTED")
  .map((p) => p.id);
