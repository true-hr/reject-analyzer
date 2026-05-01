export const LEARNING_DESIGN_RECORD_PRESET = {
  jobId: "JOB_EDUCATION_COUNSELING_COACHING_LEARNING_DESIGN",
  label: "학습설계",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "학습 목표 정리",
      "커리큘럼 구조 검토",
      "학습자 수준 분석",
      "교육 콘텐츠 흐름 설계",
      "평가 문항 검토",
      "학습 자료 개선",
      "학습 데이터 확인",
    ],
    project: [
      "교육과정 설계",
      "커리큘럼 체계 구축",
      "학습자 경험 설계",
      "평가 체계 설계",
      "온라인 학습 콘텐츠 기획",
      "학습 효과 분석",
      "학습 로드맵 개발",
    ],
  },
  collaborationExtensions: [
    { id: "ldesign_collab_planner", label: "교육기획자" },
    { id: "ldesign_collab_instructor", label: "강사" },
    { id: "ldesign_collab_content", label: "콘텐츠팀" },
    { id: "ldesign_collab_student", label: "수강생" },
    { id: "ldesign_collab_client", label: "고객사" },
    { id: "ldesign_collab_ops", label: "운영팀" },
    { id: "ldesign_collab_eval", label: "평가 담당자" },
  ],
  followUpExtensions: [
    { id: "ldesign_result_goal", label: "학습 목표 명확화" },
    { id: "ldesign_result_curriculum", label: "커리큘럼 완성도 개선" },
    { id: "ldesign_result_engagement", label: "학습 몰입도 향상" },
    { id: "ldesign_result_measure", label: "교육 효과 측정 가능성 개선" },
    { id: "ldesign_result_flow", label: "콘텐츠 흐름 개선" },
    { id: "ldesign_result_fit", label: "학습자 수준 적합도 향상" },
    { id: "ldesign_result_quality", label: "교육 품질 안정화" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 학습 목표를 정리하고 커리큘럼 구조를 검토했으며 교육 콘텐츠 흐름을 설계했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "학습 목표를 정리하고 커리큘럼 구조를 검토했으며, 교육기획자·강사와 학습자 수준을 분석해 교육 콘텐츠 흐름을 설계했어요.",
      roleTags: ["학습 목표 정리", "커리큘럼 구조 검토", "교육 콘텐츠 흐름 설계"],
      collaborationTags: ["교육기획자", "강사", "콘텐츠팀"],
      resultTags: ["학습 목표 명확화", "커리큘럼 완성도 개선"],
    },
  },
};
