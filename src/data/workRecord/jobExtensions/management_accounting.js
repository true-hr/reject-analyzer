export const MANAGEMENT_ACCOUNTING_RECORD_PRESET = {
  jobId: "JOB_FINANCE_ACCOUNTING_MANAGEMENT_ACCOUNTING",
  label: "관리회계",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "원가 자료 확인",
      "부서별 손익 분석",
      "비용 배부 기준 점검",
      "예산 대비 실적 비교",
      "수익성 지표 점검",
      "관리회계 리포트 작성",
      "비용 변동 원인 분석",
    ],
    project: [
      "원가 관리 체계 개선",
      "사업부 손익 구조 분석",
      "비용 배부 기준 정리",
      "수익성 분석 모델 개선",
      "관리회계 리포트 체계화",
      "예산 통제 기준 수립",
      "비용 개선 과제 도출",
    ],
  },
  collaborationExtensions: [
    { id: "mgmtacc_collab_finance", label: "재무팀" },
    { id: "mgmtacc_collab_accounting", label: "회계팀" },
    { id: "mgmtacc_collab_biz_unit", label: "사업부" },
    { id: "mgmtacc_collab_executive", label: "경영진" },
    { id: "mgmtacc_collab_production", label: "생산팀" },
    { id: "mgmtacc_collab_sales", label: "영업팀" },
    { id: "mgmtacc_collab_data", label: "데이터팀" },
  ],
  followUpExtensions: [
    { id: "mgmtacc_result_cost_clear", label: "원가 구조 명확화" },
    { id: "mgmtacc_result_profit_insight", label: "수익성 개선 포인트 도출" },
    { id: "mgmtacc_result_cost_control", label: "비용 통제 기준 정리" },
    { id: "mgmtacc_result_biz_visibility", label: "사업부 성과 가시화" },
    { id: "mgmtacc_result_budget_accuracy", label: "예산 관리 정확도 개선" },
    { id: "mgmtacc_result_decision_support", label: "경영 의사결정 지원" },
    { id: "mgmtacc_result_cost_saving", label: "비용 절감 기회 발굴" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 부서별 손익을 분석하고 예산 대비 실적을 비교해 관리회계 리포트를 작성했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "부서별 손익을 분석하고 비용 변동 원인을 파악해 예산 대비 실적 리포트를 경영진·사업부에 공유했어요.",
      roleTags: ["부서별 손익 분석", "예산 대비 실적 비교", "관리회계 리포트 작성"],
      collaborationTags: ["재무팀", "회계팀", "사업부"],
      resultTags: ["수익성 개선 포인트 도출", "경영 의사결정 지원"],
    },
  },
};
