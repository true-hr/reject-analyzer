// src/lib/decision/riskProfiles/resumeStructureClarity/contentDensityRisk.js
// contentDensityRisk: structuralPatterns??"LOW_CONTENT_DENSITY_PATTERN"??由ъ뒪???꾨줈?꾨줈 ?댁꽍?⑸땲??
// ??crash-safe: ctx 援ъ“媛 ?щ씪??理쒕????덉쟾?섍쾶 ?숈옉?섎룄濡?諛⑹뼱?곸쑝濡??묒꽦

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

export const contentDensityRisk = {
  id: "LOW_CONTENT_DENSITY_RISK",
  group: "resumeStructureClarity",
  layer: "hireability",
  priority: 78,
  severityBase: 3,
  tags: ["resume", "structure", "clarity"],

  when: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    // 1) flag 湲곕컲??1?쒖쐞 (?ㅽ깘 理쒖냼)
    const f = _findFlag(flags, "LOW_CONTENT_DENSITY_PATTERN");
    if (f) return true;

    // 2) metrics 蹂댁“ (flag ?꾨씫 ?鍮? ??key媛 ?놁쑝硫?false
    const density =
      safeNum(metrics.contentDensity, null) ??
      safeNum(metrics.resumeContentDensity, null) ??
      safeNum(metrics.content_density, null);

    if (density == null) return false;

    // density媛 0~1濡??ㅼ뼱?⑤떎怨?媛??(?뱀떆 0~100?대㈃ ?먮룞 蹂댁젙)
    const d01 = density > 1 ? density / 100 : density;

    // ?덈Т 怨듦꺽?곸씠硫??ㅽ깘???섏뼱??蹂댁닔?곸쑝濡?
    return d01 < 0.22;
  },

  // score: 0~1
  score: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const f = _findFlag(flags, "LOW_CONTENT_DENSITY_PATTERN");
    const fs = safeNum(f?.score, null);
    if (fs != null) return _clamp01(fs);

    const density =
      safeNum(metrics.contentDensity, null) ??
      safeNum(metrics.resumeContentDensity, null) ??
      safeNum(metrics.content_density, null);

    if (density == null) return 0;

    const d01 = density > 1 ? density / 100 : density;

    // density ??쓣?섎줉 ?꾪뿕 ??
    // 怨꾨떒???댁쁺 ?덉젙): <0.12, <0.18, <0.22, <0.28
    if (d01 < 0.12) return 0.85;
    if (d01 < 0.18) return 0.60;
    if (d01 < 0.22) return 0.35;
    if (d01 < 0.28) return 0.15;
    return 0;
  },

  explain: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const f = _findFlag(flags, "LOW_CONTENT_DENSITY_PATTERN");

    const densityRaw =
      safeNum(metrics.contentDensity, null) ??
      safeNum(metrics.resumeContentDensity, null) ??
      safeNum(metrics.content_density, null);

    const density01 =
      densityRaw == null ? null : densityRaw > 1 ? densityRaw / 100 : densityRaw;

    const why = [
      "臾몄옣 湲몄씠 ?鍮??ㅼ젣 寃利?媛?ν븳 ?뺣낫(??븷/?됰룞/?깃낵/洹쇨굅)媛 遺議깊븯硫?硫댁젒愿???뺤씤???뚯옱媛 ?놁뼱 蹂댁닔?곸쑝濡??덈씫 ?먮떒???대━湲??쎌뒿?덈떎.",
      "?뱁엳 ?섎Т?뉗쓣 ?덈뒗吏?숆? ?꾨땶 ?섏뼱???щ엺?몄???以묒떖 臾몄옣留?諛섎났?섎㈃ JD ?곹빀?꾨? ??쾶 ?댁꽍??媛?μ꽦???쎈땲??",
    ];

    const fix = [
      "湲멸쾶 ?곕뒗 寃?紐⑺몴媛 ?꾨땲?? 媛?bullet???섏쬆嫄?援ъ“?숇줈 諛붽씀??寃?紐⑺몴?낅땲??",
      "異붿쿇 ?쒗뵆由???以?: [臾몄젣/紐⑺몴] ??[????븷(?ㅻ꼫??] ??[?됰룞] ??[寃곌낵(?レ옄)] ??[洹쇨굅(?곗텧臾???]",
      "?덉떆: ?섑봽濡쒖꽭??媛쒖꽑??湲곗뿬????????섏삩蹂대뵫 5?④퀎 泥댄겕由ъ뒪???ㅺ퀎/諛고룷(?ㅻ꼫). 援먯쑁 ?댁닔??62%??8% 媛쒖꽑. ?곗텧臾? 泥댄겕由ъ뒪??媛?대뱶 臾몄꽌??,
    ];

    const evidenceKeys = [
      "LOW_CONTENT_DENSITY_PATTERN",
      "contentDensity",
      "resumeContentDensity",
    ];

    const notes = [];
    if (density01 != null) notes.push(`contentDensity(0~1 異붿젙): ${Math.round(density01 * 1000) / 1000}`);

    const extra = f ? _pickTopEvidence(f, 3) : [];
    for (const e of extra) notes.push(e);

    const title = f?.title
      ? `?대젰???뺣낫 諛??由ъ뒪?? ${safeStr(f.title)}`
      : "?대젰???뺣낫 諛??由ъ뒪??;

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
