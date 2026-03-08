// src/lib/decision/riskProfiles/ownershipLeadership/decisionSignalRisk.js
// 의사결정/권한 신호 리스크 프로파일
// - structuralPatterns의 NO_DECISION_AUTHORITY_PATTERN 플래그를 profile로 승격 :contentReference[oaicite:1]{index=1}
// ✅ crash-safe: ctx 상태가 비어도 예외없이 실행

function safeNum(v, fallback = null) {
  return Number.isFinite(v) ? v : fallback;
}

function safeStr(v, fallback = "") {
  try {
    return (v ?? "").toString();
  } catch {
    return fallback;
  }
}

function isObj(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function _getStructural(ctx) {
  const c = isObj(ctx) ? ctx : {};
  const structural = isObj(c.structural) ? c.structural : null;

  const flags =
    (structural && Array.isArray(structural.flags) ? structural.flags : null) ||
    (Array.isArray(c.flags) ? c.flags : null) ||
    [];

  const metrics =
    (structural && isObj(structural.metrics) ? structural.metrics : null) ||
    (isObj(c.metrics) ? c.metrics : {}) ||
    {};

  return { flags, metrics };
}

function _findFlag(flags, id) {
  if (!Array.isArray(flags)) return null;
  for (const f of flags) {
    if (!f) continue;
    if (safeStr(f.id) === id) return f;
  }
  return null;
}

function _clamp01(x) {
  const n = safeNum(x, 0);
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function _uniq(arr) {
  if (!Array.isArray(arr)) return [];
  const out = [];
  const seen = new Set();
  for (const x of arr) {
    const s = safeStr(x).trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

export const decisionSignalRisk = {
  id: "OWNERSHIP__NO_DECISION_AUTHORITY_SIGNAL",
  group: "ownershipLeadership",
  layer: "hireability",
  priority: 84,
  severityBase: 4,
  tags: ["ownership", "decision", "authority"],

  // 트리거:
  // 1) structuralPatterns 플래그가 있으면 true
  // 2) 플래그가 없어도 metrics로 동일 조건을 재현(보조 트리거)
  when: (ctx) => {
    // ownershipExpected=false인 직무에서는 발화하지 않음
    if (ctx?.competencyExpectation?.ownershipExpected !== true) return false;
    if (typeof ctx?.__hasRisk === "function" && ctx.__hasRisk("RISK__OWNERSHIP_LEADERSHIP_GAP")) {
      return false;
    }
    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "NO_DECISION_AUTHORITY_PATTERN");
    if (flag) return true;

    // 보조 트리거(데이터 기반, 플래그 없을 경우)
    // structuralPatterns에서 decisionAuthorityHits 배열은 metrics에 있습니다. :contentReference[oaicite:2]{index=2}
    const hits = Array.isArray(metrics.decisionAuthorityHits) ? metrics.decisionAuthorityHits : null;
    if (!hits) return false;

    // 실제 권한 신호 문장이 없으면 트리거
    return hits.length === 0;
  },

  // score: 0~1
  // - flag.score가 있으면 그대로 사용
  // - 없으면 실제 권한 신호 문장 수가 0이면 최대, 의사결정 기준 순서로
  score: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "NO_DECISION_AUTHORITY_PATTERN");
    if (flag && Number.isFinite(flag.score)) return _clamp01(flag.score);

    const hits = Array.isArray(metrics.decisionAuthorityHits) ? metrics.decisionAuthorityHits : null;
    if (!hits) return 0;

    // hits=0 -> 0.9, hits=1 -> 0.55, hits>=2 -> 0.25
    const n = hits.length;
    if (n <= 0) return 0.9;
    if (n === 1) return 0.55;
    return 0.25;
  },

  explain: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);
    const flag = _findFlag(flags, "NO_DECISION_AUTHORITY_PATTERN");

    const detail = isObj(flag?.detail) ? flag.detail : {};
    const evidence = Array.isArray(flag?.evidence) ? flag.evidence.filter(Boolean).slice(0, 6) : [];

    const hits =
      _uniq(detail.hits || metrics.decisionAuthorityHits || []);

    const why = [
      "이력서에서 의사결정 권한을 직접 행사했다는 신호가 명확하게 보이지 않습니다.",
      "채용자는 역할 권한/범위가 어느 정도인지, 누가 결정했는지로 판단합니다.",
    ];

    if (hits.length) {
      why.push(`감지된 결정/권한 신호(일부): ${hits.slice(0, 8).join(", ")}`);
    } else {
      why.push("결정/권한 신호 없음 - 이력서에서 확인되지 않습니다.");
    }

    if (evidence.length) {
      why.push(`근거 스니펫(일부): ${evidence.slice(0, 3).join(" / ")}`);
    }

    const fix = [
      "각 프로젝트마다 내가 결정한 지점(Decision)을 최소 1개 명시하세요. (예: 우선순위/기술선택/프로세스/비용 결정/채용 계획 등)",
      "구체적일수록 명확합니다. 내가 어떤 배경으로 어떤 결정을 했는지 한 문장으로 적으세요. 결정의 근거(데이터/리서치/직접경험)가 있으면 더 좋습니다.",
      "결정 범위가 제한적이었다면, 내가 리더십에 제안해 통과된 범위(예: 예산/인원 수립)를 명시적으로 적어 검증이 가능한 형태로 작성하세요.",
    ];

    const notes = [];
    notes.push(`decisionAuthorityHits: ${hits.length}`);
    if (hits.length) notes.push(`hits: ${hits.slice(0, 12).join(", ")}`);
    if (evidence.length) notes.push(...evidence);

    const evidenceKeys = ["decisionAuthorityHits"];

    const title = flag?.title
      ? `Decision authority signal risk: ${safeStr(flag.title)}`
      : "Decision authority signal gap risk";

    return {
      title,
      why,
      fix,
      evidenceKeys,
      notes,
    };
  },

  suppressIf: [],
};


