export const BACKOFFICE_RECORD_PRESET = {
  jobId: "JOB_CUSTOMER_OPERATIONS_BACKOFFICE_OPERATIONS",
  label: "백오피스",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "백오피스 요청 처리",
      "운영 데이터 업데이트",
      "데이터 정합성 점검",
      "운영 툴 이슈 확인",
      "내부 문의 대응",
      "백오피스 기능 점검",
      "운영 이슈 정리",
    ],
    project: [
      "백오피스 운영 개선",
      "운영 툴 고도화",
      "데이터 관리 체계 정비",
      "백오피스 프로세스 표준화",
      "내부 운영 자동화",
      "백오피스 접근 권한 정책 수립",
      "운영 환경 개선",
    ],
  },
  collaborationExtensions: [
    { id: "backoffice_collab_dev", label: "개발팀" },
    { id: "backoffice_collab_ops", label: "운영팀" },
    { id: "backoffice_collab_cs", label: "CS팀" },
    { id: "backoffice_collab_data", label: "데이터팀" },
    { id: "backoffice_collab_planning", label: "기획팀" },
    { id: "backoffice_collab_support", label: "경영지원팀" },
    { id: "backoffice_collab_biz", label: "유관 부서" },
  ],
  followUpExtensions: [
    { id: "backoffice_result_efficiency", label: "운영 효율화" },
    { id: "backoffice_result_data_accuracy", label: "데이터 정확도 향상" },
    { id: "backoffice_result_stability", label: "백오피스 안정성 개선" },
    { id: "backoffice_result_speed", label: "내부 처리 속도 향상" },
    { id: "backoffice_result_standard", label: "운영 기준 표준화" },
    { id: "backoffice_result_automation", label: "자동화 도입" },
    { id: "backoffice_result_access_control", label: "권한 관리 체계화" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 백오피스 요청을 처리하고 운영 데이터를 업데이트하며 데이터 정합성을 점검했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "백오피스 요청을 처리하고 운영 데이터를 업데이트했으며, 개발팀과 운영 툴 이슈를 확인해 데이터 정합성을 점검했어요.",
      roleTags: ["백오피스 요청 처리", "운영 데이터 업데이트", "데이터 정합성 점검"],
      collaborationTags: ["개발팀", "운영팀", "CS팀"],
      resultTags: ["운영 효율화", "데이터 정확도 향상"],
    },
  },
};
