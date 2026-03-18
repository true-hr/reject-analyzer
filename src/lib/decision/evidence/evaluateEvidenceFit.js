import { TOOL_ALIASES, TASK_ALIASES, TOOL_SIMILARITY } from "./evidenceAliases.js";

// --- 텍스트 정규화 ---
function normalizeText(v) {
  return String(v == null ? "" : v)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(text, candidates) {
  const t = normalizeText(text);
  if (!t) return false;
  const arr = Array.isArray(candidates) ? candidates : [];
  for (const c of arr) {
    const q = normalizeText(c);
    if (!q) continue;
    if (t.includes(q)) return true;
  }
  return false;
}

// --- Evidence 강도 감지 (v2) ---
// resume에서 item 매치 위치 주변 컨텍스트로 강도를 판별한다.
// ownership(1.0) > project(0.75) > mention(0.5)
const OWNERSHIP_KEYWORDS = ["총괄", "책임", "리드", "주도", "head", "owned", "led", "설계", "구축", "대표"];
const PROJECT_KEYWORDS = ["프로젝트", "project", "개발", "구현", "수행", "진행", "적용", "운영", "추진"];

function detectEvidenceStrength(resumeText, candidates) {
  const norm = normalizeText(resumeText);
  for (const c of candidates) {
    const q = normalizeText(c);
    if (!q) continue;
    const idx = norm.indexOf(q);
    if (idx === -1) continue;
    // 매치 위치 기준 ±80자 컨텍스트 추출
    const ctx = norm.slice(Math.max(0, idx - 80), Math.min(norm.length, idx + q.length + 80));
    for (const kw of OWNERSHIP_KEYWORDS) {
      if (ctx.includes(normalizeText(kw))) return "ownership";
    }
    for (const kw of PROJECT_KEYWORDS) {
      if (ctx.includes(normalizeText(kw))) return "project";
    }
    return "mention";
  }
  return "mention";
}

const STRENGTH_SCORE = { ownership: 1.0, project: 0.75, mention: 0.5 };

const HRBP_SCOPE_KEYWORDS = {
  strategy: {
    label: "조직 전략",
    keywords: ["조직 전략", "인력 전략", "workforce planning", "headcount planning", "organization strategy", "people strategy"],
  },
  performance: {
    label: "성과관리",
    keywords: ["성과관리", "performance management", "performance review", "평가", "calibration", "kpi", "okr"],
  },
  compensation: {
    label: "보상",
    keywords: ["보상", "compensation", "reward", "total rewards", "salary review", "복리후생"],
  },
  er: {
    label: "ER",
    keywords: ["er", "employee relations", "직원 관계", "노무", "grievance", "구성원 이슈", "조직 이슈"],
  },
  hr_data: {
    label: "HR 데이터",
    keywords: ["hr 데이터", "people analytics", "인사 데이터", "hr analytics", "people data", "hris", "report"],
  },
};

// --- Alias 확장 유틸 ---
function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function toItemText(item) {
  if (typeof item === "string") return item.trim();
  if (!item || typeof item !== "object") return "";
  return String(item.text || item.label || item.title || item.name || "").trim();
}

function aliasCandidatesForItem(itemText, aliasMap) {
  const out = [itemText];
  const itemNorm = normalizeText(itemText);
  const map = aliasMap && typeof aliasMap === "object" ? aliasMap : {};
  for (const [key, aliases] of Object.entries(map)) {
    const group = [key].concat(Array.isArray(aliases) ? aliases : []);
    const normalized = group.map(normalizeText).filter(Boolean);
    const related = normalized.some(
      (token) => itemNorm.includes(token) || token.includes(itemNorm)
    );
    if (related) out.push(...group);
  }
  return Array.from(new Set(out.map((x) => String(x || "").trim()).filter(Boolean)));
}

// --- Similarity partial match (v2) ---
// itemText와 동일 계열의 유사 툴이 resume에 있으면 partial로 인정한다.
function findSimilarInResume(itemText, resumeText, similarityMap, aliasMap) {
  const itemNorm = normalizeText(itemText);
  const map = similarityMap && typeof similarityMap === "object" ? similarityMap : {};
  for (const [key, similars] of Object.entries(map)) {
    const keyNorm = normalizeText(key);
    if (!itemNorm.includes(keyNorm) && !keyNorm.includes(itemNorm)) continue;
    // 관련 계열 발견 → similar 중 resume에 존재하는 것 확인
    for (const s of similars) {
      const sCandidates = aliasCandidatesForItem(s, aliasMap || {});
      if (includesAny(resumeText, sCandidates)) return s;
    }
  }
  return null;
}

// --- Section 평가 (v2) ---
// matched: exact/alias 매치, partial: similarity 매치, missing: 없음
function evaluateSectionV2(items, resumeText, aliasMap, similarityMap) {
  const raw = safeArray(items);
  const section = {
    total: raw.length,
    matched: 0,
    partial: 0,
    missing: [],
    matchedItems: [],
    partialItems: [],
    avgStrength: 0,
  };

  let strengthSum = 0;
  for (const item of raw) {
    const itemText = toItemText(item);
    if (!itemText) continue;
    const candidates = aliasCandidatesForItem(itemText, aliasMap);

    if (includesAny(resumeText, candidates)) {
      section.matched += 1;
      section.matchedItems.push(itemText);
      const strength = detectEvidenceStrength(resumeText, candidates);
      strengthSum += STRENGTH_SCORE[strength] || 0.5;
    } else if (similarityMap && findSimilarInResume(itemText, resumeText, similarityMap, aliasMap)) {
      section.partial += 1;
      section.partialItems.push(itemText);
    } else {
      section.missing.push(itemText);
    }
  }

  section.avgStrength =
    section.matched > 0 ? Math.round((strengthSum / section.matched) * 100) / 100 : 0;

  return section;
}

// --- DOMAIN 평가 (v2) ---
// jdModel.domain 또는 jdModel.jobFamily 기반으로 resume 매치 여부 판별
function __hasResponsibilityKeyword(text) {
  const src = normalizeText(text);
  if (!src) return false;
  return [
    "ownership", "owner", "오너", "책임", "총괄", "주도", "리드", "lead",
    "strategy", "strategic", "전략", "planning", "기획", "설계", "partner",
    "business partner", "조직", "성과", "보상", "er", "employee relations",
    "policy", "정책", "cross functional", "협업", "조율", "의사결정", "decision",
  ].some((token) => src.includes(normalizeText(token)));
}

function __mapResponsibilityGapArea(raw) {
  const src = normalizeText(raw);
  if (!src) return null;
  if (
    src.includes("strategy") ||
    src.includes("strategic") ||
    src.includes("planning") ||
    src.includes("기획") ||
    src.includes("전략") ||
    src.includes("headcount") ||
    src.includes("workforce")
  ) return "strategic_planning";
  if (
    src.includes("partner") ||
    src.includes("business partner") ||
    src.includes("employee relations") ||
    src.includes("er") ||
    src.includes("직원 관계") ||
    src.includes("조직 지원")
  ) return "partnership";
  if (
    src.includes("policy") ||
    src.includes("정책") ||
    src.includes("compensation") ||
    src.includes("performance") ||
    src.includes("보상") ||
    src.includes("성과")
  ) return "policy_ownership";
  if (
    src.includes("analytics") ||
    src.includes("hris") ||
    src.includes("report") ||
    src.includes("data") ||
    src.includes("decision") ||
    src.includes("의사결정")
  ) return "decision_support";
  if (
    src.includes("cross functional") ||
    src.includes("cross-functional") ||
    src.includes("협업") ||
    src.includes("조율") ||
    src.includes("org") ||
    src.includes("전사")
  ) return "cross_function_scope";
  if (
    src.includes("team") ||
    src.includes("조직") ||
    src.includes("리더") ||
    src.includes("lead") ||
    src.includes("scope") ||
    src.includes("범위")
  ) return "team_or_org_scope";
  return null;
}

function __levelFromGapSignals(score) {
  const n = Number(score || 0);
  if (n >= 4) return "high";
  if (n >= 2.5) return "moderate";
  if (n >= 1) return "low";
  return "none";
}

function __formatResponsibilityGapAreaLabels(gapAreas) {
  const map = {
    strategic_planning: "전략/기획 범위",
    partnership: "파트너링/조직 대응 범위",
    policy_ownership: "정책/제도 ownership",
    decision_support: "의사결정 지원 근거",
    cross_function_scope: "cross-functional 협업 범위",
    team_or_org_scope: "팀/조직 단위 범위",
  };
  return safeArray(gapAreas)
    .map((item) => String(map[item] || "").trim())
    .filter(Boolean)
    .slice(0, 3);
}

function __buildResponsibilityOverlay({
  model,
  result,
  resumeText,
  coreTaskItems,
}) {
  const meta = result && typeof result.meta === "object" ? result.meta : {};
  const __resumeNorm = normalizeText(resumeText);
  const __domainSeeds = []
    .concat(safeArray(model?.domain))
    .concat(safeArray(model?.jobFamily))
    .map((item) => toItemText(item))
    .filter(Boolean)
    .join(" ");
  const __jdFamilyNorm = normalizeText([
    __domainSeeds,
    safeArray(model?.coreTasks).map((item) => toItemText(item)).join(" "),
    safeArray(model?.mustHave).map((item) => toItemText(item)).join(" "),
  ].join(" "));
  const __hrFamilyInferred =
    (meta.hrFamilyFit === true) ||
    (
      ["hr", "인사", "people", "hrbp", "recruit", "talent"].some((token) => __jdFamilyNorm.includes(normalizeText(token))) &&
      ["hr", "인사", "people ops", "hr operations", "recruit", "talent acquisition", "채용"].some((token) => __resumeNorm.includes(normalizeText(token)))
    );
  const __procurementFamilyInferred =
    (meta.procurementFamilyFit === true) ||
    (
      ["procurement", "purchasing", "sourcing", "구매", "조달"].some((token) => __jdFamilyNorm.includes(normalizeText(token))) &&
      ["procurement", "purchasing", "sourcing", "구매", "조달", "발주", "sap"].some((token) => __resumeNorm.includes(normalizeText(token)))
    );
  const familyAligned = __hrFamilyInferred || __procurementFamilyInferred ? true : null;
  const gapAreas = [];
  const __pushGapArea = (value) => {
    const mapped = __mapResponsibilityGapArea(value);
    if (mapped) gapAreas.push(mapped);
  };

  safeArray(meta.hrGapAreas).forEach(__pushGapArea);
  safeArray(meta.hrScopeMissing).forEach(__pushGapArea);
  safeArray(meta.criticalMissingItems).forEach((item) => {
    if (__hasResponsibilityKeyword(item)) __pushGapArea(item);
  });
  safeArray(coreTaskItems).forEach((item) => {
    const text = toItemText(item);
    if (__hasResponsibilityKeyword(text)) __pushGapArea(text);
  });
  safeArray(model?.mustHave).forEach((item) => {
    const text = toItemText(item);
    if (__hasResponsibilityKeyword(text)) __pushGapArea(text);
  });

  if (String(meta.roleScope || "").trim() === "cross_functional") {
    gapAreas.push("cross_function_scope");
  }
  if (String(meta.roleScope || "").trim() === "org" || String(meta.targetSeniority || "").trim() === "head_director") {
    gapAreas.push("team_or_org_scope");
  }

  const uniqGapAreas = Array.from(new Set(gapAreas)).slice(0, 6);
  const strategicGap =
    meta.hrStrategicScopeGap === true ||
    uniqGapAreas.includes("strategic_planning") ||
    uniqGapAreas.includes("policy_ownership");
  const scopeGap =
    meta.hrAlignmentGap === true ||
    String(meta.roleScope || "").trim() === "cross_functional" ||
    String(meta.roleScope || "").trim() === "org" ||
    uniqGapAreas.includes("cross_function_scope") ||
    uniqGapAreas.includes("team_or_org_scope");

  const criticalMissingCount = Number(meta.criticalMissingCount || meta.criticalMissing || 0);
  const ownershipSignalScore = (() => {
    let score = 0;
    if (uniqGapAreas.includes("policy_ownership")) score += 1.5;
    if (uniqGapAreas.includes("partnership")) score += 1;
    if (meta.hrTransitionFit === true) score += 1;
    if (meta.hrStrategicScopeGap === true) score += 1;
    if (criticalMissingCount > 0) score += 1;
    if (safeArray(result?.coreTasks?.missing).some((item) => __hasResponsibilityKeyword(item))) score += 1;
    if (safeArray(result?.mustHave?.missing).some((item) => __hasResponsibilityKeyword(item))) score += 1;
    const ownershipStrength = detectEvidenceStrength(String(resumeText || ""), OWNERSHIP_KEYWORDS);
    if (ownershipStrength === "mention") score += 0.5;
    return score;
  })();
  const responsibilitySignalScore = (() => {
    let score = 0;
    if (strategicGap) score += 1.5;
    if (scopeGap) score += 1;
    if (uniqGapAreas.length >= 2) score += 1;
    if (meta.hrTransitionFit === true) score += 1;
    if (criticalMissingCount > 0) score += 0.5;
    if (safeArray(result?.coreTasks?.missing).length > 0) score += 0.5;
    return score;
  })();
  const responsibilityGapLevel = __levelFromGapSignals(responsibilitySignalScore);
  const ownershipGapLevel = __levelFromGapSignals(ownershipSignalScore);
  const __explicitTransitionGap =
    Boolean(String(meta.hrTransitionGap || "").trim()) ||
    meta.hrTransitionFit === true ||
    Boolean(String(meta.hrTransitionType || "").trim());
  const __gapAreaLabels = __formatResponsibilityGapAreaLabels(uniqGapAreas);
  const __emitNarrative =
    (
      familyAligned === true &&
      (responsibilityGapLevel === "moderate" || responsibilityGapLevel === "high")
    ) ||
    __explicitTransitionGap ||
    (
      (ownershipGapLevel === "moderate" || ownershipGapLevel === "high") &&
      uniqGapAreas.length > 0
    );
  const __strongFitProtected =
    responsibilityGapLevel === "low" &&
    ownershipGapLevel === "low" &&
    __explicitTransitionGap !== true;

  const directnessHint = __emitNarrative
    ? (
      String(meta.hrDomainDirectnessHint || meta.domainDirectnessHint || "").trim() ||
      (familyAligned === true && __gapAreaLabels.length > 0
        ? `같은 계열 경험은 보이지만 ${__gapAreaLabels.slice(0, 2).join(", ")} 쪽의 직접 연결은 아직 약합니다.`
        : null)
    )
    : null;
  const proofHint = __emitNarrative
    ? (
      String(meta.hrProofBurdenHint || "").trim() ||
      (__gapAreaLabels.length > 0
        ? `${__gapAreaLabels.slice(0, 2).join(", ")}를 직접 맡았다는 근거를 1~2문장으로 보강하는 편이 안전합니다.`
        : String(meta.proofBurdenHint || "").trim() || null)
    )
    : null;
  const summary = __emitNarrative
    ? (
      String(meta.hrTransitionGap || "").trim() ||
      (
        familyAligned === true && __gapAreaLabels.length > 0
          ? `같은 계열 경험은 읽히지만 목표 역할의 ${__gapAreaLabels.slice(0, 2).join(", ")}는 추가 증명이 필요합니다.`
          : __gapAreaLabels.length > 0
            ? `${__gapAreaLabels.slice(0, 2).join(", ")} 쪽 책임 범위는 추가 증명이 필요합니다.`
            : null
      ) ||
      String(meta.hrScopeHint || meta.scopeHint || "").trim() ||
      String(meta.jdFocusSummary || "").trim() ||
      null
    )
    : null;

  const hasMeaningfulGap =
    familyAligned ||
    responsibilitySignalScore >= 1 ||
    ownershipSignalScore >= 1 ||
    uniqGapAreas.length > 0;

  return {
    familyAligned,
    responsibilityGapLevel: hasMeaningfulGap ? responsibilityGapLevel : "none",
    ownershipGapLevel: hasMeaningfulGap ? ownershipGapLevel : "none",
    strategicGap,
    scopeGap,
    gapAreas: hasMeaningfulGap ? uniqGapAreas : [],
    summary: hasMeaningfulGap && !__strongFitProtected ? summary : null,
    directnessHint: hasMeaningfulGap && !__strongFitProtected ? directnessHint : null,
    proofHint: hasMeaningfulGap && !__strongFitProtected ? proofHint : null,
  };
}

function evaluateDomain(model, resumeNorm) {
  const domains = safeArray(model.domain || model.jobFamily || []);
  if (domains.length === 0) return { skip: true, hardMismatch: false, weakMismatch: false };

  const matched = domains.some((d) => {
    const dNorm = normalizeText(typeof d === "string" ? d : String(d.text || d.label || d || ""));
    return dNorm && resumeNorm.includes(dNorm);
  });

  if (matched) return { skip: false, hardMismatch: false, weakMismatch: false };
  // 미매치: 도메인이 2개 이상이면 hard mismatch로 판단
  if (domains.length >= 2) return { skip: false, hardMismatch: true, weakMismatch: false };
  return { skip: false, hardMismatch: false, weakMismatch: true };
}

// --- Penalty 계산 (v2) ---
// 항목별 누적 후 0~25 clamp
const PENALTY_RATE = {
  // MUST_HAVE: 곡선형 (1개=8, 2개째=+6, 3개+= +4씩, subtotal max=18)
  MUST_HAVE_PARTIAL: 5,   // per item
  TOOL_MISSING: 5,        // per item
  TOOL_PARTIAL: 2,        // per item
  TASK_MISSING: 5,        // per item
  TASK_WEAK: 2,           // per item (partial = weak)
  DOMAIN_WEAK: 3,
  DOMAIN_HARD: 8,
  PREFERRED_MISSING: 1.5, // per item (1~2 범위)
};

// MUST_HAVE missing 곡선: quasi-gate 방지를 위해 누진 체감
// 1개=8, 2개=14, 3개=18, 4개+=18(cap)
function calcMustHaveMissingPenalty(n) {
  if (n <= 0) return 0;
  if (n === 1) return 8;
  if (n === 2) return 14;
  return Math.min(18, 8 + 6 + (n - 2) * 4);
}

function calcPenaltyV2(sections, domainResult) {
  const mhMissingRaw = calcMustHaveMissingPenalty(sections.mustHave.missing.length);
  const mhPartial = sections.mustHave.partial * PENALTY_RATE.MUST_HAVE_PARTIAL;
  // must-have subtotal 상한 18
  const mhSubtotal = Math.min(18, mhMissingRaw + mhPartial);

  const toolMissing = sections.tools.missing.length * PENALTY_RATE.TOOL_MISSING;
  const toolPartial = sections.tools.partial * PENALTY_RATE.TOOL_PARTIAL;
  const taskMissing = sections.coreTasks.missing.length * PENALTY_RATE.TASK_MISSING;
  const taskWeak = sections.coreTasks.partial * PENALTY_RATE.TASK_WEAK;
  const domainMismatch = domainResult?.hardMismatch
    ? PENALTY_RATE.DOMAIN_HARD
    : domainResult?.weakMismatch
    ? PENALTY_RATE.DOMAIN_WEAK
    : 0;
  const preferredMissing = sections.preferred.missing.length * PENALTY_RATE.PREFERRED_MISSING;

  const total =
    mhSubtotal + toolMissing + toolPartial +
    taskMissing + taskWeak + domainMismatch + preferredMissing;

  return {
    penalty: Math.min(25, Math.max(0, Math.round(total))),
    breakdown: {
      mustHaveMissing: Math.round(mhSubtotal),
      toolMissing: Math.round(toolMissing + toolPartial),
      taskWeak: Math.round(taskMissing + taskWeak),
      domainMismatch: Math.round(domainMismatch),
    },
  };
}

// --- 레벨 / 요약 (backward compat) ---
function levelFromScore(overallScore) {
  if (overallScore >= 80) return "strong";
  if (overallScore >= 65) return "good";
  if (overallScore >= 50) return "mixed";
  if (overallScore >= 35) return "weak";
  return "none";
}

function summaryByLevel(level) {
  if (level === "strong") return "JD 핵심 요구조건과 이력서 근거가 전반적으로 잘 맞습니다.";
  if (level === "good") return "JD 요구조건은 대체로 맞지만 일부 핵심 근거가 약합니다.";
  if (level === "mixed") return "JD 핵심 요구사항 중 확인되는 근거와 부족한 근거가 혼재합니다.";
  if (level === "weak") return "JD 핵심 요구사항 대비 근거가 부족한 항목이 적지 않습니다.";
  return "JD에서 요구한 핵심 조건 대비 이력서 근거가 전반적으로 부족합니다.";
}

function scoreByMatched(matched, total) {
  if (!total) return 100;
  return Math.round((Number(matched || 0) / Number(total || 1)) * 100);
}

function __formatHintList(items, max = 2) {
  return safeArray(items)
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, max)
    .join(", ");
}

