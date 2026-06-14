import { useState } from "react";
import CalendarDateDrawer from "./CalendarDateDrawer.jsx";
import CalendarGridView from "./CalendarGridView.jsx";
import CalendarProjectActionDrawer from "./CalendarProjectActionDrawer.jsx";
import CalendarProjectView from "./CalendarProjectView.jsx";
import CalendarViewTabs from "./CalendarViewTabs.jsx";
import CalendarWeeklyView from "./CalendarWeeklyView.jsx";

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
      {viewMode === "project" && selectedProjectAction ? (
        <CalendarProjectActionDrawer
          key={selectedProjectAction.id || selectedProjectAction.recordId || selectedProjectAction.date}
          action={selectedProjectAction}
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
