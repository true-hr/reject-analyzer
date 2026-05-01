export const ADMINISTRATION_RECORD_PRESET = {
  jobId: "JOB_PUBLIC_ADMINISTRATION_SUPPORT_ADMINISTRATION",
  label: "행정",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "행정 문서 처리",
      "내부 요청 접수",
      "일정/회의 지원",
      "행정 절차 확인",
      "부서 간 자료 취합",
      "행정 이슈 정리",
      "운영 기준 안내",
    ],
    project: [
      "행정 프로세스 개선",
      "내부 행정 기준 정리",
      "문서 처리 체계 개선",
      "행정 업무 표준화",
      "부서 지원 체계 정리",
      "행정 데이터 관리 개선",
      "반복 행정 업무 효율화",
    ],
  },
  collaborationExtensions: [
    { id: "admin_collab_internal", label: "내부 구성원" },
    { id: "admin_collab_dept", label: "현업 부서" },
    { id: "admin_collab_mgmt", label: "경영지원팀" },
    { id: "admin_collab_finance", label: "재무팀" },
    { id: "admin_collab_hr", label: "인사팀" },
    { id: "admin_collab_external", label: "외부 기관" },
    { id: "admin_collab_vendor", label: "거래처" },
  ],
  followUpExtensions: [
    { id: "admin_result_speed", label: "행정 처리 속도 개선" },
    { id: "admin_result_missing", label: "문서 누락 감소" },
    { id: "admin_result_satisfaction", label: "내부 지원 만족도 향상" },
    { id: "admin_result_standard", label: "업무 기준 명확화" },
    { id: "admin_result_comm", label: "부서 간 커뮤니케이션 개선" },
    { id: "admin_result_repeat", label: "반복 업무 감소" },
    { id: "admin_result_stability", label: "행정 운영 안정화" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 행정 문서를 처리하고 내부 요청을 접수했으며 행정 절차를 확인했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "행정 문서를 처리하고 내부 요청을 접수했으며, 현업 부서·경영지원팀과 일정 및 회의를 지원하고 부서 간 자료를 취합했어요.",
      roleTags: ["행정 문서 처리", "내부 요청 접수", "부서 간 자료 취합"],
      collaborationTags: ["현업 부서", "경영지원팀", "인사팀"],
      resultTags: ["행정 처리 속도 개선", "업무 기준 명확화"],
    },
  },
};
