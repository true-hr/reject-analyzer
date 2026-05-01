export const CAREER_COACHING_RECORD_PRESET = {
  jobId: "JOB_EDUCATION_COUNSELING_COACHING_CAREER_COACHING",
  label: "커리어코칭",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "코칭 세션 진행",
      "커리어 목표 정리",
      "이력서 피드백",
      "면접 준비 지원",
      "강점/경험 구조화",
      "전환 방향 상담",
      "후속 과제 정리",
    ],
    project: [
      "커리어 진단 프로그램 운영",
      "이직 전략 수립 지원",
      "면접 코칭 체계화",
      "이력서 개선 프로세스 정리",
      "직무 전환 로드맵 설계",
      "코칭 사례 분석",
      "고객 성과 리포트 작성",
    ],
  },
  collaborationExtensions: [
    { id: "ccoach_collab_client", label: "코칭 고객" },
    { id: "ccoach_collab_consultant", label: "커리어 컨설턴트" },
    { id: "ccoach_collab_hr", label: "HR 담당자" },
    { id: "ccoach_collab_headhunter", label: "헤드헌터" },
    { id: "ccoach_collab_edu", label: "교육 담당자" },
    { id: "ccoach_collab_ops", label: "운영팀" },
    { id: "ccoach_collab_expert", label: "외부 전문가" },
  ],
  followUpExtensions: [
    { id: "ccoach_result_direction", label: "고객 커리어 방향 명확화" },
    { id: "ccoach_result_resume", label: "이력서 완성도 개선" },
    { id: "ccoach_result_interview", label: "면접 준비도 향상" },
    { id: "ccoach_result_strategy", label: "직무 전환 전략 구체화" },
    { id: "ccoach_result_satisfaction", label: "고객 만족도 향상" },
    { id: "ccoach_result_repurchase", label: "코칭 재구매 가능성 상승" },
    { id: "ccoach_result_case", label: "성공 사례 확보" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 코칭 세션을 진행하고 커리어 목표를 정리했으며 이력서 피드백을 제공했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "코칭 세션을 진행하고 커리어 목표를 정리했으며, 고객의 강점과 경험을 구조화해 면접 준비를 지원하고 이력서 피드백을 제공했어요.",
      roleTags: ["코칭 세션 진행", "커리어 목표 정리", "이력서 피드백"],
      collaborationTags: ["코칭 고객", "커리어 컨설턴트", "HR 담당자"],
      resultTags: ["고객 커리어 방향 명확화", "이력서 완성도 개선"],
    },
  },
};
