export const PARTNER_CHANNEL_SALES_RECORD_PRESET = {
  jobId: "JOB_SALES_PARTNER_CHANNEL_SALES",
  label: "파트너/채널영업",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "파트너 미팅",
      "채널 실적 점검",
      "공동 영업 기회 확인",
      "파트너 문의 대응",
      "판매 정책 안내",
      "리셀러 이슈 정리",
      "공동 프로모션 협의",
    ],
    project: [
      "파트너십 영업 전략 수립",
      "채널 판매 구조 개선",
      "파트너 온보딩 체계 정리",
      "공동 영업 프로그램 기획",
      "리셀러 관리 기준 수립",
      "채널 성과 리포트 작성",
      "파트너 인센티브 구조 검토",
    ],
  },
  collaborationExtensions: [
    { id: "chsales_collab_partner", label: "파트너사" },
    { id: "chsales_collab_reseller", label: "리셀러" },
    { id: "chsales_collab_sales", label: "영업팀" },
    { id: "chsales_collab_marketing", label: "마케팅팀" },
    { id: "chsales_collab_product", label: "제품팀" },
    { id: "chsales_collab_legal", label: "법무팀" },
    { id: "chsales_collab_executive", label: "경영진" },
  ],
  followUpExtensions: [
    { id: "chsales_result_revenue", label: "파트너 매출 기회 확대" },
    { id: "chsales_result_performance", label: "채널 성과 개선" },
    { id: "chsales_result_ops_clear", label: "파트너 운영 기준 명확화" },
    { id: "chsales_result_coop_opportunity", label: "공동 영업 기회 확보" },
    { id: "chsales_result_reseller_issue", label: "리셀러 이슈 감소" },
    { id: "chsales_result_channel_activity", label: "채널 활성도 개선" },
    { id: "chsales_result_partnership_stable", label: "파트너십 안정화" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 파트너 미팅을 진행하고 채널 실적을 점검해 공동 프로모션 방향을 협의했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "파트너 미팅에서 채널 실적을 점검하고 리셀러 이슈를 정리했으며, 영업팀·마케팅팀과 공동 영업 기회를 확인했어요.",
      roleTags: ["파트너 미팅", "채널 실적 점검", "공동 영업 기회 확인"],
      collaborationTags: ["파트너사", "영업팀", "마케팅팀"],
      resultTags: ["채널 성과 개선", "파트너십 안정화"],
    },
  },
};
