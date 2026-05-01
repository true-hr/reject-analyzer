export const DEVOPS_INFRA_RECORD_PRESET = {
  jobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
  label: "DevOps/인프라",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "배포 파이프라인 점검",
      "서버 상태 모니터링",
      "인프라 비용 확인",
      "장애 알림 대응",
      "권한 설정 점검",
      "CI/CD 오류 수정",
      "운영 로그 확인",
    ],
    project: [
      "CI/CD 파이프라인 구축",
      "클라우드 인프라 설계",
      "배포 자동화 개선",
      "모니터링 체계 구축",
      "장애 대응 프로세스 정리",
      "보안 설정 강화",
      "인프라 비용 최적화",
    ],
  },
  collaborationExtensions: [
    { id: "devops_collab_backend", label: "백엔드" },
    { id: "devops_collab_frontend", label: "프론트엔드" },
    { id: "devops_collab_security", label: "보안팀" },
    { id: "devops_collab_qa", label: "QA" },
    { id: "devops_collab_data", label: "데이터팀" },
    { id: "devops_collab_ops", label: "운영팀" },
    { id: "devops_collab_vendor", label: "클라우드 벤더" },
  ],
  followUpExtensions: [
    { id: "devops_result_deploy_stable", label: "배포 안정성 개선" },
    { id: "devops_result_incident_faster", label: "장애 대응 시간 단축" },
    { id: "devops_result_cost_reduced", label: "인프라 비용 절감" },
    { id: "devops_result_automation", label: "운영 자동화 개선" },
    { id: "devops_result_availability", label: "서비스 가용성 향상" },
    { id: "devops_result_security_risk", label: "보안 리스크 감소" },
    { id: "devops_result_dev_productivity", label: "개발 생산성 개선" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 CI/CD 오류를 수정하고 배포 파이프라인을 점검해 서버 상태를 안정화했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "배포 파이프라인 오류를 수정하고 서버 상태를 모니터링했으며, 백엔드·QA와 협력해 CI/CD 이슈를 해결하고 운영 안정성을 높였어요.",
      roleTags: ["배포 파이프라인 점검", "서버 상태 모니터링", "CI/CD 오류 수정"],
      collaborationTags: ["백엔드", "QA", "보안팀"],
      resultTags: ["배포 안정성 개선", "장애 대응 시간 단축"],
    },
  },
};
