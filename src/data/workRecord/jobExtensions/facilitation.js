export const FACILITATION_RECORD_PRESET = {
  jobId: "JOB_EDUCATION_COUNSELING_COACHING_FACILITATION",
  label: "퍼실리테이션",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "워크숍 진행",
      "회의 흐름 설계",
      "참여자 의견 수렴",
      "토론 결과 정리",
      "합의안 도출",
      "진행 자료 준비",
      "후속 액션 정리",
    ],
    project: [
      "워크숍 프로그램 설계",
      "조직 문제 해결 세션 운영",
      "의사결정 회의 퍼실리테이션",
      "참여형 교육 운영",
      "합의 형성 프로세스 설계",
      "조직 워크숍 결과 리포트 작성",
      "후속 실행 과제 관리",
    ],
  },
  collaborationExtensions: [
    { id: "facil_collab_participant", label: "참여자" },
    { id: "facil_collab_leader", label: "조직 리더" },
    { id: "facil_collab_hr", label: "HR 담당자" },
    { id: "facil_collab_planner", label: "교육기획자" },
    { id: "facil_collab_business", label: "현업 부서" },
    { id: "facil_collab_consultant", label: "외부 컨설턴트" },
    { id: "facil_collab_ops", label: "운영팀" },
  ],
  followUpExtensions: [
    { id: "facil_result_engagement", label: "참여자 몰입도 향상" },
    { id: "facil_result_consensus", label: "합의안 도출" },
    { id: "facil_result_productivity", label: "회의 생산성 개선" },
    { id: "facil_result_clarity", label: "조직 문제 명확화" },
    { id: "facil_result_action", label: "후속 실행력 강화" },
    { id: "facil_result_conflict", label: "의견 충돌 완화" },
    { id: "facil_result_satisfaction", label: "워크숍 만족도 개선" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 워크숍을 진행하고 참여자 의견을 수렴했으며 합의안을 도출했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "워크숍을 진행하고 참여자 의견을 수렴했으며, 조직 리더·현업 부서와 토론 결과를 정리해 합의안을 도출하고 후속 액션을 정리했어요.",
      roleTags: ["워크숍 진행", "참여자 의견 수렴", "합의안 도출"],
      collaborationTags: ["참여자", "조직 리더", "HR 담당자"],
      resultTags: ["참여자 몰입도 향상", "합의안 도출"],
    },
  },
};
