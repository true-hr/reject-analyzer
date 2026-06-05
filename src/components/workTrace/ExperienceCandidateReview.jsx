// src/components/workTrace/ExperienceCandidateReview.jsx
// Displays AI-extracted experience candidates for user review.
// layout="compact" (default): mobile compact flow
// layout="web": 2-column web flow with section summary + right stats card
import { useEffect, useRef, useState } from "react";
import { saveAcceptedWorkTraceCandidates } from "@/lib/workTrace/saveWorkTraceCandidates.js";
import FirstRecordGuidedTour from "@/components/onboarding/FirstRecordGuidedTour.jsx";
import {
  CANDIDATE_REVIEW_TOUR_IDS,
  CANDIDATE_REVIEW_TOUR_KEYS,
} from "@/components/onboarding/firstRecordTourSteps.js";

// ─── Pending review preservation (survives login redirect) ─────────────────
// Keeps the current analysis result alive across a login round-trip so the
// user does not lose their reviewed candidates. sessionStorage only, TTL-bound.
const PENDING_REVIEW_KEY = "PASSMAP_PENDING_WORK_TRACE_REVIEW";

function clearPendingWorkTraceReview() {
  try { sessionStorage.removeItem(PENDING_REVIEW_KEY); } catch (_) {}
}

function savePendingWorkTraceReview(data) {
  try {
    sessionStorage.setItem(
      PENDING_REVIEW_KEY,
      JSON.stringify({ ...data, version: 1, savedAt: Date.now() })
    );
  } catch (_) {}
}

// Auth-return hint — lets App.jsx navigate back to this screen after the login
// round-trip. Mirrors the existing PmMvpView pattern with a distinct source.
const AUTH_RETURN_KEY = "passmap:authReturn";

function saveWorkTraceAuthReturnHint(sourceMode) {
  try {
    sessionStorage.setItem(
      AUTH_RETURN_KEY,
      JSON.stringify({ source: "work_trace", sourceMode, createdAt: Date.now() })
    );
  } catch (_) {}
}

// Clears the auth-return hint only when it belongs to the work_trace flow,
// so a concurrent PmMvpView hint is never stomped.
function clearWorkTraceAuthReturnHint() {
  try {
    const raw = sessionStorage.getItem(AUTH_RETURN_KEY);
    if (!raw) return;
    const hint = JSON.parse(raw);
    if (hint?.source === "work_trace") sessionStorage.removeItem(AUTH_RETURN_KEY);
  } catch (_) {}
}

function hasCandidateReviewTourState(key) {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch (_) {
    return false;
  }
}

function isCandidateReviewTourArmed() {
  try {
    return window.sessionStorage.getItem(CANDIDATE_REVIEW_TOUR_KEYS.armed) === "1";
  } catch (_) {
    return false;
  }
}

const REVIEW_STATUS = {
  pending: "pending",
  accepted: "accepted",
  needsEdit: "needsEdit",
  rejected: "rejected",
};

const DIFFERS_OPTIONS = [
  { key: "not_led", label: "내가 주도한 일은 아니에요" },
  { key: "no_result", label: "결과가 없었어요" },
  { key: "better_result", label: "더 중요한 성과가 있어요" },
  { key: "overstatement", label: "표현이 과장됐어요" },
  { key: "manual_edit", label: "직접 수정할게요" },
];

const POTENTIAL_LABEL = {
  high: { text: "이력서 활용 높음", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  medium: { text: "활용 가능", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  low: { text: "보완 필요", cls: "bg-slate-50 text-slate-600 border-slate-200" },
};

const SOURCE_TYPE_LABEL = {
  kakao: "카카오톡",
  slack: "슬랙",
  meeting_note: "회의록",
  email: "이메일",
  work_report: "업무보고",
  csv: "데이터/표",
  image: "이미지",
  ai_conversation: "AI 대화",
  unknown: "업무 자료",
};

const COLLAB_KEYWORDS = /팀|회의|협업|조율|파트너|이해관계자|미팅|같이|함께|공유|전달|논의|제안|공유했|공유드|논의했|전달했/;

function _toArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null || value === "") return [];
  return [String(value)];
}

function _collectAll(candidates, field, limit = 20) {
  const seen = new Set();
  const out = [];
  for (const c of Array.isArray(candidates) ? candidates : []) {
    for (const v of _toArray(c?.[field])) {
      const t = String(v || "").trim();
      if (!t) continue;
      const key = t.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(t);
      if (out.length >= limit) return out;
    }
  }
  return out;
}

