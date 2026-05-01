// src/lib/passmap/pmSignalProfile.js
// PM 직무 신호 프로파일 (MVP v1)
//
// 출처: D:\tools\Obsidian\PASSMAP\04_Data_Assets\PM_Signal_Profile.md
//
// 규칙:
// - id는 machine-safe, stable (변경 금지)
// - label은 Korean (UI surfacing 가능)
// - evidenceHints: interpretPmRecord.js 에서 키워드 매칭에 사용
// - 스키마 변경 시 interpretPmRecord.js 동작 확인 필요
//
// 금지:
// - id 변경 금지
// - multi-job 추상화 선행 금지 (PM 검증 완료 전)
// - 점수/가중치 추가 금지 (MVP 범위 초과)

// ── Core Signals ──────────────────────────────────────────────────────────────

export const PM_CORE_SIGNALS = [
  {
    id: "CORE_PROBLEM_STRUCTURING",
    label: "문제 구조화",
    description: "현상을 정리하고 진짜 문제를 정의하는 능력",
    evidenceHints: [
      "분류", "정리", "원인", "문제 정의", "재정의", "구조화", "파악",
      "카테고리", "유형", "분석", "정리해서", "파악해서",
      "패턴", "발견", "식별", "문제", "이슈",
    ],
    relatedOutputCards: ["resumeLine", "strengthSummary"],
  },
  {
    id: "CORE_DATA_DRIVEN_JUDGMENT",
    label: "데이터 기반 판단",
    description: "수치와 근거로 방향을 정하는 능력",
    evidenceHints: [
      "지표", "데이터", "수치", "%", "건", "a/b", "테스트", "결과 분석",
      "비교", "kpi", "okr", "metric", "대시보드", "수치 기반",
    ],
    relatedOutputCards: ["resumeLine", "strengthSummary"],
  },
  {
    id: "CORE_PRIORITIZATION",
    label: "우선순위 결정",
    description: "여러 요청 중 무엇을 먼저 할지 판단하는 능력",
    evidenceHints: [
      "우선순위", "순서", "먼저", "스프린트", "결정", "선별", "제외",
      "기준", "집중", "포기", "1순위", "빼고",
    ],
    relatedOutputCards: ["strengthSummary", "readinessCard"],
  },
  {
    id: "CORE_STAKEHOLDER_ALIGNMENT",
    label: "이해관계자 조율",
    description: "개발/디자인/운영 등 다양한 팀과 협업하는 능력",
    evidenceHints: [
      "개발팀", "디자이너", "cs", "팀", "공유", "전달", "조율", "협업",
      "관계자", "부서", "파트너", "논의", "합의", "협력", "타부서",
    ],
    relatedOutputCards: ["resumeLine", "strengthSummary"],
  },
  {
    id: "CORE_EXECUTION_COMPLETION",
    label: "실행 완결",
    description: "기획에서 끝나지 않고 실제 결과까지 만들어내는 능력",
    evidenceHints: [
      "배포", "출시", "완료", "반영", "적용", "확정", "마무리", "운영",
      "릴리즈", "실제로", "결국", "완성",
      "작성", "온보딩", "제작", "수립", "취합", "진행",
    ],
    relatedOutputCards: ["resumeLine", "readinessCard"],
  },
  {
    id: "CORE_USER_PERSPECTIVE",
    label: "사용자 관점 유지",
    description: "사용자 입장에서 판단하는 능력",
    evidenceHints: [
      "사용자", "고객", "voc", "피드백", "불편", "만족", "사용성",
      "ux", "불만", "고객 문의", "사용자 경험",
    ],
    relatedOutputCards: ["resumeLine", "strengthSummary"],
  },
];

// ── Weak Signals ──────────────────────────────────────────────────────────────

