export const OVERSEAS_SALES_RECORD_PRESET = {
  jobId: "JOB_SALES_OVERSEAS_SALES",
  label: "해외영업",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "해외 고객 커뮤니케이션",
      "수출 조건 확인",
      "견적/오퍼 관리",
      "해외 시장 동향 확인",
      "바이어 문의 대응",
      "선적 일정 확인",
      "국가별 이슈 점검",
    ],
    project: [
      "해외 시장 진입 전략 수립",
      "해외 바이어 발굴",
      "수출 계약 조건 협의",
      "국가별 영업 자료 현지화",
      "물류/통관 리스크 점검",
      "해외 파트너 관리",
      "글로벌 매출 기회 분석",
    ],
  },
  collaborationExtensions: [
    { id: "overseas_collab_customer", label: "해외 고객사" },
    { id: "overseas_collab_buyer", label: "바이어" },
    { id: "overseas_collab_logistics", label: "물류팀" },
    { id: "overseas_collab_production", label: "생산팀" },
    { id: "overseas_collab_finance", label: "재무팀" },
    { id: "overseas_collab_legal", label: "법무팀" },
    { id: "overseas_collab_partner", label: "해외 파트너" },
  ],
  followUpExtensions: [
    { id: "overseas_result_opportunity", label: "해외 매출 기회 확보" },
    { id: "overseas_result_buyer_rel", label: "바이어 관계 강화" },
    { id: "overseas_result_risk_reduced", label: "수출 리스크 감소" },
    { id: "overseas_result_quote_accuracy", label: "견적 정확도 개선" },
    { id: "overseas_result_shipment_stable", label: "선적 일정 안정화" },
    { id: "overseas_result_market_insight", label: "현지 시장 이해도 향상" },
    { id: "overseas_result_partnership", label: "글로벌 파트너십 확대" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 해외 바이어 문의에 대응하고 견적을 관리했으며 선적 일정을 확인했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "해외 고객 커뮤니케이션과 바이어 문의에 대응하고 수출 조건 및 선적 일정을 확인해 물류팀·재무팀과 이슈를 공유했어요.",
      roleTags: ["해외 고객 커뮤니케이션", "견적/오퍼 관리", "선적 일정 확인"],
      collaborationTags: ["해외 고객사", "바이어", "물류팀"],
      resultTags: ["해외 매출 기회 확보", "바이어 관계 강화"],
    },
  },
};
