import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles, TrendingUp, Minus, Search, Bell, User, ChevronRight, BarChart2, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient.js";
import { listWorkRecords } from "@/lib/workRecordRepository.js";
import { onAuthStateChange } from "@/lib/auth.js";

const PASSMAP_WORK_RECORDS_CHANGED_EVENT = "passmap:work-records-changed";

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

// ── Live data helpers ─────────────────────────────────────────────────────────
const PATTERN_COLORS = ["bg-violet-500", "bg-blue-500", "bg-teal-500", "bg-indigo-500", "bg-cyan-500"];

function _buildPatternsFromRecords(records) {
  if (!records || records.length === 0) return null;
  const counts = {};
  for (const row of records) {
    const tags = [
      ...(Array.isArray(row.strength_tags) ? row.strength_tags : []),
      ...(Array.isArray(row.skill_tags) ? row.skill_tags : []),
    ];
    for (const tag of tags) {
      const t = String(tag || "").trim();
      if (t) counts[t] = (counts[t] || 0) + 1;
    }
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (sorted.length === 0) return null;
  const maxCount = sorted[0][1];
  return sorted.map(([label, count], i) => ({
    label,
    pct: Math.max(60, Math.min(90, Math.round((count / maxCount) * 88))),
    color: PATTERN_COLORS[i] || "bg-slate-400",
  }));
}

function _buildInsightFromPatterns(patterns) {
  if (!patterns || patterns.length === 0) return null;
  return `최근 기록 기준, ${patterns[0].label} 패턴으로 커리어 자산이 가장 선명하게 쌓이고 있습니다.`;
}

function _buildTracesFromRecords(records, fallbackTraces = []) {
  if (!records || records.length === 0) return null;
  const candidates = [];
  const seen = new Set();

  const push = (label) => {
    const s = String(label || "").trim().slice(0, 12);
    if (!s) return;
    const key = s.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push(s);
  };

  // 1순위: 최근 record title 분해
  for (const row of records.slice(0, 10)) {
    const title = String(row.title || "").trim();
    if (!title) continue;
    for (const part of title.split(/[,/\n]/).map(s => s.trim()).filter(Boolean)) {
      push(part);
      if (candidates.length >= 6) break;
    }
    if (candidates.length >= 6) break;
  }

  // 2순위: strength_tags
  for (const row of records) {
    if (candidates.length >= 6) break;
    for (const tag of (Array.isArray(row.strength_tags) ? row.strength_tags : [])) {
      push(tag);
      if (candidates.length >= 6) break;
    }
  }

  // 3순위: skill_tags
  for (const row of records) {
    if (candidates.length >= 6) break;
    for (const tag of (Array.isArray(row.skill_tags) ? row.skill_tags : [])) {
      push(tag);
      if (candidates.length >= 6) break;
    }
  }

  // 4순위: fallback trace labels
  for (const t of fallbackTraces) {
    if (candidates.length >= 6) break;
    push(t.label);
  }

  if (candidates.length === 0) return null;
  return candidates.map((label, i) => ({
    label,
    color: fallbackTraces[i]?.color ?? fallbackTraces[0]?.color ?? "#3B82F6",
    bg:    fallbackTraces[i]?.bg    ?? fallbackTraces[0]?.bg    ?? "rgba(59,130,246,0.14)",
  }));
}

function _splitOrbLabel(label) {
  const s = String(label || "").trim();
  if (!s) return ["?", ""];
  const words = s.split(/\s+/).filter(Boolean);

  if (words.length === 1) {
    if (s.length <= 4) return [s, ""];
    const mid = Math.ceil(s.length / 2);
    return [s.slice(0, mid), s.slice(mid)];
  }

  if (words.length === 2) return [words[0], words[1]];

  if (words.length === 3) {
    const [a, b, c] = words;
    if (a.length >= 5) return [b, c];
    return [a, b];
  }

  return [words[0], words[words.length - 1]];
}

function _buildOrbsFromPatterns(patterns, fallbackOrbs = []) {
  return fallbackOrbs.map((orb, i) =>
    patterns && i < patterns.length
      ? { ...orb, lines: _splitOrbLabel(patterns[i].label) }
      : orb
  );
}

function _directionSuffix(lower) {
  if (/문제|기획|요구|구조|백로그|우선순위|로드맵/.test(lower)) return "기반 기획";
  if (/데이터|지표|분석|실험|리뷰/.test(lower)) return "기반 개선";
  if (/운영|프로세스|기준|관리|점검|릴리즈/.test(lower)) return "운영 고도화";
  if (/협업|조율|커뮤니케이션|이해관계자|합의/.test(lower)) return "협업 허브";
  if (/리서치|벤치마킹|시장|고객|VOC/.test(lower)) return "인사이트 발굴";
  return "활용 방향";
}

function _buildDirectionsFromPatterns(patterns, fallbackDirections = []) {
  if (!patterns || patterns.length === 0) return null;
  if (!fallbackDirections || fallbackDirections.length === 0) return null;
  return fallbackDirections.map((fallback, i) => {
    const pattern = patterns[i];
    if (!pattern) return fallback;
    const raw = String(pattern.label || "").trim();
    if (!raw) return fallback;
    let label = `${raw} ${_directionSuffix(raw.toLowerCase())}`;
    if (label.length > 16) label = label.slice(0, 16) + "…";
    const pct = typeof pattern.pct === "number"
      ? Math.max(58, Math.min(92, Math.round(pattern.pct - 2)))
      : fallback.pct;
    return { ...fallback, label, pct };
  });
}

const _TRACE_BASE_PCT = [84, 79, 74, 69, 64];
function _buildDirectionsFromTraces(traces, fallbackDirections = []) {
  if (!traces || traces.length === 0) return null;
  if (!fallbackDirections || fallbackDirections.length === 0) return null;
  return fallbackDirections.map((fallback, i) => {
    const trace = traces[i];
    if (!trace) return fallback;
    const raw = String(trace.label || "").trim();
    if (!raw) return fallback;
    let label = `${raw} ${_directionSuffix(raw.toLowerCase())}`;
    if (label.length > 16) label = label.slice(0, 16) + "…";
    const pct = _TRACE_BASE_PCT[i] ?? Math.max(58, fallback.pct - 8);
    return { ...fallback, label, pct };
  });
}

const _JOB_CANDIDATES = [
  { title: "서비스기획 · PM",     keywords: ["백로그","요구사항","우선순위","로드맵","기획","문제","구조","사용자","기능"] },
  { title: "데이터 기반 PM",       keywords: ["지표","데이터","분석","리뷰","실험","개선"] },
  { title: "운영기획",             keywords: ["릴리즈","운영","점검","프로세스","기준","관리"] },
  { title: "마케팅/그로스 기획",   keywords: ["마케팅","고객","캠페인","콘텐츠","퍼널","전환"] },
  { title: "프로젝트 코디네이션",  keywords: ["이해관계자","협업","조율","합의","커뮤니케이션"] },
  { title: "리서치/인사이트 기획", keywords: ["리서치","벤치마킹","시장","voc","인사이트"] },
  { title: "프로덕트 전략",        keywords: ["제품","서비스","런칭","전략","사업"] },
];

function _buildJobMatchFromSignals({ records, traces, patterns, fallbackJobMatch }) {
  if (!records || records.length === 0) return null;
  if (!fallbackJobMatch) return null;
  if ((!traces || traces.length === 0) && (!patterns || patterns.length === 0)) return null;
  const labels = [
    ...(Array.isArray(traces) ? traces.map(t => t.label) : []),
    ...(Array.isArray(patterns) ? patterns.map(p => p.label) : []),
  ].filter(Boolean);
  const lowerText = labels.join(" ").toLowerCase();
  const scored = _JOB_CANDIDATES
    .map(c => ({ title: c.title, score: c.keywords.filter(kw => lowerText.includes(kw)).length }))
    .filter(c => c.score >= 1)
    .sort((a, b) => b.score - a.score);
  const usedTitles = new Set(scored.map(c => c.title));
  const fill = (fallbackJobMatch.positions || [])
    .filter(p => !usedTitles.has(p.title))
    .map(p => ({ title: p.title, score: 0 }));
  const selected = [...scored, ...fill].slice(0, 3);
  const recordCount = Array.isArray(records) ? records.length : 0;
  const signalCount = _countConnectedSignals(records);
  const hitCount = scored.reduce((sum, c) => sum + c.score, 0);
  let score = 66 + Math.min(10, recordCount * 2) + Math.min(8, hitCount * 2) + Math.min(4, signalCount);
  score = Math.max(68, Math.min(88, Math.round(score)));
  return {
    ...fallbackJobMatch,
    score,
    label: "기록 기반 연결도",
    positions: selected.map((item, idx) => ({
      rank: idx + 1,
      title: item.title,
      badge: idx === 0 ? "연결 높음" : null,
    })),
  };
}

function _safeParsePayloadObj(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const p = JSON.parse(value);
      return p && typeof p === "object" && !Array.isArray(p) ? p : {};
    } catch { return {}; }
  }
  return {};
}

