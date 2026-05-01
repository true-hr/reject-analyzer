export const PR_COMMUNICATIONS_RECORD_PRESET = {
  jobId: "JOB_MARKETING_PR_COMMUNICATIONS",
  label: "PR / 커뮤니케이션",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "보도자료 작성",
      "미디어 문의 대응",
      "브랜드 메시지 정리",
      "대외 커뮤니케이션 점검",
      "이슈 모니터링",
      "인터뷰 자료 준비",
      "언론 보도 현황 확인",
    ],
    project: [
      "PR 캠페인 기획",
      "미디어 커뮤니케이션 전략 수립",
      "대외 메시지 개발",
      "위기 커뮤니케이션 대응",
      "언론 관계 관리",
      "기업 이미지 개선 프로젝트",
      "보도 성과 리포트 작성",
    ],
  },
  collaborationExtensions: [
    { id: "prcomm_collab_media", label: "기자/미디어" },
    { id: "prcomm_collab_executive", label: "경영진" },
    { id: "prcomm_collab_brand", label: "브랜드팀" },
    { id: "prcomm_collab_marketing", label: "마케팅팀" },
    { id: "prcomm_collab_legal", label: "법무팀" },
    { id: "prcomm_collab_agency", label: "외부 PR대행사" },
    { id: "prcomm_collab_product", label: "제품팀" },
  ],
  followUpExtensions: [
    { id: "prcomm_result_message", label: "대외 메시지 명확화" },
    { id: "prcomm_result_exposure", label: "미디어 노출 확대" },
    { id: "prcomm_result_trust", label: "브랜드 신뢰도 개선" },
    { id: "prcomm_result_response", label: "이슈 대응력 향상" },
    { id: "prcomm_result_quality", label: "보도자료 완성도 개선" },
    { id: "prcomm_result_media_rel", label: "언론 관계 강화" },
    { id: "prcomm_result_risk", label: "커뮤니케이션 리스크 감소" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 보도자료를 작성하고 미디어 문의에 대응했으며 이슈를 모니터링했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "보도자료를 작성하고 미디어 문의에 대응했으며, 브랜드팀·마케팅팀과 대외 커뮤니케이션을 점검하고 이슈를 모니터링했어요.",
      roleTags: ["보도자료 작성", "미디어 문의 대응", "이슈 모니터링"],
      collaborationTags: ["기자/미디어", "브랜드팀", "마케팅팀"],
      resultTags: ["대외 메시지 명확화", "브랜드 신뢰도 개선"],
    },
  },
};
