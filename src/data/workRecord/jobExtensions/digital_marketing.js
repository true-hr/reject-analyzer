export const DIGITAL_MARKETING_RECORD_PRESET = {
  jobId: "JOB_MARKETING_DIGITAL_MARKETING",
  label: "디지털마케팅",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "디지털 채널 운영",
      "유입 지표 점검",
      "캠페인 세팅",
      "전환 경로 확인",
      "채널별 성과 비교",
      "고객 행동 데이터 확인",
      "운영 이슈 대응",
    ],
    project: [
      "디지털 캠페인 기획",
      "채널 믹스 설계",
      "전환 퍼널 개선",
      "웹/앱 유입 분석",
      "채널 운영 정책 정리",
      "성과 대시보드 점검",
      "디지털 캠페인 리포트 작성",
    ],
  },
  collaborationExtensions: [
    { id: "digital_collab_agency", label: "광고대행사" },
    { id: "digital_collab_design", label: "디자인팀" },
    { id: "digital_collab_dev", label: "개발팀" },
    { id: "digital_collab_data", label: "데이터팀" },
    { id: "digital_collab_content", label: "콘텐츠팀" },
    { id: "digital_collab_product", label: "제품팀" },
    { id: "digital_collab_customer", label: "고객" },
  ],
  followUpExtensions: [
    { id: "digital_result_traffic_up", label: "유입 증가" },
    { id: "digital_result_funnel_improved", label: "전환 경로 개선" },
    { id: "digital_result_channel_efficiency", label: "채널 효율 개선" },
    { id: "digital_result_behavior_insight", label: "고객 행동 파악" },
    { id: "digital_result_ops_stable", label: "캠페인 운영 안정화" },
    { id: "digital_result_kpi_defined", label: "성과 측정 기준 정리" },
    { id: "digital_result_next_improvement", label: "다음 운영 개선안 도출" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 채널별 유입 지표를 점검하고 전환 경로를 분석해 캠페인 세팅을 개선했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "광고대행사·데이터팀과 채널별 성과를 비교 분석하고 전환 경로 문제를 파악해 개발팀에 개선을 요청했어요.",
      roleTags: ["유입 지표 점검", "채널별 성과 비교", "캠페인 세팅"],
      collaborationTags: ["광고대행사", "데이터팀", "개발팀"],
      resultTags: ["유입 증가", "전환 경로 개선"],
    },
  },
};
