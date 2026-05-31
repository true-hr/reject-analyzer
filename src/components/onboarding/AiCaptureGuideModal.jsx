import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, ChevronLeft, ChevronRight, KeyRound, Puzzle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const ONBOARDING_ASSET_BASE = `${import.meta.env.BASE_URL || "/"}onboarding/`;

const GUIDE_SLIDES = [
  {
    eyebrow: "Start",
    title: "AI 연동, 이렇게 시작해요",
    bullets: [
      "PASSMAP 홈에서 AI 연동 시작",
      "Chrome 확장 프로그램 준비",
      "연결 코드 발급",
      "ChatGPT 대화 저장",
    ],
    note: "저장된 내용은 AI 작업기록 Inbox에서 확인하고, 맞는 내용만 이력서 재료로 확정하면 됩니다.",
    slots: [
      { label: "PASSMAP 홈 CTA", asset: `${ONBOARDING_ASSET_BASE}ai-capture-home.png` },
      { label: "AI Inbox 후보 예시", asset: `${ONBOARDING_ASSET_BASE}ai-capture-saved-candidate.png` },
    ],
    icon: Sparkles,
  },
  {
    eyebrow: "Step 1",
    title: "1. 확장 프로그램을 준비하세요",
    bullets: [
      "Chrome 우측 상단 퍼즐 아이콘에서 확장 프로그램 확인",
      "PASSMAP AI 작업 저장 확장 찾기",
      "토글을 켜서 활성화",
    ],
    note: "설치가 끝났다면 다음 단계에서 PASSMAP 연결 코드를 발급하세요.",
    slots: [
      { label: "확장 프로그램 관리 화면", asset: `${ONBOARDING_ASSET_BASE}ai-capture-extensions-page.png` },
      { label: "확장 프로그램 메뉴", asset: `${ONBOARDING_ASSET_BASE}ai-capture-extension-menu.png` },
    ],
    icon: Puzzle,
  },
  {
    eyebrow: "Step 2",
    title: "2. PASSMAP에서 연결 코드를 발급하세요",
    bullets: [
      "왼쪽 메뉴에서 오늘 기록하기 클릭",
      "AI 작업기록 Inbox 영역 찾기",
      "연결 코드 발급 버튼 클릭",
    ],
    note: "화면에는 6자리 연결 코드만 표시되고, access token이나 pairing token은 표시하거나 저장하지 않습니다.",
    slots: [
      { label: "AI 작업기록 Inbox", asset: `${ONBOARDING_ASSET_BASE}ai-capture-inbox.png` },
      { label: "연결 코드 카드", asset: `${ONBOARDING_ASSET_BASE}ai-capture-connection-code.png` },
    ],
    icon: KeyRound,
  },
  {
    eyebrow: "Step 3",
    title: "3. ChatGPT에서 저장하고 Inbox에서 확인하세요",
    bullets: [
      "ChatGPT 대화 화면 열기",
      "PASSMAP 확장 프로그램 클릭",
      "연결 코드 입력",
      "PASSMAP AI Inbox에 후보로 저장 클릭",
      "PASSMAP Inbox에서 후보 확인 및 확정",
    ],
    note: "완료! 이제 AI 대화에서 정리한 업무를 PASSMAP에서 이력서 재료로 이어갈 수 있습니다.",
    slots: [
      { label: "ChatGPT 확장 popup", asset: `${ONBOARDING_ASSET_BASE}ai-capture-extension-menu.png` },
      { label: "저장된 후보 카드", asset: `${ONBOARDING_ASSET_BASE}ai-capture-saved-candidate.png` },
    ],
    icon: CheckCircle,
  },
];

function CaptureSlot({ slot }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="flex min-h-[118px] flex-col justify-between rounded-2xl border border-dashed border-violet-200 bg-violet-50/70 p-3">
      <div>
        <div className="text-[12px] font-semibold text-violet-700">{slot.label}</div>
        {!imageFailed ? (
          <div className="mt-2 max-h-[170px] overflow-hidden rounded-xl border border-white/80 bg-white/80 shadow-sm sm:max-h-[220px]">
            <img
              src={slot.asset}
              alt={slot.label}
              className="h-full max-h-[170px] w-full object-contain sm:max-h-[220px]"
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          </div>
        ) : (
          <div className="mt-2 rounded-xl border border-white/80 bg-white/80 px-3 py-4 text-center text-[12px] leading-5 text-slate-500 shadow-sm">
            캡처 이미지 slot
          </div>
        )}
      </div>
      <div className="mt-3 break-all rounded-lg bg-white/70 px-2 py-1.5 text-[10px] leading-4 text-slate-400">
        {slot.asset}
      </div>
    </div>
  );
}

