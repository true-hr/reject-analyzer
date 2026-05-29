import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles, TrendingUp, Minus, BarChart2, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient.js";
import { listWorkRecords } from "@/lib/workRecordRepository.js";
import { onAuthStateChange } from "@/lib/auth.js";
import { EXPERIENCE_DEMO_RECORDS } from "./experienceDemoRecords.js";
import {
  DIRECTION_CANDIDATES as _DIRECTION_CANDIDATES,
  buildCareerAssetSignals,
  isLowSignalLabel as _isLowSignalLabel,
  normalizeAssetLabel as _normalizeAssetLabel,
} from "./careerAssetSignalUtils.js";

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
  if (!patterns || patterns.length === 0) return fallbackOrbs;
  return patterns.slice(0, fallbackOrbs.length).map((p, i) => ({
    ...(fallbackOrbs[i] ?? fallbackOrbs[0]),
    assetLabel: p.label,
    lines: _splitOrbLabel(p.label),
  }));
}

function _findDirectionCandidate(label) {
  const lower = String(label || "").toLowerCase();
  if (!lower || _isLowSignalLabel(label)) return null;
  let best = null;
  for (const candidate of _DIRECTION_CANDIDATES) {
    const hits = candidate.keywords.filter((kw) => lower.includes(String(kw).toLowerCase()));
    if (hits.length === 0) continue;
    if (!best || hits.length > best.hits.length) {
      best = { candidate, hits };
    }
  }
  return best;
}

const _TRACE_BASE_PCT = [84, 79, 74, 69, 64];
function _buildDirectionsFromTraces(traces, fallbackDirections = []) {
  if (!traces || traces.length === 0) return null;
  if (!fallbackDirections || fallbackDirections.length === 0) return null;
  const usedTitles = new Set();
  const directions = [];
  traces.forEach((trace, i) => {
    const raw = String(trace.label || "").trim();
    if (!raw) return;
    const match = _findDirectionCandidate(raw);
    if (!match || usedTitles.has(match.candidate.title)) return;
    usedTitles.add(match.candidate.title);
    const fallback = fallbackDirections[directions.length] ?? fallbackDirections[i] ?? fallbackDirections[0];
    const pct = _TRACE_BASE_PCT[i] ?? Math.max(58, fallback.pct - 8);
    directions.push({ ...fallback, label: match.candidate.title, pct });
  });
  return directions.length ? directions : null;
}

