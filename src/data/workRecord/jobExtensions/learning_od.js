export const LEARNING_OD_RECORD_PRESET = {
  jobId: "JOB_HR_ORGANIZATION_LEARNING_OD",
  label: "교육/조직개발",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "교육 니즈 확인",
      "교육 과정 운영",
      "조직 진단 자료 정리",
      "교육 만족도 분석",
      "리더십 프로그램 점검",
      "워크숍 준비",
      "학습 참여율 확인",
    ],
    project: [
      "교육 체계 설계",
      "조직개발 프로그램 기획",
      "리더십 교육 운영",
      "역량 모델 정리",
      "조직 진단 프로젝트 수행",
      "교육 효과성 분석",
      "변화관리 프로그램 설계",
    ],
  },
  collaborationExtensions: [
    { id: "lod_collab_employee", label: "임직원" },
    { id: "lod_collab_leader", label: "현업 리더" },
    { id: "lod_collab_hr", label: "인사팀" },
    { id: "lod_collab_executive", label: "경영진" },
    { id: "lod_collab_trainer", label: "외부 강사" },
    { id: "lod_collab_vendor", label: "교육업체" },
    { id: "lod_collab_culture", label: "조직문화 담당자" },
  ],
  followUpExtensions: [
    { id: "lod_result_participation", label: "교육 참여율 개선" },
    { id: "lod_result_satisfaction", label: "교육 만족도 향상" },
    { id: "lod_result_org_issue", label: "조직 이슈 가시화" },
    { id: "lod_result_leadership", label: "리더십 역량 강화" },
    { id: "lod_result_learning_system", label: "학습 체계 정리" },
    { id: "lod_result_change_acceptance", label: "조직 변화 수용도 개선" },
    { id: "lod_result_effectiveness", label: "교육 효과 측정 기준 마련" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 교육 과정을 운영하고 참여율을 확인해 리더십 프로그램 개선 방향을 정리했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "교육 과정을 운영하고 만족도를 분석했으며, 현업 리더·경영진과 조직 진단 결과를 공유해 워크숍 방향을 정리했어요.",
      roleTags: ["교육 과정 운영", "교육 만족도 분석", "워크숍 준비"],
      collaborationTags: ["임직원", "현업 리더", "인사팀"],
      resultTags: ["교육 만족도 향상", "리더십 역량 강화"],
    },
  },
};
