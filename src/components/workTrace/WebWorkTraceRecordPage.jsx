// src/components/workTrace/WebWorkTraceRecordPage.jsx
// Web-only wrapper for the work trace experience recording flow.
// Step 1/2: free-form input → AI extraction (WorkTraceInput)
// Step 2/2: candidate review (ExperienceCandidateReview, handled inside WorkTraceInput)
// Manual fallback: collapsed PmMvpView for structured input

import { useEffect, useRef, useState } from "react";
import WorkTraceInput from "./WorkTraceInput.jsx";
import PmMvpView from "../mvp/PmMvpView.jsx";
import AiExperienceInboxPanel from "../experience/AiExperienceInboxPanel.jsx";

const GUIDE_QUESTIONS = {
  work_trace: [
    { q: "무엇을 목표로 했나요?", hint: "팀/개인 목표, 해결하려던 문제" },
    { q: "어떤 일을 했나요?", hint: "구체적인 행동, 작업, 결정" },
    { q: "누구와 협업했나요?", hint: "관련 팀, 이해관계자, 외부 파트너" },
    { q: "어떤 성과가 있었나요?", hint: "수치, 변화, 완료된 결과물" },
    { q: "무엇을 배웠나요?", hint: "인사이트, 다음에 다르게 할 것" },
  ],
};

// Picks the initial source-mode tab. Priority order:
//   1. pending review (post-login restore) — sourceMode of the in-progress review
//   2. push notification deeplink — PASSMAP_PUSH_NOTIFICATION_INTAKE written by App.jsx
//   3. external intake (e.g. browser extension selection) — sourceMode of the payload
//   4. auth-return hint — sourceMode carried across a login redirect
//   5. default — work_trace
function _readInitialSourceMode() {
  try {
    const pendingRaw = sessionStorage.getItem("PASSMAP_PENDING_WORK_TRACE_REVIEW");
    if (pendingRaw) {
      const pending = JSON.parse(pendingRaw);
      if (pending?.sourceMode === "ai_conversation") return "ai_conversation";
      if (pending?.sourceMode === "work_trace") return "work_trace";
    }
  } catch (_) {}
  try {
    const pushRaw = sessionStorage.getItem("PASSMAP_PUSH_NOTIFICATION_INTAKE");
    if (pushRaw) {
      const push = JSON.parse(pushRaw);
      const ts = push?.updatedAt ?? push?.createdAt ?? push?.savedAt;
      if (
        push?.version === 1 &&
        (!push?.type || push.type === "weekly_experience_recall") &&
        push?.sourceMode === "ai_conversation" &&
        typeof push?.recordDate === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(push.recordDate) &&
        typeof ts === "number" &&
        Date.now() - ts <= 60 * 60 * 1000
      ) {
        return "ai_conversation";
      }
    }
  } catch (_) {}
  try {
    const intakeRaw = sessionStorage.getItem("PASSMAP_EXTERNAL_INTAKE");
    if (intakeRaw) {
      const intake = JSON.parse(intakeRaw);
      if (intake?.sourceMode === "ai_conversation") return "ai_conversation";
      if (intake?.sourceMode === "work_trace") return "work_trace";
    }
  } catch (_) {}
  try {
    const hintRaw = sessionStorage.getItem("passmap:authReturn");
    if (hintRaw) {
      const hint = JSON.parse(hintRaw);
      if (hint?.source === "work_trace" && hint?.sourceMode === "ai_conversation") {
        return "ai_conversation";
      }
    }
  } catch (_) {}
  return "work_trace";
}

