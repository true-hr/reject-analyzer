// src/lib/structuralPatterns.js
// NOTE: "검증 가능(텍스트/구조 기반)" 탈락 확률 상승 패턴 감지기
// - 운영 안정성 우선: crash-safe / append-only / 입력 부족 시 "UNKNOWN" 처리
// - 역할 분리:
//   1) detectStructuralPatterns(): 패턴 감지(증거 포함)
//   2) computeStructuralMetrics(): 중간 지표 산출(재사용)
//   3) PATTERN_DEFINITIONS: 패턴 메타 + 검출 함수 레지스트리
//
// 사용 예(권장):
//   import { detectStructuralPatterns } from "./structuralPatterns";
//   const structural = detectStructuralPatterns({ state, ai });
//   // structural.flags -> [{ id, score, severity, evidence, detail }]
//   // structural.metrics -> { ... }
//
// 이 파일은 "텍스트 기반 패턴(B~J)"을 우선 포함합니다.
// "타임라인 기반 패턴(A/H/F 일부)"은 careerHistory가 있을 때만 감지하며,
// 없으면 UNKNOWN으로 누락(오탐 방지)을 기본으로 합니다.
import {
  clamp,
  safeToString,
  safeLower,
  uniq,
  escapeRegExp,
  clone,
} from "../coreUtils";

import * as TH from "./utils/thresholds";


// ✅ FORCE LOAD CHECK (임시): 이 파일이 실제로 번들에 로드되면 즉시 화면이 에러로 터집니다.

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
  // 너무 공격적인 정규화는 의미 손실 가능 → 최소화
  return s.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
}

function _isEmptyText(s) {
  return !s || !safeToString(s).trim();
}

function _tokens(text) {
  const t = safeLower(_normText(text));
  // 한글/영문/숫자 혼재 처리: 토큰화는 "단어/숫자/한글 덩어리" 중심
  // - 길이 1 토큰(조사/불용어) 대부분 제거
  const arr = t
    .replace(/[^0-9a-zA-Z가-힣_%.\-+/]/g, " ")
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
  // 매우 단순한 증거 스니펫 추출(오탐 방지 위해 "포함" 기반)
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
  // % / 억 / 만 / 배 / KPI 숫자 등
  const re = /(\d+(?:\.\d+)?\s?%|\d+(?:\.\d+)?\s?(?:억|만|천|백)|\d+(?:\.\d+)?\s?배|\d+(?:\.\d+)?\s?(?:명|건|회|주|일|개월|년))/g;
  const m = s.match(re);
  return m ? m.length : 0;
}

// ------------------------------
// helpers: JD "필수" / must-have 추출
// ------------------------------
function _extractMustHaveFromJD(jdText) {
  // 목표: "필수/Required/자격요건" 문맥에서 스킬 토큰을 뽑아냄(정밀 100% 아님)
  const jd = _normText(jdText);
  const low = safeLower(jd);
  if (!jd) return { requiredSkills: [], rawLines: [] };

  const lines = jd.split("\n").map((x) => x.trim()).filter(Boolean);

  const buckets = [];
  for (const line of lines) {
    const l = safeLower(line);
    const hit =
      l.includes("필수") ||
      l.includes("required") ||
      l.includes("자격요건") ||
      l.includes("요구사항") ||
      l.includes("must") ||
      l.includes("mandatory");
    if (hit) buckets.push(line);
  }

  // 라인에서 토큰화 후 너무 일반적인 단어 제거(간단)
  const stop = new Set([
    "필수",
    "required",
    "자격요건",
    "요구사항",
    "must",
    "mandatory",
    "우대",
    "preferred",
    "사항",
    "경험",
    "가능",
    "능력",
    "이상",
    "이하",
    "업무",
    "관련",
    "전공",
    "학력",
  ]);

  const skills = [];
  for (const line of buckets) {
    const toks = _tokens(line);
    for (const t of toks) {
      if (stop.has(t)) continue;
      // 너무 짧은 토큰(한글 2글자라도 일반어 가능)까지 다 막긴 어렵지만,
      // 여기서는 "후보"로만 뽑고, 커버리지 계산 시 resume에 존재해야만 인정
      skills.push(t);
    }
  }

  // 중복 제거 + 너무 흔한 일반어 추가 필터(최소)
  const commonBad = new Set([
    "커뮤니케이션",
    "협업",
    "문제해결",
    "성실",
    "책임감",
    "열정",
    "도전",
    "성장",
    "긍정",
    "기획",
    "운영",
  ]);

  const requiredSkills = uniq(skills).filter((x) => x && !commonBad.has(x));
  return { requiredSkills, rawLines: buckets };
}

