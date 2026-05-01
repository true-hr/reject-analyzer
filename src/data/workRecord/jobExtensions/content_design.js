export const CONTENT_DESIGN_RECORD_PRESET = {
  jobId: "JOB_DESIGN_CONTENT_DESIGN",
  label: "콘텐츠디자인",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "콘텐츠 이미지 제작",
      "SNS 카드뉴스 디자인",
      "썸네일 제작",
      "콘텐츠 레이아웃 수정",
      "캠페인 소재 제작",
      "텍스트 시각화",
      "채널별 이미지 변형",
    ],
    project: [
      "콘텐츠 디자인 시스템 구축",
      "SNS 콘텐츠 패키지 제작",
      "캠페인 콘텐츠 비주얼 개발",
      "채널별 디자인 템플릿 정리",
      "콘텐츠 포맷 개선",
      "콘텐츠 반응 기반 디자인 개선",
      "에디토리얼 디자인 방향 정리",
    ],
  },
  collaborationExtensions: [
    { id: "contentdesign_collab_content", label: "콘텐츠팀" },
    { id: "contentdesign_collab_marketing", label: "마케팅팀" },
    { id: "contentdesign_collab_brand", label: "브랜드팀" },
    { id: "contentdesign_collab_video", label: "영상팀" },
    { id: "contentdesign_collab_copy", label: "카피라이터" },
    { id: "contentdesign_collab_creator", label: "외부 크리에이터" },
    { id: "contentdesign_collab_agency", label: "광고대행사" },
  ],
  followUpExtensions: [
    { id: "contentdesign_result_engagement", label: "콘텐츠 반응률 개선" },
    { id: "contentdesign_result_readability", label: "메시지 가독성 향상" },
    { id: "contentdesign_result_channel", label: "채널별 소재 효율 개선" },
    { id: "contentdesign_result_speed", label: "콘텐츠 제작 속도 개선" },
    { id: "contentdesign_result_consistency", label: "디자인 일관성 확보" },
    { id: "contentdesign_result_campaign", label: "캠페인 소재 품질 개선" },
    { id: "contentdesign_result_spread", label: "콘텐츠 확산력 강화" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 SNS 카드뉴스를 디자인하고 썸네일을 제작했으며 캠페인 소재를 만들었어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "SNS 카드뉴스를 디자인하고 썸네일을 제작했으며, 콘텐츠팀·마케팅팀과 채널별 캠페인 소재를 제작하고 텍스트 시각화 작업을 완료했어요.",
      roleTags: ["SNS 카드뉴스 디자인", "썸네일 제작", "캠페인 소재 제작"],
      collaborationTags: ["콘텐츠팀", "마케팅팀", "브랜드팀"],
      resultTags: ["콘텐츠 반응률 개선", "메시지 가독성 향상"],
    },
  },
};
