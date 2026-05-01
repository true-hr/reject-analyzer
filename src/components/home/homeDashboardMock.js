import {
  buildCalendarMonthViewModel,
  normalizeGoogleCalendarEvent,
  normalizeNotionRecord,
} from "./homeDashboardCalendarUtils.js";

const MANUAL_RECORDS = [
  {
    id: "manual_2026-04-01_support",
    date: "2026-04-01",
    source: "manual",
    workType: "문의 대응",
    title: "고객 문의 유형 정리",
    summary: "반복 문의를 분류하고 응대 기준을 다시 정리했습니다.",
    reflectedSentence: "반복 문의 유형을 정리하고 처리 기준을 업데이트해 응대 흐름의 일관성을 높였습니다.",
    strengthTags: ["문서화", "운영 구조화"],
    linkedAssetIds: ["asset_support_01"],
  },
  {
    id: "manual_2026-04-01_docs",
    date: "2026-04-01",
    source: "manual",
    workType: "문서/보고",
    title: "처리 기준 문서 정리",
    summary: "자주 묻는 문의 기준을 문서로 다시 맞췄습니다.",
    linkedAssetIds: ["asset_support_01"],
  },
  {
    id: "manual_2026-04-02_coordination",
    date: "2026-04-02",
    source: "manual",
    workType: "이슈 조율",
    title: "운영 이슈 우선순위 정리",
    summary: "운영 이슈 우선순위를 다시 맞추고 전달 흐름을 정리했습니다.",
    reflectedSentence: "운영 이슈 우선순위를 조정하고 관련 요청사항을 분류해 협업 전달 효율을 높였습니다.",
    strengthTags: ["협업 조율", "우선순위 판단"],
    linkedAssetIds: ["asset_coordination_01"],
  },
  {
    id: "manual_2026-04-02_docs",
    date: "2026-04-02",
    source: "manual",
    workType: "문서/보고",
    title: "내부 공유용 요약 작성",
    summary: "개발팀 전달용 메모와 내부 공유 요약을 정리했습니다.",
    linkedAssetIds: ["asset_coordination_01"],
  },
  {
    id: "manual_2026-04-03_support",
    date: "2026-04-03",
    source: "manual",
    workType: "문의 대응",
    title: "반복 오류 사례 분류",
    summary: "반복 오류 사례를 다시 분류해 응대 기준을 보강했습니다.",
    reflectedSentence: "반복 오류 사례를 분류하고 후속 안내 문구 및 전달 메모를 정리해 대응 흐름 개선에 기여했습니다.",
    strengthTags: ["운영 이슈 구조화", "후속 실행 관리"],
    linkedAssetIds: ["asset_ops_01"],
  },
  {
    id: "manual_2026-04-03_ops",
    date: "2026-04-03",
    source: "manual",
    workType: "운영 개선",
    title: "후속 안내 문구 수정",
    summary: "오류 대응 후 후속 안내 문구를 다시 정리했습니다.",
    linkedAssetIds: ["asset_ops_01"],
  },
  {
    id: "manual_2026-04-03_docs",
    date: "2026-04-03",
    source: "manual",
    workType: "문서/보고",
    title: "개발팀 전달 메모 작성",
    summary: "반복 오류 배경과 필요한 조치 사항을 메모로 정리했습니다.",
    linkedAssetIds: ["asset_ops_01"],
  },
];

const MOCK_NOTION_ROWS = [
  {
    id: "notion_row_0408",
    date: "2026-04-08",
    workType: "운영 개선",
    title: "응대 흐름 점검",
    summary: "응대 흐름 중 누락되는 케이스를 점검하고 보완 기준을 정리했습니다.",
    strengthTags: ["운영 개선"],
  },
  {
    id: "notion_row_0418",
    date: "2026-04-18",
    workType: "문서/보고",
    title: "처리 기준 문서 정리",
    summary: "처리 기준과 공유용 요약 문서를 함께 정리했습니다.",
    strengthTags: ["문서화"],
  },
];

const MOCK_GCAL_EVENTS = [
  {
    id: "gcal_0414",
    date: "2026-04-14",
    workType: "이슈 조율",
    title: "요청사항 분류 및 전달",
    description: "문의 유형을 정리하고 요청사항을 다시 분류해 전달 흐름을 맞췄습니다.",
    strengthTags: ["고객 맥락 이해", "협업 조율"],
  },
  {
    id: "gcal_0422",
    date: "2026-04-22",
    workType: "운영 개선",
    title: "응대 흐름 점검",
    description: "운영 이슈 우선순위와 응대 흐름을 함께 재정리했습니다.",
    strengthTags: ["운영 판단", "조율"],
  },
  {
    id: "gcal_0427",
    date: "2026-04-27",
    workType: "문의 대응",
    title: "누락 케이스 정리",
    description: "월말 기준으로 누락 케이스를 다시 확인하며 문의 유형을 보강했습니다.",
    strengthTags: ["정리력"],
  },
];