function _buildGrowthSignalsFromRecords({ records, traces, patterns, fallbackGrowthSignals }) {
  if (!records || records.length === 0) return null;
  if (!fallbackGrowthSignals || fallbackGrowthSignals.length === 0) return null;
  if ((!traces || traces.length === 0) && (!patterns || patterns.length === 0)) return null;

  const labels = [
    ...(Array.isArray(traces) ? traces.map(t => t.label) : []),
    ...(Array.isArray(patterns) ? patterns.map(p => p.label) : []),
  ].filter(Boolean);
  const lowerText = labels.join(" ").toLowerCase();
  const recordCount = records.length;

  let signal1;
  if (recordCount >= 6) {
    signal1 = { label: "기록 루틴 강화", trend: "up" };
  } else if (recordCount >= 3) {
    signal1 = { label: "업무 기록 빈도", trend: "up" };
  } else {
    signal1 = { label: "업무 기록 시작", trend: "neutral" };
  }

  const firstLabel =
    (Array.isArray(patterns) && patterns[0]?.label) ||
    (Array.isArray(traces) && traces[0]?.label) ||
    null;
  let signal2;
  if (firstLabel) {
    const shortLabel = firstLabel.length > 8 ? firstLabel.slice(0, 8) + "…" : firstLabel;
    signal2 = { label: shortLabel + " 반복", trend: recordCount >= 3 ? "up" : "neutral" };
  } else {
    signal2 = fallbackGrowthSignals[1];
  }

  let signal3;
  if (/협업|조율|이해관계자|합의|커뮤니케이션/.test(lowerText)) {
    signal3 = { label: "협업·조율 신호", trend: "up" };
  } else if (/지표|데이터|리뷰|분석|실험/.test(lowerText)) {
    signal3 = { label: "데이터 활용 신호", trend: "up" };
  } else if (/릴리즈|운영|점검|프로세스|관리/.test(lowerText)) {
    signal3 = { label: "운영 관리 신호", trend: "up" };
  } else if (/고객|사용자|voc|시장/.test(lowerText)) {
    signal3 = { label: "고객 이해 신호", trend: "neutral" };
  } else {
    signal3 = { label: "업무 범위 확장", trend: "neutral" };
  }

  return [signal1, signal2, signal3];
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

function _normalizeEdgeKey(label) {
  return _normalizeAssetLabel(String(label || ""))
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const CANONICAL_TRACES = [
  { id: "work-found-experience", label: "업무 흔적에서 찾은 경험", color: "#3B82F6", bg: "rgba(59,130,246,0.14)" },
  { id: "work-roadmap-review", label: "제품 로드맵 점검", color: "#60A5FA", bg: "rgba(96,165,250,0.14)" },
  { id: "work-requirements", label: "기능 요구사항 정리", color: "#6366F1", bg: "rgba(99,102,241,0.14)" },
  { id: "work-backlog-priority", label: "백로그 우선순위 조정", color: "#14B8A6", bg: "rgba(20,184,166,0.14)" },
  { id: "work-release-readiness", label: "릴리즈 준비 상황 점검", color: "#F97316", bg: "rgba(249,115,22,0.14)" },
  { id: "work-stakeholder-decision", label: "이해관계자 의사결정 조율", color: "#8B5CF6", bg: "rgba(139,92,246,0.14)" },
];

const CANONICAL_ROLE_DIRECTIONS = [
  { id: "role-service-pm", label: "서비스기획 · PM", pct: 86, gradFrom: "#60A5FA", gradTo: "#2563EB" },
  { id: "role-ops-planning", label: "운영기획", pct: 61, gradFrom: "#A78BFA", gradTo: "#7C3AED" },
  { id: "role-project-coordination", label: "프로젝트 코디네이션", pct: 58, gradFrom: "#2DD4BF", gradTo: "#14B8A6" },
  { id: "role-growth-planning", label: "마케팅/그로스 기획", pct: 58, gradFrom: "#FDBA74", gradTo: "#F97316" },
];

const CANONICAL_ASSET_PATTERNS = [
  { id: "asset-priority-judgment", label: "우선순위 판단", pct: 86, color: "bg-blue-500" },
  { id: "asset-release-ops", label: "릴리즈 운영", pct: 78, color: "bg-violet-500" },
  { id: "asset-decision-alignment", label: "의사결정 조율", pct: 74, color: "bg-teal-500" },
];

function _normalizeLabelVariant(label) {
  return String(label || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[·ㆍ./|()[\]{}_-]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

function _canonicalNodeId(type, label, index, existingId) {
  if (existingId) return existingId;
  const key = _normalizeLabelVariant(label);
  if (type === "work") {
    if (/업무흔적.*경험|foundexperience/.test(key)) return "work-found-experience";
    if (/제품로드맵|로드맵/.test(key)) return "work-roadmap-review";
    if (/기능요구사항|요구사항/.test(key)) return "work-requirements";
    if (/백로그.*우선순위|우선순위조정/.test(key)) return "work-backlog-priority";
    if (/릴리즈.*준비|릴리즈.*점검|출시.*준비/.test(key)) return "work-release-readiness";
    if (/이해관계자.*의사결정|의사결정.*조율/.test(key)) return "work-stakeholder-decision";
    return `work-${index + 1}`;
  }
  if (type === "asset") {
    if (/우선순위.*판단/.test(key)) return "asset-priority-judgment";
    if (/릴리즈.*운영|출시.*운영|운영/.test(key)) return "asset-release-ops";
    if (/의사결정.*조율|이해관계자.*조율|협업.*조율/.test(key)) return "asset-decision-alignment";
    return ["asset-priority-judgment", "asset-release-ops", "asset-decision-alignment"][index] || `asset-${index + 1}`;
  }
  if (type === "role") {
    if (/서비스기획pm|서비스기획.*pm|pm|데이터기반pm/.test(key)) return "role-service-pm";
    if (/운영기획|운영혁신/.test(key)) return "role-ops-planning";
    if (/프로젝트코디네이션|코디네이션|협업허브/.test(key)) return "role-project-coordination";
    if (/마케팅그로스기획|그로스|마케팅|신규서비스/.test(key)) return "role-growth-planning";
    return ["role-service-pm", "role-ops-planning", "role-project-coordination", "role-growth-planning"][index] || `role-${index + 1}`;
  }
  return `${type || "node"}-${index + 1}`;
}

function _withCanonicalNodeIds(items, type) {
  return (Array.isArray(items) ? items : []).map((item, index) => ({
    ...item,
    id: _canonicalNodeId(type, item?.assetLabel || item?.label || item?.lines?.join(" "), index, item?.id),
  }));
}

function _mergeCanonicalTraces(traces) {
  const byId = new Map();
  _withCanonicalNodeIds(traces, "work").forEach((trace) => {
    if (trace?.id) byId.set(trace.id, trace);
  });
  CANONICAL_TRACES.forEach((trace) => {
    if (!byId.has(trace.id)) byId.set(trace.id, trace);
  });
  return Array.from(byId.values()).slice(0, Math.max(6, byId.size));
}

function _mergeCanonicalDirections(directions) {
  const byId = new Map();
  _withCanonicalNodeIds(directions, "role").forEach((direction) => {
    if (direction?.id) byId.set(direction.id, direction);
  });
  CANONICAL_ROLE_DIRECTIONS.forEach((direction) => {
    if (!byId.has(direction.id)) byId.set(direction.id, direction);
  });
  return Array.from(byId.values()).slice(0, Math.max(4, byId.size));
}

function _canonicalAssetOrbs() {
  return CANONICAL_ASSET_PATTERNS.map((asset, index) => ({
    ...(CAREER_ASSET_MOCK.orbs[index] ?? CAREER_ASSET_MOCK.orbs[0]),
    id: asset.id,
    assetLabel: asset.label,
    lines: _splitOrbLabel(asset.label),
  }));
}

function _uniqueEdgeStrings(values, limit = 12) {
  const seen = new Set();
  const out = [];
  for (const value of Array.isArray(values) ? values.flat() : []) {
    const text = String(value ?? "").trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
    if (out.length >= limit) break;
  }
  return out;
}

function _edgeLabelKeywords(label) {
  const raw = String(label || "").trim();
  const normalized = _normalizeAssetLabel(raw);
  return _uniqueEdgeStrings([
    raw,
    normalized,
    raw.split(/\s+/),
    normalized.split(/\s+/),
  ], 8).filter((kw) => kw.length > 1);
}

function _recordTextHasAny(text, keywords) {
  const lower = String(text || "").toLowerCase();
  return (Array.isArray(keywords) ? keywords : []).some((kw) => lower.includes(String(kw).toLowerCase()));
}

function _extractRecordEvidenceText(row) {
  const payload = _safeParsePayloadObj(row?.raw_payload);
  const signals = Array.isArray(payload.experienceSignals) ? payload.experienceSignals : [];
  const candidates = [
    row?.title,
    row?.description,
    row?.situation,
    row?.task,
    row?.action,
    row?.result,
    ...signals.map((sig) => sig?.evidenceText || sig?.label),
  ];
  const text = candidates.map((v) => String(v || "").trim()).find(Boolean) || "";
  return text.length > 90 ? `${text.slice(0, 90).trim()}...` : text;
}

function _collectRecordSearchText(row) {
  const payload = _safeParsePayloadObj(row?.raw_payload);
  const signals = Array.isArray(payload.experienceSignals) ? payload.experienceSignals : [];
  const acceptedSignals = signals.filter((sig) => {
    const decision = String(sig?.userDecision || "pending");
    return decision === "accepted" || decision === "edited" || decision === "pending";
  });
  const textParts = [
    row?.title,
    row?.description,
    row?.situation,
    row?.task,
    row?.action,
    row?.result,
    ...(Array.isArray(row?.strength_tags) ? row.strength_tags : []),
    ...(Array.isArray(row?.skill_tags) ? row.skill_tags : []),
    ...(Array.isArray(payload.assetCollaborationTags) ? payload.assetCollaborationTags : []),
    ...acceptedSignals.flatMap((sig) => [sig?.label, sig?.evidenceText, sig?.suggestedResumeAngle]),
  ];
  return {
    text: textParts.map((v) => String(v || "").trim()).filter(Boolean).join(" "),
    signalCount: acceptedSignals.length,
  };
}

function _scoreConfidence(strength, evidenceCount) {
  if (strength >= 76 && evidenceCount >= 3) return "strong";
  if (strength >= 56 && evidenceCount >= 2) return "medium";
  return "weak";
}

function _isRenderableEdge(edge) {
  return !!edge
    && !!edge.fromId
    && !!edge.toId
    && (edge.strength || 0) >= 0.30
    && ["strong", "medium", "weak"].includes(edge.strengthLabel || edge.confidence);
}

function _buildEdgeReason({ evidenceCount, matchedKeywords, targetLabel }) {
  const keywordText = (matchedKeywords || []).slice(0, 3).join(", ");
  const target = targetLabel ? ` '${targetLabel}'` : "";
  return keywordText
    ? `기록 ${evidenceCount}건에서${target} 반복 신호(${keywordText})가 확인됨`
    : `기록 ${evidenceCount}건에서${target} 연결 근거가 확인됨`;
}

function _finalizeEdge({ edge, targetLabel }) {
  const evidenceCount = edge.sourceRecordIds.length;
  if (evidenceCount === 0) return null;
  // Heuristic only: record co-occurrence is the base, matched keywords and accepted/pending
  // signals lightly raise the visual connection strength. This is not a fit score.
  const strength = Math.max(
    35,
    Math.min(92, Math.round(40 + evidenceCount * 12 + edge.matchedKeywords.length * 4 + edge.signalCount * 3))
  ) / 100;
  const matchedKeywords = edge.matchedKeywords.slice(0, 8);
  const strengthLabel = strength >= 0.72 ? "strong" : strength >= 0.48 ? "medium" : "weak";
  return {
    ...edge,
    strength,
    strengthLabel,
    evidenceCount,
    matchedKeywords,
    evidence: _uniqueEdgeStrings([edge.evidence, matchedKeywords], 6),
    evidenceTexts: edge.evidenceTexts.slice(0, 3),
    confidence: strengthLabel,
    reason: _buildEdgeReason({ evidenceCount, matchedKeywords, targetLabel }),
  };
}

function _buildTraceAssetEdges({ records, traces, patterns }) {
  if (!records || records.length === 0) return [];
  if (!traces || traces.length === 0 || !patterns || patterns.length === 0) return [];
  const edges = [];

  for (const [traceIndex, trace] of traces.entries()) {
    const traceKeywords = _edgeLabelKeywords(trace?.label);
    if (traceKeywords.length === 0) continue;
    for (const [assetIndex, pattern] of patterns.entries()) {
      const assetKeywords = _edgeLabelKeywords(pattern?.label);
      if (assetKeywords.length === 0) continue;
      const edge = {
        id: `live-${_canonicalNodeId("work", trace?.label, traceIndex, trace?.id)}-${_canonicalNodeId("asset", pattern?.label, assetIndex, pattern?.id)}`,
        fromType: "work",
        toType: "asset",
        fromId: _canonicalNodeId("work", trace?.label, traceIndex, trace?.id),
        toId: _canonicalNodeId("asset", pattern?.label, assetIndex, pattern?.id),
        fromLabel: trace.label,
        toLabel: pattern.label,
        fromTraceLabel: trace.label,
        toAssetLabel: pattern.label,
        sourceRecordIds: [],
        matchedKeywords: [],
        evidenceTexts: [],
        signalCount: 0,
      };

      for (const row of records) {
        const { text, signalCount } = _collectRecordSearchText(row);
        const normalizedTags = [
          ...(Array.isArray(row?.strength_tags) ? row.strength_tags : []),
          ...(Array.isArray(row?.skill_tags) ? row.skill_tags : []),
        ].map(_normalizeEdgeKey);
        const traceHit = _recordTextHasAny(text, traceKeywords);
        const assetHit =
          _recordTextHasAny(text, assetKeywords) ||
          assetKeywords.some((kw) => normalizedTags.includes(_normalizeEdgeKey(kw)));
        if (!traceHit || !assetHit) continue;
        edge.sourceRecordIds.push(row?.id ?? row?.record_date ?? `${trace.label}-${pattern.label}-${edge.sourceRecordIds.length}`);
        edge.matchedKeywords.push(...traceKeywords.filter((kw) => _recordTextHasAny(text, [kw])));
        edge.matchedKeywords.push(...assetKeywords.filter((kw) => _recordTextHasAny(text, [kw])));
        edge.signalCount += Math.min(2, signalCount);
        const evidence = _extractRecordEvidenceText(row);
        if (evidence) edge.evidenceTexts.push(evidence);
      }

      const finalized = _finalizeEdge({
        edge: { ...edge, matchedKeywords: _uniqueEdgeStrings(edge.matchedKeywords, 8) },
        targetLabel: pattern.label,
      });
      if (finalized) edges.push(finalized);
    }
  }

  return edges.sort((a, b) => b.strength - a.strength);
}

function _directionKeywordsForLabel(label) {
  const titleKey = _normalizeEdgeKey(label);
  const candidate = _DIRECTION_CANDIDATES.find((item) => _normalizeEdgeKey(item.title) === titleKey);
  return _uniqueEdgeStrings([
    candidate?.keywords ?? [],
    _edgeLabelKeywords(label),
  ], 10);
}

function _buildAssetDirectionEdges({ records, patterns, directions }) {
  if (!records || records.length === 0) return [];
  if (!patterns || patterns.length === 0 || !directions || directions.length === 0) return [];
  const edges = [];

  for (const [assetIndex, pattern] of patterns.entries()) {
    const assetKeywords = _edgeLabelKeywords(pattern?.label);
    if (assetKeywords.length === 0) continue;
    for (const [directionIndex, direction] of directions.entries()) {
      const directionKeywords = _directionKeywordsForLabel(direction?.label);
      if (directionKeywords.length === 0) continue;
      const directMatch = _findDirectionCandidate(pattern.label)?.candidate?.title === direction.label;
      const edge = {
        id: `live-${_canonicalNodeId("asset", pattern?.label, assetIndex, pattern?.id)}-${_canonicalNodeId("role", direction?.label, directionIndex, direction?.id)}`,
        fromType: "asset",
        toType: "role",
        fromId: _canonicalNodeId("asset", pattern?.label, assetIndex, pattern?.id),
        toId: _canonicalNodeId("role", direction?.label, directionIndex, direction?.id),
        fromLabel: pattern.label,
        toLabel: direction.label,
        fromAssetLabel: pattern.label,
        toDirectionLabel: direction.label,
        sourceRecordIds: [],
        matchedKeywords: directMatch ? assetKeywords.slice(0, 2) : [],
        evidenceTexts: [],
        signalCount: directMatch ? 1 : 0,
      };

      for (const row of records) {
        const { text, signalCount } = _collectRecordSearchText(row);
        const assetHit = _recordTextHasAny(text, assetKeywords);
        const directionHit = _recordTextHasAny(text, directionKeywords);
        if (!assetHit || !directionHit) continue;
        edge.sourceRecordIds.push(row?.id ?? row?.record_date ?? `${pattern.label}-${direction.label}-${edge.sourceRecordIds.length}`);
        edge.matchedKeywords.push(...assetKeywords.filter((kw) => _recordTextHasAny(text, [kw])));
        edge.matchedKeywords.push(...directionKeywords.filter((kw) => _recordTextHasAny(text, [kw])));
        edge.signalCount += Math.min(2, signalCount);
        const evidence = _extractRecordEvidenceText(row);
        if (evidence) edge.evidenceTexts.push(evidence);
      }

      const finalized = _finalizeEdge({
        edge: { ...edge, matchedKeywords: _uniqueEdgeStrings(edge.matchedKeywords, 8) },
        targetLabel: direction.label,
      });
      if (finalized) edges.push(finalized);
    }
  }

  return edges.sort((a, b) => b.strength - a.strength);
}

const CANONICAL_ASSET_MAP_EDGES = [
  { id: "e-work-02-asset-priority", fromType: "work", toType: "asset", fromId: "work-roadmap-review", toId: "asset-priority-judgment", fromLabel: "제품 로드맵 점검", toLabel: "우선순위 판단", fromTraceLabel: "제품 로드맵 점검", toAssetLabel: "우선순위 판단", strength: 0.86, strengthLabel: "strong", confidence: "strong", reason: "제품 로드맵 점검 기록이 우선순위 판단 자산과 직접 연결됩니다.", evidence: ["제품 로드맵", "점검", "우선순위", "제품 방향"] },
  { id: "e-work-03-asset-priority", fromType: "work", toType: "asset", fromId: "work-requirements", toId: "asset-priority-judgment", fromLabel: "기능 요구사항 정리", toLabel: "우선순위 판단", fromTraceLabel: "기능 요구사항 정리", toAssetLabel: "우선순위 판단", strength: 0.82, strengthLabel: "strong", confidence: "strong", reason: "기능 요구사항 정리 경험은 요구사항의 중요도와 실행 순서를 판단한 근거입니다.", evidence: ["기능 요구사항", "정리", "중요도", "판단"] },
  { id: "e-work-04-asset-priority", fromType: "work", toType: "asset", fromId: "work-backlog-priority", toId: "asset-priority-judgment", fromLabel: "백로그 우선순위 조정", toLabel: "우선순위 판단", fromTraceLabel: "백로그 우선순위 조정", toAssetLabel: "우선순위 판단", strength: 0.94, strengthLabel: "strong", confidence: "strong", reason: "백로그 우선순위 조정 기록이 우선순위 판단 역량과 가장 강하게 연결됩니다.", evidence: ["백로그", "우선순위", "조정", "실행 순서"] },
  { id: "e-work-05-asset-release", fromType: "work", toType: "asset", fromId: "work-release-readiness", toId: "asset-release-ops", fromLabel: "릴리즈 준비 상황 점검", toLabel: "릴리즈 운영", fromTraceLabel: "릴리즈 준비 상황 점검", toAssetLabel: "릴리즈 운영", strength: 0.91, strengthLabel: "strong", confidence: "strong", reason: "릴리즈 준비 상황 점검 경험은 릴리즈 운영 자산의 직접 근거입니다.", evidence: ["릴리즈", "준비 상황", "점검", "운영"] },
  { id: "e-work-06-asset-decision", fromType: "work", toType: "asset", fromId: "work-stakeholder-decision", toId: "asset-decision-alignment", fromLabel: "이해관계자 의사결정 조율", toLabel: "의사결정 조율", fromTraceLabel: "이해관계자 의사결정 조율", toAssetLabel: "의사결정 조율", strength: 0.93, strengthLabel: "strong", confidence: "strong", reason: "이해관계자 의사결정 조율 경험은 의사결정 조율 자산과 직접 연결됩니다.", evidence: ["이해관계자", "의사결정", "조율", "합의"] },
  { id: "e-work-01-asset-priority", fromType: "work", toType: "asset", fromId: "work-found-experience", toId: "asset-priority-judgment", fromLabel: "업무 흔적에서 찾은 경험", toLabel: "우선순위 판단", fromTraceLabel: "업무 흔적에서 찾은 경험", toAssetLabel: "우선순위 판단", strength: 0.58, strengthLabel: "medium", confidence: "medium", reason: "업무 흔적에서 찾은 경험 안에 우선순위 판단과 관련된 신호가 포함되어 있습니다.", evidence: ["업무 흔적", "경험", "판단"] },
  { id: "e-work-01-asset-release", fromType: "work", toType: "asset", fromId: "work-found-experience", toId: "asset-release-ops", fromLabel: "업무 흔적에서 찾은 경험", toLabel: "릴리즈 운영", fromTraceLabel: "업무 흔적에서 찾은 경험", toAssetLabel: "릴리즈 운영", strength: 0.42, strengthLabel: "weak", confidence: "weak", reason: "업무 흔적에서 찾은 경험 안에 릴리즈 운영과 관련된 신호가 일부 확인됩니다.", evidence: ["업무 경험", "운영", "점검"] },
  { id: "e-work-01-asset-decision", fromType: "work", toType: "asset", fromId: "work-found-experience", toId: "asset-decision-alignment", fromLabel: "업무 흔적에서 찾은 경험", toLabel: "의사결정 조율", fromTraceLabel: "업무 흔적에서 찾은 경험", toAssetLabel: "의사결정 조율", strength: 0.38, strengthLabel: "weak", confidence: "weak", reason: "업무 흔적에서 찾은 경험 안에 의사결정 조율과 관련된 신호가 일부 확인됩니다.", evidence: ["업무 경험", "조율", "의사결정"] },
  { id: "e-work-02-asset-decision", fromType: "work", toType: "asset", fromId: "work-roadmap-review", toId: "asset-decision-alignment", fromLabel: "제품 로드맵 점검", toLabel: "의사결정 조율", fromTraceLabel: "제품 로드맵 점검", toAssetLabel: "의사결정 조율", strength: 0.49, strengthLabel: "medium", confidence: "medium", reason: "제품 로드맵 점검은 방향성 합의와 의사결정 조율을 동반하는 경험입니다.", evidence: ["로드맵", "방향성", "합의"] },
  { id: "e-work-03-asset-decision", fromType: "work", toType: "asset", fromId: "work-requirements", toId: "asset-decision-alignment", fromLabel: "기능 요구사항 정리", toLabel: "의사결정 조율", fromTraceLabel: "기능 요구사항 정리", toAssetLabel: "의사결정 조율", strength: 0.44, strengthLabel: "weak", confidence: "weak", reason: "기능 요구사항 정리 과정에서 이해관계 조율 신호가 일부 확인됩니다.", evidence: ["요구사항", "정리", "조율"] },
  { id: "e-work-05-asset-decision", fromType: "work", toType: "asset", fromId: "work-release-readiness", toId: "asset-decision-alignment", fromLabel: "릴리즈 준비 상황 점검", toLabel: "의사결정 조율", fromTraceLabel: "릴리즈 준비 상황 점검", toAssetLabel: "의사결정 조율", strength: 0.52, strengthLabel: "medium", confidence: "medium", reason: "릴리즈 준비 상황 점검은 일정과 리스크에 대한 의사결정 조율을 포함합니다.", evidence: ["릴리즈", "리스크", "의사결정"] },
  { id: "e-asset-priority-role-pm", fromType: "asset", toType: "role", fromId: "asset-priority-judgment", toId: "role-service-pm", fromLabel: "우선순위 판단", toLabel: "서비스기획 · PM", fromAssetLabel: "우선순위 판단", toDirectionLabel: "서비스기획 · PM", strength: 0.92, strengthLabel: "strong", confidence: "strong", reason: "우선순위 판단 자산은 서비스기획 · PM 방향의 핵심 적합도 근거입니다.", evidence: ["우선순위", "제품 판단", "PM", "적합도 86%"] },
  { id: "e-asset-release-role-pm", fromType: "asset", toType: "role", fromId: "asset-release-ops", toId: "role-service-pm", fromLabel: "릴리즈 운영", toLabel: "서비스기획 · PM", fromAssetLabel: "릴리즈 운영", toDirectionLabel: "서비스기획 · PM", strength: 0.78, strengthLabel: "strong", confidence: "strong", reason: "릴리즈 운영 자산은 제품 출시와 운영 흐름을 이해하는 PM 역량으로 연결됩니다.", evidence: ["릴리즈", "출시", "운영", "PM"] },
  { id: "e-asset-decision-role-pm", fromType: "asset", toType: "role", fromId: "asset-decision-alignment", toId: "role-service-pm", fromLabel: "의사결정 조율", toLabel: "서비스기획 · PM", fromAssetLabel: "의사결정 조율", toDirectionLabel: "서비스기획 · PM", strength: 0.84, strengthLabel: "strong", confidence: "strong", reason: "의사결정 조율 자산은 PM 역할의 핵심 협업 근거입니다.", evidence: ["의사결정", "이해관계자", "조율", "PM"] },
  { id: "e-asset-priority-role-ops", fromType: "asset", toType: "role", fromId: "asset-priority-judgment", toId: "role-ops-planning", fromLabel: "우선순위 판단", toLabel: "운영기획", fromAssetLabel: "우선순위 판단", toDirectionLabel: "운영기획", strength: 0.62, strengthLabel: "medium", confidence: "medium", reason: "우선순위 판단 자산은 운영기획에서 개선 과제의 실행 순서를 정하는 데 활용됩니다.", evidence: ["우선순위", "개선 과제", "운영기획", "적합도 61%"] },
  { id: "e-asset-release-role-ops", fromType: "asset", toType: "role", fromId: "asset-release-ops", toId: "role-ops-planning", fromLabel: "릴리즈 운영", toLabel: "운영기획", fromAssetLabel: "릴리즈 운영", toDirectionLabel: "운영기획", strength: 0.82, strengthLabel: "strong", confidence: "strong", reason: "릴리즈 운영 자산은 운영기획 방향과 직접 연결됩니다.", evidence: ["릴리즈 운영", "운영 프로세스", "점검", "운영기획"] },
  { id: "e-asset-decision-role-ops", fromType: "asset", toType: "role", fromId: "asset-decision-alignment", toId: "role-ops-planning", fromLabel: "의사결정 조율", toLabel: "운영기획", fromAssetLabel: "의사결정 조율", toDirectionLabel: "운영기획", strength: 0.51, strengthLabel: "medium", confidence: "medium", reason: "의사결정 조율 자산은 부서 간 운영 협의와 조율에 활용될 수 있습니다.", evidence: ["조율", "협의", "운영기획"] },
  { id: "e-asset-priority-role-coordination", fromType: "asset", toType: "role", fromId: "asset-priority-judgment", toId: "role-project-coordination", fromLabel: "우선순위 판단", toLabel: "프로젝트 코디네이션", fromAssetLabel: "우선순위 판단", toDirectionLabel: "프로젝트 코디네이션", strength: 0.57, strengthLabel: "medium", confidence: "medium", reason: "우선순위 판단 자산은 프로젝트 코디네이션에서 일정과 리소스 판단에 활용됩니다.", evidence: ["우선순위", "일정", "리소스", "적합도 58%"] },
  { id: "e-asset-release-role-coordination", fromType: "asset", toType: "role", fromId: "asset-release-ops", toId: "role-project-coordination", fromLabel: "릴리즈 운영", toLabel: "프로젝트 코디네이션", fromAssetLabel: "릴리즈 운영", toDirectionLabel: "프로젝트 코디네이션", strength: 0.73, strengthLabel: "strong", confidence: "strong", reason: "릴리즈 운영 자산은 프로젝트 코디네이션의 일정 관리와 실행 점검에 연결됩니다.", evidence: ["릴리즈", "일정 관리", "실행 점검"] },
  { id: "e-asset-decision-role-coordination", fromType: "asset", toType: "role", fromId: "asset-decision-alignment", toId: "role-project-coordination", fromLabel: "의사결정 조율", toLabel: "프로젝트 코디네이션", fromAssetLabel: "의사결정 조율", toDirectionLabel: "프로젝트 코디네이션", strength: 0.80, strengthLabel: "strong", confidence: "strong", reason: "의사결정 조율 자산은 프로젝트 코디네이션 방향의 핵심 근거입니다.", evidence: ["의사결정", "조율", "프로젝트 코디네이션"] },
  { id: "e-asset-priority-role-growth", fromType: "asset", toType: "role", fromId: "asset-priority-judgment", toId: "role-growth-planning", fromLabel: "우선순위 판단", toLabel: "마케팅/그로스 기획", fromAssetLabel: "우선순위 판단", toDirectionLabel: "마케팅/그로스 기획", strength: 0.56, strengthLabel: "medium", confidence: "medium", reason: "우선순위 판단 자산은 마케팅/그로스 기획에서 실험과 과제 선택에 활용될 수 있습니다.", evidence: ["우선순위", "실험", "성장 과제", "적합도 58%"] },
  { id: "e-asset-release-role-growth", fromType: "asset", toType: "role", fromId: "asset-release-ops", toId: "role-growth-planning", fromLabel: "릴리즈 운영", toLabel: "마케팅/그로스 기획", fromAssetLabel: "릴리즈 운영", toDirectionLabel: "마케팅/그로스 기획", strength: 0.39, strengthLabel: "weak", confidence: "weak", reason: "릴리즈 운영 자산은 캠페인이나 출시 기반 성장 실험과 일부 연결됩니다.", evidence: ["릴리즈", "캠페인", "성장 실험"] },
  { id: "e-asset-decision-role-growth", fromType: "asset", toType: "role", fromId: "asset-decision-alignment", toId: "role-growth-planning", fromLabel: "의사결정 조율", toLabel: "마케팅/그로스 기획", fromAssetLabel: "의사결정 조율", toDirectionLabel: "마케팅/그로스 기획", strength: 0.36, strengthLabel: "weak", confidence: "weak", reason: "의사결정 조율 자산은 마케팅/그로스 협업 과정과 일부 연결 가능성이 있습니다.", evidence: ["조율", "협업", "그로스"] },
];

function mergeWithFallbackEdges(liveEdges, fallbackEdges, visibleNodeIds, { target = 18, max = 24 } = {}) {
  const visibleIds = visibleNodeIds instanceof Set ? visibleNodeIds : new Set(visibleNodeIds || []);
  const isVisible = (edge) => visibleIds.has(edge.fromId) && visibleIds.has(edge.toId);
  const live = (Array.isArray(liveEdges) ? liveEdges : []).filter(_isRenderableEdge).filter(isVisible);
  const fallback = (Array.isArray(fallbackEdges) ? fallbackEdges : []).filter(_isRenderableEdge).filter(isVisible);
  const byId = new Map();
  const pairKeys = new Set();
  live.forEach((edge) => {
    byId.set(edge.id, edge);
    pairKeys.add(`${edge.fromId}->${edge.toId}`);
  });
  if (byId.size < target) {
    fallback.forEach((edge) => {
      const pairKey = `${edge.fromId}->${edge.toId}`;
      if (!byId.has(edge.id) && !pairKeys.has(pairKey) && byId.size < max) {
        byId.set(edge.id, edge);
        pairKeys.add(pairKey);
      }
    });
  }
  return Array.from(byId.values())
    .sort((a, b) => (b.strength || 0) - (a.strength || 0))
    .slice(0, max);
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

function _buildKpiFromSignals({ records, jobMatch, directions, patterns, fallbackKpi }) {
  if (!records || records.length === 0) return null;
  if (!fallbackKpi || fallbackKpi.length === 0) return null;
  const signalCount = _countConnectedSignals(records);
  return fallbackKpi.map((item) => {
    if (item.label === "기록한 경험") return { ...item, value: `${records.length}건` };
    if (item.label === "핵심 자산" && Array.isArray(patterns) && patterns.length > 0) {
      return { ...item, value: `${patterns.length}개` };
    }
    if (item.label === "연결된 신호" && signalCount > 0) return { ...item, value: `${signalCount}개` };
    if (item.label === "활용 가능성 평균") {
      const jobScore = typeof jobMatch?.score === "number" ? jobMatch.score : null;
      const directionPcts = Array.isArray(directions)
        ? directions.map(d => d.pct).filter(v => typeof v === "number")
        : [];
      const directionAvg = directionPcts.length
        ? directionPcts.reduce((a, b) => a + b, 0) / directionPcts.length
        : null;
      let utilization = null;
      if (jobScore != null && directionAvg != null) {
        utilization = Math.round(jobScore * 0.4 + directionAvg * 0.6);
      } else if (jobScore != null) {
        utilization = Math.round(jobScore);
      } else if (directionAvg != null) {
        utilization = Math.round(directionAvg);
      }
      if (utilization != null) {
        utilization = Math.max(58, Math.min(88, utilization));
        return { ...item, value: `${utilization}%` };
      }
    }
    return item;
  });
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

function _findOrbIndexForAssetLabel(orbCenters, assetLabel, fallbackIndex) {
  const key = _normalizeEdgeKey(assetLabel);
  if (!key) return fallbackIndex;
  const idx = (Array.isArray(orbCenters) ? orbCenters : [])
    .findIndex((orb) => _normalizeEdgeKey(orb?.label) === key);
  return idx >= 0 ? idx : fallbackIndex;
}

function _selectRenderableEdges(edges, { primaryField, assetField, limit = 3, assetLimit = 2 } = {}) {
  const selected = [];
  const seenPrimary = new Set();
  const assetCounts = new Map();
  const sorted = (Array.isArray(edges) ? edges : [])
    .filter(_isRenderableEdge)
    .sort((a, b) => (b.strength || 0) - (a.strength || 0));

  for (const edge of sorted) {
    const primaryKey = _normalizeEdgeKey(edge?.[primaryField]);
    const assetKey = _normalizeEdgeKey(edge?.[assetField]);
    if (!primaryKey || !assetKey) continue;
    if (seenPrimary.has(primaryKey)) continue;
    const nextAssetCount = (assetCounts.get(assetKey) || 0) + 1;
    if (nextAssetCount > assetLimit) continue;
    seenPrimary.add(primaryKey);
    assetCounts.set(assetKey, nextAssetCount);
    selected.push(edge);
    if (selected.length >= limit) break;
  }

  return selected;
}

function _strengthLabelKo(strength) {
  if (strength === "strong") return "강한 연결";
  if (strength === "medium") return "보조 연결";
  return "가능성 연결";
}

function _edgeDisplayTitle(edge) {
  if (!edge) return "";
  const from = edge.fromLabel || edge.fromTraceLabel || edge.fromAssetLabel || edge.fromId;
  const to = edge.toLabel || edge.toAssetLabel || edge.toDirectionLabel || edge.toId;
  const evidence = Array.isArray(edge.evidence) ? edge.evidence.filter(Boolean) : [];
  return [
    `${from} → ${to}`,
    _strengthLabelKo(edge.strengthLabel || edge.confidence),
    edge.reason || "연결 근거가 확인됩니다.",
    evidence.length ? `근거: ${evidence.join(", ")}` : null,
  ].filter(Boolean).join("\n");
}

function _nodeKey(type, id) {
  return `${type || "node"}:${id || ""}`;
}

function _edgeTouchesNode(edge, node) {
  if (!edge || !node) return false;
  return (edge.fromType === node.type && edge.fromId === node.id)
    || (edge.toType === node.type && edge.toId === node.id);
}

function _getEdgeById(edges, edgeId) {
  return (Array.isArray(edges) ? edges : []).find((edge) => edge.id === edgeId) || null;
}

function _getActiveInteraction({ selectedNode, selectedEdgeId, hoveredNode, hoveredEdgeId }) {
  if (selectedEdgeId) return { type: "edge", id: selectedEdgeId, selected: true };
  if (selectedNode?.id) return { type: "node", node: selectedNode, selected: true };
  if (hoveredEdgeId) return { type: "edge", id: hoveredEdgeId, selected: false };
  if (hoveredNode?.id) return { type: "node", node: hoveredNode, selected: false };
  return null;
}

function _getActiveEdgeIds(edges, activeInteraction) {
  const active = new Set();
  if (!activeInteraction) return active;
  const allEdges = Array.isArray(edges) ? edges : [];

  if (activeInteraction.type === "edge") {
    const edge = _getEdgeById(allEdges, activeInteraction.id);
    if (!edge) return active;
    active.add(edge.id);
    if (edge.fromType === "work" && edge.toType === "asset") {
      allEdges.forEach((candidate) => {
        if (candidate.fromType === "asset" && candidate.fromId === edge.toId) active.add(candidate.id);
      });
    } else if (edge.fromType === "asset" && edge.toType === "role") {
      allEdges.forEach((candidate) => {
        if (candidate.toType === "asset" && candidate.toId === edge.fromId) active.add(candidate.id);
      });
    }
    return active;
  }

  const node = activeInteraction.node;
  if (!node) return active;
  if (node.type === "work") {
    const assetIds = new Set();
    allEdges.forEach((edge) => {
      if (edge.fromType === "work" && edge.fromId === node.id && edge.toType === "asset") {
        active.add(edge.id);
        assetIds.add(edge.toId);
      }
    });
    allEdges.forEach((edge) => {
      if (edge.fromType === "asset" && assetIds.has(edge.fromId)) active.add(edge.id);
    });
  } else if (node.type === "asset") {
    allEdges.forEach((edge) => {
      if ((edge.toType === "asset" && edge.toId === node.id) || (edge.fromType === "asset" && edge.fromId === node.id)) {
        active.add(edge.id);
      }
    });
  } else if (node.type === "role") {
    const assetIds = new Set();
    allEdges.forEach((edge) => {
      if (edge.toType === "role" && edge.toId === node.id && edge.fromType === "asset") {
        active.add(edge.id);
        assetIds.add(edge.fromId);
      }
    });
    allEdges.forEach((edge) => {
      if (edge.toType === "asset" && assetIds.has(edge.toId)) active.add(edge.id);
    });
  }
  return active;
}

function _getActiveNodeIds(edges, activeInteraction) {
  const nodeIds = new Set();
  if (!activeInteraction) return nodeIds;
  if (activeInteraction.type === "node" && activeInteraction.node) {
    nodeIds.add(_nodeKey(activeInteraction.node.type, activeInteraction.node.id));
  }
  const activeEdgeIds = _getActiveEdgeIds(edges, activeInteraction);
  (Array.isArray(edges) ? edges : []).forEach((edge) => {
    if (!activeEdgeIds.has(edge.id)) return;
    nodeIds.add(_nodeKey(edge.fromType, edge.fromId));
    nodeIds.add(_nodeKey(edge.toType, edge.toId));
  });
  return nodeIds;
}

function _isEdgeActive(edge, activeEdgeIds) {
  return !!edge?.id && activeEdgeIds?.has(edge.id);
}

function _isNodeActive(type, id, activeNodeIds) {
  return !!id && activeNodeIds?.has(_nodeKey(type, id));
}

function _hasActiveInteraction(activeInteraction) {
  return !!activeInteraction;
}

function _edgeStrengthValue(edge) {
  if ((edge?.strengthLabel || edge?.confidence) === "strong") return 3;
  if ((edge?.strengthLabel || edge?.confidence) === "medium") return 2;
  return 1;
}

function _buildReasonSummary({ edges, activeInteraction }) {
  if (!activeInteraction) return null;
  const allEdges = Array.isArray(edges) ? edges : [];
  if (activeInteraction.type === "edge") {
    const edge = _getEdgeById(allEdges, activeInteraction.id);
    if (!edge) return null;
    const from = edge.fromLabel || edge.fromTraceLabel || edge.fromAssetLabel || edge.fromId;
    const to = edge.toLabel || edge.toAssetLabel || edge.toDirectionLabel || edge.toId;
    return {
      kind: "edge",
      title: "선택한 흐름",
      heading: `${from} → ${to}`,
      strength: _strengthLabelKo(edge.strengthLabel || edge.confidence),
      reason: edge.reason || "연결 근거가 확인됩니다.",
      evidence: Array.isArray(edge.evidence) ? edge.evidence.filter(Boolean) : [],
    };
  }

  const node = activeInteraction.node;
  if (!node) return null;
  const activeEdgeIds = _getActiveEdgeIds(allEdges, activeInteraction);
  const items = allEdges
    .filter((edge) => activeEdgeIds.has(edge.id) && _edgeTouchesNode(edge, node))
    .sort((a, b) => _edgeStrengthValue(b) - _edgeStrengthValue(a) || (b.strength || 0) - (a.strength || 0))
    .slice(0, 3)
    .map((edge) => ({
      id: edge.id,
      from: edge.fromLabel || edge.fromTraceLabel || edge.fromAssetLabel || edge.fromId,
      to: edge.toLabel || edge.toAssetLabel || edge.toDirectionLabel || edge.toId,
      strength: _strengthLabelKo(edge.strengthLabel || edge.confidence),
    }));
  if (!items.length) return null;
  return {
    kind: "node",
    title: "연결된 흐름",
    heading: `${node.label || "선택한 항목"}과 연결된 흐름`,
    items,
  };
}

function _connectionTitle(edge, side) {
  if (!edge) return "아직 기록 기반 연결 근거가 충분하지 않은 예시 연결선";
  const pair = side === "left"
    ? [edge.fromTraceLabel, edge.toAssetLabel]
    : [edge.fromAssetLabel, edge.toDirectionLabel];
  const reason = edge.reason || `기록 ${edge.evidenceCount || 0}건에서 연결 근거가 확인됨`;
  const label = pair.filter(Boolean).join(" → ");
  return label ? `${label}: ${reason}` : reason;
}

function _connectionVisual(edge, side, state = {}) {
  if (!_isRenderableEdge(edge)) return null;
  const strong = edge.confidence === "strong";
  const medium = edge.confidence === "medium";
  const baseStrokeWidth = strong ? 3.25 : medium ? 2.4 : 1.75;
  const baseOpacity = strong ? 0.82 : medium ? 0.62 : 0.42;
  const hasActive = !!state.hasActive;
  const isActive = !!state.isActive;
  const selected = !!state.selected;
  return {
    stroke: side === "left"
      ? (strong || medium ? "url(#assetCurveLeftStrong)" : "url(#assetCurveLeftSoft)")
      : (strong || medium ? "url(#assetCurveRightStrong)" : "url(#assetCurveRightSoft)"),
    strokeWidth: hasActive ? (isActive ? baseStrokeWidth + (selected ? 1 : 0.75) : 1.5) : baseStrokeWidth,
    opacity: hasActive ? (isActive ? (selected ? 1 : 0.95) : 0.16) : baseOpacity,
    title: _edgeDisplayTitle(edge) || _connectionTitle(edge, side),
  };
}

function ConnectionSVG({
  layout,
  traceAssetEdges = [],
  assetDirectionEdges = [],
  activeInteraction = null,
  activeEdgeIds = new Set(),
  edgeHandlers = null,
}) {
  if (!layout) return null;
  const { width, height, traceDots = [], dirDots = [], orbCenters = [] } = layout;
  if (!orbCenters.length) return null;
  const canRenderTraceAsset = traceDots.length > 0;
  const canRenderAssetDirection = dirDots.length > 0;
  if (!canRenderTraceAsset && !canRenderAssetDirection) return null;
  const hasActive = _hasActiveInteraction(activeInteraction);
  const selectedTraceAssetEdges = (Array.isArray(traceAssetEdges) ? traceAssetEdges : [])
    .filter(_isRenderableEdge)
    .sort((a, b) => Number(_isEdgeActive(a, activeEdgeIds)) - Number(_isEdgeActive(b, activeEdgeIds)));
  const selectedAssetDirectionEdges = (Array.isArray(assetDirectionEdges) ? assetDirectionEdges : [])
    .filter(_isRenderableEdge)
    .sort((a, b) => Number(_isEdgeActive(a, activeEdgeIds)) - Number(_isEdgeActive(b, activeEdgeIds)));
  const traceDotById = new Map(traceDots.map((dot) => [dot.id, dot]).filter(([id]) => !!id));
  const traceDotByLabel = new Map(traceDots.map((dot) => [_normalizeEdgeKey(dot.label), dot]));
  const dirDotById = new Map(dirDots.map((dot) => [dot.id, dot]).filter(([id]) => !!id));
  const dirDotByLabel = new Map(dirDots.map((dot) => [_normalizeEdgeKey(dot.label), dot]));
  const orbById = new Map(orbCenters.map((orb) => [orb.id, orb]).filter(([id]) => !!id));

  return (
    <svg
      className="absolute inset-0 z-[1] hidden lg:block"
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="assetCurveLeftStrong" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(96,165,250,0.36)" />
          <stop offset="70%" stopColor="rgba(96,165,250,0.18)" />
          <stop offset="100%" stopColor="rgba(96,165,250,0)" />
        </linearGradient>
        <linearGradient id="assetCurveLeftSoft" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(96,165,250,0.18)" />
          <stop offset="100%" stopColor="rgba(96,165,250,0)" />
        </linearGradient>
        <linearGradient id="assetCurveRightStrong" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="rgba(96,165,250,0.34)" />
          <stop offset="70%" stopColor="rgba(96,165,250,0.16)" />
          <stop offset="100%" stopColor="rgba(96,165,250,0)" />
        </linearGradient>
        <linearGradient id="assetCurveRightSoft" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="rgba(96,165,250,0.17)" />
          <stop offset="100%" stopColor="rgba(96,165,250,0)" />
        </linearGradient>
      </defs>

      {/* Left: trace dot → glow zone (S-curve with per-line bend variation) */}
      {canRenderTraceAsset && selectedTraceAssetEdges.map((edge, i) => {
        const dot = traceDotById.get(edge.fromId) || traceDotByLabel.get(_normalizeEdgeKey(edge.fromTraceLabel));
        if (!dot) return null;
        const isActive = _isEdgeActive(edge, activeEdgeIds);
        const visual = _connectionVisual(edge, "left", { hasActive, isActive, selected: activeInteraction?.selected && isActive });
        if (!visual) return null;
        const orbFromId = orbById.get(edge.toId);
        const orbIndex = orbFromId ? orbCenters.indexOf(orbFromId) : _findOrbIndexForAssetLabel(orbCenters, edge.toAssetLabel, -1);
        if (orbIndex < 0) return null;
        const orb = orbCenters[orbIndex];
        const endX = orb.x - ORB_RADII[orbIndex] - 36;
        const bend = (i % 2 === 0 ? -1 : 1) * (18 + (i % 3) * 7);
        const c1x = dot.x + 72;
        const c1y = dot.y + bend;
        const c2x = endX - 96;
        const c2y = orb.y - bend * 0.6;
        return (
          <path key={edge.id || i}
            d={`M ${dot.x} ${dot.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${orb.y}`}
            fill="none"
            stroke={visual.stroke}
            strokeWidth={visual.strokeWidth}
            strokeLinecap="round"
            pointerEvents="stroke"
            opacity={visual.opacity}
            style={{
              cursor: "pointer",
              transition: "opacity 150ms ease, stroke-width 150ms ease",
            }}
            onMouseEnter={() => edgeHandlers?.onEnter?.(edge.id)}
            onMouseLeave={() => edgeHandlers?.onLeave?.(edge.id)}
            onClick={(event) => edgeHandlers?.onClick?.(event, edge.id)}
            data-edge-id={edge.id}
            data-from-id={edge.fromId}
            data-to-id={edge.toId}
            data-strength={edge.strengthLabel || edge.confidence}
            data-edge-type="work-to-asset"
            data-rendered="true">
            <title>{visual.title}</title>
          </path>
        );
      })}

      {/* Right: glow zone → direction dot (S-curve with per-line bend variation) */}
      {canRenderAssetDirection && selectedAssetDirectionEdges.map((edge, i) => {
        const dot = dirDotById.get(edge.toId) || dirDotByLabel.get(_normalizeEdgeKey(edge.toDirectionLabel));
        if (!dot) return null;
        const isActive = _isEdgeActive(edge, activeEdgeIds);
        const visual = _connectionVisual(edge, "right", { hasActive, isActive, selected: activeInteraction?.selected && isActive });
        if (!visual) return null;
        const orbFromId = orbById.get(edge.fromId);
        const orbIndex = orbFromId ? orbCenters.indexOf(orbFromId) : _findOrbIndexForAssetLabel(orbCenters, edge.fromAssetLabel, -1);
        if (orbIndex < 0) return null;
        const orb = orbCenters[orbIndex];
        const startX = orb.x + ORB_RADII[orbIndex] + 36;
        const bend = (i % 2 === 0 ? -1 : 1) * (16 + (i % 3) * 7);
        const c1x = startX + 96;
        const c1y = orb.y - bend * 0.6;
        const c2x = dot.x - 72;
        const c2y = dot.y + bend;
        return (
          <path key={edge.id || i}
            d={`M ${startX} ${orb.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${dot.x} ${dot.y}`}
            fill="none"
            stroke={visual.stroke}
            strokeWidth={visual.strokeWidth}
            strokeLinecap="round"
            pointerEvents="stroke"
            opacity={visual.opacity}
            style={{
              cursor: "pointer",
              transition: "opacity 150ms ease, stroke-width 150ms ease",
            }}
            onMouseEnter={() => edgeHandlers?.onEnter?.(edge.id)}
            onMouseLeave={() => edgeHandlers?.onLeave?.(edge.id)}
            onClick={(event) => edgeHandlers?.onClick?.(event, edge.id)}
            data-edge-id={edge.id}
            data-from-id={edge.fromId}
            data-to-id={edge.toId}
            data-strength={edge.strengthLabel || edge.confidence}
            data-edge-type="asset-to-role"
            data-rendered="true">
            <title>{visual.title}</title>
          </path>
        );
      })}
    </svg>
  );
}

// ── Single Orb ────────────────────────────────────────────────────────────────
function Orb({ orb, style, interactionStyle = {}, ...rest }) {
  const s = orb.size;
  return (
    <div
      className="absolute flex flex-col items-center justify-center outline-none"
      data-connection-label={orb.assetLabel || (Array.isArray(orb.lines) ? orb.lines.join(" ") : "")}
      data-node-id={orb.id}
      style={{
        width: s,
        height: s,
        borderRadius: "9999px",
        background: orb.gradient,
        boxShadow: orb.shadow,
        border: orb.border,
        zIndex: 5,
        cursor: "pointer",
        transition: "opacity 150ms ease, filter 150ms ease, box-shadow 150ms ease",
        ...style,
        ...interactionStyle,
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
function OrbCluster({ orbs, activeNodeIds = new Set(), hasActive = false, nodeHandlers = null }) {
  const orbProps = (orb) => {
    const active = _isNodeActive("asset", orb?.id, activeNodeIds);
    return {
      ...nodeHandlers?.getProps?.("asset", orb?.id, orb?.assetLabel || orb?.lines?.join(" ")),
      interactionStyle: hasActive
        ? {
            opacity: active ? 1 : 0.52,
            filter: active ? "saturate(1.12) brightness(1.06)" : "saturate(0.76)",
            boxShadow: active
              ? `${orb.shadow}, 0 0 0 4px rgba(99,102,241,0.22), 0 0 34px rgba(96,165,250,0.34)`
              : orb.shadow,
          }
        : {},
    };
  };
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

      {orbs[0] && <Orb orb={orbs[0]} data-career-orb="0" style={{ left: "50%", top: 54, transform: "translateX(-50%)" }} {...orbProps(orbs[0])} />}
      {orbs[1] && <Orb orb={orbs[1]} data-career-orb="1" style={{ left: "calc(50% - 92px)", top: 202, transform: "translateX(-50%)" }} {...orbProps(orbs[1])} />}
      {orbs[2] && <Orb orb={orbs[2]} data-career-orb="2" style={{ left: "calc(50% + 92px)", top: 202, transform: "translateX(-50%)" }} {...orbProps(orbs[2])} />}

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
function TraceList({ traces, activeNodeIds = new Set(), hasActive = false, nodeHandlers = null }) {
  return (
    <div className="flex w-full max-w-[220px] flex-col" style={{ paddingTop: 38 }}>
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        업무 흔적
      </div>
      <div className="flex flex-col gap-3">
        {traces.map((t, i) => (
          (() => {
            const active = _isNodeActive("work", t.id, activeNodeIds);
            const interactionProps = nodeHandlers?.getProps?.("work", t.id, t.label) || {};
            return (
          <div
            key={t.label}
            data-connection-card="trace"
            data-connection-label={t.label}
            data-node-id={t.id}
            tabIndex={0}
            {...interactionProps}
            className="relative flex items-center gap-2.5"
            style={{
              height: 48,
              background: "rgba(255,255,255,0.92)",
              border: active ? "1px solid rgba(59,130,246,0.70)" : "1px solid #E6EEF9",
              borderRadius: 16,
              boxShadow: active ? "0 10px 26px rgba(59,130,246,0.16)" : "0 8px 22px rgba(15,23,42,0.045)",
              paddingLeft: 12,
              paddingRight: 16,
              opacity: hasActive ? (active ? 1 : 0.56) : 1,
              cursor: "pointer",
              transition: "opacity 150ms ease, border-color 150ms ease, box-shadow 150ms ease",
            }}
          >
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
              style={{ background: t.bg, color: t.color }}
            >
              {String(i + 1).padStart(2, "0")}
            </div>
            <span
              title={t.label}
              style={{
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: 13,
                fontWeight: 700,
                color: "#334155",
              }}
            >
              {t.displayLabel || t.label}
            </span>
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
            );
          })()
        ))}
      </div>
    </div>
  );
}

// ── Right: Direction Node List ────────────────────────────────────────────────
function DirectionList({ directions, emptyMessage, activeNodeIds = new Set(), hasActive = false, nodeHandlers = null }) {
  return (
    <div className="flex w-full max-w-[260px] flex-col" style={{ paddingTop: 38 }}>
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        활용 방향
      </div>
      <div className="flex flex-col gap-3">
        {directions.length === 0 && emptyMessage ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-4 text-[12px] font-medium leading-relaxed text-slate-500">
            {emptyMessage}
          </div>
        ) : directions.map((d, i) => {
          const active = _isNodeActive("role", d.id, activeNodeIds);
          const interactionProps = nodeHandlers?.getProps?.("role", d.id, d.label) || {};
          return (
          <div
            key={d.label}
            data-connection-card="direction"
            data-connection-label={d.label}
            data-node-id={d.id}
            tabIndex={0}
            {...interactionProps}
            className="relative flex items-center gap-2.5"
            style={{
              height: 54,
              background: "rgba(255,255,255,0.95)",
              border: active ? "1px solid rgba(99,102,241,0.70)" : "1px solid #E9EEF8",
              borderRadius: 18,
              boxShadow: active ? "0 12px 30px rgba(99,102,241,0.16)" : "0 10px 28px rgba(15,23,42,0.055)",
              paddingLeft: 14,
              paddingRight: 14,
              opacity: hasActive ? (active ? 1 : 0.56) : 1,
              cursor: "pointer",
              transition: "opacity 150ms ease, border-color 150ms ease, box-shadow 150ms ease",
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
          );
        })}
      </div>
    </div>
  );
}

// ── Recent Save Bridge ────────────────────────────────────────────────────────
function ReasonEvidenceBox({ summary }) {
  if (!summary) {
    return (
      <div data-reason-evidence-box="idle" className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-[12px] font-medium text-slate-500">
        흐름을 가리키거나 선택하면 연결 이유와 근거를 볼 수 있습니다.
      </div>
    );
  }

  return (
    <div data-reason-evidence-box={summary.kind} className="mt-3 rounded-2xl border border-violet-100 bg-white px-4 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.055)]">
      <div className="text-[11px] font-bold uppercase tracking-wider text-violet-500">{summary.title}</div>
      <div className="mt-1 text-sm font-extrabold text-slate-900">{summary.heading}</div>
      {summary.kind === "edge" ? (
        <>
          <div className="mt-2 text-[12px] font-bold text-slate-700">{summary.strength}</div>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-600">{summary.reason}</p>
          {summary.evidence?.length ? (
            <div className="mt-2 text-[11px] font-semibold text-slate-500">
              근거: {summary.evidence.join(" · ")}
            </div>
          ) : null}
        </>
      ) : (
        <div className="mt-2 space-y-1.5">
          {summary.items.map((item) => (
            <div key={item.id} className="text-[12px] leading-relaxed text-slate-600">
              <span className="font-semibold text-slate-800">{item.from} → {item.to}</span>
              <span className="text-slate-400">: </span>
              <span>{item.strength}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const RECENT_SAVE_KEY = "passmap_recent_work_trace_save";
const RECENT_SAVE_TTL_MS = 10 * 60 * 1000;

function _readRecentSaveHint() {
  try {
    const raw = sessionStorage.getItem(RECENT_SAVE_KEY);
    if (!raw) return null;
    const hint = JSON.parse(raw);
    if (!hint?.savedAt) return null;
    const age = Date.now() - new Date(hint.savedAt).getTime();
    if (age > RECENT_SAVE_TTL_MS) {
      sessionStorage.removeItem(RECENT_SAVE_KEY);
      return null;
    }
    if (!hint.record?.id && !hint.record?.title) return null;
    return hint;
  } catch (_) {
    return null;
  }
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CareerAssetMapMock({ onOpenRecordInput, onOpenResumeResult }) {
  const [liveRecords, setLiveRecords] = useState(null);
  const [liveRecordsLoaded, setLiveRecordsLoaded] = useState(false);
  const [liveRecordsError, setLiveRecordsError] = useState(null);
  const [recentSaveNotice, setRecentSaveNotice] = useState(() => _readRecentSaveHint());
  const canvasRef = useRef(null);
  const [connectionLayout, setConnectionLayout] = useState(null);
  const connectionRetryRef = useRef(0);
  const connectionRafRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);

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

    const handleWorkRecordsChanged = (event) => {
      const savedRecord = event?.detail?.savedRecord;
      if (savedRecord) {
        const hint = {
          source: event.detail.source ?? "work_trace",
          savedAt: new Date().toISOString(),
          savedCount: event.detail.savedCount ?? 1,
          record: {
            id: savedRecord.id ?? null,
            title: savedRecord.title ?? null,
            strength_tags: savedRecord.strength_tags?.slice(0, 5) ?? [],
            skill_tags: savedRecord.skill_tags?.slice(0, 5) ?? [],
            assetCollaborationTags: savedRecord.raw_payload?.assetCollaborationTags?.slice(0, 4) ?? [],
          },
        };
        setRecentSaveNotice(hint);
      }
      fetchRecords();
    };
    window.addEventListener(PASSMAP_WORK_RECORDS_CHANGED_EVENT, handleWorkRecordsChanged);

    return () => {
      cancelled = true;
      window.removeEventListener(PASSMAP_WORK_RECORDS_CHANGED_EVENT, handleWorkRecordsChanged);
      try { sub?.unsubscribe?.(); } catch (_) {}
    };
  }, []);

  const hasActualRecords = liveRecordsLoaded && Array.isArray(liveRecords) && liveRecords.length > 0;
  const isUsingDemoRecords = liveRecordsLoaded && !hasActualRecords;
  const assetRecords = useMemo(
    () => hasActualRecords ? liveRecords : (isUsingDemoRecords ? EXPERIENCE_DEMO_RECORDS : []),
    [hasActualRecords, isUsingDemoRecords, liveRecords]
  );

  const liveAssetSignals = useMemo(
    () => buildCareerAssetSignals(assetRecords, {
      fallbackTraces: CAREER_ASSET_MOCK.traces,
      fallbackDirections: CAREER_ASSET_MOCK.directions,
      fallbackJobMatch: CAREER_ASSET_MOCK.jobMatch,
    }),
    [assetRecords]
  );
  const livePatterns = liveAssetSignals.patterns;
  const liveTraces = liveAssetSignals.traces;
  const liveOrbs = useMemo(() => _buildOrbsFromPatterns(livePatterns, CAREER_ASSET_MOCK.orbs), [livePatterns]);

  const hasLiveRecords = hasActualRecords;
  const patterns = hasLiveRecords && livePatterns ? livePatterns : CANONICAL_ASSET_PATTERNS;
  const traces = useMemo(
    () => _mergeCanonicalTraces(hasLiveRecords ? liveTraces : []),
    [hasLiveRecords, liveTraces]
  );
  const orbs = useMemo(
    () => _withCanonicalNodeIds(hasLiveRecords && liveOrbs ? liveOrbs : _canonicalAssetOrbs(), "asset"),
    [hasLiveRecords, liveOrbs]
  );
  const visibleNodeIds = useMemo(
    () => new Set([
      ...traces.map((trace) => trace.id),
      ...orbs.map((orb) => orb.id),
    ].filter(Boolean)),
    [traces, orbs]
  );
  const liveDirections = useMemo(
    () =>
      liveAssetSignals.directions
      ?? _buildDirectionsFromTraces(liveTraces, CAREER_ASSET_MOCK.directions),
    [liveAssetSignals.directions, liveTraces]
  );
  const mergedDirections = useMemo(
    () => _mergeCanonicalDirections(hasLiveRecords ? liveDirections : []),
    [hasLiveRecords, liveDirections]
  );

  const traceAssetEdges = useMemo(
    () => mergeWithFallbackEdges(
      _buildTraceAssetEdges({ records: hasLiveRecords ? assetRecords : [], traces, patterns }),
      CANONICAL_ASSET_MAP_EDGES.filter((edge) => edge.fromType === "work"),
      visibleNodeIds,
      { target: 11, max: 11 }
    ),
    [assetRecords, hasLiveRecords, traces, patterns, visibleNodeIds]
  );

  const assetDirectionEdges = useMemo(
    () => mergeWithFallbackEdges(
      _buildAssetDirectionEdges({ records: hasLiveRecords ? assetRecords : [], patterns, directions: mergedDirections }),
      CANONICAL_ASSET_MAP_EDGES.filter((edge) => edge.fromType === "asset"),
      new Set([...visibleNodeIds, ...mergedDirections.map((direction) => direction.id)].filter(Boolean)),
      { target: 12, max: 12 }
    ),
    [assetRecords, hasLiveRecords, patterns, mergedDirections, visibleNodeIds]
  );

  const allConnectionEdges = useMemo(
    () => [...traceAssetEdges, ...assetDirectionEdges],
    [traceAssetEdges, assetDirectionEdges]
  );
  const activeInteraction = useMemo(
    () => _getActiveInteraction({ selectedNode, selectedEdgeId, hoveredNode, hoveredEdgeId }),
    [selectedNode, selectedEdgeId, hoveredNode, hoveredEdgeId]
  );
  const activeEdgeIds = useMemo(
    () => _getActiveEdgeIds(allConnectionEdges, activeInteraction),
    [allConnectionEdges, activeInteraction]
  );
  const activeNodeIds = useMemo(
    () => _getActiveNodeIds(allConnectionEdges, activeInteraction),
    [allConnectionEdges, activeInteraction]
  );
  const hasInteraction = _hasActiveInteraction(activeInteraction);
  const reasonSummary = useMemo(
    () => _buildReasonSummary({ edges: allConnectionEdges, activeInteraction }),
    [allConnectionEdges, activeInteraction]
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setSelectedNode(null);
      setSelectedEdgeId(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleNodeSelection = useCallback((type, id, label) => {
    setSelectedEdgeId(null);
    setSelectedNode((current) => (
      current?.type === type && current?.id === id ? null : { type, id, label }
    ));
  }, []);

  const nodeHandlers = useMemo(() => ({
    getProps: (type, id, label) => ({
      onMouseEnter: () => setHoveredNode({ type, id, label }),
      onMouseLeave: () => setHoveredNode((current) => (
        current?.type === type && current?.id === id ? null : current
      )),
      onClick: (event) => {
        event.stopPropagation();
        toggleNodeSelection(type, id, label);
      },
      onKeyDown: (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        event.stopPropagation();
        toggleNodeSelection(type, id, label);
      },
    }),
  }), [toggleNodeSelection]);

  const edgeHandlers = useMemo(() => ({
    onEnter: (edgeId) => setHoveredEdgeId(edgeId),
    onLeave: (edgeId) => setHoveredEdgeId((current) => (current === edgeId ? null : current)),
    onClick: (event, edgeId) => {
      event.stopPropagation();
      setSelectedNode(null);
      setSelectedEdgeId((current) => (current === edgeId ? null : edgeId));
    },
  }), []);

  const visibleLiveDirections = useMemo(() => {
    if (!Array.isArray(mergedDirections) || mergedDirections.length === 0) return [];
    if (!hasActualRecords) return mergedDirections;
    const connectedDirectionLabels = new Set(
      assetDirectionEdges
        .filter(_isRenderableEdge)
        .map((edge) => _normalizeEdgeKey(edge.toDirectionLabel))
        .filter(Boolean)
    );
    const filteredDirections = mergedDirections.filter((direction) =>
      connectedDirectionLabels.has(_normalizeEdgeKey(direction.label))
    );
    return filteredDirections.length > 0 ? filteredDirections : mergedDirections;
  }, [hasActualRecords, mergedDirections, assetDirectionEdges]);

  const connectionLayoutKey = useMemo(() => {
    const workKey = traces.map((trace) => trace.id || _normalizeEdgeKey(trace.label)).join("|");
    const assetKey = orbs.map((orb) => orb.id || _normalizeEdgeKey(orb.assetLabel || orb.lines?.join(" "))).join("|");
    const roleKey = visibleLiveDirections.map((direction) => direction.id || _normalizeEdgeKey(direction.label)).join("|");
    const edgeKey = allConnectionEdges
      .filter(_isRenderableEdge)
      .map((edge) => `${edge.id}:${edge.fromId}->${edge.toId}`)
      .join("|");
    return [workKey, assetKey, roleKey, edgeKey].join("||");
  }, [traces, orbs, visibleLiveDirections, allConnectionEdges]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scheduleMeasure = () => {
      if (connectionRafRef.current != null) return;
      connectionRafRef.current = requestAnimationFrame(() => {
        connectionRafRef.current = requestAnimationFrame(() => {
          connectionRafRef.current = null;
          measure();
        });
      });
    };

    function measure() {
      const cr = canvas.getBoundingClientRect();
      if (!cr.width || !cr.height) {
        if (connectionRetryRef.current < 3) {
          connectionRetryRef.current += 1;
          scheduleMeasure();
        } else if (typeof window !== "undefined" && window.__PASSMAP_DEBUG_CONNECTIONS__) {
          console.table([{ reasonForDrop: "zero_sized_canvas", width: cr.width, height: cr.height }]);
        }
        return;
      }
      connectionRetryRef.current = 0;

      const traceDots = Array.from(canvas.querySelectorAll('[data-connection-card="trace"]')).map(card => {
        const r = card.getBoundingClientRect();
        return { x: r.right + 5 - cr.left, y: r.top + r.height / 2 - cr.top, id: card.dataset.nodeId || "", label: card.dataset.connectionLabel || "" };
      });
      const dirDots = Array.from(canvas.querySelectorAll('[data-connection-card="direction"]')).map(card => {
        const r = card.getBoundingClientRect();
        return { x: r.left - 5 - cr.left, y: r.top + r.height / 2 - cr.top, id: card.dataset.nodeId || "", label: card.dataset.connectionLabel || "" };
      });
      const orbCenters = Array.from(canvas.querySelectorAll('[data-career-orb]'))
        .sort((a, b) => Number(a.dataset.careerOrb) - Number(b.dataset.careerOrb))
        .map(orb => {
          const r = orb.getBoundingClientRect();
          return {
            x: r.left + r.width / 2 - cr.left,
            y: r.top + r.height / 2 - cr.top,
            id: orb.dataset.nodeId || "",
            label: orb.dataset.connectionLabel || "",
          };
        });

      if (orbCenters.length && (traceDots.length || dirDots.length)) {
        setConnectionLayout({ width: cr.width, height: cr.height, traceDots, dirDots, orbCenters });
      }
    }

    connectionRetryRef.current = 0;
    scheduleMeasure();
    const ro = new ResizeObserver(measure);
    ro.observe(canvas);
    return () => {
      ro.disconnect();
      if (connectionRafRef.current != null) {
        cancelAnimationFrame(connectionRafRef.current);
        connectionRafRef.current = null;
      }
    };
  }, [connectionLayoutKey]);

  const liveJobMatch = useMemo(
    () => liveAssetSignals.jobMatch,
    [liveAssetSignals.jobMatch]
  );

  const liveGrowthSignals = useMemo(
    () => _buildGrowthSignalsFromRecords({
      records: assetRecords,
      traces: liveTraces,
      patterns: livePatterns,
      fallbackGrowthSignals: CAREER_ASSET_MOCK.growthSignals,
    }),
    [assetRecords, liveTraces, livePatterns]
  );

  const liveKpi = useMemo(
    () => _buildKpiFromSignals({
      records: assetRecords,
      jobMatch: liveJobMatch,
      directions: hasLiveRecords ? visibleLiveDirections : mergedDirections,
      patterns,
      fallbackKpi: CAREER_ASSET_MOCK.kpi,
    }),
    [assetRecords, liveJobMatch, hasLiveRecords, visibleLiveDirections, mergedDirections, patterns]
  );

  const growthSignals = liveGrowthSignals ?? CAREER_ASSET_MOCK.growthSignals;
  const jobMatch = liveJobMatch ?? CAREER_ASSET_MOCK.jobMatch;
  const directions = hasLiveRecords ? visibleLiveDirections : mergedDirections;
  const directionEmptyMessage = hasLiveRecords
    ? "아직 활용 방향을 판단할 만큼 연결 근거가 충분하지 않습니다. 업무 기록이 더 쌓이면 자산과 연결되는 방향을 보여드릴게요."
    : null;
  const kpi = liveKpi ?? CAREER_ASSET_MOCK.kpi;

  const assetMapStatus = (() => {
    if (liveRecordsError) return "fallback-error";
    if (!liveRecordsLoaded) return "mock";
    if (hasActualRecords) return livePatterns ? "real" : "real-no-tags";
    if (isUsingDemoRecords) return "demo";
    return "empty";
  })();

  const _statusText = {
    real:           "저장된 기록의 반복 신호를 기준으로 자산과 활용 방향을 연결해 보여드려요.",
    "real-no-tags": "저장된 기록은 있지만 자산 태그가 부족해 일부 예시가 함께 표시돼요.",
    demo:           "아직 저장된 기록이 없어 업무 관리와 같은 데모 기록 기준으로 자산 맵을 보여드려요.",
    empty:          "아직 저장된 기록이 없어 업무 관리와 같은 데모 기록 기준으로 자산 맵을 보여드려요.",
    "fallback-error": "기록을 불러오지 못해 업무 관리와 같은 데모 기록 기준으로 표시 중입니다.",
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
      </div>

      {/* ── Main Body ───────────────────────────────────────────────── */}
      <div className="grid 2xl:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-w-0 p-4 sm:p-5">

          {/* Desktop: unified map canvas (lg+) */}
          <div
            ref={canvasRef}
            className="relative hidden min-h-[420px] overflow-hidden rounded-[28px] border border-slate-200/70 bg-white lg:block"
            style={{ boxShadow: "0 18px 60px rgba(30,41,59,0.06)" }}
          >
            <ConnectionSVG
              layout={connectionLayout}
              traceAssetEdges={traceAssetEdges}
              assetDirectionEdges={assetDirectionEdges}
              activeInteraction={activeInteraction}
              activeEdgeIds={activeEdgeIds}
              edgeHandlers={edgeHandlers}
            />
            <div
              className="pointer-events-none relative z-[2] p-8"
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(200px,230px) minmax(340px,1fr) minmax(230px,260px)",
                gap: 20,
              }}
            >
              <div className="pointer-events-auto">
                <TraceList
                  traces={traces}
                  activeNodeIds={activeNodeIds}
                  hasActive={hasInteraction}
                  nodeHandlers={nodeHandlers}
                />
              </div>
              <div className="pointer-events-auto">
                <OrbCluster
                  orbs={orbs}
                  activeNodeIds={activeNodeIds}
                  hasActive={hasInteraction}
                  nodeHandlers={nodeHandlers}
                />
              </div>
              <div className="pointer-events-auto">
                <DirectionList
                  directions={directions}
                  emptyMessage={directionEmptyMessage}
                  activeNodeIds={activeNodeIds}
                  hasActive={hasInteraction}
                  nodeHandlers={nodeHandlers}
                />
              </div>
            </div>
          </div>
          <ReasonEvidenceBox summary={reasonSummary} />

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

            {/* 쌓인 자산 orbs mobile: mini OrbCluster */}
            <div className="overflow-hidden rounded-2xl border border-violet-100">
              <div className="relative" style={{ minHeight: 320, background: "linear-gradient(to bottom, #f8fafc, #ffffff)" }}>
                {/* Background glow cloud */}
                <div
                  className="pointer-events-none absolute"
                  style={{
                    width: 260, height: 200,
                    left: "50%", top: "52%",
                    transform: "translate(-50%, -50%)",
                    background: "radial-gradient(circle, rgba(96,165,250,0.22) 0%, rgba(167,139,250,0.16) 38%, rgba(45,212,191,0.12) 58%, transparent 72%)",
                    filter: "blur(18px)",
                    opacity: 0.95,
                  }}
                />
                {/* White bloom */}
                <div
                  className="pointer-events-none absolute"
                  style={{
                    width: 160, height: 120,
                    left: "50%", top: "52%",
                    transform: "translate(-50%, -50%)",
                    background: "rgba(255,255,255,0.52)",
                    filter: "blur(24px)",
                  }}
                />
                {/* Orbit ring outer */}
                <div
                  className="pointer-events-none absolute rounded-full"
                  style={{
                    width: 240, height: 240,
                    left: "50%", top: "52%",
                    transform: "translate(-50%, -50%) rotate(-12deg)",
                    border: "1px solid rgba(147,197,253,0.20)",
                  }}
                />
                {/* Orbit ring inner */}
                <div
                  className="pointer-events-none absolute rounded-full"
                  style={{
                    width: 185, height: 185,
                    left: "50%", top: "52%",
                    transform: "translate(-50%, -50%) rotate(8deg)",
                    border: "1px solid rgba(167,139,250,0.15)",
                  }}
                />
                {/* Section title */}
                <div
                  className="absolute flex items-center gap-1.5"
                  style={{ left: "50%", top: 10, transform: "translateX(-50%)", whiteSpace: "nowrap", zIndex: 10 }}
                >
                  <Sparkles style={{ width: 14, height: 14, color: "#7C3AED" }} />
                  <span style={{ fontSize: 16, fontWeight: 900, color: "#0F172A" }}>쌓인 자산</span>
                </div>
                {/* Orbs — reuse Orb component for full visual fidelity */}
                {orbs[0] && <Orb orb={orbs[0]} data-career-orb="m0" style={{ left: "50%", top: 44, transform: "translateX(-50%)" }} />}
                {orbs[1] && <Orb orb={orbs[1]} data-career-orb="m1" style={{ left: "calc(50% - 92px)", top: 192, transform: "translateX(-50%)" }} />}
                {orbs[2] && <Orb orb={orbs[2]} data-career-orb="m2" style={{ left: "calc(50% + 92px)", top: 192, transform: "translateX(-50%)" }} />}
                {/* Particles */}
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
            </div>

            {/* 활용 방향 */}
            <div className="rounded-2xl border border-teal-100 bg-slate-50/60 p-3">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                활용 방향
              </div>
              <div className="space-y-2">
                {directions.length === 0 && directionEmptyMessage ? (
                  <div className="rounded-xl border border-slate-100 bg-white px-3 py-3 text-xs font-medium leading-relaxed text-slate-500">
                    {directionEmptyMessage}
                  </div>
                ) : directions.map((d) => (
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
          </div>
        </div>
      </div>

      {/* ── Recent Save Notice ──────────────────────────────────────── */}
      {recentSaveNotice && (() => {
        const { record, savedCount } = recentSaveNotice;
        const chipTags = [
          ...(record.assetCollaborationTags ?? []),
          ...(record.strength_tags ?? []),
          ...(record.skill_tags ?? []),
        ].filter(Boolean).slice(0, 3);
        const hasNoTags = chipTags.length === 0;
        const titleText = record.title && record.title !== "업무 흔적에서 찾은 경험"
          ? `'${record.title}' 경험이 자산 맵에 반영됐어요.`
          : savedCount > 1
          ? `확인한 경험 ${savedCount}개가 자산 맵에 반영됐어요.`
          : "방금 저장한 경험이 자산 맵에 반영됐어요.";
        return (
          <div className="border-t border-emerald-100 bg-emerald-50/60 px-4 py-2.5 sm:px-5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <span className="text-[11px] font-semibold text-emerald-700 sm:text-xs">
                {titleText}
              </span>
              {hasNoTags ? (
                <span className="text-[10px] text-emerald-600/70 sm:text-[11px]">
                  자산 태그는 조금 더 쌓이면 선명해집니다.
                </span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {chipTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[10px] font-medium text-emerald-700 sm:text-[11px]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

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
