export const ENVIRONMENT_HEALTH_SAFETY_RECORD_PRESET = {
  jobId: "JOB_MANUFACTURING_QUALITY_PRODUCTION_ENVIRONMENT_HEALTH_SAFETY",
  label: "안전환경",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "위험성 평가",
      "안전 점검",
      "환경 규제 확인",
      "사고 예방 활동",
      "안전 교육 운영",
      "법정 점검 자료 정리",
      "개선 조치 확인",
    ],
    project: [
      "안전보건 관리 체계 개선",
      "환경 규제 대응",
      "위험성 평가 체계 구축",
      "사고 예방 프로그램 운영",
      "법정 점검 대응",
      "안전 교육 체계 정리",
      "EHS 지표 관리 체계 구축",
    ],
  },
  collaborationExtensions: [
    { id: "ehs_collab_production", label: "생산팀" },
    { id: "ehs_collab_worker", label: "현장 작업자" },
    { id: "ehs_collab_safety", label: "안전환경팀" },
    { id: "ehs_collab_executive", label: "경영진" },
    { id: "ehs_collab_inspector", label: "외부 점검기관" },
    { id: "ehs_collab_equipment", label: "설비팀" },
    { id: "ehs_collab_quality", label: "품질팀" },
  ],
  followUpExtensions: [
    { id: "ehs_result_risk_reduced", label: "안전사고 리스크 감소" },
    { id: "ehs_result_compliance", label: "법정 점검 대응력 개선" },
    { id: "ehs_result_awareness", label: "현장 안전의식 향상" },
    { id: "ehs_result_env_risk", label: "환경 규제 리스크 감소" },
    { id: "ehs_result_action", label: "개선 조치 이행률 향상" },
    { id: "ehs_result_training", label: "안전 교육 참여율 개선" },
    { id: "ehs_result_standard", label: "EHS 운영 기준 정리" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 위험성 평가를 진행하고 안전 점검을 수행했으며 개선 조치 이행을 확인했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "위험성 평가를 진행하고 안전 점검을 수행했으며, 생산팀·현장 작업자와 사고 예방 활동을 진행해 법정 점검 자료를 정리했어요.",
      roleTags: ["위험성 평가", "안전 점검", "사고 예방 활동"],
      collaborationTags: ["생산팀", "현장 작업자", "안전환경팀"],
      resultTags: ["안전사고 리스크 감소", "법정 점검 대응력 개선"],
    },
  },
};
