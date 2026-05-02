export const CX_PLANNING_RECORD_PRESET = {
  jobId: "JOB_CUSTOMER_OPERATIONS_CX_PLANNING",
  label: "CX기획",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "고객 여정 분석",
      "VOC 수집·정리",
      "접점 개선 기획",
      "유관 부서 협업",
      "고객 경험 지표 모니터링",
      "개선 과제 도출",
      "안내 흐름 개선",
    ],
    project: [
      "CJM(고객 여정 지도) 작성",
      "접점별 불편 원인 분석",
      "고객 경험 개선 과제 정의",
      "안내·정책 체계 개편",
      "운영·상담·서비스기획 연계 개선",
      "고객 경험 지표(CSAT·NPS) 개선 기획",
      "VOC 구조화 및 개선 우선순위 수립",
    ],
  },
  collaborationExtensions: [
    { id: "cx_collab_service_planning", label: "서비스기획팀" },
    { id: "cx_collab_cs", label: "CS팀" },
    { id: "cx_collab_operations", label: "운영팀" },
    { id: "cx_collab_product", label: "제품팀" },
    { id: "cx_collab_design", label: "디자인팀" },
    { id: "cx_collab_data", label: "데이터팀" },
  ],
  followUpExtensions: [
    { id: "cx_result_csat_improvement", label: "고객 만족도 향상" },
    { id: "cx_result_voc_reduction", label: "VOC 건수 감소" },
    { id: "cx_result_process_improvement", label: "운영 프로세스 개선" },
    { id: "cx_result_touchpoint_improvement", label: "접점 경험 개선" },
    { id: "cx_result_policy_improvement", label: "안내·정책 체계 개선" },
    { id: "cx_result_nps_improvement", label: "NPS 개선" },
    { id: "cx_result_issue_resolution", label: "반복 불만 해소" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 VOC를 분류하고 접점 불편 원인을 파악해 개선 과제를 정의하고 서비스기획팀과 공유했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "VOC 분류와 고객 여정 분석을 통해 접점 불편 원인을 파악하고 개선 과제를 정의해 서비스기획팀과 공유했어요.",
      roleTags: ["VOC 수집·정리", "접점 개선 기획", "고객 여정 분석"],
      collaborationTags: ["서비스기획팀", "CS팀", "운영팀"],
      resultTags: ["접점 경험 개선", "VOC 건수 감소"],
    },
  },
};
