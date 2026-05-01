export const UI_DESIGN_RECORD_PRESET = {
  jobId: "JOB_DESIGN_UI_DESIGN",
  label: "UI디자인",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "화면 레이아웃 설계",
      "컴포넌트 디자인",
      "스타일 가이드 정리",
      "디자인 시스템 업데이트",
      "시안 제작",
      "개발 협업",
      "피드백 반영",
    ],
    project: [
      "디자인 시스템 구축",
      "UI 컴포넌트 라이브러리 제작",
      "서비스 UI 리뉴얼",
      "와이어프레임 설계",
      "시각 디자인 가이드 작성",
      "브랜드 적용 UI 설계",
      "접근성 개선",
    ],
  },
  collaborationExtensions: [
    { id: "uid_collab_dev", label: "개발팀" },
    { id: "uid_collab_ux", label: "UX디자이너" },
    { id: "uid_collab_pm", label: "PM" },
    { id: "uid_collab_brand", label: "브랜드팀" },
    { id: "uid_collab_marketing", label: "마케팅팀" },
    { id: "uid_collab_qa", label: "QA팀" },
  ],
  followUpExtensions: [
    { id: "uid_result_consistency", label: "UI 일관성 확보" },
    { id: "uid_result_design_system", label: "디자인 시스템 정립" },
    { id: "uid_result_dev_collab", label: "개발 협업 효율화" },
    { id: "uid_result_brand_expression", label: "브랜드 표현 강화" },
    { id: "uid_result_accessibility", label: "접근성 개선" },
    { id: "uid_result_quality", label: "화면 완성도 향상" },
    { id: "uid_result_style_clarity", label: "스타일 가이드 명확화" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 신규 화면 시안을 제작하고 디자인 시스템 컴포넌트를 업데이트해 개발팀과 협업했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "신규 기능 화면 레이아웃을 설계하고 디자인 시스템을 업데이트해 개발팀·QA팀과 피드백을 반영했어요.",
      roleTags: ["화면 레이아웃 설계", "디자인 시스템 업데이트", "피드백 반영"],
      collaborationTags: ["개발팀", "UX디자이너", "PM"],
      resultTags: ["UI 일관성 확보", "개발 협업 효율화"],
    },
  },
};
