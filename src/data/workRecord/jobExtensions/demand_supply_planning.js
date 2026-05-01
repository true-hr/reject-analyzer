export const DEMAND_SUPPLY_PLANNING_RECORD_PRESET = {
  jobId: "JOB_PROCUREMENT_SCM_DEMAND_SUPPLY_PLANNING",
  label: "수요/공급계획",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "수요 예측 업데이트",
      "공급 가능 물량 확인",
      "판매 계획 비교",
      "재고 수준 점검",
      "생산 계획 조율",
      "품절/과잉 리스크 확인",
      "계획 데이터 정리",
    ],
    project: [
      "수요 예측 모델 개선",
      "S&OP 프로세스 운영",
      "공급 계획 체계 정리",
      "재고 최적화 과제 추진",
      "판매-생산 계획 연계",
      "계획 정확도 개선",
      "수급 시나리오 분석",
    ],
  },
  collaborationExtensions: [
    { id: "dsp_collab_sales", label: "영업팀" },
    { id: "dsp_collab_production", label: "생산팀" },
    { id: "dsp_collab_scm", label: "SCM팀" },
    { id: "dsp_collab_purchasing", label: "구매팀" },
    { id: "dsp_collab_finance", label: "재무팀" },
    { id: "dsp_collab_logistics", label: "물류팀" },
    { id: "dsp_collab_executive", label: "경영진" },
  ],
  followUpExtensions: [
    { id: "dsp_result_forecast", label: "수요 예측 정확도 개선" },
    { id: "dsp_result_stockout_reduced", label: "품절 리스크 감소" },
    { id: "dsp_result_overstock_reduced", label: "과잉 재고 감소" },
    { id: "dsp_result_prod_stable", label: "생산 계획 안정화" },
    { id: "dsp_result_coordination", label: "수급 조율력 향상" },
    { id: "dsp_result_sop", label: "S&OP 운영 개선" },
    { id: "dsp_result_decision", label: "계획 기반 의사결정 강화" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 수요 예측을 업데이트하고 공급 가능 물량을 확인했으며 품절 리스크를 점검했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "수요 예측을 업데이트하고 공급 가능 물량을 확인했으며, 영업팀·생산팀과 판매 계획을 비교해 품절/과잉 리스크를 점검했어요.",
      roleTags: ["수요 예측 업데이트", "공급 가능 물량 확인", "품절/과잉 리스크 확인"],
      collaborationTags: ["영업팀", "생산팀", "SCM팀"],
      resultTags: ["수요 예측 정확도 개선", "품절 리스크 감소"],
    },
  },
};
