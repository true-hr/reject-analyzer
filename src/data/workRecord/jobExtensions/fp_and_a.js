export const FP_AND_A_RECORD_PRESET = {
  jobId: "JOB_FINANCE_ACCOUNTING_FP_AND_A",
  label: "FP&A",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "예산 실적 비교",
      "매출/비용 분석",
      "손익 지표 점검",
      "경영 보고 자료 작성",
      "사업부 실적 리뷰",
      "예측 데이터 업데이트",
      "비용 변동 원인 분석",
    ],
    project: [
      "연간 예산 수립",
      "Forecast 모델 개선",
      "사업부 손익 분석",
      "경영 계획 작성",
      "투자 의사결정 지원",
      "KPI 대시보드 정리",
      "재무 시나리오 분석",
    ],
  },
  collaborationExtensions: [
    { id: "fpa_collab_executive", label: "경영진" },
    { id: "fpa_collab_finance", label: "재무팀" },
    { id: "fpa_collab_biz_unit", label: "사업부" },
    { id: "fpa_collab_accounting", label: "회계팀" },
    { id: "fpa_collab_sales", label: "영업팀" },
    { id: "fpa_collab_data", label: "데이터팀" },
    { id: "fpa_collab_auditor", label: "외부 감사인" },
  ],
  followUpExtensions: [
    { id: "fpa_result_budget_accuracy", label: "예산 정확도 개선" },
    { id: "fpa_result_cost_structure", label: "비용 구조 명확화" },
    { id: "fpa_result_profit_insight", label: "손익 개선 포인트 도출" },
    { id: "fpa_result_decision_support", label: "경영 의사결정 지원" },
    { id: "fpa_result_forecast_accuracy", label: "Forecast 정확도 개선" },
    { id: "fpa_result_biz_visibility", label: "사업부 성과 가시화" },
    { id: "fpa_result_risk_precheck", label: "재무 리스크 사전 확인" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 사업부별 예산 실적을 비교하고 비용 변동 원인을 분석해 경영 보고 자료를 업데이트했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "사업부·회계팀과 월간 손익을 리뷰하고 예측 데이터를 업데이트해 경영진에게 재무 현황 및 개선 포인트를 공유했어요.",
      roleTags: ["예산 실적 비교", "손익 지표 점검", "경영 보고 자료 작성"],
      collaborationTags: ["경영진", "사업부", "회계팀"],
      resultTags: ["경영 의사결정 지원", "손익 개선 포인트 도출"],
    },
  },
};
