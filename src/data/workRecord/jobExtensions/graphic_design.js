export const GRAPHIC_DESIGN_RECORD_PRESET = {
  jobId: "JOB_DESIGN_GRAPHIC_DESIGN",
  label: "그래픽디자인",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "홍보물 디자인",
      "배너/썸네일 제작",
      "인쇄물 시안 작업",
      "레이아웃 수정",
      "이미지 보정",
      "디자인 파일 정리",
      "제작 요청 대응",
    ],
    project: [
      "그래픽 콘셉트 개발",
      "캠페인 비주얼 제작",
      "온·오프라인 홍보물 디자인",
      "인쇄 제작물 관리",
      "디자인 템플릿 구축",
      "그래픽 시스템 정리",
      "시각 자료 품질 개선",
    ],
  },
  collaborationExtensions: [
    { id: "graphic_collab_marketing", label: "마케팅팀" },
    { id: "graphic_collab_content", label: "콘텐츠팀" },
    { id: "graphic_collab_brand", label: "브랜드팀" },
    { id: "graphic_collab_print", label: "인쇄업체" },
    { id: "graphic_collab_designer", label: "외부 디자이너" },
    { id: "graphic_collab_sales", label: "영업팀" },
    { id: "graphic_collab_ops", label: "운영팀" },
  ],
  followUpExtensions: [
    { id: "graphic_result_speed", label: "디자인 제작 속도 개선" },
    { id: "graphic_result_quality", label: "홍보물 완성도 향상" },
    { id: "graphic_result_communication", label: "시각 전달력 개선" },
    { id: "graphic_result_error_reduced", label: "제작 오류 감소" },
    { id: "graphic_result_reuse", label: "템플릿 재사용성 향상" },
    { id: "graphic_result_campaign", label: "캠페인 소재 품질 개선" },
    { id: "graphic_result_stable", label: "디자인 요청 처리 안정화" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 홍보물을 디자인하고 배너를 제작했으며 인쇄물 시안 작업을 진행했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "홍보물 디자인과 배너/썸네일을 제작하고 마케팅팀·콘텐츠팀의 제작 요청에 대응했으며 인쇄물 시안을 완료했어요.",
      roleTags: ["홍보물 디자인", "배너/썸네일 제작", "제작 요청 대응"],
      collaborationTags: ["마케팅팀", "콘텐츠팀", "브랜드팀"],
      resultTags: ["홍보물 완성도 향상", "디자인 제작 속도 개선"],
    },
  },
};
