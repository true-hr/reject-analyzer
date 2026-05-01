export const STRATEGIC_SOURCING_RECORD_PRESET = {
  jobId: "JOB_PROCUREMENT_SCM_STRATEGIC_SOURCING",
  label: "전략구매",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "공급시장 조사",
      "소싱 후보 발굴",
      "단가 구조 분석",
      "공급사 비교",
      "계약 조건 검토",
      "원가 절감 기회 확인",
      "구매 전략 자료 정리",
    ],
    project: [
      "카테고리 소싱 전략 수립",
      "신규 공급사 발굴",
      "원가 절감 프로젝트 추진",
      "공급사 선정 기준 정리",
      "장기 계약 전략 검토",
      "공급망 리스크 분석",
      "글로벌 소싱 검토",
    ],
  },
  collaborationExtensions: [
    { id: "srcing_collab_supplier", label: "협력사" },
    { id: "srcing_collab_biz", label: "현업 부서" },
    { id: "srcing_collab_finance", label: "재무팀" },
    { id: "srcing_collab_legal", label: "법무팀" },
    { id: "srcing_collab_quality", label: "품질팀" },
    { id: "srcing_collab_production", label: "생산팀" },
    { id: "srcing_collab_executive", label: "경영진" },
  ],
  followUpExtensions: [
    { id: "srcing_result_competitiveness", label: "소싱 경쟁력 강화" },
    { id: "srcing_result_cost", label: "원가 절감 기회 확보" },
    { id: "srcing_result_portfolio", label: "공급사 포트폴리오 개선" },
    { id: "srcing_result_terms", label: "계약 조건 최적화" },
    { id: "srcing_result_risk_reduced", label: "공급망 리스크 감소" },
    { id: "srcing_result_strategy", label: "구매 전략 명확화" },
    { id: "srcing_result_stability", label: "장기 공급 안정성 개선" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 공급시장을 조사하고 소싱 후보를 발굴했으며 단가 구조를 분석했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "공급시장을 조사하고 소싱 후보를 발굴했으며, 재무팀·법무팀과 계약 조건을 검토해 원가 절감 기회를 확인했어요.",
      roleTags: ["공급시장 조사", "소싱 후보 발굴", "원가 절감 기회 확인"],
      collaborationTags: ["협력사", "재무팀", "법무팀"],
      resultTags: ["소싱 경쟁력 강화", "원가 절감 기회 확보"],
    },
  },
};
