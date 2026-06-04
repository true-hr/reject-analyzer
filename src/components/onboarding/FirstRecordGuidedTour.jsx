import { useEffect, useMemo, useState } from "react";
import GuidedTourOverlay from "./GuidedTourOverlay.jsx";
import {
  CANDIDATE_REVIEW_TOUR_KEYS,
  FIRST_RECORD_GUIDED_TOUR_KEYS,
  getCandidateReviewTourSteps,
  getFirstRecordTourSteps,
} from "./firstRecordTourSteps.js";

function writeTourState(key) {
  try {
    window.localStorage.setItem(key, "1");
  } catch (_) {}
}

function writeSessionTourState(key) {
  try {
    window.sessionStorage.setItem(key, "1");
  } catch (_) {}
}

function clearSessionTourState(key) {
  try {
    window.sessionStorage.removeItem(key);
  } catch (_) {}
}

export default function FirstRecordGuidedTour({
  open,
  variant = "web",
  tourType = "firstRecord",
  candidateReviewPhase = "review",
  selectedDate = null,
  onOpenRecordInput,
  onNavigate,
  onClose,
  onComplete,
}) {
  const steps = useMemo(
    () => tourType === "candidateReview"
      ? getCandidateReviewTourSteps(candidateReviewPhase)
      : getFirstRecordTourSteps(variant),
    [candidateReviewPhase, tourType, variant]
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    setCurrentIndex(0);
  }, [open]);

  const close = (completed = false) => {
    if (tourType === "candidateReview") {
      if (completed && candidateReviewPhase === "postSave") {
        writeTourState(CANDIDATE_REVIEW_TOUR_KEYS.completed);
        clearSessionTourState(CANDIDATE_REVIEW_TOUR_KEYS.armed);
      } else if (!completed) {
        writeTourState(CANDIDATE_REVIEW_TOUR_KEYS.dismissed);
        clearSessionTourState(CANDIDATE_REVIEW_TOUR_KEYS.armed);
      }
    } else {
      writeTourState(
        completed
          ? FIRST_RECORD_GUIDED_TOUR_KEYS.completed
          : FIRST_RECORD_GUIDED_TOUR_KEYS.dismissed
      );
      if (completed) {
        writeSessionTourState(CANDIDATE_REVIEW_TOUR_KEYS.armed);
      }
    }
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
    if (step?.action === "navigateRecord") {
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
