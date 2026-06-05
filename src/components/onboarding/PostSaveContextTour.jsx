import { useMemo, useState } from "react";
import GuidedTourOverlay from "./GuidedTourOverlay.jsx";

const POST_SAVE_CONTEXT_TOUR_INTENT_KEY = "passmap:post-save-context-tour-intent:v1";
const POST_SAVE_CONTEXT_TOUR_TARGETS = {
  analysis: "analysis",
  assetMap: "asset-map",
  resume: "resume",
};

const TOUR_META = {
  analysis: {
    intent: POST_SAVE_CONTEXT_TOUR_TARGETS.analysis,
    completedKey: "passmap:post-save-analysis-context-tour-completed:v1",
    dismissedKey: "passmap:post-save-analysis-context-tour-dismissed:v1",
    webTargetId: "post-save-analysis-context-root",
    mobileTargetId: "mobile-post-save-analysis-context-root",
    title: "지원 방향을 따로 점검할 수 있어요",
    description: "저장한 경험을 바탕으로, 서류탈락 원인이나 직무·산업 전환 가능성을 별도로 분석해 볼 수 있습니다.",
  },
  assetMap: {
    intent: POST_SAVE_CONTEXT_TOUR_TARGETS.assetMap,
    completedKey: "passmap:post-save-asset-map-context-tour-completed:v1",
    dismissedKey: "passmap:post-save-asset-map-context-tour-dismissed:v1",
    webTargetId: "post-save-asset-map-context-root",
    mobileTargetId: "mobile-post-save-asset-map-context-root",
    title: "저장한 기록이 강점으로 연결됩니다",
    description: "방금 저장한 경험은 자산맵에서 역량, 업무 맥락, 직무 방향으로 다시 연결됩니다.",
  },
  resume: {
    intent: POST_SAVE_CONTEXT_TOUR_TARGETS.resume,
    completedKey: "passmap:post-save-resume-context-tour-completed:v1",
    dismissedKey: "passmap:post-save-resume-context-tour-dismissed:v1",
    webTargetId: "post-save-resume-context-root",
    mobileTargetId: "mobile-post-save-resume-context-root",
    title: "저장한 경험은 이력서 재료가 됩니다",
    description: "방금 저장한 경험은 나중에 지원서 문장으로 다듬을 수 있는 후보 재료로 활용됩니다.",
  },
};

function readIntent() {
  try {
    return window.sessionStorage.getItem(POST_SAVE_CONTEXT_TOUR_INTENT_KEY) || "";
  } catch {
    return "";
  }
}

function clearIntent() {
  try {
    window.sessionStorage.removeItem(POST_SAVE_CONTEXT_TOUR_INTENT_KEY);
  } catch {
    return;
  }
}

function hasStorageKey(key) {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeStorageKey(key) {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    return;
  }
}

function noop() {
  return null;
}

function shouldOpenContextTour(meta) {
  if (!meta || typeof window === "undefined") return false;
  if (readIntent() !== meta.intent) return false;
  clearIntent();
  return !hasStorageKey(meta.completedKey) && !hasStorageKey(meta.dismissedKey);
}

export default function PostSaveContextTour({ type, variant = "web" }) {
  const meta = TOUR_META[type] || null;
  const [open, setOpen] = useState(() => shouldOpenContextTour(meta));

  const steps = useMemo(() => {
    if (!meta) return [];
    return [{
      id: `${meta.intent}-post-save-context`,
      targetId: variant === "mobile" ? meta.mobileTargetId : meta.webTargetId,
      title: meta.title,
      description: meta.description,
      placement: "bottom",
      mobileSheet: variant === "mobile",
      completeLabel: "확인했어요",
    }];
  }, [meta, variant]);

  if (!meta) return null;

  const close = (completed) => {
    writeStorageKey(completed ? meta.completedKey : meta.dismissedKey);
    setOpen(false);
  };

  return (
    <GuidedTourOverlay
      open={open}
      steps={steps}
      currentIndex={0}
      variant={variant}
      onPrev={noop}
      onNext={() => close(true)}
      onSkip={() => close(false)}
      onClose={() => close(false)}
    />
  );
}