function _countConnectedSignals(records) {
  if (!records || records.length === 0) return 0;
  let count = 0;
  for (const row of records) {
    if (Array.isArray(row.strength_tags)) count += row.strength_tags.length;
    if (Array.isArray(row.skill_tags))    count += row.skill_tags.length;
    const payload = _safeParsePayloadObj(row.raw_payload);
    if (Array.isArray(payload.experienceSignals)) count += payload.experienceSignals.length;
  }
  return count;
}

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
const ORB_RADII = [56, 52, 52];

function ConnectionSVG({ layout }) {
  if (!layout) return null;
  const { width, height, traceDots, dirDots, orbCenters } = layout;
  if (!traceDots.length || !dirDots.length || !orbCenters.length) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-0 hidden lg:block"
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="assetCurveLeftStrong" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(96,165,250,0.22)" />
          <stop offset="70%" stopColor="rgba(96,165,250,0.10)" />
          <stop offset="100%" stopColor="rgba(96,165,250,0)" />
        </linearGradient>
        <linearGradient id="assetCurveLeftSoft" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(96,165,250,0.10)" />
          <stop offset="100%" stopColor="rgba(96,165,250,0)" />
        </linearGradient>
        <linearGradient id="assetCurveRightStrong" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="rgba(96,165,250,0.20)" />
          <stop offset="70%" stopColor="rgba(96,165,250,0.08)" />
          <stop offset="100%" stopColor="rgba(96,165,250,0)" />
        </linearGradient>
        <linearGradient id="assetCurveRightSoft" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="rgba(96,165,250,0.09)" />
          <stop offset="100%" stopColor="rgba(96,165,250,0)" />
        </linearGradient>
      </defs>

      {/* Left: trace dot → glow zone (S-curve with per-line bend variation) */}
      {traceDots.map((dot, i) => {
        const orbIndex = Math.min(
          orbCenters.length - 1,
          Math.floor((i / Math.max(1, traceDots.length)) * orbCenters.length)
        );
        const orb = orbCenters[orbIndex];
        const endX = orb.x - ORB_RADII[orbIndex] - 36;
        const isPrimary = i === 0 || i === Math.floor(traceDots.length / 2) || i === traceDots.length - 1;
        const bend = (i % 2 === 0 ? -1 : 1) * (18 + (i % 3) * 7);
        const c1x = dot.x + 72;
        const c1y = dot.y + bend;
        const c2x = endX - 96;
        const c2y = orb.y - bend * 0.6;
        return (
          <path key={i}
            d={`M ${dot.x} ${dot.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${orb.y}`}
            fill="none"
            stroke={isPrimary ? "url(#assetCurveLeftStrong)" : "url(#assetCurveLeftSoft)"}
            strokeWidth={isPrimary ? 1.05 : 0.7}
            strokeLinecap="round"
            opacity={isPrimary ? 1 : 0.65} />
        );
      })}

      {/* Right: glow zone → direction dot (S-curve with per-line bend variation) */}
      {dirDots.map((dot, i) => {
        const orbIndex = Math.min(
          orbCenters.length - 1,
          Math.floor((i / Math.max(1, dirDots.length)) * orbCenters.length)
        );
        const orb = orbCenters[orbIndex];
        const startX = orb.x + ORB_RADII[orbIndex] + 36;
        const isPrimary = i === 0 || i === Math.floor(dirDots.length / 2) || i === dirDots.length - 1;
        const bend = (i % 2 === 0 ? -1 : 1) * (16 + (i % 3) * 7);
        const c1x = startX + 96;
        const c1y = orb.y - bend * 0.6;
        const c2x = dot.x - 72;
        const c2y = dot.y + bend;
        return (
          <path key={i}
            d={`M ${startX} ${orb.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${dot.x} ${dot.y}`}
            fill="none"
            stroke={isPrimary ? "url(#assetCurveRightStrong)" : "url(#assetCurveRightSoft)"}
            strokeWidth={isPrimary ? 1.05 : 0.7}
            strokeLinecap="round"
            opacity={isPrimary ? 1 : 0.65} />
        );
      })}
    </svg>
  );
}

