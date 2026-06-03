import { classifyEmploymentType, normalizeEmploymentLabel } from "./classifyEmploymentType.js";

const NORMALIZED_EMPLOYMENT_TYPES = new Set([
  "full_time",
  "contract",
  "internship",
  "experience_internship",
  "conversion_internship",
  "dispatch",
  "freelance",
  "founder_or_self_employed",
  "part_time",
  "project_contract",
  "training",
  "gap",
  "military_service",
  "leave_of_absence",
  "unpaid_activity",
]);

const BASE_METADATA = Object.freeze({
  full_time: {
    metadataVariant: "full_time",
    countsAsExperience: true,
    countsAsGap: false,
    countsAsSignal: true,
    experienceWeight: 1.0,
    shortTenureApplicable: true,
    riskSignalsPossible: [],
  },
  contract: {
    metadataVariant: "contract",
    countsAsExperience: true,
    countsAsGap: false,
    countsAsSignal: true,
    experienceWeight: 0.85,
    shortTenureApplicable: "contextual",
    riskSignalsPossible: ["contract_continuity_risk"],
  },
  internship: {
    metadataVariant: "internship",
    countsAsExperience: true,
    countsAsGap: false,
    countsAsSignal: true,
    experienceWeight: 0.4,
    shortTenureApplicable: false,
    riskSignalsPossible: [],
  },
  experience_internship: {
    metadataVariant: "experience_internship",
    countsAsExperience: true,
    countsAsGap: false,
    countsAsSignal: true,
    experienceWeight: 0.35,
    shortTenureApplicable: false,
    riskSignalsPossible: [],
  },
  conversion_internship: {
    metadataVariant: "conversion_internship",
    countsAsExperience: true,
    countsAsGap: false,
    countsAsSignal: true,
    experienceWeight: 0.55,
    shortTenureApplicable: false,
    riskSignalsPossible: [],
  },
  dispatch: {
    metadataVariant: "dispatch",
    countsAsExperience: true,
    countsAsGap: false,
    countsAsSignal: true,
    experienceWeight: 0.75,
    shortTenureApplicable: "contextual",
    riskSignalsPossible: ["employment_stability_risk"],
  },
  freelance: {
    metadataVariant: "freelance",
    countsAsExperience: true,
    countsAsGap: false,
    countsAsSignal: true,
    experienceWeight: 0.65,
    shortTenureApplicable: false,
    riskSignalsPossible: ["scope_clarity_risk", "continuity_risk"],
  },
  founder_or_self_employed: {
    metadataVariant: "founder_or_self_employed",
    countsAsExperience: "contextual",
    countsAsGap: false,
    countsAsSignal: true,
    experienceWeight: "contextual",
    shortTenureApplicable: false,
    riskSignalsPossible: ["business_scope_clarity_risk", "business_outcome_clarity_risk"],
  },
  part_time: {
    metadataVariant: "part_time",
    countsAsExperience: "contextual",
    countsAsGap: false,
    countsAsSignal: true,
    experienceWeight: 0.3,
    shortTenureApplicable: false,
    riskSignalsPossible: ["depth_limit_risk"],
  },
  project_contract: {
    metadataVariant: "project_contract",
    countsAsExperience: true,
    countsAsGap: false,
    countsAsSignal: true,
    experienceWeight: 0.6,
    shortTenureApplicable: false,
    riskSignalsPossible: ["continuity_risk", "scope_clarity_risk"],
  },
  training: {
    metadataVariant: "training",
    countsAsExperience: false,
    countsAsGap: false,
    countsAsSignal: true,
    experienceWeight: 0,
    shortTenureApplicable: false,
    riskSignalsPossible: [],
  },
  gap: {
    metadataVariant: "gap",
    countsAsExperience: false,
    countsAsGap: true,
    countsAsSignal: "contextual",
    experienceWeight: 0,
    shortTenureApplicable: false,
    riskSignalsPossible: ["career_gap_risk", "career_direction_risk"],
  },
  military_service: {
    metadataVariant: "military_service",
    countsAsExperience: false,
    countsAsGap: false,
    countsAsSignal: "contextual",
    experienceWeight: 0,
    shortTenureApplicable: false,
    riskSignalsPossible: [],
  },
  leave_of_absence: {
    metadataVariant: "leave_of_absence",
    countsAsExperience: "contextual",
    countsAsGap: false,
    countsAsSignal: "contextual",
    experienceWeight: "contextual",
    shortTenureApplicable: false,
    riskSignalsPossible: ["availability_or_continuity_risk"],
  },
  unpaid_activity: {
    metadataVariant: "unpaid_activity",
    countsAsExperience: "contextual",
    countsAsGap: false,
    countsAsSignal: "contextual",
    experienceWeight: "contextual_low",
    shortTenureApplicable: false,
    riskSignalsPossible: ["professional_depth_risk"],
  },
});

const VARIANT_LABELS = Object.freeze({
  self_employed: ["개인사업자", "자영업", "self-employed", "sole proprietor"],
  founder: ["창업", "대표", "founder", "startup founder"],
  part_time_job: ["아르바이트", "알바", "part-time job"],
  part_time: ["파트타임", "part-time", "시간제"],
  outsourcing: ["외주", "용역", "outsourcing"],
  project_contract: ["프로젝트 계약", "프로젝트 단위 계약", "project contract"],
  trainee: ["교육생", "trainee", "수강생"],
  bootcamp: ["부트캠프", "bootcamp", "집중 교육"],
  career_gap: ["공백", "경력 공백", "gap"],
  career_exploration: ["진로탐색", "커리어 탐색", "career exploration"],
});

function safeString(value) {
  return String(value ?? "").trim();
}

function isNormalizedEmploymentType(value) {
  return NORMALIZED_EMPLOYMENT_TYPES.has(value);
}

