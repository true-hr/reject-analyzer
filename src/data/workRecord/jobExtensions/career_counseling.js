export const CAREER_COUNSELING_RECORD_PRESET = {
  jobId: "JOB_EDUCATION_COUNSELING_COACHING_CAREER_COUNSELING",
  label: "진로상담",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "진로 상담 진행",
      "흥미/적성 정보 정리",
      "진로 고민 파악",
      "상담 기록 작성",
      "진로 선택지 안내",
      "보호자/관계자 소통",
      "후속 상담 계획 정리",
    ],
    project: [
      "진로상담 프로그램 운영",
      "진로 탐색 워크숍 기획",
      "상담 사례 관리 체계 구축",
      "진로 검사 결과 해석",
      "진로 의사결정 지원",
      "상담 매뉴얼 정리",
      "진로 상담 성과 분석",
    ],
  },
  collaborationExtensions: [
    { id: "counsel_collab_client", label: "상담 대상자" },
    { id: "counsel_collab_guardian", label: "보호자" },
    { id: "counsel_collab_teacher", label: "교사/멘토" },
    { id: "counsel_collab_agency", label: "상담기관" },
    { id: "counsel_collab_ops", label: "교육 운영팀" },
    { id: "counsel_collab_expert", label: "외부 전문가" },
    { id: "counsel_collab_coach", label: "커리어코치" },
  ],
  followUpExtensions: [
    { id: "counsel_result_options", label: "진로 선택지 명확화" },
    { id: "counsel_result_self", label: "상담 대상자 자기이해 향상" },
    { id: "counsel_result_anxiety", label: "진로 불안 완화" },
    { id: "counsel_result_criteria", label: "의사결정 기준 정리" },
    { id: "counsel_result_record", label: "상담 기록 체계화" },
    { id: "counsel_result_followup", label: "후속 상담 방향 확정" },
    { id: "counsel_result_exploration", label: "진로 탐색 참여도 개선" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 진로 상담을 진행하고 흥미/적성 정보를 정리했으며 진로 선택지를 안내했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "진로 상담을 진행하고 흥미/적성 정보를 정리했으며, 상담 대상자·보호자와 진로 고민을 파악해 선택지를 안내하고 상담 기록을 작성했어요.",
      roleTags: ["진로 상담 진행", "흥미/적성 정보 정리", "상담 기록 작성"],
      collaborationTags: ["상담 대상자", "보호자", "교사/멘토"],
      resultTags: ["진로 선택지 명확화", "상담 대상자 자기이해 향상"],
    },
  },
};
