import { useMemo, useState } from "react";
import { buildProjectGroupsFromRecords, getProjectActionStatusLabel } from "./projectActionAdapter.js";

const STATUS_CLASS = {
  planned: "border-violet-100 bg-violet-50 text-violet-600",
  in_progress: "border-violet-200 bg-violet-100 text-violet-800",
  completed: "border-violet-700 bg-violet-700 text-white",
  needs_review: "border-amber-200 bg-amber-50 text-amber-700",
  unknown: "border-slate-200 bg-slate-50 text-slate-600",
};

const ACTION_BAR_CLASS = {
  planned: "bg-violet-200",
  in_progress: "bg-violet-500",
  completed: "bg-violet-700",
  needs_review: "bg-amber-400",
  unknown: "bg-slate-400",
};

const STATUS_SORT_ORDER = {
  needs_review: 0,
  in_progress: 1,
  planned: 2,
  unknown: 3,
  completed: 4,
};

const DAY_MS = 24 * 60 * 60 * 1000;
const BOARD_DAY_COUNT = 10;
const BOARD_GRID_STYLE = { gridTemplateColumns: "minmax(260px, 320px) minmax(0, 1fr)" };

function toTime(date) {
  const value = String(date || "").slice(0, 10);
  const time = value ? new Date(`${value}T00:00:00`).getTime() : NaN;
  return Number.isFinite(time) ? time : null;
}

