export const PRODUCT_DESIGN_RECORD_PRESET = {
  jobId: "JOB_DESIGN_PRODUCT_DESIGN",
  label: "프로덕트디자인",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "프로덕트 UX 검토",
      "화면 설계",
      "디자인 시스템 운영",
      "개발 협업",
      "사용자 피드백 정리",
      "스프린트 디자인 작업",
      "프로토타입 수정",
    ],
    project: [
      "프로덕트 디자인 전략 수립",
      "신규 기능 UX/UI 설계",
      "디자인 시스템 구축",
      "사용자 리서치 반영",
      "서비스 리디자인",
      "디자인 QA 기준 정립",
      "프로덕트 경험 개선",
    ],
  },
  collaborationExtensions: [
    { id: "pd_collab_pm", label: "PM" },
    { id: "pd_collab_dev", label: "개발팀" },
    { id: "pd_collab_researcher", label: "UX리서처" },
    { id: "pd_collab_brand", label: "브랜드팀" },
    { id: "pd_collab_marketing", label: "마케팅팀" },
    { id: "pd_collab_cs", label: "CS팀" },
    { id: "pd_collab_data", label: "데이터팀" },
  ],
  followUpExtensions: [
    { id: "pd_result_ux_improved", label: "프로덕트 UX 개선" },
    { id: "pd_result_collab_efficiency", label: "디자인-개발 협업 효율화" },
    { id: "pd_result_user_experience", label: "사용자 경험 향상" },
    { id: "pd_result_system_stable", label: "디자인 시스템 안정화" },
    { id: "pd_result_conversion", label: "전환율 개선" },
    { id: "pd_result_feature_quality", label: "기능 완성도 향상" },
    { id: "pd_result_design_standard", label: "디자인 기준 정립" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 신규 기능 화면을 설계하고 개발팀과 스프린트 디자인 작업을 완료해 사용자 피드백을 반영했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "신규 기능 UX 검토 및 화면 설계를 완료하고 개발팀·PM과 협업해 디자인 시스템을 업데이트했어요.",
      roleTags: ["프로덕트 UX 검토", "화면 설계", "디자인 시스템 운영"],
      collaborationTags: ["PM", "개발팀", "UX리서처"],
      resultTags: ["프로덕트 UX 개선", "기능 완성도 향상"],
    },
  },
};
