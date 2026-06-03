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
    title: "AI 대화도 업무기록 후보가 됩니다",
    description: "모바일에서는 하단 시트형 안내로 확장할 수 있도록 step 구조만 준비합니다.",
    placement: "bottom",
  },
];

export function getFirstRecordTourSteps(variant = "web") {
  return variant === "mobile" ? MOBILE_FIRST_RECORD_TOUR_STEPS : WEB_FIRST_RECORD_TOUR_STEPS;
}
