export const CONSULTING_RECORD_PRESET = {
  jobId: "JOB_RESEARCH_PROFESSIONAL_CONSULTING",
  label: "컨설팅",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "고객사 이슈 정리",
      "인터뷰/자료 수집",
      "현황 분석",
      "개선안 도출",
      "보고서 작성",
      "고객 미팅 준비",
      "실행 과제 정리",
    ],
    project: [
      "컨설팅 프로젝트 진단",
      "고객사 문제 정의",
      "개선 전략 수립",
      "벤치마크 분석",
      "실행 로드맵 설계",
      "경영진 보고 자료 작성",
      "변화관리 실행 지원",
    ],
  },
  collaborationExtensions: [
    { id: "consult_collab_client", label: "고객사" },
    { id: "consult_collab_executive", label: "경영진" },
    { id: "consult_collab_business", label: "현업 담당자" },
    { id: "consult_collab_team", label: "프로젝트팀" },
    { id: "consult_collab_expert", label: "외부 전문가" },
    { id: "consult_collab_data", label: "데이터팀" },
    { id: "consult_collab_partner", label: "파트너사" },
  ],
  followUpExtensions: [
    { id: "consult_result_problem", label: "고객 문제 정의 명확화" },
    { id: "consult_result_direction", label: "개선 방향 도출" },
    { id: "consult_result_tasks", label: "실행 과제 구체화" },
    { id: "consult_result_basis", label: "의사결정 근거 제공" },
    { id: "consult_result_consensus", label: "고객사 합의 형성" },
    { id: "consult_result_report", label: "보고서 완성도 개선" },
    { id: "consult_result_execution", label: "프로젝트 실행력 향상" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 고객사 이슈를 정리하고 인터뷰 자료를 수집했으며 현황을 분석했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "고객사 이슈를 정리하고 인터뷰 자료를 수집했으며, 현업 담당자·프로젝트팀과 현황을 분석해 개선안을 도출하고 보고서를 작성했어요.",
      roleTags: ["고객사 이슈 정리", "인터뷰/자료 수집", "개선안 도출"],
      collaborationTags: ["고객사", "현업 담당자", "프로젝트팀"],
      resultTags: ["고객 문제 정의 명확화", "개선 방향 도출"],
    },
  },
};
