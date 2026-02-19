// src/lib/decision/riskProfiles/resumeStructureClarity/buzzwordRatioRisk.js
// buzzwordRatioRisk: structuralPatterns의 "HIGH_BUZZWORD_RATIO_PATTERN"을 리스크 프로필로 해석합니다.
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

export const buzzwordRatioRisk = {
  id: "HIGH_BUZZWORD_RATIO_RISK",
  group: "resumeStructureClarity",
  layer: "hireability",
  priority: 62,
  severityBase: 2,
  tags: ["resume", "language", "clarity"],

  when: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const f = _findFlag(flags, "HIGH_BUZZWORD_RATIO_PATTERN");
    if (f) return true;

    const ratio =
      safeNum(metrics.buzzwordRatio, null) ??
      safeNum(metrics.resumeBuzzwordRatio, null) ??
      safeNum(metrics.buzzword_ratio, null);

    if (ratio == null) return false;

    const r01 = ratio > 1 ? ratio / 100 : ratio;

    // 보수적으로: 0.18 이상이면 “높음”으로 취급 (프로젝트 특성상 오탐 방지)
    return r01 >= 0.18;
  },

  score: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const f = _findFlag(flags, "HIGH_BUZZWORD_RATIO_PATTERN");
    const fs = safeNum(f?.score, null);
    if (fs != null) return _clamp01(fs);

    const ratio =
      safeNum(metrics.buzzwordRatio, null) ??
      safeNum(metrics.resumeBuzzwordRatio, null) ??
      safeNum(metrics.buzzword_ratio, null);

    if (ratio == null) return 0;

    const r01 = ratio > 1 ? ratio / 100 : ratio;

    // 계단형
    if (r01 >= 0.30) return 0.80;
    if (r01 >= 0.22) return 0.55;
    if (r01 >= 0.18) return 0.30;
    if (r01 >= 0.14) return 0.12;
    return 0;
  },

  explain: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const f = _findFlag(flags, "HIGH_BUZZWORD_RATIO_PATTERN");

    const ratioRaw =
      safeNum(metrics.buzzwordRatio, null) ??
      safeNum(metrics.resumeBuzzwordRatio, null) ??
      safeNum(metrics.buzzword_ratio, null);

    const ratio01 =
      ratioRaw == null ? null : ratioRaw > 1 ? ratioRaw / 100 : ratioRaw;

    const why = [
      "키워드(버즈워드) 비중이 높고 구체 행동/근거가 부족하면 ‘포장만 한 문서’로 읽히기 쉽습니다.",
      "특히 채용팀은 실무 재현성(어떤 상황에서 무엇을 어떻게 했는지)을 보고 싶어하기 때문에, 키워드만 나열되면 신뢰도가 떨어질 수 있습니다.",
    ];

    const fix = [
      "버즈워드를 지우는 게 아니라, ‘버즈워드 바로 뒤에 증거’를 붙이는 규칙을 적용하세요.",
      "추천 규칙: (버즈워드) + (내가 한 행동/산출물) + (측정값/범위/규모) 세트를 1문장으로 고정",
      "예시: ‘데이터 기반 의사결정’ → ‘주간 코호트 리포트 구성(산출물) + 이탈 구간 개선안 제안(행동) + 리텐션 X% 개선(결과)’",
    ];

    const evidenceKeys = [
      "HIGH_BUZZWORD_RATIO_PATTERN",
      "buzzwordRatio",
      "resumeBuzzwordRatio",
    ];

    const notes = [];
    if (ratio01 != null) notes.push(`buzzwordRatio(0~1 추정): ${Math.round(ratio01 * 1000) / 1000}`);

    const extra = f ? _pickTopEvidence(f, 3) : [];
    for (const e of extra) notes.push(e);

    const title = f?.title
      ? `버즈워드 과다 리스크: ${safeStr(f.title)}`
      : "버즈워드 과다 리스크";

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
