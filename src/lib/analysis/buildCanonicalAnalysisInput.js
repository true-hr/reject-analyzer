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

function pickDeclaredRoleValue(resolvedObj, rawValue, canonicalValue) {
  const resolvedLabel = pickFirstNonEmpty(resolvedObj?.label, resolvedObj?.name);
  if (resolvedLabel) return { value: resolvedLabel, sourceType: "resolved_label" };

  const rawStatus = inferStatus(rawValue);
  if (rawStatus === "known") {
    return { value: toStr(rawValue), sourceType: "raw_selection" };
  }

  const canonicalStatus = inferStatus(canonicalValue);
  if (canonicalStatus === "known") {
    return { value: toStr(canonicalValue), sourceType: "canonical_value" };
  }

  return { value: null, sourceType: null };
}

function pickDeclaredRoleFamily(resolvedObj) {
  const family = pickFirstNonEmpty(resolvedObj?.major, resolvedObj?.majorCategory);
  return inferStatus(family) === "known" ? family : null;
}

function classifyDeclaredRoleConfidence(currentRole, targetRole, currentFamily, targetFamily, currentSourceType, targetSourceType) {
  const hasCurrentRole = Boolean(currentRole);
  const hasTargetRole = Boolean(targetRole);
  const hasAnyRole = hasCurrentRole || hasTargetRole;
  if (!hasAnyRole) return null;

  const currentNeedsFamily = hasCurrentRole;
  const targetNeedsFamily = hasTargetRole;
  const currentFamilyReady = !currentNeedsFamily || Boolean(currentFamily);
  const targetFamilyReady = !targetNeedsFamily || Boolean(targetFamily);
  if (currentFamilyReady && targetFamilyReady) return "high";

  const rawOnlySources = new Set(["raw_selection", "canonical_value"]);
  const currentIsRawOnly = !hasCurrentRole || rawOnlySources.has(currentSourceType);
  const targetIsRawOnly = !hasTargetRole || rawOnlySources.has(targetSourceType);
  if (currentIsRawOnly && targetIsRawOnly && !currentFamily && !targetFamily) return "low";

  return "medium";
}

// ── Phase 4-R1: diagnostics helpers (meta/diagnostics only — no scoring impact) ──

// A. Rehydration ownership: classify how a resolved object was sourced (Phase 4-R1-B: +sourceDetail)
function classifyResolvedSourceType(resolvedObj, rawValue) {
  const hasId        = Boolean(resolvedObj?.id);
  const hasObj       = resolvedObj != null;
  const hasRaw       = Boolean(toStr(rawValue));
  const resolvedId   = toStr(resolvedObj?.id ?? "");
  const resolvedLabel = toStr(resolvedObj?.label ?? resolvedObj?.name ?? "");
  const sourceDetail = {
    rawValue:       toStr(rawValue) || null,
    resolvedId:     resolvedId     || null,
    resolvedLabel:  resolvedLabel  || null,
    majorCategory:  toStr(resolvedObj?.major ?? resolvedObj?.majorCategory ?? "") || null,
    subcategory:    toStr(resolvedObj?.sub   ?? resolvedObj?.subcategory   ?? "") || null,
    legacyAliasHit: hasObj && hasId && toStr(rawValue) && lower(rawValue) !== lower(resolvedLabel),
    ambiguous:      hasObj && !hasId,
    note:           null,
  };
  if (hasObj && hasId)   return { sourceType: "saved_snapshot",        sourceConfidence: "exact",    sourceDetail };
  if (hasObj && !hasId)  return { sourceType: "legacy_mapping_assist",  sourceConfidence: "inferred", sourceDetail };
  if (!hasObj && hasRaw) return { sourceType: "raw_only_fallback",      sourceConfidence: "fallback", sourceDetail };
  return                        { sourceType: "missing",                sourceConfidence: "fallback", sourceDetail };
}

// B. Cross-validation: compare raw primitive vs resolved label
function classifyCrossValidationAlignment(rawValue, resolvedObj) {
  const raw          = lower(rawValue);
  const resolvedLabel = lower(resolvedObj?.label ?? resolvedObj?.name ?? "");
  const resolvedId   = toStr(resolvedObj?.id ?? "");
  if (!raw && !resolvedId)                      return "unresolved";
  if (!raw && resolvedId)                       return "legacy_alias_bridge";
  if (raw && !resolvedId)                       return "unresolved";
  if (raw === resolvedLabel)                    return "exact_match";
  if (resolvedId && raw !== resolvedLabel)      return "label_only_match";
  return "ambiguous_lookup";
}

