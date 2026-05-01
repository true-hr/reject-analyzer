export const AI_ML_ENGINEERING_RECORD_PRESET = {
  jobId: "JOB_IT_DATA_DIGITAL_AI_ML_ENGINEERING",
  label: "AI/ML엔지니어링",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "모델 학습 점검",
      "데이터셋 정리",
      "피처 처리 수정",
      "추론 결과 확인",
      "모델 성능 비교",
      "실험 로그 정리",
      "모델 배포 이슈 확인",
    ],
    project: [
      "ML 파이프라인 구축",
      "모델 학습 구조 개선",
      "추론 시스템 연동",
      "모델 배포 자동화",
      "성능 평가 체계 정리",
      "데이터 전처리 구조 개선",
      "모델 모니터링 설계",
    ],
  },
  collaborationExtensions: [
    { id: "aiml_collab_ds", label: "데이터사이언티스트" },
    { id: "aiml_collab_de", label: "데이터엔지니어" },
    { id: "aiml_collab_backend", label: "백엔드" },
    { id: "aiml_collab_product", label: "제품팀" },
    { id: "aiml_collab_devops", label: "DevOps" },
    { id: "aiml_collab_security", label: "보안팀" },
    { id: "aiml_collab_biz", label: "현업 부서" },
  ],
  followUpExtensions: [
    { id: "aiml_result_model_improved", label: "모델 성능 개선" },
    { id: "aiml_result_inference_stable", label: "추론 안정성 확보" },
    { id: "aiml_result_reproducibility", label: "실험 재현성 개선" },
    { id: "aiml_result_deploy_risk", label: "배포 리스크 감소" },
    { id: "aiml_result_pipeline_efficiency", label: "데이터 처리 효율 개선" },
    { id: "aiml_result_prediction_quality", label: "예측 품질 개선" },
    { id: "aiml_result_ops_standard", label: "모델 운영 기준 정리" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 모델 학습 결과를 점검하고 데이터셋을 정리해 성능 비교 결과를 제품팀에 공유했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "모델 학습 결과를 점검하고 피처 처리 로직을 수정했으며, 데이터사이언티스트·백엔드와 추론 결과를 확인해 배포 이슈를 해결했어요.",
      roleTags: ["모델 학습 점검", "피처 처리 수정", "추론 결과 확인"],
      collaborationTags: ["데이터사이언티스트", "데이터엔지니어", "백엔드"],
      resultTags: ["모델 성능 개선", "추론 안정성 확보"],
    },
  },
};
