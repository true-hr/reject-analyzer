export const FINANCE_RECORD_PRESET = {
  jobId: "JOB_FINANCE_ACCOUNTING_FINANCE",
  label: "재무",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "재무 지표 점검",
      "현금흐름 확인",
      "투자 검토 자료 정리",
      "재무 리스크 점검",
      "자금 운용 현황 확인",
      "재무 보고 자료 작성",
      "사업부 재무 이슈 검토",
    ],
    project: [
      "재무 전략 수립",
      "투자 의사결정 지원",
      "자금 조달 검토",
      "재무 구조 개선",
      "재무 리스크 관리 체계 정리",
      "사업성 분석",
      "재무 보고 체계 개선",
    ],
  },
  collaborationExtensions: [
    { id: "fin_collab_executive", label: "경영진" },
    { id: "fin_collab_accounting", label: "회계팀" },
    { id: "fin_collab_biz_unit", label: "사업부" },
    { id: "fin_collab_investor", label: "투자자" },
    { id: "fin_collab_bank", label: "금융기관" },
    { id: "fin_collab_legal", label: "법무팀" },
    { id: "fin_collab_auditor", label: "외부 감사인" },
  ],
  followUpExtensions: [
    { id: "fin_result_decision_support", label: "재무 의사결정 지원" },
    { id: "fin_result_cashflow_stable", label: "현금흐름 안정화" },
    { id: "fin_result_risk_reduced", label: "재무 리스크 감소" },
    { id: "fin_result_investment_basis", label: "투자 판단 근거 제공" },
    { id: "fin_result_capital_efficiency", label: "자금 운용 효율 개선" },
    { id: "fin_result_biz_analysis", label: "사업성 검토 고도화" },
    { id: "fin_result_report_quality", label: "경영 보고 완성도 개선" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 현금흐름을 점검하고 사업부 재무 이슈를 검토해 경영진에게 재무 현황을 보고했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "재무 지표와 현금흐름을 점검하고 사업부 재무 이슈를 검토해 경영진·회계팀과 재무 리스크 대응 방향을 공유했어요.",
      roleTags: ["재무 지표 점검", "현금흐름 확인", "재무 보고 자료 작성"],
      collaborationTags: ["경영진", "회계팀", "사업부"],
      resultTags: ["재무 의사결정 지원", "재무 리스크 감소"],
    },
  },
};
