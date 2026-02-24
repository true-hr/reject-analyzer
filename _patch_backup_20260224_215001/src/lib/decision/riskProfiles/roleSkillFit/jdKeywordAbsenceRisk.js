// src/lib/decision/riskProfiles/roleSkillFit/jdKeywordAbsenceRisk.js
// JD 핵심 키워드 부재 리스크
// - structuralPatterns의 JD_KEYWORD_ABSENCE_PATTERN(키워드 매칭률 낮음)을 profile로 승격
// - metrics: jdKeywords / jdKeywordHits / keywordMatchRatio를 근거로 사용 :contentReference[oaicite:1]{index=1}
// ✅ crash-safe: ctx 구조가 달라도 최대한 안전하게 동작

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

function _slice(arr, n) {
  return Array.isArray(arr) ? arr.slice(0, n) : [];
}

export const jdKeywordAbsenceRisk = {
  id: "ROLE_SKILL__JD_KEYWORD_ABSENCE",
  group: "roleSkillFit",
  layer: "hireability",
  priority: 78,
  severityBase: 4,
  tags: ["roleSkillFit", "keywordCoverage", "jdMatch"],

  // 트리거:
  // 1) structuralPatterns가 JD_KEYWORD_ABSENCE_PATTERN을 찍었으면 true
  // 2) 플래그가 없더라도(다른 버전/연결 누락 대비) metrics 상 키워드가 있고 매칭률이 매우 낮으면 true
  when: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "JD_KEYWORD_ABSENCE_PATTERN");
    if (flag) return true;

    const jdKeywords = Array.isArray(metrics.jdKeywords) ? metrics.jdKeywords : null;
    const ratio = safeNum(metrics.keywordMatchRatio, null);

    if (!jdKeywords || jdKeywords.length === 0) return false;
    if (ratio == null) return false;

    // 보조 트리거는 오탐 방지 위해 "아주 낮을 때만" (보수적)
    return ratio < 0.25;
  },

  // score: 0~1
  score: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);
    const flag = _findFlag(flags, "JD_KEYWORD_ABSENCE_PATTERN");

    // structuralPatterns가 이미 0~1 score를 주면 그걸 그대로 사용
    if (flag && Number.isFinite(flag.score)) return _clamp01(flag.score);

    const ratio = safeNum(metrics.keywordMatchRatio, null);
    if (ratio == null) return 0;

    // ratio가 낮을수록 점수 높게
    // 예: 0.25 -> 0.8, 0.10 -> 0.92, 0 -> 1.0
    const s = 0.7 + (0.25 - ratio) * 1.2;
    return _clamp01(s);
  },

  explain: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);
    const flag = _findFlag(flags, "JD_KEYWORD_ABSENCE_PATTERN");

    // 가능한 detail 우선 사용 (버전마다 detail 키가 조금 달라도 metrics로 백업)
    const detail = isObj(flag?.detail) ? flag.detail : {};

    const jdKeywords = _uniq(detail.jdKeywords || metrics.jdKeywords || []);
    const hits = _uniq(detail.hits || detail.jdKeywordHits || metrics.jdKeywordHits || []);
    const missing = _uniq(detail.missing || []);

    const ratio = safeNum(detail.ratio ?? detail.keywordMatchRatio ?? metrics.keywordMatchRatio, null);

    const evidence = Array.isArray(flag?.evidence) ? flag.evidence.filter(Boolean).slice(0, 8) : [];

    const jdKeywordsShort = _slice(jdKeywords, 12);
    const hitsShort = _slice(hits, 12);
    const missingShort = _slice(missing, 12);

    const why = [];
    if (ratio != null) {
      why.push(`JD 핵심 키워드 대비 이력서/포트폴리오에 반영된 키워드 비율이 낮습니다. (매칭률 ${Math.round(ratio * 100)}%)`);
    } else {
      why.push("JD 핵심 키워드가 이력서/포트폴리오에 충분히 반영되지 않았습니다.");
    }

    if (missingShort.length) {
      why.push(`누락 후보(일부): ${missingShort.join(", ")}`);
    } else if (jdKeywordsShort.length) {
      why.push(`JD 핵심 키워드(일부): ${jdKeywordsShort.join(", ")}`);
    }

    if (hitsShort.length) {
      why.push(`반영된 키워드(일부): ${hitsShort.join(", ")}`);
    }

    const fix = [
      "JD 상단/중간에 반복되는 명사(도구·업무·산출물)를 10~15개 뽑고, 이력서 bullet 안에 ‘행동+대상+성과’ 문장으로 자연스럽게 삽입하세요.",
      "키워드 ‘나열 섹션(스킬)’만 추가하는 건 약합니다. 경험 bullet에서 해당 키워드가 ‘무엇을 했고(액션) 무엇이 좋아졌는지(결과)’로 연결되게 쓰세요.",
      "키워드가 많아도 ‘동사(내가 한 일) + 지표(결과)’가 없으면 서류 통과에 거의 도움 안 됩니다. 최소 1개 숫자 근거를 붙이세요.",
    ];

    const notes = [];
    if (jdKeywords.length) notes.push(`JD 키워드 후보 수: ${jdKeywords.length}`);
    if (hits.length) notes.push(`매칭된 키워드 수: ${hits.length}`);
    if (missing.length) notes.push(`누락 키워드 수: ${missing.length}`);
    if (ratio != null) notes.push(`매칭률: ${Math.round(ratio * 100)}%`);

    // UI에서 찍기 좋은 키들
    const evidenceKeys = ["jdKeywords", "jdKeywordHits", "keywordMatchRatio"];

    return {
      title: "JD 핵심 키워드 부재 리스크",
      why,
      fix,
      evidenceKeys,
      notes: evidence.length ? [...notes, ...evidence] : (notes.length ? notes : undefined),
    };
  },

  suppressIf: [],
};
