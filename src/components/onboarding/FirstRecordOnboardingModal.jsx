import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react";

const steps = [
  {
    eyebrow: "First record",
    title: "AI와 나눈 업무 대화가 커리어 자산이 됩니다",
    description:
      "따로 정리하지 않아도 괜찮아요. ChatGPT에서 정리한 업무 내용을 PASSMAP으로 보내고, 맞는 내용만 확인하면 이력서 재료와 자산 맵에 쌓입니다.",
    visual: "flow",
  },
  {
    eyebrow: "Light workflow",
    title: "복붙하고, 확인하고, 쌓으세요",
    description:
      "AI와 대화하며 정리한 내용이 업무기록 후보로 들어오고, 사용자는 맞는 내용만 골라 확정하면 됩니다.",
    visual: "cards",
  },
  {
    eyebrow: "Career asset",
    title: "확정한 기록은 자산으로 쌓입니다",
    description:
      "기록이 쌓일수록 내가 반복해서 발휘한 역량과 연결 가능한 직무 방향이 선명해집니다.",
    visual: "asset",
  },
  {
    eyebrow: "Start",
    title: "첫 기록은 30초면 충분합니다",
    description:
      "오늘 한 일이나 AI와 나눈 업무 대화를 그대로 붙여넣어 보세요. 완벽한 문장이 아니어도 괜찮습니다.",
    visual: "start",
  },
];

