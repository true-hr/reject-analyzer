export const PERFORMANCE_MARKETING_RECORD_PRESET = {
  jobId: "JOB_MARKETING_PERFORMANCE_MARKETING",
  label: "퍼포먼스마케팅",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "광고 성과 점검",
      "ROAS 분석",
      "CPA 개선",
      "소재 테스트",
      "타깃 세그먼트 조정",
      "랜딩페이지 점검",
      "예산 배분 조정",
    ],
    project: [
      "광고 캠페인 세팅",
      "매체별 성과 비교",
      "전환 퍼널 분석",
      "입찰 전략 조정",
      "A/B 테스트 설계",
      "성과 리포트 작성",
      "광고 효율 개선안 도출",
    ],
  },
  collaborationExtensions: [
    { id: "perf_collab_agency", label: "광고대행사" },
    { id: "perf_collab_design", label: "디자인팀" },
    { id: "perf_collab_content", label: "콘텐츠팀" },
    { id: "perf_collab_data", label: "데이터팀" },
    { id: "perf_collab_sales", label: "영업팀" },
    { id: "perf_collab_product", label: "제품팀" },
    { id: "perf_collab_decision_maker", label: "의사결정자" },
  ],
  followUpExtensions: [
    { id: "perf_result_conversion_improved", label: "전환율 개선" },
    { id: "perf_result_roas_up", label: "ROAS 상승" },
    { id: "perf_result_cpa_down", label: "CPA 절감" },
    { id: "perf_result_efficiency_improved", label: "광고 효율 개선" },
    { id: "perf_result_creative_reaction", label: "소재 반응 확인" },
    { id: "perf_result_budget_waste_reduced", label: "예산 낭비 감소" },
    { id: "perf_result_next_test", label: "다음 테스트 방향 도출" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 매체별 ROAS를 분석하고 CPA가 높은 소재를 교체해 광고 효율을 개선했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "광고대행사·데이터팀과 전환 퍼널을 분석하고 소재 A/B 테스트 결과를 정리해 의사결정자에게 예산 재배분안을 공유했어요.",
      roleTags: ["ROAS 분석", "소재 테스트", "예산 배분 조정"],
      collaborationTags: ["광고대행사", "데이터팀", "의사결정자"],
      resultTags: ["전환율 개선", "광고 효율 개선"],
    },
  },
};
