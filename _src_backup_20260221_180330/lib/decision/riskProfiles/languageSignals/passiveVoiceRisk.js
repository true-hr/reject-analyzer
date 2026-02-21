// src/lib/decision/riskProfiles/languageSignals/passiveVoiceRisk.js
// passiveVoiceRisk: structuralPatterns??"PASSIVE_VOICE_OVERUSE_PATTERN"??由ъ뒪???꾨줈?꾨줈 ?댁꽍?⑸땲??
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

export const passiveVoiceRisk = {
  id: "PASSIVE_VOICE_OVERUSE_RISK",
  group: "languageSignals",
  layer: "hireability",
  priority: 58,
  severityBase: 2,
  tags: ["language", "ownership", "clarity"],

  when: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const f = _findFlag(flags, "PASSIVE_VOICE_OVERUSE_PATTERN");
    if (f) return true;

    const ratio =
      safeNum(metrics.passiveVoiceRatio, null) ??
      safeNum(metrics.passive_ratio, null) ??
      safeNum(metrics.passiveVoiceOveruseRatio, null);

    if (ratio == null) return false;

    const r01 = ratio > 1 ? ratio / 100 : ratio;

    // ?덈Т 誘쇨컧?섎㈃ ?ㅽ깘???섏뼱 蹂댁닔?곸쑝濡?
    return r01 >= 0.22;
  },

  // score: 0~1
  score: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const f = _findFlag(flags, "PASSIVE_VOICE_OVERUSE_PATTERN");
    const fs = safeNum(f?.score, null);
    if (fs != null) return _clamp01(fs);

    const ratio =
      safeNum(metrics.passiveVoiceRatio, null) ??
      safeNum(metrics.passive_ratio, null) ??
      safeNum(metrics.passiveVoiceOveruseRatio, null);

    if (ratio == null) return 0;

    const r01 = ratio > 1 ? ratio / 100 : ratio;

    // 怨꾨떒??
    if (r01 >= 0.40) return 0.75;
    if (r01 >= 0.30) return 0.55;
    if (r01 >= 0.22) return 0.30;
    if (r01 >= 0.16) return 0.12;
    return 0;
  },

  explain: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const f = _findFlag(flags, "PASSIVE_VOICE_OVERUSE_PATTERN");

    const ratioRaw =
      safeNum(metrics.passiveVoiceRatio, null) ??
      safeNum(metrics.passive_ratio, null) ??
      safeNum(metrics.passiveVoiceOveruseRatio, null);

    const ratio01 = ratioRaw == null ? null : ratioRaw > 1 ? ratioRaw / 100 : ratioRaw;

    const why = [
      "?섎룞/?쇰룞 ?쒗쁽??留롮쑝硫??섎궡媛 二쇰룄?덈떎?숇뒗 ?몄긽???쏀빐???ㅻ꼫??由щ뜑???좊ː媛 ?⑥뼱吏????덉뒿?덈떎.",
      "硫댁젒愿? ?섎늻媛 臾댁뾿??寃곗젙?덇퀬, 臾댁뾿???ㅽ뻾?덈뒗吏?숇? 鍮좊Ⅴ寃?蹂대젮 ?섎뒗?? ?쇰룞 臾몄옣? 梨낆엫 二쇱껜媛 ?먮젮???됯?媛 蹂댁닔?곸쑝濡?蹂?⑸땲??",
    ];

    const fix = [
      "媛?臾몄옣???섏＜泥????) + ?됰룞?숈궗 + ???+ 寃곌낵??援ъ“濡?諛붽씀?몄슂.",
      "移섑솚 洹쒖튃 ?덉떆: ????吏꾪뻾?섏뿀?듬땲???섏뿀?듬땲?ㅲ????섏젣媛/?곕━ ???~??吏꾪뻾?덇퀬, ~???ъ꽦?덉뒿?덈떎??,
      "??以??쒗뵆由? ?섏젣媛 [?됰룞?숈궗]?섏뿬 [?????[蹂???쒖섟怨? [吏??媛 [????濡?媛쒖꽑?섏뿀?듬땲????,
    ];

    const evidenceKeys = [
      "PASSIVE_VOICE_OVERUSE_PATTERN",
      "passiveVoiceRatio",
      "passive_ratio",
    ];

    const notes = [];
    if (ratio01 != null) notes.push(`passiveVoiceRatio(0~1 異붿젙): ${Math.round(ratio01 * 1000) / 1000}`);

    const extra = f ? _pickTopEvidence(f, 3) : [];
    for (const e of extra) notes.push(e);

    const title = f?.title ? `?쇰룞 ?쒗쁽 怨쇰떎 由ъ뒪?? ${safeStr(f.title)}` : "?쇰룞 ?쒗쁽 怨쇰떎 由ъ뒪??;

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
