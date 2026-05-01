export const PUBLIC_PROGRAM_OPERATIONS_RECORD_PRESET = {
  jobId: "JOB_PUBLIC_ADMINISTRATION_SUPPORT_PUBLIC_PROGRAM_OPERATIONS",
  label: "공공사업 운영",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "사업 참여자 관리",
      "지원사업 일정 확인",
      "제출 서류 검토",
      "사업 운영 현황 점검",
      "예산 집행 자료 정리",
      "성과 지표 확인",
      "공공기관 요청 대응",
    ],
    project: [
      "공공사업 운영 체계 구축",
      "지원사업 운영 프로세스 개선",
      "참여자 관리 기준 정리",
      "예산/성과 관리 체계화",
      "사업 결과 보고서 작성",
      "공공기관 대응 자료 작성",
      "운영 리스크 관리",
    ],
  },
  collaborationExtensions: [
    { id: "pubprog_collab_public", label: "공공기관" },
    { id: "pubprog_collab_participant", label: "사업 참여자" },
    { id: "pubprog_collab_ops", label: "운영팀" },
    { id: "pubprog_collab_finance", label: "재무팀" },
    { id: "pubprog_collab_partner", label: "외부 파트너" },
    { id: "pubprog_collab_dept", label: "현업 담당자" },
    { id: "pubprog_collab_evaluator", label: "평가기관" },
  ],
  followUpExtensions: [
    { id: "pubprog_result_stability", label: "사업 운영 안정화" },
    { id: "pubprog_result_error", label: "제출 오류 감소" },
    { id: "pubprog_result_accuracy", label: "참여자 관리 정확도 개선" },
    { id: "pubprog_result_transparency", label: "예산 집행 투명성 향상" },
    { id: "pubprog_result_performance", label: "성과 관리 체계화" },
    { id: "pubprog_result_response", label: "공공기관 대응력 개선" },
    { id: "pubprog_result_risk", label: "사업 리스크 감소" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 사업 참여자를 관리하고 지원사업 일정을 확인했으며 제출 서류를 검토했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "사업 참여자를 관리하고 제출 서류를 검토했으며, 공공기관·운영팀과 사업 운영 현황을 점검하고 예산 집행 자료를 정리했어요.",
      roleTags: ["사업 참여자 관리", "제출 서류 검토", "예산 집행 자료 정리"],
      collaborationTags: ["공공기관", "운영팀", "재무팀"],
      resultTags: ["사업 운영 안정화", "제출 오류 감소"],
    },
  },
};
