// src/lib/decision/riskProfiles/timeline/timelineRisk.js
// timelineRisk: structuralPatterns??Category A(??꾨씪?? flags瑜?"由ъ뒪???꾨줈??濡??댁꽍?⑸땲??
// ??crash-safe: ctx 援ъ“媛 ?щ씪??理쒕????덉쟾?섍쾶 ?숈옉?섎룄濡?諛⑹뼱?곸쑝濡??묒꽦

function safeNum(v, fallback = null) {
  return Number.isFinite(v) ? v : fallback;
}

function safeStr(v, fallback = "") {
  try {
    const s = (v ?? "").toString();
    return s;
  } catch {
    return fallback;
  }
}

function isObj(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/**
 * ctx?먯꽌 structuralPatterns 寃곌낵瑜?理쒕????덉쟾?섍쾶 爰쇰깄?덈떎.
 * 吏???뺥깭(????而ㅻ쾭):
 * 1) ctx.structural = { flags: [], metrics: {}, summary: {} }   (沅뚯옣)
 * 2) ctx.flags/ctx.metrics 媛숈? ?깃컻 ?꾨뱶
 */
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

function _maxScore01(...vals) {
  let m = 0;
  for (const v of vals) {
    const n = safeNum(v, null);
    if (n == null) continue;
    if (n > m) m = n;
  }
  // 0~1 踰붿쐞濡쒕쭔 媛뺤젣(?ш린?쒕뒗 clamp ?놁씠 ?덉쟾?섍쾶)
  if (m < 0) return 0;
  if (m > 1) return 1;
  return m;
}

function _severityRank(sev) {
  const s = safeStr(sev).toLowerCase();
  if (s === "critical") return 4;
  if (s === "high") return 3;
  if (s === "mid") return 2;
  if (s === "low") return 1;
  return 0;
}

function _pickTopEvidence(flagObj, max = 3) {
  const arr = flagObj && Array.isArray(flagObj.evidence) ? flagObj.evidence : [];
  return arr.filter(Boolean).slice(0, max);
}

export const timelineRisk = {
  id: "TIMELINE_INSTABILITY_RISK",
  group: "timeline",
  layer: "hireability",
  priority: 85,
  severityBase: 4,
  tags: ["timeline", "careerTrajectory"],

  // ?몃━嫄? structuralPatterns????꾨씪???뚮옒洹?以??섎굹?쇰룄 ?덉쑝硫?諛쒕룞
  when: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    // careerHistory ?놁쑝硫?structuralPatterns ?먯껜媛 ??꾨씪??媛먯?瑜??ㅽ궢?섎뒗 ?ㅺ퀎?쇱꽌
    // ?ш린?쒕룄 援녹씠 媛뺤젣 諛쒕룞?섏? ?딆쓬(?ㅽ깘 諛⑹?)
    const has = !!metrics.hasCareerHistory;
    if (!has) return false;

    const f1 = _findFlag(flags, "HIGH_SWITCH_PATTERN");
    const f2 = _findFlag(flags, "EXTREME_JOB_HOPPING_PATTERN");
    const f3 = _findFlag(flags, "FREQUENT_INDUSTRY_SWITCH_PATTERN");
    return !!(f1 || f2 || f3);
  },

  // score: 0~1
  // - 援ъ“?⑦꽩 ?뚮옒洹?score媛 ?대? 0~1濡??ㅼ뼱?ㅻ?濡??대? 理쒕?媛?媛以묒쑝濡?議고빀
  score: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const highSwitch = _findFlag(flags, "HIGH_SWITCH_PATTERN");
    const extremeHop = _findFlag(flags, "EXTREME_JOB_HOPPING_PATTERN");
    const indSwitch = _findFlag(flags, "FREQUENT_INDUSTRY_SWITCH_PATTERN");

    // base: ?뚮옒洹??먯닔 湲곕컲
    const s1 = safeNum(highSwitch?.score, 0);
    const s2 = safeNum(extremeHop?.score, 0);
    const s3 = safeNum(indSwitch?.score, 0);

    // extreme hopping? ?댁꽍??媛뺣룄媛 ???щ땲 ?쎄컙 媛以?
    const boosted = _maxScore01(s1, s2 * 1.1, s3);

    // avgTenureMonths媛 留ㅼ슦 ??쑝硫??? 12 誘몃쭔) 異붽?濡?議곌툑 ?щ┝ (吏?쒕뒗 computeStructuralMetrics??議댁옱)
    const avg = safeNum(metrics.avgTenureMonths, null);
    let bump = 0;
    if (avg != null) {
      if (avg < 12) bump += 0.12;
      else if (avg < 18) bump += 0.06;
    }

    const out = boosted + bump;
    if (out < 0) return 0;
    if (out > 1) return 1;
    return out;
  },

  explain: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const highSwitch = _findFlag(flags, "HIGH_SWITCH_PATTERN");
    const extremeHop = _findFlag(flags, "EXTREME_JOB_HOPPING_PATTERN");
    const indSwitch = _findFlag(flags, "FREQUENT_INDUSTRY_SWITCH_PATTERN");

    const avg = safeNum(metrics.avgTenureMonths, null);
    const sw = safeNum(metrics.industrySwitches, null);
    const ex = isObj(metrics.extremeJobHopping) ? metrics.extremeJobHopping : null;

    // 媛??媛뺥븳 ?뚮옒洹몃? ?쒕???洹쇨굅?앸줈 ?좎젙
    const candidates = [highSwitch, extremeHop, indSwitch].filter(Boolean);
    candidates.sort((a, b) => {
      const ra = _severityRank(a.severity);
      const rb = _severityRank(b.severity);
      if (rb !== ra) return rb - ra;
      const sa = safeNum(a.score, 0);
      const sb = safeNum(b.score, 0);
      return sb - sa;
    });

    const top = candidates[0] || null;

    const why = [];
    if (highSwitch) {
      why.push("?됯퇏 ?ъ쭅湲곌컙??吏㏐쾶 ?섑??⑸땲??議곌린 ?댄깉/?곸쓳 ?ㅽ뙣濡??댁꽍?????덉쓬).");
    }
    if (extremeHop) {
      why.push("理쒓렐 寃쎈젰?먯꽌 1??誘몃쭔 ?ъ쭅??諛섎났?⑸땲???섎쾭?곗? 紐삵븿???쒓렇?먮줈 ?쏀옄 媛?μ꽦).");
    }
    if (indSwitch) {
      why.push("?곗뾽 蹂寃쎌씠 ??뒿?덈떎(?꾨찓??異뺤쟻/?ы쁽?깆뿉 ????섏떖???앷만 ???덉쓬).");
    }

    // ?レ옄 洹쇨굅 臾몄옣(媛?ν븯硫?
    const notes = [];
    if (avg != null) notes.push(`?됯퇏 ?ъ쭅湲곌컙(??: ${Math.round(avg * 10) / 10}`);
    if (ex && Number.isFinite(ex.shortCount) && Number.isFinite(ex.considered)) {
      notes.push(`理쒓렐 ${ex.considered}媛?以?1??誘몃쭔: ${ex.shortCount}媛?);
    }
    if (sw != null) notes.push(`?곗뾽 蹂寃??잛닔(異붿젙): ${sw}`);

    const fix = [
      "?댁쭅 ?ъ쑀瑜??섑솚寃썩숈씠 ?꾨땲???섏뿭???깃낵 愿?먥숈쑝濡?2臾몄옣 援ъ“濡??뺣━?섏꽭?? (臾몄젣?믩궡媛 ???쇄넂?깃낵/諛곗슫 ??",
      "理쒓렐 1~2媛?寃쎈젰? ?섏솢 ?⑥쓣 ?댁쑀媛 ?놁뿀?붿??숇낫???섏솢 ?좊굹???깃낵媛 ?⑤뒗吏(寃곌낵臾?吏???숇? 癒쇱? ?쒖떆?섏꽭??",
      "?곗뾽 ?꾪솚???덈떎硫??섏씠???꾨찓?몄뿉???볦? ??웾???ㅼ쓬 ?꾨찓?몄뿉??洹몃?濡??ы쁽?섎뒗 洹쇨굅(???꾨줈?몄뒪/吏???숇? 3媛쒕줈 怨좎젙?섏꽭??",
    ];

    // evidenceKeys??structural.metrics 湲곕컲?쇰줈 UI?먯꽌 李띻린 ?쎄쾶
    const evidenceKeys = [
      "avgTenureMonths",
      "extremeJobHopping",
      "industrySwitches",
      "hasCareerHistory",
    ];

    // flag.evidence????꾨씪???⑦꽩?먯꽌??鍮?諛곗뿴?대씪(?ㅺ퀎?? ???notes???섏튂 洹쇨굅瑜??ｌ쓬
    // 洹몃옒???뱀떆 evidence媛 ?덉쑝硫?媛숈씠 蹂댁뿬二쇨린
    const extraEvidence = top ? _pickTopEvidence(top, 3) : [];

    const title = top?.title
      ? `而ㅻ━????꾨씪??由ъ뒪?? ${safeStr(top.title)}`
      : "而ㅻ━????꾨씪??由ъ뒪??;

    const mergedNotes = [...notes];
    for (const e of extraEvidence) mergedNotes.push(e);

    return {
      title,
      why: why.length ? why : ["而ㅻ━????꾨씪?몄뿉???덉젙???좏샇媛 ?쏀븯寃?媛먯??⑸땲??"],
      fix,
      evidenceKeys,
      notes: mergedNotes.length ? mergedNotes : undefined,
    };
  },

  // suppressIf???쇰떒 鍮꾩썙?먮뒗 寃??덉쟾(珥덇린???④? 洹쒖튃 ?뚮Ц???쒖븞 蹂댁씠?붴?臾몄젣媛 ?앷만 ???덉쓬)
  suppressIf: [],
};
