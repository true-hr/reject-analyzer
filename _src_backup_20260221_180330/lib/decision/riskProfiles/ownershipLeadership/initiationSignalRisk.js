// src/lib/decision/riskProfiles/ownershipLeadership/initiationSignalRisk.js
// ?꾨줈?앺듃 二쇰룄/Initiation ?좏샇 遺議?由ъ뒪??
// - structuralPatterns??NO_PROJECT_INITIATION_PATTERN ?뚮옒洹몃? profile濡??밴꺽

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


// ??export ?대쫫 諛섎뱶??initiationSignalRisk ?ъ빞 ??
export const initiationSignalRisk = {

  id: "OWNERSHIP__NO_PROJECT_INITIATION_SIGNAL",

  group: "ownershipLeadership",

  layer: "hireability",

  priority: 92,

  severityBase: 4,

  tags: ["ownership", "initiation", "leadership"],


  when: (ctx) => {

    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "NO_PROJECT_INITIATION_PATTERN");

    if (flag) return true;

    // fallback: initiationHits metric 湲곕컲
    const hits =
      Array.isArray(metrics.projectInitiationHits)
        ? metrics.projectInitiationHits
        : null;

    if (!hits) return false;

    return hits.length === 0;
  },


  score: (ctx) => {

    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "NO_PROJECT_INITIATION_PATTERN");

    if (flag && Number.isFinite(flag.score))
      return _clamp01(flag.score);

    const hits =
      Array.isArray(metrics.projectInitiationHits)
        ? metrics.projectInitiationHits
        : null;

    if (!hits || hits.length === 0)
      return 0.85;

    if (hits.length === 1)
      return 0.55;

    return 0.15;
  },


  explain: (ctx) => {

    const { flags, metrics } = _getStructural(ctx);

    const flag =
      _findFlag(flags, "NO_PROJECT_INITIATION_PATTERN");

    const detail =
      isObj(flag?.detail)
        ? flag.detail
        : {};

    const hits =
      _uniq(
        detail.hits ||
        metrics.projectInitiationHits ||
        []
      );

    const why = [

      "?대젰?쒖뿉??'?닿? ?쒖옉???꾨줈?앺듃' ?먮뒗 '?닿? 二쇰룄?곸쑝濡?留뚮뱺 蹂?? ?좏샇媛 嫄곗쓽 蹂댁씠吏 ?딆뒿?덈떎.",

      "梨꾩슜?먮뒗 ?⑥닚 ?섑뻾?먮낫??臾몄젣瑜??뺤쓽?섍퀬 ?쒖옉?????덈뒗 ?щ엺???좏샇?⑸땲??",

    ];

    if (hits.length)
      why.push(
        `媛먯???initiation ?좏샇(?쇰?): ${hits.slice(0, 10).join(", ")}`
      );


    const fix = [

      "媛??꾨줈?앺듃留덈떎 '?꾧? ?쒖옉?덈뒗媛'瑜?紐낇솗???곗꽭??",

      "?? '?붿껌??諛쏆븘 吏꾪뻾' ?????'臾몄젣 諛쒓껄 ??媛쒖꽑 ?꾨줈?앺듃 ?쒖옉'",

      "?닿? initiative瑜?媛吏?遺遺꾩쓣 理쒖냼 1媛??댁긽 紐낆떆?섏꽭??",

    ];


    const notes = [];

    notes.push(
      `projectInitiationHits: ${hits.length}`
    );

    if (hits.length)
      notes.push(
        `hits(sample): ${hits.slice(0, 10).join(", ")}`
      );


    const evidenceKeys =
      ["projectInitiationHits"];


    const title =
      flag?.title
        ? `?꾨줈?앺듃 Initiation 由ъ뒪?? ${safeStr(flag.title)}`
        : "?꾨줈?앺듃 ?쒖옉/二쇰룄 ?좏샇 遺議?由ъ뒪??;


    return {

      title,

      why,

      fix,

      evidenceKeys,

      notes,

    };
  },


  suppressIf: [],

};
