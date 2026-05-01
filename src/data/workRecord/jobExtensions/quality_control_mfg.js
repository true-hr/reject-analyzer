export const QUALITY_CONTROL_MFG_RECORD_PRESET = {
  jobId: "JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_CONTROL",
  label: "품질관리(QC)",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "수입검사 진행",
      "공정검사 확인",
      "출하검사 점검",
      "불량 사례 분류",
      "품질 데이터 집계",
      "검사 기준 확인",
      "개선 조치 현황 확인",
    ],
    project: [
      "품질 검사 체계 개선",
      "불량 원인 분석",
      "검사 기준 표준화",
      "품질 데이터 관리 체계 구축",
      "공정 품질 개선 과제 수행",
      "불량 재발 방지 프로세스 정리",
      "출하 품질 안정화",
    ],
  },
  collaborationExtensions: [
    { id: "qcmfg_collab_production", label: "생산팀" },
    { id: "qcmfg_collab_qa", label: "품질보증팀" },
    { id: "qcmfg_collab_process", label: "공정기술팀" },
    { id: "qcmfg_collab_supplier", label: "협력사" },
    { id: "qcmfg_collab_customer", label: "고객사" },
    { id: "qcmfg_collab_worker", label: "현장 작업자" },
    { id: "qcmfg_collab_equipment", label: "설비팀" },
  ],
  followUpExtensions: [
    { id: "qcmfg_result_defect_reduced", label: "불량률 감소" },
    { id: "qcmfg_result_accuracy", label: "검사 정확도 개선" },
    { id: "qcmfg_result_standard", label: "품질 기준 명확화" },
    { id: "qcmfg_result_recurrence", label: "재발 불량 방지" },
    { id: "qcmfg_result_outgoing", label: "출하 품질 안정화" },
    { id: "qcmfg_result_data", label: "품질 데이터 신뢰도 향상" },
    { id: "qcmfg_result_claim_reduced", label: "고객 클레임 리스크 감소" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 수입검사를 진행하고 공정검사를 확인했으며 불량 사례를 분류했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "수입검사를 진행하고 공정검사를 확인했으며, 생산팀·공정기술팀과 불량 사례를 분류해 개선 조치 현황을 점검했어요.",
      roleTags: ["수입검사 진행", "공정검사 확인", "불량 사례 분류"],
      collaborationTags: ["생산팀", "품질보증팀", "공정기술팀"],
      resultTags: ["불량률 감소", "출하 품질 안정화"],
    },
  },
};
