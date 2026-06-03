import { createCareerFitResult } from "./careerFitModel.js";
import { scoreCareerIndustryFit } from "./scoreCareerIndustryFit.js";
import { scoreCareerRoleFit } from "./scoreCareerRoleFit.js";

const FIT_LEVEL_ORDER = Object.freeze(["direct", "adjacent", "transferable", "unrelated", "unknown"]);

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function safeString(value) {
  return String(value ?? "").trim();
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

function hasStrengthSignal(careerProfile, experienceId) {
  return safeArray(careerProfile?.signals?.strengthSignals).some((signal) => {
    const source = safeObject(signal?.source);
    const refId = safeString(source.refId);
    if (refId === experienceId) return true;
    return source.type === "bullet" && refId.startsWith(`${experienceId}:`);
  });
}

function collectExperienceSignalLabels(careerProfile, experienceId) {
  return [
    ...safeArray(careerProfile?.signals?.roleFamilies),
    ...safeArray(careerProfile?.signals?.industryDomains),
  ].filter((signal) => {
    const source = safeObject(signal?.source);
    const refId = safeString(source.refId);
    if (refId === experienceId) return true;
    return source.type === "bullet" && refId.startsWith(`${experienceId}:`);
  }).map((signal) => safeString(signal.label));
}

function isProductionQualityBioToPmSaasMismatch({ target, signalLabels }) {
  if (target.roleFamily !== "product_planning_pm" || target.industryDomain !== "b2b_saas") return false;
  const labels = new Set(signalLabels);
  const hasSourceDomain = labels.has("production_quality") && labels.has("bio_pharma");
  const hasTargetSignal = labels.has("b2b_saas");
  return hasSourceDomain && !hasTargetSignal;
}

function decideOverallFitLevel({ roleFitLevel, industryFitLevel, hasStrength, hasDistantMismatch }) {
  if (hasDistantMismatch) {
    return "unrelated";
  }
  if (roleFitLevel === "direct" && (industryFitLevel === "direct" || industryFitLevel === "adjacent")) {
    return "direct";
  }
  if (roleFitLevel === "direct" && (industryFitLevel === "unrelated" || industryFitLevel === "unknown")) {
    return "adjacent";
  }
  if (roleFitLevel === "adjacent" && (industryFitLevel === "direct" || industryFitLevel === "adjacent")) {
    return "adjacent";
  }
  if ((roleFitLevel === "adjacent" || industryFitLevel === "adjacent") && hasStrength) {
    return "transferable";
  }
  if (roleFitLevel === "unrelated" && (industryFitLevel === "unrelated" || industryFitLevel === "transferable")) {
    return "unrelated";
  }
  if (roleFitLevel === "transferable" || industryFitLevel === "transferable") {
    return "transferable";
  }
  if (roleFitLevel === "unrelated" && industryFitLevel === "unrelated") {
    return "unrelated";
  }
  if (roleFitLevel === "unknown" && industryFitLevel === "unknown") {
    return "unknown";
  }
  if (roleFitLevel === "unrelated" || industryFitLevel === "unrelated") {
    return "unrelated";
  }
  return "unknown";
}

function emptySummary() {
  return {
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
  };
}

function addToSummary(summary, fit) {
  const months = Number.isFinite(fit.durationMonths) ? fit.durationMonths : 0;
  summary.totalClassifiedMonths += months;

  if (fit.overallFitLevel === "direct") {
    summary.directlyRelevantMonths += months;
    summary.directExperienceCount += 1;
  } else if (fit.overallFitLevel === "adjacent") {
    summary.adjacentRelevantMonths += months;
    summary.adjacentExperienceCount += 1;
  } else if (fit.overallFitLevel === "transferable") {
    summary.transferableMonths += months;
    summary.transferableExperienceCount += 1;
  } else if (fit.overallFitLevel === "unrelated") {
    summary.unrelatedMonths += months;
    summary.unrelatedExperienceCount += 1;
  } else {
    summary.unknownMonths += months;
    summary.unknownExperienceCount += 1;
  }
}

function pickPrimaryFitLevel(summary) {
  const monthsByLevel = {
    direct: summary.directlyRelevantMonths,
    adjacent: summary.adjacentRelevantMonths,
    transferable: summary.transferableMonths,
    unrelated: summary.unrelatedMonths,
    unknown: summary.unknownMonths,
  };

  return FIT_LEVEL_ORDER.reduce((best, level) => {
    if (monthsByLevel[level] > monthsByLevel[best]) return level;
    return best;
  }, "unknown");
}

export function buildCareerFitSummary(careerProfile, target = {}) {
  const normalizedTarget = normalizeTarget(target);
  const roleResult = scoreCareerRoleFit({
    careerProfile,
    targetRoleFamily: normalizedTarget.roleFamily,
    targetRoleText: normalizedTarget.targetRoleText,
  });
  const industryResult = scoreCareerIndustryFit({
    careerProfile,
    targetIndustryDomain: normalizedTarget.industryDomain,
    targetIndustryText: normalizedTarget.targetIndustryText,
  });
  const industryByExperienceId = new Map(
    industryResult.experienceFits.map((fit) => [fit.experienceId, fit])
  );

  const experienceFits = roleResult.experienceFits.map((roleFit) => {
    const industryFit = industryByExperienceId.get(roleFit.experienceId) ?? {};
    const hasStrength = hasStrengthSignal(careerProfile, roleFit.experienceId);
    const signalLabels = collectExperienceSignalLabels(careerProfile, roleFit.experienceId);
    const overallFitLevel = decideOverallFitLevel({
      roleFitLevel: roleFit.roleFitLevel,
      industryFitLevel: industryFit.industryFitLevel ?? "unknown",
      hasStrength,
      hasDistantMismatch: isProductionQualityBioToPmSaasMismatch({
        target: normalizedTarget,
        signalLabels,
      }),
    });
    const matchedSignals = [
      ...safeArray(roleFit.matchedSignals),
      ...safeArray(industryFit.matchedSignals),
    ];

    return {
      experienceId: roleFit.experienceId,
      company: roleFit.company,
      title: roleFit.title,
      durationMonths: roleFit.durationMonths,
      roleFitLevel: roleFit.roleFitLevel,
      industryFitLevel: industryFit.industryFitLevel ?? "unknown",
      overallFitLevel,
      matchedSignals,
      reasons: [
        ...safeArray(roleFit.reasons),
        ...safeArray(industryFit.reasons),
        `Overall fit resolved as ${overallFitLevel}.`,
      ],
      confidence: matchedSignals.length > 0
        ? Math.max(...matchedSignals.map((signal) => signal.confidence ?? 0))
        : 0,
    };
  });

  const summary = emptySummary();
  experienceFits.forEach((fit) => addToSummary(summary, fit));
  summary.primaryFitLevel = pickPrimaryFitLevel(summary);

  return createCareerFitResult({
    target: normalizedTarget,
    experienceFits,
    summary,
    warnings: [
      ...safeArray(roleResult.warnings),
      ...safeArray(industryResult.warnings),
      "classificationBasis: experience_duration_sum",
    ],
  });
}
