export const LOGISTICS_MANAGEMENT_RECORD_PRESET = {
  jobId: "JOB_PROCUREMENT_SCM_LOGISTICS",
  label: "물류관리",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "입출고 현황 확인",
      "배송 일정 점검",
      "물류비 확인",
      "재고 이동 관리",
      "운송 이슈 대응",
      "물류센터 커뮤니케이션",
      "배송 지연 원인 확인",
    ],
    project: [
      "물류 프로세스 개선",
      "배송 운영 체계 정리",
      "물류비 절감 과제 추진",
      "창고/센터 운영 개선",
      "운송사 관리 기준 수립",
      "입출고 정확도 개선",
      "물류 KPI 관리 체계 구축",
    ],
  },
  collaborationExtensions: [
    { id: "logistics_collab_wh", label: "물류센터" },
    { id: "logistics_collab_carrier", label: "운송사" },
    { id: "logistics_collab_purchasing", label: "구매팀" },
    { id: "logistics_collab_sales", label: "영업팀" },
    { id: "logistics_collab_cs", label: "고객지원팀" },
    { id: "logistics_collab_production", label: "생산팀" },
    { id: "logistics_collab_supplier", label: "협력사" },
  ],
  followUpExtensions: [
    { id: "logistics_result_delay_reduced", label: "배송 지연 감소" },
    { id: "logistics_result_cost_reduced", label: "물류비 절감" },
    { id: "logistics_result_accuracy", label: "입출고 정확도 개선" },
    { id: "logistics_result_visibility", label: "재고 이동 가시성 향상" },
    { id: "logistics_result_issue_reduced", label: "운송 이슈 감소" },
    { id: "logistics_result_standard", label: "물류 운영 기준 표준화" },
    { id: "logistics_result_satisfaction", label: "고객 배송 만족도 개선" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 입출고 현황을 확인하고 배송 일정을 점검했으며 운송 이슈에 대응했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "입출고 현황을 확인하고 배송 일정을 점검했으며, 물류센터·운송사와 운송 이슈에 대응해 배송 지연 원인을 파악했어요.",
      roleTags: ["입출고 현황 확인", "배송 일정 점검", "운송 이슈 대응"],
      collaborationTags: ["물류센터", "운송사", "구매팀"],
      resultTags: ["배송 지연 감소", "입출고 정확도 개선"],
    },
  },
};
