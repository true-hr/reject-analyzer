export const PROJECT_MANAGEMENT_PM_RECORD_PRESET = {
  jobId: "JOB_BUSINESS_PROJECT_MANAGEMENT",
  label: "프로젝트관리(PM)",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "일정 조율",
      "요구사항 정리",
      "우선순위 조정",
      "회의 운영",
      "이슈 관리",
      "리스크 점검",
      "진행 상황 공유",
    ],
    project: [
      "프로젝트 범위 정리",
      "마일스톤 점검",
      "리소스 조율",
      "이해관계자 조율",
      "산출물 검토",
      "리스크 대응",
      "완료 기준 정리",
    ],
  },
  collaborationExtensions: [
    { id: "pm_collab_dev", label: "개발팀" },
    { id: "pm_collab_design", label: "디자인팀" },
    { id: "pm_collab_marketing", label: "마케팅팀" },
    { id: "pm_collab_sales", label: "영업팀" },
    { id: "pm_collab_client", label: "고객사" },
    { id: "pm_collab_decision_maker", label: "의사결정자" },
    { id: "pm_collab_external", label: "외부 파트너" },
  ],
  followUpExtensions: [
    { id: "pm_result_delay_prevented", label: "일정 지연 방지" },
    { id: "pm_result_bottleneck_resolved", label: "병목 해소" },
    { id: "pm_result_decision_made", label: "의사결정 완료" },
    { id: "pm_result_req_clarified", label: "요구사항 명확화" },
    { id: "pm_result_output_improved", label: "산출물 개선" },
    { id: "pm_result_sharing_structured", label: "공유 체계 정리" },
    { id: "pm_result_action_confirmed", label: "후속 액션 확정" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 팀 간 일정 조율과 우선순위 조정을 했고, 의사결정이 필요한 이슈를 정리해 공유했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "개발팀·디자인팀과 마일스톤 일정을 재조율하고, 우선순위가 충돌하는 요구사항을 정리해 의사결정자에게 공유했어요.",
      roleTags: ["일정 조율", "우선순위 조정", "진행 상황 공유"],
      collaborationTags: ["개발팀", "디자인팀", "의사결정자"],
      resultTags: ["의사결정 완료", "요구사항 명확화"],
    },
  },
};
