export const DATA_ANALYSIS_RECORD_PRESET = {
  jobId: "JOB_IT_DATA_DIGITAL_DATA_ANALYSIS",
  label: "데이터분석",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "지표 정의 및 점검",
      "대시보드 개선",
      "퍼널 분석",
      "코호트 분석",
      "트렌드 분석",
      "A/B 테스트 분석",
      "KPI 현황 정리",
    ],
    project: [
      "분석 기준 정의",
      "데이터 요구사항 정리",
      "리포트 자동화",
      "분석 대시보드 구축",
      "지표 체계 설계",
      "사용자 행동 분석",
      "데이터 품질 개선",
    ],
  },
  collaborationExtensions: [
    { id: "da_collab_business", label: "현업 부서" },
    { id: "da_collab_marketing", label: "마케팅팀" },
    { id: "da_collab_product", label: "제품팀" },
    { id: "da_collab_sales", label: "영업팀" },
    { id: "da_collab_data", label: "데이터팀" },
    { id: "da_collab_executive", label: "경영진" },
    { id: "da_collab_dev", label: "개발팀" },
  ],
  followUpExtensions: [
    { id: "da_result_decision_support", label: "의사결정 근거 제공" },
    { id: "da_result_metric_opportunity", label: "지표 개선 포인트 발굴" },
    { id: "da_result_standard_clarified", label: "분석 기준 명확화" },
    { id: "da_result_data_accessibility", label: "데이터 접근성 향상" },
    { id: "da_result_report_routinized", label: "리포트 정기화" },
    { id: "da_result_root_cause", label: "문제 원인 파악" },
    { id: "da_result_ops_opportunity", label: "운영 개선 기회 도출" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 전환율이 떨어진 퍼널 구간을 분석하고 KPI 대시보드를 정리했으며, 이상 변동 원인을 공유했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "현업 부서 요청으로 사용자 이탈 퍼널 구간을 분석하고 코호트별 전환율을 정리해 의사결정자에게 개선 방향을 공유했어요.",
      roleTags: ["퍼널 분석", "코호트 분석", "KPI 현황 정리"],
      collaborationTags: ["현업 부서", "의사결정자"],
      resultTags: ["의사결정 근거 제공", "지표 개선 포인트 발굴"],
    },
  },
};
