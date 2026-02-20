// src/lib/decision/index.js
// NOTE: decision ?덉씠???뷀듃由?
// - structuralPatterns 寃곌낵 + riskProfiles 寃곌낵瑜?紐⑥븘 decisionPack ?앹꽦

import { ALL_PROFILES } from "./riskProfiles/index.js";
import { computeStructuralDecisionPressure, mergeDecisionPressures } from "./decisionPressure.js";
// ==============================
// [PATCH] Gate normalization + gate->pressure boost (append-only)
// ==============================
function __num_safe(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}
function __clamp(v, lo, hi) {
  const n = __num_safe(v, lo);
  if (n < lo) return lo;
  if (n > hi) return hi;
  return n;
}
function __t(v) {
  return v == null ? "" : String(v);
}
function __normalizeGateId(id) {
  const s = __t(id);
  if (!s) return "";
  if (s.startsWith("GATE__")) return s;
  // 기존 혼재 케이스 흡수(최소)
  if (s === "ageGateRisk") return "GATE__AGE";
  // 필요시 여기 계속 append-only로 매핑 추가
  return s;
}
function __normalizeRiskItem(r) {
  const o = r && typeof r === "object" ? r : {};
  const id = __t(o.id);
  const group = __t(o.group);
  const layer = __t(o.layer);

  const isGate =
    layer === "gate" ||
    group === "gate" ||
    group === "gates" ||
    id.startsWith("GATE__") ||
    id === "ageGateRisk";

  if (!isGate) return o;

  const nid = __normalizeGateId(id);

  // gate 스펙 강제(엔진 메타는 gate로 정직하게 유지)
  return {
    ...o,
    id: nid || id,
    group: "gates",
    layer: "gate",
    priority: __clamp(o.priority, 0, 100),
    // optional: 기본 tier (게이트는 강한 신호로 보는게 자연스러움)
    severityTier: __t(o.severityTier) || (__clamp(o.priority, 0, 100) >= 85 ? "S" : "A"),
    gateTriggered: true,
  };
}
function __normalizeRiskResults(list) {
  const arr = Array.isArray(list) ? list : [];
  return arr.map(__normalizeRiskItem);
}

// gate priority 기반 pressure boost (상한 포함)
function __computeGatePressureBoost(riskResults) {
  const arr = Array.isArray(riskResults) ? riskResults : [];
  let maxP = 0;
  for (const r of arr) {
    if (!r) continue;
    if (__t(r.layer) !== "gate") continue;
    const p = __clamp(r.priority, 0, 100);
    if (p > maxP) maxP = p;
  }

  // 단계형(현실적인 급락 반영)
  let boost = 0;
  if (maxP >= 95) boost = 0.35;
  else if (maxP >= 85) boost = 0.25;
  else if (maxP >= 70) boost = 0.15;
  else if (maxP >= 60) boost = 0.08;
  else if (maxP >= 50) boost = 0.04;

  // 안전 상한
  return __clamp(boost, 0, 0.35);
}
// ==============================
// [PATCH] Gate normalization + gate->pressure boost (append-only)
// ==============================
function __num_safe(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}
function __clamp(v, lo, hi) {
  const n = __num_safe(v, lo);
  if (n < lo) return lo;
  if (n > hi) return hi;
  return n;
}
function __t(v) {
  return v == null ? "" : String(v);
}
function __normalizeGateId(id) {
  const s = __t(id);
  if (!s) return "";
  if (s.startsWith("GATE__")) return s;
  // 기존 혼재 케이스 흡수(최소)
  if (s === "ageGateRisk") return "GATE__AGE";
  // 필요시 여기 계속 append-only로 매핑 추가
  return s;
}
function __normalizeRiskItem(r) {
  const o = r && typeof r === "object" ? r : {};
  const id = __t(o.id);
  const group = __t(o.group);
  const layer = __t(o.layer);

  const isGate =
    layer === "gate" ||
    group === "gate" ||
    group === "gates" ||
    id.startsWith("GATE__") ||
    id === "ageGateRisk";

  if (!isGate) return o;

  const nid = __normalizeGateId(id);

  // gate 스펙 강제(하지만 UI 버킷은 이미 gate->document 처리하니 layer는 gate로 정직하게 유지)
  return {
    ...o,
    id: nid || id,
    group: "gates",
    layer: "gate",
    priority: __clamp(o.priority, 0, 100),
    // optional: 기본 tier (게이트는 강한 신호로 보는게 자연스러움)
    severityTier: __t(o.severityTier) || (__clamp(o.priority, 0, 100) >= 85 ? "S" : "A"),
    gateTriggered: true,
  };
}
function __normalizeRiskResults(list) {
  const arr = Array.isArray(list) ? list : [];
  return arr.map(__normalizeRiskItem);
}

