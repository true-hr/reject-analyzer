export const BUSINESS_PLANNING_RECORD_PRESET = {
  jobId: "JOB_BUSINESS_BUSINESS_PLANNING",
  label: "사업기획",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "사업 지표 점검",
      "시장 자료 정리",
      "사업 과제 정리",
      "실행 계획 수립",
      "사업부 이슈 확인",
      "매출/비용 흐름 검토",
      "보고 자료 작성",
    ],
    project: [
      "사업계획 수립",
      "사업 모델 검토",
      "신규 사업안 작성",
      "사업부 실행 로드맵 정리",
      "시장/고객 분석",
      "사업성 검토",
      "성과 관리 체계 설계",
    ],
  },
  collaborationExtensions: [
    { id: "bizplan_collab_executive", label: "경영진" },
    { id: "bizplan_collab_biz_unit", label: "사업부" },
    { id: "bizplan_collab_finance", label: "재무팀" },
    { id: "bizplan_collab_marketing", label: "마케팅팀" },
    { id: "bizplan_collab_sales", label: "영업팀" },
    { id: "bizplan_collab_product", label: "제품팀" },
    { id: "bizplan_collab_partner", label: "외부 파트너" },
  ],
  followUpExtensions: [
    { id: "bizplan_result_direction", label: "사업 방향 명확화" },
    { id: "bizplan_result_plan", label: "실행 계획 구체화" },
    { id: "bizplan_result_revenue", label: "매출 기회 발굴" },
    { id: "bizplan_result_feasibility", label: "사업성 판단 근거 확보" },
    { id: "bizplan_result_priority", label: "우선순위 정리" },
    { id: "bizplan_result_report", label: "경영 보고 완성도 개선" },
    { id: "bizplan_result_initiative", label: "신규 과제 도출" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 사업 지표를 점검하고 매출/비용 흐름을 검토했으며 보고 자료를 작성했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "사업 지표를 점검하고 시장 자료를 정리했으며, 경영진·사업부와 사업 과제를 논의해 실행 계획을 수립하고 보고 자료를 작성했어요.",
      roleTags: ["사업 지표 점검", "실행 계획 수립", "보고 자료 작성"],
      collaborationTags: ["경영진", "사업부", "재무팀"],
      resultTags: ["사업 방향 명확화", "실행 계획 구체화"],
    },
  },
};
