// src/lib/decision/riskProfiles/resumeStructureClarity/contentDensityRisk.js
// contentDensityRisk: structuralPatterns의 "LOW_CONTENT_DENSITY_PATTERN"을 리스크 프로필로 해석합니다.
// ✅ crash-safe: ctx 구조가 달라도 최대한 안전하게 동작하도록 방어적으로 작성

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

export const contentDensityRisk = {
  id: "LOW_CONTENT_DENSITY_RISK",
  group: "resumeStructureClarity",
  layer: "hireability",
  priority: 78,
  severityBase: 3,
  tags: ["resume", "structure", "clarity"],

  when: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    // 1) flag 기반이 1순위 (오탐 최소)
    const f = _findFlag(flags, "LOW_CONTENT_DENSITY_PATTERN");
    if (f) return true;

    // 2) metrics 보조 (flag 누락 대비) — key가 없으면 false
    const density =
      safeNum(metrics.contentDensity, null) ??
      safeNum(metrics.resumeContentDensity, null) ??
      safeNum(metrics.content_density, null);

    if (density == null) return false;

    // density가 0~1로 들어온다고 가정 (혹시 0~100이면 자동 보정)
    const d01 = density > 1 ? density / 100 : density;

    // 너무 공격적이면 오탐이 늘어서 보수적으로
    return d01 < 0.22;
  },

  // score: 0~1
  score: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const f = _findFlag(flags, "LOW_CONTENT_DENSITY_PATTERN");
    const fs = safeNum(f?.score, null);
    if (fs != null) return _clamp01(fs);

    const density =
      safeNum(metrics.contentDensity, null) ??
      safeNum(metrics.resumeContentDensity, null) ??
      safeNum(metrics.content_density, null);

    if (density == null) return 0;

    const d01 = density > 1 ? density / 100 : density;

    // density 낮을수록 위험 ↑
    // 계단형(운영 안정): <0.12, <0.18, <0.22, <0.28
    if (d01 < 0.12) return 0.85;
    if (d01 < 0.18) return 0.60;
    if (d01 < 0.22) return 0.35;
    if (d01 < 0.28) return 0.15;
    return 0;
  },

  explain: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const f = _findFlag(flags, "LOW_CONTENT_DENSITY_PATTERN");

    const densityRaw =
      safeNum(metrics.contentDensity, null) ??
      safeNum(metrics.resumeContentDensity, null) ??
      safeNum(metrics.content_density, null);

    const density01 =
      densityRaw == null ? null : densityRaw > 1 ? densityRaw / 100 : densityRaw;

    const why = [
      "문장 길이 대비 실제 검증 가능한 정보(역할/행동/성과/근거)가 부족하면 면접관이 확인할 소재가 없어 보수적으로 탈락 판단을 내리기 쉽습니다.",
      "특히 ‘무엇을 했는지’가 아닌 ‘어떤 사람인지’ 중심 문장만 반복되면 JD 적합도를 낮게 해석할 가능성이 큽니다.",
    ];

    const fix = [
      "길게 쓰는 게 목표가 아니라, 각 bullet을 ‘증거 구조’로 바꾸는 게 목표입니다.",
      "추천 템플릿(한 줄): [문제/목표] → [내 역할(오너십)] → [행동] → [결과(숫자)] → [근거(산출물/툴)]",
      "예시: ‘프로세스 개선에 기여’ 대신 → ‘온보딩 5단계 체크리스트 설계/배포(오너). 교육 이수율 62%→88% 개선. 산출물: 체크리스트/가이드 문서’",
    ];

    const evidenceKeys = [
      "LOW_CONTENT_DENSITY_PATTERN",
      "contentDensity",
      "resumeContentDensity",
    ];

    const notes = [];
    if (density01 != null) notes.push(`contentDensity(0~1 추정): ${Math.round(density01 * 1000) / 1000}`);

    const extra = f ? _pickTopEvidence(f, 3) : [];
    for (const e of extra) notes.push(e);

    const title = f?.title
      ? `이력서 정보 밀도 리스크: ${safeStr(f.title)}`
      : "이력서 정보 밀도 리스크";

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
