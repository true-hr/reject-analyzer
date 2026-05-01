export const PROPOSAL_SALES_RECORD_PRESET = {
  jobId: "JOB_SALES_PROPOSAL_SALES",
  label: "제안영업",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "제안서 작성",
      "RFP 요구사항 분석",
      "가격 조건 정리",
      "제안 범위 조율",
      "경쟁사 비교",
      "발표 자료 준비",
      "제안 일정 관리",
    ],
    project: [
      "RFP 대응 전략 수립",
      "제안서 구조 설계",
      "수주 전략 정리",
      "제안 발표 준비",
      "가격/범위 협상안 작성",
      "경쟁 우위 포인트 정리",
      "제안 결과 분석",
    ],
  },
  collaborationExtensions: [
    { id: "propsales_collab_customer", label: "고객사" },
    { id: "propsales_collab_decision", label: "의사결정자" },
    { id: "propsales_collab_tech", label: "기술팀" },
    { id: "propsales_collab_product", label: "제품팀" },
    { id: "propsales_collab_finance", label: "재무팀" },
    { id: "propsales_collab_legal", label: "법무팀" },
    { id: "propsales_collab_executive", label: "경영진" },
  ],
  followUpExtensions: [
    { id: "propsales_result_quality", label: "제안 완성도 개선" },
    { id: "propsales_result_win_rate", label: "수주 가능성 향상" },
    { id: "propsales_result_requirements", label: "요구사항 반영도 개선" },
    { id: "propsales_result_price_basis", label: "가격 협상 근거 확보" },
    { id: "propsales_result_differentiation", label: "경쟁 차별점 명확화" },
    { id: "propsales_result_presentation", label: "발표 설득력 강화" },
    { id: "propsales_result_negotiation", label: "후속 협상 기회 확보" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 RFP 요구사항을 분석하고 제안서를 작성해 경쟁사 비교 자료를 정리했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "RFP 요구사항을 분석하고 제안서를 작성했으며, 기술팀·재무팀과 가격 조건을 정리해 발표 자료를 준비했어요.",
      roleTags: ["RFP 요구사항 분석", "제안서 작성", "발표 자료 준비"],
      collaborationTags: ["고객사", "기술팀", "경영진"],
      resultTags: ["제안 완성도 개선", "수주 가능성 향상"],
    },
  },
};
