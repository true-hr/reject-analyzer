// src/lib/decision/riskProfiles/resumeStructureClarity/genericSelfIntroRisk.js
// genericSelfIntroRisk: structuralPatterns의 "GENERIC_SELF_INTRO_PATTERN"을 리스크 프로필로 해석합니다.
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

export const genericSelfIntroRisk = {
  id: "GENERIC_SELF_INTRO_RISK",
  group: "resumeStructureClarity",
  layer: "hireability",
  priority: 54,
  severityBase: 2,
  tags: ["resume", "positioning", "clarity"],

  when: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const f = _findFlag(flags, "GENERIC_SELF_INTRO_PATTERN");
    if (f) return true;

    const score =
      safeNum(metrics.introGenericScore, null) ??
      safeNum(metrics.genericSelfIntroScore, null) ??
      safeNum(metrics.intro_generic_score, null);

    if (score == null) return false;

    const s01 = score > 1 ? score / 100 : score;

    // 자기소개는 오탐이 상대적으로 덜 치명적이라(수정 용이), 조건 완화 가능
    return s01 >= 0.55;
  },

  score: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const f = _findFlag(flags, "GENERIC_SELF_INTRO_PATTERN");
    const fs = safeNum(f?.score, null);
    if (fs != null) return _clamp01(fs);

    const score =
      safeNum(metrics.introGenericScore, null) ??
      safeNum(metrics.genericSelfIntroScore, null) ??
      safeNum(metrics.intro_generic_score, null);

    if (score == null) return 0;

    const s01 = score > 1 ? score / 100 : score;

    // 계단형
    if (s01 >= 0.80) return 0.65;
    if (s01 >= 0.65) return 0.45;
    if (s01 >= 0.55) return 0.28;
    if (s01 >= 0.45) return 0.12;
    return 0;
  },

  explain: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const f = _findFlag(flags, "GENERIC_SELF_INTRO_PATTERN");

    const scoreRaw =
      safeNum(metrics.introGenericScore, null) ??
      safeNum(metrics.genericSelfIntroScore, null) ??
      safeNum(metrics.intro_generic_score, null);

    const score01 =
      scoreRaw == null ? null : scoreRaw > 1 ? scoreRaw / 100 : scoreRaw;

    const why = [
      "자기소개가 일반론이면 ‘누구나 쓸 수 있는 문장’으로 읽혀 차별점이 사라집니다.",
      "특히 JD가 뾰족할수록(특정 스킬/도메인/성과) 일반적인 자기소개는 적합도 신뢰를 떨어뜨릴 수 있습니다.",
    ];

    const fix = [
      "자기소개는 성격이 아니라 ‘검증 가능한 포지셔닝 한 줄’로 바꾸는 게 효과적입니다.",
      "추천 템플릿(1문장): ‘저는 [타깃 역할]에서 [강점 1~2개]로 [대표 문제/성과]를 해결해 온 사람입니다.’",
      "바로 아래에 근거 2개만 붙이세요: (1) 대표 성과(숫자) (2) 대표 산출물/프로세스",
    ];

    const evidenceKeys = [
      "GENERIC_SELF_INTRO_PATTERN",
      "introGenericScore",
      "genericSelfIntroScore",
    ];

    const notes = [];
    if (score01 != null) notes.push(`introGenericScore(0~1 추정): ${Math.round(score01 * 1000) / 1000}`);

    const extra = f ? _pickTopEvidence(f, 3) : [];
    for (const e of extra) notes.push(e);

    const title = f?.title
      ? `자기소개 일반론 리스크: ${safeStr(f.title)}`
      : "자기소개 일반론 리스크";

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
