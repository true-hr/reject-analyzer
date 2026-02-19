// src/lib/decision/riskProfiles/resumeStructureClarity/vagueResponsibilityRisk.js
// vagueResponsibilityRisk: structuralPatterns의 "VAGUE_RESPONSIBILITY_PATTERN"을 리스크 프로필로 해석합니다.
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

export const vagueResponsibilityRisk = {
  id: "VAGUE_RESPONSIBILITY_RISK",
  group: "resumeStructureClarity",
  layer: "hireability",
  priority: 88,
  severityBase: 4,
  tags: ["resume", "ownership", "clarity"],

  when: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const f = _findFlag(flags, "VAGUE_RESPONSIBILITY_PATTERN");
    if (f) return true;

    const ratio =
      safeNum(metrics.vagueResponsibilityRatio, null) ??
      safeNum(metrics.vagueVerbRatio, null) ??
      safeNum(metrics.vague_responsibility_ratio, null);

    if (ratio == null) return false;

    const r01 = ratio > 1 ? ratio / 100 : ratio;

    // 오너십 리스크는 오탐이 치명적이라 보수적으로
    return r01 >= 0.20;
  },

  score: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const f = _findFlag(flags, "VAGUE_RESPONSIBILITY_PATTERN");
    const fs = safeNum(f?.score, null);
    if (fs != null) return _clamp01(fs);

    const ratio =
      safeNum(metrics.vagueResponsibilityRatio, null) ??
      safeNum(metrics.vagueVerbRatio, null) ??
      safeNum(metrics.vague_responsibility_ratio, null);

    if (ratio == null) return 0;

    const r01 = ratio > 1 ? ratio / 100 : ratio;

    // 계단형 (이건 심각도가 높게 나오는 게 정상)
    if (r01 >= 0.35) return 0.90;
    if (r01 >= 0.28) return 0.72;
    if (r01 >= 0.20) return 0.55;
    if (r01 >= 0.15) return 0.30;
    return 0;
  },

  explain: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const f = _findFlag(flags, "VAGUE_RESPONSIBILITY_PATTERN");

    const ratioRaw =
      safeNum(metrics.vagueResponsibilityRatio, null) ??
      safeNum(metrics.vagueVerbRatio, null) ??
      safeNum(metrics.vague_responsibility_ratio, null);

    const ratio01 =
      ratioRaw == null ? null : ratioRaw > 1 ? ratioRaw / 100 : ratioRaw;

    const why = [
      "‘기여했다/지원했다/참여했다’ 같은 표현이 많으면 면접관은 책임 범위를 낮게 추정합니다.",
      "결과적으로 ‘실제 오너십이 있는 사람인지’가 불명확해져, 서류 단계에서 보수적으로 탈락될 수 있습니다.",
    ];

    const fix = [
      "각 bullet을 ‘내가 책임진 범위(ownership)’가 보이도록 문장 구조를 바꾸세요.",
      "추천 템플릿(두 문장): (1) ‘내가 책임진 범위/결정’ (2) ‘내 행동 + 결과(숫자) + 산출물’",
      "예시: ‘채용 프로세스 개선에 참여’ → ‘채용 전형 운영(오너): JD 정렬/면접관 가이드 개편. 리드타임 21일→14일 단축. 산출물: 인터뷰 가이드/평가표’",
    ];

    const evidenceKeys = [
      "VAGUE_RESPONSIBILITY_PATTERN",
      "vagueResponsibilityRatio",
      "vagueVerbRatio",
    ];

    const notes = [];
    if (ratio01 != null) notes.push(`vagueResponsibilityRatio(0~1 추정): ${Math.round(ratio01 * 1000) / 1000}`);

    const extra = f ? _pickTopEvidence(f, 3) : [];
    for (const e of extra) notes.push(e);

    const title = f?.title
      ? `책임 범위 불명확 리스크: ${safeStr(f.title)}`
      : "책임 범위 불명확 리스크";

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