// ------------------------------
// helpers: verb signals
// ------------------------------
const OWNERSHIP_WEAK_VERBS = [
  "참여",
  "지원",
  "보조",
  "서포트",
  "assist",
  "support",
  "help",
  "수행",
  "담당",
  "기여",
];

const OWNERSHIP_STRONG_VERBS = [
  "기획",
  "리드",
  "주도",
  "설계",
  "결정",
  "책임",
  "총괄",
  "오너십",
  "개선",
  "구축",
  "런칭",
  "도입",
  "전환",
  "정의",
  "lead",
  "own",
  "design",
  "launch",
  "implement",
];

const IMPACT_VERBS = [
  "개선",
  "증가",
  "감소",
  "절감",
  "최적화",
  "향상",
  "개편",
  "개선함",
  "growth",
  "increase",
  "decrease",
  "optimiz",
  "improv",
  "save",
];

const DECISION_VERBS = [
  "결정",
  "의사결정",
  "판단",
  "승인",
  "approve",
  "decid",
];

const INITIATION_VERBS = [
  "제안",
  "발의",
  "기획",
  "시작",
  "런칭",
  "신설",
  "제작",
  "proposal",
  "initiat",
  "launch",
  "start",
];

const TEAM_SIGNALS = [
  "팀",
  "팀원",
  "협업",
  "co-work",
  "collab",
  "cross",
  "stakeholder",
  "유관",
];

const SOLO_SIGNALS = [
  "혼자",
  "단독",
  "1인",
  "solo",
  "alone",
];

const HEDGE_PHRASES = [
  "인 것 같습니다",
  "했던 것 같습니다",
  "같습니다",
  "일 것 같습니다",
  "같아요",
  "아마",
  "어느 정도",
  "가능할 것",
  "해보겠습니다",
];

const LOW_CONFIDENCE_PHRASES = [
  "도와드릴 수",
  "노력하겠습니다",
  "열심히 하겠습니다",
  "배우겠습니다",
  "배우러",
  "성실히",
];

const BUZZWORDS = [
  "혁신",
  "열정",
  "성장",
  "도전",
  "최고",
  "최상",
  "비전",
  "핵심",
  "글로벌",
  "선도",
  "탁월",
  "amazing",
  "world-class",
];

const GENERIC_SELF_INTRO_PHRASES = [
  "비빔밥 같은",
  "맥가이버",
  "열정적인 사람",
  "성실한 사람",
  "도전하는 사람",
  "긍정적인 사람",
];

const VAGUE_RESP_PHRASES = [
  "업무 수행",
  "관련 업무",
  "업무 전반",
  "업무 지원",
  "기타 업무",
  "등",
];

const VENDOR_SIGNALS = [
  "si",
  "협력사",
  "외주",
  "파견",
  "도급",
  "용역",
  "vendor",
  "outsourcing",
  "subcontract",
];

