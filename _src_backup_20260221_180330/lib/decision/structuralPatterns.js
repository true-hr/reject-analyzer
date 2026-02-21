// src/lib/structuralPatterns.js
// NOTE: "寃利?媛???띿뒪??援ъ“ 湲곕컲)" ?덈씫 ?뺣쪧 ?곸듅 ?⑦꽩 媛먯?湲?
// - ?댁쁺 ?덉젙???곗꽑: crash-safe / append-only / ?낅젰 遺議???"UNKNOWN" 泥섎━
// - ??븷 遺꾨━:
//   1) detectStructuralPatterns(): ?⑦꽩 媛먯?(利앷굅 ?ы븿)
//   2) computeStructuralMetrics(): 以묎컙 吏???곗텧(?ъ궗??
//   3) PATTERN_DEFINITIONS: ?⑦꽩 硫뷀? + 寃異??⑥닔 ?덉??ㅽ듃由?
//
// ?ъ슜 ??沅뚯옣):
//   import { detectStructuralPatterns } from "./structuralPatterns";
//   const structural = detectStructuralPatterns({ state, ai });
//   // structural.flags -> [{ id, score, severity, evidence, detail }]
//   // structural.metrics -> { ... }
//
// ???뚯씪? "?띿뒪??湲곕컲 ?⑦꽩(B~J)"???곗꽑 ?ы븿?⑸땲??
// "??꾨씪??湲곕컲 ?⑦꽩(A/H/F ?쇰?)"? careerHistory媛 ?덉쓣 ?뚮쭔 媛먯??섎ŉ,
// ?놁쑝硫?UNKNOWN?쇰줈 ?꾨씫(?ㅽ깘 諛⑹?)??湲곕낯?쇰줈 ?⑸땲??
import {
  clamp,
  safeToString,
  safeLower,
  uniq,
  escapeRegExp,
  clone,
} from "../coreUtils";

import * as TH from "./utils/thresholds";


// ??FORCE LOAD CHECK (?꾩떆): ???뚯씪???ㅼ젣濡?踰덈뱾??濡쒕뱶?섎㈃ 利됱떆 ?붾㈃???먮윭濡??곗쭛?덈떎.

