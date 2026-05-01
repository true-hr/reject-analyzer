export const ACCOUNTING_TAX_RECORD_PRESET = {
  jobId: "JOB_FINANCE_ACCOUNTING_ACCOUNTING",
  label: "회계/세무",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "전표 처리",
      "결산 작업",
      "세무 신고",
      "예산 관리",
      "감사 대응",
      "회계 검토",
      "재무 현황 정리",
    ],
    project: [
      "월말 결산",
      "연간 결산",
      "세무 계획 수립",
      "감사 준비",
      "예산 편성",
      "원가 분석",
      "재무제표 작성",
    ],
  },
  collaborationExtensions: [
    { id: "acc_collab_executive", label: "경영진" },
    { id: "acc_collab_auditor", label: "외부 감사인" },
    { id: "acc_collab_tax_agent", label: "세무사" },
    { id: "acc_collab_ops", label: "현업 부서" },
    { id: "acc_collab_bank", label: "금융기관" },
    { id: "acc_collab_legal", label: "법무팀" },
  ],
  followUpExtensions: [
    { id: "acc_result_closing_done", label: "결산 완료" },
    { id: "acc_result_tax_filed", label: "세무 신고 완료" },
    { id: "acc_result_error_corrected", label: "오류 수정" },
    { id: "acc_result_audit_passed", label: "감사 대응 완료" },
    { id: "acc_result_report_prepared", label: "재무 보고서 작성" },
    { id: "acc_result_budget_tracked", label: "예산 집행 현황 정리" },
    { id: "acc_result_compliance_checked", label: "법령 검토 완료" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 월말 전표 처리와 부서별 예산 집행 현황을 정리하고, 세무 신고 자료를 준비했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "월말 결산을 위한 전표를 처리하고 부서별 예산 집행 현황을 정리했으며, 세무사와 세금 신고 자료를 최종 검토했어요.",
      roleTags: ["전표 처리", "예산 관리", "세무 신고"],
      collaborationTags: ["세무사", "현업 부서"],
      resultTags: ["결산 완료", "재무 보고서 작성"],
    },
  },
};
