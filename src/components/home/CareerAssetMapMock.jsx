import React from "react";
import {
  Sparkles, TrendingUp, Minus, Search, Bell, User, ChevronRight, BarChart2, Zap,
} from "lucide-react";
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
    { label: "프로젝트 기획",    color: "#3B82F6", bg: "rgba(59,130,246,0.14)" },
    { label: "요구사항 정의",    color: "#6366F1", bg: "rgba(99,102,241,0.14)" },
    { label: "데이터 분석",      color: "#14B8A6", bg: "rgba(20,184,166,0.14)" },
    { label: "지표 모니터링",    color: "#F43F5E", bg: "rgba(244,63,94,0.14)" },
    { label: "이슈 대응",        color: "#F97316", bg: "rgba(249,115,22,0.14)" },
    { label: "리서치/벤치마킹",  color: "#8B5CF6", bg: "rgba(139,92,246,0.14)" },
  ],
  orbs: [
    {
      id: "structure",
      lines: ["문제", "구조화"],
      gradient: "radial-gradient(circle at 34% 26%, rgba(255,255,255,0.92) 0%, #BFDBFE 10%, #60A5FA 28%, #2563EB 62%, #1E3A8A 100%)",
      shadow: "inset 0 1px 10px rgba(255,255,255,0.42), inset 0 -18px 28px rgba(15,23,42,0.18), 0 0 0 9px rgba(59,130,246,0.08), 0 18px 38px rgba(37,99,235,0.30), 0 0 78px rgba(96,165,250,0.34)",
      border: "1px solid rgba(219,234,254,0.95)",
      size: 112,
    },
    {
      id: "standard",
      lines: ["운영", "기준화"],
      gradient: "radial-gradient(circle at 34% 26%, rgba(255,255,255,0.90) 0%, #DDD6FE 10%, #A78BFA 28%, #7C3AED 62%, #4C1D95 100%)",
      shadow: "inset 0 1px 10px rgba(255,255,255,0.42), inset 0 -18px 28px rgba(15,23,42,0.18), 0 0 0 9px rgba(124,58,237,0.08), 0 18px 38px rgba(124,58,237,0.28), 0 0 78px rgba(167,139,250,0.32)",
      border: "1px solid rgba(237,233,254,0.95)",
      size: 104,
    },
    {
      id: "collab",
      lines: ["협업", "조율"],
      gradient: "radial-gradient(circle at 34% 26%, rgba(255,255,255,0.90) 0%, #99F6E4 10%, #2DD4BF 28%, #0D9488 62%, #134E4A 100%)",
      shadow: "inset 0 1px 10px rgba(255,255,255,0.42), inset 0 -18px 28px rgba(15,23,42,0.18), 0 0 0 9px rgba(20,184,166,0.08), 0 18px 38px rgba(13,148,136,0.28), 0 0 78px rgba(45,212,191,0.30)",
      border: "1px solid rgba(204,251,241,0.95)",
      size: 104,
    },
  ],
  directions: [
    { label: "전략적 기획 리드",   pct: 91, gradFrom: "#60A5FA", gradTo: "#2563EB" },
    { label: "데이터 기반 PM",     pct: 85, gradFrom: "#A78BFA", gradTo: "#7C3AED" },
    { label: "운영 혁신 전문가",   pct: 78, gradFrom: "#2DD4BF", gradTo: "#14B8A6" },
    { label: "조직 내 협업 허브",  pct: 72, gradFrom: "#FDBA74", gradTo: "#F97316" },
    { label: "신규 서비스 런칭",   pct: 64, gradFrom: "#FB7185", gradTo: "#E11D48" },
  ],
  jobMatch: {
    score: 87,
    label: "현재 직무 적합도",
    positions: [
      { rank: 1, title: "서비스기획 · PM", badge: "최적" },
      { rank: 2, title: "프로덕트 전략",   badge: null },
      { rank: 3, title: "운영기획",         badge: null },
    ],
  },
  growthSignals: [
    { label: "새로운 도메인 적응력", trend: "up" },
    { label: "데이터 활용 빈도",    trend: "up" },
    { label: "협업 범위 확장",      trend: "neutral" },
  ],
  kpi: [
    { label: "기록한 경험",        value: "24건" },
    { label: "핵심 자산",          value: "3개" },
    { label: "연결된 신호",        value: "18개" },
    { label: "활용 가능성 평균",   value: "78%" },
  ],
  insightComment: "최근 기록 기준, 문제를 구조화하고 기준을 만드는 방향으로 자산이 가장 선명하게 쌓이고 있습니다.",
};

