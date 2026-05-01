export const PROCUREMENT_RECORD_PRESET = {
  jobId: "JOB_PROCUREMENT_SCM_PURCHASING",
  label: "구매",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "구매 요청 검토",
      "견적 비교",
      "발주 처리",
      "납기 일정 확인",
      "단가 협의",
      "구매 이슈 대응",
      "거래처 커뮤니케이션",
    ],
    project: [
      "구매 프로세스 개선",
      "구매 비용 절감 과제 추진",
      "공급 조건 협의",
      "발주 기준 정리",
      "구매 품목 관리 체계 개선",
      "거래처 계약 조건 검토",
      "구매 리스크 점검",
    ],
  },
  collaborationExtensions: [
    { id: "proc_collab_supplier", label: "협력사" },
    { id: "proc_collab_biz", label: "현업 부서" },
    { id: "proc_collab_finance", label: "재무팀" },
    { id: "proc_collab_quality", label: "품질팀" },
    { id: "proc_collab_logistics", label: "물류팀" },
    { id: "proc_collab_legal", label: "법무팀" },
    { id: "proc_collab_production", label: "생산팀" },
  ],
  followUpExtensions: [
    { id: "proc_result_cost_reduced", label: "구매 비용 절감" },
    { id: "proc_result_delivery", label: "납기 지연 감소" },
    { id: "proc_result_accuracy", label: "발주 정확도 개선" },
    { id: "proc_result_terms", label: "거래 조건 개선" },
    { id: "proc_result_standard", label: "구매 프로세스 표준화" },
    { id: "proc_result_risk_reduced", label: "공급 리스크 감소" },
    { id: "proc_result_speed", label: "현업 요청 처리 속도 개선" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 구매 요청을 검토하고 견적을 비교해 발주를 처리했으며 납기 일정을 확인했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "구매 요청을 검토하고 견적을 비교해 발주를 처리했으며, 협력사와 단가를 협의하고 납기 이슈에 대응했어요.",
      roleTags: ["구매 요청 검토", "견적 비교", "발주 처리"],
      collaborationTags: ["협력사", "현업 부서", "재무팀"],
      resultTags: ["구매 비용 절감", "납기 지연 감소"],
    },
  },
};
