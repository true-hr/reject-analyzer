export const UX_DESIGN_RECORD_PRESET = {
  jobId: "JOB_DESIGN_UX_DESIGN",
  label: "UX디자인",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "UX 리서치 수행",
      "사용자 인터뷰",
      "프로토타입 제작",
      "사용성 테스트",
      "디자인 시스템 정리",
      "유저 플로우 점검",
      "경쟁 서비스 분석",
    ],
    project: [
      "UX 전략 수립",
      "사용자 리서치 설계",
      "IA 설계",
      "서비스 프로토타이핑",
      "사용성 테스트 계획",
      "UX 가이드라인 작성",
      "리디자인 방향 도출",
    ],
  },
  collaborationExtensions: [
    { id: "ux_collab_pm", label: "PM" },
    { id: "ux_collab_dev", label: "개발팀" },
    { id: "ux_collab_ui", label: "UI디자이너" },
    { id: "ux_collab_marketing", label: "마케팅팀" },
    { id: "ux_collab_cs", label: "CS팀" },
    { id: "ux_collab_data", label: "데이터팀" },
    { id: "ux_collab_researcher", label: "외부 리서처" },
  ],
  followUpExtensions: [
    { id: "ux_result_problem_defined", label: "UX 문제 정의" },
    { id: "ux_result_usability_improved", label: "사용성 개선" },
    { id: "ux_result_conversion_improved", label: "전환율 개선" },
    { id: "ux_result_satisfaction_up", label: "사용자 만족도 향상" },
    { id: "ux_result_guide_established", label: "디자인 가이드 정립" },
    { id: "ux_result_flow_improved", label: "서비스 흐름 개선" },
    { id: "ux_result_insight_derived", label: "리서치 인사이트 도출" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 사용자 인터뷰를 진행하고 프로토타입을 제작해 사용성 테스트 결과를 PM과 공유했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "사용자 인터뷰와 경쟁 서비스 분석을 통해 UX 문제를 정의하고 프로토타입을 제작해 PM·개발팀과 개선 방향을 공유했어요.",
      roleTags: ["UX 리서치 수행", "사용자 인터뷰", "프로토타입 제작"],
      collaborationTags: ["PM", "개발팀", "UI디자이너"],
      resultTags: ["UX 문제 정의", "서비스 흐름 개선"],
    },
  },
};
