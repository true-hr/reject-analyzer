export const JOB_TRAINING_RECORD_PRESET = {
  jobId: "JOB_EDUCATION_COUNSELING_COACHING_JOB_TRAINING",
  label: "직무교육",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "직무 교육 자료 준비",
      "교육 대상자 수준 확인",
      "실습 과제 운영",
      "교육 피드백 정리",
      "강의안 수정",
      "직무 역량 기준 점검",
      "교육 성과 확인",
    ],
    project: [
      "직무교육 과정 개발",
      "실무형 교육 콘텐츠 설계",
      "직무 역량 모델 반영",
      "실습/과제 기반 교육 운영",
      "교육 평가 기준 수립",
      "현업 맞춤 교육 개선",
      "직무교육 결과 리포트 작성",
    ],
  },
  collaborationExtensions: [
    { id: "jobtrain_collab_student", label: "수강생" },
    { id: "jobtrain_collab_expert", label: "현업 전문가" },
    { id: "jobtrain_collab_instructor", label: "강사" },
    { id: "jobtrain_collab_planner", label: "교육기획자" },
    { id: "jobtrain_collab_hr", label: "HR 담당자" },
    { id: "jobtrain_collab_client", label: "고객사" },
    { id: "jobtrain_collab_ops", label: "운영팀" },
  ],
  followUpExtensions: [
    { id: "jobtrain_result_capability", label: "직무 역량 향상" },
    { id: "jobtrain_result_application", label: "실무 적용도 개선" },
    { id: "jobtrain_result_satisfaction", label: "교육 만족도 향상" },
    { id: "jobtrain_result_reflect", label: "현업 요구 반영도 개선" },
    { id: "jobtrain_result_outcome", label: "교육 성과 가시화" },
    { id: "jobtrain_result_practice", label: "실습 품질 개선" },
    { id: "jobtrain_result_retention", label: "직무교육 재수강 가능성 상승" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 직무 교육 자료를 준비하고 실습 과제를 운영했으며 교육 피드백을 정리했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "직무 교육 자료를 준비하고 실습 과제를 운영했으며, 현업 전문가·HR 담당자와 교육 대상자 수준을 확인해 강의안을 수정했어요.",
      roleTags: ["직무 교육 자료 준비", "실습 과제 운영", "교육 피드백 정리"],
      collaborationTags: ["수강생", "현업 전문가", "강사"],
      resultTags: ["직무 역량 향상", "실무 적용도 개선"],
    },
  },
};
