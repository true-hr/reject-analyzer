export const LEGAL_RECORD_PRESET = {
  jobId: "JOB_RESEARCH_PROFESSIONAL_LEGAL",
  label: "법무",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "계약서 검토",
      "법률 리스크 확인",
      "내부 문의 대응",
      "분쟁 이슈 정리",
      "약관/정책 검토",
      "법무 의견 작성",
      "외부 로펌 커뮤니케이션",
    ],
    project: [
      "계약 검토 체계 개선",
      "법률 리스크 관리",
      "분쟁 대응 전략 수립",
      "내부 법무 프로세스 정리",
      "표준계약서 개선",
      "컴플라이언스 기준 검토",
      "법무 교육/가이드 작성",
    ],
  },
  collaborationExtensions: [
    { id: "legal_collab_business", label: "현업 부서" },
    { id: "legal_collab_executive", label: "경영진" },
    { id: "legal_collab_lawfirm", label: "외부 로펌" },
    { id: "legal_collab_partner", label: "거래처" },
    { id: "legal_collab_finance", label: "재무팀" },
    { id: "legal_collab_hr", label: "인사팀" },
    { id: "legal_collab_privacy", label: "개인정보 담당자" },
  ],
  followUpExtensions: [
    { id: "legal_result_risk", label: "법률 리스크 감소" },
    { id: "legal_result_speed", label: "계약 검토 속도 개선" },
    { id: "legal_result_dispute", label: "분쟁 가능성 사전 차단" },
    { id: "legal_result_standard", label: "표준계약 기준 명확화" },
    { id: "legal_result_decision", label: "내부 의사결정 지원" },
    { id: "legal_result_compliance", label: "컴플라이언스 대응력 향상" },
    { id: "legal_result_awareness", label: "현업 법무 이해도 개선" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 계약서를 검토하고 법률 리스크를 확인했으며 내부 문의에 대응했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "계약서를 검토하고 법률 리스크를 확인했으며, 현업 부서·외부 로펌과 분쟁 이슈를 정리하고 법무 의견을 작성했어요.",
      roleTags: ["계약서 검토", "법률 리스크 확인", "법무 의견 작성"],
      collaborationTags: ["현업 부서", "경영진", "외부 로펌"],
      resultTags: ["법률 리스크 감소", "분쟁 가능성 사전 차단"],
    },
  },
};
