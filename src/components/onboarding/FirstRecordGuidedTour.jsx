import { useEffect, useMemo, useState } from "react";
import GuidedTourOverlay from "./GuidedTourOverlay.jsx";
import {
  FIRST_RECORD_GUIDED_TOUR_KEYS,
  getFirstRecordTourSteps,
} from "./firstRecordTourSteps.js";

function writeTourState(key) {
  try {
    window.localStorage.setItem(key, "1");
  } catch (_) {}
}

export default function FirstRecordGuidedTour({
  open,
  variant = "web",
  selectedDate = null,
  onOpenRecordInput,
  onNavigate,
  onClose,
  onComplete,
}) {
  const steps = useMemo(() => getFirstRecordTourSteps(variant), [variant]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    setCurrentIndex(0);
  }, [open]);

  const close = (completed = false) => {
    writeTourState(
      completed
        ? FIRST_RECORD_GUIDED_TOUR_KEYS.completed
        : FIRST_RECORD_GUIDED_TOUR_KEYS.dismissed
    );
    if (completed) {
      onComplete?.();
      return;
    }
    onClose?.();
  };

  const handleNext = () => {
    const step = steps[currentIndex];
    if (currentIndex >= steps.length - 1) {
      close(true);
      return;
    }
    if (step?.action === "openRecordInput") {
      onOpenRecordInput?.({ date: selectedDate });
      onNavigate?.("record");
    }
    setCurrentIndex((value) => Math.min(value + 1, steps.length - 1));
  };

  const handlePrev = () => {
    setCurrentIndex((value) => Math.max(value - 1, 0));
  };

  return (
    <GuidedTourOverlay
      open={open}
      steps={steps}
      currentIndex={currentIndex}
      variant={variant}
      onPrev={handlePrev}
      onNext={handleNext}
      onSkip={() => close(false)}
      onClose={() => close(false)}
    />
  );
}