// ── Decorative particle positions ─────────────────────────────────────────────
const PARTICLES = [
  { x: "18%", y: "8%",  s: 5, c: "#93C5FD", o: 0.65 },
  { x: "80%", y: "6%",  s: 4, c: "#A78BFA", o: 0.55 },
  { x: "10%", y: "60%", s: 4, c: "#2DD4BF", o: 0.60 },
  { x: "87%", y: "58%", s: 5, c: "#93C5FD", o: 0.50 },
  { x: "50%", y: "92%", s: 3, c: "#A78BFA", o: 0.55 },
  { x: "30%", y: "17%", s: 3, c: "#F0F9FF", o: 0.80 },
  { x: "72%", y: "15%", s: 3, c: "#F0F9FF", o: 0.75 },
  { x: "7%",  y: "36%", s: 8, c: "#93C5FD", o: 0.22, b: true },
  { x: "93%", y: "40%", s: 9, c: "#A78BFA", o: 0.18, b: true },
  { x: "50%", y: "97%", s: 7, c: "#2DD4BF", o: 0.20, b: true },
  { x: "40%", y: "82%", s: 3, c: "#93C5FD", o: 0.45 },
  { x: "62%", y: "80%", s: 3, c: "#2DD4BF", o: 0.45 },
];

// ── Arc Gauge ─────────────────────────────────────────────────────────────────
function ArcGauge({ score }) {
  const C = 2 * Math.PI * 36;
  const dash = (Math.min(100, score) / 100) * C * 0.75;
  return (
    <div className="relative h-20 w-20">
      <svg className="h-20 w-20 -rotate-[135deg]" viewBox="0 0 80 80">
        <defs>
          <linearGradient id="cam-gaugeG" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <circle cx="40" cy="40" r="36" fill="none" stroke="#f1f5f9" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={`${C * 0.75} ${C * 0.25}`} />
        <circle cx="40" cy="40" r="36" fill="none" stroke="url(#cam-gaugeG)" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={`${dash} ${C - dash}`} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
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

// ── SVG Connection Layer ──────────────────────────────────────────────────────
function ConnectionSVG() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-0 hidden lg:block"
      viewBox="0 0 1000 420"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {/* ── Left → Center paths ─────────────────────────────────── */}
      {/* 프로젝트 기획 → 문제 구조화 */}
      <path d="M 220 92 C 300 92, 330 105, 430 132"
        fill="none" stroke="rgba(96,165,250,0.36)" strokeWidth="1.2" strokeLinecap="round" />
      {/* 요구사항 정의 → 문제 구조화 */}
      <path d="M 220 144 C 305 144, 340 142, 430 152"
        fill="none" stroke="rgba(96,165,250,0.30)" strokeWidth="1.2" strokeLinecap="round" />
      {/* 데이터 분석 → 협업 조율 */}
      <path d="M 220 196 C 310 196, 350 245, 430 272"
        fill="none" stroke="rgba(45,212,191,0.34)" strokeWidth="1.2" strokeLinecap="round" />
      {/* 지표 모니터링 → 운영 기준화 */}
      <path d="M 220 248 C 300 248, 335 292, 392 292"
        fill="none" stroke="rgba(167,139,250,0.34)" strokeWidth="1.2" strokeLinecap="round" />
      {/* 이슈 대응 → 운영 기준화 */}
      <path d="M 220 300 C 305 300, 335 318, 392 308"
        fill="none" stroke="rgba(167,139,250,0.28)" strokeWidth="1.2" strokeLinecap="round" />
      {/* 리서치/벤치마킹 → 협업 조율 */}
      <path d="M 220 352 C 310 352, 350 320, 475 302"
        fill="none" stroke="rgba(45,212,191,0.28)" strokeWidth="1.2" strokeLinecap="round" />

      {/* ── Center → Right paths ────────────────────────────────── */}
      {/* 문제 구조화 → 전략적 기획 리드 */}
      <path d="M 560 132 C 650 100, 710 92, 780 92"
        fill="none" stroke="rgba(96,165,250,0.36)" strokeWidth="1.2" strokeLinecap="round" />
      {/* 문제 구조화 → 데이터 기반 PM */}
      <path d="M 570 156 C 660 146, 710 144, 780 144"
        fill="none" stroke="rgba(167,139,250,0.34)" strokeWidth="1.2" strokeLinecap="round" />
      {/* 협업 조율 → 운영 혁신 전문가 */}
      <path d="M 610 272 C 690 210, 720 196, 780 196"
        fill="none" stroke="rgba(45,212,191,0.34)" strokeWidth="1.2" strokeLinecap="round" />
      {/* 협업 조율 → 조직 내 협업 허브 */}
      <path d="M 610 292 C 690 260, 720 248, 780 248"
        fill="none" stroke="rgba(251,146,60,0.28)" strokeWidth="1.2" strokeLinecap="round" />
      {/* 운영 기준화 → 신규 서비스 런칭 */}
      <path d="M 500 292 C 620 340, 700 300, 780 300"
        fill="none" stroke="rgba(251,113,133,0.28)" strokeWidth="1.2" strokeLinecap="round" />

      {/* ── Orb inter-connections (dashed) ──────────────────────── */}
      {/* 문제 구조화 → 운영 기준화 */}
      <path d="M 490 166 C 460 195, 424 215, 402 206"
        fill="none" stroke="rgba(96,165,250,0.38)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 8" />
      {/* 문제 구조화 → 협업 조율 */}
      <path d="M 490 166 C 520 195, 556 215, 578 206"
        fill="none" stroke="rgba(96,165,250,0.38)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 8" />
      {/* 운영 기준화 → 협업 조율 */}
      <path d="M 452 266 C 490 288, 530 288, 570 266"
        fill="none" stroke="rgba(147,197,253,0.38)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 8" />

      {/* ── Node dots on orb connections ────────────────────────── */}
      <circle cx="446" cy="187" r="2.5" fill="#93C5FD" opacity="0.75" />
      <circle cx="534" cy="187" r="2.5" fill="#93C5FD" opacity="0.75" />
      <circle cx="490" cy="280" r="3"   fill="#A78BFA" opacity="0.65" />

      {/* ── Particle dots on left paths ─────────────────────────── */}
      <circle cx="318" cy="97"  r="3"   fill="#93C5FD" opacity="0.65" />
      <circle cx="374" cy="119" r="2.5" fill="#93C5FD" opacity="0.55" />
      <circle cx="314" cy="224" r="3"   fill="#2DD4BF" opacity="0.60" />
      <circle cx="382" cy="260" r="3"   fill="#A78BFA" opacity="0.60" />
      <circle cx="316" cy="307" r="2.5" fill="#A78BFA" opacity="0.50" />
      <circle cx="372" cy="340" r="2.5" fill="#2DD4BF" opacity="0.50" />

      {/* ── Particle dots on right paths ────────────────────────── */}
      <circle cx="658" cy="108" r="3"   fill="#93C5FD" opacity="0.65" />
      <circle cx="706" cy="148" r="2.5" fill="#A78BFA" opacity="0.55" />
      <circle cx="672" cy="228" r="3"   fill="#2DD4BF" opacity="0.60" />
      <circle cx="702" cy="266" r="2.5" fill="#FDBA74" opacity="0.55" />
      <circle cx="648" cy="316" r="3"   fill="#FB7185" opacity="0.50" />
    </svg>
  );
}

