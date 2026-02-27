// src/lib/decision/riskProfiles/languageSignals/hedgeLanguageRisk.js
// hedgeLanguageRisk: (가능하면) HEDGE_LANGUAGE_PATTERN을 우선, 없으면 WEAK_ASSERTION_PATTERN/metrics.hedgeRatio로 보조 동작.
// ✅ crash-safe
//
// ⚠️ 주의: 프로젝트에서 hedge와 weakAssertion을 분리 운영하려면 structuralPatterns에 hedge 전용 flag가 있는 게 이상적입니다.
// 지금은 “있으면 우선 사용, 없으면 metrics 기반으로만” 동작하도록 설계합니다.

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

export const hedgeLanguageRisk = {
  id: "HEDGE_LANGUAGE_RISK",
  group: "languageSignals",
  layer: "hireability",
  priority: 52,
  severityBase: 2,
  tags: ["language", "hedge", "clarity"],

  when: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    // 전용 flag가 있으면 그걸 우선
    const f =
      _findFlag(flags, "HEDGE_LANGUAGE_PATTERN") ||
      _findFlag(flags, "HEDGING_PATTERN");

    if (f) return true;

    // 전용 flag가 없다면 metrics 기반으로만(weakAssertionRisk랑 중복 트리거 줄이기)
    const ratio =
      safeNum(metrics.hedgeRatio, null) ??
      safeNum(metrics.hedgingRatio, null) ??
      safeNum(metrics.hedge_ratio, null);

    if (ratio == null) return false;

    const r01 = ratio > 1 ? ratio / 100 : ratio;

    // 완충어는 문체 차이가 커서 보수적으로
    return r01 >= 0.18;
  },

  score: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const f =
      _findFlag(flags, "HEDGE_LANGUAGE_PATTERN") ||
      _findFlag(flags, "HEDGING_PATTERN");

    const fs = safeNum(f?.score, null);
    if (fs != null) return _clamp01(fs);

    const ratio =
      safeNum(metrics.hedgeRatio, null) ??
      safeNum(metrics.hedgingRatio, null) ??
      safeNum(metrics.hedge_ratio, null);

    if (ratio == null) return 0;

    const r01 = ratio > 1 ? ratio / 100 : ratio;

    if (r01 >= 0.34) return 0.70;
    if (r01 >= 0.26) return 0.48;
    if (r01 >= 0.18) return 0.26;
    if (r01 >= 0.14) return 0.12;
    return 0;
  },

  explain: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const f =
      _findFlag(flags, "HEDGE_LANGUAGE_PATTERN") ||
      _findFlag(flags, "HEDGING_PATTERN");

    const ratioRaw =
      safeNum(metrics.hedgeRatio, null) ??
      safeNum(metrics.hedgingRatio, null) ??
      safeNum(metrics.hedge_ratio, null);

    const ratio01 = ratioRaw == null ? null : ratioRaw > 1 ? ratioRaw / 100 : ratioRaw;

    const why = [
      "완충 표현(‘~같습니다/가능합니다/도움이 되었습니다’)이 많으면 성과와 책임이 작게 읽히고, 신뢰도가 떨어질 수 있습니다.",
      "특히 JD가 강한 오너십/리드 경험을 요구할수록, ‘확신 없는 문장’은 불리하게 작동합니다.",
    ];

    const fix = [
      "완충어를 ‘사실/행동/수치’로 치환하세요(문체가 아니라 구조 문제로 해결).",
      "치환 규칙: ‘도움이 되었습니다’ → ‘제가 [행동]했고 [지표]가 [전/후]로 변했습니다’",
      "한 줄 템플릿: ‘[내 행동]으로 [대상]을 [변화]시켜 [지표]가 [전/후]로 개선되었습니다.’",
    ];

    const evidenceKeys = [
      "HEDGE_LANGUAGE_PATTERN",
      "hedgeRatio",
      "hedgingRatio",
    ];

    const notes = [];
    if (ratio01 != null) notes.push(`hedgeRatio(0~1 추정): ${Math.round(ratio01 * 1000) / 1000}`);

    const extra = f ? _pickTopEvidence(f, 3) : [];
    for (const e of extra) notes.push(e);

    const title = f?.title ? `완충어(헤지) 과다 리스크: ${safeStr(f.title)}` : "완충어(헤지) 과다 리스크";

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
