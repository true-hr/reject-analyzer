// src/lib/decision/riskProfiles/ownershipLeadership/decisionSignalRisk.js
// ?섏궗寃곗젙/沅뚰븳 ?좏샇 遺議?由ъ뒪??
// - structuralPatterns??NO_DECISION_AUTHORITY_PATTERN ?뚮옒洹몃? profile濡??밴꺽 :contentReference[oaicite:1]{index=1}
// ??crash-safe: ctx ?뺥깭媛 ?щ씪??理쒕????덉쟾?섍쾶 ?숈옉

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

export const decisionSignalRisk = {
  id: "OWNERSHIP__NO_DECISION_AUTHORITY_SIGNAL",
  group: "ownershipLeadership",
  layer: "hireability",
  priority: 84,
  severityBase: 4,
  tags: ["ownership", "decision", "authority"],

  // ?몃━嫄?
  // 1) structuralPatterns ?뚮옒洹멸? ?덉쑝硫?true
  // 2) ?뚮옒洹멸? ?놁뼱??metrics濡??좎궗 ?먮떒(?덉쓣 ?뚮쭔) - 蹂댁“ ?몃━嫄?
  when: (ctx) => {
    // ownershipExpected=false인 직무에서는 발화하지 않음
    if (ctx?.competencyExpectation?.ownershipExpected !== true) return false;
    if (typeof ctx?.__hasRisk === "function" && ctx.__hasRisk("RISK__OWNERSHIP_LEADERSHIP_GAP")) {
      return false;
    }
    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "NO_DECISION_AUTHORITY_PATTERN");
    if (flag) return true;

    // 蹂댁“ ?몃━嫄??곗씠?곌? ?덉쓣 ?뚮쭔)
    // structuralPatterns?먯꽌??decisionAuthorityHits 諛곗뿴??metrics???ｌ뒿?덈떎. :contentReference[oaicite:2]{index=2}
    const hits = Array.isArray(metrics.decisionAuthorityHits) ? metrics.decisionAuthorityHits : null;
    if (!hits) return false;

    // ?쒓껐??沅뚰븳???⑥꽌媛 ?ъ떎???놁쑝硫?由ъ뒪??
    return hits.length === 0;
  },

  // score: 0~1
  // - flag.score媛 ?덉쑝硫?洹몃?濡?
  // - ?놁쑝硫??쒓껐??沅뚰븳 ?⑥꽌媛 0?대㈃ ?믪쓬, 議곌툑?대씪???덉쑝硫???쓬??蹂댁닔?곸쑝濡?
  score: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "NO_DECISION_AUTHORITY_PATTERN");
    if (flag && Number.isFinite(flag.score)) return _clamp01(flag.score);

    const hits = Array.isArray(metrics.decisionAuthorityHits) ? metrics.decisionAuthorityHits : null;
    if (!hits) return 0;

    // hits=0 -> 0.9, hits=1 -> 0.55, hits>=2 -> 0.25
    const n = hits.length;
    if (n <= 0) return 0.9;
    if (n === 1) return 0.55;
    return 0.25;
  },

  explain: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);
    const flag = _findFlag(flags, "NO_DECISION_AUTHORITY_PATTERN");

    const detail = isObj(flag?.detail) ? flag.detail : {};
    const evidence = Array.isArray(flag?.evidence) ? flag.evidence.filter(Boolean).slice(0, 6) : [];

    const hits =
      _uniq(detail.hits || metrics.decisionAuthorityHits || []);

    const why = [
      "?대젰?쒖뿉???섎궡媛 寃곗젙沅??뱀씤沅뚯쓣 媛뽮퀬 臾댁뾿???뺥뻽?붿??숆? ??蹂댁씠吏 ?딆뒿?덈떎.",
      "梨꾩슜?щ뒗 ?대? ?섏콉??踰붿쐞媛 ?묐떎 / ?ㅻ꼫媛 ?꾨땲??/ ?곸쐞?먭? 寃곗젙?쒕떎?숇줈 ?댁꽍?????덉뒿?덈떎.",
    ];

    if (hits.length) {
      why.push(`諛쒓껄??寃곗젙/沅뚰븳 ?⑥꽌(?쇰?): ${hits.slice(0, 8).join(", ")}`);
    } else {
      why.push("寃곗젙/沅뚰븳 ?⑥꽌 ?ㅼ썙?쒓? 嫄곗쓽 媛먯??섏? ?딆뒿?덈떎.");
    }

    if (evidence.length) {
      why.push(`洹쇨굅 ?ㅻ땲???쇰?): ${evidence.slice(0, 3).join(" / ")}`);
    }

    const fix = [
      "媛??꾨줈?앺듃留덈떎 ?섎궡媛 寃곗젙??寃?Decision)?숈쓣 理쒖냼 1媛?紐낆떆?섏꽭?? (?? ?곗꽑?쒖쐞/?꾪궎?띿쿂/?꾨줈?몄뒪/踰ㅻ뜑 ?좎젙/梨꾩슜 湲곗? ??",
      "?섏듅?몃컺?섎떎?숆? ?꾨땲???섎궡媛 ?쒖븞?믨렐嫄겸넂寃곗젙?믨껐怨쇄??먮쫫?쇰줈 ?곗꽭?? 寃곗젙??洹쇨굅(?곗씠??由ъ꽌移?吏??瑜?媛숈씠 遺숈씠硫??④낵媛 ?쎈땲??",
      "寃곗젙沅뚯씠 ?쒗븳?곸씠?덉쑝硫? ?섎궡媛 梨낆엫議뚮뜕 踰붿쐞(?ㅻ꼫???⑥쐞: 紐⑤뱢/吏???뚰듃)?숇? 紐낆궗濡?怨좎젙?댁꽌 諛섎났 ?몄텧?섏꽭??",
    ];

    const notes = [];
    notes.push(`decisionAuthorityHits: ${hits.length}`);
    if (hits.length) notes.push(`hits: ${hits.slice(0, 12).join(", ")}`);
    if (evidence.length) notes.push(...evidence);

    const evidenceKeys = ["decisionAuthorityHits"];

    const title = flag?.title
      ? `Decision authority signal risk: ${safeStr(flag.title)}`
      : "Decision authority signal gap risk";

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


