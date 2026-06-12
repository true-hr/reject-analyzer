function getProjectKey(record) {
  return String(record?.projectName || record?.project_name || record?.rawPayload?.projectName || record?.projectNameLabel || "").trim();
}

function getRecordDate(record) {
  return String(record?.startDate || record?.date || record?.record_date || "").slice(0, 10);
}

function getRecordEndDate(record) {
  return String(record?.endDate || record?.startDate || record?.date || record?.record_date || "").slice(0, 10);
}

function groupProjectRecords(records = []) {
  return records.reduce((acc, record) => {
    const hasProjectSignal =
      getProjectKey(record) ||
      record?.recordType === "teamProject" ||
      record?.recordType === "personal" ||
      record?.workType === "project" ||
      record?.rawPayload?.track === "project";
    if (!hasProjectSignal) return acc;
    const key = getProjectKey(record) || "프로젝트명 미정";
    if (!acc[key]) acc[key] = [];
    acc[key].push(record);
    return acc;
  }, {});
}

function buildImprovePayload(date, record) {
  return {
    date,
    recordId: record?.id || null,
    mode: "improve",
    source: "calendar-project-view",
    record,
  };
}

export default function CalendarProjectView({ records = [], today = "", onSelectDate, onOpenRecordInput }) {
  const groups = groupProjectRecords(records);
  const entries = Object.entries(groups);

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
        프로젝트명이 있는 기록이 아직 없어요. 프로젝트나 업무명을 남기면 이곳에서 흐름을 볼 수 있어요.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">프로젝트별 경험 흐름</p>
        {today ? <span className="text-xs text-slate-400">오늘 {today}</span> : null}
      </div>
      <div className="space-y-3">
        {entries.map(([projectName, projectRecords]) => (
          <div key={projectName} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-slate-900">{projectName}</div>
                <p className="mt-1 text-xs text-slate-500">진행 상태 미정 · 기록 {projectRecords.length}건</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-500">
                현재 데이터 기준
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {projectRecords
                .slice()
                .sort((a, b) => getRecordDate(a).localeCompare(getRecordDate(b)))
                .map((record) => {
                  const start = getRecordDate(record);
                  const end = getRecordEndDate(record);
                  const hasRange = start && end && start !== end;
                  const title = String(record?.title || record?.summary || "프로젝트 Action").trim();
                  return (
                    <div
                      key={record?.id || `${projectName}_${start}_${title}`}
                      role="button"
                      tabIndex={0}
                      className="w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-left transition hover:border-slate-300 hover:bg-white"
                      onClick={() => {
                        if (start) onSelectDate?.(start);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          if (start) onSelectDate?.(start);
                        }
                      }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-sm font-medium text-slate-800">{title}</span>
                        <span className="text-[10px] text-slate-400">{hasRange ? `${start} ~ ${end}` : start || "날짜 미정"}</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-slate-200">
                        <div className="h-2 rounded-full bg-slate-500" style={{ width: hasRange ? "72%" : "28%" }} />
                      </div>
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          className="text-[11px] font-semibold text-violet-700"
                          onClick={(event) => {
                            event.stopPropagation();
                            onOpenRecordInput?.(buildImprovePayload(start || today, record));
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              event.stopPropagation();
                              onOpenRecordInput?.(buildImprovePayload(start || today, record));
                            }
                          }}
                        >
                          이 기록을 보완하기
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