// ── Single Orb ────────────────────────────────────────────────────────────────
function Orb({ orb, style }) {
  const s = orb.size;
  return (
    <div
      className="absolute flex flex-col items-center justify-center"
      style={{
        width: s,
        height: s,
        borderRadius: "9999px",
        background: orb.gradient,
        boxShadow: orb.shadow,
        border: orb.border,
        zIndex: 5,
        ...style,
      }}
    >
      {/* Reduced highlight — top-left reflection only */}
      <div
        className="absolute rounded-full"
        style={{
          left: Math.round(s * 0.20),
          top: Math.round(s * 0.14),
          width: Math.round(s * 0.30),
          height: Math.round(s * 0.16),
          background: "rgba(255,255,255,0.28)",
          filter: "blur(7px)",
          pointerEvents: "none",
        }}
      />
      {/* Inner glass ring */}
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          inset: 5,
          borderRadius: "9999px",
          border: "1px solid rgba(255,255,255,0.28)",
        }}
      />
      <span
        className="relative text-center text-white"
        style={{
          fontSize: s >= 110 ? 18 : 17,
          fontWeight: 900,
          lineHeight: 1.18,
          letterSpacing: "-0.02em",
          textShadow: "0 2px 8px rgba(15,23,42,0.38), 0 0 14px rgba(255,255,255,0.22)",
        }}
      >
        {orb.lines[0]}
        <br />
        {orb.lines[1]}
      </span>
    </div>
  );
}

