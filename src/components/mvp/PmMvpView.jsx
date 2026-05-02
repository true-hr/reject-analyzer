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

function buildDemoResult(input, sourceTrack) {
  const sourceText = String(input?.text || "").trim();
  const isProjectTrack = sourceTrack === "project" || input?.track === "project";
  const helperPrefix = isProjectTrack ? "프로젝트 기록 기준" : "이번 주 기록 기준";

  const projectName = String(input?.projectName || "").trim();
  const projectGoal = String(input?.projectGoal || "").trim();
  const projectActions = String(input?.projectActions || "").trim();
  const projectResult = String(input?.projectResult || "").trim();

  const projectSummary = isProjectTrack
    ? `${projectName ? `${projectName} 프로젝트는 ` : ""}${projectGoal || "설정한 목표"}를 중심으로 수행 행동과 결과를 이력서 경험으로 정리할 수 있습니다.`
    : null;

  const compact = (v, fallback = "") => String(v || "").trim() || fallback;

  const projectResumeLine = isProjectTrack && (projectActions || projectResult)
    ? `${projectActions ? projectActions + (projectResult ? " " : "") : ""}${projectResult ? "그 결과 " + projectResult : ""}`.trim()
    : null;

  const finalResumeLine = projectResumeLine ||
    "반복적으로 발생하는 오류 문의 유형을 구조화하고, 개발팀과 협업해 대응 문서를 정리함으로써 운영 효율과 후속 대응 흐름 개선에 기여했습니다.";

  const projectCardResumeLine = isProjectTrack
    ? (projectName
        ? `${projectName} 프로젝트에서 ${compact(projectGoal, "업무 목표")}를 달성하기 위해 ${compact(projectActions, "필요한 행동")}을 수행했고, ${compact(projectResult, "의미 있는 결과")}로 이어지는 경험을 만들었습니다.`
        : `${compact(projectGoal, "설정한 목표")}를 달성하기 위해 ${compact(projectActions, "필요한 행동")}을 수행했고, ${compact(projectResult, "의미 있는 결과")}로 이어지는 경험을 만들었습니다.`)
    : null;

  const structuredCards = isProjectTrack
    ? [
        { label: "프로젝트 목표", value: compact(projectGoal, "아직 입력되지 않았습니다.") },
        { label: "핵심 행동", value: compact(projectActions, "아직 입력되지 않았습니다.") },
        { label: "결과·성과", value: compact(projectResult, "아직 입력되지 않았습니다.") },
        { label: "이력서 문장 후보", value: projectCardResumeLine || compact(finalResumeLine, "이력서 문장은 기록이 더 쌓이면 자동으로 정리됩니다.") },
      ]
    : [
        { label: "이번 주 요약", value: compact(sourceText, "이번 주 기록을 남기면 자동으로 정리됩니다.") },
        { label: "읽힌 업무 신호", value: "운영 이슈 구조화, 협업 조율, 후속 실행 관리, 문서화 역량" },
        { label: "이력서 문장 후보", value: finalResumeLine },
      ];

  return {
    sourceText,
    helperPrefix,
    summary: projectSummary,
    resumeLine: finalResumeLine,
    structuredCards,
    strengths: ["운영 이슈 구조화", "협업 조율", "후속 실행 관리", "문서화 역량"],
    strengthDescription: "이번 경험은 단순 처리 업무보다, 반복 이슈를 정리하고 협업 흐름을 정리하는 강점으로 읽힙니다.",
    pmSignals: ["여러 이해관계자와의 협업 조율", "반복 이슈를 구조화한 경험"],
    serviceSignals: ["운영 흐름 정리", "요구사항/이슈 문서화"],
    missingSignals: ["우선순위 판단 근거", "성과 수치 표현"],
    nextActions: [
      "대응 시간이나 처리 건수처럼 수치가 있으면 함께 넣어보기",
      "왜 이 이슈를 먼저 정리했는지 맥락 추가하기",
      "사용자/고객 관점에서 의미를 한 줄 더 붙이기",
    ],
    readiness: {
      summaryTitle: "현재 준비도 요약",
      summaryText: "PM 준비도 48%\n최근 기록 반영 후 +6%",
      summarySubtext: "이번 기록으로 협업 조율 신호와 운영 구조화 신호가 강화됐습니다.",
      ownedSignals: ["여러 이해관계자와의 협업 조율 경험", "반복 이슈를 구조화한 경험", "실행 후 후속 조치까지 정리한 경험"],
      missingSignals: ["우선순위 판단 기준 제시 경험", "데이터 기반 판단 표현", "고객 문제를 정의하는 관점"],
      nextSignals: ["성과를 숫자나 변화 기준으로 표현하기", "왜 이 문제를 먼저 풀었는지 배경 추가하기", "사용자/고객 기준으로 문장 재정리하기"],
      recentChange: "이번 기록으로 크로스펑셔널 협업 신호가 새롭게 강화됐습니다. 부족 신호 3개 중 1개는 일부 보완 가능한 상태로 바뀌었습니다.",
    },
  };
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
  const [aiResumeBullets, setAiResumeBullets] = useState([]);
  const [aiResumeError, setAiResumeError] = useState("");
  const [aiResumeMissingHints, setAiResumeMissingHints] = useState([]);

  async function fetchWorkRecords() {
    if (!supabase) return;
    try {
      const rows = await listWorkRecords({ limit: 50 });
      setRawDbRows(rows);
      setDbRecords(rows.map(adaptWorkRecordRow));
    } catch (_) {
    } finally {
      setDbFetchDone(true);
    }
  }

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      const user = data?.user ?? null;
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
    const raw = String(result?.sourceText || "").trim();
    if (!raw) return "";
    if (raw.length <= 180) return raw;
    return `${raw.slice(0, 180).trim()}...`;
  }, [result?.sourceText]);
  const hasSourcePreview = Boolean(sourcePreview);
  const hasResumeLine = Boolean(String(result?.resumeLine || "").trim());
  const resumeExperienceBullets = useMemo(() => buildResumeExperienceBullets(result), [result]);
  const resumeSkillItems = useMemo(() => buildResumeSkillItems(result), [result]);
  const improvementNotes = useMemo(() => buildImprovementNotes(result), [result]);

  // P-4A.6 (P-5C-1): candidate 있을 때 result.resumeLine 우회 차단. achievementHighlights는 ViewModel에서 처리.
  const displayAchievementText = latestResumeCandidate
    ? "최근 기록은 이력서 초안에 반영되었습니다. 주요 성과로 확정하려면 구체적인 결과 정보가 더 필요합니다."
    : (hasResumeLine ? result.resumeLine : "최근 기록을 바탕으로 운영 효율과 후속 대응 흐름을 개선한 경험이 대표 성과로 반영될 예정입니다.");

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
    result?.strengthDescription,
    "반복 이슈를 구조화하고 협업 흐름을 정리하는 경험을 중심으로, 운영 현장에서 발견한 문제를 실행 가능한 문장으로 바꾸는 이력서 초안입니다.",
  );
  const introDetail = pickFirstText(
    result?.resumeLine,
    "운영 이슈를 정리하고 후속 대응 흐름까지 연결한 경험을 바탕으로, 서비스와 조직 사이의 커뮤니케이션을 안정적으로 관리해왔습니다.",
  );

  // P-5B: ResumeDraftViewModel 연결.
  const resumeDraftViewModel = useMemo(() => buildResumeDraftViewModel({
    result,
    latestResumeCandidate,
    resumeExperienceBullets,
    resumeSkillItems,
    improvementNotes,
    fallbackAchievementText: displayAchievementText,
    profile: {
      name: "",
      role: resumeHeadline,
      contact: "",
      portfolio: "",
    },
  }), [result, latestResumeCandidate, resumeExperienceBullets, resumeSkillItems, improvementNotes, displayAchievementText, resumeHeadline]);

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
  // P-AI-1: AI 생성 가능 여부 — sourceRecord 있어야 Worker 호출 가능.
  const canGenerateAiResumeDraft = Boolean(
    latestResumeCandidate?.sourceRecordId && latestResumeCandidate?.sourceRecord
  );

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
    setAiResumeBullets([]);
    setAiResumeError("");
    setAiResumeMissingHints([]);
  }, [currentResumeCandidateKey]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleRecordSubmit(input) {
    const nextTrack = input?.track === "project" ? "project" : "weekly";
    const normalizedInput = { ...input, track: nextTrack };
    setLastInput(normalizedInput);
    setSourceTrack(nextTrack);
    setLastSavedRecordSummary(null);
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
    const { data: { user } } = await supabase.auth.getUser();
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
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(PASSMAP_WORK_RECORDS_CHANGED_EVENT, {
          detail: { source: "PmMvpView", reason: "work-record-created" },
        }));
      }
    } catch (_) {
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
  async function handleAiResumeGenerate() {
    if (aiResumeLoading) return;
    const base = (import.meta.env.VITE_AI_PROXY_URL || "").toString().trim();
    if (!base) {
      setAiResumeError("Worker URL이 설정되지 않았습니다. VITE_AI_PROXY_URL을 확인해 주세요.");
      return;
    }
    const sourceRecord = latestResumeCandidate?.sourceRecord ?? null;
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
    setAiResumeLoading(true);
    setAiResumeError("");
    setAiResumeBullets([]);
    setAiResumeMissingHints([]);
    try {
      const resp = await fetch(base.replace(/\/$/, "") + "/api/resume-generate", {
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
      const data = await resp.json().catch(() => null);
      if (!resp.ok || !data?.ok) {
        const msg = typeof data?.error === "object" ? (data.error?.message || JSON.stringify(data.error)) : (data?.error || "");
        setAiResumeError(msg || "AI 호출에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      const bullets = Array.isArray(data.bullets) ? data.bullets : [];
      if (bullets.length === 0) {
        setAiResumeError("AI가 문장을 생성하지 못했습니다. 기록 내용을 보완한 후 다시 시도해 주세요.");
        return;
      }
      setAiResumeBullets(bullets);
      setAiResumeMissingHints(Array.isArray(data.missingInfoHints) ? data.missingInfoHints : []);
    } catch (_) {
      setAiResumeError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setAiResumeLoading(false);
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

  function handleSaveAsset() {
    setActionNote("이력서 가져오기 기능은 준비 중입니다.");
  }

  function handleExportResume() {
    setActionNote("\uC774\uB825\uC11C \uB0B4\uBCF4\uB0B4\uAE30 \uAE30\uB2A5\uC740 \uC900\uBE44 \uC911\uC785\uB2C8\uB2E4. \uD604\uC7AC\uB294 \uBB38\uC11C \uCD08\uC548 \uAD6C\uC870\uB97C \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.");
    return;
    setActionNote("이력서 내보내기 기능은 준비 중입니다. 현재는 문서 초안 구조를 확인할 수 있습니다.");
  }

  function handleDownloadResume() {
    setActionNote("이력서 다운로드 기능은 준비 중입니다.");
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
          />
          {track === "weekly" ? <LastSavedRecordSummaryCard summary={lastSavedRecordSummary} /> : null}
        </div>
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
        </div>
      </div>
    );
  }

  return (
    <div data-pm-mvp-root data-pm-mvp-shell className="w-full min-w-0 space-y-5 px-1 py-3">
      {!isPreviewMode && (visibleScreen === "weekly" || visibleScreen === "project") ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
              #경험 정리하기
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
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

      {actionNote ? (
        <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-slate-700">
          {actionNote}
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
                <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={handleSaveAsset}>
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

          {isPreviewMode && (
          <div data-pm-mvp-card="result-doc" className="rounded-[28px] border border-slate-200 bg-white px-6 py-7 shadow-sm sm:px-8 sm:py-9">
            <div data-pm-mvp-doc-body data-pm-mvp-branch-layout="result-doc" className="w-full space-y-8">
              <header className="space-y-5 border-b border-slate-200 pb-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Resume Draft</div>
                    <div>
                      <h3 className="text-3xl font-semibold tracking-tight text-slate-950">백강산</h3>
                      <p className="mt-2 text-base font-medium text-slate-700">{resumeHeadline}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm leading-6 text-slate-600 md:text-right">
                    <div>010-0000-0000 | email@example.com | 서울</div>
                    <div>portfolio.example.com</div>
                  </div>
                </div>
              </header>

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
                        {aiResumeLoading ? "생성 중..." : "AI 이력서 문장 초안 만들기"}
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

              {/* P-AI-1: AI 이력서 문장 초안 — preview 모드에서 항상 노출, 업무기록 있을 때만 생성 가능 */}
              {isPreviewMode && (
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
                      {aiResumeLoading ? "생성 중..." : "AI 이력서 문장 초안 만들기"}
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
                <p>{introParagraph}</p>
                <p>{introDetail}</p>
              </ResumeDocSection>

              <ResumeDocSection title="경력">
                <div className="space-y-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <h4 className="text-lg font-semibold text-slate-900">OO회사 | {resumeHeadline}</h4>
                    <span className="text-sm text-slate-500">2023.03 ~ 현재</span>
                  </div>
                  <p className="text-sm text-slate-500">운영 이슈 대응, 협업 조율, 문서화 기반 개선</p>
                </div>
                {viewModelExperienceBullets.length ? (
                  <ul className="space-y-2">
                    {viewModelExperienceBullets.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500">아직 반영된 경력 문장이 없습니다. 이번 주 기록하기를 통해 경력 항목을 채워보세요.</p>
                )}
              </ResumeDocSection>

              <ResumeDocSection title="주요 성과">
                <p>{viewModelAchievementText}</p>
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
              </ResumeDocSection>

              <ResumeDocSection title="학력">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                  <div>
                    <h4 className="text-base font-semibold text-slate-900">OO대학교 OOO학과</h4>
                    <p className="text-sm text-slate-500">학력 정보 업데이트 예정</p>
                  </div>
                  <span className="text-sm text-slate-500">2016.03 ~ 2022.02</span>
                </div>
              </ResumeDocSection>

              <ResumeDocSection title="보유 역량">
                {viewModelSkillItems.length ? (
                  <div className="flex flex-wrap gap-2">
                    {viewModelSkillItems.map((item) => (
                      <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
                        {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500">아직 정리된 역량 항목이 없습니다.</p>
                )}
              </ResumeDocSection>

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
                    <span className="text-sm font-semibold text-slate-900">이력서 문장</span>
                  </div>
                  {resumeDraftViewModel?.updatePreview?.afterSentence ? (
                    <div className="space-y-2">
                      <p className="text-[15px] leading-7 text-slate-900">{resumeDraftViewModel.updatePreview.afterSentence}</p>
                      {resumeDraftViewModel.updatePreview.isDraft ? (
                        <p className="text-xs leading-relaxed text-amber-600">초안 문장입니다. 직접 수정하면 이력서에 저장할 수 있습니다.</p>
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
                        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={handleSaveAsset}>
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
