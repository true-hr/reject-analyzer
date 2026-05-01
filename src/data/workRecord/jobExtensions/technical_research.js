export const TECHNICAL_RESEARCH_RECORD_PRESET = {
  jobId: "JOB_RESEARCH_PROFESSIONAL_TECHNICAL_RESEARCH",
  label: "기술연구",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "기술 자료 조사",
      "실험 결과 정리",
      "논문/특허 검토",
      "기술 적용 가능성 분석",
      "연구 데이터 정리",
      "기술 트렌드 확인",
      "연구 과제 회의 준비",
    ],
    project: [
      "기술 연구 과제 수행",
      "실험 설계",
      "기술 타당성 검토",
      "프로토타입 검증",
      "연구 결과 보고서 작성",
      "기술 로드맵 정리",
      "신기술 적용 방안 도출",
    ],
  },
  collaborationExtensions: [
    { id: "techres_collab_rd", label: "연구개발팀" },
    { id: "techres_collab_product", label: "제품팀" },
    { id: "techres_collab_data", label: "데이터팀" },
    { id: "techres_collab_institute", label: "외부 연구기관" },
    { id: "techres_collab_patent", label: "특허 담당자" },
    { id: "techres_collab_executive", label: "경영진" },
    { id: "techres_collab_business", label: "현업 부서" },
  ],
  followUpExtensions: [
    { id: "techres_result_feasibility", label: "기술 적용 가능성 확인" },
    { id: "techres_result_direction", label: "연구 방향 명확화" },
    { id: "techres_result_validation", label: "실험 결과 검증" },
    { id: "techres_result_risk", label: "기술 리스크 감소" },
    { id: "techres_result_opportunity", label: "신기술 기회 발견" },
    { id: "techres_result_data", label: "연구 자료 체계화" },
    { id: "techres_result_product", label: "제품화 가능성 검토" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 기술 자료를 조사하고 실험 결과를 정리했으며 기술 적용 가능성을 분석했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "기술 자료를 조사하고 실험 결과를 정리했으며, 연구개발팀·제품팀과 논문과 특허를 검토해 기술 트렌드를 확인했어요.",
      roleTags: ["기술 자료 조사", "실험 결과 정리", "기술 적용 가능성 분석"],
      collaborationTags: ["연구개발팀", "제품팀", "외부 연구기관"],
      resultTags: ["기술 적용 가능성 확인", "연구 방향 명확화"],
    },
  },
};
