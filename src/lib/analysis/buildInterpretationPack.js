// src/lib/analysis/buildInterpretationPack.js
// Phase 9-4: section-level assembly scaffold
//
// Role:
//   - Takes the Phase 9-3 hydrated interpretationPack and appends sectionAssemblies
//   - sectionAssemblies is a read-only interpretation frame index (not signal payload store)
//   - No sentence generation — sentenceDrafts always []
//   - No score/gate recomputation
//   - No raw primitive re-reading
//
// Input contract:
//   interpretationPack  — Phase 9-3 hydrated pack (from buildInteractionPack)
//   interpretationInput — Phase 9-1 input contract (from buildInteractionPack)
//   interactionDecision — Phase 8-6 consumer contract (from buildInteractionPack)
//   axes                — Phase 8-2 axes object (from buildInteractionPack)

// ─────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────
function safeArray(v) {
  return Array.isArray(v) ? v.filter(Boolean) : [];
}

// Returns slot keys that have at least 1 signal
function pickExistingSlotKeys(slots) {
  if (!slots || typeof slots !== "object") return [];
  return Object.entries(slots)
    .filter(([, arr]) => Array.isArray(arr) && arr.length > 0)
    .map(([key]) => key);
}

function buildEmptySectionAssembly(key, narrativeOrder) {
  return {
    key,
    status: "unavailable",
    confidence: null,
    primaryThesis: "unclear",
    primaryEvidenceKeys: [],
    secondaryEvidenceKeys: [],
    conflictKeys: [],
    unresolvedKeys: [],
    diagnosticsKeys: [],
    narrativeOrder: safeArray(narrativeOrder),
    notes: [],
  };
}

// ─────────────────────────────────────────────
// buildRiskSummaryAssembly (Phase 9-4)
// Sources: interactionDecision (primary), riskSummary slots (secondary/diagnostics)
// ─────────────────────────────────────────────
function buildRiskSummaryAssembly(interpretationPack, interactionDecision) {
  const NARRATIVE_ORDER = ["primaryRisk", "supportDrivers", "conflicts", "unresolvedFlags"];
  const base = buildEmptySectionAssembly("riskSummary", NARRATIVE_ORDER);

  const iDec = interactionDecision && typeof interactionDecision === "object" ? interactionDecision : null;
  const riskSlots = interpretationPack?.sections?.riskSummary?.slots ?? {};
  const existingKeys = pickExistingSlotKeys(riskSlots);

  const riskCount     = iDec ? safeArray(iDec.riskDrivers).length : 0;
  const supportCount  = iDec ? safeArray(iDec.supportDrivers).length : 0;
  const conflictCount = iDec ? safeArray(iDec.conflicts).length : 0;

  // primaryThesis — tightened: dominance + conflict weight, no new scoring
  let primaryThesis = "unclear";
  if (iDec) {
    const hasRisk     = riskCount > 0;
    const hasSupport  = supportCount > 0;
    const hasConflict = conflictCount > 0;

    if (hasConflict && hasRisk && hasSupport) {
      // both axes + conflict — "conflicted" if conflict is substantial relative to either axis
      primaryThesis = (conflictCount >= riskCount || conflictCount >= supportCount)
        ? "conflicted"
        : "balanced";
    } else if (hasConflict) {
      primaryThesis = "conflicted";
    } else if (hasRisk && !hasSupport) {
      primaryThesis = "risk-led";
    } else if (hasSupport && !hasRisk) {
      primaryThesis = "support-led";
    } else if (hasRisk && hasSupport) {
      primaryThesis = "balanced";
    }
  }

  // evidence key arrays — slot key index only, no deep copy
  // primary = dominant axis, secondary = subordinate axis
  const hasRiskSlot    = existingKeys.includes("primaryRisks");
  const hasSupportSlot = existingKeys.includes("supportDrivers");
  const conflictKeys   = existingKeys.filter((k) => k === "conflicts");
  const unresolvedKeys = existingKeys.filter((k) => k === "unresolvedFlags");

  let primaryEvidenceKeys;
  let secondaryEvidenceKeys;
  if (primaryThesis === "risk-led") {
    primaryEvidenceKeys   = hasRiskSlot    ? ["primaryRisks"]   : [];
    secondaryEvidenceKeys = hasSupportSlot ? ["supportDrivers"] : [];
  } else if (primaryThesis === "support-led") {
    primaryEvidenceKeys   = hasSupportSlot ? ["supportDrivers"] : [];
    secondaryEvidenceKeys = hasRiskSlot    ? ["primaryRisks"]   : [];
  } else {
    // balanced / conflicted / unclear — both axes as primary frame
    primaryEvidenceKeys   = [hasRiskSlot && "primaryRisks", hasSupportSlot && "supportDrivers"].filter(Boolean);
    secondaryEvidenceKeys = [];
  }

  // diagnosticsKeys — confidence adjustment sources
  const diagnosticsKeys = [];
  if (iDec?.highConfidenceBlocked === true) diagnosticsKeys.push("highConfidenceBlocked");
  if (iDec?.tieBreakApplied === true)       diagnosticsKeys.push("tieBreakApplied");
  if (iDec?.unresolvedLevel)                diagnosticsKeys.push(`unresolvedLevel_${iDec.unresolvedLevel}`);

  // status — "usable" requires interactionDecision + ≥2 narrative axes coverable
  const coverableNarrativeAxes = [
    primaryEvidenceKeys.length > 0,
    conflictKeys.length > 0,
    unresolvedKeys.length > 0,
  ].filter(Boolean).length;

  let status = "unavailable";
  if (iDec && primaryEvidenceKeys.length >= 1 && coverableNarrativeAxes >= 2) {
    status = "usable";
  } else if (iDec && primaryEvidenceKeys.length >= 1) {
    status = "partial";
  } else if (existingKeys.length > 0) {
    status = "partial";
  }

  // confidence — tightened: primary ≥2 + conflict/unresolved structure → medium
  let confidence = null;
  if (primaryEvidenceKeys.length >= 2 && (conflictKeys.length > 0 || unresolvedKeys.length > 0)) {
    confidence = "medium";
  } else if (primaryEvidenceKeys.length >= 2) {
    confidence = "medium";
  } else if (primaryEvidenceKeys.length === 1 || existingKeys.length > 0) {
    confidence = "low";
  }

  // notes
  const notes = [];
  if (!iDec)                              notes.push("interactionDecision unavailable; slots-only assembly");
  if (riskCount > 0 && supportCount > 0)  notes.push("risk and support signals coexist");
  if (conflictCount > 0)                  notes.push("conflict signals present");
  if (unresolvedKeys.length > 0 && diagnosticsKeys.length === 0) notes.push("limited unresolved diagnostics");

  return {
    ...base,
    status,
    confidence,
    primaryThesis,
    primaryEvidenceKeys,
    secondaryEvidenceKeys,
    conflictKeys,
    unresolvedKeys,
    diagnosticsKeys,
    notes,
  };
}

