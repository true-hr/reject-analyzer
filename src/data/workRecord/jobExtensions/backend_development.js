export const BACKEND_DEVELOPMENT_RECORD_PRESET = {
  jobId: "JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT",
  label: "백엔드개발",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "API 설계",
      "서버 로직 구현",
      "DB 쿼리 개선",
      "인증/권한 처리",
      "배치 작업 점검",
      "장애 원인 분석",
      "로그 확인",
    ],
    project: [
      "서버 아키텍처 설계",
      "API 명세 작성",
      "데이터 모델링",
      "성능 튜닝",
      "외부 시스템 연동",
      "배포 안정화",
      "장애 대응 체계 정리",
    ],
  },
  collaborationExtensions: [
    { id: "be_collab_frontend", label: "프론트엔드" },
    { id: "be_collab_planner", label: "기획자" },
    { id: "be_collab_devops", label: "DevOps" },
    { id: "be_collab_qa", label: "QA" },
    { id: "be_collab_data", label: "데이터팀" },
    { id: "be_collab_security", label: "보안팀" },
    { id: "be_collab_external_api", label: "외부 API 담당자" },
  ],
  followUpExtensions: [
    { id: "be_result_response_speed", label: "응답 속도 개선" },
    { id: "be_result_failure_prevented", label: "장애 재발 방지" },
    { id: "be_result_api_stability", label: "API 안정성 확보" },
    { id: "be_result_db_load_reduced", label: "DB 부하 감소" },
    { id: "be_result_auth_clarified", label: "권한 처리 명확화" },
    { id: "be_result_deploy_risk_reduced", label: "배포 리스크 감소" },
    { id: "be_result_ops_issue_resolved", label: "운영 이슈 해결" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 API 응답 속도를 개선하고 인증 흐름을 재정비했으며, 운영 중 발생한 장애 원인을 분석했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "프론트엔드·DevOps와 배포 안정화 이슈를 점검하고 DB 쿼리를 개선해 응답 속도를 개선했어요.",
      roleTags: ["DB 쿼리 개선", "배치 작업 점검", "로그 확인"],
      collaborationTags: ["프론트엔드", "DevOps"],
      resultTags: ["응답 속도 개선", "배포 리스크 감소"],
    },
  },
};