function labelMatches(label, variant) {
  const normalized = normalizeEmploymentLabel(label);
  return VARIANT_LABELS[variant].some((candidate) => normalized === normalizeEmploymentLabel(candidate));
}

function cloneMetadata(metadata) {
  return {
    ...metadata,
    riskSignalsPossible: [...metadata.riskSignalsPossible],
  };
}

function unknownMetadata(raw, warning, riskSignal) {
  return {
    raw,
    normalizedEmploymentType: "unknown",
    metadataVariant: "unknown",
    countsAsExperience: "unknown",
    countsAsGap: "unknown",
    countsAsSignal: "unknown",
    experienceWeight: "unknown",
    shortTenureApplicable: "unknown",
    riskSignalsPossible: [riskSignal],
    metadataAppliedToTimeline: false,
    metadataAppliedToCareerProfile: false,
    warnings: [warning],
  };
}

function classifyStringInput(value) {
  const raw = safeString(value);
  if (!raw) return classifyEmploymentType(raw);
  const classified = classifyEmploymentType(raw);
  if (classified.normalizedEmploymentType !== "unknown") return classified;
  if (isNormalizedEmploymentType(raw)) {
    return {
      raw,
      normalizedEmploymentType: raw,
      confidence: "high",
      matchedLabel: null,
      warnings: [],
      directNormalizedInput: true,
    };
  }
  return classified;
}

export function normalizeEmploymentMetadataInput(valueOrType) {
  if (typeof valueOrType === "string" || valueOrType == null) {
    return classifyStringInput(valueOrType);
  }

  if (typeof valueOrType === "object") {
    const raw = safeString(valueOrType.raw ?? valueOrType.value ?? valueOrType.label ?? "");
    const normalizedEmploymentType = safeString(valueOrType.normalizedEmploymentType);
    const matchedLabel = valueOrType.matchedLabel ?? null;

    if (normalizedEmploymentType && isNormalizedEmploymentType(normalizedEmploymentType)) {
      return {
        raw: raw || matchedLabel || normalizedEmploymentType,
        normalizedEmploymentType,
        confidence: valueOrType.confidence ?? "high",
        matchedLabel,
        warnings: Array.isArray(valueOrType.warnings) ? [...valueOrType.warnings] : [],
        directNormalizedInput: !matchedLabel,
      };
    }

    if (raw) return classifyStringInput(raw);
  }

  return classifyEmploymentType("");
}

function metadataForVariant(input) {
  const base = BASE_METADATA[input.normalizedEmploymentType];
  if (!base) return null;

  const metadata = cloneMetadata(base);
  const matchedLabel = input.matchedLabel;
  const warnings = [];

  if (input.normalizedEmploymentType === "founder_or_self_employed") {
    if (matchedLabel && labelMatches(matchedLabel, "self_employed")) {
      metadata.metadataVariant = "self_employed";
      metadata.riskSignalsPossible = ["business_scope_clarity_risk"];
    } else if (matchedLabel && labelMatches(matchedLabel, "founder")) {
      metadata.metadataVariant = "founder";
      metadata.riskSignalsPossible = ["business_outcome_clarity_risk"];
    } else {
      warnings.push("employment_metadata_variant_ambiguous");
    }
  }

  if (input.normalizedEmploymentType === "part_time") {
    if (matchedLabel && labelMatches(matchedLabel, "part_time_job")) {
      metadata.metadataVariant = "part_time_job";
    } else {
      metadata.metadataVariant = "part_time";
    }
  }

  if (input.normalizedEmploymentType === "project_contract") {
    if (matchedLabel && labelMatches(matchedLabel, "outsourcing")) {
      metadata.metadataVariant = "outsourcing";
      metadata.riskSignalsPossible = ["scope_clarity_risk"];
    } else {
      metadata.metadataVariant = "project_contract";
    }
  }

  if (input.normalizedEmploymentType === "training") {
    if (matchedLabel && labelMatches(matchedLabel, "bootcamp")) {
      metadata.metadataVariant = "bootcamp";
    } else {
      metadata.metadataVariant = "trainee";
    }
  }

  if (input.normalizedEmploymentType === "gap") {
    if (matchedLabel && labelMatches(matchedLabel, "career_gap")) {
      metadata.metadataVariant = "career_gap";
      metadata.countsAsSignal = false;
      metadata.riskSignalsPossible = ["career_gap_risk"];
    } else if (matchedLabel && labelMatches(matchedLabel, "career_exploration")) {
      metadata.metadataVariant = "career_exploration";
      metadata.countsAsSignal = "contextual";
      metadata.riskSignalsPossible = ["career_direction_risk"];
    } else {
      warnings.push("employment_metadata_variant_ambiguous");
    }
  }

  return {
    raw: input.raw,
    normalizedEmploymentType: input.normalizedEmploymentType,
    ...metadata,
    metadataAppliedToTimeline: false,
    metadataAppliedToCareerProfile: false,
    warnings,
  };
}

export function getEmploymentTypeMetadata(valueOrType, options = {}) {
  const input = normalizeEmploymentMetadataInput(valueOrType);

  if (input.normalizedEmploymentType === "unknown") {
    const missing = input.warnings.includes("missing_employment_type");
    return unknownMetadata(
      input.raw,
      missing ? "missing_employment_type" : "unknown_employment_type",
      missing ? "employment_type_missing" : "employment_type_unknown"
    );
  }

  const metadata = metadataForVariant(input);
  if (!metadata) {
    return unknownMetadata(input.raw, "unknown_employment_type", "employment_type_unknown");
  }

  if (options.includeClassifierWarnings === true) {
    metadata.warnings = [...new Set([...metadata.warnings, ...input.warnings])];
  }

  return metadata;
}
