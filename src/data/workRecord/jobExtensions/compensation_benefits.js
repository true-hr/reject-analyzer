export const COMPENSATION_BENEFITS_RECORD_PRESET = {
  jobId: "JOB_HR_ORGANIZATION_COMPENSATION_BENEFITS",
  label: "보상/복리후생",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "보상 데이터 점검",
      "급여/수당 기준 확인",
      "복리후생 운영 점검",
      "보상 이슈 검토",
      "시장 보상 자료 확인",
      "인센티브 기준 정리",
      "임직원 문의 대응",
    ],
    project: [
      "보상 제도 개선",
      "급여 체계 정비",
      "인센티브 제도 설계",
      "복리후생 제도 개편",
      "보상 벤치마킹 분석",
      "직급/직무별 보상 기준 정리",
      "보상 커뮤니케이션 자료 작성",
    ],
  },
  collaborationExtensions: [
    { id: "cb_collab_hr", label: "인사팀" },
    { id: "cb_collab_finance", label: "재무팀" },
    { id: "cb_collab_executive", label: "경영진" },
    { id: "cb_collab_employee", label: "임직원" },
    { id: "cb_collab_labor", label: "노무사" },
    { id: "cb_collab_consultant", label: "외부 컨설턴트" },
    { id: "cb_collab_leader", label: "현업 리더" },
  ],
  followUpExtensions: [
    { id: "cb_result_standard_clear", label: "보상 기준 명확화" },
    { id: "cb_result_satisfaction", label: "임직원 만족도 개선" },
    { id: "cb_result_risk_reduced", label: "보상 리스크 감소" },
    { id: "cb_result_payroll_stable", label: "급여 운영 안정화" },
    { id: "cb_result_acceptance", label: "제도 수용도 개선" },
    { id: "cb_result_cost_visibility", label: "비용 구조 가시화" },
    { id: "cb_result_comm_improved", label: "보상 커뮤니케이션 개선" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 보상 데이터를 점검하고 인센티브 기준을 정리해 임직원 문의에 대응했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "보상 데이터를 점검하고 급여/수당 기준을 확인했으며, 재무팀·경영진과 인센티브 기준을 정리해 임직원 문의에 대응했어요.",
      roleTags: ["보상 데이터 점검", "인센티브 기준 정리", "임직원 문의 대응"],
      collaborationTags: ["인사팀", "재무팀", "경영진"],
      resultTags: ["보상 기준 명확화", "급여 운영 안정화"],
    },
  },
};
