export const B2C_SALES_RECORD_PRESET = {
  jobId: "JOB_SALES_B2C_SALES",
  label: "B2C영업",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "고객 상담",
      "판매 현황 점검",
      "고객 니즈 파악",
      "프로모션 안내",
      "매장/채널 운영 확인",
      "클레임 대응",
      "재구매 유도",
    ],
    project: [
      "B2C 판매 전략 수립",
      "고객 응대 프로세스 개선",
      "프로모션 운영",
      "판매 채널 성과 분석",
      "고객 경험 개선",
      "클레임 대응 체계 정리",
      "재구매/추천 유도 전략 정리",
    ],
  },
  collaborationExtensions: [
    { id: "b2csales_collab_customer", label: "고객" },
    { id: "b2csales_collab_channel", label: "매장/채널 담당자" },
    { id: "b2csales_collab_marketing", label: "마케팅팀" },
    { id: "b2csales_collab_ops", label: "운영팀" },
    { id: "b2csales_collab_cs", label: "CS팀" },
    { id: "b2csales_collab_product", label: "제품팀" },
    { id: "b2csales_collab_logistics", label: "물류팀" },
  ],
  followUpExtensions: [
    { id: "b2csales_result_conversion", label: "판매 전환 개선" },
    { id: "b2csales_result_satisfaction", label: "고객 만족도 향상" },
    { id: "b2csales_result_repurchase", label: "재구매 가능성 증가" },
    { id: "b2csales_result_claim_reduced", label: "클레임 감소" },
    { id: "b2csales_result_channel", label: "판매 채널 효율 개선" },
    { id: "b2csales_result_needs", label: "고객 니즈 구체화" },
    { id: "b2csales_result_promo", label: "프로모션 성과 확인" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 고객 상담을 진행하고 판매 현황을 점검했으며 클레임에 대응했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "고객 상담을 진행하고 판매 현황을 점검했으며, 마케팅팀·CS팀과 프로모션을 안내하고 클레임에 대응해 고객 만족도를 관리했어요.",
      roleTags: ["고객 상담", "판매 현황 점검", "클레임 대응"],
      collaborationTags: ["고객", "마케팅팀", "CS팀"],
      resultTags: ["고객 만족도 향상", "판매 전환 개선"],
    },
  },
};
