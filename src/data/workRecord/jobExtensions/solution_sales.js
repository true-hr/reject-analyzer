export const SOLUTION_SALES_RECORD_PRESET = {
  jobId: "JOB_SALES_SOLUTION_SALES",
  label: "솔루션영업",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "고객 문제 진단",
      "솔루션 구성 검토",
      "제안 범위 정리",
      "도입 시나리오 설명",
      "고객 니즈 분석",
      "데모 시나리오 준비",
      "제안 조건 협의",
    ],
    project: [
      "솔루션 제안 전략 수립",
      "고객 맞춤 도입안 설계",
      "데모/PoC 기획",
      "제안서 구성 개선",
      "경쟁 솔루션 비교",
      "도입 효과 산정",
      "의사결정 구조 분석",
    ],
  },
  collaborationExtensions: [
    { id: "solsales_collab_customer", label: "고객사" },
    { id: "solsales_collab_decision", label: "의사결정자" },
    { id: "solsales_collab_user", label: "실무 담당자" },
    { id: "solsales_collab_product", label: "제품팀" },
    { id: "solsales_collab_consultant", label: "컨설턴트" },
    { id: "solsales_collab_tech", label: "기술팀" },
    { id: "solsales_collab_partner", label: "파트너사" },
  ],
  followUpExtensions: [
    { id: "solsales_result_problem_clear", label: "고객 문제 정의 명확화" },
    { id: "solsales_result_fit", label: "솔루션 적합도 향상" },
    { id: "solsales_result_acceptance", label: "제안 수락 가능성 상승" },
    { id: "solsales_result_roi_clear", label: "도입 효과 구체화" },
    { id: "solsales_result_differentiation", label: "경쟁 차별점 정리" },
    { id: "solsales_result_trust", label: "고객 신뢰도 개선" },
    { id: "solsales_result_next_stage", label: "후속 협의 단계 진입" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 고객 문제를 진단하고 솔루션 구성을 검토해 도입 시나리오를 설명했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "고객 문제를 진단하고 솔루션 구성을 검토했으며, 데모 시나리오를 준비해 의사결정자·실무 담당자와 제안 조건을 협의했어요.",
      roleTags: ["고객 문제 진단", "솔루션 구성 검토", "데모 시나리오 준비"],
      collaborationTags: ["고객사", "의사결정자", "제품팀"],
      resultTags: ["솔루션 적합도 향상", "후속 협의 단계 진입"],
    },
  },
};