// ------------------------------
// timeline helpers (optional)
// ------------------------------
function _parseMonthSpan(item) {
  // item: { startDate, endDate, months } 형식 가정 (없으면 null)
  if (!item || typeof item !== "object") return null;

  // 1) months가 이미 있으면 우선 사용
  if (Number.isFinite(item.months)) return Math.max(0, item.months);

  // 2) start/end가 문자열이면 YYYY-MM 정도만 간단 처리
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
  // 최근 3개 중 2개 이상 12개월 미만
  if (!Array.isArray(careerHistory) || careerHistory.length === 0) return null;

  // "최근" 정렬이 되어있지 않을 수 있으니 endDate 기준 정렬 시도
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

  // 회사/직무 특이성: state.company / state.role / ai.detectedCompanyName 등을 기반으로 단순 검사
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

  // 타임라인 기반(있으면)
  const careerHistory = Array.isArray(st.careerHistory) ? st.careerHistory : Array.isArray(st.career?.history) ? st.career.history : null;

  const avgTenureMonths = _computeAvgTenureMonths(careerHistory);
  const extremeHop = _computeExtremeJobHopping(careerHistory);
  const industrySwitches = _computeIndustrySwitchCount(careerHistory);

  // 인턴/정규직 비율(있으면)
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
      if (et.includes("인턴") || et.includes("intern")) _intern += m;
      if (et.includes("정규") || et.includes("full")) _full += m;
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
// score: 0~1 (1 = 리스크 매우 높음)
// severity: "low" | "mid" | "high" | "critical"
// evidence: string[] (짧은 스니펫)
// detail: object (추가 데이터)
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
  OWNERSHIP_RATIO_LOW: _t("OWNERSHIP_RATIO_LOW", 0.6), // strong/(strong+weak) 낮으면 위험

  MIN_NUMBERS_COUNT: _t("MIN_NUMBERS_COUNT", 1),
  MIN_IMPACT_VERBS: _t("MIN_IMPACT_VERBS", 1),

  BUZZWORD_RATIO_HIGH: _t("BUZZWORD_RATIO_HIGH", 0.02), // buzzwords / tokens
  HEDGE_RATIO_HIGH: _t("HEDGE_RATIO_HIGH", 0.015),
  LOWCONF_RATIO_HIGH: _t("LOWCONF_RATIO_HIGH", 0.01),

  VAGUE_RESP_RATIO_HIGH: _t("VAGUE_RESP_RATIO_HIGH", 0.01),

  VENDOR_SIGNAL_MIN: _t("VENDOR_SIGNAL_MIN", 1),

  SOLO_DOMINANCE_RATIO: _t("SOLO_DOMINANCE_RATIO", 1.5), // solo > team*ratio이면 solo dominance
};

