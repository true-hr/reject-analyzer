// PASSMAP JD Expectation Engine v1
// append-only 신규 파일 — 기존 구조 변경 없음
// 출력: parseJdExpectation(jdModel, parsedJD, jdText) → JdExpectation

import { inferDomainTextFamily } from "../decision/roleOntology/domainTextMap.js";

// ─────────────────────────────────────────────────────────────
// 로컬 직급 정규화 (normalizeRoleLevel 재구현 — roleLevelMismatchRisk.js 비공개)
// ─────────────────────────────────────────────────────────────
function _normalizeRoleLevel(v) {
  const s = String(v || "").toLowerCase();
  if (!s) return "unknown";
  if (/(director|head|vp|c-level|exec|executive|총괄|사업부장|본부장|임원)/i.test(s)) return "head_director";
  if (/(manager|mgr|group\s*lead|팀장|매니저|파트장)/i.test(s)) return "manager";
  if (/(lead|team[_\s-]*lead|tech\s*lead|리드|선임|시니어|senior|staff)/i.test(s)) return "lead";
  if (/(ic|individual|junior|associate|주임|사원|인턴)/i.test(s)) return "ic";
  const m =
    s.match(/(?:^|[^a-z])(l|lv|level)\s*([0-9]{1,2})(?:$|[^a-z0-9])/i) ||
    s.match(/^([0-9]{1,2})$/);
  if (m) {
    const n = Number(m[2] ?? m[1]);
    if (Number.isFinite(n)) {
      if (n >= 7) return "head_director";
      if (n >= 5) return "manager";
      if (n >= 4) return "lead";
      return "ic";
    }
  }
  return "unknown";
}

// ─────────────────────────────────────────────────────────────
// 묵시적 seniority/scope 신호 패턴
// high:   총괄/오너십/전략수립/의사결정/전사/사업부
// medium: 유관부서 협업/stakeholder/프로젝트 주도
// execution: 수행/운영/지원/관리/실무
// ─────────────────────────────────────────────────────────────
const _SIGNALS = {
  ownership:
    /총괄|오너십|ownership|의사결정|decision[\s-]?making|방향\s*수립|전략\s*수립|전략적|설계|architected|owned|led\b|주도|책임/i,
  strategy:
    /전략|strategy|strategic|roadmap|로드맵|방향성|방향\s*수립|비전|vision|중장기/i,
  decision:
    /의사결정|결정권|decision|승인|approval|판단|권한/i,
  leadership:
    /리딩|리드|leading|팀\s*리드|조직\s*관리|인력\s*관리|채용|hiring|팀\s*빌딩|team\s*building|mentoring|코칭/i,
  crossFunctional:
    /유관부서|cross[\s-]?functional|stakeholder|협업|coordination|협의|business\s*partner|파트너십/i,
  execution:
    /수행|운영|지원|관리|실무|담당|처리|execute|implement|운용/i,
};

function _scanText(texts, pattern) {
  const combined = texts.filter(Boolean).join(" ");
  return pattern.test(combined);
}

// buckets 우선순위: mustHave(1.0) > coreTasks(0.9) > tools(0.8) > preferred(0.5)
function _collectTexts(jdModel, parsedJD, jdText, buckets) {
  const out = [];
  if (buckets.includes("mustHave")) {
    if (Array.isArray(jdModel?.mustHave)) out.push(...jdModel.mustHave);
    else if (Array.isArray(parsedJD?.mustHave)) out.push(...parsedJD.mustHave);
  }
  if (buckets.includes("coreTasks")) {
    if (Array.isArray(jdModel?.responsibilities)) out.push(...jdModel.responsibilities);
    if (Array.isArray(parsedJD?.coreTasks)) out.push(...parsedJD.coreTasks);
  }
  if (buckets.includes("tools")) {
    const tools = Array.isArray(jdModel?.tools)
      ? jdModel.tools.map((t) => (typeof t === "string" ? t : t?.name || ""))
      : Array.isArray(parsedJD?.tools)
      ? parsedJD.tools
      : [];
    out.push(...tools);
  }
  if (buckets.includes("preferred")) {
    if (Array.isArray(jdModel?.preferred)) out.push(...jdModel.preferred);
    else if (Array.isArray(parsedJD?.preferred)) out.push(...parsedJD.preferred);
  }
  if (buckets.includes("jdText") && jdText) out.push(jdText);
  return out.filter(Boolean);
}

