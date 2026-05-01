export const BRAND_MARKETING_RECORD_PRESET = {
  jobId: "JOB_MARKETING_BRAND_MARKETING",
  label: "브랜드마케팅",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "브랜드 메시지 정리",
      "캠페인 콘셉트 기획",
      "브랜드 채널 운영",
      "톤앤매너 점검",
      "브랜드 콘텐츠 검토",
      "인지도 지표 확인",
      "경쟁 브랜드 모니터링",
    ],
    project: [
      "브랜드 캠페인 기획",
      "브랜드 포지셔닝 정리",
      "브랜드 가이드 개선",
      "핵심 메시지 도출",
      "브랜드 협업 기획",
      "온드미디어 운영안 정리",
      "브랜드 성과 리포트 작성",
    ],
  },
  collaborationExtensions: [
    { id: "brand_collab_design", label: "디자인팀" },
    { id: "brand_collab_content", label: "콘텐츠팀" },
    { id: "brand_collab_agency", label: "광고대행사" },
    { id: "brand_collab_product", label: "제품팀" },
    { id: "brand_collab_sales", label: "영업팀" },
    { id: "brand_collab_executive", label: "경영진" },
    { id: "brand_collab_external", label: "외부 파트너" },
  ],
  followUpExtensions: [
    { id: "brand_result_message_clarified", label: "브랜드 메시지 명확화" },
    { id: "brand_result_awareness_improved", label: "인지도 개선" },
    { id: "brand_result_campaign_direction", label: "캠페인 방향 확정" },
    { id: "brand_result_tone_consistent", label: "톤앤매너 일관성 확보" },
    { id: "brand_result_customer_reaction", label: "고객 반응 확인" },
    { id: "brand_result_exposure_expanded", label: "브랜드 노출 확대" },
    { id: "brand_result_next_idea", label: "후속 캠페인 아이디어 도출" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 신규 캠페인 콘셉트를 기획하고 브랜드 채널 톤앤매너를 점검했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "디자인팀·광고대행사와 캠페인 콘셉트 방향을 조율하고, 경쟁 브랜드 모니터링 결과를 정리해 경영진에게 공유했어요.",
      roleTags: ["캠페인 콘셉트 기획", "브랜드 채널 운영", "경쟁 브랜드 모니터링"],
      collaborationTags: ["디자인팀", "광고대행사", "경영진"],
      resultTags: ["캠페인 방향 확정", "브랜드 메시지 명확화"],
    },
  },
};
