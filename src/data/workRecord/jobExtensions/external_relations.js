export const EXTERNAL_RELATIONS_RECORD_PRESET = {
  jobId: "JOB_PUBLIC_ADMINISTRATION_SUPPORT_EXTERNAL_RELATIONS",
  label: "대외협력",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "외부 기관 커뮤니케이션",
      "협력 요청 검토",
      "대외 미팅 준비",
      "협약/제휴 자료 정리",
      "이해관계자 현황 확인",
      "대외 일정 조율",
      "협력 이슈 정리",
    ],
    project: [
      "대외협력 전략 수립",
      "기관/파트너 협력 구조 설계",
      "협약 체결 지원",
      "이해관계자 관리 체계 정리",
      "대외 커뮤니케이션 자료 작성",
      "공동 사업 협의",
      "협력 네트워크 확대",
    ],
  },
  collaborationExtensions: [
    { id: "extrel_collab_external", label: "외부 기관" },
    { id: "extrel_collab_partner", label: "파트너사" },
    { id: "extrel_collab_public", label: "공공기관" },
    { id: "extrel_collab_executive", label: "경영진" },
    { id: "extrel_collab_legal", label: "법무팀" },
    { id: "extrel_collab_business", label: "사업부" },
    { id: "extrel_collab_pr", label: "홍보/PR팀" },
  ],
  followUpExtensions: [
    { id: "extrel_result_partnership", label: "협력 관계 강화" },
    { id: "extrel_result_trust", label: "대외 신뢰도 개선" },
    { id: "extrel_result_mou", label: "협약 가능성 구체화" },
    { id: "extrel_result_response", label: "이해관계자 대응력 향상" },
    { id: "extrel_result_opportunity", label: "공동 사업 기회 발굴" },
    { id: "extrel_result_comm", label: "대외 커뮤니케이션 안정화" },
    { id: "extrel_result_risk", label: "협력 리스크 감소" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 외부 기관과 커뮤니케이션하고 협력 요청을 검토했으며 대외 미팅을 준비했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "외부 기관과 커뮤니케이션하고 협력 요청을 검토했으며, 공공기관·파트너사와 대외 미팅을 준비하고 협약 자료를 정리했어요.",
      roleTags: ["외부 기관 커뮤니케이션", "협력 요청 검토", "협약/제휴 자료 정리"],
      collaborationTags: ["외부 기관", "공공기관", "파트너사"],
      resultTags: ["협력 관계 강화", "대외 신뢰도 개선"],
    },
  },
};