// gate priority 기반 pressure boost (상한 포함)
function __computeGatePressureBoost(riskResults) {
  const arr = Array.isArray(riskResults) ? riskResults : [];
  let maxP = 0;
  for (const r of arr) {
    if (!r) continue;
    if (__t(r.layer) !== "gate") continue;
    const p = __clamp(r.priority, 0, 100);
    if (p > maxP) maxP = p;
  }

  // 단계형(현실적인 급락 반영)
  let boost = 0;
  if (maxP >= 95) boost = 0.35;
  else if (maxP >= 85) boost = 0.25;
  else if (maxP >= 70) boost = 0.15;
  else if (maxP >= 60) boost = 0.08;
  else if (maxP >= 50) boost = 0.04;

  // 안전 상한
  return __clamp(boost, 0, 0.35);
}
// append-only: riskProfiles ?ㅽ뻾 ?붿쭊
function evalRiskProfiles({ state, ai, structural } = {}) {
  const structuralFlags = structural?.flags || structural?.structuralFlags || [];
  const metrics = structural?.metrics || {};

  const ctx = {
    state,
    ai,
    structural,
    flags: structuralFlags,
    metrics,
  };
  const out = [];
  const profiles = Array.isArray(ALL_PROFILES) ? ALL_PROFILES : [];

  for (const p of profiles) {
    try {
      if (!p || typeof p.when !== "function") continue;
      if (!p.when(ctx)) continue;

      const score = typeof p.score === "function" ? p.score(ctx) : 0;
      const explain = typeof p.explain === "function" ? p.explain(ctx) : null;

      out.push({
        id: p.id,
        group: p.group,
        layer: p.layer,
        priority: p.priority,
        score,
        explain,
      });
    } catch {
      // crash-safe: 媛쒕퀎 profile ?ㅽ뙣??臾댁떆
    }
  }

  // priority ?곗꽑, score 蹂댁“ ?뺣젹
  out.sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0) || (b.score ?? 0) - (a.score ?? 0)
  );

  return out;
}

// 湲곗〈 ?⑥닔 PATCHED (append-only)
export function buildDecisionPack({ state, ai, structural } = {}) {
  // 1) structural pressure
  const structuralFlags = structural?.flags || [];
  const structuralPressure = computeStructuralDecisionPressure(structuralFlags);

  // 2) domain-specific risk profiles (?꾩옱???뚯씪/紐⑤뱢 ?곌껐???놁쑝誘濡?null 怨좎젙)
  const timeline = null;
  const educationGate = null;
  const overqualified = null;
  const domainShift = null;

  // 3) riskProfiles ?쒖뒪???ㅽ뻾
  let riskResults = [];
  try {
    riskResults = evalRiskProfiles({ state, ai, structural });
  } catch {
    riskResults = [];
  }
  // [PATCH] normalize gates & ids (append-only)
  riskResults = __normalizeRiskResults(riskResults);
  // [PATCH] normalize gates & ids (append-only)
  riskResults = __normalizeRiskResults(riskResults);
  // [PATCH] gate -> decisionPressure boost (append-only)
  const gateBoostValue = __computeGatePressureBoost(riskResults);
  const gateBoost =
    gateBoostValue > 0
      ? {
        id: "PRESSURE__GATE_BOOST",
        title: "Gate 신호로 인한 면접 진입 확률 급락",
        score: gateBoostValue,
        weight: 1,
        meta: { source: "gates", maxAppliedBoost: gateBoostValue },
      }
      : null;
        // [PATCH] gate -> decisionPressure boost (append-only)
  const gateBoostValue = __computeGatePressureBoost(riskResults);
  const gateBoost =
    gateBoostValue > 0
      ? {
          id: "PRESSURE__GATE_BOOST",
          title: "Gate 신호로 인한 면접 진입 확률 급락",
          score: gateBoostValue,
          weight: 1,
          meta: { source: "gates", maxAppliedBoost: gateBoostValue },
        }
      : null;
  const merged = mergeDecisionPressures(
    [structuralPressure, gateBoost, timeline, educationGate, overqualified, domainShift].filter(Boolean),
    { topN: 12 }
  );

  return {
    decisionPressure: merged,
    decisionComponents: {
      structural: structuralPressure,
      timeline,
      educationGate,
      overqualified,
      domainShift,
    },
    riskResults,
    structural,
  };
}



