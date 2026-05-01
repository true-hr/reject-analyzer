export const OPERATIONS_MANAGEMENT_RECORD_PRESET = {
  jobId: "JOB_BUSINESS_OPERATIONS_MANAGEMENT",
  label: "운영관리",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "운영 현황 점검",
      "업무 프로세스 관리",
      "운영 지표 확인",
      "부서 간 이슈 조율",
      "리소스 배분 점검",
      "운영 리스크 확인",
      "개선 과제 정리",
    ],
    project: [
      "운영 체계 개선",
      "업무 프로세스 표준화",
      "운영 KPI 관리 체계 구축",
      "조직 간 협업 구조 정리",
      "운영 리스크 관리",
      "비용/리소스 효율화",
      "운영 개선 프로젝트 추진",
    ],
  },
  collaborationExtensions: [
    { id: "opsmgmt_collab_ops", label: "운영팀" },
    { id: "opsmgmt_collab_biz", label: "현업 부서" },
    { id: "opsmgmt_collab_executive", label: "경영진" },
    { id: "opsmgmt_collab_finance", label: "재무팀" },
    { id: "opsmgmt_collab_hr", label: "HR팀" },
    { id: "opsmgmt_collab_partner", label: "외부 파트너" },
    { id: "opsmgmt_collab_cs", label: "고객지원팀" },
  ],
  followUpExtensions: [
    { id: "opsmgmt_result_efficiency", label: "운영 효율 개선" },
    { id: "opsmgmt_result_bottleneck", label: "부서 간 병목 해소" },
    { id: "opsmgmt_result_standard", label: "업무 기준 명확화" },
    { id: "opsmgmt_result_resource", label: "리소스 활용도 개선" },
    { id: "opsmgmt_result_risk_reduced", label: "운영 리스크 감소" },
    { id: "opsmgmt_result_kpi", label: "KPI 관리 체계화" },
    { id: "opsmgmt_result_admin_reduced", label: "반복 업무 감소" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 운영 현황을 점검하고 부서 간 이슈를 조율했으며 운영 지표를 확인했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "운영 현황을 점검하고 업무 프로세스를 관리했으며, 현업 부서·재무팀과 리소스 배분을 점검해 부서 간 이슈를 조율했어요.",
      roleTags: ["운영 현황 점검", "업무 프로세스 관리", "부서 간 이슈 조율"],
      collaborationTags: ["운영팀", "현업 부서", "재무팀"],
      resultTags: ["운영 효율 개선", "부서 간 병목 해소"],
    },
  },
};
