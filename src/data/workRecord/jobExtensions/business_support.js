export const BUSINESS_SUPPORT_RECORD_PRESET = {
  jobId: "JOB_BUSINESS_BUSINESS_SUPPORT",
  label: "경영지원",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "내부 요청 처리",
      "계약/문서 관리",
      "비용/정산 확인",
      "사내 운영 지원",
      "총무 업무 처리",
      "거래처 커뮤니케이션",
      "경영지원 이슈 정리",
    ],
    project: [
      "경영지원 프로세스 개선",
      "사내 운영 기준 정리",
      "계약/문서 관리 체계 구축",
      "비용 처리 프로세스 정비",
      "총무 운영 체계 개선",
      "내부 지원 서비스 개선",
      "반복 행정 업무 자동화",
    ],
  },
  collaborationExtensions: [
    { id: "bizsupport_collab_employee", label: "임직원" },
    { id: "bizsupport_collab_finance", label: "재무팀" },
    { id: "bizsupport_collab_legal", label: "법무팀" },
    { id: "bizsupport_collab_hr", label: "인사팀" },
    { id: "bizsupport_collab_vendor", label: "거래처" },
    { id: "bizsupport_collab_executive", label: "경영진" },
    { id: "bizsupport_collab_partner", label: "외부 파트너" },
  ],
  followUpExtensions: [
    { id: "bizsupport_result_satisfaction", label: "내부 지원 만족도 개선" },
    { id: "bizsupport_result_speed", label: "행정 처리 속도 향상" },
    { id: "bizsupport_result_error_reduced", label: "비용 처리 오류 감소" },
    { id: "bizsupport_result_doc_stable", label: "문서 관리 안정화" },
    { id: "bizsupport_result_admin_reduced", label: "반복 업무 감소" },
    { id: "bizsupport_result_standard", label: "사내 운영 기준 명확화" },
    { id: "bizsupport_result_efficiency", label: "조직 운영 효율 개선" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 내부 요청을 처리하고 계약/문서를 관리했으며 비용/정산을 확인했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "내부 요청을 처리하고 계약/문서를 관리했으며, 재무팀·법무팀과 비용 정산을 확인하고 거래처 커뮤니케이션을 진행했어요.",
      roleTags: ["내부 요청 처리", "계약/문서 관리", "비용/정산 확인"],
      collaborationTags: ["임직원", "재무팀", "법무팀"],
      resultTags: ["행정 처리 속도 향상", "문서 관리 안정화"],
    },
  },
};
