// src/lib/semantic/match.js
// JD/이력서 문장 의미매칭(Top-K) - 임베딩 기반

import { embedText } from "./embedding.js";
// ✅ PATCH R40 (append-only): procurement/SCM taxonomy + tool taxonomy
import { PROCUREMENT_SCM_DOMAINS, PROCUREMENT_ANCHOR_RE } from "./taxonomy/domainTaxonomy.js";
import { HR_VERTICAL_DOMAINS } from "./taxonomy/hrTaxonomy.js";
import { TOOL_TAXONOMY } from "./taxonomy/toolTaxonomy.js";

export function splitToUnits(text, { maxUnits = 140, isJd = false } = {}) {
  // ✅ PATCH ROUND 13 (append-only): JD noise filter helpers
  function __normalizeUnitLine(s) {
    return s
      .replace(/^[\-\•\·\*\s]+/, "")
      .replace(/^(\d+\.)\s*/, "")
      .replace(/\s+/g, " ")
      .trim();
  }
  function __isLikelyJdNoiseLine(s, original) {
    // bullet prefix가 original에 있으면 noise 판단 안 함
    if (/^[\s]*[\-\•\·\*]/.test(original) || /^[\s]*\d+\./.test(original)) return false;
    // 보수 규칙: 짧은 업무명 종결어로 끝나는 경우 noise 아님
    // 예: "Payroll 운영", "급여 정산", "4대보험 신고", "HRIS 관리"
    const __TASK_ENDINGS = ["운영", "관리", "정산", "기획", "분석", "신고", "지원", "개선", "구축", "처리", "수립", "대응"];
    if (s.length <= 30 && __TASK_ENDINGS.some(e => s.endsWith(e))) return false;
    // 1) 정확 문구
    const __EXACT = ["이런 일을 합니다", "이런 업무를 합니다", "다음과 같은 업무를 수행합니다", "이런 분을 찾고 있어요"];
    if (__EXACT.some(e => s === e || s === e + ".")) return true;
    // 2) 섹션 소개형
    if (/^주요 업무는|^담당 업무는|^이 포지션은|^본 포지션은|^우리 팀은|^자격요건은|^우대사항은/.test(s)) return true;
    // 3) 헤더성 단문 (정확 일치 또는 콜론)
    const __HEADER = ["담당업무", "주요업무", "자격요건", "우대사항", "지원자격", "필수요건", "주요 역할", "주요 업무", "담당 업무", "Responsibilities", "Requirements", "Preferred"];
    if (__HEADER.some(w => s === w || s === w + ":")) return true;
    // 4) 설명형 종결
    if (/합니다\.?$|입니다\.?$|드립니다\.?$|됩니다\.?$|수행합니다\.?$|담당합니다\.?$/.test(s)) return true;
    return false;
  }
  function __isLikelySectionHeaderOnly(s) {
    return /^(담당업무|주요업무|자격요건|우대사항|지원자격|필수요건|주요 역할|주요 업무|담당 업무|경력|성과|학력|직무|포지션|responsibilities|requirements|preferred|qualifications|experience)$/i.test(String(s || "").trim());
  }

  const t0 = (text ?? "").toString();
  if (!t0.trim()) return [];

  // 1) 줄 단위 우선
  let parts = t0
    .split(/\r?\n+/)
    .map((x) => x.trim())
    .filter(Boolean);

  // 2) 불릿/구분자 추가 분해
  const out = [];
  for (const p of parts) {
    const __trimmedLine = String(p || "").trim();
    const __isBulletLine = /^[\s]*[\-\•\·\*]/.test(__trimmedLine) || /^[\s]*\d+[.)]/.test(__trimmedLine);
    if (__isBulletLine) {
      const __bulletUnit = __normalizeUnitLine(__trimmedLine);
      if (__bulletUnit.length >= 8 && !__isLikelySectionHeaderOnly(__bulletUnit)) {
        if (!(isJd && __isLikelyJdNoiseLine(__bulletUnit, __trimmedLine))) {
          out.push(__bulletUnit);
          if (out.length >= maxUnits) return out;
          continue;
        }
      }
    }
    // 너무 길면 문장 기호로 추가 분해(한국어도 대체로 마침표/;/: 사용)
    const sub = p
      .split(/(?<=[\.\!\?\;\:])\s+|[\-]\s+/g)
      .map((x) => x.trim())
      .filter(Boolean);

    for (const s of sub) {
      const ss = __normalizeUnitLine(s);
      // 너무 짧은 건 제외
      if (ss.length < 8) continue;
      if (__isLikelySectionHeaderOnly(ss)) continue;
      // ✅ PATCH ROUND 13 (append-only): JD noise filter (isJd=true일 때만 적용)
      if (isJd && __isLikelyJdNoiseLine(ss, s)) continue;
      out.push(ss);
      if (out.length >= maxUnits) return out;
    }
  }
  return out.slice(0, maxUnits);
}