// ─────────────────────────────────────────────
// buildIndustryContextAssembly (Phase 9-4)
// Sources: industryAxis (primary), industryContext slots (secondary), interactionDecision (diagnostics)
// ─────────────────────────────────────────────
function buildIndustryContextAssembly(interpretationPack, interpretationInput, interactionDecision) {
  const NARRATIVE_ORDER = ["sectorContext", "adjacencyContext", "boundaryContext", "transferImplication"];
  const base = buildEmptySectionAssembly("industryContext", NARRATIVE_ORDER);

  const indSlots     = interpretationPack?.sections?.industryContext?.slots ?? {};
  const existingKeys = pickExistingSlotKeys(indSlots);
  const industryAxis = interpretationInput?.secondarySources?.candidateAxisPack?.industryAxis ?? null;
  const indCtxTarget = interpretationInput?.secondarySources?.industryContext?.target ?? null;

  // primaryThesis — from existing axis state, no recomputation
  let primaryThesis = "unclear";
  if (industryAxis?.available === true) {
    if (industryAxis.sameSector === true) {
      primaryThesis = "same-sector";
    } else if (industryAxis.relatedByBoundaryHint === true) {
      primaryThesis = "adjacent-sector";
    } else if (industryAxis.differentSector === true) {
      const hasBoundaryHints = safeArray(indCtxTarget?.boundaryHints).length > 0;
      primaryThesis = hasBoundaryHints ? "boundary-crossing" : "far-sector-shift";
    }
  }

  // evidence key arrays — slot key index only
  // primary = sector/adjacency continuity; secondary = transfer; conflict = boundary friction
  const primaryEvidenceKeys   = existingKeys.filter((k) => ["sectorSignals", "adjacencySignals"].includes(k));
  const secondaryEvidenceKeys = existingKeys.filter((k) => k === "industryTransferSignals");
  const conflictKeys          = existingKeys.filter((k) => k === "boundarySignals");

  // unresolvedKeys — flag incomplete/missing axis mapping
  const unresolvedKeys = [];
  if (!industryAxis?.available) unresolvedKeys.push("industryAxis-unavailable");
  if (industryAxis?.available && !industryAxis?.currentIndustryId) unresolvedKeys.push("currentIndustry-unresolved");
  if (industryAxis?.available && !industryAxis?.targetIndustryId)  unresolvedKeys.push("targetIndustry-unresolved");

  // diagnosticsKeys — axis completeness + transfer evidence status
  const diagnosticsKeys = [];
  if (interactionDecision?.primaryType)  diagnosticsKeys.push("interactionDecision.primaryType");
  if (!industryAxis?.available)          diagnosticsKeys.push("limitedIndustryAxisEvidence");
  if (secondaryEvidenceKeys.length === 0) diagnosticsKeys.push("limitedTransferEvidence");

  // dedupe diagnosticsKeys
  const diagnosticsKeysDeduped = [...new Set(diagnosticsKeys)];

  // status — "usable" requires axis + ≥2 narrative structures coverable
  const coverableNarrativeAxes = [
    primaryEvidenceKeys.length > 0,
    conflictKeys.length > 0 || existingKeys.includes("boundarySignals"),
    secondaryEvidenceKeys.length > 0,
  ].filter(Boolean).length;

  let status = "unavailable";
  if (industryAxis?.available === true && primaryEvidenceKeys.length >= 1 && coverableNarrativeAxes >= 2) {
    status = "usable";
  } else if (primaryEvidenceKeys.length >= 1 || existingKeys.length > 0) {
    status = "partial";
  }

  // confidence — tightened: count of sector/adjacency/boundary structures present
  const structureCount = [
    existingKeys.includes("sectorSignals"),
    existingKeys.includes("adjacencySignals"),
    existingKeys.includes("boundarySignals"),
  ].filter(Boolean).length;

  let confidence = null;
  if (structureCount >= 2) {
    confidence = "medium";
  } else if (structureCount === 1 || existingKeys.length > 0) {
    confidence = "low";
  }

  // notes
  const notes = [];
  if (!industryAxis?.available)                      notes.push("limited industry transfer evidence");
  if (existingKeys.includes("boundarySignals"))      notes.push("boundary hints present");
  if (primaryThesis === "same-sector")               notes.push("sector continuity signals available");
  if (existingKeys.length > 0 && structureCount < 2) notes.push("industry mapping partially populated");

  return {
    ...base,
    status,
    confidence,
    primaryThesis,
    primaryEvidenceKeys,
    secondaryEvidenceKeys,
    conflictKeys,
    unresolvedKeys,
    diagnosticsKeys: diagnosticsKeysDeduped,
    notes,
  };
}

