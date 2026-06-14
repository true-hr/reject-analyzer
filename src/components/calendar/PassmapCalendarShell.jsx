import { useMemo, useState } from "react";
import CalendarDateDrawer from "./CalendarDateDrawer.jsx";
import CalendarGridView from "./CalendarGridView.jsx";
import CalendarProjectActionDrawer from "./CalendarProjectActionDrawer.jsx";
import CalendarProjectView from "./CalendarProjectView.jsx";
import CalendarViewTabs from "./CalendarViewTabs.jsx";
import CalendarWeeklyView from "./CalendarWeeklyView.jsx";
import { buildProjectGroupsFromRecords } from "./projectActionAdapter.js";

export default function PassmapCalendarShell({
  viewMode,
  onViewModeChange,
  selectedDate,
  selectedRecords = [],
  cardsByRecordId = {},
  records = [],
  today = "",
  children,
  header = null,
  gridProps = null,
  weeklyProps = null,
  projectProps = null,
  legacyList = null,
  onSelectDate,
  onOpenRecordInput,
  onOpenResumeResult,
  onUpdateRecord,
  onDeleteRecord,
  showDrawer = true,
}) {
  const [selectedProjectAction, setSelectedProjectAction] = useState(null);

  function handleSelectDate(date) {
    setSelectedProjectAction(null);
    onSelectDate?.(date);
  }

  function handleSelectProjectAction(action) {
    if (!action) return;
    setSelectedProjectAction(action);
    if (action.date) onSelectDate?.(action.date);
  }

  const activeProjectAction = useMemo(() => {
    if (!selectedProjectAction) return null;
    const groups = Array.isArray(projectProps?.projectGroups)
      ? projectProps.projectGroups
      : buildProjectGroupsFromRecords(records, cardsByRecordId, today);
    const selectedRecordId = String(selectedProjectAction.recordId || "").trim();
    const selectedActionId = String(selectedProjectAction.id || "").trim();
    return groups
      .flatMap((group) => group.actions || [])
      .find((action) => {
        if (selectedRecordId && String(action.recordId || "") === selectedRecordId) return true;
        return selectedActionId && String(action.id || "") === selectedActionId;
      }) || null;
  }, [cardsByRecordId, projectProps, records, selectedProjectAction, today]);

  const viewContent =
    viewMode === "grid" && gridProps ? (
      <CalendarGridView {...gridProps} />
    ) : viewMode === "weekly" && weeklyProps ? (
      <CalendarWeeklyView {...weeklyProps} />
    ) : viewMode === "project" ? (
      <CalendarProjectView records={records} today={today} onSelectDate={handleSelectDate} onSelectProjectAction={handleSelectProjectAction} onOpenRecordInput={onOpenRecordInput} {...(projectProps || {})} />
    ) : legacyList && viewMode === "list" ? (
      legacyList
    ) : (
      children
    );

  if (!showDrawer) {
    return (
      <>
        {header}
        <CalendarViewTabs value={viewMode} onChange={onViewModeChange} />
        {viewContent}
      </>
    );
  }

  return (
    <div className="grid gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-3">
        {header}
        <CalendarViewTabs value={viewMode} onChange={onViewModeChange} />
        {viewContent}
      </div>
      {viewMode === "project" && activeProjectAction ? (
        <CalendarProjectActionDrawer
          key={activeProjectAction.id || activeProjectAction.recordId || activeProjectAction.date}
          action={activeProjectAction}
          onOpenRecordInput={onOpenRecordInput}
          onUpdateRecord={onUpdateRecord}
          onDeleteRecord={onDeleteRecord}
        />
      ) : (
        <CalendarDateDrawer
          selectedDate={selectedDate}
          records={selectedRecords}
          cardsByRecordId={cardsByRecordId}
          onOpenRecordInput={onOpenRecordInput}
          onOpenResumeResult={onOpenResumeResult}
          onUpdateRecord={onUpdateRecord}
          onDeleteRecord={onDeleteRecord}
        />
      )}
    </div>
  );
}
