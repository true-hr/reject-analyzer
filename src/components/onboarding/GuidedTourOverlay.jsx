import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import useCoachmarkTargetRect from "@/hooks/useCoachmarkTargetRect.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getTooltipStyle(rect, placement, variant) {
  const width = variant === "mobile" ? Math.min(window.innerWidth - 24, 360) : 340;
  if (!rect) {
    return {
      width,
      left: "50%",
      top: variant === "mobile" ? "auto" : "50%",
      bottom: variant === "mobile" ? 16 : "auto",
      transform: variant === "mobile" ? "translateX(-50%)" : "translate(-50%, -50%)",
    };
  }

  if (variant === "mobile") {
    return {
      width,
      left: "50%",
      bottom: 16,
      transform: "translateX(-50%)",
    };
  }

  const gap = 14;
  const maxLeft = window.innerWidth - width - 16;
  if (placement === "right" && rect.left + rect.width + width + gap < window.innerWidth) {
    return {
      width,
      left: rect.left + rect.width + gap,
      top: clamp(rect.top, 16, window.innerHeight - 240),
    };
  }
  if (placement === "top" && rect.top > 220) {
    return {
      width,
      left: clamp(rect.left + rect.width / 2 - width / 2, 16, maxLeft),
      top: Math.max(16, rect.top - 196),
    };
  }
  return {
    width,
    left: clamp(rect.left + rect.width / 2 - width / 2, 16, maxLeft),
    top: clamp(rect.top + rect.height + gap, 16, window.innerHeight - 240),
  };
}

export default function GuidedTourOverlay({
  open,
  steps,
  currentIndex,
  variant = "web",
  onPrev,
  onNext,
  onSkip,
  onClose,
}) {
  const step = steps?.[currentIndex] || null;
  const { targetRect, targetFound } = useCoachmarkTargetRect(step?.targetId, { open: open && Boolean(step), padding: 8 });
  const isFirst = currentIndex <= 0;
  const isLast = currentIndex >= (steps?.length || 0) - 1;
  const [targetWaitExpired, setTargetWaitExpired] = useState(false);
  const waitForTargetMs = step?.waitForTargetMs ?? 700;
  const isWaitingForTarget = Boolean(open && step && !targetFound && !targetWaitExpired && waitForTargetMs > 0);

  useEffect(() => {
    if (!open || typeof window === "undefined") return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
      if (event.key === "ArrowRight") onNext?.();
      if (event.key === "ArrowLeft" && !isFirst) onPrev?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFirst, onClose, onNext, onPrev, open]);

  useEffect(() => {
    if (!open || !step) {
      setTargetWaitExpired(false);
      return undefined;
    }
    setTargetWaitExpired(false);
    const timer = window.setTimeout(() => {
      setTargetWaitExpired(true);
    }, waitForTargetMs);
    return () => window.clearTimeout(timer);
  }, [currentIndex, open, step, waitForTargetMs]);

  const tooltipStyle = useMemo(
    () => (typeof window === "undefined" ? {} : getTooltipStyle(targetRect, step?.placement, variant)),
    [targetRect, step?.placement, variant]
  );

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && step ? (
        <motion.div
          className="fixed inset-0 z-[2147483645] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {targetRect ? (
            <>
              <div className="absolute left-0 right-0 top-0 bg-slate-950/68" style={{ height: targetRect.top }} />
              <div
                className="absolute left-0 bg-slate-950/68"
                style={{ top: targetRect.top, width: targetRect.left, height: targetRect.height }}
              />
              <div
                className="absolute right-0 bg-slate-950/68"
                style={{
                  top: targetRect.top,
                  left: targetRect.left + targetRect.width,
                  height: targetRect.height,
                }}
              />
              <div
                className="absolute bottom-0 left-0 right-0 bg-slate-950/68"
                style={{ top: targetRect.top + targetRect.height }}
              />
            </>
          ) : (
            <div className="absolute inset-0 bg-slate-950/68" />
          )}
          {targetRect ? (
            <motion.div
              className="absolute rounded-2xl bg-transparent ring-2 ring-white shadow-[0_0_0_8px_rgba(255,255,255,0.22),0_18px_50px_rgba(15,23,42,0.28)]"
              style={{
                left: targetRect.left,
                top: targetRect.top,
                width: targetRect.width,
                height: targetRect.height,
              }}
              layout
              transition={{ duration: 0.18, ease: "easeOut" }}
            />
          ) : null}

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="첫 기록 화면 따라하기"
            className="pointer-events-auto absolute rounded-2xl border border-white/70 bg-white p-4 text-slate-900 shadow-[0_24px_70px_rgba(15,23,42,0.30)]"
            style={tooltipStyle}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-600">
                  {currentIndex + 1} / {steps.length}
                </div>
                <h3 className="mt-1 text-base font-semibold leading-snug text-slate-950">
                  {isWaitingForTarget ? "화면을 찾는 중입니다" : step.title}
                </h3>
              </div>
              <button
                type="button"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                onClick={onClose}
                aria-label="화면 따라하기 닫기"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {isWaitingForTarget
                ? "기록 화면을 여는 중입니다. 대상 요소가 나타나면 자동으로 하이라이트합니다."
                : step.description}
            </p>
            {!targetFound && !isWaitingForTarget ? (
              <p className="mt-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                안내할 화면 요소를 준비하는 중입니다. 요소가 없어도 다음 안내로 이동할 수 있습니다.
              </p>
            ) : null}
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                className="h-9 rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                onClick={onSkip}
              >
                그만 보기
              </button>
              <div className="flex gap-2">
                {!isFirst ? (
                  <button
                    type="button"
                    className="inline-flex h-9 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    onClick={onPrev}
                    aria-label={step.prevLabel || "이전 안내"}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    {step.prevLabel || "이전"}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="inline-flex h-9 items-center justify-center rounded-full bg-slate-950 px-4 text-xs font-semibold text-white hover:bg-violet-700"
                  onClick={onNext}
                >
                  {isLast ? step.completeLabel || "완료" : step.nextLabel || "다음"}
                  {!isLast ? <ChevronRight className="ml-1 h-4 w-4" /> : null}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