// ─────────────────────────────────────────────────────────────
// targetSeniority 판단
// explicit > implicit, 신호 1개만으로 과상향 금지
// ─────────────────────────────────────────────────────────────
function _inferTargetSeniority(jdModel, parsedJD, jdText) {
  const reasons = [];
  let level = null;
  let confidence = 0;

  // 1. explicit: jdModel.experienceYears
  const expYears = jdModel?.experienceYears;
  if (expYears && typeof expYears === "object" && expYears.min != null) {
    const y = Number(expYears.min);
    if (Number.isFinite(y)) {
      if (y >= 10) {
        level = "head_director"; confidence += 0.5;
        reasons.push(`경력 ${y}년 이상 요구`);
      } else if (y >= 7) {
        level = "manager"; confidence += 0.4;
        reasons.push(`경력 ${y}년 이상 요구`);
      } else if (y >= 4) {
        level = "lead"; confidence += 0.4;
        reasons.push(`경력 ${y}년 이상 요구`);
      } else {
        level = "ic"; confidence += 0.3;
        reasons.push(`경력 ${y}년 이상 요구`);
      }
    }
  }

  // 2. explicit: jobTitle → normalizeRoleLevel
  const jobTitle = parsedJD?.jobTitle || "";
  if (jobTitle) {
    const titleLevel = _normalizeRoleLevel(jobTitle);
    if (titleLevel !== "unknown") {
      const titleConf = { head_director: 0.5, manager: 0.4, lead: 0.3, ic: 0.2 };
      confidence += titleConf[titleLevel] || 0;
      if (!level || titleLevel === "head_director" || titleLevel === "manager") {
        level = titleLevel;
      }
      reasons.push(`직무명 직급 신호: ${jobTitle} → ${titleLevel}`);
    }
  }

  // 3. implicit: mustHave + coreTasks 텍스트 신호 조합
  const allTexts = _collectTexts(jdModel, parsedJD, jdText, [
    "mustHave", "coreTasks", "preferred", "jdText",
  ]);
  const hasOwnership  = _scanText(allTexts, _SIGNALS.ownership);
  const hasStrategy   = _scanText(allTexts, _SIGNALS.strategy);
  const hasDecision   = _scanText(allTexts, _SIGNALS.decision);
  const hasLeadership = _scanText(allTexts, _SIGNALS.leadership);

  let implicitScore = 0;
  if (hasOwnership)  { implicitScore += 3; reasons.push("총괄/오너십/전략수립 표현 감지"); }
  if (hasStrategy)   { implicitScore += 2; reasons.push("전략/로드맵/방향수립 표현 감지"); }
  if (hasDecision)   { implicitScore += 2; reasons.push("의사결정/결정권 표현 감지"); }
  if (hasLeadership) { implicitScore += 2; reasons.push("리딩/팀관리/채용 표현 감지"); }

  // 신호 1개만으로 과상향 금지: score 5 이상(2가지 조합) → manager, 3 이상 → lead
  if (implicitScore >= 5 && (!level || level === "ic" || level === "lead")) {
    level = "manager";
    confidence = Math.min(1, confidence + 0.3);
  } else if (implicitScore >= 3 && (!level || level === "ic")) {
    level = "lead";
    confidence = Math.min(1, confidence + 0.2);
  }

  if (!level) {
    level = "ic";
    confidence = 0.1;
    reasons.push("직급 신호 없음 — ic 기본값");
  }

  return {
    level,
    confidence: Math.round(Math.min(1, Math.max(0, confidence)) * 100) / 100,
    reasons,
  };
}

