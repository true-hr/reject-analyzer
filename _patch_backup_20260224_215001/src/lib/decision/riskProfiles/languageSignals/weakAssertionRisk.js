// src/lib/decision/riskProfiles/languageSignals/weakAssertionRisk.js
// weakAssertionRisk: structuralPatterns의 "WEAK_ASSERTION_PATTERN"을 리스크 프로필로 해석합니다.
// ✅ crash-safe

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

  const summary =
    (structural && isObj(structural.summary) ? structural.summary : null) ||
    (isObj(c.summary) ? c.summary : {}) ||
    {};

  return { flags, metrics, summary };
}

function _findFlag(flags, id) {
  if (!Array.isArray(flags)) return null;
  for (const f of flags) {
    if (!f) continue;
    if (safeStr(f.id) === id) return f;
  }
  return null;
}

function _pickTopEvidence(flagObj, max = 3) {
  const arr = flagObj && Array.isArray(flagObj.evidence) ? flagObj.evidence : [];
  return arr.filter(Boolean).slice(0, max);
}

function _clamp01(x) {
  const n = safeNum(x, null);
  if (n == null) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export const weakAssertionRisk = {
  id: "WEAK_ASSERTION_RISK",
  group: "languageSignals",
  layer: "hireability",
  priority: 66,
  severityBase: 3,
  tags: ["language", "confidence", "impact"],

  when: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const f = _findFlag(flags, "WEAK_ASSERTION_PATTERN");
    if (f) return true;

    const ratio =
      safeNum(metrics.weakAssertionRatio, null) ??
      safeNum(metrics.weak_assertion_ratio, null) ??
      safeNum(metrics.hedgeRatio, null);

    if (ratio == null) return false;

    const r01 = ratio > 1 ? ratio / 100 : ratio;

    // “약한 단정”은 사람마다 문체 차이가 커서 보수적으로
    return r01 >= 0.16;
  },

  score: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const f = _findFlag(flags, "WEAK_ASSERTION_PATTERN");
    const fs = safeNum(f?.score, null);
    if (fs != null) return _clamp01(fs);

    const ratio =
      safeNum(metrics.weakAssertionRatio, null) ??
      safeNum(metrics.weak_assertion_ratio, null) ??
      safeNum(metrics.hedgeRatio, null);

    if (ratio == null) return 0;

    const r01 = ratio > 1 ? ratio / 100 : ratio;

    // 계단형
    if (r01 >= 0.30) return 0.80;
    if (r01 >= 0.22) return 0.55;
    if (r01 >= 0.16) return 0.30;
    if (r01 >= 0.12) return 0.12;
    return 0;
  },

  explain: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const f = _findFlag(flags, "WEAK_ASSERTION_PATTERN");

    const ratioRaw =
      safeNum(metrics.weakAssertionRatio, null) ??
      safeNum(metrics.weak_assertion_ratio, null) ??
      safeNum(metrics.hedgeRatio, null);

    const ratio01 = ratioRaw == null ? null : ratioRaw > 1 ? ratioRaw / 100 : ratioRaw;

    const why = [
      "‘~인 것 같습니다/도움이 되었습니다/기여했습니다’ 같은 완충 표현이 많으면 성과가 작아 보이거나 책임이 분산된 인상을 줄 수 있습니다.",
      "채용팀은 ‘정확히 무엇을 했고 어떤 결과가 났는지’를 보고 싶어해서, 단정이 약하면 검증 포인트가 흐려집니다.",
    ];

    const fix = [
      "완충어를 ‘사실/행동/수치’로 치환하세요.",
      "치환 규칙: ‘기여했습니다’ → ‘제가 [행동]했고, [지표]가 [전/후]로 변했습니다’",
      "예시: ‘성과 개선에 기여’ → ‘A/B 테스트 설계·분석을 주도했고 전환율이 2.1%→2.8%로 개선’",
    ];

    const evidenceKeys = [
      "WEAK_ASSERTION_PATTERN",
      "weakAssertionRatio",
      "hedgeRatio",
    ];

    const notes = [];
    if (ratio01 != null) notes.push(`weakAssertionRatio(0~1 추정): ${Math.round(ratio01 * 1000) / 1000}`);

    const extra = f ? _pickTopEvidence(f, 3) : [];
    for (const e of extra) notes.push(e);

    const title = f?.title ? `단정 약화(완충어) 리스크: ${safeStr(f.title)}` : "단정 약화(완충어) 리스크";

    return {
      title,
      why,
      fix,
      evidenceKeys,
      notes: notes.length ? notes : undefined,
    };
  },

  suppressIf: [],
};
