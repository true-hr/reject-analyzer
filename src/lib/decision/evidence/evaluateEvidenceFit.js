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
export function evaluateEvidenceFit({ jdText = "", resumeText = "", jdModel = null, ai = null, jdExpectation = null } = {}) {
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
  const coreTaskItems = safeArray(model.coreTasks);

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

      const criticalMissing = result.mustHave.missing.filter(
        (item) => priorityMap[item] === "critical"
      ).length;
      const criticalMatched = result.mustHave.matchedItems.filter(
        (item) => priorityMap[item] === "critical"
      ).length;

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

      // result.meta — 기존 createBaseResult()에 없는 신규 optional field
      result.meta = {
        jdExpectationApplied: true,
        seniorityGapHint,
        scopeHint,
        targetSeniority: seniorityLevel,
        roleScope: scopeLevel,
        // ✅ PATCH (append-only): criticalMissing → buildSimulationViewModel 설명층 소비용
        criticalMissing,
      };
    } catch {
      // silent — jdExpectation 소비 실패 시 기존 result 그대로 반환
    }
  }

  return result;
}
