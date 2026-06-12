import { buildProjectGroupsFromRecords, getProjectActionStatusLabel } from "./projectActionAdapter.js";

const STATUS_CLASS = {
  planned: "border-sky-200 bg-sky-50 text-sky-700",
  in_progress: "border-emerald-200 bg-emerald-50 text-emerald-700",
  completed: "border-slate-200 bg-slate-100 text-slate-600",
  needs_review: "border-amber-200 bg-amber-50 text-amber-700",
  unknown: "border-amber-200 bg-amber-50 text-amber-700",
};

function toTime(date) {
  const value = String(date || "").slice(0, 10);
  const time = value ? new Date(`${value}T00:00:00`).getTime() : NaN;
  return Number.isFinite(time) ? time : null;
}

function formatRange(startDate, endDate) {
  if (startDate && endDate && startDate !== endDate) return `${startDate} ~ ${endDate}`;
  return startDate || endDate || "기간이 없어 확인이 필요해요";
}

function getTimelineBounds(group, today) {
  const times = [
    toTime(today),
    toTime(group.startDate),
    toTime(group.endDate),
    ...group.actions.flatMap((action) => [toTime(action.startDate), toTime(action.endDate)]),
  ].filter((time) => time != null);
  if (times.length === 0) return null;
  const day = 24 * 60 * 60 * 1000;
  return {
    min: Math.min(...times) - day,
    max: Math.max(...times) + day,
  };
}

function getPercent(time, bounds) {
  if (!bounds || time == null || bounds.max <= bounds.min) return 0;
  return Math.max(0, Math.min(100, ((time - bounds.min) / (bounds.max - bounds.min)) * 100));
}

function getActionStyle(action, bounds) {
  const start = toTime(action.startDate || action.date);
  const end = toTime(action.endDate || action.startDate || action.date);
  const left = getPercent(start, bounds);
  const right = getPercent(end, bounds);
  return {
    left: `${left}%`,
    width: `${Math.max(6, right - left)}%`,
  };
}

function buildImprovePayload(action) {
  return {
    date: action.date,
    recordId: action.recordId,
    mode: "improve",
    source: "project-view",
    record: action.record,
  };
}

function buildProjectActionPayload(today, projectName = "") {
  return {
    date: today,
    mode: "project-action",
    source: "project-view",
    recordType: "teamProject",
    projectName,
  };
}

export default function CalendarProjectView({
  records = [],
  cardsByRecordId = {},
  today = "",
  onSelectDate,
  onOpenRecordInput,
}) {
  const groups = buildProjectGroupsFromRecords(records, cardsByRecordId, today);

  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6">
        <p className="text-sm font-semibold text-slate-900">아직 프로젝트 Action이 없어요.</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          지원 준비, 포트폴리오, 면접 준비처럼 기간이 있는 일을 Action으로 남겨보세요.
        </p>
        {onOpenRecordInput ? (
          <button
            type="button"
            className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            onClick={() => onOpenRecordInput(buildProjectActionPayload(today))}
          >
            새 프로젝트 Action 만들기
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">프로젝트 Action 타임라인</p>
          <p className="mt-1 text-xs text-slate-500">기간과 결과를 적으면 프로젝트뷰에서 진행 상태를 볼 수 있어요.</p>
        </div>
        {onOpenRecordInput ? (
          <button
            type="button"
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            onClick={() => onOpenRecordInput(buildProjectActionPayload(today))}
          >
            새 프로젝트 Action 만들기
          </button>
        ) : null}
      </div>

      <div className="space-y-4">
        {groups.map((group) => {
          const bounds = getTimelineBounds(group, today);
          const todayLeft = getPercent(toTime(today), bounds);
          return (
            <section key={group.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-slate-950">{group.projectName}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Action {group.actions.length}개 · {formatRange(group.startDate, group.endDate)}
                  </p>
                </div>
                {onOpenRecordInput ? (
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={() => onOpenRecordInput(buildProjectActionPayload(today, group.projectName))}
                  >
                    새 프로젝트 Action 만들기
                  </button>
                ) : null}
              </div>

              <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                <div className="relative h-8 border-b border-slate-200">
                  <div className="absolute left-0 top-0 text-[10px] font-medium text-slate-400">{group.startDate || "시작일 미정"}</div>
                  <div className="absolute right-0 top-0 text-[10px] font-medium text-slate-400">{group.endDate || "종료일 미정"}</div>
                  {today && bounds ? (
                    <div className="absolute top-0 h-8 border-l border-red-400" style={{ left: `${todayLeft}%` }}>
                      <span className="ml-1 whitespace-nowrap text-[10px] font-semibold text-red-500">Today</span>
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 space-y-2">
                  {group.actions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      className="grid w-full grid-cols-[minmax(120px,220px)_1fr] items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-white"
                      onClick={() => {
                        if (action.date) onSelectDate?.(action.date);
                      }}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-xs font-semibold text-slate-800">{action.title}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_CLASS[action.status] || STATUS_CLASS.unknown}`}>
                            {getProjectActionStatusLabel(action.status)}
                          </span>
                          <span className="text-[10px] text-slate-400">{formatRange(action.startDate, action.endDate)}</span>
                        </div>
                      </div>
                      <div className="relative h-5 rounded-full bg-slate-200">
                        <div className="absolute top-1 h-3 rounded-full bg-slate-700" style={getActionStyle(action, bounds)} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {group.actions.map((action) => (
                  <div key={`list_${action.id}`} className="rounded-xl border border-slate-100 bg-white px-3 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{action.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">
                          {action.result || action.summary || (action.status === "needs_review" ? "기간이 지나 확인이 필요해요." : "오늘 기준으로 진행 상태를 볼 수 있어요.")}
                        </p>
                      </div>
                      <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${STATUS_CLASS[action.status] || STATUS_CLASS.unknown}`}>
                        {getProjectActionStatusLabel(action.status)}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        onClick={() => {
                          if (action.date) onSelectDate?.(action.date);
                        }}
                      >
                        이 Action 수정하기
                      </button>
                      {onOpenRecordInput ? (
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50"
                          onClick={() => onOpenRecordInput(buildImprovePayload(action))}
                        >
                          이 기록 보완하기
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
