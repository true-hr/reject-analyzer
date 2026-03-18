// src/lib/analysis/buildCanonicalAnalysisInput.js
// Canonicalization layer for analysis input contracts (append-only, minimal-invasive)

const UNKNOWN_TOKENS = new Set([
  "unknown",
  "모름",
  "모름/기타",
  "기타",
]);

const NA_TOKENS = new Set([
  "na",
  "n/a",
  "not_applicable",
  "해당없음",
  "해당 없음",
]);

function toStr(v) {
  return (v ?? "").toString().trim();
}

function lower(v) {
  return toStr(v).toLowerCase();
}

function pickFirstNonEmpty(...vals) {
  for (const v of vals) {
    const s = toStr(v);
    if (s) return s;
  }
  return "";
}

function inferStatus(value) {
  const s = toStr(value);
  if (!s) return "empty";
  const k = lower(s);
  if (NA_TOKENS.has(k)) return "na";
  if (UNKNOWN_TOKENS.has(k)) return "unknown";
  return "known";
}

function normalizeByStatus(value, status) {
  if (status === "na") return "na";
  if (status === "unknown") return "unknown";
  if (status === "empty") return "";
  return toStr(value);
}

function makeCanonicalField(rawValue, sourceKey, forceStatus = null) {
  const status = forceStatus || inferStatus(rawValue);
  return {
    value: normalizeByStatus(rawValue, status),
    status,
    sourceKey,
  };
}

export function buildCanonicalAnalysisInput(state = {}) {
  const base = state && typeof state === "object" ? state : {};
  const entryLevelMode = Boolean(base?.entryLevelMode);
  const careerBase = base?.career && typeof base.career === "object" ? base.career : {};

  const currentRoleRaw = pickFirstNonEmpty(base?.currentRole, base?.roleCurrent);
  const targetRoleRaw = pickFirstNonEmpty(base?.roleTarget, base?.targetRole);
  const currentRoleSubRaw = pickFirstNonEmpty(base?.roleCurrentSub);
  const targetRoleSubRaw = pickFirstNonEmpty(base?.roleTargetSub);

  const currentIndustryRaw = pickFirstNonEmpty(base?.industryCurrent, base?.currentIndustry);
  const targetIndustryRaw = pickFirstNonEmpty(base?.industryTarget, base?.targetIndustry);
  const currentIndustrySubRaw = pickFirstNonEmpty(base?.industryCurrentSub);
  const targetIndustrySubRaw = pickFirstNonEmpty(base?.industryTargetSub);

  const currentCompanySizeRaw = pickFirstNonEmpty(
    base?.companySizeCandidate,
    base?.companySizeCurrent,
    base?.companySize
  );
  const targetCompanySizeRaw = pickFirstNonEmpty(
    base?.companySizeTarget,
    base?.targetCompanySize
  );

  const currentSalaryRaw = pickFirstNonEmpty(base?.salaryCurrent);
  const targetSalaryRaw = pickFirstNonEmpty(base?.salaryTarget, base?.salaryExpected);

  const currentStatusForced = entryLevelMode ? "na" : null;

  const roleCurrent = makeCanonicalField(currentRoleRaw, "currentRole|roleCurrent", currentStatusForced);
  const roleTarget = makeCanonicalField(targetRoleRaw, "roleTarget|targetRole");
  const roleCurrentSub = makeCanonicalField(currentRoleSubRaw, "roleCurrentSub", currentStatusForced);
  const roleTargetSub = makeCanonicalField(targetRoleSubRaw, "roleTargetSub");

  const industryCurrent = makeCanonicalField(currentIndustryRaw, "industryCurrent|currentIndustry", currentStatusForced);
  const industryTarget = makeCanonicalField(targetIndustryRaw, "industryTarget|targetIndustry");
  const industryCurrentSub = makeCanonicalField(currentIndustrySubRaw, "industryCurrentSub", currentStatusForced);
  const industryTargetSub = makeCanonicalField(targetIndustrySubRaw, "industryTargetSub");

  const companySizeCurrent = makeCanonicalField(
    currentCompanySizeRaw,
    "companySizeCandidate|companySizeCurrent|companySize",
    currentStatusForced
  );
  const companySizeTarget = makeCanonicalField(targetCompanySizeRaw, "companySizeTarget|targetCompanySize");

  const salaryCurrent = makeCanonicalField(currentSalaryRaw, "salaryCurrent", currentStatusForced);
  const salaryTarget = makeCanonicalField(targetSalaryRaw, "salaryTarget|salaryExpected");
  const careerCanonical = entryLevelMode
    ? {
        ...careerBase,
        totalYears: 0,
        gapMonths: 0,
        jobChanges: 0,
        lastTenureMonths: 0,
        leadershipLevel: "individual",
      }
    : careerBase;
  const careerStage = entryLevelMode ? "entry" : "experienced";

  return {
    ...base,
    career: careerCanonical,
    careerStage,
    isEntryCandidate: entryLevelMode,
    // Current/Target role contract (overwrites only analysis payload, not UI source-of-truth)
    currentRole: roleCurrent.value,
    roleCurrent: roleCurrent.value,
    roleCurrentSub: roleCurrentSub.value,
    roleTarget: roleTarget.value,
    targetRole: roleTarget.value,
    roleTargetSub: roleTargetSub.value,

    industryCurrent: industryCurrent.value,
    industryCurrentSub: industryCurrentSub.value,
    industryTarget: industryTarget.value,
    industryTargetSub: industryTargetSub.value,

    companySizeCandidate: companySizeCurrent.value,
    companySizeCurrent: companySizeCurrent.value,
    companySizeTarget: companySizeTarget.value,

    salaryCurrent: salaryCurrent.value,
    salaryTarget: salaryTarget.value,
    salaryExpected: salaryTarget.value,
    leadershipLevel:
      entryLevelMode
        ? "individual"
        : pickFirstNonEmpty(careerCanonical?.leadershipLevel, base?.leadershipLevel),

    canonical: {
      version: 1,
      entryLevelMode,
      careerStage,
      isEntryCandidate: entryLevelMode,
      role: {
        current: roleCurrent,
        currentSub: roleCurrentSub,
        target: roleTarget,
        targetSub: roleTargetSub,
      },
      industry: {
        current: industryCurrent,
        currentSub: industryCurrentSub,
        target: industryTarget,
        targetSub: industryTargetSub,
      },
      companySize: {
        current: companySizeCurrent,
        target: companySizeTarget,
      },
      salary: {
        current: salaryCurrent,
        target: salaryTarget,
      },
      career: careerCanonical,
      rules: {
        excludeCurrentTargetMismatch: entryLevelMode,
        excludeExperiencedOnlyRisks: entryLevelMode,
      },
    },
  };
}

export default buildCanonicalAnalysisInput;
