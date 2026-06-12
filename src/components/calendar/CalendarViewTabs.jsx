const VIEW_OPTIONS = [
  { key: "grid", label: "그리드뷰", ariaLabel: "월간 캘린더에서 날짜별 기록 상태 보기" },
  { key: "weekly", label: "위클리뷰", ariaLabel: "선택한 주의 기록 흐름 보기" },
  { key: "project", label: "프로젝트뷰", ariaLabel: "프로젝트별 기록 흐름 보기" },
];

export default function CalendarViewTabs({ value, onChange }) {
  return (
    <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 w-fit">
      {VIEW_OPTIONS.map(({ key, label, ariaLabel }) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          aria-label={ariaLabel}
          onClick={() => onChange?.(key)}
          className={`rounded-lg px-2 py-1 text-[11px] font-medium transition-all sm:px-3 sm:py-1.5 sm:text-xs ${
            value === key
              ? "bg-slate-900 text-white shadow-sm"
              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-200 hover:text-slate-950 hover:shadow-sm"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
