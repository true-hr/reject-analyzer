import { useEffect, useRef, useState } from "react";
import PmMvpView from "../mvp/PmMvpView.jsx";
import MobileWeekStrip from "./MobileWeekStrip.jsx";
import WorkTraceInput from "../workTrace/WorkTraceInput.jsx";
import AiExperienceInboxPanel from "../experience/AiExperienceInboxPanel.jsx";
import { listAiInboxExperiences } from "../../lib/experience/aiInboxRepository.js";

export default function MobileRecordTab({
  currentCareerRoleLabel,
  currentJobId,
  onRecordSubmit,
  onOpenLogin,
  onOpenResumeView,
  onOpenAnalysis,
  auth,
}) {
  const [traceOpen, setTraceOpen] = useState(true);
  const [sourceMode, setSourceMode] = useState("work_trace");
  const [aiCandidatesOpen, setAiCandidatesOpen] = useState(false);
  const [pendingPreview, setPendingPreview] = useState(null);
  const reviewCardRef = useRef(null);
  const isAiMode = sourceMode === "ai_conversation";
  const isLoggedIn = !!(auth?.loggedIn && auth?.user);

  useEffect(() => {
    if (!isLoggedIn) {
      setPendingPreview(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await listAiInboxExperiences({ limit: 1 });
        if (cancelled) return;
        const first = Array.isArray(data?.items) ? data.items[0] : null;
        setPendingPreview(first ? { title: first.title || "제목 없는 기록", hasMore: !!data?.hasMore } : null);
      } catch (_) {
        if (!cancelled) setPendingPreview(null);
      }
    })();
    return () => { cancelled = true; };
  }, [isLoggedIn]);

  function handleOpenReview() {
    setAiCandidatesOpen(true);
    setTimeout(() => {
      reviewCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  return (
    <div className="flex flex-col pb-24 pt-4">
      <div className="mb-3 px-4">
        <h2 className="text-lg font-bold text-slate-900">경험 기록</h2>
        <p className="mt-0.5 text-xs text-slate-500">오늘 한 일을 기록하면 이력서 문장으로 이어집니다.</p>
      </div>

      {/* 검토 대기 알림 배너 */}
      {pendingPreview && !aiCandidatesOpen && (
        <div className="mx-4 mb-3 flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="min-w-0">
            <div className="text-[12px] font-semibold text-slate-700">검토할 기록이 있어요</div>
            <p className="mt-0.5 truncate text-[11px] text-slate-500">
              {pendingPreview.title}{pendingPreview.hasMore ? " 외 여러 건" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenReview}
            className="shrink-0 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 active:bg-slate-100"
          >
            확인하기
          </button>
        </div>
      )}

      {/* 자료 붙여넣기 — 기본 열림 */}
      <div className="mx-4 mb-4 overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setTraceOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        >
          <div>
            <span className="text-sm font-semibold text-slate-900">자료 붙여넣기</span>
            <span className="ml-2 rounded-full border border-violet-100 bg-violet-50 px-1.5 py-0.5 text-[9px] font-medium text-violet-600">
              AI
            </span>
          </div>
          <svg
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${traceOpen ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {traceOpen && (
          <div className="border-t border-violet-50 px-4 pb-4 pt-3">
            <div className="mb-3 flex gap-1.5 rounded-xl bg-slate-100 p-1">
              {[
                { key: "work_trace", label: "업무 기록" },
                { key: "ai_conversation", label: "AI 대화" },
              ].map((seg) => {
                const active = sourceMode === seg.key;
                return (
                  <button
                    key={seg.key}
                    type="button"
                    onClick={() => setSourceMode(seg.key)}
                    className={`flex-1 rounded-lg py-1.5 text-[12px] font-semibold transition-colors ${
                      active ? "bg-white text-violet-700 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    {seg.label}
                  </button>
                );
              })}
            </div>
            <p className="mb-3 text-[11px] leading-relaxed text-slate-500">
              {isAiMode
                ? "ChatGPT·Gemini·Claude와 나눈 대화 중 업무 경험·의사결정이 담긴 부분을 붙여넣으면, 실제로 내가 한 일을 중심으로 경험 후보를 찾아드립니다."
                : "정리하지 않아도 됩니다. 카톡·슬랙·회의록·업무보고·이미지를 그대로 넣으면 AI가 이력서에 쓸 수 있는 경험을 찾아드립니다."}
            </p>
            <WorkTraceInput
                careerRoleLabel={currentCareerRoleLabel}
                jobId={currentJobId}
                onOpenResumeView={onOpenResumeView}
                onOpenLogin={onOpenLogin}
                sourceMode={sourceMode}
              />
            <p className="mt-3 text-[10px] leading-relaxed text-slate-400">
              이미 자료가 있으면 여기에 붙여넣고, 기억나는 일을 직접 쓰려면 아래 이번 주 기록을 사용하세요.
            </p>
          </div>
        )}
      </div>

      <MobileWeekStrip />
      <PmMvpView
        mode="update"
        entryView="weekly"
        currentCareerRoleLabel={currentCareerRoleLabel ?? ""}
        currentJobId={currentJobId ?? ""}
        onRecordSubmit={onRecordSubmit ?? null}
        onOpenLogin={onOpenLogin ?? null}
        onOpenResumeView={onOpenResumeView ?? null}
        onOpenAnalysis={onOpenAnalysis ?? null}
        collapseStructuredSections={true}
      />

      {/* 검토할 기록 — 보조 카드. 기본 접힘 */}
      <div ref={reviewCardRef} className="mx-4 mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60">
        <button
          type="button"
          onClick={() => setAiCandidatesOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        >
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-700">검토할 기록</div>
            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
              Claude와 작업하며 저장한 기록을 확인하고, 쓸 만한 항목은 이력서에 쓰기로 정하세요.
            </p>
          </div>
          <span className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-600">
            {aiCandidatesOpen ? "접기" : "확인하기"}
          </span>
        </button>
        {aiCandidatesOpen && (
          <div className="border-t border-slate-200 px-3 pb-4 pt-3">
            <AiExperienceInboxPanel isLoggedIn={isLoggedIn} />
          </div>
        )}
      </div>
    </div>
  );
}
