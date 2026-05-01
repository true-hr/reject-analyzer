export const SUPPLIER_MANAGEMENT_RECORD_PRESET = {
  jobId: "JOB_PROCUREMENT_SCM_SUPPLIER_VENDOR_MANAGEMENT",
  label: "협력사관리",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "협력사 이슈 확인",
      "납품 품질 점검",
      "공급 조건 협의",
      "협력사 평가 자료 정리",
      "개선 요청사항 전달",
      "계약 조건 확인",
      "공급 리스크 모니터링",
    ],
    project: [
      "협력사 평가 체계 구축",
      "협력사 성과 관리",
      "공급사 품질 개선 프로젝트",
      "장기 파트너십 관리",
      "협력사 리스크 진단",
      "계약/성과 기준 정리",
      "공급사 개선 계획 수립",
    ],
  },
  collaborationExtensions: [
    { id: "suppmgmt_collab_supplier", label: "협력사" },
    { id: "suppmgmt_collab_purchasing", label: "구매팀" },
    { id: "suppmgmt_collab_quality", label: "품질팀" },
    { id: "suppmgmt_collab_production", label: "생산팀" },
    { id: "suppmgmt_collab_legal", label: "법무팀" },
    { id: "suppmgmt_collab_finance", label: "재무팀" },
    { id: "suppmgmt_collab_biz", label: "현업 부서" },
  ],
  followUpExtensions: [
    { id: "suppmgmt_result_quality", label: "협력사 품질 개선" },
    { id: "suppmgmt_result_stability", label: "공급 안정성 향상" },
    { id: "suppmgmt_result_terms", label: "계약 조건 명확화" },
    { id: "suppmgmt_result_risk_reduced", label: "공급 리스크 감소" },
    { id: "suppmgmt_result_eval_standard", label: "협력사 평가 기준 정리" },
    { id: "suppmgmt_result_partnership", label: "장기 파트너십 강화" },
    { id: "suppmgmt_result_improvement", label: "개선 요청 이행률 향상" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 협력사 이슈를 확인하고 납품 품질을 점검했으며 개선 요청사항을 전달했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "협력사 이슈를 확인하고 납품 품질을 점검했으며, 구매팀·품질팀과 공급 조건을 협의해 개선 요청사항을 전달했어요.",
      roleTags: ["협력사 이슈 확인", "납품 품질 점검", "개선 요청사항 전달"],
      collaborationTags: ["협력사", "구매팀", "품질팀"],
      resultTags: ["협력사 품질 개선", "공급 안정성 향상"],
    },
  },
};
