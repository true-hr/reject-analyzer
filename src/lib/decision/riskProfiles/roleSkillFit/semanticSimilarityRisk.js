// src/lib/decision/riskProfiles/roleSkillFit/semanticSimilarityRisk.js
// JD-이력서 의미 유사도 낮음 리스크
// - structuralPatterns의 LOW_SEMANTIC_SIMILARITY_PATTERN 플래그를 profile로 승격
// - metrics.semanticSimilarity(= Jaccard similarity)를 근거로 사용
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

export const semanticSimilarityRisk = {
  id: "ROLE_SKILL__LOW_SEMANTIC_SIMILARITY",
  group: "roleSkillFit",
  layer: "hireability",
  priority: 82,
  severityBase: 4,
  tags: ["roleSkillFit", "semanticSimilarity", "jdMatch"],

  // 트리거:
  // 1) structuralPatterns가 LOW_SEMANTIC_SIMILARITY_PATTERN을 찍었으면 true
  // 2) 플래그가 없더라도(연결/버전 차이 대비) metrics.semanticSimilarity가 있고 threshold보다 낮으면 true
  when: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "LOW_SEMANTIC_SIMILARITY_PATTERN");
    if (flag) return true;

    const sim = safeNum(metrics.semanticSimilarity, null);
    if (sim == null) return false;

    const threshold =
      safeNum(metrics.semanticSimilarityThreshold, null) ??
      safeNum(metrics.semanticSimilarityThresh, null) ??
      0.35;

    return sim < threshold;
  },

  // score: 0~1
  // - structuralPatterns의 score를 우선 사용(있으면 그대로)
  // - 없으면 structuralPatterns와 동일한 수식으로 계산:
  //   score = clamp((threshold - sim)/threshold + 0.3, 0, 1)
  score: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "LOW_SEMANTIC_SIMILARITY_PATTERN");
    if (flag && Number.isFinite(flag.score)) return _clamp01(flag.score);

    const sim = safeNum(metrics.semanticSimilarity, null);
    if (sim == null) return 0;

    const threshold =
      safeNum(metrics.semanticSimilarityThreshold, null) ??
      safeNum(metrics.semanticSimilarityThresh, null) ??
      0.35;

    const raw = (threshold - sim) / threshold + 0.3;
    return _clamp01(raw);
  },

  explain: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);
    const flag = _findFlag(flags, "LOW_SEMANTIC_SIMILARITY_PATTERN");

    const detail = isObj(flag?.detail) ? flag.detail : {};

    const sim =
      safeNum(detail.similarity, null) ??
      safeNum(detail.semanticSimilarity, null) ??
      safeNum(metrics.semanticSimilarity, null);

    const threshold =
      safeNum(detail.threshold, null) ??
      safeNum(metrics.semanticSimilarityThreshold, null) ??
      safeNum(metrics.semanticSimilarityThresh, null) ??
      0.35;

    const criticalCut =
      safeNum(detail.criticalCut, null) ??
      safeNum(metrics.semanticSimilarityCriticalCut, null) ??
      0.22;

    const evidence = Array.isArray(flag?.evidence) ? flag.evidence.filter(Boolean).slice(0, 8) : [];

    const why = [];
    if (sim != null) {
      why.push(
        `JD와 이력서(포트폴리오 포함)에서 ‘같은 의미/도메인’으로 읽히는 단어군이 적습니다. (유사도 ${Math.round(sim * 100)}%)`
      );
      why.push(
        `채용 입장에서는 “같은 일을 해본 사람”인지 “다른 일을 해온 사람”인지 1차로 거르는 지표로 작동합니다.`
      );
    } else {
      why.push("JD와 이력서(포트폴리오 포함) 간 의미 유사도가 낮게 감지됩니다.");
    }

    // 구체 수치 메모
    const notes = [];
    if (sim != null) notes.push(`semanticSimilarity(Jaccard): ${Math.round(sim * 1000) / 1000}`);
    notes.push(`threshold: ${threshold}`);
    notes.push(`criticalCut: ${criticalCut}`);
    if (evidence.length) notes.push(...evidence);

    const fix = [
      "JD 문장을 그대로 ‘복붙’하지 말고, JD의 핵심 명사(도메인/툴/산출물)를 경험 bullet 안에 자연스럽게 녹이세요.",
      "유사도를 올리는 가장 빠른 방식은 ‘도메인 명사 + 행동동사 + 결과(지표)’ 3요소를 JD의 표현과 최대한 동일한 언어로 맞추는 겁니다.",
      "정말 다른 도메인이라면: “내 기존 도메인에서 했던 X가, 지원 도메인에서 Y로 그대로 대응된다” 매핑을 3개로 고정해서 상단에 배치하세요.",
    ];

    const evidenceKeys = ["semanticSimilarity", "semanticSimilarityThreshold", "jdKeywords", "jdKeywordHits"];

    // 제목은 flag가 주면 그걸 우선
    const title = flag?.title
      ? `JD-이력서 의미 유사도 리스크: ${safeStr(flag.title)}`
      : "JD-이력서 의미 유사도 낮음 리스크";

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
