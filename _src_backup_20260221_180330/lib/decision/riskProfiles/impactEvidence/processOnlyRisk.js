// src/lib/decision/riskProfiles/impactEvidence/processOnlyRisk.js
// ?꾨줈?몄뒪留??덇퀬 寃곌낵/?꾪뙥???좏샇媛 遺議깊븳 由ъ뒪??
// - structuralPatterns: PROCESS_ONLY_PATTERN :contentReference[oaicite:7]{index=7}

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

export const processOnlyRisk = {
  id: "IMPACT__PROCESS_ONLY",
  group: "impactEvidence",
  layer: "hireability",
  priority: 80,
  severityBase: 4,
  tags: ["impactEvidence", "processOnly"],

  when: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "PROCESS_ONLY_PATTERN");
    if (flag) return true;

    // 蹂댁“ ?몃━嫄? processOnlySignals媛 ?덈뒗 踰꾩쟾 ?鍮?
    const signals = Array.isArray(metrics.processOnlySignals) ? metrics.processOnlySignals : null;
    if (!signals) return false;

    // structuralPatterns??signals length >= 2?????몃━嫄고븯?꾨줉 ?ㅺ퀎 :contentReference[oaicite:8]{index=8}
    return signals.length >= 2;
  },

  score: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "PROCESS_ONLY_PATTERN");
    if (flag && Number.isFinite(flag.score)) return _clamp01(flag.score);

    const signals = Array.isArray(metrics.processOnlySignals) ? metrics.processOnlySignals : null;
    if (!signals) return 0;

    // signals 2媛??댁긽?대㈃ 以묎컙 ?댁긽?쇰줈
    // 2 -> 0.7, 3+ -> 0.8
    if (signals.length >= 3) return 0.8;
    if (signals.length >= 2) return 0.7;
    return 0.2;
  },

  explain: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "PROCESS_ONLY_PATTERN");
    const detail = isObj(flag?.detail) ? flag.detail : {};
    const evidence = Array.isArray(flag?.evidence) ? flag.evidence.filter(Boolean).slice(0, 6) : [];

    const signals = _uniq(detail.signals || metrics.processOnlySignals || []);

    const why = [
      "臾몄옣???섏쭊???섑뻾/愿由?吏?먥?媛숈? ?꾨줈?몄뒪 ?쒗쁽? 留롮??? 寃곌낵(?꾪뙥??蹂??媛 臾댁뾿?몄?媛 ??蹂댁씠吏 ?딆뒿?덈떎.",
      "梨꾩슜?먮뒗 ?섍렇?섏꽌 萸먭? 醫뗭븘議뚮뒗???숇? 鍮좊Ⅴ寃??뺤씤?섎뒗?? 寃곌낵 ?좏샇媛 ?놁쑝硫??깃낵媛 ?녿뒗 ?낅Т濡??ㅽ빐?????덉뒿?덈떎.",
    ];

    if (signals.length) {
      why.push(`?꾨줈?몄뒪 ?좏샇(?쇰?): ${signals.slice(0, 12).join(", ")}`);
    }

    const fix = [
      "媛?bullet ?앹뿉 ?섍껐怨???以꾟숈쓣 媛뺤젣濡?遺숈씠?몄슂. (吏???섏튂媛 ?놁쑝硫?Before?묨fter?쇰룄)",
      "?꾨줈?몄뒪瑜??곕젮硫??섏솢 洹??꾨줈?몄뒪瑜??덈뒗吏(臾몄젣) ??寃곌낵(蹂???숇? 諛섎뱶??媛숈씠 ?곸뼱???⑸땲??",
      "寃곌낵媛 ?뺣웾?붽? ?대졄?ㅻ㈃, ?덉쭏/由ъ뒪??留뚯”???띾룄 媛숈? ?섏륫??媛?ν븳 ?泥?吏?쒋숇? ?뺤쓽?섏꽭??",
    ];

    const notes = [];
    notes.push(`processOnlySignals: ${signals.length}`);
    if (signals.length) notes.push(`signals(sample): ${signals.slice(0, 12).join(", ")}`);
    if (evidence.length) notes.push(...evidence);

    const evidenceKeys = ["processOnlySignals"];

    const title = flag?.title
      ? `寃곌낵 ?좏샇 遺議?由ъ뒪?? ${safeStr(flag.title)}`
      : "?꾨줈?몄뒪留??덇퀬 寃곌낵 ?좏샇媛 ?쏀븳 由ъ뒪??;

    return { title, why, fix, evidenceKeys, notes };
  },

  suppressIf: [],
};
