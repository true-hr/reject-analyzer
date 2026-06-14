import { useEffect, useMemo, useState } from "react";
import { previewGoogleCalendarEvents } from "@/lib/googleCalendarCandidateRepository.js";

const DISMISSED_KEY = "passmap:gcal-candidate-dismissed:v1";
const LATER_KEY = "passmap:gcal-candidate-later:v1";

function safeReadIds(key) {
  if (typeof window === "undefined") return new Set();
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
}

function safeWriteIds(key, ids) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify([...ids]));
  } catch {
    // localStorage may be unavailable in private or restricted browser modes.
  }
}

function getMonthRangeIso(selectedDate) {
  const base = /^\d{4}-\d{2}-\d{2}$/.test(String(selectedDate || ""))
    ? new Date(`${selectedDate}T00:00:00`)
    : new Date();
  const start = new Date(base.getFullYear(), base.getMonth(), 1, 0, 0, 0);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 0, 23, 59, 59);
  return {
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
  };
}

function formatCandidateTime(candidate) {
  const start = String(candidate?.startTime || "");
  const end = String(candidate?.endTime || "");
  if (!start.includes("T")) return candidate?.date || "";
  const startTime = start.slice(11, 16);
  const endTime = end.includes("T") ? end.slice(11, 16) : "";
  return [candidate?.date, endTime ? `${startTime} ~ ${endTime}` : startTime].filter(Boolean).join(" ");
}

function inferProjectName(candidate) {
  const title = String(candidate?.title || "").trim();
  if (/면접|interview/i.test(title)) return "면접 준비";
  if (/포트폴리오|portfolio/i.test(title)) return "포트폴리오 준비";
  if (/지원|apply|application/i.test(title)) return "지원 준비";
  if (/회의|미팅|meeting|project/i.test(title)) return title.slice(0, 40) || "프로젝트 일정";
  return "Google Calendar Action";
}

function buildExperiencePayload(candidate) {
  return {
    date: candidate.date,
    mode: "calendar-event-experience",
    source: "google-calendar-candidate",
    googleCalendarCandidate: candidate,
  };
}

function buildProjectActionPayload(candidate) {
  return {
    date: candidate.date,
    mode: "project-action",
    source: "google-calendar-candidate",
    recordType: "teamProject",
    projectName: inferProjectName(candidate),
    googleCalendarCandidate: candidate,
  };
}

export default function GoogleCalendarCandidatePanel({
  selectedDate = "",
  isProjectView = false,
  onOpenRecordInput,
  onOpenProjectActionDraft,
}) {
  const enabled = import.meta.env.VITE_GOOGLE_CALENDAR_ENABLED === "true";
  const [candidates, setCandidates] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(() => safeReadIds(DISMISSED_KEY));
  const [laterIds, setLaterIds] = useState(() => safeReadIds(LATER_KEY));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const range = useMemo(() => getMonthRangeIso(selectedDate), [selectedDate]);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    Promise.resolve()
      .then(() => {
        if (!active) return null;
        setLoading(true);
        setError("");
        return previewGoogleCalendarEvents({ ...range, calendarId: "primary", maxResults: 20 });
      })
      .then((result) => {
        if (!active) return;
        if (!result) return;
        if (!result?.ok) {
          setCandidates([]);
          setError(result?.error || "google_calendar_candidates_failed");
          return;
        }
        setCandidates(result.candidates || []);
      })
      .catch(() => {
        if (!active) return;
        setCandidates([]);
        setError("google_calendar_candidates_failed");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [enabled, range]);

  const visibleCandidates = useMemo(
    () => candidates.filter((candidate) => !dismissedIds.has(candidate.id) && !laterIds.has(candidate.id)).slice(0, 4),
    [candidates, dismissedIds, laterIds],
  );

  if (!enabled) return null;

  function markCandidate(key, setIds, candidateId) {
    setIds((current) => {
      const next = new Set(current);
      next.add(String(candidateId || ""));
      safeWriteIds(key, next);
      return next;
    });
  }

  function openProjectActionCandidate(candidate) {
    const payload = buildProjectActionPayload(candidate);
    if (isProjectView && typeof onOpenProjectActionDraft === "function") {
      onOpenProjectActionDraft(payload);
      return;
    }
    onOpenRecordInput?.(payload);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Google Calendar에서 기록 후보를 찾았어요</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            바로 기록으로 확정하지 않고, 맞는 일정만 골라 경험으로 바꿀 수 있어요.
          </p>
        </div>
        {loading ? <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">확인 중</span> : null}
      </div>

      {error ? (
        <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-3 text-xs leading-relaxed text-amber-700">
          Google Calendar 연결이 필요해요. 연결 후 다시 후보를 확인할 수 있어요.
        </div>
      ) : null}

      {!loading && !error && visibleCandidates.length === 0 ? (
        <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-xs leading-relaxed text-slate-500">
          이 달에는 바로 바꿀 만한 일정 후보가 아직 없어요.
        </div>
      ) : null}

      {visibleCandidates.length > 0 ? (
        <div className="mt-3 space-y-2">
          {visibleCandidates.map((candidate) => (
            <article key={candidate.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{candidate.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatCandidateTime(candidate)}</p>
                </div>
                <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-slate-500">
                  {candidate.suggestedType === "project_action" ? "Action 후보" : "경험 후보"}
                </span>
              </div>
              {candidate.description ? (
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600">{candidate.description}</p>
              ) : null}
              <p className="mt-2 text-[11px] text-slate-400">
                {[candidate.location, candidate.attendeeCount ? `참석자 ${candidate.attendeeCount}명` : ""].filter(Boolean).join(" · ")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {onOpenRecordInput || (isProjectView && onOpenProjectActionDraft) ? (
                  <>
                    <button
                      type="button"
                      className="rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50"
                      onClick={() => onOpenRecordInput?.(buildExperiencePayload(candidate))}
                    >
                      경험 기록으로 전환하기
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      onClick={() => openProjectActionCandidate(candidate)}
                    >
                      프로젝트 Action으로 전환하기
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                  onClick={() => markCandidate(LATER_KEY, setLaterIds, candidate.id)}
                >
                  나중에 보기
                </button>
                <button
                  type="button"
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                  onClick={() => markCandidate(DISMISSED_KEY, setDismissedIds, candidate.id)}
                >
                  이 일정은 무시하기
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
