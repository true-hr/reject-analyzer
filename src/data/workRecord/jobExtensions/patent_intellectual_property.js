export const PATENT_INTELLECTUAL_PROPERTY_RECORD_PRESET = {
  jobId: "JOB_RESEARCH_PROFESSIONAL_PATENT_INTELLECTUAL_PROPERTY",
  label: "특허 / 지식재산",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "특허 검색",
      "선행기술 조사",
      "출원 자료 정리",
      "지식재산 이슈 검토",
      "특허 명세서 검토",
      "발명자 인터뷰",
      "IP 포트폴리오 점검",
    ],
    project: [
      "특허 출원 전략 수립",
      "선행기술 조사 프로젝트",
      "IP 포트폴리오 관리",
      "특허 분쟁 리스크 검토",
      "기술 권리화 전략 수립",
      "특허맵 작성",
      "지식재산 관리 프로세스 개선",
    ],
  },
  collaborationExtensions: [
    { id: "patent_collab_rd", label: "연구개발팀" },
    { id: "patent_collab_inventor", label: "발명자" },
    { id: "patent_collab_lawfirm", label: "특허법인" },
    { id: "patent_collab_legal", label: "법무팀" },
    { id: "patent_collab_product", label: "제품팀" },
    { id: "patent_collab_executive", label: "경영진" },
    { id: "patent_collab_expert", label: "외부 전문가" },
  ],
  followUpExtensions: [
    { id: "patent_result_filing", label: "특허 출원 가능성 확보" },
    { id: "patent_result_prior_art", label: "선행기술 리스크 감소" },
    { id: "patent_result_rights", label: "기술 권리화 방향 명확화" },
    { id: "patent_result_portfolio", label: "IP 포트폴리오 강화" },
    { id: "patent_result_dispute", label: "특허 분쟁 리스크 점검" },
    { id: "patent_result_protection", label: "연구성과 보호 가능성 향상" },
    { id: "patent_result_system", label: "지식재산 관리 체계화" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 특허를 검색하고 선행기술을 조사했으며 출원 자료를 정리했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "특허를 검색하고 선행기술을 조사했으며, 연구개발팀·발명자와 특허 명세서를 검토하고 IP 포트폴리오를 점검했어요.",
      roleTags: ["특허 검색", "선행기술 조사", "IP 포트폴리오 점검"],
      collaborationTags: ["연구개발팀", "발명자", "특허법인"],
      resultTags: ["특허 출원 가능성 확보", "선행기술 리스크 감소"],
    },
  },
};
