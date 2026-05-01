export const IT_OPERATIONS_SYSTEMS_MANAGEMENT_RECORD_PRESET = {
  jobId: "JOB_IT_DATA_DIGITAL_IT_OPERATIONS_SYSTEMS_MANAGEMENT",
  label: "IT 운영 / 시스템관리",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "시스템 상태 점검",
      "계정/권한 관리",
      "장애 이슈 대응",
      "사용자 문의 처리",
      "백업 상태 확인",
      "시스템 로그 확인",
      "운영 정책 점검",
    ],
    project: [
      "시스템 운영 체계 개선",
      "계정/권한 관리 프로세스 정리",
      "장애 대응 프로세스 개선",
      "IT 헬프데스크 운영 개선",
      "시스템 모니터링 체계 구축",
      "백업/복구 절차 정리",
      "운영 자동화 과제 추진",
    ],
  },
  collaborationExtensions: [
    { id: "itops_collab_staff", label: "임직원" },
    { id: "itops_collab_business", label: "현업 부서" },
    { id: "itops_collab_infra", label: "인프라팀" },
    { id: "itops_collab_security", label: "보안팀" },
    { id: "itops_collab_dev", label: "개발팀" },
    { id: "itops_collab_vendor", label: "외부 벤더" },
    { id: "itops_collab_support", label: "경영지원팀" },
  ],
  followUpExtensions: [
    { id: "itops_result_stability", label: "시스템 안정성 개선" },
    { id: "itops_result_incident", label: "장애 대응 시간 단축" },
    { id: "itops_result_inquiry", label: "사용자 문의 처리 속도 개선" },
    { id: "itops_result_access", label: "권한 관리 정확도 향상" },
    { id: "itops_result_risk", label: "운영 리스크 감소" },
    { id: "itops_result_backup", label: "백업/복구 대응력 개선" },
    { id: "itops_result_automation", label: "반복 운영 업무 감소" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 시스템 상태를 점검하고 계정/권한을 관리했으며 장애 이슈에 대응했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "시스템 상태를 점검하고 계정/권한을 관리했으며, 인프라팀·보안팀과 장애 이슈에 대응해 사용자 문의를 처리했어요.",
      roleTags: ["시스템 상태 점검", "계정/권한 관리", "장애 이슈 대응"],
      collaborationTags: ["임직원", "인프라팀", "보안팀"],
      resultTags: ["시스템 안정성 개선", "장애 대응 시간 단축"],
    },
  },
};
