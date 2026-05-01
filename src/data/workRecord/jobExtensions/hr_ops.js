export const HR_OPS_RECORD_PRESET = {
  jobId: "JOB_HR_ORGANIZATION_HR_OPS",
  label: "HR Ops",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "인사 데이터 정리",
      "입퇴사 프로세스 처리",
      "인사 시스템 점검",
      "증명서/서류 요청 대응",
      "HR 문의 처리",
      "조직도/발령 정보 업데이트",
      "HR 운영 이슈 정리",
    ],
    project: [
      "HR 운영 프로세스 개선",
      "인사 시스템 고도화",
      "입퇴사 프로세스 표준화",
      "HR 데이터 관리 체계 정리",
      "인사 행정 자동화",
      "HR 문의 대응 기준 수립",
      "조직 정보 관리 개선",
    ],
  },
  collaborationExtensions: [
    { id: "hrops_collab_employee", label: "임직원" },
    { id: "hrops_collab_hr", label: "인사팀" },
    { id: "hrops_collab_it", label: "IT팀" },
    { id: "hrops_collab_finance", label: "재무팀" },
    { id: "hrops_collab_biz", label: "현업 부서" },
    { id: "hrops_collab_vendor", label: "외부 벤더" },
    { id: "hrops_collab_support", label: "경영지원팀" },
  ],
  followUpExtensions: [
    { id: "hrops_result_efficiency", label: "HR 운영 효율 개선" },
    { id: "hrops_result_data_accuracy", label: "인사 데이터 정확도 향상" },
    { id: "hrops_result_onoff_stable", label: "입퇴사 처리 안정화" },
    { id: "hrops_result_inquiry_speed", label: "임직원 문의 처리 속도 개선" },
    { id: "hrops_result_admin_reduced", label: "반복 행정 업무 감소" },
    { id: "hrops_result_system_usage", label: "HR 시스템 활용도 개선" },
    { id: "hrops_result_standard", label: "운영 기준 표준화" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 인사 데이터를 정리하고 입퇴사 프로세스를 처리했으며 HR 문의에 대응했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "인사 데이터를 정리하고 입퇴사 프로세스를 처리했으며, IT팀과 인사 시스템 이슈를 점검해 임직원 문의를 해결했어요.",
      roleTags: ["인사 데이터 정리", "입퇴사 프로세스 처리", "HR 문의 처리"],
      collaborationTags: ["임직원", "인사팀", "IT팀"],
      resultTags: ["HR 운영 효율 개선", "입퇴사 처리 안정화"],
    },
  },
};