// C. Legacy collision detection: flag suspicious alias / bridge patterns (Phase 4-R1-B: expanded types)
function detectLegacyCollisionEntry(rawValue, resolvedObj) {
  const raw           = lower(rawValue);
  const resolvedLabel = lower(resolvedObj?.label ?? resolvedObj?.name ?? "");
  const resolvedId    = toStr(resolvedObj?.id ?? "");
  const resolvedMajor = lower(resolvedObj?.major ?? resolvedObj?.majorCategory ?? "");
  const resolvedSub   = lower(resolvedObj?.sub   ?? resolvedObj?.subcategory   ?? "");
  // raw missing but resolved exists → raw label was swallowed by alias
  if (!raw && resolvedId) {
    return { collisionDetected: true,  collisionType: "raw_label_overlap",   needsReview: true  };
  }
  // raw present, resolved exists but label differs and no sub → possible cross-major alias
  if (raw && resolvedId && raw !== resolvedLabel && !resolvedSub) {
    return { collisionDetected: true,  collisionType: "cross_major_alias",   needsReview: true  };
  }
  // raw present, resolved exists, label differs but sub present → legacy alias bridge
  if (raw && resolvedId && raw !== resolvedLabel) {
    return { collisionDetected: true,  collisionType: "legacy_alias_bridge", needsReview: true  };
  }
  // raw exists, no resolved id, but major is set → subcategory orphan
  if (raw && !resolvedId && resolvedMajor) {
    return { collisionDetected: true,  collisionType: "subcategory_orphan",  needsReview: true  };
  }
  // raw exists, nothing resolved
  if (raw && !resolvedId) {
    return { collisionDetected: false, collisionType: "unresolved_raw",      needsReview: false };
  }
  return   { collisionDetected: false, collisionType: null,                  needsReview: false };
}

