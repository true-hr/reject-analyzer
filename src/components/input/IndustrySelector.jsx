// 산업 선택 — v는 고유 stable 키, 엔진 코드값과 일치
const INDUSTRIES = [
  { v: "tech",         t: "IT / SaaS" },
  { v: "commerce",     t: "커머스 / 리테일" },
  { v: "manufacturing",t: "제조" },
  { v: "finance",      t: "금융" },
  { v: "healthcare",   t: "헬스케어" },
  { v: "game",         t: "게임" },
  { v: "content",      t: "콘텐츠" },
  { v: "logistics",    t: "물류" },
  { v: "construction", t: "건설" },
  { v: "energy",       t: "에너지" },
  { v: "public",       t: "공공" },
  { v: "other",        t: "기타" },
];

export default function IndustrySelector({ label, onSelect }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-lg font-semibold text-slate-900">{label}</div>
      <div className="grid grid-cols-2 gap-2">
        {INDUSTRIES.map(({ v, t }) => (
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
