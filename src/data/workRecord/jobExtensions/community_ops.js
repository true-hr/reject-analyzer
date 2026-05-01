export const COMMUNITY_OPS_RECORD_PRESET = {
  jobId: "JOB_CUSTOMER_OPERATIONS_COMMUNITY_OPERATIONS",
  label: "커뮤니티 운영",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "커뮤니티 이슈 모니터링",
      "유저 문의 대응",
      "커뮤니티 콘텐츠 관리",
      "불량 유저/콘텐츠 처리",
      "커뮤니티 활성화 활동",
      "운영 지표 확인",
      "공지사항 운영",
    ],
    project: [
      "커뮤니티 운영 정책 수립",
      "커뮤니티 활성화 프로그램 기획",
      "커뮤니티 가이드라인 개정",
      "유저 등급/포인트 제도 설계",
      "커뮤니티 모니터링 자동화",
      "커뮤니티 성과 분석 체계 구축",
      "커뮤니티 운영 매뉴얼 작성",
    ],
  },
  collaborationExtensions: [
    { id: "commops_collab_user", label: "유저" },
    { id: "commops_collab_ops", label: "운영팀" },
    { id: "commops_collab_content", label: "콘텐츠팀" },
    { id: "commops_collab_marketing", label: "마케팅팀" },
    { id: "commops_collab_dev", label: "개발팀" },
    { id: "commops_collab_legal", label: "법무팀" },
    { id: "commops_collab_cs", label: "CS팀" },
  ],
  followUpExtensions: [
    { id: "commops_result_engagement", label: "커뮤니티 활성도 향상" },
    { id: "commops_result_violation_reduced", label: "불량 콘텐츠 감소" },
    { id: "commops_result_participation", label: "유저 참여율 증가" },
    { id: "commops_result_efficiency", label: "운영 효율화" },
    { id: "commops_result_satisfaction", label: "커뮤니티 만족도 개선" },
    { id: "commops_result_standard", label: "정책 기준 명확화" },
    { id: "commops_result_metrics", label: "지표 추적 개선" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 커뮤니티 이슈를 모니터링하고 유저 문의에 대응하며 불량 콘텐츠를 처리했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "커뮤니티 이슈를 모니터링하고 유저 문의에 대응했으며, 콘텐츠팀과 협력해 불량 콘텐츠를 처리하고 커뮤니티 활성화 활동을 진행했어요.",
      roleTags: ["커뮤니티 이슈 모니터링", "유저 문의 대응", "불량 유저/콘텐츠 처리"],
      collaborationTags: ["유저", "운영팀", "콘텐츠팀"],
      resultTags: ["커뮤니티 활성도 향상", "불량 콘텐츠 감소"],
    },
  },
};