export default function WebWorkTraceRecordPage({
  currentCareerRoleLabel = "",
  currentJobId = "",
  onRecordSubmit = null,
  onOpenLogin = null,
  onOpenResumeView = null,
  onOpenAnalysis = null,
  onOpenAssetMap = null,
  initialRecordDate = null,
  isLoggedIn = false,
  aiInboxOpenSignal = 0,
}) {
  const [manualOpen, setManualOpen] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [flowStep, setFlowStep] = useState("input");
  const [sourceMode, setSourceMode] = useState(_readInitialSourceMode);
  const [aiCandidatesOpen, setAiCandidatesOpen] = useState(() => Number(aiInboxOpenSignal) > 0);
  const aiInboxSectionRef = useRef(null);
  const isAiMode = sourceMode === "ai_conversation";
  const guideQuestions = GUIDE_QUESTIONS.work_trace;

  useEffect(() => {
    if (Number(aiInboxOpenSignal) <= 0) return;
    setSourceMode("ai_conversation");
    setAiCandidatesOpen(true);
  }, [aiInboxOpenSignal]);

  useEffect(() => {
    if (Number(aiInboxOpenSignal) <= 0 || !aiCandidatesOpen) return;
    const timer = window.setTimeout(() => {
      const node = aiInboxSectionRef.current;
      if (!node) return;
      node.scrollIntoView({ behavior: "smooth", block: "start" });
      if (typeof node.focus === "function") node.focus({ preventScroll: true });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [aiInboxOpenSignal, aiCandidatesOpen]);

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Source mode tabs */}
      {flowStep !== "review" && (
        <div className="flex flex-wrap gap-2">
          {[
            { key: "work_trace", label: "업무 기록" },
            { key: "ai_conversation", label: "AI 대화" },
          ].map((tab) => {
            const active = sourceMode === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSourceMode(tab.key)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-violet-600 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Step pill + heading */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-violet-600 px-3 py-1 text-[12px] font-semibold text-white">
            경험 기록하기 1/2
          </span>
          {initialRecordDate && (
            <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[12px] font-semibold text-violet-700">
              {initialRecordDate} 기록
            </span>
          )}
        </div>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
          {isAiMode
            ? "대화 속 업무 경험을 찾아드릴게요"
            : initialRecordDate
            ? `${initialRecordDate}에 한 일을 적어주세요`
            : "이번 주에 한 일을 편하게 적어주세요"}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
          {isAiMode
            ? "붙여넣고, AI가 찾은 경험 초안 중 맞는 것만 확정하세요."
            : "정리하지 않아도 괜찮아요. 그대로 붙여넣으면 경험 초안으로 바꿔드려요."}
        </p>
      </div>

      {/* Main grid — AI mode keeps one clear primary action: paste and create draft. */}
      <div className="block">
        {/* Left: input area */}
        <div className="min-w-0 space-y-4">
          {/* WorkTraceInput with web layout */}
          <WorkTraceInput
            layout="web"
            careerRoleLabel={currentCareerRoleLabel}
            jobId={currentJobId}
            onOpenResumeView={onOpenResumeView}
            onOpenLogin={onOpenLogin}
            onOpenAssetMap={onOpenAssetMap}
            onFlowStepChange={setFlowStep}
            initialRecordDate={initialRecordDate}
            sourceMode={sourceMode}
          />

          {!isAiMode && flowStep !== "review" && (
            <div className="rounded-2xl border border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => setTipsOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-2 px-5 py-4 text-left"
              >
                <span className="text-sm font-semibold text-slate-700">작성 팁 보기</span>
                <svg
                  className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${tipsOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {tipsOpen && (
                <ul className="space-y-3 border-t border-slate-100 px-5 py-4">
                  {guideQuestions.map(({ q, hint }, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-500">
                        {i + 1}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-slate-700">{q}</div>
                        <div className="mt-0.5 text-[11px] text-slate-500">{hint}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Manual fallback — collapsed by default */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => setManualOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-5 py-4 text-left"
        >
          <div>
            <span className="text-sm font-semibold text-slate-700">직접 항목으로 입력하기</span>
            <span className="ml-2 text-xs text-slate-400">수동 기록 / 프로젝트</span>
          </div>
          <svg
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${manualOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {manualOpen && (
          <div className="border-t border-slate-100 px-2 pb-4 pt-2">
            <PmMvpView
              entryView="weekly"
              mode="update"
              currentCareerRoleLabel={currentCareerRoleLabel}
              currentJobId={currentJobId}
              onRecordSubmit={onRecordSubmit}
              onOpenLogin={onOpenLogin}
              onOpenResumeView={onOpenResumeView}
              onOpenAnalysis={onOpenAnalysis}
            />
          </div>
        )}
      </div>

      {/* AI가 보낸 후보 — 보조 카드. 기본 접힘, 메인 입력보다 시각적 우선순위 낮음 */}
      {flowStep !== "review" && (
        <div
          ref={aiInboxSectionRef}
          id="ai-inbox"
          tabIndex={-1}
          className="scroll-mt-24 rounded-2xl border border-slate-200 bg-slate-50/60 outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          <button
            type="button"
            onClick={() => setAiCandidatesOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-2 px-5 py-4 text-left"
          >
            <div>
              <div className="text-sm font-semibold text-slate-700">AI가 정리한 초안을 확인하세요</div>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                AI가 정리한 내용은 바로 저장되지 않아요. 맞는 내용만 골라 확정하고, 틀린 부분은 언제든 수정할 수 있어요.
              </p>
            </div>
            <span className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600">
              {aiCandidatesOpen ? "접기" : "초안 확인하기"}
            </span>
          </button>
          {aiCandidatesOpen && (
            <div className="border-t border-slate-200 px-4 pb-4 pt-3">
              <AiExperienceInboxPanel isLoggedIn={isLoggedIn} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
