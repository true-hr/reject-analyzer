export const BUSINESS_STRATEGY_RECORD_PRESET = {
  jobId: "JOB_BUSINESS_STRATEGY",
  label: "전략기획",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "시장 자료 분석",
      "경쟁사 조사",
      "사업 지표 점검",
      "전략 과제 정리",
      "경영 보고 자료 작성",
      "실행 계획 조율",
      "리스크 검토",
    ],
    project: [
      "사업 전략 수립",
      "신규 사업 검토",
      "중장기 로드맵 정리",
      "시장 진입 전략 분석",
      "경영진 의사결정 자료 작성",
      "사업성 검토",
      "전략 과제 실행안 도출",
    ],
  },
  collaborationExtensions: [
    { id: "str_collab_executive", label: "경영진" },
    { id: "str_collab_biz_unit", label: "사업부" },
    { id: "str_collab_finance", label: "재무팀" },
    { id: "str_collab_marketing", label: "마케팅팀" },
    { id: "str_collab_sales", label: "영업팀" },
    { id: "str_collab_product", label: "제품팀" },
    { id: "str_collab_external", label: "외부 파트너" },
  ],
  followUpExtensions: [
    { id: "str_result_decision_basis", label: "의사결정 근거 제공" },
    { id: "str_result_direction_clarified", label: "전략 방향 명확화" },
    { id: "str_result_opportunity_found", label: "사업 기회 발굴" },
    { id: "str_result_priority_defined", label: "실행 우선순위 정리" },
    { id: "str_result_risk_precheck", label: "리스크 사전 확인" },
    { id: "str_result_report_quality", label: "경영 보고 완성도 개선" },
    { id: "str_result_new_task", label: "신규 과제 도출" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 경쟁사 자료를 분석하고 사업 지표를 점검해 경영 보고 자료를 작성했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "사업부·재무팀과 사업 지표를 점검하고 중장기 전략 방향을 정리해 경영진에게 의사결정 자료를 공유했어요.",
      roleTags: ["사업 지표 점검", "경영 보고 자료 작성", "전략 과제 정리"],
      collaborationTags: ["경영진", "사업부", "재무팀"],
      resultTags: ["의사결정 근거 제공", "전략 방향 명확화"],
    },
  },
};
