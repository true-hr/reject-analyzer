export const SYSTEMS_ENGINEERING_RECORD_PRESET = {
  jobId: "JOB_ENGINEERING_DEVELOPMENT_SYSTEMS_ENGINEERING",
  label: "시스템엔지니어",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "시스템 요구사항 정리",
      "인터페이스 조건 확인",
      "서브시스템 이슈 점검",
      "시스템 테스트 결과 확인",
      "기술 리스크 정리",
      "설계 변경 영향 검토",
      "통합 일정 조율",
    ],
    project: [
      "시스템 아키텍처 설계",
      "요구사항 관리 체계 구축",
      "서브시스템 통합 검증",
      "인터페이스 관리",
      "시스템 테스트 계획 수립",
      "기술 리스크 관리",
      "시스템 설계 변경 관리",
    ],
  },
  collaborationExtensions: [
    { id: "syseng_collab_mech", label: "기구설계팀" },
    { id: "syseng_collab_circuit", label: "회로설계팀" },
    { id: "syseng_collab_sw", label: "소프트웨어팀" },
    { id: "syseng_collab_quality", label: "품질팀" },
    { id: "syseng_collab_rd", label: "연구개발팀" },
    { id: "syseng_collab_customer", label: "고객사" },
    { id: "syseng_collab_partner", label: "외부 기술 파트너" },
  ],
  followUpExtensions: [
    { id: "syseng_result_integration", label: "시스템 통합 안정성 개선" },
    { id: "syseng_result_traceability", label: "요구사항 추적성 향상" },
    { id: "syseng_result_interface", label: "인터페이스 오류 감소" },
    { id: "syseng_result_risk", label: "기술 리스크 감소" },
    { id: "syseng_result_test", label: "통합 테스트 품질 개선" },
    { id: "syseng_result_change", label: "설계 변경 영향도 관리 개선" },
    { id: "syseng_result_schedule", label: "제품 개발 일정 안정화" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 시스템 요구사항을 정리하고 인터페이스 조건을 확인했으며 서브시스템 이슈를 점검했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "시스템 요구사항을 정리하고 인터페이스 조건을 확인했으며, 기구설계팀·소프트웨어팀과 서브시스템 이슈를 점검하고 설계 변경 영향을 검토했어요.",
      roleTags: ["시스템 요구사항 정리", "인터페이스 조건 확인", "설계 변경 영향 검토"],
      collaborationTags: ["기구설계팀", "소프트웨어팀", "품질팀"],
      resultTags: ["시스템 통합 안정성 개선", "인터페이스 오류 감소"],
    },
  },
};