// ─────────────────────────────────────────────
// buildWorkStyleExecutionAssembly (Phase 9-4)
// Sources: workModeShiftAxis, proofTransferAxis, decisionFrictionAxis (primary), slots (secondary)
// ─────────────────────────────────────────────
function buildWorkStyleExecutionAssembly(interpretationPack, axes) {
  const NARRATIVE_ORDER = ["workModeShift", "executionContext", "transferability", "friction"];
  const base = buildEmptySectionAssembly("workStyleExecution", NARRATIVE_ORDER);

  const wsSlots      = interpretationPack?.sections?.workStyleExecution?.slots ?? {};
  const existingKeys = pickExistingSlotKeys(wsSlots);
  const workModeAxis = axes?.workModeShiftAxis ?? null;
  const proofAxis    = axes?.proofTransferAxis ?? null;
  const frictionAxis = axes?.decisionFrictionAxis ?? null;

  // primaryThesis — from existing axis state, no recomputation
  const hasFriction          = frictionAxis?.frictionDetected === true || safeArray(frictionAxis?.signals).length > 0;
  const transferable         = proofAxis?.transferable === true;
  const partiallyTransferable = proofAxis?.partiallyTransferable === true;
  const weakTransfer         = proofAxis?.weakTransfer === true;
  const shiftDetected        = workModeAxis?.shiftDetected === true;
  const proofAvailable       = proofAxis?.available === true;

  let primaryThesis = "unclear";
  if (hasFriction && !transferable) {
    primaryThesis = "friction-heavy-shift";
  } else if (transferable && !hasFriction) {
    primaryThesis = "execution-continuity";
  } else if (partiallyTransferable) {
    primaryThesis = "partial-transfer";
  } else if (weakTransfer || shiftDetected) {
    primaryThesis = "partial-transfer";
  } else if (proofAvailable && !transferable && !partiallyTransferable && !weakTransfer) {
    primaryThesis = "proof-gap";
  }

  // evidence key arrays — slot key index only
  // primary = work mode + proof transfer; secondary = execution context
  const primaryEvidenceKeys   = existingKeys.filter((k) => ["workModeShiftSignals", "transferabilitySignals"].includes(k));
  const secondaryEvidenceKeys = existingKeys.filter((k) => k === "executionContextSignals");
  const conflictKeys          = existingKeys.filter((k) => k === "frictionSignals");

  // unresolvedKeys — proof insufficiency / missing execution evidence
  const unresolvedKeys = [];
  if (proofAvailable && !transferable && !partiallyTransferable && !weakTransfer) {
    unresolvedKeys.push("proof-insufficiency");
  }
  if (workModeAxis?.available === true && !shiftDetected && primaryEvidenceKeys.length === 0) {
    unresolvedKeys.push("missing-execution-evidence");
  }

  // diagnosticsKeys — partial population / sparse axis signals
  const diagnosticsKeys = [];
  const workModeAvail = workModeAxis?.available === true;
  if (!workModeAvail && !proofAvailable)                diagnosticsKeys.push("axes-both-unavailable");
  else if (!workModeAvail || !proofAvailable)           diagnosticsKeys.push("axes-partial");
  if (primaryEvidenceKeys.length === 0 && existingKeys.length > 0) diagnosticsKeys.push("sparse-primary-signals");

  // status — "usable" requires ≥1 axis available + ≥2 narrative structures coverable
  const coverableNarrativeAxes = [
    primaryEvidenceKeys.length > 0,
    secondaryEvidenceKeys.length > 0,
    conflictKeys.length > 0,
  ].filter(Boolean).length;

  let status = "unavailable";
  if ((workModeAvail || proofAvailable) && primaryEvidenceKeys.length >= 1 && coverableNarrativeAxes >= 2) {
    status = "usable";
  } else if ((workModeAvail || proofAvailable) && primaryEvidenceKeys.length >= 1) {
    status = "partial";
  } else if (primaryEvidenceKeys.length > 0 || existingKeys.length > 0) {
    status = "partial";
  }

  // confidence — axis-based: workMode + proofTransfer signal presence
  const axisCoverage = [
    workModeAvail && safeArray(workModeAxis?.signals).length > 0,
    proofAvailable && (transferable || partiallyTransferable || weakTransfer),
  ].filter(Boolean).length;

  let confidence = null;
  if (axisCoverage >= 2) {
    confidence = "medium";
  } else if (axisCoverage === 1 || primaryEvidenceKeys.length > 0) {
    confidence = "low";
  }

  // notes
  const notes = [];
  if (!workModeAvail && !proofAvailable)  notes.push("work-style signals partially populated");
  if (proofAvailable && !transferable)    notes.push("proof transfer evidence limited");
  if (hasFriction)                        notes.push("decision friction signals present");
  if (transferable && !hasFriction)       notes.push("execution continuity signals available");

  return {
    ...base,
    status,
    confidence,
    primaryThesis,
    primaryEvidenceKeys,
    secondaryEvidenceKeys,
    conflictKeys,
    unresolvedKeys,
    diagnosticsKeys,
    notes,
  };
}

