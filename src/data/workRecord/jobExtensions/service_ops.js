export const SERVICE_OPS_RECORD_PRESET = {
  jobId: "JOB_CUSTOMER_OPERATIONS_SERVICE_OPERATIONS",
  label: "서비스 운영",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "서비스 이슈 모니터링",
      "운영 지표 확인 및 이상 감지",
      "운영 요청 처리",
      "서비스 공지 관리",
      "유관부서 이슈 대응",
      "운영 데이터 점검",
      "시스템/인프라 이슈 확인",
    ],
    project: [
      "서비스 운영 프로세스 개선",
      "운영 자동화 구축",
      "SLA 기준 정비",
      "운영 매뉴얼 작성",
      "장애 대응 체계 수립",
      "서비스 지표 관리 체계 구축",
      "운영 환경 점검 및 개선",
    ],
  },
  collaborationExtensions: [
    { id: "svcops_collab_dev", label: "개발팀" },
    { id: "svcops_collab_planning", label: "기획팀" },
    { id: "svcops_collab_cs", label: "CS팀" },
    { id: "svcops_collab_infra", label: "인프라팀" },
    { id: "svcops_collab_data", label: "데이터팀" },
    { id: "svcops_collab_marketing", label: "마케팅팀" },
    { id: "svcops_collab_biz", label: "유관 부서" },
  ],
  followUpExtensions: [
    { id: "svcops_result_stability", label: "서비스 안정성 개선" },
    { id: "svcops_result_efficiency", label: "운영 효율화" },
    { id: "svcops_result_response_speed", label: "이슈 대응 속도 향상" },
    { id: "svcops_result_visibility", label: "지표 가시성 개선" },
    { id: "svcops_result_standard", label: "운영 기준 표준화" },
    { id: "svcops_result_sla", label: "SLA 준수율 향상" },
    { id: "svcops_result_incident_reduced", label: "장애 발생 감소" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 서비스 이슈를 모니터링하고 운영 요청을 처리하며 유관부서와 이슈에 대응했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "서비스 이슈를 모니터링하고 운영 데이터를 점검했으며, 개발팀·인프라팀과 시스템 이슈에 대응해 서비스 안정성을 유지했어요.",
      roleTags: ["서비스 이슈 모니터링", "운영 요청 처리", "운영 데이터 점검"],
      collaborationTags: ["개발팀", "인프라팀", "CS팀"],
      resultTags: ["서비스 안정성 개선", "이슈 대응 속도 향상"],
    },
  },
};
