import { CAREER_FIT_LEVELS } from "./careerFitModel.js";

const FIT_LEVEL_SET = new Set(CAREER_FIT_LEVELS);

const ADJACENT_INDUSTRY_DOMAINS = Object.freeze({
  bio_pharma: ["beauty_cosmetics", "manufacturing"],
  beauty_cosmetics: ["bio_pharma", "commerce"],
  career_education: ["b2b_saas", "platform"],
  b2b_saas: ["career_education", "platform"],
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

function hasStrongTransferableSignal(roleSignals, strengthSignals) {
  if (roleSignals.length > 0) return true;
  return strengthSignals.some((signal) => signal.weight >= 0.8 || signal.confidence >= 0.8);
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

export function scoreCareerIndustryFit({ careerProfile, targetIndustryDomain, targetIndustryText = "" } = {}) {
  const profile = safeObject(careerProfile);
  const target = normalizeLabel(targetIndustryDomain);
  const warnings = [];

  if (!target) warnings.push("missing_target_industry_domain");

  const experienceFits = safeArray(profile.timeline).map((experience) => {
    const experienceId = safeString(experience.id);
    const industrySignals = collectExperienceSignals(profile.signals?.industryDomains, experienceId);
    const roleSignals = collectExperienceSignals(profile.signals?.roleFamilies, experienceId);
    const strengthSignals = collectExperienceSignals(profile.signals?.strengthSignals, experienceId);
    const industryLabels = industrySignals.map((signal) => normalizeLabel(signal.label)).filter(Boolean);
    const adjacentLabels = new Set(safeArray(ADJACENT_INDUSTRY_DOMAINS[target]));
    const hasDirect = Boolean(target) && industryLabels.includes(target);
    const adjacentMatches = industryLabels.filter((label) => adjacentLabels.has(label));
    const hasIndustryEvidence = industryLabels.length > 0;
    const hasTransferableEvidence = hasStrongTransferableSignal(roleSignals, strengthSignals);

    let industryFitLevel = "unknown";
    let reasons = ["No industry-domain evidence found for this experience."];
    let matchedSignals = [];

    if (hasDirect) {
      industryFitLevel = "direct";
      matchedSignals = industrySignals.filter((signal) => normalizeLabel(signal.label) === target);
      reasons = [`Industry signal matches target industry domain: ${target}.`];
    } else if (adjacentMatches.length > 0) {
      industryFitLevel = "adjacent";
      matchedSignals = industrySignals.filter((signal) => adjacentMatches.includes(normalizeLabel(signal.label)));
      reasons = [`Industry signal is adjacent to target industry domain: ${adjacentMatches.join(", ")}.`];
    } else if (hasIndustryEvidence && hasTransferableEvidence) {
      industryFitLevel = "transferable";
      matchedSignals = [...industrySignals, ...roleSignals, ...strengthSignals];
      reasons = ["Industry differs from target, but role or strength evidence is transferable."];
    } else if (hasIndustryEvidence) {
      industryFitLevel = "unrelated";
      matchedSignals = industrySignals;
      reasons = [`Industry signal differs from target industry domain: ${industryLabels.join(", ")}.`];
    } else if (hasTransferableEvidence) {
      industryFitLevel = "transferable";
      matchedSignals = [...roleSignals, ...strengthSignals];
      reasons = ["Transferable role or strength evidence exists without industry-domain evidence."];
    }

    return {
      experienceId,
      company: safeString(experience.company),
      title: safeString(experience.title),
      durationMonths: Number.isFinite(experience.durationMonths) ? experience.durationMonths : 0,
      industryFitLevel,
      matchedSignals,
      reasons,
      confidence: confidenceFor(industryFitLevel, matchedSignals),
      targetIndustryDomain: target,
      targetIndustryText: safeString(targetIndustryText),
    };
  });

  const summary = emptySummary();
  experienceFits.forEach((fit) => addToSummary(summary, fit.industryFitLevel, fit.durationMonths));

  return {
    targetIndustryDomain: target,
    targetIndustryText: safeString(targetIndustryText),
    experienceFits,
    summary,
    warnings,
  };
}
