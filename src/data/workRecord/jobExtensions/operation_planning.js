export const OPERATION_PLANNING_RECORD_PRESET = {
  jobId: "JOB_CUSTOMER_OPERATIONS_OPERATION_PLANNING",
  label: "운영기획",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "운영 지표 점검",
      "운영 이슈 수집 및 정리",
      "유관부서 커뮤니케이션",
      "운영 프로세스 개선 검토",
      "운영 리포트 작성",
      "운영 정책 검토",
      "운영 우선순위 조율",
    ],
    project: [
      "운영 전략 수립",
      "운영 프로세스 설계",
      "운영 효율화 프로젝트",
      "운영 기준 정책화",
      "운영 조직 체계 정비",
      "운영 지표 체계 구축",
      "운영 자동화 기획",
    ],
  },
  collaborationExtensions: [
    { id: "opsplan_collab_ops", label: "운영팀" },
    { id: "opsplan_collab_planning", label: "기획팀" },
    { id: "opsplan_collab_dev", label: "개발팀" },
    { id: "opsplan_collab_cs", label: "CS팀" },
    { id: "opsplan_collab_data", label: "데이터팀" },
    { id: "opsplan_collab_executive", label: "경영진" },
    { id: "opsplan_collab_biz", label: "유관 부서" },
  ],
  followUpExtensions: [
    { id: "opsplan_result_efficiency", label: "운영 효율 개선" },
    { id: "opsplan_result_standard", label: "프로세스 표준화" },
    { id: "opsplan_result_risk_reduced", label: "운영 리스크 감소" },
    { id: "opsplan_result_decision_speed", label: "의사결정 속도 향상" },
    { id: "opsplan_result_metrics", label: "지표 체계 확립" },
    { id: "opsplan_result_collaboration", label: "부서간 협업 개선" },
    { id: "opsplan_result_visibility", label: "운영 현황 가시화" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 운영 지표를 점검하고 이슈를 정리해 유관부서와 우선순위를 조율했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "운영 지표를 점검하고 이슈를 수집해 정리했으며, 기획팀·개발팀과 운영 프로세스 개선 방향을 협의하고 운영 리포트를 작성했어요.",
      roleTags: ["운영 지표 점검", "운영 이슈 수집 및 정리", "운영 리포트 작성"],
      collaborationTags: ["운영팀", "기획팀", "개발팀"],
      resultTags: ["운영 효율 개선", "프로세스 표준화"],
    },
  },
};
