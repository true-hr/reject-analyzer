import { useEffect, useState } from "react";
import PmMvpView from "../mvp/PmMvpView.jsx";
import MobileWeekStrip from "./MobileWeekStrip.jsx";
import WorkTraceInput from "../workTrace/WorkTraceInput.jsx";
import AiExperienceInboxPanel from "../experience/AiExperienceInboxPanel.jsx";
import AiRecordOnboardingPanel from "../workTrace/AiRecordOnboardingPanel.jsx";

const PUSH_INTAKE_KEY = "PASSMAP_PUSH_NOTIFICATION_INTAKE";
const PUSH_INTAKE_TTL_MS = 60 * 60 * 1000;

function _isValidRecordDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function _readWeeklyPushIntake() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PUSH_INTAKE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const ts = parsed?.updatedAt ?? parsed?.createdAt ?? parsed?.savedAt;
    if (
      parsed?.version !== 1 ||
      parsed?.sourceMode !== "ai_conversation" ||
      parsed?.recordDate == null ||
      !_isValidRecordDate(parsed.recordDate) ||
      typeof ts !== "number" ||
      Date.now() - ts > PUSH_INTAKE_TTL_MS
    ) {
      return null;
    }
    if (parsed.type && parsed.type !== "weekly_experience_recall") return null;
    return parsed;
  } catch (_) {
    return null;
  }
}

function _shouldOpenAiConversationFromPush(recordDate) {
  const push = _readWeeklyPushIntake();
  if (!push) return false;
  return !recordDate || push.recordDate === recordDate;
}

export default function MobileRecordTab({
  currentCareerRoleLabel,
  currentJobId,
  onRecordSubmit,
  onOpenLogin,
  onOpenResumeView,
  onOpenAnalysis,
  auth,
  aiInboxOpenSignal = 0,
  initialRecordDate = null,
}) {
  const [traceOpen, setTraceOpen] = useState(true);
  const [sourceMode, setSourceMode] = useState(() =>
    _shouldOpenAiConversationFromPush(initialRecordDate) ? "ai_conversation" : "work_trace"
  );
  const [aiCandidatesOpen, setAiCandidatesOpen] = useState(() => Number(aiInboxOpenSignal) > 0);
  const isAiMode = sourceMode === "ai_conversation";
  const isLoggedIn = !!(auth?.loggedIn && auth?.user);

  useEffect(() => {
    if (!_shouldOpenAiConversationFromPush(initialRecordDate)) return;
    setTraceOpen(true);
    setSourceMode("ai_conversation");
  }, [initialRecordDate]);

  useEffect(() => {
    if (Number(aiInboxOpenSignal) <= 0) return;
    setSourceMode("ai_conversation");
    setAiCandidatesOpen(true);
  }, [aiInboxOpenSignal]);

  return (
    <div className="flex flex-col pb-24 pt-4">
      <div className="mb-3 px-4">
        <h2 className="text-lg font-bold text-slate-900">경험 기록</h2>
        <p className="mt-0.5 text-xs text-slate-500">오늘 한 일을 기록하면 이력서 문장으로 이어집니다.</p>
        {_isValidRecordDate(initialRecordDate) && (
          <span className="mt-2 inline-flex rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
            {initialRecordDate} 기록
          </span>
        )}
      </div>

      {/* 자료 붙여넣기 — 기본 열림 */}
      <div className="mx-4 mb-4">
        <AiRecordOnboardingPanel
          compact
          onOpenAiPaste={() => {
            setSourceMode("ai_conversation");
            setTraceOpen(true);
          }}
        />
      </div>

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
                initialRecordDate={initialRecordDate}
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

      {/* AI가 보낸 후보 — 보조 카드. 기본 접힘 */}
      <div className="mx-4 mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60">
        <button
          type="button"
          onClick={() => setAiCandidatesOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        >
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-700">AI가 보낸 경험 후보를 검토하세요</div>
            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
              ChatGPT, Gemini, Claude에서 보낸 업무기록 후보가 이곳에 모입니다. 내용을 확인한 뒤 ‘이력서 재료로 확정’을 누르면 커리어 자산으로 반영됩니다.
            </p>
          </div>
          <span className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-600">
            {aiCandidatesOpen ? "접기" : "후보 확인하기"}
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
