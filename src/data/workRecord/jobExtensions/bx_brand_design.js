export const BX_BRAND_DESIGN_RECORD_PRESET = {
  jobId: "JOB_DESIGN_BX_BRAND_DESIGN",
  label: "BX/브랜드디자인",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "브랜드 비주얼 점검",
      "브랜드 가이드 반영",
      "키비주얼 제작",
      "브랜드 에셋 정리",
      "캠페인 디자인 검토",
      "톤앤매너 점검",
      "디자인 레퍼런스 조사",
    ],
    project: [
      "브랜드 아이덴티티 설계",
      "브랜드 가이드라인 제작",
      "캠페인 키비주얼 개발",
      "브랜드 시스템 정리",
      "오프라인/온라인 브랜드 경험 설계",
      "브랜드 리뉴얼 디자인",
      "브랜드 적용 사례 검수",
    ],
  },
  collaborationExtensions: [
    { id: "bxbrand_collab_brand", label: "브랜드팀" },
    { id: "bxbrand_collab_marketing", label: "마케팅팀" },
    { id: "bxbrand_collab_content", label: "콘텐츠팀" },
    { id: "bxbrand_collab_product", label: "제품팀" },
    { id: "bxbrand_collab_agency", label: "외부 에이전시" },
    { id: "bxbrand_collab_executive", label: "경영진" },
    { id: "bxbrand_collab_vendor", label: "인쇄/제작 업체" },
  ],
  followUpExtensions: [
    { id: "bxbrand_result_consistency", label: "브랜드 일관성 개선" },
    { id: "bxbrand_result_identity", label: "시각 정체성 강화" },
    { id: "bxbrand_result_campaign", label: "캠페인 완성도 향상" },
    { id: "bxbrand_result_awareness", label: "브랜드 인지도 개선" },
    { id: "bxbrand_result_error_reduced", label: "디자인 적용 오류 감소" },
    { id: "bxbrand_result_reuse", label: "브랜드 자산 재사용성 개선" },
    { id: "bxbrand_result_experience", label: "브랜드 경험 품질 향상" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 브랜드 비주얼을 점검하고 키비주얼을 제작했으며 캠페인 디자인을 검토했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "브랜드 비주얼을 점검하고 키비주얼을 제작했으며, 마케팅팀·콘텐츠팀과 캠페인 디자인 방향을 협의해 톤앤매너를 정리했어요.",
      roleTags: ["브랜드 비주얼 점검", "키비주얼 제작", "캠페인 디자인 검토"],
      collaborationTags: ["브랜드팀", "마케팅팀", "콘텐츠팀"],
      resultTags: ["브랜드 일관성 개선", "시각 정체성 강화"],
    },
  },
};
