export const QUALITY_OPS_RECORD_PRESET = {
  jobId: "JOB_CUSTOMER_OPERATIONS_QUALITY_OPERATIONS",
  label: "품질운영",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "서비스 품질 지표 확인",
      "품질 이슈 모니터링",
      "QA 점검 수행",
      "불량/오류 케이스 수집",
      "품질 기준 검토",
      "개선 요청 정리",
      "품질 리포트 작성",
    ],
    project: [
      "품질 기준 체계 수립",
      "QA 프로세스 개선",
      "품질 모니터링 자동화",
      "품질 관리 매뉴얼 작성",
      "품질 지표 대시보드 구축",
      "불량 케이스 분석 체계 마련",
      "품질 운영 정책 수립",
    ],
  },
  collaborationExtensions: [
    { id: "qualops_collab_dev", label: "개발팀" },
    { id: "qualops_collab_ops", label: "운영팀" },
    { id: "qualops_collab_cs", label: "CS팀" },
    { id: "qualops_collab_data", label: "데이터팀" },
    { id: "qualops_collab_planning", label: "기획팀" },
    { id: "qualops_collab_qa", label: "QA팀" },
    { id: "qualops_collab_biz", label: "유관 부서" },
  ],
  followUpExtensions: [
    { id: "qualops_result_quality", label: "서비스 품질 향상" },
    { id: "qualops_result_defect_reduced", label: "불량률 감소" },
    { id: "qualops_result_qa_efficiency", label: "QA 효율화" },
    { id: "qualops_result_standard_clear", label: "품질 기준 명확화" },
    { id: "qualops_result_issue_response", label: "이슈 대응 체계 강화" },
    { id: "qualops_result_satisfaction", label: "고객 만족도 개선" },
    { id: "qualops_result_metrics", label: "품질 지표 체계 확립" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 서비스 품질 지표를 확인하고 품질 이슈를 모니터링해 개선 요청을 정리했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "서비스 품질 지표를 확인하고 불량/오류 케이스를 수집했으며, 개발팀·QA팀과 품질 이슈를 점검해 개선 요청을 정리했어요.",
      roleTags: ["서비스 품질 지표 확인", "QA 점검 수행", "불량/오류 케이스 수집"],
      collaborationTags: ["개발팀", "QA팀", "운영팀"],
      resultTags: ["서비스 품질 향상", "불량률 감소"],
    },
  },
};
