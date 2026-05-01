export const LABOR_RELATIONS_RECORD_PRESET = {
  jobId: "JOB_HR_ORGANIZATION_LABOR_RELATIONS",
  label: "노무",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "근로계약 이슈 확인",
      "노무 리스크 검토",
      "근태 이슈 점검",
      "임직원 상담 대응",
      "노무 규정 확인",
      "분쟁 가능성 점검",
      "노무사 커뮤니케이션",
    ],
    project: [
      "노무 리스크 진단",
      "취업규칙 개정",
      "근로계약 체계 정비",
      "노사 이슈 대응",
      "징계/분쟁 프로세스 정리",
      "근태 관리 기준 개선",
      "노동관계 법령 대응",
    ],
  },
  collaborationExtensions: [
    { id: "lr_collab_employee", label: "임직원" },
    { id: "lr_collab_leader", label: "현업 리더" },
    { id: "lr_collab_hr", label: "인사팀" },
    { id: "lr_collab_labor", label: "노무사" },
    { id: "lr_collab_legal", label: "법무팀" },
    { id: "lr_collab_executive", label: "경영진" },
    { id: "lr_collab_external", label: "외부 기관" },
  ],
  followUpExtensions: [
    { id: "lr_result_risk_reduced", label: "노무 리스크 감소" },
    { id: "lr_result_dispute_prevented", label: "분쟁 가능성 사전 차단" },
    { id: "lr_result_compliance", label: "규정 준수 강화" },
    { id: "lr_result_attendance_clear", label: "근태 운영 기준 명확화" },
    { id: "lr_result_counseling_quality", label: "임직원 상담 품질 개선" },
    { id: "lr_result_legal_risk", label: "법적 리스크 점검" },
    { id: "lr_result_trust", label: "조직 신뢰도 개선" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 근로계약 이슈를 확인하고 노무 리스크를 검토해 노무사와 대응 방향을 협의했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "근로계약 이슈와 노무 리스크를 검토하고 임직원 상담에 대응했으며, 노무사·법무팀과 분쟁 가능성을 점검했어요.",
      roleTags: ["근로계약 이슈 확인", "노무 리스크 검토", "임직원 상담 대응"],
      collaborationTags: ["임직원", "노무사", "법무팀"],
      resultTags: ["노무 리스크 감소", "분쟁 가능성 사전 차단"],
    },
  },
};
