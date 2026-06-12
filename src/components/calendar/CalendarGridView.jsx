import { getDateRecordStatus, getDateStatusClassName, getDateStatusLabel } from "./calendarRecordStatus.js";

const DEFAULT_WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const GENERIC_WORK_TYPES = new Set(["이번 주 기록", "개인 업무", "팀 프로젝트"]);

export default function CalendarGridView({
  weeks = [],
  records = [],
  demoRangeRecords = [],
  useDemoRecords = false,
  entriesByDate = {},
  selectedDate = "",
  today = "",
  weekdayLabels = DEFAULT_WEEKDAY_LABELS,
  cardsByRecordId = {},
  selectedExperienceSignalKey = "all",
  selectedExperienceSignalLabel = "",
  shouldShowMonthEmptyNotice = false,
  monthEmptyNoticeText = "",
  monthSummary = null,
  calendarSummary = null,
  getWeekRangeSegments,
  deriveExperienceSignalsFromRecords,
  recordsHaveExperienceSignal,
  getCalendarWorkTypeLabel,
  normalizeExperienceSignalLabel,
  onSelectDate,
}) {
  const allRecords = [...(useDemoRecords ? demoRangeRecords : []), ...records];

  return (
    <>
      <div className="grid grid-cols-7 gap-0.5 sm:gap-2">
        {weekdayLabels.map((label) => (
          <div key={label} className="px-1 py-0.5 text-center text-xs font-semibold text-slate-400 sm:px-2 sm:py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {weeks.map((week, weekIndex) => {
          const rangeSegments = typeof getWeekRangeSegments === "function" ? getWeekRangeSegments(allRecords, week) : [];
          return (
            <div key={`week_${weekIndex}`} className="relative">
              <div className="grid grid-cols-7 gap-0.5 sm:gap-2">
                {week.map((item) => {
                  const entry = entriesByDate[item.date];
                  const rangeRecords = rangeSegments
                    .filter((segment) => segment.record?.startDate <= item.date && segment.record?.endDate >= item.date)
                    .map((segment) => segment.record);
                  const dayRecordsForSignals = [...(entry?.records || []), ...rangeRecords];
                  const isActive = item.date === selectedDate;
                  const recordCount = entry?.records?.length || 0;
                  const dateRecordStatus = getDateRecordStatus(dayRecordsForSignals, cardsByRecordId);
                  const experienceSignals = typeof deriveExperienceSignalsFromRecords === "function"
                    ? deriveExperienceSignalsFromRecords(dayRecordsForSignals, 3)
                    : [];
                  const matchesSelectedSignal = typeof recordsHaveExperienceSignal === "function"
                    ? recordsHaveExperienceSignal(dayRecordsForSignals, selectedExperienceSignalKey)
                    : true;
                  const isDimmedBySignal = selectedExperienceSignalKey !== "all" && !matchesSelectedSignal;
                  const primaryTask =
                    entry?.tasks?.[0] ||
                    entry?.records?.[0]?.title ||
                    entry?.records?.[0]?.summary ||
                    getCalendarWorkTypeLabel?.(entry?.records?.[0]?.workType) ||
                    getCalendarWorkTypeLabel?.(entry?.workTypes?.[0]) ||
                    "업무 기록";
                  const workTypes = entry?.workTypes || [];
                  const specificWorkTypes = workTypes.filter((type) => !GENERIC_WORK_TYPES.has(type));
                  const visibleWorkTypes = (specificWorkTypes.length ? specificWorkTypes : workTypes).slice(0, 2);
                  const extraWorkTypeCount = Math.max(0, workTypes.length - visibleWorkTypes.length);
                  const calendarDayStatusLabel = experienceSignals.length
                    ? `경험 신호: ${experienceSignals.join(", ")}`
                    : recordCount > 0
                      ? "보완하면 더 좋아요"
                      : "기록 전";
                  const calendarDayAriaLabel = [
                    item.date,
                    getDateStatusLabel(dateRecordStatus),
                    item.isToday ? "오늘" : "",
                    isActive ? "선택됨" : "",
                    selectedExperienceSignalKey !== "all" ? `${selectedExperienceSignalLabel}: ${matchesSelectedSignal ? "있음" : "없음"}` : "",
                    calendarDayStatusLabel,
                  ].filter(Boolean).join(", ");

                  return (
                    <button
                      key={item.date}
                      type="button"
                      aria-label={calendarDayAriaLabel}
                      title={calendarDayAriaLabel}
                      onClick={() => onSelectDate?.(item.date)}
                      className={[
                        "min-h-[68px] min-w-0 rounded-xl border px-1 pt-1.5 pb-6 text-left transition sm:min-h-[92px] sm:px-2 sm:pt-2 sm:pb-7",
                        isActive
                          ? "border-slate-300 bg-slate-50 shadow-sm ring-1 ring-slate-200/70"
                          : item.inCurrentMonth
                            ? "border-slate-200 bg-white hover:border-slate-300"
                            : "border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300",
                        isDimmedBySignal ? "opacity-35" : "",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`text-sm font-semibold ${item.inCurrentMonth ? "text-slate-900" : "text-slate-400"}`}>
                          {item.day}
                        </div>
                        <div className="flex flex-wrap justify-end gap-1">
                          {experienceSignals.length > 0 ? (
                            <span className="rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
                              신호 {experienceSignals.length}
                            </span>
                          ) : null}
                          {item.isToday || item.date === today ? (
                            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                              오늘
                            </span>
                          ) : null}
                          <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${getDateStatusClassName(dateRecordStatus)}`}>
                            {getDateStatusLabel(dateRecordStatus)}
                          </span>
                        </div>
                      </div>

                      {recordCount > 0 ? (
                        <p className="mt-1.5 min-w-0 truncate text-[11px] font-medium leading-tight text-slate-700">
                          {primaryTask}
                        </p>
                      ) : null}

                      <div className="mt-3 flex flex-wrap gap-1">
                        {experienceSignals.map((signal) => (
                          <span key={`${item.date}_${signal}`} className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] text-violet-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                            {signal}
                          </span>
                        ))}
                        {visibleWorkTypes.map((type) => {
                          const displayType = normalizeExperienceSignalLabel?.(getCalendarWorkTypeLabel?.(type)) || type;
                          return (
                            <span key={`${item.date}_${type}`} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
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

      {shouldShowMonthEmptyNotice ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">
          {monthEmptyNoticeText}
        </div>
      ) : null}

      <div className="grid gap-3">
        {monthSummary ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
              <div className="text-xs font-semibold text-slate-500">월간 기록률</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">{monthSummary.recordRate}%</div>
              <div className="mt-1 text-xs text-slate-500">
                {monthSummary.recordedDateCount}/{monthSummary.totalDateCount}일 기록
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
              <div className="text-xs font-semibold text-slate-500">면접/이력서로 발전 가능</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">{monthSummary.detailedDateCount}일</div>
              <div className="mt-1 text-xs text-slate-500">
                보완하면 더 좋아요 {monthSummary.keywordDateCount}일
              </div>
            </div>
          </div>
        ) : null}
        {calendarSummary?.weeklySummary ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
            {calendarSummary.weeklySummary}
          </div>
        ) : null}
        {calendarSummary?.todaySummary ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
            {calendarSummary.todaySummary}
          </div>
        ) : null}
      </div>
    </>
  );
}
