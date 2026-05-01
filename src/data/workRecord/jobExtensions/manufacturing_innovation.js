export const MANUFACTURING_INNOVATION_RECORD_PRESET = {
  jobId: "JOB_MANUFACTURING_QUALITY_PRODUCTION_MANUFACTURING_INNOVATION",
  label: "제조혁신 / 생산혁신",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "개선 과제 발굴",
      "생산성 지표 점검",
      "낭비 요소 분석",
      "표준화 과제 정리",
      "원가 절감 아이디어 검토",
      "현장 개선 활동 지원",
      "혁신 지표 확인",
    ],
    project: [
      "린/6시그마 개선 과제 추진",
      "생산성 혁신 프로젝트",
      "원가 절감 과제 수행",
      "제조 프로세스 표준화",
      "현장 개선 활동 체계화",
      "혁신 지표 관리 체계 구축",
      "업무 낭비 제거 프로젝트",
    ],
  },
  collaborationExtensions: [
    { id: "mfginno_collab_production", label: "생산팀" },
    { id: "mfginno_collab_quality", label: "품질팀" },
    { id: "mfginno_collab_process", label: "공정기술팀" },
    { id: "mfginno_collab_prodeng", label: "생산기술팀" },
    { id: "mfginno_collab_executive", label: "경영진" },
    { id: "mfginno_collab_worker", label: "현장 작업자" },
    { id: "mfginno_collab_finance", label: "재무팀" },
  ],
  followUpExtensions: [
    { id: "mfginno_result_productivity", label: "생산성 향상" },
    { id: "mfginno_result_cost_reduced", label: "원가 절감" },
    { id: "mfginno_result_waste_reduced", label: "낭비 요소 감소" },
    { id: "mfginno_result_standard", label: "표준화 수준 개선" },
    { id: "mfginno_result_execution", label: "개선 과제 실행률 향상" },
    { id: "mfginno_result_engagement", label: "현장 참여도 개선" },
    { id: "mfginno_result_visibility", label: "혁신 성과 가시화" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 개선 과제를 발굴하고 생산성 지표를 점검했으며 낭비 요소를 분석했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "개선 과제를 발굴하고 생산성 지표를 점검했으며, 공정기술팀·현장 작업자와 낭비 요소를 분석해 원가 절감 아이디어를 검토했어요.",
      roleTags: ["개선 과제 발굴", "생산성 지표 점검", "낭비 요소 분석"],
      collaborationTags: ["생산팀", "공정기술팀", "현장 작업자"],
      resultTags: ["생산성 향상", "원가 절감"],
    },
  },
};
