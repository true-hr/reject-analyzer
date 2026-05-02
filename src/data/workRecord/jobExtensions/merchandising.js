export const MERCHANDISING_RECORD_PRESET = {
  jobId: "JOB_BUSINESS_MERCHANDISING",
  label: "MD/머천다이징",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "카테고리별 판매 성과를 분석하고 개선 방향을 정리했습니다.",
      "상품 라인업을 검토하고 신규 상품 입점 및 단종 여부를 판단했습니다.",
      "파트너사·브랜드와 상품 조건, 납품 일정을 조율했습니다.",
      "시즌 상품과 프로모션 계획을 검토하고 기획전 방향을 협의했습니다.",
      "경쟁사 상품 구성과 트렌드를 모니터링했습니다.",
      "재고 소진율과 회전율을 확인하고 운영 방향을 조정했습니다.",
      "카테고리 KPI 실적을 리뷰하고 팀에 공유했습니다.",
    ],
    project: [
      "카테고리 전략 수립 및 상품 라인업 기획",
      "시즌 기획전·프로모션 기획 및 운영",
      "신규 파트너·브랜드 입점 기획",
      "판매 저조 상품 교체 전략 수립",
      "카테고리 성과 분석 리포트 작성",
      "재고 소진 전략 기획",
      "MD 운영 기준 및 가이드 정비",
    ],
  },
  collaborationExtensions: [
    { id: "md_collab_marketing", label: "마케팅팀" },
    { id: "md_collab_ecommops", label: "커머스운영팀" },
    { id: "md_collab_procurement", label: "구매·소싱팀" },
    { id: "md_collab_logistics", label: "물류·SCM팀" },
    { id: "md_collab_partner", label: "파트너사·브랜드" },
    { id: "md_collab_dev", label: "개발팀" },
    { id: "md_collab_biz", label: "사업기획팀" },
  ],
  followUpExtensions: [
    { id: "md_result_sales_growth", label: "카테고리 매출 성장" },
    { id: "md_result_margin", label: "마진 개선" },
    { id: "md_result_inventory", label: "재고 효율화" },
    { id: "md_result_lineup", label: "상품 라인업 강화" },
    { id: "md_result_promo", label: "프로모션 성과 달성" },
    { id: "md_result_partner", label: "파트너 관계 강화" },
    { id: "md_result_trend", label: "트렌드 대응력 향상" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 카테고리 판매 실적을 분석하고 저성과 상품 교체 방향을 검토했으며, 파트너사와 시즌 기획전 참여 조건을 협의했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "카테고리별 판매 성과를 분석하고 저성과 상품 교체 방향을 검토했으며, 파트너사와 시즌 기획전 참여 조건을 협의했어요. 트렌드 모니터링 결과를 정리해 팀에 공유했습니다.",
      roleTags: ["카테고리별 판매 성과를 분석하고 개선 방향을 정리했습니다.", "파트너사·브랜드와 상품 조건, 납품 일정을 조율했습니다.", "시즌 상품과 프로모션 계획을 검토하고 기획전 방향을 협의했습니다."],
      collaborationTags: ["마케팅팀", "파트너사·브랜드", "커머스운영팀"],
      resultTags: ["카테고리 매출 성장", "상품 라인업 강화"],
    },
  },
};