export default function AiCaptureGuideModal({ open, onClose, onGoToInbox }) {
  const [step, setStep] = useState(0);
  const panelRef = useRef(null);
  const slide = GUIDE_SLIDES[step] || GUIDE_SLIDES[0];
  const isLast = step === GUIDE_SLIDES.length - 1;
  const SlideIcon = slide.icon;

  const progressLabel = useMemo(() => `${step + 1} / ${GUIDE_SLIDES.length}`, [step]);

  useEffect(() => {
    if (!open) return undefined;
    setStep(0);
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyOverflowX = document.body.style.overflowX;
    const previousHtmlOverflowX = document.documentElement.style.overflowX;
    document.body.style.overflow = "hidden";
    document.body.style.overflowX = "hidden";
    document.documentElement.style.overflowX = "hidden";
    const timer = window.setTimeout(() => panelRef.current?.focus?.({ preventScroll: true }), 0);
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.overflowX = previousBodyOverflowX;
      document.documentElement.style.overflowX = previousHtmlOverflowX;
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[2147483646] flex w-screen max-w-[100vw] items-center justify-center overflow-x-hidden bg-slate-950/45 px-3 py-4 backdrop-blur-[2px] sm:px-6 sm:py-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-capture-guide-title"
            tabIndex={-1}
            className="flex max-h-[calc(100vh-24px)] w-full max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.28)] outline-none ring-1 ring-violet-100 sm:max-h-[calc(100vh-40px)] sm:max-w-5xl"
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.985 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className="relative flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 pr-14 sm:px-7 sm:py-5 sm:pr-16">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 id="ai-capture-guide-title" className="text-[22px] font-semibold tracking-tight text-slate-950 sm:text-[26px]">
                    AI 연동, 이렇게 시작해요
                  </h2>
                  <span className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-[12px] font-semibold text-violet-700">
                    {progressLabel}
                  </span>
                </div>
                <p className="mt-2 max-w-2xl text-[14px] leading-6 text-slate-600 sm:text-[15px]">
                  ChatGPT에서 한 업무를 PASSMAP으로 바로 저장할 수 있어요. 처음 사용하는 분도 3~5분이면 설정할 수 있어요.
                </p>
              </div>
              <button
                type="button"
                className="absolute right-4 top-4 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-[22px] leading-none text-slate-500 shadow-sm transition hover:border-violet-100 hover:bg-violet-50 hover:text-violet-700 sm:right-6 sm:top-5"
                onClick={onClose}
                aria-label="AI 연동 가이드 닫기"
              >
                ×
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start"
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -14 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    {slide.slots.map((slot) => (
                      <CaptureSlot key={slot.asset} slot={slot} />
                    ))}
                  </div>

                  <div className="rounded-[22px] border border-slate-100 bg-white p-1 lg:border-0 lg:p-0">
                    <div className="inline-flex h-9 items-center gap-2 rounded-full bg-violet-50 px-3 text-[13px] font-semibold text-violet-700 ring-1 ring-violet-100">
                      <SlideIcon className="h-4 w-4" />
                      {slide.eyebrow}
                    </div>
                    <h3 className="mt-4 text-[24px] font-semibold tracking-tight text-slate-950 sm:text-[30px]">
                      {slide.title}
                    </h3>
                    <ul className="mt-4 space-y-2.5">
                      {slide.bullets.map((bullet) => (
                        <li key={bullet} className="flex gap-2 text-[15px] leading-6 text-slate-650">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-5 rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 text-[14px] font-semibold leading-6 text-violet-800">
                      {slide.note}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex shrink-0 flex-col gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div className="flex items-center justify-center gap-1.5 sm:justify-start">
                {GUIDE_SLIDES.map((item, index) => (
                  <button
                    key={item.title}
                    type="button"
                    className={`h-2.5 rounded-full transition-all ${index === step ? "w-7 bg-violet-600" : "w-2.5 bg-slate-200 hover:bg-violet-200"}`}
                    onClick={() => setStep(index)}
                    aria-label={`AI 연동 가이드 ${index + 1}단계로 이동`}
                  />
                ))}
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-full border-slate-200 bg-white px-5 text-[14px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                  onClick={step === 0 ? onClose : () => setStep((value) => Math.max(value - 1, 0))}
                >
                  {step === 0 ? "닫기" : (
                    <>
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      이전
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  className="h-11 rounded-full bg-violet-700 px-6 text-[14px] font-semibold text-white shadow-[0_12px_24px_rgba(124,58,237,0.22)] hover:bg-violet-800"
                  onClick={isLast ? onGoToInbox : () => setStep((value) => Math.min(value + 1, GUIDE_SLIDES.length - 1))}
                >
                  {isLast ? "연결 코드 발급하기" : (
                    <>
                      다음
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </>
                  )}
                </Button>
                {isLast ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-full border-violet-100 bg-white px-5 text-[14px] font-semibold text-violet-700 shadow-sm hover:bg-violet-50 hover:text-violet-800"
                    onClick={onGoToInbox}
                  >
                    AI Inbox로 이동
                  </Button>
                ) : null}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
