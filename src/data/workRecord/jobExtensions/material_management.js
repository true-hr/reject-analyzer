export const MATERIAL_MANAGEMENT_RECORD_PRESET = {
  jobId: "JOB_PROCUREMENT_SCM_INVENTORY_MANAGEMENT",
  label: "재고관리",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "재고 현황 점검",
      "입출고 확인",
      "부족 자재/재고 확인",
      "발주 요청",
      "생산 투입 일정 확인",
      "품질 이슈 정리",
      "창고 현황 점검",
    ],
    project: [
      "재고 관리 체계 개선",
      "생산 자재 수급 안정화",
      "창고 운영 개선",
      "발주 기준 정리",
      "재고 손실/불량 관리",
      "재고 추적성 개선",
      "재고 관리 프로세스 표준화",
    ],
  },
  collaborationExtensions: [
    { id: "invmgmt_collab_production", label: "생산팀" },
    { id: "invmgmt_collab_purchasing", label: "구매팀" },
    { id: "invmgmt_collab_quality", label: "품질팀" },
    { id: "invmgmt_collab_warehouse", label: "창고팀" },
    { id: "invmgmt_collab_supplier", label: "협력사" },
    { id: "invmgmt_collab_logistics", label: "물류팀" },
    { id: "invmgmt_collab_site", label: "현장 담당자" },
  ],
  followUpExtensions: [
    { id: "invmgmt_result_shortage_reduced", label: "재고 부족 리스크 감소" },
    { id: "invmgmt_result_delay_prevented", label: "생산 지연 방지" },
    { id: "invmgmt_result_accuracy", label: "재고 정확도 개선" },
    { id: "invmgmt_result_loss_reduced", label: "재고 손실 감소" },
    { id: "invmgmt_result_wh_efficiency", label: "창고 운영 효율 개선" },
    { id: "invmgmt_result_order_standard", label: "발주 기준 명확화" },
    { id: "invmgmt_result_supply_stable", label: "생산 투입 안정화" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 재고 현황을 점검하고 입출고를 확인했으며 부족 재고를 파악해 발주를 요청했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "재고 현황을 점검하고 입출고를 확인했으며, 생산팀·구매팀과 부족 재고를 파악해 발주를 요청하고 창고 현황을 정리했어요.",
      roleTags: ["재고 현황 점검", "입출고 확인", "발주 요청"],
      collaborationTags: ["생산팀", "구매팀", "창고팀"],
      resultTags: ["재고 정확도 개선", "생산 투입 안정화"],
    },
  },
};
