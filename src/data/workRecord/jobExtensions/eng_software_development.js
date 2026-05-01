export const ENG_SOFTWARE_DEVELOPMENT_RECORD_PRESET = {
  jobId: "JOB_ENGINEERING_DEVELOPMENT_SOFTWARE_DEVELOPMENT",
  label: "소프트웨어개발",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "기능 구현",
      "소프트웨어 오류 수정",
      "요구사항 확인",
      "코드 리뷰",
      "인터페이스 연동",
      "기술 문서 정리",
      "릴리즈 이슈 점검",
    ],
    project: [
      "소프트웨어 모듈 설계",
      "제품 기능 개발",
      "시스템 연동 구조 구현",
      "성능 개선",
      "소프트웨어 품질 개선",
      "릴리즈 안정화",
      "기술 부채 개선",
    ],
  },
  collaborationExtensions: [
    { id: "swdev_collab_dev", label: "개발팀" },
    { id: "swdev_collab_pm", label: "기획자" },
    { id: "swdev_collab_qa", label: "QA팀" },
    { id: "swdev_collab_product", label: "제품팀" },
    { id: "swdev_collab_hw", label: "하드웨어팀" },
    { id: "swdev_collab_cs", label: "고객지원팀" },
    { id: "swdev_collab_partner", label: "외부 기술 파트너" },
  ],
  followUpExtensions: [
    { id: "swdev_result_completeness", label: "기능 완성도 개선" },
    { id: "swdev_result_bug", label: "소프트웨어 오류 감소" },
    { id: "swdev_result_integration", label: "시스템 연동 안정화" },
    { id: "swdev_result_release", label: "릴리즈 품질 향상" },
    { id: "swdev_result_productivity", label: "개발 생산성 개선" },
    { id: "swdev_result_ux", label: "사용자 불편 감소" },
    { id: "swdev_result_stability", label: "제품 안정성 향상" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 기능을 구현하고 소프트웨어 오류를 수정했으며 요구사항을 확인했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "기능을 구현하고 소프트웨어 오류를 수정했으며, 개발팀·QA팀과 코드 리뷰를 진행하고 인터페이스 연동을 점검했어요.",
      roleTags: ["기능 구현", "소프트웨어 오류 수정", "코드 리뷰"],
      collaborationTags: ["개발팀", "QA팀", "제품팀"],
      resultTags: ["기능 완성도 개선", "소프트웨어 오류 감소"],
    },
  },
};
