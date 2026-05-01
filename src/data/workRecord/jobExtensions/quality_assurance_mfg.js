export const QUALITY_ASSURANCE_MFG_RECORD_PRESET = {
  jobId: "JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA",
  label: "품질보증(QA)",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "QMS 문서 검토",
      "내부감사 준비",
      "고객 클레임 확인",
      "품질 인증 기준 점검",
      "시정조치 이행 확인",
      "품질 시스템 이슈 정리",
      "외부 심사 자료 준비",
    ],
    project: [
      "품질경영시스템 개선",
      "내부감사 대응",
      "고객 클레임 대응 체계 정리",
      "ISO/인증 심사 준비",
      "품질 보증 프로세스 개선",
      "시정예방조치 체계 구축",
      "품질 리스크 관리 체계화",
    ],
  },
  collaborationExtensions: [
    { id: "qamfg_collab_qc", label: "품질관리팀" },
    { id: "qamfg_collab_production", label: "생산팀" },
    { id: "qamfg_collab_customer", label: "고객사" },
    { id: "qamfg_collab_cert", label: "인증기관" },
    { id: "qamfg_collab_supplier", label: "협력사" },
    { id: "qamfg_collab_executive", label: "경영진" },
    { id: "qamfg_collab_biz", label: "현업 부서" },
  ],
  followUpExtensions: [
    { id: "qamfg_result_system", label: "품질 시스템 안정화" },
    { id: "qamfg_result_cert", label: "인증 대응력 개선" },
    { id: "qamfg_result_claim_reduced", label: "고객 클레임 감소" },
    { id: "qamfg_result_audit", label: "감사 지적사항 개선" },
    { id: "qamfg_result_risk_reduced", label: "품질 리스크 감소" },
    { id: "qamfg_result_capa", label: "시정조치 이행률 개선" },
    { id: "qamfg_result_trust", label: "품질 신뢰도 향상" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 QMS 문서를 검토하고 시정조치 이행 현황을 확인했으며 고객 클레임에 대응했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "QMS 문서를 검토하고 시정조치 이행을 확인했으며, 품질관리팀·생산팀과 고객 클레임을 확인해 품질 시스템 이슈를 정리했어요.",
      roleTags: ["QMS 문서 검토", "시정조치 이행 확인", "고객 클레임 확인"],
      collaborationTags: ["품질관리팀", "생산팀", "고객사"],
      resultTags: ["품질 시스템 안정화", "고객 클레임 감소"],
    },
  },
};
