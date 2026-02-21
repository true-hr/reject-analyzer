// src/lib/decision/riskProfiles/roleSkillFit/jdKeywordAbsenceRisk.js
// JD ?듭떖 ?ㅼ썙??遺??由ъ뒪??
// - structuralPatterns??JD_KEYWORD_ABSENCE_PATTERN(?ㅼ썙??留ㅼ묶瑜???쓬)??profile濡??밴꺽
// - metrics: jdKeywords / jdKeywordHits / keywordMatchRatio瑜?洹쇨굅濡??ъ슜 :contentReference[oaicite:1]{index=1}
// ??crash-safe: ctx 援ъ“媛 ?щ씪??理쒕????덉쟾?섍쾶 ?숈옉

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

function _slice(arr, n) {
  return Array.isArray(arr) ? arr.slice(0, n) : [];
}

export const jdKeywordAbsenceRisk = {
  id: "ROLE_SKILL__JD_KEYWORD_ABSENCE",
  group: "roleSkillFit",
  layer: "hireability",
  priority: 78,
  severityBase: 4,
  tags: ["roleSkillFit", "keywordCoverage", "jdMatch"],

  // ?몃━嫄?
  // 1) structuralPatterns媛 JD_KEYWORD_ABSENCE_PATTERN??李띿뿀?쇰㈃ true
  // 2) ?뚮옒洹멸? ?녿뜑?쇰룄(?ㅻⅨ 踰꾩쟾/?곌껐 ?꾨씫 ?鍮? metrics ???ㅼ썙?쒓? ?덇퀬 留ㅼ묶瑜좎씠 留ㅼ슦 ??쑝硫?true
  when: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "JD_KEYWORD_ABSENCE_PATTERN");
    if (flag) return true;

    const jdKeywords = Array.isArray(metrics.jdKeywords) ? metrics.jdKeywords : null;
    const ratio = safeNum(metrics.keywordMatchRatio, null);

    if (!jdKeywords || jdKeywords.length === 0) return false;
    if (ratio == null) return false;

    // 蹂댁“ ?몃━嫄곕뒗 ?ㅽ깘 諛⑹? ?꾪빐 "?꾩＜ ??쓣 ?뚮쭔" (蹂댁닔??
    return ratio < 0.25;
  },

  // score: 0~1
  score: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);
    const flag = _findFlag(flags, "JD_KEYWORD_ABSENCE_PATTERN");

    // structuralPatterns媛 ?대? 0~1 score瑜?二쇰㈃ 洹멸구 洹몃?濡??ъ슜
    if (flag && Number.isFinite(flag.score)) return _clamp01(flag.score);

    const ratio = safeNum(metrics.keywordMatchRatio, null);
    if (ratio == null) return 0;

    // ratio媛 ??쓣?섎줉 ?먯닔 ?믨쾶
    // ?? 0.25 -> 0.8, 0.10 -> 0.92, 0 -> 1.0
    const s = 0.7 + (0.25 - ratio) * 1.2;
    return _clamp01(s);
  },

  explain: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);
    const flag = _findFlag(flags, "JD_KEYWORD_ABSENCE_PATTERN");

    // 媛?ν븳 detail ?곗꽑 ?ъ슜 (踰꾩쟾留덈떎 detail ?ㅺ? 議곌툑 ?щ씪??metrics濡?諛깆뾽)
    const detail = isObj(flag?.detail) ? flag.detail : {};

    const jdKeywords = _uniq(detail.jdKeywords || metrics.jdKeywords || []);
    const hits = _uniq(detail.hits || detail.jdKeywordHits || metrics.jdKeywordHits || []);
    const missing = _uniq(detail.missing || []);

    const ratio = safeNum(detail.ratio ?? detail.keywordMatchRatio ?? metrics.keywordMatchRatio, null);

    const evidence = Array.isArray(flag?.evidence) ? flag.evidence.filter(Boolean).slice(0, 8) : [];

    const jdKeywordsShort = _slice(jdKeywords, 12);
    const hitsShort = _slice(hits, 12);
    const missingShort = _slice(missing, 12);

    const why = [];
    if (ratio != null) {
      why.push(`JD ?듭떖 ?ㅼ썙???鍮??대젰???ы듃?대━?ㅼ뿉 諛섏쁺???ㅼ썙??鍮꾩쑉????뒿?덈떎. (留ㅼ묶瑜?${Math.round(ratio * 100)}%)`);
    } else {
      why.push("JD ?듭떖 ?ㅼ썙?쒓? ?대젰???ы듃?대━?ㅼ뿉 異⑸텇??諛섏쁺?섏? ?딆븯?듬땲??");
    }

    if (missingShort.length) {
      why.push(`?꾨씫 ?꾨낫(?쇰?): ${missingShort.join(", ")}`);
    } else if (jdKeywordsShort.length) {
      why.push(`JD ?듭떖 ?ㅼ썙???쇰?): ${jdKeywordsShort.join(", ")}`);
    }

    if (hitsShort.length) {
      why.push(`諛섏쁺???ㅼ썙???쇰?): ${hitsShort.join(", ")}`);
    }

    const fix = [
      "JD ?곷떒/以묎컙??諛섎났?섎뒗 紐낆궗(?꾧뎄쨌?낅Т쨌?곗텧臾?瑜?10~15媛?戮묎퀬, ?대젰??bullet ?덉뿉 ?섑뻾??????깃낵??臾몄옣?쇰줈 ?먯뿰?ㅻ읇寃??쎌엯?섏꽭??",
      "?ㅼ썙???섎굹???뱀뀡(?ㅽ궗)?숇쭔 異붽??섎뒗 嫄??쏀빀?덈떎. 寃쏀뿕 bullet?먯꽌 ?대떦 ?ㅼ썙?쒓? ?섎Т?뉗쓣 ?덇퀬(?≪뀡) 臾댁뾿??醫뗭븘議뚮뒗吏(寃곌낵)?숇줈 ?곌껐?섍쾶 ?곗꽭??",
      "?ㅼ썙?쒓? 留롮븘???섎룞???닿? ???? + 吏??寃곌낵)?숆? ?놁쑝硫??쒕쪟 ?듦낵??嫄곗쓽 ?꾩? ???⑸땲?? 理쒖냼 1媛??レ옄 洹쇨굅瑜?遺숈씠?몄슂.",
    ];

    const notes = [];
    if (jdKeywords.length) notes.push(`JD ?ㅼ썙???꾨낫 ?? ${jdKeywords.length}`);
    if (hits.length) notes.push(`留ㅼ묶???ㅼ썙???? ${hits.length}`);
    if (missing.length) notes.push(`?꾨씫 ?ㅼ썙???? ${missing.length}`);
    if (ratio != null) notes.push(`留ㅼ묶瑜? ${Math.round(ratio * 100)}%`);

    // UI?먯꽌 李띻린 醫뗭? ?ㅻ뱾
    const evidenceKeys = ["jdKeywords", "jdKeywordHits", "keywordMatchRatio"];

    return {
      title: "JD ?듭떖 ?ㅼ썙??遺??由ъ뒪??,
      why,
      fix,
      evidenceKeys,
      notes: evidence.length ? [...notes, ...evidence] : (notes.length ? notes : undefined),
    };
  },

  suppressIf: [],
};