// ── Orb Cluster (desktop center column) ──────────────────────────────────────
function OrbCluster({ orbs }) {
  return (
    <div className="relative" style={{ minHeight: 360 }}>
      {/* Background glow cloud */}
      <div
        className="pointer-events-none absolute"
        style={{
          width: 300, height: 240,
          left: "50%", top: "48%",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(96,165,250,0.22) 0%, rgba(167,139,250,0.16) 38%, rgba(45,212,191,0.12) 58%, transparent 72%)",
          filter: "blur(18px)",
          opacity: 0.95,
        }}
      />
      {/* White bloom */}
      <div
        className="pointer-events-none absolute"
        style={{
          width: 180, height: 140,
          left: "50%", top: "48%",
          transform: "translate(-50%, -50%)",
          background: "rgba(255,255,255,0.52)",
          filter: "blur(24px)",
        }}
      />
      {/* Orbit rings */}
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          width: 280, height: 280,
          left: "50%", top: "48%",
          transform: "translate(-50%, -50%) rotate(-12deg)",
          border: "1px solid rgba(147,197,253,0.20)",
        }}
      />
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          width: 220, height: 220,
          left: "50%", top: "48%",
          transform: "translate(-50%, -50%) rotate(8deg)",
          border: "1px solid rgba(167,139,250,0.15)",
        }}
      />

      {/* Section title */}
      <div
        className="absolute flex items-center gap-1.5"
        style={{ left: "50%", top: 10, transform: "translateX(-50%)", whiteSpace: "nowrap", zIndex: 10 }}
      >
        <Sparkles style={{ width: 16, height: 16, color: "#7C3AED" }} />
        <span style={{ fontSize: 20, fontWeight: 900, color: "#0F172A" }}>쌓인 자산</span>
      </div>

      {/* Orb A – 문제 구조화 (top center, 112px) */}
      <Orb orb={orbs[0]} style={{ left: "50%", top: 54, transform: "translateX(-50%)" }} />
      {/* Orb B – 운영 기준화 (bottom left, 104px) */}
      <Orb orb={orbs[1]} style={{ left: "calc(50% - 92px)", top: 202, transform: "translateX(-50%)" }} />
      {/* Orb C – 협업 조율 (bottom right, 104px) */}
      <Orb orb={orbs[2]} style={{ left: "calc(50% + 92px)", top: 202, transform: "translateX(-50%)" }} />

      {/* Decorative scatter particles */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="pointer-events-none absolute rounded-full"
          style={{
            width: p.s, height: p.s,
            left: p.x, top: p.y,
            background: p.c,
            opacity: p.o,
            filter: p.b ? "blur(2px)" : undefined,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </div>
  );
}

// ── Left: Trace Node List ─────────────────────────────────────────────────────
function TraceList({ traces }) {
  return (
    <div className="flex flex-col" style={{ width: 220, paddingTop: 38 }}>
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        업무 흔적
      </div>
      <div className="flex flex-col gap-3">
        {traces.map((t, i) => (
          <div
            key={t.label}
            className="relative flex items-center gap-2.5"
            style={{
              height: 48,
              background: "rgba(255,255,255,0.92)",
              border: "1px solid #E6EEF9",
              borderRadius: 16,
              boxShadow: "0 8px 22px rgba(15,23,42,0.045)",
              paddingLeft: 12,
              paddingRight: 16,
            }}
          >
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
              style={{ background: t.bg, color: t.color }}
            >
              {String(i + 1).padStart(2, "0")}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>{t.label}</span>
            {/* Right connection node dot */}
            <div
              className="absolute rounded-full"
              style={{
                right: -8,
                top: "50%",
                transform: "translateY(-50%)",
                width: 6, height: 6,
                background: "#60A5FA",
                boxShadow: "0 0 10px rgba(96,165,250,0.7)",
                zIndex: 10,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Right: Direction Node List ────────────────────────────────────────────────
function DirectionList({ directions }) {
  return (
    <div className="flex flex-col" style={{ width: 260, paddingTop: 38 }}>
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        활용 방향
      </div>
      <div className="flex flex-col gap-3">
        {directions.map((d, i) => (
          <div
            key={d.label}
            className="relative flex items-center gap-2.5"
            style={{
              height: 54,
              background: "rgba(255,255,255,0.95)",
              border: "1px solid #E9EEF8",
              borderRadius: 18,
              boxShadow: "0 10px 28px rgba(15,23,42,0.055)",
              paddingLeft: 14,
              paddingRight: 14,
            }}
          >
            {/* Left incoming node dot */}
            <div
              className="absolute rounded-full"
              style={{
                left: -8,
                top: "50%",
                transform: "translateY(-50%)",
                width: 6, height: 6,
                background: d.gradFrom,
                boxShadow: `0 0 10px ${d.gradFrom}99`,
                zIndex: 10,
              }}
            />
            {/* Icon circle */}
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${d.gradFrom}, ${d.gradTo})`, opacity: 0.92 }}
            >
              {i + 1}
            </div>
            <div className="flex flex-1 flex-col justify-center">
              <span style={{ fontSize: 13, fontWeight: 800, color: "#334155", lineHeight: 1.3 }}>
                {d.label}
              </span>
              <div
                style={{
                  marginTop: 3,
                  height: 4,
                  background: "#EEF2F7",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${d.pct}%`,
                    background: `linear-gradient(90deg, ${d.gradFrom}, ${d.gradTo})`,
                    borderRadius: 4,
                  }}
                />
              </div>
              <span style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>적합도 {d.pct}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
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
        <div className="min-w-0 flex-1 p-4 sm:p-5">

          {/* Desktop: unified map canvas (lg+) */}
          <div
            className="relative hidden min-h-[420px] overflow-hidden rounded-[28px] border border-slate-200/70 bg-white lg:block"
            style={{ boxShadow: "0 18px 60px rgba(30,41,59,0.06)" }}
          >
            <ConnectionSVG />
            <div
              className="relative z-10 p-8"
              style={{ display: "grid", gridTemplateColumns: "220px 1fr 260px", gap: 24 }}
            >
              <TraceList traces={traces} />
              <OrbCluster orbs={orbs} />
              <DirectionList directions={directions} />
            </div>
          </div>

          {/* Mobile: vertical stack (< lg) */}
          <div className="space-y-3 lg:hidden">
            {/* 업무 흔적 chips */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                업무 흔적
              </div>
              <div className="flex flex-wrap gap-1.5">
                {traces.map((t) => (
                  <span
                    key={t.label}
                    className="rounded-full border px-2.5 py-1 text-xs font-semibold"
                    style={{ borderColor: t.color + "40", color: t.color, background: t.bg }}
                  >
                    {t.label}
                  </span>
                ))}
              </div>
            </div>

            {/* 쌓인 자산 orbs mobile: 2+1 grid */}
            <div className="overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-b from-slate-50 to-white p-4">
              <div className="mb-3 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-violet-500">쌓인 자산</span>
              </div>
              {/* Top 2 orbs */}
              <div className="flex justify-center gap-4 mb-3">
                {orbs.slice(0, 2).map((orb) => (
                  <div
                    key={orb.id}
                    className="flex h-20 w-20 flex-col items-center justify-center rounded-full text-white"
                    style={{
                      background: orb.gradient,
                      boxShadow: orb.shadow.split(",").slice(0, 2).join(","),
                      border: orb.border,
                      fontSize: 13,
                      fontWeight: 800,
                      lineHeight: 1.25,
                      textAlign: "center",
                    }}
                  >
                    {orb.lines[0]}<br />{orb.lines[1]}
                  </div>
                ))}
              </div>
              {/* Bottom 1 orb centered */}
              <div className="flex justify-center">
                <div
                  className="flex h-20 w-20 flex-col items-center justify-center rounded-full text-white"
                  style={{
                    background: orbs[2].gradient,
                    boxShadow: orbs[2].shadow.split(",").slice(0, 2).join(","),
                    border: orbs[2].border,
                    fontSize: 13,
                    fontWeight: 800,
                    lineHeight: 1.25,
                    textAlign: "center",
                  }}
                >
                  {orbs[2].lines[0]}<br />{orbs[2].lines[1]}
                </div>
              </div>
            </div>

            {/* 활용 방향 */}
            <div className="rounded-2xl border border-teal-100 bg-slate-50/60 p-3">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                활용 방향
              </div>
              <div className="space-y-2">
                {directions.map((d) => (
                  <div key={d.label} className="flex items-center gap-2">
                    <span className="text-xs text-slate-600">{d.label}</span>
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        style={{
                          height: "100%", width: `${d.pct}%`,
                          background: `linear-gradient(90deg, ${d.gradFrom}, ${d.gradTo})`,
                          borderRadius: 4,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: d.gradTo }}>{d.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Insight Bar ──────────────────────────────────────── */}
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
          <div
            className="rounded-[24px] bg-white p-3.5"
            style={{ border: "1px solid #E9EEF8", boxShadow: "0 12px 36px rgba(15,23,42,0.055)" }}
          >
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
          <div
            className="rounded-[24px] bg-white p-3.5"
            style={{ border: "1px solid #E9EEF8", boxShadow: "0 12px 36px rgba(15,23,42,0.055)" }}
          >
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
                        g.trend === "up" ? "text-emerald-500" : g.trend === "down" ? "text-red-400" : "text-slate-400"
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