export function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return 0;
  if (a.length !== b.length || a.length === 0) return 0;

  let dot = 0;
  let na = 0;
  let nb = 0;

  for (let i = 0; i < a.length; i++) {
    const x = Number(a[i]);
    const y = Number(b[i]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  if (!denom) return 0;
  return dot / denom;
}

export function isHighQualityJDSentence(sentence) {
  const s = String(sentence || "").trim();
  if (!s) return false;
  if (s.length < 8) return false;

  const compact = s.replace(/\s+/g, "");
  const uiNoiseRe = /(접수기간|기업정보|추천공고|문의|지원방법|마감일|복리후생안내|더보기|공유하기|스크랩|공고원문보기|채용관)/;
  if (compact.length <= 28 && uiNoiseRe.test(compact)) return false;

  // very short header/footer-like fragments
  if (s.length <= 20 && /^(담당업무|주요업무|자격요건|우대사항|지원자격|필수요건|requirements|responsibilities|preferred|qualifications)\:?$/i.test(s)) {
    return false;
  }

  return true;
}

// ✅ PATCH R42 (rewrite): procurement/SCM domain extractor — scored ranking
// Returns enriched meta: { domain, family, primaryDomain, secondaryDomains, matchedEvidence, confidence }
// Scoring: strongPhrase=+10, conceptBundle=+7, alias(w/anchor)=+3, weakPhrase(w/anchor)=+1
function __extractProcurementDomainFromText(rawLower) {
  const __scores = {};
  const __evidence = {};

  for (const entry of PROCUREMENT_SCM_DOMAINS) {
    let score = 0;
    const hits = [];

    // Strong phrase (+10, no anchor required)
    for (const phrase of (entry.strongPhrases || [])) {
      if (rawLower.includes(phrase.toLowerCase())) {
        score += 10;
        hits.push(phrase);
      }
    }

    // Concept bundle (+7, all tokens must co-occur, no anchor required)
    for (const bundle of (entry.conceptBundles || [])) {
      if (bundle.every((tok) => rawLower.includes(tok.toLowerCase()))) {
        score += 7;
        hits.push(bundle.join("+"));
      }
    }

    // Alias match (+3, anchor required)
    const allAliases = [...(entry.aliasesKo || []), ...(entry.aliasesEn || [])];
    if (allAliases.length > 0 && PROCUREMENT_ANCHOR_RE.test(rawLower)) {
      for (const alias of allAliases) {
        if (rawLower.includes(alias.toLowerCase())) {
          score += 3;
          hits.push(alias);
        }
      }
    }

    // Weak phrase (+1, anchor required)
    if (PROCUREMENT_ANCHOR_RE.test(rawLower)) {
      for (const weak of (entry.weakPhrases || [])) {
        if (rawLower.includes(weak.toLowerCase())) {
          score += 1;
          hits.push(`~${weak}`);
        }
      }
    }

    if (score > 0) {
      __scores[entry.domain] = score;
      __evidence[entry.domain] = hits;
    }
  }

  const ranked = Object.entries(__scores).sort((a, b) => b[1] - a[1]);
  if (ranked.length === 0) return null;

  const [primaryDomain, topScore] = ranked[0];
  const secondaryDomains = ranked.slice(1).filter(([, s]) => s >= 3).map(([d]) => d);

  return {
    domain: primaryDomain,
    family: "procurement_scm",
    primaryDomain,
    secondaryDomains,
    matchedEvidence: __evidence[primaryDomain] || [],
    confidence: topScore >= 10 ? "high" : topScore >= 7 ? "medium" : "low",
  };
}

// ✅ PATCH R40 (append-only): tool evidence overlap boost (uses normalized text)
function __getToolOverlapBoost(jdNorm, resumeNorm) {
  let toolBoost = 0;
  for (const { aliases, boostWeight } of TOOL_TAXONOMY) {
    const jdHasTool = aliases.some((a) => jdNorm.includes(a));
    const resumeHasTool = aliases.some((a) => resumeNorm.includes(a));
    if (jdHasTool && resumeHasTool) toolBoost += boostWeight;
  }
  return Math.min(toolBoost, 0.08);
}

// Management-support taxonomy v0:
// - generic support words must not match alone
// - support/admin phrases only count when combined with domain anchors
const __MGMT_SUPPORT_BLOCKED_GENERIC_RE = /^(지원|운영|관리|문서|보고)$/i;
const __MGMT_SUPPORT_NEGATIVE_RE = /(비서|리셉션|receptionist|reception|secretary|office\s*assistant|사무보조|영업지원|sales\s*support|서비스\s*기획|서비스기획|product\s*manager|\bpm\b|\bpo\b)/i;

function __hasBundleAnchor(text, bundles = []) {
  return bundles.some((bundle) =>
    Array.isArray(bundle) && bundle.every((token) => {
      const q = String(token || "").toLowerCase().trim();
      return q && !__MGMT_SUPPORT_BLOCKED_GENERIC_RE.test(q) && text.includes(q);
    })
  );
}

function __extractManagementSupportDomainFromText(rawLower) {
  const text = String(rawLower || "").toLowerCase().trim();
  if (!text) return null;

  const rules = [
    {
      domain: "finance_accounting",
      negatives: [],
      strong: [
        /재무회계|관리회계|재무제표|채권채무|회계\s*결산|월\s*마감|분기\s*마감|전표\s*처리|자금\s*운영/i,
        /\baccounting\b|\bfinance\b|\btreasury\b/i,
      ],
      bundles: [
        ["회계", "결산"],
        ["재무", "제표"],
        ["자금", "운영"],
        ["전표", "처리"],
      ],
    },
    {
      domain: "planning_budget_control",
      negatives: [],
      strong: [
        /경영기획|사업기획|예산\s*편성|예산\s*관리|예실관리|실적관리|실적\s*분석|손익\s*분석|사업\s*계획|경영실적|예산\s*보고|실적\s*보고/i,
        /\bfp&a\b|\bbudget\b|\bforecast\b|\bvariance\b|\bkpi\s*management\b/i,
      ],
      bundles: [
        ["예산", "편성"],
        ["실적", "분석"],
        ["손익", "분석"],
        ["kpi", "관리"],
        ["사업", "계획"],
      ],
    },
    {
      domain: "hr_people_ops",
      negatives: [],
      strong: [
        /인사운영|인사행정|입퇴사|근태|급여\s*정산|4대보험|평가보상|인사총무|온보딩/i,
        /\bpeople\s*ops\b|\bhr\s*operations\b|\bpayroll\b|\bhris\b/i,
      ],
      bundles: [
        ["급여", "정산"],
        ["근태", "관리"],
        ["4대보험", "신고"],
        ["입퇴사", "관리"],
      ],
    },
    {
      domain: "general_affairs_admin",
      negatives: [__MGMT_SUPPORT_NEGATIVE_RE],
      strong: [
        /총무|총무관리|사무행정|행정지원|자산\s*관리|비품\s*관리|시설\s*관리|문서수발|법인차량|복리후생\s*운영/i,
        /\bgeneral\s*affairs\b|\boffice\s*administration\b/i,
      ],
      bundles: [
        ["자산", "관리"],
        ["비품", "관리"],
        ["시설", "관리"],
        ["법인", "차량"],
      ],
    },
    {
      domain: "legal_compliance",
      negatives: [],
      strong: [
        /법무지원|준법지원|법무|준법|컴플라이언스|계약\s*검토|계약검토|규정\s*관리|감사\s*대응|내부통제|개인정보/i,
        /\blegal\b|\bcompliance\b|\bprivacy\b/i,
      ],
      bundles: [
        ["계약", "검토"],
        ["감사", "대응"],
        ["규정", "관리"],
        ["내부", "통제"],
      ],
    },
    {
      domain: "biz_ops_management_support",
      negatives: [__MGMT_SUPPORT_NEGATIVE_RE],
      strong: [
        /경영지원|운영지원|경영진\s*지원|이사회\s*지원|회의체\s*운영|정부지원사업|일정\s*조율|경영진\s*보고|보고체계\s*운영/i,
        /\bmanagement\s*support\b|\bbusiness\s*support\b/i,
      ],
      bundles: [
        ["경영진", "지원"],
        ["이사회", "지원"],
        ["회의체", "운영"],
        ["정부지원사업", "관리"],
      ],
    },
  ];

  for (const rule of rules) {
    if ((rule.negatives || []).some((re) => re.test(text))) continue;
    if ((rule.strong || []).some((re) => re.test(text))) return rule.domain;
    if (__hasBundleAnchor(text, rule.bundles || [])) return rule.domain;
  }

  return null;
}

function __extractHrDomainFromText(rawLower) {
  const text = String(rawLower || "").toLowerCase().trim();
  if (!text) return null;

  const scores = {};
  for (const entry of HR_VERTICAL_DOMAINS) {
    let score = 0;

    for (const phrase of (entry.strongPhrases || [])) {
      if (text.includes(String(phrase).toLowerCase())) score += 4;
    }

    for (const bundle of (entry.conceptBundles || [])) {
      if (Array.isArray(bundle) && bundle.every((tok) => text.includes(String(tok || "").toLowerCase()))) {
        score += 3;
      }
    }

    if (score > 0) scores[entry.domain] = score;
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (ranked.length === 0) return null;
  return ranked[0][0];
}

const __HR_FAMILY_DOMAIN_SET = new Set([
  "hr_operations",
  "hrbp_er",
  "compensation_performance",
  "talent_acquisition",
  "learning_development",
  "hr",
]);

function __isHrFamilyDomain(domain) {
  const d = String(domain || "").trim().toLowerCase();
  return d ? __HR_FAMILY_DOMAIN_SET.has(d) : false;
}

function __isSameHrFamilyDomainPair(jdDomain, resumeDomain) {
  const j = String(jdDomain || "").trim().toLowerCase();
  const r = String(resumeDomain || "").trim().toLowerCase();
  if (!j || !r) return false;
  if (j === "unknown" || r === "unknown") return false;
  return __isHrFamilyDomain(j) && __isHrFamilyDomain(r);
}

const __HR_SEMANTIC_BRIDGE_RULES = [
  ["hr_core", /(hr|인사|people)/i],
  ["talent_ops", /(채용|recruit|hiring|온보딩|onboarding|입사자|면접)/i],
  ["people_data", /(hris|인사\s*데이터|hr\s*데이터|people\s*analytics|데이터\s*기반)/i],
  ["people_relations", /(직원\s*관계|직원\s*문의|employee\s*relations|employee\s*inquir|hr\s*policy|인사\s*정책|조직\s*이슈)/i],
  ["performance_comp", /(성과관리|보상|performance|compensation|total\s*rewards)/i],
  ["org_strategy", /(조직\s*구조|조직\s*진단|인력\s*전략|인사\s*전략|business\s*partner|hrbp|조직\s*리더)/i],
  ["ops_admin", /(인사행정|근태|급여|payroll|people\s*ops|hr\s*operations|인사운영)/i],
];

function __extractHrSemanticBridgeSignals(text) {
  const src = String(text || "").trim();
  if (!src) return [];
  const out = [];
  for (const [key, re] of __HR_SEMANTIC_BRIDGE_RULES) {
    if (re.test(src)) out.push(key);
  }
  return out;
}

function __getHrSameFamilyBridgeMeta(jdText, resumeText, jdDomain, resumeDomain) {
  if (!__isSameHrFamilyDomainPair(jdDomain, resumeDomain)) {
    return { sharedSignals: [], adjacentBridge: false, boost: 0 };
  }
  const jdSignals = __extractHrSemanticBridgeSignals(jdText);
  const rsSignals = __extractHrSemanticBridgeSignals(resumeText);
  const rsSet = new Set(rsSignals);
  const sharedSignals = jdSignals.filter((key) => rsSet.has(key));
  const adjacentBridge =
    jdSignals.some((key) => key === "org_strategy" || key === "performance_comp" || key === "people_relations") &&
    rsSignals.some((key) => key === "talent_ops" || key === "people_data" || key === "ops_admin" || key === "people_relations");
  let boost = 0;
  if (sharedSignals.length >= 2) boost = 0.09;
  else if (sharedSignals.length === 1) boost = 0.07;
  else if (adjacentBridge) boost = 0.05;
  return { sharedSignals, adjacentBridge, boost };
}

export function extractSentenceDomain(sentence) {
  const s = String(sentence || "").toLowerCase();
  if (!s.trim()) return "unknown";

  // ✅ PATCH R40 (append-only): procurement/SCM phrase+alias+concept bundle — checked first
  const __procResult = __extractProcurementDomainFromText(s);
  if (__procResult) return "procurement_scm";

  // ✅ PATCH (append-only): management-support subdomain extractor
  const __mgmtSupportResult = __extractManagementSupportDomainFromText(s);
  if (__mgmtSupportResult) {
    if (__mgmtSupportResult === "hr_people_ops") return "hr_operations";
    return __mgmtSupportResult;
  }

  // ✅ PATCH R54 (append-only): minimal HR subdomain extractor
  const __hrResult = __extractHrDomainFromText(s);
  if (__hrResult) return __hrResult;

  const taxonomy = [
    { domain: "supply_chain", re: /(제조업|제조|생산|공정|글로벌\s*공급망|글로벌\s*소싱|공급망|\bscm\b|물류|구매|조달|소싱)/i },
    { domain: "service_planning", re: /(서비스\s*기획|서비스기획|서비스\s*정책|운영\s*원칙|프로덕트|product|\bpm\b|\bpo\b|요구사항|로드맵)/i },
    { domain: "strategy", re: /(전략기획|사업전략|경영기획|사업\s*계획|사업계획|신사업|\bgtm\b|시장\s*진입\s*전략|growth\s*strategy|go[-\s]?to[-\s]?market)/i },
    { domain: "data_analysis", re: /(\bsql\b|\bbi\b|\bga\b|구글애널리틱스|excel|엑셀|웹\s*분석|전환율|성과\s*개선|대시보드|지표|가설검증|ab\s*test|a\/b\s*test)/i },
    { domain: "marketing", re: /(캠페인|브랜딩|퍼포먼스|\bcrm\b)/i },
    { domain: "hr", re: /(채용|평가|노무|온보딩|조직문화)/i },
    { domain: "operations", re: /(현장관리|스케줄|운영관리|오퍼레이션)/i },
    { domain: "finance", re: /(재무|회계|결산|예산|손익|세무)/i },
    { domain: "sales", re: /(영업|세일즈|수주|리드관리|account\s*executive|\bbd\b)/i },
  ];

  const matchedDomains = [];
  for (const rule of taxonomy) {
    if (rule.re.test(s)) matchedDomains.push(rule.domain);
  }
  if (matchedDomains.length === 1) return matchedDomains[0];
  if (
    matchedDomains.includes("sales") &&
    matchedDomains.every((domain) => domain === "sales" || domain === "data_analysis")
  ) {
    return "sales";
  }
  if (matchedDomains.length === 0) return "unknown";
  return "unknown";
}

export function isDomainCompatible(jdDomain, resumeDomain) {
  const j = String(jdDomain || "unknown");
  const r = String(resumeDomain || "unknown");
  if (j === "unknown" || r === "unknown") return true;
  if (__isSameHrFamilyDomainPair(j, r)) return true;
  return j === r;
}

export function isSemanticScoreAcceptable(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return false;
  return n >= 0.75;
}

export function isGenericSemanticSentence(line) {
  const s = String(line || "").trim();
  if (!s) return true;
  const t = s.toLowerCase();

  const headlineTokenMatches = t.match(/채용|모집|경력직|신입|인턴|팀장\/팀원|팀장|팀원|담당자|부문|포지션|직군/g) || [];
  const hasRecruitVerb = /(채용|모집)/.test(t);
  const hasHeadlineRole = /(경력직|신입|인턴|팀장\/팀원|팀장|팀원|담당자|부문|포지션|직군)/.test(t);
  if (s.length <= 48 && hasRecruitVerb && hasHeadlineRole) return true;
  if (s.length <= 52 && headlineTokenMatches.length >= 3) return true;

  const specificRe = /(로드맵|서비스\s*정책|서비스\s*운영\s*원칙|와이어프레임|\bgtm\b|시장\s*진입\s*전략|\bkpi\b|핵심\s*성과|\bsql\b|\bcrm\b|\berp\b|고객\s*관계\s*관리|전사\s*자원\s*관리|협업\s*문서|\bconfluence\b|\bjira\b|지라\s*이슈|\bpower\s*bi\b|\btableau\b|리텐션|유지율|a\/b\s*테스트|ab\s*test|사용자\s*데이터|경쟁사\s*분석|경영진\s*보고|현장관리|스케줄|물류|운영관리|오퍼레이션)/i;
  if (specificRe.test(t)) return false;

  const genericMatches = t.match(/관리|지원|대응|협업|개선|운영|조정|요청사항|프로세스|커뮤니케이션/g) || [];
  if (genericMatches.length >= 2) return true;
  if (genericMatches.length >= 1 && s.length <= 30) return true;

  return false;
}

export function shouldAllowUnknownSafePair(jdText, resumeText, jdDomain, resumeDomain) {
  const j = String(jdDomain || "unknown");
  const r = String(resumeDomain || "unknown");
  const __lexicalOverlap = __getSharedSemanticTokens(jdText, resumeText);
  const __anchorOverlap = __getSharedSemanticDomainAnchors(jdText, resumeText);
  const __jdAnchors = __extractSemanticDomainAnchors(jdText);

  if (j !== "unknown" && r !== "unknown") return true;

  const jdGeneric = isGenericSemanticSentence(jdText);
  const rsGeneric = isGenericSemanticSentence(resumeText);

  if (j === "unknown" && r === "unknown") {
    // both unknown: only pass when both sides are not generic
    if (__lexicalOverlap.length === 0 && __anchorOverlap.length === 0) return false;
    return !(jdGeneric || rsGeneric);
  }

  // ✅ PATCH R40 (append-only): procurement_scm added to strictKnown
  const strictKnown = new Set(["service_planning", "strategy", "data_analysis", "marketing", "operations", "supply_chain", "procurement_scm"]);
  if (j !== "unknown" && r === "unknown") {
    if (__jdAnchors.length > 0 && __anchorOverlap.length === 0 && __lexicalOverlap.length === 0) return false;
    if (strictKnown.has(j) && rsGeneric) return false;
    return true;
  }
  if (j === "unknown" && r !== "unknown") {
    if (strictKnown.has(r) && jdGeneric) return false;
    return true;
  }

  return true;
}

// append-only: pair-state classifier for semantic acceptance policy
export function getSemanticPairState(jdDomain, resumeDomain) {
  const j = String(jdDomain || "unknown");
  const r = String(resumeDomain || "unknown");
  if (j === "unknown" && r === "unknown") return "unknown-unknown";
  if (j !== "unknown" && r === "unknown") return "known-unknown";
  if (j === "unknown" && r !== "unknown") return "unknown-known";
  if (j === r) return "known-known-match";
  if (__isSameHrFamilyDomainPair(j, r)) return "known-known-same-family";
  return "known-known-mismatch";
}

// append-only: semantic threshold policy v2
export function getSemanticAcceptanceThresholdByPairState(pairState) {
  const p = String(pairState || "unknown-unknown");
  if (p === "known-known-match") return 0.7;
  if (p === "known-known-same-family") return 0.76;
  if (p === "known-unknown") return 0.84;
  if (p === "unknown-known") return 0.84;
  if (p === "known-known-mismatch") return 0.88;
  return 0.8; // unknown-unknown / fallback
}

function __getHrSemanticThresholdAdjustment(jdDomain, resumeDomain, pairState) {
  const j = String(jdDomain || "").trim().toLowerCase();
  const r = String(resumeDomain || "").trim().toLowerCase();
  const p = String(pairState || "").trim().toLowerCase();
  const jIsHr = __isHrFamilyDomain(j);
  const rIsHr = __isHrFamilyDomain(r);
  if (!jIsHr && !rIsHr) return 0;
  if (__isSameHrFamilyDomainPair(j, r)) return -0.08;
  if ((p === "known-unknown" && jIsHr) || (p === "unknown-known" && rIsHr)) return -0.06;
  return 0;
}

// append-only: semantic display policy helpers (UI-only, no matching logic change)
const __SEMANTIC_DOMAIN_BLOCK_SIGNAL_IDS = new Set([
  "GATE__DOMAIN_MISMATCH__JOB_FAMILY",
  "ROLE__DOMAIN_MISMATCH",
  "ROLE__JOB_FAMILY_DIFFERENT",
]);

export function isSemanticDomainBlockSignal(signalId) {
  const id = String(signalId || "").trim().toUpperCase();
  return id ? __SEMANTIC_DOMAIN_BLOCK_SIGNAL_IDS.has(id) : false;
}

export function hasSemanticDomainBlockSignal(signalIds) {
  const arr = Array.isArray(signalIds) ? signalIds : [];
  return arr.some((id) => isSemanticDomainBlockSignal(id));
}

export function getSemanticDisplayThreshold(path) {
  const p = String(path || "").trim().toLowerCase();
  if (p === "background") return 0.78;
  if (p === "precompute") return 0.82;
  return 0.82;
}

export function pickSemanticBestScore(match) {
  const rows = Array.isArray(match?.matches) ? match.matches : [];
  let best = null;
  for (const row of rows) {
    const direct = Number(row?.best?.score);
    if (Number.isFinite(direct)) {
      best = best === null ? direct : Math.max(best, direct);
    }
    const candidates = Array.isArray(row?.candidates) ? row.candidates : [];
    for (const c of candidates) {
      const s = Number(c?.score);
      if (Number.isFinite(s)) {
        best = best === null ? s : Math.max(best, s);
      }
    }
  }
  return Number.isFinite(best) ? best : null;
}

function __normalizeSemanticLexicalText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\bga\b/g, "구글애널리틱스")
    .replace(/\bkpi\b/g, "성과지표")
    .replace(/\bcrm\b/g, "고객관계관리")
    .replace(/고객\s*관계\s*관리/g, "고객관계관리")
    .replace(/전사\s*자원\s*관리\s*시스템/g, "전사적자원관리")
    .replace(/전사\s*자원\s*관리/g, "전사적자원관리")
    .replace(/\berp\b/g, "전사적자원관리")
    .replace(/\bpower\s*bi\b/g, "파워비아이")
    .replace(/\btableau\b/g, "태블로")
    .replace(/\bjira\b/g, "지라이슈")
    .replace(/지라\s*이슈/g, "지라이슈")
    .replace(/\bgtm\b/g, "시장진입전략")
    .replace(/\bconfluence\b/g, "협업문서")
    .replace(/세일즈/g, "영업")
    .replace(/리텐션/g, "유지율")
    .replace(/핵심\s*성과/g, "성과지표")
    .replace(/지표판/g, "대시보드")
    .replace(/보고\s*대시보드/g, "보고서대시보드")
    .replace(/시장\s*진입\s*전략/g, "시장진입전략")
    .trim();
}

