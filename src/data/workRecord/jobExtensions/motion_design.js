export const MOTION_DESIGN_RECORD_PRESET = {
  jobId: "JOB_DESIGN_MOTION_DESIGN",
  label: "모션디자인",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "모션 시안 제작",
      "영상 그래픽 작업",
      "애니메이션 수정",
      "컷 편집 보완",
      "자막/그래픽 적용",
      "렌더링 결과 확인",
      "영상 소재 정리",
    ],
    project: [
      "모션 콘셉트 설계",
      "영상 타이틀/그래픽 제작",
      "광고 영상 모션 작업",
      "인터랙션 모션 가이드 제작",
      "영상 템플릿 구축",
      "모션 스타일 시스템 정리",
      "영상 후반 작업 품질 개선",
    ],
  },
  collaborationExtensions: [
    { id: "motion_collab_video", label: "영상팀" },
    { id: "motion_collab_marketing", label: "마케팅팀" },
    { id: "motion_collab_content", label: "콘텐츠팀" },
    { id: "motion_collab_brand", label: "브랜드팀" },
    { id: "motion_collab_planner", label: "기획자" },
    { id: "motion_collab_production", label: "외부 제작사" },
    { id: "motion_collab_product", label: "제품팀" },
  ],
  followUpExtensions: [
    { id: "motion_result_immersion", label: "영상 몰입도 개선" },
    { id: "motion_result_quality", label: "모션 완성도 향상" },
    { id: "motion_result_efficiency", label: "영상 제작 효율 개선" },
    { id: "motion_result_brand", label: "브랜드 표현력 강화" },
    { id: "motion_result_reuse", label: "소재 재사용성 향상" },
    { id: "motion_result_comprehension", label: "시청자 이해도 개선" },
    { id: "motion_result_campaign", label: "캠페인 영상 품질 향상" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 모션 시안을 제작하고 애니메이션을 수정했으며 렌더링 결과를 확인했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "모션 시안을 제작하고 영상 그래픽 작업을 진행했으며, 영상팀·마케팅팀과 협의해 애니메이션을 수정하고 렌더링 결과를 확인했어요.",
      roleTags: ["모션 시안 제작", "영상 그래픽 작업", "애니메이션 수정"],
      collaborationTags: ["영상팀", "마케팅팀", "콘텐츠팀"],
      resultTags: ["모션 완성도 향상", "영상 제작 효율 개선"],
    },
  },
};
