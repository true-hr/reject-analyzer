export const FIRST_RECORD_GUIDED_TOUR_KEYS = {
  dismissed: "passmap:first-record-guided-tour-dismissed:v1",
  completed: "passmap:first-record-guided-tour-completed:v1",
};

export const CANDIDATE_REVIEW_TOUR_KEYS = {
  armed: "passmap:first-record-candidate-review-tour-armed:v1",
  dismissed: "passmap:first-record-candidate-review-tour-dismissed:v1",
  completed: "passmap:first-record-candidate-review-tour-completed:v1",
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

export const CANDIDATE_REVIEW_TOUR_IDS = {
  reviewList: "candidate-review-list",
  acceptControl: "candidate-accept-control",
  saveButton: "candidate-save-button",
  saveSuccess: "candidate-save-success",
  assetMapButton: "post-save-asset-map-button",
  resumeButton: "post-save-resume-button",
  mobileReviewList: "mobile-candidate-review-list",
  mobileAcceptControl: "mobile-candidate-accept-control",
  mobileSaveButton: "mobile-candidate-save-button",
  mobileSaveSuccess: "mobile-candidate-save-success",
  mobileAssetMapButton: "mobile-post-save-asset-map-button",
  mobileResumeButton: "mobile-post-save-resume-button",
};

export const WEB_FIRST_RECORD_TOUR_STEPS = [
  {
    id: "home-first-record-cta",
    targetId: "home-first-record-cta",
    title: "그대로 붙여넣으면 됩니다",
    description:
      "오늘 한 일이나 AI와 나눈 업무 대화를 그대로 넣어도 됩니다. 완벽한 문장일 필요는 없어요.",
    placement: "bottom",
    nextLabel: "기록 화면으로 이동",
    action: "openRecordInput",
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
      "내용을 입력한 뒤 이 버튼을 누르면 AI가 정리된 경험을 만들어줍니다. 맞는 것만 확인하고 저장하면 됩니다.",
    placement: "top",
    completeLabel: "알겠어요",
    waitForTargetMs: 2800,
  },
];

export const WEB_CANDIDATE_REVIEW_TOUR_STEPS = [
  {
    id: "candidate-review-list",
    targetId: "candidate-review-list",
    title: "AI가 정리한 경험을 확인하세요",
    description:
      "방금 입력한 내용을 이력서에 쓸 수 있는 정리된 경험으로 만들었습니다. 맞는 내용인지 가볍게 확인해 주세요.",
    placement: "top",
    waitForTargetMs: 1600,
  },
  {
    id: "candidate-save-button",
    targetId: "candidate-save-button",
    title: "맞는 것만 저장하면 됩니다",
    description:
      "모든 문장을 완벽하게 다듬을 필요는 없습니다. 지금 맞는 정리된 경험만 저장해도 이력서 문장 재료가 됩니다.",
    placement: "top",
    waitForTargetMs: 1600,
    completeLabel: "저장 후 계속 보기",
  },
];

export const WEB_CANDIDATE_POST_SAVE_TOUR_STEPS = [];

export const MOBILE_CANDIDATE_REVIEW_TOUR_STEPS = [
  {
    id: "mobile-candidate-review-list",
    targetId: "mobile-candidate-review-list",
    title: "AI가 정리한 경험을 확인하세요",
    description:
      "방금 입력한 내용을 정리된 경험으로 만들었습니다. 맞는 내용인지 가볍게 확인해 주세요.",
    placement: "top",
    waitForTargetMs: 1600,
    mobileSheet: true,
  },
  {
    id: "mobile-candidate-save-button",
    targetId: "mobile-candidate-save-button",
    title: "맞는 것만 저장하면 됩니다",
    description:
      "내 경험에 맞는 정리된 경험만 저장하세요. 나중에 이력서 문장 재료로 볼 수 있습니다.",
    placement: "top",
    waitForTargetMs: 1600,
    completeLabel: "저장 후 계속 보기",
    mobileSheet: true,
  },
];

export const MOBILE_CANDIDATE_POST_SAVE_TOUR_STEPS = [];

export const MOBILE_FIRST_RECORD_TOUR_STEPS = [
  {
    id: "mobile-bottom-tab-record",
    targetId: "mobile-bottom-tab-record",
    title: "기록 탭에서 시작하세요",
    description:
      "기록 탭으로 이동해 오늘 한 일이나 AI 대화 내용을 넣습니다.",
    placement: "top",
    nextLabel: "기록 탭으로 이동",
    action: "navigateRecord",
    mobileSheet: true,
  },
  {
    id: "mobile-record-source-tabs",
    targetId: "mobile-record-source-tabs",
    title: "AI 대화도 넣을 수 있어요",
    description:
      "직접 쓴 업무 기록도, AI와 나눈 대화도 초안 재료가 됩니다.",
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
      "내용을 입력한 뒤 이 버튼을 누르면 AI가 정리된 경험을 만들어줍니다.",
    placement: "top",
    completeLabel: "알겠어요",
    waitForTargetMs: 2800,
    mobileSheet: true,
  },
];

export function getFirstRecordTourSteps(variant = "web") {
  return variant === "mobile" ? MOBILE_FIRST_RECORD_TOUR_STEPS : WEB_FIRST_RECORD_TOUR_STEPS;
}

export function getCandidateReviewTourSteps(phase = "review", variant = "web") {
  if (variant === "mobile") {
    return phase === "postSave"
      ? MOBILE_CANDIDATE_POST_SAVE_TOUR_STEPS
      : MOBILE_CANDIDATE_REVIEW_TOUR_STEPS;
  }
  return phase === "postSave" ? WEB_CANDIDATE_POST_SAVE_TOUR_STEPS : WEB_CANDIDATE_REVIEW_TOUR_STEPS;
}
