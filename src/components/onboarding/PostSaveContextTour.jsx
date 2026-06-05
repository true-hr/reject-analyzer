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
    description: "저장한 경험을 바탕으로, 서류에서 걸릴 수 있는 이유나 다른 직무로 갈 수 있는 방향을 별도로 점검할 수 있습니다.",
  },
  assetMap: {
    intent: POST_SAVE_CONTEXT_TOUR_TARGETS.assetMap,
    completedKey: "passmap:post-save-asset-map-context-tour-completed:v1",
    dismissedKey: "passmap:post-save-asset-map-context-tour-dismissed:v1",
    webTargetId: "post-save-asset-map-context-root",
    mobileTargetId: "mobile-post-save-asset-map-context-root",
    title: "강점 재료를 볼 수 있어요",
    description: "어떤 일에서 나온 강점인지 짧게 확인할 수 있습니다.",
  },
  resume: {
    intent: POST_SAVE_CONTEXT_TOUR_TARGETS.resume,
    completedKey: "passmap:post-save-resume-context-tour-completed:v1",
    dismissedKey: "passmap:post-save-resume-context-tour-dismissed:v1",
    webTargetId: "post-save-resume-context-root",
    mobileTargetId: "mobile-post-save-resume-context-root",
    title: "이력서 문장 재료를 볼 수 있어요",
    description: "저장한 경험을 이력서에 쓸 문장 재료로 확인할 수 있습니다.",
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
