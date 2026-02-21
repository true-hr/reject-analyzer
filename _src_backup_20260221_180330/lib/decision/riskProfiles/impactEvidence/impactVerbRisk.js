// src/lib/decision/riskProfiles/impactEvidence/impactVerbRisk.js
// ?깃낵/?꾪뙥???숈궗(媛쒖꽑/利앷?/理쒖쟻???μ긽 ?? 遺議?由ъ뒪??
// - structuralPatterns: LOW_IMPACT_VERB_PATTERN :contentReference[oaicite:3]{index=3}

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

export const impactVerbRisk = {
  id: "IMPACT__LOW_IMPACT_VERBS",
  group: "impactEvidence",
  layer: "hireability",
  priority: 88,
  severityBase: 4,
  tags: ["impactEvidence", "impactVerbs"],

  when: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "LOW_IMPACT_VERB_PATTERN");
    if (flag) return true;

    const cnt = safeNum(metrics.impactVerbCount, null);
    if (cnt == null) return false;

    const min = safeNum(metrics.minImpactVerbs, null) ?? 2; // THRESH.MIN_IMPACT_VERBS 湲곕낯 2 :contentReference[oaicite:4]{index=4}
    return cnt < min;
  },

  score: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "LOW_IMPACT_VERB_PATTERN");
    if (flag && Number.isFinite(flag.score)) return _clamp01(flag.score);

    const cnt = safeNum(metrics.impactVerbCount, null);
    if (cnt == null) return 0;

    const min = safeNum(metrics.minImpactVerbs, null) ?? 2;
    // 遺議깊븷?섎줉 ?믨쾶
    // cnt=0 -> 0.85, cnt=1 -> 0.65, cnt=2 -> 0.25
    if (cnt <= 0) return 0.85;
    if (cnt < min) return 0.65;
    return 0.25;
  },

  explain: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "LOW_IMPACT_VERB_PATTERN");
    const detail = isObj(flag?.detail) ? flag.detail : {};
    const evidence = Array.isArray(flag?.evidence) ? flag.evidence.filter(Boolean).slice(0, 6) : [];

    const cnt =
      safeNum(detail.impactVerbCount, null) ??
      safeNum(metrics.impactVerbCount, null) ??
      0;

    const min =
      safeNum(detail.minImpactVerbs, null) ??
      safeNum(metrics.minImpactVerbs, null) ??
      2;

    const hits = _uniq(detail.hits || metrics.impactVerbHits || []);

    const why = [
      "臾몄옣?ㅼ씠 ?섎Т?뉗쓣 ?덈떎(?낅Т ?섑뻾)??以묒떖?쇰줈 ?쏀엳怨? ?섎Т?뉗씠 醫뗭븘議뚮떎(?꾪뙥?????좏샇媛 ?쏀빀?덈떎.",
      "?쒕쪟?먯꽌???깃낵?숈궗(媛쒖꽑/利앷?/理쒖쟻???μ긽/?덇컧/?⑥텞 ??媛 ?섍껐怨쇨? ?덉뿀?ㅲ숇뒗 鍮좊Ⅸ ?뚰듃濡??묐룞?⑸땲??",
    ];

    if (hits.length) {
      why.push(`媛먯????깃낵?숈궗(?쇰?): ${hits.slice(0, 12).join(", ")}`);
    } else {
      why.push("?깃낵?숈궗(媛쒖꽑/利앷?/理쒖쟻???μ긽/?덇컧/?⑥텞 ??媛 嫄곗쓽 媛먯??섏? ?딆뒿?덈떎.");
    }

    const fix = [
      "媛?bullet???섑뻾???닿? ???? + ?깃낵?숈궗(醫뗭븘吏?諛⑺뼢) + 吏???レ옄)??援ъ“濡??ъ옉?깊븯?몄슂.",
      "?レ옄媛 ?녿떎硫??쁁efore?묨fter?숇씪??留뚮뱶?몄슂. (?? 3?쇄넂1?? ?ㅻ쪟 5%??%, ??10嫄닳넂30嫄?",
      "?깃낵?숈궗???듭?濡??ｌ? 留먭퀬, ?ㅼ젣濡?諛붾?吏???덉쭏/?띾룄/鍮꾩슜/?꾪솚??癒쇱? ?뺥븳 ??洹몄뿉 留욌뒗 ?숈궗瑜??좏깮?섏꽭??",
    ];

    const notes = [];
    notes.push(`impactVerbCount: ${cnt} (min ${min})`);
    if (hits.length) notes.push(`impactVerbHits(sample): ${hits.slice(0, 12).join(", ")}`);
    if (evidence.length) notes.push(...evidence);

    const evidenceKeys = ["impactVerbCount", "impactVerbHits"];

    const title = flag?.title
      ? `?꾪뙥???숈궗 由ъ뒪?? ${safeStr(flag.title)}`
      : "?깃낵/?꾪뙥???숈궗 遺議?由ъ뒪??;

    return { title, why, fix, evidenceKeys, notes };
  },

  suppressIf: [],
};
