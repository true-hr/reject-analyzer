export const SALES_MANAGEMENT_RECORD_PRESET = {
  jobId: "JOB_SALES_GENERAL_SALES",
  label: "영업/영업관리",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "신규 고객 발굴",
      "제안서 작성",
      "고객 미팅",
      "계약 협상",
      "파이프라인 관리",
      "고객 유지 관리",
      "영업 현황 보고",
    ],
    project: [
      "시장 조사",
      "고객사 분석",
      "제안 전략 수립",
      "계약 조건 협의",
      "레퍼런스 확보",
      "영업 목표 설정",
      "성과 리뷰",
    ],
  },
  collaborationExtensions: [
    { id: "sales_collab_marketing", label: "마케팅팀" },
    { id: "sales_collab_tech", label: "기술팀" },
    { id: "sales_collab_cs", label: "CS팀" },
    { id: "sales_collab_client", label: "고객사" },
    { id: "sales_collab_partner", label: "파트너사" },
    { id: "sales_collab_decision_maker", label: "의사결정자" },
    { id: "sales_collab_legal", label: "법무팀" },
  ],
  followUpExtensions: [
    { id: "sales_result_contract_closed", label: "계약 성사" },
    { id: "sales_result_quota_achieved", label: "매출 목표 달성" },
    { id: "sales_result_lead_secured", label: "리드 확보" },
    { id: "sales_result_relationship_built", label: "고객 관계 강화" },
    { id: "sales_result_proposal_delivered", label: "제안서 제출 완료" },
    { id: "sales_result_pipeline_updated", label: "파이프라인 정리" },
    { id: "sales_result_objection_resolved", label: "이의 대응 완료" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 신규 고객사 미팅을 진행하고 제안서를 제출했으며, 계약 협상 과정에서 조건을 조율했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "고객사 담당자와 계약 조건을 협의하고 제안서를 수정해 제출했으며, 파이프라인 현황을 의사결정자에게 보고했어요.",
      roleTags: ["계약 협상", "제안서 작성", "영업 현황 보고"],
      collaborationTags: ["고객사", "법무팀", "의사결정자"],
      resultTags: ["계약 성사", "파이프라인 정리"],
    },
  },
};