function FlowVisual() {
  return (
    <div className="relative grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
      <div className="rounded-[26px] border border-slate-200 bg-white/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">AI chat</div>
        <div className="mt-4 space-y-2">
          <p className="ml-auto max-w-[82%] rounded-2xl bg-slate-950 px-3 py-2 text-sm leading-5 text-white">
            이번 주 고객 문의를 유형별로 정리했어.
          </p>
          <p className="max-w-[86%] rounded-2xl bg-slate-100 px-3 py-2 text-sm leading-5 text-slate-700">
            반복 문의 기준과 대응 흐름도 같이 정리해둘게요.
          </p>
        </div>
      </div>
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-full border border-violet-100 bg-white text-violet-600 shadow-[0_14px_30px_rgba(124,58,237,0.18)]">
        <ArrowRight className="h-5 w-5 sm:rotate-0 rotate-90" />
      </div>
      <div className="rounded-[26px] border border-violet-100 bg-gradient-to-br from-white via-violet-50/70 to-emerald-50 p-4 shadow-[0_18px_50px_rgba(88,28,135,0.10)]">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-500">PASSMAP Inbox</div>
          <Sparkles className="h-4 w-4 text-emerald-500" />
        </div>
        <div className="mt-4 rounded-2xl bg-white p-3 ring-1 ring-violet-100">
          <div className="text-sm font-semibold text-slate-950">고객 문의 유형화 및 대응 기준 정리</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {["정보 구조화", "고객 이해", "운영 개선"].map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CardsVisual() {
  const items = [
    ["AI 대화", "이번 주 고객 문의를 유형별로 정리했어"],
    ["PASSMAP 후보", "고객 문의 유형화 및 대응 기준 정리"],
    ["이력서 재료", "고객 문의 데이터를 분류하고 대응 기준을 정리해 반복 문의 대응 효율을 높였습니다."],
  ];
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {items.map(([title, body], index) => (
        <motion.div
          key={title}
          className="rounded-[26px] border border-slate-200 bg-white/90 p-4 shadow-[0_18px_46px_rgba(15,23,42,0.07)]"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.06, duration: 0.2 }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
              {title}
            </span>
            <span className="text-xs font-semibold text-slate-300">0{index + 1}</span>
          </div>
          <p className="mt-4 text-sm font-medium leading-6 text-slate-800">{body}</p>
        </motion.div>
      ))}
    </div>
  );
}

function AssetVisual() {
  return (
    <div className="rounded-[30px] border border-violet-100 bg-gradient-to-br from-white via-slate-50 to-emerald-50 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="flex flex-wrap gap-2">
        {["정보 구조화", "고객 이해", "협업 커뮤니케이션"].map((tag) => (
          <span key={tag} className="rounded-full border border-violet-100 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-sm">
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_160px] sm:items-center">
        <div className="rounded-[24px] bg-white p-4 ring-1 ring-slate-200">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Career asset map</div>
          <div className="mt-4 h-2 rounded-full bg-slate-100">
            <div className="h-2 w-3/4 rounded-full bg-gradient-to-r from-violet-500 to-emerald-400" />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {["운영", "CX", "서비스기획"].map((role) => (
              <span key={role} className="rounded-2xl bg-slate-50 px-3 py-3 text-center text-xs font-semibold text-slate-700">
                {role}
              </span>
            ))}
          </div>
        </div>
        <div className="relative mx-auto grid h-36 w-36 place-items-center rounded-full bg-white shadow-[0_22px_58px_rgba(124,58,237,0.16)] ring-1 ring-violet-100">
          <div className="absolute h-24 w-24 rounded-full border border-emerald-200" />
          <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-emerald-500 text-white shadow-lg">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StartVisual() {
  return (
    <div className="rounded-[30px] border border-slate-200 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="rounded-[24px] bg-slate-950 p-4 text-white">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200">Paste anything useful</div>
        <p className="mt-3 text-sm leading-6 text-slate-100">
          오늘 고객 문의 12건을 유형별로 나누고, 반복 문의 대응 기준을 팀에 공유했다.
        </p>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-[22px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
        <CheckCircle2 className="h-4 w-4" />
        이력서 재료와 커리어 자산 맵에 반영할 후보로 정리됩니다
      </div>
    </div>
  );
}

function StepVisual({ type }) {
  if (type === "cards") return <CardsVisual />;
  if (type === "asset") return <AssetVisual />;
  if (type === "start") return <StartVisual />;
  return <FlowVisual />;
}

export default function FirstRecordOnboardingModal({ open, onClose, onStart, onStartGuidedTour }) {
  const [step, setStep] = useState(0);
  const panelRef = useRef(null);
  const currentStep = steps[step] || steps[0];
  const isLastStep = step === steps.length - 1;
  const titleId = "first-record-onboarding-title";

  useEffect(() => {
    if (!open) return;
    setStep(0);
  }, [open]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyOverflowX = document.body.style.overflowX;
    const previousHtmlOverflowX = document.documentElement.style.overflowX;
    document.body.style.overflow = "hidden";
    document.body.style.overflowX = "hidden";
    document.documentElement.style.overflowX = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    window.setTimeout(() => panelRef.current?.focus?.({ preventScroll: true }), 0);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.overflowX = previousBodyOverflowX;
      document.documentElement.style.overflowX = previousHtmlOverflowX;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const controls = useMemo(
    () => ({
      next: () => setStep((value) => Math.min(value + 1, steps.length - 1)),
      prev: () => setStep((value) => Math.max(value - 1, 0)),
    }),
    []
  );

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[2147483646] flex w-screen max-w-[100vw] items-end justify-center overflow-x-hidden bg-slate-950/45 px-3 py-3 backdrop-blur-[2px] sm:items-center sm:px-6 sm:py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose?.();
          }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="relative flex max-h-[calc(100vh-24px)] w-full max-w-[980px] flex-col overflow-hidden rounded-[30px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.28)] outline-none ring-1 ring-white/70 sm:max-h-[calc(100vh-48px)] sm:rounded-[34px]"
            initial={{ opacity: 0, y: 28, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.985 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-br from-violet-50 via-white to-emerald-50" />
            <button
              type="button"
              className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white/85 text-slate-500 shadow-sm transition hover:border-violet-100 hover:bg-violet-50 hover:text-violet-700"
              onClick={onClose}
              aria-label="온보딩 닫기"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-6 sm:px-8 sm:pb-7 sm:pt-8">
              <div className="flex flex-wrap items-center gap-2 pr-12">
                <span className="rounded-full border border-violet-100 bg-white px-3 py-1 text-[12px] font-semibold text-violet-700 shadow-sm">
                  {currentStep.eyebrow}
                </span>
                <div className="flex items-center gap-1.5">
                  {steps.map((item, index) => (
                    <span
                      key={item.title}
                      className={`h-1.5 rounded-full transition-all ${index === step ? "w-7 bg-violet-600" : "w-1.5 bg-slate-200"}`}
                    />
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -14 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="mt-5"
                >
                  <div className="max-w-3xl">
                    <h2 id={titleId} className="text-[29px] font-semibold leading-tight tracking-tight text-slate-950 sm:text-[42px]">
                      {currentStep.title}
                    </h2>
                    <p className="mt-4 max-w-2xl text-[15px] leading-7 text-slate-600 sm:text-[17px]">
                      {currentStep.description}
                    </p>
                  </div>
                  <div className="mt-6 sm:mt-8">
                    <StepVisual type={currentStep.visual} />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="relative flex shrink-0 flex-col-reverse gap-3 border-t border-slate-100 bg-white/92 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <button
                type="button"
                className="h-11 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
                onClick={onClose}
              >
                나중에 보기
              </button>
              <div className="flex flex-col gap-2 sm:flex-row">
                {step > 0 ? (
                  <button
                    type="button"
                    className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
                    onClick={controls.prev}
                    aria-label="이전 단계"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                ) : null}
                {isLastStep ? (
                  <>
                    <button
                      type="button"
                      className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(15,23,42,0.22)] transition hover:bg-violet-700"
                      onClick={onStartGuidedTour || onStart}
                    >
                      화면 보며 따라하기
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-11 items-center justify-center rounded-full border border-violet-100 bg-white px-5 text-sm font-semibold text-violet-700 shadow-sm transition hover:bg-violet-50"
                      onClick={onStart}
                    >
                      첫 기록 바로 남기기
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(15,23,42,0.22)] transition hover:bg-violet-700"
                    onClick={controls.next}
                  >
                    다음
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
