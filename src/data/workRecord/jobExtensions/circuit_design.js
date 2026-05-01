export const CIRCUIT_DESIGN_RECORD_PRESET = {
  jobId: "JOB_ENGINEERING_DEVELOPMENT_CIRCUIT_DESIGN",
  label: "회로설계",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "회로도 수정",
      "PCB 검토",
      "부품 사양 확인",
      "전원/신호 이슈 점검",
      "회로 테스트 결과 정리",
      "디버깅 로그 확인",
      "부품 대체 가능성 검토",
    ],
    project: [
      "회로 설계",
      "PCB 설계 검토",
      "전원/신호 안정성 개선",
      "회로 검증 테스트",
      "부품 선정 기준 정리",
      "EMI/EMC 대응 검토",
      "양산 전 회로 안정화",
    ],
  },
  collaborationExtensions: [
    { id: "cirdes_collab_fw", label: "펌웨어팀" },
    { id: "cirdes_collab_mech", label: "기구설계팀" },
    { id: "cirdes_collab_prod", label: "생산기술팀" },
    { id: "cirdes_collab_quality", label: "품질팀" },
    { id: "cirdes_collab_vendor", label: "부품 공급사" },
    { id: "cirdes_collab_lab", label: "외부 시험기관" },
    { id: "cirdes_collab_rd", label: "연구개발팀" },
  ],
  followUpExtensions: [
    { id: "cirdes_result_stability", label: "회로 안정성 개선" },
    { id: "cirdes_result_debug", label: "디버깅 시간 단축" },
    { id: "cirdes_result_part", label: "부품 리스크 감소" },
    { id: "cirdes_result_signal", label: "전원/신호 품질 개선" },
    { id: "cirdes_result_pcb", label: "PCB 오류 감소" },
    { id: "cirdes_result_cert", label: "인증 대응력 향상" },
    { id: "cirdes_result_mass", label: "양산 리스크 감소" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 회로도를 수정하고 PCB를 검토했으며 부품 사양을 확인했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "회로도를 수정하고 PCB를 검토했으며, 펌웨어팀·품질팀과 전원·신호 이슈를 점검하고 회로 테스트 결과를 정리했어요.",
      roleTags: ["회로도 수정", "PCB 검토", "전원/신호 이슈 점검"],
      collaborationTags: ["펌웨어팀", "품질팀", "생산기술팀"],
      resultTags: ["회로 안정성 개선", "PCB 오류 감소"],
    },
  },
};
