import CalendarDateDrawer from "./CalendarDateDrawer.jsx";
import CalendarProjectView from "./CalendarProjectView.jsx";
import CalendarViewTabs from "./CalendarViewTabs.jsx";

export default function PassmapCalendarShell({
  viewMode,
  onViewModeChange,
  selectedDate,
  selectedRecords = [],
  cardsByRecordId = {},
  records = [],
  today = "",
  children,
  onSelectDate,
  onOpenRecordInput,
  onOpenResumeResult,
}) {
  return (
    <div className="grid gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-3">
        <CalendarViewTabs value={viewMode} onChange={onViewModeChange} />
        {viewMode === "project" ? (
          <CalendarProjectView records={records} today={today} onSelectDate={onSelectDate} onOpenRecordInput={onOpenRecordInput} />
        ) : (
          children
        )}
      </div>
      <CalendarDateDrawer
        selectedDate={selectedDate}
        records={selectedRecords}
        cardsByRecordId={cardsByRecordId}
        onOpenRecordInput={onOpenRecordInput}
        onOpenResumeResult={onOpenResumeResult}
      />
    </div>
  );
}
