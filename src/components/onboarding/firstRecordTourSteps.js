export const FIRST_RECORD_GUIDED_TOUR_KEYS = {
  dismissed: "passmap:first-record-guided-tour-dismissed:v1",
  completed: "passmap:first-record-guided-tour-completed:v1",
};

export const CANDIDATE_REVIEW_TOUR_KEYS = {
  armed: "passmap:first-record-candidate-review-tour-armed:v1",
  dismissed: "passmap:first-record-candidate-review-tour-dismissed:v1",
  completed: "passmap:first-record-candidate-review-tour-completed:v1",
};

export const PASSMAP_CHROME_EXTENSION_WEB_STORE_URL =
  "https://chromewebstore.google.com/search/PASSMAP%20AI%20%EC%9E%91%EC%97%85%20%EC%A0%80%EC%9E%A5";

export const FIRST_RECORD_TOUR_IDS = {
  aiCaptureCard: "home-ai-capture-card",
  homeRecordCta: "home-first-record-cta",
  recordSourceTabs: "record-source-tabs",
  recordTextarea: "record-raw-textarea",
  recordDraftButton: "record-create-draft-button",
  mobileAiCaptureCard: "mobile-home-ai-capture-card",
  mobileHomeRecordCta: "mobile-home-first-record-cta",
  mobileBottomTabRecord: "mobile-bottom-tab-record",
  mobileRecordTracePanel: "mobile-record-trace-panel",
  mobileRecordSourceTabs: "mobile-record-source-tabs",
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
    id: "home-ai-capture-card",
    targetId: "home-ai-capture-card",
    title: "Chrome 확장프로그램 설치하기",
    description:
      "PASSMAP 공식 확장프로그램을 설치하면 ChatGPT 대화나 선택한 업무 텍스트를 PASSMAP으로 바로 보낼 수 있어요.",
    helperText:
      "설치 후 Chrome 우측 상단 퍼즐 아이콘에서 PASSMAP AI 작업 저장을 고정해두면 더 편하게 사용할 수 있어요. 그다음 PASSMAP에서 연결 코드를 발급해 확장프로그램에 입력하면 연결됩니다.",
    placement: "bottom",
    externalLink: {
      href: PASSMAP_CHROME_EXTENSION_WEB_STORE_URL,
      label: "Chrome 웹스토어에서 설치하기",
    },
    nextLabel: "기록 방법 보기",
  },
  {
    id: "home-first-record-cta",
    targetId: "home-first-record-cta",
    title: "그대로 붙여넣으면 됩니다",
    description:
      "회의록, 엑셀, 서비스 URL, 이미지처럼 이미 있는 자료를 골라 넣어도 됩니다. 완벽한 문장일 필요는 없어요.",
    placement: "bottom",
    nextLabel: "기록 화면으로 이동",
    action: "openRecordInput",
  },
  {
    id: "record-source-tabs",
    targetId: "record-source-tabs",
    title: "그냥 붙여넣어도 됩니다",
    description:
      "자료 유형을 고르지 않아도 됩니다. 오늘 한 일, 대화, 회의록, 업무보고, 서비스 URL을 한 입력창에 그대로 넣어주세요.",
    placement: "bottom",
    waitForTargetMs: 2800,
  },
  {
    id: "record-raw-textarea",
    targetId: "record-raw-textarea",
    title: "필요하면 자료 유형을 바꿀 수 있어요",
    description:
      "입력창 아래의 작은 옵션에서 자료 유형을 바꾸면 안내와 버튼 문구만 보조적으로 달라집니다.",
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
    id: "mobile-home-ai-capture-card",
    targetId: "mobile-home-ai-capture-card",
    title: "PC Chrome에서 확장프로그램 설치하기",
    description:
      "PASSMAP 공식 확장프로그램을 설치하면 ChatGPT 대화나 선택한 업무 텍스트를 PASSMAP으로 바로 보낼 수 있어요.",
    helperText:
      "Chrome 확장프로그램은 PC Chrome에서 설치할 수 있어요. 설치 후 퍼즐 아이콘에서 PASSMAP AI 작업 저장을 고정하고, PASSMAP에서 발급한 연결 코드를 입력하면 연결됩니다.",
    placement: "top",
    externalLink: {
      href: PASSMAP_CHROME_EXTENSION_WEB_STORE_URL,
      label: "Chrome 웹스토어에서 설치하기",
    },
    nextLabel: "기록 탭 안내 보기",
    mobileSheet: true,
  },
  {
    id: "mobile-bottom-tab-record",
    targetId: "mobile-bottom-tab-record",
    title: "기록 탭에서 시작하세요",
    description:
      "기록 탭으로 이동해 오늘 한 일이나 이미 가진 업무 자료를 넣습니다.",
    placement: "top",
    nextLabel: "기록 탭으로 이동",
    action: "navigateRecord",
    mobileSheet: true,
  },
  {
    id: "mobile-record-source-tabs",
    targetId: "mobile-record-source-tabs",
    title: "그냥 붙여넣어도 됩니다",
    description:
      "자료 유형을 고르지 않아도 됩니다. 오늘 한 일, 대화, 회의록, 업무보고, 서비스 URL을 한 입력창에 그대로 넣어주세요.",
    placement: "top",
    waitForTargetMs: 2800,
    mobileSheet: true,
  },
  {
    id: "mobile-record-raw-textarea",
    targetId: "mobile-record-raw-textarea",
    title: "필요하면 자료 유형을 바꿀 수 있어요",
    description:
      "입력창 아래의 작은 옵션에서 자료 유형을 바꾸면 안내와 버튼 문구만 보조적으로 달라집니다.",
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
