export const ENG_TESTING_VALIDATION_RECORD_PRESET = {
  jobId: "JOB_ENGINEERING_DEVELOPMENT_TESTING_VALIDATION",
  label: "테스트 / 검증",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "테스트 케이스 작성",
      "검증 시나리오 실행",
      "결함 재현",
      "테스트 결과 정리",
      "신뢰성 테스트 확인",
      "인증/규격 조건 점검",
      "개선 요청사항 전달",
    ],
    project: [
      "제품 검증 계획 수립",
      "테스트 프로세스 개선",
      "신뢰성 검증 수행",
      "결함 분석 체계 정리",
      "검증 리포트 작성",
      "인증 대응 테스트 지원",
      "테스트 커버리지 확대",
    ],
  },
  collaborationExtensions: [
    { id: "engtest_collab_dev", label: "개발팀" },
    { id: "engtest_collab_quality", label: "품질팀" },
    { id: "engtest_collab_prod", label: "생산팀" },
    { id: "engtest_collab_product", label: "제품팀" },
    { id: "engtest_collab_lab", label: "외부 시험기관" },
    { id: "engtest_collab_customer", label: "고객사" },
    { id: "engtest_collab_rd", label: "연구개발팀" },
  ],
  followUpExtensions: [
    { id: "engtest_result_early", label: "결함 조기 발견" },
    { id: "engtest_result_accuracy", label: "검증 정확도 개선" },
    { id: "engtest_result_reliability", label: "제품 신뢰성 향상" },
    { id: "engtest_result_cert", label: "인증 대응력 개선" },
    { id: "engtest_result_time", label: "테스트 반복 시간 감소" },
    { id: "engtest_result_risk", label: "품질 리스크 감소" },
    { id: "engtest_result_launch", label: "출시 안정성 향상" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 테스트 케이스를 작성하고 검증 시나리오를 실행했으며 결함을 재현하고 테스트 결과를 정리했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "테스트 케이스를 작성하고 검증 시나리오를 실행했으며, 개발팀·품질팀과 결함을 재현하고 인증 규격 조건을 점검했어요.",
      roleTags: ["테스트 케이스 작성", "검증 시나리오 실행", "결함 재현"],
      collaborationTags: ["개발팀", "품질팀", "외부 시험기관"],
      resultTags: ["결함 조기 발견", "제품 신뢰성 향상"],
    },
  },
};
