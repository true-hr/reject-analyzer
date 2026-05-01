export const TECHNICAL_SUPPORT_FIELD_ENGINEERING_RECORD_PRESET = {
  jobId: "JOB_ENGINEERING_DEVELOPMENT_TECHNICAL_SUPPORT_FIELD_ENGINEERING",
  label: "기술지원 / 필드엔지니어",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "고객 기술 문의 대응",
      "현장 이슈 확인",
      "장비 설치 지원",
      "장애 원인 분석",
      "기술 자료 안내",
      "원격/현장 점검",
      "개선 요청사항 전달",
    ],
    project: [
      "현장 기술지원 체계 개선",
      "고객사 설치/검증 지원",
      "장애 대응 프로세스 정리",
      "필드 이슈 분석 리포트 작성",
      "기술 교육 자료 제작",
      "고객 환경별 대응 기준 정리",
      "제품 개선 피드백 체계 구축",
    ],
  },
  collaborationExtensions: [
    { id: "techsup_collab_customer", label: "고객사" },
    { id: "techsup_collab_field", label: "현장 담당자" },
    { id: "techsup_collab_dev", label: "개발팀" },
    { id: "techsup_collab_quality", label: "품질팀" },
    { id: "techsup_collab_sales", label: "영업팀" },
    { id: "techsup_collab_product", label: "제품팀" },
    { id: "techsup_collab_partner", label: "외부 파트너" },
  ],
  followUpExtensions: [
    { id: "techsup_result_speed", label: "고객 장애 해결 속도 개선" },
    { id: "techsup_result_recurrence", label: "현장 이슈 재발 감소" },
    { id: "techsup_result_literacy", label: "고객 기술 이해도 향상" },
    { id: "techsup_result_feedback", label: "제품 개선 피드백 확보" },
    { id: "techsup_result_install", label: "설치/운영 안정성 개선" },
    { id: "techsup_result_satisfaction", label: "기술지원 만족도 향상" },
    { id: "techsup_result_trust", label: "고객 신뢰도 개선" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 고객 기술 문의에 대응하고 현장 이슈를 확인했으며 장비 설치를 지원했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "고객 기술 문의에 대응하고 현장 이슈를 확인했으며, 개발팀·품질팀과 장애 원인을 분석하고 개선 요청사항을 전달했어요.",
      roleTags: ["고객 기술 문의 대응", "현장 이슈 확인", "장애 원인 분석"],
      collaborationTags: ["고객사", "개발팀", "품질팀"],
      resultTags: ["고객 장애 해결 속도 개선", "현장 이슈 재발 감소"],
    },
  },
};
