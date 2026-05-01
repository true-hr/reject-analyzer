export const PROCESS_ENGINEERING_RECORD_PRESET = {
  jobId: "JOB_MANUFACTURING_QUALITY_PRODUCTION_PROCESS_ENGINEERING",
  label: "공정기술",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "공정 조건 점검",
      "수율 데이터 확인",
      "병목 공정 분석",
      "표준작업 조건 검토",
      "공정 이슈 대응",
      "작업 조건 변경 검토",
      "SOP 수정",
    ],
    project: [
      "공정 조건 최적화",
      "수율 개선 과제 추진",
      "병목 공정 개선",
      "공정 표준화",
      "SOP 작성/개정",
      "공정 데이터 분석",
      "신규 공정 도입 검토",
    ],
  },
  collaborationExtensions: [
    { id: "proceng_collab_production", label: "생산팀" },
    { id: "proceng_collab_quality", label: "품질팀" },
    { id: "proceng_collab_equipment", label: "설비팀" },
    { id: "proceng_collab_rd", label: "연구개발팀" },
    { id: "proceng_collab_worker", label: "현장 작업자" },
    { id: "proceng_collab_supplier", label: "협력사" },
    { id: "proceng_collab_prodeng", label: "생산기술팀" },
  ],
  followUpExtensions: [
    { id: "proceng_result_yield", label: "수율 개선" },
    { id: "proceng_result_stability", label: "공정 안정성 향상" },
    { id: "proceng_result_bottleneck", label: "병목 해소" },
    { id: "proceng_result_sop", label: "표준작업 정착" },
    { id: "proceng_result_defect_reduced", label: "공정 불량 감소" },
    { id: "proceng_result_condition", label: "작업 조건 명확화" },
    { id: "proceng_result_efficiency", label: "생산 효율 개선" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 공정 조건을 점검하고 수율 데이터를 확인했으며 병목 공정을 분석했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "공정 조건을 점검하고 수율 데이터를 확인했으며, 생산팀·품질팀과 병목 공정을 분석해 작업 조건 변경 방향을 검토했어요.",
      roleTags: ["공정 조건 점검", "수율 데이터 확인", "병목 공정 분석"],
      collaborationTags: ["생산팀", "품질팀", "설비팀"],
      resultTags: ["수율 개선", "공정 안정성 향상"],
    },
  },
};
