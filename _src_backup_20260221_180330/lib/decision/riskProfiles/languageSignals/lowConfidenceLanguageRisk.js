// src/lib/decision/riskProfiles/languageSignals/lowConfidenceLanguageRisk.js
// lowConfidenceLanguageRisk: (媛?ν븯硫? LOW_CONFIDENCE_LANGUAGE_PATTERN???곗꽑, ?놁쑝硫?RESPONSIBILITY_AVOIDANCE_PATTERN???泥??몃━嫄곕줈 ?ъ슜.
// ??crash-safe
//
// handoff??紐낆떆??flag: RESPONSIBILITY_AVOIDANCE_PATTERN
// ???뚯씪紐낃낵 1:1 留ㅽ븨???좊ℓ?????덉뼱, ?꾩슜 flag媛 ?덉쑝硫??곗꽑 ?ъ슜?섎룄濡??ㅺ퀎?⑸땲??

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

export const lowConfidenceLanguageRisk = {
  id: "LOW_CONFIDENCE_LANGUAGE_RISK",
  group: "languageSignals",
  layer: "hireability",
  priority: 84,
  severityBase: 4,
  tags: ["language", "ownership", "risk"],

  when: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    // ?꾩슜 flag媛 ?덉쑝硫??곗꽑
    const f0 =
      _findFlag(flags, "LOW_CONFIDENCE_LANGUAGE_PATTERN") ||
      _findFlag(flags, "LOW_CONFIDENCE_PATTERN");

    if (f0) return true;

    // handoff???덈뒗 flag瑜??泥??몃━嫄곕줈 ?ъ슜
    const f1 =
      _findFlag(flags, "RESPONSIBILITY_AVOIDANCE_PATTERN") ||
      _findFlag(flags, "RESPONSIBILITY_AVOIDANCE_LANGUAGE_PATTERN");

    if (f1) return true;

    // metrics 蹂댁“ (?ㅺ? ?놁쑝硫?false)
    const ratio =
      safeNum(metrics.responsibilityAvoidanceRatio, null) ??
      safeNum(metrics.responsibility_avoidance_ratio, null) ??
      safeNum(metrics.blameShiftRatio, null) ??
      safeNum(metrics.lowConfidenceLanguageRatio, null);

    if (ratio == null) return false;

    const r01 = ratio > 1 ? ratio / 100 : ratio;

    // ?ㅻ꼫???듭떖 由ъ뒪?? 諛쒓껄??以묒슂?섎땲 ?덈Т ?믨쾶 ?≪? ?딅릺, ?ㅽ깘??怨좊젮
    return r01 >= 0.12;
  },

  score: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const f0 =
      _findFlag(flags, "LOW_CONFIDENCE_LANGUAGE_PATTERN") ||
      _findFlag(flags, "LOW_CONFIDENCE_PATTERN");

    const f1 =
      _findFlag(flags, "RESPONSIBILITY_AVOIDANCE_PATTERN") ||
      _findFlag(flags, "RESPONSIBILITY_AVOIDANCE_LANGUAGE_PATTERN");

    const fs = safeNum((f0 || f1)?.score, null);
    if (fs != null) return _clamp01(fs);

    const ratio =
      safeNum(metrics.responsibilityAvoidanceRatio, null) ??
      safeNum(metrics.responsibility_avoidance_ratio, null) ??
      safeNum(metrics.blameShiftRatio, null) ??
      safeNum(metrics.lowConfidenceLanguageRatio, null);

    if (ratio == null) return 0;

    const r01 = ratio > 1 ? ratio / 100 : ratio;

    // 怨꾨떒??(?ㅻ꼫??梨낆엫 ?뚰뵾 怨꾩뿴? ?믨쾶 ?섏삤??寃??뺤긽)
    if (r01 >= 0.26) return 0.90;
    if (r01 >= 0.18) return 0.70;
    if (r01 >= 0.12) return 0.50;
    if (r01 >= 0.08) return 0.25;
    return 0;
  },

  explain: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const f0 =
      _findFlag(flags, "LOW_CONFIDENCE_LANGUAGE_PATTERN") ||
      _findFlag(flags, "LOW_CONFIDENCE_PATTERN");

    const f1 =
      _findFlag(flags, "RESPONSIBILITY_AVOIDANCE_PATTERN") ||
      _findFlag(flags, "RESPONSIBILITY_AVOIDANCE_LANGUAGE_PATTERN");

    const top = f0 || f1 || null;

    const ratioRaw =
      safeNum(metrics.responsibilityAvoidanceRatio, null) ??
      safeNum(metrics.responsibility_avoidance_ratio, null) ??
      safeNum(metrics.blameShiftRatio, null) ??
      safeNum(metrics.lowConfidenceLanguageRatio, null);

    const ratio01 = ratioRaw == null ? null : ratioRaw > 1 ? ratioRaw / 100 : ratioRaw;

    const why = [
      "梨낆엫 ?뚰뵾/嫄곕━?먭린 ?쒗쁽(?섏?????븷?? ?섏긽?⑹긽?? ?섏뼱姨????놁씠????蹂댁씠硫??ㅻ꼫???좊ː媛 ?ш쾶 ?⑥뼱吏????덉뒿?덈떎.",
      "梨꾩슜?? 臾몄젣 ?곹솴?먯꽌???섎궡媛 ?듭젣??踰붿쐞? ?섏궗寃곗젙?숈쓣 蹂닿퀬 ?띠뼱?섎?濡? 梨낆엫 二쇱껜媛 ?먮젮吏硫?由ъ뒪?щ줈 ?댁꽍?⑸땲??",
    ];

    const fix = [
      "臾몄옣???섑솚寃??볛숈씠 ?꾨땲???섎궡 ?듭젣 踰붿쐞/寃곗젙/??묅숈쑝濡?諛붽씀?몄슂.",
      "異붿쿇 ?쒗뵆由? ?섏젣 ?듭젣 踰붿쐞??[X]?怨? 洹??덉뿉??[寃곗젙/?됰룞]???덉쑝硫? 寃곌낵媛 [Y]濡??섑??ъ뒿?덈떎.??,
      "臾몄젣 諛쒖깮 ?щ????섏썝???ㅻ챸?숇낫???섎???蹂듦뎄/?щ컻諛⑹?(?꾨줈?몄뒪)?숇? 癒쇱? ?쒖떆?섏꽭??",
    ];

    const evidenceKeys = [
      "RESPONSIBILITY_AVOIDANCE_PATTERN",
      "lowConfidenceLanguageRatio",
      "responsibilityAvoidanceRatio",
      "blameShiftRatio",
    ];

    const notes = [];
    if (ratio01 != null) notes.push(`lowConfidence/responsibilityAvoidance(0~1 異붿젙): ${Math.round(ratio01 * 1000) / 1000}`);

    const extra = top ? _pickTopEvidence(top, 3) : [];
    for (const e of extra) notes.push(e);

    const title = top?.title
      ? `梨낆엫/?먯떊媛??좏샇 由ъ뒪?? ${safeStr(top.title)}`
      : "梨낆엫/?먯떊媛??좏샇 由ъ뒪??;

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
