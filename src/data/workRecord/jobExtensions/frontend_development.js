export const FRONTEND_DEVELOPMENT_RECORD_PRESET = {
  jobId: "JOB_IT_DATA_DIGITAL_FRONTEND_DEVELOPMENT",
  label: "프론트엔드개발",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "UI 컴포넌트 구현",
      "화면 상태 관리",
      "반응형 수정",
      "API 연동",
      "사용자 인터랙션 개선",
      "브라우저 오류 수정",
      "접근성 점검",
    ],
    project: [
      "프론트 구조 설계",
      "디자인 시스템 반영",
      "페이지 플로우 구현",
      "상태 관리 구조 정리",
      "렌더링 성능 개선",
      "사용자 경험 개선",
      "배포 전 화면 검수",
    ],
  },
  collaborationExtensions: [
    { id: "fe_collab_designer", label: "디자이너" },
    { id: "fe_collab_backend", label: "백엔드" },
    { id: "fe_collab_planner", label: "기획자" },
    { id: "fe_collab_qa", label: "QA" },
    { id: "fe_collab_user", label: "사용자" },
    { id: "fe_collab_data", label: "데이터팀" },
    { id: "fe_collab_ops", label: "운영팀" },
  ],
  followUpExtensions: [
    { id: "fe_result_ux_friction_reduced", label: "사용자 불편 감소" },
    { id: "fe_result_ui_error_fixed", label: "화면 오류 해결" },
    { id: "fe_result_render_improved", label: "렌더링 성능 개선" },
    { id: "fe_result_ui_consistency", label: "UI 일관성 확보" },
    { id: "fe_result_dev_productivity", label: "개발 생산성 개선" },
    { id: "fe_result_accessibility", label: "접근성 개선" },
    { id: "fe_result_deploy_quality", label: "배포 품질 안정화" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 UI 컴포넌트를 구현하고 반응형 오류를 수정했으며, 접근성 점검 결과를 반영했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "디자이너·백엔드와 API 연동 이슈를 해결하고 UI 컴포넌트를 구현했으며, QA 피드백을 반영해 화면 오류를 수정했어요.",
      roleTags: ["UI 컴포넌트 구현", "API 연동", "브라우저 오류 수정"],
      collaborationTags: ["디자이너", "백엔드", "QA"],
      resultTags: ["화면 오류 해결", "UI 일관성 확보"],
    },
  },
};