// ─────────────────────────────────────────────
// buildCareerAccumulationAssembly (Phase 9-4 3rd)
// Sources: careerAccumulation slots (primary), candidateAxisPack (secondary), interactionDecision (diagnostics)
// ─────────────────────────────────────────────
function buildCareerAccumulationAssembly(interpretationPack, interpretationInput, interactionDecision) {
  const NARRATIVE_ORDER = ["relatedCareer", "continuity", "consistency", "transitionReadiness"];
  const base = buildEmptySectionAssembly("careerAccumulation", NARRATIVE_ORDER);

  const caSlots      = interpretationPack?.sections?.careerAccumulation?.slots ?? {};
  const existingKeys = pickExistingSlotKeys(caSlots);
  const iDec         = interactionDecision && typeof interactionDecision === "object" ? interactionDecision : null;

  const hasRelated    = existingKeys.includes("relatedCareerSignals");
  const hasContinuity = existingKeys.includes("continuitySignals");
  const hasConsistency = existingKeys.includes("consistencySignals");
  const hasTransition = existingKeys.includes("transitionReadinessSignals");

  const riskCount    = iDec ? safeArray(iDec.riskDrivers).length : 0;
  const supportCount = iDec ? safeArray(iDec.supportDrivers).length : 0;

  // primaryThesis — slot presence + iDec risk/support balance, no new scoring
  let primaryThesis = "unclear";
  if (hasRelated && hasContinuity && hasConsistency) {
    primaryThesis = "strong-accumulation";
  } else if (hasRelated && (!hasContinuity || !hasConsistency)) {
    primaryThesis = (riskCount > supportCount) ? "continuity-risk" : "related-but-fragmented";
  } else if (hasTransition && !hasRelated && riskCount > 0) {
    primaryThesis = "continuity-risk";
  } else if (hasTransition) {
    primaryThesis = "transition-building";
  } else if (!hasRelated && hasContinuity) {
    // Phase 11-9B: continuity risk signal exists without related career coverage.
    // e.g. significant gap (>=6mo) or high careerRiskScore with mismatched role.
    // "related-but-fragmented" would be misleading when there is no related career at all.
    primaryThesis = "continuity-risk";
  } else if (existingKeys.length > 0) {
    primaryThesis = "related-but-fragmented";
  }

  // evidence key arrays — slot key index only
  let primaryEvidenceKeys;
  let secondaryEvidenceKeys;
  if (primaryThesis === "strong-accumulation") {
    primaryEvidenceKeys   = [hasRelated && "relatedCareerSignals", hasContinuity && "continuitySignals"].filter(Boolean);
    secondaryEvidenceKeys = [hasConsistency && "consistencySignals", hasTransition && "transitionReadinessSignals"].filter(Boolean);
  } else if (primaryThesis === "transition-building" || primaryThesis === "continuity-risk") {
    primaryEvidenceKeys   = [hasTransition && "transitionReadinessSignals", hasRelated && "relatedCareerSignals"].filter(Boolean);
    secondaryEvidenceKeys = [hasContinuity && "continuitySignals"].filter(Boolean);
  } else {
    primaryEvidenceKeys   = [hasRelated && "relatedCareerSignals"].filter(Boolean);
    secondaryEvidenceKeys = [hasContinuity && "continuitySignals", hasConsistency && "consistencySignals"].filter(Boolean);
  }

  // conflictKeys — transition signals indicating risk
  const conflictKeys = (hasTransition && riskCount > 0) ? ["transitionReadinessSignals"] : [];

  // unresolvedKeys — missing career evidence
  const unresolvedKeys = [];
  if (!hasRelated) unresolvedKeys.push("relatedCareer-unresolved");
  if (!hasContinuity && hasRelated) unresolvedKeys.push("continuity-evidence-limited");

  // diagnosticsKeys
  const diagnosticsKeys = [];
  if (existingKeys.length > 0 && primaryEvidenceKeys.length === 0) diagnosticsKeys.push("sparse-career-evidence");
  if (hasRelated && !hasContinuity && !hasConsistency) diagnosticsKeys.push("partial-accumulation-signals");
  if (!hasRelated && !hasContinuity) diagnosticsKeys.push("limited-continuity-coverage");
  const diagnosticsKeysDeduped = [...new Set(diagnosticsKeys)];

  // status — "usable" requires primaryEvidence + ≥2 narrative axes coverable
  const coverableNarrativeAxes = [
    primaryEvidenceKeys.length > 0,
    secondaryEvidenceKeys.length > 0,
    conflictKeys.length > 0 || unresolvedKeys.length > 0,
  ].filter(Boolean).length;

  let status = "unavailable";
  if (primaryEvidenceKeys.length >= 1 && coverableNarrativeAxes >= 2) {
    status = "usable";
  } else if (primaryEvidenceKeys.length >= 1 || existingKeys.length > 0) {
    status = "partial";
  }

  // confidence — 2+ career structures present → medium
  const structureCount = [hasRelated, hasContinuity, hasConsistency, hasTransition].filter(Boolean).length;
  let confidence = null;
  if (structureCount >= 2) {
    confidence = "medium";
  } else if (structureCount === 1) {
    confidence = "low";
  }

  // notes
  const notes = [];
  if (hasContinuity)                 notes.push("career continuity signals available");
  if (!hasRelated)                   notes.push("related career evidence limited");
  if (hasTransition)                 notes.push("transition readiness signals present");
  if (existingKeys.length > 0 && structureCount < 2) notes.push("accumulation signals partially populated");

  return {
    ...base,
    status,
    confidence,
    primaryThesis,
    primaryEvidenceKeys,
    secondaryEvidenceKeys,
    conflictKeys,
    unresolvedKeys,
    diagnosticsKeys: diagnosticsKeysDeduped,
    notes,
  };
}

