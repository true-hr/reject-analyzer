import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, FileText, Lightbulb, Sparkles, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { homeDashboardMock, PASSMAP_DEMO_RANGE_RECORDS } from "./homeDashboardMock.js";
import { downloadPassmapCalendarIcs } from "@/lib/calendarExport.js";
import { useToast } from "@/components/ui/use-toast";
import {
  buildCalendarEntriesByDate,
  buildCalendarMonthViewModel,
  deriveCalendarSummary,
  deriveHomeActionStatus,
  deriveMonthlyAssetSummary,
} from "./homeDashboardCalendarUtils.js";
import { supabase } from "@/lib/supabaseClient.js";
import { deleteWorkRecord, listWorkRecords } from "@/lib/workRecordRepository.js";
import { getSession, onAuthStateChange } from "@/lib/auth.js";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function SectionHeader({ title, description, action }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
      <div className="space-y-0.5">
        <h3 className="text-sm font-semibold leading-snug text-slate-900 sm:text-[22px]">{title}</h3>
        {description ? <p className="text-xs leading-relaxed text-slate-500 sm:text-[15px]">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

function PlaceholderButton({ children }) {
  return (
    <Button variant="outline" size="sm" className="h-7 rounded-full text-xs sm:h-9 sm:text-[15px]" disabled>
      {children}
    </Button>
  );
}

function CalendarLegend({ items }) {
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium text-slate-400">기록 유형</span>
        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
          <span className="inline-block h-2 w-8 rounded-full border border-slate-200 bg-slate-100" />
          개인 업무
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
          <span className="inline-block h-2 w-8 rounded-full border border-indigo-200 bg-indigo-100" />
          팀 프로젝트
        </span>
      </div>
      {items?.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-slate-400">업무 태그</span>
          {items.map((item) => (
            <span key={item.key} className="inline-flex items-center gap-1 text-xs text-slate-500">
              <span className={`h-2 w-2 rounded-full ${item.color}`} />
              {item.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const isRangeRecord = (record) => {
  const isPassmapSource =
    record?.source === "passmap" || record?.source === "passmap-demo";
  const isRangeType =
    record?.recordType === "personal" ||
    record?.recordType === "teamProject" ||
    record?.workType === "개인 업무" ||
    record?.workType === "팀 프로젝트";
  return (
    isPassmapSource &&
    isRangeType &&
    record?.startDate &&
    record?.endDate &&
    record.startDate !== record.endDate
  );
};

const getWeekRangeSegments = (records, weekDays) => {
  const weekStart = weekDays?.[0]?.date;
  const weekEnd = weekDays?.[weekDays.length - 1]?.date;
  if (!weekStart || !weekEnd) return [];
  return (records || [])
    .filter(isRangeRecord)
    .filter((record) => record.startDate <= weekEnd && record.endDate >= weekStart)
    .slice(0, 2)
    .map((record, index) => {
      const segmentStart = record.startDate < weekStart ? weekStart : record.startDate;
      const segmentEnd = record.endDate > weekEnd ? weekEnd : record.endDate;
      const startIndex = weekDays.findIndex((day) => day.date === segmentStart);
      const endIndex = weekDays.findIndex((day) => day.date === segmentEnd);
      if (startIndex < 0 || endIndex < 0) return null;
      return {
        record,
        lane: index,
        startColumn: startIndex + 1,
        endColumn: endIndex + 2,
        isSegmentStart: segmentStart === record.startDate,
        isSegmentEnd: segmentEnd === record.endDate,
      };
    })
    .filter(Boolean);
};

const GENERIC_WORK_TYPES = new Set(["이번 주 기록", "개인 업무", "팀 프로젝트"]);

function getCalendarWorkTypeLabel(type) {
  const safeType = String(type || "").trim();
  if (safeType === "이번 주 기록") return "업무 기록";
  return safeType;
}

function normalizeGoogleCalendarSyncStatus(status) {
  const safeStatus = String(status || "").trim().toLowerCase();
  if (safeStatus === "synced") return "synced";
  if (safeStatus === "failed") return "failed";
  if (!safeStatus || safeStatus === "none") return "pending";
  return "unknown";
}

function getGoogleCalendarSyncStatusLabel(status) {
  const normalized = normalizeGoogleCalendarSyncStatus(status);
  if (normalized === "synced") return "연동 완료";
  if (normalized === "failed") return "연동 실패";
  if (normalized === "pending") return "연동 대기";
  return "확인 필요";
}

function buildGoogleCalendarSyncStatusSummary(records = []) {
  return records.reduce(
    (acc, record) => {
      const status = normalizeGoogleCalendarSyncStatus(record?.googleCalendarSyncStatus);
      if (status === "synced") acc.synced += 1;
      else if (status === "failed") acc.failed += 1;
      else if (status === "pending") acc.pending += 1;
      else acc.unknown += 1;
      acc.total += 1;
      return acc;
    },
    { total: 0, synced: 0, pending: 0, failed: 0, unknown: 0 }
  );
}

function getWorkCalendarWeekDays(dateStr) {
  if (!dateStr) return [];
  const parts = dateStr.split("-").map(Number);
  const ref = new Date(parts[0], parts[1] - 1, parts[2]);
  const dow = ref.getDay();
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(ref);
  monday.setDate(ref.getDate() + diffToMon);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
  });
}

function getWorkCalendarRecordTypeLabel(record) {
  if (record?.source === "passmap-demo") return "예시 기록";
  if (record?.recordType === "personal" || record?.workType === "개인 업무") return "개인 업무";
  if (record?.recordType === "teamProject" || record?.workType === "팀 프로젝트") return "팀 프로젝트";
  return "업무 기록";
}

function formatWorkCalendarPeriod(record) {
  if (record?.startDate && record?.endDate && record.startDate !== record.endDate) {
    return `${record.startDate} ~ ${record.endDate}`;
  }
  return record?.startDate || record?.date || "날짜 미지정";
}

const CALENDAR_VIEW_OPTIONS = [
  { key: "weekly", label: "위클리 뷰", ariaLabel: "선택한 주의 업무 기록을 7일 단위로 보기" },
  { key: "grid", label: "그리드 뷰", ariaLabel: "업무 기록을 월간 캘린더 형태로 보기" },
  { key: "list", label: "리스트 뷰", ariaLabel: "업무 기록을 날짜순 목록으로 보기" },
];

function shiftDateByDays(dateStr, offsetDays) {
  if (!dateStr) return dateStr;
  const parts = dateStr.split("-").map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function todayDateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function shiftMonthBy(ym, delta) {
  const d = new Date(ym.year, ym.month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function monthStartDateKey(ym) {
  return `${ym.year}-${String(ym.month).padStart(2, "0")}-01`;
}

function currentYearMonth() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function toMonthKey(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function recordTouchesMonth(record, year, month) {
  const monthKey = toMonthKey(year, month);
  const dateKey = String(record?.date || "").slice(0, 7);
  const startKey = String(record?.startDate || record?.date || "").slice(0, 7);
  const endKey = String(record?.endDate || record?.startDate || record?.date || "").slice(0, 7);
  if (dateKey === monthKey || startKey === monthKey || endKey === monthKey) return true;
  const startDate = String(record?.startDate || record?.date || "");
  const endDate = String(record?.endDate || record?.startDate || record?.date || "");
  if (!startDate || !endDate) return false;
  const monthStart = `${monthKey}-01`;
  const monthEnd = `${monthKey}-31`;
  return startDate <= monthEnd && endDate >= monthStart;
}

function formatWeekRangeLabel(weekDates) {
  if (!weekDates || weekDates.length < 7) return "";
  const DOW_KO = ["일", "월", "화", "수", "목", "금", "토"];
  const fmt = (dateStr) => {
    const parts = dateStr.split("-").map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return `${parts[1]}.${parts[2]}(${DOW_KO[d.getDay()]})`;
  };
  return `${fmt(weekDates[0])} - ${fmt(weekDates[6])}`;
}

function SummaryMetricCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
      <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">{label}</div>
      <div className="mt-1.5 text-[15px] font-semibold leading-snug text-slate-900 sm:text-[17px]">{value}</div>
    </div>
  );
}

const PASSMAP_WORK_RECORDS_CHANGED_EVENT = "passmap:work-records-changed";

function hdSafeParsePayload(value) {
  try { return JSON.parse(value); } catch { return {}; }
}

function adaptWorkRecordRowForHomeDashboard(row) {
  const raw =
    row.raw_payload && typeof row.raw_payload === "object"
      ? row.raw_payload
      : hdSafeParsePayload(row.raw_payload);

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
    normalizedRecordType = "teamProject";
    normalizedWorkType = "팀 프로젝트";
  }

  const today = todayDateStr();

  return {
    id: String(row.id || ""),
    date: String(row.record_date || raw.date || today),
    source: "supabase",
    recordType: normalizedRecordType,
    workType: normalizedWorkType,
    title: String(row.title || raw.title || raw.task || "").trim() || "업무 기록",
    summary: String(row.description || raw.summary || [row.task, row.result].filter(Boolean).join(" / ") || "").trim(),
    reflectedSentence: String(raw.reflectedSentence || raw.resumeSentence || row.result || "").trim(),
    strengthTags: Array.isArray(row.strength_tags) ? row.strength_tags
      : Array.isArray(raw.strengthTags) ? raw.strengthTags : [],
    workTags: Array.isArray(row.skill_tags) ? row.skill_tags
      : Array.isArray(raw.workTags) ? raw.workTags : [],
    linkedAssetIds: Array.isArray(raw.linkedAssetIds) ? raw.linkedAssetIds : [],
    startDate: String(raw.startDate || raw.start_date || row.record_date || ""),
    endDate: String(raw.endDate || raw.end_date || raw.startDate || row.record_date || ""),
    projectPeriod: String(raw.projectPeriod || ""),
    googleCalendarEventId: row.google_calendar_event_id ?? null,
    googleCalendarSyncStatus: row.google_calendar_sync_status ?? null,
    googleCalendarSyncedAt: row.google_calendar_synced_at ?? null,
    googleCalendarSyncError: row.google_calendar_sync_error ?? null,
  };
}

// CAL-8F-2: awaited Google Calendar event delete before work_record row removal.
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

export default function HomeDashboard({
  onOpenReports = null,
  onOpenRecordInput = null,
  onOpenResumeResult = null,
  onOpenReadiness = null,
  records: recordsProp,
}) {
  const [dbRecords, setDbRecords] = useState([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Notion import panel state (Round 7-E1: status + source selection only)
  const [notionPanelOpen, setNotionPanelOpen] = useState(false);
  const [notionStatus, setNotionStatus] = useState(null);
  const [notionSources, setNotionSources] = useState([]);
  const [notionSelectedSourceId, setNotionSelectedSourceId] = useState(null);
  const [notionLoading, setNotionLoading] = useState(false);
  const [notionError, setNotionError] = useState(null);
  const [notionSchema, setNotionSchema] = useState(null);
  const [notionPropertyMap, setNotionPropertyMap] = useState({
    title: "",
    recordDate: "",
    description: "",
    task: "",
    result: "",
    projectName: "",
    skillTags: "",
    strengthTags: "",
  });
  const [notionPreviewResult, setNotionPreviewResult] = useState(null);
  const [notionCommitResult, setNotionCommitResult] = useState(null);

  // Google Calendar sync UI — hidden unless VITE_GOOGLE_CALENDAR_ENABLED=true (CAL-4B)
  const showGoogleCalendarSync = import.meta.env.VITE_GOOGLE_CALENDAR_ENABLED === "true";
  const [googleCalendarPanelOpen, setGoogleCalendarPanelOpen] = useState(false);
  const [googleCalendarConnecting, setGoogleCalendarConnecting] = useState(false);
  const [googleCalendarError, setGoogleCalendarError] = useState(null);
  const [googleCalendarMessage, setGoogleCalendarMessage] = useState(null);
  const [googleCalendarCreating, setGoogleCalendarCreating] = useState(false);
  const [googleCalendarCreateError, setGoogleCalendarCreateError] = useState(null);
  const [googleCalendarCreateMessage, setGoogleCalendarCreateMessage] = useState(null);
  const [googleCalendarSyncing, setGoogleCalendarSyncing] = useState(false);
  const [googleCalendarSyncError, setGoogleCalendarSyncError] = useState(null);
  const [googleCalendarSyncMessage, setGoogleCalendarSyncMessage] = useState(null);
  const [googleCalendarBackfilling, setGoogleCalendarBackfilling] = useState(false);
  const [googleCalendarBackfillProgress, setGoogleCalendarBackfillProgress] = useState(null);
  const [googleCalendarBackfillMessage, setGoogleCalendarBackfillMessage] = useState("");
  // CAL-8G-1: disconnect state
  const [googleCalendarDisconnecting, setGoogleCalendarDisconnecting] = useState(false);
  const [googleCalendarDisconnectError, setGoogleCalendarDisconnectError] = useState(null);
  const [googleCalendarDisconnectMessage, setGoogleCalendarDisconnectMessage] = useState(null);
  // CAL-8H-1: retry failed state
  const [googleCalendarRetryingFailed, setGoogleCalendarRetryingFailed] = useState(false);
  const [googleCalendarRetryFailedMessage, setGoogleCalendarRetryFailedMessage] = useState(null);
  const [googleCalendarRetryFailedError, setGoogleCalendarRetryFailedError] = useState(null);

  const isNotionRequiredMappingComplete =
    Boolean(notionPropertyMap.title) && Boolean(notionPropertyMap.recordDate);

  const defaultSelectedDate = todayDateStr();
  const [selectedDate, setSelectedDate] = useState(defaultSelectedDate);
  const [currentViewMonth, setCurrentViewMonth] = useState(() => currentYearMonth());
  const [calendarViewMode, setCalendarViewMode] = useState("weekly");
  const [calendarToolsOpen, setCalendarToolsOpen] = useState(false);
  const [dateDetailOpen, setDateDetailOpen] = useState(false);
  const [monthlyAssetOpen, setMonthlyAssetOpen] = useState(false);
  const { toast } = useToast();

  const resolvedRecords = Array.isArray(recordsProp)
    ? recordsProp
    : authChecked && isLoggedIn
      ? dbRecords
      : homeDashboardMock.records;

  const shouldUseDemoRecords = !Array.isArray(recordsProp) && (!authChecked || !isLoggedIn);

  const realToday = todayDateStr();
  const data = {
    ...homeDashboardMock,
    records: resolvedRecords,
    today: realToday,
    calendarMonth: buildCalendarMonthViewModel({
      year: currentViewMonth.year,
      month: currentViewMonth.month,
      today: realToday,
    }),
    calendarLegend: shouldUseDemoRecords ? homeDashboardMock.calendarLegend : [],
  };

  const safeRecords = Array.isArray(data.records) ? data.records : [];
  const currentMonthHasRecords = safeRecords.some((record) =>
    recordTouchesMonth(record, data.calendarMonth.year, data.calendarMonth.month)
  );
  const shouldShowMonthEmptyNotice = !shouldUseDemoRecords && !currentMonthHasRecords;
  const monthEmptyNoticeText = safeRecords.length > 0
    ? "이 달에는 아직 기록이 없습니다. 다른 달로 이동하거나 리스트 뷰에서 전체 기록을 확인하세요."
    : "이 달에는 아직 기록이 없습니다. 오늘 한 일을 기록하면 캘린더에 바로 쌓입니다.";
  // AI 이력서 문장 초안 CTA — 로그인 + 실제 업무기록이 있어야 활성.
  const canTriggerAiResume = !shouldUseDemoRecords && safeRecords.length > 0;

  useEffect(() => {
    if (!supabase) {
      setAuthChecked(true);
      return;
    }
    let cancelled = false;
    async function fetchRecords() {
      try {
        const rows = await listWorkRecords({ limit: 50 });
        if (!cancelled) setDbRecords(rows.map(adaptWorkRecordRowForHomeDashboard));
      } catch (_) {
        if (!cancelled) setDbRecords([]);
      }
    }
    supabase.auth.getUser().then(({ data: authResult }) => {
      if (cancelled) return;
      const user = authResult?.user ?? null;
      setIsLoggedIn(Boolean(user));
      setAuthChecked(true);
      if (user) fetchRecords();
    }).catch(() => {
      if (!cancelled) {
        setIsLoggedIn(false);
        setAuthChecked(true);
      }
    });
    let sub = null;
    try {
      sub = onAuthStateChange((event, session) => {
        if (cancelled) return;
        const user = session?.user ?? null;
        setIsLoggedIn(Boolean(user));
        setAuthChecked(true);
        if (event === "SIGNED_IN" && user) {
          fetchRecords();
        } else if (event === "SIGNED_OUT") {
          setDbRecords([]);
        }
      });
    } catch (_) {}
    const handleWorkRecordsChanged = () => { fetchRecords(); };
    window.addEventListener(PASSMAP_WORK_RECORDS_CHANGED_EVENT, handleWorkRecordsChanged);
    return () => {
      cancelled = true;
      window.removeEventListener(PASSMAP_WORK_RECORDS_CHANGED_EVENT, handleWorkRecordsChanged);
      try { sub?.unsubscribe?.(); } catch (_) {}
    };
  }, []);

  const handleCalendarExport = () => {
    const success = downloadPassmapCalendarIcs(data.records);
    if (success) {
      toast({ title: "캘린더 파일을 다운로드했습니다.", description: "Google Calendar에서 가져오기로 추가할 수 있어요." });
    } else {
      toast({ title: "내보낼 기록이 아직 없습니다.", variant: "destructive" });
    }
  };

  const handleDeleteWorkRecord = async (record) => {
    if (!isLoggedIn) return;
    const recordId = record?.id;
    if (!recordId) return;
    const confirmed = window.confirm("이 기록을 삭제할까요?\n삭제한 기록은 되돌릴 수 없습니다.\nGoogle Calendar에 추가된 일정도 함께 삭제를 시도합니다.\n단, Calendar 삭제에 실패하면 일정이 남을 수 있습니다.");
    if (!confirmed) return;
    try {
      await deleteGoogleCalendarEventForWorkRecord(recordId);
      await deleteWorkRecord(recordId);
      window.dispatchEvent(new CustomEvent(PASSMAP_WORK_RECORDS_CHANGED_EVENT));
      toast({ title: "기록을 삭제했습니다." });
    } catch (_) {
      toast({ title: "기록을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.", variant: "destructive" });
    }
  };

  const getWorkerBase = () => {
    // Notion endpoints are owned by the Worker and must not fall back to Vercel.
    const base = (import.meta.env.VITE_AI_PROXY_URL || "").toString().trim();
    if (!base) {
      throw new Error("Notion 연동용 Worker URL이 설정되어 있지 않습니다. VITE_AI_PROXY_URL을 확인해 주세요.");
    }
    return base.replace(/\/$/, "");
  };

  const handleNotionImportClick = async () => {
    setNotionPanelOpen(true);
    setNotionLoading(true);
    setNotionError(null);
    setNotionSources([]);
    setNotionSelectedSourceId(null);
    setNotionSchema(null);
    setNotionPropertyMap({ title: "", recordDate: "", description: "", task: "", result: "", projectName: "", skillTags: "", strengthTags: "" });
    setNotionPreviewResult(null);
    setNotionCommitResult(null);

    let workerBase;
    try {
      workerBase = getWorkerBase();
    } catch (err) {
      setNotionLoading(false);
      setNotionError(err.message || "Worker URL이 설정되어 있지 않습니다. .env.local에 VITE_AI_PROXY_URL을 설정해 주세요.");
      return;
    }

    let accessToken = null;
    try {
      const session = await getSession();
      accessToken = session?.access_token ?? null;
    } catch (_) {
      accessToken = null;
    }
    if (!accessToken) {
      setNotionLoading(false);
      setNotionError("로그인 세션을 확인할 수 없습니다. 다시 로그인해 주세요.");
      return;
    }

    try {
      const statusRes = await fetch(`${workerBase}/api/notion/status`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!statusRes.ok) throw new Error(`상태 확인 실패 (${statusRes.status})`);
      const statusData = await statusRes.json();
      setNotionStatus(statusData);

      if (!statusData.connected) {
        setNotionLoading(false);
        return;
      }

      const sourcesRes = await fetch(`${workerBase}/api/notion/sources`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!sourcesRes.ok) throw new Error(`소스 목록 조회 실패 (${sourcesRes.status})`);
      const sourcesData = await sourcesRes.json();
      setNotionSources(Array.isArray(sourcesData.sources) ? sourcesData.sources : []);
    } catch (err) {
      setNotionError(err.message || "Notion 연결 확인 중 오류가 발생했습니다.");
    } finally {
      setNotionLoading(false);
    }
  };

  const handleNotionAuthUrlClick = async () => {
    let workerBase;
    try {
      workerBase = getWorkerBase();
    } catch (err) {
      setNotionError(err.message || "Notion 가져오기 서버 주소를 확인할 수 없습니다. 배포 환경변수 VITE_AI_PROXY_URL 설정을 확인해 주세요.");
      return;
    }
    let accessToken = null;
    try {
      const session = await getSession();
      accessToken = session?.access_token ?? null;
    } catch (_) {
      accessToken = null;
    }
    if (!accessToken) {
      setNotionError("로그인 세션을 확인할 수 없습니다. 다시 로그인해 주세요.");
      return;
    }
    try {
      const res = await fetch(`${workerBase}/api/notion/auth-url`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error(`인증 URL 요청 실패 (${res.status})`);
      const data = await res.json();
      if (data.authUrl) {
        window.open(data.authUrl, "_blank", "noopener,noreferrer");
      } else {
        setNotionError("Notion 인증 URL을 받지 못했습니다.");
      }
    } catch (err) {
      setNotionError(err.message || "Notion 연결 URL 요청 중 오류가 발생했습니다.");
    }
  };

  // CAL-5C-HELPER: Google Calendar OAuth connect/start — dev/hidden flag only
  const handleGoogleCalendarConnectStart = async () => {
    setGoogleCalendarConnecting(true);
    setGoogleCalendarError(null);
    setGoogleCalendarMessage(null);
    let workerBase;
    try {
      workerBase = getWorkerBase();
    } catch (_) {
      setGoogleCalendarError("Google Calendar 연결에 실패했습니다. 다시 시도해 주세요.");
      setGoogleCalendarConnecting(false);
      return;
    }
    let accessToken = null;
    try {
      const session = await getSession();
      accessToken = session?.access_token ?? null;
    } catch (_) {
      accessToken = null;
    }
    if (!accessToken) {
      setGoogleCalendarError("로그인이 필요합니다.");
      setGoogleCalendarConnecting(false);
      return;
    }
    try {
      const res = await fetch(`${workerBase}/api/calendar/google/connect/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setGoogleCalendarError("Google Calendar 연결에 실패했습니다. 다시 시도해 주세요.");
        setGoogleCalendarConnecting(false);
        return;
      }
      if (json.authUrl) {
        setGoogleCalendarMessage("Google 동의 화면을 열었습니다.");
        window.open(json.authUrl, "_blank", "noopener,noreferrer");
      } else {
        setGoogleCalendarError("Google Calendar 연결에 실패했습니다. 다시 시도해 주세요.");
      }
    } catch (_) {
      setGoogleCalendarError("Google Calendar 연결에 실패했습니다. 다시 시도해 주세요.");
    }
    setGoogleCalendarConnecting(false);
  };

  // CAL-8G-1: Google Calendar disconnect handler — dev/hidden panel only
  const handleGoogleCalendarDisconnect = async () => {
    const confirmed = window.confirm(
      "Google Calendar 연동을 해제할까요?\n앞으로 PASSMAP 기록은 Google Calendar에 자동 동기화되지 않습니다.\n이미 생성된 Google Calendar 일정은 삭제되지 않습니다."
    );
    if (!confirmed) return;
    setGoogleCalendarDisconnecting(true);
    setGoogleCalendarDisconnectError(null);
    setGoogleCalendarDisconnectMessage(null);
    let workerBase;
    try {
      workerBase = getWorkerBase();
    } catch (_) {
      setGoogleCalendarDisconnectError("연동 해제에 실패했습니다. 다시 시도해 주세요.");
      setGoogleCalendarDisconnecting(false);
      return;
    }
    let accessToken = null;
    try {
      const session = await getSession();
      accessToken = session?.access_token ?? null;
    } catch (_) {}
    if (!accessToken) {
      setGoogleCalendarDisconnectError("연동 해제에 실패했습니다. 다시 시도해 주세요.");
      setGoogleCalendarDisconnecting(false);
      return;
    }
    try {
      const res = await fetch(`${workerBase}/api/calendar/google/disconnect`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      const resJson = await res.json();
      if (!res.ok || !resJson.ok) {
        setGoogleCalendarDisconnectError("연동 해제에 실패했습니다. 다시 시도해 주세요.");
        setGoogleCalendarDisconnecting(false);
        return;
      }
      setGoogleCalendarDisconnectMessage("Google Calendar 연동을 해제했습니다. 기존 일정은 유지됩니다.");
    } catch (_) {
      setGoogleCalendarDisconnectError("연동 해제에 실패했습니다. 다시 시도해 주세요.");
    }
    setGoogleCalendarDisconnecting(false);
  };

  // CAL-8H-1: retry failed records — dev/hidden panel only
  const handleGoogleCalendarRetryFailedRecords = async () => {
    setGoogleCalendarRetryingFailed(true);
    setGoogleCalendarRetryFailedError(null);
    setGoogleCalendarRetryFailedMessage(null);
    let workerBase;
    try {
      workerBase = getWorkerBase();
    } catch (_) {
      setGoogleCalendarRetryFailedError("연동 실패 기록 재시도에 실패했습니다. 다시 시도해 주세요.");
      setGoogleCalendarRetryingFailed(false);
      return;
    }
    let accessToken = null;
    try {
      const session = await getSession();
      accessToken = session?.access_token ?? null;
    } catch (_) {}
    if (!accessToken) {
      setGoogleCalendarRetryFailedError("연동 실패 기록 재시도에 실패했습니다. 다시 시도해 주세요.");
      setGoogleCalendarRetryingFailed(false);
      return;
    }
    try {
      const res = await fetch(`${workerBase}/api/calendar/google/retry-failed-records`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      const resJson = await res.json();
      if (!res.ok || !resJson.ok) {
        setGoogleCalendarRetryFailedError("연동 실패 기록 재시도에 실패했습니다. 다시 시도해 주세요.");
        setGoogleCalendarRetryingFailed(false);
        return;
      }
      const { synced = 0, failed = 0, skipped = 0 } = resJson;
      setGoogleCalendarRetryFailedMessage(
        `연동 실패 기록 재시도를 완료했습니다. 성공 ${synced}건 · 실패 ${failed}건 · 건너뜀 ${skipped}건`
      );
      if (synced > 0) {
        window.dispatchEvent(new CustomEvent(PASSMAP_WORK_RECORDS_CHANGED_EVENT));
      }
    } catch (_) {
      setGoogleCalendarRetryFailedError("연동 실패 기록 재시도에 실패했습니다. 다시 시도해 주세요.");
    }
    setGoogleCalendarRetryingFailed(false);
  };

  // CAL-6C-HELPER: PASSMAP 전용 Google Calendar 생성 — dev/hidden flag only
  const handleGoogleCalendarCreatePassmapCalendar = async () => {
    setGoogleCalendarCreating(true);
    setGoogleCalendarCreateError(null);
    setGoogleCalendarCreateMessage(null);
    let workerBase;
    try {
      workerBase = getWorkerBase();
    } catch (err) {
      setGoogleCalendarCreateError(err.message || "Worker URL이 설정되어 있지 않습니다. VITE_AI_PROXY_URL을 확인해 주세요.");
      setGoogleCalendarCreating(false);
      return;
    }
    let accessToken = null;
    try {
      const session = await getSession();
      accessToken = session?.access_token ?? null;
    } catch (_) {
      accessToken = null;
    }
    if (!accessToken) {
      setGoogleCalendarCreateError("로그인이 필요합니다.");
      setGoogleCalendarCreating(false);
      return;
    }
    try {
      const res = await fetch(`${workerBase}/api/calendar/google/create-passmap-calendar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const resJson = await res.json();
      if (!res.ok || !resJson.ok) {
        setGoogleCalendarCreateError("캘린더 준비에 실패했습니다. 다시 시도해 주세요.");
        setGoogleCalendarCreating(false);
        return;
      }
      if (resJson.created) {
        setGoogleCalendarCreateMessage("Google Calendar에 'PASSMAP 기록' 캘린더를 만들었습니다.");
      } else {
        setGoogleCalendarCreateMessage("캘린더가 준비되었습니다.");
      }
    } catch (_) {
      setGoogleCalendarCreateError("캘린더 준비에 실패했습니다. 다시 시도해 주세요.");
    }
    setGoogleCalendarCreating(false);
  };

  // CAL-7C: sync-record test — dev/hidden flag only
  const handleGoogleCalendarSyncRecord = async () => {
    const selectedRecordId = activeEntry?.records?.[0]?.id || null;
    if (!selectedRecordId) {
      setGoogleCalendarSyncError("먼저 기록을 선택해 주세요.");
      return;
    }
    setGoogleCalendarSyncing(true);
    setGoogleCalendarSyncError(null);
    setGoogleCalendarSyncMessage(null);
    let workerBase;
    try {
      workerBase = getWorkerBase();
    } catch (err) {
      setGoogleCalendarSyncError(err.message || "Worker URL이 설정되어 있지 않습니다. VITE_AI_PROXY_URL을 확인해 주세요.");
      setGoogleCalendarSyncing(false);
      return;
    }
    let accessToken = null;
    try {
      const session = await getSession();
      accessToken = session?.access_token ?? null;
    } catch (_) {
      accessToken = null;
    }
    if (!accessToken) {
      setGoogleCalendarSyncError("로그인이 필요합니다.");
      setGoogleCalendarSyncing(false);
      return;
    }
    try {
      const res = await fetch(`${workerBase}/api/calendar/google/sync-record`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recordId: selectedRecordId }),
      });
      const resJson = await res.json();
      if (!res.ok || !resJson.ok) {
        setGoogleCalendarSyncError(`Google Calendar 동기화에 실패했습니다: ${resJson.error ?? res.status}`);
        setGoogleCalendarSyncing(false);
        return;
      }
      if (resJson.skipped) {
        setGoogleCalendarSyncMessage("이미 동기화된 기록입니다.");
      } else {
        setGoogleCalendarSyncMessage("Google Calendar에 기록을 추가했습니다.");
        window.dispatchEvent(new CustomEvent(PASSMAP_WORK_RECORDS_CHANGED_EVENT));
      }
    } catch (err) {
      setGoogleCalendarSyncError(err.message || "Google Calendar 동기화에 실패했습니다.");
    }
    setGoogleCalendarSyncing(false);
  };

  // CAL-8B: backfill — sequentially syncs all currently-loaded records (max 50)
  const handleGoogleCalendarBackfill = async () => {
    const targetRecords = safeRecords.filter((r) => r?.id).slice(0, 50);
    if (!targetRecords.length) {
      setGoogleCalendarBackfillMessage("동기화할 기록이 없습니다.");
      return;
    }
    setGoogleCalendarBackfilling(true);
    setGoogleCalendarBackfillProgress({ done: 0, total: targetRecords.length, synced: 0, skipped: 0, failed: 0 });
    setGoogleCalendarBackfillMessage("");
    let workerBase;
    try {
      workerBase = getWorkerBase();
    } catch (err) {
      setGoogleCalendarBackfillMessage(err.message || "Worker URL이 설정되어 있지 않습니다. VITE_AI_PROXY_URL을 확인해 주세요.");
      setGoogleCalendarBackfilling(false);
      return;
    }
    let accessToken = null;
    try {
      const session = await getSession();
      accessToken = session?.access_token ?? null;
    } catch (_) {
      accessToken = null;
    }
    if (!accessToken) {
      setGoogleCalendarBackfillMessage("로그인이 필요합니다.");
      setGoogleCalendarBackfilling(false);
      return;
    }
    let synced = 0;
    let skipped = 0;
    let failed = 0;
    for (const record of targetRecords) {
      try {
        const res = await fetch(`${workerBase}/api/calendar/google/sync-record`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ recordId: record.id }),
        });
        const resJson = await res.json();
        if (!res.ok || !resJson.ok) {
          failed++;
        } else if (resJson.skipped) {
          skipped++;
        } else {
          synced++;
        }
      } catch (_) {
        failed++;
      }
      const done = synced + skipped + failed;
      setGoogleCalendarBackfillProgress({ done, total: targetRecords.length, synced, skipped, failed });
    }
    setGoogleCalendarBackfillMessage(`완료: ${synced}건 동기화, ${skipped}건 건너뜀, ${failed}건 실패`);
    if (synced > 0) {
      window.dispatchEvent(new CustomEvent(PASSMAP_WORK_RECORDS_CHANGED_EVENT));
    }
    setGoogleCalendarBackfilling(false);
  };

  const handleNotionLoadSchema = async () => {
    if (!notionSelectedSourceId) {
      setNotionError("데이터 소스를 먼저 선택해 주세요.");
      return;
    }
    let workerBase;
    try {
      workerBase = getWorkerBase();
    } catch (err) {
      setNotionError(err.message || "Notion 가져오기 서버 주소를 확인할 수 없습니다. 배포 환경변수 VITE_AI_PROXY_URL 설정을 확인해 주세요.");
      return;
    }
    let accessToken = null;
    try {
      const session = await getSession();
      accessToken = session?.access_token ?? null;
    } catch (_) {
      accessToken = null;
    }
    if (!accessToken) {
      setNotionError("로그인 세션을 확인할 수 없습니다. 다시 로그인해 주세요.");
      return;
    }
    setNotionLoading(true);
    setNotionError(null);
    setNotionSchema(null);
    setNotionPreviewResult(null);
    setNotionCommitResult(null);
    try {
      const res = await fetch(
        `${workerBase}/api/notion/source-schema?data_source_id=${encodeURIComponent(notionSelectedSourceId)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok) throw new Error(`스키마 조회 실패 (${res.status})`);
      const schemaData = await res.json();
      if (!schemaData.ok) throw new Error(schemaData.error || "스키마 조회에 실패했습니다.");
      setNotionSchema(schemaData);
      const props = Array.isArray(schemaData.properties) ? schemaData.properties : [];
      const titleProp = props.find((p) => p.type === "title");
      const dateProp = props.find((p) => p.type === "date");
      setNotionPropertyMap((prev) => ({
        ...prev,
        title: titleProp?.name ?? prev.title,
        recordDate: dateProp?.name ?? prev.recordDate,
      }));
    } catch (err) {
      setNotionError(err.message || "스키마 조회 중 오류가 발생했습니다.");
    } finally {
      setNotionLoading(false);
    }
  };

  const handleNotionPreview = async () => {
    if (!isNotionRequiredMappingComplete) {
      setNotionError("제목과 날짜 속성을 먼저 선택해 주세요.");
      return;
    }
    if (!notionSelectedSourceId) {
      setNotionError("데이터 소스를 먼저 선택해 주세요.");
      return;
    }
    let workerBase;
    try {
      workerBase = getWorkerBase();
    } catch (err) {
      setNotionError(err.message || "Notion 가져오기 서버 주소를 확인할 수 없습니다. 배포 환경변수 VITE_AI_PROXY_URL 설정을 확인해 주세요.");
      return;
    }
    let accessToken = null;
    try {
      const session = await getSession();
      accessToken = session?.access_token ?? null;
    } catch (_) {
      accessToken = null;
    }
    if (!accessToken) {
      setNotionError("로그인 세션을 확인할 수 없습니다. 다시 로그인해 주세요.");
      return;
    }
    setNotionLoading(true);
    setNotionError(null);
    setNotionPreviewResult(null);
    setNotionCommitResult(null);
    try {
      const cleanPropertyMap = Object.fromEntries(
        Object.entries(notionPropertyMap).filter(([, v]) => Boolean(v))
      );
      const res = await fetch(`${workerBase}/api/notion/preview`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dataSourceId: notionSelectedSourceId,
          propertyMap: cleanPropertyMap,
          defaults: {
            recordType: "weekly",
            workType: "이번 주 기록",
          },
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `미리보기 요청 실패 (${res.status})`);
      }
      const previewData = await res.json();
      if (!previewData.ok) throw new Error(previewData.error || "미리보기 조회에 실패했습니다.");
      setNotionPreviewResult(previewData);
    } catch (err) {
      setNotionError(err.message || "미리보기 조회 중 오류가 발생했습니다.");
    } finally {
      setNotionLoading(false);
    }
  };

  const handleNotionCommit = async () => {
    if (!notionPreviewResult) return;
    const selectedPreviewIds = notionPreviewResult.items
      .filter((item) => item.commitEligible)
      .map((item) => item.previewId)
      .filter(Boolean);
    if (selectedPreviewIds.length === 0) {
      setNotionError("저장 가능한 새 기록이 없습니다.");
      return;
    }
    let workerBase;
    try {
      workerBase = getWorkerBase();
    } catch (err) {
      setNotionError(err.message || "Notion 가져오기 서버 주소를 확인할 수 없습니다. 배포 환경변수 VITE_AI_PROXY_URL 설정을 확인해 주세요.");
      return;
    }
    let accessToken = null;
    try {
      const session = await getSession();
      accessToken = session?.access_token ?? null;
    } catch (_) {
      accessToken = null;
    }
    if (!accessToken) {
      setNotionError("로그인 세션을 확인할 수 없습니다. 다시 로그인해 주세요.");
      return;
    }
    setNotionLoading(true);
    setNotionError(null);
    try {
      const cleanPropertyMap = Object.fromEntries(
        Object.entries(notionPropertyMap).filter(([, v]) => Boolean(v))
      );
      const res = await fetch(`${workerBase}/api/notion/commit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dataSourceId: notionSelectedSourceId,
          propertyMap: cleanPropertyMap,
          defaults: {
            recordType: "weekly",
            workType: "이번 주 기록",
          },
          selectedPreviewIds,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `가져오기 요청 실패 (${res.status})`);
      }
      const commitData = await res.json();
      if (!commitData.ok) throw new Error(commitData.error || "가져오기에 실패했습니다.");
      setNotionCommitResult(commitData);
      if ((commitData.summary?.committed ?? 0) > 0) {
        window.dispatchEvent(new CustomEvent("passmap:work-records-changed"));
      }
    } catch (err) {
      setNotionError(err.message || "가져오기 중 오류가 발생했습니다.");
    } finally {
      setNotionLoading(false);
    }
  };

  const handleMoveMonth = (delta) => {
    const nextMonth = shiftMonthBy(currentViewMonth, delta);
    setCurrentViewMonth(nextMonth);
    setSelectedDate(monthStartDateKey(nextMonth));
  };

  const handleGoToday = () => {
    setCurrentViewMonth(currentYearMonth());
    setSelectedDate(todayDateStr());
  };

  const entriesByDate = useMemo(() => buildCalendarEntriesByDate(data.records), [data.records]);
  const weekDates = useMemo(() => getWorkCalendarWeekDays(selectedDate), [selectedDate]);
  const sortedAllRecords = useMemo(
    () =>
      [...(shouldUseDemoRecords ? PASSMAP_DEMO_RANGE_RECORDS : []), ...data.records].sort((a, b) => {
        const aDate = a.startDate || a.date || "";
        const bDate = b.startDate || b.date || "";
        return aDate < bDate ? -1 : aDate > bDate ? 1 : 0;
      }),
    [data.records, shouldUseDemoRecords]
  );
  const activeEntry = useMemo(() => entriesByDate[selectedDate] || null, [entriesByDate, selectedDate]);
  const googleCalendarSyncStatusSummary = useMemo(
    () => buildGoogleCalendarSyncStatusSummary(safeRecords),
    [safeRecords]
  );
  const googleCalendarStatusRecord = activeEntry?.records?.[0] || safeRecords[0] || null;
  const googleCalendarStatusLabel = googleCalendarStatusRecord
    ? getGoogleCalendarSyncStatusLabel(googleCalendarStatusRecord.googleCalendarSyncStatus)
    : "확인할 기록 없음";
  const calendarSummary = useMemo(
    () =>
      deriveCalendarSummary({
        records: data.records,
        selectedDate,
        today: data.today,
      }),
    [data.records, selectedDate, data.today]
  );
  const actionStatus = useMemo(
    () =>
      deriveHomeActionStatus({
        records: data.records,
        today: data.today,
      }),
    [data.records, data.today]
  );
  const monthlyAssetSummary = useMemo(() => deriveMonthlyAssetSummary(data.records), [data.records]);

  const activeDateLabel = useMemo(() => {
    const date = new Date(`${selectedDate}T00:00:00`);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  }, [selectedDate]);
  const activeEntryRecordCount = activeEntry?.records?.length || 0;
  const activeEntryPrimaryTask =
    activeEntry?.tasks?.[0] ||
    activeEntry?.records?.[0]?.title ||
    activeEntry?.records?.[0]?.summary ||
    getCalendarWorkTypeLabel(activeEntry?.records?.[0]?.workType) ||
    getCalendarWorkTypeLabel(activeEntry?.workTypes?.[0]) ||
    "업무 기록";
  const activeEntryWorkTypes = activeEntry?.workTypes?.length
    ? activeEntry.workTypes
    : [activeEntry?.records?.[0]?.workType].filter(Boolean);
  const activeEntrySpecificWorkTypes = activeEntryWorkTypes.filter((type) => !GENERIC_WORK_TYPES.has(type));
  const activeEntryVisibleWorkTypes = (activeEntrySpecificWorkTypes.length ? activeEntrySpecificWorkTypes : activeEntryWorkTypes).slice(0, 2);
  const activeEntryExtraWorkTypeCount = Math.max(0, activeEntryWorkTypes.length - activeEntryVisibleWorkTypes.length);

  return (
    <div className="space-y-4">
      <Card className="rounded-3xl border border-slate-200 bg-white/95 shadow-sm">
        <CardHeader className="space-y-2 border-b border-slate-100 bg-slate-50/80 pb-3 sm:space-y-4 sm:pb-6">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 sm:px-2.5 sm:py-1 sm:text-[13px]">
              #업무 관리
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-500 sm:px-2.5 sm:py-1 sm:text-[13px]">
              #경험 기록
            </span>
          </div>

          <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-[22px] leading-tight tracking-tight text-slate-950 sm:text-[30px]">경험 정리 대시보드</CardTitle>
              <p className="max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">이번 주에 기록한 업무가 어떻게 경험 자산과 이력서 문장으로 이어지는지 확인합니다.</p>
            </div>

            <div className="flex flex-wrap gap-1.5 xl:justify-end">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-full border-primary/20 bg-primary/5 px-3 text-sm text-primary shadow-sm hover:bg-primary/10 hover:text-primary sm:h-9 sm:px-4 sm:text-[15px]"
                onClick={onOpenRecordInput ? () => onOpenRecordInput({ date: selectedDate }) : undefined}
              >
                경험 정리하기
              </Button>
              <Button variant="outline" size="sm" className="h-8 rounded-full border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm hover:bg-slate-50 sm:h-9 sm:px-4 sm:text-[15px]" onClick={onOpenResumeResult || undefined}>
                이력서 보기
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 p-3 sm:p-5">
          <div className="grid gap-2 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
            {actionStatus.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
                <div className="text-sm font-medium leading-snug text-slate-600 sm:text-[17px]">{item.title}</div>
                <div className={item.compactValue ? "mt-2 text-sm font-semibold leading-relaxed text-slate-950 sm:text-base" : "mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl"}>
                  {item.value}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-[15px]">{item.note}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px]">
            <Card className="min-w-0 rounded-2xl border-slate-200 shadow-none">
              <CardHeader className="pb-3">
                <SectionHeader
                  title="업무관리 캘린더"
                  description="기록된 업무를 주간·월간·목록 형태로 확인하고, 이력서에 남길 경험을 빠르게 점검합니다."
                  action={
                    <div className="relative flex flex-col items-end gap-1">
                      <button
                        type="button"
                        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                        onClick={() => setCalendarToolsOpen(v => !v)}
                      >
                        불러오기/내보내기
                        <ChevronDown className={`h-3 w-3 transition-transform ${calendarToolsOpen ? "rotate-180" : ""}`} />
                      </button>
                      {calendarToolsOpen && (
                        <div className="absolute right-0 top-full z-20 mt-1 flex flex-col gap-0.5 rounded-xl border border-slate-200 bg-white p-1.5 shadow-md min-w-[180px]">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="justify-start rounded-lg text-xs text-slate-600 hover:bg-slate-100"
                            onClick={handleNotionImportClick}
                          >
                            Notion에서 가져오기
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="justify-start rounded-lg text-xs text-slate-600 hover:bg-slate-100"
                            onClick={handleCalendarExport}
                          >
                            캘린더 파일(.ics) 다운로드
                          </Button>
                          {showGoogleCalendarSync && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="justify-start rounded-lg text-xs text-slate-600 hover:bg-slate-100"
                              onClick={() => setGoogleCalendarPanelOpen(prev => !prev)}
                            >
                              {googleCalendarPanelOpen ? "Google Calendar 설정 닫기" : "Google Calendar 설정"}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  }
                />
              </CardHeader>
              <CardContent className="space-y-4">
                {notionPanelOpen && (
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 space-y-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-indigo-900">Notion 기록 가져오기</p>
                      <p className="text-xs text-indigo-700 leading-relaxed">
                        Notion에 쌓아둔 업무 기록을 PASSMAP 커리어 기록으로 가져오기 위한 준비 단계입니다.
                        이번 단계에서는 연결 상태와 가져올 Notion 데이터 소스만 확인합니다.
                      </p>
                    </div>
                    {notionLoading && (
                      <p className="text-xs text-indigo-600">Notion 연결 상태를 확인하는 중...</p>
                    )}
                    {notionError && (
                      <p className="text-xs text-red-600">{notionError}</p>
                    )}
                    {!notionLoading && notionStatus && !notionStatus.connected && (
                      <div className="space-y-2">
                        <p className="text-xs text-indigo-800">
                          Notion 연결이 필요합니다. 연결 후 이 화면으로 돌아와 &quot;상태 다시 확인&quot;을 눌러주세요.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full text-xs border-indigo-300 text-indigo-700 hover:bg-indigo-100"
                            onClick={handleNotionAuthUrlClick}
                          >
                            Notion 연결하기
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full text-xs"
                            onClick={handleNotionImportClick}
                          >
                            상태 다시 확인
                          </Button>
                        </div>
                      </div>
                    )}
                    {!notionLoading && notionStatus?.connected && (
                      <div className="space-y-2">
                        <p className="text-xs text-indigo-800">
                          연결된 Notion 워크스페이스에서 가져올 데이터 소스를 선택해 주세요.
                        </p>
                        {notionSources.length === 0 && (
                          <p className="text-xs text-slate-500">가져올 수 있는 데이터 소스가 없습니다.</p>
                        )}
                        {notionSources.length > 0 && (
                          <div className="space-y-1">
                            {notionSources.map((src) => {
                              const srcId = src.dataSourceId || src.id;
                              const isDisabled = src.schemaReadable === false;
                              const isSelected = notionSelectedSourceId === srcId;
                              return (
                                <button
                                  key={srcId}
                                  type="button"
                                  disabled={isDisabled}
                                  onClick={() => !isDisabled && setNotionSelectedSourceId(srcId)}
                                  className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition
                                    ${isDisabled
                                      ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                                      : isSelected
                                        ? "border-indigo-400 bg-indigo-100 text-indigo-900"
                                        : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
                                    }`}
                                >
                                  <span className="font-medium">{src.title || srcId}</span>
                                  {isDisabled && (
                                    <span className="ml-2 text-[10px] text-slate-400">스키마를 읽을 수 없는 항목</span>
                                  )}
                                  {!isDisabled && (
                                    <span className="ml-2 text-[10px] text-slate-400">{srcId}</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                    {notionSchema && !notionLoading && (
                      <div className="space-y-3 border-t border-indigo-100 pt-3">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-indigo-900">속성 매핑 설정</p>
                          <p className="text-xs text-indigo-700 leading-relaxed">
                            선택한 Notion 데이터 소스의 속성을 PASSMAP 커리어 기록 항목에 연결합니다.
                            이번 단계에서는 어떤 Notion 속성을 제목, 날짜, 업무 내용으로 사용할지만 정합니다.
                          </p>
                          <p className="text-[10px] text-indigo-600">
                            제목과 날짜는 가져오기 미리보기에 반드시 필요합니다.
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-medium text-slate-400">
                            감지된 속성 ({(notionSchema.properties || []).length}개)
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {(notionSchema.properties || []).slice(0, 12).map((p) => (
                              <span
                                key={p.id ?? p.name}
                                className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-600"
                              >
                                {p.name}
                                <span className="text-slate-400">({p.type})</span>
                              </span>
                            ))}
                            {(notionSchema.properties || []).length > 12 && (
                              <span className="text-[10px] text-slate-400">
                                +{(notionSchema.properties || []).length - 12}개
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          {[
                            { fieldKey: "title",        label: "제목",       required: true,  preferredTypes: ["title", "rich_text"] },
                            { fieldKey: "recordDate",   label: "날짜",       required: true,  preferredTypes: ["date"] },
                            { fieldKey: "description",  label: "설명",       required: false, preferredTypes: ["rich_text"] },
                            { fieldKey: "task",         label: "업무 내용",  required: false, preferredTypes: ["rich_text"] },
                            { fieldKey: "result",       label: "성과/결과",  required: false, preferredTypes: ["rich_text"] },
                            { fieldKey: "projectName",  label: "프로젝트명", required: false, preferredTypes: ["rich_text", "select"] },
                            { fieldKey: "skillTags",    label: "스킬 태그",  required: false, preferredTypes: ["multi_select", "select"] },
                            { fieldKey: "strengthTags", label: "강점 태그",  required: false, preferredTypes: ["multi_select", "select"] },
                          ].map(({ fieldKey, label, required, preferredTypes }) => {
                            const currentVal = notionPropertyMap[fieldKey];
                            const currentProp = (notionSchema.properties || []).find((p) => p.name === currentVal);
                            const typeMismatch = currentProp && !preferredTypes.includes(currentProp.type);
                            return (
                              <div key={fieldKey} className="flex items-center gap-2">
                                <label className="w-20 shrink-0 text-[10px] font-medium text-slate-600">
                                  {label}
                                  {required && <span className="ml-0.5 text-red-400">*</span>}
                                </label>
                                <select
                                  value={currentVal}
                                  onChange={(e) =>
                                    setNotionPropertyMap((prev) => ({ ...prev, [fieldKey]: e.target.value }))
                                  }
                                  className="flex-1 rounded border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-700 focus:border-indigo-400 focus:outline-none"
                                >
                                  <option value="">매핑 안 함</option>
                                  {(notionSchema.properties || []).map((p) => (
                                    <option key={p.id ?? p.name} value={p.name}>
                                      {p.name} ({p.type}){preferredTypes.includes(p.type) ? " ★" : ""}
                                    </option>
                                  ))}
                                </select>
                                {typeMismatch && (
                                  <span className="text-[9px] text-amber-500 shrink-0">타입 불일치</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {notionPropertyMap.title && notionPropertyMap.recordDate ? (
                          <p className="text-[10px] text-emerald-600">필수 매핑 완료</p>
                        ) : (
                          <p className="text-[10px] text-amber-600">제목과 날짜 속성은 반드시 선택해야 합니다</p>
                        )}
                      </div>
                    )}
                    {notionPreviewResult && !notionLoading && (
                      <div className="space-y-3 border-t border-indigo-100 pt-3">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-indigo-900">가져오기 미리보기</p>
                          <p className="text-xs text-indigo-700 leading-relaxed">
                            선택한 Notion 기록을 PASSMAP 커리어 기록으로 가져오기 전에 미리 확인합니다.
                            아직 저장되지는 않습니다.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {notionPreviewResult.summary.total > 0 && (
                            <span className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-600">
                              전체 {notionPreviewResult.summary.total}건
                            </span>
                          )}
                          {notionPreviewResult.summary.new > 0 && (
                            <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">
                              신규 {notionPreviewResult.summary.new}건
                            </span>
                          )}
                          {notionPreviewResult.summary.duplicate > 0 && (
                            <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-500">
                              이미 가져옴 {notionPreviewResult.summary.duplicate}건
                            </span>
                          )}
                          {notionPreviewResult.summary.pendingUpdate > 0 && (
                            <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700">
                              업데이트 필요 {notionPreviewResult.summary.pendingUpdate}건
                            </span>
                          )}
                          {notionPreviewResult.summary.invalid > 0 && (
                            <span className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] text-red-600">
                              가져올 수 없음 {notionPreviewResult.summary.invalid}건
                            </span>
                          )}
                          {notionPreviewResult.summary.previouslyImportedDeleted > 0 && (
                            <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] text-slate-400">
                              이전 기록 삭제됨 {notionPreviewResult.summary.previouslyImportedDeleted}건
                            </span>
                          )}
                          {!notionCommitResult && notionPreviewResult.items.filter((i) => i.commitEligible).length > 0 && (
                            <span className="rounded border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                              저장 가능 {notionPreviewResult.items.filter((i) => i.commitEligible).length}건
                            </span>
                          )}
                        </div>
                        {Array.isArray(notionPreviewResult.items) && notionPreviewResult.items.length > 0 && (
                          <div className="max-h-52 space-y-1 overflow-y-auto">
                            {notionPreviewResult.items.map((item) => {
                              const STATUS_CONFIG = {
                                new:                         { label: "신규",              cls: "border-emerald-200 bg-emerald-50 text-emerald-700" },
                                duplicate:                   { label: "이미 가져옴",        cls: "border-slate-200 bg-slate-50 text-slate-500" },
                                pending_update:              { label: "업데이트 필요",      cls: "border-amber-200 bg-amber-50 text-amber-700" },
                                invalid:                     { label: "가져올 수 없음",     cls: "border-red-200 bg-red-50 text-red-600" },
                                previously_imported_deleted: { label: "이전 기록 삭제됨",  cls: "border-slate-200 bg-slate-100 text-slate-400" },
                              };
                              const cfg = STATUS_CONFIG[item.status] ?? { label: item.status, cls: "border-slate-200 bg-white text-slate-600" };
                              return (
                                <div key={item.previewId} className="rounded-lg border border-slate-100 bg-white px-3 py-2 space-y-0.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="truncate text-xs font-medium text-slate-800">
                                      {item.mapped?.title || "(제목 없음)"}
                                    </p>
                                    <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-medium ${cfg.cls}`}>
                                      {cfg.label}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400">
                                    {item.mapped?.recordDate || item.mapped?.startDate || "날짜 없음"}
                                  </p>
                                  {item.status === "pending_update" && (
                                    <p className="text-[9px] text-amber-600 leading-relaxed">
                                      Notion 원본 내용이 이전에 가져온 기록과 달라졌습니다. 자동으로 덮어쓰지 않고 다음 단계에서 별도 처리합니다.
                                    </p>
                                  )}
                                  {item.status === "duplicate" && (
                                    <p className="text-[9px] text-slate-400">이미 PASSMAP으로 가져온 기록입니다.</p>
                                  )}
                                  {item.status === "invalid" && (
                                    <p className="text-[9px] text-red-500">제목 또는 날짜 등 필수 정보가 부족해 가져올 수 없습니다.</p>
                                  )}
                                  {item.validation?.errors?.length > 0 && (
                                    <p className="text-[9px] text-red-400">오류: {item.validation.errors.join(", ")}</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {notionCommitResult && (
                          <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 space-y-1">
                            {(notionCommitResult.summary?.committed ?? 0) > 0 ? (
                              <>
                                <p className="text-xs font-semibold text-indigo-800">
                                  {notionCommitResult.summary.committed}개의 기록을 PASSMAP 커리어 기록으로 가져왔습니다.
                                </p>
                                <p className="text-[10px] text-indigo-600">업무관리 캘린더에 반영되었습니다.</p>
                              </>
                            ) : (
                              <p className="text-xs text-slate-600">
                                {(notionCommitResult.summary?.total ?? 0) === 0
                                  ? "가져올 수 있는 항목이 없습니다. 날짜·제목 매핑이나 선택 항목을 다시 확인해 주세요."
                                  : (notionCommitResult.summary?.skipped_duplicate ?? 0) > 0
                                    ? "새로 저장된 항목은 없습니다. 이미 가져온 기록이거나 중복으로 제외된 항목입니다."
                                    : "새로 저장된 기록은 없습니다."}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {(notionCommitResult.summary?.skipped_duplicate ?? 0) > 0 && (
                                <span className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] text-slate-500">
                                  이미 가져온 기록 {notionCommitResult.summary.skipped_duplicate}건
                                </span>
                              )}
                              {(notionCommitResult.summary?.skipped_pending_update ?? 0) > 0 && (
                                <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] text-amber-600">
                                  업데이트 필요 {notionCommitResult.summary.skipped_pending_update}건
                                </span>
                              )}
                              {(notionCommitResult.summary?.skipped_invalid ?? 0) > 0 && (
                                <span className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[9px] text-red-500">
                                  가져올 수 없음 {notionCommitResult.summary.skipped_invalid}건
                                </span>
                              )}
                              {(notionCommitResult.summary?.failed ?? 0) > 0 && (
                                <span className="rounded border border-red-300 bg-red-50 px-1.5 py-0.5 text-[9px] text-red-600">
                                  실패 {notionCommitResult.summary.failed}건
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full text-xs text-slate-400"
                        onClick={() => setNotionPanelOpen(false)}
                      >
                        닫기
                      </Button>
                      {!notionSchema ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full text-xs"
                          disabled={!notionSelectedSourceId || notionLoading}
                          onClick={handleNotionLoadSchema}
                        >
                          {notionSelectedSourceId ? "속성 매핑 설정하기" : "가져올 Notion 데이터 소스를 선택해 주세요"}
                        </Button>
                      ) : notionPreviewResult ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full text-xs"
                          disabled={
                            notionLoading ||
                            notionCommitResult !== null ||
                            notionPreviewResult.items.filter((i) => i.commitEligible).length === 0
                          }
                          onClick={handleNotionCommit}
                        >
                          {notionLoading
                            ? "가져오는 중..."
                            : notionCommitResult !== null
                              ? ((notionCommitResult.summary?.committed ?? 0) > 0
                                  ? "가져오기 완료"
                                  : "새로 저장된 기록 없음")
                              : notionPreviewResult.items.filter((i) => i.commitEligible).length > 0
                                ? `가져오기 확정 (${notionPreviewResult.items.filter((i) => i.commitEligible).length}건)`
                                : "가져올 수 있는 새 기록이 없습니다"}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full text-xs"
                          disabled={!isNotionRequiredMappingComplete || notionLoading}
                          onClick={handleNotionPreview}
                        >
                          {isNotionRequiredMappingComplete
                            ? "가져오기 미리보기 확인"
                            : "제목과 날짜 속성을 먼저 선택해 주세요"}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                {showGoogleCalendarSync && googleCalendarPanelOpen && (
                  <div className="rounded-2xl border border-green-100 bg-green-50/40 px-4 py-3 space-y-2.5">
                    <div>
                      <p className="text-sm font-semibold text-green-900">Google Calendar 연동</p>
                      <p className="text-xs text-green-700 leading-relaxed mt-0.5">
                        업무 기록이 'PASSMAP 기록' 캘린더에 자동으로 추가됩니다. 기존 Google Calendar 일정에는 영향을 주지 않습니다.
                      </p>
                    </div>
                    <div className="text-[11px] text-green-800 space-y-0.5">
                      <p>연결 상태: {googleCalendarStatusLabel}</p>
                      <p>기록 상태: 완료 {googleCalendarSyncStatusSummary.synced}건 · 대기 {googleCalendarSyncStatusSummary.pending}건 · 실패 {googleCalendarSyncStatusSummary.failed}건</p>
                    </div>
                    {googleCalendarError && (
                      <p className="text-xs text-red-600">Google Calendar 연결에 실패했습니다. 다시 시도해 주세요.</p>
                    )}
                    {googleCalendarMessage && !googleCalendarError && (
                      <p className="text-xs text-green-700">{googleCalendarMessage}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full text-xs"
                        disabled={googleCalendarConnecting}
                        onClick={handleGoogleCalendarConnectStart}
                      >
                        {googleCalendarConnecting ? "연결 준비 중..." : "Google Calendar 연동하기"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full text-xs"
                        disabled={googleCalendarCreating}
                        onClick={handleGoogleCalendarCreatePassmapCalendar}
                      >
                        {googleCalendarCreating ? "캘린더를 확인하는 중..." : "PASSMAP 전용 캘린더 만들기"}
                      </Button>
                    </div>
                    {googleCalendarCreateError && (
                      <p className="text-xs text-red-600">캘린더 준비에 실패했습니다. 다시 시도해 주세요.</p>
                    )}
                    {googleCalendarCreateMessage && !googleCalendarCreateError && (
                      <p className="text-xs text-green-700">{googleCalendarCreateMessage}</p>
                    )}
                    {activeEntry?.records?.[0] && (
                      <div className="space-y-1 pt-0.5">
                        <p className="text-[11px] text-green-800">선택 기록: {activeEntry.records[0].date} · {activeEntry.records[0].title}</p>
                        {googleCalendarSyncError && (
                          <p className="text-xs text-red-600">동기화에 실패했습니다. 다시 시도해 주세요.</p>
                        )}
                        {googleCalendarSyncMessage && !googleCalendarSyncError && (
                          <p className="text-xs text-green-700">{googleCalendarSyncMessage}</p>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full text-xs"
                          disabled={googleCalendarSyncing}
                          onClick={handleGoogleCalendarSyncRecord}
                        >
                          {googleCalendarSyncing ? "추가하는 중..." : "선택한 기록 추가"}
                        </Button>
                      </div>
                    )}
                    <hr className="border-green-100" />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full text-[11px]"
                        disabled={googleCalendarBackfilling || safeRecords.filter((r) => r?.id).length === 0}
                        onClick={handleGoogleCalendarBackfill}
                      >
                        {googleCalendarBackfilling ? "추가하는 중..." : "이전 기록 Google Calendar에 추가하기"}
                      </Button>
                      {googleCalendarSyncStatusSummary.failed > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full text-[11px]"
                          disabled={googleCalendarRetryingFailed}
                          onClick={handleGoogleCalendarRetryFailedRecords}
                        >
                          {googleCalendarRetryingFailed ? "재시도 중..." : "연동 실패 기록 다시 시도"}
                        </Button>
                      )}
                    </div>
                    {googleCalendarBackfillProgress && googleCalendarBackfilling && (
                      <p className="text-xs text-green-700">
                        {googleCalendarBackfillProgress.done}/{googleCalendarBackfillProgress.total} 처리 중 · 추가 {googleCalendarBackfillProgress.synced}건 · 건너뜀 {googleCalendarBackfillProgress.skipped}건 · 실패 {googleCalendarBackfillProgress.failed}건
                      </p>
                    )}
                    {googleCalendarBackfillMessage && (
                      <p className="text-xs text-green-700">{googleCalendarBackfillMessage}</p>
                    )}
                    {googleCalendarRetryFailedError && (
                      <p className="text-xs text-red-600">{googleCalendarRetryFailedError}</p>
                    )}
                    {googleCalendarRetryFailedMessage && !googleCalendarRetryFailedError && (
                      <p className="text-xs text-green-700">{googleCalendarRetryFailedMessage}</p>
                    )}
                    {googleCalendarDisconnectError && (
                      <p className="text-xs text-red-600">{googleCalendarDisconnectError}</p>
                    )}
                    {googleCalendarDisconnectMessage && !googleCalendarDisconnectError && (
                      <p className="text-xs text-green-700">{googleCalendarDisconnectMessage}</p>
                    )}
                    <button
                      type="button"
                      className="text-[10px] text-slate-400 hover:text-red-500 disabled:opacity-40"
                      disabled={googleCalendarDisconnecting}
                      onClick={handleGoogleCalendarDisconnect}
                    >
                      {googleCalendarDisconnecting ? "해제 중..." : "연동 해제"}
                    </button>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-slate-950 sm:text-lg">
                      {data.calendarMonth.year}년 {data.calendarMonth.month}월
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveMonth(-1)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                      >
                        ← 이전
                      </button>
                      <button
                        type="button"
                        onClick={handleGoToday}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                      >
                        오늘
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveMonth(1)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                      >
                        다음 →
                      </button>
                    </div>
                  </div>
                  <CalendarLegend items={data.calendarLegend} />
                  <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 w-fit">
                    {CALENDAR_VIEW_OPTIONS.map(({ key, label, ariaLabel }) => (
                      <button
                        key={key}
                        type="button"
                        aria-pressed={calendarViewMode === key}
                        aria-label={ariaLabel}
                        onClick={() => setCalendarViewMode(key)}
                        className={`rounded-lg px-2 py-1 text-[11px] font-medium transition-all sm:px-3 sm:py-1.5 sm:text-xs ${
                          calendarViewMode === key
                            ? "bg-slate-900 text-white shadow-sm"
                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-200 hover:text-slate-950 hover:shadow-sm"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {calendarViewMode === "grid" && (
                  <>
                    <div className="grid grid-cols-7 gap-0.5 sm:gap-2">
                      {WEEKDAY_LABELS.map((label) => (
                        <div key={label} className="px-1 py-0.5 text-center text-xs font-semibold text-slate-400 sm:px-2 sm:py-1">
                          {label}
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      {data.calendarMonth.weeks.map((week, weekIndex) => {
                        const rangeSegments = getWeekRangeSegments([...(shouldUseDemoRecords ? PASSMAP_DEMO_RANGE_RECORDS : []), ...data.records], week);
                        return (
                          <div key={`week_${weekIndex}`} className="relative">
                            <div className="grid grid-cols-7 gap-0.5 sm:gap-2">
                              {week.map((item) => {
                                const entry = entriesByDate[item.date];
                                const isActive = item.date === selectedDate;
                                const recordCount = entry?.records?.length || 0;
                                const primaryTask =
                                  entry?.tasks?.[0] ||
                                  entry?.records?.[0]?.title ||
                                  entry?.records?.[0]?.summary ||
                                  getCalendarWorkTypeLabel(entry?.records?.[0]?.workType) ||
                                  getCalendarWorkTypeLabel(entry?.workTypes?.[0]) ||
                                  "업무 기록";
                                const workTypes = entry?.workTypes || [];
                                const specificWorkTypes = workTypes.filter((t) => !GENERIC_WORK_TYPES.has(t));
                                const visibleWorkTypes = (specificWorkTypes.length ? specificWorkTypes : workTypes).slice(0, 2);
                                const extraWorkTypeCount = Math.max(0, workTypes.length - visibleWorkTypes.length);
                                return (
                                  <button
                                    key={item.date}
                                    type="button"
                                    onClick={() => setSelectedDate(item.date)}
                                    className={[
                                      "min-h-[68px] min-w-0 rounded-xl border px-1 pt-1.5 pb-6 text-left transition sm:min-h-[92px] sm:px-2 sm:pt-2 sm:pb-7",
                                      isActive
                                        ? "border-slate-300 bg-slate-50 shadow-sm ring-1 ring-slate-200/70"
                                        : item.inCurrentMonth
                                          ? "border-slate-200 bg-white hover:border-slate-300"
                                          : "border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300",
                                    ].join(" ")}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className={`text-sm font-semibold ${item.inCurrentMonth ? "text-slate-900" : "text-slate-400"}`}>
                                        {item.day}
                                      </div>
                                      <div className="flex flex-wrap justify-end gap-1">
                                        {recordCount > 0 ? (
                                          <span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                                            {recordCount}건
                                          </span>
                                        ) : null}
                                        {item.isToday ? (
                                          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                                            오늘
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>

                                    {recordCount > 0 ? (
                                      <p className="mt-1.5 min-w-0 truncate text-[11px] font-medium leading-tight text-slate-700">
                                        {primaryTask}
                                      </p>
                                    ) : null}

                                    <div className="mt-3 flex flex-wrap gap-1">
                                      {visibleWorkTypes.map((type) => {
                                        const displayType = getCalendarWorkTypeLabel(type);
                                        const legend = data.calendarLegend.find((itemLegend) => itemLegend.label === type);
                                        return (
                                          <span
                                            key={`${item.date}_${type}`}
                                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600"
                                          >
                                            <span className={`h-1.5 w-1.5 rounded-full ${legend?.color || "bg-slate-300"}`} />
                                            {displayType}
                                          </span>
                                        );
                                      })}
                                      {extraWorkTypeCount > 0 ? (
                                        <span className="inline-flex items-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                                          +{extraWorkTypeCount}
                                        </span>
                                      ) : null}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                            {rangeSegments.length > 0 ? (
                              <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 grid grid-cols-7 gap-0.5 sm:gap-2">
                                {rangeSegments.map((segment, segIndex) => {
                                  const isPersonal = segment.record.recordType === "personal" || segment.record.workType === "개인 업무";
                                  const colorClass = isPersonal
                                    ? "bg-slate-100 border-slate-200 text-slate-600"
                                    : "bg-slate-100 border-slate-200 text-slate-700";
                                  const roundClass =
                                    segment.isSegmentStart && segment.isSegmentEnd ? "rounded-full" :
                                    segment.isSegmentStart ? "rounded-l-full rounded-r-sm" :
                                    segment.isSegmentEnd ? "rounded-l-sm rounded-r-full" :
                                    "rounded-sm";
                                  return (
                                    <div
                                      key={`seg_${weekIndex}_${segIndex}`}
                                      className={`h-4 min-w-0 overflow-hidden truncate border px-2 text-[10px] font-medium leading-4 ${colorClass} ${roundClass}`}
                                      style={{
                                        gridColumn: `${segment.startColumn} / ${segment.endColumn}`,
                                        gridRow: segment.lane + 1,
                                      }}
                                    >
                                      {segment.isSegmentStart ? String(segment.record.title || segment.record.summary || "").trim() : ""}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>

                    {shouldShowMonthEmptyNotice && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                        {monthEmptyNoticeText}
                      </div>
                    )}

                    <div className="grid gap-3">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                        {calendarSummary.weeklySummary}
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                        {calendarSummary.todaySummary}
                      </div>
                    </div>
                  </>
                )}

                {calendarViewMode === "weekly" && (
                  <div className="space-y-4">
                    {/* Week header: range label + nav buttons + subtitle */}
                    <div className="space-y-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">선택 주간</p>
                        <p className="mt-0.5 text-base font-semibold text-slate-900">{formatWeekRangeLabel(weekDates)}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedDate(shiftDateByDays(selectedDate, -7))}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                        >
                          ← 이전 주
                        </button>
                        <button
                          type="button"
                          onClick={handleGoToday}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                        >
                          이번 주
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedDate(shiftDateByDays(selectedDate, 7))}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                        >
                          다음 주 →
                        </button>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">이번 주 업무 흐름</p>
                        <p className="mt-0.5 text-xs text-slate-500">선택한 날짜가 포함된 한 주의 업무 기록만 모아 보여드립니다.</p>
                      </div>
                    </div>
                    {/* Vertical day feed */}
                    <div className="space-y-2">
                      {weekDates.map((dayStr) => {
                        const parts = dayStr.split("-");
                        const monthNum = Number(parts[1]);
                        const dayNum = Number(parts[2]);
                        const dow = new Date(Number(parts[0]), monthNum - 1, dayNum).getDay();
                        const weekdayLabel = ["일", "월", "화", "수", "목", "금", "토"][dow];
                        const isActive = dayStr === selectedDate;
                        const isToday = dayStr === data.today;
                        const allRecs = [...(shouldUseDemoRecords ? PASSMAP_DEMO_RANGE_RECORDS : []), ...data.records];
                        const dayRecords = allRecs.filter((r) => {
                          if (r.startDate && r.endDate && r.startDate !== r.endDate) {
                            return r.startDate <= dayStr && r.endDate >= dayStr;
                          }
                          return (r.date || r.startDate) === dayStr;
                        });
                        const hasRecords = dayRecords.length > 0;
                        const visible = dayRecords.slice(0, 2);
                        const extra = dayRecords.length > 2 ? dayRecords.length - 2 : 0;
                        const rowCls = [
                          "flex min-h-[3rem] cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition",
                          isActive
                            ? "border-slate-300 bg-slate-50 shadow-sm ring-1 ring-slate-200/70"
                            : isToday
                              ? "border-slate-300 bg-slate-50"
                              : hasRecords
                                ? "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-50"
                                : "border-slate-100 bg-slate-50 opacity-60 hover:opacity-80",
                        ].join(" ");
                        return (
                          <div
                            key={dayStr}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedDate(dayStr)}
                            onKeyDown={(e) => e.key === "Enter" && setSelectedDate(dayStr)}
                            className={rowCls}
                          >
                            {/* Left: date label */}
                            <div className="w-14 shrink-0 text-center">
                              <p className={["text-[10px] font-semibold", isActive ? "text-slate-600" : "text-slate-400"].join(" ")}>{weekdayLabel}</p>
                              <p className={["text-sm font-bold", isActive ? "text-slate-900" : "text-slate-700"].join(" ")}>{monthNum}.{dayNum}</p>
                              {isToday ? (
                                <span className="mt-0.5 inline-block rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600">오늘</span>
                              ) : null}
                            </div>
                            {/* Right: record cards */}
                            <div className="min-w-0 flex-1 space-y-1">
                              {visible.length > 0 ? (
                                visible.map((r, i) => {
                                  const isDemo = r.source === "passmap-demo";
                                  const cardCls = [
                                    "rounded-lg border px-2 py-1.5",
                                    isDemo
                                      ? "border-dashed border-slate-300 bg-white/60 opacity-60"
                                      : "border-solid border-slate-200 bg-white",
                                  ].join(" ");
                                  const titleText = String(r.title || r.summary || "").trim() || "제목 없는 기록";
                                  return (
                                    <div key={r.id || i} className={cardCls}>
                                      <p className="truncate text-[11px] text-slate-700">
                                        <span className="mr-1 font-medium text-slate-400">{getWorkCalendarRecordTypeLabel(r)} ·</span>
                                        {titleText}
                                      </p>
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="pt-1 text-[11px] text-slate-400">기록 없음</p>
                              )}
                              {extra > 0 ? (
                                <p className="text-[10px] text-slate-400">+{extra}개 더 있음</p>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {calendarViewMode === "list" && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">업무 기록 리스트</p>
                      <p className="mt-0.5 text-xs text-slate-500">기록된 업무를 날짜순으로 모아, 이력서에 남길 경험을 빠르게 검토합니다.</p>
                    </div>
                    {sortedAllRecords.length === 0 ? (
                      <p className="py-4 text-sm text-slate-500">아직 표시할 기록이 없습니다.</p>
                    ) : (
                      <ol className="space-y-3">
                        {sortedAllRecords.map((record) => {
                          const isRange = record.startDate && record.endDate && record.startDate !== record.endDate;
                          const periodLabel = formatWorkCalendarPeriod(record);
                          const typeLabel = getWorkCalendarRecordTypeLabel(record);
                          const safeTitle = String(record.title || record.summary || "").trim();
                          const safeSummary = String(record.summary || "").trim();
                          const safeReflected = String(record.reflectedSentence || "").trim();
                          const tags = Array.isArray(record.strengthTags) ? record.strengthTags.slice(0, 3) : [];
                          return (
                            <li key={record.id || periodLabel} className="rounded-2xl border border-slate-100 bg-white p-4">
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span className="text-[10px] font-medium text-slate-400">
                                  {isRange ? "기간" : "날짜"}: <span className="text-slate-600">{periodLabel}</span>
                                </span>
                                <span className="text-[10px] font-medium text-slate-400">
                                  유형: <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-slate-600">{typeLabel}</span>
                                </span>
                              </div>
                              {safeTitle ? <div className="mt-2 text-sm font-medium text-slate-900">{safeTitle}</div> : null}
                              {safeSummary ? (
                                <div className="mt-1">
                                  <span className="text-[10px] font-medium text-slate-400">요약: </span>
                                  <span className="text-xs leading-relaxed text-slate-600">{safeSummary}</span>
                                </div>
                              ) : null}
                              {safeReflected ? (
                                <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-500">
                                  <span className="font-medium text-slate-600">이력서 문장 후보: </span>{safeReflected}
                                </div>
                              ) : null}
                              {tags.length > 0 ? (
                                <div className="mt-2">
                                  <span className="text-[10px] font-medium text-slate-400">강점 태그: </span>
                                  <span className="inline-flex flex-wrap gap-1">
                                    {tags.map((tag) => (
                                      <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">{tag}</span>
                                    ))}
                                  </span>
                                </div>
                              ) : null}
                              {isLoggedIn && record.id ? (
                                <div className="mt-2 flex justify-end">
                                  <button
                                    type="button"
                                    className="text-[10px] text-slate-400 hover:text-red-500"
                                    onClick={() => handleDeleteWorkRecord(record)}
                                  >
                                    삭제
                                  </button>
                                </div>
                              ) : null}
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="min-w-0 space-y-3">
              <Card className="rounded-2xl border-slate-200 shadow-none">
                <CardHeader className="pb-3">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between sm:hidden"
                    onClick={() => setDateDetailOpen(v => !v)}
                  >
                    <div className="text-left">
                      <div className="text-sm font-semibold text-slate-900">선택 날짜 업무 상세</div>
                      {activeDateLabel && <div className="text-xs text-slate-500">{activeDateLabel}</div>}
                    </div>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${dateDetailOpen ? "rotate-180" : ""}`} />
                  </button>
                  <div className="hidden sm:block">
                    <SectionHeader title="선택 날짜 업무 상세" description={activeDateLabel} action={<Target className="h-4 w-4 text-slate-400" />} />
                  </div>
                </CardHeader>
                <div className={dateDetailOpen ? "" : "hidden sm:block"}>
                <CardContent className="space-y-3">
                  {activeEntry ? (
                    <>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-500">대표 업무</div>
                            <div className="mt-1 truncate text-sm font-semibold text-slate-900">{activeEntryPrimaryTask}</div>
                          </div>
                          <span className="shrink-0 whitespace-nowrap rounded-full bg-slate-900 px-2 py-1 text-xs font-semibold text-white">
                            이 날짜의 기록 {activeEntryRecordCount}건
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {activeEntryVisibleWorkTypes.map((type) => {
                            const displayType = getCalendarWorkTypeLabel(type);
                            const legend = data.calendarLegend.find((itemLegend) => itemLegend.label === type);
                            return (
                              <span
                                key={`active_${type}`}
                                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                              >
                                <span className={`h-2 w-2 rounded-full ${legend?.color || "bg-slate-300"}`} />
                                {displayType}
                              </span>
                            );
                          })}
                          {activeEntryExtraWorkTypeCount > 0 ? (
                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
                              +{activeEntryExtraWorkTypeCount}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <div className="text-xs font-semibold text-slate-500">업무 요약</div>
                        <div className="mt-2 text-sm leading-relaxed text-slate-700">{activeEntry.summary}</div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-slate-500">기록된 업무</div>
                        {activeEntry.records.slice(0, 3).map((record) => (
                          <div key={record.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                            <div className="text-sm font-semibold text-slate-900">{record.title}</div>
                            <div className="mt-0.5 text-sm leading-relaxed text-slate-600">{record.summary}</div>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                        <div className="text-xs font-semibold text-slate-500">정리된 문장</div>
                        <div className="mt-2 text-sm leading-relaxed text-slate-700">
                          {activeEntry.reflectedSentence || "아직 정리된 문장이 없는 날짜입니다."}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-slate-500">기록에서 보이는 강점</div>
                        {activeEntry.strengthTags?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {activeEntry.strengthTags.map((tag) => (
                              <span key={tag} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                            아직 표시할 강점이 없는 날짜입니다.
                          </div>
                        )}
                      </div>

                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
                        <div className="text-xs font-semibold text-amber-700">다음에 보완할 점</div>
                        <div className="mt-2 text-sm leading-relaxed text-amber-900">{activeEntry.improvementHint}</div>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-center">
                      <p className="text-sm text-slate-600">선택한 날짜에 기록된 업무가 아직 없습니다.</p>
                      {onOpenRecordInput && (
                        <button
                          type="button"
                          onClick={() => onOpenRecordInput({ date: selectedDate })}
                          className="mt-2 rounded-full bg-violet-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
                        >
                          {selectedDate} 기록 추가하기
                        </button>
                      )}
                    </div>
                  )}
                </CardContent>
                </div>
              </Card>

              <Card className="rounded-2xl border-slate-200 shadow-none">
                <CardHeader className="pb-3">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between sm:hidden"
                    onClick={() => setMonthlyAssetOpen(v => !v)}
                  >
                    <div className="text-left">
                      <div className="text-sm font-semibold text-slate-900">이번 달 자산 요약</div>
                      <div className="text-xs text-slate-500">이번 달 기록이 어떤 자산으로 읽혔는지 바로 봅니다.</div>
                    </div>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${monthlyAssetOpen ? "rotate-180" : ""}`} />
                  </button>
                  <div className="hidden sm:block">
                    <SectionHeader title="이번 달 자산 요약" description="이번 달 기록이 어떤 자산으로 읽혔는지 바로 봅니다." action={<Sparkles className="h-4 w-4 text-slate-400" />} />
                  </div>
                </CardHeader>
                <div className={monthlyAssetOpen ? "" : "hidden sm:block"}>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                    <SummaryMetricCard label="반영 문장" value={`${monthlyAssetSummary.reflectedSentenceCount}건`} />
                    <SummaryMetricCard label="가장 많이 읽힌 강점" value={monthlyAssetSummary.topStrengthTag} />
                    <SummaryMetricCard label="가장 많이 기록된 업무" value={monthlyAssetSummary.topWorkType} />
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <div className="text-xs font-semibold text-slate-500">이번 달 보완 포인트</div>
                    <div className="mt-2 text-sm leading-relaxed text-slate-700">{monthlyAssetSummary.improvementHint}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="rounded-full" onClick={onOpenResumeResult || undefined}>
                      이력서 보기
                    </Button>
                  </div>
                </CardContent>
                </div>
              </Card>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="rounded-2xl border-slate-200 shadow-none">
              <CardHeader className="pb-3">
                <SectionHeader
                  title="최근 기록"
                  description="최근 기록 3건을 봅니다."
                  action={
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-7 rounded-full text-xs sm:h-9 sm:text-[15px]" onClick={onOpenRecordInput ? () => onOpenRecordInput({ date: selectedDate }) : undefined}>
                        이번 주 기록하기
                      </Button>
                      <PlaceholderButton>전체 업데이트 보기</PlaceholderButton>
                    </div>
                  }
                />
              </CardHeader>
              <CardContent className="space-y-3">
                {data.recentUpdates.map((item) => (
                  <div key={item.title} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                    <div className="text-sm font-semibold leading-snug text-slate-900 sm:text-[17px]">{item.title}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{item.date}</div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-[15px]">{item.summary}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 shadow-none">
              <CardHeader className="pb-3">
                <SectionHeader
                  title="최근 리포트"
                  description="최근 리포트 2건을 봅니다."
                  action={
                    <Button variant="outline" size="sm" className="h-7 rounded-full text-xs sm:h-9 sm:text-[15px]" onClick={onOpenReports || undefined}>
                      리포트 보기
                    </Button>
                  }
                />
              </CardHeader>
              <CardContent className="space-y-3">
                {data.recentReports.slice(0, 2).map((item) => (
                  <div key={item.title} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold leading-snug text-slate-900 sm:text-[17px]">{item.title}</div>
                        <div className="mt-0.5 text-xs text-slate-500">{item.date}</div>
                      </div>
                      <FileText className="mt-0.5 h-4 w-4 text-slate-400" />
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-[15px]">{item.summary}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border-slate-200 shadow-none">
            <CardHeader className="pb-3">
              <SectionHeader title="추천 액션" description="다음 행동을 위한 보조 제안입니다." action={<Lightbulb className="h-4 w-4 text-slate-400" />} />
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {data.recommendedActions.map((item) => (
                <div key={item} className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-700 sm:text-[15px]">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </CardContent>
      </Card>

    </div>
  );
}
