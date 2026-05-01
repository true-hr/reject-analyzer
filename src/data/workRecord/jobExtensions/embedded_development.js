export const EMBEDDED_DEVELOPMENT_RECORD_PRESET = {
  jobId: "JOB_ENGINEERING_DEVELOPMENT_EMBEDDED_DEVELOPMENT",
  label: "임베디드개발",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "펌웨어 코드 수정",
      "디바이스 동작 확인",
      "센서/모듈 연동",
      "보드 테스트",
      "통신 오류 확인",
      "디버깅 로그 분석",
      "펌웨어 빌드 점검",
    ],
    project: [
      "임베디드 시스템 설계",
      "펌웨어 기능 구현",
      "하드웨어 연동 테스트",
      "통신 프로토콜 구현",
      "디바이스 성능 최적화",
      "펌웨어 안정화",
      "양산 전 검증 지원",
    ],
  },
  collaborationExtensions: [
    { id: "embdev_collab_hw", label: "하드웨어팀" },
    { id: "embdev_collab_circuit", label: "회로설계팀" },
    { id: "embdev_collab_mech", label: "기구설계팀" },
    { id: "embdev_collab_prod", label: "생산기술팀" },
    { id: "embdev_collab_qa", label: "QA팀" },
    { id: "embdev_collab_vendor", label: "외부 부품사" },
    { id: "embdev_collab_product", label: "제품팀" },
  ],
  followUpExtensions: [
    { id: "embdev_result_stability", label: "디바이스 동작 안정화" },
    { id: "embdev_result_bug", label: "펌웨어 오류 감소" },
    { id: "embdev_result_hw", label: "하드웨어 연동 품질 개선" },
    { id: "embdev_result_comm", label: "통신 안정성 향상" },
    { id: "embdev_result_debug", label: "디버깅 시간 단축" },
    { id: "embdev_result_mass", label: "양산 리스크 감소" },
    { id: "embdev_result_reliability", label: "제품 신뢰성 개선" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 펌웨어 코드를 수정하고 디바이스 동작을 확인했으며 센서·모듈 연동을 점검했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "펌웨어 코드를 수정하고 디바이스 동작을 확인했으며, 하드웨어팀·회로설계팀과 보드 테스트를 진행하고 통신 오류를 점검했어요.",
      roleTags: ["펌웨어 코드 수정", "디바이스 동작 확인", "보드 테스트"],
      collaborationTags: ["하드웨어팀", "회로설계팀", "QA팀"],
      resultTags: ["디바이스 동작 안정화", "펌웨어 오류 감소"],
    },
  },
};
