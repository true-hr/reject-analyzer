export const ELECTRICAL_DESIGN_RECORD_PRESET = {
  jobId: "JOB_ENGINEERING_DEVELOPMENT_ELECTRICAL_DESIGN",
  label: "전장/전기설계",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "전장 회로 검토",
      "배선/하네스 설계 확인",
      "전기 부하 조건 점검",
      "제어반 구성 검토",
      "전장 부품 사양 확인",
      "전기 안전 기준 점검",
      "현장 설치 이슈 대응",
    ],
    project: [
      "전장 시스템 설계",
      "배선/하네스 설계",
      "전기 제어 구성 설계",
      "전장 부품 선정",
      "전기 안전 기준 반영",
      "장비 전장 설계 개선",
      "현장 설치 대응 체계 정리",
    ],
  },
  collaborationExtensions: [
    { id: "elecdes_collab_mech", label: "기구설계팀" },
    { id: "elecdes_collab_ctrl", label: "제어팀" },
    { id: "elecdes_collab_prod", label: "생산기술팀" },
    { id: "elecdes_collab_facility", label: "설비팀" },
    { id: "elecdes_collab_vendor", label: "외부 장비업체" },
    { id: "elecdes_collab_quality", label: "품질팀" },
    { id: "elecdes_collab_field", label: "현장 작업자" },
  ],
  followUpExtensions: [
    { id: "elecdes_result_stability", label: "전장 설계 안정성 향상" },
    { id: "elecdes_result_wiring", label: "배선 오류 감소" },
    { id: "elecdes_result_install", label: "현장 설치 리스크 감소" },
    { id: "elecdes_result_safety", label: "전기 안전성 개선" },
    { id: "elecdes_result_part", label: "부품 선정 정확도 향상" },
    { id: "elecdes_result_ctrl", label: "제어 시스템 연동 개선" },
    { id: "elecdes_result_ops", label: "장비 운영 안정성 향상" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 전장 회로를 검토하고 배선·하네스 설계를 확인했으며 전기 부하 조건을 점검했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "전장 회로를 검토하고 배선·하네스 설계를 확인했으며, 기구설계팀·생산기술팀과 전장 부품 사양을 확인하고 전기 안전 기준을 점검했어요.",
      roleTags: ["전장 회로 검토", "배선/하네스 설계 확인", "전기 안전 기준 점검"],
      collaborationTags: ["기구설계팀", "생산기술팀", "제어팀"],
      resultTags: ["전장 설계 안정성 향상", "배선 오류 감소"],
    },
  },
};
