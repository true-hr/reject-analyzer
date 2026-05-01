export const SCM_RECORD_PRESET = {
  jobId: "JOB_PROCUREMENT_SCM_SCM",
  label: "SCM",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "공급망 현황 점검",
      "재고 흐름 확인",
      "납기 이슈 조율",
      "생산/물류 일정 확인",
      "수급 리스크 점검",
      "공급망 데이터 정리",
      "운영 지표 확인",
    ],
    project: [
      "공급망 운영 구조 개선",
      "수급 계획 체계 정리",
      "재고/물류 흐름 최적화",
      "공급망 리스크 관리",
      "생산-물류-판매 연계 개선",
      "SCM 지표 관리 체계 구축",
      "공급망 가시성 개선",
    ],
  },
  collaborationExtensions: [
    { id: "scm_collab_purchasing", label: "구매팀" },
    { id: "scm_collab_production", label: "생산팀" },
    { id: "scm_collab_logistics", label: "물류팀" },
    { id: "scm_collab_sales", label: "영업팀" },
    { id: "scm_collab_supplier", label: "협력사" },
    { id: "scm_collab_finance", label: "재무팀" },
    { id: "scm_collab_executive", label: "경영진" },
  ],
  followUpExtensions: [
    { id: "scm_result_stability", label: "공급망 안정성 개선" },
    { id: "scm_result_inventory", label: "재고 과부족 감소" },
    { id: "scm_result_delivery", label: "납기 대응력 향상" },
    { id: "scm_result_visibility", label: "운영 가시성 개선" },
    { id: "scm_result_risk_reduced", label: "수급 리스크 감소" },
    { id: "scm_result_coordination", label: "부서 간 조율 개선" },
    { id: "scm_result_cost", label: "공급망 비용 효율화" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 공급망 현황을 점검하고 납기 이슈를 조율했으며 수급 리스크를 확인했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "공급망 현황을 점검하고 재고 흐름을 확인했으며, 구매팀·물류팀·생산팀과 납기 이슈를 조율해 수급 리스크를 점검했어요.",
      roleTags: ["공급망 현황 점검", "재고 흐름 확인", "납기 이슈 조율"],
      collaborationTags: ["구매팀", "생산팀", "물류팀"],
      resultTags: ["공급망 안정성 개선", "납기 대응력 향상"],
    },
  },
};
