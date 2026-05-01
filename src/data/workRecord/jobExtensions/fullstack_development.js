export const FULLSTACK_DEVELOPMENT_RECORD_PRESET = {
  jobId: "JOB_IT_DATA_DIGITAL_FULLSTACK_DEVELOPMENT",
  label: "풀스택개발",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "기능 전체 구현",
      "프론트/백엔드 연동",
      "API 수정",
      "DB 구조 수정",
      "화면 오류 수정",
      "배포 준비",
      "운영 이슈 대응",
    ],
    project: [
      "전체 기능 설계",
      "데이터 흐름 구현",
      "프론트/서버 통합",
      "인증 흐름 구현",
      "배포 파이프라인 점검",
      "성능 병목 개선",
      "운영 기능 고도화",
    ],
  },
  collaborationExtensions: [
    { id: "fs_collab_planner", label: "기획자" },
    { id: "fs_collab_designer", label: "디자이너" },
    { id: "fs_collab_backend", label: "백엔드" },
    { id: "fs_collab_frontend", label: "프론트엔드" },
    { id: "fs_collab_devops", label: "DevOps" },
    { id: "fs_collab_qa", label: "QA" },
    { id: "fs_collab_user", label: "사용자" },
  ],
  followUpExtensions: [
    { id: "fs_result_feature_completeness", label: "기능 완성도 개선" },
    { id: "fs_result_bottleneck_resolved", label: "개발 병목 해소" },
    { id: "fs_result_integration_stable", label: "화면/서버 연동 안정화" },
    { id: "fs_result_deploy_stable", label: "배포 안정성 확보" },
    { id: "fs_result_ops_issue_reduced", label: "운영 이슈 감소" },
    { id: "fs_result_user_flow_improved", label: "사용자 흐름 개선" },
    { id: "fs_result_tech_debt_reduced", label: "기술 부채 감소" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 신규 기능을 프론트/백엔드 전체 구현하고 배포했으며, 운영 중 발생한 이슈에 대응했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "기획자·디자이너 요구사항을 받아 기능을 전체 구현하고, QA와 함께 배포 전 검수를 완료했어요.",
      roleTags: ["기능 전체 구현", "프론트/백엔드 연동", "배포 준비"],
      collaborationTags: ["기획자", "디자이너", "QA"],
      resultTags: ["기능 완성도 개선", "배포 안정성 확보"],
    },
  },
};
