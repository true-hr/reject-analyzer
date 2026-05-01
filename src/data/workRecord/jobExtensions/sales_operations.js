export const SALES_OPERATIONS_RECORD_PRESET = {
  jobId: "JOB_SALES_SALES_OPERATIONS",
  label: "세일즈옵스",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "영업 데이터 정리",
      "파이프라인 지표 점검",
      "CRM 입력 현황 확인",
      "매출 Forecast 업데이트",
      "영업 프로세스 이슈 정리",
      "리드 배분 기준 점검",
      "영업 리포트 작성",
    ],
    project: [
      "영업 운영 프로세스 개선",
      "CRM 운영 기준 정리",
      "파이프라인 관리 체계 구축",
      "매출 예측 모델 개선",
      "영업 성과 대시보드 정리",
      "리드 관리 프로세스 개선",
      "영업 생산성 개선안 도출",
    ],
  },
  collaborationExtensions: [
    { id: "sops_collab_sales", label: "영업팀" },
    { id: "sops_collab_marketing", label: "마케팅팀" },
    { id: "sops_collab_executive", label: "경영진" },
    { id: "sops_collab_data", label: "데이터팀" },
    { id: "sops_collab_product", label: "제품팀" },
    { id: "sops_collab_cs", label: "CS팀" },
    { id: "sops_collab_partner", label: "파트너사" },
  ],
  followUpExtensions: [
    { id: "sops_result_pipeline_visibility", label: "파이프라인 가시성 개선" },
    { id: "sops_result_forecast_accuracy", label: "매출 예측 정확도 향상" },
    { id: "sops_result_productivity", label: "영업 생산성 개선" },
    { id: "sops_result_crm_quality", label: "CRM 데이터 품질 개선" },
    { id: "sops_result_lead_conversion", label: "리드 전환 관리 개선" },
    { id: "sops_result_bottleneck", label: "영업 프로세스 병목 해소" },
    { id: "sops_result_report_quality", label: "의사결정 리포트 완성도 개선" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 파이프라인 지표를 점검하고 CRM 입력 현황을 확인해 영업 리포트를 작성했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "파이프라인 지표를 점검하고 매출 Forecast를 업데이트해 영업팀·경영진에게 영업 현황과 개선 포인트를 공유했어요.",
      roleTags: ["파이프라인 지표 점검", "매출 Forecast 업데이트", "영업 리포트 작성"],
      collaborationTags: ["영업팀", "마케팅팀", "경영진"],
      resultTags: ["파이프라인 가시성 개선", "매출 예측 정확도 향상"],
    },
  },
};
