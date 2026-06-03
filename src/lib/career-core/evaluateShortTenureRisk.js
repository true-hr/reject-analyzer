import { getEmploymentTypeMetadata } from "./getEmploymentTypeMetadata.js";

const DEFAULT_SHORT_TENURE_THRESHOLD_MONTHS = 12;

const CONTEXTUAL_SHORT_TENURE_TYPES = new Set([
  "contract",
  "dispatch",
  "freelance",
  "founder_or_self_employed",
  "part_time",
  "project_contract",
  "unpaid_activity",
]);

function normalizeDuration(value) {
  if (value == null) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeThreshold(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : DEFAULT_SHORT_TENURE_THRESHOLD_MONTHS;
}

function resolveMetadata(input) {
  if (input?.employmentTypeMetadata) return input.employmentTypeMetadata;
  return getEmploymentTypeMetadata(input?.employmentType ?? input?.normalizedEmploymentType ?? "");
}

function effectiveShortTenureApplicable(metadata) {
  if (metadata.normalizedEmploymentType === "full_time") return true;
  if (CONTEXTUAL_SHORT_TENURE_TYPES.has(metadata.normalizedEmploymentType)) return "contextual";
  return false;
}

function falseOverrideReason(metadata) {
  if (
    metadata.normalizedEmploymentType === "internship" ||
    metadata.normalizedEmploymentType === "experience_internship" ||
    metadata.normalizedEmploymentType === "conversion_internship"
  ) {
    return "internship_not_short_tenure_applicable";
  }
  if (metadata.normalizedEmploymentType === "training") return "training_not_work_experience";
  if (metadata.normalizedEmploymentType === "gap") return "gap_not_employment_tenure";
  if (metadata.normalizedEmploymentType === "military_service") {
    return "military_service_not_general_employment_tenure";
  }
  if (metadata.normalizedEmploymentType === "leave_of_absence") return "leave_not_employment_tenure";
  return "employment_type_not_short_tenure_applicable";
}

function baseResult(metadata, durationMonthsInclusive, threshold, isShortDuration) {
  return {
    durationMonthsInclusive,
    shortTenureThresholdMonths: threshold,
    normalizedEmploymentType: metadata.normalizedEmploymentType,
    metadataVariant: metadata.metadataVariant,
    isShortDuration,
    shortTenureApplicable: effectiveShortTenureApplicable(metadata),
    shortTenureRisk: false,
    riskSignalsPossible: [],
    overrideReason: null,
    confidence: "high",
    appliedToCareerProfile: false,
    warnings: [],
  };
}

export function evaluateShortTenureRisk(input, options = {}) {
  const metadata = resolveMetadata(input ?? {});
  const threshold = normalizeThreshold(options.shortTenureThresholdMonths);
  const durationMonthsInclusive = normalizeDuration(input?.durationMonthsInclusive);
  const applicable = effectiveShortTenureApplicable(metadata);

  if (metadata.normalizedEmploymentType === "unknown") {
    return {
      ...baseResult(metadata, durationMonthsInclusive, threshold, "unknown"),
      shortTenureApplicable: "unknown",
      shortTenureRisk: "unknown",
      overrideReason: "employment_type_unknown",
      confidence: "low",
      warnings: [...new Set([...(metadata.warnings ?? []), "unknown_employment_type"])],
    };
  }

  if (durationMonthsInclusive == null) {
    return {
      ...baseResult(metadata, null, threshold, "unknown"),
      shortTenureRisk: "unknown",
      overrideReason: "duration_missing",
      confidence: "low",
      warnings: ["duration_missing"],
    };
  }

  const isShortDuration = durationMonthsInclusive < threshold;
  const result = baseResult(metadata, durationMonthsInclusive, threshold, isShortDuration);

  if (!isShortDuration) {
    return result;
  }

  if (applicable === true) {
    return {
      ...result,
      shortTenureRisk: true,
      riskSignalsPossible: ["short_tenure"],
      confidence: "high",
    };
  }

  if (applicable === "contextual") {
    return {
      ...result,
      shortTenureRisk: "contextual",
      riskSignalsPossible: [...metadata.riskSignalsPossible],
      overrideReason: "employment_type_contextual_short_tenure",
      confidence: "medium",
    };
  }

  return {
    ...result,
    shortTenureRisk: false,
    overrideReason: falseOverrideReason(metadata),
    confidence: "high",
  };
}
