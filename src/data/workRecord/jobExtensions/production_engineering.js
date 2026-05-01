export const PRODUCTION_ENGINEERING_RECORD_PRESET = {
  jobId: "JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_ENGINEERING",
  label: "생산기술",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "생산성 개선안 검토",
      "설비 투자 요청 검토",
      "치공구 개선",
      "라인 레이아웃 점검",
      "표준 공수 확인",
      "생산 기술 이슈 대응",
      "현장 개선 요청 정리",
    ],
    project: [
      "생산성 향상 프로젝트",
      "라인 최적화",
      "설비 도입 검토",
      "치공구 개선 과제",
      "표준 공수 산정",
      "작업 방식 개선",
      "양산성 검토",
    ],
  },
  collaborationExtensions: [
    { id: "prodeng_collab_production", label: "생산팀" },
    { id: "prodeng_collab_equipment", label: "설비팀" },
    { id: "prodeng_collab_quality", label: "품질팀" },
    { id: "prodeng_collab_process", label: "공정기술팀" },
    { id: "prodeng_collab_rd", label: "연구개발팀" },
    { id: "prodeng_collab_worker", label: "현장 작업자" },
    { id: "prodeng_collab_supplier", label: "협력사" },
  ],
  followUpExtensions: [
    { id: "prodeng_result_productivity", label: "생산성 향상" },
    { id: "prodeng_result_efficiency", label: "작업 효율 개선" },
    { id: "prodeng_result_investment", label: "설비 투자 타당성 확보" },
    { id: "prodeng_result_line", label: "라인 운영 개선" },
    { id: "prodeng_result_man_hour", label: "표준 공수 명확화" },
    { id: "prodeng_result_ergonomics", label: "현장 불편 감소" },
    { id: "prodeng_result_mass_prod", label: "양산 안정성 향상" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 생산성 개선안을 검토하고 치공구 개선을 진행했으며 현장 개선 요청을 정리했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "생산성 개선안을 검토하고 치공구 개선을 진행했으며, 생산팀·설비팀과 설비 투자 요청을 검토해 현장 개선 요청을 정리했어요.",
      roleTags: ["생산성 개선안 검토", "치공구 개선", "현장 개선 요청 정리"],
      collaborationTags: ["생산팀", "설비팀", "공정기술팀"],
      resultTags: ["생산성 향상", "작업 효율 개선"],
    },
  },
};
