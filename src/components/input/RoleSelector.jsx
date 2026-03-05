// 직무 선택
const ROLES = [
  { v: "pm",        t: "PM / PO" },
  { v: "product",   t: "프로덕트 기획" },
  { v: "data",      t: "데이터" },
  { v: "dev",       t: "개발 / 엔지니어" },
  { v: "design",    t: "디자인" },
  { v: "marketing", t: "마케팅" },
  { v: "sales",     t: "영업 / BD" },
  { v: "ops",       t: "운영 / CS" },
  { v: "hr",        t: "HR" },
  { v: "finance",   t: "재무 / 회계" },
  { v: "unknown",   t: "기타" },
];

export default function RoleSelector({ onSelect }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-lg font-semibold text-slate-900">지원 직무를 선택하세요</div>
      <div className="grid grid-cols-2 gap-2">
        {ROLES.map(({ v, t }) => (
          <button
            key={v + t}
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
