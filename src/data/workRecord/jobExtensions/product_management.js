const PRODUCT_MANAGEMENT_WORK_TYPES = [
  "문의 대응",
  "일정 조율",
  "문서 정리",
  "이슈 조율",
  "고객 문의",
  "팀 간 조율",
  "후속 실행",
  "요청사항 정리",
  "운영 체크",
  "운영 흐름 정리",
  "기준 업데이트",
  "반복 협업 정리",
];

export const PRODUCT_MANAGEMENT_RECORD_PRESET = {
  jobId: "JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT",
  label: "프로덕트 매니지먼트",
  workTypeExtensions: PRODUCT_MANAGEMENT_WORK_TYPES.map((label) => ({
    id: `pm_${label.replace(/\s+/g, "_")}`,
    label,
  })),
  trackWorkTypePresets: {
    today: [
      "백로그 정리",
      "기능 스펙 검토",
      "제품 지표 확인",
      "사용자 피드백 확인",
      "요구사항 우선순위 조정",
      "릴리즈 이슈 점검",
      "이해관계자 요청 정리",
    ],
    weekly: [
      "제품 로드맵 점검",
      "백로그 우선순위 조정",
      "핵심 지표 리뷰",
      "사용자 피드백 분석",
      "기능 요구사항 정리",
      "릴리즈 준비 상황 점검",
      "이해관계자 의사결정 조율",
    ],
    project: [
      "제품 로드맵 수립",
      "기능 우선순위 결정",
      "요구사항 정의",
      "출시 전략 정리",
      "사용자 피드백 분석",
      "제품 지표 개선",
      "이해관계자 조율",
    ],
  },
  collaborationExtensions: [
    { id: "pm_collab_dev", label: "개발팀" },
    { id: "pm_collab_design", label: "디자인팀" },
    { id: "pm_collab_data", label: "데이터팀" },
    { id: "pm_collab_marketing", label: "마케팅팀" },
    { id: "pm_collab_sales", label: "영업팀" },
    { id: "pm_collab_cs", label: "고객지원팀" },
    { id: "pm_collab_decision", label: "의사결정자" },
  ],
  followUpExtensions: [
    { id: "pm_result_direction", label: "제품 방향 명확화" },
    { id: "pm_result_priority", label: "기능 우선순위 정리" },
    { id: "pm_result_problem", label: "사용자 문제 구체화" },
    { id: "pm_result_scope", label: "개발 범위 확정" },
    { id: "pm_result_metric", label: "제품 지표 개선" },
    { id: "pm_result_launch", label: "출시 준비도 향상" },
    { id: "pm_result_alignment", label: "이해관계자 합의 형성" },
  ],
  placeholders: {
    today: "예: 고객 문의 흐름을 정리하고 응대 기준을 업데이트했어요.",
    weekly:
      "예: 이번 주에는 운영 흐름을 정리하고, 반복 이슈 대응 기준을 업데이트했으며, 유관 부서 협업 흐름까지 함께 정리했어요.",
  },
  sampleRecords: {
    today: {
      text:
        "고객 문의 유형을 분류하고 대응 기준 문서를 업데이트해서 후속 응대 흐름을 정리했어요.",
      roleTags: ["고객 문의", "문서 정리", "후속 실행"],
      collaborationTags: ["고객", "운영팀"],
      resultTags: ["정리 완료", "후속 실행", "문장 후보"],
    },
    weekly: {
      text:
        "이번 주에는 운영 흐름을 다시 정리하고 반복적으로 들어오는 이슈 대응 기준을 업데이트했으며, 유관 부서와 협업한 처리 흐름까지 한 번에 정리했어요.",
      roleTags: ["운영 흐름 정리", "기준 업데이트", "반복 협업 정리"],
      collaborationTags: ["고객", "운영팀", "다른 부서"],
      resultTags: ["흐름 정리", "후속 실행", "기준 업데이트"],
    },
  },
};
