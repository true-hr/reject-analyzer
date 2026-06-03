export const FIRST_RECORD_GUIDED_TOUR_KEYS = {
  dismissed: "passmap:first-record-guided-tour-dismissed:v1",
  completed: "passmap:first-record-guided-tour-completed:v1",
};

export const FIRST_RECORD_TOUR_IDS = {
  aiCaptureCard: "home-ai-capture-card",
  homeRecordCta: "home-first-record-cta",
  recordSourceTabs: "record-source-tabs",
  recordSourceTabAi: "record-source-tab-ai",
  recordTextarea: "record-raw-textarea",
  recordDraftButton: "record-create-draft-button",
  mobileAiCaptureCard: "mobile-home-ai-capture-card",
  mobileHomeRecordCta: "mobile-home-first-record-cta",
  mobileBottomTabRecord: "mobile-bottom-tab-record",
  mobileRecordTracePanel: "mobile-record-trace-panel",
  mobileRecordSourceTabs: "mobile-record-source-tabs",
  mobileRecordSourceTabAi: "mobile-record-source-tab-ai",
  mobileRecordTextarea: "mobile-record-raw-textarea",
  mobileRecordDraftButton: "mobile-record-create-draft-button",
};

export const WEB_FIRST_RECORD_TOUR_STEPS = [
  {
    id: "home-ai-capture-card",
    targetId: "home-ai-capture-card",
    title: "AI 대화도 업무기록 후보가 됩니다",
    description:
      "ChatGPT에서 정리한 업무 내용을 PASSMAP으로 보내면, 맞는 내용만 확인해서 커리어 자산으로 쌓을 수 있어요.",
    placement: "bottom",
  },
  {
    id: "home-first-record-cta",
    targetId: "home-first-record-cta",
    title: "첫 기록은 여기서 시작합니다",
    description:
      "오늘 한 일이나 AI와 나눈 업무 대화를 그대로 붙여넣으면 됩니다. 완벽한 문장일 필요는 없어요.",
    placement: "bottom",
    nextLabel: "기록 화면으로 이동",
    action: "openRecordInput",
  },
  {
    id: "record-source-tabs",
    targetId: "record-source-tabs",
    title: "업무 기록과 AI 대화 기록을 선택할 수 있어요",
    description:
      "직접 적은 업무도, AI와 정리한 대화도 모두 이력서 재료와 커리어 자산의 출발점이 됩니다.",
    placement: "bottom",
    waitForTargetMs: 3200,
  },
  {
    id: "record-raw-textarea",
    targetId: "record-raw-textarea",
    title: "여기에 그대로 붙여넣으세요",
    description:
      "오늘 한 일, 회의 내용, 고객 대응, AI와 나눈 업무 대화 등 무엇이든 초안 재료가 됩니다.",
    placement: "top",
    waitForTargetMs: 2800,
  },
  {
    id: "record-create-draft-button",
    targetId: "record-create-draft-button",
    title: "AI가 경험 초안을 찾아줍니다",
    description:
      "내용을 입력한 뒤 이 버튼을 누르면 PASSMAP이 이력서 재료로 쓸 만한 경험 후보를 정리합니다.",
    placement: "top",
    completeLabel: "알겠어요",
    waitForTargetMs: 2800,
  },
];

export const MOBILE_FIRST_RECORD_TOUR_STEPS = [
  {
    id: "mobile-home-ai-capture-card",
    targetId: "mobile-home-ai-capture-card",
    title: "AI 대화도 기록 후보가 됩니다",
    description:
      "AI와 정리한 업무 대화도 PASSMAP에 후보로 보낼 수 있어요. 나중에 맞는 내용만 확인하면 됩니다.",
    placement: "bottom",
    mobileSheet: true,
  },
  {
    id: "mobile-home-first-record-cta",
    targetId: "mobile-home-first-record-cta",
    title: "첫 기록은 여기서 시작해요",
    description:
      "오늘 한 일을 짧게 남기면 이력서와 면접 준비의 재료가 됩니다.",
    placement: "bottom",
    mobileSheet: true,
  },
  {
    id: "mobile-bottom-tab-record",
    targetId: "mobile-bottom-tab-record",
    title: "기록 탭에서 계속 작성할 수 있어요",
    description:
      "기록 탭으로 이동해 오늘 한 일이나 AI 대화 내용을 입력합니다.",
    placement: "top",
    nextLabel: "기록 탭으로 이동",
    action: "navigateRecord",
    mobileSheet: true,
  },
  {
    id: "mobile-record-trace-panel",
    targetId: "mobile-record-trace-panel",
    title: "오늘 한 일 기록하기를 열어두세요",
    description:
      "짧은 업무 메모도 괜찮아요. PASSMAP이 나중에 경험 초안으로 정리합니다.",
    placement: "top",
    waitForTargetMs: 3200,
    mobileSheet: true,
  },
  {
    id: "mobile-record-source-tabs",
    targetId: "mobile-record-source-tabs",
    title: "업무 기록과 AI 대화를 선택할 수 있어요",
    description:
      "직접 쓴 업무 기록도, AI와 나눈 대화도 모두 커리어 자산의 재료가 됩니다.",
    placement: "top",
    waitForTargetMs: 2800,
    mobileSheet: true,
  },
  {
    id: "mobile-record-raw-textarea",
    targetId: "mobile-record-raw-textarea",
    title: "여기에 그대로 붙여넣으세요",
    description:
      "오늘 한 일, 회의 내용, 고객 대응, AI 대화 내용을 완성된 문장이 아니어도 그대로 넣으면 됩니다.",
    placement: "top",
    waitForTargetMs: 2800,
    mobileSheet: true,
  },
  {
    id: "mobile-record-create-draft-button",
    targetId: "mobile-record-create-draft-button",
    title: "AI가 경험 초안을 찾아줍니다",
    description:
      "내용을 입력한 뒤 이 버튼을 누르면 이력서 재료로 쓸 만한 경험 후보를 정리합니다.",
    placement: "top",
    completeLabel: "알겠어요",
    waitForTargetMs: 2800,
    mobileSheet: true,
  },
];

export function getFirstRecordTourSteps(variant = "web") {
  return variant === "mobile" ? MOBILE_FIRST_RECORD_TOUR_STEPS : WEB_FIRST_RECORD_TOUR_STEPS;
}
