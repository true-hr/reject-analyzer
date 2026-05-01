export const INDUSTRIAL_DESIGN_RECORD_PRESET = {
  jobId: "JOB_DESIGN_INDUSTRIAL_DESIGN",
  label: "산업디자인",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "제품 형태 검토",
      "사용성 요소 점검",
      "소재/마감 검토",
      "3D 모델링 수정",
      "시제품 피드백 정리",
      "제조 가능성 확인",
      "디자인 스펙 정리",
    ],
    project: [
      "제품 콘셉트 디자인",
      "사용자 중심 제품 형태 설계",
      "시제품 디자인 개선",
      "양산 가능성 검토",
      "CMF 설계",
      "제조 공정 고려 디자인",
      "제품 사용성 검증",
    ],
  },
  collaborationExtensions: [
    { id: "industrial_collab_product", label: "제품팀" },
    { id: "industrial_collab_mech", label: "기구설계" },
    { id: "industrial_collab_mfg", label: "제조팀" },
    { id: "industrial_collab_quality", label: "품질팀" },
    { id: "industrial_collab_vendor", label: "외부 제작업체" },
    { id: "industrial_collab_user", label: "사용자" },
    { id: "industrial_collab_executive", label: "경영진" },
  ],
  followUpExtensions: [
    { id: "industrial_result_usability", label: "제품 사용성 개선" },
    { id: "industrial_result_mfg", label: "제조 가능성 향상" },
    { id: "industrial_result_prototype", label: "시제품 완성도 개선" },
    { id: "industrial_result_spec", label: "디자인 스펙 명확화" },
    { id: "industrial_result_risk_reduced", label: "양산 리스크 감소" },
    { id: "industrial_result_differentiation", label: "제품 차별성 강화" },
    { id: "industrial_result_ux", label: "사용자 경험 품질 개선" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 제품 형태를 검토하고 3D 모델링을 수정했으며 시제품 피드백을 정리했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "제품 형태를 검토하고 3D 모델링을 수정했으며, 제품팀·기구설계와 소재·마감을 협의해 제조 가능성을 확인하고 디자인 스펙을 정리했어요.",
      roleTags: ["제품 형태 검토", "3D 모델링 수정", "디자인 스펙 정리"],
      collaborationTags: ["제품팀", "기구설계", "제조팀"],
      resultTags: ["제품 사용성 개선", "제조 가능성 향상"],
    },
  },
};
