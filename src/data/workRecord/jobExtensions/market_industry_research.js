export const MARKET_INDUSTRY_RESEARCH_RECORD_PRESET = {
  jobId: "JOB_RESEARCH_PROFESSIONAL_MARKET_INDUSTRY_RESEARCH",
  label: "시장/산업연구",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "산업 동향 조사",
      "경쟁사 자료 분석",
      "시장 규모 추정",
      "리서치 데이터 정리",
      "고객군 분석",
      "보고서 초안 작성",
      "인사이트 메모 정리",
    ],
    project: [
      "산업 리서치 프로젝트 수행",
      "시장 진입 가능성 분석",
      "경쟁 구도 분석",
      "고객 세그먼트 연구",
      "시장 성장성 평가",
      "리서치 기반 전략 제안",
      "산업 보고서 작성",
    ],
  },
  collaborationExtensions: [
    { id: "mktrsch_collab_strategy", label: "전략기획팀" },
    { id: "mktrsch_collab_marketing", label: "마케팅팀" },
    { id: "mktrsch_collab_product", label: "제품팀" },
    { id: "mktrsch_collab_data", label: "데이터팀" },
    { id: "mktrsch_collab_executive", label: "경영진" },
    { id: "mktrsch_collab_agency", label: "외부 리서치 업체" },
    { id: "mktrsch_collab_customer", label: "고객" },
  ],
  followUpExtensions: [
    { id: "mktrsch_result_opportunity", label: "시장 기회 발견" },
    { id: "mktrsch_result_industry", label: "산업 구조 이해도 향상" },
    { id: "mktrsch_result_competitive", label: "경쟁 전략 근거 확보" },
    { id: "mktrsch_result_segment", label: "고객 세그먼트 명확화" },
    { id: "mktrsch_result_decision", label: "의사결정 근거 강화" },
    { id: "mktrsch_result_reliability", label: "보고서 신뢰도 개선" },
    { id: "mktrsch_result_new_biz", label: "신규 사업 검토 지원" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 산업 동향을 조사하고 경쟁사 자료를 분석했으며 리서치 데이터를 정리했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "산업 동향을 조사하고 경쟁사 자료를 분석했으며, 전략기획팀·마케팅팀과 시장 규모를 추정하고 인사이트를 정리했어요.",
      roleTags: ["산업 동향 조사", "경쟁사 자료 분석", "시장 규모 추정"],
      collaborationTags: ["전략기획팀", "마케팅팀", "데이터팀"],
      resultTags: ["시장 기회 발견", "경쟁 전략 근거 확보"],
    },
  },
};
