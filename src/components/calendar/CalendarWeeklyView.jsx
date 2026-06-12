function defaultFormatWeekRangeLabel(weekDates = []) {
  if (!weekDates || weekDates.length < 7) return "";
  return `${weekDates[0]} ~ ${weekDates[6]}`;
}

export default function CalendarWeeklyView({
  weekDates = [],
  records = [],
  demoRangeRecords = [],
  useDemoRecords = false,
  selectedDate = "",
  today = "",
  selectedExperienceSignalKey = "all",
  selectedExperienceSignalLabel = "",
  weekSummary = null,
  deriveExperienceSignalsFromRecords,
  recordsHaveExperienceSignal,
  recordHasExperienceSignal,
  getWorkCalendarRecordTypeLabel,
  normalizeExperienceSignalLabel,
  pickUniqueCompact,
  formatWeekRangeLabel = defaultFormatWeekRangeLabel,
  onSelectDate,
  onOpenRecordInput,
}) {
  const allRecords = [...(useDemoRecords ? demoRangeRecords : []), ...records];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">이번 주 경험 흐름</p>
        <p className="text-xs text-slate-400">{formatWeekRangeLabel(weekDates)}</p>
      </div>
      {weekSummary ? (
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
            <div className="text-xs font-semibold text-slate-500">주간 기록 완성도</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">{weekSummary.completionRate}%</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
            <div className="text-xs font-semibold text-slate-500">발전 가능 기록</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">{weekSummary.detailedDateCount}일</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
            <div className="text-xs font-semibold text-slate-500">기록 부족 날짜</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">{weekSummary.missingDates.length}일</div>
          </div>
        </div>
      ) : null}
      <div className="space-y-2">
        {weekDates.map((dayStr) => {
          const parts = dayStr.split("-");
          const monthNum = Number(parts[1]);
          const dayNum = Number(parts[2]);
          const dow = new Date(Number(parts[0]), monthNum - 1, dayNum).getDay();
          const weekdayLabel = ["일", "월", "화", "수", "목", "금", "토"][dow];
          const isActive = dayStr === selectedDate;
          const isToday = dayStr === today;
          const dayRecords = allRecords.filter((record) => {
            if (record.startDate && record.endDate && record.startDate !== record.endDate) {
              return record.startDate <= dayStr && record.endDate >= dayStr;
            }
            return (record.date || record.startDate) === dayStr;
          });
          const hasRecords = dayRecords.length > 0;
          const daySignals = typeof deriveExperienceSignalsFromRecords === "function"
            ? deriveExperienceSignalsFromRecords(dayRecords, 3)
            : [];
          const matchesSelectedSignal = typeof recordsHaveExperienceSignal === "function"
            ? recordsHaveExperienceSignal(dayRecords, selectedExperienceSignalKey)
            : true;
          const isDimmedBySignal = selectedExperienceSignalKey !== "all" && !matchesSelectedSignal;
          const orderedDayRecords = selectedExperienceSignalKey === "all" || typeof recordHasExperienceSignal !== "function"
            ? dayRecords
            : [
                ...dayRecords.filter((record) => recordHasExperienceSignal(record, selectedExperienceSignalKey)),
                ...dayRecords.filter((record) => !recordHasExperienceSignal(record, selectedExperienceSignalKey)),
              ];
          const visible = orderedDayRecords.slice(0, 2);
          const extra = dayRecords.length > 2 ? dayRecords.length - 2 : 0;
          const primaryRecord = visible[0] || null;
          const primaryTitle = String(primaryRecord?.title || primaryRecord?.summary || "").trim() || "제목 없는 기록";
          const workTypes = typeof pickUniqueCompact === "function"
            ? pickUniqueCompact(
                dayRecords.flatMap((record) => [
                  normalizeExperienceSignalLabel?.(getWorkCalendarRecordTypeLabel?.(record)) || getWorkCalendarRecordTypeLabel?.(record),
                  ...(Array.isArray(record.strengthTags) ? record.strengthTags.map((tag) => normalizeExperienceSignalLabel?.(tag) || tag) : []),
                ]),
                3
              )
            : [];
          const weekDayStatusLabel = daySignals.length
            ? `경험 신호: ${daySignals.join(", ")}`
            : hasRecords
              ? "보완하면 더 좋아요"
              : "기록 전";
          const weekDayAriaLabel = [
            dayStr,
            isToday ? "오늘" : "",
            isActive ? "선택됨" : "",
            selectedExperienceSignalKey !== "all" ? `${selectedExperienceSignalLabel}: ${matchesSelectedSignal ? "있음" : "없음"}` : "",
            weekDayStatusLabel,
          ].filter(Boolean).join(", ");
          const rowCls = [
            "grid min-h-[88px] cursor-pointer grid-cols-[64px_minmax(0,1fr)] items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 sm:grid-cols-[76px_minmax(0,1fr)_150px] sm:gap-4",
            isActive
              ? "border-violet-500 bg-violet-50 shadow-md ring-2 ring-violet-500/70"
              : isToday
                ? "border-slate-300 bg-slate-50"
                : hasRecords
                  ? "border-slate-200 bg-slate-50/70 hover:border-violet-300 hover:bg-violet-50/40"
                  : "border-slate-100 bg-white hover:border-violet-300 hover:bg-violet-50/40",
            isDimmedBySignal ? "opacity-45" : "",
          ].join(" ");

          return (
            <div
              key={dayStr}
              role="button"
              tabIndex={0}
              aria-label={weekDayAriaLabel}
              title={weekDayAriaLabel}
              onClick={() => onSelectDate?.(dayStr)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectDate?.(dayStr);
                }
              }}
              className={rowCls}
            >
              <div className="text-center">
                <p className={["text-[10px] font-semibold", isActive ? "text-slate-600" : "text-slate-400"].join(" ")}>{weekdayLabel}</p>
                <p className={["text-sm font-bold", isActive ? "text-slate-900" : "text-slate-700"].join(" ")}>{monthNum}.{dayNum}</p>
                {isActive ? (
                  <span className="mt-0.5 inline-block rounded-full bg-violet-600 px-1.5 py-0.5 text-[9px] font-semibold text-white">선택됨</span>
                ) : null}
                {isToday ? (
                  <span className="mt-0.5 inline-block rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600">오늘</span>
                ) : null}
              </div>
              <div className="hidden justify-center sm:flex">
                {hasRecords ? (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-violet-100 bg-violet-50 text-xs font-semibold text-violet-700">
                    {dayRecords.length}
                  </span>
                ) : (
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-slate-300 bg-white text-lg leading-none text-slate-400 transition hover:border-violet-200 hover:text-violet-600"
                    aria-label={`${dayStr} 기록 추가하기`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectDate?.(dayStr);
                      onOpenRecordInput?.({ date: dayStr });
                    }}
                  >
                    +
                  </button>
                )}
              </div>
              <div className="min-w-0 space-y-1">
                {hasRecords ? (
                  <>
                    <p className="truncate text-sm font-semibold text-slate-900">{primaryTitle}</p>
                    <div className="flex flex-wrap gap-1">
                      {workTypes.map((type) => (
                        <span key={`${dayStr}_${type}`} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                          {type}
                        </span>
                      ))}
                      {extra > 0 ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">+{extra}건</span>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    className="text-left text-sm font-semibold text-slate-500 transition hover:text-violet-700"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectDate?.(dayStr);
                      onOpenRecordInput?.({ date: dayStr });
                    }}
                  >
                    기록 추가하기
                  </button>
                )}
              </div>
              <div className="col-span-2 flex min-w-0 flex-col gap-2 sm:col-span-1 sm:items-end">
                <button
                  type="button"
                  className="hidden min-w-[128px] shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 sm:inline-flex"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectDate?.(dayStr);
                    onOpenRecordInput?.({ date: dayStr });
                  }}
                >
                  + 경험 추가하기
                </button>
                <div className="flex flex-wrap gap-1 sm:justify-end">
                  {daySignals.length > 0 ? (
                    daySignals.map((signal) => (
                      <span key={`${dayStr}_${signal}`} className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-1 text-[11px] font-medium text-violet-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                        {signal}
                      </span>
                    ))
                  ) : hasRecords ? (
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500">보완하면 더 좋아요</span>
                  ) : (
                    <span className="rounded-full bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-400">기록 전</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