// ─────────────────────────────────────────────
// buildLevelPositionFitAssembly (Phase 9-4 3rd)
// Sources: levelPositionFit slots (primary), candidateAxisPack/jobContext (secondary), interactionDecision (diagnostics)
// ─────────────────────────────────────────────
function buildLevelPositionFitAssembly(interpretationPack, interpretationInput, interactionDecision) {
  const NARRATIVE_ORDER = ["seniority", "scope", "leadership", "decisionDistance"];
  const base = buildEmptySectionAssembly("levelPositionFit", NARRATIVE_ORDER);

  const lpSlots      = interpretationPack?.sections?.levelPositionFit?.slots ?? {};
  const existingKeys = pickExistingSlotKeys(lpSlots);
  const iDec         = interactionDecision && typeof interactionDecision === "object" ? interactionDecision : null;

  const hasSeniority       = existingKeys.includes("senioritySignals");
  const hasScope           = existingKeys.includes("scopeSignals");
  const hasLeadership      = existingKeys.includes("leadershipSignals");
  const hasDecisionDistance = existingKeys.includes("decisionDistanceSignals");

  const riskCount    = iDec ? safeArray(iDec.riskDrivers).length : 0;
  const conflictCount = iDec ? safeArray(iDec.conflicts).length : 0;

  // primaryThesis — slot presence + iDec gap signals, no new scoring
  let primaryThesis = "unclear";
  if (hasDecisionDistance && (riskCount > 0 || conflictCount > 0)) {
    primaryThesis = "decision-distance-gap";
  } else if (hasLeadership && riskCount > 0 && !hasSeniority) {
    primaryThesis = "leadership-gap";
  } else if (hasSeniority && hasScope && riskCount === 0) {
    primaryThesis = "level-aligned";
  } else if (hasScope && !hasLeadership && riskCount === 0) {
    primaryThesis = "scope-supported";
  } else if (hasSeniority && hasScope) {
    primaryThesis = "level-aligned";
  } else if (hasScope) {
    primaryThesis = "scope-supported";
  } else if (existingKeys.length > 0) {
    primaryThesis = riskCount > 0 ? "decision-distance-gap" : "unclear";
  }

  // evidence key arrays — slot key index only
  let primaryEvidenceKeys;
  let secondaryEvidenceKeys;
  if (primaryThesis === "level-aligned") {
    primaryEvidenceKeys   = [hasSeniority && "senioritySignals", hasScope && "scopeSignals"].filter(Boolean);
    secondaryEvidenceKeys = [hasLeadership && "leadershipSignals"].filter(Boolean);
  } else if (primaryThesis === "scope-supported") {
    primaryEvidenceKeys   = [hasScope && "scopeSignals"].filter(Boolean);
    secondaryEvidenceKeys = [hasSeniority && "senioritySignals"].filter(Boolean);
  } else if (primaryThesis === "leadership-gap") {
    primaryEvidenceKeys   = [hasLeadership && "leadershipSignals"].filter(Boolean);
    secondaryEvidenceKeys = [hasScope && "scopeSignals"].filter(Boolean);
  } else if (primaryThesis === "decision-distance-gap") {
    primaryEvidenceKeys   = [hasDecisionDistance && "decisionDistanceSignals"].filter(Boolean);
    secondaryEvidenceKeys = [hasScope && "scopeSignals", hasSeniority && "senioritySignals"].filter(Boolean);
  } else {
    primaryEvidenceKeys   = existingKeys.slice(0, 1);
    secondaryEvidenceKeys = existingKeys.slice(1, 2);
  }

  // conflictKeys — gap/mismatch signals
  const conflictKeys = [];
  if (hasDecisionDistance && riskCount > 0) conflictKeys.push("decisionDistanceSignals");
  if (hasLeadership && riskCount > 0 && !conflictKeys.includes("leadershipSignals")) {
    conflictKeys.push("leadershipSignals");
  }

  // unresolvedKeys
  const unresolvedKeys = [];
  if (!hasLeadership && (primaryThesis === "level-aligned" || primaryThesis === "scope-supported")) {
    unresolvedKeys.push("leadership-proof-missing");
  }
  if (!hasSeniority && primaryThesis === "unclear") {
    unresolvedKeys.push("seniority-mapping-unclear");
  }

  // diagnosticsKeys
  const diagnosticsKeys = [];
  if (primaryEvidenceKeys.length === 0 && existingKeys.length > 0) diagnosticsKeys.push("sparse-level-signals");
  if (!hasLeadership) diagnosticsKeys.push("limited-position-evidence");
  const diagnosticsKeysDeduped = [...new Set(diagnosticsKeys)];

  // status
  const coverableNarrativeAxes = [
    primaryEvidenceKeys.length > 0,
    secondaryEvidenceKeys.length > 0,
    conflictKeys.length > 0 || unresolvedKeys.length > 0,
  ].filter(Boolean).length;

  let status = "unavailable";
  if (primaryEvidenceKeys.length >= 1 && coverableNarrativeAxes >= 2) {
    status = "usable";
  } else if (primaryEvidenceKeys.length >= 1 || existingKeys.length > 0) {
    status = "partial";
  }

  // confidence — 2+ level structures present → medium
  const structureCount = [hasSeniority, hasScope, hasLeadership, hasDecisionDistance].filter(Boolean).length;
  let confidence = null;
  if (structureCount >= 2) {
    confidence = "medium";
  } else if (structureCount === 1) {
    confidence = "low";
  }

  // notes
  const notes = [];
  if (hasScope)                       notes.push("scope support signals available");
  if (!hasLeadership)                 notes.push("leadership evidence limited");
  if (hasDecisionDistance && riskCount > 0) notes.push("decision-distance gap signals present");
  if (existingKeys.length > 0 && structureCount < 2) notes.push("level fit signals partially populated");

  return {
    ...base,
    status,
    confidence,
    primaryThesis,
    primaryEvidenceKeys,
    secondaryEvidenceKeys,
    conflictKeys,
    unresolvedKeys,
    diagnosticsKeys: diagnosticsKeysDeduped,
    notes,
  };
}

