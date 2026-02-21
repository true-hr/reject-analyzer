// src/lib/decision/riskProfiles/roleSkillFit/semanticSimilarityRisk.js
// JD-?대젰???섎? ?좎궗????쓬 由ъ뒪??
// - structuralPatterns??LOW_SEMANTIC_SIMILARITY_PATTERN ?뚮옒洹몃? profile濡??밴꺽
// - metrics.semanticSimilarity(= Jaccard similarity)瑜?洹쇨굅濡??ъ슜
// ??crash-safe: ctx 援ъ“媛 ?щ씪??理쒕????덉쟾?섍쾶 ?숈옉

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

  // ?몃━嫄?
  // 1) structuralPatterns媛 LOW_SEMANTIC_SIMILARITY_PATTERN??李띿뿀?쇰㈃ true
  // 2) ?뚮옒洹멸? ?녿뜑?쇰룄(?곌껐/踰꾩쟾 李⑥씠 ?鍮? metrics.semanticSimilarity媛 ?덇퀬 threshold蹂대떎 ??쑝硫?true
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
  // - structuralPatterns??score瑜??곗꽑 ?ъ슜(?덉쑝硫?洹몃?濡?
  // - ?놁쑝硫?structuralPatterns? ?숈씪???섏떇?쇰줈 怨꾩궛:
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
        `JD? ?대젰???ы듃?대━???ы븿)?먯꽌 ?섍컳? ?섎?/?꾨찓?멤숈쑝濡??쏀엳???⑥뼱援곗씠 ?곸뒿?덈떎. (?좎궗??${Math.round(sim * 100)}%)`
      );
      why.push(
        `梨꾩슜 ?낆옣?먯꽌???쒓컳? ?쇱쓣 ?대낯 ?щ엺?앹씤吏 ?쒕떎瑜??쇱쓣 ?댁삩 ?щ엺?앹씤吏 1李⑤줈 嫄곕Ⅴ??吏?쒕줈 ?묐룞?⑸땲??`
      );
    } else {
      why.push("JD? ?대젰???ы듃?대━???ы븿) 媛??섎? ?좎궗?꾧? ??쾶 媛먯??⑸땲??");
    }

    // 援ъ껜 ?섏튂 硫붾え
    const notes = [];
    if (sim != null) notes.push(`semanticSimilarity(Jaccard): ${Math.round(sim * 1000) / 1000}`);
    notes.push(`threshold: ${threshold}`);
    notes.push(`criticalCut: ${criticalCut}`);
    if (evidence.length) notes.push(...evidence);

    const fix = [
      "JD 臾몄옣??洹몃?濡??섎났遺쇺숉븯吏 留먭퀬, JD???듭떖 紐낆궗(?꾨찓?????곗텧臾?瑜?寃쏀뿕 bullet ?덉뿉 ?먯뿰?ㅻ읇寃??뱀씠?몄슂.",
      "?좎궗?꾨? ?щ━??媛??鍮좊Ⅸ 諛⑹떇? ?섎룄硫붿씤 紐낆궗 + ?됰룞?숈궗 + 寃곌낵(吏????3?붿냼瑜?JD???쒗쁽怨?理쒕????숈씪???몄뼱濡?留욎텛??寃곷땲??",
      "?뺣쭚 ?ㅻⅨ ?꾨찓?몄씠?쇰㈃: ?쒕궡 湲곗〈 ?꾨찓?몄뿉???덈뜕 X媛, 吏???꾨찓?몄뿉??Y濡?洹몃?濡???묐맂?ㅲ?留ㅽ븨??3媛쒕줈 怨좎젙?댁꽌 ?곷떒??諛곗튂?섏꽭??",
    ];

    const evidenceKeys = ["semanticSimilarity", "semanticSimilarityThreshold", "jdKeywords", "jdKeywordHits"];

    // ?쒕ぉ? flag媛 二쇰㈃ 洹멸구 ?곗꽑
    const title = flag?.title
      ? `JD-?대젰???섎? ?좎궗??由ъ뒪?? ${safeStr(flag.title)}`
      : "JD-?대젰???섎? ?좎궗????쓬 由ъ뒪??;

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
