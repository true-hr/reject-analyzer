export const DATA_ENGINEERING_RECORD_PRESET = {
  jobId: "JOB_IT_DATA_DIGITAL_DATA_ENGINEERING",
  label: "데이터엔지니어링",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "데이터 파이프라인 점검",
      "ETL 작업 수정",
      "데이터 적재 오류 확인",
      "스키마 변경 반영",
      "데이터 품질 점검",
      "배치 작업 모니터링",
      "로그 확인",
    ],
    project: [
      "데이터 파이프라인 설계",
      "ETL 구조 개선",
      "데이터 웨어하우스 모델링",
      "데이터 품질 관리 체계 구축",
      "스트리밍 데이터 처리",
      "데이터 플랫폼 운영 개선",
      "데이터 접근 권한 정리",
    ],
  },
  collaborationExtensions: [
    { id: "de_collab_data", label: "데이터팀" },
    { id: "de_collab_backend", label: "백엔드" },
    { id: "de_collab_analyst", label: "분석가" },
    { id: "de_collab_ds", label: "데이터사이언티스트" },
    { id: "de_collab_devops", label: "DevOps" },
    { id: "de_collab_security", label: "보안팀" },
    { id: "de_collab_biz", label: "현업 부서" },
  ],
  followUpExtensions: [
    { id: "de_result_loading_stable", label: "데이터 적재 안정화" },
    { id: "de_result_error_reduced", label: "데이터 오류 감소" },
    { id: "de_result_speed_improved", label: "처리 속도 개선" },
    { id: "de_result_quality_improved", label: "데이터 품질 개선" },
    { id: "de_result_data_available", label: "분석 가능 데이터 확보" },
    { id: "de_result_monitoring", label: "운영 모니터링 강화" },
    { id: "de_result_usability", label: "데이터 활용성 개선" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 ETL 파이프라인 오류를 수정하고 데이터 품질 점검 결과를 분석팀에 공유했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "데이터 파이프라인 오류를 점검하고 ETL 작업을 수정했으며, 스키마 변경 사항을 반영해 분석가·백엔드와 데이터 품질 이슈를 공유했어요.",
      roleTags: ["데이터 파이프라인 점검", "ETL 작업 수정", "데이터 품질 점검"],
      collaborationTags: ["데이터팀", "백엔드", "분석가"],
      resultTags: ["데이터 적재 안정화", "데이터 오류 감소"],
    },
  },
};
