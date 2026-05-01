export const PRODUCTION_MANAGEMENT_RECORD_PRESET = {
  jobId: "JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_MANAGEMENT",
  label: "생산관리",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "생산계획 점검",
      "생산 실적 확인",
      "라인 운영 현황 점검",
      "납기 이슈 대응",
      "생산 인력 배치 확인",
      "생산 KPI 점검",
      "생산 지연 원인 확인",
    ],
    project: [
      "생산계획 수립",
      "생산 라인 운영 개선",
      "납기 대응 체계 정리",
      "생산 실적 관리 체계 구축",
      "생산성 개선 과제 추진",
      "생산 일정 조율 프로세스 개선",
      "생산 KPI 관리 기준 수립",
    ],
  },
  collaborationExtensions: [
    { id: "prodmgmt_collab_production", label: "생산팀" },
    { id: "prodmgmt_collab_quality", label: "품질팀" },
    { id: "prodmgmt_collab_purchasing", label: "구매팀" },
    { id: "prodmgmt_collab_logistics", label: "물류팀" },
    { id: "prodmgmt_collab_sales", label: "영업팀" },
    { id: "prodmgmt_collab_worker", label: "현장 작업자" },
    { id: "prodmgmt_collab_supplier", label: "협력사" },
  ],
  followUpExtensions: [
    { id: "prodmgmt_result_schedule", label: "생산 일정 안정화" },
    { id: "prodmgmt_result_delivery", label: "납기 지연 감소" },
    { id: "prodmgmt_result_productivity", label: "생산성 개선" },
    { id: "prodmgmt_result_line", label: "라인 운영 효율 향상" },
    { id: "prodmgmt_result_visibility", label: "생산 실적 가시화" },
    { id: "prodmgmt_result_coordination", label: "부서 간 조율 개선" },
    { id: "prodmgmt_result_risk_reduced", label: "생산 리스크 감소" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 생산계획을 점검하고 라인 운영 현황을 확인했으며 납기 이슈에 대응했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "생산계획을 점검하고 생산 실적을 확인했으며, 품질팀·물류팀과 납기 이슈에 대응해 라인 운영 현황을 정리했어요.",
      roleTags: ["생산계획 점검", "생산 실적 확인", "납기 이슈 대응"],
      collaborationTags: ["생산팀", "품질팀", "물류팀"],
      resultTags: ["생산 일정 안정화", "납기 지연 감소"],
    },
  },
};
