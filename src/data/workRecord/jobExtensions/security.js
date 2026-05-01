export const SECURITY_RECORD_PRESET = {
  jobId: "JOB_IT_DATA_DIGITAL_SECURITY",
  label: "보안",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "취약점 점검",
      "접근 권한 검토",
      "보안 로그 확인",
      "보안 정책 점검",
      "침해 징후 모니터링",
      "보안 이슈 대응",
      "보안 가이드 업데이트",
    ],
    project: [
      "보안 정책 수립",
      "취약점 진단",
      "권한 관리 체계 개선",
      "보안 모니터링 구축",
      "침해 대응 프로세스 정리",
      "개인정보 보호 점검",
      "보안 감사 대응",
    ],
  },
  collaborationExtensions: [
    { id: "sec_collab_dev", label: "개발팀" },
    { id: "sec_collab_infra", label: "인프라팀" },
    { id: "sec_collab_legal", label: "법무팀" },
    { id: "sec_collab_privacy", label: "개인정보 담당자" },
    { id: "sec_collab_executive", label: "경영진" },
    { id: "sec_collab_vendor", label: "외부 보안업체" },
    { id: "sec_collab_ops", label: "운영팀" },
  ],
  followUpExtensions: [
    { id: "sec_result_risk_reduced", label: "보안 리스크 감소" },
    { id: "sec_result_access_clear", label: "권한 관리 명확화" },
    { id: "sec_result_vuln_early", label: "취약점 조기 개선" },
    { id: "sec_result_privacy", label: "개인정보 보호 강화" },
    { id: "sec_result_audit_ready", label: "감사 대응력 개선" },
    { id: "sec_result_incident_speed", label: "침해 대응 속도 향상" },
    { id: "sec_result_ops_standard", label: "보안 운영 기준 정리" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 취약점 점검을 수행하고 접근 권한을 검토해 보안 이슈를 개발팀에 공유했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "취약점 점검과 보안 로그 확인을 수행하고 보안 이슈를 개발팀·인프라팀과 공유했으며, 접근 권한 설정을 검토해 리스크를 줄였어요.",
      roleTags: ["취약점 점검", "접근 권한 검토", "보안 로그 확인"],
      collaborationTags: ["개발팀", "인프라팀", "법무팀"],
      resultTags: ["보안 리스크 감소", "권한 관리 명확화"],
    },
  },
};
