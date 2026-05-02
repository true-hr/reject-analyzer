export const ECOMMERCE_OPS_RECORD_PRESET = {
  jobId: "JOB_CUSTOMER_OPERATIONS_ECOMMERCE_OPERATIONS",
  label: "커머스운영",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "상품 등록, 가격, 노출 상태를 점검하고 운영 이슈를 정리했습니다.",
      "주문·결제·배송 처리 현황을 확인하고 이상 건을 처리했습니다.",
      "CS 문의를 처리하고 반품·환불 요청에 대응했습니다.",
      "프로모션·기획전 진행 상태와 성과 지표를 확인했습니다.",
      "파트너사·물류사와 운영 이슈를 조율했습니다.",
      "커머스 운영 지표(전환율, 배송 지연율 등)를 점검했습니다.",
      "운영 현황 리포트를 작성하고 팀 내 공유했습니다.",
    ],
    project: [
      "커머스 운영 프로세스 개선",
      "프로모션·기획전 기획 및 운영",
      "상품 카탈로그 정비 및 품질 개선",
      "주문·배송 운영 효율화",
      "CS 대응 매뉴얼 정비",
      "커머스 운영 지표 대시보드 구축",
      "입점 파트너 운영 가이드 정비",
    ],
  },
  collaborationExtensions: [
    { id: "ecommops_collab_md", label: "MD팀" },
    { id: "ecommops_collab_marketing", label: "마케팅팀" },
    { id: "ecommops_collab_logistics", label: "물류·배송팀" },
    { id: "ecommops_collab_cs", label: "CS팀" },
    { id: "ecommops_collab_dev", label: "개발팀" },
    { id: "ecommops_collab_partner", label: "파트너사" },
    { id: "ecommops_collab_finance", label: "정산·재무팀" },
  ],
  followUpExtensions: [
    { id: "ecommops_result_ops_efficiency", label: "운영 효율화" },
    { id: "ecommops_result_conversion", label: "전환율 개선" },
    { id: "ecommops_result_shipping", label: "배송 품질 향상" },
    { id: "ecommops_result_cs_reduction", label: "CS 문의 감소" },
    { id: "ecommops_result_catalog", label: "상품 데이터 품질 향상" },
    { id: "ecommops_result_promo", label: "프로모션 성과 달성" },
    { id: "ecommops_result_partner", label: "파트너 운영 만족도 향상" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 상품 노출 상태를 점검하고 주문 이상 건을 처리했으며, 배송 지연 이슈를 물류팀과 조율했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "상품 등록 현황과 노출 상태를 점검하고, 주문·배송 이상 건을 처리했으며, CS 문의에 대응했어요. 프로모션 성과 지표를 확인해 운영 현황을 정리했습니다.",
      roleTags: ["상품 등록, 가격, 노출 상태를 점검하고 운영 이슈를 정리했습니다.", "주문·결제·배송 처리 현황을 확인하고 이상 건을 처리했습니다.", "CS 문의를 처리하고 반품·환불 요청에 대응했습니다."],
      collaborationTags: ["MD팀", "물류·배송팀", "CS팀"],
      resultTags: ["운영 효율화", "배송 품질 향상"],
    },
  },
};
