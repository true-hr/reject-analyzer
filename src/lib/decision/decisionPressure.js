// src/lib/decision/decisionPressure.js

// 구조적 pressure 계산 (최소 안전 구현)
export function computeStructuralDecisionPressure(flags = []) {
  if (!Array.isArray(flags)) {
    return {
      total: 0,
      components: [],
      topDrivers: [],
    };
  }

  const components = flags.map((f) => ({
    id: f?.id || "unknown",
    weight: f?.weight ?? 1,
    score: f?.score ?? 0,
  }));

  const total = components.reduce(
    (sum, c) => sum + (c.score ?? 0),
    0
  );

  return {
    total,
    components,
    topDrivers: components.slice(0, 3),
  };
}


// 여러 pressure 합치기
export function mergeDecisionPressures(list = [], { topN = 10 } = {}) {
  const valid = list.filter(Boolean);

  const mergedComponents = valid.flatMap(
    (p) => p?.components || []
  );

  const total = valid.reduce(
    (sum, p) => sum + (p?.total ?? 0),
    0
  );

  return {
    total,
    components: mergedComponents,
    topDrivers: mergedComponents.slice(0, topN),
  };
}
