export const TALENT_DEVELOPMENT_RECORD_PRESET = {
  jobId: "JOB_HR_ORGANIZATION_TALENT_DEVELOPMENT",
  label: "인재육성",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "핵심 인재 현황 점검",
      "역량 개발 계획 정리",
      "성장 면담 자료 준비",
      "육성 프로그램 운영",
      "직무 역량 기준 검토",
      "승계 후보자 점검",
      "개발 과제 피드백 정리",
    ],
    project: [
      "인재육성 체계 설계",
      "핵심 인재 관리 프로그램 운영",
      "승계 계획 수립",
      "역량 개발 로드맵 작성",
      "직무별 성장 경로 정리",
      "멘토링 프로그램 기획",
      "인재 리뷰 자료 작성",
    ],
  },
  collaborationExtensions: [
    { id: "td_collab_leader", label: "현업 리더" },
    { id: "td_collab_talent", label: "핵심 인재" },
    { id: "td_collab_hr", label: "인사팀" },
    { id: "td_collab_executive", label: "경영진" },
    { id: "td_collab_learning", label: "교육 담당자" },
    { id: "td_collab_consultant", label: "외부 컨설턴트" },
    { id: "td_collab_culture", label: "조직문화 담당자" },
  ],
  followUpExtensions: [
    { id: "td_result_retention", label: "핵심 인재 유지 지원" },
    { id: "td_result_growth_path", label: "성장 경로 명확화" },
    { id: "td_result_capability_direction", label: "역량 개발 방향 정리" },
    { id: "td_result_succession_risk", label: "승계 리스크 감소" },
    { id: "td_result_leader_base", label: "리더 육성 기반 마련" },
    { id: "td_result_review_quality", label: "인재 리뷰 품질 개선" },
    { id: "td_result_org_capability", label: "조직 역량 강화" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 핵심 인재 현황을 점검하고 역량 개발 계획을 정리해 성장 면담 자료를 준비했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "핵심 인재 현황을 점검하고 역량 개발 계획을 정리했으며, 현업 리더·경영진과 승계 후보자 현황을 공유했어요.",
      roleTags: ["핵심 인재 현황 점검", "역량 개발 계획 정리", "승계 후보자 점검"],
      collaborationTags: ["현업 리더", "인사팀", "경영진"],
      resultTags: ["핵심 인재 유지 지원", "성장 경로 명확화"],
    },
  },
};
