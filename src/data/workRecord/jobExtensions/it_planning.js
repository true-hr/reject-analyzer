export const IT_PLANNING_RECORD_PRESET = {
  jobId: "JOB_IT_DATA_DIGITAL_IT_PLANNING",
  label: "IT 기획",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "IT 과제 정리",
      "시스템 요구사항 검토",
      "업무 프로세스 분석",
      "IT 예산/일정 확인",
      "시스템 개선 요청 정리",
      "벤더 제안 검토",
      "운영 이슈 우선순위 조정",
    ],
    project: [
      "IT 전략 과제 수립",
      "시스템 도입 기획",
      "업무 요구사항 정의",
      "IT 로드맵 정리",
      "시스템 개선안 작성",
      "IT 투자 검토 자료 작성",
      "벤더 선정 기준 정리",
    ],
  },
  collaborationExtensions: [
    { id: "itplan_collab_business", label: "현업 부서" },
    { id: "itplan_collab_dev", label: "개발팀" },
    { id: "itplan_collab_infra", label: "인프라팀" },
    { id: "itplan_collab_security", label: "보안팀" },
    { id: "itplan_collab_vendor", label: "외부 벤더" },
    { id: "itplan_collab_executive", label: "경영진" },
    { id: "itplan_collab_ops", label: "운영팀" },
  ],
  followUpExtensions: [
    { id: "itplan_result_priority", label: "IT 과제 우선순위 명확화" },
    { id: "itplan_result_direction", label: "시스템 개선 방향 정리" },
    { id: "itplan_result_requirements", label: "현업 요구사항 구체화" },
    { id: "itplan_result_investment", label: "IT 투자 판단 근거 확보" },
    { id: "itplan_result_issues", label: "운영 이슈 감소" },
    { id: "itplan_result_vendor", label: "벤더 커뮤니케이션 개선" },
    { id: "itplan_result_risk", label: "시스템 도입 리스크 감소" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 IT 과제를 정리하고 시스템 요구사항을 검토했으며 벤더 제안서를 검토했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "IT 과제를 정리하고 시스템 요구사항을 검토했으며, 현업 부서·개발팀과 업무 프로세스를 분석해 시스템 개선 요청을 정리했어요.",
      roleTags: ["IT 과제 정리", "시스템 요구사항 검토", "업무 프로세스 분석"],
      collaborationTags: ["현업 부서", "개발팀", "인프라팀"],
      resultTags: ["IT 과제 우선순위 명확화", "현업 요구사항 구체화"],
    },
  },
};
