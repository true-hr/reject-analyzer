export const KEY_ACCOUNT_MANAGEMENT_RECORD_PRESET = {
  jobId: "JOB_SALES_KEY_ACCOUNT_MANAGEMENT",
  label: "Key Account Management",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "핵심 고객 미팅",
      "계정 이슈 점검",
      "매출 기회 확인",
      "고객 관계 관리",
      "계약 갱신 조건 확인",
      "고객사 조직 변화 파악",
      "계정별 액션 정리",
    ],
    project: [
      "핵심 계정 전략 수립",
      "계정 성장 계획 작성",
      "계약 갱신 전략 수립",
      "고객사 이해관계자 맵 정리",
      "업셀/크로스셀 기회 발굴",
      "계정 리스크 관리",
      "장기 파트너십 강화",
    ],
  },
  collaborationExtensions: [
    { id: "kam_collab_customer", label: "핵심 고객사" },
    { id: "kam_collab_decision", label: "의사결정자" },
    { id: "kam_collab_user", label: "실무 담당자" },
    { id: "kam_collab_sales", label: "영업팀" },
    { id: "kam_collab_csm", label: "Customer Success" },
    { id: "kam_collab_product", label: "제품팀" },
    { id: "kam_collab_executive", label: "경영진" },
  ],
  followUpExtensions: [
    { id: "kam_result_retention", label: "핵심 고객 유지율 개선" },
    { id: "kam_result_revenue_growth", label: "계정 매출 확대" },
    { id: "kam_result_renewal", label: "갱신 가능성 상승" },
    { id: "kam_result_relationship", label: "고객 관계 강화" },
    { id: "kam_result_upsell", label: "업셀 기회 발굴" },
    { id: "kam_result_risk_reduced", label: "계정 리스크 감소" },
    { id: "kam_result_partnership", label: "장기 파트너십 강화" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 핵심 고객 미팅을 진행하고 계정 이슈를 점검해 계약 갱신 조건을 확인했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "핵심 고객 미팅에서 계정 이슈를 점검하고 매출 기회를 확인했으며, Customer Success·제품팀과 계약 갱신 방향을 협의했어요.",
      roleTags: ["핵심 고객 미팅", "계정 이슈 점검", "계약 갱신 조건 확인"],
      collaborationTags: ["핵심 고객사", "Customer Success", "영업팀"],
      resultTags: ["핵심 고객 유지율 개선", "계정 매출 확대"],
    },
  },
};