function toDateString(time) {
  if (!Number.isFinite(time)) return "";
  const date = new Date(time);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatAxisDate(date) {
  const value = String(date || "").slice(0, 10);
  if (!value) return "";
  const [, month, day] = value.split("-");
  return `${Number(month)}.${Number(day)}`;
}

function formatRange(startDate, endDate) {
  if (startDate && endDate && startDate !== endDate) return `${startDate} ~ ${endDate}`;
  return startDate || endDate || "기간 확인 필요";
}

function getTimelineBounds(group, today) {
  const times = [
    toTime(today),
    toTime(group.startDate),
    toTime(group.endDate),
    ...group.actions.flatMap((action) => [toTime(action.startDate), toTime(action.endDate)]),
  ].filter((time) => time != null);
  if (times.length === 0) return null;
  return {
    min: Math.min(...times) - DAY_MS,
    max: Math.max(...times) + DAY_MS,
  };
}

function getBoardBounds(groups, today) {
  const todayTime = toTime(today);
  if (todayTime != null) {
    const min = todayTime - 3 * DAY_MS;
    return {
      min,
      max: min + BOARD_DAY_COUNT * DAY_MS,
      dayCount: BOARD_DAY_COUNT,
    };
  }

  const times = [
    ...groups.flatMap((group) => [
      toTime(group.startDate),
      toTime(group.endDate),
      ...(group.actions || []).flatMap((action) => [
        toTime(action.startDate || action.date),
        toTime(action.endDate || action.startDate || action.date),
      ]),
    ]),
  ].filter((time) => time != null);

  if (times.length === 0) return null;

  const min = Math.min(...times) - DAY_MS;
  return {
    min,
    max: min + BOARD_DAY_COUNT * DAY_MS,
    dayCount: BOARD_DAY_COUNT,
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
    width: `${Math.max(4, right - left)}%`,
  };
}

function getBoardPercent(time, bounds) {
  if (!bounds || time == null) return 0;
  const span = (bounds.dayCount || BOARD_DAY_COUNT) * DAY_MS;
  return Math.max(0, Math.min(100, ((time - bounds.min) / span) * 100));
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getBoardDayIndex(time, bounds) {
  if (!bounds || time == null) return 0;
  return clampNumber(Math.floor((time - bounds.min) / DAY_MS), 0, BOARD_DAY_COUNT - 1);
}

function getBoardActionGridStyle(action, bounds) {
  const start = toTime(action.startDate || action.date);
  const rawEnd = toTime(action.endDate || action.startDate || action.date);
  const end = start == null || rawEnd == null ? rawEnd : Math.max(start, rawEnd);
  const startIndex = getBoardDayIndex(start, bounds);
  const rawEndIndex = !bounds || end == null ? startIndex + 1 : Math.floor((end - bounds.min) / DAY_MS) + 1;
  const endIndex = clampNumber(rawEndIndex, startIndex + 1, BOARD_DAY_COUNT);
  return {
    gridColumn: `${startIndex + 1} / ${endIndex + 1}`,
  };
}

function buildAxisTicks(bounds) {
  if (!bounds) return [];
  const spanDays = bounds.dayCount || Math.max(1, Math.round((bounds.max - bounds.min) / DAY_MS));
  const step = spanDays > BOARD_DAY_COUNT ? Math.ceil(spanDays / BOARD_DAY_COUNT) : 1;
  const ticks = [];
  for (let index = 0; index < Math.min(spanDays, BOARD_DAY_COUNT); index += step) {
    const time = bounds.min + index * DAY_MS;
    const date = toDateString(time);
    ticks.push({
      date,
      label: formatAxisDate(date),
      left: ((index + 0.5) / spanDays) * 100,
    });
  }
  return ticks;
}

function getActionKey(action) {
  return String(action?.recordId || action?.id || `${action?.projectName || ""}_${action?.title || ""}_${action?.date || ""}`);
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

function buildProjectRecommendation(group, today) {
  const actionWithoutRange = group.actions.find((action) => !action.startDate || !action.endDate);
  if (actionWithoutRange) {
    return {
      id: `project-period-${group.id}`,
      title: "Action 기간 정리하기",
      description: "기간과 결과를 적어두면 프로젝트뷰에서 진행 상태를 더 쉽게 볼 수 있어요.",
      projectName: group.projectName,
      suggestedDate: actionWithoutRange.date || today,
      targetType: "project_action",
      priority: "medium",
    };
  }
  const actionWithoutResult = group.actions.find((action) => !String(action.result || "").trim());
  if (actionWithoutResult) {
    return {
      id: `project-result-${group.id}`,
      title: "결과/산출물 추가하기",
      description: "결과를 한 줄 붙이면 프로젝트 Action이 다음 판단에 더 잘 이어져요.",
      projectName: group.projectName,
      suggestedDate: actionWithoutResult.date || today,
      targetType: "project_action",
      priority: "medium",
    };
  }
  if (!group.actions.some((action) => action.status === "in_progress")) {
    return {
      id: `project-next-${group.id}`,
      title: "다음 Action 만들기",
      description: "이번 주에 이어갈 한 가지 일을 Action으로 남겨보세요.",
      projectName: group.projectName,
      suggestedDate: today,
      targetType: "project_action",
      priority: "low",
    };
  }
  return {
    id: `project-week-${group.id}`,
    title: "이번 주 마감 Action 정리하기",
    description: "진행 중인 Action의 결과와 다음 일을 한 줄로 정리해보세요.",
    projectName: group.projectName,
    suggestedDate: today,
    targetType: "project_action",
    priority: "low",
  };
}

function buildProjectRecommendationPayload(today, recommendation) {
  return {
    ...buildProjectActionPayload(recommendation.suggestedDate || today, recommendation.projectName),
    source: "calendar-recommendation",
    recommendedAction: recommendation,
  };
}

export default function CalendarProjectView({
  records = [],
  cardsByRecordId = {},
  projectGroups = null,
  today = "",
  onSelectDate,
  onSelectProjectAction,
  onOpenRecordInput,
  onOpenProjectActionDraft,
}) {
  const groups = Array.isArray(projectGroups) ? projectGroups : buildProjectGroupsFromRecords(records, cardsByRecordId, today);
  const canCreateProjectAction = typeof onOpenProjectActionDraft === "function" || typeof onOpenRecordInput === "function";
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeActionKey, setActiveActionKey] = useState("");

  const allActions = useMemo(
    () =>
      groups
        .flatMap((group) =>
          (group.actions || []).map((action) => ({
            ...action,
            groupId: group.id,
            projectName: action.projectName || group.projectName,
          }))
        )
        .sort((a, b) => {
          const statusDiff = (STATUS_SORT_ORDER[a.status] ?? 9) - (STATUS_SORT_ORDER[b.status] ?? 9);
          if (statusDiff) return statusDiff;
          return String(a.startDate || a.date || "").localeCompare(String(b.startDate || b.date || "")) || String(a.title || "").localeCompare(String(b.title || ""));
        }),
    [groups]
  );
  const boardBounds = useMemo(() => getBoardBounds(groups, today), [groups, today]);
  const axisTicks = useMemo(() => buildAxisTicks(boardBounds), [boardBounds]);
  const todayLeft = getBoardPercent(toTime(today), boardBounds);
  const dayColumnCount = axisTicks.length || BOARD_DAY_COUNT;
  const inProgressCount = allActions.filter((action) => action.status === "in_progress").length;
  const needsReviewCount = allActions.filter((action) => action.status === "needs_review").length;
  const plannedCount = allActions.filter((action) => action.status === "planned").length;

  function openProjectActionDraft(payload) {
    if (typeof onOpenProjectActionDraft === "function") {
      onOpenProjectActionDraft(payload);
      return;
    }
    onOpenRecordInput?.(payload);
  }

  function selectAction(action) {
    setActiveActionKey(getActionKey(action));
    if (action.date) onSelectDate?.(action.date);
    onSelectProjectAction?.(action);
  }

  function renderLegacyProjectCards() {
    return (
      <div className="space-y-4">
        {groups.map((group) => {
          const bounds = getTimelineBounds(group, today);
          const legacyTodayLeft = getPercent(toTime(today), bounds);
          const recommendation = buildProjectRecommendation(group, today);
          return (
            <section key={group.id} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold text-slate-950">{group.projectName}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Action {group.actions.length}개 · {formatRange(group.startDate, group.endDate)}
                  </p>
                </div>
                {canCreateProjectAction ? (
                  <button
                    type="button"
                    className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                    onClick={() => openProjectActionDraft(buildProjectActionPayload(today, group.projectName))}
                  >
                    새 프로젝트 Action 만들기
                  </button>
                ) : null}
              </div>

              <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
                <div className="relative h-9 border-b border-slate-200">
                  <div className="absolute left-0 top-0 text-[10px] font-medium text-slate-400">{group.startDate || "시작일 미정"}</div>
                  <div className="absolute right-0 top-0 text-[10px] font-medium text-slate-400">{group.endDate || "종료일 미정"}</div>
                  {today && bounds ? (
                    <div className="absolute top-0 h-9 border-l border-dashed border-rose-400" style={{ left: `${legacyTodayLeft}%` }}>
                      <span className="ml-1 whitespace-nowrap rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-semibold text-white">TODAY</span>
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 space-y-2">
                  {group.actions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      className="grid w-full grid-cols-[minmax(120px,220px)_1fr] items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-white"
                      onClick={() => selectAction(action)}
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
                        <div className={`absolute top-1 h-3 rounded-full ${ACTION_BAR_CLASS[action.status] || ACTION_BAR_CLASS.unknown}`} style={getActionStyle(action, bounds)} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {recommendation && canCreateProjectAction ? (
                  <div className="rounded-2xl border border-violet-100 bg-violet-50 px-3 py-3">
                    <p className="text-sm font-semibold text-violet-950">{recommendation.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-violet-800">{recommendation.description}</p>
                    <button
                      type="button"
                      className="mt-3 rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                      onClick={() => openProjectActionDraft(buildProjectRecommendationPayload(today, recommendation))}
                    >
                      추천 행동을 Action으로 저장하기
                    </button>
                  </div>
                ) : null}
                {group.actions.map((action) => (
                  <div key={`list_${action.id}`} className="rounded-xl border border-slate-100 bg-white px-3 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{action.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">
                          {action.result || action.summary || (action.status === "needs_review" ? "기간이 지난 Action입니다. 결과 확인이 필요해요." : "오늘 기준으로 진행 상태를 볼 수 있어요.")}
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
                        onClick={() => selectAction(action)}
                      >
                        이 Action 수정하기
                      </button>
                      {onOpenRecordInput ? (
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50"
                          onClick={() => onOpenRecordInput(buildImprovePayload(action))}
                        >
                          기록 보완하기
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
    );
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-violet-200 bg-violet-50/60 px-5 py-7">
        <p className="text-sm font-semibold text-slate-900">아직 진행 중인 프로젝트가 없어요.</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          지원 준비, 포트폴리오, 면접 준비처럼 기간이 있는 일을 Action으로 남겨보세요.
        </p>
        {canCreateProjectAction ? (
          <button
            type="button"
            className="mt-4 rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-violet-700"
            onClick={() => openProjectActionDraft(buildProjectActionPayload(today))}
          >
            이번 주 할 일 추가하기
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">프로젝트 Action 보드</p>
          <p className="mt-1 text-xs text-slate-500">오늘 기준으로 늦어진 일과 다음 Action을 한눈에 확인하세요.</p>
        </div>
        {canCreateProjectAction ? (
          <button
            type="button"
            className="rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-violet-700"
            onClick={() => openProjectActionDraft(buildProjectActionPayload(today))}
          >
            이번 주 할 일 추가하기
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
          전체 {allActions.length}
        </span>
        <span className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
          진행 중 {inProgressCount}
        </span>
        <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          확인 필요 {needsReviewCount}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          예정 {plannedCount}
        </span>
      </div>

      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            <div className="grid w-full justify-items-stretch gap-4 border-b border-slate-100 bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500" style={BOARD_GRID_STYLE}>
              <div>Project / Action</div>
              <div className="relative min-w-0 w-full" data-project-gantt-header-timeline>
                <div className="relative h-5">
                  {axisTicks.map((tick) => (
                    <span key={tick.date} className="absolute top-0 -translate-x-1/2 whitespace-nowrap" style={{ left: `${tick.left}%` }}>
                      {tick.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="max-h-[620px] overflow-auto">
              {allActions.map((action) => {
                const isActive = activeActionKey && activeActionKey === getActionKey(action);
                return (
                  <button
                    key={getActionKey(action)}
                    type="button"
                    className={[
                      "group grid w-full items-center justify-items-stretch gap-4 border-b border-slate-100 px-4 py-4 text-left transition last:border-b-0",
                      isActive ? "bg-violet-50 ring-1 ring-inset ring-violet-200" : "bg-white hover:bg-slate-50",
                    ].join(" ")}
                    style={BOARD_GRID_STYLE}
                    onClick={() => selectAction(action)}
                  >
                    <div className="min-w-0">
                      <p className="inline-flex max-w-full rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                        <span className="truncate">{action.projectName}</span>
                      </p>
                      <p className="mt-2 truncate text-[15px] font-semibold leading-snug text-slate-950">{action.title}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_CLASS[action.status] || STATUS_CLASS.unknown}`}>
                          {getProjectActionStatusLabel(action.status)}
                        </span>
                        <span className="text-[10px] text-slate-400">{formatRange(action.startDate, action.endDate)}</span>
                      </div>
                    </div>

                    <div className="relative grid h-16 w-full min-w-0 overflow-hidden rounded-xl" style={{ gridTemplateColumns: `repeat(${dayColumnCount}, minmax(0, 1fr))` }} data-project-gantt-track>
                      <div className="absolute inset-0 grid w-full" style={{ gridTemplateColumns: `repeat(${dayColumnCount}, minmax(0, 1fr))` }}>
                        {axisTicks.map((tick) => (
                          <span key={`${getActionKey(action)}_cell_${tick.date}`} className="h-full w-full border-l border-white/80 bg-slate-100 first:border-l-0" />
                        ))}
                      </div>
                      {today && boardBounds ? (
                        <span className="absolute top-0 h-full border-l border-dashed border-rose-400" style={{ left: `${todayLeft}%` }} data-project-gantt-today-line />
                      ) : null}
                      <div className="absolute inset-x-0 top-5 grid h-6 w-full" style={{ gridTemplateColumns: `repeat(${dayColumnCount}, minmax(0, 1fr))` }}>
                        <span className={`h-6 min-w-4 rounded-full shadow-sm ${ACTION_BAR_CLASS[action.status] || ACTION_BAR_CLASS.unknown}`} style={getBoardActionGridStyle(action, boardBounds)} data-project-gantt-action-bar />
                      </div>
                      <span className="absolute right-2 top-1 hidden rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500 shadow-sm group-hover:inline-flex">
                        클릭해서 수정
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {today && boardBounds ? (
              <div className="grid w-full justify-items-stretch gap-4 border-t border-slate-100 bg-slate-50 px-4" style={BOARD_GRID_STYLE}>
                <div />
                <div className="relative h-8 min-w-0 w-full" data-project-gantt-today-parent>
                  <span className="absolute top-2 h-5 border-l border-dashed border-rose-400" style={{ left: `${todayLeft}%` }}>
                    <span className="ml-1 whitespace-nowrap rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-semibold text-white">TODAY</span>
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
          onClick={() => setDetailOpen((value) => !value)}
          aria-expanded={detailOpen}
        >
          <div>
            <p className="text-sm font-semibold text-slate-950">{detailOpen ? "상세 타임라인 접기" : "상세 타임라인 보기"}</p>
            <p className="mt-1 text-xs text-slate-500">기존 프로젝트별 카드형 타임라인을 그대로 확인합니다.</p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            {detailOpen ? "접기" : "펼치기"}
          </span>
        </button>
        {detailOpen ? <div className="border-t border-slate-100 p-4">{renderLegacyProjectCards()}</div> : null}
      </section>
    </div>
  );
}
