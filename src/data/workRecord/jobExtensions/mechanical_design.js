export const MECHANICAL_DESIGN_RECORD_PRESET = {
  jobId: "JOB_ENGINEERING_DEVELOPMENT_MECHANICAL_DESIGN",
  label: "기구설계",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "3D 모델링 수정",
      "도면 검토",
      "부품 간섭 확인",
      "공차 조건 점검",
      "시제품 피드백 반영",
      "소재/가공 조건 검토",
      "설계 변경 이슈 정리",
    ],
    project: [
      "기구 구조 설계",
      "제품 외형/내부 구조 설계",
      "시제품 설계 개선",
      "양산성 검토",
      "부품 설계 최적화",
      "도면 표준화",
      "설계 변경 관리",
    ],
  },
  collaborationExtensions: [
    { id: "mechdes_collab_product", label: "제품팀" },
    { id: "mechdes_collab_circuit", label: "회로설계팀" },
    { id: "mechdes_collab_prod", label: "생산기술팀" },
    { id: "mechdes_collab_quality", label: "품질팀" },
    { id: "mechdes_collab_mfg", label: "제조업체" },
    { id: "mechdes_collab_vendor", label: "외부 가공업체" },
    { id: "mechdes_collab_rd", label: "연구개발팀" },
  ],
  followUpExtensions: [
    { id: "mechdes_result_completeness", label: "설계 완성도 개선" },
    { id: "mechdes_result_interference", label: "부품 간섭 리스크 감소" },
    { id: "mechdes_result_mass", label: "양산 가능성 향상" },
    { id: "mechdes_result_prototype", label: "시제품 품질 개선" },
    { id: "mechdes_result_error", label: "가공 오류 감소" },
    { id: "mechdes_result_change", label: "설계 변경 관리 안정화" },
    { id: "mechdes_result_reliability", label: "제품 구조 신뢰도 향상" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 3D 모델링을 수정하고 도면을 검토했으며 부품 간섭을 확인했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "3D 모델링을 수정하고 도면을 검토했으며, 회로설계팀·생산기술팀과 부품 간섭을 확인하고 공차 조건을 점검했어요.",
      roleTags: ["3D 모델링 수정", "도면 검토", "부품 간섭 확인"],
      collaborationTags: ["회로설계팀", "생산기술팀", "품질팀"],
      resultTags: ["설계 완성도 개선", "부품 간섭 리스크 감소"],
    },
  },
};
