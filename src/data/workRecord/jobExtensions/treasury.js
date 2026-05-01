export const TREASURY_RECORD_PRESET = {
  jobId: "JOB_FINANCE_ACCOUNTING_TREASURY",
  label: "자금",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "자금 입출금 확인",
      "일일 자금 현황 점검",
      "지급 일정 관리",
      "금융기관 커뮤니케이션",
      "자금 계획 업데이트",
      "외화/환율 이슈 확인",
      "유동성 리스크 점검",
    ],
    project: [
      "자금 계획 수립",
      "유동성 관리 체계 개선",
      "금융기관 조건 협의",
      "차입/상환 일정 관리",
      "자금 운용 프로세스 정리",
      "환리스크 관리안 검토",
      "지급 승인 체계 개선",
    ],
  },
  collaborationExtensions: [
    { id: "trs_collab_finance", label: "재무팀" },
    { id: "trs_collab_accounting", label: "회계팀" },
    { id: "trs_collab_executive", label: "경영진" },
    { id: "trs_collab_bank", label: "금융기관" },
    { id: "trs_collab_biz", label: "현업 부서" },
    { id: "trs_collab_vendor", label: "거래처" },
    { id: "trs_collab_auditor", label: "외부 감사인" },
  ],
  followUpExtensions: [
    { id: "trs_result_liquidity_stable", label: "유동성 안정화" },
    { id: "trs_result_payment_risk", label: "지급 리스크 감소" },
    { id: "trs_result_plan_accuracy", label: "자금 계획 정확도 개선" },
    { id: "trs_result_finance_cost", label: "금융 비용 절감" },
    { id: "trs_result_cashflow_visibility", label: "현금흐름 가시성 개선" },
    { id: "trs_result_ops_standard", label: "자금 운용 기준 정리" },
    { id: "trs_result_fx_precheck", label: "환리스크 사전 점검" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 일일 자금 현황을 점검하고 지급 일정을 관리했으며 환율 이슈를 재무팀에 공유했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "일일 자금 현황을 점검하고 지급 일정을 관리했으며, 금융기관과 커뮤니케이션해 유동성 리스크를 경영진에게 보고했어요.",
      roleTags: ["일일 자금 현황 점검", "지급 일정 관리", "유동성 리스크 점검"],
      collaborationTags: ["재무팀", "경영진", "금융기관"],
      resultTags: ["유동성 안정화", "지급 리스크 감소"],
    },
  },
};