function __includesAny(text, needles) {
  return needles.some((needle) => text.includes(needle));
}

function __tokenizeSemanticLexicalWords(text) {
  const src = __normalizeSemanticLexicalText(text);
  const stop = new Set([
    "및", "또는", "통한", "관련", "업무", "경험", "경력", "역량", "기반", "수행", "가능", "이상", "에서", "으로",
  ]);
  return [...new Set(
    src
      .split(/[^\p{L}\p{N}]+/u)
      .map((x) => x.trim())
      .filter((x) => x.length >= 2 && !stop.has(x))
  )];
}

function __getSharedSemanticTokens(a, b) {
  const aa = __tokenizeSemanticLexicalWords(a);
  const bb = new Set(__tokenizeSemanticLexicalWords(b));
  return aa.filter((token) => bb.has(token));
}

function __extractSemanticDomainAnchors(text) {
  const t = __normalizeSemanticLexicalText(text);
  // ✅ PATCH R42 (expanded): full procurement/SCM anchor coverage v2
  const rules = [
    ["manufacturing", /(제조업|제조|생산|공정|전자부품\s*제조|부품\s*조달|원부자재|직접\s*자재|bom|mes|plm)/i],
    ["supply_chain", /(글로벌\s*공급망|공급망|\bscm\b|수급\s*관리|납기\s*관리|supply\s*chain|공급\s*계획)/i],
    ["supply_risk", /(공급\s*리스크|공급망\s*리스크|대체\s*공급처|공급\s*차질|supply\s*risk)/i],
    ["logistics", /(물류|재고\s*관리|logistics|inventory|창고\s*관리)/i],
    ["procurement", /(구매|조달|발주|글로벌\s*소싱|소싱|전략소싱|전략적\s*소싱|소싱\s*전략|간접\s*구매|카테고리\s*관리)/i],
    ["vendor", /(벤더|협력사|공급업체|공급사|vendor|supplier|srm)/i],
    ["negotiation", /(계약\s*협상|단가\s*협상|협상\s*리드|contract\s*negotiation|commercial\s*terms)/i],
    ["cost_reduction", /(원가\s*절감|비용\s*절감|cost\s*reduction|단가\s*절감)/i],
    ["analytics", /(spend\s*analysis|구매\s*kpi|구매\s*데이터\s*분석|ariba|coupa|jaggaer)/i],
  ];
  const out = [];
  for (const [key, re] of rules) {
    if (re.test(t)) out.push(key);
  }
  return out;
}

