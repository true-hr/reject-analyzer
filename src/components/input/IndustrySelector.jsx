import { INDUSTRY_CATEGORY_OPTIONS } from "./categoryOptions";

export default function IndustrySelector({ label, onSelect, options = INDUSTRY_CATEGORY_OPTIONS }) {
  const items = Array.isArray(options) ? options : INDUSTRY_CATEGORY_OPTIONS;

  return (
    <div className="flex flex-col gap-4">
      <div className="text-lg font-semibold text-slate-900">{label}</div>
      <div className="grid grid-cols-2 gap-2">
        {items.map(({ v, t }) => (
          <button
            key={v}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-left transition-colors hover:border-slate-900 hover:bg-slate-50"
            onClick={() => onSelect(v)}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
