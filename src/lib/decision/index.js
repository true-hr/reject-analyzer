// src/lib/decision/index.js
// NOTE: decision 레이어 엔트리
// - structuralPatterns 결과 + riskProfiles 결과를 모아 decisionPack 생성

import { ALL_PROFILES } from "./riskProfiles/index.js";
import { computeStructuralDecisionPressure, mergeDecisionPressures } from "./decisionPressure";

// append-only: riskProfiles 실행 엔진
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
      // crash-safe: 개별 profile 실패는 무시
    }
  }

  // priority 우선, score 보조 정렬
  out.sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0) || (b.score ?? 0) - (a.score ?? 0)
  );

  return out;
}

// 기존 함수 PATCHED (append-only)
export function buildDecisionPack({ state, ai, structural } = {}) {
  // 1) structural pressure
  const structuralFlags = structural?.flags || [];
  const structuralPressure = computeStructuralDecisionPressure(structuralFlags);

  // 2) domain-specific risk profiles (현재는 파일/모듈 연결이 없으므로 null 고정)
  const timeline = null;
  const educationGate = null;
  const overqualified = null;
  const domainShift = null;

  // 3) riskProfiles 시스템 실행
  let riskResults = [];
  try {
    riskResults = evalRiskProfiles({ state, ai, structural });
  } catch {
    riskResults = [];
  }

  const merged = mergeDecisionPressures(
    [structuralPressure, timeline, educationGate, overqualified, domainShift].filter(Boolean),
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
