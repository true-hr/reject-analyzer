// src/lib/decision/riskProfiles/languageSignals/lowConfidenceLanguageRisk.js
// lowConfidenceLanguageRisk: (가능하면) LOW_CONFIDENCE_LANGUAGE_PATTERN을 우선, 없으면 RESPONSIBILITY_AVOIDANCE_PATTERN을 대체 트리거로 사용.
// ✅ crash-safe
//
// handoff에 명시된 flag: RESPONSIBILITY_AVOIDANCE_PATTERN
// 이 파일명과 1:1 매핑이 애매할 수 있어, 전용 flag가 있으면 우선 사용하도록 설계합니다.

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

export const lowConfidenceLanguageRisk = {
  id: "LOW_CONFIDENCE_LANGUAGE_RISK",
  group: "languageSignals",
  layer: "hireability",
  priority: 84,
  severityBase: 4,
  tags: ["language", "ownership", "risk"],

  when: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    // 전용 flag가 있으면 우선
    const f0 =
      _findFlag(flags, "LOW_CONFIDENCE_LANGUAGE_PATTERN") ||
      _findFlag(flags, "LOW_CONFIDENCE_PATTERN");

    if (f0) return true;

    // handoff에 있는 flag를 대체 트리거로 사용
    const f1 =
      _findFlag(flags, "RESPONSIBILITY_AVOIDANCE_PATTERN") ||
      _findFlag(flags, "RESPONSIBILITY_AVOIDANCE_LANGUAGE_PATTERN");

    if (f1) return true;

    // metrics 보조 (키가 없으면 false)
    const ratio =
      safeNum(metrics.responsibilityAvoidanceRatio, null) ??
      safeNum(metrics.responsibility_avoidance_ratio, null) ??
      safeNum(metrics.blameShiftRatio, null) ??
      safeNum(metrics.lowConfidenceLanguageRatio, null);

    if (ratio == null) return false;

    const r01 = ratio > 1 ? ratio / 100 : ratio;

    // 오너십 핵심 리스크: 발견이 중요하니 너무 높게 잡지 않되, 오탐도 고려
    return r01 >= 0.12;
  },

  score: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const f0 =
      _findFlag(flags, "LOW_CONFIDENCE_LANGUAGE_PATTERN") ||
      _findFlag(flags, "LOW_CONFIDENCE_PATTERN");

    const f1 =
      _findFlag(flags, "RESPONSIBILITY_AVOIDANCE_PATTERN") ||
      _findFlag(flags, "RESPONSIBILITY_AVOIDANCE_LANGUAGE_PATTERN");

    const fs = safeNum((f0 || f1)?.score, null);
    if (fs != null) return _clamp01(fs);

    const ratio =
      safeNum(metrics.responsibilityAvoidanceRatio, null) ??
      safeNum(metrics.responsibility_avoidance_ratio, null) ??
      safeNum(metrics.blameShiftRatio, null) ??
      safeNum(metrics.lowConfidenceLanguageRatio, null);

    if (ratio == null) return 0;

    const r01 = ratio > 1 ? ratio / 100 : ratio;

    // 계단형 (오너십/책임 회피 계열은 높게 나오는 게 정상)
    if (r01 >= 0.26) return 0.90;
    if (r01 >= 0.18) return 0.70;
    if (r01 >= 0.12) return 0.50;
    if (r01 >= 0.08) return 0.25;
    return 0;
  },

  explain: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const f0 =
      _findFlag(flags, "LOW_CONFIDENCE_LANGUAGE_PATTERN") ||
      _findFlag(flags, "LOW_CONFIDENCE_PATTERN");

    const f1 =
      _findFlag(flags, "RESPONSIBILITY_AVOIDANCE_PATTERN") ||
      _findFlag(flags, "RESPONSIBILITY_AVOIDANCE_LANGUAGE_PATTERN");

    const top = f0 || f1 || null;

    const ratioRaw =
      safeNum(metrics.responsibilityAvoidanceRatio, null) ??
      safeNum(metrics.responsibility_avoidance_ratio, null) ??
      safeNum(metrics.blameShiftRatio, null) ??
      safeNum(metrics.lowConfidenceLanguageRatio, null);

    const ratio01 = ratioRaw == null ? null : ratioRaw > 1 ? ratioRaw / 100 : ratioRaw;

    const why = [
      "책임 회피/거리두기 표현(‘지원 역할’, ‘상황상’, ‘어쩔 수 없이’)이 보이면 오너십 신뢰가 크게 떨어질 수 있습니다.",
      "채용팀은 문제 상황에서도 ‘내가 통제한 범위와 의사결정’을 보고 싶어하므로, 책임 주체가 흐려지면 리스크로 해석됩니다.",
    ];

    const fix = [
      "문장을 ‘환경 탓’이 아니라 ‘내 통제 범위/결정/대응’으로 바꾸세요.",
      "추천 템플릿: ‘제 통제 범위는 [X]였고, 그 안에서 [결정/행동]을 했으며, 결과가 [Y]로 나타났습니다.’",
      "문제 발생 사례는 ‘원인 설명’보다 ‘대응/복구/재발방지(프로세스)’를 먼저 제시하세요.",
    ];

    const evidenceKeys = [
      "RESPONSIBILITY_AVOIDANCE_PATTERN",
      "lowConfidenceLanguageRatio",
      "responsibilityAvoidanceRatio",
      "blameShiftRatio",
    ];

    const notes = [];
    if (ratio01 != null) notes.push(`lowConfidence/responsibilityAvoidance(0~1 추정): ${Math.round(ratio01 * 1000) / 1000}`);

    const extra = top ? _pickTopEvidence(top, 3) : [];
    for (const e of extra) notes.push(e);

    const title = top?.title
      ? `책임/자신감 신호 리스크: ${safeStr(top.title)}`
      : "책임/자신감 신호 리스크";

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