function __getProcurementDomainNarrative(domainId) {
  const id = String(domainId || "").trim();
  const map = {
    strategic_sourcing: {
      direct: "이력서의 공급업체 발굴·협상·원가절감 경험은 전략소싱 JD의 핵심 축과 직접 연결됩니다.",
      focus: "JD 초점은 전략소싱 방향 설정과 공급업체 발굴·협상 축에 가깝습니다.",
      burden: "소싱 전략 수립, 공급업체 평가, 협상 리딩처럼 전략 깊이가 드러나는 문장을 먼저 제시하는 편이 안전합니다.",
      scope: "단순 운영 지원보다 소싱 방향 설정과 협상 주도 범위가 확인되면 더 직접적인 근거가 됩니다.",
    },
    vendor_management: {
      direct: "공급업체 운영·평가·이슈 대응 경험은 벤더관리형 구매 역할과 직접 맞닿아 있습니다.",
      focus: "JD 초점은 공급업체 운영 안정화와 협력사 관리 축에 가깝습니다.",
      burden: "벤더 평가 기준, 이슈 대응, 협력사 운영 책임 범위를 구체적으로 보여주는 편이 안전합니다.",
      scope: "협력사 커뮤니케이션을 넘어서 평가·운영·개선 책임 범위가 드러나면 설명력이 높아집니다.",
    },
    contract_commercial: {
      direct: "단가·계약조건 협상 경험은 상업조건 협상 중심 JD에서 강한 근거로 읽힐 수 있습니다.",
      focus: "JD 초점은 계약조건 정리와 상업조건 협상 축에 가깝습니다.",
      burden: "단가 조정, 계약조건 정리, 협상 리드 경험을 결과와 함께 제시하면 더 직접적인 근거가 됩니다.",
      scope: "단순 지원보다 계약조건 조율과 협상 주도 범위가 확인되어야 설득력이 높아집니다.",
    },
    cost_management: {
      direct: "원가절감 프로젝트 경험은 구매 성과형 JD에서 직접적인 강점 근거가 됩니다.",
      focus: "JD 초점은 구매 성과 개선과 원가절감 실행 축에 가깝습니다.",
      burden: "절감 과제 선정, 실행 방식, 절감 효과를 함께 제시하면 구매 성과형 JD와 더 직접 연결됩니다.",
      scope: "단순 비용 모니터링보다 절감 과제 ownership과 실행 범위가 드러나는 편이 유리합니다.",
    },
    purchasing_analytics: {
      direct: "구매 데이터 분석과 SAP/ERP 활용 경험은 구매분석·운영형 JD와 직접 연결됩니다.",
      focus: "JD 초점은 구매 데이터 해석과 운영 개선 근거 축에 가깝습니다.",
      burden: "구매 데이터 분석 결과가 의사결정이나 운영 개선으로 이어진 사례를 먼저 보여주는 편이 안전합니다.",
      scope: "리포팅 자체보다 구매 지표 해석과 실행 연결 범위가 드러나면 더 강한 근거가 됩니다.",
    },
    direct_procurement: {
      direct: "원부자재·직접자재 구매 경험은 직접구매 JD의 핵심 업무 축과 직접 연결됩니다.",
      focus: "JD 초점은 생산 연동 자재 조달과 직접구매 운영 축에 가깝습니다.",
      burden: "자재 소싱, 납기·수급 대응, 공급 이슈 조율 경험을 구체적으로 제시하는 편이 안전합니다.",
      scope: "구매 요청 처리보다 생산 연계 조달 책임과 운영 범위가 드러나야 설명력이 높아집니다.",
    },
    manufacturing_materials: {
      direct: "제조·부품 조달 경험은 제조소재형 procurement JD와 직접 연결됩니다.",
      focus: "JD 초점은 제조 연동 자재·부품 조달 축에 가깝습니다.",
      burden: "부품 조달, 제조사 협업, 생산 연계 대응 경험을 구체적으로 보여주면 더 직접적인 근거가 됩니다.",
      scope: "일반 구매보다 제조 일정과 연결된 조달 ownership이 드러나는 편이 유리합니다.",
    },
  };
  return map[id] || null;
}

