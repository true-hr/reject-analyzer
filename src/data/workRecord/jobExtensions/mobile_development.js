export const MOBILE_DEVELOPMENT_RECORD_PRESET = {
  jobId: "JOB_IT_DATA_DIGITAL_MOBILE_DEVELOPMENT",
  label: "모바일개발",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "앱 화면 구현",
      "API 연동",
      "크래시 로그 확인",
      "앱 성능 점검",
      "푸시 알림 테스트",
      "스토어 배포 준비",
      "기기별 오류 수정",
    ],
    project: [
      "모바일 앱 기능 구현",
      "앱 아키텍처 개선",
      "네이티브 기능 연동",
      "앱 성능 최적화",
      "스토어 배포 프로세스 정리",
      "사용자 행동 이벤트 적용",
      "크래시 안정성 개선",
    ],
  },
  collaborationExtensions: [
    { id: "mobile_collab_pm", label: "기획자" },
    { id: "mobile_collab_design", label: "디자이너" },
    { id: "mobile_collab_backend", label: "백엔드" },
    { id: "mobile_collab_qa", label: "QA" },
    { id: "mobile_collab_data", label: "데이터팀" },
    { id: "mobile_collab_ops", label: "운영팀" },
    { id: "mobile_collab_user", label: "사용자" },
  ],
  followUpExtensions: [
    { id: "mobile_result_stability", label: "앱 안정성 개선" },
    { id: "mobile_result_crash_reduced", label: "크래시 감소" },
    { id: "mobile_result_speed", label: "앱 반응 속도 개선" },
    { id: "mobile_result_flow", label: "사용자 흐름 개선" },
    { id: "mobile_result_deploy_quality", label: "배포 품질 향상" },
    { id: "mobile_result_compatibility", label: "기기 호환성 개선" },
    { id: "mobile_result_usability", label: "모바일 사용성 개선" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 신규 앱 화면을 구현하고 크래시 로그를 분석해 기기별 오류를 수정했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "신규 기능 화면을 구현하고 API를 연동했으며, 크래시 로그를 분석해 기기별 오류를 수정하고 QA·백엔드와 배포를 준비했어요.",
      roleTags: ["앱 화면 구현", "API 연동", "크래시 로그 확인"],
      collaborationTags: ["기획자", "디자이너", "QA"],
      resultTags: ["앱 안정성 개선", "크래시 감소"],
    },
  },
};
