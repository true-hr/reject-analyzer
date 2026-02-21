// src/lib/decision/riskProfiles/languageSignals/weakAssertionRisk.js
// weakAssertionRisk: structuralPatterns??"WEAK_ASSERTION_PATTERN"??由ъ뒪???꾨줈?꾨줈 ?댁꽍?⑸땲??
// ??crash-safe

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

export const weakAssertionRisk = {
  id: "WEAK_ASSERTION_RISK",
  group: "languageSignals",
  layer: "hireability",
  priority: 66,
  severityBase: 3,
  tags: ["language", "confidence", "impact"],

  when: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const f = _findFlag(flags, "WEAK_ASSERTION_PATTERN");
    if (f) return true;

    const ratio =
      safeNum(metrics.weakAssertionRatio, null) ??
      safeNum(metrics.weak_assertion_ratio, null) ??
      safeNum(metrics.hedgeRatio, null);

    if (ratio == null) return false;

    const r01 = ratio > 1 ? ratio / 100 : ratio;

    // ?쒖빟???⑥젙?앹? ?щ엺留덈떎 臾몄껜 李⑥씠媛 而ㅼ꽌 蹂댁닔?곸쑝濡?
    return r01 >= 0.16;
  },

  score: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const f = _findFlag(flags, "WEAK_ASSERTION_PATTERN");
    const fs = safeNum(f?.score, null);
    if (fs != null) return _clamp01(fs);

    const ratio =
      safeNum(metrics.weakAssertionRatio, null) ??
      safeNum(metrics.weak_assertion_ratio, null) ??
      safeNum(metrics.hedgeRatio, null);

    if (ratio == null) return 0;

    const r01 = ratio > 1 ? ratio / 100 : ratio;

    // 怨꾨떒??
    if (r01 >= 0.30) return 0.80;
    if (r01 >= 0.22) return 0.55;
    if (r01 >= 0.16) return 0.30;
    if (r01 >= 0.12) return 0.12;
    return 0;
  },

  explain: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const f = _findFlag(flags, "WEAK_ASSERTION_PATTERN");

    const ratioRaw =
      safeNum(metrics.weakAssertionRatio, null) ??
      safeNum(metrics.weak_assertion_ratio, null) ??
      safeNum(metrics.hedgeRatio, null);

    const ratio01 = ratioRaw == null ? null : ratioRaw > 1 ? ratioRaw / 100 : ratioRaw;

    const why = [
      "????寃?媛숈뒿?덈떎/?꾩????섏뿀?듬땲??湲곗뿬?덉뒿?덈떎??媛숈? ?꾩땐 ?쒗쁽??留롮쑝硫??깃낵媛 ?묒븘 蹂댁씠嫄곕굹 梨낆엫??遺꾩궛???몄긽??以????덉뒿?덈떎.",
      "梨꾩슜?? ?섏젙?뺥엳 臾댁뾿???덇퀬 ?대뼡 寃곌낵媛 ?щ뒗吏?숇? 蹂닿퀬 ?띠뼱?댁꽌, ?⑥젙???쏀븯硫?寃利??ъ씤?멸? ?먮젮吏묐땲??",
    ];

    const fix = [
      "?꾩땐?대? ?섏궗???됰룞/?섏튂?숇줈 移섑솚?섏꽭??",
      "移섑솚 洹쒖튃: ?섍린?ы뻽?듬땲?ㅲ????섏젣媛 [?됰룞]?덇퀬, [吏??媛 [????濡?蹂?덉뒿?덈떎??,
      "?덉떆: ?섏꽦怨?媛쒖꽑??湲곗뿬?????쁀/B ?뚯뒪???ㅺ퀎쨌遺꾩꽍??二쇰룄?덇퀬 ?꾪솚?⑥씠 2.1%??.8%濡?媛쒖꽑??,
    ];

    const evidenceKeys = [
      "WEAK_ASSERTION_PATTERN",
      "weakAssertionRatio",
      "hedgeRatio",
    ];

    const notes = [];
    if (ratio01 != null) notes.push(`weakAssertionRatio(0~1 異붿젙): ${Math.round(ratio01 * 1000) / 1000}`);

    const extra = f ? _pickTopEvidence(f, 3) : [];
    for (const e of extra) notes.push(e);

    const title = f?.title ? `?⑥젙 ?쏀솕(?꾩땐?? 由ъ뒪?? ${safeStr(f.title)}` : "?⑥젙 ?쏀솕(?꾩땐?? 由ъ뒪??;

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
