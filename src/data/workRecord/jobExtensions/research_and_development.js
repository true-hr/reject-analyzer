export const RESEARCH_AND_DEVELOPMENT_RECORD_PRESET = {
  jobId: "JOB_ENGINEERING_DEVELOPMENT_RESEARCH_AND_DEVELOPMENT",
  label: "연구개발(R&D)",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "연구 과제 진행",
      "실험 결과 정리",
      "기술 자료 검토",
      "프로토타입 테스트",
      "연구 데이터 분석",
      "개발 가능성 검토",
      "연구 회의 준비",
    ],
    project: [
      "연구개발 과제 수행",
      "신기술 검토",
      "실험 설계",
      "프로토타입 개발",
      "제품화 가능성 검증",
      "연구 결과 보고서 작성",
      "기술 로드맵 정리",
    ],
  },
  collaborationExtensions: [
    { id: "rnd_collab_rd", label: "연구개발팀" },
    { id: "rnd_collab_product", label: "제품팀" },
    { id: "rnd_collab_prod_eng", label: "생산기술팀" },
    { id: "rnd_collab_quality", label: "품질팀" },
    { id: "rnd_collab_institute", label: "외부 연구기관" },
    { id: "rnd_collab_patent", label: "특허 담당자" },
    { id: "rnd_collab_executive", label: "경영진" },
  ],
  followUpExtensions: [
    { id: "rnd_result_feasibility", label: "기술 가능성 검증" },
    { id: "rnd_result_direction", label: "연구 방향 명확화" },
    { id: "rnd_result_prototype", label: "프로토타입 완성도 개선" },
    { id: "rnd_result_risk", label: "제품화 리스크 감소" },
    { id: "rnd_result_reliability", label: "실험 결과 신뢰도 향상" },
    { id: "rnd_result_opportunity", label: "신기술 적용 기회 발견" },
    { id: "rnd_result_visibility", label: "연구 성과 가시화" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 연구 과제를 진행하고 실험 결과를 정리했으며 프로토타입을 테스트했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "연구 과제를 진행하고 실험 결과를 정리했으며, 연구개발팀·제품팀과 기술 자료를 검토하고 개발 가능성을 검토했어요.",
      roleTags: ["연구 과제 진행", "실험 결과 정리", "개발 가능성 검토"],
      collaborationTags: ["연구개발팀", "제품팀", "외부 연구기관"],
      resultTags: ["기술 가능성 검증", "연구 방향 명확화"],
    },
  },
};