function createBaseResult() {
  return {
    overallScore: 0,
    level: "none",
    status: "ok",
    penalty: 0,
    breakdown: {
      mustHaveMissing: 0,
      toolMissing: 0,
      taskWeak: 0,
      domainMismatch: 0,
    },
    mustHave: { total: 0, matched: 0, partial: 0, missing: [], matchedItems: [], partialItems: [], avgStrength: 0 },
    preferred: { total: 0, matched: 0, partial: 0, missing: [], matchedItems: [], partialItems: [], avgStrength: 0 },
    tools: { total: 0, matched: 0, partial: 0, missing: [], matchedItems: [], partialItems: [], avgStrength: 0 },
    coreTasks: { total: 0, matched: 0, partial: 0, missing: [], matchedItems: [], partialItems: [], avgStrength: 0 },
    scoreBreakdown: {
      mustHaveScore: 100,
      preferredScore: 100,
      toolScore: 100,
      coreTaskScore: 100,
    },
    signals: [],
    summary: "",
  };
}

// --- 메인 export ---
export function evaluateEvidenceFit({ jdText = "", resumeText = "", jdModel = null, ai = null, jdExpectation = null, semanticEvidenceSummary = null, procurementDomainSummary = null, hrDomainSummary = null } = {}) {
  void jdText;
  void ai;

  const result = createBaseResult();
  const normalizedResume = normalizeText(resumeText);

  if (!normalizedResume) {
    result.overallScore = 100;
    result.penalty = 0;
    result.level = "none";
    result.status = "unavailable";
    result.summary = "resume evidence unavailable";
    return result;
  }

  const model = jdModel && typeof jdModel === "object" ? jdModel : {};
  const mustHaveItems = safeArray(model.mustHave);
  const preferredItems = safeArray(model.preferred);
  const toolItems = safeArray(model.tools);
  const coreTaskItems = (() => {
    const direct = safeArray(model.coreTasks);
    if (direct.length > 0) return direct;
    return safeArray(model.responsibilities);
  })();

  const totalTargets =
    mustHaveItems.length + preferredItems.length + toolItems.length + coreTaskItems.length;

  if (totalTargets === 0) {
    result.overallScore = 100;
    result.penalty = 0;
    result.level = "none";
    result.status = "unavailable";
    result.summary =
      "JD에서 구조화 가능한 요구조건이 충분히 추출되지 않아 증거 적합도 평가는 제한적으로만 반영됩니다.";
    return result;
  }

  const COMMON_ALIASES = { ...TOOL_ALIASES, ...TASK_ALIASES };

  // 섹션별 평가 (TOOL은 similarity 포함, 나머지는 exact/alias)
  result.mustHave = evaluateSectionV2(mustHaveItems, normalizedResume, COMMON_ALIASES, null);
  result.preferred = evaluateSectionV2(preferredItems, normalizedResume, COMMON_ALIASES, null);
  result.tools = evaluateSectionV2(toolItems, normalizedResume, TOOL_ALIASES, TOOL_SIMILARITY);
  result.coreTasks = evaluateSectionV2(coreTaskItems, normalizedResume, TASK_ALIASES, null);

  const domainResult = evaluateDomain(model, normalizedResume);

  // overallScore: partial을 0.5로 환산한 가중 매치율
  const totalMatched =
    result.mustHave.matched + result.preferred.matched +
    result.tools.matched + result.coreTasks.matched;
  const totalPartial =
    result.mustHave.partial + result.preferred.partial +
    result.tools.partial + result.coreTasks.partial;
  const weightedMatched = totalMatched + totalPartial * 0.5;

  result.overallScore = Math.round((weightedMatched / totalTargets) * 100);
  result.level = levelFromScore(result.overallScore);

  // penalty & breakdown 계산
  const { penalty, breakdown } = calcPenaltyV2(
    { mustHave: result.mustHave, preferred: result.preferred, tools: result.tools, coreTasks: result.coreTasks },
    domainResult
  );
  result.penalty = penalty;
  result.breakdown = breakdown;

  // scoreBreakdown (backward compat)
  result.scoreBreakdown = {
    mustHaveScore: scoreByMatched(result.mustHave.matched, result.mustHave.total),
    preferredScore: scoreByMatched(result.preferred.matched, result.preferred.total),
    toolScore: scoreByMatched(result.tools.matched, result.tools.total),
    coreTaskScore: scoreByMatched(result.coreTasks.matched, result.coreTasks.total),
  };

  // signals
  if (result.mustHave.total >= 2 && result.mustHave.matched === 0 && result.mustHave.partial === 0) {
    result.signals.push("ROLE_SKILL__MUST_HAVE_MISSING");
  }
  if (result.tools.total >= 2 && result.tools.matched === 0 && result.tools.partial === 0) {
    result.signals.push("ROLE_SKILL__TOOL_GAP");
  }
  if (domainResult?.hardMismatch) {
    result.signals.push("DOMAIN__HARD_MISMATCH");
  }

  // summary
  const allMissing = []
    .concat(result.mustHave.missing, result.tools.missing, result.coreTasks.missing, result.preferred.missing)
    .filter(Boolean);
  const topMissing = Array.from(new Set(allMissing)).slice(0, 2);
  const baseSummary = summaryByLevel(result.level);
  result.summary =
    topMissing.length > 0
      ? `${baseSummary} 특히 ${topMissing.join(", ")} 경험 근거가 약합니다.`
      : baseSummary;

  // ✅ PATCH (append-only): JD Expectation Engine v1.1 — 해석 품질 보강
  // 판정 뒤집기 X — optional meta + priority hint만 추가
  // 기존 mustHave/preferred/tools/coreTasks/penalty/score 필드 변경 없음
  if (jdExpectation && typeof jdExpectation === "object") {
    try {
      const je = jdExpectation;

      // 1) requirementPriority → mustHave 항목별 priority 분류
      const criticalSet = new Set(
        (je.requirementPriority?.critical || []).map((s) => normalizeText(String(s || "")))
      );
      const importantSet = new Set(
        (je.requirementPriority?.important || []).map((s) => normalizeText(String(s || "")))
      );

      const priorityMap = {};
      for (const item of [
        ...result.mustHave.matchedItems,
        ...result.mustHave.partialItems,
        ...result.mustHave.missing,
      ]) {
        const n = normalizeText(item);
        if (criticalSet.has(n)) priorityMap[item] = "critical";
        else if (importantSet.has(n)) priorityMap[item] = "important";
        else priorityMap[item] = "supporting";
      }

      const criticalMissingItems = result.mustHave.missing.filter(
        (item) => priorityMap[item] === "critical"
      );
      const criticalMissing = criticalMissingItems.length;
      const criticalMatched = result.mustHave.matchedItems.filter(
        (item) => priorityMap[item] === "critical"
      ).length;
      const importantMissingItems = result.mustHave.missing.filter(
        (item) => priorityMap[item] === "important"
      );

      // optional subfield — downstream은 이 필드를 읽지 않음
      result.mustHave.expectationMeta = { priorityMap, criticalMissing, criticalMatched };

      // 2) seniority expectation hint
      // lead/manager/head_director JD인데 avgStrength가 낮으면 hint 추가 (판정 변경 X)
      const seniorityLevel = je.targetSeniority?.level || null;
      const seniorityConf = Number(je.targetSeniority?.confidence || 0);
      const avgStr = Number(result.mustHave.avgStrength || 0);

      let seniorityGapHint = null;
      if (
        (seniorityLevel === "manager" || seniorityLevel === "head_director") &&
        seniorityConf >= 0.4 &&
        result.mustHave.total > 0 &&
        avgStr > 0 && avgStr < 0.65
      ) {
        seniorityGapHint = `JD는 ${seniorityLevel} 수준을 기대하지만 이력서 근거의 오너십/리딩 표현이 약합니다.`;
      }

      // 3) roleScope hint
      // cross_functional/org JD인데 개인 실행 이력서이면 hint 추가
      const scopeLevel = je.roleScope?.level || null;
      const scopeConf = Number(je.roleScope?.confidence || 0);

      let scopeHint = null;
      if (
        (scopeLevel === "cross_functional" || scopeLevel === "org") &&
        scopeConf >= 0.5 &&
        !(je.signals?.hasCrossFunctionalLanguage)
      ) {
        scopeHint = "JD는 유관부서 협업/전사 범위를 기대하지만 이력서에 관련 근거가 약합니다.";
      }

      // 4) requirementPrioritySummary — 설명층 직접 소비용 요약 문장
      let requirementPrioritySummary = null;
      if (criticalMissing > 0) {
        const itemStr = criticalMissingItems.slice(0, 2).join(", ");
        requirementPrioritySummary = itemStr
          ? `JD 핵심 요건 중 ${itemStr} 근거가 이력서에서 확인되지 않습니다.`
          : `JD critical 요건 ${criticalMissing}개의 이력서 근거가 부족합니다.`;
      } else if (importantMissingItems.length > 0) {
        const itemStr = importantMissingItems.slice(0, 2).join(", ");
        requirementPrioritySummary = itemStr
          ? `JD 중요 요건 중 ${itemStr} 근거가 이력서에서 약합니다.`
          : null;
      }

      // result.meta — 기존 createBaseResult()에 없는 신규 optional field
      const supportingItems = safeArray(je.requirementPriority?.supporting).filter(Boolean);
      const supportingSet = new Set(
        supportingItems.map((s) => normalizeText(String(s || ""))).filter(Boolean)
      );
      const preferredMissingItems = safeArray(result?.preferred?.missing);
      const supportingMissingItems = preferredMissingItems.filter(
        (item) => supportingSet.has(normalizeText(item))
      );

      const domainExpectation = je.domainExpectation && typeof je.domainExpectation === "object"
        ? je.domainExpectation
        : {};
      const domainExpectationDomains = safeArray(domainExpectation.domains)
        .map((d) => String(d || "").trim())
        .filter(Boolean)
        .slice(0, 4);
      const domainConfidence = Number(domainExpectation.confidence || 0);

      const seniorityLabelMap = {
        head_director: "상위 리더급",
        manager: "매니저급",
        lead: "리드급",
        ic: "실무자급",
      };
      const scopeLabelMap = {
        org: "전사 범위",
        cross_functional: "유관부서 협업 범위",
        team: "팀 범위",
        individual: "개인 실행 범위",
      };
      const targetSeniorityLabel = seniorityLabelMap[seniorityLevel] || null;
      const roleScopeLabel = scopeLabelMap[scopeLevel] || null;

      let domainDirectnessHint = null;
      if (domainExpectationDomains.length > 0) {
        const domainStr = domainExpectationDomains.slice(0, 2).join(", ");
        domainDirectnessHint =
          domainConfidence >= 0.7
            ? `JD는 ${domainStr} 맥락의 직접 경험을 우선 확인할 가능성이 있습니다.`
            : `JD는 ${domainStr} 관련 맥락을 함께 확인할 가능성이 있습니다.`;
      }

      let directnessBurden = null;
      if (domainExpectationDomains.length > 0) {
        if (criticalMissing > 0) directnessBurden = "high";
        else if (importantMissingItems.length > 0 || supportingMissingItems.length > 0) directnessBurden = "medium";
        else directnessBurden = "normal";
      }

      let supportingPrioritySummary = null;
      if (supportingMissingItems.length > 0) {
        const itemStr = supportingMissingItems.slice(0, 2).join(", ");
        supportingPrioritySummary = itemStr
          ? `보조 요구조건으로는 ${itemStr} 근거를 함께 준비하는 편이 안전합니다.`
          : null;
      } else if (supportingItems.length > 0) {
        const itemStr = supportingItems.slice(0, 2).join(", ");
        supportingPrioritySummary = itemStr
          ? `보조 요구조건은 ${itemStr} 축으로 읽힐 수 있습니다.`
          : null;
      }

      let preferredGapHint = null;
      if (preferredMissingItems.length > 0) {
        const itemStr = preferredMissingItems.slice(0, 2).join(", ");
        preferredGapHint = itemStr
          ? `우대사항 기준에서는 ${itemStr} 연결 근거가 약합니다.`
          : null;
      }

      const focusParts = [];
      if (criticalMissingItems.length > 0) {
        focusParts.push(`핵심은 ${criticalMissingItems.slice(0, 2).join(", ")} 증명입니다.`);
      } else if (importantMissingItems.length > 0) {
        focusParts.push(`중요 요구조건은 ${importantMissingItems.slice(0, 2).join(", ")} 쪽입니다.`);
      }
      if (domainExpectationDomains.length > 0) {
        focusParts.push(`JD 맥락은 ${domainExpectationDomains.slice(0, 2).join(", ")}에 가깝습니다.`);
      }
      if (roleScopeLabel && scopeLevel !== "individual") {
        focusParts.push(`역할 범위는 ${roleScopeLabel} 쪽으로 읽힙니다.`);
      }
      const jdFocusSummary = focusParts.length > 0 ? focusParts.slice(0, 2).join(" ") : null;

      let proofBurdenHint = null;
      if (criticalMissingItems.length > 0) {
        proofBurdenHint = `우선 ${criticalMissingItems.slice(0, 2).join(", ")} 관련 실무 근거를 문장으로 증명해야 합니다.`;
      } else if (targetSeniorityLabel && (seniorityLevel === "manager" || seniorityLevel === "head_director")) {
        proofBurdenHint = `${targetSeniorityLabel} 기대치에 맞는 오너십·리딩 근거를 먼저 보여주는 편이 안전합니다.`;
      } else if (roleScopeLabel && (scopeLevel === "cross_functional" || scopeLevel === "org")) {
        proofBurdenHint = `${roleScopeLabel}에 해당하는 협업·조율 근거를 먼저 보여주는 편이 안전합니다.`;
      } else if (domainExpectationDomains.length > 0) {
        proofBurdenHint = `${domainExpectationDomains.slice(0, 2).join(", ")} 맥락과 직접 연결되는 경험 문장이 필요합니다.`;
      }

      result.meta = {
        jdExpectationApplied: true,
        seniorityGapHint,
        scopeHint,
        targetSeniority: seniorityLevel,
        roleScope: scopeLevel,
        // ✅ PATCH (append-only): criticalMissing 기존 계약(number) 유지
        criticalMissing,
        // ✅ PATCH R33 (append-only): 설명층 소비용 분리 필드 추가
        criticalMissingCount: criticalMissing,
        criticalMissingItems: criticalMissingItems.slice(0, 5),
        requirementPrioritySummary,
        domainDirectnessHint,
        directnessBurden,
        supportingPrioritySummary,
        preferredGapHint,
        jdFocusSummary,
        proofBurdenHint,
        domainExpectationDomains,
        domainExpectationSource: String(domainExpectation.source || "").trim() || null,
        targetSeniorityLabel,
        roleScopeLabel,
      };
    } catch {
      // silent — jdExpectation 소비 실패 시 기존 result 그대로 반환
    }
  }

  // ✅ PATCH R41 (append-only): semantic evidence fit guard
  // acceptedPairs 충분 + domain aligned + tool/exact overlap + coverage 조건 충족 시
  // evidence-based 리스크를 보수적으로 약화. 구조 리스크/critical-missing은 유지.
  if (semanticEvidenceSummary && typeof semanticEvidenceSummary === "object") {
    try {
      const _acc = Number(semanticEvidenceSummary.acceptedPairCount || 0);
      const _dom = Number(semanticEvidenceSummary.domainAlignedPairCount || 0);
      const _tool = Number(semanticEvidenceSummary.toolAlignedPairCount || 0);
      const _exact = Number(semanticEvidenceSummary.exactTaskPairCount || 0);
      const _cov = Number(semanticEvidenceSummary.coverageRatio || 0);

      const _strongFit = _acc >= 3 && _dom >= 1 && (_tool >= 1 || _exact >= 1) && _cov >= 0.4;

      if (_strongFit) {
        if (!Array.isArray(result.signals)) result.signals = [];
        result.signals.push("SEMANTIC_STRONG_FIT");

        // critical missing count — from meta if jdExpectation was applied, else 0
        const _critCount = Number(
          result.meta?.criticalMissing ||
          result.mustHave?.expectationMeta?.criticalMissing ||
          0
        );

        // conservative reduction: max 5 if no critical missing, max 2 if critical missing exists
        const _maxReduct = _critCount > 0 ? 2 : 5;
        const _reduction = Math.min(result.penalty, _maxReduct);
        result.penalty = Math.max(0, result.penalty - _reduction);

        if (result.breakdown && typeof result.breakdown === "object") {
          result.breakdown.semanticEvidenceOffset = -_reduction;
        }

        // remove ROLE_SKILL__MUST_HAVE_MISSING only when no critical-priority items are missing
        if (_critCount === 0) {
          result.signals = result.signals.filter((s) => s !== "ROLE_SKILL__MUST_HAVE_MISSING");
        }

        // ensure meta exists and mark semantic strong fit
        if (!result.meta || typeof result.meta !== "object") result.meta = {};
        result.meta.semanticStrongFit = true;
        result.meta.semanticEvidencePenaltyOffset = -_reduction;
        result.meta.semanticAcceptedPairCount = _acc;
        result.meta.semanticCoverageRatio = _cov;
      }
    } catch {
      // silent — semantic guard failure must not break existing flow
    }
  }

  // ✅ PATCH R43 (append-only): procurement domain concentration guard
  // semanticStrongFit + procurementFamilyFit → meta에 procurement domain 정보 추가
  // LOW_CONTENT_DENSITY_RISK / TASK__CORE_COVERAGE_LOW 계열 신호를 meta flag로 방어 표시
  if (procurementDomainSummary && typeof procurementDomainSummary === "object" && procurementDomainSummary.procurementFamilyFit) {
    try {
      if (!result.meta || typeof result.meta !== "object") result.meta = {};
      const _isStrongFit = result.meta.semanticStrongFit === true;
      const _doms = Array.isArray(procurementDomainSummary.dominantProcurementDomains)
        ? procurementDomainSummary.dominantProcurementDomains : [];
      const _evidenceHints = Array.isArray(procurementDomainSummary.procurementEvidenceHighlights)
        ? procurementDomainSummary.procurementEvidenceHighlights.slice(0, 3) : [];
      const _primaryNarrative = __getProcurementDomainNarrative(_doms[0]);
      const _domLabel = __formatHintList(_doms, 2);
      const _evidenceLabel = __formatHintList(_evidenceHints, 2);
      result.meta.procurementFamilyFit = true;
      result.meta.dominantProcurementDomains = _doms.slice(0, 3);
      result.meta.procurementEvidenceHints = _evidenceHints;
      if (_isStrongFit && _doms.length > 0) {
        result.meta.procurementStrongFit = true;
        if (_primaryNarrative?.direct) {
          result.meta.domainDirectnessHint = _primaryNarrative.direct;
        } else if (_domLabel) {
          result.meta.domainDirectnessHint = `이력서의 procurement 경험은 ${_domLabel} 중심 JD와 직접 연결됩니다.`;
        }
        if (_primaryNarrative?.focus) {
          result.meta.jdFocusSummary = _primaryNarrative.focus;
        } else if (_domLabel) {
          result.meta.jdFocusSummary = `JD 초점은 ${_domLabel} 축에 가깝습니다.`;
        }
        if (_primaryNarrative?.burden) {
          result.meta.proofBurdenHint = _primaryNarrative.burden;
        } else if (_evidenceLabel) {
          result.meta.proofBurdenHint = `${_evidenceLabel} 같은 근거를 성과와 함께 제시하면 procurement 적합성이 더 직접적으로 설명됩니다.`;
        }
        if (_primaryNarrative?.scope) {
          result.meta.scopeHint = _primaryNarrative.scope;
        } else if (_domLabel) {
          result.meta.scopeHint = `${_domLabel} 맥락에서는 단순 지원보다 ownership 범위가 드러나는 편이 유리합니다.`;
        }
        // suppress generic content/coverage signals that are unreliable for procurement strong-fit
        const _SUPPRESS = ["LOW_CONTENT_DENSITY_RISK", "TASK__CORE_COVERAGE_LOW"];
        if (Array.isArray(result.signals)) {
          result.signals = result.signals.filter((s) => !_SUPPRESS.includes(s));
        }
      } else if (_doms.length > 0) {
        if (_primaryNarrative?.direct) {
          result.meta.domainDirectnessHint = _primaryNarrative.direct.replace("직접 연결됩니다.", "핵심 업무 축과 맞닿아 있습니다.");
        } else if (_domLabel) {
          result.meta.domainDirectnessHint = `이력서의 procurement 경험은 ${_domLabel} 축과 맞닿아 있습니다.`;
        }
        if (_primaryNarrative?.focus) {
          result.meta.jdFocusSummary = _primaryNarrative.focus;
        } else if (_domLabel) {
          result.meta.jdFocusSummary = `JD 초점은 ${_domLabel} 축으로 읽힐 수 있습니다.`;
        }
        if (!_primaryNarrative?.burden && _domLabel) {
          result.meta.proofBurdenHint = `${_domLabel} 경험은 확인되지만 전략 깊이, ownership, KPI 또는 category 책임 범위는 추가 입증이 필요합니다.`;
        } else if (_primaryNarrative?.burden) {
          result.meta.proofBurdenHint = _primaryNarrative.burden.replace("먼저 제시하는 편이 안전합니다.", "다만 전략 깊이와 ownership 범위는 추가 입증이 필요합니다.");
        }
        if (!_primaryNarrative?.scope && _domLabel) {
          result.meta.scopeHint = `${_domLabel} 맥락과 family fit은 맞지만 역할 범위와 책임 수준은 한 단계 더 확인이 필요합니다.`;
        } else if (_primaryNarrative?.scope) {
          result.meta.scopeHint = _primaryNarrative.scope.replace("설명력이 높아집니다.", "다만 실제 책임 범위는 추가 확인이 필요합니다.").replace("유리합니다.", "다만 실제 범위는 추가 확인이 필요합니다.");
        }
      }
    } catch {
      // silent — procurement guard must not break existing flow
    }
  }

  // ✅ PATCH R57 (append-only): HR domain concentration guard
  if (hrDomainSummary && typeof hrDomainSummary === "object" && hrDomainSummary.hrFamilyFit) {
    try {
      if (!result.meta || typeof result.meta !== "object") result.meta = {};
      const _isStrongFit = result.meta.semanticStrongFit === true;
      const _doms = Array.isArray(hrDomainSummary.dominantHrDomains)
        ? hrDomainSummary.dominantHrDomains : [];
      result.meta.hrFamilyFit = true;
      result.meta.dominantHrDomains = _doms.slice(0, 3);
      result.meta.hrEvidenceHints = Array.isArray(hrDomainSummary.hrEvidenceHighlights)
        ? hrDomainSummary.hrEvidenceHighlights.slice(0, 3) : [];
      if (_isStrongFit && _doms.length > 0) {
        result.meta.hrStrongFit = true;
      }
    } catch {
      // silent — HR guard must not break existing flow
    }
  }

  // ✅ PATCH R62 (append-only): HR strong-fit narrative meta expansion
  // PATCH R66 (append-only): HR family transition signal for non-strong-fit cases
  if (result?.meta?.hrFamilyFit === true && result?.meta?.hrStrongFit !== true) {
    try {
      if (!result.meta || typeof result.meta !== "object") result.meta = {};
      const _HR_DOMAIN_SET = new Set([
        "hr",
        "talent_acquisition",
        "hr_operations",
        "compensation_performance",
        "hrbp_er",
        "learning_development",
      ]);
      const _dominantHrDomains = Array.isArray(result.meta.dominantHrDomains)
        ? result.meta.dominantHrDomains.map((d) => String(d || "").trim()).filter(Boolean)
        : [];
      const _matchedHrDomains = Array.isArray(semanticEvidenceSummary?.matchedDomains)
        ? semanticEvidenceSummary.matchedDomains
          .map((d) => String(d || "").trim())
          .filter((d) => _HR_DOMAIN_SET.has(d))
        : [];
      const _hrDomainPool = [...new Set([..._dominantHrDomains, ..._matchedHrDomains])];
      if (_dominantHrDomains.length > 0 || _matchedHrDomains.length >= 2) {
        let _transitionType = null;
        let _transitionGap = null;
        const _domainSet = new Set(_hrDomainPool);
        if (_domainSet.has("hr_operations") && _domainSet.has("hrbp_er")) {
          _transitionType = "operations_to_hrbp";
          _transitionGap = "조직 전략, 성과관리, 보상, ER ownership 범위는 추가 설명이 필요할 수 있습니다.";
        } else if (_domainSet.has("hr_operations") && _domainSet.has("compensation_performance")) {
          _transitionType = "operations_to_compensation";
          _transitionGap = "평가 체계 운영, calibration, 보상 review ownership 범위는 추가 설명이 필요할 수 있습니다.";
        } else if (_domainSet.has("talent_acquisition") && _domainSet.has("hrbp_er")) {
          _transitionType = "recruiting_to_hrbp";
          _transitionGap = "조직 지원, 인력 운영, employee relations 축의 직접 경험은 추가 설명이 필요할 수 있습니다.";
        } else if (_hrDomainPool.length >= 2) {
          _transitionType = "within_hr_transition";
          _transitionGap = "같은 HR family 안의 인접 영역 경험은 보이지만, JD 핵심 책임 범위와 직접 맞닿는 ownership 설명은 더 필요할 수 있습니다.";
        }
        if (_transitionType) {
          result.meta.hrTransitionFit = true;
          result.meta.hrTransitionType = _transitionType;
          result.meta.hrTransitionGap = _transitionGap;
        }
      }
    } catch {
      // silent: HR transition signal must not break existing flow
    }
  }

  // PATCH R70 (append-only): HR transition structural gap meta
  if (result?.meta?.hrTransitionFit === true && result?.meta?.hrStrongFit !== true) {
    try {
      if (!result.meta || typeof result.meta !== "object") result.meta = {};
      const _transitionType = String(result.meta.hrTransitionType || "").trim();
      const _acc = Number(semanticEvidenceSummary?.acceptedPairCount || 0);
      const _cov = Number(semanticEvidenceSummary?.coverageRatio || 0);
      let _gapAreas = [];
      let _alignmentGap = false;
      let _strategicScopeGap = false;

      if (_transitionType === "operations_to_hrbp") {
        _alignmentGap = true;
        _strategicScopeGap = true;
        _gapAreas = ["조직 전략", "성과관리", "보상", "ER ownership"];
      } else if (_transitionType === "operations_to_compensation") {
        _alignmentGap = true;
        _strategicScopeGap = true;
        _gapAreas = ["평가 체계 운영", "calibration", "보상 review ownership"];
      } else if (_transitionType === "recruiting_to_hrbp") {
        _alignmentGap = true;
        _strategicScopeGap = true;
        _gapAreas = ["조직 지원", "인력 운영", "employee relations"];
      } else if (_transitionType === "within_hr_transition") {
        _alignmentGap = true;
        _gapAreas = ["JD 핵심 ownership", "기능 전환 근거"];
      }

      if ((_acc > 0 && _acc < 3) || (_cov > 0 && _cov < 0.4)) {
        _alignmentGap = _alignmentGap || _gapAreas.length > 0;
        if (_transitionType === "operations_to_hrbp" || _transitionType === "operations_to_compensation" || _transitionType === "recruiting_to_hrbp") {
          _strategicScopeGap = true;
        }
      }

      if (_alignmentGap) {
        result.meta.hrAlignmentGap = true;
      }
      if (_strategicScopeGap) {
        result.meta.hrStrategicScopeGap = true;
      }
      if (_gapAreas.length > 0) {
        result.meta.hrGapAreas = _gapAreas.slice(0, 4);
      }
    } catch {
      // silent: HR structural gap meta must not break existing flow
    }
  }

  // PATCH R72 (append-only): refine HR transition gap areas from JD evidence
  if (result?.meta?.hrTransitionFit === true && result?.meta?.hrStrongFit !== true) {
    try {
      if (!result.meta || typeof result.meta !== "object") result.meta = {};
      const _jdText = String(jdText || "");
      const _resumeText = String(resumeText || "");
      const _acceptedPairs = Array.isArray(semanticEvidenceSummary?.topAcceptedPairs)
        ? semanticEvidenceSummary.topAcceptedPairs
        : [];
      const _matchedDomains = Array.isArray(semanticEvidenceSummary?.matchedDomains)
        ? semanticEvidenceSummary.matchedDomains.map((d) => String(d || "").trim())
        : [];
      const _scopeCoverage = {};
      const _scopeMissing = [];
      const _gapAreas = [];
      const _jdSignals = [];

      for (const [scopeId, scopeDef] of Object.entries(HRBP_SCOPE_KEYWORDS)) {
        const _keywords = Array.isArray(scopeDef?.keywords) ? scopeDef.keywords : [];
        const _label = String(scopeDef?.label || scopeId).trim();
        const _jdHasFromText = includesAny(_jdText, _keywords);
        const _jdHasFromDomain =
          (scopeId === "performance" || scopeId === "compensation") && _matchedDomains.includes("compensation_performance")
            ? includesAny(_jdText, _keywords)
            : scopeId === "er" && _matchedDomains.includes("hrbp_er")
              ? includesAny(_jdText, _keywords)
              : false;
        const _jdHasScope = _jdHasFromText || _jdHasFromDomain;
        if (!_jdHasScope) continue;

        _jdSignals.push(_label);

        let _coverageScore = 0;
        if (includesAny(_resumeText, _keywords)) {
          _coverageScore += STRENGTH_SCORE[detectEvidenceStrength(_resumeText, _keywords)] || 0.5;
        }

        const _pairHit = _acceptedPairs.some((pair) => {
          const _pairJd = String(pair?.jd || "");
          const _pairResume = String(pair?.resume || "");
          return includesAny(_pairJd, _keywords) || includesAny(_pairResume, _keywords);
        });
        if (_pairHit) _coverageScore += 0.4;

        if (scopeId === "hr_data" && includesAny(_resumeText, ["hris", "인사 데이터", "data", "report", "analytics"])) {
          _coverageScore += 0.3;
        }
        if (scopeId === "er" && includesAny(_resumeText, ["employee relations", "er", "노무", "grievance"])) {
          _coverageScore += 0.3;
        }
        if (scopeId === "strategy" && includesAny(_resumeText, ["전략", "strategy", "planning", "headcount planning"])) {
          _coverageScore += 0.3;
        }

        const _covered = _coverageScore >= 0.9;
        _scopeCoverage[scopeId] = _covered;
        if (!_covered) {
          _scopeMissing.push(scopeId);
          _gapAreas.push(_label);
        }
      }

      if (Object.keys(_scopeCoverage).length > 0) {
        result.meta.hrScopeCoverage = _scopeCoverage;
        result.meta.hrScopeMissing = _scopeMissing.slice(0, 5);
      }

      if (_gapAreas.length > 0) {
        result.meta.hrGapAreas = _gapAreas.slice(0, 5);
        result.meta.hrAlignmentGap = true;
        result.meta.hrStrategicScopeGap = _gapAreas.some((label) =>
          label === "조직 전략" || label === "성과관리" || label === "보상" || label === "ER"
        );
        result.meta.hrTransitionGap = `JD가 요구하는 ${_gapAreas.slice(0, 4).join(", ")} 경험이 resume에서 직접 확인되지 않습니다.`;
      } else if (_jdSignals.length > 0) {
        result.meta.hrGapAreas = [];
        result.meta.hrTransitionGap = `JD 핵심 HR scope(${_jdSignals.slice(0, 4).join(", ")})와 resume 근거가 부분적으로 연결됩니다.`;
      }
    } catch {
      // silent: JD-based HR scope gap refinement must not break existing flow
    }
  }

  // PATCH R83 (append-only): operations_to_hrbp direct scope-gap narrative
  if (
    result?.meta?.hrTransitionFit === true &&
    result?.meta?.hrStrongFit !== true &&
    String(result?.meta?.hrTransitionType || "").trim() === "operations_to_hrbp"
  ) {
    try {
      if (!result.meta || typeof result.meta !== "object") result.meta = {};
      const _resumeOpsSignals = [];
      if (includesAny(resumeText, ["채용", "recruit", "recruiting"])) _resumeOpsSignals.push("채용 운영");
      if (includesAny(resumeText, ["온보딩", "onboarding"])) _resumeOpsSignals.push("온보딩");
      if (includesAny(resumeText, ["hris", "인사 데이터", "hr data"])) _resumeOpsSignals.push("HRIS/인사 데이터");
      if (includesAny(resumeText, ["근태", "인사 행정", "인사행정", "입퇴사"])) _resumeOpsSignals.push("인사행정/근태");
      if (includesAny(resumeText, ["직원 문의", "hr 정책 안내", "policy"])) _resumeOpsSignals.push("직원 문의 대응");

      const _opsEvidence = _resumeOpsSignals.slice(0, 4);
      const _gapAreas = Array.isArray(result.meta.hrGapAreas)
        ? result.meta.hrGapAreas.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 3)
        : [];
      const _gapLabel = _gapAreas.length > 0
        ? _gapAreas.join(", ")
        : "조직/인력 전략, 성과관리/보상, 조직 이슈/ER 대응";
      const _opsLabel = _opsEvidence.length > 0
        ? _opsEvidence.join(", ")
        : "HR Operations 실행 경험";

      result.meta.hrNarrative = `현재 이력서는 ${_opsLabel} 중심으로 읽히지만, HRBP 수준의 ${_gapLabel} 직접 책임 근거는 약합니다.`;
      result.meta.hrDomainDirectnessHint = "같은 HR family 전환으로는 읽히지만, 운영 경험을 HRBP 역할 책임으로 확장해 보여주는 연결은 아직 약합니다.";
      result.meta.hrScopeHint = `${_opsLabel} 경험은 보이지만, HRBP가 요구하는 ${_gapLabel} ownership은 직접 확인되지 않습니다.`;
      result.meta.hrProofBurdenHint = `현재 이력서를 HRBP로 바로 읽히게 하려면 ${_gapLabel} 중 최소 2~3개 영역의 직접 책임 사례가 필요합니다.`;
      result.meta.hrRewriteHints = [
        `현재 HR Operations 경험을 ${_gapAreas[0] || "조직/인력 전략"} 책임 문장과 직접 연결해 다시 쓰세요.`,
        `성과관리/보상 또는 조직 이슈 대응 경험이 있다면 운영 지원이 아니라 직접 책임 범위로 명시하세요.`,
        "HR 데이터, HRIS, 리포트 경험은 의사결정 지원이나 조직 운영 판단에 어떻게 연결됐는지까지 써 주세요.",
      ].slice(0, 3);
    } catch {
      // silent: operations_to_hrbp narrative must not break existing flow
    }
  }

  if (result?.meta?.hrStrongFit === true) {
    try {
      if (!result.meta || typeof result.meta !== "object") result.meta = {};
      const _doms = Array.isArray(result.meta.dominantHrDomains)
        ? result.meta.dominantHrDomains
        : [];
      const _primaryDom = String(_doms[0] || "").trim();
      const _evidenceHints = Array.isArray(result.meta.hrEvidenceHints)
        ? result.meta.hrEvidenceHints.filter(Boolean).slice(0, 2)
        : [];
      const _evidenceLabel = __formatHintList(_evidenceHints, 2);
      const _HR_NARRATIVE_MAP = {
        talent_acquisition: {
          functionalIdentity: "채용 프로세스를 운영하고 후보자 파이프라인을 관리하는 Talent Acquisition 중심 HR 실행형 후보자입니다.",
          narrative: "이 이력서는 채용 운영, 후보자 소싱, 인터뷰 coordination 등 Talent Acquisition 영역 경험이 직접적으로 나타나는 HR 실행형 프로필로 읽힙니다.",
          directness: "JD에서 요구하는 채용 운영 업무와 이력서의 채용 프로세스 및 후보자 파이프라인 경험이 직접적으로 연결됩니다.",
          focus: "JD는 채용 파이프라인 운영 경험을 핵심으로 요구합니다.",
          burden: "채용 경험은 확인되지만 채용 전략, hiring KPI, 채용 규모나 운영 ownership 범위는 추가 설명이 필요할 수 있습니다.",
          scope: "주로 채용 운영 실행 경험 중심으로 읽히며, 채용 전략 수립이나 조직 단위 hiring planning 경험은 제한적으로 보입니다.",
          rewriteHints: [
            "채용 운영 경험을 전형 진행이 아니라 채용 규모, 직군 범위, 처리 리드타임 관점에서 설명",
            "후보자 파이프라인 관리 경험을 sourcing 채널, interview coordination, ATS 활용 범위와 연결",
            "채용 경험이 실제 채용 성공률이나 리드타임 개선에 어떤 영향을 주었는지 추가 설명",
          ],
        },
        hr_operations: {
          functionalIdentity: "입퇴사, 근태, HRIS, 인사행정 등 HR 운영 프로세스를 안정적으로 관리하는 People Operations 중심 HR 후보자입니다.",
          narrative: "이 이력서는 입퇴사 관리, HRIS 운영, 인사행정 등 People Operations 영역 경험이 직접적으로 나타나는 HR 실행형 프로필로 읽힙니다.",
          directness: "JD에서 요구하는 HR 운영 업무와 이력서의 입퇴사 관리 및 HRIS 운영 경험이 직접적으로 연결됩니다.",
          focus: "JD는 HR 운영 프로세스 관리 경험을 핵심으로 요구합니다.",
          burden: "HR 운영 경험은 확인되지만 프로세스 개선이나 제도 운영 수준의 책임 범위는 추가 설명이 필요할 수 있습니다.",
          scope: "주로 HR 운영 실행 경험 중심으로 읽히며 제도 설계 또는 조직 전략 수준 경험은 제한적으로 보입니다.",
          rewriteHints: [
            "입퇴사 관리 경험을 단순 운영이 아니라 처리 규모와 프로세스 개선 관점에서 설명",
            "HRIS 사용 경험을 실제 데이터 관리 범위와 연결",
            "HR 운영 경험이 조직 운영에 어떤 영향을 주었는지 추가 설명",
          ],
        },
        compensation_performance: {
          functionalIdentity: "평가 및 보상 제도를 운영하고 성과관리 체계를 관리하는 Compensation / Performance 중심 HR 후보자입니다.",
          narrative: "이 이력서는 평가 운영, calibration, 보상 review 등 Compensation / Performance 영역 경험이 직접적으로 드러나는 HR 실행형 프로필로 읽힙니다.",
          directness: "JD에서 요구하는 평가 및 보상 운영 업무와 이력서의 성과관리 및 제도 운영 경험이 직접적으로 연결됩니다.",
          focus: "JD는 평가 및 보상 운영 경험을 핵심으로 요구합니다.",
          burden: "평가 및 보상 경험은 확인되지만 제도 설계 수준의 판단 범위나 전사 적용 범위는 추가 설명이 필요할 수 있습니다.",
          scope: "주로 평가 및 보상 운영 실행 경험 중심으로 읽히며 제도 설계나 보상 철학 수립 수준 경험은 제한적으로 보입니다.",
          rewriteHints: [
            "평가 운영 경험을 단순 참여가 아니라 cycle ownership과 calibration 운영 범위로 설명",
            "보상 review 경험을 실제 salary review, 인센티브, 복리후생 운영 범위와 연결",
            "평가 및 보상 운영이 조직의 성과관리 체계에 어떤 영향을 주었는지 추가 설명",
          ],
        },
        hrbp_er: {
          functionalIdentity: "조직 이슈 대응과 인력 운영을 담당하는 HRBP / Employee Relations 중심 HR 후보자입니다.",
          narrative: "이 이력서는 employee relations, 조직 이슈 대응, headcount planning 등 HRBP / ER 영역 경험이 직접적으로 나타나는 HR 실행형 프로필로 읽힙니다.",
          directness: "JD에서 요구하는 조직 지원 및 구성원 이슈 대응 업무와 이력서의 HRBP / ER 경험이 직접적으로 연결됩니다.",
          focus: "JD는 조직 지원과 employee relations 경험을 핵심으로 요구합니다.",
          burden: "HRBP / ER 경험은 확인되지만 조직 단위 의사결정 참여 범위나 인력 운영 책임 수준은 추가 설명이 필요할 수 있습니다.",
          scope: "주로 조직 지원과 구성원 이슈 대응 경험 중심으로 읽히며 조직 전략 수립 수준 경험은 제한적으로 보입니다.",
          rewriteHints: [
            "employee relations 경험을 단순 대응이 아니라 처리 이슈 유형과 해결 범위 중심으로 설명",
            "headcount planning 또는 조직개편 지원 경험을 실제 인력 운영 의사결정과 연결",
            "HRBP 역할이 조직 운영 안정화에 어떤 영향을 주었는지 추가 설명",
          ],
        },
        learning_development: {
          functionalIdentity: "교육 프로그램과 인재 개발 체계를 운영하는 Learning & Development 중심 HR 후보자입니다.",
          narrative: "이 이력서는 교육 프로그램 운영, 온보딩, curriculum 기획 등 Learning & Development 영역 경험이 직접적으로 나타나는 HR 실행형 프로필로 읽힙니다.",
          directness: "JD에서 요구하는 교육 프로그램 운영 업무와 이력서의 인재개발 및 온보딩 경험이 직접적으로 연결됩니다.",
          focus: "JD는 교육 프로그램 운영 경험을 핵심으로 요구합니다.",
          burden: "교육 운영 경험은 확인되지만 교육 체계 설계나 조직 단위 learning strategy 범위는 추가 설명이 필요할 수 있습니다.",
          scope: "주로 교육 운영 실행 경험 중심으로 읽히며 전사 인재개발 체계 설계 수준 경험은 제한적으로 보입니다.",
          rewriteHints: [
            "교육 운영 경험을 단순 진행이 아니라 프로그램 규모, 대상자 범위, 운영 cycle로 설명",
            "온보딩 또는 curriculum 경험을 실제 교육 설계와 성과 지표에 연결",
            "교육 프로그램이 구성원 적응이나 역량 향상에 어떤 영향을 주었는지 추가 설명",
          ],
        },
      };
      const _picked = _HR_NARRATIVE_MAP[_primaryDom] || {
        functionalIdentity: "HR 운영 경험을 기반으로 JD 요구와 직접 연결되는 HR 실행형 후보자입니다.",
        narrative: "이 이력서는 HR 운영 경험과 JD 요구 사이의 연결이 비교적 직접적으로 드러나는 HR 실행형 프로필로 읽힙니다.",
        directness: "JD에서 요구하는 HR 업무와 이력서의 HR 실행 경험이 직접적으로 연결됩니다.",
        focus: "JD는 HR 운영 실행 경험을 핵심으로 요구합니다.",
        burden: "HR 경험은 확인되지만 담당 범위와 운영 ownership 수준은 추가 설명이 필요할 수 있습니다.",
        scope: "주로 HR 실행 경험 중심으로 읽히며 제도 설계 또는 전략 수준 경험은 제한적으로 보입니다.",
        rewriteHints: [
          "HR 경험을 단순 지원이 아니라 실제 담당 프로세스와 처리 범위 중심으로 설명",
          "운영 경험을 조직 영향이나 개선 결과와 연결",
          "JD 표현과 직접 맞닿는 HR 업무 문장을 앞쪽에 배치해 설명",
        ],
      };

      result.meta.hrFunctionalIdentity = _picked.functionalIdentity;
      result.meta.hrNarrative = `${_picked.functionalIdentity} ${_picked.narrative}`.trim();
      result.meta.hrDomainDirectnessHint = _evidenceLabel
        ? `${_picked.directness} 특히 ${_evidenceLabel} 같은 경험이 직접 근거로 읽힙니다.`
        : _picked.directness;
      result.meta.hrFocusSummary = _picked.focus;
      result.meta.hrProofBurdenHint = _picked.burden;
      result.meta.hrScopeHint = _picked.scope;
      result.meta.hrRewriteHints = _picked.rewriteHints.slice(0, 3);
    } catch {
      // silent — HR narrative expansion must not break existing flow
    }
  }

  // PATCH R80 (append-only): Type System V2 transition decision SSOT bridge
  if (result?.meta && typeof result.meta === "object") {
    try {
      const _transitionType = String(result.meta.hrTransitionType || "").trim();
      const _sameHrFamily =
        result.meta.hrFamilyFit === true ||
        (_transitionType && _transitionType !== "within_hr_transition");
      const _dominantHrDomains = Array.isArray(result.meta.dominantHrDomains)
        ? result.meta.dominantHrDomains.map((d) => String(d || "").trim()).filter(Boolean)
        : [];
      const _supportSignals = [];

      if (result.meta.hrTransitionFit === true) _supportSignals.push("hrTransitionFit");
      if (_transitionType) _supportSignals.push(`hrTransitionType:${_transitionType}`);
      if (result.meta.hrFamilyFit === true) _supportSignals.push("hrFamilyFit");
      if (_dominantHrDomains.length > 0) {
        _supportSignals.push(`dominantHrDomains:${_dominantHrDomains.join("|")}`);
      }
      if (result.meta.hrAlignmentGap === true) _supportSignals.push("hrAlignmentGap");
      if (result.meta.hrStrategicScopeGap === true) _supportSignals.push("hrStrategicScopeGap");

      if (
        result.meta.hrTransitionFit === true &&
        result.meta.hrStrongFit !== true &&
        _sameHrFamily
      ) {
        result.meta.transitionDecisionType = "CAREER_LADDER_TRANSITION";
        result.meta.transitionDecisionFamily = "HR";
        result.meta.transitionDecisionConfidence =
          _transitionType && _dominantHrDomains.length >= 2 ? "high" : "medium";
        result.meta.transitionSupportSignals = _supportSignals.slice(0, 8);
      }
    } catch {
      // silent: transition decision bridge must not break existing flow
    }
  }

  // PATCH R84 (append-only): common responsibility overlay pack
  try {
    if (!result.meta || typeof result.meta !== "object") result.meta = {};
    result.meta.responsibilityOverlay = __buildResponsibilityOverlay({
      model,
      result,
      resumeText,
      coreTaskItems,
    });
  } catch {
    // silent: responsibility overlay must not break existing flow
  }

  return result;
}
