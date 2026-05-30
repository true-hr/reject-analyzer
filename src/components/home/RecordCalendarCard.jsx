import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Target } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  buildCalendarEntriesByDate,
  buildCalendarMonthViewModel,
  deriveCalendarSummary,
} from "./homeDashboardCalendarUtils.js";

function formatDetailDateLabel(date) {
  const safeDate = String(date || "").trim();
  if (!safeDate) return "선택한 날짜";
  const [year, month, day] = safeDate.split("-");
  if (!year || !month || !day) return safeDate;
  return `${Number(month)}월 ${Number(day)}일`;
}

function getRecordPeriodLabel(record) {
  if (record?.projectPeriod) return record.projectPeriod;
  if (record?.startDate && record?.endDate && record.startDate !== record.endDate) {
    return `${record.startDate} ~ ${record.endDate}`;
  }
  return record?.startDate || record?.date || "";
}

const isDateInRange = (date, startDate, endDate) => {
  if (!date || !startDate || !endDate) return false;
  return date >= startDate && date <= endDate;
};

const getProjectRangeRecordsForDate = (records, date) => {
  return (records || []).filter((record) => {
    const isProjectRecord =
      (record?.source === "passmap" || record?.source === "passmap-demo") &&
      (
        record?.recordType === "teamProject" ||
        record?.recordType === "personal" ||
        record?.workType === "팀 프로젝트" ||
        record?.workType === "개인 업무"
      );
    return (
      isProjectRecord &&
      record?.startDate &&
      record?.endDate &&
      record.startDate !== record.endDate &&
      isDateInRange(date, record.startDate, record.endDate)
    );
  });
};

const getRangePosition = (date, record) => {
  if (date === record.startDate && date === record.endDate) return "single";
  if (date === record.startDate) return "start";
  if (date === record.endDate) return "end";
  return "middle";
};

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

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function getWeekDays(dateStr) {
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
    const y = day.getFullYear();
    const m = String(day.getMonth() + 1).padStart(2, "0");
    const d = String(day.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });
}