function __getSharedSemanticDomainAnchors(a, b) {
  const aa = __extractSemanticDomainAnchors(a);
  const bb = new Set(__extractSemanticDomainAnchors(b));
  return aa.filter((token) => bb.has(token));
}

function __isSemanticAnchorGapPair(jdText, resumeText) {
  const jdAnchors = __extractSemanticDomainAnchors(jdText);
  const sharedAnchors = __getSharedSemanticDomainAnchors(jdText, resumeText);
  const lexicalOverlap = __getSharedSemanticTokens(jdText, resumeText);
  return jdAnchors.length > 0 && sharedAnchors.length === 0 && lexicalOverlap.length === 0;
}

function __collectSemanticSignals(text) {
  const t = __normalizeSemanticLexicalText(text);
  return {
    text: t,
    modifiers: {
      performance: t.includes("퍼포먼스"),
      branding: t.includes("브랜딩"),
      strategy: __includesAny(t, ["전략", "로드맵", "시장진입전략"]),
      recruiting: __includesAny(t, ["채용", "리크루팅", "소싱"]),
      crm: t.includes("고객관계관리"),
      b2b: t.includes("b2b"),
      b2c: t.includes("b2c"),
    },
    depth: {
      planning: __includesAny(t, ["기획", "수립", "전략", "세우", "세운", "정의", "설계", "주도"]),
      operations: __includesAny(t, ["운영", "지원", "관리", "실행"]),
      reporting: __includesAny(t, ["집계", "취합", "보고", "작성", "업데이트", "입력", "발송", "공지", "전달"]),
    },
  };
}

