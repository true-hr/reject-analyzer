export const POLICY_RESEARCH_RECORD_PRESET = {
  jobId: "JOB_RESEARCH_PROFESSIONAL_POLICY_RESEARCH",
  label: "정책연구",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "정책 자료 조사",
      "법/제도 변화 확인",
      "국내외 사례 분석",
      "정책 이슈 정리",
      "연구 자료 검토",
      "보고서 초안 작성",
      "이해관계자 의견 정리",
    ],
    project: [
      "정책 연구 과제 수행",
      "제도 개선안 작성",
      "정책 효과 분석",
      "국내외 정책 비교 연구",
      "이해관계자 분석",
      "정책 보고서 작성",
      "정책 제안서 개발",
    ],
  },
  collaborationExtensions: [
    { id: "polres_collab_institute", label: "연구기관" },
    { id: "polres_collab_public", label: "공공기관" },
    { id: "polres_collab_policy", label: "정책 담당자" },
    { id: "polres_collab_expert", label: "외부 전문가" },
    { id: "polres_collab_legal", label: "법무팀" },
    { id: "polres_collab_data", label: "데이터팀" },
    { id: "polres_collab_stakeholder", label: "이해관계자" },
  ],
  followUpExtensions: [
    { id: "polres_result_structure", label: "정책 이슈 구조화" },
    { id: "polres_result_direction", label: "제도 개선 방향 도출" },
    { id: "polres_result_evidence", label: "정책 근거 자료 확보" },
    { id: "polres_result_stakeholder", label: "이해관계자 관점 정리" },
    { id: "polres_result_reliability", label: "보고서 신뢰도 개선" },
    { id: "polres_result_proposal", label: "정책 제안 완성도 향상" },
    { id: "polres_result_decision", label: "의사결정 근거 강화" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 정책 자료를 조사하고 법·제도 변화를 확인했으며 국내외 사례를 분석했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "정책 자료를 조사하고 법·제도 변화를 확인했으며, 연구기관·공공기관과 국내외 사례를 분석하고 정책 이슈를 정리했어요.",
      roleTags: ["정책 자료 조사", "법/제도 변화 확인", "국내외 사례 분석"],
      collaborationTags: ["연구기관", "공공기관", "정책 담당자"],
      resultTags: ["정책 이슈 구조화", "제도 개선 방향 도출"],
    },
  },
};