// ── end Phase 4-R1 helpers ──

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

  // resolved selection passthrough (append-only, read-only in this round)
  const roleCurrentResolved = (base?.roleCurrentResolved && typeof base.roleCurrentResolved === "object") ? base.roleCurrentResolved : null;
  const roleTargetResolved = (base?.roleTargetResolved && typeof base.roleTargetResolved === "object") ? base.roleTargetResolved : null;
  const industryCurrentResolved = (base?.industryCurrentResolved && typeof base.industryCurrentResolved === "object") ? base.industryCurrentResolved : null;
  const industryTargetResolved = (base?.industryTargetResolved && typeof base.industryTargetResolved === "object") ? base.industryTargetResolved : null;

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
  const declaredCurrentRoleSelection = pickDeclaredRoleValue(
    roleCurrentResolved,
    currentRoleRaw,
    roleCurrent.value
  );
  const declaredTargetRoleSelection = pickDeclaredRoleValue(
    roleTargetResolved,
    targetRoleRaw,
    roleTarget.value
  );
  const declaredCurrentRoleFamily = pickDeclaredRoleFamily(roleCurrentResolved);
  const declaredTargetRoleFamily = pickDeclaredRoleFamily(roleTargetResolved);
  const declaredRole = {
    declaredCurrentRole: declaredCurrentRoleSelection.value,
    declaredTargetRole: declaredTargetRoleSelection.value,
    declaredCurrentRoleFamily,
    declaredTargetRoleFamily,
    declaredRoleSource: "user_selected",
    declaredRoleConfidence: classifyDeclaredRoleConfidence(
      declaredCurrentRoleSelection.value,
      declaredTargetRoleSelection.value,
      declaredCurrentRoleFamily,
      declaredTargetRoleFamily,
      declaredCurrentRoleSelection.sourceType,
      declaredTargetRoleSelection.sourceType
    ),
  };
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
      // resolved selection context (read-only this round, no scoring impact)
      selectionResolved: {
        currentJob: roleCurrentResolved,
        targetJob: roleTargetResolved,
        currentIndustry: industryCurrentResolved,
        targetIndustry: industryTargetResolved,
      },
      declaredRole,
      // TASK 3: resolved rehydration boundary meta
      // - raw primitive (roleCurrent etc.) remains SSOT; resolved is derived/read-only
      // - source: "saved" = lookup resolved from InputFlow persisted in state
      //           "unavailable" = not in state; analysis uses raw primitive only
      //           "rehydrated" = rebuilt from raw at analysis time (not yet implemented, Phase 6)
      selectionResolvedMeta: {
        source: (roleCurrentResolved || roleTargetResolved || industryCurrentResolved || industryTargetResolved)
          ? "saved"
          : "unavailable",
        hasCurrentJob: Boolean(roleCurrentResolved?.id),
        hasTargetJob: Boolean(roleTargetResolved?.id),
        hasCurrentIndustry: Boolean(industryCurrentResolved?.id),
        hasTargetIndustry: Boolean(industryTargetResolved?.id),
        // primitive presence (raw values, always SSOT)
        primitivePresence: {
          roleCurrent: Boolean(pickFirstNonEmpty(base?.currentRole, base?.roleCurrent)),
          roleTarget: Boolean(pickFirstNonEmpty(base?.roleTarget, base?.targetRole)),
          industryCurrent: Boolean(pickFirstNonEmpty(base?.industryCurrent, base?.currentIndustry)),
          industryTarget: Boolean(pickFirstNonEmpty(base?.industryTarget, base?.targetIndustry)),
        },
        // Phase 4-R1: per-field rehydration ownership provenance (diagnostics only)
        ownershipProvenance: {
          currentJob:      classifyResolvedSourceType(roleCurrentResolved,    currentRoleRaw),
          targetJob:       classifyResolvedSourceType(roleTargetResolved,     targetRoleRaw),
          currentIndustry: classifyResolvedSourceType(industryCurrentResolved, currentIndustryRaw),
          targetIndustry:  classifyResolvedSourceType(industryTargetResolved,  targetIndustryRaw),
        },
      },
      // Phase 4-R1: cross-validation — raw primitive vs resolved label alignment (diagnostics only)
      crossValidation: {
        version: "crossval-v1",
        roleCurrentAlignment:    classifyCrossValidationAlignment(currentRoleRaw,    roleCurrentResolved),
        roleTargetAlignment:     classifyCrossValidationAlignment(targetRoleRaw,     roleTargetResolved),
        roleCurrentSubAlignment: classifyCrossValidationAlignment(currentRoleSubRaw, roleCurrentResolved?.sub ?? null),
        roleTargetSubAlignment:  classifyCrossValidationAlignment(targetRoleSubRaw,  roleTargetResolved?.sub ?? null),
        industryCurrentAlignment:    classifyCrossValidationAlignment(currentIndustryRaw,    industryCurrentResolved),
        industryTargetAlignment:     classifyCrossValidationAlignment(targetIndustryRaw,     industryTargetResolved),
        industryCurrentSubAlignment: classifyCrossValidationAlignment(currentIndustrySubRaw, industryCurrentResolved?.sub ?? null),
        industryTargetSubAlignment:  classifyCrossValidationAlignment(targetIndustrySubRaw,  industryTargetResolved?.sub ?? null),
      },
      // Phase 4-R1/R1-B: legacy collision diagnostics (diagnostics only, no double-call)
      legacyCollisionDiagnostics: (() => {
        const _cj = detectLegacyCollisionEntry(currentRoleRaw,     roleCurrentResolved);
        const _tj = detectLegacyCollisionEntry(targetRoleRaw,      roleTargetResolved);
        const _ci = detectLegacyCollisionEntry(currentIndustryRaw, industryCurrentResolved);
        const _ti = detectLegacyCollisionEntry(targetIndustryRaw,  industryTargetResolved);
        return {
          version: "collision-v2",
          currentJob:      _cj,
          targetJob:       _tj,
          currentIndustry: _ci,
          targetIndustry:  _ti,
          needsReview:     _cj.needsReview || _tj.needsReview || _ci.needsReview || _ti.needsReview,
        };
      })(),
      // Phase 4-R1-B: resolved_vs_ai_detected stub
      // ai-detected values (detectedRole, detectedIndustry) are available in analyzer.js scope,
      // not at canonicalization time. This block is enriched by analyzer.js after buildCanonicalAnalysisInput.
      resolvedVsAiDetected: {
        version: "rva-v1",
        aiDetectedAvailability: false,
        unresolvedReason: "ai detected values not available at canonicalization time — enriched downstream by analyzer.js",
        roleMajor:    null,
        roleSub:      null,
        industryMajor: null,
        industrySub:  null,
      },
      // Phase 4-R1-B: consumer read-path diagnostics (diagnostics only)
      consumerReadDiagnostics: {
        version: "crd-v1",
        consumerFile:             "src/lib/analyzer.js",
        consumerFunction:         "analyze",
        consumedRoleField:        "stateCanonical.canonical.role.target.value / stateCanonical.roleTarget",
        consumedIndustryField:    "stateCanonical.industry / stateCanonical.industryCurrent",
        consumedSelectionSource:  "stateCanonical.canonical.selectionResolved → buildCandidateAxisPack / buildMajorSignals / buildInteractionPack",
        readPathLocked:           true,
      },
    },
  };
}

export default buildCanonicalAnalysisInput;