// ── Single Orb ────────────────────────────────────────────────────────────────
function Orb({ orb, style, ...rest }) {
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
      {...rest}
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
      <Orb orb={orbs[0]} data-career-orb="0" style={{ left: "50%", top: 54, transform: "translateX(-50%)" }} />
      {/* Orb B – 운영 기준화 (bottom left, 104px) */}
      <Orb orb={orbs[1]} data-career-orb="1" style={{ left: "calc(50% - 92px)", top: 202, transform: "translateX(-50%)" }} />
      {/* Orb C – 협업 조율 (bottom right, 104px) */}
      <Orb orb={orbs[2]} data-career-orb="2" style={{ left: "calc(50% + 92px)", top: 202, transform: "translateX(-50%)" }} />

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
    <div className="flex w-full max-w-[220px] flex-col" style={{ paddingTop: 38 }}>
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        업무 흔적
      </div>
      <div className="flex flex-col gap-3">
        {traces.map((t, i) => (
          <div
            key={t.label}
            data-connection-card="trace"
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
    <div className="flex w-full max-w-[260px] flex-col" style={{ paddingTop: 38 }}>
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        활용 방향
      </div>
      <div className="flex flex-col gap-3">
        {directions.map((d, i) => (
          <div
            key={d.label}
            data-connection-card="direction"
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
  const [liveRecords, setLiveRecords] = useState(null);
  const [liveRecordsLoaded, setLiveRecordsLoaded] = useState(false);
  const [liveRecordsError, setLiveRecordsError] = useState(null);
  const canvasRef = useRef(null);
  const [connectionLayout, setConnectionLayout] = useState(null);

  useEffect(() => {
    if (!supabase) {
      setLiveRecordsLoaded(true);
      return;
    }
    let cancelled = false;

    async function fetchRecords() {
      try {
        const rows = await listWorkRecords({ limit: 50 });
        if (cancelled) return;
        setLiveRecords(Array.isArray(rows) ? rows : []);
        setLiveRecordsLoaded(true);
        setLiveRecordsError(null);
      } catch (e) {
        if (cancelled) return;
        setLiveRecords([]);
        setLiveRecordsLoaded(true);
        setLiveRecordsError(String(e?.message || "fetch failed"));
      }
    }

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      const user = data?.user ?? null;
      if (user) {
        fetchRecords();
      } else {
        setLiveRecords([]);
        setLiveRecordsLoaded(true);
        setLiveRecordsError(null);
      }
    }).catch((e) => {
      if (cancelled) return;
      setLiveRecords([]);
      setLiveRecordsLoaded(true);
      setLiveRecordsError(String(e?.message || "auth check failed"));
    });

    let sub = null;
    try {
      sub = onAuthStateChange((event, session) => {
        if (cancelled) return;
        const user = session?.user ?? null;
        if (event === "SIGNED_IN" && user) {
          fetchRecords();
        } else if (event === "SIGNED_OUT") {
          setLiveRecords([]);
          setLiveRecordsLoaded(true);
          setLiveRecordsError(null);
        }
      });
    } catch (_) {}

    const handleWorkRecordsChanged = () => { fetchRecords(); };
    window.addEventListener(PASSMAP_WORK_RECORDS_CHANGED_EVENT, handleWorkRecordsChanged);

    return () => {
      cancelled = true;
      window.removeEventListener(PASSMAP_WORK_RECORDS_CHANGED_EVENT, handleWorkRecordsChanged);
      try { sub?.unsubscribe?.(); } catch (_) {}
    };
  }, []);

  const livePatterns = useMemo(() => _buildPatternsFromRecords(liveRecords), [liveRecords]);
  const liveInsight = useMemo(() => _buildInsightFromPatterns(livePatterns), [livePatterns]);
  const liveTraces = useMemo(() => _buildTracesFromRecords(liveRecords, CAREER_ASSET_MOCK.traces), [liveRecords]);
  const liveOrbs = useMemo(() => _buildOrbsFromPatterns(livePatterns, CAREER_ASSET_MOCK.orbs), [livePatterns]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function measure() {
      const cr = canvas.getBoundingClientRect();
      if (!cr.width || !cr.height) return;

      const traceDots = Array.from(canvas.querySelectorAll('[data-connection-card="trace"]')).map(card => {
        const r = card.getBoundingClientRect();
        return { x: r.right + 5 - cr.left, y: r.top + r.height / 2 - cr.top };
      });
      const dirDots = Array.from(canvas.querySelectorAll('[data-connection-card="direction"]')).map(card => {
        const r = card.getBoundingClientRect();
        return { x: r.left - 5 - cr.left, y: r.top + r.height / 2 - cr.top };
      });
      const orbCenters = Array.from(canvas.querySelectorAll('[data-career-orb]'))
        .sort((a, b) => Number(a.dataset.careerOrb) - Number(b.dataset.careerOrb))
        .map(orb => {
          const r = orb.getBoundingClientRect();
          return { x: r.left + r.width / 2 - cr.left, y: r.top + r.height / 2 - cr.top };
        });

      if (traceDots.length && dirDots.length && orbCenters.length) {
        setConnectionLayout({ width: cr.width, height: cr.height, traceDots, dirDots, orbCenters });
      }
    }

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);
  const liveKpi = useMemo(() => {
    if (!liveRecords || liveRecords.length === 0) return null;
    const signalCount = _countConnectedSignals(liveRecords);
    return CAREER_ASSET_MOCK.kpi.map((item) => {
      if (item.label === "기록한 경험") return { ...item, value: `${liveRecords.length}건` };
      if (item.label === "연결된 신호" && signalCount > 0) return { ...item, value: `${signalCount}개` };
      return item;
    });
  }, [liveRecords]);
  const liveDirections = useMemo(
    () =>
      _buildDirectionsFromPatterns(livePatterns, CAREER_ASSET_MOCK.directions)
      ?? _buildDirectionsFromTraces(liveTraces, CAREER_ASSET_MOCK.directions),
    [livePatterns, liveTraces]
  );

  const liveJobMatch = useMemo(
    () => _buildJobMatchFromSignals({
      records: liveRecords,
      traces: liveTraces,
      patterns: livePatterns,
      fallbackJobMatch: CAREER_ASSET_MOCK.jobMatch,
    }),
    [liveRecords, liveTraces, livePatterns]
  );

  const { growthSignals } = CAREER_ASSET_MOCK;
  const jobMatch = liveJobMatch ?? CAREER_ASSET_MOCK.jobMatch;
  const directions = liveDirections ?? CAREER_ASSET_MOCK.directions;
  const patterns = livePatterns ?? CAREER_ASSET_MOCK.patterns;
  const traces = liveTraces ?? CAREER_ASSET_MOCK.traces;
  const orbs = liveOrbs ?? CAREER_ASSET_MOCK.orbs;
  const kpi = liveKpi ?? CAREER_ASSET_MOCK.kpi;
  const insightComment = liveInsight ?? CAREER_ASSET_MOCK.insightComment;

  const assetMapStatus = (() => {
    if (liveRecordsError) return "fallback-error";
    if (!liveRecordsLoaded) return "mock";
    if (liveRecords && liveRecords.length > 0) return livePatterns ? "real" : "real-no-tags";
    return "empty";
  })();

  const _statusText = {
    real:           `실제 기록 ${liveRecords?.length ?? 0}건 기준으로 일부 지표가 반영됐습니다.`,
    "real-no-tags": `기록 ${liveRecords?.length ?? 0}건은 확인됐지만 태그가 부족해 예시 패턴을 표시 중입니다.`,
    empty:          "아직 기록이 없어 예시 데이터를 표시 중입니다.",
    "fallback-error": "기록을 불러오지 못해 예시 데이터를 표시 중입니다.",
    mock:           "예시 데이터를 표시 중입니다.",
  }[assetMapStatus];

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
      <div className="grid 2xl:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-w-0 p-4 sm:p-5">

          {/* Desktop: unified map canvas (lg+) */}
          <div
            ref={canvasRef}
            className="relative hidden min-h-[420px] rounded-[28px] border border-slate-200/70 bg-white lg:block"
            style={{ boxShadow: "0 18px 60px rgba(30,41,59,0.06)" }}
          >
            <ConnectionSVG layout={connectionLayout} />
            <div
              className="relative z-10 p-8"
              style={{ display: "grid", gridTemplateColumns: "230px minmax(420px,1fr) 260px", gap: 20 }}
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

        {/* ── Right Panel (2xl+) ─────────────────────────────────────── */}
        <div className="hidden w-60 flex-col gap-3 border-l border-slate-100 p-4 2xl:flex">
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
            <p className="text-[10px] leading-relaxed text-slate-400 sm:text-[11px]">
              {_statusText}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
