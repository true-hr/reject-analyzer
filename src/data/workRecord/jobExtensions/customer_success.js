export const CUSTOMER_SUCCESS_RECORD_PRESET = {
  jobId: "JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUCCESS",
  label: "Customer Success",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "고객 헬스체크",
      "온보딩 지원",
      "갱신/업셀 기회 파악",
      "고객 미팅",
      "사용 현황 분석",
      "CS 이슈 대응",
      "고객 피드백 정리",
    ],
    project: [
      "온보딩 프로세스 설계",
      "고객 성공 지표 정의",
      "CS 플레이북 작성",
      "갱신율 개선 전략",
      "고객 세그먼트 분석",
      "NPS 개선 계획",
      "계정 확장 전략 수립",
    ],
  },
  collaborationExtensions: [
    { id: "csm_collab_sales", label: "영업팀" },
    { id: "csm_collab_pm", label: "PM" },
    { id: "csm_collab_dev", label: "개발팀" },
    { id: "csm_collab_marketing", label: "마케팅팀" },
    { id: "csm_collab_data", label: "데이터팀" },
    { id: "csm_collab_executive", label: "경영진" },
  ],
  followUpExtensions: [
    { id: "csm_result_churn_prevented", label: "고객 이탈 방지" },
    { id: "csm_result_renewal_rate", label: "갱신율 개선" },
    { id: "csm_result_onboarding", label: "온보딩 완료율 향상" },
    { id: "csm_result_upsell", label: "업셀 기회 발굴" },
    { id: "csm_result_satisfaction", label: "고객 만족도 향상" },
    { id: "csm_result_expansion", label: "계정 확장 지원" },
    { id: "csm_result_health_visibility", label: "고객 건강도 가시화" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 주요 고객 헬스체크를 진행하고 온보딩 미팅을 지원했으며 갱신 기회를 영업팀과 공유했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "주요 고객 헬스체크와 온보딩 지원을 완료하고 사용 현황을 분석해 영업팀과 갱신/업셀 기회를 공유했어요.",
      roleTags: ["고객 헬스체크", "온보딩 지원", "사용 현황 분석"],
      collaborationTags: ["영업팀", "PM", "개발팀"],
      resultTags: ["고객 이탈 방지", "갱신율 개선"],
    },
  },
};
