const VIEW_OPTIONS = [
  { key: "grid", label: "그리드뷰", ariaLabel: "월간 캘린더에서 날짜별 기록 상태 보기" },
  { key: "weekly", label: "위클리뷰", ariaLabel: "선택한 주의 기록 흐름 보기" },
  { key: "project", label: "프로젝트뷰", ariaLabel: "프로젝트별 기록 흐름 보기" },
];

export default function CalendarViewTabs({ value, onChange }) {
  return (
    <div className="flex w-fit gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
      {VIEW_OPTIONS.map(({ key, label, ariaLabel }) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          aria-label={ariaLabel}
          onClick={() => onChange?.(key)}
          className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all sm:px-4 sm:text-xs ${
            value === key
              ? "bg-slate-950 text-white shadow-sm"
              : "bg-slate-50 text-slate-600 hover:bg-violet-50 hover:text-violet-700"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
