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

const TOOL_ALIASES = {
  "power bi": ["powerbi", "pbi"],
  excel: ["엑셀"],
  sql: ["mysql", "mssql", "postgresql"],
  sap: ["sap erp", "erp"],
};

const TASK_ALIASES = {
  "전략 수립": ["사업 전략", "중장기 전략", "기획"],
  "데이터 분석": ["지표 분석", "성과 분석", "리포팅"],
  "프로젝트 관리": ["pm", "일정 관리", "과제 운영"],
  "운영 개선": ["프로세스 개선", "효율화", "운영 고도화"],
};

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

function evaluateSection(items, resumeText, aliasMap) {
  const raw = safeArray(items);
  const section = {
    total: raw.length,
    matched: 0,
    missing: [],
    matchedItems: [],
  };

  for (const item of raw) {
    const itemText = toItemText(item);
    if (!itemText) continue;
    const candidates = aliasCandidatesForItem(itemText, aliasMap);
    const matched = includesAny(resumeText, candidates);
    if (matched) {
      section.matched += 1;
      section.matchedItems.push(itemText);
    } else {
      section.missing.push(itemText);
    }
  }

  return section;
}

function scoreByMatched(matched, total) {
  if (!total) return 100;
  return Math.round((Number(matched || 0) / Number(total || 1)) * 100);
}

function levelFromScore(overallScore) {
  if (overallScore >= 80) return "strong";
  if (overallScore >= 65) return "moderate";
  if (overallScore >= 50) return "weak";
  return "critical";
}

function penaltyFromScore(overallScore) {
  if (overallScore >= 80) return 0;
  if (overallScore >= 65) return 6;
  if (overallScore >= 50) return 12;
  if (overallScore >= 35) return 20;
  return 30;
}

function summaryByLevel(level) {
  if (level === "strong") return "JD 핵심 요구조건과 이력서 근거가 전반적으로 잘 맞습니다.";
  if (level === "moderate") return "JD 요구조건은 대체로 맞지만 일부 핵심 근거가 약합니다.";
  if (level === "weak") return "JD 핵심 요구사항 중 확인되는 근거와 부족한 근거가 혼재합니다.";
  return "JD에서 요구한 핵심 조건 대비 이력서 근거가 전반적으로 부족합니다.";
}

function createBaseResult() {
  return {
    overallScore: 0,
    level: "none",
    penalty: 0,

    mustHave: {
      total: 0,
      matched: 0,
      missing: [],
      matchedItems: [],
    },

    preferred: {
      total: 0,
      matched: 0,
      missing: [],
      matchedItems: [],
    },

    tools: {
      total: 0,
      matched: 0,
      missing: [],
      matchedItems: [],
    },

    coreTasks: {
      total: 0,
      matched: 0,
      missing: [],
      matchedItems: [],
    },

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

export function evaluateEvidenceFit({ jdText = "", resumeText = "", jdModel = null, ai = null } = {}) {
  void jdText;
  void ai;

  const result = createBaseResult();
  const normalizedResume = normalizeText(resumeText);

  if (!normalizedResume) {
    result.overallScore = 100;
    result.penalty = 0;
    result.level = "none";
    result.summary = "이력서 본문이 없어 증거 적합도 평가는 제한적으로만 반영됩니다.";
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
    result.summary =
      "JD에서 구조화 가능한 요구조건이 충분히 추출되지 않아 증거 적합도 평가는 제한적으로만 반영됩니다.";
    return result;
  }

  const COMMON_ALIASES = { ...TOOL_ALIASES, ...TASK_ALIASES };

  result.mustHave = evaluateSection(mustHaveItems, normalizedResume, COMMON_ALIASES);
  result.preferred = evaluateSection(preferredItems, normalizedResume, COMMON_ALIASES);
  result.tools = evaluateSection(toolItems, normalizedResume, TOOL_ALIASES);
  result.coreTasks = evaluateSection(coreTaskItems, normalizedResume, TASK_ALIASES);

  const mustHaveScore = scoreByMatched(result.mustHave.matched, result.mustHave.total);
  const preferredScore = scoreByMatched(result.preferred.matched, result.preferred.total);
  const toolScore = scoreByMatched(result.tools.matched, result.tools.total);
  const coreTaskScore = scoreByMatched(result.coreTasks.matched, result.coreTasks.total);

  result.scoreBreakdown = {
    mustHaveScore,
    preferredScore,
    toolScore,
    coreTaskScore,
  };

  result.overallScore = Math.round(
    mustHaveScore * 0.45 +
      coreTaskScore * 0.3 +
      toolScore * 0.15 +
      preferredScore * 0.1
  );
  result.level = levelFromScore(result.overallScore);
  result.penalty = penaltyFromScore(result.overallScore);

  if (result.mustHave.total >= 2 && result.mustHave.matched === 0) {
    result.signals.push("ROLE_SKILL__MUST_HAVE_MISSING");
  }
  if (result.tools.total >= 2 && result.tools.matched === 0) {
    result.signals.push("ROLE_SKILL__TOOL_GAP");
  }

  const allMissing = []
    .concat(result.mustHave.missing, result.tools.missing, result.coreTasks.missing, result.preferred.missing)
    .filter(Boolean);
  const topMissing = Array.from(new Set(allMissing)).slice(0, 2);
  const baseSummary = summaryByLevel(result.level);
  result.summary =
    topMissing.length > 0
      ? `${baseSummary} 특히 ${topMissing.join(", ")} 경험 근거가 약합니다.`
      : baseSummary;

  return result;
}

