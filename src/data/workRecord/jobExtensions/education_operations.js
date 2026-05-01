export const EDUCATION_OPERATIONS_RECORD_PRESET = {
  jobId: "JOB_EDUCATION_COUNSELING_COACHING_EDUCATION_OPERATIONS",
  label: "교육운영",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "교육 일정 관리",
      "수강생 문의 대응",
      "교육 자료 배포",
      "출결/참여 현황 확인",
      "강사 커뮤니케이션",
      "교육 만족도 확인",
      "운영 이슈 정리",
    ],
    project: [
      "교육 운영 프로세스 개선",
      "수강생 관리 체계 정리",
      "교육 일정 운영 체계 구축",
      "강사/수강생 커뮤니케이션 개선",
      "교육 만족도 조사 운영",
      "교육 운영 매뉴얼 작성",
      "반복 운영 업무 자동화",
    ],
  },
  collaborationExtensions: [
    { id: "eduops_collab_student", label: "수강생" },
    { id: "eduops_collab_instructor", label: "강사" },
    { id: "eduops_collab_planner", label: "교육기획자" },
    { id: "eduops_collab_ops", label: "운영팀" },
    { id: "eduops_collab_client", label: "고객사" },
    { id: "eduops_collab_partner", label: "외부 파트너" },
    { id: "eduops_collab_content", label: "콘텐츠팀" },
  ],
  followUpExtensions: [
    { id: "eduops_result_stability", label: "교육 운영 안정화" },
    { id: "eduops_result_satisfaction", label: "수강생 만족도 개선" },
    { id: "eduops_result_inquiry", label: "운영 문의 감소" },
    { id: "eduops_result_attendance", label: "출결/참여 관리 정확도 향상" },
    { id: "eduops_result_instructor", label: "강사 커뮤니케이션 개선" },
    { id: "eduops_result_delay", label: "교육 일정 지연 감소" },
    { id: "eduops_result_process", label: "운영 프로세스 표준화" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 교육 일정을 관리하고 수강생 문의에 대응했으며 출결 현황을 확인했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "교육 일정을 관리하고 수강생 문의에 대응했으며, 강사·교육기획자와 운영 이슈를 정리하고 교육 만족도를 확인했어요.",
      roleTags: ["교육 일정 관리", "수강생 문의 대응", "운영 이슈 정리"],
      collaborationTags: ["수강생", "강사", "교육기획자"],
      resultTags: ["교육 운영 안정화", "수강생 만족도 개선"],
    },
  },
};
