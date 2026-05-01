export const DATA_SCIENCE_RECORD_PRESET = {
  jobId: "JOB_IT_DATA_DIGITAL_DATA_SCIENCE",
  label: "데이터사이언스",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "데이터 탐색",
      "피처 정리",
      "모델 실험",
      "예측 성능 검토",
      "A/B 테스트 분석",
      "가설 검증",
      "분석 결과 정리",
    ],
    project: [
      "모델링 방향 설계",
      "피처 엔지니어링",
      "실험 설계",
      "모델 성능 비교",
      "예측 결과 해석",
      "데이터 품질 검토",
      "분석 리포트 작성",
    ],
  },
  collaborationExtensions: [
    { id: "ds_collab_data", label: "데이터팀" },
    { id: "ds_collab_product", label: "제품팀" },
    { id: "ds_collab_marketing", label: "마케팅팀" },
    { id: "ds_collab_dev", label: "개발팀" },
    { id: "ds_collab_executive", label: "경영진" },
    { id: "ds_collab_business", label: "현업 부서" },
    { id: "ds_collab_decision_maker", label: "의사결정자" },
  ],
  followUpExtensions: [
    { id: "ds_result_prediction_improved", label: "예측 성능 개선" },
    { id: "ds_result_key_feature_found", label: "핵심 변수 발견" },
    { id: "ds_result_decision_basis", label: "의사결정 근거 제공" },
    { id: "ds_result_experiment_validated", label: "실험 결과 검증" },
    { id: "ds_result_accuracy_improved", label: "분석 정확도 개선" },
    { id: "ds_result_data_quality_issue", label: "데이터 품질 이슈 발견" },
    { id: "ds_result_opportunity_found", label: "개선 기회 도출" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 사용자 행동 데이터를 탐색하고 피처를 정리해 모델 실험을 진행했으며, A/B 테스트 결과를 분석했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "제품팀·마케팅팀 요청으로 이탈 예측 모델 실험을 진행하고 A/B 테스트 결과를 분석해 의사결정자에게 개선 기회를 공유했어요.",
      roleTags: ["모델 실험", "A/B 테스트 분석", "가설 검증"],
      collaborationTags: ["제품팀", "마케팅팀", "의사결정자"],
      resultTags: ["예측 성능 개선", "의사결정 근거 제공"],
    },
  },
};
