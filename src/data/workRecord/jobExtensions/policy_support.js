export const POLICY_SUPPORT_RECORD_PRESET = {
  jobId: "JOB_PUBLIC_ADMINISTRATION_SUPPORT_POLICY_SUPPORT",
  label: "정책지원",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "정책 자료 조사",
      "회의 자료 준비",
      "제도 변화 확인",
      "정책 과제 정리",
      "보고서 초안 작성",
      "관계자 의견 취합",
      "정책 일정 관리",
    ],
    project: [
      "정책 지원 자료 작성",
      "제도 개선 과제 지원",
      "정책 사업 운영 지원",
      "정책 회의 운영",
      "이해관계자 의견 정리",
      "정책 보고서 작성",
      "정책 실행 현황 관리",
    ],
  },
  collaborationExtensions: [
    { id: "polsup_collab_policy", label: "정책 담당자" },
    { id: "polsup_collab_public", label: "공공기관" },
    { id: "polsup_collab_institute", label: "연구기관" },
    { id: "polsup_collab_expert", label: "외부 전문가" },
    { id: "polsup_collab_dept", label: "현업 부서" },
    { id: "polsup_collab_stakeholder", label: "시민/이해관계자" },
    { id: "polsup_collab_manager", label: "관리자" },
  ],
  followUpExtensions: [
    { id: "polsup_result_doc", label: "정책 자료 완성도 개선" },
    { id: "polsup_result_direction", label: "제도 개선 근거 정리" },
    { id: "polsup_result_stakeholder", label: "이해관계자 의견 구조화" },
    { id: "polsup_result_mgmt", label: "정책 실행 관리력 향상" },
    { id: "polsup_result_quality", label: "보고서 품질 개선" },
    { id: "polsup_result_schedule", label: "정책 일정 안정화" },
    { id: "polsup_result_decision", label: "의사결정 지원 강화" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 정책 자료를 조사하고 회의 자료를 준비했으며 제도 변화를 확인했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "정책 자료를 조사하고 회의 자료를 준비했으며, 정책 담당자·연구기관과 제도 변화를 확인하고 정책 과제를 정리했어요.",
      roleTags: ["정책 자료 조사", "회의 자료 준비", "정책 과제 정리"],
      collaborationTags: ["정책 담당자", "공공기관", "연구기관"],
      resultTags: ["정책 자료 완성도 개선", "이해관계자 의견 구조화"],
    },
  },
};
