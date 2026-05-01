export const PROCUREMENT_OPERATIONS_RECORD_PRESET = {
  jobId: "JOB_PROCUREMENT_SCM_PROCUREMENT",
  label: "조달",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "조달 요청 검토",
      "조달 일정 확인",
      "공급 조건 검토",
      "계약/발주 진행 확인",
      "조달 리스크 점검",
      "예산 사용 현황 확인",
      "이해관계자 요청 조율",
    ],
    project: [
      "조달 계획 수립",
      "조달 프로세스 개선",
      "공급 조건 협상",
      "조달 계약 관리 체계 정리",
      "예산 기반 조달 기준 수립",
      "조달 리스크 관리",
      "조달 성과 관리 체계 구축",
    ],
  },
  collaborationExtensions: [
    { id: "procops_collab_biz", label: "현업 부서" },
    { id: "procops_collab_purchasing", label: "구매팀" },
    { id: "procops_collab_finance", label: "재무팀" },
    { id: "procops_collab_legal", label: "법무팀" },
    { id: "procops_collab_supplier", label: "협력사" },
    { id: "procops_collab_executive", label: "경영진" },
    { id: "procops_collab_vendor", label: "외부 공급사" },
  ],
  followUpExtensions: [
    { id: "procops_result_schedule", label: "조달 일정 안정화" },
    { id: "procops_result_terms", label: "공급 조건 개선" },
    { id: "procops_result_risk_reduced", label: "조달 리스크 감소" },
    { id: "procops_result_transparency", label: "예산 집행 투명성 개선" },
    { id: "procops_result_contract", label: "계약 관리 정확도 향상" },
    { id: "procops_result_speed", label: "현업 요청 처리 속도 개선" },
    { id: "procops_result_standard", label: "조달 프로세스 표준화" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 조달 요청을 검토하고 조달 일정을 확인했으며 이해관계자 요청을 조율했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "조달 요청을 검토하고 계약/발주 진행 현황을 확인했으며, 재무팀·법무팀과 공급 조건을 검토해 조달 리스크를 점검했어요.",
      roleTags: ["조달 요청 검토", "계약/발주 진행 확인", "조달 리스크 점검"],
      collaborationTags: ["현업 부서", "재무팀", "법무팀"],
      resultTags: ["조달 일정 안정화", "조달 리스크 감소"],
    },
  },
};