// ─────────────────────────────────────────────
// buildCompensationMobilityAssembly (Phase 9-4 3rd)
// Sources: compensationMobility slots (primary), candidateAxisPack (secondary), interactionDecision (diagnostics)
// ─────────────────────────────────────────────
function buildCompensationMobilityAssembly(interpretationPack, interpretationInput, interactionDecision) {
  const NARRATIVE_ORDER = ["compensation", "marketMobility", "companyScale", "jumpIntensity"];
  const base = buildEmptySectionAssembly("compensationMobility", NARRATIVE_ORDER);

  const cmSlots      = interpretationPack?.sections?.compensationMobility?.slots ?? {};
  const existingKeys = pickExistingSlotKeys(cmSlots);
  const iDec         = interactionDecision && typeof interactionDecision === "object" ? interactionDecision : null;

  const hasCompensation  = existingKeys.includes("compensationSignals");
  const hasMarketMobility = existingKeys.includes("marketMobilitySignals");
  const hasCompanyScale  = existingKeys.includes("companyScaleSignals");
  const hasJumpIntensity = existingKeys.includes("jumpIntensitySignals");

  const riskCount    = iDec ? safeArray(iDec.riskDrivers).length : 0;
  const supportCount = iDec ? safeArray(iDec.supportDrivers).length : 0;

  // primaryThesis — slot presence + iDec balance, no new scoring
  let primaryThesis = "unclear";
  if (hasJumpIntensity && riskCount > supportCount) {
    primaryThesis = "jump-intensity-risk";
  } else if (hasCompanyScale && riskCount > 0 && !hasJumpIntensity) {
    primaryThesis = "scale-transition-friction";
  } else if ((hasCompensation || hasMarketMobility) && supportCount > 0 && riskCount > 0) {
    primaryThesis = "upside-with-proof-needed";
  } else if (hasCompensation && hasMarketMobility && riskCount === 0) {
    primaryThesis = "mobility-aligned";
  } else if (existingKeys.length >= 2 && riskCount === 0) {
    primaryThesis = "mobility-aligned";
  } else if (hasJumpIntensity) {
    primaryThesis = "jump-intensity-risk";
  } else if (existingKeys.length > 0) {
    primaryThesis = riskCount > 0 ? "upside-with-proof-needed" : "unclear";
  }

  // evidence key arrays — slot key index only
  let primaryEvidenceKeys;
  let secondaryEvidenceKeys;
  if (primaryThesis === "mobility-aligned") {
    primaryEvidenceKeys   = [hasCompensation && "compensationSignals", hasMarketMobility && "marketMobilitySignals"].filter(Boolean);
    secondaryEvidenceKeys = [hasCompanyScale && "companyScaleSignals"].filter(Boolean);
  } else if (primaryThesis === "jump-intensity-risk") {
    primaryEvidenceKeys   = [hasJumpIntensity && "jumpIntensitySignals"].filter(Boolean);
    secondaryEvidenceKeys = [hasCompensation && "compensationSignals"].filter(Boolean);
  } else if (primaryThesis === "scale-transition-friction") {
    primaryEvidenceKeys   = [hasCompanyScale && "companyScaleSignals"].filter(Boolean);
    secondaryEvidenceKeys = [hasMarketMobility && "marketMobilitySignals"].filter(Boolean);
  } else if (primaryThesis === "upside-with-proof-needed") {
    primaryEvidenceKeys   = [hasCompensation && "compensationSignals", hasMarketMobility && "marketMobilitySignals"].filter(Boolean);
    secondaryEvidenceKeys = [hasCompanyScale && "companyScaleSignals"].filter(Boolean);
  } else {
    primaryEvidenceKeys   = existingKeys.slice(0, 1);
    secondaryEvidenceKeys = existingKeys.slice(1, 2);
  }

  // conflictKeys — jump/scale friction
  const conflictKeys = [];
  if (hasJumpIntensity && riskCount > 0) conflictKeys.push("jumpIntensitySignals");
  if (hasCompanyScale && riskCount > 0 && !conflictKeys.includes("companyScaleSignals")) {
    conflictKeys.push("companyScaleSignals");
  }

  // unresolvedKeys
  const unresolvedKeys = [];
  if (!hasCompensation && !hasMarketMobility) unresolvedKeys.push("market-context-missing");
  if (!hasMarketMobility && primaryThesis === "mobility-aligned") unresolvedKeys.push("mobility-evidence-unclear");

  // diagnosticsKeys
  const diagnosticsKeys = [];
  if (primaryEvidenceKeys.length === 0 && existingKeys.length > 0) diagnosticsKeys.push("sparse-compensation-signals");
  if (!hasMarketMobility) diagnosticsKeys.push("limited-market-mobility-evidence");
  if (!hasCompanyScale)   diagnosticsKeys.push("scale-context-limited");
  const diagnosticsKeysDeduped = [...new Set(diagnosticsKeys)];

  // status
  const coverableNarrativeAxes = [
    primaryEvidenceKeys.length > 0,
    secondaryEvidenceKeys.length > 0,
    conflictKeys.length > 0 || unresolvedKeys.length > 0,
  ].filter(Boolean).length;

  let status = "unavailable";
  if (primaryEvidenceKeys.length >= 1 && coverableNarrativeAxes >= 2) {
    status = "usable";
  } else if (primaryEvidenceKeys.length >= 1 || existingKeys.length > 0) {
    status = "partial";
  }

  // confidence — 2+ compensation/mobility structures present → medium
  const structureCount = [hasCompensation, hasMarketMobility, hasCompanyScale, hasJumpIntensity].filter(Boolean).length;
  let confidence = null;
  if (structureCount >= 2) {
    confidence = "medium";
  } else if (structureCount === 1) {
    confidence = "low";
  }

  // notes
  const notes = [];
  if (hasMarketMobility)              notes.push("mobility signals available");
  if (hasJumpIntensity && riskCount > 0) notes.push("jump intensity signals present");
  if (!hasCompanyScale)               notes.push("scale transition evidence limited");
  if (existingKeys.length > 0 && structureCount < 2) notes.push("compensation context partially populated");

  return {
    ...base,
    status,
    confidence,
    primaryThesis,
    primaryEvidenceKeys,
    secondaryEvidenceKeys,
    conflictKeys,
    unresolvedKeys,
    diagnosticsKeys: diagnosticsKeysDeduped,
    notes,
  };
}

// ─────────────────────────────────────────────
// Sentence generation layer v1 — careerAccumulation only (Phase 9-6)
// Source: sectionAssemblies.careerAccumulation (assembly fields only, no raw primitives)
// ─────────────────────────────────────────────

function mapCareerAccumulationConfidenceLabel(confidence) {
  if (confidence === "medium") return "해석 근거 보통";
  if (confidence === "low")    return "해석 근거 제한적";
  return "";
}

// max 2 lines; reads evidence axes from assembly keys — does not expose key names
function buildCareerAccumulationNarrativeLines(assembly) {
  const lines = [];
  const primary   = safeArray(assembly.primaryEvidenceKeys);
  const secondary = safeArray(assembly.secondaryEvidenceKeys);
  const thesis    = assembly.primaryThesis;

  const hasRelated    = primary.includes("relatedCareerSignals") || secondary.includes("relatedCareerSignals");
  const hasContinuity = primary.includes("continuitySignals")    || secondary.includes("continuitySignals");
  const hasConsistency = secondary.includes("consistencySignals");
  const hasTransition = primary.includes("transitionReadinessSignals") || secondary.includes("transitionReadinessSignals");

  if (hasRelated && !hasContinuity) {
    lines.push("관련 경험 축은 확인되지만 연속성 신호는 부분적으로만 확인됩니다.");
  } else if (hasRelated && hasContinuity) {
    lines.push("관련 경험과 연속성 신호가 함께 확인되어 커리어 흐름이 비교적 이어지는 구조로 읽힙니다.");
  }

  if (hasTransition && (thesis === "transition-building" || thesis === "continuity-risk")) {
    lines.push("전환 준비 신호가 있어 완전한 단절보다는 이동 준비 단계에 가깝습니다.");
  } else if (hasConsistency && thesis === "strong-accumulation") {
    lines.push("일관성 신호도 함께 확인되어 축적 흐름의 안정성이 비교적 뒷받침됩니다.");
  }

  return lines.slice(0, 2);
}

