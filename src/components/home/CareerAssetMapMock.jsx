import React from "react";
import { Sparkles, ArrowRight, TrendingUp, Minus, Search, Bell, User, ChevronRight, BarChart2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Mock Data ─────────────────────────────────────────────────────────────────
export const CAREER_ASSET_MOCK = {
  patterns: [
    { label: "문제 정의", pct: 82, color: "bg-violet-500" },
    { label: "지표 기반 개선", pct: 76, color: "bg-blue-500" },
    { label: "이해관계자 조율", pct: 71, color: "bg-teal-500" },
    { label: "프로세스 설계", pct: 68, color: "bg-indigo-500" },
    { label: "우선순위 설정", pct: 64, color: "bg-cyan-500" },
  ],
  traces: [
    "프로젝트 기획",
    "요구사항 정의",
    "데이터 분석",
    "지표 모니터링",
    "이슈 대응",
    "리서치/벤치마킹",
  ],
  orbs: [
    {
      id: "structure",
      label: "문제 구조화",
      sub: "분석·정의·프레이밍",
      color: "#3b82f6",
      glow: "rgba(59,130,246,0.22)",
      ring: "rgba(59,130,246,0.07)",
      textColor: "#1d4ed8",
    },
    {
      id: "standard",
      label: "운영 기준화",
      sub: "기준·프로세스·문서화",
      color: "#8b5cf6",
      glow: "rgba(139,92,246,0.22)",
      ring: "rgba(139,92,246,0.07)",
      textColor: "#6d28d9",
    },
    {
      id: "collab",
      label: "협업 조율",
      sub: "조율·합의·관계관리",
      color: "#14b8a6",
      glow: "rgba(20,184,166,0.22)",
      ring: "rgba(20,184,166,0.07)",
      textColor: "#0f766e",
    },
  ],
  directions: [
    { label: "전략적 기획 리드", pct: 91, color: "bg-violet-500" },
    { label: "데이터 기반 PM", pct: 85, color: "bg-blue-500" },
    { label: "운영 혁신 전문가", pct: 78, color: "bg-teal-500" },
    { label: "조직 내 협업 허브", pct: 72, color: "bg-indigo-500" },
    { label: "신규 서비스 런칭", pct: 64, color: "bg-cyan-500" },
  ],
  jobMatch: {
    score: 87,
    label: "현재 직무 적합도",
    positions: [
      { rank: 1, title: "서비스기획 · PM", badge: "최적" },
      { rank: 2, title: "프로덕트 전략", badge: null },
      { rank: 3, title: "운영기획", badge: null },
    ],
  },
  growthSignals: [
    { label: "새로운 도메인 적응력", trend: "up" },
    { label: "데이터 활용 빈도", trend: "up" },
    { label: "협업 범위 확장", trend: "neutral" },
  ],
  kpi: [
    { label: "기록한 경험", value: "24건" },
    { label: "핵심 자산", value: "3개" },
    { label: "연결된 신호", value: "18개" },
    { label: "활용 가능성 평균", value: "78%" },
  ],
  insightComment:
    "최근 기록 기준, 문제를 구조화하고 기준을 만드는 방향으로 자산이 가장 선명하게 쌓이고 있습니다.",
};

// ── Orb Canvas ────────────────────────────────────────────────────────────────
function OrbCanvas({ orbs }) {
  return (
    <div className="relative flex flex-col items-center gap-2.5 py-2">
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ overflow: "visible" }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="cam-lineGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="cam-lineGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <line x1="50%" y1="29%" x2="50%" y2="50%" stroke="url(#cam-lineGrad1)" strokeWidth="1.5" strokeDasharray="4 3" />
        <line x1="50%" y1="56%" x2="50%" y2="76%" stroke="url(#cam-lineGrad2)" strokeWidth="1.5" strokeDasharray="4 3" />
        <circle cx="50%" cy="40%" r="2.5" fill="#8b5cf6" opacity="0.4" />
        <circle cx="50%" cy="66%" r="2.5" fill="#14b8a6" opacity="0.4" />
      </svg>

      {orbs.map((orb) => (
        <div key={orb.id} className="relative flex flex-col items-center" style={{ zIndex: 1 }}>
          <div
            className="absolute rounded-full"
            style={{
              width: 104,
              height: 104,
              background: `radial-gradient(circle, ${orb.glow} 0%, transparent 70%)`,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
          <div
            className="relative flex flex-col items-center justify-center rounded-full border-2 bg-white"
            style={{
              width: 86,
              height: 86,
              borderColor: orb.color,
              boxShadow: `0 0 18px ${orb.glow}, 0 3px 10px rgba(0,0,0,0.06)`,
            }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle at 40% 35%, ${orb.ring} 0%, transparent 60%)`,
              }}
            />
            <span
              className="relative text-center text-[11px] font-bold leading-tight"
              style={{ color: orb.textColor }}
            >
              {orb.label}
            </span>
            <span className="relative mt-0.5 text-center text-[9px] leading-tight text-slate-400">
              {orb.sub}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Arc Gauge ─────────────────────────────────────────────────────────────────
function ArcGauge({ score }) {
  const circumference = 2 * Math.PI * 36;
  const dashLen = (Math.min(100, score) / 100) * circumference * 0.75;
  return (
    <div className="relative h-20 w-20">
      <svg className="h-20 w-20 -rotate-[135deg]" viewBox="0 0 80 80">
        <defs>
          <linearGradient id="cam-gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <circle
          cx="40" cy="40" r="36" fill="none" stroke="#f1f5f9" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
        />
        <circle
          cx="40" cy="40" r="36" fill="none" stroke="url(#cam-gaugeGrad)" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={`${dashLen} ${circumference - dashLen}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-violet-700">{score}%</span>
      </div>
    </div>
  );
}

// ── Trend Icon ────────────────────────────────────────────────────────────────
function TrendIcon({ trend }) {
  if (trend === "up") return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />;
  if (trend === "down") return <TrendingUp className="h-3.5 w-3.5 rotate-180 text-red-400" />;
  return <Minus className="h-3.5 w-3.5 text-slate-400" />;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CareerAssetMapMock({ onOpenRecordInput, onOpenResumeResult }) {
  const { patterns, traces, orbs, directions, jobMatch, growthSignals, kpi, insightComment } =
    CAREER_ASSET_MOCK;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {/* ── Section Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600 shadow-sm">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold leading-tight text-slate-900 sm:text-[17px]">
              내 커리어 자산 맵
            </h2>
            <p className="text-[11px] leading-tight text-slate-500 sm:text-xs">
              기록된 업무에서 반복 패턴을 찾아 커리어 자산을 보여드립니다
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 sm:flex">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs text-slate-400">경험 검색</span>
          </div>
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
            <Bell className="h-3.5 w-3.5 text-slate-500" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-violet-500" />
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-blue-400">
            <User className="h-4 w-4 text-white" />
          </div>
          <Button
            size="sm"
            className="hidden h-8 rounded-full bg-violet-600 px-4 text-xs text-white shadow-sm hover:bg-violet-700 sm:flex"
            onClick={onOpenRecordInput ?? undefined}
          >
            경험 기록하기
          </Button>
        </div>
      </div>

      {/* ── Pattern Chip Bar ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-100 bg-slate-50/70 px-5 py-2.5 sm:px-6">
        <span className="shrink-0 text-[11px] font-semibold text-slate-500">반복 패턴</span>
        <div className="flex items-center gap-1.5">
          {patterns.map((p) => (
            <div
              key={p.label}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 shadow-sm"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${p.color}`} />
              <span className="text-[11px] font-medium text-slate-700">{p.label}</span>
              <span className="text-[11px] font-bold text-slate-400">{p.pct}%</span>
            </div>
          ))}
        </div>
        <button className="ml-auto shrink-0 text-[11px] font-medium text-violet-600 hover:underline">
          더 보기
        </button>
      </div>

      {/* ── Main Body ───────────────────────────────────────────────── */}
      <div className="flex gap-0">
        {/* Canvas + Insight area */}
        <div className="min-w-0 flex-1 p-4 sm:p-5">
          {/* Desktop 3-column canvas */}
          <div className="hidden gap-3 md:grid" style={{ gridTemplateColumns: "1fr 28px 1fr 28px 1fr" }}>
            {/* Col 1: 업무 흔적 */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
              <div className="mb-2.5 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">업무 흔적</span>
              </div>
              <div className="space-y-1.5">
                {traces.map((t, i) => (
                  <div
                    key={t}
                    className="flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2 shadow-sm"
                  >
                    <span className="text-[10px] font-bold text-blue-300">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-xs text-slate-700">{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Arrow 1 */}
            <div className="flex flex-col items-center justify-center gap-2">
              <ArrowRight className="h-4 w-4 text-slate-200" />
              <ArrowRight className="h-4 w-4 text-slate-200" />
              <ArrowRight className="h-4 w-4 text-slate-200" />
            </div>

            {/* Col 2: 쌓인 자산 orbs */}
            <div className="rounded-2xl border border-violet-100 bg-gradient-to-b from-slate-50 to-white p-3">
              <div className="mb-2.5 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-violet-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-violet-500">쌓인 자산</span>
              </div>
              <OrbCanvas orbs={orbs} />
            </div>

            {/* Arrow 2 */}
            <div className="flex flex-col items-center justify-center gap-2">
              <ArrowRight className="h-4 w-4 text-slate-200" />
              <ArrowRight className="h-4 w-4 text-slate-200" />
              <ArrowRight className="h-4 w-4 text-slate-200" />
            </div>

            {/* Col 3: 활용 방향 */}
            <div className="rounded-2xl border border-teal-100 bg-slate-50/60 p-3">
              <div className="mb-2.5 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-teal-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">활용 방향</span>
              </div>
              <div className="space-y-2">
                {directions.map((d) => (
                  <div
                    key={d.label}
                    className="rounded-xl border border-teal-100 bg-white px-3 py-2 shadow-sm"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700">{d.label}</span>
                      <span className="text-[10px] font-bold text-teal-600">{d.pct}%</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${d.color} opacity-70`}
                        style={{ width: `${d.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile vertical stack */}
          <div className="space-y-3 md:hidden">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
              <div className="mb-2 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">업무 흔적</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {traces.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-blue-100 bg-white px-2.5 py-1 text-xs text-slate-700 shadow-sm"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-violet-100 bg-gradient-to-b from-slate-50 to-white p-3">
              <div className="mb-2 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-violet-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-violet-500">쌓인 자산</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {orbs.map((orb) => (
                  <div
                    key={orb.id}
                    className="rounded-full border-2 px-3 py-1 text-xs font-bold"
                    style={{ borderColor: orb.color, color: orb.textColor }}
                  >
                    {orb.label}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-teal-100 bg-slate-50/60 p-3">
              <div className="mb-2 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-teal-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">활용 방향</span>
              </div>
              <div className="space-y-1.5">
                {directions.map((d) => (
                  <div key={d.label} className="flex items-center gap-2">
                    <span className="text-xs text-slate-600">{d.label}</span>
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${d.color} opacity-70`}
                        style={{ width: `${d.pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-teal-600">{d.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Insight Bar */}
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-blue-50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-violet-500">
                  핵심 인사이트
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-violet-900">{insightComment}</p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                size="sm"
                className="h-7 rounded-full bg-violet-600 px-3 text-[11px] text-white shadow-sm hover:bg-violet-700"
                onClick={onOpenRecordInput ?? undefined}
              >
                경험 기록하기
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 rounded-full border-violet-200 px-3 text-[11px] text-violet-700 hover:bg-violet-50"
                onClick={onOpenResumeResult ?? undefined}
              >
                상세 분석 보기
              </Button>
            </div>
          </div>
        </div>

        {/* ── Right Panel (xl+) ──────────────────────────────────────── */}
        <div className="hidden w-60 shrink-0 flex-col gap-3 border-l border-slate-100 p-4 xl:flex">
          {/* Job Match */}
          <div className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700">직무 연결</span>
              <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold text-violet-600">
                AI 추천
              </span>
            </div>
            <div className="mb-2 flex justify-center">
              <ArcGauge score={jobMatch.score} />
            </div>
            <p className="mb-2.5 text-center text-[10px] text-slate-500">{jobMatch.label}</p>
            <div className="space-y-1.5">
              {jobMatch.positions.map((pos) => (
                <div
                  key={pos.rank}
                  className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-1.5"
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-100 text-[9px] font-bold text-violet-600">
                    {pos.rank}
                  </span>
                  <span className="flex-1 text-[11px] font-medium text-slate-700">{pos.title}</span>
                  {pos.badge && (
                    <span className="rounded-full bg-teal-100 px-1.5 py-0.5 text-[9px] font-bold text-teal-600">
                      {pos.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <button className="mt-2.5 flex w-full items-center justify-center gap-1 text-[11px] font-medium text-violet-600 hover:underline">
              전체 포지션 보기 <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {/* Growth Signals */}
          <div className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm">
            <div className="mb-2 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[11px] font-bold text-slate-700">성장 신호</span>
            </div>
            <p className="mb-2.5 text-[10px] text-slate-400">최근 4주 기준</p>
            <div className="space-y-2">
              {growthSignals.map((g) => (
                <div key={g.label} className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-600">{g.label}</span>
                  <div className="flex items-center gap-1">
                    <TrendIcon trend={g.trend} />
                    <span
                      className={`text-[10px] font-medium ${
                        g.trend === "up"
                          ? "text-emerald-500"
                          : g.trend === "down"
                          ? "text-red-400"
                          : "text-slate-400"
                      }`}
                    >
                      {g.trend === "up" ? "상승" : g.trend === "down" ? "하락" : "보통"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-2.5 flex w-full items-center justify-center gap-1 text-[11px] font-medium text-violet-600 hover:underline">
              상세 인사이트 보기 <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Footer Strip ────────────────────────────────────────── */}
      <div className="border-t border-slate-100 bg-slate-50/70">
        <div className="flex flex-wrap divide-x divide-slate-100">
          {kpi.map((item) => (
            <div
              key={item.label}
              className="flex min-w-[80px] flex-1 flex-col items-center px-2 py-3"
            >
              <span className="text-base font-extrabold text-slate-800 sm:text-lg">{item.value}</span>
              <span className="mt-0.5 text-center text-[10px] leading-tight text-slate-500 sm:text-[11px]">
                {item.label}
              </span>
            </div>
          ))}
          <div className="flex min-w-[160px] flex-1 items-center gap-1.5 px-3 py-3">
            <BarChart2 className="h-4 w-4 shrink-0 text-violet-400" />
            <p className="text-[10px] leading-relaxed text-slate-500 sm:text-[11px]">
              문제 구조화 자산이 가장 빠르게 축적되고 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
