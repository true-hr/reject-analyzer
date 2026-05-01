export const CORPORATE_TRAINING_RECORD_PRESET = {
  jobId: "JOB_EDUCATION_COUNSELING_COACHING_CORPORATE_TRAINING",
  label: "기업교육",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "교육 니즈 파악",
      "기업 고객 미팅",
      "교육 제안서 작성",
      "교육 과정 운영",
      "교육 효과 분석",
      "교육 자료 검토",
      "고객 피드백 정리",
    ],
    project: [
      "기업교육 과정 설계",
      "고객사 맞춤 교육 제안",
      "역량 기반 교육 체계 구축",
      "교육 효과성 평가",
      "교육 운영 결과 리포트 작성",
      "고객사 교육 로드맵 제안",
      "조직 역량 개발 프로그램 운영",
    ],
  },
  collaborationExtensions: [
    { id: "corptrain_collab_client", label: "고객사" },
    { id: "corptrain_collab_hr", label: "HR 담당자" },
    { id: "corptrain_collab_leader", label: "현업 리더" },
    { id: "corptrain_collab_instructor", label: "강사" },
    { id: "corptrain_collab_planner", label: "교육기획자" },
    { id: "corptrain_collab_ops", label: "운영팀" },
    { id: "corptrain_collab_partner", label: "외부 파트너" },
  ],
  followUpExtensions: [
    { id: "corptrain_result_satisfaction", label: "고객사 교육 만족도 향상" },
    { id: "corptrain_result_needs", label: "교육 니즈 구체화" },
    { id: "corptrain_result_measure", label: "교육 효과 측정 기준 마련" },
    { id: "corptrain_result_capability", label: "조직 역량 개발 지원" },
    { id: "corptrain_result_renewal", label: "고객사 재계약 가능성 상승" },
    { id: "corptrain_result_proposal", label: "교육 제안 완성도 개선" },
    { id: "corptrain_result_diff", label: "교육 프로그램 차별화" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 교육 니즈를 파악하고 기업 고객 미팅을 진행했으며 교육 제안서를 작성했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "교육 니즈를 파악하고 기업 고객 미팅을 진행했으며, HR 담당자·현업 리더와 교육 제안서를 작성하고 교육 효과를 분석했어요.",
      roleTags: ["교육 니즈 파악", "기업 고객 미팅", "교육 제안서 작성"],
      collaborationTags: ["고객사", "HR 담당자", "현업 리더"],
      resultTags: ["고객사 교육 만족도 향상", "교육 니즈 구체화"],
    },
  },
};