function _collectCollabContexts(candidates, limit = 8) {
  const direct = _collectAll(candidates, "collaboration", 8);
  if (direct.length >= 4) return direct.slice(0, limit);
  const seen = new Set(direct.map((s) => s.toLowerCase()));
  const fromEvidence = [];
  for (const c of Array.isArray(candidates) ? candidates : []) {
    for (const e of _toArray(c?.evidenceTexts)) {
      if (COLLAB_KEYWORDS.test(e)) {
        const key = e.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          fromEvidence.push(e);
          if (direct.length + fromEvidence.length >= limit) break;
        }
      }
    }
  }
  return [...direct, ...fromEvidence].slice(0, limit);
}

function _connectionScore(candidates) {
  const skillCount = _collectAll(candidates, "skills").length;
  const jobTagCount = _collectAll(candidates, "job_tags").length;
  return Math.min(95, Math.max(60, 60 + candidates.length * 4 + skillCount * 2 + jobTagCount));
}

// ─── Web-only section card ─────────────────────────────────────────────────

function WebSection({ title, items, chipStyle = false, muted = false }) {
  if (!items.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </div>
      {chipStyle ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((s, i) => (
            <span
              key={i}
              className="rounded-full border border-violet-100 bg-violet-50 px-2.5 py-0.5 text-xs text-violet-700"
            >
              {s}
            </span>
          ))}
        </div>
      ) : (
        <ul className="space-y-1">
          {items.map((s, i) => (
            <li key={i} className={`flex gap-2 text-xs leading-relaxed ${muted ? "text-slate-500 italic" : "text-slate-700"}`}>
              <span className="mt-1.5 shrink-0 h-1.5 w-1.5 rounded-full bg-slate-300" />
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Web-only right summary card ──────────────────────────────────────────

function WebRightCard({ candidates }) {
  const skills = _collectAll(candidates, "skills");
  const jobTags = _collectAll(candidates, "job_tags");
  const score = _connectionScore(candidates);
  const top4 = skills.slice(0, 4);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sticky top-4 space-y-4">
      <div>
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          기록 기반 연결도
        </div>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold text-violet-700">{score}</span>
          <span className="mb-1 text-sm text-slate-400">/ 100</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-violet-500 transition-all"
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl border border-slate-200 bg-white p-2.5">
          <div className="text-xl font-bold text-slate-900">{candidates.length}</div>
          <div className="mt-0.5 text-[10px] text-slate-500">기록 경험</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-2.5">
          <div className="text-xl font-bold text-slate-900">{skills.length}</div>
          <div className="mt-0.5 text-[10px] text-slate-500">핵심 자산</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-2.5">
          <div className="text-xl font-bold text-slate-900">{jobTags.length}</div>
          <div className="mt-0.5 text-[10px] text-slate-500">연결 신호</div>
        </div>
      </div>

      {top4.length > 0 && (
        <div>
          <div className="mb-1.5 text-[11px] font-semibold text-slate-500">주요 커리어 자산</div>
          <div className="flex flex-wrap gap-1.5">
            {top4.map((s, i) => (
              <span
                key={i}
                className="rounded-full border border-violet-100 bg-violet-50 px-2.5 py-1 text-[11px] text-violet-700"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-slate-500">
        저장 후 커리어 자산 맵에서 누적 자산과 활용 방향을 확인할 수 있습니다.
      </p>
    </div>
  );
}

// ─── Candidate card (shared) ──────────────────────────────────────────────

function CandidateCard({ candidate, status, differReason, onAccept, onReject, onDiffer, onEditConfirm, acceptTourId = null }) {
  const [showDiffers, setShowDiffers] = useState(false);
  const [localEditText, setLocalEditText] = useState(candidate.suggestedResumeBullet || "");
  const pot = POTENTIAL_LABEL[candidate.resumePotential] || POTENTIAL_LABEL.medium;
  const actionsItems = _toArray(candidate.actions);
  const resultItems = _toArray(candidate.result);
  const missingInfoItems = _toArray(candidate.missingInfoQuestions ?? candidate.followUpQuestions);

  return (
    <div className={`rounded-2xl border shadow-sm transition-colors ${
      status === "accepted" ? "border-emerald-200 bg-emerald-50/60 ring-1 ring-emerald-100" :
      status === "needsEdit" ? "border-amber-200 bg-amber-50/40" :
      status === "rejected" ? "border-slate-200 bg-white opacity-40" :
      "border-slate-200 bg-white"
    }`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-900 leading-snug">{candidate.title || "경험 후보"}</div>
            {candidate.role && (
              <div className="mt-0.5 text-[11px] text-slate-500">{candidate.role}</div>
            )}
          </div>
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${pot.cls}`}>
            {pot.text}
          </span>
        </div>

        {candidate.situation && (
          <p className="mt-2.5 text-xs leading-relaxed text-slate-700">
            <span className="font-medium text-slate-500">상황</span>{" "}
            {candidate.situation}
          </p>
        )}
        {candidate.problem && (
          <p className="mt-1 text-xs leading-relaxed text-slate-700">
            <span className="font-medium text-slate-500">문제</span>{" "}
            {candidate.problem}
          </p>
        )}

        {actionsItems.length > 0 && (
          <div className="mt-2.5">
            <div className="text-[11px] font-medium text-slate-500 mb-1">한 일</div>
            <ul className="space-y-0.5">
              {actionsItems.map((a, i) => (
                <li key={i} className="flex gap-1.5 text-xs text-slate-700">
                  <span className="mt-0.5 shrink-0 h-1.5 w-1.5 rounded-full bg-slate-300" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}

        {resultItems.length > 0 && (
          <div className="mt-2">
            <div className="text-[11px] font-medium text-slate-500 mb-1">결과</div>
            <ul className="space-y-0.5">
              {resultItems.map((r, i) => (
                <li key={i} className="flex gap-1.5 text-xs text-slate-700">
                  <span className="mt-0.5 shrink-0 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {candidate.skills?.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {candidate.skills.map((s, i) => (
              <span key={i} className="rounded-full border border-violet-100 bg-violet-50 px-2 py-0.5 text-[10px] text-violet-700">
                {s}
              </span>
            ))}
          </div>
        )}

        {candidate.suggestedResumeBullet && (
          <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
            <div className="text-[10px] font-medium text-slate-400 mb-1">이력서 문장 예시</div>
            <p className="text-[11px] leading-relaxed text-slate-700 italic">
              {candidate.suggestedResumeBullet}
            </p>
          </div>
        )}

        {missingInfoItems.length > 0 && (
          <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
            <div className="text-[10px] font-medium text-amber-700 mb-1">
              아직 결과가 부족해요. 아래 정보가 있으면 더 강한 경험이 됩니다.
            </div>
            <ul className="space-y-0.5">
              {missingInfoItems.map((q, i) => (
                <li key={i} className="text-[11px] text-amber-800">• {q}</li>
              ))}
            </ul>
          </div>
        )}

        {candidate.riskNotes?.length > 0 && (
          <div className="mt-2">
            {candidate.riskNotes.map((r, i) => (
              <p key={i} className="text-[10px] text-slate-400 mt-0.5">
                ⚠ {r}
              </p>
            ))}
          </div>
        )}

        {candidate.evidenceTexts?.length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer text-[10px] font-medium text-slate-400 hover:text-slate-600">
              근거 원문 보기
            </summary>
            <ul className="mt-1 space-y-0.5 pl-2">
              {candidate.evidenceTexts.map((e, i) => (
                <li key={i} className="text-[10px] text-slate-400">"{e}"</li>
              ))}
            </ul>
          </details>
        )}
      </div>

      {status !== "rejected" && (
        <div className={`border-t px-4 py-3 ${status === "accepted" ? "border-emerald-100" : "border-slate-100"}`}>
          {status === "accepted" ? (
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-emerald-600">✓ 내 경험으로 확인</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">저장 대상</span>
                </div>
                <p className="mt-0.5 text-[10px] text-slate-500">선택된 경험입니다. 아래 '이대로 저장하기'를 누르면 저장됩니다.</p>
              </div>
              <button
                type="button"
                onClick={() => onAccept(null)}
                className="text-[10px] text-slate-400 hover:text-slate-600"
              >
                취소
              </button>
            </div>
          ) : status === "needsEdit" && showDiffers ? (
            <div>
              <div className="text-[11px] text-slate-600 mb-2">어떤 부분이 달라요?</div>
              <div className="flex flex-wrap gap-1.5">
                {DIFFERS_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => { onDiffer(opt.key); setShowDiffers(false); }}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700 hover:border-violet-300 hover:text-violet-700"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowDiffers(false)}
                className="mt-2 text-[10px] text-slate-400 hover:text-slate-600"
              >
                취소
              </button>
            </div>
          ) : status === "needsEdit" && differReason === "manual_edit" ? (
            <div>
              <div className="text-[11px] text-slate-600 mb-1.5">이력서에 반영할 문장을 직접 수정해 주세요</div>
              <textarea
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-200"
                rows={3}
                value={localEditText}
                onChange={(e) => setLocalEditText(e.target.value)}
                placeholder={candidate.suggestedResumeBullet || "수정할 문장을 입력해 주세요"}
              />
              <p className="mt-1 text-[10px] text-slate-400">수정한 문장은 저장 후 이력서 후보 문장으로 우선 반영됩니다.</p>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => { if (localEditText.trim()) onEditConfirm(localEditText.trim()); }}
                  disabled={!localEditText.trim()}
                  className="flex-1 rounded-xl bg-violet-600 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  수정 확인
                </button>
                <button
                  type="button"
                  onClick={() => setShowDiffers(true)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50"
                >
                  다시 선택
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                data-tour-id={acceptTourId || undefined}
                onClick={() => onAccept(true)}
                className="flex-1 rounded-xl bg-violet-600 py-2 text-xs font-semibold text-white hover:bg-violet-700"
              >
                내 경험 맞음
              </button>
              <button
                type="button"
                onClick={() => { setShowDiffers(true); onDiffer(null); }}
                className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                조금 다름
              </button>
              <button
                type="button"
                onClick={() => onReject()}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-50"
              >
                삭제
              </button>
            </div>
          )}
        </div>
      )}

      {status === "rejected" && (
        <div className="border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            onClick={() => onReject(false)}
            className="text-[11px] text-slate-400 hover:text-slate-600"
          >
            삭제 취소
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export default function ExperienceCandidateReview({
  result,
  rawText = "",
  onBack,
  onOpenResumeView,
  onOpenLogin,
  onOpenAssetMap = null,
  layout = "compact",
  initialRecordDate = null,
  sourceMode = null,
  sourceImportMethod = null,
  initialReviewState = null,
  qaSaveBypass = false,
}) {
  const isWeb = layout === "web";
  const mode = (sourceMode || result?.sourceMode) === "ai_conversation" ? "ai_conversation" : "work_trace";
  const [candidateReviewTourOpen, setCandidateReviewTourOpen] = useState(false);
  const [candidateReviewTourPhase, setCandidateReviewTourPhase] = useState("review");
  const candidateReviewTourStartedRef = useRef(false);
  const candidatePostSaveTourStartedRef = useRef(false);

  const [statuses, setStatuses] = useState(() => {
    const base = Object.fromEntries(
      (result.candidates || []).map((_, i) => [i, REVIEW_STATUS.pending])
    );
    const restored = initialReviewState?.statuses;
    if (restored && typeof restored === "object") {
      for (const key of Object.keys(base)) {
        const v = restored[key];
        if (v && Object.values(REVIEW_STATUS).includes(v)) base[key] = v;
      }
    }
    return base;
  });
  const [differReasons, setDifferReasons] = useState(() =>
    initialReviewState?.differReasons && typeof initialReviewState.differReasons === "object"
      ? { ...initialReviewState.differReasons }
      : {}
  );
  const [userEditedTexts, setUserEditedTexts] = useState(() =>
    initialReviewState?.userEditedTexts && typeof initialReviewState.userEditedTexts === "object"
      ? { ...initialReviewState.userEditedTexts }
      : {}
  );
  const [saveState, setSaveState] = useState("idle"); // "idle" | "saving" | "saved" | "error" | "auth"
  const [saveMessage, setSaveMessage] = useState("");

  const setStatus = (i, status) => {
    setStatuses((prev) => ({ ...prev, [i]: status }));
  };

  const sourceLabel = SOURCE_TYPE_LABEL[result.sourceType] || "업무 자료";
  const candidates = result.candidates || [];
  const canRunCandidateReviewTour =
    isWeb &&
    candidates.length > 0 &&
    isCandidateReviewTourArmed() &&
    !hasCandidateReviewTourState(CANDIDATE_REVIEW_TOUR_KEYS.dismissed) &&
    !hasCandidateReviewTourState(CANDIDATE_REVIEW_TOUR_KEYS.completed);

  useEffect(() => {
    if (!canRunCandidateReviewTour) return;
    if (candidateReviewTourStartedRef.current) return;
    if (saveState === "saved") return;
    candidateReviewTourStartedRef.current = true;
    setCandidateReviewTourPhase("review");
    setCandidateReviewTourOpen(true);
  }, [canRunCandidateReviewTour, saveState]);

  useEffect(() => {
    if (!canRunCandidateReviewTour) return undefined;
    if (candidatePostSaveTourStartedRef.current) return undefined;
    if (saveState !== "saved") return undefined;
    candidatePostSaveTourStartedRef.current = true;
    const timer = window.setTimeout(() => {
      setCandidateReviewTourPhase("postSave");
      setCandidateReviewTourOpen(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [canRunCandidateReviewTour, saveState]);
  const acceptedIndices = Object.entries(statuses)
    .filter(([, s]) => s === REVIEW_STATUS.accepted)
    .map(([i]) => Number(i));
  const accepted = acceptedIndices.length;
  const acceptedCandidates = acceptedIndices.map((i) => {
    const c = candidates[i];
    const editedText = userEditedTexts[i];
    if (editedText) {
      return {
        ...c,
        originalIndex: i,
        userEditedResumeBullet: editedText,
        suggestedResumeBullet: editedText,
      };
    }
    return { ...c, originalIndex: i };
  });

  // Preserve the current review before a login redirect so it can be restored.
  const persistPendingReview = () => {
    savePendingWorkTraceReview({
      rawText,
      result,
      sourceMode: mode,
      sourceImportMethod,
      statuses,
      differReasons,
      userEditedTexts,
      initialRecordDate,
    });
  };

  const handleSave = async () => {
    if (!acceptedCandidates.length) return;
    if (qaSaveBypass && import.meta.env.DEV) {
      setSaveState("saved");
      setSaveMessage(`${acceptedCandidates.length}개의 QA 경험 후보를 저장 완료 상태로 전환했습니다. 실제 저장은 실행되지 않았습니다.`);
      return;
    }
    setSaveState("saving");
    setSaveMessage("");
    const res = await saveAcceptedWorkTraceCandidates({
      rawText,
      analysisResult: result,
      acceptedCandidates,
      differReasons,
      recordDate: initialRecordDate,
      sourceMode: mode,
      importMethod: sourceImportMethod,
    });
    if (res.ok) {
      setSaveState("saved");
      clearPendingWorkTraceReview();
      clearWorkTraceAuthReturnHint();
      const dateLabel = initialRecordDate ? ` (${initialRecordDate})` : "";
      setSaveMessage(`${res.savedCount}개의 경험을 저장했어요${dateLabel}. 이 기록은 커리어 자산 맵의 쌓인 자산과 활용 방향에 반영됩니다.`);
      try {
        const hint = {
          source: "work_trace",
          savedAt: new Date().toISOString(),
          savedCount: res.savedCount,
          record: {
            id: res.savedRecord?.id ?? null,
            title: res.savedRecord?.title ?? null,
            strength_tags: res.savedRecord?.strength_tags?.slice(0, 5) ?? [],
            skill_tags: res.savedRecord?.skill_tags?.slice(0, 5) ?? [],
            assetCollaborationTags: res.savedRecord?.raw_payload?.assetCollaborationTags?.slice(0, 4) ?? [],
          },
        };
        sessionStorage.setItem("passmap_recent_work_trace_save", JSON.stringify(hint));
      } catch (_) {}
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("passmap:work-records-changed", {
          detail: { source: "work_trace", savedRecord: res.savedRecord, savedCount: res.savedCount },
        }));
      }
    } else if (res.errorCode === "AUTH_REQUIRED") {
      setSaveState("auth");
      setSaveMessage(res.message);
    } else {
      setSaveState("error");
      setSaveMessage(res.message || "저장 중 오류가 발생했어요.");
    }
  };

  // ─── Derived web section data ──────────────────────────────────────────
  const webSections = isWeb
    ? {
        traces: candidates.map((c) => c.title).filter(Boolean),
        collab: _collectCollabContexts(candidates),
        actions: _collectAll(candidates, "actions", 10),
        results: _collectAll(candidates, "result", 10),
        missing: _collectAll(candidates, "missingInfoQuestions", 6),
        skills: _collectAll(candidates, "skills", 15),
        jobTags: (() => {
          const BLOCKLIST = new Set(["이커머스", "일반 기업", "기타", "일반 산업", "비즈니스", "unknown", "null", "undefined"]);
          const normalize = (s) => s.trim().toLowerCase();
          const seen = new Set();
          const out = [];
          for (const v of _collectAll(candidates, "job_tags", 12)) {
            const k = normalize(v);
            if (!BLOCKLIST.has(k) && !seen.has(k)) { seen.add(k); out.push(v); }
          }
          return out.slice(0, 12);
        })(),
      }
    : null;

  // ─── Shared header bar ────────────────────────────────────────────────
  const headerBar = (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="text-[11px] text-slate-400 hover:text-slate-700"
          >
            ← 다시 입력
          </button>
          <span className="text-[10px] text-slate-300">|</span>
          <span className="text-[10px] text-slate-400">{sourceLabel} 분석 결과</span>
        </div>
        {!isWeb && (
          <>
            <h2 className="mt-1.5 text-sm font-bold text-slate-900">
              경험 후보 {candidates.length}개를 찾았어요
            </h2>
            {result.summary && (
              <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{result.summary}</p>
            )}
          </>
        )}
      </div>
      {accepted > 0 && (
        <div className="shrink-0 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
          {accepted}개 확인됨
        </div>
      )}
    </div>
  );

  // ─── Shared CTA ───────────────────────────────────────────────────────
  const ctaBlock = candidates.length > 0 && saveState !== "saved" ? (
    <div className={`sticky z-10 -mx-0 rounded-b-2xl border-t border-slate-100 bg-white px-0 pb-2 pt-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] ${isWeb ? "bottom-4" : "bottom-16"}`}>
      {accepted === 0 ? (
        <button
          type="button"
          data-tour-id={CANDIDATE_REVIEW_TOUR_IDS.saveButton}
          disabled
          className="w-full rounded-xl bg-slate-100 py-3 text-sm font-semibold text-slate-400 cursor-not-allowed"
        >
          저장할 경험을 선택해 주세요
        </button>
      ) : (
        <>
          <button
            type="button"
            data-tour-id={CANDIDATE_REVIEW_TOUR_IDS.saveButton}
            onClick={handleSave}
            disabled={saveState === "saving"}
            className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saveState === "saving"
              ? "저장 중…"
              : isWeb
              ? accepted > 1
                ? `이대로 저장하기 (${accepted}개)`
                : "이대로 저장하기"
              : `선택한 경험 저장 (${accepted}개)`}
          </button>
          {(saveState === "error" || saveState === "auth") && (
            <div className="mt-1.5 flex flex-col items-center gap-1.5">
              <p className="text-center text-[11px] text-amber-700">{saveMessage}</p>
              {saveState === "auth" && onOpenLogin && (
                <button
                  type="button"
                  onClick={() => {
                    persistPendingReview();
                    saveWorkTraceAuthReturnHint(mode);
                    onOpenLogin?.();
                  }}
                  className="text-[11px] font-semibold text-violet-600 hover:underline"
                >
                  로그인하기
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  ) : null;

  // ─── Saved success block ──────────────────────────────────────────────
  const savedBlock = candidates.length > 0 && saveState === "saved" ? (
    <div className="flex flex-col gap-2 pb-2" data-tour-id={CANDIDATE_REVIEW_TOUR_IDS.saveSuccess}>
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
        <p className="text-xs font-semibold text-emerald-700">✓ {saveMessage}</p>
      </div>
      {onOpenAssetMap && (
        <button
          type="button"
          data-tour-id={CANDIDATE_REVIEW_TOUR_IDS.assetMapButton}
          onClick={onOpenAssetMap}
          className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
        >
          커리어 자산 맵에서 확인하기
        </button>
      )}
      {onOpenResumeView && (
        <button
          type="button"
          data-tour-id={CANDIDATE_REVIEW_TOUR_IDS.resumeButton}
          onClick={onOpenResumeView}
          className="w-full rounded-xl border border-violet-200 bg-violet-50 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-100"
        >
          이력서 후보 보기
        </button>
      )}
    </div>
  ) : null;

  // ─── Empty candidates block ───────────────────────────────────────────
  const emptyBlock = candidates.length === 0 ? (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-6 text-center">
      <p className="text-sm text-slate-500">경험 후보를 찾지 못했어요.</p>
      <p className="mt-1 text-xs text-slate-400">내용을 더 추가하거나 다른 자료를 붙여넣어 주세요.</p>
      <button type="button" onClick={onBack} className="mt-4 text-xs font-medium text-violet-600 hover:underline">
        다시 입력하기
      </button>
    </div>
  ) : null;

  // ─── Candidate cards list ─────────────────────────────────────────────
  const candidateCards = candidates.map((c, i) => (
    <CandidateCard
      key={i}
      candidate={c}
      status={statuses[i]}
      differReason={differReasons[i] ?? null}
      acceptTourId={i === 0 ? CANDIDATE_REVIEW_TOUR_IDS.acceptControl : null}
      onAccept={(val) => setStatus(i, val ? REVIEW_STATUS.accepted : REVIEW_STATUS.pending)}
      onReject={(val) => setStatus(i, val === false ? REVIEW_STATUS.pending : REVIEW_STATUS.rejected)}
      onDiffer={(reason) => {
        if (reason) {
          setStatus(i, REVIEW_STATUS.needsEdit);
          setDifferReasons((prev) => ({ ...prev, [i]: reason }));
        } else {
          setStatus(i, REVIEW_STATUS.needsEdit);
        }
      }}
      onEditConfirm={(editedText) => {
        setUserEditedTexts((prev) => ({ ...prev, [i]: editedText }));
        setStatus(i, REVIEW_STATUS.accepted);
        setDifferReasons((prev) => ({ ...prev, [i]: "manual_edit" }));
      }}
    />
  ));

  const candidateReviewTourHost = (
    <FirstRecordGuidedTour
      open={candidateReviewTourOpen}
      tourType="candidateReview"
      candidateReviewPhase={candidateReviewTourPhase}
      variant="web"
      onClose={() => setCandidateReviewTourOpen(false)}
      onComplete={() => setCandidateReviewTourOpen(false)}
    />
  );

  // ─── Web layout ───────────────────────────────────────────────────────
  if (isWeb) {
    return (
      <div className="flex flex-col gap-6">
        {candidateReviewTourHost}
        {/* Step header */}
        <div>
          <span className="inline-flex items-center rounded-full bg-violet-600 px-3 py-1 text-[12px] font-semibold text-white">
            경험 기록하기 2/2
          </span>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            AI가 이렇게 정리했어요
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            필요한 부분만 가볍게 수정하고 저장하세요.
          </p>
        </div>

        {headerBar}

        {result.detectedPeriod && (
          <div className="text-[11px] text-slate-500">
            감지된 기간: <span className="font-medium">{result.detectedPeriod}</span>
          </div>
        )}

        {emptyBlock}

        {candidates.length > 0 && (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(260px,320px)]">
            {/* Left: sections + candidate cards */}
            <div className="min-w-0 space-y-6">
              {/* Section summary grid */}
              <div className="grid gap-3 sm:grid-cols-2">
                <WebSection
                  title="업무 흔적"
                  items={webSections.traces}
                />
                <WebSection
                  title="협업 대상 및 맥락"
                  items={webSections.collab}
                />
                <WebSection
                  title="내 역할 및 행동"
                  items={webSections.actions.slice(0, 6)}
                />
                <div className="space-y-3">
                  <WebSection
                    title="성과 및 변화"
                    items={webSections.results.slice(0, 5)}
                  />
                  {webSections.missing.length > 0 && (
                    <WebSection
                      title="보완하면 더 강해질 부분"
                      items={webSections.missing}
                      muted
                    />
                  )}
                </div>
                <WebSection
                  title="커리어 자산"
                  items={webSections.skills}
                  chipStyle
                />
                <WebSection
                  title="활용 방향"
                  items={webSections.jobTags}
                  chipStyle
                />
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[11px] font-medium text-slate-400">경험 후보 확인 및 수정</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Candidate cards */}
              <div className="space-y-4" data-tour-id={CANDIDATE_REVIEW_TOUR_IDS.reviewList}>
                {candidateCards}
              </div>

              {savedBlock}
              {ctaBlock}
            </div>

            {/* Right: summary card */}
            <div className="hidden lg:block min-w-0">
              <WebRightCard candidates={candidates} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Compact layout (mobile default) ─────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {candidateReviewTourHost}
      {headerBar}

      {result.detectedPeriod && (
        <div className="text-[11px] text-slate-500">
          감지된 기간: <span className="font-medium">{result.detectedPeriod}</span>
        </div>
      )}

      {emptyBlock}
      {candidateCards}
      {savedBlock}
      {ctaBlock}
    </div>
  );
}
