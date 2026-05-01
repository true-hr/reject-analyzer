export const REGULATORY_AFFAIRS_RECORD_PRESET = {
  jobId: "JOB_RESEARCH_PROFESSIONAL_REGULATORY_AFFAIRS",
  label: "규제대응 / RA",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "규제 요건 확인",
      "인허가 자료 검토",
      "규정 변경 모니터링",
      "RA 문서 정리",
      "규제 리스크 검토",
      "관계기관 문의 대응",
      "제품/서비스 기준 확인",
    ],
    project: [
      "인허가 전략 수립",
      "규제 대응 프로세스 정리",
      "허가 자료 패키지 작성",
      "규제 리스크 평가",
      "제품 출시 전 규제 검토",
      "관계기관 대응 자료 작성",
      "RA 문서 관리 체계 개선",
    ],
  },
  collaborationExtensions: [
    { id: "ra_collab_rd", label: "연구개발팀" },
    { id: "ra_collab_quality", label: "품질팀" },
    { id: "ra_collab_legal", label: "법무팀" },
    { id: "ra_collab_product", label: "제품팀" },
    { id: "ra_collab_authority", label: "관계기관" },
    { id: "ra_collab_consultant", label: "외부 컨설턴트" },
    { id: "ra_collab_executive", label: "경영진" },
  ],
  followUpExtensions: [
    { id: "ra_result_risk", label: "인허가 리스크 감소" },
    { id: "ra_result_response", label: "규제 대응력 개선" },
    { id: "ra_result_delay", label: "출시 지연 가능성 감소" },
    { id: "ra_result_doc", label: "RA 문서 완성도 향상" },
    { id: "ra_result_authority", label: "관계기관 대응 안정화" },
    { id: "ra_result_change", label: "규정 변경 대응 기준 정리" },
    { id: "ra_result_compliance", label: "제품 규제 적합성 확보" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 규제 요건을 확인하고 인허가 자료를 검토했으며 규정 변경 사항을 모니터링했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "규제 요건을 확인하고 인허가 자료를 검토했으며, 품질팀·법무팀과 규제 리스크를 검토하고 RA 문서를 정리했어요.",
      roleTags: ["규제 요건 확인", "인허가 자료 검토", "규제 리스크 검토"],
      collaborationTags: ["품질팀", "법무팀", "연구개발팀"],
      resultTags: ["인허가 리스크 감소", "규제 대응력 개선"],
    },
  },
};
