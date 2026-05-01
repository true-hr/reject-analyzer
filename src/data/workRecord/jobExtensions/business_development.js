export const BUSINESS_DEVELOPMENT_RECORD_PRESET = {
  jobId: "JOB_BUSINESS_BUSINESS_DEVELOPMENT",
  label: "사업개발",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "파트너십 발굴",
      "시장 기회 분석",
      "제안서 작성",
      "미팅 준비",
      "계약 협의",
      "내부 협업 조율",
      "딜 파이프라인 관리",
    ],
    project: [
      "신사업 전략 수립",
      "파트너십 계약 체결",
      "시장 진입 전략 설계",
      "비즈니스 케이스 작성",
      "사업개발 로드맵 수립",
      "제휴 모델 설계",
      "신규 채널 발굴",
    ],
  },
  collaborationExtensions: [
    { id: "bd_collab_executive", label: "경영진" },
    { id: "bd_collab_legal", label: "법무팀" },
    { id: "bd_collab_sales", label: "영업팀" },
    { id: "bd_collab_marketing", label: "마케팅팀" },
    { id: "bd_collab_pm", label: "PM" },
    { id: "bd_collab_finance", label: "재무팀" },
    { id: "bd_collab_partner", label: "외부 파트너" },
  ],
  followUpExtensions: [
    { id: "bd_result_partnership", label: "신규 파트너십 체결" },
    { id: "bd_result_market_entry", label: "시장 진입 기반 마련" },
    { id: "bd_result_revenue_opportunity", label: "매출 기회 발굴" },
    { id: "bd_result_expansion", label: "사업 확장 지원" },
    { id: "bd_result_alliance", label: "전략적 제휴 강화" },
    { id: "bd_result_biz_case", label: "비즈니스 케이스 구체화" },
    { id: "bd_result_pipeline", label: "딜 파이프라인 확보" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 잠재 파트너사 미팅을 준비하고 제안서를 작성해 사업개발 기회를 경영진에게 보고했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "잠재 파트너사 미팅을 준비하고 시장 기회를 분석해 제안서를 작성했으며, 경영진·법무팀과 계약 방향을 협의했어요.",
      roleTags: ["파트너십 발굴", "시장 기회 분석", "제안서 작성"],
      collaborationTags: ["경영진", "법무팀", "영업팀"],
      resultTags: ["신규 파트너십 체결", "매출 기회 발굴"],
    },
  },
};
