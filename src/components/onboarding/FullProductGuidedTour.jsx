import { useEffect, useMemo, useRef, useState } from "react";
import GuidedTourOverlay from "./GuidedTourOverlay.jsx";
import {
  FULL_PRODUCT_TOUR_KEYS,
  getFullProductTourSteps,
} from "./fullProductTourSteps.js";

function writeTourState(key) {
  try {
    window.localStorage.setItem(key, "1");
  } catch (_) {}
}

export default function FullProductGuidedTour({
  open,
  variant = "web",
  onNavigate,
  onClose,
  onComplete,
}) {
  const steps = useMemo(() => getFullProductTourSteps(variant), [variant]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const onNavigateRef = useRef(onNavigate);

  useEffect(() => {
    onNavigateRef.current = onNavigate;
  }, [onNavigate]);

  useEffect(() => {
    if (!open) return;
    setCurrentIndex(0);
    onNavigateRef.current?.(steps[0]?.action);
  }, [open, steps]);

  const close = (completed = false) => {
    writeTourState(completed ? FULL_PRODUCT_TOUR_KEYS.completed : FULL_PRODUCT_TOUR_KEYS.dismissed);
    if (completed) {
      onComplete?.();
      return;
    }
    onClose?.();
  };

  const moveTo = (nextIndex) => {
    const clampedIndex = Math.max(0, Math.min(nextIndex, steps.length - 1));
    onNavigateRef.current?.(steps[clampedIndex]?.action);
    setCurrentIndex(clampedIndex);
  };

  const handleNext = () => {
    if (currentIndex >= steps.length - 1) {
      close(true);
      return;
    }
    moveTo(currentIndex + 1);
  };

  const handlePrev = () => {
    moveTo(currentIndex - 1);
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