function __getSemanticPairAdjustment(jdText, resumeText) {
  const jd = __collectSemanticSignals(jdText);
  const resume = __collectSemanticSignals(resumeText);

  let boost = 0;
  let penalty = 0;

  const conceptGroups = [
    // ✅ PATCH R40 (append-only): procurement/SCM concept groups
    ["전략소싱", ["전략소싱", "전략적 소싱"]],
    ["소싱전략수립", ["전략적 소싱 전략 수립", "소싱 전략 수립"]],
    ["공급업체발굴", ["공급업체 발굴", "글로벌 공급업체 발굴"]],
    ["벤더계약협상", ["벤더 계약 협상", "주요 벤더 계약 협상", "계약 협상"]],
    ["원가절감", ["원가 절감", "원가 절감 전략", "원가 절감 프로젝트"]],
    ["공급망리스크", ["공급망 리스크", "공급망 리스크 관리", "공급 리스크"]],
    ["구매데이터분석", ["구매 데이터 분석", "구매 데이터"]],
    ["협상리드", ["협상 리드", "단가 협상", "계약 협상 리드"]],
    ["공급망관리", ["공급망 관리", "공급망 이슈", "협력사 관리"]],
    ["영업", ["영업"]],
    ["구글애널리틱스", ["구글애널리틱스"]],
    ["성과개선", ["성과 개선", "전환율 개선"]],
    ["인사이트정렬", ["인사이트 도출", "인사이트 제시"]],
    ["고객관계관리", ["고객관계관리"]],
    ["유지율개선", ["유지율 지표 개선", "유지율 개선"]],
    ["전사적자원관리", ["전사적자원관리"]],
    ["정산자동화", ["정산 자동화"]],
    ["파워비아이", ["파워비아이"]],
    ["태블로", ["태블로"]],
    ["대시보드", ["대시보드"]],
    ["지라이슈관리", ["지라이슈 관리", "지라이슈를 관리"]],
    ["시장진입전략", ["시장진입전략"]],
    ["출시계획", ["출시 계획"]],
    ["출시주도", ["출시 계획 리드", "제품 출시 계획을 주도"]],
    ["서비스정책", ["서비스 정책", "서비스 운영 원칙"]],
    ["서비스정책수립", ["서비스 정책 수립", "서비스 운영 원칙을 세우"]],
    ["요구사항문서화", ["요구사항 문서화", "요구사항을 문서로 관리", "요구사항을 문서로 정리"]],
    ["협업문서", ["협업문서"]],
    ["협업체계정비", ["협업 체계 정비", "협업 문서를 정리"]],
    ["브랜드성과보고", ["브랜드 캠페인 성과 분석", "브랜드 마케팅 결과를 분석"]],
    ["보고서작성", ["리포트 작성", "보고서 작성"]],
    ["매출보고구축", ["매출 리포트 구축", "매출 보고 대시보드"]],
    ["성과지표모니터링", ["성과지표 모니터링", "성과지표를 모니터링"]],
  ];

  for (const [, variants] of conceptGroups) {
    const terms = Array.isArray(variants) ? variants : [variants];
    const jdHas = __includesAny(jd.text, terms);
    const resumeHas = __includesAny(resume.text, terms);
    if (jdHas && resumeHas) {
      boost += 0.05;
    }
  }

  if (jd.modifiers.performance && !resume.modifiers.performance) penalty += 0.08;
  if (jd.modifiers.branding && !resume.modifiers.branding) penalty += 0.08;
  if (jd.modifiers.strategy && !resume.modifiers.strategy) penalty += 0.08;
  if (jd.modifiers.recruiting && !resume.modifiers.recruiting) penalty += 0.08;
  if (jd.modifiers.crm && !resume.modifiers.crm) penalty += 0.08;
  if (jd.modifiers.b2b && !resume.modifiers.b2b) penalty += 0.08;
  if (jd.modifiers.b2c && !resume.modifiers.b2c) penalty += 0.08;

  if (jd.depth.planning && !resume.depth.planning && resume.depth.operations) {
    penalty += 0.08;
  }
  if (jd.depth.planning && !resume.depth.planning && resume.depth.reporting) {
    penalty += 0.12;
  }
  if (
    jd.modifiers.strategy &&
    !resume.modifiers.strategy &&
    jd.depth.planning &&
    !resume.depth.planning &&
    resume.depth.operations
  ) {
    penalty += 0.04;
  }
  if (__isSemanticAnchorGapPair(jdText, resumeText)) {
    penalty += 0.18;
  }

  // ✅ PATCH R40 (append-only): tool evidence overlap boost (SAP/ERP/Ariba/Coupa)
  const __toolBoost = __getToolOverlapBoost(jd.text, resume.text);
  boost += __toolBoost;

  return {
    boost: Math.min(boost, 0.18),
    penalty: Math.min(penalty, 0.28),
  };
}

