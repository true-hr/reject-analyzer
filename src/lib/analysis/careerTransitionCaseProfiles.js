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
        lead: "CS·고객 응대 경험은 서비스기획과 바로 같은 일은 아니지만, 고객 불편과 반복 문의를 응대 현장에서 직접 접하고 문제의 빈도와 패턴을 파악했다는 점에서 서비스기획의 문제 발견과 사용자 니즈 정리로 연결될 수 있습니다.",
        scoreReason: "다만 서비스기획에서는 응대 경험이 있다는 것을 넘어, 반복 문의의 패턴을 문제 구조로 정리하고 VOC 분석·개선안·요구사항·화면 흐름으로 전환하는 산출물이 중요합니다.",
        criteria: "확인 가능한 근거는 VOC 분석표, 개선안, 기능정의서, 화면흐름도, 우선순위 판단 근거입니다.",
      },
      responsibilityScope: {
        lead: "CS 경험을 기획 직무 근거로 살리려면, 응대하며 접한 반복 문의와 고객 불편을 VOC 분석이나 문제 패턴 정리 산출물로 전환한 흔적이 필요합니다.",
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
          "CS·고객 응대 경험은 서비스기획과 바로 같은 일은 아니지만",
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
          "CS·고객 응대 경험은 서비스기획과 바로 같은 일은 아니지만",
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
        lead: "회계·재무 경험은 데이터분석과 바로 같은 일은 아니지만, 손익·비용·매출 구조를 숫자로 읽고 정합성을 검토하며 의사결정 자료를 만들어온 점에서 데이터분석의 지표 해석과 보고 구조 이해로 연결될 수 있습니다.",
        scoreReason: "다만 데이터분석 직무에서는 숫자를 읽는 감각을 넘어, 데이터를 직접 추출·가공하고 분석 결과를 재현 가능한 형태로 남기는 과정이 중요합니다.",
        criteria: "확인 가능한 근거는 SQL 쿼리, Python 분석, 재무 데이터 대시보드, 분석 리포트, 반복 보고 자동화 산출물입니다.",
      },
      industryContext: {
        lead: "재무 보고 경험에서 쌓은 숫자 정합성 감각과 지표 기준 이해는, 분석 직무에서 데이터 품질을 검토하고 지표 정의를 잡는 단계에서 실질적인 강점이 됩니다.",
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
        lead: "퍼포먼스마케팅 경험은 서비스기획과 바로 같은 일은 아니지만, 퍼널과 전환율 데이터를 분석하고 A/B 테스트로 개선 가설을 검증해온 점에서 서비스기획의 문제 가설 수립과 개선 우선순위 결정으로 연결될 수 있습니다.",
        scoreReason: "다만 서비스기획에서는 광고·캠페인 성과 데이터를 분석하는 것을 넘어, 사용자 행동 인사이트를 기능 요구사항·화면 흐름·PRD로 전환하는 산출물이 중요합니다.",
        criteria: "확인 가능한 근거는 퍼널 분석, 전환율 변화, A/B 테스트 결과, 고객 세그먼트 분석, 기능 개선안, PRD 또는 화면 흐름 산출물입니다.",
      },
      responsibilityScope: {
        lead: "퍼포먼스마케팅 경험을 기획 직무 근거로 살리려면, 전환율·클릭률 지표에서 사용자 행동 가설을 도출하고 이를 기능 개선 제안이나 UX 개선안으로 전환한 흔적이 필요합니다.",
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
          "퍼포먼스마케팅 경험은 서비스기획과 바로 같은 일은 아니지만",
          "퍼널 분석",
          "전환율 변화",
          "A/B 테스트 결과",
        ],
        shouldNotMention: [
          "CS·고객 응대 경험은 서비스기획과 바로 같은 일은 아니지만",
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
          "퍼포먼스마케팅 경험은 서비스기획과 바로 같은 일은 아니지만",
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
        lead: "사무·행정 경험은 사업기획과 바로 같은 일은 아니지만, 부서 간 요청과 일정을 조율하며 내부 운영 흐름 전반을 지원했다는 점에서 사업기획의 내부 실행 관리와 운영 구조 이해로 연결될 수 있습니다.",
        scoreReason: "다만 사업기획에서는 내부 운영을 지원하는 것을 넘어, 시장·고객·비용 구조를 분석하고 문제 정의·정책 기획서·실행계획·지표 기반 판단 근거처럼 방향을 구조화하는 산출물이 중요합니다.",
        criteria: "확인 가능한 근거는 기획서, 운영 개선 제안, 업무 흐름 재설계 문서, 정책 초안, 우선순위 판단 근거입니다.",
      },
      responsibilityScope: {
        lead: "사무·행정 경험을 기획 직무 근거로 살리려면, 업무 처리와 일정 관리를 넘어 조율 과정에서 발견한 비효율이나 개선 가능성을 기획안이나 실행계획으로 정리한 흔적이 필요합니다.",
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
          "부서 간 요청과 일정을 조율",
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
          "부서 간 요청과 일정을 조율",
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
        lead: "B2B 영업 경험은 사업개발과 바로 같은 일은 아니지만, 고객 니즈를 파악하고 시장 반응을 읽으며 거래 조건을 협상해온 점에서 사업개발의 파트너십 발굴과 제안 구조 설계로 연결될 수 있습니다.",
        scoreReason: "다만 사업개발에서는 개별 판매 성사나 매출 달성을 넘어, 파트너십 구조 설계·시장 기회 분석·수익모델 검토·전략적 제휴 조건 조율처럼 비즈니스 확장 구조를 설계하는 산출물이 중요합니다.",
        criteria: "확인 가능한 근거는 파트너십 제안서, 시장·경쟁 분석 자료, 수익모델 검토 문서, 제휴 조건 협의 산출물, 신규 채널·거래처 발굴 결과입니다.",
      },
      responsibilityScope: {
        lead: "B2B 영업 경험을 사업개발 직무 근거로 살리려면, 개인 매출 달성을 넘어 시장 내 파트너십 기회를 구조화하거나 새로운 채널·제휴 가능성을 제안한 흔적이 필요합니다.",
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
        lead: "운영관리 경험은 서비스기획과 바로 같은 일은 아니지만, 서비스가 실제로 운영되는 흐름을 직접 다루고 프로세스 병목과 내부 협업 이슈를 처리했다는 점에서 서비스기획의 운영 정책 개선과 내부 프로세스 설계로 연결될 수 있습니다.",
        scoreReason: "다만 서비스기획에서는 운영을 수행하는 것을 넘어, 정책 개선안·프로세스 재설계·요구사항 정의·기능 개선안처럼 운영 문제를 구조화하고 정책과 제품으로 바꾸는 산출물이 중요합니다.",
        criteria: "확인 가능한 근거는 요구사항 정의서, 기능 개선안, 화면 흐름, 정책·프로세스 개선안, 우선순위 판단 근거입니다.",
      },
      responsibilityScope: {
        lead: "운영관리 경험을 기획 직무 근거로 살리려면, 운영 수행에 그친 것을 넘어 반복되는 프로세스 병목이나 내부 협업 이슈를 발견하고 정책·절차 개선 방향을 정리한 흔적이 필요합니다.",
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
          "운영관리 경험은 서비스기획과 바로 같은 일은 아니지만",
          "프로세스 병목",
          "운영 중 반복적으로 발생한 이슈",
        ],
        shouldNotMention: [
          "CS·고객 응대 경험은 서비스기획과 바로 같은 일은 아니지만",
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
          "운영관리 경험은 서비스기획과 바로 같은 일은 아니지만",
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
        lead: "제조 품질·QA 경험은 서비스·제품 기획과 바로 같은 일은 아니지만, 불량 원인과 결함 패턴을 품질 기준에 따라 구조적으로 분석하고 공정·현장 수준의 개선 요구사항을 다뤄온 점에서 서비스·제품 기획의 문제 정의와 요구사항 정리에 연결될 수 있습니다.",
        scoreReason: "다만 서비스·제품 기획 직무에서는 품질 이슈를 아는 것을 넘어, 시장·고객 요구 분석·제품 요구사항 정의·기능 우선순위·상품 개선 기획서처럼 제품과 서비스 방향을 설계하는 산출물이 중요합니다.",
        criteria: "확인 가능한 근거는 제품 요구사항 정의서, 기능·사양 우선순위 문서, 고객 불만 기반 개선안, 상품 개선 기획서입니다.",
      },
      responsibilityScope: {
        lead: "품질·QA 경험을 기획 직무 근거로 살리려면, 불량 발견과 처리에 그친 것을 넘어 결함 패턴이나 품질 기준 갭을 제품 개선 요구사항이나 사양 개선안으로 연결한 흔적이 필요합니다.",
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
          "불량 원인과 결함 패턴",
          "실제 처리한 품질 이슈",
        ],
        shouldNotMention: [
          "CS·고객 응대 경험은 서비스기획과 바로 같은 일은 아니지만",
          "VOC 분석표",
          "마케팅 경험은 서비스기획과",
          "퍼널 분석",
          "사무·행정 경험은 사업기획과",
          "SQL 쿼리",
          "운영관리 경험은 서비스기획과 바로 같은 일은 아니지만",
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
          "불량 원인과 결함 패턴",
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

  // ─── 기술지원/필드엔지니어 → 서비스·제품 기획 ─────────────────────────────

  {
    id: "TECHNICAL_SUPPORT_TO_SERVICE_PLANNING",
    status: "IMPLEMENTED",
    priority: "P1",
    sourceJobIds: [
      "JOB_ENGINEERING_DEVELOPMENT_TECHNICAL_SUPPORT_FIELD_ENGINEERING",
    ],
    targetJobIds: [
      "JOB_BUSINESS_SERVICE_PLANNING",
    ],
    transitionType: "ADJACENT",
    bridgeTags: ["고객 기술 이슈 분석", "장애 원인 구조화", "제품 개선 요청 파악", "사용 환경 갭 발견"],
    limitationTags: ["기획 산출물 없음", "요구사항 미정의", "우선순위 판단 근거 없음"],
    evidenceTags: ["기능 요구사항 정의서", "이슈 원인 분석", "제품 개선 제안서", "사용자 시나리오", "우선순위 판단 근거"],
    targetAxes: ["jobStructure", "responsibilityScope"],
    targetSlots: {
      jobStructure: ["lead", "scoreReason", "criteria"],
      responsibilityScope: ["lead", "liftOrLimit"],
    },
    overlays: {
      jobStructure: {
        lead: "기술지원·필드엔지니어 경험은 서비스·제품 기획과 바로 같은 일은 아니지만, 고객이 실제 사용 환경에서 겪는 기술 이슈와 기능 제약을 직접 파악하고 제품 개선 요청으로 정리해온 점에서 기획의 요구사항 발굴과 사용자 시나리오 구체화로 연결될 수 있습니다.",
        scoreReason: "다만 서비스·제품 기획에서는 기술 이슈를 처리하는 것을 넘어, 이슈 원인 구조화·기능 요구사항 정의·사용자 시나리오·개선 제안서·우선순위 판단 근거처럼 기술 문제를 기획 산출물로 전환하는 과정이 중요합니다.",
        criteria: "확인 가능한 근거는 기능 요구사항 정의서, 이슈 원인 분석, 제품 개선 제안서, 사용자 시나리오, 우선순위 판단 근거입니다.",
      },
      responsibilityScope: {
        lead: "기술지원·필드엔지니어 경험을 기획 직무 근거로 살리려면, 이슈 처리에 그친 것을 넘어 반복되는 기술 이슈의 원인과 사용 환경 갭을 구조화하고 기능 개선 요구사항으로 정리한 흔적이 필요합니다.",
        liftOrLimit: "다음 보완은 반복적으로 접한 기술 이슈 1개를 골라 사용자 불편, 원인, 기능 개선 아이디어, 우선순위 판단 근거를 정리한 산출물 1개를 만드는 것입니다.",
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
          "기술지원·필드엔지니어 경험은 서비스·제품 기획과 바로 같은 일은 아니지만",
          "실제 사용 환경에서 겪는 기술 이슈",
          "사용 환경 갭을 구조화",
        ],
        shouldNotMention: [
          "CS·고객 응대 경험은 서비스기획과 바로 같은 일은 아니지만",
          "VOC 분석표",
          "반복 문의 3~5개",
          "퍼널 분석",
          "전환율 변화",
          "사무·행정 경험은 사업기획과",
          "운영관리 경험은 서비스기획과 바로 같은 일은 아니지만",
          "제조 품질·QA 경험은 서비스·제품 기획과 바로 같은 일은 아니지만",
          "SQL 쿼리",
        ],
      },
      boundaryCopy: {
        shouldMention: ["기술 이슈", "제품 개선", "산출물"],
        shouldNotMention: [
          "서비스기획 경험으로 볼 수 있습니다",
          "PM 경험으로 볼 수 있습니다",
          "기획 역량이 충분합니다",
        ],
      },
      nonfire: {
        shouldNotMention: [
          "기술지원·필드엔지니어 경험은 서비스·제품 기획과 바로 같은 일은 아니지만",
          "실제 사용 환경에서 겪는 기술 이슈",
          "사용 환경 갭을 구조화",
        ],
      },
    },
    conflict: {
      targetOverlapRisk: "MEDIUM",
      sharedTargetWith: [
        "CUSTOMER_SUPPORT_TO_SERVICE_PLANNING",
        "PERFORMANCE_MARKETING_TO_SERVICE_PLANNING",
        "OPERATIONS_TO_SERVICE_PLANNING",
        "MANUFACTURING_QUALITY_TO_PRODUCT_PLANNING",
      ],
      notes: "JOB_BUSINESS_SERVICE_PLANNING을 CS·Marketing·Operations·MFG_QA 프로파일과 공유함. source set 완전 분리로 co-fire 불가. CS bridge(VOC/반복문의), Marketing bridge(퍼널/전환율), Operations bridge(프로세스 병목), MFG bridge(품질 이슈/고객 클레임) 문구 재사용 금지.",
    },
    notes: "F-3C 구현. 고객 기술 이슈·장애 원인·제품 개선 요청을 bridge로 잡음. 단순 장애 처리만으로는 기획 근거 약함을 명시.",
  },

  // ─── 구매/조달/소싱 → 사업기획 ───────────────────────────────────────────

  {
    id: "PROCUREMENT_TO_BUSINESS_PLANNING",
    status: "IMPLEMENTED",
    priority: "P1",
    sourceJobIds: [
      "JOB_PROCUREMENT_SCM_PROCUREMENT",
      "JOB_PROCUREMENT_SCM_STRATEGIC_SOURCING",
      "JOB_PROCUREMENT_SCM_PURCHASING",
    ],
    targetJobIds: [
      "JOB_BUSINESS_BUSINESS_PLANNING",
    ],
    transitionType: "ADJACENT",
    bridgeTags: ["비용 구조 분석", "공급사 조건 협상", "계약·납기·리스크 관리", "운영 효율화"],
    limitationTags: ["기획 산출물 없음", "시장·경쟁 분석 없음", "의사결정 구조화 미흡"],
    evidenceTags: ["원가 절감 분석", "공급사 비교표", "비용 구조 분석", "계약 조건 개선안", "리스크 대응안", "운영 개선안"],
    targetAxes: ["jobStructure", "responsibilityScope"],
    targetSlots: {
      jobStructure: ["lead", "scoreReason", "criteria"],
      responsibilityScope: ["lead", "liftOrLimit"],
    },
    overlays: {
      jobStructure: {
        lead: "구매·조달 경험은 사업기획과 바로 같은 일은 아니지만, 외부 공급망의 비용 구조를 분석하고 공급사 조건·계약·납기·리스크를 관리해온 점에서 사업기획의 비용 구조 분석과 리스크 기반 의사결정으로 연결될 수 있습니다.",
        scoreReason: "다만 사업기획에서는 구매·발주를 실행하는 것을 넘어, 시장·경쟁 분석을 포함한 원가 절감 분석·공급사 비교표·비용 구조 분석·리스크 대응안처럼 전략적 의사결정을 구조화하는 산출물이 중요합니다.",
        criteria: "확인 가능한 근거는 원가 절감 분석, 공급사 비교표, 비용 구조 분석, 계약 조건 개선안, 리스크 대응안, 운영 개선안입니다.",
      },
      responsibilityScope: {
        lead: "구매·조달 경험을 기획 직무 근거로 살리려면, 발주 처리나 공급사 관리를 넘어 외부 공급망 전체를 비용과 리스크 관점에서 구조화하고 개선 방향을 제안한 흔적이 필요합니다.",
        liftOrLimit: "다음 보완은 담당 품목에서 비용 절감 기회 또는 공급사 리스크 1개를 골라 원인, 개선 방향, 기대 효과, 실행 방안을 정리한 분석 산출물 1개를 만드는 것입니다.",
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
          "구매·조달 경험은 사업기획과 바로 같은 일은 아니지만",
          "비용 구조",
          "담당 품목에서",
        ],
        shouldNotMention: [
          "고객 응대 경험은 서비스기획과 연결",
          "VOC 분석표",
          "사무·행정 경험은 사업기획과",
          "부서 간 요청과 일정을 조율",
          "B2B 영업 경험은 사업개발과",
          "SQL 쿼리",
          "기술지원·필드엔지니어 경험은",
        ],
      },
      boundaryCopy: {
        shouldMention: ["비용 구조", "공급사", "산출물"],
        shouldNotMention: [
          "사업기획 경험으로 볼 수 있습니다",
          "바로 기획 직무에 적합합니다",
          "기획 역량이 충분합니다",
        ],
      },
      nonfire: {
        shouldNotMention: [
          "구매·조달 경험은 사업기획과 바로 같은 일은 아니지만",
          "공급사 비교표",
          "담당 품목에서",
        ],
      },
    },
    conflict: {
      targetOverlapRisk: "MEDIUM",
      sharedTargetWith: [
        "GENERAL_ADMIN_TO_BUSINESS_PLANNING",
      ],
      notes: "JOB_BUSINESS_BUSINESS_PLANNING을 GENERAL_ADMIN 프로파일과 공유함. source set 분리로 co-fire 불가. Admin bridge(운영 흐름/문서·일정/업무 흐름 재설계) 문구 재사용 금지.",
    },
    notes: "F-3C 구현. sourceJobIds에 PROCUREMENT·STRATEGIC_SOURCING·PURCHASING 3개 포함. 비용 구조·공급사·리스크를 bridge로 잡음.",
  },
];

export const CAREER_TRANSITION_PROFILE_IDS = CAREER_TRANSITION_CASE_PROFILES
  .filter((p) => p.status === "IMPLEMENTED")
  .map((p) => p.id);
