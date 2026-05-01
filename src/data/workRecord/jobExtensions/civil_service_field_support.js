export const CIVIL_SERVICE_FIELD_SUPPORT_RECORD_PRESET = {
  jobId: "JOB_PUBLIC_ADMINISTRATION_SUPPORT_CIVIL_SERVICE_FIELD_SUPPORT",
  label: "민원 / 현장지원",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "민원 접수/응대",
      "현장 이슈 확인",
      "지원 요청 처리",
      "처리 결과 안내",
      "반복 민원 유형 정리",
      "현장 방문/점검",
      "관계자 문의 대응",
    ],
    project: [
      "민원 대응 프로세스 개선",
      "현장지원 체계 정리",
      "반복 민원 감소 과제 추진",
      "현장 이슈 관리 기준 수립",
      "민원 데이터 분석",
      "고객/시민 안내 자료 개선",
      "현장 대응 매뉴얼 작성",
    ],
  },
  collaborationExtensions: [
    { id: "civil_collab_citizen", label: "민원인" },
    { id: "civil_collab_field", label: "현장 담당자" },
    { id: "civil_collab_public", label: "공공기관" },
    { id: "civil_collab_ops", label: "운영팀" },
    { id: "civil_collab_partner", label: "외부 협력기관" },
    { id: "civil_collab_dept", label: "내부 담당 부서" },
    { id: "civil_collab_manager", label: "관리자" },
  ],
  followUpExtensions: [
    { id: "civil_result_speed", label: "민원 처리 속도 개선" },
    { id: "civil_result_field", label: "현장 대응력 향상" },
    { id: "civil_result_repeat", label: "반복 민원 감소" },
    { id: "civil_result_guide", label: "안내 품질 개선" },
    { id: "civil_result_visibility", label: "현장 이슈 가시화" },
    { id: "civil_result_satisfaction", label: "관계자 만족도 개선" },
    { id: "civil_result_standard", label: "대응 기준 명확화" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 민원을 접수하고 응대했으며 현장 이슈를 확인하고 지원 요청을 처리했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "민원을 접수하고 응대했으며, 현장 담당자·운영팀과 현장 이슈를 확인하고 반복 민원 유형을 정리했어요.",
      roleTags: ["민원 접수/응대", "현장 이슈 확인", "반복 민원 유형 정리"],
      collaborationTags: ["민원인", "현장 담당자", "운영팀"],
      resultTags: ["민원 처리 속도 개선", "반복 민원 감소"],
    },
  },
};