// ─────────────────────────────────────────────────────────────
// roleScope 판단
// org > cross_functional > team > individual
// ─────────────────────────────────────────────────────────────
function _inferRoleScope(jdModel, parsedJD, jdText) {
  const reasons = [];
  let level = null;
  let confidence = 0;

  const allTexts = _collectTexts(jdModel, parsedJD, jdText, [
    "mustHave", "coreTasks", "preferred", "jdText",
  ]);
  const combined = allTexts.join(" ");

  const OrgPattern =
    /전사|사업부|본부|조직\s*전체|org[\s-]?wide|company[\s-]?wide|전략\s*방향|방향\s*수립/i;
  const CrossPattern =
    /유관부서|cross[\s-]?functional|stakeholder|협업|코디네이션|coordination|business\s*partner/i;
  const TeamPattern =
    /팀\s*관리|팀\s*리드|팀원|채용|hiring|coaching|코칭|mentoring/i;

  const hasExecution = _scanText(allTexts, _SIGNALS.execution);

  if (OrgPattern.test(combined)) {
    level = "org"; confidence = 0.7;
    reasons.push("전사/사업부/조직 전체 범위 표현 감지");
  } else if (CrossPattern.test(combined)) {
    level = "cross_functional"; confidence = 0.6;
    reasons.push("유관부서 협업/stakeholder 표현 감지");
  } else if (TeamPattern.test(combined)) {
    level = "team"; confidence = 0.5;
    reasons.push("팀 관리/리딩 표현 감지");
  } else if (hasExecution) {
    level = "individual"; confidence = 0.4;
    reasons.push("실무/수행 중심 표현 감지");
  } else {
    level = "individual"; confidence = 0.2;
    reasons.push("scope 신호 없음 — individual 기본값");
  }

  return {
    level,
    confidence: Math.round(confidence * 100) / 100,
    reasons,
  };
}

// ─────────────────────────────────────────────────────────────
// requirementPriority: critical / important / supporting
// weight 질서: mustHave(1.0) > coreTasks+must-tools(0.9) > preferred+nice-tools(0.5)
// ─────────────────────────────────────────────────────────────
function _buildRequirementPriority(jdModel, parsedJD) {
  const mustHave = Array.isArray(jdModel?.mustHave)
    ? jdModel.mustHave
    : Array.isArray(parsedJD?.mustHave)
    ? parsedJD.mustHave
    : [];

  const coreTasks = Array.isArray(jdModel?.responsibilities)
    ? jdModel.responsibilities
    : Array.isArray(parsedJD?.coreTasks)
    ? parsedJD.coreTasks
    : [];

  const mustTools = Array.isArray(jdModel?.tools)
    ? jdModel.tools
        .filter((t) => typeof t === "object" && t?.bucket === "must")
        .map((t) => t.name || "")
        .filter(Boolean)
    : [];

  const preferred = Array.isArray(jdModel?.preferred)
    ? jdModel.preferred
    : Array.isArray(parsedJD?.preferred)
    ? parsedJD.preferred
    : [];

  const niceTools = Array.isArray(jdModel?.tools)
    ? jdModel.tools
        .filter((t) => !(typeof t === "object" && t?.bucket === "must"))
        .map((t) => (typeof t === "string" ? t : t?.name || ""))
        .filter(Boolean)
    : Array.isArray(parsedJD?.tools)
    ? parsedJD.tools
    : [];

  return {
    critical:   [...new Set(mustHave)].filter(Boolean).slice(0, 8),
    important:  [...new Set([...coreTasks, ...mustTools])].filter(Boolean).slice(0, 8),
    supporting: [...new Set([...preferred, ...niceTools])].filter(Boolean).slice(0, 6),
  };
}

