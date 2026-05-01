export const SERVICE_PLANNING_RECORD_PRESET = {
  jobId: "JOB_BUSINESS_SERVICE_PLANNING",
  label: "서비스기획",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "요구사항 정리",
      "화면 흐름 설계",
      "정책 검토",
      "사용자 시나리오 정리",
      "기획서 수정",
      "개선 요청 정리",
      "이슈 우선순위 조정",
    ],
    project: [
      "서비스 정책 정의",
      "기능 요구사항 작성",
      "와이어프레임 검토",
      "사용자 플로우 설계",
      "백로그 정리",
      "개발 범위 조율",
      "릴리즈 기준 정리",
    ],
  },
  collaborationExtensions: [
    { id: "sp_collab_dev", label: "개발팀" },
    { id: "sp_collab_design", label: "디자인팀" },
    { id: "sp_collab_ops", label: "운영팀" },
    { id: "sp_collab_marketing", label: "마케팅팀" },
    { id: "sp_collab_cs", label: "CS팀" },
    { id: "sp_collab_decision_maker", label: "의사결정자" },
    { id: "sp_collab_user", label: "사용자" },
  ],
  followUpExtensions: [
    { id: "sp_result_req_clarified", label: "요구사항 명확화" },
    { id: "sp_result_scope_confirmed", label: "기획 범위 확정" },
    { id: "sp_result_flow_improved", label: "사용자 흐름 개선" },
    { id: "sp_result_policy_defined", label: "정책 기준 정리" },
    { id: "sp_result_dev_communication", label: "개발 커뮤니케이션 개선" },
    { id: "sp_result_priority_clarified", label: "우선순위 명확화" },
    { id: "sp_result_release_ready", label: "릴리즈 준비도 개선" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 신규 기능 요구사항을 정리하고 개발팀과 구현 범위를 조율했으며, 우선순위를 재조정했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "개발팀·디자인팀과 화면 흐름을 검토하고 정책 기준을 정리했으며, 의사결정자에게 우선순위 조정안을 공유했어요.",
      roleTags: ["요구사항 정리", "화면 흐름 설계", "이슈 우선순위 조정"],
      collaborationTags: ["개발팀", "디자인팀", "의사결정자"],
      resultTags: ["요구사항 명확화", "기획 범위 확정"],
    },
  },
};
