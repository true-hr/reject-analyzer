export const TAX_RECORD_PRESET = {
  jobId: "JOB_FINANCE_ACCOUNTING_TAX",
  label: "세무",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "세금계산서 검토",
      "부가세 자료 정리",
      "원천세 확인",
      "세무 신고 자료 준비",
      "증빙 누락 확인",
      "세무 이슈 검토",
      "세무대리인 커뮤니케이션",
    ],
    project: [
      "세무 신고 프로세스 정리",
      "절세 가능성 검토",
      "세무 리스크 점검",
      "세무조정 자료 준비",
      "신고 일정 관리",
      "과세 이슈 대응",
      "세무 검토 기준 정리",
    ],
  },
  collaborationExtensions: [
    { id: "tax_collab_agent", label: "세무대리인" },
    { id: "tax_collab_accounting", label: "회계팀" },
    { id: "tax_collab_finance", label: "재무팀" },
    { id: "tax_collab_ops", label: "현업 부서" },
    { id: "tax_collab_vendor", label: "거래처" },
    { id: "tax_collab_executive", label: "경영진" },
    { id: "tax_collab_auditor", label: "외부 감사인" },
  ],
  followUpExtensions: [
    { id: "tax_result_filing_prevented", label: "신고 누락 방지" },
    { id: "tax_result_risk_reduced", label: "세무 리스크 감소" },
    { id: "tax_result_evidence_accuracy", label: "증빙 정확도 개선" },
    { id: "tax_result_schedule_stable", label: "납부 일정 안정화" },
    { id: "tax_result_issue_precheck", label: "과세 이슈 사전 확인" },
    { id: "tax_result_doc_quality", label: "세무 자료 완성도 개선" },
    { id: "tax_result_communication", label: "세무 커뮤니케이션 정리" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 부가세 신고 자료를 정리하고 증빙 누락 여부를 점검했으며, 세무대리인과 이슈 사항을 공유했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "세무대리인과 부가세 자료를 최종 검토하고 증빙 누락 건을 정리해 신고 일정에 맞게 처리 완료했어요.",
      roleTags: ["부가세 자료 정리", "증빙 누락 확인", "세무대리인 커뮤니케이션"],
      collaborationTags: ["세무대리인", "회계팀"],
      resultTags: ["신고 누락 방지", "납부 일정 안정화"],
    },
  },
};
