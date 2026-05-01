export const CS_RECORD_PRESET = {
  jobId: "JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS",
  label: "CS",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "고객 문의 처리",
      "VOC 분류 및 정리",
      "에스컬레이션 이관",
      "FAQ 업데이트",
      "운영 지표 점검",
      "응대 품질 점검",
      "고객 불만 대응",
    ],
    project: [
      "CS 프로세스 개선",
      "FAQ 재정비",
      "운영 지표 분석",
      "응대 매뉴얼 작성",
      "고객 만족도 조사",
      "챗봇/자동화 개선",
      "CS 교육 자료 제작",
    ],
  },
  collaborationExtensions: [
    { id: "cs_collab_dev", label: "개발팀" },
    { id: "cs_collab_ops", label: "운영팀" },
    { id: "cs_collab_pm", label: "PM" },
    { id: "cs_collab_marketing", label: "마케팅팀" },
    { id: "cs_collab_sales", label: "영업팀" },
    { id: "cs_collab_legal", label: "법무팀" },
  ],
  followUpExtensions: [
    { id: "cs_result_satisfaction", label: "고객 만족도 향상" },
    { id: "cs_result_quality", label: "응대 품질 개선" },
    { id: "cs_result_speed", label: "문의 처리 속도 개선" },
    { id: "cs_result_complaints_down", label: "불만 감소" },
    { id: "cs_result_faq", label: "FAQ 완성도 향상" },
    { id: "cs_result_ops_efficiency", label: "CS 운영 효율화" },
    { id: "cs_result_escalation_down", label: "에스컬레이션 감소" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 고객 문의를 처리하고 VOC를 분류해 자주 묻는 질문을 FAQ에 반영했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "고객 문의를 처리하고 VOC를 분류·정리해 FAQ를 업데이트했으며, 개발팀에 에스컬레이션 이슈를 이관했어요.",
      roleTags: ["고객 문의 처리", "VOC 분류 및 정리", "FAQ 업데이트"],
      collaborationTags: ["개발팀", "운영팀", "PM"],
      resultTags: ["고객 만족도 향상", "FAQ 완성도 향상"],
    },
  },
};
