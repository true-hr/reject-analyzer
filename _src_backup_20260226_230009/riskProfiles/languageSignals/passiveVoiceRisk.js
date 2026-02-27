// src/lib/decision/riskProfiles/languageSignals/passiveVoiceRisk.js
// passiveVoiceRisk: structuralPatterns의 "PASSIVE_VOICE_OVERUSE_PATTERN"을 리스크 프로필로 해석합니다.
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

export const passiveVoiceRisk = {
  id: "PASSIVE_VOICE_OVERUSE_RISK",
  group: "languageSignals",
  layer: "hireability",
  priority: 58,
  severityBase: 2,
  tags: ["language", "ownership", "clarity"],

  when: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const f = _findFlag(flags, "PASSIVE_VOICE_OVERUSE_PATTERN");
    if (f) return true;

    const ratio =
      safeNum(metrics.passiveVoiceRatio, null) ??
      safeNum(metrics.passive_ratio, null) ??
      safeNum(metrics.passiveVoiceOveruseRatio, null);

    if (ratio == null) return false;

    const r01 = ratio > 1 ? ratio / 100 : ratio;

    // 너무 민감하면 오탐이 늘어 보수적으로
    return r01 >= 0.22;
  },

  // score: 0~1
  score: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const f = _findFlag(flags, "PASSIVE_VOICE_OVERUSE_PATTERN");
    const fs = safeNum(f?.score, null);
    if (fs != null) return _clamp01(fs);

    const ratio =
      safeNum(metrics.passiveVoiceRatio, null) ??
      safeNum(metrics.passive_ratio, null) ??
      safeNum(metrics.passiveVoiceOveruseRatio, null);

    if (ratio == null) return 0;

    const r01 = ratio > 1 ? ratio / 100 : ratio;

    // 계단형
    if (r01 >= 0.40) return 0.75;
    if (r01 >= 0.30) return 0.55;
    if (r01 >= 0.22) return 0.30;
    if (r01 >= 0.16) return 0.12;
    return 0;
  },

  explain: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const f = _findFlag(flags, "PASSIVE_VOICE_OVERUSE_PATTERN");

    const ratioRaw =
      safeNum(metrics.passiveVoiceRatio, null) ??
      safeNum(metrics.passive_ratio, null) ??
      safeNum(metrics.passiveVoiceOveruseRatio, null);

    const ratio01 = ratioRaw == null ? null : ratioRaw > 1 ? ratioRaw / 100 : ratioRaw;

    const why = [
      "수동/피동 표현이 많으면 ‘내가 주도했다’는 인상이 약해져 오너십/리더십 신뢰가 떨어질 수 있습니다.",
      "면접관은 ‘누가 무엇을 결정했고, 무엇을 실행했는지’를 빠르게 보려 하는데, 피동 문장은 책임 주체가 흐려져 평가가 보수적으로 변합니다.",
    ];

    const fix = [
      "각 문장을 ‘주체(나/팀) + 행동동사 + 대상 + 결과’ 구조로 바꾸세요.",
      "치환 규칙 예시: ‘~이 진행되었습니다/되었습니다’ → ‘제가/우리 팀이 ~을 진행했고, ~을 달성했습니다’",
      "한 줄 템플릿: ‘제가 [행동동사]하여 [대상]을 [변화]시켰고, [지표]가 [전/후]로 개선되었습니다.’",
    ];

    const evidenceKeys = [
      "PASSIVE_VOICE_OVERUSE_PATTERN",
      "passiveVoiceRatio",
      "passive_ratio",
    ];

    const notes = [];
    if (ratio01 != null) notes.push(`passiveVoiceRatio(0~1 추정): ${Math.round(ratio01 * 1000) / 1000}`);

    const extra = f ? _pickTopEvidence(f, 3) : [];
    for (const e of extra) notes.push(e);

    const title = f?.title ? `피동 표현 과다 리스크: ${safeStr(f.title)}` : "피동 표현 과다 리스크";

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
