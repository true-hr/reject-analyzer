export const EQUIPMENT_MAINTENANCE_RECORD_PRESET = {
  jobId: "JOB_MANUFACTURING_QUALITY_PRODUCTION_EQUIPMENT_MAINTENANCE",
  label: "설비관리 / 유지보수",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "설비 점검",
      "예방보전 일정 확인",
      "고장 원인 파악",
      "부품 교체 이력 정리",
      "설비 가동률 확인",
      "보전 작업 기록",
      "긴급 보수 대응",
    ],
    project: [
      "예방보전 체계 개선",
      "설비 고장 분석",
      "설비 가동률 개선",
      "보전 계획 수립",
      "설비 부품 관리 체계 정리",
      "설비 점검 기준 표준화",
      "설비 장애 재발 방지",
    ],
  },
  collaborationExtensions: [
    { id: "eqmaint_collab_production", label: "생산팀" },
    { id: "eqmaint_collab_equipment", label: "설비팀" },
    { id: "eqmaint_collab_quality", label: "품질팀" },
    { id: "eqmaint_collab_process", label: "공정기술팀" },
    { id: "eqmaint_collab_vendor", label: "외부 설비업체" },
    { id: "eqmaint_collab_worker", label: "현장 작업자" },
    { id: "eqmaint_collab_safety", label: "안전환경팀" },
  ],
  followUpExtensions: [
    { id: "eqmaint_result_uptime", label: "설비 가동률 개선" },
    { id: "eqmaint_result_failure_reduced", label: "고장 재발 감소" },
    { id: "eqmaint_result_response", label: "긴급 보수 시간 단축" },
    { id: "eqmaint_result_pm", label: "예방보전 체계화" },
    { id: "eqmaint_result_parts", label: "부품 관리 정확도 개선" },
    { id: "eqmaint_result_risk_reduced", label: "생산 중단 리스크 감소" },
    { id: "eqmaint_result_safety", label: "현장 안전성 개선" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 설비를 점검하고 예방보전 일정을 확인했으며 고장 원인을 파악해 긴급 보수에 대응했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "설비를 점검하고 예방보전 일정을 확인했으며, 공정기술팀·외부 설비업체와 고장 원인을 파악해 긴급 보수에 대응하고 부품 교체 이력을 정리했어요.",
      roleTags: ["설비 점검", "예방보전 일정 확인", "긴급 보수 대응"],
      collaborationTags: ["생산팀", "공정기술팀", "외부 설비업체"],
      resultTags: ["설비 가동률 개선", "고장 재발 감소"],
    },
  },
};
