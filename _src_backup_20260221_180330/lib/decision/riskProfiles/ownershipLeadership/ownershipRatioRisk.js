// src/lib/decision/riskProfiles/ownershipLeadership/ownershipRatioRisk.js
// ?ㅻ꼫???쒗쁽(媛뺥븳 ?숈궗) 鍮꾩쑉????퀬, 李몄뿬/吏??蹂댁“ 以묒떖?쇰줈 ?쏀엳??由ъ뒪??
// - structuralPatterns??LOW_OWNERSHIP_VERB_RATIO ?뚮옒洹몃? riskProfile濡??밴꺽 :contentReference[oaicite:2]{index=2}
// - 湲곕낯 ?꾧퀎媛? OWNERSHIP_STRONG_MIN=2, OWNERSHIP_RATIO_LOW=0.6 :contentReference[oaicite:3]{index=3}
// - score ?섏떇? structuralPatterns? ?숈씪?섍쾶 ?좎? :contentReference[oaicite:4]{index=4}

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

function _calcRatio(strong, weak) {
  const s = safeNum(strong, 0) ?? 0;
  const w = safeNum(weak, 0) ?? 0;
  const denom = s + w;
  if (denom <= 0) return null;
  return s / denom;
}

export const ownershipRatioRisk = {
  id: "OWNERSHIP__LOW_OWNERSHIP_VERB_RATIO",
  group: "ownershipLeadership",
  layer: "hireability",
  priority: 86,
  severityBase: 4,
  tags: ["ownership", "leadership", "responsibility"],

  // ?몃━嫄?
  // 1) structuralPatterns ?뚮옒洹멸? ?덉쑝硫?true
  // 2) ?뚮옒洹멸? ?놁뼱??metrics濡??숈씪 議곌굔???ы쁽(蹂댁“ ?몃━嫄?
  when: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "LOW_OWNERSHIP_VERB_RATIO");
    if (flag) return true;

    const strong = safeNum(metrics.ownershipStrongCount, null);
    const weak = safeNum(metrics.ownershipWeakCount, null);
    if (strong == null || weak == null) return false;

    const ratio = _calcRatio(strong, weak);
    if (ratio == null) return false; // denom=0?대㈃ structuralPatterns???ㅽ궢(?ㅽ깘諛⑹?) :contentReference[oaicite:5]{index=5}

    const minStrong = 2; // THRESH.OWNERSHIP_STRONG_MIN default :contentReference[oaicite:6]{index=6}
    const minRatio = 0.6; // THRESH.OWNERSHIP_RATIO_LOW default :contentReference[oaicite:7]{index=7}

    return strong >= minStrong && ratio < minRatio;
  },

  // score: 0~1
  // - flag.score媛 ?덉쑝硫?洹몃?濡??ъ슜
  // - ?놁쑝硫?structuralPatterns? ?숈씪 ?섏떇 ?곸슜 :contentReference[oaicite:8]{index=8}
  score: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "LOW_OWNERSHIP_VERB_RATIO");
    if (flag && Number.isFinite(flag.score)) return _clamp01(flag.score);

    const strong = safeNum(metrics.ownershipStrongCount, null);
    const weak = safeNum(metrics.ownershipWeakCount, null);
    if (strong == null || weak == null) return 0;

    const ratio = _calcRatio(strong, weak);
    if (ratio == null) return 0;

    const minRatio = 0.6;
    const raw = (minRatio - ratio) / minRatio + 0.4;
    return _clamp01(raw);
  },

  explain: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);
    const flag = _findFlag(flags, "LOW_OWNERSHIP_VERB_RATIO");

    const detail = isObj(flag?.detail) ? flag.detail : {};

    const strong =
      safeNum(detail.strong, null) ??
      safeNum(metrics.ownershipStrongCount, null) ??
      0;

    const weak =
      safeNum(detail.weak, null) ??
      safeNum(metrics.ownershipWeakCount, null) ??
      0;

    const ratio =
      safeNum(detail.ratio, null) ??
      _calcRatio(strong, weak);

    const minStrong = safeNum(detail.minStrong, null) ?? 2;
    const minRatio = safeNum(detail.minRatio, null) ?? 0.6;

    const evidence = Array.isArray(flag?.evidence) ? flag.evidence.filter(Boolean).slice(0, 6) : [];

    const why = [];
    why.push("?대젰??臾몄옣?ㅼ씠 ?섎궡媛 寃곗젙/二쇰룄?덈떎?숇낫???섏갭??吏??蹂댁“?덈떎?숇줈 ?쏀옄 媛?μ꽦???쎈땲??");
    if (ratio != null) {
      why.push(
        `?ㅻ꼫??媛뺣룞??鍮꾩쑉????뒿?덈떎. (strong ${strong}, weak ${weak}, ratio ${Math.round(ratio * 100)}%)`
      );
      why.push(
        `湲곗?: strong ??${minStrong}, ratio < ${Math.round(minRatio * 100)}%`
      );
    }

    if (evidence.length) {
      why.push(`洹쇨굅 ?ㅻ땲???쇰?): ${evidence.slice(0, 3).join(" / ")}`);
    }

    const fix = [
      "媛?bullet???섎궡媛 寃곗젙??寃?Decision) / ?닿? 梨낆엫吏?踰붿쐞(Scope) / ?닿? 留뚮뱺 寃곌낵(Impact)??3?붿냼濡??ъ옉?깊븯?몄슂.",
      "?섏????묒뾽?숈? 吏?곗? 留먭퀬, 臾몄옣 ?욎そ???섏＜???ㅺ퀎/?뺤쓽/由щ뱶?숇줈 諛붽씀怨??ㅼ뿉 ?섏쑀愿遺???묒뾽?쇰줈 ?ㅽ뻾???뺥깭濡?遺숈씠?몄슂.",
      "?ㅻ꼫??媛뺣룞?щ? 媛뺤젣濡??섎━湲곕낫???섎궡媛 臾댁뾿???ㅻ꼫??붿?(吏??紐⑤뱢/?꾨줈?몄뒪/?덉궛)?숇? 紐낆궗濡?怨좎젙??諛섎났 ?몄텧?쒗궎?몄슂.",
    ];

    const notes = [];
    notes.push(`ownershipStrongCount: ${strong}`);
    notes.push(`ownershipWeakCount: ${weak}`);
    if (ratio != null) notes.push(`ratio strong/(strong+weak): ${Math.round(ratio * 1000) / 10}%`);
    notes.push(`threshold minStrong=${minStrong}, minRatio=${minRatio}`);
    if (evidence.length) notes.push(...evidence);

    const evidenceKeys = ["ownershipStrongCount", "ownershipWeakCount"];

    const title = flag?.title
      ? `?ㅻ꼫??由ъ뒪?? ${safeStr(flag.title)}`
      : "?ㅻ꼫???쒗쁽???쏀븯怨?李몄뿬/吏??以묒떖 由ъ뒪??;

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