// ------------------------------
// crash-safe thresholds fallback
// ------------------------------
function _t(name, fallback) {
  try {
    const v = TH && Object.prototype.hasOwnProperty.call(TH, name) ? TH[name] : undefined;
    return Number.isFinite(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

function _tArr(name, fallback) {
  try {
    const v = TH && Object.prototype.hasOwnProperty.call(TH, name) ? TH[name] : undefined;
    return Array.isArray(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

function _tObj(name, fallback) {
  try {
    const v = TH && Object.prototype.hasOwnProperty.call(TH, name) ? TH[name] : undefined;
    return v && typeof v === "object" && !Array.isArray(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

// ------------------------------
// helpers: text normalization
// ------------------------------
function _normText(raw) {
  const s = safeToString(raw);
  // ?덈Т 怨듦꺽?곸씤 ?뺢퇋?붾뒗 ?섎? ?먯떎 媛????理쒖냼??
  return s.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
}

function _isEmptyText(s) {
  return !s || !safeToString(s).trim();
}

function _tokens(text) {
  const t = safeLower(_normText(text));
  // ?쒓?/?곷Ц/?レ옄 ?쇱옱 泥섎━: ?좏겙?붾뒗 "?⑥뼱/?レ옄/?쒓? ?⑹뼱由? 以묒떖
  // - 湲몄씠 1 ?좏겙(議곗궗/遺덉슜?? ?遺遺??쒓굅
  const arr = t
    .replace(/[^\p{L}\p{N}%.\-+/]+/gu, " ")
    .split(/\s+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .filter((x) => x.length >= 2 || /^\d+%$/.test(x) || /^\d+$/.test(x));
  return arr;
}

function _uniqTokens(text) {
  return uniq(_tokens(text));
}

function _jaccard(aTokens, bTokens) {
  const a = new Set(aTokens || []);
  const b = new Set(bTokens || []);
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;

  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  const union = a.size + b.size - inter;
  return union <= 0 ? 0 : inter / union;
}

function _countMatches(text, patterns) {
  const s = safeLower(_normText(text));
  if (!s) return 0;
  let cnt = 0;
  for (const p of patterns) {
    try {
      const re = p instanceof RegExp ? p : new RegExp(escapeRegExp(safeToString(p)), "g");
      const m = s.match(re);
      if (m && m.length) cnt += m.length;
    } catch {
      // ignore
    }
  }
  return cnt;
}

function _includesAny(text, needles) {
  const s = safeLower(_normText(text));
  if (!s) return false;
  for (const n of needles) {
    const nn = safeLower(safeToString(n));
    if (!nn) continue;
    if (s.includes(nn)) return true;
  }
  return false;
}

function _extractEvidenceSnippets(text, needles, maxSnippets = 3, window = 42) {
  // 留ㅼ슦 ?⑥닚??利앷굅 ?ㅻ땲??異붿텧(?ㅽ깘 諛⑹? ?꾪빐 "?ы븿" 湲곕컲)
  const s = _normText(text);
  const low = safeLower(s);
  const out = [];
  if (!s) return out;

  for (const n of needles) {
    const nn = safeLower(safeToString(n));
    if (!nn) continue;
    const idx = low.indexOf(nn);
    if (idx >= 0) {
      const start = Math.max(0, idx - window);
      const end = Math.min(s.length, idx + nn.length + window);
      out.push(s.slice(start, end));
      if (out.length >= maxSnippets) break;
    }
  }

  return out;
}

function _countNumbers(text) {
  const s = _normText(text);
  if (!s) return 0;
  // % / ??/ 留?/ 諛?/ KPI ?レ옄 ??
  const re = /(\d+(?:\.\d+)?\s?%|\d+(?:\.\d+)?\s?(?:??留?泥?諛?|\d+(?:\.\d+)?\s?諛?\d+(?:\.\d+)?\s?(?:紐?嫄???二???媛쒖썡|??)/g;
  const m = s.match(re);
  return m ? m.length : 0;
}

// ------------------------------
// helpers: JD "?꾩닔" / must-have 異붿텧
// ------------------------------
function _extractMustHaveFromJD(jdText) {
  // 紐⑺몴: "?꾩닔/Required/?먭꺽?붽굔" 臾몃㎘?먯꽌 ?ㅽ궗 ?좏겙??戮묒븘???뺣? 100% ?꾨떂)
  const jd = _normText(jdText);
  const low = safeLower(jd);
  if (!jd) return { requiredSkills: [], rawLines: [] };

  const lines = jd.split("\n").map((x) => x.trim()).filter(Boolean);

  const buckets = [];
  for (const line of lines) {
    const l = safeLower(line);
    const hit =
      l.includes("?꾩닔") ||
      l.includes("required") ||
      l.includes("?먭꺽?붽굔") ||
      l.includes("?붽뎄?ы빆") ||
      l.includes("must") ||
      l.includes("mandatory");
    if (hit) buckets.push(line);
  }

  // ?쇱씤?먯꽌 ?좏겙?????덈Т ?쇰컲?곸씤 ?⑥뼱 ?쒓굅(媛꾨떒)
  const stop = new Set([
    "?꾩닔",
    "required",
    "?먭꺽?붽굔",
    "?붽뎄?ы빆",
    "must",
    "mandatory",
    "?곕?",
    "preferred",
    "?ы빆",
    "寃쏀뿕",
    "媛??,
    "?λ젰",
    "?댁긽",
    "?댄븯",
    "?낅Т",
    "愿??,
    "?꾧났",
    "?숇젰",
  ]);

  const skills = [];
  for (const line of buckets) {
    const toks = _tokens(line);
    for (const t of toks) {
      if (stop.has(t)) continue;
      // ?덈Т 吏㏃? ?좏겙(?쒓? 2湲?먮씪???쇰컲??媛??源뚯? ??留됯릿 ?대졄吏留?
      // ?ш린?쒕뒗 "?꾨낫"濡쒕쭔 戮묎퀬, 而ㅻ쾭由ъ? 怨꾩궛 ??resume??議댁옱?댁빞留??몄젙
      skills.push(t);
    }
  }

  // 以묐났 ?쒓굅 + ?덈Т ?뷀븳 ?쇰컲??異붽? ?꾪꽣(理쒖냼)
  const commonBad = new Set([
    "而ㅻ??덉??댁뀡",
    "?묒뾽",
    "臾몄젣?닿껐",
    "?깆떎",
    "梨낆엫媛?,
    "?댁젙",
    "?꾩쟾",
    "?깆옣",
    "湲띿젙",
    "湲고쉷",
    "?댁쁺",
  ]);

  const requiredSkills = uniq(skills).filter((x) => x && !commonBad.has(x));
  return { requiredSkills, rawLines: buckets };
}

// ------------------------------
// helpers: verb signals
// ------------------------------
const OWNERSHIP_WEAK_VERBS = [
  "李몄뿬",
  "吏??,
  "蹂댁“",
  "?쒗룷??,
  "assist",
  "support",
  "help",
  "?섑뻾",
  "?대떦",
  "湲곗뿬",
];

const OWNERSHIP_STRONG_VERBS = [
  "湲고쉷",
  "由щ뱶",
  "二쇰룄",
  "?ㅺ퀎",
  "寃곗젙",
  "梨낆엫",
  "珥앷큵",
  "?ㅻ꼫??,
  "媛쒖꽑",
  "援ъ텞",
  "?곗묶",
  "?꾩엯",
  "?꾪솚",
  "?뺤쓽",
  "lead",
  "own",
  "design",
  "launch",
  "implement",
];

const IMPACT_VERBS = [
  "媛쒖꽑",
  "利앷?",
  "媛먯냼",
  "?덇컧",
  "理쒖쟻??,
  "?μ긽",
  "媛쒗렪",
  "媛쒖꽑??,
  "growth",
  "increase",
  "decrease",
  "optimiz",
  "improv",
  "save",
];

const DECISION_VERBS = [
  "寃곗젙",
  "?섏궗寃곗젙",
  "?먮떒",
  "?뱀씤",
  "approve",
  "decid",
];

const INITIATION_VERBS = [
  "?쒖븞",
  "諛쒖쓽",
  "湲고쉷",
  "?쒖옉",
  "?곗묶",
  "?좎꽕",
  "?쒖옉",
  "proposal",
  "initiat",
  "launch",
  "start",
];

const TEAM_SIGNALS = [
  "?",
  "???,
  "?묒뾽",
  "co-work",
  "collab",
  "cross",
  "stakeholder",
  "?좉?",
];

const SOLO_SIGNALS = [
  "?쇱옄",
  "?⑤룆",
  "1??,
  "solo",
  "alone",
];

const HEDGE_PHRASES = [
  "??寃?媛숈뒿?덈떎",
  "?덈뜕 寃?媛숈뒿?덈떎",
  "媛숈뒿?덈떎",
  "??寃?媛숈뒿?덈떎",
  "媛숈븘??,
  "?꾨쭏",
  "?대뒓 ?뺣룄",
  "媛?ν븷 寃?,
  "?대낫寃좎뒿?덈떎",
];

const LOW_CONFIDENCE_PHRASES = [
  "?꾩??쒕┫ ??,
  "?몃젰?섍쿋?듬땲??,
  "?댁떖???섍쿋?듬땲??,
  "諛곗슦寃좎뒿?덈떎",
  "諛곗슦??,
  "?깆떎??,
];

const BUZZWORDS = [
  "?곸떊",
  "?댁젙",
  "?깆옣",
  "?꾩쟾",
  "理쒓퀬",
  "理쒖긽",
  "鍮꾩쟾",
  "?듭떖",
  "湲濡쒕쾶",
  "?좊룄",
  "?곸썡",
  "amazing",
  "world-class",
];

const GENERIC_SELF_INTRO_PHRASES = [
  "鍮꾨퉼諛?媛숈?",
  "留κ??대쾭",
  "?댁젙?곸씤 ?щ엺",
  "?깆떎???щ엺",
  "?꾩쟾?섎뒗 ?щ엺",
  "湲띿젙?곸씤 ?щ엺",
];

const VAGUE_RESP_PHRASES = [
  "?낅Т ?섑뻾",
  "愿???낅Т",
  "?낅Т ?꾨컲",
  "?낅Т 吏??,
  "湲고? ?낅Т",
  "??,
];

const VENDOR_SIGNALS = [
  "si",
  "?묐젰??,
  "?몄＜",
  "?뚭껄",
  "?꾧툒",
  "?⑹뿭",
  "vendor",
  "outsourcing",
  "subcontract",
];

// ------------------------------
// timeline helpers (optional)
// ------------------------------
function _parseMonthSpan(item) {
  // item: { startDate, endDate, months } ?뺤떇 媛??(?놁쑝硫?null)
  if (!item || typeof item !== "object") return null;

  // 1) months媛 ?대? ?덉쑝硫??곗꽑 ?ъ슜
  if (Number.isFinite(item.months)) return Math.max(0, item.months);

  // 2) start/end媛 臾몄옄?댁씠硫?YYYY-MM ?뺣룄留?媛꾨떒 泥섎━
  const s = safeToString(item.startDate).trim();
  const e = safeToString(item.endDate).trim();
  const re = /^(\d{4})[-./](\d{1,2})/;

  const ms = s.match(re);
  const me = e.match(re);
  if (!ms || !me) return null;

  const sy = Number(ms[1]);
  const sm = Number(ms[2]);
  const ey = Number(me[1]);
  const em = Number(me[2]);

  if (!Number.isFinite(sy) || !Number.isFinite(sm) || !Number.isFinite(ey) || !Number.isFinite(em)) return null;

  const months = (ey - sy) * 12 + (em - sm) + 1;
  return months > 0 ? months : null;
}

function _computeAvgTenureMonths(careerHistory) {
  if (!Array.isArray(careerHistory) || careerHistory.length === 0) return null;

  const spans = [];
  for (const it of careerHistory) {
    const m = _parseMonthSpan(it);
    if (Number.isFinite(m) && m > 0) spans.push(m);
  }
  if (spans.length === 0) return null;

  const sum = spans.reduce((a, b) => a + b, 0);
  return sum / spans.length;
}

function _computeExtremeJobHopping(careerHistory) {
  // 理쒓렐 3媛?以?2媛??댁긽 12媛쒖썡 誘몃쭔
  if (!Array.isArray(careerHistory) || careerHistory.length === 0) return null;

  // "理쒓렐" ?뺣젹???섏뼱?덉? ?딆쓣 ???덉쑝??endDate 湲곗? ?뺣젹 ?쒕룄
  const items = careerHistory.slice();
  items.sort((a, b) => {
    const ea = safeToString(a?.endDate);
    const eb = safeToString(b?.endDate);
    return eb.localeCompare(ea);
  });

  const top3 = items.slice(0, 3);
  let shortCount = 0;
  for (const it of top3) {
    const m = _parseMonthSpan(it);
    if (Number.isFinite(m) && m > 0 && m < 12) shortCount += 1;
  }
  return { shortCount, considered: top3.length };
}

function _computeIndustrySwitchCount(careerHistory) {
  if (!Array.isArray(careerHistory) || careerHistory.length === 0) return null;

  const inds = careerHistory
    .map((x) => safeLower(safeToString(x?.industry || x?.detectedIndustry || "")))
    .map((x) => x.trim())
    .filter(Boolean);

  if (inds.length <= 1) return 0;

  let switches = 0;
  for (let i = 1; i < inds.length; i++) {
    if (inds[i] !== inds[i - 1]) switches += 1;
  }
  return switches;
}

// ------------------------------
// metrics
// ------------------------------
export function computeStructuralMetrics({ state, jdText, resumeText, portfolioText, ai } = {}) {
  const st = state && typeof state === "object" ? state : {};
  const jd = _normText(jdText ?? st.jd ?? "");
  const resume = _normText(resumeText ?? st.resume ?? "");
  const portfolio = _normText(portfolioText ?? st.portfolio ?? "");
  const combined = [resume, portfolio].filter(Boolean).join("\n\n");

  const jdTokens = _uniqTokens(jd);
  const resumeTokens = _uniqTokens(combined);

  const similarity = _jaccard(jdTokens, resumeTokens);

  const numbersCount = _countNumbers(combined);
  const ownershipWeakCount = _countMatches(combined, OWNERSHIP_WEAK_VERBS);
  const ownershipStrongCount = _countMatches(combined, OWNERSHIP_STRONG_VERBS);
  const impactVerbCount = _countMatches(combined, IMPACT_VERBS);
  const decisionVerbCount = _countMatches(combined, DECISION_VERBS);
  const initiationVerbCount = _countMatches(combined, INITIATION_VERBS);

  const hedgeCount = _countMatches(combined, HEDGE_PHRASES);
  const lowConfCount = _countMatches(combined, LOW_CONFIDENCE_PHRASES);
  const buzzwordCount = _countMatches(combined, BUZZWORDS);
  const vagueRespCount = _countMatches(combined, VAGUE_RESP_PHRASES);

  const teamSignalCount = _countMatches(combined, TEAM_SIGNALS);
  const soloSignalCount = _countMatches(combined, SOLO_SIGNALS);

  const vendorSignalCount = _countMatches(combined, VENDOR_SIGNALS);

  const { requiredSkills, rawLines } = _extractMustHaveFromJD(jd);
  const requiredCovered = requiredSkills.filter((sk) => resumeTokens.includes(safeLower(sk)));
  const requiredCoverage = requiredSkills.length > 0 ? requiredCovered.length / requiredSkills.length : null;

  // ?뚯궗/吏곷Т ?뱀씠?? state.company / state.role / ai.detectedCompanyName ?깆쓣 湲곕컲?쇰줈 ?⑥닚 寃??
  const companyNameCandidates = uniq([
    safeToString(st.company || "").trim(),
    safeToString(st.targetCompany || "").trim(),
    safeToString(ai?.company || "").trim(),
    safeToString(ai?.detectedCompany || "").trim(),
    safeToString(ai?.detectedCompanyName || "").trim(),
  ]).filter(Boolean);

  const companyMentioned = companyNameCandidates.length
    ? _includesAny(combined, companyNameCandidates)
    : false;

  const roleCandidates = uniq([
    safeToString(st.role || "").trim(),
    safeToString(st.targetRole || "").trim(),
    safeToString(ai?.detectedRole || "").trim(),
    safeToString(ai?.role || "").trim(),
  ]).filter(Boolean);

  const roleMentioned = roleCandidates.length ? _includesAny(combined, roleCandidates) : false;

  // ??꾨씪??湲곕컲(?덉쑝硫?
  const careerHistory = Array.isArray(st.careerHistory) ? st.careerHistory : Array.isArray(st.career?.history) ? st.career.history : null;

  const avgTenureMonths = _computeAvgTenureMonths(careerHistory);
  const extremeHop = _computeExtremeJobHopping(careerHistory);
  const industrySwitches = _computeIndustrySwitchCount(careerHistory);

  // ?명꽩/?뺢퇋吏?鍮꾩쑉(?덉쑝硫?
  let internMonths = null;
  let totalMonths = null;
  let fulltimeMonths = null;
  if (Array.isArray(careerHistory) && careerHistory.length) {
    let _intern = 0;
    let _total = 0;
    let _full = 0;
    for (const it of careerHistory) {
      const m = _parseMonthSpan(it);
      if (!Number.isFinite(m) || m <= 0) continue;
      _total += m;
      const et = safeLower(safeToString(it.employmentType || it.type || ""));
      if (et.includes("?명꽩") || et.includes("intern")) _intern += m;
      if (et.includes("?뺢퇋") || et.includes("full")) _full += m;
    }
    internMonths = _total > 0 ? _intern : null;
    fulltimeMonths = _total > 0 ? _full : null;
    totalMonths = _total > 0 ? _total : null;
  }

  return {
    // raw texts
    lengths: {
      jd: jd.length,
      resume: resume.length,
      portfolio: portfolio.length,
      combined: combined.length,
    },

    // similarity
    semanticSimilarity: similarity,

    // numbers / verbs
    numbersCount,
    ownershipWeakCount,
    ownershipStrongCount,
    impactVerbCount,
    decisionVerbCount,
    initiationVerbCount,

    // language signals
    hedgeCount,
    lowConfCount,
    buzzwordCount,
    vagueRespCount,

    // collaboration signals
    teamSignalCount,
    soloSignalCount,

    // vendor signals
    vendorSignalCount,

    // jd requirements
    requiredSkills,
    requiredLines: rawLines,
    requiredCovered,
    requiredCoverage,

    // specificity
    companyMentioned,
    companyNameCandidates,
    roleMentioned,
    roleCandidates,

    // timeline
    hasCareerHistory: Array.isArray(careerHistory) && careerHistory.length > 0,
    avgTenureMonths,
    extremeJobHopping: extremeHop, // {shortCount, considered} | null
    industrySwitches,

    // employment ratios
    internMonths,
    fulltimeMonths,
    totalMonths,
  };
}

// ------------------------------
// pattern definition schema
// ------------------------------
// score: 0~1 (1 = 由ъ뒪??留ㅼ슦 ?믪쓬)
// severity: "low" | "mid" | "high" | "critical"
// evidence: string[] (吏㏃? ?ㅻ땲??
// detail: object (異붽? ?곗씠??
function _makeFlag({ id, title, category, severity, score, evidence, detail }) {
  return {
    id: safeToString(id),
    title: safeToString(title),
    category: safeToString(category),
    severity: severity || "mid",
    score: clamp(Number.isFinite(score) ? score : 0, 0, 1),
    evidence: Array.isArray(evidence) ? evidence.filter(Boolean).slice(0, 6) : [],
    detail: detail && typeof detail === "object" ? detail : {},
  };
}

// ------------------------------
// pattern definitions (text-first)
// ------------------------------
const THRESH = {
  AVG_TENURE_MONTHS_LOW: _t("AVG_TENURE_MONTHS_LOW", 18),
  EXTREME_HOP_MONTHS: _t("EXTREME_HOP_MONTHS", 12),
  EXTREME_HOP_COUNT: _t("EXTREME_HOP_COUNT", 2),
  GAP_MONTHS: _t("GAP_MONTHS", 6),

  MIN_RESUME_LENGTH: _t("MIN_RESUME_LENGTH", 900),
  MIN_COMBINED_LENGTH: _t("MIN_COMBINED_LENGTH", 1100),

  LOW_SEMANTIC_SIMILARITY: _t("LOW_SEMANTIC_SIMILARITY", 0.35),

  REQUIRED_COVERAGE_LOW: _t("REQUIRED_COVERAGE_LOW", 0.5),

  OWNERSHIP_STRONG_MIN: _t("OWNERSHIP_STRONG_MIN", 2),
  OWNERSHIP_RATIO_LOW: _t("OWNERSHIP_RATIO_LOW", 0.6), // strong/(strong+weak) ??쑝硫??꾪뿕

  MIN_NUMBERS_COUNT: _t("MIN_NUMBERS_COUNT", 1),
  MIN_IMPACT_VERBS: _t("MIN_IMPACT_VERBS", 1),

  BUZZWORD_RATIO_HIGH: _t("BUZZWORD_RATIO_HIGH", 0.02), // buzzwords / tokens
  HEDGE_RATIO_HIGH: _t("HEDGE_RATIO_HIGH", 0.015),
  LOWCONF_RATIO_HIGH: _t("LOWCONF_RATIO_HIGH", 0.01),

  VAGUE_RESP_RATIO_HIGH: _t("VAGUE_RESP_RATIO_HIGH", 0.01),

  VENDOR_SIGNAL_MIN: _t("VENDOR_SIGNAL_MIN", 1),

  SOLO_DOMINANCE_RATIO: _t("SOLO_DOMINANCE_RATIO", 1.5), // solo > team*ratio?대㈃ solo dominance
};

const PATTERN_DEFINITIONS = [
  // ------------------------------
  // Category A (timeline-based, optional)
  // ------------------------------
  {
    id: "HIGH_SWITCH_PATTERN",
    title: "?됯퇏 ?ъ쭅湲곌컙??吏㏃쓬",
    category: "A.CareerTrajectory",
    severity: "high",
    detect: ({ metrics }) => {
      if (!metrics?.hasCareerHistory) return null; // ?곗씠???놁쑝硫?媛먯??섏? ?딆쓬
      const avg = metrics.avgTenureMonths;
      if (!Number.isFinite(avg)) return null;

      if (avg < THRESH.AVG_TENURE_MONTHS_LOW) {
        // score: ?쇰쭏?????吏???곕씪
        const score = clamp((THRESH.AVG_TENURE_MONTHS_LOW - avg) / THRESH.AVG_TENURE_MONTHS_LOW, 0.2, 1);
        return _makeFlag({
          id: "HIGH_SWITCH_PATTERN",
          title: "?됯퇏 ?ъ쭅湲곌컙??吏㏃쓬",
          category: "A.CareerTrajectory",
          severity: avg < 12 ? "critical" : "high",
          score,
          evidence: [],
          detail: { avgTenureMonths: avg, thresholdMonths: THRESH.AVG_TENURE_MONTHS_LOW },
        });
      }
      return null;
    },
  },
  {
    id: "EXTREME_JOB_HOPPING_PATTERN",
    title: "理쒓렐 3媛?以?2媛??댁긽??1??誘몃쭔",
    category: "A.CareerTrajectory",
    severity: "high",
    detect: ({ metrics }) => {
      if (!metrics?.hasCareerHistory) return null;
      const ex = metrics.extremeJobHopping;
      if (!ex || !Number.isFinite(ex.shortCount)) return null;

      if (ex.considered >= 2 && ex.shortCount >= THRESH.EXTREME_HOP_COUNT) {
        const score = clamp(ex.shortCount / 3, 0.6, 1);
        return _makeFlag({
          id: "EXTREME_JOB_HOPPING_PATTERN",
          title: "理쒓렐 寃쎈젰?먯꽌 1??誘몃쭔 ?ъ쭅??諛섎났??,
          category: "A.CareerTrajectory",
          severity: ex.shortCount >= 3 ? "critical" : "high",
          score,
          evidence: [],
          detail: { shortCount: ex.shortCount, considered: ex.considered, monthsCut: THRESH.EXTREME_HOP_MONTHS },
        });
      }
      return null;
    },
  },
  {
    id: "FREQUENT_INDUSTRY_SWITCH_PATTERN",
    title: "?곗뾽 蹂寃쎌씠 ??쓬",
    category: "A.CareerTrajectory",
    severity: "mid",
    detect: ({ metrics }) => {
      if (!metrics?.hasCareerHistory) return null;
      const sw = metrics.industrySwitches;
      if (!Number.isFinite(sw)) return null;
      if (sw >= 2) {
        const score = clamp(sw / 4, 0.4, 1);
        return _makeFlag({
          id: "FREQUENT_INDUSTRY_SWITCH_PATTERN",
          title: "?곗뾽 蹂寃쎌씠 ??쓬",
          category: "A.CareerTrajectory",
          severity: sw >= 3 ? "high" : "mid",
          score,
          evidence: [],
          detail: { industrySwitches: sw },
        });
      }
      return null;
    },
  },

  // ------------------------------
  // Category B: Role & Skill match (text-first)
  // ------------------------------
  {
    id: "MUST_HAVE_SKILL_MISSING",
    title: "JD ?꾩닔 ?ㅽ궗 ?꾨씫",
    category: "B.RoleSkill",
    severity: "critical",
    detect: ({ metrics, texts }) => {
      const req = metrics?.requiredSkills || [];
      if (!Array.isArray(req) || req.length === 0) return null; // JD?먯꽌 ?꾩닔 異붿텧 ?ㅽ뙣/?놁쓬?대㈃ ?ㅽ궢

      const cov = metrics.requiredCoverage;
      if (!Number.isFinite(cov)) return null;

      if (cov < THRESH.REQUIRED_COVERAGE_LOW) {
        const miss = req.filter((x) => !(metrics.requiredCovered || []).includes(x));
        const evidence = _extractEvidenceSnippets(texts?.jd || "", metrics.requiredLines || [], 3, 60);
        return _makeFlag({
          id: "MUST_HAVE_SKILL_MISSING",
          title: "JD ?꾩닔 ?ㅽ궗 而ㅻ쾭由ъ? ??쓬",
          category: "B.RoleSkill",
          severity: cov < 0.34 ? "critical" : "high",
          score: clamp((THRESH.REQUIRED_COVERAGE_LOW - cov) / THRESH.REQUIRED_COVERAGE_LOW + 0.4, 0, 1),
          evidence,
          detail: {
            requiredSkills: req.slice(0, 30),
            covered: (metrics.requiredCovered || []).slice(0, 30),
            missing: miss.slice(0, 30),
            coverage: cov,
            threshold: THRESH.REQUIRED_COVERAGE_LOW,
          },
        });
      }
      return null;
    },
  },
  {
    id: "LOW_SKILL_MATCH_SCORE",
    title: "JD-?대젰???섎? ?좎궗????쓬",
    category: "B.RoleSkill",
    severity: "high",
    detect: ({ metrics }) => {
      const sim = metrics?.semanticSimilarity;
      if (!Number.isFinite(sim)) return null;
      if (sim < THRESH.LOW_SEMANTIC_SIMILARITY) {
        const score = clamp((THRESH.LOW_SEMANTIC_SIMILARITY - sim) / THRESH.LOW_SEMANTIC_SIMILARITY + 0.3, 0, 1);
        return _makeFlag({
          id: "LOW_SEMANTIC_SIMILARITY_PATTERN",
          title: "JD-?대젰???섎? ?좎궗????쓬",
          category: "B.RoleSkill",
          severity: sim < 0.22 ? "critical" : "high",
          score,
          evidence: [],
          detail: { semanticSimilarity: sim, threshold: THRESH.LOW_SEMANTIC_SIMILARITY },
        });
      }
      return null;
    },
  },
  {
    id: "JD_KEYWORD_ABSENCE_PATTERN",
    title: "JD ?듭떖 ?ㅼ썙??諛섏쁺 遺議?,
    category: "I.SemanticConsistency",
    severity: "high",
    detect: ({ metrics }) => {
      const req = metrics?.requiredSkills || [];
      if (!Array.isArray(req) || req.length === 0) return null;

      // ?꾩닔 ?쇱씤???덈뒗?곕룄 resume??嫄곗쓽 ??蹂댁씠硫?
      const covered = metrics.requiredCovered || [];
      const cov = metrics.requiredCoverage;
      if (!Number.isFinite(cov)) return null;

      if (covered.length === 0) {
        return _makeFlag({
          id: "JD_KEYWORD_ABSENCE_PATTERN",
          title: "JD ?꾩닔/?먭꺽?붽굔 ?ㅼ썙?쒓? ?대젰?쒖뿉 嫄곗쓽 ?놁쓬",
          category: "I.SemanticConsistency",
          severity: "critical",
          score: 1,
          evidence: (metrics.requiredLines || []).slice(0, 3),
          detail: { requiredSkills: req.slice(0, 30), coverage: cov },
        });
      }
      return null;
    },
  },

  // ------------------------------
  // Category C: Ownership & Responsibility (text-first)
  // ------------------------------
  {
    id: "LOW_OWNERSHIP_VERB_RATIO",
    title: "?ㅻ꼫???숈궗 鍮꾩쑉 ??쓬",
    category: "C.Ownership",
    severity: "high",
    detect: ({ metrics, texts }) => {
      const strong = Number(metrics?.ownershipStrongCount || 0);
      const weak = Number(metrics?.ownershipWeakCount || 0);
      const denom = strong + weak;

      if (denom === 0) return null; // ?좏샇媛 ?놁쑝硫??ㅽ궢(?ㅽ깘 諛⑹?)

      const ratio = denom > 0 ? strong / denom : 0;

      if (strong < THRESH.OWNERSHIP_STRONG_MIN || ratio < THRESH.OWNERSHIP_RATIO_LOW) {
        const score = clamp((THRESH.OWNERSHIP_RATIO_LOW - ratio) / THRESH.OWNERSHIP_RATIO_LOW + 0.4, 0, 1);
        const evidence = _extractEvidenceSnippets(texts?.combined || "", OWNERSHIP_WEAK_VERBS, 3, 48);
        return _makeFlag({
          id: "LOW_OWNERSHIP_VERB_RATIO",
          title: "?ㅻ꼫???쒗쁽???쏀븯怨?'李몄뿬/吏??蹂댁“' 以묒떖",
          category: "C.Ownership",
          severity: ratio < 0.25 ? "critical" : "high",
          score,
          evidence,
          detail: { strong, weak, ratio, minStrong: THRESH.OWNERSHIP_STRONG_MIN, minRatio: THRESH.OWNERSHIP_RATIO_LOW },
        });
      }
      return null;
    },
  },
  {
    id: "NO_DECISION_AUTHORITY_PATTERN",
    title: "?섏궗寃곗젙/?먮떒 ?좏샇 遺議?,
    category: "C.Ownership",
    severity: "mid",
    detect: ({ metrics, texts }) => {
      const c = Number(metrics?.decisionVerbCount || 0);
      if (c <= 0) {
        return _makeFlag({
          id: "NO_DECISION_AUTHORITY_PATTERN",
          title: "?섏궗寃곗젙/?먮떒 愿???쒗쁽??嫄곗쓽 ?놁쓬",
          category: "C.Ownership",
          severity: "mid",
          score: 0.6,
          evidence: _extractEvidenceSnippets(texts?.combined || "", ["?섏궗寃곗젙", "寃곗젙", "?먮떒", "approve", "decide"], 2, 60),
          detail: { decisionVerbCount: c },
        });
      }
      return null;
    },
  },
  {
    id: "NO_PROJECT_INITIATION_PATTERN",
    title: "臾몄젣 諛쒓뎬/?쒖븞/?곗묶 ?좏샇 遺議?,
    category: "C.Ownership",
    severity: "mid",
    detect: ({ metrics, texts }) => {
      const c = Number(metrics?.initiationVerbCount || 0);
      if (c <= 0) {
        return _makeFlag({
          id: "NO_PROJECT_INITIATION_PATTERN",
          title: "?쒖븞/諛쒖쓽/?곗묶 ??'?쒖옉' ?좏샇媛 遺議?,
          category: "C.Ownership",
          severity: "mid",
          score: 0.55,
          evidence: _extractEvidenceSnippets(texts?.combined || "", ["?쒖븞", "諛쒖쓽", "?곗묶", "?좎꽕", "proposal", "initiat"], 2, 60),
          detail: { initiationVerbCount: c },
        });
      }
      return null;
    },
  },
  {
    id: "SOLO_ONLY_PATTERN",
    title: "?묒뾽 ?좏샇 遺議??쇱옄/?⑤룆 以묒떖)",
    category: "F.ExperienceQuality",
    severity: "mid",
    detect: ({ metrics }) => {
      const solo = Number(metrics?.soloSignalCount || 0);
      const team = Number(metrics?.teamSignalCount || 0);
      if (solo <= 0 && team <= 0) return null;

      // solo媛 ? ?좏샇 ?鍮?怨쇰룄
      if (solo > 0 && (team === 0 || solo > team * THRESH.SOLO_DOMINANCE_RATIO)) {
        const score = clamp(0.6 + (solo - team) * 0.05, 0, 1);
        return _makeFlag({
          id: "SOLO_ONLY_PATTERN",
          title: "?묒뾽/?좉?遺????뚰겕 ?좏샇 ?鍮??⑤룆 ?섑뻾 ?좏샇媛 媛뺥븿",
          category: "F.ExperienceQuality",
          severity: team === 0 ? "high" : "mid",
          score,
          evidence: [],
          detail: { soloSignalCount: solo, teamSignalCount: team },
        });
      }
      return null;
    },
  },

  // ------------------------------
  // Category D: Impact & Achievement (text-first)
  // ------------------------------
  {
    id: "NO_QUANTIFIED_IMPACT",
    title: "?뺣웾 ?깃낵(?レ옄) 遺議?,
    category: "D.Impact",
    severity: "high",
    detect: ({ metrics }) => {
      const n = Number(metrics?.numbersCount || 0);
      if (n < THRESH.MIN_NUMBERS_COUNT) {
        return _makeFlag({
          id: "NO_QUANTIFIED_IMPACT",
          title: "?뺣웾 ?깃낵(%, 湲덉븸, 洹쒕え ?? ?쒗쁽??嫄곗쓽 ?놁쓬",
          category: "D.Impact",
          severity: "high",
          score: 0.8,
          evidence: [],
          detail: { numbersCount: n, minNumbersCount: THRESH.MIN_NUMBERS_COUNT },
        });
      }
      return null;
    },
  },
  {
    id: "LOW_IMPACT_VERB_PATTERN",
    title: "?깃낵/媛쒖꽑 ?숈궗 ?좏샇 遺議?,
    category: "D.Impact",
    severity: "mid",
    detect: ({ metrics, texts }) => {
      const c = Number(metrics?.impactVerbCount || 0);
      if (c < THRESH.MIN_IMPACT_VERBS) {
        return _makeFlag({
          id: "LOW_IMPACT_VERB_PATTERN",
          title: "媛쒖꽑/利앷?/理쒖쟻?????깃낵 ?숈궗 ?좏샇媛 ?쏀븿",
          category: "D.Impact",
          severity: "mid",
          score: 0.6,
          evidence: _extractEvidenceSnippets(texts?.combined || "", IMPACT_VERBS, 2, 60),
          detail: { impactVerbCount: c, minImpactVerbs: THRESH.MIN_IMPACT_VERBS },
        });
      }
      return null;
    },
  },
  {
    id: "PROCESS_ONLY_PATTERN",
    title: "?꾨줈?몄뒪 ?ㅻ챸留??덇퀬 寃곌낵/吏?쒓? ?쏀븿",
    category: "D.Impact",
    severity: "mid",
    detect: ({ metrics, texts }) => {
      // ?レ옄???녾퀬 impact verbs??遺議깊븯硫?process-only 媛?μ꽦 ??
      const n = Number(metrics?.numbersCount || 0);
      const v = Number(metrics?.impactVerbCount || 0);
      if (n === 0 && v === 0) {
        return _makeFlag({
          id: "PROCESS_ONLY_PATTERN",
          title: "?낅Т 怨쇱젙 ?ㅻ챸 ?꾩＜濡?蹂댁씠硫?寃곌낵/?꾪뙥???좏샇媛 ?쏀븿",
          category: "D.Impact",
          severity: "mid",
          score: 0.65,
          evidence: _extractEvidenceSnippets(texts?.combined || "", ["吏꾪뻾", "?섑뻾", "愿由?, "?댁쁺", "?꾨줈?몄뒪"], 2, 60),
          detail: { numbersCount: n, impactVerbCount: v },
        });
      }
      return null;
    },
  },

  // ------------------------------
  // Category E: Company / Industry (text-first)
  // ------------------------------
  {
    id: "VENDOR_LOCK_PATTERN",
    title: "SI/?묐젰???몄＜ ??踰ㅻ뜑 ?좏샇 議댁옱",
    category: "E.CompanyIndustry",
    severity: "mid",
    detect: ({ metrics, texts }) => {
      const c = Number(metrics?.vendorSignalCount || 0);
      if (c >= THRESH.VENDOR_SIGNAL_MIN) {
        return _makeFlag({
          id: "VENDOR_LOCK_PATTERN",
          title: "SI/?묐젰???몄＜/?뚭껄 ??踰ㅻ뜑 ?좏샇媛 ?섑???,
          category: "E.CompanyIndustry",
          severity: c >= 3 ? "high" : "mid",
          score: clamp(0.45 + c * 0.15, 0, 1),
          evidence: _extractEvidenceSnippets(texts?.combined || "", VENDOR_SIGNALS, 3, 50),
          detail: { vendorSignalCount: c },
        });
      }
      return null;
    },
  },
  {
    id: "LOW_COMPANY_SPECIFICITY_PATTERN",
    title: "?뚯궗 ?뱀씠???뚯궗紐??쒗뭹紐? ?쏀븿",
    category: "E.CompanyIndustry",
    severity: "mid",
    detect: ({ metrics }) => {
      // companyMentioned??state/company ?꾨낫 湲곕컲?대씪 蹂댁닔?곸쑝濡??ъ슜
      // ?놁쑝硫?'??쓬' ?뺣룄濡쒕쭔(?ㅽ깘 諛⑹?)
      const hasCandidates = Array.isArray(metrics?.companyNameCandidates) && metrics.companyNameCandidates.length > 0;
      if (!hasCandidates) return null;

      if (!metrics.companyMentioned) {
        return _makeFlag({
          id: "LOW_COMPANY_SPECIFICITY_PATTERN",
          title: "?뚯궗紐??쒗뭹/?쒕퉬????吏??????뱀씠?깆씠 ?띿뒪?몄뿉 嫄곗쓽 ?놁쓬",
          category: "E.CompanyIndustry",
          severity: "mid",
          score: 0.6,
          evidence: [],
          detail: { companyNameCandidates: metrics.companyNameCandidates },
        });
      }
      return null;
    },
  },
  {
    id: "LOW_ROLE_SPECIFICITY_PATTERN",
    title: "吏곷Т ?뱀씠??吏곷Т紐??듭떖 ??븷 ?ㅼ썙?? ?쏀븿",
    category: "E.CompanyIndustry",
    severity: "mid",
    detect: ({ metrics }) => {
      const hasCandidates = Array.isArray(metrics?.roleCandidates) && metrics.roleCandidates.length > 0;
      if (!hasCandidates) return null;

      if (!metrics.roleMentioned) {
        return _makeFlag({
          id: "LOW_ROLE_SPECIFICITY_PATTERN",
          title: "吏??吏곷Т瑜??뱀젙?섎뒗 ?쒗쁽(吏곷Т紐??듭떖 ??븷)???쏀븿",
          category: "E.CompanyIndustry",
          severity: "mid",
          score: 0.55,
          evidence: [],
          detail: { roleCandidates: metrics.roleCandidates },
        });
      }
      return null;
    },
  },

  // ------------------------------
  // Category F/G: Experience quality & Resume structure (text-first)
  // ------------------------------
  {
    id: "LOW_CONTENT_DENSITY_PATTERN",
    title: "?대젰???띿뒪??諛??遺꾨웾 遺議?,
    category: "G.ResumeStructure",
    severity: "high",
    detect: ({ metrics }) => {
      const len = Number(metrics?.lengths?.combined || 0);
      if (len < THRESH.MIN_COMBINED_LENGTH) {
        const score = clamp((THRESH.MIN_COMBINED_LENGTH - len) / THRESH.MIN_COMBINED_LENGTH + 0.4, 0, 1);
        return _makeFlag({
          id: "LOW_CONTENT_DENSITY_PATTERN",
          title: "?댁슜 遺꾨웾??遺議깊빐 ??웾/?깃낵 ?먮떒 洹쇨굅媛 ?쏀븿",
          category: "G.ResumeStructure",
          severity: len < THRESH.MIN_COMBINED_LENGTH * 0.6 ? "critical" : "high",
          score,
          evidence: [],
          detail: { combinedLength: len, minCombinedLength: THRESH.MIN_COMBINED_LENGTH },
        });
      }
      return null;
    },
  },
  {
    id: "HIGH_BUZZWORD_RATIO",
    title: "異붿긽??踰꾩쫰?뚮뱶 鍮꾩쨷???믪쓬",
    category: "G.ResumeStructure",
    severity: "mid",
    detect: ({ texts }) => {
      const combined = safeToString(texts?.combined || "");
      const toks = _tokens(combined);
      if (toks.length < 60) return null; // ?덈Т 吏㏃? 臾몄꽌?먯꽌 鍮꾩쑉 怨꾩궛? ?ㅽ깘

      const buzz = _countMatches(combined, BUZZWORDS);
      const ratio = toks.length > 0 ? buzz / toks.length : 0;

      if (ratio >= THRESH.BUZZWORD_RATIO_HIGH) {
        return _makeFlag({
          id: "HIGH_BUZZWORD_RATIO",
          title: "踰꾩쫰?뚮뱶/異붿긽??鍮꾩쨷???믪븘 援ъ껜?깆씠 ?⑥뼱吏?,
          category: "G.ResumeStructure",
          severity: ratio > THRESH.BUZZWORD_RATIO_HIGH * 2 ? "high" : "mid",
          score: clamp(ratio / (THRESH.BUZZWORD_RATIO_HIGH * 2), 0.4, 1),
          evidence: _extractEvidenceSnippets(combined, BUZZWORDS, 3, 45),
          detail: { buzzwordCount: buzz, tokenCount: toks.length, ratio, threshold: THRESH.BUZZWORD_RATIO_HIGH },
        });
      }
      return null;
    },
  },
  {
    id: "VAGUE_RESPONSIBILITY_PATTERN",
    title: "梨낆엫 踰붿쐞媛 紐⑦샇???쒗쁽 ?ㅼ닔",
    category: "G.ResumeStructure",
    severity: "mid",
    detect: ({ texts }) => {
      const combined = safeToString(texts?.combined || "");
      const toks = _tokens(combined);
      if (toks.length < 60) return null;

      const vague = _countMatches(combined, VAGUE_RESP_PHRASES);
      const ratio = toks.length > 0 ? vague / toks.length : 0;

      if (ratio >= THRESH.VAGUE_RESP_RATIO_HIGH && vague >= 2) {
        return _makeFlag({
          id: "VAGUE_RESPONSIBILITY_PATTERN",
          title: "?낅Т/梨낆엫 踰붿쐞媛 異붿긽?곸쑝濡쒕쭔 ?쒗쁽??,
          category: "G.ResumeStructure",
          severity: vague >= 5 ? "high" : "mid",
          score: clamp(0.5 + vague * 0.08, 0, 1),
          evidence: _extractEvidenceSnippets(combined, VAGUE_RESP_PHRASES, 3, 50),
          detail: { vagueCount: vague, tokenCount: toks.length, ratio, threshold: THRESH.VAGUE_RESP_RATIO_HIGH },
        });
      }
      return null;
    },
  },
  {
    id: "GENERIC_SELF_DESCRIPTION_PATTERN",
    title: "吏꾨????먭린?뚭컻/鍮꾩쑀 ?쒗쁽",
    category: "G.ResumeStructure",
    severity: "low",
    detect: ({ texts }) => {
      const combined = safeToString(texts?.combined || "");
      if (_includesAny(combined, GENERIC_SELF_INTRO_PHRASES)) {
        return _makeFlag({
          id: "GENERIC_SELF_DESCRIPTION_PATTERN",
          title: "吏꾨?/?대━???먭린?뚭컻 ?쒗쁽???ы븿??,
          category: "G.ResumeStructure",
          severity: "low",
          score: 0.35,
          evidence: _extractEvidenceSnippets(combined, GENERIC_SELF_INTRO_PHRASES, 2, 60),
          detail: {},
        });
      }
      return null;
    },
  },

  // ------------------------------
  // Category I/J: Consistency & Language risk signals
  // ------------------------------
  {
    id: "HEDGE_LANGUAGE_DOMINANCE",
    title: "留먮걹 ?먮━湲??꾧끝?쒗쁽 鍮꾩쨷???믪쓬",
    category: "J.LanguageSignals",
    severity: "mid",
    detect: ({ texts }) => {
      const combined = safeToString(texts?.combined || "");
      const toks = _tokens(combined);
      if (toks.length < 80) return null;

      const hedge = _countMatches(combined, HEDGE_PHRASES);
      const ratio = toks.length > 0 ? hedge / toks.length : 0;

      if (ratio >= THRESH.HEDGE_RATIO_HIGH && hedge >= 2) {
        return _makeFlag({
          id: "HEDGE_LANGUAGE_DOMINANCE",
          title: "?뺤젙/?⑥젙 ?쒗쁽???쏀븯怨??꾧끝 ?쒗쁽??諛섎났??,
          category: "J.LanguageSignals",
          severity: hedge >= 6 ? "high" : "mid",
          score: clamp(0.45 + hedge * 0.07, 0, 1),
          evidence: _extractEvidenceSnippets(combined, HEDGE_PHRASES, 3, 50),
          detail: { hedgeCount: hedge, tokenCount: toks.length, ratio, threshold: THRESH.HEDGE_RATIO_HIGH },
        });
      }
      return null;
    },
  },
  {
    id: "LOW_CONFIDENCE_LANGUAGE_PATTERN",
    title: "?먯떊媛?二쇰룄???쏀븳 ?쒗쁽 諛섎났",
    category: "J.LanguageSignals",
    severity: "mid",
    detect: ({ texts }) => {
      const combined = safeToString(texts?.combined || "");
      const toks = _tokens(combined);
      if (toks.length < 80) return null;

      const lowc = _countMatches(combined, LOW_CONFIDENCE_PHRASES);
      const ratio = toks.length > 0 ? lowc / toks.length : 0;

      if (ratio >= THRESH.LOWCONF_RATIO_HIGH && lowc >= 2) {
        return _makeFlag({
          id: "LOW_CONFIDENCE_LANGUAGE_PATTERN",
          title: "洹쇨굅 ?녿뒗 ?ㅼ쭚/?섎룞???쒗쁽??諛섎났??,
          category: "J.LanguageSignals",
          severity: lowc >= 6 ? "high" : "mid",
          score: clamp(0.4 + lowc * 0.08, 0, 1),
          evidence: _extractEvidenceSnippets(combined, LOW_CONFIDENCE_PHRASES, 3, 55),
          detail: { lowConfCount: lowc, tokenCount: toks.length, ratio, threshold: THRESH.LOWCONF_RATIO_HIGH },
        });
      }
      return null;
    },
  },
];

// ------------------------------
// public API
// ------------------------------
export function detectStructuralPatterns({ state, ai, jdText, resumeText, portfolioText } = {}) {
  console.error("[detectStructuralPatterns] called");  // ???ш린
  const st = state && typeof state === "object" ? state : {};

  const jd = _normText(jdText ?? st.jd ?? "");
  const resume = _normText(resumeText ?? st.resume ?? "");
  const portfolio = _normText(portfolioText ?? st.portfolio ?? "");
  const combined = [resume, portfolio].filter(Boolean).join("\n\n");

  const metrics = computeStructuralMetrics({ state: st, ai, jdText: jd, resumeText: resume, portfolioText: portfolio });

  const texts = {
    jd,
    resume,
    portfolio,
    combined,
  };

  const flags = [];
  for (const def of PATTERN_DEFINITIONS) {
    try {
      const out = def.detect({ state: st, ai, texts, metrics });
      if (out && out.id) flags.push(out);
    } catch {
      // ?대뼡 ?⑦꽩?대뱺 ?ㅽ뙣?섎㈃ ?꾩껜 遺꾩꽍??二쎌? ?딄쾶 ?ㅽ궢
    }
  }

  // flags ?뺣젹: severity ??score ??id
  const sevRank = { low: 1, mid: 2, high: 3, critical: 4 };
  flags.sort((a, b) => {
    const sa = sevRank[a.severity] || 0;
    const sb = sevRank[b.severity] || 0;
    if (sb !== sa) return sb - sa;
    if (b.score !== a.score) return b.score - a.score;
    return safeToString(a.id).localeCompare(safeToString(b.id));
  });

  // ?붿빟 援ъ“(append-only濡?analyzer output???ｊ린 ?ъ슫 ?뺥깭)
  const summary = {
    totalFlags: flags.length,
    bySeverity: flags.reduce((acc, f) => {
      const k = f.severity || "mid";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {}),
    // ?듭떖 吏???쇰?留?
    metrics: {
      semanticSimilarity: metrics.semanticSimilarity,
      numbersCount: metrics.numbersCount,
      requiredCoverage: metrics.requiredCoverage,
      avgTenureMonths: metrics.avgTenureMonths,
      vendorSignalCount: metrics.vendorSignalCount,
      ownershipStrongCount: metrics.ownershipStrongCount,
      ownershipWeakCount: metrics.ownershipWeakCount,
      combinedLength: metrics.lengths?.combined,
    },
  };

  return {
    flags,
    metrics,
    summary,
  };
}

// ?⑦꽩 ?뺤쓽瑜??몃??먯꽌 李멸퀬?????덈룄濡?export (UI ?ㅻ챸/?댄똻 ?깆뿉 ?쒖슜)
export function getStructuralPatternDefinitions() {
  return PATTERN_DEFINITIONS.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    severity: p.severity,
  }));
}

// Age / Education / Salary thresholds (AAE = Age, Academic, Earnings)

// ?섏씠
export const AGE_HIGH = 40; // 寃쎄퀎???낆쥌/吏곷Т蹂꾨줈 ?щ씪吏????덉뼱 蹂댁닔?곸쑝濡?
export const AGE_VERY_HIGH = 45;

// ?숇젰(媛꾨떒 寃뚯씠??媛먯???
export const EDUCATION_MIN_LEVEL = "bachelor";
// ?덉슜: "highschool" | "associate" | "bachelor" | "master" | "phd"

// ?곕큺(遺덉씪移?媛먯???
export const SALARY_GAP_RATIO_HIGH = 0.25; // 湲곕??곕큺???곹븳蹂대떎 25%?묐㈃ ?꾪뿕 ?좏샇
export const SALARY_GAP_RATIO_LOW = 0.25;  // 湲곕??곕큺???섑븳蹂대떎 25%?볥㈃ '?몃뜑?留??덈꺼誘몄뒪' ?좏샇(?좏깮)