// cautionLine: only when conflictKeys or unresolvedKeys exist
function buildCareerAccumulationCautionLine(assembly) {
  const hasConflict    = safeArray(assembly.conflictKeys).length > 0;
  const hasUnresolved  = safeArray(assembly.unresolvedKeys).length > 0;
  if (hasConflict) {
    return "다만 연속성 판단에 필요한 일부 근거는 아직 제한적입니다.";
  }
  if (hasUnresolved) {
    return "다만 관련 경력의 연결 강도를 단정하기엔 보완 정보가 더 필요합니다.";
  }
  return "";
}

// Main sentence block generator
function buildCareerAccumulationSentenceBlock(assembly) {
  const empty = {
    shortSummary: "",
    narrativeLines: [],
    cautionLine: "",
    confidenceLabel: "",
    sourceSectionKey: "careerAccumulation",
    generationMode: "fallback-none",
  };

  if (!assembly || assembly.status === "unavailable") return empty;

  const thesis = assembly.primaryThesis;
  let shortSummary = "";
  if (thesis === "strong-accumulation") {
    shortSummary = "관련 경험과 연속성이 비교적 잘 이어져 있는 축적형 커리어로 해석됩니다.";
  } else if (thesis === "related-but-fragmented") {
    shortSummary = "관련 경험은 이어지지만 연속성·일관성 면에서 일부 분절이 보이는 커리어로 해석됩니다.";
  } else if (thesis === "transition-building") {
    shortSummary = "완전한 축적형보다는 전환을 준비하며 관련성을 쌓아가는 단계로 해석됩니다.";
  } else if (thesis === "continuity-risk") {
    shortSummary = "경력 연결성보다 분절·공백·일관성 리스크가 더 크게 읽히는 상태로 해석됩니다.";
  } else {
    shortSummary = "커리어 축적 흐름을 단정하기엔 근거가 아직 제한적입니다.";
  }

  const narrativeLines  = buildCareerAccumulationNarrativeLines(assembly);
  const cautionLine     = buildCareerAccumulationCautionLine(assembly);
  const confidenceLabel = mapCareerAccumulationConfidenceLabel(assembly.confidence);

  const isUsable = Boolean(shortSummary || narrativeLines.length > 0);
  return {
    shortSummary,
    narrativeLines,
    cautionLine,
    confidenceLabel,
    sourceSectionKey: "careerAccumulation",
    generationMode: isUsable ? "assembly-v1" : "fallback-none",
  };
}

// ─────────────────────────────────────────────
// Sentence generation layer v2 — riskSummary only (Phase 9-6 v2)
// Source: sectionAssemblies.riskSummary (assembly fields only, no raw primitives)
// ─────────────────────────────────────────────

function mapRiskSummaryConfidenceLabel(confidence) {
  if (confidence === "medium") return "해석 근거 보통";
  if (confidence === "low")    return "해석 근거 제한적";
  return "";
}

// supportLine: generated when secondaryEvidenceKeys exist (thesis-aware)
function buildRiskSummarySupportLine(assembly) {
  const secondary = safeArray(assembly.secondaryEvidenceKeys);
  if (secondary.length === 0) return "";
  const thesis = assembly.primaryThesis;
  if (thesis === "risk-led") {
    return "일부 보완 근거가 있어 리스크를 일방향으로만 보기 어렵습니다.";
  }
  if (thesis === "support-led") {
    return "지지 신호도 함께 있어 해석이 완전히 부정적으로 고정되지는 않습니다.";
  }
  return "보완 근거가 일부 확인되어 단일 방향의 해석만으로는 충분하지 않습니다.";
}

// cautionLine: generated when conflictKeys or unresolvedKeys exist
function buildRiskSummaryCautionLine(assembly) {
  const hasConflict   = safeArray(assembly.conflictKeys).length > 0;
  const hasUnresolved = safeArray(assembly.unresolvedKeys).length > 0;
  if (hasConflict) {
    return "다만 상충 신호가 함께 있어 해석의 일관성이 낮을 수 있습니다.";
  }
  if (hasUnresolved) {
    return "다만 일부 핵심 판단 근거는 아직 제한적입니다.";
  }
  return "";
}

// bulletLines: max 3; based on narrativeOrder axes that have evidence (no key name exposure)
function buildRiskSummaryBulletLines(assembly) {
  const bullets = [];
  const primary   = safeArray(assembly.primaryEvidenceKeys);
  const secondary = safeArray(assembly.secondaryEvidenceKeys);
  const conflicts = safeArray(assembly.conflictKeys);
  const unresolved = safeArray(assembly.unresolvedKeys);

  if (primary.includes("primaryRisks")) {
    bullets.push("리스크 신호가 해석의 주요 축으로 작용하고 있습니다.");
  }
  if (primary.includes("supportDrivers") || secondary.includes("supportDrivers")) {
    bullets.push("지지 근거가 함께 확인되어 단순 위험 요인으로만 읽히지 않습니다.");
  }
  if (conflicts.includes("conflicts")) {
    bullets.push("상충 신호가 존재하여 단정적 방향 판단이 어렵습니다.");
  }
  if (unresolved.includes("unresolvedFlags")) {
    bullets.push("일부 판단 근거가 미확인 상태로 남아 있습니다.");
  }
  return bullets.slice(0, 3);
}