const PATTERN_DEFINITIONS = [
  // ------------------------------
  // Category A (timeline-based, optional)
  // ------------------------------
  {
    id: "HIGH_SWITCH_PATTERN",
    title: "평균 재직기간이 짧음",
    category: "A.CareerTrajectory",
    severity: "high",
    detect: ({ metrics }) => {
      if (!metrics?.hasCareerHistory) return null; // 데이터 없으면 감지하지 않음
      const avg = metrics.avgTenureMonths;
      if (!Number.isFinite(avg)) return null;

      if (avg < THRESH.AVG_TENURE_MONTHS_LOW) {
        // score: 얼마나 낮은지에 따라
        const score = clamp((THRESH.AVG_TENURE_MONTHS_LOW - avg) / THRESH.AVG_TENURE_MONTHS_LOW, 0.2, 1);
        return _makeFlag({
          id: "HIGH_SWITCH_PATTERN",
          title: "평균 재직기간이 짧음",
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
    title: "최근 3개 중 2개 이상이 1년 미만",
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
          title: "최근 경력에서 1년 미만 재직이 반복됨",
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
    title: "산업 변경이 잦음",
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
          title: "산업 변경이 잦음",
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
    title: "JD 필수 스킬 누락",
    category: "B.RoleSkill",
    severity: "critical",
    detect: ({ metrics, texts }) => {
      const req = metrics?.requiredSkills || [];
      if (!Array.isArray(req) || req.length === 0) return null; // JD에서 필수 추출 실패/없음이면 스킵

      const cov = metrics.requiredCoverage;
      if (!Number.isFinite(cov)) return null;

      if (cov < THRESH.REQUIRED_COVERAGE_LOW) {
        const miss = req.filter((x) => !(metrics.requiredCovered || []).includes(x));
        const evidence = _extractEvidenceSnippets(texts?.jd || "", metrics.requiredLines || [], 3, 60);
        return _makeFlag({
          id: "MUST_HAVE_SKILL_MISSING",
          title: "JD 필수 스킬 커버리지 낮음",
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
    title: "JD-이력서 의미 유사도 낮음",
    category: "B.RoleSkill",
    severity: "high",
    detect: ({ metrics }) => {
      const sim = metrics?.semanticSimilarity;
      if (!Number.isFinite(sim)) return null;
      if (sim < THRESH.LOW_SEMANTIC_SIMILARITY) {
        const score = clamp((THRESH.LOW_SEMANTIC_SIMILARITY - sim) / THRESH.LOW_SEMANTIC_SIMILARITY + 0.3, 0, 1);
        return _makeFlag({
          id: "LOW_SEMANTIC_SIMILARITY_PATTERN",
          title: "JD-이력서 의미 유사도 낮음",
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
    title: "JD 핵심 키워드 반영 부족",
    category: "I.SemanticConsistency",
    severity: "high",
    detect: ({ metrics }) => {
      const req = metrics?.requiredSkills || [];
      if (!Array.isArray(req) || req.length === 0) return null;

      // 필수 라인이 있는데도 resume에 거의 안 보이면
      const covered = metrics.requiredCovered || [];
      const cov = metrics.requiredCoverage;
      if (!Number.isFinite(cov)) return null;

      if (covered.length === 0) {
        return _makeFlag({
          id: "JD_KEYWORD_ABSENCE_PATTERN",
          title: "JD 필수/자격요건 키워드가 이력서에 거의 없음",
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
    title: "오너십 동사 비율 낮음",
    category: "C.Ownership",
    severity: "high",
    detect: ({ metrics, texts }) => {
      const strong = Number(metrics?.ownershipStrongCount || 0);
      const weak = Number(metrics?.ownershipWeakCount || 0);
      const denom = strong + weak;

      if (denom === 0) return null; // 신호가 없으면 스킵(오탐 방지)

      const ratio = denom > 0 ? strong / denom : 0;

      if (strong < THRESH.OWNERSHIP_STRONG_MIN || ratio < THRESH.OWNERSHIP_RATIO_LOW) {
        const score = clamp((THRESH.OWNERSHIP_RATIO_LOW - ratio) / THRESH.OWNERSHIP_RATIO_LOW + 0.4, 0, 1);
        const evidence = _extractEvidenceSnippets(texts?.combined || "", OWNERSHIP_WEAK_VERBS, 3, 48);
        return _makeFlag({
          id: "LOW_OWNERSHIP_VERB_RATIO",
          title: "오너십 표현이 약하고 '참여/지원/보조' 중심",
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
    title: "의사결정/판단 신호 부족",
    category: "C.Ownership",
    severity: "mid",
    detect: ({ metrics, texts }) => {
      const c = Number(metrics?.decisionVerbCount || 0);
      if (c <= 0) {
        return _makeFlag({
          id: "NO_DECISION_AUTHORITY_PATTERN",
          title: "의사결정/판단 관련 표현이 거의 없음",
          category: "C.Ownership",
          severity: "mid",
          score: 0.6,
          evidence: _extractEvidenceSnippets(texts?.combined || "", ["의사결정", "결정", "판단", "approve", "decide"], 2, 60),
          detail: { decisionVerbCount: c },
        });
      }
      return null;
    },
  },
  {
    id: "NO_PROJECT_INITIATION_PATTERN",
    title: "문제 발굴/제안/런칭 신호 부족",
    category: "C.Ownership",
    severity: "mid",
    detect: ({ metrics, texts }) => {
      const c = Number(metrics?.initiationVerbCount || 0);
      if (c <= 0) {
        return _makeFlag({
          id: "NO_PROJECT_INITIATION_PATTERN",
          title: "제안/발의/런칭 등 '시작' 신호가 부족",
          category: "C.Ownership",
          severity: "mid",
          score: 0.55,
          evidence: _extractEvidenceSnippets(texts?.combined || "", ["제안", "발의", "런칭", "신설", "proposal", "initiat"], 2, 60),
          detail: { initiationVerbCount: c },
        });
      }
      return null;
    },
  },
  {
    id: "SOLO_ONLY_PATTERN",
    title: "협업 신호 부족(혼자/단독 중심)",
    category: "F.ExperienceQuality",
    severity: "mid",
    detect: ({ metrics }) => {
      const solo = Number(metrics?.soloSignalCount || 0);
      const team = Number(metrics?.teamSignalCount || 0);
      if (solo <= 0 && team <= 0) return null;

      // solo가 팀 신호 대비 과도
      if (solo > 0 && (team === 0 || solo > team * THRESH.SOLO_DOMINANCE_RATIO)) {
        const score = clamp(0.6 + (solo - team) * 0.05, 0, 1);
        return _makeFlag({
          id: "SOLO_ONLY_PATTERN",
          title: "협업/유관부서/팀워크 신호 대비 단독 수행 신호가 강함",
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
    title: "정량 성과(숫자) 부족",
    category: "D.Impact",
    severity: "high",
    detect: ({ metrics }) => {
      const n = Number(metrics?.numbersCount || 0);
      if (n < THRESH.MIN_NUMBERS_COUNT) {
        return _makeFlag({
          id: "NO_QUANTIFIED_IMPACT",
          title: "정량 성과(%, 금액, 규모 등) 표현이 거의 없음",
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
    title: "성과/개선 동사 신호 부족",
    category: "D.Impact",
    severity: "mid",
    detect: ({ metrics, texts }) => {
      const c = Number(metrics?.impactVerbCount || 0);
      if (c < THRESH.MIN_IMPACT_VERBS) {
        return _makeFlag({
          id: "LOW_IMPACT_VERB_PATTERN",
          title: "개선/증가/최적화 등 성과 동사 신호가 약함",
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
    title: "프로세스 설명만 있고 결과/지표가 약함",
    category: "D.Impact",
    severity: "mid",
    detect: ({ metrics, texts }) => {
      // 숫자도 없고 impact verbs도 부족하면 process-only 가능성 ↑
      const n = Number(metrics?.numbersCount || 0);
      const v = Number(metrics?.impactVerbCount || 0);
      if (n === 0 && v === 0) {
        return _makeFlag({
          id: "PROCESS_ONLY_PATTERN",
          title: "업무 과정 설명 위주로 보이며 결과/임팩트 신호가 약함",
          category: "D.Impact",
          severity: "mid",
          score: 0.65,
          evidence: _extractEvidenceSnippets(texts?.combined || "", ["진행", "수행", "관리", "운영", "프로세스"], 2, 60),
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
    title: "SI/협력사/외주 등 벤더 신호 존재",
    category: "E.CompanyIndustry",
    severity: "mid",
    detect: ({ metrics, texts }) => {
      const c = Number(metrics?.vendorSignalCount || 0);
      if (c >= THRESH.VENDOR_SIGNAL_MIN) {
        return _makeFlag({
          id: "VENDOR_LOCK_PATTERN",
          title: "SI/협력사/외주/파견 등 벤더 신호가 나타남",
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
    title: "회사 특이성(회사명/제품명) 약함",
    category: "E.CompanyIndustry",
    severity: "mid",
    detect: ({ metrics }) => {
      // companyMentioned는 state/company 후보 기반이라 보수적으로 사용
      // 없으면 '낮음' 정도로만(오탐 방지)
      const hasCandidates = Array.isArray(metrics?.companyNameCandidates) && metrics.companyNameCandidates.length > 0;
      if (!hasCandidates) return null;

      if (!metrics.companyMentioned) {
        return _makeFlag({
          id: "LOW_COMPANY_SPECIFICITY_PATTERN",
          title: "회사명/제품/서비스 등 지원 대상 특이성이 텍스트에 거의 없음",
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
    title: "직무 특이성(직무명/핵심 역할 키워드) 약함",
    category: "E.CompanyIndustry",
    severity: "mid",
    detect: ({ metrics }) => {
      const hasCandidates = Array.isArray(metrics?.roleCandidates) && metrics.roleCandidates.length > 0;
      if (!hasCandidates) return null;

      if (!metrics.roleMentioned) {
        return _makeFlag({
          id: "LOW_ROLE_SPECIFICITY_PATTERN",
          title: "지원 직무를 특정하는 표현(직무명/핵심 역할)이 약함",
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
    title: "이력서 텍스트 밀도/분량 부족",
    category: "G.ResumeStructure",
    severity: "high",
    detect: ({ metrics }) => {
      const len = Number(metrics?.lengths?.combined || 0);
      if (len < THRESH.MIN_COMBINED_LENGTH) {
        const score = clamp((THRESH.MIN_COMBINED_LENGTH - len) / THRESH.MIN_COMBINED_LENGTH + 0.4, 0, 1);
        return _makeFlag({
          id: "LOW_CONTENT_DENSITY_PATTERN",
          title: "내용 분량이 부족해 역량/성과 판단 근거가 약함",
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
    title: "추상적 버즈워드 비중이 높음",
    category: "G.ResumeStructure",
    severity: "mid",
    detect: ({ texts }) => {
      const combined = safeToString(texts?.combined || "");
      const toks = _tokens(combined);
      if (toks.length < 60) return null; // 너무 짧은 문서에서 비율 계산은 오탐

      const buzz = _countMatches(combined, BUZZWORDS);
      const ratio = toks.length > 0 ? buzz / toks.length : 0;

      if (ratio >= THRESH.BUZZWORD_RATIO_HIGH) {
        return _makeFlag({
          id: "HIGH_BUZZWORD_RATIO",
          title: "버즈워드/추상어 비중이 높아 구체성이 떨어짐",
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
    title: "책임 범위가 모호한 표현 다수",
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
          title: "업무/책임 범위가 추상적으로만 표현됨",
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
    title: "진부한 자기소개/비유 표현",
    category: "G.ResumeStructure",
    severity: "low",
    detect: ({ texts }) => {
      const combined = safeToString(texts?.combined || "");
      if (_includesAny(combined, GENERIC_SELF_INTRO_PHRASES)) {
        return _makeFlag({
          id: "GENERIC_SELF_DESCRIPTION_PATTERN",
          title: "진부/클리셰 자기소개 표현이 포함됨",
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
    title: "말끝 흐리기/완곡표현 비중이 높음",
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
          title: "확정/단정 표현이 약하고 완곡 표현이 반복됨",
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
    title: "자신감/주도성 약한 표현 반복",
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
          title: "근거 없는 다짐/수동적 표현이 반복됨",
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
  console.error("[detectStructuralPatterns] called");  // ← 여기
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
      // 어떤 패턴이든 실패하면 전체 분석이 죽지 않게 스킵
    }
  }

  // flags 정렬: severity → score → id
  const sevRank = { low: 1, mid: 2, high: 3, critical: 4 };
  flags.sort((a, b) => {
    const sa = sevRank[a.severity] || 0;
    const sb = sevRank[b.severity] || 0;
    if (sb !== sa) return sb - sa;
    if (b.score !== a.score) return b.score - a.score;
    return safeToString(a.id).localeCompare(safeToString(b.id));
  });

  // 요약 구조(append-only로 analyzer output에 넣기 쉬운 형태)
  const summary = {
    totalFlags: flags.length,
    bySeverity: flags.reduce((acc, f) => {
      const k = f.severity || "mid";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {}),
    // 핵심 지표 일부만
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

// 패턴 정의를 외부에서 참고할 수 있도록 export (UI 설명/툴팁 등에 활용)
export function getStructuralPatternDefinitions() {
  return PATTERN_DEFINITIONS.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    severity: p.severity,
  }));
}

// Age / Education / Salary thresholds (AAE = Age, Academic, Earnings)

// 나이
export const AGE_HIGH = 40; // 경계는 업종/직무별로 달라질 수 있어 보수적으로
export const AGE_VERY_HIGH = 45;

// 학력(간단 게이트 감지용)
export const EDUCATION_MIN_LEVEL = "bachelor";
// 허용: "highschool" | "associate" | "bachelor" | "master" | "phd"

// 연봉(불일치 감지용)
export const SALARY_GAP_RATIO_HIGH = 0.25; // 기대연봉이 상한보다 25%↑면 위험 신호
export const SALARY_GAP_RATIO_LOW = 0.25;  // 기대연봉이 하한보다 25%↓면 '언더셀링/레벨미스' 신호(선택)
