export const CAREER_FIT_LEVELS = Object.freeze([
  "direct",
  "adjacent",
  "transferable",
  "unrelated",
  "unknown",
]);

const CAREER_FIT_LEVEL_SET = new Set(CAREER_FIT_LEVELS);

const SUMMARY_DEFAULTS = Object.freeze({
  directlyRelevantMonths: 0,
  adjacentRelevantMonths: 0,
  transferableMonths: 0,
  unrelatedMonths: 0,
  unknownMonths: 0,
  totalClassifiedMonths: 0,
  primaryFitLevel: "unknown",
  directExperienceCount: 0,
  adjacentExperienceCount: 0,
  transferableExperienceCount: 0,
  unrelatedExperienceCount: 0,
  unknownExperienceCount: 0,
  classificationBasis: "experience_duration_sum",
});

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function safeString(value) {
  return String(value ?? "").trim();
}

function safeNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function normalizeFitLevel(value) {
  const level = safeString(value).toLowerCase();
  return CAREER_FIT_LEVEL_SET.has(level) ? level : "unknown";
}

function normalizeTarget(target) {
  const input = safeObject(target);
  return {
    roleFamily: safeString(input.roleFamily),
    industryDomain: safeString(input.industryDomain),
    targetRoleText: safeString(input.targetRoleText),
    targetIndustryText: safeString(input.targetIndustryText),
  };
}

function normalizeExperienceFit(item) {
  const input = safeObject(item);
  return {
    experienceId: safeString(input.experienceId),
    company: safeString(input.company),
    title: safeString(input.title),
    durationMonths: safeNumber(input.durationMonths),
    roleFitLevel: normalizeFitLevel(input.roleFitLevel),
    industryFitLevel: normalizeFitLevel(input.industryFitLevel),
    overallFitLevel: normalizeFitLevel(input.overallFitLevel),
    matchedSignals: safeArray(input.matchedSignals),
    reasons: safeArray(input.reasons).map(safeString).filter(Boolean),
    confidence: Math.max(0, Math.min(1, safeNumber(input.confidence, 0))),
  };
}

function normalizeSummary(summary) {
  const input = safeObject(summary);
  return {
    directlyRelevantMonths: safeNumber(input.directlyRelevantMonths),
    adjacentRelevantMonths: safeNumber(input.adjacentRelevantMonths),
    transferableMonths: safeNumber(input.transferableMonths),
    unrelatedMonths: safeNumber(input.unrelatedMonths),
    unknownMonths: safeNumber(input.unknownMonths),
    totalClassifiedMonths: safeNumber(input.totalClassifiedMonths),
    primaryFitLevel: normalizeFitLevel(input.primaryFitLevel),
    directExperienceCount: safeNumber(input.directExperienceCount),
    adjacentExperienceCount: safeNumber(input.adjacentExperienceCount),
    transferableExperienceCount: safeNumber(input.transferableExperienceCount),
    unrelatedExperienceCount: safeNumber(input.unrelatedExperienceCount),
    unknownExperienceCount: safeNumber(input.unknownExperienceCount),
    classificationBasis: safeString(input.classificationBasis) || SUMMARY_DEFAULTS.classificationBasis,
  };
}

export function createCareerFitResult(input = {}) {
  const source = safeObject(input);
  return normalizeCareerFitResult({
    target: source.target,
    experienceFits: source.experienceFits,
    summary: source.summary,
    warnings: source.warnings,
  });
}

export function normalizeCareerFitResult(result = {}) {
  const input = safeObject(result);
  return {
    target: normalizeTarget(input.target),
    experienceFits: safeArray(input.experienceFits).map(normalizeExperienceFit),
    summary: normalizeSummary({ ...SUMMARY_DEFAULTS, ...safeObject(input.summary) }),
    warnings: safeArray(input.warnings).map(safeString).filter(Boolean),
  };
}
