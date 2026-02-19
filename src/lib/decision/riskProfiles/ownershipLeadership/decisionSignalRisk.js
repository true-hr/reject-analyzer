// src/lib/decision/riskProfiles/ownershipLeadership/decisionSignalRisk.js
// 의사결정/권한 신호 부족 리스크
// - structuralPatterns의 NO_DECISION_AUTHORITY_PATTERN 플래그를 profile로 승격 :contentReference[oaicite:1]{index=1}
// ✅ crash-safe: ctx 형태가 달라도 최대한 안전하게 동작

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
  // 2) 플래그가 없어도 metrics로 유사 판단(있을 때만) - 보조 트리거
  when: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "NO_DECISION_AUTHORITY_PATTERN");
    if (flag) return true;

    // 보조 트리거(데이터가 있을 때만)
    // structuralPatterns에서는 decisionAuthorityHits 배열을 metrics에 넣습니다. :contentReference[oaicite:2]{index=2}
    const hits = Array.isArray(metrics.decisionAuthorityHits) ? metrics.decisionAuthorityHits : null;
    if (!hits) return false;

    // “결정/권한” 단서가 사실상 없으면 리스크
    return hits.length === 0;
  },

  // score: 0~1
  // - flag.score가 있으면 그대로
  // - 없으면 “결정/권한 단서가 0이면 높음, 조금이라도 있으면 낮음” 보수적으로
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
      "이력서에서 ‘내가 결정권/승인권을 갖고 무엇을 정했는지’가 잘 보이지 않습니다.",
      "채용사는 이를 ‘책임 범위가 작다 / 오너가 아니다 / 상위자가 결정한다’로 해석할 수 있습니다.",
    ];

    if (hits.length) {
      why.push(`발견된 결정/권한 단서(일부): ${hits.slice(0, 8).join(", ")}`);
    } else {
      why.push("결정/권한 단서 키워드가 거의 감지되지 않습니다.");
    }

    if (evidence.length) {
      why.push(`근거 스니펫(일부): ${evidence.slice(0, 3).join(" / ")}`);
    }

    const fix = [
      "각 프로젝트마다 ‘내가 결정한 것(Decision)’을 최소 1개 명시하세요. (예: 우선순위/아키텍처/프로세스/벤더 선정/채용 기준 등)",
      "‘승인받았다’가 아니라 ‘내가 제안→근거→결정→결과’ 흐름으로 쓰세요. 결정의 근거(데이터/리서치/지표)를 같이 붙이면 효과가 큽니다.",
      "결정권이 제한적이었으면, ‘내가 책임졌던 범위(오너십 단위: 모듈/지표/파트)’를 명사로 고정해서 반복 노출하세요.",
    ];

    const notes = [];
    notes.push(`decisionAuthorityHits: ${hits.length}`);
    if (hits.length) notes.push(`hits: ${hits.slice(0, 12).join(", ")}`);
    if (evidence.length) notes.push(...evidence);

    const evidenceKeys = ["decisionAuthorityHits"];

    const title = flag?.title
      ? `권한/결정 신호 리스크: ${safeStr(flag.title)}`
      : "의사결정/권한 신호 부족 리스크";

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
