export const IR_DISCLOSURE_RECORD_PRESET = {
  jobId: "JOB_FINANCE_ACCOUNTING_IR_DISCLOSURE",
  label: "IR/공시",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "공시 일정 확인",
      "투자자 문의 대응",
      "IR 자료 업데이트",
      "재무/사업 지표 정리",
      "이사회 자료 확인",
      "공시 문안 검토",
      "시장 반응 모니터링",
    ],
    project: [
      "IR 스토리라인 정리",
      "투자자 대상 자료 제작",
      "정기 공시 준비",
      "실적 발표 자료 작성",
      "주주 커뮤니케이션 개선",
      "공시 리스크 점검",
      "기업가치 설명 자료 정리",
    ],
  },
  collaborationExtensions: [
    { id: "ir_collab_executive", label: "경영진" },
    { id: "ir_collab_finance", label: "재무팀" },
    { id: "ir_collab_accounting", label: "회계팀" },
    { id: "ir_collab_legal", label: "법무팀" },
    { id: "ir_collab_investor", label: "투자자" },
    { id: "ir_collab_securities", label: "증권사" },
    { id: "ir_collab_auditor", label: "외부 감사인" },
  ],
  followUpExtensions: [
    { id: "ir_result_investor_comm", label: "투자자 커뮤니케이션 개선" },
    { id: "ir_result_disclosure_accuracy", label: "공시 정확도 향상" },
    { id: "ir_result_market_trust", label: "시장 신뢰도 개선" },
    { id: "ir_result_performance_story", label: "실적 설명력 강화" },
    { id: "ir_result_risk_reduced", label: "공시 리스크 감소" },
    { id: "ir_result_message_clear", label: "기업가치 메시지 명확화" },
    { id: "ir_result_stakeholder", label: "이해관계자 대응력 향상" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 공시 일정을 확인하고 IR 자료를 업데이트해 투자자 문의에 대응했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "공시 일정을 확인하고 IR 자료를 업데이트해 투자자 문의에 대응했으며, 경영진·법무팀과 공시 문안을 검토했어요.",
      roleTags: ["공시 일정 확인", "IR 자료 업데이트", "투자자 문의 대응"],
      collaborationTags: ["경영진", "재무팀", "법무팀"],
      resultTags: ["투자자 커뮤니케이션 개선", "공시 정확도 향상"],
    },
  },
};
