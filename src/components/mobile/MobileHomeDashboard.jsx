import { Calendar, FileText, Target, TrendingUp } from "lucide-react";

const STAT_CARDS = [
  { label: "지원 현황",   Icon: FileText,   value: "-", color: "bg-violet-50 text-violet-600" },
  { label: "이번 달 목표", Icon: Target,     value: "-", color: "bg-blue-50 text-blue-600" },
  { label: "성장 지표",   Icon: TrendingUp, value: "-", color: "bg-emerald-50 text-emerald-600" },
  { label: "다음 일정",   Icon: Calendar,   value: "-", color: "bg-amber-50 text-amber-600" },
];

export default function MobileHomeDashboard({ onNavigate }) {
  const navigate = onNavigate ?? (() => {});

  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-4">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 p-4 text-white shadow-sm">
        <p className="text-xs font-medium opacity-80">PASSMAP</p>
        <h2 className="mt-1 text-lg font-bold leading-snug">오늘의 취업 전략</h2>
        <p className="mt-1 text-xs opacity-70">목표를 향한 매일의 기록</p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => navigate("analysis")}
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 transition-opacity active:opacity-70"
          >
            분석 시작하기
          </button>
          <button
            type="button"
            onClick={() => navigate("record")}
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/30 transition-opacity active:opacity-70"
          >
            기록하기
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {STAT_CARDS.map(({ label, Icon, value, color }) => (
          <div
            key={label}
            className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-white p-3 shadow-sm"
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{value}</p>
              <p className="text-[11px] text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Calendar preview — 기록 탭에서 자세히 보기 */}
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">이번 달 일정</p>
          <button
            type="button"
            onClick={() => navigate("record")}
            className="text-[11px] text-violet-500"
          >
            기록 탭에서 자세히 보기 →
          </button>
        </div>
        <div className="flex items-center justify-center rounded-lg bg-slate-50 py-8">
          <p className="text-xs text-slate-400">캘린더 준비 중</p>
        </div>
      </div>
    </div>
  );
}
