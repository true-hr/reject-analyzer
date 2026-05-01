export const EXPERT_REVIEW_EVALUATION_RECORD_PRESET = {
  jobId: "JOB_RESEARCH_PROFESSIONAL_EXPERT_REVIEW_EVALUATION",
  label: "전문심사 / 평가",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "평가 기준 검토",
      "심사 자료 확인",
      "검토 의견 작성",
      "평가 결과 정리",
      "신청/제출 자료 보완",
      "심사 일정 관리",
      "이해관계자 질의 대응",
    ],
    project: [
      "심사 평가 체계 정리",
      "전문 평가 기준 수립",
      "심사 프로세스 개선",
      "평가 리포트 작성",
      "심사 품질 관리",
      "평가 데이터 관리 체계 구축",
      "이해관계자 피드백 반영",
    ],
  },
  collaborationExtensions: [
    { id: "eval_collab_subject", label: "심사 대상자" },
    { id: "eval_collab_internal", label: "내부 심사위원" },
    { id: "eval_collab_expert", label: "외부 전문가" },
    { id: "eval_collab_ops", label: "운영팀" },
    { id: "eval_collab_policy", label: "정책 담당자" },
    { id: "eval_collab_legal", label: "법무팀" },
    { id: "eval_collab_authority", label: "관계기관" },
  ],
  followUpExtensions: [
    { id: "eval_result_criteria", label: "평가 기준 명확화" },
    { id: "eval_result_quality", label: "심사 품질 개선" },
    { id: "eval_result_error", label: "검토 오류 감소" },
    { id: "eval_result_reliability", label: "평가 결과 신뢰도 향상" },
    { id: "eval_result_speed", label: "심사 처리 속도 개선" },
    { id: "eval_result_supplement", label: "자료 보완율 감소" },
    { id: "eval_result_response", label: "이해관계자 대응력 향상" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 평가 기준을 검토하고 심사 자료를 확인했으며 검토 의견을 작성했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "평가 기준을 검토하고 심사 자료를 확인했으며, 외부 전문가·운영팀과 검토 의견을 작성하고 평가 결과를 정리했어요.",
      roleTags: ["평가 기준 검토", "심사 자료 확인", "검토 의견 작성"],
      collaborationTags: ["외부 전문가", "운영팀", "내부 심사위원"],
      resultTags: ["평가 기준 명확화", "심사 품질 개선"],
    },
  },
};
