import { useEffect, useMemo, useRef, useState } from "react";
import { FolderPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRecordPresetByJobId } from "@/data/workRecord/jobExtensionRegistry.js";
import PmRecordInput from "./PmRecordInput.jsx";
import RecordCalendarCard from "../home/RecordCalendarCard.jsx";
import { homeDashboardMock, PASSMAP_DEMO_RANGE_RECORDS } from "../home/homeDashboardMock.js";
import { buildCalendarMonthViewModel, buildCalendarRecordFromPmInput } from "../home/homeDashboardCalendarUtils";
import { supabase } from "@/lib/supabaseClient.js";
import { createWorkRecord, deleteWorkRecord, listWorkRecords, updateWorkRecordWithCandidate } from "@/lib/workRecordRepository.js";
import { signInWithGoogle, signInWithKakao, onAuthStateChange, getSession } from "@/lib/auth.js";
import { normalizeWorkRecordDraftFromStoredRecord, buildResumeUpdateCandidateFromRecord } from "@/lib/resume/recordToResumeCandidate.js";
import { buildResumeDraftViewModel } from "@/lib/resume/buildResumeDraftViewModel.js";
import {
  buildPassmapResumeDraft,
  buildPassmapResumeMarkdown,
  buildResumeDraftDownloadName,
  parsePassmapResumeDraftJson,
  resolveResumeDraftTrack,
} from "@/lib/resume/resumeDraftTransfer.js";
import { getLatestDefaultResumeProfile, saveDefaultResumeProfile, saveDefaultResumeExperiences, saveDefaultResumeSummary, saveDefaultResumeSkills } from "@/lib/resumeProfileRepository.js";
import {
  DEFAULT_RESUME_PROFILE_DISPLAY,
  DEFAULT_RESUME_EXPERIENCE_DISPLAY,
  DEFAULT_RESUME_EDUCATION_DISPLAY,
  buildDemoResult,
} from "./pmMvpDemoModel.js";

const DEFAULT_PM_JOB_ID = "JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT";
const PASSMAP_WORK_RECORDS_CHANGED_EVENT = "passmap:work-records-changed";

function pmTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const TRACK_BADGE = {
  weekly: "이번 주 기록 기준",
  project: "프로젝트 기록 기준",
};

const SCREEN_WIDTH_CLASS = {
  weekly: "w-full min-w-0",
  project: "w-full min-w-0",
  result: "w-full min-w-0 max-w-5xl",
  readiness: "w-full min-w-0 max-w-6xl",
};

function getScreenWidthClass(screen) {
  return SCREEN_WIDTH_CLASS[screen] || SCREEN_WIDTH_CLASS.weekly;
}


function SectionCard({ title, children, tone = "default" }) {
  const toneClass = tone === "highlight" ? "border-primary/20 bg-primary/5" : "border-slate-200 bg-white";
  return (
    <Card className={`rounded-2xl shadow-none ${toneClass}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function BulletList({ items }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-slate-700">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SignalBlock({ title, items, tone = "slate" }) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className={`rounded-full border px-3 py-1 text-xs font-medium ${toneClass}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function ResumeDocSection({ title, children }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold tracking-[0.08em] text-slate-500 uppercase">{title}</h3>
      <div className="space-y-3 text-[15px] leading-7 text-slate-800">{children}</div>
    </section>
  );
}

function pickFirstText(...values) {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }
  return "";
}

function toCleanTextList(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
}

function uniqueCleanTextList(...groups) {
  return [...new Set(groups.flatMap(toCleanTextList))];
}

function compactSavedSummaryText(value, maxLength = 120) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
}

function normalizeResumeAiSourceKey(value) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 160);
}

function normalizeAiResumeBullets(value) {
  return Array.isArray(value)
    ? value
        .map((bullet) => ({
          ...bullet,
          text: String(bullet?.text || "").trim(),
        }))
        .filter((bullet) => bullet.text)
    : [];
}

const RESUME_AI_DIRECT_CACHE_KEY = "passmap_resume_ai_direct_bullets_v1";
let resumeAiDirectBulletsMemoryCache = [];

function readResumeAiDirectBulletsCache() {
  if (resumeAiDirectBulletsMemoryCache.length > 0) {
    return resumeAiDirectBulletsMemoryCache;
  }
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(RESUME_AI_DIRECT_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const bullets = normalizeAiResumeBullets(parsed?.bullets);
    resumeAiDirectBulletsMemoryCache = bullets;
    return bullets;
  } catch {
    return [];
  }
}

function writeResumeAiDirectBulletsCache(bullets) {
  const normalized = normalizeAiResumeBullets(bullets);
  resumeAiDirectBulletsMemoryCache = normalized;
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(
        RESUME_AI_DIRECT_CACHE_KEY,
        JSON.stringify({
          bullets: normalized,
          savedAt: Date.now(),
        })
      );
    } catch {
      // ignore storage errors
    }
  }
  return normalized;
}

function clearResumeAiDirectBulletsCache() {
  resumeAiDirectBulletsMemoryCache = [];
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(RESUME_AI_DIRECT_CACHE_KEY);
    } catch {
      // ignore storage errors
    }
  }
}

const RESUME_AI_DIRECT_PENDING_KEY = "passmap_resume_ai_direct_pending_v1";
let resumeAiDirectPendingMemoryCache = false;

function readResumeAiDirectPendingCache() {
  if (resumeAiDirectPendingMemoryCache) {
    return true;
  }
  if (typeof window === "undefined") return false;
  try {
    const raw = window.sessionStorage.getItem(RESUME_AI_DIRECT_PENDING_KEY);
    return raw === "true";
  } catch {
    return false;
  }
}

function writeResumeAiDirectPendingCache() {
  resumeAiDirectPendingMemoryCache = true;
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(RESUME_AI_DIRECT_PENDING_KEY, "true");
    } catch {
      // ignore storage errors
    }
  }
}

function clearResumeAiDirectPendingCache() {
  resumeAiDirectPendingMemoryCache = false;
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(RESUME_AI_DIRECT_PENDING_KEY);
    } catch {
      // ignore storage errors
    }
  }
}

function buildResumeAiCompositeSourceKey(parts) {
  return parts
    .map((part) => normalizeResumeAiSourceKey(part))
    .filter(Boolean)
    .join("||")
    .slice(0, 500);
}

function hasObjectValues(value) {
  return !!value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0;
}

function downloadTextFile(filename, content, mimeType) {
  const blob = new Blob(["\uFEFF", content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function createAiResumeImportPreviewDraft(text) {
  const rawText = String(text || "").trim();
  return {
    schemaVersion: 1,
    source: "passmap_ai_resume_import_preview",
    importedAt: new Date().toISOString(),
    profile: {},
    target: {},
    summary: [
      "붙여넣은 이력서 내용을 바탕으로 AI 변환 결과가 이 위치에 미리보기로 표시됩니다.",
    ],
    experiences: [{
      company: "",
      role: "",
      startDate: "",
      endDate: "",
      description: "다음 단계에서 AI가 원문을 경력 단위로 정리합니다.",
      bullets: [],
    }],
    education: [],
    skills: [],
    warnings: [
      "현재는 AI 연결 전 미리보기 단계입니다.",
      "다음 라운드에서 OpenAI/Worker 연결 후 실제 이력서 구조화가 적용됩니다.",
    ],
    unknowns: [],
    confidence: {
      profile: "low",
      target: "low",
      experiences: "low",
      skills: "low",
    },
    rawInputPreview: rawText.slice(0, 300),
  };
}

function stripRecordDraftPrefix(value) {
  return String(value || "").replace(/^업무 기록 기반 초안:\s*/, "").trim();
}

function buildSavedRecordSummaryTitle(candidate, sourceText) {
  const draft = candidate?.workRecordDraft || {};
  const roleLabel = toCleanTextList(draft.roleTags)[0] || toCleanTextList(candidate?.competencyTags)[0] || "";
  const purposeMatch = String(sourceText || "").match(/외부 공유|내부 정리|의사결정|협업 조율|업무 기준 정리/);
  if (roleLabel && purposeMatch?.[0]) return compactSavedSummaryText(`${purposeMatch[0]}용 ${roleLabel}`, 64);
  if (roleLabel) return compactSavedSummaryText(roleLabel, 64);
  return compactSavedSummaryText(candidate?.sourceSummary || sourceText, 80);
}

function buildSavedRecordSummaryTags(candidate, sourceText) {
  const source = [
    sourceText,
    candidate?.sourceSummary,
    candidate?.resumeSentence,
    ...toCleanTextList(candidate?.competencyTags),
    ...toCleanTextList(candidate?.collaborationTags),
  ].join(" ");
  const inferredTags = [];
  if (/(문서|제안서|보고서|가이드|자료|정리|작성)/.test(source)) inferredTags.push("문서화");
  if (/(공유|커뮤니케이션|미팅|협의|조율|문의|고객|사용자)/.test(source)) inferredTags.push("커뮤니케이션");
  if (/(협업|공유|조율|미팅|준비)/.test(source)) inferredTags.push("협업 준비");
  if (/(분석|데이터|지표|리포트|인사이트)/.test(source)) inferredTags.push("분석");
  if (/(오류|버그|문제|이슈|장애|해결)/.test(source)) inferredTags.push("문제 해결");
  if (/(개선|보완|수정|최적화)/.test(source)) inferredTags.push("개선");
  if (/(운영|관리|일정|점검|모니터링)/.test(source)) inferredTags.push("운영 관리");

  return uniqueCleanTextList(
    inferredTags,
    candidate?.competencyTags,
    candidate?.collaborationTags,
    candidate?.evidenceTags,
  ).slice(0, 4);
}

function buildSavedRecordImprovementHints(sourceText) {
  const source = String(sourceText || "").trim();
  const hints = [];
  if (/공유/.test(source) && !/(고객|사용자|팀|부서|파트너|거래처|협력사|담당자|클라이언트)/.test(source)) {
    hints.push("누구에게 공유했는지 추가하면 더 좋아요.");
  } else if (!/(고객|사용자|팀|부서|파트너|거래처|협력사|담당자|클라이언트|외부|내부)/.test(source)) {
    hints.push("누구와 관련된 일인지 추가하면 더 좋아요.");
  }
  if (!/(결과|성과|완료|확정|정해|해결|개선|줄|늘|감소|증가|명확|쉬워|공유|반영)/.test(source)) {
    hints.push("이후 어떤 논의나 결과가 있었는지 적어두면 더 좋아요.");
  }
  if (hints.length < 2 && !/\d/.test(source)) {
    hints.push("수치나 변화 기준이 있으면 함께 남겨두면 좋아요.");
  }
  return hints.slice(0, 2);
}

function buildLastSavedRecordSummary(savedRecord) {
  if (!savedRecord || typeof savedRecord !== "object") return null;
  const candidate = buildResumeUpdateCandidateFromRecord(savedRecord);
  const draft = candidate?.workRecordDraft || {};
  const sourceTrack = String(candidate?.sourceTrack || draft.track || savedRecord.work_type || "").trim();
  if (sourceTrack !== "weekly") return null;

  const sourceText = pickFirstText(candidate?.sourceText, draft.text, savedRecord.description, savedRecord.title);
  if (!sourceText) return null;

  const resumeSentence = stripRecordDraftPrefix(candidate?.resumeSentence) || compactSavedSummaryText(sourceText, 140);
  return {
    title: "방금 기록 정리",
    sourceSummary: buildSavedRecordSummaryTitle(candidate, sourceText),
    resumeSentence,
    tags: buildSavedRecordSummaryTags(candidate, sourceText),
    improvementHints: buildSavedRecordImprovementHints(sourceText),
    notice: "이 문장은 이력서에 바로 반영된 것이 아니라, 나중에 다듬어 쓸 수 있는 초안입니다.",
  };
}

function LastSavedRecordSummaryCard({ summary }) {
  if (!summary) return null;

  return (
    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
      <div className="space-y-1">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">{summary.title}</div>
        <h3 className="text-base font-semibold text-slate-950">방금 기록을 이렇게 정리할 수 있어요</h3>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-emerald-100 bg-white/80 px-3 py-3">
          <div className="text-[11px] font-semibold text-slate-500">업무 요약</div>
          <p className="mt-1 text-sm leading-relaxed text-slate-800">{summary.sourceSummary}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-white/80 px-3 py-3">
          <div className="text-[11px] font-semibold text-slate-500">이력서 초안 문장</div>
          <p className="mt-1 text-sm leading-relaxed text-slate-800">{summary.resumeSentence}</p>
        </div>
      </div>
      {summary.tags?.length ? (
        <div className="mt-3">
          <div className="text-[11px] font-semibold text-slate-500">연결 역량</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {summary.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                {tag}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {summary.improvementHints?.length ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
          <div className="text-[11px] font-semibold text-amber-700">보완하면 좋은 정보</div>
          <ul className="mt-1 space-y-1">
            {summary.improvementHints.map((hint) => (
              <li key={hint} className="text-xs leading-relaxed text-amber-900">
                {hint}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="mt-3 text-[11px] leading-relaxed text-emerald-800">{summary.notice}</p>
    </div>
  );
}

function buildResumeExperienceBullets(result) {
  const bullets = [];
  const resumeLine = String(result?.resumeLine || "").trim();
  if (resumeLine) bullets.push(resumeLine);

  const strengthSentenceMap = {
    "운영 이슈 구조화": "반복적으로 발생하는 운영 이슈를 유형별로 정리해 대응 기준과 처리 흐름을 명확하게 만들었습니다.",
    "협업 조율": "개발팀을 포함한 여러 이해관계자와 확인 포인트를 맞추며 이슈 해결 과정을 안정적으로 조율했습니다.",
    "후속 실행 관리": "이슈 처리 후 필요한 후속 조치와 재확인 항목까지 이어서 관리해 대응이 일회성으로 끝나지 않도록 했습니다.",
    "문서화 역량": "대응 과정과 주요 판단 기준을 문서 형태로 정리해 이후 유사 이슈에도 재사용할 수 있는 기반을 만들었습니다.",
  };

  (Array.isArray(result?.strengths) ? result.strengths : []).forEach((item) => {
    const sentence = strengthSentenceMap[item];
    if (sentence && !bullets.includes(sentence)) bullets.push(sentence);
  });

  return bullets.slice(0, 4);
}

function buildResumeSkillItems(result) {
  const skills = [];
  const skillMap = {
    "운영 이슈 구조화": "이슈 구조화",
    "협업 조율": "협업 조율",
    "후속 실행 관리": "후속 실행 관리",
    "문서화 역량": "운영 문서화",
    "여러 이해관계자와의 협업 조율": "크로스펑셔널 커뮤니케이션",
    "반복 이슈를 구조화한 경험": "운영 개선 관점",
    "운영 흐름 정리": "운영 프로세스 정리",
    "요구사항/이슈 문서화": "요구사항 문서화",
  };

  [...(result?.strengths || []), ...(result?.pmSignals || []), ...(result?.serviceSignals || [])].forEach((item) => {
    const label = skillMap[item] || String(item || "").trim();
    if (label && !skills.includes(label)) skills.push(label);
  });

  return skills.slice(0, 8);
}

function buildImprovementNotes(result) {
  return (Array.isArray(result?.nextActions) ? result.nextActions : [])
    .map((item) => {
      const text = String(item || "").trim();
      if (!text) return "";
      if (text.includes("수치")) return "처리 시간이나 건수 같은 수치가 보강되면 성과의 변화 폭이 더 선명하게 전달됩니다.";
      if (text.includes("맥락")) return "이 이슈를 먼저 해결한 배경이 함께 정리되면 문제 판단 역량이 더 분명하게 드러납니다.";
      if (text.includes("사용자") || text.includes("고객")) return "사용자 관점의 의미를 덧붙이면 개선 결과가 실제 가치로 더 잘 연결됩니다.";
      return text;
    })
    .filter(Boolean)
    .slice(0, 3);
}

function ScreenHeader({ badge, title, description, sourceTrack = null }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="w-fit rounded-full border-slate-200 bg-white text-slate-600">
          {badge}
        </Badge>
        {sourceTrack ? (
          <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-700">
            {TRACK_BADGE[sourceTrack]}
          </Badge>
        ) : null}
      </div>
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-600">{description}</p>
      </div>
    </div>
  );
}

function normalizeRecordScreen(value) {
  if (value === "project") return "project";
  if (value === "weekly") return "weekly";
  if (value === "today") return "weekly";
  return value;
}

function safeParseRawPayload(value) {
  try { return JSON.parse(value); } catch { return {}; }
}

// Converts a Supabase work_records row to the calendar record shape expected by RecordCalendarCard.
function adaptWorkRecordRow(row) {
  const raw =
    row.raw_payload && typeof row.raw_payload === "object"
      ? row.raw_payload
      : safeParseRawPayload(row.raw_payload);

  const rawRecordType = String(raw?.recordType || "").trim();

  let normalizedRecordType = "weekly";
  let normalizedWorkType = "이번 주 기록";

  if (rawRecordType === "personal") {
    normalizedRecordType = "personal";
    normalizedWorkType = "개인 업무";
  } else if (rawRecordType === "teamProject") {
    normalizedRecordType = "teamProject";
    normalizedWorkType = "팀 프로젝트";
  } else if (row.work_type === "project") {
    // raw_payload.recordType이 없는 기존 project 기록을 range bar 가능 값으로 복구
    normalizedRecordType = "teamProject";
    normalizedWorkType = "팀 프로젝트";
  }

  const resumeSentence = String(
    raw.resumeSentence ||
    raw.reflectedSentence ||
    row.result ||
    ""
  ).trim();

  return {
    id: String(row.id || ""),
    date: String(row.record_date || ""),
    source: "supabase",
    workType: normalizedWorkType,
    title: String(row.title || raw.projectName || row.description || raw.text || raw.projectActions || "").slice(0, 40).trim(),
    summary: String(row.description || raw.text || raw.projectActions || "").trim(),
    reflectedSentence: resumeSentence,
    strengthTags: Array.isArray(row.strength_tags) ? row.strength_tags : [],
    linkedAssetIds: [],
    recordType: normalizedRecordType,
    startDate: String(raw.startDate || row.record_date || ""),
    endDate: String(raw.endDate || ""),
    projectPeriod: String(raw.projectPeriod || ""),
    googleCalendarEventId: row.google_calendar_event_id ?? null,
    googleCalendarSyncStatus: row.google_calendar_sync_status ?? null,
    googleCalendarSyncedAt: row.google_calendar_synced_at ?? null,
    googleCalendarSyncError: row.google_calendar_sync_error ?? null,
  };
}

const DEFAULT_PM_LAST_INPUT = {
  text: "개발팀과 반복 오류 문의 유형을 정리하고, 대응 문서를 업데이트해 후속 대응 흐름을 정리했다.",
};

// CAL-7D: fire-and-forget Google Calendar sync after record create.
// Skips silently when flag/token/URL is absent. Never throws to caller.
async function syncWorkRecordToGoogleCalendar(recordId) {
  if (import.meta.env.VITE_GOOGLE_CALENDAR_ENABLED !== "true") return;
  if (!recordId) return;
  const workerBase = (import.meta.env.VITE_AI_PROXY_URL || "").toString().trim();
  if (!workerBase) return;
  let accessToken = null;
  try {
    const session = await getSession();
    accessToken = session?.access_token ?? null;
  } catch (_) {}
  if (!accessToken) return;
  try {
    const res = await fetch(`${workerBase}/api/calendar/google/sync-record`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recordId }),
    });
    const resJson = await res.json();
    if (!res.ok || !resJson.ok) return;
  } catch (_) {}
}

// CAL-8E: fire-and-forget Google Calendar patch after record update.
// Sends only recordId; Worker reads the Calendar event id server-side.
async function updateGoogleCalendarEventForWorkRecord(recordId) {
  if (import.meta.env.VITE_GOOGLE_CALENDAR_ENABLED !== "true") return;
  if (!recordId) return;
  const workerBase = (import.meta.env.VITE_AI_PROXY_URL || "").toString().trim();
  if (!workerBase) return;
  let accessToken = null;
  try {
    const session = await getSession();
    accessToken = session?.access_token ?? null;
  } catch (_) {}
  if (!accessToken) return;
  try {
    const res = await fetch(`${workerBase}/api/calendar/google/update-record-event`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recordId }),
    });
    if (!res.ok) return;
    const resJson = await res.json();
    if (!resJson.ok) return;
  } catch (_) {}
}

// CAL-8F-1: awaited Google Calendar event delete before work_record row removal.
// Sends only recordId; Worker reads google_calendar_event_id server-side.
// Never throws — all failures are silently swallowed so PASSMAP delete always proceeds.
async function deleteGoogleCalendarEventForWorkRecord(recordId) {
  if (import.meta.env.VITE_GOOGLE_CALENDAR_ENABLED !== "true") return;
  if (!recordId) return;
  const workerBase = (import.meta.env.VITE_AI_PROXY_URL || "").toString().trim();
  if (!workerBase) return;
  let accessToken = null;
  try {
    const session = await getSession();
    accessToken = session?.access_token ?? null;
  } catch (_) {}
  if (!accessToken) return;
  try {
    const res = await fetch(`${workerBase}/api/calendar/google/delete-record-event`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recordId }),
    });
    if (!res.ok) return;
    const resJson = await res.json();
    if (!resJson.ok) return;
  } catch (_) {}
}

