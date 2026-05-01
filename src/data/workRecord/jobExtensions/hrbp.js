export const HRBP_RECORD_PRESET = {
  jobId: "JOB_HR_ORGANIZATION_HRBP",
  label: "HRBP",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "현업 이슈 파악",
      "조직 리더 미팅",
      "인력 운영 상담",
      "조직 갈등 조율",
      "채용 수요 확인",
      "성과 관리 지원",
      "조직 변화 모니터링",
    ],
    project: [
      "조직 진단",
      "인력 운영 전략 수립",
      "리더십 이슈 조율",
      "조직 개편 지원",
      "성과 관리 프로세스 개선",
      "핵심 인재 관리",
      "현업 HR 과제 실행",
    ],
  },
  collaborationExtensions: [
    { id: "hrbp_collab_team_leader", label: "현업 리더" },
    { id: "hrbp_collab_executive", label: "경영진" },
    { id: "hrbp_collab_hr", label: "인사팀" },
    { id: "hrbp_collab_recruiting", label: "채용팀" },
    { id: "hrbp_collab_employee", label: "임직원" },
    { id: "hrbp_collab_labor", label: "노무사" },
    { id: "hrbp_collab_learning", label: "교육 담당자" },
  ],
  followUpExtensions: [
    { id: "hrbp_result_issue_resolved", label: "현업 이슈 해결" },
    { id: "hrbp_result_comm_improved", label: "조직 커뮤니케이션 개선" },
    { id: "hrbp_result_risk_reduced", label: "인력 운영 리스크 감소" },
    { id: "hrbp_result_leader_support", label: "리더 의사결정 지원" },
    { id: "hrbp_result_engagement", label: "조직 몰입도 개선" },
    { id: "hrbp_result_perf_standard", label: "성과 관리 기준 정리" },
    { id: "hrbp_result_talent_retained", label: "핵심 인재 유지 지원" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 현업 리더 미팅에서 조직 이슈를 파악하고, 채용 수요를 확인해 인력 운영 방향을 조율했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "현업 리더와 조직 갈등 이슈를 조율하고 성과 관리 기준을 정리했으며, 경영진에게 조직 변화 현황을 보고했어요.",
      roleTags: ["조직 리더 미팅", "조직 갈등 조율", "성과 관리 지원"],
      collaborationTags: ["현업 리더", "경영진", "인사팀"],
      resultTags: ["현업 이슈 해결", "성과 관리 기준 정리"],
    },
  },
};