function getYearMonthFromDateKey(dateKey) {
  const parts = String(dateKey || "").split("-").map(Number);
  const year = parts[0];
  const month = parts[1];
  if (Number.isFinite(year) && Number.isFinite(month) && year > 0 && month >= 1 && month <= 12) {
    return { year, month };
  }
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function getInitialViewMonth(calendarMonth, today) {
  if (calendarMonth?.year && calendarMonth?.month) {
    return { year: calendarMonth.year, month: calendarMonth.month };
  }
  return getYearMonthFromDateKey(today);
}

function getRecordTypeLabel(record) {
  if (record?.source === "passmap-demo") return "예시 기록";
  if (record?.recordType === "personal" || record?.workType === "개인 업무") return "개인 업무";
  if (record?.recordType === "teamProject" || record?.workType === "팀 프로젝트") return "팀 프로젝트";
  return "업무 기록";
}

function getRecordTitle(record) {
  const t = String(record?.title || "").trim();
  if (t) return t;
  const s = String(record?.summary || "").trim();
  if (s) return s.length > 22 ? s.slice(0, 22) + "…" : s;
  const r = String(record?.reflectedSentence || "").trim();
  if (r) return r.length > 22 ? r.slice(0, 22) + "…" : r;
  return "제목 없는 기록";
}

function getRecordChips(record) {
  const tags = [
    ...(Array.isArray(record?.strengthTags) ? record.strengthTags : []),
    ...(Array.isArray(record?.categoryTags) ? record.categoryTags : []),
    ...(Array.isArray(record?.workTags) ? record.workTags : []),
  ];
  if (tags.length > 0) return tags.slice(0, 2);
  const wt = String(record?.workType || "").trim();
  return wt ? [wt] : [];
}

const WEEKLY_DEMO_EXAMPLES = [
  { id: "wex-0", source: "passmap-demo", recordType: "weekly",      title: "지원자 문의 기준 정리",    workType: "문의 대응", workTags: ["문의 대응", "문서/보고"],  strengthTags: ["문의 대응", "문서화"] },
  { id: "wex-1", source: "passmap-demo", recordType: "weekly",      title: "후속 안내 문구 보완",      workType: "문서·보고", workTags: ["문서/보고", "운영 개선"],  strengthTags: ["문서화", "운영 개선"] },
  { id: "wex-2", source: "passmap-demo", recordType: "weekly",      title: "고객 문의 유형 정리",      workType: "문의 대응", workTags: ["문의 대응", "운영 개선"],  strengthTags: ["문의 대응", "운영 개선"] },
  { id: "wex-3", source: "passmap-demo", recordType: "teamProject", title: "협업 이슈 우선순위 정리",  workType: "이슈 조율", workTags: ["이슈 조율", "운영 개선"],  strengthTags: ["이슈 조율", "협업"] },
  { id: "wex-4", source: "passmap-demo", recordType: "weekly",      title: "반복 오류 사례 분류",      workType: "문서·보고", workTags: ["문서/보고", "문의 대응"],  strengthTags: ["문서화", "후속 실행"] },
  { id: "wex-5", source: "passmap-demo", recordType: "personal",    title: "프로세스 정리",            workType: "운영 개선", workTags: ["운영 개선", "문서/보고"],  strengthTags: ["운영 개선", "문서화"] },
  { id: "wex-6", source: "passmap-demo", recordType: "personal",    title: "운영 개선 메모 작성",      workType: "운영 개선", workTags: ["운영 개선"],               strengthTags: ["운영 개선", "후속 실행"] },
];

const WORK_TAG_STYLE_MAP = {
  "문의 대응": { dot: "bg-slate-800",   softBg: "bg-slate-50",   border: "border-slate-200",   text: "text-slate-700",   bar: "bg-slate-700" },
  "이슈 조율": { dot: "bg-emerald-500", softBg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", bar: "bg-emerald-400" },
  "문서/보고": { dot: "bg-amber-500",   softBg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   bar: "bg-amber-400" },
  "운영 개선": { dot: "bg-sky-500",     softBg: "bg-sky-50",     border: "border-sky-200",     text: "text-sky-700",     bar: "bg-sky-400" },
};

const DEFAULT_WORK_TAG_STYLE = {
  dot: "bg-slate-400", softBg: "bg-slate-50", border: "border-slate-200", text: "text-slate-600", bar: "bg-slate-300",
};

const RECORD_TYPE_STYLE_MAP = {
  personal:    { label: "개인 업무",    className: "border-slate-200 bg-slate-50 text-slate-600" },
  teamProject: { label: "팀 프로젝트", className: "border-indigo-200 bg-indigo-50 text-indigo-700" },
  weekly:      { label: "이번 주 기록", className: "border-slate-200 bg-white text-slate-600" },
  example:     { label: "예시 기록",   className: "border-dashed border-slate-200 bg-slate-50/70 text-slate-500" },
  default:     { label: "업무 기록",   className: "border-slate-200 bg-white text-slate-600" },
};

const ALLOWED_WORK_TAGS = ["문의 대응", "이슈 조율", "문서/보고", "운영 개선"];
const GENERIC_CALENDAR_TYPES = new Set(["이번 주 기록", "개인 업무", "팀 프로젝트"]);
const KEYWORD_TAG_RULES = [
  { keywords: ["문의", "고객", "응대", "커뮤니케이션"], tag: "문의 대응" },
  { keywords: ["이슈", "조율", "협업", "우선순위"],      tag: "이슈 조율" },
  { keywords: ["문서", "보고", "정리", "기준", "메모"], tag: "문서/보고" },
  { keywords: ["개선", "운영", "프로세스", "효율", "자동화"], tag: "운영 개선" },
];

function getCalendarWorkTypeLabel(type) {
  const safeType = String(type || "").trim();
  if (safeType === "이번 주 기록") return "업무 기록";
  return safeType;
}

function getWorkTagLabels(record) {
  if (!record) return [];
  if (Array.isArray(record.workTags) && record.workTags.length > 0) {
    const matched = record.workTags.filter((t) => ALLOWED_WORK_TAGS.includes(t));
    if (matched.length > 0) return matched.slice(0, 2);
  }
  if (Array.isArray(record.categoryTags) && record.categoryTags.length > 0) {
    const matched = record.categoryTags.filter((t) => ALLOWED_WORK_TAGS.includes(t));
    if (matched.length > 0) return matched.slice(0, 2);
  }
  if (Array.isArray(record.strengthTags) && record.strengthTags.length > 0) {
    const matched = record.strengthTags.filter((t) => ALLOWED_WORK_TAGS.includes(t));
    if (matched.length > 0) return matched.slice(0, 2);
  }
  const wt = String(record.workType || record.type || "").trim();
  if (ALLOWED_WORK_TAGS.includes(wt)) return [wt];
  const text = [String(record.title || ""), String(record.summary || ""), String(record.reflectedSentence || "")].join(" ");
  const inferred = [];
  for (const { keywords, tag } of KEYWORD_TAG_RULES) {
    if (keywords.some((kw) => text.includes(kw)) && !inferred.includes(tag)) {
      inferred.push(tag);
      if (inferred.length >= 2) break;
    }
  }
  return inferred;
}

function SectionHeader({ title, description, action }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {description ? <p className="text-xs leading-relaxed text-slate-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

function CalendarLegend({ items }) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-medium text-slate-400">기록 유형</span>
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
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-medium text-slate-400">업무 태그</span>
          {items.map((item) => (
            <span key={item.key} className="inline-flex items-center gap-1 text-xs text-slate-500">
              <span className={`h-2 w-2 rounded-full ${WORK_TAG_STYLE_MAP[item.label]?.dot || item.color}`} />
              {item.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function RecordCalendarCard({
  records = [],
  today = "",
  calendarMonth,
  calendarLegend = [],
  selectedDate: controlledSelectedDate,
  onSelectDate,
  title = "경험 캘린더",
  description = "기록한 업무가 언제 발생했는지 보고, 이력서에 남길 경험으로 다시 확인할 수 있습니다.",
  className = "",
  variant = "default",
  allowWeeklyDemoExamples = true,
  canDeleteRecords = false,
  onDeleteRecord = null,
}) {
  const defaultDate = controlledSelectedDate || today || calendarMonth?.weeks?.[0]?.[0]?.date || "";
  const [internalSelectedDate, setInternalSelectedDate] = useState(defaultDate);
  const selectedDate = controlledSelectedDate || internalSelectedDate;
  const handleSelectDate = onSelectDate || setInternalSelectedDate;
  const [currentViewMonth, setCurrentViewMonth] = useState(() => getInitialViewMonth(calendarMonth, today));
  const isCompact = variant === "compact";
  const [calendarViewMode, setCalendarViewMode] = useState("grid");
  const weekDates = useMemo(() => getWeekDays(selectedDate || today), [selectedDate, today]);
  const sortedListRecords = useMemo(
    () =>
      [...records].sort((a, b) => {
        const aDate = a.startDate || a.date || "";
        const bDate = b.startDate || b.date || "";
        return aDate < bDate ? -1 : aDate > bDate ? 1 : 0;
      }),
    [records]
  );

  useEffect(() => {
    if (!controlledSelectedDate) {
      setInternalSelectedDate(defaultDate);
    }
  }, [controlledSelectedDate, defaultDate]);

  const entriesByDate = useMemo(() => buildCalendarEntriesByDate(records), [records]);
  const selectedEntry = entriesByDate[selectedDate];
  const passmapRecords = selectedEntry?.records?.filter(
    (r) => r?.source === "passmap" || r?.source === "supabase"
  ) ?? [];
  // true when any record is local-only (not yet saved or from a local session)
  const hasLocalRecord = passmapRecords.some((r) => r?.source === "passmap");
  const calendarSummary = useMemo(
    () =>
      deriveCalendarSummary({
        records,
        selectedDate,
        today,
      }),
    [records, selectedDate, today]
  );

  const weeklyTagDots = useMemo(() => {
    const seen = new Set();
    for (const d of weekDates) {
      for (const r of (entriesByDate[d]?.records || [])) {
        for (const t of getWorkTagLabels(r)) { seen.add(t); }
      }
    }
    return [...seen].slice(0, 3);
  }, [weekDates, entriesByDate]);

  const [legendOpen, setLegendOpen] = useState(false);

  const weekRealCount = useMemo(() => {
    return weekDates.reduce((acc, d) => {
      const recs = entriesByDate[d]?.records?.filter(r => r?.source === "passmap" || r?.source === "supabase") ?? [];
      return acc + recs.length;
    }, 0);
  }, [weekDates, entriesByDate]);

  const todayFirstTag = useMemo(() => {
    for (const r of (entriesByDate[today]?.records || [])) {
      const tags = getWorkTagLabels(r);
      if (tags.length > 0) return tags[0];
    }
    return null;
  }, [entriesByDate, today]);

  const canDeleteRecord = (record) =>
    canDeleteRecords &&
    typeof onDeleteRecord === "function" &&
    Boolean(record?.id) &&
    record?.source === "supabase";

  const displayCalendarMonth = buildCalendarMonthViewModel({
    year: currentViewMonth.year,
    month: currentViewMonth.month,
    today,
  });

  return (
    <Card className={`rounded-2xl border-slate-200 shadow-none ${className}`.trim()}>
      <CardHeader className={isCompact ? "pb-2" : "pb-3"}>
        <SectionHeader title={title} description={description} action={<Target className="h-4 w-4 text-slate-400" />} />
      </CardHeader>
      <CardContent className={isCompact ? "space-y-3" : "space-y-4"}>
        {weekRealCount > 0 && !isCompact ? (
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700">이번 주 업무 기록</span>
            <span className="mx-1.5 text-slate-300">·</span>
            {weekRealCount}건 기록됨
            {weeklyTagDots.length > 0 && (
              <span className="ml-1.5 text-slate-400">· {weeklyTagDots.join(" · ")}</span>
            )}
          </div>
        ) : null}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className={isCompact ? "text-base font-semibold text-slate-950" : "text-lg font-semibold text-slate-950"}>
                {displayCalendarMonth.year}년 {displayCalendarMonth.month}월
              </div>
            </div>
            {!isCompact ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400">보기:</span>
                  {[
                    { key: "주간", mode: "weekly", ariaLabel: "선택한 주의 기록을 7일 단위로 보기" },
                    { key: "월간", mode: "grid", ariaLabel: "기록을 월간 캘린더 형태로 보기" },
                    { key: "목록", mode: "list", ariaLabel: "기록을 날짜순 목록으로 보기" },
                  ].map(({ key, mode, ariaLabel }) => (
                    <button
                      key={mode}
                      type="button"
                      aria-pressed={calendarViewMode === mode}
                      aria-label={ariaLabel}
                      onClick={() => setCalendarViewMode(mode)}
                      className={`rounded-md px-2 py-0.5 text-xs transition ${
                        calendarViewMode === mode
                          ? "bg-slate-900 text-white"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      {key}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setLegendOpen(v => !v)}
                  className="flex items-center gap-0.5 rounded-md px-2 py-0.5 text-xs text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  범례
                  <ChevronDown className={`h-3 w-3 transition-transform ${legendOpen ? "rotate-180" : ""}`} />
                </button>
              </div>
            ) : null}
          </div>
          {!isCompact && legendOpen ? <CalendarLegend items={calendarLegend} /> : null}
        </div>

        {calendarViewMode === "grid" && (
          <>
            <div className="grid grid-cols-7 gap-2">
              {WEEKDAY_LABELS.map((label) => (
                <div key={label} className="px-2 py-1 text-center text-xs font-semibold text-slate-400">
                  {label}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {(displayCalendarMonth.weeks || []).map((week, weekIndex) => {
                const weekSegments = getWeekRangeSegments(records, week);
                return (
                  <div key={`week_${weekIndex}`} className="relative">
                    <div className="grid grid-cols-7 gap-2">
                      {week.map((item) => {
                        const entry = entriesByDate[item.date];
                        const isActive = item.date === selectedDate;
                        const recordCount = entry?.records?.length || 0;
                        const primaryTask =
                          entry?.tasks?.[0] ||
                          entry?.records?.[0]?.title ||
                          entry?.records?.[0]?.summary ||
                          getCalendarWorkTypeLabel(entry?.records?.[0]?.workType) ||
                          "업무 기록";
                        const workTypes = entry?.workTypes || [];
                        const specificWorkTypes = workTypes.filter((t) => !GENERIC_CALENDAR_TYPES.has(t));
                        const visibleWorkTypes = (
                          specificWorkTypes.length ? specificWorkTypes : workTypes
                        ).slice(0, 2);
                        const displayWorkTypes = visibleWorkTypes.length || recordCount === 0
                          ? visibleWorkTypes
                          : ["업무 기록"];
                        const semanticTagsForDots = isCompact && entry?.records
                          ? [...new Set(entry.records.flatMap((r) => getWorkTagLabels(r)).filter(Boolean))].slice(0, 2)
                          : [];
                        const compactMarkers = semanticTagsForDots.length ? semanticTagsForDots : displayWorkTypes;
                        const extraCount = Math.max(0, recordCount - 2);
                        return (
                          <button
                            key={item.date}
                            type="button"
                            onClick={() => handleSelectDate(item.date)}
                            className={[
                              isCompact
                                ? "min-h-[74px] rounded-xl border px-2 pt-2 pb-7 text-left transition"
                                : "min-h-[86px] rounded-xl border px-2 pt-2 pb-7 text-left transition",
                              isActive
                                ? "border-primary bg-primary/10 shadow-sm ring-1 ring-inset ring-primary/20"
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
                                {recordCount > 0 && !isCompact ? (
                                  <span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                                    {recordCount}건
                                  </span>
                                ) : null}
                                {item.isToday ? (
                                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                    오늘
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            {recordCount > 0 && !isCompact ? (
                              <p className="mt-1.5 min-w-0 truncate text-[11px] font-medium leading-tight text-slate-700">
                                {primaryTask}
                              </p>
                            ) : null}

                            <div className={isCompact ? "mt-2.5 flex items-center justify-between gap-2" : "mt-2 flex flex-wrap gap-1"}>
                              {isCompact ? (
                                <>
                                  <div className="flex items-center gap-1">
                                    {compactMarkers.length ? (
                                      compactMarkers.map((type) => {
                                        return <span key={`${item.date}_${type}`} className={`h-2 w-2 rounded-full ${WORK_TAG_STYLE_MAP[type]?.dot || DEFAULT_WORK_TAG_STYLE.dot}`} />;
                                      })
                                    ) : recordCount > 0 ? (
                                      <span className="h-2 w-2 rounded-full bg-slate-300" />
                                    ) : null}
                                  </div>
                                </>
                              ) : (
                                <>
                                  {displayWorkTypes.map((type) => {
                                    const displayType = getCalendarWorkTypeLabel(type);
                                    return (
                                      <span
                                        key={`${item.date}_${type}`}
                                        className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600"
                                      >
                                        <span className={`h-1.5 w-1.5 rounded-full ${WORK_TAG_STYLE_MAP[type]?.dot || DEFAULT_WORK_TAG_STYLE.dot}`} />
                                        {displayType}
                                      </span>
                                    );
                                  })}
                                  {extraCount ? (
                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                                      +{extraCount}
                                    </span>
                                  ) : null}
                                </>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {weekSegments.length > 0 ? (
                      <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 grid grid-cols-7 gap-2">
                        {weekSegments.map((segment, segIndex) => {
                          const isPersonal = segment.record.recordType === "personal" || segment.record.workType === "개인 업무";
                          const colorClass = isPersonal
                            ? "bg-slate-100 border-slate-200 text-slate-600"
                            : "bg-indigo-100 border-indigo-200 text-indigo-700";
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
          </>
        )}

        {calendarViewMode === "weekly" && (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">이번 주 기록 흐름</p>
              <p className="mt-0.5 text-xs text-slate-500">최근 기록과 예시 경험을 함께 보며, 이력서로 이어질 포인트를 미리 확인합니다.</p>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-7">
              {weekDates.map((dayStr, dayIndex) => {
                const parts = dayStr.split("-");
                const monthNum = Number(parts[1]);
                const dayNum = Number(parts[2]);
                const dow = new Date(Number(parts[0]), monthNum - 1, dayNum).getDay();
                const weekdayLabel = ["일", "월", "화", "수", "목", "금", "토"][dow];
                const isActive = dayStr === selectedDate;
                const isToday = dayStr === today;
                const dateRecs = entriesByDate[dayStr]?.records || [];
                const rangeRecs = records.filter(
                  (r) => isRangeRecord(r) && r.startDate <= dayStr && r.endDate >= dayStr
                );
                const seen = new Set(dateRecs.map((r) => r.id));
                const realRecords = [...dateRecs, ...rangeRecs.filter((r) => !seen.has(r.id))];
                const fillCount = Math.max(0, 2 - realRecords.length);
                const weeklyDemoPool = allowWeeklyDemoExamples ? WEEKLY_DEMO_EXAMPLES : [];
                const exFill = weeklyDemoPool.length > 0
                  ? Array.from({ length: fillCount }, (_, i) => weeklyDemoPool[(dayIndex * 3 + i) % weeklyDemoPool.length])
                  : [];
                const dayRecords = [...realRecords, ...exFill];
                const visible = dayRecords.slice(0, 2);
                const extra = dayRecords.length > 2 ? dayRecords.length - 2 : 0;
                const barColors = Array.from({ length: 4 }, (_, i) => {
                  if (i >= dayRecords.length) return "bg-slate-100";
                  const wt = getWorkTagLabels(dayRecords[i])[0];
                  return wt ? (WORK_TAG_STYLE_MAP[wt]?.bar || DEFAULT_WORK_TAG_STYLE.bar) : DEFAULT_WORK_TAG_STYLE.bar;
                });
                const allWTSeen = new Set();
                const weeklyChips = [];
                for (const r of dayRecords) {
                  for (const tag of getWorkTagLabels(r)) {
                    if (!allWTSeen.has(tag)) { allWTSeen.add(tag); weeklyChips.push(tag); }
                    if (weeklyChips.length >= 2) break;
                  }
                  if (weeklyChips.length >= 2) break;
                }
                const countLabel = dayRecords.length > 0 ? `${dayRecords.length}건` : "비어 있음";
                return (
                  <button
                    key={dayStr}
                    type="button"
                    onClick={() => handleSelectDate(dayStr)}
                    className={[
                      "rounded-2xl border p-3 text-left transition",
                      isActive
                        ? "border-violet-400 bg-violet-50/70 shadow-sm"
                        : isToday
                          ? "border-slate-300 bg-slate-50"
                          : dayRecords.length > 0
                            ? "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                            : "border-slate-100 bg-slate-50/60 hover:border-slate-200",
                    ].join(" ")}
                  >
                    {/* Header: 요일/날짜 left, 오늘+건수 right */}
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <p className={["text-[10px] font-semibold", isActive ? "text-violet-500" : "text-slate-400"].join(" ")}>{weekdayLabel}</p>
                        <p className={["text-sm font-bold leading-tight", isActive ? "text-violet-700" : "text-slate-800"].join(" ")}>{monthNum}.{dayNum}</p>
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        {isToday ? (
                          <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-semibold text-violet-600">오늘</span>
                        ) : null}
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500">
                          {countLabel}
                        </span>
                      </div>
                    </div>
                    {/* Activity bar: 업무 태그 색상 적용 */}
                    <div className="mt-2 flex gap-0.5">
                      {barColors.map((color, i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full ${color}`} />
                      ))}
                    </div>
                    {/* Record rows: max 2 visible */}
                    <div className="mt-2 space-y-1">
                      {visible.length > 0 ? (
                        visible.map((r, i) => {
                          const isDemo = r.source === "passmap-demo";
                          const rowTags = getWorkTagLabels(r);
                          const dotColor = rowTags.length > 0
                            ? (WORK_TAG_STYLE_MAP[rowTags[0]]?.dot || DEFAULT_WORK_TAG_STYLE.dot)
                            : DEFAULT_WORK_TAG_STYLE.dot;
                          return (
                            <div
                              key={r.id || i}
                              className={[
                                "flex items-center gap-1.5 rounded-lg border px-1.5 py-1",
                                isDemo
                                  ? "border-dashed border-slate-200 bg-slate-50/70"
                                  : "border-solid border-slate-200 bg-white",
                              ].join(" ")}
                            >
                              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
                              <p className={["min-w-0 truncate text-[10px]", isDemo ? "text-slate-500" : "text-slate-700"].join(" ")}>
                                <span className="mr-0.5 font-medium text-slate-400">{getRecordTypeLabel(r)} · </span>
                                {getRecordTitle(r)}
                              </p>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-[10px] text-slate-400">표시할 기록 없음</p>
                      )}
                      {extra > 0 ? (
                        <p className="text-[10px] text-slate-400">+{extra}개 더 있음</p>
                      ) : null}
                    </div>
                    {/* Chips: 업무 태그 색상 범례 연결 max 2 */}
                    {weeklyChips.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {weeklyChips.map((chip) => {
                          const style = WORK_TAG_STYLE_MAP[chip] || DEFAULT_WORK_TAG_STYLE;
                          return (
                            <span
                              key={chip}
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${style.softBg} ${style.border} ${style.text}`}
                            >
                              {chip}
                            </span>
                          );
                        })}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {calendarViewMode === "list" && (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">기록 리스트</p>
              <p className="mt-0.5 text-xs text-slate-500">입력한 기록을 날짜순으로 모아, 이력서 문장 후보까지 빠르게 검토합니다.</p>
            </div>
            {sortedListRecords.length === 0 ? (
              <p className="py-4 text-sm text-slate-500">아직 표시할 기록이 없습니다.</p>
            ) : (
              <ol className="space-y-3">
                {sortedListRecords.map((record) => {
                  const hasRange = record.startDate && record.endDate && record.startDate !== record.endDate;
                  const rawDate = record.startDate || record.date;
                  const periodLabel = hasRange
                    ? `${record.startDate} ~ ${record.endDate}`
                    : rawDate || "날짜 미지정";
                  const typeLabel = getRecordTypeLabel(record);
                  const safeTitle = String(record.title || record.summary || "").trim();
                  const safeSummary = String(record.summary || "").trim();
                  const safeReflected = String(record.reflectedSentence || "").trim();
                  const tags = Array.isArray(record.strengthTags) ? record.strengthTags.slice(0, 3) : [];
                  return (
                    <li
                      key={record.id || periodLabel}
                      className="rounded-2xl border border-slate-100 bg-white p-4"
                      onClick={() => handleSelectDate(record.startDate || record.date || selectedDate)}
                    >
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-[10px] font-medium text-slate-400">
                          {hasRange ? "기간" : "날짜"}: <span className="text-slate-600">{periodLabel}</span>
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
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        )}

        {isCompact ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
              {formatDetailDateLabel(selectedDate)}
            </div>
            <div className="mt-2 space-y-2">
              {selectedEntry?.tasks?.length ? (
                selectedEntry.tasks.slice(0, 2).map((task) => (
                  <div key={task} className="text-sm leading-relaxed text-slate-700">
                    {task}
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">선택한 날짜에 아직 세부 기록이 없습니다.</div>
              )}
              <div className="rounded-lg bg-white px-3 py-2 text-xs leading-relaxed text-slate-500">
                {selectedEntry?.improvementHint || calendarSummary.todaySummary}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                {formatDetailDateLabel(selectedDate)}
              </div>
              <div className="mt-2 space-y-1.5">
                {selectedEntry?.tasks?.length ? (
                  selectedEntry.tasks.slice(0, 2).map((task) => (
                    <div key={task} className="text-sm leading-relaxed text-slate-700">
                      {task}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-500">선택한 날짜에 아직 세부 기록이 없습니다.</div>
                )}
                {selectedEntry?.improvementHint ? (
                  <div className="text-xs leading-relaxed text-slate-500">{selectedEntry.improvementHint}</div>
                ) : null}
              </div>
            </div>
            {passmapRecords.length > 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-700">
                    {hasLocalRecord ? "최근 입력 기록" : "저장된 기록"}
                  </div>
                  {hasLocalRecord ? (
                    <div className="text-[10px] text-slate-400">방금 남긴 기록이 임시로 반영되었습니다.</div>
                  ) : null}
                </div>
                {passmapRecords.map((record) => {
                  const wt = String(record.workType || "").trim();
                  const periodLabel = getRecordPeriodLabel(record);
                  const tags = Array.isArray(record.strengthTags) ? record.strengthTags : [];
                  const safeTitle = String(record.title || "").trim() || String(record.summary || "").trim() || "기록";
                  const safeSummary = String(record.summary || "").trim();
                  const safeReflected = String(record.reflectedSentence || "").trim();
                  const wtLabel = GENERIC_CALENDAR_TYPES.has(wt) ? "업무 기록" : (wt || "경험 기록");
                  return (
                    <div key={record.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          {wtLabel}
                        </span>
                        {periodLabel ? (
                          <span className="text-[10px] text-slate-400">{periodLabel}</span>
                        ) : null}
                      </div>
                      <div className="text-sm font-medium text-slate-900">{safeTitle}</div>
                      {safeSummary ? (
                        <div className="text-xs leading-relaxed text-slate-600">{safeSummary}</div>
                      ) : null}
                      {safeReflected ? (
                        <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-500">
                          {safeReflected}
                        </div>
                      ) : null}
                      {tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {canDeleteRecord(record) ? (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => onDeleteRecord(record)}
                            className="text-[11px] font-medium text-rose-500 hover:text-rose-600"
                          >
                            삭제
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="flex items-center gap-1.5">
                {weeklyTagDots.map((tag) => {
                  const style = WORK_TAG_STYLE_MAP[tag] || DEFAULT_WORK_TAG_STYLE;
                  return <span key={tag} className={`h-2 w-2 rounded-full ${style.dot}`} />;
                })}
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">이번 주 한눈에</p>
              </div>
              <p className="mt-1 text-sm text-slate-700">{calendarSummary.weeklySummary}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="flex items-center gap-2">
                {todayFirstTag ? (() => {
                  const style = WORK_TAG_STYLE_MAP[todayFirstTag] || DEFAULT_WORK_TAG_STYLE;
                  return (
                    <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-medium ${style.softBg} ${style.border} ${style.text}`}>
                      {todayFirstTag}
                    </span>
                  );
                })() : null}
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">오늘 자산화 포인트</p>
              </div>
              <p className="mt-1 text-sm text-slate-700">{calendarSummary.todaySummary}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