// Main riskSummary sentence block generator
function buildRiskSummarySentenceBlock(assembly) {
  const empty = {
    headline: "",
    supportLine: "",
    cautionLine: "",
    bulletLines: [],
    confidenceLabel: "",
    sourceSectionKey: "riskSummary",
    generationMode: "fallback-none",
  };

  if (!assembly) return empty;
  if (assembly.status === "unavailable") {
    // Phase 12-D: unclear-state canonical summary — surface does not become null/empty when
    // no risk evidence is available. Preserves canonical ownership via __canonicalRiskSummaryText
    // fallback path in SimulatorLayout (wins when __canonicalRiskWins=false + riskNarrativeMsg=null).
    return {
      ...empty,
      headline: "현재 문서 기준으로는 핵심 리스크 구조가 아직 선명하게 분류되지 않습니다.",
      generationMode: "assembly-v1",
    };
  }

  const thesis = assembly.primaryThesis;
  let headline = "";
  if (thesis === "risk-led") {
    headline = "현재 해석에서는 리스크 신호가 비교적 중심에 놓여 있습니다.";
  } else if (thesis === "balanced") {
    headline = "리스크와 보완 근거가 함께 존재하는 혼합형 해석입니다.";
  } else if (thesis === "support-led") {
    headline = "우려보다 지지 근거가 상대적으로 더 우세하게 읽힙니다.";
  } else if (thesis === "conflicted") {
    // Phase 12-D: derive state-specific headline from available slot evidence; generic is last-resort only
    const _hasRiskSignal    = safeArray(assembly.primaryEvidenceKeys).includes("primaryRisks");
    const _hasSupportSignal = safeArray(assembly.primaryEvidenceKeys).includes("supportDrivers");
    const _hasConflict      = safeArray(assembly.conflictKeys).length > 0;
    if (_hasSupportSignal && _hasRiskSignal && _hasConflict) {
      headline = "구체 리스크 신호가 확인되며, 일부 지지 근거와 상충 신호가 함께 보여 우려 수준을 한 방향으로만 고정하긴 어렵습니다.";
    } else if (_hasRiskSignal && _hasConflict) {
      headline = "구체 리스크 신호는 확인되지만, 일부 상충 신호가 함께 있어 우려 강도를 보수적으로 함께 보게 됩니다.";
    } else if (_hasSupportSignal && _hasConflict) {
      headline = "지지 근거는 있지만 상충 신호가 함께 있어 긍정적으로만 해석하기 어렵습니다.";
    } else {
      headline = "상반된 신호가 함께 존재해 단정적 해석이 어렵습니다."; // last-resort
    }
  } else {
    headline = "핵심 리스크 구조를 단정하기엔 근거가 아직 제한적입니다.";
  }

  const supportLine     = buildRiskSummarySupportLine(assembly);
  const cautionLine     = buildRiskSummaryCautionLine(assembly);
  const bulletLines     = buildRiskSummaryBulletLines(assembly);
  const confidenceLabel = mapRiskSummaryConfidenceLabel(assembly.confidence);

  const isUsable = Boolean(headline || bulletLines.length > 0);
  return {
    headline,
    supportLine,
    cautionLine,
    bulletLines,
    confidenceLabel,
    sourceSectionKey: "riskSummary",
    generationMode: isUsable ? "assembly-v1" : "fallback-none",
  };
}

// ─────────────────────────────────────────────
// buildInterpretationPack (Phase 9-4)
// Appends sectionAssemblies to the Phase 9-3 hydrated interpretationPack.
// interpretationPack.sections is preserved unchanged.
// ─────────────────────────────────────────────
export function buildInterpretationPack({
  interpretationPack,
  interpretationInput,
  interactionDecision,
  axes,
} = {}) {
  if (!interpretationPack || typeof interpretationPack !== "object") {
    return {
      available: false,
      sectionAssemblies: {},
      meta: { phase: "9-4-assembly-scaffold", error: "interpretationPack unavailable" },
    };
  }

  const sectionAssemblies = {};

  try {
    sectionAssemblies.careerAccumulation = buildCareerAccumulationAssembly(
      interpretationPack,
      interpretationInput ?? null,
      interactionDecision ?? null
    );
  } catch {
    sectionAssemblies.careerAccumulation = buildEmptySectionAssembly(
      "careerAccumulation",
      ["relatedCareer", "continuity", "consistency", "transitionReadiness"]
    );
  }

  try {
    sectionAssemblies.levelPositionFit = buildLevelPositionFitAssembly(
      interpretationPack,
      interpretationInput ?? null,
      interactionDecision ?? null
    );
  } catch {
    sectionAssemblies.levelPositionFit = buildEmptySectionAssembly(
      "levelPositionFit",
      ["seniority", "scope", "leadership", "decisionDistance"]
    );
  }

  try {
    sectionAssemblies.compensationMobility = buildCompensationMobilityAssembly(
      interpretationPack,
      interpretationInput ?? null,
      interactionDecision ?? null
    );
  } catch {
    sectionAssemblies.compensationMobility = buildEmptySectionAssembly(
      "compensationMobility",
      ["compensation", "marketMobility", "companyScale", "jumpIntensity"]
    );
  }

  try {
    sectionAssemblies.riskSummary = buildRiskSummaryAssembly(
      interpretationPack,
      interactionDecision ?? null
    );
  } catch {
    sectionAssemblies.riskSummary = buildEmptySectionAssembly(
      "riskSummary",
      ["primaryRisk", "supportDrivers", "conflicts", "unresolvedFlags"]
    );
  }

  try {
    sectionAssemblies.industryContext = buildIndustryContextAssembly(
      interpretationPack,
      interpretationInput ?? null,
      interactionDecision ?? null
    );
  } catch {
    sectionAssemblies.industryContext = buildEmptySectionAssembly(
      "industryContext",
      ["sectorContext", "adjacencyContext", "boundaryContext", "transferImplication"]
    );
  }

  try {
    sectionAssemblies.workStyleExecution = buildWorkStyleExecutionAssembly(
      interpretationPack,
      axes ?? null
    );
  } catch {
    sectionAssemblies.workStyleExecution = buildEmptySectionAssembly(
      "workStyleExecution",
      ["workModeShift", "executionContext", "transferability", "friction"]
    );
  }

  // ── Phase 9-6: sentence generation layer (careerAccumulation + riskSummary) ──
  const sectionSentences = {
    careerAccumulation: buildCareerAccumulationSentenceBlock(
      sectionAssemblies.careerAccumulation ?? null
    ),
    riskSummary: buildRiskSummarySentenceBlock(
      sectionAssemblies.riskSummary ?? null
    ),
  };

  return {
    ...interpretationPack,
    sectionAssemblies,
    sectionSentences,
    meta: {
      ...(interpretationPack.meta ?? {}),
      phase: "9-6-sentence-layer-v2",
    },
  };
}