// ─────────────────────────────────────────────────────────────
// domainExpectation
// 1순위: parsedJD.domainKeywords (AI 추출)
// 2순위: inferDomainTextFamily fallback
// ─────────────────────────────────────────────────────────────
function _buildDomainExpectation(jdModel, parsedJD, jdText) {
  const jdModelDomains = Array.isArray(jdModel?.domainKeywords)
    ? jdModel.domainKeywords.filter(Boolean)
    : [];
  if (jdModelDomains.length > 0) {
    return { domains: jdModelDomains.slice(0, 6), source: "jdModel.domainKeywords", confidence: 0.75 };
  }

  // 1. AI 추출 domainKeywords 우선
  const aiDomains = Array.isArray(parsedJD?.domainKeywords)
    ? parsedJD.domainKeywords.filter(Boolean)
    : [];
  if (aiDomains.length > 0) {
    return { domains: aiDomains.slice(0, 6), source: "parsedJD.domainKeywords", confidence: 0.8 };
  }

  // 2. inferDomainTextFamily fallback
  try {
    const domainContext = [
      ...(Array.isArray(parsedJD?.mustHave) ? parsedJD.mustHave : []),
      ...(Array.isArray(parsedJD?.coreTasks) ? parsedJD.coreTasks : []),
      jdText || "",
    ].join(" ");
    const inferred = inferDomainTextFamily(domainContext);
    if (inferred && inferred.family && inferred.family !== "UNKNOWN") {
      return {
        domains: [inferred.family, ...(inferred.hits || []).slice(0, 3)],
        source: "inferDomainTextFamily",
        confidence: Math.round((inferred.confidence || 0.5) * 100) / 100,
      };
    }
  } catch {
    /* fallthrough */
  }

  return { domains: [], source: "none", confidence: 0 };
}

// ─────────────────────────────────────────────────────────────
// signals: 6개 boolean 언어 신호
// ─────────────────────────────────────────────────────────────
function _buildSignals(jdModel, parsedJD, jdText) {
  const allTexts = _collectTexts(jdModel, parsedJD, jdText, [
    "mustHave", "coreTasks", "preferred", "jdText",
  ]);
  return {
    hasOwnershipLanguage:       _scanText(allTexts, _SIGNALS.ownership),
    hasStrategyLanguage:        _scanText(allTexts, _SIGNALS.strategy),
    hasDecisionLanguage:        _scanText(allTexts, _SIGNALS.decision),
    hasLeadershipLanguage:      _scanText(allTexts, _SIGNALS.leadership),
    hasCrossFunctionalLanguage: _scanText(allTexts, _SIGNALS.crossFunctional),
    hasExecutionLanguage:       _scanText(allTexts, _SIGNALS.execution),
  };
}

// ─────────────────────────────────────────────────────────────
// 공개 API
// ─────────────────────────────────────────────────────────────
const _EMPTY_EXPECTATION = {
  targetSeniority:     { level: null, confidence: 0, reasons: [] },
  roleScope:           { level: null, confidence: 0, reasons: [] },
  requirementPriority: { critical: [], important: [], supporting: [] },
  domainExpectation:   { domains: [], source: "error", confidence: 0 },
  signals: {
    hasOwnershipLanguage:       false,
    hasStrategyLanguage:        false,
    hasDecisionLanguage:        false,
    hasLeadershipLanguage:      false,
    hasCrossFunctionalLanguage: false,
    hasExecutionLanguage:       false,
  },
  meta: { version: "jd-expectation-v1" },
};

export function parseJdExpectation(jdModel, parsedJD, jdText) {
  try {
    return {
      targetSeniority:     _inferTargetSeniority(jdModel, parsedJD, jdText),
      roleScope:           _inferRoleScope(jdModel, parsedJD, jdText),
      requirementPriority: _buildRequirementPriority(jdModel, parsedJD),
      domainExpectation:   _buildDomainExpectation(jdModel, parsedJD, jdText),
      signals:             _buildSignals(jdModel, parsedJD, jdText),
      meta: { version: "jd-expectation-v1" },
    };
  } catch {
    return { ..._EMPTY_EXPECTATION };
  }
}
