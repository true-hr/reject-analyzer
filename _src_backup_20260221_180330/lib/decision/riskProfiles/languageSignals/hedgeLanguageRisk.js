// src/lib/decision/riskProfiles/languageSignals/hedgeLanguageRisk.js
// hedgeLanguageRisk: (媛?ν븯硫? HEDGE_LANGUAGE_PATTERN???곗꽑, ?놁쑝硫?WEAK_ASSERTION_PATTERN/metrics.hedgeRatio濡?蹂댁“ ?숈옉.
// ??crash-safe
//
// ?좑툘 二쇱쓽: ?꾨줈?앺듃?먯꽌 hedge? weakAssertion??遺꾨━ ?댁쁺?섎젮硫?structuralPatterns??hedge ?꾩슜 flag媛 ?덈뒗 寃??댁긽?곸엯?덈떎.
// 吏湲덉? ?쒖엳?쇰㈃ ?곗꽑 ?ъ슜, ?놁쑝硫?metrics 湲곕컲?쇰줈留뚢??숈옉?섎룄濡??ㅺ퀎?⑸땲??

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

export const hedgeLanguageRisk = {
  id: "HEDGE_LANGUAGE_RISK",
  group: "languageSignals",
  layer: "hireability",
  priority: 52,
  severityBase: 2,
  tags: ["language", "hedge", "clarity"],

  when: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    // ?꾩슜 flag媛 ?덉쑝硫?洹멸구 ?곗꽑
    const f =
      _findFlag(flags, "HEDGE_LANGUAGE_PATTERN") ||
      _findFlag(flags, "HEDGING_PATTERN");

    if (f) return true;

    // ?꾩슜 flag媛 ?녿떎硫?metrics 湲곕컲?쇰줈留?weakAssertionRisk??以묐났 ?몃━嫄?以꾩씠湲?
    const ratio =
      safeNum(metrics.hedgeRatio, null) ??
      safeNum(metrics.hedgingRatio, null) ??
      safeNum(metrics.hedge_ratio, null);

    if (ratio == null) return false;

    const r01 = ratio > 1 ? ratio / 100 : ratio;

    // ?꾩땐?대뒗 臾몄껜 李⑥씠媛 而ㅼ꽌 蹂댁닔?곸쑝濡?
    return r01 >= 0.18;
  },

  score: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const f =
      _findFlag(flags, "HEDGE_LANGUAGE_PATTERN") ||
      _findFlag(flags, "HEDGING_PATTERN");

    const fs = safeNum(f?.score, null);
    if (fs != null) return _clamp01(fs);

    const ratio =
      safeNum(metrics.hedgeRatio, null) ??
      safeNum(metrics.hedgingRatio, null) ??
      safeNum(metrics.hedge_ratio, null);

    if (ratio == null) return 0;

    const r01 = ratio > 1 ? ratio / 100 : ratio;

    if (r01 >= 0.34) return 0.70;
    if (r01 >= 0.26) return 0.48;
    if (r01 >= 0.18) return 0.26;
    if (r01 >= 0.14) return 0.12;
    return 0;
  },

  explain: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const f =
      _findFlag(flags, "HEDGE_LANGUAGE_PATTERN") ||
      _findFlag(flags, "HEDGING_PATTERN");

    const ratioRaw =
      safeNum(metrics.hedgeRatio, null) ??
      safeNum(metrics.hedgingRatio, null) ??
      safeNum(metrics.hedge_ratio, null);

    const ratio01 = ratioRaw == null ? null : ratioRaw > 1 ? ratioRaw / 100 : ratioRaw;

    const why = [
      "?꾩땐 ?쒗쁽(??媛숈뒿?덈떎/媛?ν빀?덈떎/?꾩????섏뿀?듬땲?ㅲ???留롮쑝硫??깃낵? 梨낆엫???묎쾶 ?쏀엳怨? ?좊ː?꾧? ?⑥뼱吏????덉뒿?덈떎.",
      "?뱁엳 JD媛 媛뺥븳 ?ㅻ꼫??由щ뱶 寃쏀뿕???붽뎄?좎닔濡? ?섑솗???녿뒗 臾몄옣?숈? 遺덈━?섍쾶 ?묐룞?⑸땲??",
    ];

    const fix = [
      "?꾩땐?대? ?섏궗???됰룞/?섏튂?숇줈 移섑솚?섏꽭??臾몄껜媛 ?꾨땲??援ъ“ 臾몄젣濡??닿껐).",
      "移섑솚 洹쒖튃: ?섎룄????섏뿀?듬땲?ㅲ????섏젣媛 [?됰룞]?덇퀬 [吏??媛 [????濡?蹂?덉뒿?덈떎??,
      "??以??쒗뵆由? ?????됰룞]?쇰줈 [?????[蹂???쒖폒 [吏??媛 [????濡?媛쒖꽑?섏뿀?듬땲????,
    ];

    const evidenceKeys = [
      "HEDGE_LANGUAGE_PATTERN",
      "hedgeRatio",
      "hedgingRatio",
    ];

    const notes = [];
    if (ratio01 != null) notes.push(`hedgeRatio(0~1 異붿젙): ${Math.round(ratio01 * 1000) / 1000}`);

    const extra = f ? _pickTopEvidence(f, 3) : [];
    for (const e of extra) notes.push(e);

    const title = f?.title ? `?꾩땐???ㅼ?) 怨쇰떎 由ъ뒪?? ${safeStr(f.title)}` : "?꾩땐???ㅼ?) 怨쇰떎 由ъ뒪??;

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
