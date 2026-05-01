export const PRODUCT_MARKETING_PMM_RECORD_PRESET = {
  jobId: "JOB_MARKETING_PRODUCT_MARKETING_PMM",
  label: "프로덕트마케팅(PMM)",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "제품 메시지 정리",
      "시장 반응 분석",
      "경쟁 제품 비교",
      "세일즈 자료 개선",
      "고객 페인포인트 정리",
      "런칭 캠페인 점검",
      "포지셔닝 검토",
    ],
    project: [
      "GTM 전략 수립",
      "제품 포지셔닝 정의",
      "런칭 메시지 설계",
      "세일즈 enablement 자료 제작",
      "고객 세그먼트 분석",
      "경쟁사 분석 리포트 작성",
      "제품 가치 제안 정리",
    ],
  },
  collaborationExtensions: [
    { id: "pmm_collab_product", label: "제품팀" },
    { id: "pmm_collab_marketing", label: "마케팅팀" },
    { id: "pmm_collab_sales", label: "영업팀" },
    { id: "pmm_collab_customer", label: "고객" },
    { id: "pmm_collab_data", label: "데이터팀" },
    { id: "pmm_collab_executive", label: "경영진" },
    { id: "pmm_collab_external", label: "외부 파트너" },
  ],
  followUpExtensions: [
    { id: "pmm_result_message_clarified", label: "제품 메시지 명확화" },
    { id: "pmm_result_launch_ready", label: "런칭 준비도 개선" },
    { id: "pmm_result_sales_support", label: "세일즈 전환 지원" },
    { id: "pmm_result_needs_clarified", label: "고객 니즈 구체화" },
    { id: "pmm_result_differentiation", label: "경쟁 차별점 정리" },
    { id: "pmm_result_market_reaction", label: "시장 반응 확인" },
    { id: "pmm_result_gtm_direction", label: "GTM 실행 방향 확정" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 제품 포지셔닝 메시지를 정리하고 경쟁 제품 비교 자료를 업데이트했으며, 세일즈팀 지원 자료를 개선했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "제품팀·영업팀과 GTM 방향을 조율하고 고객 페인포인트를 정리해 런칭 메시지를 구체화했으며, 경영진에게 포지셔닝 방향을 공유했어요.",
      roleTags: ["제품 메시지 정리", "경쟁 제품 비교", "런칭 캠페인 점검"],
      collaborationTags: ["제품팀", "영업팀", "경영진"],
      resultTags: ["제품 메시지 명확화", "GTM 실행 방향 확정"],
    },
  },
};
