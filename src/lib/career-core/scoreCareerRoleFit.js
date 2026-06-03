import { CAREER_FIT_LEVELS } from "./careerFitModel.js";

const FIT_LEVEL_SET = new Set(CAREER_FIT_LEVELS);

const ADJACENT_ROLE_FAMILIES = Object.freeze({
  product_planning_pm: ["operations", "data_analytics", "marketing_growth"],
  operations: ["product_planning_pm", "data_analytics", "marketing_growth"],
  marketing_growth: ["product_planning_pm", "operations", "data_analytics"],
  data_analytics: ["product_planning_pm", "operations", "marketing_growth"],
  production_quality: ["operations", "data_analytics"],
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

function normalizeLabel(value) {
  return safeString(value).normalize("NFKC").toLowerCase();
}

function isCredibleDirectRoleSignal(signal, target) {
  if (normalizeLabel(signal?.label) !== target) return false;
  if (target !== "product_planning_pm") return true;

  const evidenceText = normalizeLabel(signal?.evidenceText);
  if (/\b(pm|product manager|product owner|roadmap|requirement|requirements|service planning)\b/.test(evidenceText)) {
    return true;
  }
  return evidenceText.includes("product") &&
    !/\b(production|manufacturing|gmp|quality|process control)\b/.test(evidenceText);
}

function signalBelongsToExperience(signal, experienceId) {
  const source = safeObject(signal?.source);
  const refId = safeString(source.refId);
  if (!experienceId || !refId) return false;
  if (refId === experienceId) return true;
  return source.type === "bullet" && refId.startsWith(`${experienceId}:`);
}

function collectExperienceSignals(signals, experienceId) {
  return safeArray(signals).filter((signal) => signalBelongsToExperience(signal, experienceId));
}

function hasStrongStrengthSignal(signals) {
  return signals.some((signal) => signal.weight >= 0.8 || signal.confidence >= 0.8);
}

function confidenceFor(level, matchedSignals) {
  if (level === "unknown") return 0;
  const bestSignal = matchedSignals.reduce((best, signal) => Math.max(best, signal.confidence ?? 0), 0);
  if (level === "direct") return Math.max(0.75, bestSignal);
  if (level === "adjacent") return Math.max(0.65, Math.min(0.85, bestSignal || 0.7));
  if (level === "transferable") return Math.max(0.55, Math.min(0.8, bestSignal || 0.6));
  return Math.max(0.45, Math.min(0.7, bestSignal || 0.5));
}

function emptySummary() {
  return {
    directMonths: 0,
    adjacentMonths: 0,
    transferableMonths: 0,
    unrelatedMonths: 0,
    unknownMonths: 0,
    totalClassifiedMonths: 0,
    directExperienceCount: 0,
    adjacentExperienceCount: 0,
    transferableExperienceCount: 0,
    unrelatedExperienceCount: 0,
    unknownExperienceCount: 0,
  };
}

function addToSummary(summary, level, durationMonths) {
  const normalizedLevel = FIT_LEVEL_SET.has(level) ? level : "unknown";
  summary.totalClassifiedMonths += durationMonths;
  summary[`${normalizedLevel}Months`] += durationMonths;
  summary[`${normalizedLevel}ExperienceCount`] += 1;
}

export function scoreCareerRoleFit({ careerProfile, targetRoleFamily, targetRoleText = "" } = {}) {
  const profile = safeObject(careerProfile);
  const target = normalizeLabel(targetRoleFamily);
  const warnings = [];

  if (!target) warnings.push("missing_target_role_family");

  const experienceFits = safeArray(profile.timeline).map((experience) => {
    const experienceId = safeString(experience.id);
    const roleSignals = collectExperienceSignals(profile.signals?.roleFamilies, experienceId);
    const strengthSignals = collectExperienceSignals(profile.signals?.strengthSignals, experienceId);
    const roleLabels = roleSignals.map((signal) => normalizeLabel(signal.label)).filter(Boolean);
    const adjacentLabels = new Set(safeArray(ADJACENT_ROLE_FAMILIES[target]));
    const directMatches = Boolean(target)
      ? roleSignals.filter((signal) => isCredibleDirectRoleSignal(signal, target))
      : [];
    const hasDirect = directMatches.length > 0;
    const adjacentMatches = roleLabels.filter((label) => adjacentLabels.has(label));
    const hasRoleEvidence = roleLabels.length > 0;
    const hasTransferableStrength = strengthSignals.length > 0 && hasStrongStrengthSignal(strengthSignals);

    let roleFitLevel = "unknown";
    let reasons = ["No role-family evidence found for this experience."];
    let matchedSignals = [];

    if (hasDirect) {
      roleFitLevel = "direct";
      matchedSignals = directMatches;
      reasons = [`Role signal matches target role family: ${target}.`];
    } else if (adjacentMatches.length > 0) {
      roleFitLevel = "adjacent";
      matchedSignals = roleSignals.filter((signal) => adjacentMatches.includes(normalizeLabel(signal.label)));
      reasons = [`Role signal is adjacent to target role family: ${adjacentMatches.join(", ")}.`];
    } else if (!hasRoleEvidence && hasTransferableStrength) {
      roleFitLevel = "transferable";
      matchedSignals = strengthSignals;
      reasons = ["Strong transferable strength signal exists without role-family evidence."];
    } else if (hasRoleEvidence) {
      roleFitLevel = "unrelated";
      matchedSignals = roleSignals;
      reasons = [`Role signal differs from target role family: ${roleLabels.join(", ")}.`];
    }

    return {
      experienceId,
      company: safeString(experience.company),
      title: safeString(experience.title),
      durationMonths: Number.isFinite(experience.durationMonths) ? experience.durationMonths : 0,
      roleFitLevel,
      matchedSignals,
      reasons,
      confidence: confidenceFor(roleFitLevel, matchedSignals),
      targetRoleFamily: target,
      targetRoleText: safeString(targetRoleText),
    };
  });

  const summary = emptySummary();
  experienceFits.forEach((fit) => addToSummary(summary, fit.roleFitLevel, fit.durationMonths));

  return {
    targetRoleFamily: target,
    targetRoleText: safeString(targetRoleText),
    experienceFits,
    summary,
    warnings,
  };
}
