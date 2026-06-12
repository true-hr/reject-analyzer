import { useEffect, useMemo, useRef, useState } from "react";
import GuidedTourOverlay from "./GuidedTourOverlay.jsx";
import {
  FULL_PRODUCT_TOUR_KEYS,
  getFullProductTourSteps,
} from "./fullProductTourSteps.js";

const STEP_NAVIGATION_DELAY_MS = 650;

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
  const [transitionState, setTransitionState] = useState(null);
  const onNavigateRef = useRef(onNavigate);
  const transitionTimerRef = useRef(null);

  useEffect(() => {
    onNavigateRef.current = onNavigate;
  }, [onNavigate]);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    setTransitionState(null);
    setCurrentIndex(0);
    onNavigateRef.current?.(steps[0]?.action);
  }, [open, steps]);

  const close = (completed = false) => {
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    setTransitionState(null);
    writeTourState(completed ? FULL_PRODUCT_TOUR_KEYS.completed : FULL_PRODUCT_TOUR_KEYS.dismissed);
    if (completed) {
      onComplete?.();
      return;
    }
    onClose?.();
  };

  const moveTo = (nextIndex) => {
    const clampedIndex = Math.max(0, Math.min(nextIndex, steps.length - 1));
    const nextStep = steps[clampedIndex];
    const hasNavigation = Boolean(nextStep?.action);

    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }

    if (hasNavigation) {
      const delay = nextStep.transitionDelayMs ?? STEP_NAVIGATION_DELAY_MS;
      setTransitionState({
        label: nextStep.transitionLabel || "화면 이동 중입니다...",
      });
      onNavigateRef.current?.(nextStep.action);
      transitionTimerRef.current = window.setTimeout(() => {
        transitionTimerRef.current = null;
        setCurrentIndex(clampedIndex);
        setTransitionState(null);
      }, delay);
      return;
    }

    setCurrentIndex(clampedIndex);
    setTransitionState(null);
  };

  const handleNext = () => {
    if (transitionState) return;
    if (currentIndex >= steps.length - 1) {
      close(true);
      return;
    }
    moveTo(currentIndex + 1);
  };

  const handlePrev = () => {
    if (transitionState) return;
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
      isTransitioning={Boolean(transitionState)}
      transitionLabel={transitionState?.label}
    />
  );
}