export const PASSMAP_DEMO_RANGE_RECORDS = [
  {
    id: "pm-demo-personal-faq-2026-04-07",
    date: "2026-04-07",
    source: "passmap-demo",
    recordType: "personal",
    startDate: "2026-04-07",
    endDate: "2026-04-09",
    projectPeriod: "2026-04-07 ~ 2026-04-09",
    workType: "개인 업무",
    title: "지원자 문의 FAQ 정리",
    summary: "반복 문의 유형을 정리하고 FAQ 답변 기준을 만들었습니다.",
    reflectedSentence: "지원자 문의 FAQ 정리를 통해 반복 문의 대응 기준을 정리한 경험을 남겼습니다.",
    strengthTags: ["문서/보고", "운영 개선"],
    linkedAssetIds: [],
  },
  {
    id: "pm-demo-team-ui-copy-2026-04-14",
    date: "2026-04-14",
    source: "passmap-demo",
    recordType: "teamProject",
    startDate: "2026-04-14",
    endDate: "2026-04-18",
    projectPeriod: "2026-04-14 ~ 2026-04-18",
    workType: "팀 프로젝트",
    title: "패스맵 UI 문구 개선",
    summary: "경험 정리 화면의 버튼명, 태그 표현, 입력 문구를 개선했습니다.",
    reflectedSentence: "패스맵 UI 문구 개선 프로젝트에서 사용자 피드백을 바탕으로 화면 문구와 입력 흐름을 개선했습니다.",
    strengthTags: ["기획", "UI문구개선", "흐름명확화"],
    linkedAssetIds: [],
  },
];

export const homeDashboardMock = {
  title: "PASSMAP Home",
  subtitle: "현재 상태, 최근 활동, 다음 액션을 한 번에 보여주는 1차 운영 허브입니다.",
  helperText: "아래 수치는 홈 UI 구조 확인용 샘플 데이터이며, 실제 분석 결과 집계와는 연결되어 있지 않습니다.",
  actionStatus: [
    {
      title: "오늘 기록 상태",
      value: "완료",
      note: "오늘 기록과 해석이 바로 이어졌습니다.",
    },
    {
      title: "이번 주 기록 수",
      value: "3건",
      note: "이번 주 기준으로 기록 흐름이 쌓이고 있습니다.",
    },
    {
      title: "최근 반영 자산",
      value: "1건",
      note: "문서화 자산이 최신 반영 상태입니다.",
    },
    {
      title: "보완 포인트",
      value: "성과 수치",
      note: "숫자나 변화 기준을 한 줄 더 붙이면 좋습니다.",
    },
  ],
  calendarMonth: buildCalendarMonthViewModel({
    year: 2026,
    month: 4,
    today: "2026-04-03",
  }),
  calendarLegend: [
    { key: "support", label: "문의 대응", color: "bg-slate-900" },
    { key: "coordination", label: "이슈 조율", color: "bg-emerald-500" },
    { key: "docs", label: "문서/보고", color: "bg-amber-500" },
    { key: "ops", label: "운영 개선", color: "bg-sky-500" },
  ],
  records: [
    ...MANUAL_RECORDS,
    ...MOCK_NOTION_ROWS.map(normalizeNotionRecord),
    ...MOCK_GCAL_EVENTS.map(normalizeGoogleCalendarEvent),
  ],
  today: "2026-04-03",
  recentUpdates: [
    {
      title: "고객 커뮤니케이션 프로세스 개선",
      date: "2026-04-01",
      summary: "이슈 접수부터 후속 조치까지의 전달 흐름을 정리했습니다.",
    },
    {
      title: "협업 이슈 조율 경험 정리",
      date: "2026-03-30",
      summary: "부서 간 의사결정 조율 경험을 한 줄 성과 문장으로 압축했습니다.",
    },
    {
      title: "운영 지표 보고 구조 정리",
      date: "2026-03-28",
      summary: "주간 리포트에서 반복적으로 보는 지표와 보고 포맷을 정리했습니다.",
    },
  ],
  recentReports: [
    {
      title: "PM 전환 리스크 요약",
      date: "2026-03-31",
      summary: "경험 전환 강점과 부족 신호를 요약한 리포트입니다.",
    },
    {
      title: "서비스기획 JD 준비도 점검",
      date: "2026-03-28",
      summary: "JD 기준 충족 항목과 보완이 필요한 항목을 정리했습니다.",
    },
  ],
  recommendedActions: [
    "이번 주 업무 업데이트 1건을 추가해 최근 흐름을 비우지 않기",
    "최근 리포트 요약을 검토하고 이력서 반영 후보 문장 1개 추리기",
    "목표 JD 기준에서 아직 약한 항목을 다시 확인하기",
    "협업 조율 경험을 PM 관점 성과 문장으로 한 번 더 정리하기",
  ],
};