export async function semanticMatchJDResume(jdText, resumeText, opts = {}) {
  // ✅ PATCH (append-only): semantic input post-process helpers
  function __normUnitKey(s) {
    return String(s || "")
      .replace(/\u00A0/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }
  function __dedupeUnits(arr) {
    const src = Array.isArray(arr) ? arr : [];
    const out = [];
    const seen = new Set();
    for (const x of src) {
      const t = String(x || "").trim();
      if (!t) continue;
      const k = __normUnitKey(t);
      if (!k || seen.has(k)) continue;
      seen.add(k);
      out.push(t);
    }
    return out;
  }
  function __isLikelySemanticJdNoiseLine(s) {
    const t = String(s || "").trim();
    if (!t) return false;
    const k = t.replace(/\s+/g, "");
    // conservative: only short portal/ui labels
    if (k.length <= 24 && /^(접수기간|기업정보|추천공고|문의해주세요|채용관|상세요강|지원방법|더보기|공고원문보기|공유하기|스크랩)$/.test(k)) return true;
    if (k.length <= 24 && /(더보기|공유하기|스크랩|문의해주세요|추천공고|공고원문보기)/.test(k)) return true;
    // keep likely JD core headers
    if (/(담당업무|주요업무|자격요건|우대사항|지원자격|필수요건|requirements|responsibilities|qualifications|preferred)/i.test(t)) return false;
    return false;
  }

  // ✅ PATCH (append-only): opts.jdUnits가 있으면 structured units 사용, 없으면 raw split fallback
  let jdUnits =
    Array.isArray(opts?.jdUnits) && opts.jdUnits.length > 0
      ? opts.jdUnits.slice(0, opts?.maxJdUnits ?? 40)
      : splitToUnits(jdText, { maxUnits: opts?.maxJdUnits ?? 40, isJd: true });
  let rsUnits = splitToUnits(resumeText, { maxUnits: opts?.maxResumeUnits ?? 120 });
  // ✅ PATCH (append-only): dedupe inputs right after split/bridge
  jdUnits = __dedupeUnits(jdUnits);
  rsUnits = __dedupeUnits(rsUnits);

  // ✅ PATCH ROUND 4 (append-only): semantic 전용 필터 — 짧은 단어 토큰(sap, excel 등) 제거
  // original jdUnits는 유지, embedding 입력에만 semanticUnits 사용
  function __isValidSemanticUnit(t) {
    if (!t) return false;
    const s = String(t).trim();
    if (!s) return false;
    if (s.length < 5) return false;
    if (!s.includes(" ")) return false;
    return true;
  }
  const semanticUnits = jdUnits.filter(__isValidSemanticUnit);
  // ✅ PATCH ROUND 5 (append-only): semanticUnits가 빈 경우 soft fallback
  // — 모든 jdUnits가 짧은 토큰일 때 recall 0 방지
  const finalSemanticUnits =
    semanticUnits.length > 0
      ? semanticUnits
      : jdUnits
          .map((x) => String(x || "").trim())
          .filter(Boolean)
          .slice(0, Math.min(10, opts?.maxJdUnits ?? 40));
  // ✅ PATCH (append-only): 2nd-pass JD semantic noise filter + dedupe
  const finalSemanticUnitsFiltered = __dedupeUnits(
    finalSemanticUnits.filter((x) => !__isLikelySemanticJdNoiseLine(x))
  );
  const finalSemanticUnitsSafe =
    finalSemanticUnitsFiltered.length > 0 ? finalSemanticUnitsFiltered : finalSemanticUnits;
  const finalJdUnitsForMatch = finalSemanticUnitsSafe.filter(isHighQualityJDSentence);
  const jdUnitsForMatch =
    finalJdUnitsForMatch.length > 0 ? finalJdUnitsForMatch : [];

  if (jdUnitsForMatch.length === 0 || rsUnits.length === 0) {
    return {
      ok: false,
      reason: "insufficient_text",
      jdCount: jdUnits.length,
      resumeCount: rsUnits.length,
      matches: [],
    };
  }

  const embedOpts = {
    device: opts?.device ?? "auto",
    dtype: opts?.dtype ?? "q8",
    useLocalStorageCache: opts?.useLocalStorageCache ?? true,
  };

  // 임베딩 생성(순차/병렬). 너무 많은 병렬은 브라우저 부담  제한 병렬
  const concurrency = Math.max(1, Math.min(4, opts?.concurrency ?? 3));
  async function mapLimit(list, fn) {
    const res = new Array(list.length);
    let idx = 0;
    const workers = new Array(concurrency).fill(0).map(async () => {
      while (idx < list.length) {
        const cur = idx++;
        res[cur] = await fn(list[cur], cur);
      }
    });
    await Promise.all(workers);
    return res;
  }

  const jdEmb = await mapLimit(jdUnitsForMatch, (t) => embedText(t, embedOpts));
  const rsEmb = await mapLimit(rsUnits, (t) => embedText(t, embedOpts));
  const jdDomains = jdUnitsForMatch.map((t) => extractSentenceDomain(t));
  const jdProcurementDomains = jdUnitsForMatch.map((t) => {
    const __procResult = __extractProcurementDomainFromText(String(t || "").toLowerCase());
    if (!__procResult) return [];
    return [__procResult.primaryDomain, ...(__procResult.secondaryDomains || [])]
      .map((domain) => String(domain || "").trim())
      .filter(Boolean);
  });
  const rsDomains = rsUnits.map((t) => extractSentenceDomain(t));
  const __policyStats = {
    acceptedCount: 0,
    blockedByDomainCompatCount: 0,
    blockedByUnknownSafeCount: 0,
    blockedByThresholdCount: 0,
  };

  const topK = Math.max(1, Math.min(8, opts?.topK ?? 4));
  const matches = [];

  for (let i = 0; i < jdUnitsForMatch.length; i++) {
    const a = jdEmb[i];
    if (!a) {
      matches.push({
        jd: jdUnitsForMatch[i],
        candidates: [],
        best: null,
        debug: {
          pairState: null,
          rawBestScore: null,
          appliedThreshold: null,
          acceptedCount: 0,
          blockedReason: "embedding_missing",
        },
      });
      continue;
    }

    const scored = [];
    const __pairDebugRows = [];
    for (let j = 0; j < rsUnits.length; j++) {
      const b = rsEmb[j];
      if (!b) continue;
      const __pairState = getSemanticPairState(jdDomains[i], rsDomains[j]);
      const __thresholdBase = getSemanticAcceptanceThresholdByPairState(__pairState);
      const __hrThresholdAdj = __getHrSemanticThresholdAdjustment(jdDomains[i], rsDomains[j], __pairState);
      const __hrBridgeMeta = __getHrSameFamilyBridgeMeta(jdUnitsForMatch[i], rsUnits[j], jdDomains[i], rsDomains[j]);
      const __threshold = Math.max(__pairState === "known-known-same-family" ? 0.62 : 0.68, __thresholdBase + __hrThresholdAdj);
      const __domainAnchorGap = __isSemanticAnchorGapPair(jdUnitsForMatch[i], rsUnits[j]);
      if (!isDomainCompatible(jdDomains[i], rsDomains[j])) {
        __policyStats.blockedByDomainCompatCount += 1;
        __pairDebugRows.push({
          pairState: __pairState,
          rawScore: null,
          threshold: __threshold,
          accepted: false,
          blockedReason: "domain_compat",
        });
        continue;
      }
      if (!shouldAllowUnknownSafePair(jdUnitsForMatch[i], rsUnits[j], jdDomains[i], rsDomains[j])) {
        __policyStats.blockedByUnknownSafeCount += 1;
        __pairDebugRows.push({
          pairState: __pairState,
          rawScore: null,
          threshold: __threshold,
          accepted: false,
          blockedReason: "unknown_safe",
        });
        continue;
      }
      const __adjustment = __getSemanticPairAdjustment(jdUnitsForMatch[i], rsUnits[j]);
      const __baseScore = cosineSimilarity(a, b);
      const s = Math.max(
        -1,
        Math.min(1, __baseScore + __adjustment.boost + __hrBridgeMeta.boost - __adjustment.penalty)
      );
      if (__domainAnchorGap) {
        __policyStats.blockedByThresholdCount += 1;
        __pairDebugRows.push({
          pairState: __pairState,
          rawScore: s,
          rawBaseScore: __baseScore,
          lexicalBoost: __adjustment.boost,
          hrBridgeBoost: __hrBridgeMeta.boost,
          hrBridgeSignals: __hrBridgeMeta.sharedSignals,
          hrAdjacentBridge: __hrBridgeMeta.adjacentBridge,
          lexicalPenalty: __adjustment.penalty,
          threshold: __threshold,
          accepted: false,
          blockedReason: "domain_anchor_gap",
        });
        continue;
      }
      const __accept = Number.isFinite(Number(s)) && Number(s) >= __threshold;
      if (!__accept) {
        __policyStats.blockedByThresholdCount += 1;
        __pairDebugRows.push({
          pairState: __pairState,
          rawScore: s,
          rawBaseScore: __baseScore,
          lexicalBoost: __adjustment.boost,
          hrBridgeBoost: __hrBridgeMeta.boost,
          hrBridgeSignals: __hrBridgeMeta.sharedSignals,
          hrAdjacentBridge: __hrBridgeMeta.adjacentBridge,
          lexicalPenalty: __adjustment.penalty,
          threshold: __threshold,
          accepted: false,
          blockedReason: "threshold",
        });
        continue;
      }
      __policyStats.acceptedCount += 1;
      __pairDebugRows.push({
        pairState: __pairState,
        rawScore: s,
        rawBaseScore: __baseScore,
        lexicalBoost: __adjustment.boost,
        hrBridgeBoost: __hrBridgeMeta.boost,
        hrBridgeSignals: __hrBridgeMeta.sharedSignals,
        hrAdjacentBridge: __hrBridgeMeta.adjacentBridge,
        lexicalPenalty: __adjustment.penalty,
        threshold: __threshold,
        accepted: true,
        blockedReason: null,
      });
      scored.push({ text: rsUnits[j], score: s });
    }

    scored.sort((x, y) => (y.score - x.score));
    const candidates = scored.slice(0, topK);
    const __acceptedRows = __pairDebugRows.filter((x) => x && x.accepted);
    const __blockedRows = __pairDebugRows.filter((x) => x && !x.accepted);
    const __observedRows = __pairDebugRows
      .filter((x) => x && Number.isFinite(Number(x.rawScore)))
      .slice()
      .sort((a, b) => Number(b.rawScore) - Number(a.rawScore));
    const __bestAccepted = __acceptedRows.length
      ? __acceptedRows.slice().sort((a, b) => (Number(b.rawScore) - Number(a.rawScore)))[0]
      : null;
    const __bestObserved = __observedRows.length ? __observedRows[0] : null;
    const __blockedReason = __blockedRows.length
      ? __blockedRows[0]?.blockedReason || "threshold"
      : (__acceptedRows.length ? null : "no_pairs");

    matches.push({
      jd: jdUnitsForMatch[i],
      candidates,
      best: candidates[0] ?? null,
      debug: {
        pairState: __bestAccepted?.pairState || (__blockedRows[0]?.pairState || null),
        rawBestScore: Number.isFinite(Number(__bestAccepted?.rawScore)) ? Number(__bestAccepted.rawScore) : null,
        rawBaseScore: Number.isFinite(Number(__bestAccepted?.rawBaseScore))
          ? Number(__bestAccepted.rawBaseScore)
          : (Number.isFinite(Number(__blockedRows[0]?.rawBaseScore)) ? Number(__blockedRows[0].rawBaseScore) : null),
        lexicalBoost: Number.isFinite(Number(__bestAccepted?.lexicalBoost))
          ? Number(__bestAccepted.lexicalBoost)
          : (Number.isFinite(Number(__blockedRows[0]?.lexicalBoost)) ? Number(__blockedRows[0].lexicalBoost) : null),
        hrBridgeBoost: Number.isFinite(Number(__bestAccepted?.hrBridgeBoost))
          ? Number(__bestAccepted.hrBridgeBoost)
          : (Number.isFinite(Number(__blockedRows[0]?.hrBridgeBoost)) ? Number(__blockedRows[0].hrBridgeBoost) : null),
        hrBridgeSignals: Array.isArray(__bestAccepted?.hrBridgeSignals)
          ? __bestAccepted.hrBridgeSignals.slice()
          : (Array.isArray(__blockedRows[0]?.hrBridgeSignals) ? __blockedRows[0].hrBridgeSignals.slice() : []),
        hrAdjacentBridge: Boolean(__bestAccepted?.hrAdjacentBridge ?? __blockedRows[0]?.hrAdjacentBridge),
        lexicalPenalty: Number.isFinite(Number(__bestAccepted?.lexicalPenalty))
          ? Number(__bestAccepted.lexicalPenalty)
          : (Number.isFinite(Number(__blockedRows[0]?.lexicalPenalty)) ? Number(__blockedRows[0].lexicalPenalty) : null),
        observedBestScore: Number.isFinite(Number(__bestObserved?.rawScore))
          ? Number(__bestObserved.rawScore)
          : null,
        observedBaseScore: Number.isFinite(Number(__bestObserved?.rawBaseScore))
          ? Number(__bestObserved.rawBaseScore)
          : null,
        appliedThreshold: Number.isFinite(Number(__bestAccepted?.threshold))
          ? Number(__bestAccepted.threshold)
          : (Number.isFinite(Number(__blockedRows[0]?.threshold)) ? Number(__blockedRows[0].threshold) : null),
        acceptedCount: __acceptedRows.length,
        blockedReason: __blockedReason,
      },
    });
  }

  // ✅ PATCH R41 (append-only): semantic evidence summary — explanation-ready meta for upstream
  const __semSummary = (() => {
    try {
      const __accMatches = [];
      const __domainSet = new Set();
      const __hrFineDomainSet = new Set();
      const __procurementFineDomainSet = new Set();
      const __toolsSet = new Set();
      let __domAligned = 0;
      let __toolAligned = 0;
      let __exactTask = 0;
      for (let _i = 0; _i < matches.length; _i++) {
        const _m = matches[_i];
        if (!_m || _m.best === null || !_m.candidates.length) continue;
        __accMatches.push(_m);
        const _jdD = jdDomains[_i];
        if (_jdD && _jdD !== "unknown") {
          __domainSet.add(_jdD);
          if (_m.debug?.pairState === "known-known-match") __domAligned++;
        }
        const _jdHrFine = __extractHrDomainFromText(_m.jd);
        if (_jdHrFine) __hrFineDomainSet.add(_jdHrFine);
        if (_jdD && __HR_FAMILY_DOMAIN_SET.has(String(_jdD || "").trim())) {
          __hrFineDomainSet.add(String(_jdD || "").trim());
        }
        for (const _procDomain of (jdProcurementDomains[_i] || [])) {
          __procurementFineDomainSet.add(_procDomain);
        }
        const _jdNorm = _m.jd.toLowerCase();
        const _rsNorm = (_m.best?.text || "").toLowerCase();
        let _toolHit = false;
        for (const { tool, aliases } of TOOL_TAXONOMY) {
          if (aliases.some((a) => _jdNorm.includes(a)) && aliases.some((a) => _rsNorm.includes(a))) {
            __toolsSet.add(tool);
            _toolHit = true;
          }
        }
        if (_toolHit) __toolAligned++;
        if (Number(_m.best?.score || 0) >= 0.92) __exactTask++;
      }
      const _jdCnt = jdUnitsForMatch.length;
      const _rsCnt = rsUnits.length;
      const _acc = __accMatches.length;
      const _topAcc = [...__accMatches]
        .sort((a, b) => Number(b.best?.score || 0) - Number(a.best?.score || 0))
        .slice(0, 3)
        .map((m) => ({ jd: m.jd, resume: m.best?.text || null, score: Number(m.best?.score || 0) }));
      const _topRej = matches
        .filter((m) => m && m.best === null && Number.isFinite(Number(m.debug?.observedBestScore)))
        .sort((a, b) => Number(b.debug.observedBestScore) - Number(a.debug.observedBestScore))
        .slice(0, 3)
        .map((m) => ({ jd: m.jd, observedBestScore: Number(m.debug.observedBestScore) }));
      return {
        jdItemCount: _jdCnt,
        resumeItemCount: _rsCnt,
        acceptedPairCount: _acc,
        domainAlignedPairCount: __domAligned,
        toolAlignedPairCount: __toolAligned,
        exactTaskPairCount: __exactTask,
        coverageRatio: _jdCnt > 0 ? Math.round((_acc / _jdCnt) * 100) / 100 : 0,
        matchedDomains: [...__domainSet],
        hrFineDomains: [...__hrFineDomainSet],
        procurementFineDomains: [...__procurementFineDomainSet],
        matchedTools: [...__toolsSet],
        topAcceptedPairs: _topAcc,
        topRejectedPairs: _topRej,
      };
    } catch {
      return null;
    }
  })();

  return {
    ok: true,
    model: "Xenova/all-MiniLM-L6-v2",
    device: embedOpts.device,
    dtype: embedOpts.dtype,
    jdCount: jdUnits.length,
    resumeCount: rsUnits.length,
    topK,
    matches,
    // ✅ PATCH R41 (append-only): explanation-ready summary
    summary: __semSummary,
    debug: {
      thresholdPolicy: "semantic_threshold_policy_v2_pair_state",
      acceptedCount: __policyStats.acceptedCount,
      blockedReason: {
        domainCompat: __policyStats.blockedByDomainCompatCount,
        unknownSafe: __policyStats.blockedByUnknownSafeCount,
        threshold: __policyStats.blockedByThresholdCount,
      },
    },
  };
}
