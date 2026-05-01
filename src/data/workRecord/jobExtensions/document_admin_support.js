export const DOCUMENT_ADMIN_SUPPORT_RECORD_PRESET = {
  jobId: "JOB_PUBLIC_ADMINISTRATION_SUPPORT_DOCUMENT_ADMIN_SUPPORT",
  label: "문서관리 / 사무지원",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "문서 접수/분류",
      "사무 요청 처리",
      "자료 정리",
      "양식 업데이트",
      "파일/문서 보관 관리",
      "회의 자료 준비",
      "사무 운영 이슈 대응",
    ],
    project: [
      "문서관리 체계 개선",
      "사무지원 프로세스 표준화",
      "문서 양식 정비",
      "자료 보관 기준 수립",
      "내부 요청 처리 체계 개선",
      "문서 검색/활용성 개선",
      "사무 업무 자동화 기획",
    ],
  },
  collaborationExtensions: [
    { id: "docadm_collab_internal", label: "내부 구성원" },
    { id: "docadm_collab_dept", label: "현업 부서" },
    { id: "docadm_collab_mgmt", label: "경영지원팀" },
    { id: "docadm_collab_legal", label: "법무팀" },
    { id: "docadm_collab_finance", label: "재무팀" },
    { id: "docadm_collab_vendor", label: "외부 거래처" },
    { id: "docadm_collab_ops", label: "운영팀" },
  ],
  followUpExtensions: [
    { id: "docadm_result_search", label: "문서 검색성 개선" },
    { id: "docadm_result_missing", label: "자료 누락 감소" },
    { id: "docadm_result_speed", label: "사무 처리 속도 향상" },
    { id: "docadm_result_standard", label: "문서 관리 기준 명확화" },
    { id: "docadm_result_response", label: "내부 요청 대응력 개선" },
    { id: "docadm_result_repeat", label: "반복 사무 업무 감소" },
    { id: "docadm_result_quality", label: "업무 지원 품질 향상" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 문서를 접수하고 분류했으며 사무 요청을 처리하고 자료를 정리했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "문서를 접수하고 분류했으며, 현업 부서·경영지원팀과 양식을 업데이트하고 파일 보관 관리를 수행했어요.",
      roleTags: ["문서 접수/분류", "사무 요청 처리", "파일/문서 보관 관리"],
      collaborationTags: ["현업 부서", "경영지원팀", "운영팀"],
      resultTags: ["문서 검색성 개선", "자료 누락 감소"],
    },
  },
};