function PostSavePrompt({ onOpenResumeView, onOpenAnalysis, onDismiss }) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 space-y-2.5">
      <div>
        <p className="text-sm font-semibold text-slate-800">기록이 저장됐어요</p>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
          이 기록은 이력서 문장과 직무 분석의 근거로 활용할 수 있어요.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {typeof onOpenResumeView === "function" && (
          <button
            type="button"
            onClick={onOpenResumeView}
            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-400"
          >
            이력서 보기
          </button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
        >
          계속 기록하기
        </button>
        {typeof onOpenAnalysis === "function" && (
          <button
            type="button"
            onClick={onOpenAnalysis}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50"
          >
            분석에서 점검하기
          </button>
        )}
      </div>
    </div>
  );
}

export default function PmMvpView({
  entryView = "weekly",
  mode = "update",
  onOpenAnalysis = null,
  onOpenResumeView = null,
  onOpenUpdateView = null,
  currentCareerRoleLabel = "",
  currentJobId = "",
  externalLastInput = null,
  onRecordSubmit = null,
  onOpenLogin = null,
  collapseStructuredSections = false,
}) {
  const [currentScreen, setCurrentScreen] = useState(normalizeRecordScreen(entryView));
  const [sourceTrack, setSourceTrack] = useState("weekly");
  const [lastInput, setLastInput] = useState(externalLastInput ?? DEFAULT_PM_LAST_INPUT);
  const [actionNote, setActionNote] = useState("");
  const [lastSavedRecordSummary, setLastSavedRecordSummary] = useState(null);
  const [calendarSelectedDate, setCalendarSelectedDate] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [dbRecords, setDbRecords] = useState([]);
  const [rawDbRows, setRawDbRows] = useState([]);
  const [dbFetchDone, setDbFetchDone] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [savedResumeProfileRecord, setSavedResumeProfileRecord] = useState(null);
  const [savedResumeProfileDraft, setSavedResumeProfileDraft] = useState(null);
  const [resumeProfileFetchDone, setResumeProfileFetchDone] = useState(false);
  const [resumeProfileError, setResumeProfileError] = useState("");
  const [isResumeProfileEditorOpen, setIsResumeProfileEditorOpen] = useState(false);
  const [resumeProfileForm, setResumeProfileForm] = useState({
    profile: { name: "", phone: "", email: "", location: "", portfolioUrl: "" },
    education: [],
  });
  const [resumeProfileSaving, setResumeProfileSaving] = useState(false);
  const [isResumeExperienceEditorOpen, setIsResumeExperienceEditorOpen] = useState(false);
  const [resumeExperienceForm, setResumeExperienceForm] = useState([]);
  const [resumeExperienceError, setResumeExperienceError] = useState("");
  const [resumeExperienceSaving, setResumeExperienceSaving] = useState(false);
  const [isResumeSummaryEditorOpen, setIsResumeSummaryEditorOpen] = useState(false);
  const [resumeSummaryFormText, setResumeSummaryFormText] = useState("");
  const [resumeSummaryError, setResumeSummaryError] = useState("");
  const [resumeSummarySaving, setResumeSummarySaving] = useState(false);
  const [isResumeSkillsEditorOpen, setIsResumeSkillsEditorOpen] = useState(false);
  const [resumeSkillsFormText, setResumeSkillsFormText] = useState("");
  const [resumeSkillsError, setResumeSkillsError] = useState("");
  const [resumeSkillsSaving, setResumeSkillsSaving] = useState(false);
  const [selectedResumeRecordId, setSelectedResumeRecordId] = useState("");
  const [candidateSaveStatus, setCandidateSaveStatus] = useState("idle");
  const [editedResumeSentence, setEditedResumeSentence] = useState("");
  const [isEditingResumeSentence, setIsEditingResumeSentence] = useState(false);
  // P-6-3C: 저장 완료 후 fetchWorkRecords에 의한 candidate 키 변경을 저장 성공으로 인식하기 위한 flag.
  const justCompletedSaveRef = useRef(false);
  // P-6-3E: 편집 모드 진입 시 textarea에 채운 초기값. 이 값과 동일하면 사용자가 실제 수정하지 않은 것으로 간주.
  const resumeSentenceInitialFillRef = useRef("");
  // P-AI-1: AI 이력서 문장 초안 생성 상태 — 버튼 클릭 시에만 호출, 자동 저장 없음.
  const [aiResumeLoading, setAiResumeLoading] = useState(false);
  const [aiResumeAfterCardStatus, setAiResumeAfterCardStatus] = useState("idle");
  const [aiResumeBullets, setAiResumeBullets] = useState([]);
  const [aiResumeRenderBullets, setAiResumeRenderBullets] = useState([]);
  const [aiResumeDirectBullets, setAiResumeDirectBullets] = useState(() =>
    readResumeAiDirectBulletsCache()
  );
  const [aiResumeDirectBulletsTick, setAiResumeDirectBulletsTick] = useState(0);
  const [aiResumeError, setAiResumeError] = useState("");
  const [aiResumeMissingHints, setAiResumeMissingHints] = useState([]);
  const [aiUpdatePreview, setAiUpdatePreview] = useState(null);
  // 저장 성공 직후 다음 행동 안내 — Supabase 저장 완료 후에만 true.
  const [postSaveVisible, setPostSaveVisible] = useState(false);
  // 방금 저장된 record — CTA 클릭 시 AI 초안 생성의 입력으로 사용.
  const [postSaveDraftSource, setPostSaveDraftSource] = useState(null);
  // 입력 폼의 현재 draft 상태 — PmRecordInput에서 onDraftChange 콜백으로 수신
  const [currentDraft, setCurrentDraft] = useState({ hasContent: false, snapshot: null });
  const [importedResumeDraft, setImportedResumeDraft] = useState(null);
  const [aiImportText, setAiImportText] = useState("");
  const [aiImportError, setAiImportError] = useState("");
  const [aiImportLoading, setAiImportLoading] = useState(false);
  const [pendingAiResumeDraft, setPendingAiResumeDraft] = useState(null);
  const [pendingAiResumeWarnings, setPendingAiResumeWarnings] = useState([]);
  const [isAiImportOpen, setIsAiImportOpen] = useState(false);
  const resumeImportInputRef = useRef(null);
  const aiResumeRequestSeqRef = useRef(0);

  async function fetchWorkRecords() {
    if (!supabase) return;
    try {
      const rows = await listWorkRecords({ limit: 50 });
      setRawDbRows(rows);
      setDbRecords(rows.map(adaptWorkRecordRow));
      setFetchError("");
    } catch (_) {
      setFetchError("저장된 기록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setDbFetchDone(true);
    }
  }

  useEffect(() => {
    if (!supabase) return;
    // Fast path: read cached session from localStorage so currentUser is set before
    // any user interaction. getUser() makes a server round-trip and can arrive
    // after form submission, causing a false "로그인이 필요합니다" message.
    supabase.auth.getSession().then(({ data }) => {
      const user = data?.session?.user ?? null;
      setCurrentUser(user);
      if (user) fetchWorkRecords();
    }).catch(() => {});
    let sub = null;
    try {
      sub = onAuthStateChange((event, session) => {
        const user = session?.user ?? null;
        setCurrentUser(user);
        if (event === "SIGNED_IN" && user) {
          fetchWorkRecords();
        } else if (event === "SIGNED_OUT") {
          setDbRecords([]);
          setDbFetchDone(false);
        }
      });
    } catch (_) {}
    return () => {
      try { sub?.unsubscribe?.(); } catch (_) {}
    };
  }, []);
  useEffect(() => {
    if (!currentUser) {
      setSavedResumeProfileRecord(null);
      setSavedResumeProfileDraft(null);
      setResumeProfileFetchDone(false);
      setResumeProfileError("");
      setIsResumeProfileEditorOpen(false);
      setResumeProfileForm({ profile: { name: "", phone: "", email: "", location: "", portfolioUrl: "" }, education: [] });
      setResumeProfileSaving(false);
      setIsResumeExperienceEditorOpen(false);
      setResumeExperienceForm([]);
      setResumeExperienceError("");
      setResumeExperienceSaving(false);
      setIsResumeSummaryEditorOpen(false);
      setResumeSummaryFormText("");
      setResumeSummaryError("");
      setResumeSummarySaving(false);
      setIsResumeSkillsEditorOpen(false);
      setResumeSkillsFormText("");
      setResumeSkillsError("");
      setResumeSkillsSaving(false);
      return;
    }
    let cancelled = false;
    setSavedResumeProfileRecord(null);
    setSavedResumeProfileDraft(null);
    setResumeProfileForm({ profile: { name: "", phone: "", email: "", location: "", portfolioUrl: "" }, education: [] });
    setIsResumeExperienceEditorOpen(false);
    setResumeExperienceForm([]);
    setResumeExperienceError("");
    setResumeExperienceSaving(false);
    setIsResumeSummaryEditorOpen(false);
    setResumeSummaryFormText("");
    setResumeSummaryError("");
    setResumeSummarySaving(false);
    setIsResumeSkillsEditorOpen(false);
    setResumeSkillsFormText("");
    setResumeSkillsError("");
    setResumeSkillsSaving(false);
    setResumeProfileFetchDone(false);
    setResumeProfileError("");
    getLatestDefaultResumeProfile().then((row) => {
      if (cancelled) return;
      setSavedResumeProfileRecord(row);
      const draft = row?.raw_payload
        ? {
            profile: row.raw_payload.profile ?? null,
            education: row.raw_payload.education ?? [],
            experiences: Array.isArray(row.raw_payload.experiences) ? row.raw_payload.experiences : [],
            summary: Array.isArray(row.raw_payload.summary) ? row.raw_payload.summary : [],
            skills: Array.isArray(row.raw_payload.skills) ? row.raw_payload.skills : [],
          }
        : null;
      setSavedResumeProfileDraft(draft);
      if (draft) {
        setResumeProfileForm({
          profile: {
            name: draft.profile?.name ?? "",
            phone: draft.profile?.phone ?? "",
            email: draft.profile?.email ?? "",
            location: draft.profile?.location ?? "",
            portfolioUrl: draft.profile?.portfolioUrl ?? "",
          },
          education: Array.isArray(draft.education) ? draft.education : [],
        });
      }
    }).catch(() => {
      if (cancelled) return;
      setResumeProfileError("저장된 기본정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }).finally(() => {
      if (!cancelled) setResumeProfileFetchDone(true);
    });
    return () => { cancelled = true; };
  }, [currentUser]);
  const recordPreset = useMemo(
    () => getRecordPresetByJobId(currentJobId || DEFAULT_PM_JOB_ID),
    [currentJobId],
  );

  const isPreviewMode = mode === "preview";
  const visibleScreen =
    !isPreviewMode && currentScreen === "result"
      ? normalizeRecordScreen(sourceTrack)
      : currentScreen;
  const visibleTabs = isPreviewMode
    ? [{ id: "result", label: "이력서 결과" }]
    : [
        { id: "weekly", label: "이번 주 기록" },
        { id: "project", label: "프로젝트 기록" },
      ];

  useEffect(() => {
    const nextEntryView = isPreviewMode
      ? "result"
      : normalizeRecordScreen(entryView);
    setCurrentScreen(nextEntryView);
    setSourceTrack(nextEntryView === "project" ? "project" : "weekly");
    setActionNote("");
  }, [entryView, isPreviewMode]);

  // preview 전용: 외부에서 주입된 lastInput이 바뀌면 내부 상태를 동기화.
  // update 모드에서는 사용자 입력 중인 state를 덮어쓰지 않음.
  useEffect(() => {
    if (mode !== "preview") return;
    if (!externalLastInput) return;
    setLastInput(externalLastInput);
    if (externalLastInput.track === "project" || externalLastInput.track === "weekly") {
      setSourceTrack(externalLastInput.track);
    }
  }, [mode, externalLastInput]);

  // P-4B-1: rawDbRows를 updated_at → created_at → record_date → date 기준 최신순 정렬.
  const sortedRawDbRows = useMemo(() => {
    if (!Array.isArray(rawDbRows) || rawDbRows.length === 0) return [];
    const parseTime = (row) => {
      const d = row?.updated_at || row?.created_at || row?.record_date || row?.date;
      if (!d) return 0;
      const t = Date.parse(String(d));
      return isNaN(t) ? 0 : t;
    };
    return [...rawDbRows].sort((a, b) => parseTime(b) - parseTime(a));
  }, [rawDbRows]);

  const latestStoredRecord = sortedRawDbRows[0] ?? null;

  // P-3 (P-4B-1): preview 모드에서 in-session 입력이 없으면 정렬된 최신 기록으로 복구.
  useEffect(() => {
    if (mode !== "preview") return;
    if (externalLastInput) return;
    if (!currentUser || !dbFetchDone || !latestStoredRecord) return;
    const recovered = normalizeWorkRecordDraftFromStoredRecord(latestStoredRecord);
    if (!recovered.text && !recovered.projectActions && !recovered.projectResult) return;
    setLastInput(recovered);
    if (recovered.track === "project" || recovered.track === "weekly") {
      setSourceTrack(recovered.track);
    }
  }, [mode, externalLastInput, currentUser, dbFetchDone, latestStoredRecord]);

  const result = useMemo(() => buildDemoResult(lastInput, sourceTrack), [lastInput, sourceTrack]);

  // P-4B-1: sortedRawDbRows 전체 → ResumeUpdateCandidate 후보 목록.
  const resumeUpdateCandidates = useMemo(() => {
    if (mode !== "preview") return [];
    if (sortedRawDbRows.length === 0) return [];
    return sortedRawDbRows
      .map((record) => buildResumeUpdateCandidateFromRecord(record))
      .filter(Boolean);
  }, [mode, sortedRawDbRows]);

  // P-4B-2A: 선택된 저장 기록 candidate.
  const selectedStoredResumeCandidate = useMemo(() => {
    if (!selectedResumeRecordId) return null;
    return resumeUpdateCandidates.find(
      (c) => String(c.sourceRecordId || "") === String(selectedResumeRecordId)
    ) ?? null;
  }, [resumeUpdateCandidates, selectedResumeRecordId]);

  // P-4B-2A: 후보 목록이 바뀌어 선택값이 더 이상 유효하지 않으면 초기화.
  useEffect(() => {
    if (!selectedResumeRecordId) return;
    const exists = resumeUpdateCandidates.some(
      (c) => String(c.sourceRecordId || "") === String(selectedResumeRecordId)
    );
    if (!exists) setSelectedResumeRecordId("");
  }, [resumeUpdateCandidates, selectedResumeRecordId]);

  // P-4A (P-4B-1, P-4B-2B): 명시 선택 저장 기록 → in-session 입력 → 최신 기록 순 우선.
  // selectedResumeRecordId !== "" 일 때만 selectedStoredResumeCandidate가 externalLastInput을 이김.
  const latestResumeCandidate = useMemo(() => {
    if (mode !== "preview") return null;
    if (selectedStoredResumeCandidate) return selectedStoredResumeCandidate;
    if (externalLastInput) {
      return buildResumeUpdateCandidateFromRecord({
        raw_payload: externalLastInput,
        description: externalLastInput.text || "",
        result: externalLastInput.projectResult || "",
        work_type: externalLastInput.track || sourceTrack,
      });
    }
    return resumeUpdateCandidates[0] ?? null;
  }, [mode, externalLastInput, selectedStoredResumeCandidate, resumeUpdateCandidates, sourceTrack]);

  // P-AI-2: AI 초안 결과의 source key 정규화 — record 선택 변경 시 이전 결과 숨김.
  // selectedStoredResumeCandidate가 있으면 그것의 id 사용, 아니면 latestResumeCandidate 사용.
  const activeUpdateSourceKey = useMemo(() => {
    if (selectedStoredResumeCandidate?.sourceRecordId) {
      return normalizeResumeAiSourceKey(selectedStoredResumeCandidate.sourceRecordId);
    }
    return normalizeResumeAiSourceKey(
      latestResumeCandidate?.sourceRecordId ||
      latestResumeCandidate?.sourceText ||
      result?.sourceText
    );
  }, [
    selectedStoredResumeCandidate?.sourceRecordId,
    latestResumeCandidate?.sourceRecordId,
    latestResumeCandidate?.sourceText,
    result?.sourceText,
  ]);

  // P-4A.5: low confidence / "기록 기반 초안:" 문장은 경력·성과 섹션에 과승격 방지.
  const candidateConfidence = latestResumeCandidate?.confidenceLevel ?? "none";
  const candidateResumeSentence = String(latestResumeCandidate?.resumeSentence ?? "").trim();
  const isDraftSentence =
    candidateConfidence === "low" ||
    candidateResumeSentence.includes("기록 기반 초안:");
  const safeCandidateResumeSentence = candidateResumeSentence && !isDraftSentence
    ? candidateResumeSentence
    : "";

  const sourcePreview = useMemo(() => {
    const raw = String(
      latestResumeCandidate?.sourceText ||
      result?.sourceText ||
      ""
    ).trim();
    if (!raw) return "";
    if (raw.length <= 180) return raw;
    return `${raw.slice(0, 180).trim()}...`;
  }, [latestResumeCandidate?.sourceText, result?.sourceText]);
  const hasSourcePreview = Boolean(sourcePreview);

  // P-AI-2B: Text-based source key fallback — if id key fails, match by visible source text.
  // 실제 API 요청이 sourceText/workRecord.title 기반이면, 그것과 현재 visible source preview가 일치할 때 bullets 표시.
  const activeUpdateSourceTextKey = useMemo(() => normalizeResumeAiSourceKey(
    sourcePreview ||
    selectedStoredResumeCandidate?.sourceText ||
    latestResumeCandidate?.sourceText ||
    result?.sourceText ||
    selectedStoredResumeCandidate?.resumeSentence ||
    latestResumeCandidate?.resumeSentence
  ), [
    sourcePreview,
    selectedStoredResumeCandidate?.sourceText,
    latestResumeCandidate?.sourceText,
    result?.sourceText,
    selectedStoredResumeCandidate?.resumeSentence,
    latestResumeCandidate?.resumeSentence,
  ]);

  // P-AI-2C: Reset AI preview only when user explicitly changes selected record.
  // Dependencies: explicit user selection only, not latestResumeCandidate refresh.
  useEffect(() => {
    setAiUpdatePreview(null);
    setAiResumeBullets([]);
    setAiResumeRenderBullets([]);
    setAiResumeError("");
    setAiResumeMissingHints([]);
  }, [selectedResumeRecordId]);

  const hasResumeLine = Boolean(String(result?.resumeLine || "").trim());
  const shouldHideDemoResumeFallback = Boolean(currentUser && !latestResumeCandidate);
  const resumeExperienceBullets = useMemo(() => {
    if (shouldHideDemoResumeFallback) return [];
    return buildResumeExperienceBullets(result);
  }, [result, shouldHideDemoResumeFallback]);
  const resumeSkillItems = useMemo(() => {
    if (shouldHideDemoResumeFallback) return [];
    return buildResumeSkillItems(result);
  }, [result, shouldHideDemoResumeFallback]);
  const improvementNotes = useMemo(() => {
    if (shouldHideDemoResumeFallback) return [];
    return buildImprovementNotes(result);
  }, [result, shouldHideDemoResumeFallback]);

  // P-4A.6 (P-5C-1): candidate 있을 때 result.resumeLine 우회 차단. achievementHighlights는 ViewModel에서 처리.
  const displayAchievementText = latestResumeCandidate
    ? "최근 기록은 이력서 초안에 반영되었습니다. 주요 성과로 확정하려면 구체적인 결과 정보가 더 필요합니다."
    : (currentUser ? "" : (hasResumeLine ? result.resumeLine : "최근 기록을 바탕으로 운영 효율과 후속 대응 흐름을 개선한 경험이 대표 성과로 반영될 예정입니다."));

  const recentCalendarRecord = useMemo(
    () => buildCalendarRecordFromPmInput(lastInput, {
      fallbackDate: homeDashboardMock?.today?.date,
    }),
    [lastInput]
  );
  const calendarRecords = useMemo(() => {
    if (currentUser) {
      return dbRecords;
    }
    return [recentCalendarRecord, ...PASSMAP_DEMO_RANGE_RECORDS, ...homeDashboardMock.records].filter(Boolean);
  }, [currentUser, dbRecords, recentCalendarRecord]);
  const realToday = pmTodayStr();
  const realCalendarMonth = buildCalendarMonthViewModel({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    today: realToday,
  });
  const resumeHeadline = pickFirstText(currentCareerRoleLabel, "고객운영 / 품질운영");
  const introParagraph = pickFirstText(
    result?.summary,
    shouldHideDemoResumeFallback
      ? "업무기록이 쌓이면 주요 강점과 경험 요약이 여기에 정리됩니다."
      : result?.strengthDescription,
    "업무기록이 쌓이면 주요 강점과 경험 요약이 여기에 정리됩니다.",
  );
  const introDetail = pickFirstText(
    shouldHideDemoResumeFallback
      ? "업무기록을 저장하면 이력서에 반영할 문장 초안이 여기에 정리됩니다."
      : result?.resumeLine,
    "업무기록을 저장하면 이력서에 반영할 문장 초안이 여기에 정리됩니다.",
  );

  // P-AI-3: AI 성공 응답 전용 preview state — id key 또는 text key 일치 시 표시.
  // ID key가 다르더라도 actual visible source text가 일치하면 bullets 표시 (Failure Type F 해결).
  // P-AI-3: AI 성공 응답 전용 preview state — reset effect가 source 변경 시 초기화.
  // requestSeq로 stale response 걸러냄. Key matching 제거, 유효한 preview 직접 렌더.
  const visibleAiBullets = useMemo(() => {
    if (!Array.isArray(aiUpdatePreview?.bullets)) return [];

    return aiUpdatePreview.bullets
      .map((bullet) => ({
        ...bullet,
        text: String(bullet?.text || "").trim(),
      }))
      .filter((bullet) => bullet.text);
  }, [aiUpdatePreview]);

  // P-AI-DIRECT-RENDER: Display-only state for direct AFTER card rendering.
  // This is the single source of truth for AI success bullets, independent of the preview chain.
  const displayedAiResumeBullets = useMemo(() => {
    const stateBullets = normalizeAiResumeBullets(aiResumeDirectBullets);
    if (stateBullets.length > 0) return stateBullets;
    return readResumeAiDirectBulletsCache();
  }, [aiResumeDirectBullets, aiResumeDirectBulletsTick]);

  const hasDisplayedAiResumeBullets = displayedAiResumeBullets.length > 0;

  // AFTER 카드 렌더 전용: sessionStorage에서 캐시를 다시 읽어서 강제 표시
  const forcedDisplayedAiResumeBullets = normalizeAiResumeBullets(
    displayedAiResumeBullets.length > 0
      ? displayedAiResumeBullets
      : readResumeAiDirectBulletsCache()
  );
  const hasForcedDisplayedAiResumeBullets = forcedDisplayedAiResumeBullets.length > 0;

  const isResumeAiAfterPending =
    !hasForcedDisplayedAiResumeBullets &&
    !aiResumeError &&
    readResumeAiDirectPendingCache();

  // P-5B: ResumeDraftViewModel 연결.
  const aiResumeSentenceFromBullets = aiResumeBullets?.[0]?.text ? String(aiResumeBullets[0].text).trim() : null;
  const resumeDraftViewModel = useMemo(() => buildResumeDraftViewModel({
    result,
    latestResumeCandidate,
    resumeExperienceBullets,
    resumeSkillItems,
    improvementNotes,
    fallbackAchievementText: displayAchievementText,
    aiResumeSentence: aiResumeSentenceFromBullets,
    aiResumeBullets,
    profile: {
      name: "",
      role: resumeHeadline,
      contact: "",
      portfolio: "",
    },
  }), [result, latestResumeCandidate, resumeExperienceBullets, resumeSkillItems, improvementNotes, displayAchievementText, resumeHeadline, aiResumeSentenceFromBullets, aiResumeBullets]);

  const viewModelExperienceBullets = resumeDraftViewModel.experiences?.length
    ? resumeDraftViewModel.experiences
    : resumeExperienceBullets;
  const viewModelAchievementText = resumeDraftViewModel.achievementHighlights?.[0]
    || displayAchievementText;
  const viewModelSkillItems = resumeDraftViewModel.skillTags?.length
    ? resumeDraftViewModel.skillTags
    : resumeSkillItems;
  const viewModelImprovementNotes = resumeDraftViewModel.improvementNotes?.length
    ? resumeDraftViewModel.improvementNotes
    : improvementNotes;
  const hasSavedResumeProfileDraft = Boolean(savedResumeProfileDraft);
  const displayProfile = useMemo(() => {
    const fallback = currentUser
      ? { name: "이름 미입력", phone: "연락처 미입력", email: "이메일 미입력", location: "지역 미입력", portfolioUrl: "" }
      : DEFAULT_RESUME_PROFILE_DISPLAY;
    if (hasSavedResumeProfileDraft) {
      const p = savedResumeProfileDraft.profile ?? {};
      return {
        name: pickFirstText(p.name, fallback.name),
        phone: pickFirstText(p.phone, fallback.phone),
        email: pickFirstText(p.email, fallback.email),
        location: pickFirstText(p.location, fallback.location),
        portfolioUrl: p.portfolioUrl ?? "",
      };
    }
    return {
      name: pickFirstText(importedResumeDraft?.profile?.name, fallback.name),
      phone: pickFirstText(importedResumeDraft?.profile?.phone, fallback.phone),
      email: pickFirstText(importedResumeDraft?.profile?.email, fallback.email),
      location: pickFirstText(importedResumeDraft?.profile?.location, fallback.location),
      portfolioUrl: pickFirstText(importedResumeDraft?.profile?.portfolioUrl, fallback.portfolioUrl),
    };
  }, [hasSavedResumeProfileDraft, savedResumeProfileDraft, importedResumeDraft, currentUser]);
  const draftProfile = useMemo(() => {
    if (hasSavedResumeProfileDraft) {
      const p = savedResumeProfileDraft.profile ?? {};
      return { name: p.name ?? "", phone: p.phone ?? "", email: p.email ?? "", location: p.location ?? "", portfolioUrl: p.portfolioUrl ?? "" };
    }
    return {
      name: pickFirstText(importedResumeDraft?.profile?.name),
      phone: pickFirstText(importedResumeDraft?.profile?.phone),
      email: pickFirstText(importedResumeDraft?.profile?.email),
      location: pickFirstText(importedResumeDraft?.profile?.location),
      portfolioUrl: pickFirstText(importedResumeDraft?.profile?.portfolioUrl),
    };
  }, [hasSavedResumeProfileDraft, savedResumeProfileDraft, importedResumeDraft]);
  const displayTarget = useMemo(() => ({
    job: pickFirstText(importedResumeDraft?.target?.job, resumeHeadline),
    industry: pickFirstText(importedResumeDraft?.target?.industry),
  }), [importedResumeDraft, resumeHeadline]);
  const hasSavedResumeSummaryDraft = Boolean(
    savedResumeProfileRecord?.raw_payload &&
    Object.prototype.hasOwnProperty.call(savedResumeProfileRecord.raw_payload, "summary")
  );
  const displaySummaryParagraphs = useMemo(() => {
    if (hasSavedResumeSummaryDraft) return savedResumeProfileDraft?.summary ?? [];
    if (importedResumeDraft?.summary?.length) return importedResumeDraft.summary;
    return [introParagraph, introDetail].filter(Boolean);
  }, [hasSavedResumeSummaryDraft, savedResumeProfileRecord, savedResumeProfileDraft, importedResumeDraft, introParagraph, introDetail]);
  const draftSummary = useMemo(() => {
    if (hasSavedResumeSummaryDraft) return savedResumeProfileDraft?.summary ?? [];
    if (importedResumeDraft?.summary?.length) return importedResumeDraft.summary;
    return [introParagraph, introDetail].filter(Boolean);
  }, [hasSavedResumeSummaryDraft, savedResumeProfileRecord, savedResumeProfileDraft, importedResumeDraft, introParagraph, introDetail]);
  const hasSavedResumeExperienceDraft = Boolean(
    savedResumeProfileRecord?.raw_payload &&
    Object.prototype.hasOwnProperty.call(savedResumeProfileRecord.raw_payload, "experiences")
  );
  const displayExperiences = useMemo(() => {
    if (hasSavedResumeExperienceDraft) return savedResumeProfileDraft.experiences ?? [];
    if (importedResumeDraft?.experiences?.length) return importedResumeDraft.experiences;
    return [{
      ...DEFAULT_RESUME_EXPERIENCE_DISPLAY,
      role: displayTarget.job || DEFAULT_RESUME_EXPERIENCE_DISPLAY.role,
      bullets: viewModelExperienceBullets,
    }];
  }, [hasSavedResumeExperienceDraft, savedResumeProfileRecord, savedResumeProfileDraft, importedResumeDraft, displayTarget.job, viewModelExperienceBullets]);
  const shouldShowResumeEmptyGuide = Boolean(
    currentUser && !latestResumeCandidate && !hasSavedResumeExperienceDraft && displayExperiences?.[0]?.bullets?.length === 0
  );
  const draftExperiences = useMemo(() => {
    if (hasSavedResumeExperienceDraft) return savedResumeProfileDraft.experiences ?? [];
    if (importedResumeDraft?.experiences?.length) return importedResumeDraft.experiences;
    if (!viewModelExperienceBullets.length) return [];
    return [{
      company: "",
      role: displayTarget.job,
      startDate: "",
      endDate: "",
      description: "",
      bullets: viewModelExperienceBullets,
    }];
  }, [hasSavedResumeExperienceDraft, savedResumeProfileRecord, savedResumeProfileDraft, importedResumeDraft, displayTarget.job, viewModelExperienceBullets]);
  const displayEducation = useMemo(() => {
    if (hasSavedResumeProfileDraft) return savedResumeProfileDraft.education ?? [];
    if (importedResumeDraft?.education?.length) return importedResumeDraft.education;
    if (currentUser) return [];
    return DEFAULT_RESUME_EDUCATION_DISPLAY;
  }, [hasSavedResumeProfileDraft, savedResumeProfileDraft, importedResumeDraft, currentUser]);
  const draftEducation = useMemo(() => {
    if (hasSavedResumeProfileDraft) return savedResumeProfileDraft.education ?? [];
    if (importedResumeDraft?.education?.length) return importedResumeDraft.education;
    return [];
  }, [hasSavedResumeProfileDraft, savedResumeProfileDraft, importedResumeDraft]);
  const hasSavedResumeSkillsDraft = Boolean(
    savedResumeProfileRecord?.raw_payload &&
    Object.prototype.hasOwnProperty.call(savedResumeProfileRecord.raw_payload, "skills")
  );
  const displaySkillItems = useMemo(() => {
    if (hasSavedResumeSkillsDraft) return savedResumeProfileDraft?.skills ?? [];
    if (importedResumeDraft?.skills?.length) return importedResumeDraft.skills;
    return viewModelSkillItems;
  }, [hasSavedResumeSkillsDraft, savedResumeProfileRecord, savedResumeProfileDraft, importedResumeDraft, viewModelSkillItems]);
  const draftSkills = useMemo(() => {
    if (hasSavedResumeSkillsDraft) return savedResumeProfileDraft?.skills ?? [];
    if (importedResumeDraft?.skills?.length) return importedResumeDraft.skills;
    return viewModelSkillItems;
  }, [hasSavedResumeSkillsDraft, savedResumeProfileRecord, savedResumeProfileDraft, importedResumeDraft, viewModelSkillItems]);
  const currentResumeDraft = useMemo(() => buildPassmapResumeDraft({
    profile: draftProfile,
    target: displayTarget,
    summary: draftSummary,
    experiences: draftExperiences,
    education: draftEducation,
    skills: draftSkills,
    sourceTrack: { track: sourceTrack },
    lastInput,
  }), [
    draftProfile,
    displayTarget,
    draftSummary,
    draftExperiences,
    draftEducation,
    draftSkills,
    sourceTrack,
    lastInput,
  ]);
  const pendingAiPreviewSummary = Array.isArray(pendingAiResumeDraft?.summary)
    ? pendingAiResumeDraft.summary
    : [];
  const pendingAiPreviewExperiences = Array.isArray(pendingAiResumeDraft?.experiences)
    ? pendingAiResumeDraft.experiences
    : [];
  const pendingAiPreviewSkills = Array.isArray(pendingAiResumeDraft?.skills)
    ? pendingAiResumeDraft.skills
    : [];
  const pendingAiPreviewUnknowns = Array.isArray(pendingAiResumeDraft?.unknowns)
    ? pendingAiResumeDraft.unknowns
    : [];

  // P-4B-2C: select UI 노출 조건.
  // externalLastInput만 있고 저장 후보가 없으면 전환 가능한 선택지가 없으므로 숨김.
  const shouldShowResumeRecordSelector =
    isPreviewMode &&
    (
      (externalLastInput && resumeUpdateCandidates.length >= 1) ||
      (!externalLastInput && resumeUpdateCandidates.length >= 2)
    );

  // P-6-3A: 사용자 직접 수정 문장 파생.
  const editableBaseResumeSentence =
    latestResumeCandidate?.resumeSentence ||
    resumeDraftViewModel?.updatePreview?.afterSentence ||
    "";
  const effectiveEditedResumeSentence = editedResumeSentence.trim();
  const hasUserEditedResumeSentence =
    isEditingResumeSentence &&
    effectiveEditedResumeSentence.length > 0 &&
    effectiveEditedResumeSentence !== resumeSentenceInitialFillRef.current;

  // P-6-2A: stored candidate일 때만 저장 버튼 노출. externalLastInput 전용 후보는 숨김.
  const shouldShowSaveCandidateButton =
    isPreviewMode &&
    Boolean(latestResumeCandidate?.sourceRecordId) &&
    Boolean(latestResumeCandidate?.sourceRecord);
  // P-AI-1: AI 생성 가능 여부.
  // preview mode: sourceRecord 있어야 Worker 호출 가능.
  // update mode: 입력값 또는 저장된 기록 있으면 버튼 활성화.
  //   로그인 상태는 클릭 시점에 검증하므로 버튼 활성화 조건에서 제외.
  const hasAiDraftSource = isPreviewMode
    ? Boolean(latestResumeCandidate?.sourceRecordId && latestResumeCandidate?.sourceRecord)
    : Boolean(dbRecords.length > 0 || currentDraft.hasContent);

  const canGenerateAiResumeDraft = hasAiDraftSource && !aiResumeLoading;
  const isResumeAiAfterCardLoading = aiResumeAfterCardStatus === "loading";

  // 현재 입력 폼에 내용이 있는 경우 저장 후 AI 생성 필요 (기존 저장 기록 상관없음)
  const aiNeedsSaveFirst = !isPreviewMode && currentDraft.hasContent;

  // P-6-3A: user_edited 경로 — 사용자가 직접 입력한 문장이 있으면 draft 여부 무관하게 저장 가능.
  const canSaveUserEditedResumeCandidate =
    isPreviewMode &&
    Boolean(currentUser) &&
    Boolean(latestResumeCandidate?.sourceRecordId) &&
    Boolean(latestResumeCandidate?.sourceRecord) &&
    hasUserEditedResumeSentence &&
    candidateSaveStatus !== "saving";

  const canSaveResumeCandidate =
    (isPreviewMode &&
      Boolean(currentUser) &&
      Boolean(latestResumeCandidate?.sourceRecordId) &&
      Boolean(latestResumeCandidate?.sourceRecord) &&
      Boolean(safeCandidateResumeSentence) &&
      !isDraftSentence &&
      candidateSaveStatus !== "saving") ||
    canSaveUserEditedResumeCandidate;

  // P-6-2B: candidate가 바뀌면 stale 저장 상태를 감지하기 위한 복합 키.
  const currentResumeCandidateKey = [
    latestResumeCandidate?.sourceRecordId || "",
    latestResumeCandidate?.resumeSentence || "",
    selectedResumeRecordId || "",
  ].join("|");

  // P-6-2B / P-6-3A / P-6-3C: candidate 또는 선택 기록이 바뀌면 저장 상태·편집 상태를 초기화.
  // saving 중에는 저장 상태를 reset하지 않음.
  // justCompletedSaveRef: 저장 직후 fetchWorkRecords가 candidate 키를 갱신하는 경우 saved 상태를 보존.
  useEffect(() => {
    if (justCompletedSaveRef.current) {
      justCompletedSaveRef.current = false;
      setEditedResumeSentence("");
      setIsEditingResumeSentence(false);
      resumeSentenceInitialFillRef.current = "";
      return;
    }
    setCandidateSaveStatus((prev) => (prev === "saving" ? prev : "idle"));
    setEditedResumeSentence("");
    setIsEditingResumeSentence(false);
    resumeSentenceInitialFillRef.current = "";
  }, [currentResumeCandidateKey]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleRecordSubmit(input) {
    const nextTrack = input?.track === "project" ? "project" : "weekly";
    const normalizedInput = { ...input, track: nextTrack };
    setLastInput(normalizedInput);
    setSourceTrack(nextTrack);
    setLastSavedRecordSummary(null);
    setPostSaveVisible(false);
    setPostSaveDraftSource(null);
    if (typeof onRecordSubmit === "function") {
      onRecordSubmit(normalizedInput);
    }
    // Fire-and-forget: persist to Supabase if user is logged in.
    // Errors are swallowed so local/demo flow is never broken.
    _persistWorkRecord(input).catch(() => {});
    if (!isPreviewMode) {
      setCurrentScreen(nextTrack);
      if (!currentUser) {
        setActionNote("화면에 반영되었습니다. 기록을 저장하려면 로그인이 필요합니다.");
        return;
      }
      setActionNote("\uAE30\uB85D\uC774 \uC815\uB9AC\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC774\uB825\uC11C \uBCF4\uAE30\uC5D0\uC11C \uBC18\uC601 \uB0B4\uC6A9\uC744 \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.");
      return;
    }
    setCurrentScreen("result");
    setActionNote("\uAE30\uB85D\uD55C \uB0B4\uC6A9\uC744 \uAE30\uC900\uC73C\uB85C \uD574\uC11D \uACB0\uACFC\uB97C \uC5F0\uACB0\uD588\uC2B5\uB2C8\uB2E4.");
  }


  async function _persistWorkRecord(input) {
    if (!supabase) return;
    // Use the already-resolved currentUser (from getSession cache) instead of
    // getUser() to avoid a server round-trip that may return null when the cached
    // session is valid — which would silently drop the save and keep dbRecords empty.
    const user = currentUser;
    if (!user) return;
    const today = pmTodayStr();
    const rawText = typeof input.text === "string" ? input.text : "";
    const chipSummary = [
      ...(Array.isArray(input.roleTags) ? input.roleTags : []),
      ...(Array.isArray(input.resultTags) ? input.resultTags : []),
    ].slice(0, 3).join(", ");
    const title = (input.projectName || rawText.split("\n")[0] || chipSummary).slice(0, 200) || "업무 기록";
    const recordDate = input.startDate || today;
    const workType = input.track === "project" ? "project" : "weekly";
    try {
      const savedRecord = await createWorkRecord({
        user_id: user.id,
        record_date: recordDate,
        title,
        description: rawText || null,
        task: input.projectActions || null,
        result: input.projectResult || null,
        project_name: input.projectName || null,
        strength_tags: Array.isArray(input.roleTags) ? input.roleTags : [],
        skill_tags: Array.isArray(input.collaborationTags) ? input.collaborationTags : [],
        work_type: workType,
        source: "manual",
        raw_payload: input,
      });
      if (workType === "weekly") {
        const adaptedSavedRecord = adaptWorkRecordRow(savedRecord);
        if (adaptedSavedRecord?.id) {
          setDbRecords((current) => [
            adaptedSavedRecord,
            ...current.filter((record) => String(record.id || "") !== String(adaptedSavedRecord.id || "")),
          ]);
          const nextCalendarDate = adaptedSavedRecord.date || savedRecord?.record_date || "";
          if (nextCalendarDate) setCalendarSelectedDate(nextCalendarDate);
        }
      }
      try {
        const savedSummary = buildLastSavedRecordSummary(savedRecord);
        if (savedSummary) {
          setLastSavedRecordSummary(savedSummary);
        }
      } catch (_) {
        setLastSavedRecordSummary(null);
      }
      void syncWorkRecordToGoogleCalendar(savedRecord?.id);
      fetchWorkRecords();
      setPostSaveDraftSource(savedRecord);
      setPostSaveVisible(true);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(PASSMAP_WORK_RECORDS_CHANGED_EVENT, {
          detail: { source: "PmMvpView", reason: "work-record-created" },
        }));
      }
      return savedRecord;
    } catch (_) {
      setActionNote("업무기록 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  function handleOpenResumeProfileEditor() {
    const base = savedResumeProfileDraft ?? (importedResumeDraft ? {
      profile: importedResumeDraft.profile ?? {},
      education: importedResumeDraft.education ?? [],
    } : null);
    setResumeProfileForm({
      profile: {
        name: base?.profile?.name ?? "",
        phone: base?.profile?.phone ?? "",
        email: base?.profile?.email ?? "",
        location: base?.profile?.location ?? "",
        portfolioUrl: base?.profile?.portfolioUrl ?? "",
      },
      education: Array.isArray(base?.education) ? base.education : [],
    });
    setResumeProfileError("");
    setIsResumeProfileEditorOpen(true);
  }

  function handleCancelResumeProfileEditor() {
    setIsResumeProfileEditorOpen(false);
    setResumeProfileError("");
  }

  function handleResumeProfileFieldChange(field, value) {
    setResumeProfileForm((prev) => ({ ...prev, profile: { ...prev.profile, [field]: value } }));
  }

  function handleEducationFieldChange(index, field, value) {
    setResumeProfileForm((prev) => {
      const next = [...prev.education];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, education: next };
    });
  }

  function handleAddEducationRow() {
    setResumeProfileForm((prev) => ({
      ...prev,
      education: [...prev.education, { school: "", major: "", startDate: "", endDate: "", description: "" }],
    }));
  }

  function handleRemoveEducationRow(index) {
    setResumeProfileForm((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  }

  async function handleSaveResumeProfile() {
    if (!currentUser?.id) return;
    setResumeProfileSaving(true);
    setResumeProfileError("");
    try {
      const saved = await saveDefaultResumeProfile({
        existingRecord: savedResumeProfileRecord,
        userId: currentUser.id,
        profile: resumeProfileForm.profile,
        education: resumeProfileForm.education,
      });
      setSavedResumeProfileRecord(saved);
      setSavedResumeProfileDraft({
        profile: saved.raw_payload?.profile ?? null,
        education: saved.raw_payload?.education ?? [],
        experiences: Array.isArray(saved.raw_payload?.experiences) ? saved.raw_payload.experiences : [],
        summary: Array.isArray(saved.raw_payload?.summary) ? saved.raw_payload.summary : [],
        skills: Array.isArray(saved.raw_payload?.skills) ? saved.raw_payload.skills : [],
      });
      setIsResumeProfileEditorOpen(false);
      setActionNote("기본정보를 저장했습니다.");
    } catch (_) {
      setResumeProfileError("기본정보 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setResumeProfileSaving(false);
    }
  }

  function handleOpenResumeExperienceEditor() {
    const base = hasSavedResumeExperienceDraft
      ? savedResumeProfileDraft.experiences ?? []
      : importedResumeDraft?.experiences ?? [];
    setResumeExperienceForm(base.map((exp) => ({
      company: exp.company ?? "",
      role: exp.role ?? "",
      startDate: exp.startDate ?? "",
      endDate: exp.endDate ?? "",
      description: exp.description ?? "",
      bullets: Array.isArray(exp.bullets) ? exp.bullets.map((b) => String(b || "")) : [],
    })));
    setResumeExperienceError("");
    setIsResumeExperienceEditorOpen(true);
  }

  function handleCancelResumeExperienceEditor() {
    setIsResumeExperienceEditorOpen(false);
    setResumeExperienceError("");
  }

  function handleAddExperienceRow() {
    setResumeExperienceForm((prev) => [
      ...prev,
      { company: "", role: "", startDate: "", endDate: "", description: "", bullets: [] },
    ]);
  }

  function handleRemoveExperienceRow(index) {
    setResumeExperienceForm((prev) => prev.filter((_, i) => i !== index));
  }

  function handleExperienceFieldChange(index, field, value) {
    setResumeExperienceForm((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function handleAddBulletToExperience(expIdx) {
    setResumeExperienceForm((prev) => {
      const next = [...prev];
      next[expIdx] = { ...next[expIdx], bullets: [...next[expIdx].bullets, ""] };
      return next;
    });
  }

  function handleRemoveBulletFromExperience(expIdx, bulletIdx) {
    setResumeExperienceForm((prev) => {
      const next = [...prev];
      next[expIdx] = { ...next[expIdx], bullets: next[expIdx].bullets.filter((_, i) => i !== bulletIdx) };
      return next;
    });
  }

  function handleExperienceBulletChange(expIdx, bulletIdx, value) {
    setResumeExperienceForm((prev) => {
      const next = [...prev];
      const bullets = [...next[expIdx].bullets];
      bullets[bulletIdx] = value;
      next[expIdx] = { ...next[expIdx], bullets };
      return next;
    });
  }

  async function handleSaveResumeExperiences() {
    if (!currentUser?.id) return;
    setResumeExperienceSaving(true);
    setResumeExperienceError("");
    try {
      const saved = await saveDefaultResumeExperiences({
        existingRecord: savedResumeProfileRecord,
        userId: currentUser.id,
        experiences: resumeExperienceForm,
      });
      setSavedResumeProfileRecord(saved);
      setSavedResumeProfileDraft({
        profile: saved.raw_payload?.profile ?? null,
        education: saved.raw_payload?.education ?? [],
        experiences: Array.isArray(saved.raw_payload?.experiences) ? saved.raw_payload.experiences : [],
        summary: Array.isArray(saved.raw_payload?.summary) ? saved.raw_payload.summary : [],
        skills: Array.isArray(saved.raw_payload?.skills) ? saved.raw_payload.skills : [],
      });
      setIsResumeExperienceEditorOpen(false);
      setActionNote("경력 정보를 저장했습니다.");
    } catch (_) {
      setResumeExperienceError("경력 정보 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setResumeExperienceSaving(false);
    }
  }

  function handleOpenResumeSummaryEditor() {
    setResumeSummaryFormText(draftSummary.join("\n\n"));
    setResumeSummaryError("");
    setIsResumeSummaryEditorOpen(true);
  }

  function handleCancelResumeSummaryEditor() {
    setIsResumeSummaryEditorOpen(false);
    setResumeSummaryError("");
  }

  async function handleSaveResumeSummary() {
    if (!currentUser?.id) return;
    setResumeSummarySaving(true);
    setResumeSummaryError("");
    try {
      const saved = await saveDefaultResumeSummary({
        existingRecord: savedResumeProfileRecord,
        userId: currentUser.id,
        summary: resumeSummaryFormText,
      });
      setSavedResumeProfileRecord(saved);
      setSavedResumeProfileDraft({
        profile: saved.raw_payload?.profile ?? null,
        education: saved.raw_payload?.education ?? [],
        experiences: Array.isArray(saved.raw_payload?.experiences) ? saved.raw_payload.experiences : [],
        summary: Array.isArray(saved.raw_payload?.summary) ? saved.raw_payload.summary : [],
        skills: Array.isArray(saved.raw_payload?.skills) ? saved.raw_payload.skills : [],
      });
      setIsResumeSummaryEditorOpen(false);
      setActionNote("소개 문단을 저장했습니다.");
    } catch (_) {
      setResumeSummaryError("소개 문단 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setResumeSummarySaving(false);
    }
  }

  function handleOpenResumeSkillsEditor() {
    setResumeSkillsFormText(draftSkills.join("\n"));
    setResumeSkillsError("");
    setIsResumeSkillsEditorOpen(true);
  }

  function handleCancelResumeSkillsEditor() {
    setIsResumeSkillsEditorOpen(false);
    setResumeSkillsError("");
  }

  async function handleSaveResumeSkills() {
    if (!currentUser?.id) return;
    setResumeSkillsSaving(true);
    setResumeSkillsError("");
    try {
      const saved = await saveDefaultResumeSkills({
        existingRecord: savedResumeProfileRecord,
        userId: currentUser.id,
        skills: resumeSkillsFormText,
      });
      setSavedResumeProfileRecord(saved);
      setSavedResumeProfileDraft({
        profile: saved.raw_payload?.profile ?? null,
        education: saved.raw_payload?.education ?? [],
        experiences: Array.isArray(saved.raw_payload?.experiences) ? saved.raw_payload.experiences : [],
        summary: Array.isArray(saved.raw_payload?.summary) ? saved.raw_payload.summary : [],
        skills: Array.isArray(saved.raw_payload?.skills) ? saved.raw_payload.skills : [],
      });
      setIsResumeSkillsEditorOpen(false);
      setActionNote("보유 역량을 저장했습니다.");
    } catch (_) {
      setResumeSkillsError("보유 역량 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setResumeSkillsSaving(false);
    }
  }

  const handleDeleteWorkRecord = async (record) => {
    if (!currentUser) return;
    const recordId = record?.id;
    if (!recordId) return;
    const confirmed = window.confirm("이 기록을 삭제할까요?\n삭제한 기록은 되돌릴 수 없습니다.\nGoogle Calendar에 추가된 일정도 함께 삭제를 시도합니다.\n단, Calendar 삭제에 실패하면 일정이 남을 수 있습니다.");
    if (!confirmed) return;
    try {
      await deleteGoogleCalendarEventForWorkRecord(recordId);
      await deleteWorkRecord(recordId);
      await fetchWorkRecords();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(PASSMAP_WORK_RECORDS_CHANGED_EVENT, {
          detail: { source: "PmMvpView", reason: "work-record-deleted" },
        }));
      }
      setActionNote("기록을 삭제했습니다.");
    } catch (_) {
      setActionNote("기록을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  function handleGoogleLoginFromRecord() {
    try {
      sessionStorage.setItem("passmap:authReturn", JSON.stringify({
        source: "pm_mvp_view",
        track: visibleScreen === "project" ? "project" : "weekly",
        createdAt: Date.now(),
      }));
    } catch (_) {}
    signInWithGoogle().catch(() => {});
  }

  function handleKakaoLoginFromRecord() {
    try {
      sessionStorage.setItem("passmap:authReturn", JSON.stringify({
        source: "pm_mvp_view",
        track: visibleScreen === "project" ? "project" : "weekly",
        createdAt: Date.now(),
      }));
    } catch (_) {}
    signInWithKakao().catch(() => {
      setActionNote("로그인 연결을 시작하지 못했습니다. 설정을 확인해 주세요.");
    });
  }

  // P-AI-1: AI 이력서 문장 초안 생성. 버튼 클릭 시에만 호출.
  // 자동 저장 없음 — 사용자가 bullet 선택·수정 후 기존 handleSaveResumeCandidate로 저장.
  async function handleAiResumeGenerate(sourceRecordOverride = null) {
    if (aiResumeLoading) return;
    const base = (
      import.meta.env.VITE_RESUME_GENERATE_URL ||
      import.meta.env.VITE_AI_PROXY_URL ||
      "https://reject-analyzer.vercel.app"
    ).toString().trim();
    if (!base) {
      setAiResumeError("AI 이력서 초안 생성 URL이 설정되지 않았습니다.");
      return;
    }
    const sourceRecord = sourceRecordOverride ?? latestResumeCandidate?.sourceRecord ?? null;
    if (!sourceRecord) {
      setAiResumeError("기록이 없습니다. 저장된 기록을 먼저 선택해 주세요.");
      return;
    }
    const draft = normalizeWorkRecordDraftFromStoredRecord(sourceRecord);
    const sourceText = draft.text || sourceRecord.description || "";
    const projectResult = draft.projectResult || sourceRecord.result || "";
    if (!sourceText && !draft.projectActions && !projectResult) {
      setAiResumeError("기록 내용이 비어 있습니다. 내용이 있는 기록을 선택해 주세요.");
      return;
    }
    const requestSeq = aiResumeRequestSeqRef.current + 1;
    aiResumeRequestSeqRef.current = requestSeq;
    clearResumeAiDirectBulletsCache();
    writeResumeAiDirectPendingCache();
    setAiResumeAfterCardStatus("loading");
    setAiResumeLoading(true);
    setAiResumeError("");
    setAiResumeBullets([]);
    setAiResumeDirectBullets([]);
    setAiResumeDirectBulletsTick((value) => value + 1);
    setAiResumeMissingHints([]);
    let resp;
    let data;

    try {
      resp = await fetch(base.replace(/\/$/, "") + "/api/resume-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workRecord: {
            title: String(sourceRecord.title || "").slice(0, 200),
            sourceText: String(sourceText).slice(0, 1000),
            projectActions: draft.projectActions ? [String(draft.projectActions).slice(0, 500)] : [],
            projectResult: String(projectResult).slice(0, 500),
            role: Array.isArray(sourceRecord.strength_tags) ? sourceRecord.strength_tags.join(", ") : "",
            tools: Array.isArray(sourceRecord.skill_tags) ? sourceRecord.skill_tags.slice(0, 10) : [],
            targetJob: currentCareerRoleLabel || "",
          },
          targetJob: currentCareerRoleLabel || "",
          tone: "default",
        }),
      });
      data = await resp.json().catch(() => null);
      if (!resp.ok || !data?.ok) {
        const errorCode = data?.error?.code;
        const errorMsg = typeof data?.error === "object" ? (data.error?.message || JSON.stringify(data.error)) : (data?.error || "");

        let displayMsg = errorMsg || "AI 호출에 실패했습니다. 잠시 후 다시 시도해 주세요.";
        if (errorCode === "MODEL_REGION_UNAVAILABLE") {
          displayMsg = "AI 초안 생성이 일시적으로 실패했습니다. 아래에는 기록 기반 임시 초안을 표시합니다.";
        }

        setAiResumeError(displayMsg);
        setAiResumeAfterCardStatus("error");
        clearResumeAiDirectPendingCache();
        return;
      }
      // Extract bullets: check both top-level and nested data.data structure
      let bullets = Array.isArray(data.bullets) ? data.bullets : [];
      if (bullets.length === 0 && data.data && Array.isArray(data.data.bullets)) {
        bullets = data.data.bullets;
      }

      // Normalize bullets: map to { text, ... } and filter empty
      const normalizedBullets = normalizeAiResumeBullets(bullets);

      if (normalizedBullets.length === 0) {
        setAiResumeError("AI가 문장을 생성하지 못했습니다. 기록 내용을 보완한 후 다시 시도해 주세요.");
        setAiResumeAfterCardStatus("error");
        clearResumeAiDirectPendingCache();
        return;
      }
      // Ignore stale response if source changed during request
      if (requestSeq !== aiResumeRequestSeqRef.current) {
        clearResumeAiDirectPendingCache();
        return;
      }
      // Success: set render bullets directly and update legacy states
      const nextDirectBullets = writeResumeAiDirectBulletsCache(normalizedBullets);
      setAiResumeDirectBullets(nextDirectBullets);
      setAiResumeDirectBulletsTick((value) => value + 1);
      setAiResumeBullets(normalizedBullets);
      setAiResumeAfterCardStatus("success");
      const nextSourceKey = normalizeResumeAiSourceKey(
        sourceRecord?.id ||
        sourceRecord?.sourceRecordId ||
        sourceText ||
        sourceRecord?.title
      );
      const nextSourceTextKey = normalizeResumeAiSourceKey(
        sourceRecord?.title ||
        sourceText ||
        sourcePreview ||
        result?.sourceText
      );
      setAiUpdatePreview({
        sourceKey: nextSourceKey,
        sourceTextKey: nextSourceTextKey,
        bullets: normalizedBullets,
        createdAt: Date.now(),
      });
      setAiResumeError("");
      setAiResumeMissingHints(Array.isArray(data.missingInfoHints) ? data.missingInfoHints : []);
      clearResumeAiDirectPendingCache();
    } catch (_) {
      setAiResumeError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      setAiResumeAfterCardStatus("error");
      clearResumeAiDirectPendingCache();
    } finally {
      setAiResumeLoading(false);
    }
  }

  async function handleAiResumeGenerateWithSave() {
    if (aiResumeLoading) return;
    if (!currentDraft.snapshot) {
      setAiResumeError("업무 내용을 입력해 주세요.");
      return;
    }
    if (!currentUser) {
      setAiResumeError("AI 이력서 초안 생성을 위해 로그인이 필요합니다.");
      return;
    }
    try {
      const savedRecord = await _persistWorkRecord(currentDraft.snapshot);
      if (!savedRecord) {
        setAiResumeError("기록 저장에 실패했습니다. 다시 시도해 주세요.");
        return;
      }
      // 저장 성공 후 화면 전환 및 AI 생성
      onOpenResumeView?.();
      void handleAiResumeGenerate(savedRecord);
    } catch (_) {
      setAiResumeError("기록 저장 중 오류가 발생했습니다.");
    }
  }

  async function handleSaveResumeCandidate() {
    if (!canSaveResumeCandidate) return;

    const recordId = latestResumeCandidate.sourceRecordId;
    const existingRawPayload =
      latestResumeCandidate.sourceRecord?.raw_payload ||
      latestResumeCandidate.workRecordDraft ||
      {};

    const saveSentence = hasUserEditedResumeSentence
      ? effectiveEditedResumeSentence
      : safeCandidateResumeSentence;

    const saveCandidate = hasUserEditedResumeSentence
      ? {
          ...latestResumeCandidate,
          resumeSentence: saveSentence,
          generationMethod: "user_edited",
          candidateStatus: "user_edited",
          confidenceLevel: "medium",
        }
      : {
          ...latestResumeCandidate,
          resumeSentence: saveSentence,
          generationMethod: latestResumeCandidate.generationMethod || "deterministic",
          candidateStatus: latestResumeCandidate.candidateStatus || "draft",
          confidenceLevel: latestResumeCandidate.confidenceLevel || "medium",
        };

    setCandidateSaveStatus("saving");
    try {
      await updateWorkRecordWithCandidate(recordId, existingRawPayload, saveCandidate);
      void updateGoogleCalendarEventForWorkRecord(recordId);
      // refetch 전에 flag 세팅 — useEffect가 키 변경을 저장 성공으로 인식해 saved 상태를 보존.
      justCompletedSaveRef.current = true;
      // refetch 실패는 저장 성공을 취소하지 않음.
      try { await fetchWorkRecords(); } catch (_) { justCompletedSaveRef.current = false; }
      setCandidateSaveStatus("saved");
      setActionNote(
        hasUserEditedResumeSentence
          ? "수정한 이력서 문장이 저장되었습니다."
          : "이력서 초안이 저장되었습니다."
      );
    } catch (_) {
      setCandidateSaveStatus("error");
      setActionNote("이력서 초안 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  function handleOpenResumeImportPicker() {
    const input = resumeImportInputRef.current;
    setActionNote("");
    if (!input) {
      setActionNote("이력서 가져오기 입력 요소를 찾지 못했습니다. 새로고침 후 다시 시도해 주세요.");
      return;
    }
    input.value = "";
    input.click();
  }

  function handleExportResume() {
    try {
      const filename = buildResumeDraftDownloadName("json");
      const content = JSON.stringify(currentResumeDraft, null, 2);
      downloadTextFile(filename, content, "application/json;charset=utf-8");
      setActionNote("이력서 초안 JSON을 내보냈습니다. 연락처 등 개인정보가 포함될 수 있으니 파일 공유 전에 확인해 주세요.");
    } catch (_) {
      setActionNote("이력서 초안 JSON 내보내기에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  function handleDownloadResume() {
    try {
      const filename = buildResumeDraftDownloadName("md");
      const content = buildPassmapResumeMarkdown(currentResumeDraft);
      downloadTextFile(filename, content, "text/markdown;charset=utf-8");
      setActionNote("이력서 초안을 Markdown 파일로 다운로드했습니다. 연락처 등 개인정보가 포함될 수 있으니 파일 공유 전에 확인해 주세요.");
    } catch (_) {
      setActionNote("이력서 초안 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  async function handleResumeDraftImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const jsonText = await file.text();
      const parsed = parsePassmapResumeDraftJson(jsonText);
      if (!parsed.ok || !parsed.draft) {
        setActionNote("PASSMAP에서 내보낸 이력서 JSON 파일인지 확인해 주세요.");
        return;
      }
      const importedDraft = parsed.draft;
      const nextTrack = resolveResumeDraftTrack(importedDraft);
      setImportedResumeDraft(importedDraft);
      if (nextTrack === "weekly" || nextTrack === "project") {
        setSourceTrack(nextTrack);
      }
      if (hasObjectValues(importedDraft.lastInput)) {
        setLastInput(importedDraft.lastInput);
      }
      setSelectedResumeRecordId("");
      setEditedResumeSentence("");
      setIsEditingResumeSentence(false);
      setCandidateSaveStatus("idle");
      setAiResumeBullets([]);
      setAiResumeError("");
      setAiResumeMissingHints([]);
      setActionNote("이력서 초안을 가져와 화면에 반영했습니다.");
    } catch (_) {
      setActionNote("PASSMAP에서 내보낸 이력서 JSON 파일인지 확인해 주세요.");
    } finally {
      event.target.value = "";
    }
  }

  function handleAnalyzeAiResumeImport() {
    // coming-soon guard: AI resume import analysis not yet connected
    setAiImportError("기존 이력서 붙여넣기 분석은 준비 중입니다. 업무기록 기반 AI 이력서 초안 생성을 먼저 이용해 주세요.");
  }

  function handleApplyPendingAiResumeDraft() {
    if (!pendingAiResumeDraft) {
      setAiImportError("먼저 이력서 내용을 분석해 미리보기를 생성해 주세요.");
      return;
    }

    setImportedResumeDraft(pendingAiResumeDraft);
    setAiImportError("");
    setActionNote("AI 이력서 가져오기 미리보기를 화면에 반영했습니다.");
  }

  function handleResetAiResumeImport() {
    setAiImportText("");
    setAiImportError("");
    setAiImportLoading(false);
    setPendingAiResumeDraft(null);
    setPendingAiResumeWarnings([]);
    setIsAiImportOpen(false);
  }

  function handleStrategyConsult() {
    setActionNote("전략 상담 연결은 준비 중입니다.");
  }

  function renderInputScreen(track) {
    return (
      <div data-pm-mvp-screen={track} className={getScreenWidthClass(track)}>
        <div
          data-pm-mvp-branch-layout="input"
          className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(420px,520px)]"
        >
        <div className="min-w-0">
          <PmRecordInput
            key={recordPreset.jobId}
            track={track}
            onSubmit={handleRecordSubmit}
            recordPreset={recordPreset}
            collapseStructuredSections={collapseStructuredSections}
            onOpenResumeView={
              canGenerateAiResumeDraft && typeof onOpenResumeView === "function"
                ? (aiNeedsSaveFirst
                    ? () => void handleAiResumeGenerateWithSave()
                    : () => {
                        onOpenResumeView?.();
                        handleAiResumeGenerate();
                      })
                : (typeof onOpenResumeView === "function" ? onOpenResumeView : null)
            }
            canGenerateAiResumeDraft={canGenerateAiResumeDraft}
            onDraftChange={setCurrentDraft}
            aiButtonLabel={
              !currentDraft.hasContent
                ? undefined
                : !currentUser
                  ? "로그인 후 AI 이력서 초안 만들기"
                  : "기록 저장 후 AI 이력서 초안 만들기"
            }
            aiDescriptionText={
              !currentDraft.hasContent
                ? "이번 주에 한 일을 적으면 AI가 이력서 문장 초안을 만들 수 있습니다."
                : !currentUser
                  ? "AI 이력서 초안 생성을 위해 로그인이 필요합니다."
                  : "지금 기록을 저장하면 AI가 이력서 문장 초안을 만들어드립니다."
            }
          />
          {track === "weekly" ? <LastSavedRecordSummaryCard summary={lastSavedRecordSummary} /> : null}
        </div>
        {!collapseStructuredSections ? (
        <div className="min-w-0 xl:min-w-[420px]">
          <RecordCalendarCard
            records={calendarRecords}
            today={realToday}
            calendarMonth={realCalendarMonth}
            calendarLegend={currentUser ? [] : homeDashboardMock.calendarLegend}
            selectedDate={calendarSelectedDate || realToday}
            onSelectDate={setCalendarSelectedDate}
            title="이번 달 기록 흐름"
            description="최근 기록한 날짜를 한눈에 확인합니다."
            allowWeeklyDemoExamples={!currentUser}
            canDeleteRecords={!!currentUser}
            onDeleteRecord={handleDeleteWorkRecord}
            variant="compact"
          />
        </div>
        ) : null}
        </div>
      </div>
    );
  }

  return (
    <div data-pm-mvp-root data-pm-mvp-shell className="w-full min-w-0 space-y-5 px-1 py-3">
      <input
        ref={resumeImportInputRef}
        type="file"
        accept=".json,application/json"
        className="sr-only"
        onChange={handleResumeDraftImport}
      />

      {!isPreviewMode && !collapseStructuredSections && (visibleScreen === "weekly" || visibleScreen === "project") ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[14px] font-medium text-slate-600">
              #경험 정리하기
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[14px] font-medium text-slate-500">
              #빠른 입력
            </span>
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">기억나는 일만 남겨도, 나중에 이력서 문장으로 이어집니다.</h2>
            <p className="text-sm text-slate-600">업무 관리와 같은 기준을 쓰되, 이 화면은 입력을 빠르게 끝내는 데 집중합니다.</p>
          </div>
          {typeof onOpenResumeView === "function" ? (
            <div className="pt-1">
              <button
                type="button"
                onClick={onOpenResumeView}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-500 hover:bg-slate-100 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
              >
                이력서 보기
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {postSaveVisible && currentUser && collapseStructuredSections && postSaveDraftSource ? (
        <PostSavePrompt
          onOpenResumeView={typeof onOpenResumeView === "function" ? onOpenResumeView : null}
          onOpenAnalysis={typeof onOpenAnalysis === "function" ? onOpenAnalysis : null}
          onDismiss={() => { setPostSaveVisible(false); setPostSaveDraftSource(null); setLastSavedRecordSummary(null); setActionNote(""); }}
        />
      ) : actionNote ? (
        <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-slate-700">
          {actionNote}
        </div>
      ) : null}

      {currentUser && dbFetchDone && dbRecords.length === 0 && fetchError ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-3 text-sm text-rose-700">
          {fetchError}
        </div>
      ) : null}

      {currentUser && resumeProfileFetchDone && resumeProfileError && !isResumeProfileEditorOpen ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-3 text-sm text-rose-700">
          {resumeProfileError}
        </div>
      ) : null}

      {!isPreviewMode && supabase && !currentUser && (visibleScreen === "weekly" || visibleScreen === "project") ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm">
          <span className="text-slate-600">기록을 저장하려면 로그인이 필요합니다.</span>
          <button
            type="button"
            onClick={() => onOpenLogin?.()}
            className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            로그인하고 저장하기
          </button>
        </div>
      ) : null}

      {!isPreviewMode && currentUser && (visibleScreen === "weekly" || visibleScreen === "project") ? (
        <div className="rounded-xl border border-green-100 bg-green-50/60 px-3 py-2 text-xs text-slate-500">
          {currentUser.user_metadata?.name || "로그인 사용자"} 로그인 — 기록이 저장됩니다.
        </div>
      ) : null}

      {!isPreviewMode ? (
        <div className="flex flex-wrap gap-2">
          {visibleTabs.map((item) => {
            const isActive = visibleScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setCurrentScreen(item.id);
                  if (item.id === "weekly") setSourceTrack("weekly");
                  if (item.id === "project") setSourceTrack("project");
                }}
                className={[
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive ? "border-slate-900 bg-slate-900 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-500 hover:bg-slate-100 hover:text-slate-950 hover:shadow-sm",
                ].join(" ")}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {visibleScreen === "weekly" ? renderInputScreen("weekly") : null}
      {visibleScreen === "project" ? renderInputScreen("project") : null}

      {isPreviewMode && visibleScreen === "result" ? (
        <div data-pm-mvp-screen="result" className={`${getScreenWidthClass("result")} space-y-5`}>
          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{isPreviewMode ? "이력서 초안" : "경험 정리 결과"}</h2>
                <p className="max-w-4xl text-sm leading-relaxed text-slate-600">{isPreviewMode ? "최근 기록을 바탕으로 정리된 이력서 초안입니다." : "방금 기록한 내용을 바탕으로 업무 신호와 이력서 문장 후보를 정리했습니다."}</p>
              </div>
              {isPreviewMode && (
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={handleOpenResumeImportPicker}>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  이력서 가져오기
                </Button>
                <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={handleExportResume}>
                  이력서 내보내기
                </Button>
                <Button type="button" size="sm" className="rounded-full" onClick={handleDownloadResume}>
                  이력서 다운로드
                </Button>
              </div>
              )}
            </div>
          </div>

          {(isAiImportOpen || pendingAiResumeDraft) ? (
            <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 px-5 py-5 shadow-sm">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-slate-950">기존 이력서 텍스트 붙여넣기</h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    사람인·잡코리아·노션·워드 등에 정리해둔 이력서 내용을 붙여넣으면, PASSMAP 이력서 초안 구조로 정리할 수 있습니다.
                  </p>
                  <p className="text-xs leading-relaxed text-slate-500">
                    연락처 등 개인정보가 포함될 수 있으니 필요한 내용만 붙여넣어 주세요.
                  </p>
                </div>

                <textarea
                  value={aiImportText}
                  onChange={(event) => {
                    setAiImportText(event.target.value);
                    if (aiImportError) setAiImportError("");
                  }}
                  rows={8}
                  placeholder="기존 이력서 내용을 여기에 붙여넣어 주세요. 예: 경력, 프로젝트, 학력, 보유 기술, 희망 직무 등"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 resize-y"
                />

                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" className="rounded-full" disabled>
                    기존 이력서 분석 준비 중
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={handleResetAiResumeImport}>
                    닫기
                  </Button>
                </div>
                <p className="text-xs leading-relaxed text-slate-400">
                  현재는 업무기록 기반 이력서 문장 초안 생성을 먼저 지원합니다. 기존 이력서 붙여넣기 분석은 다음 단계에서 제공 예정입니다.
                </p>

                {aiImportError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {aiImportError}
                  </div>
                ) : null}

                {pendingAiResumeDraft ? (
                  <div className="space-y-4 rounded-2xl border border-indigo-200 bg-white px-4 py-4">
                    <div className="space-y-1">
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">AI Import Preview</div>
                      <p className="text-sm text-slate-700">아직 화면에 반영되지 않았습니다. 내용을 확인한 뒤 반영해 주세요.</p>
                      <p className="text-xs text-slate-500">AI가 확실히 알 수 없는 항목은 확인 필요로 남깁니다.</p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <div className="text-xs font-medium text-slate-500">이름</div>
                        <div className="mt-1 text-sm text-slate-800">{pendingAiResumeDraft.profile?.name || "확인 필요"}</div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <div className="text-xs font-medium text-slate-500">목표 직무</div>
                        <div className="mt-1 text-sm text-slate-800">{pendingAiResumeDraft.target?.job || "확인 필요"}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-medium text-slate-500">소개</div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-700">
                        {pendingAiPreviewSummary[0] || "AI 연결 후 이력서 요약이 이 위치에 표시됩니다."}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-medium text-slate-500">경력</div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-700">
                        {pendingAiPreviewExperiences[0]?.description || "확인 필요"}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-medium text-slate-500">스킬</div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-700">
                        {pendingAiPreviewSkills.length ? pendingAiPreviewSkills.join(", ") : "확인 필요"}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-medium text-slate-500">경고</div>
                      <ul className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
                        {pendingAiResumeWarnings.map((warning) => (
                          <li key={warning} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400" />
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-medium text-slate-500">원문 일부</div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-700">
                        {pendingAiResumeDraft.rawInputPreview || "미리보기할 원문이 없습니다."}
                      </div>
                    </div>

                    {pendingAiPreviewUnknowns.length ? (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-slate-500">확인 필요 항목</div>
                        <ul className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                          {pendingAiPreviewUnknowns.map((item) => (
                            <li key={item} className="flex items-start gap-2">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" className="rounded-full" onClick={handleApplyPendingAiResumeDraft}>
                        이 내용으로 반영하기
                      </Button>
                      <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setIsAiImportOpen(false)}>
                        닫기
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {isPreviewMode && (
          <div data-pm-mvp-card="result-doc" className="rounded-[28px] border border-slate-200 bg-white px-6 py-7 shadow-sm sm:px-8 sm:py-9">
            <div data-pm-mvp-doc-body data-pm-mvp-branch-layout="result-doc" className="w-full space-y-8">
              <header className="space-y-5 border-b border-slate-200 pb-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Resume Draft</div>
                    <div>
                      <h3 className="text-3xl font-semibold tracking-tight text-slate-950">{displayProfile.name}</h3>
                      <p className="mt-2 text-base font-medium text-slate-700">{displayTarget.job}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm leading-6 text-slate-600 md:text-right">
                    <div>{[displayProfile.phone, displayProfile.email, displayProfile.location].filter(Boolean).join(" | ")}</div>
                    {displayProfile.portfolioUrl ? <div>{displayProfile.portfolioUrl}</div> : null}
                    {currentUser ? (
                      <button
                        type="button"
                        onClick={handleOpenResumeProfileEditor}
                        className="mt-1 text-xs font-medium text-slate-400 underline underline-offset-2 hover:text-slate-600"
                      >
                        기본정보 수정
                      </button>
                    ) : null}
                  </div>
                </div>
              </header>

              {isResumeProfileEditorOpen ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-5">
                  <div className="text-sm font-semibold text-slate-900">기본정보 수정</div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      { label: "이름", field: "name" },
                      { label: "연락처", field: "phone" },
                      { label: "이메일", field: "email" },
                      { label: "지역", field: "location" },
                      { label: "포트폴리오 URL", field: "portfolioUrl" },
                    ].map(({ label, field }) => (
                      <div key={field} className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-500">{label}</label>
                        <input
                          type="text"
                          value={resumeProfileForm.profile[field]}
                          onChange={(e) => handleResumeProfileFieldChange(field, e.target.value)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">학력</div>
                    {resumeProfileForm.education.length === 0 ? (
                      <p className="text-xs text-slate-400">학력 정보를 추가하면 이력서에 함께 반영됩니다.</p>
                    ) : null}
                    {resumeProfileForm.education.map((edu, idx) => (
                      <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: "학교", field: "school" },
                            { label: "전공", field: "major" },
                            { label: "시작일", field: "startDate" },
                            { label: "종료일", field: "endDate" },
                          ].map(({ label, field }) => (
                            <div key={field} className="flex flex-col gap-1">
                              <label className="text-xs font-medium text-slate-400">{label}</label>
                              <input
                                type="text"
                                value={edu[field]}
                                onChange={(e) => handleEducationFieldChange(idx, field, e.target.value)}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-slate-400">설명</label>
                          <input
                            type="text"
                            value={edu.description}
                            onChange={(e) => handleEducationFieldChange(idx, "description", e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveEducationRow(idx)}
                          className="text-xs text-rose-500 hover:text-rose-700"
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddEducationRow}
                      className="text-xs font-medium text-slate-500 underline underline-offset-2 hover:text-slate-700"
                    >
                      학력 추가
                    </button>
                  </div>
                  {resumeProfileError ? (
                    <div className="rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-3 text-sm text-rose-700">
                      {resumeProfileError}
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-full"
                      disabled={resumeProfileSaving}
                      onClick={handleSaveResumeProfile}
                    >
                      {resumeProfileSaving ? "저장 중..." : "저장"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={handleCancelResumeProfileEditor}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              ) : null}

              {shouldShowResumeRecordSelector && (
                <div className="flex flex-col gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <label className="text-xs font-medium text-slate-500">이력서에 반영할 기록</label>
                  <select
                    value={selectedResumeRecordId}
                    onChange={(e) => setSelectedResumeRecordId(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    {/* value="" 의미: externalLastInput 있으면 "방금 입력한 기록", 없으면 "최신 기록 자동 반영" */}
                    <option value="">{externalLastInput ? "방금 입력한 기록 반영" : "최신 기록 자동 반영"}</option>
                    {resumeUpdateCandidates
                      .filter((c) => c.sourceRecordId)
                      .map((c) => {
                        const dateStr = String(
                          c.sourceRecord?.record_date ||
                          c.sourceRecord?.created_at ||
                          c.sourceRecord?.updated_at ||
                          ""
                        ).slice(0, 10);
                        const trackLabel = c.sourceTrack === "project" ? "프로젝트" : "주간 기록";
                        const summary = String(c.sourceSummary || c.sourceText || c.resumeSentence || "").slice(0, 40);
                        const saveStatus = c.generationMethod === "user_edited" ? "저장됨" : (c.resumeSentence ? "초안" : null);
                        const label = [dateStr, trackLabel, summary].filter(Boolean).join(" · ") + (saveStatus ? ` · ${saveStatus}` : "");
                        return (
                          <option key={String(c.sourceRecordId)} value={String(c.sourceRecordId)}>
                            {label || String(c.sourceRecordId)}
                          </option>
                        );
                      })}
                  </select>
                  {externalLastInput && (
                    <p className="text-xs text-slate-400">
                      {selectedResumeRecordId
                        ? "저장된 기록을 선택해 반영 중입니다. '방금 입력한 기록 반영'을 선택하면 최근 입력으로 돌아갑니다."
                        : "방금 입력한 기록이 우선 반영되고 있습니다. 저장된 기록을 선택하면 해당 기록으로 전환됩니다."}
                    </p>
                  )}
                </div>
              )}

              {/* P-6-2A / P-6-3A: stored record 기반 candidate일 때만 저장 UI 노출 */}
              {shouldShowSaveCandidateButton && (
                <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-slate-500">이력서 초안 저장</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!isEditingResumeSentence) {
                            const base = editableBaseResumeSentence;
                            if (!editedResumeSentence && base) {
                              resumeSentenceInitialFillRef.current = base.trim();
                              setEditedResumeSentence(base);
                            }
                          } else {
                            resumeSentenceInitialFillRef.current = "";
                          }
                          setIsEditingResumeSentence((v) => !v);
                        }}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        {isEditingResumeSentence ? "편집 닫기" : "문장 직접 수정"}
                      </button>
                      <button
                        type="button"
                        disabled={!canSaveResumeCandidate}
                        onClick={handleSaveResumeCandidate}
                        className={[
                          "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                          canSaveResumeCandidate
                            ? "bg-slate-800 text-white hover:bg-slate-700"
                            : "cursor-not-allowed bg-slate-100 text-slate-400",
                        ].join(" ")}
                      >
                        {candidateSaveStatus === "saving"
                          ? "저장 중..."
                          : candidateSaveStatus === "saved"
                          ? "저장 완료"
                          : "이 이력서 초안 저장하기"}
                      </button>
                    </div>
                  </div>
                  {/* P-AI-1: AI 이력서 문장 초안 — 버튼 클릭 시에만 생성, 자동 저장 없음 */}
                  <div className="border-t border-slate-100 pt-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="flex-1 text-xs leading-relaxed text-slate-400">
                        저장된 업무기록을 바탕으로 이력서에 활용할 수 있는 문장 초안을 생성합니다. 생성된 문장은 반드시 직접 확인하고 수정해주세요.
                      </p>
                      <button
                        type="button"
                        disabled={aiResumeLoading}
                        onClick={handleAiResumeGenerate}
                        className={[
                          "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                          aiResumeLoading
                            ? "cursor-not-allowed bg-slate-100 text-slate-400"
                            : "border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100",
                        ].join(" ")}
                      >
                        {aiResumeLoading ? "생성 중..." : "AI 초안 만들기"}
                      </button>
                    </div>
                    {aiResumeError && (
                      <p className="mt-1.5 text-xs text-red-500">{aiResumeError}</p>
                    )}
                    {aiResumeBullets.length > 0 && (
                      <div className="mt-2 flex flex-col gap-2">
                        {aiResumeBullets.map((bullet, idx) => (
                          <div key={idx} className="flex items-start gap-2 rounded-lg border border-violet-100 bg-violet-50 px-3 py-2">
                            <span className="flex-1 text-xs leading-relaxed text-slate-700">{bullet.text}</span>
                            <button
                              type="button"
                              onClick={() => {
                                resumeSentenceInitialFillRef.current = bullet.text.trim();
                                setEditedResumeSentence(bullet.text.trim());
                                setIsEditingResumeSentence(true);
                              }}
                              className="shrink-0 rounded-full border border-violet-200 bg-white px-2 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100 transition-colors"
                            >
                              이 문장 사용
                            </button>
                          </div>
                        ))}
                        {aiResumeMissingHints.length > 0 && (
                          <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
                            <p className="mb-1 text-xs font-medium text-amber-700">더 강한 문장을 위해 필요한 정보</p>
                            <ul className="space-y-0.5">
                              {aiResumeMissingHints.map((hint, i) => (
                                <li key={i} className="text-xs text-amber-600">• {hint}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {/* P-6-3D: 현재 반영된 문장 표시 — 편집 중에는 숨겨 textarea와 중복 방지 */}
                  {!isEditingResumeSentence && resumeDraftViewModel?.updatePreview?.afterSentence && (
                    <div className="border-l-2 border-slate-200 pl-3 text-sm">
                      <span className="block text-xs text-slate-400 mb-0.5">
                        {resumeDraftViewModel.updatePreview.isDraft ? "초안 문장 — 수정 후 저장 가능" : "현재 반영된 문장"}
                      </span>
                      <span className="text-slate-700 leading-relaxed">{resumeDraftViewModel.updatePreview.afterSentence}</span>
                    </div>
                  )}
                  {isEditingResumeSentence && (
                    <textarea
                      value={editedResumeSentence}
                      onChange={(e) => {
                        setEditedResumeSentence(e.target.value);
                        setCandidateSaveStatus((prev) => (prev === "saved" ? "idle" : prev));
                      }}
                      placeholder={editableBaseResumeSentence || "이력서에 저장할 문장을 직접 입력해 주세요."}
                      rows={3}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none"
                    />
                  )}
                  {isEditingResumeSentence && (
                    <p className="text-xs text-slate-400">초안 문장을 바탕으로 직접 다듬어 주세요. 수정한 문장만 저장할 수 있습니다.</p>
                  )}
                  {!canSaveResumeCandidate && (
                    <p className="text-xs text-slate-400">
                      {!currentUser
                        ? "저장하려면 로그인이 필요합니다."
                        : (isDraftSentence && !hasUserEditedResumeSentence)
                        ? "기록 기반 초안은 그대로 저장하지 않습니다. 직접 수정하면 저장할 수 있습니다."
                        : (!safeCandidateResumeSentence && !hasUserEditedResumeSentence)
                        ? "저장할 문장을 직접 입력해 주세요."
                        : null}
                    </p>
                  )}
                </div>
              )}

              {/* P-AI-1: AI 이력서 문장 초안 — 저장 카드가 없을 때만 preview CTA 노출 */}
              {isPreviewMode && !shouldShowSaveCandidateButton && (
                <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="flex-1 text-xs leading-relaxed text-slate-400">
                      {canGenerateAiResumeDraft
                        ? "저장된 업무기록을 바탕으로 이력서에 활용할 수 있는 문장 초안을 생성합니다. 생성된 문장은 반드시 직접 확인하고 수정해주세요."
                        : "업무기록을 먼저 저장하면 AI 이력서 문장 초안을 만들 수 있습니다. 경험 정리하기에서 업무기록을 저장해 주세요."}
                    </p>
                    <button
                      type="button"
                      disabled={aiResumeLoading || !canGenerateAiResumeDraft}
                      onClick={handleAiResumeGenerate}
                      className={[
                        "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                        aiResumeLoading || !canGenerateAiResumeDraft
                          ? "cursor-not-allowed bg-slate-100 text-slate-400"
                          : "border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100",
                      ].join(" ")}
                    >
                      {aiResumeLoading ? "생성 중..." : "AI 초안 만들기"}
                    </button>
                  </div>
                  {aiResumeError && (
                    <p className="mt-1.5 text-xs text-red-500">{aiResumeError}</p>
                  )}
                  {aiResumeBullets.length > 0 && (
                    <div className="mt-2 flex flex-col gap-2">
                      {aiResumeBullets.map((bullet, idx) => (
                        <div key={idx} className="flex items-start gap-2 rounded-lg border border-violet-100 bg-violet-50 px-3 py-2">
                          <span className="flex-1 text-xs leading-relaxed text-slate-700">{bullet.text}</span>
                          <button
                            type="button"
                            onClick={() => {
                              resumeSentenceInitialFillRef.current = bullet.text.trim();
                              setEditedResumeSentence(bullet.text.trim());
                              setIsEditingResumeSentence(true);
                            }}
                            className="shrink-0 rounded-full border border-violet-200 bg-white px-2 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100 transition-colors"
                          >
                            이 문장 사용
                          </button>
                        </div>
                      ))}
                      {aiResumeMissingHints.length > 0 && (
                        <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
                          <p className="mb-1 text-xs font-medium text-amber-700">더 강한 문장을 위해 필요한 정보</p>
                          <ul className="space-y-0.5">
                            {aiResumeMissingHints.map((hint, i) => (
                              <li key={i} className="text-xs text-amber-600">• {hint}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <ResumeDocSection title="소개">
                {currentUser && !isResumeSummaryEditorOpen ? (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleOpenResumeSummaryEditor}
                      className="text-xs font-medium text-slate-500 underline underline-offset-2 hover:text-slate-700"
                    >
                      소개 수정
                    </button>
                  </div>
                ) : null}
                {displaySummaryParagraphs.length ? (
                  displaySummaryParagraphs.map((paragraph, index) => (
                    <p key={`${paragraph}-${index}`}>{paragraph}</p>
                  ))
                ) : (
                  currentUser ? (
                    <p className="text-slate-400 text-sm">소개 문단을 작성하면 이력서 첫인상에 함께 반영됩니다.</p>
                  ) : null
                )}
              </ResumeDocSection>
              {isResumeSummaryEditorOpen ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                  <div className="text-sm font-semibold text-slate-900">소개 수정</div>
                  <div className="flex flex-col gap-1">
                    <textarea
                      rows={6}
                      value={resumeSummaryFormText}
                      onChange={(e) => setResumeSummaryFormText(e.target.value)}
                      placeholder="소개 문단을 작성하세요."
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 resize-y"
                    />
                    <p className="text-xs text-slate-400">빈 줄로 문단을 나누면 소개 문단이 여러 개로 저장됩니다.</p>
                  </div>
                  {resumeSummaryError ? (
                    <div className="rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-3 text-sm text-rose-700">
                      {resumeSummaryError}
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-full"
                      disabled={resumeSummarySaving}
                      onClick={handleSaveResumeSummary}
                    >
                      {resumeSummarySaving ? "저장 중..." : "저장"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={handleCancelResumeSummaryEditor}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              ) : null}

              <ResumeDocSection title="경력">
                {currentUser && !isResumeExperienceEditorOpen ? (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleOpenResumeExperienceEditor}
                      className="text-xs font-medium text-slate-500 underline underline-offset-2 hover:text-slate-700"
                    >
                      경력 수정
                    </button>
                  </div>
                ) : null}
                {displayExperiences.length ? (
                  <div className="space-y-6">
                    {displayExperiences.map((item, index) => (
                      <div key={`${item.company}-${item.role}-${index}`} className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                            <h4 className="text-lg font-semibold text-slate-900">
                              {[item.company, item.role].filter(Boolean).join(" | ") || displayTarget.job}
                            </h4>
                            <span className="text-sm text-slate-500">{[item.startDate, item.endDate].filter(Boolean).join(" ~ ")}</span>
                          </div>
                          {item.description ? (
                            <p className="text-sm text-slate-500">{item.description}</p>
                          ) : null}
                        </div>
                        {item.bullets?.length ? (
                          <ul className="space-y-2">
                            {item.bullets.map((bullet) => (
                              <li key={bullet} className="flex items-start gap-3">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500">아직 반영된 경력 문장이 없습니다. 이번 주 기록하기를 통해 경력 항목을 채워보세요.</p>
                )}
              </ResumeDocSection>

              {isResumeExperienceEditorOpen ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-5">
                  <div className="text-sm font-semibold text-slate-900">경력 수정</div>
                  {resumeExperienceForm.length === 0 ? (
                    <p className="text-xs text-slate-400">경력 항목을 추가하면 이력서 본문에 함께 반영됩니다.</p>
                  ) : null}
                  {resumeExperienceForm.map((exp, expIdx) => (
                    <div key={expIdx} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {[
                          { label: "회사명", field: "company" },
                          { label: "역할/직무명", field: "role" },
                          { label: "시작일", field: "startDate" },
                          { label: "종료일", field: "endDate" },
                        ].map(({ label, field }) => (
                          <div key={field} className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-slate-400">{label}</label>
                            <input
                              type="text"
                              value={exp[field]}
                              onChange={(e) => handleExperienceFieldChange(expIdx, field, e.target.value)}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-400">설명</label>
                        <input
                          type="text"
                          value={exp.description}
                          onChange={(e) => handleExperienceFieldChange(expIdx, "description", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-slate-400">성과 / 업무 항목</div>
                        {exp.bullets.length === 0 ? (
                          <p className="text-xs text-slate-400">업무기록에서 만든 문장을 참고해, 실제 이력서에 남길 문장만 정리해 주세요.</p>
                        ) : null}
                        {exp.bullets.map((bullet, bulletIdx) => (
                          <div key={bulletIdx} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={bullet}
                              onChange={(e) => handleExperienceBulletChange(expIdx, bulletIdx, e.target.value)}
                              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveBulletFromExperience(expIdx, bulletIdx)}
                              className="text-xs text-rose-500 hover:text-rose-700 shrink-0"
                            >
                              삭제
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleAddBulletToExperience(expIdx)}
                          className="text-xs font-medium text-slate-500 underline underline-offset-2 hover:text-slate-700"
                        >
                          항목 추가
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveExperienceRow(expIdx)}
                        className="text-xs text-rose-500 hover:text-rose-700"
                      >
                        경력 삭제
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddExperienceRow}
                    className="text-xs font-medium text-slate-500 underline underline-offset-2 hover:text-slate-700"
                  >
                    경력 추가
                  </button>
                  {resumeExperienceError ? (
                    <div className="rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-3 text-sm text-rose-700">
                      {resumeExperienceError}
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-full"
                      disabled={resumeExperienceSaving}
                      onClick={handleSaveResumeExperiences}
                    >
                      {resumeExperienceSaving ? "저장 중..." : "저장"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={handleCancelResumeExperienceEditor}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              ) : null}

              <ResumeDocSection title="주요 성과">
                {viewModelAchievementText && <p>{viewModelAchievementText}</p>}
                {viewModelImprovementNotes.length ? (
                  <ul className="space-y-2">
                    {viewModelImprovementNotes.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-slate-700">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {shouldShowResumeEmptyGuide && (
                  <p className="text-sm text-slate-500">업무기록을 저장하면 AI가 이력서 문장 초안을 만들어 드립니다.</p>
                )}
              </ResumeDocSection>

              {displayEducation.length ? (
                <ResumeDocSection title="학력">
                  <div className="space-y-4">
                    {displayEducation.map((item, index) => (
                      <div key={`${item.school}-${item.major}-${index}`} className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                        <div>
                          <h4 className="text-base font-semibold text-slate-900">
                            {[item.school, item.major].filter(Boolean).join(" ") || "학력 정보"}
                          </h4>
                          {item.description ? (
                            <p className="text-sm text-slate-500">{item.description}</p>
                          ) : null}
                        </div>
                        <span className="text-sm text-slate-500">{[item.startDate, item.endDate].filter(Boolean).join(" ~ ")}</span>
                      </div>
                    ))}
                  </div>
                </ResumeDocSection>
              ) : null}

              <ResumeDocSection title="보유 역량">
                {currentUser && !isResumeSkillsEditorOpen ? (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleOpenResumeSkillsEditor}
                      className="text-xs font-medium text-slate-500 underline underline-offset-2 hover:text-slate-700"
                    >
                      역량 수정
                    </button>
                  </div>
                ) : null}
                {displaySkillItems.length ? (
                  <div className="flex flex-wrap gap-2">
                    {displaySkillItems.map((item) => (
                      <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
                        {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  currentUser ? (
                    <p className="text-slate-400 text-sm">보유 역량을 추가하면 이력서에 함께 반영됩니다.</p>
                  ) : (
                    <p className="text-slate-500">아직 정리된 역량 항목이 없습니다.</p>
                  )
                )}
              </ResumeDocSection>
              {isResumeSkillsEditorOpen ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                  <div className="text-sm font-semibold text-slate-900">역량 수정</div>
                  <div className="flex flex-col gap-1">
                    <textarea
                      rows={6}
                      value={resumeSkillsFormText}
                      onChange={(e) => setResumeSkillsFormText(e.target.value)}
                      placeholder="SQL&#10;요구사항 정의&#10;협업 조율"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 resize-y"
                    />
                    <p className="text-xs text-slate-400">한 줄에 하나씩 입력하면 보유 역량으로 저장됩니다.</p>
                  </div>
                  {resumeSkillsError ? (
                    <div className="rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-3 text-sm text-rose-700">
                      {resumeSkillsError}
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-full"
                      disabled={resumeSkillsSaving}
                      onClick={handleSaveResumeSkills}
                    >
                      {resumeSkillsSaving ? "저장 중..." : "저장"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={handleCancelResumeSkillsEditor}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              ) : null}

              <ResumeDocSection title="기타">
                <ul className="space-y-2">
                  <li className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
                    <span>프로젝트 상세 링크와 추가 경력 정보는 이력서 업데이트 화면에서 이어서 보강할 수 있습니다.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
                    <span>자격증, 교육 이수, 포트폴리오 링크는 보유 정보가 확인되는 범위에서 추가하는 것을 권장합니다.</span>
                  </li>
                </ul>
              </ResumeDocSection>
            </div>
          </div>
          )}

          <div className="space-y-4">
            <details open className="rounded-[24px] border border-slate-200 bg-slate-50/70 px-5 py-4">
              <summary className="cursor-pointer list-none text-sm font-semibold text-slate-700">
                이번 업데이트 반영 보기
              </summary>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-full bg-slate-200 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">before</span>
                    <span className="text-sm font-semibold text-slate-900">기록 원문</span>
                  </div>
                  {hasSourcePreview ? (
                    <p className="text-sm leading-7 text-slate-700">{sourcePreview}</p>
                  ) : (
                    <p className="text-sm leading-7 text-slate-500">원문 기록을 찾을 수 없습니다. 기록을 남기면 이 자리에 다듬기 전 문장이 표시됩니다.</p>
                  )}
                </div>

                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 px-4 py-4 shadow-sm">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-full bg-slate-900 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">after</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {isResumeAiAfterCardLoading || isResumeAiAfterPending
                        ? "AI 분석 중"
                        : hasForcedDisplayedAiResumeBullets
                          ? "경력기술서형 초안"
                          : resumeDraftViewModel?.updatePreview?.afterTitle || "이력서 문장"}
                    </span>
                  </div>
                  {isResumeAiAfterCardLoading || isResumeAiAfterPending ? (
                    <div className="mb-3 space-y-2">
                      <p className="text-sm text-slate-700">AI가 이력서 초안을 분석하고 있습니다.</p>
                      <p className="text-xs text-slate-500">잠시만 기다려 주세요.</p>
                    </div>
                  ) : hasForcedDisplayedAiResumeBullets ? (
                    <div className="space-y-2">
                      <p className="text-xs leading-relaxed text-emerald-600">
                        AI가 정리한 경력기술서형 초안입니다. 필요한 문장만 골라 이력서에 반영할 수 있습니다.
                      </p>
                      <ol className="space-y-2 text-[15px] leading-7 text-slate-900">
                        {forcedDisplayedAiResumeBullets.map((bullet, idx) => (
                          <li key={`${idx}-${bullet.text}`} className="list-decimal list-inside">
                            {bullet.text}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : aiResumeError ? (
                    <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                      <p className="text-xs text-red-600">{aiResumeError}</p>
                    </div>
                  ) : resumeDraftViewModel?.updatePreview?.afterBullets?.length > 0 ? (
                    <div className="space-y-2">
                      <ol className="space-y-2 text-[15px] leading-7 text-slate-900">
                        {resumeDraftViewModel.updatePreview.afterBullets.map((bullet, idx) => (
                          <li key={idx} className="list-decimal list-inside">
                            {bullet.text}
                          </li>
                        ))}
                      </ol>
                      <p className="text-xs leading-relaxed text-emerald-600">{resumeDraftViewModel.updatePreview.afterHelperText}</p>
                    </div>
                  ) : resumeDraftViewModel?.updatePreview?.afterSentence ? (
                    <div className="space-y-2">
                      <p className="text-[15px] leading-7 text-slate-900">{resumeDraftViewModel.updatePreview.afterSentence}</p>
                      {resumeDraftViewModel.updatePreview.hasAiResult ? (
                        <p className="text-xs leading-relaxed text-emerald-600">AI가 정리한 초안입니다. 직접 수정하면 이력서에 저장할 수 있습니다.</p>
                      ) : resumeDraftViewModel.updatePreview.isDraft ? (
                        <p className="text-xs leading-relaxed text-amber-600">임시 초안입니다. 기록을 보완하거나 AI 정리를 다시 시도해 주세요.</p>
                      ) : (
                        <p className="text-xs leading-relaxed text-slate-500">비교 정보는 접어두고, 문서 본문에서는 이 문장이 경력과 성과 섹션 안으로 흡수됩니다.</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm leading-7 text-slate-500">아직 이력서 문장이 반영되지 않았습니다. 이번 주 기록하기로 초안을 쌓아보세요.</p>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" className="rounded-full" onClick={() => setCurrentScreen("weekly")}>
                          이번 주 기록하기
                        </Button>
                        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={handleOpenResumeImportPicker}>
                          기존 이력서 불러오기
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </details>

            <div className="flex justify-end">
              <button
                type="button"
                className="text-sm text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
                onClick={() => {
                  if (typeof onOpenAnalysis === "function") onOpenAnalysis();
                  else setActionNote("정밀 분석 연결 지점은 analysis 뷰로 이어지도록 비워두었습니다.");
                }}
              >
                정밀 분석으로 이어가기 →
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {currentScreen === "readiness" ? (
        <div data-pm-mvp-screen="readiness" className={`${getScreenWidthClass("readiness")} space-y-5`}>
          <ScreenHeader
            badge="연결 근거"
            sourceTrack={sourceTrack}
            title="기록이 목표 직무와 이어지는 근거"
            description="최근 기록 기준으로 지금 경험이 목표 직무와 어떻게 연결되는지와 보완 포인트를 함께 봅니다."
          />

          <SectionCard title={result.readiness.summaryTitle} tone="highlight">
            <div className="space-y-2">
              <div className="whitespace-pre-line text-2xl font-semibold tracking-tight text-slate-950">{result.readiness.summaryText}</div>
              <p className="text-sm leading-relaxed text-slate-600">{result.readiness.summarySubtext}</p>
            </div>
          </SectionCard>

          <div data-pm-mvp-branch-layout="readiness" className="grid gap-4 xl:grid-cols-2">
            <SectionCard title="이미 갖춘 신호">
              <BulletList items={result.readiness.ownedSignals} />
            </SectionCard>
            <SectionCard title="아직 부족하게 읽히는 신호">
              <BulletList items={result.readiness.missingSignals} />
            </SectionCard>
            <SectionCard title="다음에 먼저 보완하면 좋은 것">
              <BulletList items={result.readiness.nextSignals} />
            </SectionCard>
            <SectionCard title="최근 기록이 만든 변화">
              <p className="text-sm leading-relaxed text-slate-700">{result.readiness.recentChange}</p>
            </SectionCard>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="sm:flex-1"
              onClick={() => {
                if (typeof onOpenResumeView === "function") onOpenResumeView();
                else setCurrentScreen("result");
              }}
            >
              이 기준으로 이력서 다시 보기
            </Button>
            <Button type="button" className="sm:flex-1" onClick={() => setCurrentScreen(normalizeRecordScreen(sourceTrack))}>
              관련 기록 추가하기
            </Button>
            <Button type="button" variant="outline" className="sm:flex-1" onClick={handleStrategyConsult}>
              전략 상담 받기
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
