export const INTERNAL_CONTROL_RECORD_PRESET = {
  jobId: "JOB_FINANCE_ACCOUNTING_INTERNAL_CONTROL",
  label: "내부통제",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "통제 항목 점검",
      "결재 권한 확인",
      "프로세스 위반 여부 검토",
      "내부 감사 자료 정리",
      "리스크 항목 업데이트",
      "증빙 자료 확인",
      "개선 조치 현황 점검",
    ],
    project: [
      "내부통제 체계 개선",
      "업무 프로세스 리스크 진단",
      "통제 기준 문서화",
      "내부 감사 대응",
      "권한 관리 체계 정리",
      "컴플라이언스 점검",
      "개선 조치 프로세스 구축",
    ],
  },
  collaborationExtensions: [
    { id: "ic_collab_accounting", label: "회계팀" },
    { id: "ic_collab_finance", label: "재무팀" },
    { id: "ic_collab_legal", label: "법무팀" },
    { id: "ic_collab_biz", label: "현업 부서" },
    { id: "ic_collab_internal_audit", label: "내부 감사팀" },
    { id: "ic_collab_executive", label: "경영진" },
    { id: "ic_collab_auditor", label: "외부 감사인" },
  ],
  followUpExtensions: [
    { id: "ic_result_control_risk", label: "통제 리스크 감소" },
    { id: "ic_result_audit_ready", label: "감사 대응력 개선" },
    { id: "ic_result_transparency", label: "업무 프로세스 투명성 향상" },
    { id: "ic_result_access_clear", label: "권한 관리 명확화" },
    { id: "ic_result_evidence_gap", label: "증빙 누락 감소" },
    { id: "ic_result_compliance_clear", label: "컴플라이언스 기준 정리" },
    { id: "ic_result_ops_stable", label: "내부통제 운영 안정화" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 통제 항목을 점검하고 결재 권한을 확인해 내부 감사 자료를 정리했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "통제 항목 점검과 증빙 자료를 확인하고 프로세스 위반 여부를 검토해 내부 감사팀·외부 감사인과 개선 조치 현황을 공유했어요.",
      roleTags: ["통제 항목 점검", "증빙 자료 확인", "내부 감사 자료 정리"],
      collaborationTags: ["회계팀", "내부 감사팀", "외부 감사인"],
      resultTags: ["통제 리스크 감소", "감사 대응력 개선"],
    },
  },
};