export const PM_WEAK_SIGNALS = [
  {
    id: "WEAK_NO_QUANTITATIVE_RESULT",
    label: "성과 수치 부재",
    description: "결과가 어떤 규모인지 알 수 없어 PM 수준 판단이 어려움",
    whyItMatters: "수치가 없으면 어느 정도 PM인가를 판단할 수 없다",
    improvementHints: ["기록에 숫자 추가하기", "N%, N배, N건 수준으로 표현하기"],
  },
  {
    id: "WEAK_UNCLEAR_DECISION_BASIS",
    label: "의사결정 근거 불명확",
    description: "무엇을 했는지는 나오지만 왜 그렇게 했는지가 없음",
    whyItMatters: "판단력이 보이지 않으면 PM 역량 평가가 어렵다",
    improvementHints: ["왜 이 선택을 했는가 한 줄 추가"],
  },
  {
    id: "WEAK_NO_COLLABORATION_CONTEXT",
    label: "협업 맥락 없음",
    description: "혼자 한 것처럼 읽혀 규모감이 작아 보임",
    whyItMatters: "PM은 혼자 일하지 않는다. 협업 맥락 없는 기록은 규모감이 작다",
    improvementHints: ["누구와, 어떤 팀과를 기록에 추가"],
  },
  {
    id: "WEAK_NO_PROBLEM_DEFINITION",
    label: "문제 정의 없이 해결책만 기록",
    description: "왜 만들었는지 없이 만든 것만 있음",
    whyItMatters: "문제 구조화 능력이 보이지 않는다",
    improvementHints: ["어떤 문제가 있어서 한 줄 추가"],
  },
  {
    id: "WEAK_NO_USER_MENTION",
    label: "사용자 언급 없음",
    description: "내부 효율 기록만 있고 사용자 영향이 없음",
    whyItMatters: "사용자 중심 PM으로 읽히지 않는다",
    improvementHints: ["사용자 반응, 사용자 불편, 사용성 변화 연결"],
  },
  {
    id: "WEAK_NO_OUTCOME",
    label: "기획 이후 결과 단절",
    description: "기획 후 실제로 어떻게 됐는지 없음",
    whyItMatters: "실행 완결 여부를 판단할 수 없다",
    improvementHints: ["결과적으로 어떻게 됐는가 추가", "출시/반영/취소 여부 포함"],
  },
];

// ── Improvement Actions ───────────────────────────────────────────────────────

export const PM_IMPROVEMENT_ACTIONS = [
  {
    id: "ACTION_ADD_NUMBER",
    label: "숫자가 있는 기록 추가하기",
    description: "기존 기록에 수치를 붙이거나 수치 있는 경험 1개 신규 입력",
    suggestedCardTargets: ["resumeLine", "readinessCard"],
  },
  {
    id: "ACTION_ADD_DECISION_BASIS",
    label: "판단 근거 한 줄 추가하기",
    description: "기존 기록에 이유는 ~였기 때문이다 추가",
    suggestedCardTargets: ["strengthSummary"],
  },
  {
    id: "ACTION_ADD_COLLABORATION",
    label: "협업 맥락 추가하기",
    description: "개발팀과 함께, 디자이너 CS팀과 논의해서 등 협업 주체 추가",
    suggestedCardTargets: ["resumeLine", "readinessCard"],
  },
  {
    id: "ACTION_ADD_PROBLEM_DEFINITION",
    label: "문제 정의 문장 추가하기",
    description: "기록 앞에 ~라는 문제가 있었다 한 줄 추가",
    suggestedCardTargets: ["strengthSummary", "resumeLine"],
  },
  {
    id: "ACTION_CONNECT_USER_IMPACT",
    label: "사용자 반응/영향 연결하기",
    description: "결과 부분에 고객 불만 감소, 사용자 피드백 변화 등 연결",
    suggestedCardTargets: ["resumeLine"],
  },
  {
    id: "ACTION_ADD_OUTCOME",
    label: "결과 마무리 추가하기",
    description: "결국 어떻게 됐나를 기록 마지막에 추가. 출시/배포/미반영 포함",
    suggestedCardTargets: ["resumeLine", "readinessCard"],
  },
];
