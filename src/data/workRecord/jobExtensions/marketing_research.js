export const MARKETING_RESEARCH_RECORD_PRESET = {
  jobId: "JOB_MARKETING_MARKETING_RESEARCH",
  label: "시장조사 / 마케팅리서치",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "시장 자료 수집",
      "경쟁사 분석",
      "고객 설문 정리",
      "인터뷰 결과 분석",
      "리서치 데이터 정리",
      "시장 트렌드 확인",
      "인사이트 메모 작성",
    ],
    project: [
      "시장조사 설계",
      "고객 리서치 진행",
      "경쟁사 분석 리포트 작성",
      "시장 규모 추정",
      "고객 세그먼트 분석",
      "신제품/서비스 수요 검증",
      "리서치 기반 전략 제안",
    ],
  },
  collaborationExtensions: [
    { id: "mktres_collab_marketing", label: "마케팅팀" },
    { id: "mktres_collab_product", label: "제품팀" },
    { id: "mktres_collab_strategy", label: "전략기획팀" },
    { id: "mktres_collab_data", label: "데이터팀" },
    { id: "mktres_collab_sales", label: "영업팀" },
    { id: "mktres_collab_customer", label: "고객" },
    { id: "mktres_collab_agency", label: "외부 리서치 업체" },
  ],
  followUpExtensions: [
    { id: "mktres_result_insight", label: "고객 인사이트 확보" },
    { id: "mktres_result_opportunity", label: "시장 기회 발견" },
    { id: "mktres_result_competitive", label: "경쟁 구도 명확화" },
    { id: "mktres_result_strategy", label: "제품/마케팅 전략 근거 제공" },
    { id: "mktres_result_segment", label: "고객 세그먼트 구체화" },
    { id: "mktres_result_validation", label: "수요 검증 정확도 개선" },
    { id: "mktres_result_decision", label: "의사결정 근거 강화" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 시장 자료를 수집하고 경쟁사를 분석했으며 인터뷰 결과를 정리했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "시장 자료를 수집하고 경쟁사를 분석했으며, 제품팀·전략기획팀과 고객 설문 결과를 정리해 시장 트렌드를 확인했어요.",
      roleTags: ["시장 자료 수집", "경쟁사 분석", "인터뷰 결과 분석"],
      collaborationTags: ["마케팅팀", "제품팀", "전략기획팀"],
      resultTags: ["고객 인사이트 확보", "시장 기회 발견"],
    },
  },
};
