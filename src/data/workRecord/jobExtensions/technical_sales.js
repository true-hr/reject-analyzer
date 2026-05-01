export const TECHNICAL_SALES_RECORD_PRESET = {
  jobId: "JOB_SALES_TECHNICAL_SALES",
  label: "기술영업",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "기술 요구사항 확인",
      "제품 사양 설명",
      "고객 기술 문의 대응",
      "데모 준비",
      "기술 자료 검토",
      "도입 가능성 점검",
      "기술 이슈 전달",
    ],
    project: [
      "기술 제안 전략 수립",
      "PoC 요구사항 정리",
      "기술 검증 지원",
      "제품 사양 비교 자료 작성",
      "고객 기술 환경 분석",
      "기술 리스크 점검",
      "도입 설계 협의",
    ],
  },
  collaborationExtensions: [
    { id: "tsales_collab_customer", label: "고객사" },
    { id: "tsales_collab_tech_contact", label: "기술 담당자" },
    { id: "tsales_collab_product", label: "제품팀" },
    { id: "tsales_collab_dev", label: "개발팀" },
    { id: "tsales_collab_se", label: "솔루션 엔지니어" },
    { id: "tsales_collab_sales", label: "영업팀" },
    { id: "tsales_collab_partner", label: "파트너사" },
  ],
  followUpExtensions: [
    { id: "tsales_result_tech_understanding", label: "기술 이해도 개선" },
    { id: "tsales_result_poc_possible", label: "PoC 가능성 확보" },
    { id: "tsales_result_risk_reduced", label: "도입 리스크 감소" },
    { id: "tsales_result_needs_clear", label: "고객 요구사항 명확화" },
    { id: "tsales_result_trust", label: "기술 신뢰도 향상" },
    { id: "tsales_result_proposal_strength", label: "제안 설득력 강화" },
    { id: "tsales_result_next_review", label: "후속 기술 검토 확정" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 고객 기술 문의에 대응하고 데모를 준비해 도입 가능성을 점검했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "고객 기술 요구사항을 확인하고 제품 사양을 설명해 데모를 준비했으며, 기술팀·솔루션 엔지니어와 도입 가능성을 점검했어요.",
      roleTags: ["기술 요구사항 확인", "제품 사양 설명", "데모 준비"],
      collaborationTags: ["고객사", "기술 담당자", "솔루션 엔지니어"],
      resultTags: ["기술 이해도 개선", "PoC 가능성 확보"],
    },
  },
};
