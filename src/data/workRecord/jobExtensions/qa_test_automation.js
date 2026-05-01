export const QA_TEST_AUTOMATION_RECORD_PRESET = {
  jobId: "JOB_IT_DATA_DIGITAL_QA_TEST_AUTOMATION",
  label: "QA/Test Automation",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "테스트 케이스 작성",
      "회귀 테스트 수행",
      "버그 재현",
      "테스트 자동화 스크립트 수정",
      "릴리즈 검수",
      "결함 우선순위 정리",
      "품질 이슈 공유",
    ],
    project: [
      "테스트 전략 수립",
      "자동화 테스트 구축",
      "회귀 테스트 체계 개선",
      "릴리즈 품질 기준 정리",
      "결함 관리 프로세스 개선",
      "테스트 커버리지 확대",
      "품질 리포트 작성",
    ],
  },
  collaborationExtensions: [
    { id: "qa_collab_dev", label: "개발팀" },
    { id: "qa_collab_pm", label: "기획자" },
    { id: "qa_collab_product", label: "제품팀" },
    { id: "qa_collab_ops", label: "운영팀" },
    { id: "qa_collab_cs", label: "고객지원팀" },
    { id: "qa_collab_devops", label: "DevOps" },
    { id: "qa_collab_user", label: "사용자" },
  ],
  followUpExtensions: [
    { id: "qa_result_early_detection", label: "결함 조기 발견" },
    { id: "qa_result_release_quality", label: "릴리즈 품질 개선" },
    { id: "qa_result_test_speed", label: "테스트 시간 단축" },
    { id: "qa_result_regression_reduced", label: "재발 버그 감소" },
    { id: "qa_result_standard_clear", label: "품질 기준 명확화" },
    { id: "qa_result_coverage", label: "자동화 커버리지 확대" },
    { id: "qa_result_incident_prevented", label: "운영 장애 예방" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 신규 기능 테스트 케이스를 작성하고 회귀 테스트를 수행해 릴리즈 품질을 검수했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "신규 기능 테스트 케이스를 작성하고 회귀 테스트를 수행했으며, 발견한 버그를 재현해 개발팀·기획자와 우선순위를 정리했어요.",
      roleTags: ["테스트 케이스 작성", "회귀 테스트 수행", "결함 우선순위 정리"],
      collaborationTags: ["개발팀", "기획자", "DevOps"],
      resultTags: ["결함 조기 발견", "릴리즈 품질 개선"],
    },
  },
};
