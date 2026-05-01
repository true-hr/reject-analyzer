export const AUTOMATION_CONTROL_RECORD_PRESET = {
  jobId: "JOB_MANUFACTURING_QUALITY_PRODUCTION_AUTOMATION_CONTROL",
  label: "설비제어 / 자동제어",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "PLC 로직 점검",
      "제어 오류 확인",
      "자동화 라인 상태 점검",
      "센서/액추에이터 이슈 확인",
      "HMI 화면 점검",
      "제어 시스템 로그 확인",
      "자동화 설비 테스트",
    ],
    project: [
      "자동화 제어 로직 개선",
      "PLC 프로그램 수정",
      "설비 제어 시스템 연동",
      "자동화 라인 안정화",
      "HMI/SCADA 개선",
      "제어 오류 재발 방지",
      "FA 시스템 고도화",
    ],
  },
  collaborationExtensions: [
    { id: "autoctl_collab_equipment", label: "설비팀" },
    { id: "autoctl_collab_production", label: "생산팀" },
    { id: "autoctl_collab_process", label: "공정기술팀" },
    { id: "autoctl_collab_vendor", label: "외부 장비업체" },
    { id: "autoctl_collab_it", label: "IT팀" },
    { id: "autoctl_collab_worker", label: "현장 작업자" },
    { id: "autoctl_collab_quality", label: "품질팀" },
  ],
  followUpExtensions: [
    { id: "autoctl_result_stability", label: "자동화 라인 안정성 개선" },
    { id: "autoctl_result_error_reduced", label: "제어 오류 감소" },
    { id: "autoctl_result_downtime", label: "설비 정지 시간 감소" },
    { id: "autoctl_result_automation", label: "작업 자동화 수준 향상" },
    { id: "autoctl_result_response", label: "현장 대응 속도 개선" },
    { id: "autoctl_result_reliability", label: "제어 시스템 신뢰도 향상" },
    { id: "autoctl_result_efficiency", label: "생산 효율 개선" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 PLC 로직을 점검하고 제어 오류를 확인했으며 자동화 라인 상태를 점검했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "PLC 로직을 점검하고 제어 오류를 확인했으며, 설비팀·외부 장비업체와 센서/액추에이터 이슈에 대응해 자동화 설비 테스트를 완료했어요.",
      roleTags: ["PLC 로직 점검", "제어 오류 확인", "자동화 설비 테스트"],
      collaborationTags: ["설비팀", "공정기술팀", "외부 장비업체"],
      resultTags: ["자동화 라인 안정성 개선", "제어 오류 감소"],
    },
  },
};
