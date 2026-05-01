export const CRM_MARKETING_RECORD_PRESET = {
  jobId: "JOB_MARKETING_CRM_MARKETING",
  label: "CRM마케팅",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "고객 세그먼트 정리",
      "리텐션 캠페인 운영",
      "메시지 발송",
      "재구매 지표 확인",
      "고객 여정 점검",
      "이탈 고객 분석",
      "CRM 성과 리포트 작성",
    ],
    project: [
      "고객 세그먼트 설계",
      "리텐션 전략 수립",
      "LTV 개선 캠페인 기획",
      "고객 여정 개선",
      "휴면 고객 활성화",
      "개인화 메시지 테스트",
      "CRM 자동화 시나리오 정리",
    ],
  },
  collaborationExtensions: [
    { id: "crm_collab_data", label: "데이터팀" },
    { id: "crm_collab_marketing", label: "마케팅팀" },
    { id: "crm_collab_product", label: "제품팀" },
    { id: "crm_collab_cs", label: "CS팀" },
    { id: "crm_collab_dev", label: "개발팀" },
    { id: "crm_collab_sales", label: "영업팀" },
    { id: "crm_collab_customer", label: "고객" },
  ],
  followUpExtensions: [
    { id: "crm_result_retention_improved", label: "리텐션 개선" },
    { id: "crm_result_repurchase_up", label: "재구매율 상승" },
    { id: "crm_result_churn_down", label: "이탈률 감소" },
    { id: "crm_result_segment_clarified", label: "고객 세그먼트 명확화" },
    { id: "crm_result_message_reaction", label: "메시지 반응 개선" },
    { id: "crm_result_journey_improved", label: "고객 여정 개선" },
    { id: "crm_result_automation_defined", label: "CRM 자동화 기준 정리" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 이탈 고객 세그먼트를 분석하고 리텐션 캠페인 메시지를 발송해 재구매 지표를 점검했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "데이터팀과 이탈 고객 세그먼트를 분석하고 개인화 메시지를 발송했으며, CS팀 피드백을 반영해 고객 여정을 개선했어요.",
      roleTags: ["고객 세그먼트 정리", "리텐션 캠페인 운영", "이탈 고객 분석"],
      collaborationTags: ["데이터팀", "CS팀"],
      resultTags: ["리텐션 개선", "고객 여정 개선"],
    },
  },
};
