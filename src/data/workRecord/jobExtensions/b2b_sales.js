export const B2B_SALES_RECORD_PRESET = {
  jobId: "JOB_SALES_B2B_SALES",
  label: "B2B영업",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "고객사 미팅",
      "의사결정자 파악",
      "제안서 작성",
      "니즈 진단",
      "계약 조건 협의",
      "파이프라인 점검",
      "후속 액션 정리",
    ],
    project: [
      "법인 고객 발굴",
      "제안 전략 수립",
      "PoC 협의",
      "도입 프로세스 조율",
      "이해관계자 맵 정리",
      "계약 협상 진행",
      "장기 계정 관리 계획 수립",
    ],
  },
  collaborationExtensions: [
    { id: "b2b_collab_client", label: "고객사" },
    { id: "b2b_collab_decision_maker", label: "의사결정자" },
    { id: "b2b_collab_practitioner", label: "실무 담당자" },
    { id: "b2b_collab_ops", label: "내부 운영팀" },
    { id: "b2b_collab_product", label: "제품팀" },
    { id: "b2b_collab_marketing", label: "마케팅팀" },
    { id: "b2b_collab_partner", label: "파트너사" },
  ],
  followUpExtensions: [
    { id: "b2b_result_opportunity_secured", label: "제안 기회 확보" },
    { id: "b2b_result_meeting_converted", label: "미팅 전환" },
    { id: "b2b_result_contract_chance_up", label: "계약 가능성 상승" },
    { id: "b2b_result_needs_clarified", label: "고객 니즈 구체화" },
    { id: "b2b_result_decision_structure", label: "의사결정 구조 파악" },
    { id: "b2b_result_risk_reduced", label: "도입 리스크 감소" },
    { id: "b2b_result_revenue_found", label: "매출 기회 발굴" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 고객사 미팅에서 니즈를 진단하고 제안서를 작성했으며, 계약 조건을 사전 조율했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "고객사 의사결정자와 PoC 조건을 협의하고 제안서를 수정해 제출했으며, 파이프라인 현황을 내부 운영팀에 공유했어요.",
      roleTags: ["제안서 작성", "계약 조건 협의", "파이프라인 점검"],
      collaborationTags: ["고객사", "의사결정자", "내부 운영팀"],
      resultTags: ["계약 가능성 상승", "고객 니즈 구체화"],
    },
  },
};
