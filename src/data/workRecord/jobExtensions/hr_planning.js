export const HR_PLANNING_RECORD_PRESET = {
  jobId: "JOB_HR_ORGANIZATION_HR_PLANNING",
  label: "인사기획",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "인사제도 검토",
      "조직 데이터 정리",
      "평가 기준 점검",
      "보상 기준 검토",
      "인력 계획 정리",
      "HR 규정 확인",
      "내부 커뮤니케이션 준비",
    ],
    project: [
      "인사제도 설계",
      "평가/보상 체계 개선",
      "조직 운영 기준 정리",
      "인력 계획 수립",
      "HR 데이터 분석",
      "사내 규정 개정",
      "조직문화 개선안 작성",
    ],
  },
  collaborationExtensions: [
    { id: "hrp_collab_executive", label: "경영진" },
    { id: "hrp_collab_team_leader", label: "현업 리더" },
    { id: "hrp_collab_hr", label: "인사팀" },
    { id: "hrp_collab_finance", label: "재무팀" },
    { id: "hrp_collab_labor", label: "노무사" },
    { id: "hrp_collab_employee", label: "임직원" },
    { id: "hrp_collab_consultant", label: "외부 컨설턴트" },
  ],
  followUpExtensions: [
    { id: "hrp_result_standard_clarified", label: "인사 기준 명확화" },
    { id: "hrp_result_ops_stable", label: "조직 운영 안정화" },
    { id: "hrp_result_fairness_improved", label: "평가 공정성 개선" },
    { id: "hrp_result_comp_defined", label: "보상 기준 정리" },
    { id: "hrp_result_headcount_plan", label: "인력 계획 구체화" },
    { id: "hrp_result_comm_improved", label: "내부 커뮤니케이션 개선" },
    { id: "hrp_result_risk_reduced", label: "HR 리스크 감소" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 평가 기준을 점검하고 내년 인력 계획 초안을 정리했으며, HR 규정 개정 필요 사항을 확인했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "경영진·현업 리더와 평가 기준을 조율하고 인력 계획을 구체화했으며, 재무팀과 보상 예산 기준을 정리했어요.",
      roleTags: ["평가 기준 점검", "인력 계획 정리", "보상 기준 검토"],
      collaborationTags: ["경영진", "현업 리더", "재무팀"],
      resultTags: ["인사 기준 명확화", "인력 계획 구체화"],
    },
  },
};
