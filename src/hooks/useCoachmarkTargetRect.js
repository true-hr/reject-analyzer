import { useCallback, useEffect, useState } from "react";

const EMPTY_RECT = null;

function getTarget(targetId) {
  if (!targetId || typeof document === "undefined") return null;
  try {
    return document.querySelector(`[data-tour-id="${targetId}"]`);
  } catch (_) {
    return null;
  }
}

function getViewportRect(element, padding) {
  if (!element) return EMPTY_RECT;
  const rect = element.getBoundingClientRect();
  return {
    top: Math.max(8, rect.top - padding),
    left: Math.max(8, rect.left - padding),
    width: Math.min(window.innerWidth - 16, rect.width + padding * 2),
    height: Math.min(window.innerHeight - 16, rect.height + padding * 2),
  };
}

export default function useCoachmarkTargetRect(targetId, { open = false, padding = 8 } = {}) {
  const [targetElement, setTargetElement] = useState(null);
  const [targetRect, setTargetRect] = useState(EMPTY_RECT);
  const [targetFound, setTargetFound] = useState(false);

  const refreshTargetRect = useCallback(() => {
    const target = getTarget(targetId);
    setTargetElement(target);
    setTargetFound(Boolean(target));
    setTargetRect(target ? getViewportRect(target, padding) : EMPTY_RECT);
    return target;
  }, [padding, targetId]);

  useEffect(() => {
    if (!open || typeof window === "undefined") {
      setTargetElement(null);
      setTargetRect(EMPTY_RECT);
      setTargetFound(false);
      return undefined;
    }

    let cancelled = false;
    let rafId = 0;
    let retryId = 0;
    let attempts = 0;

    const measure = () => {
      if (cancelled) return;
      const target = getTarget(targetId);
      if (!target) {
        setTargetElement(null);
        setTargetFound(false);
        setTargetRect(EMPTY_RECT);
        if (attempts < 45) {
          attempts += 1;
          retryId = window.setTimeout(measure, 120);
        }
        return;
      }

      setTargetElement(target);
      setTargetFound(true);
      setTargetRect(getViewportRect(target, padding));
    };

    const scheduleMeasure = () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(measure);
    };

    const target = getTarget(targetId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }
    retryId = window.setTimeout(measure, target ? 180 : 0);

    window.addEventListener("resize", scheduleMeasure);
    window.addEventListener("scroll", scheduleMeasure, true);

    return () => {
      cancelled = true;
      if (rafId) window.cancelAnimationFrame(rafId);
      if (retryId) window.clearTimeout(retryId);
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("scroll", scheduleMeasure, true);
    };
  }, [open, padding, targetId]);

  return { targetElement, targetRect, targetFound, refreshTargetRect };
}
