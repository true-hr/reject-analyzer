export const CAREER_PROFILE_SCHEMA_VERSION = "passmap.careerProfile.v0";

const SUMMARY_DEFAULTS = Object.freeze({
  totalExperienceMonths: 0,
  uniqueExperienceMonths: 0,
  overlapMonths: 0,
  gapMonths: 0,
  shortTenureCount: 0,
  currentRoleMonths: 0,
  recentExperienceMonths: 0,
  experienceCount: 0,
});

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function safeNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

export function createEmptyCareerProfile() {
  return {
    schemaVersion: CAREER_PROFILE_SCHEMA_VERSION,
    timeline: [],
    summary: { ...SUMMARY_DEFAULTS },
    signals: {
      roleFamilies: [],
      industryDomains: [],
      strengthSignals: [],
      riskSignals: [],
      skillSignals: [],
      toolSignals: [],
    },
    meta: {
      source: null,
      createdAt: null,
      updatedAt: null,
      warnings: [],
    },
  };
}

export function normalizeCareerProfile(profile) {
  const base = createEmptyCareerProfile();
  const input = safeObject(profile);
  const inputSummary = safeObject(input.summary);
  const inputSignals = safeObject(input.signals);
  const inputMeta = safeObject(input.meta);

  return {
    schemaVersion: CAREER_PROFILE_SCHEMA_VERSION,
    timeline: safeArray(input.timeline),
    summary: {
      totalExperienceMonths: safeNumber(inputSummary.totalExperienceMonths),
      uniqueExperienceMonths: safeNumber(inputSummary.uniqueExperienceMonths),
      overlapMonths: safeNumber(inputSummary.overlapMonths),
      gapMonths: safeNumber(inputSummary.gapMonths),
      shortTenureCount: safeNumber(inputSummary.shortTenureCount),
      currentRoleMonths: safeNumber(inputSummary.currentRoleMonths),
      recentExperienceMonths: safeNumber(inputSummary.recentExperienceMonths),
      experienceCount: safeNumber(inputSummary.experienceCount),
    },
    signals: {
      roleFamilies: safeArray(inputSignals.roleFamilies),
      industryDomains: safeArray(inputSignals.industryDomains),
      strengthSignals: safeArray(inputSignals.strengthSignals),
      riskSignals: safeArray(inputSignals.riskSignals),
      skillSignals: safeArray(inputSignals.skillSignals),
      toolSignals: safeArray(inputSignals.toolSignals),
    },
    meta: {
      ...base.meta,
      ...inputMeta,
      warnings: safeArray(inputMeta.warnings),
    },
  };
}
