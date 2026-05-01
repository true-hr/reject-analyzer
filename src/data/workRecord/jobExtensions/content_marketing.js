export const CONTENT_MARKETING_RECORD_PRESET = {
  jobId: "JOB_MARKETING_CONTENT_MARKETING",
  label: "콘텐츠마케팅",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "콘텐츠 주제 기획",
      "콘텐츠 발행",
      "반응 데이터 확인",
      "SEO 키워드 점검",
      "카피 수정",
      "콘텐츠 캘린더 관리",
      "소재 아이디어 정리",
    ],
    project: [
      "콘텐츠 캠페인 기획",
      "에디토리얼 방향 정리",
      "콘텐츠 시리즈 설계",
      "검색 유입 개선",
      "콘텐츠 성과 리포트 작성",
      "채널별 콘텐츠 재가공",
      "고객 반응 기반 개선안 도출",
    ],
  },
  collaborationExtensions: [
    { id: "content_collab_design", label: "디자인팀" },
    { id: "content_collab_video", label: "영상팀" },
    { id: "content_collab_brand", label: "브랜드팀" },
    { id: "content_collab_ads", label: "광고팀" },
    { id: "content_collab_product", label: "제품팀" },
    { id: "content_collab_writer", label: "외부 작가" },
    { id: "content_collab_customer", label: "고객" },
  ],
  followUpExtensions: [
    { id: "content_result_reaction_improved", label: "콘텐츠 반응률 개선" },
    { id: "content_result_search_traffic", label: "검색 유입 증가" },
    { id: "content_result_message_clarity", label: "메시지 전달력 개선" },
    { id: "content_result_schedule_stable", label: "발행 일정 안정화" },
    { id: "content_result_customer_interest", label: "고객 관심사 확인" },
    { id: "content_result_reuse", label: "재활용 콘텐츠 확보" },
    { id: "content_result_next_topic", label: "다음 콘텐츠 주제 도출" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 SEO 키워드 기반 콘텐츠를 발행하고 반응 데이터를 분석해 다음 주제를 기획했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "디자인팀·외부 작가와 에디토리얼 방향을 조율해 콘텐츠를 발행했고, SEO 키워드 성과를 분석해 다음 주제를 정리했어요.",
      roleTags: ["콘텐츠 주제 기획", "콘텐츠 발행", "SEO 키워드 점검"],
      collaborationTags: ["디자인팀", "외부 작가"],
      resultTags: ["검색 유입 증가", "다음 콘텐츠 주제 도출"],
    },
  },
};
