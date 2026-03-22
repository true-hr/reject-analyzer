// src/lib/analysis/buildInteractionPack.js
// Phase 8-3: interactionPack taxonomy candidate mapping
//
// Role:
//   - Consumes context/axis/meta packs only ??no raw primitive UI fields
//   - No legacy key interpretation inside this module
//   - No score/gate mutation
//   - No UI changes, no report wording generation
//   - Phase 8-2: adds 5 normalized axis objects (domain/role/workMode/proofTransfer/decisionFriction)
//   - Phase 8-3: adds taxonomy candidate mapping (interactionCandidates, matchedTaxonomyIds, candidateReasons, mappingMeta)

// ?????????????????????????????????????????????
// Input contract (all optional/nullable)
//
//   currentIndustryContext  ??from buildIndustryContext(resolvedIndustry)
//   targetIndustryContext   ??from buildIndustryContext(resolvedIndustry)
//   currentJobContext       ??from buildJobContext(resolvedJob)
//   targetJobContext        ??from buildJobContext(resolvedJob)
//   candidateAxisPack       ??from buildCandidateAxisPack(selectionResolved)
//   selectionResolvedMeta   ??from canonical.selectionResolvedMeta (optional)
//   diagnosticsMeta         ??from structureAnalysis.meta (optional)
// ?????????????????????????????????????????????

// ?????????????????????????????????????????????
// Taxonomy ID registry (taxonomy-ready static reference)
// Source: src/data/interaction/taxonomy/**
// No index file exists; IDs inlined here to avoid broad import refactor (Phase 8-3 acceptable per spec)
// ?????????????????????????????????????????????
const TAXONOMY_IDS = {
  // BOUNDARY_SHIFT_HINTS
  ADJACENT_ROLE_SHIFT:             { id: "ADJACENT_ROLE_SHIFT",             categoryId: "BOUNDARY_SHIFT_HINTS" },
  SAME_ROLE_FAMILY_SHIFT:          { id: "SAME_ROLE_FAMILY_SHIFT",          categoryId: "BOUNDARY_SHIFT_HINTS" },
  ANALYTICAL_VS_EXECUTIONAL_SHIFT: { id: "ANALYTICAL_VS_EXECUTIONAL_SHIFT", categoryId: "BOUNDARY_SHIFT_HINTS" },
  OPERATIONAL_STRATEGIC_SHIFT:     { id: "OPERATIONAL_STRATEGIC_SHIFT",     categoryId: "BOUNDARY_SHIFT_HINTS" },
  EXTERNAL_INTERNAL_SHIFT:         { id: "EXTERNAL_INTERNAL_SHIFT",         categoryId: "BOUNDARY_SHIFT_HINTS" },
  INDUSTRY_SPECIALIZED_ROLE_SHIFT: { id: "INDUSTRY_SPECIALIZED_ROLE_SHIFT", categoryId: "BOUNDARY_SHIFT_HINTS" },

  // EVIDENCE_MODE_SHIFT
  DOMAIN_FIT_PROOF_SHIFT:            { id: "DOMAIN_FIT_PROOF_SHIFT",            categoryId: "EVIDENCE_MODE_SHIFT" },
  PROCESS_PROOF_SHIFT:               { id: "PROCESS_PROOF_SHIFT",               categoryId: "EVIDENCE_MODE_SHIFT" },
  OUTPUT_EVIDENCE_SHIFT:             { id: "OUTPUT_EVIDENCE_SHIFT",             categoryId: "EVIDENCE_MODE_SHIFT" },
  RESULT_EVIDENCE_SHIFT:             { id: "RESULT_EVIDENCE_SHIFT",             categoryId: "EVIDENCE_MODE_SHIFT" },
  RELATIONSHIP_POSITION_PROOF_SHIFT: { id: "RELATIONSHIP_POSITION_PROOF_SHIFT", categoryId: "EVIDENCE_MODE_SHIFT" },
  PERFORMANCE_METRIC_SHIFT:          { id: "PERFORMANCE_METRIC_SHIFT",          categoryId: "EVIDENCE_MODE_SHIFT" },

  // CROSS_AMPLIFICATION
  DOMAIN_KNOWLEDGE_AMPLIFICATION:       { id: "DOMAIN_KNOWLEDGE_AMPLIFICATION",       categoryId: "CROSS_AMPLIFICATION" },
  WORK_CONTENT_AMPLIFICATION:           { id: "WORK_CONTENT_AMPLIFICATION",           categoryId: "CROSS_AMPLIFICATION" },
  DECISION_STRUCTURE_AMPLIFICATION:     { id: "DECISION_STRUCTURE_AMPLIFICATION",     categoryId: "CROSS_AMPLIFICATION" },
  COLLABORATION_STRUCTURE_AMPLIFICATION:{ id: "COLLABORATION_STRUCTURE_AMPLIFICATION",categoryId: "CROSS_AMPLIFICATION" },
  OPERATIONAL_RHYTHM_AMPLIFICATION:     { id: "OPERATIONAL_RHYTHM_AMPLIFICATION",     categoryId: "CROSS_AMPLIFICATION" },
  OUTPUT_AMPLIFICATION:                 { id: "OUTPUT_AMPLIFICATION",                 categoryId: "CROSS_AMPLIFICATION" },

  // WEAKENING_SIGNALS
  DOMAIN_IRRELEVANT_EXPERIENCE_WEAKENING: { id: "DOMAIN_IRRELEVANT_EXPERIENCE_WEAKENING", categoryId: "WEAKENING_SIGNALS" },
  TASK_CONTENT_WEAKENING:                 { id: "TASK_CONTENT_WEAKENING",                 categoryId: "WEAKENING_SIGNALS" },
  ABSTRACT_CAPABILITY_KEYWORD_WEAKENING:  { id: "ABSTRACT_CAPABILITY_KEYWORD_WEAKENING",  categoryId: "WEAKENING_SIGNALS" },
  OUTPUT_PERSUASIVENESS_WEAKENING:        { id: "OUTPUT_PERSUASIVENESS_WEAKENING",         categoryId: "WEAKENING_SIGNALS" },
  PERFORMANCE_LANGUAGE_WEAKENING:         { id: "PERFORMANCE_LANGUAGE_WEAKENING",          categoryId: "WEAKENING_SIGNALS" },
};

function safeArr(v) {
  return Array.isArray(v) ? v.filter(Boolean) : [];
}

function safeStr(v) {
  return v && typeof v === "string" ? v.trim() : null;
}

function normalizeToken(v) {
  return safeStr(v)?.toLowerCase() ?? null;
}

function mergeUniqueKeys(...groups) {
  return Array.from(
    new Set(
      groups.flatMap((group) => safeArr(group).map((item) => safeStr(item)).filter(Boolean))
    )
  );
}

function normalizeSelectionResolvedDiagnostics(selectionResolvedDiagnostics) {
  const src = (selectionResolvedDiagnostics && typeof selectionResolvedDiagnostics === "object")
    ? selectionResolvedDiagnostics
    : null;
  if (!src) return null;

  const unresolvedKeys = [];
  const flaggedKeys = [];
  const conflictKeys = [];

  for (const itemKey of ["currentJob", "targetJob", "currentIndustry", "targetIndustry"]) {
    const item = (src[itemKey] && typeof src[itemKey] === "object") ? src[itemKey] : null;
    if (!item) continue;

    const resolveStatus = normalizeToken(item.resolveStatus);
    const primitiveLabel = normalizeToken(item.primitiveLabel);
    const resolvedLabel = normalizeToken(item.resolvedLabel);
    const lookupSuccess = item.lookupSuccess === true;

    if (!lookupSuccess || resolveStatus === "missing" || resolveStatus === "unknown") {
      unresolvedKeys.push(itemKey);
      continue;
    }

    if (resolveStatus === "partial") {
      unresolvedKeys.push(itemKey);
      conflictKeys.push(itemKey);
    }

    if (
      primitiveLabel &&
      resolvedLabel &&
      primitiveLabel !== resolvedLabel &&
      resolveStatus !== "missing"
    ) {
      flaggedKeys.push(itemKey);
    }
  }

  return {
    ...src,
    unresolvedKeys: mergeUniqueKeys(src.unresolvedKeys, unresolvedKeys),
    flaggedKeys: mergeUniqueKeys(src.flaggedKeys, flaggedKeys),
    conflictKeys: mergeUniqueKeys(src.conflictKeys, conflictKeys),
  };
}

function normalizeAiResolvedComparison(aiResolvedComparison) {
  const src = (aiResolvedComparison && typeof aiResolvedComparison === "object")
    ? aiResolvedComparison
    : null;
  if (!src) return null;

  const mismatchKeys = [];
  const unresolvedKeys = [];
  const conflicts = [];

  for (const domainKey of ["role", "industry"]) {
    const item = (src[domainKey] && typeof src[domainKey] === "object") ? src[domainKey] : null;
    const status = normalizeToken(item?.status);
    if (!status) continue;

    if (status === "mismatch") {
      mismatchKeys.push(domainKey);
      conflicts.push(domainKey);
    } else if (status === "unknown") {
      unresolvedKeys.push(domainKey);
    }
  }

  return {
    ...src,
    mismatchKeys: mergeUniqueKeys(src.mismatchKeys, mismatchKeys),
    unresolvedKeys: mergeUniqueKeys(src.unresolvedKeys, unresolvedKeys),
    conflicts: mergeUniqueKeys(src.conflicts, conflicts),
  };
}

function normalizeResolvedProvenance(selectionResolvedMeta) {
  const src = (selectionResolvedMeta && typeof selectionResolvedMeta === "object")
    ? selectionResolvedMeta
    : null;
  if (!src) return null;

  const ownership = (src.ownershipProvenance && typeof src.ownershipProvenance === "object")
    ? src.ownershipProvenance
    : null;
  const fallbackKeys = [];
  const rehydratedKeys = [];
  const missingKeys = [];
  const flaggedKeys = [];

  for (const itemKey of ["currentJob", "targetJob", "currentIndustry", "targetIndustry"]) {
    const item = (ownership?.[itemKey] && typeof ownership[itemKey] === "object")
      ? ownership[itemKey]
      : null;
    const sourceType = normalizeToken(item?.sourceType);
    const sourceConfidence = normalizeToken(item?.sourceConfidence);
    const sourceDetail = (item?.sourceDetail && typeof item.sourceDetail === "object")
      ? item.sourceDetail
      : null;

    if (sourceType === "raw_only_fallback") fallbackKeys.push(itemKey);
    if (sourceType === "legacy_mapping_assist") rehydratedKeys.push(itemKey);
    if (sourceType === "missing") missingKeys.push(itemKey);
    if (
      sourceDetail?.legacyAliasHit === true ||
      sourceDetail?.ambiguous === true ||
      sourceConfidence === "inferred"
    ) {
      flaggedKeys.push(itemKey);
    }
  }

  return {
    ...src,
    fallbackKeys: mergeUniqueKeys(src.fallbackKeys, fallbackKeys),
    rehydratedKeys: mergeUniqueKeys(src.rehydratedKeys, rehydratedKeys),
    missingKeys: mergeUniqueKeys(src.missingKeys, missingKeys),
    flaggedKeys: mergeUniqueKeys(src.flaggedKeys, flaggedKeys),
  };
}

function normalizeDiagnosticsSources(selectionResolvedMeta, selectionResolvedDiagnostics, aiResolvedComparison) {
  return {
    selectionResolvedMeta: normalizeResolvedProvenance(selectionResolvedMeta),
    selectionResolvedDiagnostics: normalizeSelectionResolvedDiagnostics(selectionResolvedDiagnostics),
    aiResolvedComparison: normalizeAiResolvedComparison(aiResolvedComparison),
  };
}

function hasContext(ctx) {
  return Boolean(ctx && typeof ctx === "object" && ctx.available !== false);
}

function hasAxisPack(pack) {
  return Boolean(pack && typeof pack === "object" && pack.available === true);
}

// ?????????????????????????????????????????????
// buildDomainProximityAxis
// ?????????????????????????????????????????????
function buildDomainProximityAxis({
  currentIndustryContext,
  targetIndustryContext,
  candidateAxisPack,
}) {
  const iAxis = hasAxisPack(candidateAxisPack) ? (candidateAxisPack.industryAxis ?? null) : null;
  const iAxisAvailable = Boolean(iAxis?.available);
  const curCtx = hasContext(currentIndustryContext) ? currentIndustryContext : null;
  const tgtCtx = hasContext(targetIndustryContext) ? targetIndustryContext : null;
  const anyAvailable = iAxisAvailable || Boolean(curCtx || tgtCtx);

  if (!anyAvailable) {
    return {
      available: false,
      sameSector: null,
      sameSubSector: null,
      boundaryRelated: null,
      differentSector: null,
      confidence: null,
      meta: {
        sourcePackPresence: { industryAxis: false, currentCtx: false, targetCtx: false },
        missingInputs: ["industryAxis", "industryContexts"],
        heuristicLevel: "weak-readonly",
      },
    };
  }

  const sameSector = iAxisAvailable ? (iAxis.sameSector ?? null) : null;
  const sameSubSector = iAxisAvailable ? (iAxis.sameSubSector ?? null) : null;
  const boundaryRelated = iAxisAvailable ? (iAxis.relatedByBoundaryHint ?? null) : null;
  const differentSector = iAxisAvailable ? (iAxis.differentSector ?? null) : null;

  let confidence = null;
  if (iAxisAvailable) {
    confidence = (sameSector !== null || differentSector !== null) ? "high" : "medium";
  } else if (curCtx && tgtCtx) {
    confidence = "low";
  }

  return {
    available: true,
    sameSector,
    sameSubSector,
    boundaryRelated,
    differentSector,
    confidence,
    meta: {
      sourcePackPresence: {
        industryAxis: iAxisAvailable,
        currentCtx: Boolean(curCtx),
        targetCtx: Boolean(tgtCtx),
      },
      comparedFields: iAxisAvailable
        ? ["sameSector", "sameSubSector", "relatedByBoundaryHint", "differentSector"]
        : [],
      heuristicLevel: "weak-readonly",
    },
  };
}

// ?????????????????????????????????????????????
// buildRoleProximityAxis
// ?????????????????????????????????????????????
function buildRoleProximityAxis({
  currentJobContext,
  targetJobContext,
  candidateAxisPack,
}) {
  const jAxis = hasAxisPack(candidateAxisPack) ? (candidateAxisPack.jobAxis ?? null) : null;
  const jAxisAvailable = Boolean(jAxis?.available);
  const curCtx = hasContext(currentJobContext) ? currentJobContext : null;
  const tgtCtx = hasContext(targetJobContext) ? targetJobContext : null;
  const anyAvailable = jAxisAvailable || Boolean(curCtx || tgtCtx);

  if (!anyAvailable) {
    return {
      available: false,
      sameMajorCategory: null,
      sameSubcategory: null,
      sameFamily: null,
      adjacentFamily: null,
      farTransition: null,
      confidence: null,
      meta: {
        sourcePackPresence: { jobAxis: false, currentCtx: false, targetCtx: false },
        missingInputs: ["jobAxis", "jobContexts"],
        heuristicLevel: "weak-readonly",
      },
    };
  }

  const sameMajorCategory = jAxisAvailable ? (jAxis.sameMajorCategory ?? null) : null;
  const sameSubcategory = jAxisAvailable ? (jAxis.sameSubcategory ?? null) : null;
  const sameFamily = jAxisAvailable ? (jAxis.sameFamily ?? null) : null;
  const adjacentFamily = jAxisAvailable ? (jAxis.adjacentFamily ?? null) : null;
  const farTransition = jAxisAvailable ? (jAxis.farTransition ?? null) : null;

  let confidence = null;
  if (jAxisAvailable) {
    confidence = (sameMajorCategory !== null || farTransition !== null) ? "high" : "medium";
  } else if (curCtx && tgtCtx) {
    confidence = "low";
  }

  return {
    available: true,
    sameMajorCategory,
    sameSubcategory,
    sameFamily,
    adjacentFamily,
    farTransition,
    confidence,
    meta: {
      sourcePackPresence: {
        jobAxis: jAxisAvailable,
        currentCtx: Boolean(curCtx),
        targetCtx: Boolean(tgtCtx),
      },
      comparedFields: jAxisAvailable
        ? ["sameMajorCategory", "sameSubcategory", "sameFamily", "adjacentFamily", "farTransition"]
        : [],
      heuristicLevel: "weak-readonly",
    },
  };
}

// ?????????????????????????????????????????????
// buildWorkModeShiftAxis
// ?????????????????????????????????????????????
function buildWorkModeShiftAxis({
  currentJobContext,
  targetJobContext,
}) {
  const curCtx = hasContext(currentJobContext) ? currentJobContext : null;
  const tgtCtx = hasContext(targetJobContext) ? targetJobContext : null;
  const anyAvailable = Boolean(curCtx || tgtCtx);

  if (!anyAvailable) {
    return {
      available: false,
      shiftDetected: null,
      signals: [],
      confidence: null,
      meta: {
        sourcePackPresence: { currentJobCtx: false, targetJobCtx: false },
        missingInputs: ["jobContexts"],
        heuristicLevel: "weak-readonly",
      },
    };
  }

  const signals = [];

  for (const hint of safeArr(tgtCtx?.boundaryHints)) {
    const h = safeStr(hint);
    if (h) signals.push({ type: "boundary-hint", code: "target-boundary", source: "targetJobContext.boundaryHints", detail: h });
  }

  for (const hint of safeArr(tgtCtx?.transitionHints)) {
    const h = safeStr(hint);
    if (h) signals.push({ type: "transition-hint", code: "target-transition", source: "targetJobContext.transitionHints", detail: h });
  }

  const curCapSet = new Set(
    safeArr(curCtx?.capabilityHints).map((h) => safeStr(h)).filter(Boolean)
  );
  const tgtCapArr = safeArr(tgtCtx?.capabilityHints).map((h) => safeStr(h)).filter(Boolean);
  const sharedCaps = tgtCapArr.filter((c) => curCapSet.has(c));
  if (sharedCaps.length > 0) {
    signals.push({
      type: "capability-overlap",
      code: "shared-capability",
      source: "jobContext.capabilityHints",
      detail: sharedCaps.slice(0, 3).join(", "),
    });
  }

  const shiftDetected = signals.length > 0 ? true : null;
  const confidence = signals.length >= 3 ? "medium" : signals.length > 0 ? "low" : null;

  return {
    available: true,
    shiftDetected,
    signals,
    confidence,
    meta: {
      sourcePackPresence: { currentJobCtx: Boolean(curCtx), targetJobCtx: Boolean(tgtCtx) },
      comparedFields: ["boundaryHints", "transitionHints", "capabilityHints"],
      heuristicLevel: "weak-readonly",
    },
  };
}

// ?????????????????????????????????????????????
// buildProofTransferAxis
// ?????????????????????????????????????????????
function buildProofTransferAxis({
  currentIndustryContext,
  targetIndustryContext,
  currentJobContext,
  targetJobContext,
}) {
  const curInd = hasContext(currentIndustryContext) ? currentIndustryContext : null;
  const tgtInd = hasContext(targetIndustryContext) ? targetIndustryContext : null;
  const curJob = hasContext(currentJobContext) ? currentJobContext : null;
  const tgtJob = hasContext(targetJobContext) ? targetJobContext : null;
  const anyAvailable = Boolean(curInd || tgtInd || curJob || tgtJob);

  if (!anyAvailable) {
    return {
      available: false,
      transferable: null,
      partiallyTransferable: null,
      weakTransfer: null,
      signals: [],
      confidence: null,
      meta: {
        sourcePackPresence: { currentIndCtx: false, targetIndCtx: false, currentJobCtx: false, targetJobCtx: false },
        missingInputs: ["industryContexts", "jobContexts"],
        heuristicLevel: "weak-readonly",
      },
    };
  }

  const signals = [];

  const curProofSet = new Set(
    safeArr(curInd?.proofSignals).map((s) => safeStr(s)).filter(Boolean)
  );
  const tgtProofArr = safeArr(tgtInd?.proofSignals).map((s) => safeStr(s)).filter(Boolean);
  const overlappingProofs = tgtProofArr.filter((s) => curProofSet.has(s));
  if (overlappingProofs.length > 0) {
    signals.push({
      type: "proof-overlap",
      code: "industry-proof-overlap",
      source: "industryContext.proofSignals",
      detail: overlappingProofs.slice(0, 3).join(", "),
    });
  }

  const curCapArr = safeArr(curJob?.capabilityHints).map((h) => safeStr(h)).filter(Boolean);
  if (curCapArr.length > 0) {
    signals.push({
      type: "capability-hint",
      code: "current-job-capability",
      source: "currentJobContext.capabilityHints",
      detail: curCapArr.slice(0, 3).join(", "),
    });
  }

  const tgtCapArr = safeArr(tgtJob?.capabilityHints).map((h) => safeStr(h)).filter(Boolean);
  if (curCapArr.length > 0 && tgtCapArr.length > 0) {
    const curCapSet = new Set(curCapArr);
    const sharedCaps = tgtCapArr.filter((h) => curCapSet.has(h));
    if (sharedCaps.length > 0) {
      signals.push({
        type: "capability-overlap",
        code: "job-capability-overlap",
        source: "jobContext.capabilityHints",
        detail: sharedCaps.slice(0, 3).join(", "),
      });
    }
  }

  const hasProofOverlap = signals.some((s) => s.code === "industry-proof-overlap");
  const hasCapOverlap = signals.some((s) => s.code === "job-capability-overlap");

  let transferable = null;
  let partiallyTransferable = null;
  let weakTransfer = null;

  if (hasProofOverlap && hasCapOverlap) {
    transferable = true;
  } else if (hasProofOverlap || hasCapOverlap) {
    partiallyTransferable = true;
  } else if (signals.length > 0) {
    weakTransfer = true;
  }

  let confidence = null;
  if (curInd && tgtInd && curJob && tgtJob) {
    confidence = signals.length >= 2 ? "medium" : "low";
  } else if (signals.length > 0) {
    confidence = "low";
  }

  return {
    available: true,
    transferable,
    partiallyTransferable,
    weakTransfer,
    signals,
    confidence,
    meta: {
      sourcePackPresence: {
        currentIndCtx: Boolean(curInd),
        targetIndCtx: Boolean(tgtInd),
        currentJobCtx: Boolean(curJob),
        targetJobCtx: Boolean(tgtJob),
      },
      comparedFields: ["proofSignals", "capabilityHints"],
      heuristicLevel: "weak-readonly",
    },
  };
}

// ?????????????????????????????????????????????
// buildDecisionFrictionAxis
// ?????????????????????????????????????????????
function buildDecisionFrictionAxis({
  currentIndustryContext,
  targetIndustryContext,
}) {
  const curCtx = hasContext(currentIndustryContext) ? currentIndustryContext : null;
  const tgtCtx = hasContext(targetIndustryContext) ? targetIndustryContext : null;
  const anyAvailable = Boolean(curCtx || tgtCtx);

  if (!anyAvailable) {
    return {
      available: false,
      sameDecisionStructure: null,
      sameCustomerMarket: null,
      sameBuyingMotion: null,
      frictionDetected: null,
      signals: [],
      confidence: null,
      meta: {
        sourcePackPresence: { currentCtx: false, targetCtx: false },
        missingInputs: ["industryContexts"],
        heuristicLevel: "weak-readonly",
      },
    };
  }

  const signals = [];

  const curMarket = safeStr(curCtx?.customerMarket);
  const tgtMarket = safeStr(tgtCtx?.customerMarket);
  const sameCustomerMarket = curMarket && tgtMarket ? curMarket === tgtMarket : null;
  if (sameCustomerMarket === false) {
    signals.push({
      type: "market-mismatch",
      code: "customer-market-diff",
      source: "industryContext.customerMarket",
      detail: `${curMarket ?? "?"} ??${tgtMarket ?? "?"}`,
    });
  }

  const curMotion = safeArr(curCtx?.buyingMotion).map((m) => safeStr(m)).filter(Boolean);
  const tgtMotion = safeArr(tgtCtx?.buyingMotion).map((m) => safeStr(m)).filter(Boolean);
  let sameBuyingMotion = null;
  if (curMotion.length > 0 && tgtMotion.length > 0) {
    const overlap = curMotion.filter((m) => tgtMotion.includes(m));
    sameBuyingMotion = overlap.length === curMotion.length && overlap.length === tgtMotion.length;
    if (!sameBuyingMotion) {
      signals.push({
        type: "motion-mismatch",
        code: "buying-motion-diff",
        source: "industryContext.buyingMotion",
        detail: `cur=[${curMotion.join(",")}] tgt=[${tgtMotion.join(",")}]`,
      });
    }
  }

  const curDecision = safeArr(curCtx?.decisionStructure).map((d) => safeStr(d)).filter(Boolean);
  const tgtDecision = safeArr(tgtCtx?.decisionStructure).map((d) => safeStr(d)).filter(Boolean);
  let sameDecisionStructure = null;
  if (curDecision.length > 0 && tgtDecision.length > 0) {
    const overlap = curDecision.filter((d) => tgtDecision.includes(d));
    sameDecisionStructure = overlap.length === curDecision.length && overlap.length === tgtDecision.length;
    if (!sameDecisionStructure) {
      signals.push({
        type: "decision-mismatch",
        code: "decision-structure-diff",
        source: "industryContext.decisionStructure",
        detail: `cur=[${curDecision.join(",")}] tgt=[${tgtDecision.join(",")}]`,
      });
    }
  }

  const frictionDetected = signals.length > 0 ? true : curCtx && tgtCtx ? false : null;

  let confidence = null;
  if (curCtx && tgtCtx) {
    const comparedCount = [sameCustomerMarket, sameBuyingMotion, sameDecisionStructure].filter((v) => v !== null).length;
    if (comparedCount >= 2) confidence = "medium";
    else if (comparedCount >= 1) confidence = "low";
  }

  return {
    available: true,
    sameDecisionStructure,
    sameCustomerMarket,
    sameBuyingMotion,
    frictionDetected,
    signals,
    confidence,
    meta: {
      sourcePackPresence: { currentCtx: Boolean(curCtx), targetCtx: Boolean(tgtCtx) },
      comparedFields: ["decisionStructure", "customerMarket", "buyingMotion"],
      heuristicLevel: "weak-readonly",
    },
  };
}

// ?????????????????????????????????????????????
// Taxonomy category classification helpers (Phase 8-5)
// ?????????????????????????????????????????????
const AMPLIFICATION_IDS = new Set([
  "DOMAIN_KNOWLEDGE_AMPLIFICATION",
  "WORK_CONTENT_AMPLIFICATION",
  "DECISION_STRUCTURE_AMPLIFICATION",
  "COLLABORATION_STRUCTURE_AMPLIFICATION",
  "OPERATIONAL_RHYTHM_AMPLIFICATION",
  "OUTPUT_AMPLIFICATION",
]);

const SHIFT_IDS = new Set([
  "ADJACENT_ROLE_SHIFT",
  "SAME_ROLE_FAMILY_SHIFT",
  "ANALYTICAL_VS_EXECUTIONAL_SHIFT",
  "OPERATIONAL_STRATEGIC_SHIFT",
  "EXTERNAL_INTERNAL_SHIFT",
  "INDUSTRY_SPECIALIZED_ROLE_SHIFT",
  "OUTPUT_EVIDENCE_SHIFT",
  "DOMAIN_FIT_PROOF_SHIFT",
  "PROCESS_PROOF_SHIFT",
  "RESULT_EVIDENCE_SHIFT",
  "RELATIONSHIP_POSITION_PROOF_SHIFT",
  "PERFORMANCE_METRIC_SHIFT",
]);

// ?????????????????????????????????????????????
// buildGlobalEvidenceBuckets (Phase 8-5)
// Converts axes into 5 global evidence buckets.
// ?????????????????????????????????????????????
function buildGlobalEvidenceBuckets(axes) {
  const dom = axes?.domainProximityAxis;
  const role = axes?.roleProximityAxis;
  const work = axes?.workModeShiftAxis;
  const proof = axes?.proofTransferAxis;
  const decision = axes?.decisionFrictionAxis;

  const structural = [];
  const transfer = [];
  const friction = [];
  const weakHeuristic = [];
  const conflicting = [];

  // ?? structuralEvidence ??
  if (dom?.available) {
    if (dom.sameSector === true) {
      structural.push({ bucket: "structuralEvidence", strength: "supporting", code: "same-sector", sourceAxis: "domainProximityAxis", sourceField: "sameSector", detail: "industry sector match" });
    }
    if (dom.sameSubSector === true) {
      structural.push({ bucket: "structuralEvidence", strength: "strong", code: "same-sub-sector", sourceAxis: "domainProximityAxis", sourceField: "sameSubSector", detail: "industry sub-sector match" });
    }
    if (dom.boundaryRelated === true) {
      weakHeuristic.push({ bucket: "weakHeuristicEvidence", strength: "weak", code: "boundary-related", sourceAxis: "domainProximityAxis", sourceField: "boundaryRelated", detail: "boundary hint cross-sector relation" });
    }
    if (dom.differentSector === true) {
      friction.push({ bucket: "frictionEvidence", strength: "conflicting", code: "different-sector", sourceAxis: "domainProximityAxis", sourceField: "differentSector", detail: "different industry sector" });
    }
  }

  if (role?.available) {
    if (role.sameMajorCategory === true) {
      structural.push({ bucket: "structuralEvidence", strength: "supporting", code: "same-major-category", sourceAxis: "roleProximityAxis", sourceField: "sameMajorCategory", detail: "same job major category" });
    }
    if (role.sameSubcategory === true) {
      structural.push({ bucket: "structuralEvidence", strength: "strong", code: "same-subcategory", sourceAxis: "roleProximityAxis", sourceField: "sameSubcategory", detail: "same job subcategory" });
    }
    if (role.sameFamily === true) {
      structural.push({ bucket: "structuralEvidence", strength: "strong", code: "same-family", sourceAxis: "roleProximityAxis", sourceField: "sameFamily", detail: "same job family" });
    }
    if (role.adjacentFamily === true) {
      structural.push({ bucket: "structuralEvidence", strength: "supporting", code: "adjacent-family", sourceAxis: "roleProximityAxis", sourceField: "adjacentFamily", detail: "adjacent job family" });
    }
    if (role.farTransition === true) {
      friction.push({ bucket: "frictionEvidence", strength: "conflicting", code: "far-transition", sourceAxis: "roleProximityAxis", sourceField: "farTransition", detail: "far role transition ??different major category" });
    }
  }

  if (decision?.available) {
    if (decision.sameDecisionStructure === true) {
      structural.push({ bucket: "structuralEvidence", strength: "strong", code: "same-decision-structure", sourceAxis: "decisionFrictionAxis", sourceField: "sameDecisionStructure", detail: "same decision-making structure" });
    }
    if (decision.sameCustomerMarket === true) {
      structural.push({ bucket: "structuralEvidence", strength: "supporting", code: "same-customer-market", sourceAxis: "decisionFrictionAxis", sourceField: "sameCustomerMarket", detail: "same customer/market type" });
    }
    if (decision.sameBuyingMotion === true) {
      structural.push({ bucket: "structuralEvidence", strength: "supporting", code: "same-buying-motion", sourceAxis: "decisionFrictionAxis", sourceField: "sameBuyingMotion", detail: "same buying motion" });
    }
    if (decision.frictionDetected === true) {
      friction.push({ bucket: "frictionEvidence", strength: "conflicting", code: "decision-friction", sourceAxis: "decisionFrictionAxis", sourceField: "frictionDetected", detail: "decision structure friction detected" });
    }
  }

  // ?? transferEvidence ??
  if (proof?.available) {
    if (proof.transferable === true) {
      transfer.push({ bucket: "transferEvidence", strength: "strong", code: "transferable", sourceAxis: "proofTransferAxis", sourceField: "transferable", detail: "proof and capability both transferable" });
    }
    if (proof.partiallyTransferable === true) {
      transfer.push({ bucket: "transferEvidence", strength: "supporting", code: "partially-transferable", sourceAxis: "proofTransferAxis", sourceField: "partiallyTransferable", detail: "partial proof or capability transfer" });
    }
    if (proof.weakTransfer === true) {
      friction.push({ bucket: "frictionEvidence", strength: "conflicting", code: "weak-transfer", sourceAxis: "proofTransferAxis", sourceField: "weakTransfer", detail: "weak proof transfer ??structural evidence gap" });
    }
    const proofOverlapSignal = safeArr(proof.signals).find((s) => s.code === "industry-proof-overlap");
    if (proofOverlapSignal) {
      transfer.push({ bucket: "transferEvidence", strength: "supporting", code: "proof-signal-overlap", sourceAxis: "proofTransferAxis", sourceField: "signals.industry-proof-overlap", detail: proofOverlapSignal.detail ?? "industry proof signals overlap" });
    }
    const capOverlapSignal = safeArr(proof.signals).find((s) => s.code === "job-capability-overlap");
    if (capOverlapSignal) {
      transfer.push({ bucket: "transferEvidence", strength: "supporting", code: "capability-overlap", sourceAxis: "proofTransferAxis", sourceField: "signals.job-capability-overlap", detail: capOverlapSignal.detail ?? "job capability hints overlap" });
    }
  }

  // ?? frictionEvidence: work mode ??
  if (work?.available && work.shiftDetected === true) {
    friction.push({ bucket: "frictionEvidence", strength: "weak", code: "work-mode-shift", sourceAxis: "workModeShiftAxis", sourceField: "shiftDetected", detail: "work mode shift detected via hints" });
  }

  // ?? weakHeuristicEvidence ??
  if (work?.available) {
    const boundarySignals = safeArr(work.signals).filter((s) => s.code === "target-boundary");
    if (boundarySignals.length > 0) {
      weakHeuristic.push({ bucket: "weakHeuristicEvidence", strength: "weak", code: "boundary-hints", sourceAxis: "workModeShiftAxis", sourceField: "signals.target-boundary", detail: boundarySignals.map((s) => s.detail).join("; ").slice(0, 120) });
    }
    const transitionSignals = safeArr(work.signals).filter((s) => s.code === "target-transition");
    if (transitionSignals.length > 0) {
      weakHeuristic.push({ bucket: "weakHeuristicEvidence", strength: "weak", code: "transition-hints", sourceAxis: "workModeShiftAxis", sourceField: "signals.target-transition", detail: transitionSignals.map((s) => s.detail).join("; ").slice(0, 120) });
    }
    const capSignals = safeArr(work.signals).filter((s) => s.code === "shared-capability");
    if (capSignals.length > 0) {
      weakHeuristic.push({ bucket: "weakHeuristicEvidence", strength: "weak", code: "weak-cap-overlap", sourceAxis: "workModeShiftAxis", sourceField: "signals.shared-capability", detail: capSignals[0]?.detail ?? "weak capability hint overlap" });
    }
  }

  return {
    structuralEvidence: structural,
    transferEvidence: transfer,
    frictionEvidence: friction,
    weakHeuristicEvidence: weakHeuristic,
    conflictingEvidence: conflicting,
  };
}

// ?????????????????????????????????????????????
// buildCandidateEvidenceLedger (Phase 8-5)
// Per-candidate evidence ledger with provisional confidence + downgrade rules.
// ?????????????????????????????????????????????
function buildCandidateEvidenceLedger(interactionCandidates, evidenceBuckets, axes) {
  const dom = axes?.domainProximityAxis;
  const role = axes?.roleProximityAxis;
  const proof = axes?.proofTransferAxis;
  const decision = axes?.decisionFrictionAxis;

  const { structuralEvidence, transferEvidence, frictionEvidence, weakHeuristicEvidence } = evidenceBuckets;

  return safeArr(interactionCandidates).map((candidate) => {
    const { taxonomyId, confidence: baseConfidence } = candidate;
    const isAmplification = AMPLIFICATION_IDS.has(taxonomyId);
    const isShift = SHIFT_IDS.has(taxonomyId);

    const positiveEvidence = [];
    const candidateConflicting = [];
    const unresolvedEvidence = [];
    const downgradeReasons = [];

    // Collect structural + transfer evidence as positive
    for (const e of structuralEvidence) {
      positiveEvidence.push({ ...e, affects: taxonomyId });
    }
    for (const e of transferEvidence) {
      positiveEvidence.push({ ...e, affects: taxonomyId });
    }

    // Collect friction as conflicting for this candidate
    for (const e of frictionEvidence) {
      candidateConflicting.push({ ...e, affects: taxonomyId });
    }

    // Unresolved: missing axis inputs
    if (!dom?.available) unresolvedEvidence.push({ code: "missing-domain-axis", detail: "domainProximityAxis unavailable ??domain structural comparison absent" });
    if (!role?.available) unresolvedEvidence.push({ code: "missing-role-axis", detail: "roleProximityAxis unavailable ??role structural comparison absent" });
    if (!proof?.available) unresolvedEvidence.push({ code: "missing-proof-axis", detail: "proofTransferAxis unavailable ??transfer assessment absent" });
    if (!decision?.available) unresolvedEvidence.push({ code: "missing-decision-axis", detail: "decisionFrictionAxis unavailable ??decision friction unknown" });

    // Evidence counts for downgrade evaluation
    const strongStructuralCount = structuralEvidence.filter((e) => e.strength === "strong").length;
    const supportingCount = [...structuralEvidence, ...transferEvidence].filter((e) => e.strength === "supporting").length;
    const weakHeuristicCount = weakHeuristicEvidence.length;

    // Start from candidate base confidence
    let provisionalConfidence = baseConfidence ?? "low";

    // Downgrade Rule 1: sameFamily + farTransition + weakTransfer ??cap medium
    if (role?.sameFamily === true && role?.farTransition === true && proof?.weakTransfer === true) {
      downgradeReasons.push({ rule: 1, detail: "sameFamily + farTransition + weakTransfer ??capped at medium" });
      if (provisionalConfidence === "high") provisionalConfidence = "medium";
    }

    // Downgrade Rule 2: amplification candidate + frictionDetected ??cap medium
    if (isAmplification && decision?.frictionDetected === true) {
      downgradeReasons.push({ rule: 2, detail: "amplification candidate + frictionDetected ??capped at medium" });
      if (provisionalConfidence === "high") provisionalConfidence = "medium";
    }

    // Downgrade Rule 3: shift candidate without strong transfer ??never high; without any transfer ??low
    if (isShift) {
      const hasStrongTransfer = proof?.transferable === true;
      const hasAnyTransfer = proof?.partiallyTransferable === true || proof?.weakTransfer === true;
      if (!hasStrongTransfer) {
        downgradeReasons.push({ rule: 3, detail: "shift candidate ??no strong transfer evidence, capped at medium" });
        if (provisionalConfidence === "high") provisionalConfidence = "medium";
      }
      if (!hasStrongTransfer && !hasAnyTransfer) {
        downgradeReasons.push({ rule: 3, detail: "shift candidate ??no transfer evidence at all, capped at low" });
        if (provisionalConfidence === "medium") provisionalConfidence = "low";
      }
    }

    // Downgrade Rule 4: differentSector without strong structural ??not high
    if (dom?.differentSector === true && strongStructuralCount === 0) {
      downgradeReasons.push({ rule: 4, detail: "differentSector without strong structural support ??not high" });
      if (provisionalConfidence === "high") provisionalConfidence = "medium";
    }

    // Downgrade Rule 5: no strong structural + mostly weak heuristic ??cap low
    if (strongStructuralCount === 0 && weakHeuristicCount > 0 && supportingCount === 0) {
      downgradeReasons.push({ rule: 5, detail: "no strong structural + mostly weak heuristic ??capped at low" });
      if (provisionalConfidence === "high" || provisionalConfidence === "medium") provisionalConfidence = "low";
    }

    // If all 4 axes are unavailable ??null
    if (unresolvedEvidence.length >= 4) {
      provisionalConfidence = null;
    }

    return {
      taxonomyId,
      matched: true,
      positiveEvidence,
      conflictingEvidence: candidateConflicting,
      unresolvedEvidence,
      downgradeApplied: downgradeReasons.length > 0,
      downgradeReasons,
      provisionalConfidence,
      meta: {
        isAmplification,
        isShift,
        strongStructuralCount,
        frictionCount: candidateConflicting.length,
        weakHeuristicCount,
      },
    };
  });
}

// ?????????????????????????????????????????????
// buildWeightingMeta (Phase 8-5)
// ?????????????????????????????????????????????
function buildWeightingMeta(interactionCandidates, evidenceBuckets, candidateEvidence) {
  const { structuralEvidence, transferEvidence, frictionEvidence, weakHeuristicEvidence, conflictingEvidence } = evidenceBuckets;

  const downgradeApplied = safeArr(candidateEvidence).some((c) => c.downgradeApplied);
  const unresolvedGaps = [...new Set(
    safeArr(candidateEvidence).flatMap((c) => safeArr(c.unresolvedEvidence).map((u) => u.code))
  )];

  return {
    stageMarker: "pre-rule-engine",
    candidateCount: safeArr(interactionCandidates).length,
    evidenceCounts: {
      structural: structuralEvidence.length,
      transfer: transferEvidence.length,
      friction: frictionEvidence.length,
      weakHeuristic: weakHeuristicEvidence.length,
      conflicting: conflictingEvidence.length,
    },
    downgradeApplied,
    unresolvedGaps,
  };
}

// ?????????????????????????????????????????????
// buildTaxonomyCandidates (Phase 8-3)
// Maps resolved axes to taxonomy candidate entries.
// No final ranking ??multi-candidate read-only retrieval.
// ?????????????????????????????????????????????
function buildTaxonomyCandidates(axes) {
  const {
    domainProximityAxis: dom,
    roleProximityAxis: role,
    workModeShiftAxis: work,
    proofTransferAxis: proof,
    decisionFrictionAxis: decision,
  } = axes ?? {};

  const candidates = [];
  const axesParticipated = new Set();

  function addCandidate(taxonomyRef, confidence, reasons, sourceAxes) {
    candidates.push({
      taxonomyId: taxonomyRef.id,
      categoryId: taxonomyRef.categoryId,
      matched: true,
      reasons,
      sourceAxes,
      confidence,
      meta: { matchType: "heuristic", heuristicLevel: "weak-readonly" },
    });
    for (const ax of sourceAxes) axesParticipated.add(ax);
  }

  // ?? domainProximityAxis + roleProximityAxis: amplification candidates ??
  if (dom?.available && role?.available) {
    if (dom.sameSector === true && dom.sameSubSector === true) {
      addCandidate(
        TAXONOMY_IDS.DOMAIN_KNOWLEDGE_AMPLIFICATION,
        "high",
        [{ code: "same-sector+sub-sector", field: "domainProximityAxis.sameSector+sameSubSector", value: true }],
        ["domainProximityAxis"]
      );
      if (role.sameFamily === true || role.sameSubcategory === true) {
        addCandidate(
          TAXONOMY_IDS.WORK_CONTENT_AMPLIFICATION,
          "high",
          [
            { code: "same-sector", field: "domainProximityAxis.sameSector", value: true },
            { code: "same-family-or-sub", field: "roleProximityAxis.sameFamily|sameSubcategory", value: true },
          ],
          ["domainProximityAxis", "roleProximityAxis"]
        );
      }
    } else if (dom.sameSector === true) {
      addCandidate(
        TAXONOMY_IDS.DOMAIN_KNOWLEDGE_AMPLIFICATION,
        "medium",
        [{ code: "same-sector", field: "domainProximityAxis.sameSector", value: true }],
        ["domainProximityAxis"]
      );
    }

    if (dom.sameSector === true && decision?.sameDecisionStructure === true) {
      addCandidate(
        TAXONOMY_IDS.DECISION_STRUCTURE_AMPLIFICATION,
        "high",
        [
          { code: "same-sector", field: "domainProximityAxis.sameSector", value: true },
          { code: "same-decision-structure", field: "decisionFrictionAxis.sameDecisionStructure", value: true },
        ],
        ["domainProximityAxis", "decisionFrictionAxis"]
      );
    }
  }

  // ?? roleProximityAxis: boundary shift candidates ??
  if (role?.available) {
    if (role.adjacentFamily === true) {
      addCandidate(
        TAXONOMY_IDS.ADJACENT_ROLE_SHIFT,
        "high",
        [{ code: "adjacent-family", field: "roleProximityAxis.adjacentFamily", value: true }],
        ["roleProximityAxis"]
      );
    }
    if (role.sameFamily === true && role.sameSubcategory !== true) {
      addCandidate(
        TAXONOMY_IDS.SAME_ROLE_FAMILY_SHIFT,
        "medium",
        [{ code: "same-family-diff-sub", field: "roleProximityAxis.sameFamily+!sameSubcategory", value: true }],
        ["roleProximityAxis"]
      );
    }
    if (role.sameMajorCategory === true && role.sameSubcategory === false && role.sameFamily === false) {
      addCandidate(
        TAXONOMY_IDS.ADJACENT_ROLE_SHIFT,
        "medium",
        [{ code: "same-major-diff-sub", field: "roleProximityAxis.sameMajorCategory+!sameSubcategory", value: true }],
        ["roleProximityAxis"]
      );
    }
    if (role.farTransition === true && dom?.differentSector === true) {
      addCandidate(
        TAXONOMY_IDS.INDUSTRY_SPECIALIZED_ROLE_SHIFT,
        "medium",
        [
          { code: "far-transition", field: "roleProximityAxis.farTransition", value: true },
          { code: "different-sector", field: "domainProximityAxis.differentSector", value: true },
        ],
        ["roleProximityAxis", "domainProximityAxis"]
      );
    }
  }

  // ?? domainProximityAxis: weakening when differentSector ??
  if (dom?.available && dom.differentSector === true) {
    addCandidate(
      TAXONOMY_IDS.DOMAIN_IRRELEVANT_EXPERIENCE_WEAKENING,
      "medium",
      [{ code: "different-sector", field: "domainProximityAxis.differentSector", value: true }],
      ["domainProximityAxis"]
    );
    if (dom.boundaryRelated !== true) {
      addCandidate(
        TAXONOMY_IDS.DOMAIN_FIT_PROOF_SHIFT,
        "medium",
        [
          { code: "different-sector-no-boundary-hint", field: "domainProximityAxis.differentSector+!boundaryRelated", value: true },
        ],
        ["domainProximityAxis"]
      );
    }
  }

  // ?? domainProximityAxis: boundary related (cross-sector but hinted) ??
  if (dom?.available && dom.boundaryRelated === true) {
    addCandidate(
      TAXONOMY_IDS.ADJACENT_ROLE_SHIFT,
      "low",
      [{ code: "boundary-related", field: "domainProximityAxis.boundaryRelated", value: true }],
      ["domainProximityAxis"]
    );
  }

  // ?? workModeShiftAxis: work-style shift candidates ??
  if (work?.available && work.shiftDetected === true) {
    addCandidate(
      TAXONOMY_IDS.ANALYTICAL_VS_EXECUTIONAL_SHIFT,
      "low",
      [{ code: "work-mode-shift", field: "workModeShiftAxis.shiftDetected", value: true }],
      ["workModeShiftAxis"]
    );
    addCandidate(
      TAXONOMY_IDS.OPERATIONAL_STRATEGIC_SHIFT,
      "low",
      [{ code: "work-mode-shift", field: "workModeShiftAxis.shiftDetected", value: true }],
      ["workModeShiftAxis"]
    );
    addCandidate(
      TAXONOMY_IDS.OUTPUT_EVIDENCE_SHIFT,
      "low",
      [{ code: "work-mode-shift-output", field: "workModeShiftAxis.shiftDetected", value: true }],
      ["workModeShiftAxis"]
    );
    // external/internal hint if both boundary+transition signals present
    const hasBoundary = work.signals?.some((s) => s.code === "target-boundary");
    const hasTransition = work.signals?.some((s) => s.code === "target-transition");
    if (hasBoundary && hasTransition) {
      addCandidate(
        TAXONOMY_IDS.EXTERNAL_INTERNAL_SHIFT,
        "low",
        [{ code: "boundary-and-transition-hints", field: "workModeShiftAxis.signals", value: "boundary+transition" }],
        ["workModeShiftAxis"]
      );
    }
  }

  // ?? proofTransferAxis: transfer / friction candidates ??
  if (proof?.available) {
    if (proof.transferable === true) {
      addCandidate(
        TAXONOMY_IDS.OUTPUT_AMPLIFICATION,
        "high",
        [{ code: "transferable", field: "proofTransferAxis.transferable", value: true }],
        ["proofTransferAxis"]
      );
      addCandidate(
        TAXONOMY_IDS.WORK_CONTENT_AMPLIFICATION,
        "medium",
        [{ code: "transferable", field: "proofTransferAxis.transferable", value: true }],
        ["proofTransferAxis"]
      );
    }
    if (proof.partiallyTransferable === true) {
      addCandidate(
        TAXONOMY_IDS.DOMAIN_FIT_PROOF_SHIFT,
        "medium",
        [{ code: "partially-transferable", field: "proofTransferAxis.partiallyTransferable", value: true }],
        ["proofTransferAxis"]
      );
      addCandidate(
        TAXONOMY_IDS.PROCESS_PROOF_SHIFT,
        "medium",
        [{ code: "partially-transferable", field: "proofTransferAxis.partiallyTransferable", value: true }],
        ["proofTransferAxis"]
      );
    }
    if (proof.weakTransfer === true) {
      addCandidate(
        TAXONOMY_IDS.DOMAIN_FIT_PROOF_SHIFT,
        "low",
        [{ code: "weak-transfer", field: "proofTransferAxis.weakTransfer", value: true }],
        ["proofTransferAxis"]
      );
      addCandidate(
        TAXONOMY_IDS.TASK_CONTENT_WEAKENING,
        "low",
        [{ code: "weak-transfer", field: "proofTransferAxis.weakTransfer", value: true }],
        ["proofTransferAxis"]
      );
    }
  }

  // ?? decisionFrictionAxis: friction candidates ??
  if (decision?.available) {
    if (decision.frictionDetected === true) {
      addCandidate(
        TAXONOMY_IDS.DOMAIN_IRRELEVANT_EXPERIENCE_WEAKENING,
        "medium",
        [{ code: "friction-detected", field: "decisionFrictionAxis.frictionDetected", value: true }],
        ["decisionFrictionAxis"]
      );
      addCandidate(
        TAXONOMY_IDS.RELATIONSHIP_POSITION_PROOF_SHIFT,
        "medium",
        [{ code: "friction-detected", field: "decisionFrictionAxis.frictionDetected", value: true }],
        ["decisionFrictionAxis"]
      );
    }
    if (decision.sameDecisionStructure === false) {
      addCandidate(
        TAXONOMY_IDS.RESULT_EVIDENCE_SHIFT,
        "medium",
        [{ code: "diff-decision-structure", field: "decisionFrictionAxis.sameDecisionStructure", value: false }],
        ["decisionFrictionAxis"]
      );
    }
    if (decision.sameBuyingMotion === true) {
      addCandidate(
        TAXONOMY_IDS.OPERATIONAL_RHYTHM_AMPLIFICATION,
        "medium",
        [{ code: "same-buying-motion", field: "decisionFrictionAxis.sameBuyingMotion", value: true }],
        ["decisionFrictionAxis"]
      );
    }
    if (decision.sameCustomerMarket === true && decision.sameDecisionStructure === true) {
      addCandidate(
        TAXONOMY_IDS.COLLABORATION_STRUCTURE_AMPLIFICATION,
        "medium",
        [
          { code: "same-customer-market", field: "decisionFrictionAxis.sameCustomerMarket", value: true },
          { code: "same-decision-structure", field: "decisionFrictionAxis.sameDecisionStructure", value: true },
        ],
        ["decisionFrictionAxis"]
      );
    }
  }

  // Deduplicate by taxonomyId (keep first / highest-confidence occurrence)
  const seen = new Set();
  const dedupedCandidates = candidates.filter((c) => {
    if (seen.has(c.taxonomyId)) return false;
    seen.add(c.taxonomyId);
    return true;
  });

  const matchedTaxonomyIds = [...new Set(dedupedCandidates.map((c) => c.taxonomyId))];

  const candidateReasons = dedupedCandidates.flatMap((c) =>
    c.reasons.map((r) => ({ taxonomyId: c.taxonomyId, ...r }))
  );

  const mappingMeta = {
    axesParticipated: [...axesParticipated],
    totalTaxonomyAssetsChecked: Object.keys(TAXONOMY_IDS).length,
    matchingMethod: dedupedCandidates.length > 0 ? "heuristic" : "none",
    unresolvedGaps: [
      ...(!dom?.available ? ["domainProximityAxis unavailable"] : []),
      ...(!role?.available ? ["roleProximityAxis unavailable"] : []),
      ...(!work?.available ? ["workModeShiftAxis unavailable"] : []),
      ...(!proof?.available ? ["proofTransferAxis unavailable"] : []),
      ...(!decision?.available ? ["decisionFrictionAxis unavailable"] : []),
    ],
  };

  return { interactionCandidates: dedupedCandidates, matchedTaxonomyIds, candidateReasons, mappingMeta };
}

// ?????????????????????????????????????????????
// Phase 8-4: Rule engine helpers
// ?????????????????????????????????????????????

const BRIDGE_IDS = new Set([
  "ADJACENT_ROLE_SHIFT",
  "SAME_ROLE_FAMILY_SHIFT",
]);

const FRICTION_IDS = new Set([
  "DOMAIN_IRRELEVANT_EXPERIENCE_WEAKENING",
  "TASK_CONTENT_WEAKENING",
  "ABSTRACT_CAPABILITY_KEYWORD_WEAKENING",
  "OUTPUT_PERSUASIVENESS_WEAKENING",
  "PERFORMANCE_LANGUAGE_WEAKENING",
]);

function getCandidateGroup(taxonomyId) {
  if (AMPLIFICATION_IDS.has(taxonomyId)) return "amplification";
  if (BRIDGE_IDS.has(taxonomyId)) return "bridge";
  if (FRICTION_IDS.has(taxonomyId)) return "friction";
  if (SHIFT_IDS.has(taxonomyId)) return "shift";
  return "shift"; // conservative fallback
}

const GROUP_PRECEDENCE = { amplification: 1, bridge: 2, shift: 3, friction: 4 };

// ?????????????????????????????????????????????
// buildCandidateCeilingMap (Phase 8-4)
// Computes per-candidate confidence ceiling before winner selection.
// ?????????????????????????????????????????????
function buildCandidateCeilingMap(
  interactionCandidates,
  candidateEvidence,
  axes,
  selectionResolvedMeta,
  selectionResolvedDiagnostics,
  aiResolvedComparison
) {
  const ceilingMap = {};

  const evidenceMap = {};
  for (const ledger of safeArr(candidateEvidence)) {
    evidenceMap[ledger.taxonomyId] = ledger;
  }

  const dom = axes?.domainProximityAxis;
  const role = axes?.roleProximityAxis;
  const proof = axes?.proofTransferAxis;
  const decision = axes?.decisionFrictionAxis;

  for (const candidate of safeArr(interactionCandidates)) {
    const { taxonomyId } = candidate;
    const ledger = evidenceMap[taxonomyId] ?? null;

    const blockedReasons = [];
    const notes = [];
    let eligibleAsPrimary = true;
    let eligibleAsHighConfidence = true;
    let ceilingLevel = "high";

    if (!ledger) {
      ceilingMap[taxonomyId] = {
        eligibleAsPrimary: false,
        eligibleAsHighConfidence: false,
        ceilingLevel: "blocked",
        blockedReasons: ["no_candidate_evidence_ledger"],
        notes: [],
        provisionalAllowed: false,
      };
      continue;
    }

    const strongStructuralCount = ledger.meta?.strongStructuralCount ?? 0;
    const weakHeuristicCount = ledger.meta?.weakHeuristicCount ?? 0;
    const transferEvidence = safeArr(ledger.positiveEvidence).filter((e) => e.bucket === "transferEvidence");
    const unresolvedCount = safeArr(ledger.unresolvedEvidence).length;

    // Ceiling Rule 1: heuristic-only ??blocked as primary
    if (strongStructuralCount === 0 && transferEvidence.length === 0 && weakHeuristicCount > 0) {
      eligibleAsPrimary = false;
      eligibleAsHighConfidence = false;
      ceilingLevel = "blocked";
      blockedReasons.push("heuristic_only_candidate");
    }

    // Ceiling Rule 2: sameFamily + farTransition + weakTransfer ??max medium
    if (role?.sameFamily === true && role?.farTransition === true && proof?.weakTransfer === true) {
      eligibleAsHighConfidence = false;
      if (ceilingLevel === "high") ceilingLevel = "medium";
      notes.push("same_family_but_far_transition_weak_transfer");
    }

    // Ceiling Rule 3: differentSector alone ??friction candidate not eligible as primary
    if (FRICTION_IDS.has(taxonomyId) && dom?.differentSector === true) {
      const hasAdditionalFriction =
        proof?.weakTransfer === true ||
        decision?.frictionDetected === true ||
        role?.farTransition === true ||
        safeArr(ledger.conflictingEvidence).length > 1;
      if (!hasAdditionalFriction) {
        eligibleAsPrimary = false;
        if (ceilingLevel === "high") ceilingLevel = "medium";
        blockedReasons.push("different_sector_alone_not_sufficient");
      }
    }

    // Ceiling Rule 4: large unresolved ??high blocked
    const hasLargeUnresolved = unresolvedCount >= 3;
    const hasWeakAlignment = selectionResolvedMeta?.source === "unavailable";
    const hasUnstableAiComparison =
      aiResolvedComparison?.role?.status === "mismatch" ||
      aiResolvedComparison?.industry?.status === "mismatch";

    if (hasLargeUnresolved || hasWeakAlignment || hasUnstableAiComparison) {
      eligibleAsHighConfidence = false;
      if (ceilingLevel === "high") ceilingLevel = "medium";
      notes.push("high_confidence_blocked_by_unresolved");
    }

    // Ceiling Rule 5: amplification + frictionDetected ??eligibleAsHighConfidence false
    if (AMPLIFICATION_IDS.has(taxonomyId) && decision?.frictionDetected === true) {
      eligibleAsHighConfidence = false;
      if (ceilingLevel === "high") ceilingLevel = "medium";
      notes.push("amplification_downgraded_by_friction");
    }

    const isBlocked = ceilingLevel === "blocked";
    ceilingMap[taxonomyId] = {
      eligibleAsPrimary: eligibleAsPrimary && !isBlocked,
      eligibleAsHighConfidence,
      ceilingLevel,
      blockedReasons,
      notes,
      provisionalAllowed: !isBlocked && (eligibleAsPrimary || strongStructuralCount > 0),
    };
  }

  return ceilingMap;
}

// ?????????????????????????????????????????????
// pickPrimaryInteractionCandidate (Phase 8-4)
// Precedence-based winner selection ??no numeric ranking.
// ?????????????????????????????????????????????
function pickPrimaryInteractionCandidate(
  interactionCandidates,
  candidateEvidence,
  axes,
  weightingMeta,
  ceilingMap
) {
  const winnerNotes = [];

  const evidenceMap = {};
  for (const ledger of safeArr(candidateEvidence)) {
    evidenceMap[ledger.taxonomyId] = ledger;
  }

  const eligible = safeArr(interactionCandidates).filter(
    (c) => ceilingMap[c.taxonomyId]?.eligibleAsPrimary === true
  );

  if (eligible.length === 0) {
    return {
      winnerCandidateId: null,
      winnerCandidateType: null,
      winnerGroup: null,
      confidenceLevel: null,
      tieBreakMeta: null,
      winnerNotes: ["no_eligible_candidates"],
    };
  }

  // Group eligible candidates by precedence
  const grouped = { amplification: [], bridge: [], shift: [], friction: [] };
  for (const c of eligible) {
    const group = getCandidateGroup(c.taxonomyId);
    grouped[group].push(c);
  }

  let winnerCandidate = null;
  let winnerGroup = null;
  let tieBreakMeta = null;

  for (const group of ["amplification", "bridge", "shift", "friction"]) {
    const groupCandidates = grouped[group];
    if (groupCandidates.length === 0) continue;

    const firstLedger = evidenceMap[groupCandidates[0]?.taxonomyId];
    const firstStrongStructural = firstLedger?.meta?.strongStructuralCount ?? 0;
    const firstTransferEvidence = safeArr(firstLedger?.positiveEvidence).filter(
      (e) => e.bucket === "transferEvidence" && (e.strength === "strong" || e.strength === "supporting")
    );

    // W1: skip shift/friction when amplification/bridge has both structural + transfer
    if ((group === "shift" || group === "friction") &&
        firstStrongStructural > 0 && firstTransferEvidence.length > 0) {
      if (grouped.amplification.length > 0 || grouped.bridge.length > 0) {
        winnerNotes.push(`w1_skipped_${group}_structural_transfer_favors_higher_group`);
        continue;
      }
    }

    // W2: shift without structural support ??provisional only, not a skip
    if (group === "shift" && firstStrongStructural === 0) {
      winnerNotes.push("w2_shift_without_structural_provisional_only");
    }

    // W3: friction must have central friction, not just differentSector alone
    if (group === "friction") {
      const hasCentralFriction = groupCandidates.some(
        (c) => safeArr(evidenceMap[c.taxonomyId]?.conflictingEvidence).length >= 2
      );
      if (!hasCentralFriction) {
        winnerNotes.push("w3_friction_not_central_enough_skipped");
        continue;
      }
    }

    winnerGroup = group;

    if (groupCandidates.length === 1) {
      winnerCandidate = groupCandidates[0];
      break;
    }

    // W4 tie-break: strong structural ??transfer quality ??conflicting size ??unresolved size
    const scored = groupCandidates.map((c) => {
      const ledger = evidenceMap[c.taxonomyId];
      return {
        candidate: c,
        strongStructural: ledger?.meta?.strongStructuralCount ?? 0,
        transferQuality: safeArr(ledger?.positiveEvidence).filter(
          (e) => e.bucket === "transferEvidence" && (e.strength === "strong" || e.strength === "supporting")
        ).length,
        conflictingSize: safeArr(ledger?.conflictingEvidence).length,
        unresolvedSize: safeArr(ledger?.unresolvedEvidence).length,
      };
    });

    scored.sort((a, b) => {
      if (b.strongStructural !== a.strongStructural) return b.strongStructural - a.strongStructural;
      if (b.transferQuality !== a.transferQuality) return b.transferQuality - a.transferQuality;
      if (a.conflictingSize !== b.conflictingSize) return a.conflictingSize - b.conflictingSize;
      return a.unresolvedSize - b.unresolvedSize;
    });

    winnerCandidate = scored[0].candidate;

    // Record tie-break meta if top two were close
    if (
      scored.length >= 2 &&
      scored[0].strongStructural === scored[1].strongStructural &&
      scored[0].transferQuality === scored[1].transferQuality
    ) {
      tieBreakMeta = {
        method: "conflicting_then_unresolved",
        candidates: scored.slice(0, 2).map((s) => ({
          taxonomyId: s.candidate.taxonomyId,
          strongStructural: s.strongStructural,
          transferQuality: s.transferQuality,
          conflictingSize: s.conflictingSize,
          unresolvedSize: s.unresolvedSize,
        })),
      };
    }

    break;
  }

  if (!winnerCandidate) {
    return {
      winnerCandidateId: null,
      winnerCandidateType: null,
      winnerGroup: null,
      confidenceLevel: null,
      tieBreakMeta,
      winnerNotes,
    };
  }

  // Cap confidence by ceiling
  const ceiling = ceilingMap[winnerCandidate.taxonomyId];
  const ledger = evidenceMap[winnerCandidate.taxonomyId];
  let confidenceLevel = ledger?.provisionalConfidence ?? "low";

  if (!ceiling?.eligibleAsHighConfidence && confidenceLevel === "high") {
    confidenceLevel = "medium";
    winnerNotes.push("high_confidence_blocked_by_ceiling");
  }

  return {
    winnerCandidateId: winnerCandidate.taxonomyId,
    winnerCandidateType: winnerCandidate.categoryId ?? null,
    winnerGroup,
    confidenceLevel,
    tieBreakMeta,
    winnerNotes,
  };
}

// ?????????????????????????????????????????????
// promoteTopLevelDrivers (Phase 8-4)
// Extracts support/risk/conflict signals for the winner candidate.
// ?????????????????????????????????????????????
function promoteTopLevelDrivers(winnerResult, candidateEvidence, evidenceBuckets, axes) {
  const { winnerCandidateId } = winnerResult ?? {};

  if (!winnerCandidateId) {
    // Phase 13-A: winnerAbsent collapse prevention - minimal material recovery only.
    // Does not promote a replacement winner. Uses the richest available ledger as a
    // reference source for fallback derivation only, so downstream assemblies receive
    // some support/risk/conflict material instead of all-empty arrays.
    const _allLedgers = safeArr(candidateEvidence).filter((l) => l && l.taxonomyId);
    // Reference ledger: ledger with most positive evidence. Fallback derivation only, not winner promotion.
    const _bestLedger = _allLedgers.length
      ? _allLedgers.reduce((best, l) =>
          safeArr(l.positiveEvidence).length >= safeArr(best.positiveEvidence).length ? l : best,
          _allLedgers[0]
        )
      : null;

    const _globalStructural = safeArr(evidenceBuckets?.structuralEvidence);
    const _globalTransfer = safeArr(evidenceBuckets?.transferEvidence);
    const _globalFriction = safeArr(evidenceBuckets?.frictionEvidence);
    const _fallbackSupport = [];
    const _fallbackRisk = [];
    const _fallbackConflicts = [];
    const _seenSupport = new Set();
    const _seenRisk = new Set();
    const _seenConflict = new Set();
    const _fallbackSources = new Set();
    const _pushDriver = (target, seen, evidenceLike) => {
      if (!evidenceLike || typeof evidenceLike !== "object") return;
      const code = safeStr(evidenceLike.code);
      if (!code) return;
      const sourceAxis = safeStr(evidenceLike.sourceAxis) ?? null;
      const sourceField = safeStr(evidenceLike.sourceField) ?? null;
      const strength = safeStr(evidenceLike.strength) ?? null;
      const bucket = safeStr(evidenceLike.bucket) ?? null;
      const key = [code, sourceAxis, sourceField, strength, bucket].join("|");
      if (seen.has(key)) return;
      seen.add(key);
      target.push({ code, sourceAxis, sourceField, strength, bucket });
    };
    const _pushConflict = (conflictLike) => {
      if (!conflictLike || typeof conflictLike !== "object") return;
      const code = safeStr(conflictLike.code);
      if (!code) return;
      const sourceAxis = safeStr(conflictLike.sourceAxis) ?? null;
      const detail = safeStr(conflictLike.detail) ?? null;
      const key = [code, sourceAxis, detail].join("|");
      if (_seenConflict.has(key)) return;
      _seenConflict.add(key);
      _fallbackConflicts.push({ code, sourceAxis, detail });
    };

    if (_bestLedger) {
      for (const e of safeArr(_bestLedger.positiveEvidence)) {
        if (e.bucket === "weakHeuristicEvidence") continue;
        if (e.strength === "strong" || e.strength === "supporting") {
          _pushDriver(_fallbackSupport, _seenSupport, e);
        }
      }
      for (const e of safeArr(_bestLedger.conflictingEvidence)) {
        _pushDriver(_fallbackRisk, _seenRisk, e);
      }
      if (_fallbackSupport.length > 0 || _fallbackRisk.length > 0) {
        _fallbackSources.add("best-ledger");
      }
    }

    if (_fallbackSupport.length === 0) {
      for (const e of [..._globalStructural, ..._globalTransfer]) {
        if (e.bucket === "weakHeuristicEvidence") continue;
        if (e.strength === "strong" || e.strength === "supporting") {
          _pushDriver(_fallbackSupport, _seenSupport, e);
        }
      }
      if (_fallbackSupport.length > 0) _fallbackSources.add("global-support-buckets");
    }

    if (_fallbackRisk.length === 0) {
      for (const e of _globalFriction) {
        _pushDriver(_fallbackRisk, _seenRisk, e);
      }
      if (_fallbackRisk.length > 0) _fallbackSources.add("global-friction-bucket");
    }

    if (_fallbackRisk.length === 0) {
      for (const ledger of _allLedgers) {
        for (const e of safeArr(ledger.conflictingEvidence)) {
          _pushDriver(_fallbackRisk, _seenRisk, e);
        }
      }
      if (_fallbackRisk.length > 0) _fallbackSources.add("candidate-conflicting-ledgers");
    }

    // derive axis-level conflicts directly when axes are available
    const _proof    = axes?.proofTransferAxis;
    const _decision = axes?.decisionFrictionAxis;
    const _role     = axes?.roleProximityAxis;
    if (_proof?.weakTransfer === true) {
      _pushConflict({ code: "weak_transfer_no_winner", sourceAxis: "proofTransferAxis", detail: "weak transfer with no resolved winner" });
      _fallbackSources.add("proofTransferAxis");
    }
    if (_decision?.frictionDetected === true) {
      _pushConflict({ code: "friction_detected_no_winner", sourceAxis: "decisionFrictionAxis", detail: "decision friction with no resolved winner" });
      _fallbackSources.add("decisionFrictionAxis");
    }
    if (_role?.sameFamily === true && _role?.farTransition === true) {
      _pushConflict({ code: "same_family_far_transition_conflict", sourceAxis: "roleProximityAxis", detail: "sameFamily but farTransition - proximity contradiction" });
      _fallbackSources.add("roleProximityAxis");
    }

    if (_role?.adjacentFamily === true && _proof?.weakTransfer === true) {
      _pushConflict({
        code: "adjacent_family_with_weak_transfer",
        sourceAxis: "roleProximityAxis+proofTransferAxis",
        detail: "adjacent family but transfer remains weak without a resolved winner",
      });
    }
    if ((_bestLedger?.meta?.strongStructuralCount ?? 0) === 0 && safeArr(_bestLedger?.unresolvedEvidence).length >= 2) {
      _pushConflict({
        code: "best_ledger_unresolved_without_winner",
        sourceAxis: "candidateEvidence",
        detail: `${safeArr(_bestLedger?.unresolvedEvidence).length} unresolved inputs remain on richest ledger without a resolved winner`,
      });
      _fallbackSources.add("best-ledger-unresolved");
    }

    if (_fallbackSupport.length > 0 || _fallbackRisk.length > 0 || _fallbackConflicts.length > 0) {
      return {
        supportDrivers: _fallbackSupport,
        riskDrivers: _fallbackRisk,
        conflicts: _fallbackConflicts,
        driverMeta: {
          winnerAbsent: true,
          derivedFromBestLedger: _bestLedger?.taxonomyId ?? null,
          fallback: true,
          fallbackSource: "winnerAbsentContainment",
          candidateEvidenceCount: _allLedgers.length,
          unresolvedReferenceCount: safeArr(_bestLedger?.unresolvedEvidence).length,
          derivedFromGlobalBuckets: (_globalStructural.length + _globalTransfer.length + _globalFriction.length) > 0,
          fallbackSources: Array.from(_fallbackSources),
        },
      };
    }

    return { supportDrivers: [], riskDrivers: [], conflicts: [], driverMeta: { winnerAbsent: true } };
  }

  const winnerLedger = safeArr(candidateEvidence).find((l) => l.taxonomyId === winnerCandidateId) ?? null;

  const supportDrivers = [];
  const riskDrivers = [];
  const conflicts = [];

  if (winnerLedger) {
    // supportDrivers: strong/supporting from winner ledger ??no weakHeuristic
    for (const e of safeArr(winnerLedger.positiveEvidence)) {
      if (e.bucket === "weakHeuristicEvidence") continue;
      if (e.strength === "strong" || e.strength === "supporting") {
        supportDrivers.push({
          code: e.code,
          sourceAxis: e.sourceAxis,
          sourceField: e.sourceField,
          strength: e.strength,
          bucket: e.bucket,
        });
      }
    }

    // riskDrivers: conflicting evidence from winner ledger
    for (const e of safeArr(winnerLedger.conflictingEvidence)) {
      riskDrivers.push({
        code: e.code,
        sourceAxis: e.sourceAxis,
        sourceField: e.sourceField,
        strength: e.strength,
        bucket: e.bucket,
      });
    }

    // conflicts: winner-specific contradictions
    const proof = axes?.proofTransferAxis;
    const decision = axes?.decisionFrictionAxis;
    const role = axes?.roleProximityAxis;

    if (winnerLedger.meta?.isAmplification && (proof?.weakTransfer === true || decision?.frictionDetected === true)) {
      conflicts.push({
        code: "amplification_with_weak_transfer_or_friction",
        sourceAxis: "proofTransferAxis+decisionFrictionAxis",
        detail: "amplification winner but transfer is weak or friction detected",
      });
    }
    if (winnerLedger.meta?.isShift && (winnerLedger.meta?.strongStructuralCount ?? 0) === 0) {
      conflicts.push({
        code: "shift_without_structural_support",
        sourceAxis: "roleProximityAxis+domainProximityAxis",
        detail: "shift winner without strong structural evidence",
      });
    }
    if (role?.sameFamily === true && role?.farTransition === true) {
      conflicts.push({
        code: "same_family_far_transition_conflict",
        sourceAxis: "roleProximityAxis",
        detail: "sameFamily but farTransition ??proximity contradiction",
      });
    }
    const unresolvedCount = safeArr(winnerLedger.unresolvedEvidence).length;
    if (unresolvedCount >= 2) {
      conflicts.push({
        code: "large_unresolved_weakens_winner_confidence",
        sourceAxis: "multiple",
        detail: `${unresolvedCount} unresolved inputs reduce winner certainty`,
      });
    }
  }

  return {
    supportDrivers,
    riskDrivers,
    conflicts,
    driverMeta: {
      winnerCandidateId,
      promotedFrom: "candidateEvidence.winnerLedger",
      weakHeuristicExcluded: true,
    },
  };
}

// ?????????????????????????????????????????????
// finalizeInteractionDecision (Phase 8-4)
// Null-safe case handling and final decision block assembly.
// ?????????????????????????????????????????????
function finalizeInteractionDecision(
  interactionCandidates,
  candidateEvidence,
  ceilingMap,
  winnerResult,
  driverResult,
  axes,
  evidenceBuckets
) {
  const candidates = safeArr(interactionCandidates);

  // Case 1: no candidates
  if (candidates.length === 0) {
    return {
      primaryInteractionType: null,
      supportDrivers: [],
      riskDrivers: [],
      conflicts: [],
      interactionDecisionMeta: {
        winnerStatus: "no_candidates",
        confidenceLevel: null,
        winnerGroup: null,
        winnerCandidateId: null,
        blockedCandidateIds: [],
        highConfidenceBlocked: false,
        provisionalUsed: false,
        tieBreakMeta: null,
        unresolvedCeilingApplied: false,
        notes: ["no_interaction_candidates_available"],
      },
    };
  }

  const { winnerCandidateId, winnerGroup, confidenceLevel, tieBreakMeta, winnerNotes } = winnerResult ?? {};

  const blockedCandidateIds = candidates
    .filter((c) => ceilingMap[c.taxonomyId]?.eligibleAsPrimary === false)
    .map((c) => c.taxonomyId);

  const highConfidenceBlocked = safeArr(candidateEvidence).some(
    (l) => ceilingMap[l.taxonomyId] && !ceilingMap[l.taxonomyId].eligibleAsHighConfidence
  );

  const unresolvedCeilingApplied = safeArr(candidateEvidence).some(
    (l) => safeArr(l.unresolvedEvidence).length > 0
  );

  const provisionalUsed = Boolean(
    winnerCandidateId &&
    (confidenceLevel === "low" || safeArr(winnerNotes).some((n) => n.includes("provisional")))
  );

  let winnerStatus;
  if (!winnerCandidateId) {
    winnerStatus = candidates.length > 0 ? "weak_evidence" : "no_candidates";
  } else if (provisionalUsed) {
    winnerStatus = "provisional_only";
  } else {
    winnerStatus = "selected";
  }

  return {
    primaryInteractionType: winnerCandidateId ?? null,
    supportDrivers: driverResult?.supportDrivers ?? [],
    riskDrivers: driverResult?.riskDrivers ?? [],
    conflicts: driverResult?.conflicts ?? [],
    interactionDecisionMeta: {
      winnerStatus,
      confidenceLevel: confidenceLevel ?? null,
      winnerGroup: winnerGroup ?? null,
      winnerCandidateId: winnerCandidateId ?? null,
      blockedCandidateIds,
      highConfidenceBlocked,
      provisionalUsed,
      tieBreakMeta: tieBreakMeta ?? null,
      unresolvedCeilingApplied,
      notes: safeArr(winnerNotes),
    },
  };
}

// ?????????????????????????????????????????????
// buildInteractionDecisionContract (Phase 8-6)
// Interpretation-friendly consumer contract.
// Freezes the external read model for Phase 9 interpretationPack.
// ?????????????????????????????????????????????
function buildInteractionDecisionContract(
  decisionResult,
  winnerResult,
  driverResult,
  ceilingMap,
  candidateEvidence,
  evidenceBuckets,
  axes
) {
  const meta = decisionResult?.interactionDecisionMeta ?? {};
  const primaryType = decisionResult?.primaryInteractionType ?? null;
  const primaryCandidateId = winnerResult?.winnerCandidateId ?? meta.winnerCandidateId ?? null;
  const primaryGroup = winnerResult?.winnerGroup ?? meta.winnerGroup ?? null;
  const confidence = winnerResult?.confidenceLevel ?? meta.confidenceLevel ?? null;

  // status ??priority order per spec
  let status = null;
  if (meta.winnerStatus === "no_candidates") {
    status = "no_candidates";
  } else if (!primaryType && meta.winnerStatus === "weak_evidence") {
    status = "weak_evidence";
  } else if (meta.provisionalUsed === true || meta.winnerStatus === "provisional_only") {
    status = "provisional";
  } else if (primaryType) {
    status = "resolved";
  } else if (safeArr(meta.blockedCandidateIds).length > 0 && !primaryType) {
    status = "blocked";
  }

  // unresolvedLevel ??best-effort
  const unresolvedCeilingApplied = meta.unresolvedCeilingApplied === true;
  const highConfidenceBlocked = meta.highConfidenceBlocked === true ||
    safeArr(Object.values(ceilingMap ?? {})).some((c) =>
      safeArr(c.notes).some((n) => n.includes("unresolved"))
    );

  let unresolvedLevel = null;
  if (unresolvedCeilingApplied && highConfidenceBlocked) {
    unresolvedLevel = "high";
  } else if (unresolvedCeilingApplied) {
    unresolvedLevel = "medium";
  } else if (safeArr(candidateEvidence).some((l) => safeArr(l.unresolvedEvidence).length > 0)) {
    unresolvedLevel = "low";
  }

  const tieBreakApplied = Boolean(winnerResult?.tieBreakMeta);

  return {
    primaryType,
    primaryCandidateId,
    primaryGroup,
    confidence,
    status,
    supportDrivers: safeArr(driverResult?.supportDrivers),
    riskDrivers: safeArr(driverResult?.riskDrivers),
    conflicts: safeArr(driverResult?.conflicts),
    unresolvedLevel,
    highConfidenceBlocked,
    tieBreakApplied,
    provenance: {
      source: "rule_engine_8_4",
      candidateEvidenceUsed: true,
      evidenceBucketsUsedAsSecondary: true,
      rawPrimitiveIgnored: true,
      scoreGateIgnored: true,
    },
  };
}

// ?????????????????????????????????????????????
// buildInteractionDecisionDiagnostics (Phase 8-6)
// Debug-only diagnostics contract ??not required reading for interpretationPack.
// ?????????????????????????????????????????????
function buildInteractionDecisionDiagnostics(decisionResult, winnerResult, ceilingMap) {
  const meta = decisionResult?.interactionDecisionMeta ?? {};
  const ceilingEntries = Object.entries(ceilingMap ?? {});

  const blockedCandidateIds = ceilingEntries
    .filter(([, v]) => v?.eligibleAsPrimary === false)
    .map(([k]) => k);

  const blockedReasonsByCandidate = {};
  for (const [id, v] of ceilingEntries) {
    if (v?.eligibleAsPrimary === false) {
      blockedReasonsByCandidate[id] = safeArr(v.blockedReasons);
    }
  }

  const unresolvedCeilingApplied =
    meta.unresolvedCeilingApplied === true ||
    ceilingEntries.some(([, v]) => safeArr(v.notes).some((n) => n.includes("unresolved")));

  return {
    winnerCandidateId: winnerResult?.winnerCandidateId ?? meta.winnerCandidateId ?? null,
    winnerGroup: winnerResult?.winnerGroup ?? meta.winnerGroup ?? null,
    confidenceLevel: winnerResult?.confidenceLevel ?? meta.confidenceLevel ?? null,
    blockedCandidateIds,
    blockedReasonsByCandidate,
    provisionalUsed: meta.provisionalUsed === true,
    tieBreakMeta: winnerResult?.tieBreakMeta ?? meta.tieBreakMeta ?? null,
    unresolvedCeilingApplied,
    notes: safeArr(meta.notes),
  };
}

// ?????????????????????????????????????????????
// buildInterpretationReadPolicy (Phase 9-1)
// Fixed machine-friendly read policy for Phase 9 interpretation consumer.
// ?????????????????????????????????????????????
function buildInterpretationReadPolicy() {
  return {
    primaryFirst: true,
    noRuleEngineRebuild: true,
    diagnosticsOnlyFallback: true,
    excludedSources: {
      rawPrimitiveState: true,
      legacyDirectKeys: true,
      uiFallbackLabels: true,
      scoreGateObjective: true,
      rawCandidateLedgerAsDefault: true,
    },
  };
}

// ?????????????????????????????????????????????
// buildInterpretationInputContract (Phase 9-1)
// Assembles the Phase 9 interpretationPack read contract from already-built structures.
// Does NOT recompute winners, ceiling, or rule logic.
// ?????????????????????????????????????????????
function buildInterpretationInputContract(
  interactionDecision,
  interactionDecisionDiagnostics,
  candidateAxisPack,
  industryContext,
  jobContext,
  selectionResolvedMeta,
  selectionResolvedDiagnostics,
  aiResolvedComparison,
  readPolicy
) {
  const policy = readPolicy ?? buildInterpretationReadPolicy();
  const normalizedDiagnostics = normalizeDiagnosticsSources(
    selectionResolvedMeta,
    selectionResolvedDiagnostics,
    aiResolvedComparison
  );

  return {
    primarySource: {
      interactionDecision: interactionDecision ?? null,
    },
    secondarySources: {
      candidateAxisPack: (candidateAxisPack && typeof candidateAxisPack === "object") ? candidateAxisPack : null,
      industryContext: (industryContext && typeof industryContext === "object") ? industryContext : null,
      jobContext: (jobContext && typeof jobContext === "object") ? jobContext : null,
    },
    diagnosticsSources: {
      interactionDecisionDiagnostics: interactionDecisionDiagnostics ?? null,
      selectionResolvedMeta: normalizedDiagnostics.selectionResolvedMeta ?? null,
      selectionResolvedDiagnostics: normalizedDiagnostics.selectionResolvedDiagnostics ?? null,
      aiResolvedComparison: normalizedDiagnostics.aiResolvedComparison ?? null,
    },
    excludedSources: policy.excludedSources,
    readPolicy: {
      primaryFirst: policy.primaryFirst,
      noRuleEngineRebuild: policy.noRuleEngineRebuild,
      diagnosticsOnlyFallback: policy.diagnosticsOnlyFallback,
      excludedSources: policy.excludedSources,
    },
    interpretationInputMeta: {
      phase: "9-1-input-contract",
      primaryReader: "interactionDecision",
      secondaryReaders: ["candidateAxisPack", "industryContext", "jobContext"],
      diagnosticsReaders: [
        "interactionDecisionDiagnostics",
        "selectionResolvedMeta",
        "selectionResolvedDiagnostics",
        "aiResolvedComparison",
      ],
    },
  };
}

// ?????????????????????????????????????????????
// resolveSectionStatus (Phase 9-2)
// Derives "ready" | "partial" | "empty" from source presence.
// ?????????????????????????????????????????????
function resolveSectionStatus(primarySource, secondarySources, diagnosticsSources) {
  if (primarySource && typeof primarySource === "object") return "ready";
  const anySecondary = safeArr(secondarySources).some((s) => s && typeof s === "object");
  const anyDiagnostics = safeArr(diagnosticsSources).some((s) => s && typeof s === "object");
  if (anySecondary || anyDiagnostics) return "partial";
  return "empty";
}

// ?????????????????????????????????????????????
// buildInterpretationSectionSkeleton (Phase 9-2)
// Builds one section skeleton with a fixed common shape.
// ?????????????????????????????????????????????
function buildInterpretationSectionSkeleton({
  key,
  confidence,
  primarySourceKey,
  secondarySourceKeys,
  diagnosticsSourceKeys,
  slots,
  resolvedStatus,
  notes,
}) {
  return {
    key,
    status: resolvedStatus ?? "empty",
    confidence: confidence ?? null,
    primarySourceKey: primarySourceKey ?? null,
    secondarySourceKeys: safeArr(secondarySourceKeys),
    diagnosticsSourceKeys: safeArr(diagnosticsSourceKeys),
    slots: (slots && typeof slots === "object") ? slots : {},
    sentenceDrafts: [],
    notes: safeArr(notes),
  };
}

// ?????????????????????????????????????????????
// buildInterpretationPackSkeleton (Phase 9-2)
// Assembles 6-section skeleton from interpretationInput.
// Sentence generation is blocked (sentenceDrafts always []).
// ?????????????????????????????????????????????
function buildInterpretationPackSkeleton(interpretationInput) {
  const interp = interpretationInput ?? {};

  // Resolve all source references from interpretationInput
  const srcMap = {
    interactionDecision:           interp.primarySource?.interactionDecision ?? null,
    candidateAxisPack:             interp.secondarySources?.candidateAxisPack ?? null,
    industryContext:               interp.secondarySources?.industryContext ?? null,
    jobContext:                    interp.secondarySources?.jobContext ?? null,
    interactionDecisionDiagnostics:interp.diagnosticsSources?.interactionDecisionDiagnostics ?? null,
    selectionResolvedMeta:         interp.diagnosticsSources?.selectionResolvedMeta ?? null,
    selectionResolvedDiagnostics:  interp.diagnosticsSources?.selectionResolvedDiagnostics ?? null,
    aiResolvedComparison:          interp.diagnosticsSources?.aiResolvedComparison ?? null,
  };

  function src(key) { return srcMap[key] ?? null; }
  function status(primaryKey, secondaryKeys, diagnosticsKeys) {
    return resolveSectionStatus(
      src(primaryKey),
      secondaryKeys.map(src),
      diagnosticsKeys.map(src)
    );
  }

  // Confidence propagation: interaction-dependent sections reuse interactionDecision.confidence
  const interactionConfidence = srcMap.interactionDecision?.confidence ?? null;

  const sections = {
    careerAccumulation: buildInterpretationSectionSkeleton({
      key: "careerAccumulation",
      confidence: null,
      primarySourceKey: "candidateAxisPack",
      secondarySourceKeys: ["interactionDecision"],
      diagnosticsSourceKeys: ["selectionResolvedDiagnostics", "interactionDecisionDiagnostics"],
      slots: { relatedCareerSignals: [], continuitySignals: [], consistencySignals: [], transitionReadinessSignals: [] },
      resolvedStatus: status("candidateAxisPack", ["interactionDecision"], ["selectionResolvedDiagnostics", "interactionDecisionDiagnostics"]),
      notes: [],
    }),

    levelPositionFit: buildInterpretationSectionSkeleton({
      key: "levelPositionFit",
      confidence: null,
      primarySourceKey: "candidateAxisPack",
      secondarySourceKeys: ["interactionDecision", "jobContext"],
      diagnosticsSourceKeys: ["selectionResolvedMeta", "interactionDecisionDiagnostics"],
      slots: { senioritySignals: [], scopeSignals: [], leadershipSignals: [], decisionDistanceSignals: [] },
      resolvedStatus: status("candidateAxisPack", ["interactionDecision", "jobContext"], ["selectionResolvedMeta", "interactionDecisionDiagnostics"]),
      notes: [],
    }),

    compensationMobility: buildInterpretationSectionSkeleton({
      key: "compensationMobility",
      confidence: null,
      primarySourceKey: "candidateAxisPack",
      secondarySourceKeys: ["industryContext", "interactionDecision"],
      diagnosticsSourceKeys: ["selectionResolvedDiagnostics"],
      slots: { compensationSignals: [], marketMobilitySignals: [], companyScaleSignals: [], jumpIntensitySignals: [] },
      resolvedStatus: status("candidateAxisPack", ["industryContext", "interactionDecision"], ["selectionResolvedDiagnostics"]),
      notes: [],
    }),

    workStyleExecution: buildInterpretationSectionSkeleton({
      key: "workStyleExecution",
      confidence: interactionConfidence,
      primarySourceKey: "interactionDecision",
      secondarySourceKeys: ["candidateAxisPack", "jobContext"],
      diagnosticsSourceKeys: ["interactionDecisionDiagnostics", "aiResolvedComparison"],
      slots: { workModeShiftSignals: [], executionContextSignals: [], transferabilitySignals: [], frictionSignals: [] },
      resolvedStatus: status("interactionDecision", ["candidateAxisPack", "jobContext"], ["interactionDecisionDiagnostics", "aiResolvedComparison"]),
      notes: [],
    }),

    industryContext: buildInterpretationSectionSkeleton({
      key: "industryContext",
      confidence: interactionConfidence,
      primarySourceKey: "interactionDecision",
      secondarySourceKeys: ["industryContext", "candidateAxisPack"],
      diagnosticsSourceKeys: ["aiResolvedComparison", "selectionResolvedDiagnostics"],
      slots: { sectorSignals: [], adjacencySignals: [], boundarySignals: [], industryTransferSignals: [] },
      resolvedStatus: status("interactionDecision", ["industryContext", "candidateAxisPack"], ["aiResolvedComparison", "selectionResolvedDiagnostics"]),
      notes: [],
    }),

    riskSummary: buildInterpretationSectionSkeleton({
      key: "riskSummary",
      confidence: interactionConfidence,
      primarySourceKey: "interactionDecision",
      secondarySourceKeys: ["interactionDecisionDiagnostics"],
      diagnosticsSourceKeys: ["selectionResolvedDiagnostics", "aiResolvedComparison"],
      slots: { primaryRisks: [], supportDrivers: [], conflicts: [], unresolvedFlags: [] },
      resolvedStatus: status("interactionDecision", ["interactionDecisionDiagnostics"], ["selectionResolvedDiagnostics", "aiResolvedComparison"]),
      notes: [],
    }),
  };

  return {
    sections,
    meta: {
      phase: "9-2-skeleton",
      sentenceGenerationReady: false,
      sectionCount: 6,
    },
  };
}

// ?????????????????????????????????????????????
// normalizeSectionSignal (Phase 9-3)
// Normalizes a raw slot candidate into a structured signal object.
// Returns null if signalKey is absent ??callers must filter null.
// ?????????????????????????????????????????????
function normalizeSectionSignal(signalKey, sourceKey, sourceTier, confidence, polarity, refPath, meta) {
  const key = safeStr(signalKey);
  if (!key) return null;
  const normalized = {
    signalKey: key,
    sourceKey: safeStr(sourceKey) ?? null,
    sourceTier: (sourceTier === "primary" || sourceTier === "secondary" || sourceTier === "diagnostics")
      ? sourceTier : null,
    confidence: (confidence === "low" || confidence === "medium" || confidence === "high")
      ? confidence : null,
    polarity: (polarity === "support" || polarity === "risk" || polarity === "conflict" || polarity === "context")
      ? polarity : null,
    refPath: safeStr(refPath) ?? null,
  };
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    normalized.meta = meta;
  }
  return normalized;
}

// ?????????????????????????????????????????????
// dedupeSectionSignals (Phase 9-3)
// Removes duplicate signals from a slot array.
// Dedupe key: signalKey+sourceKey+polarity+refPath (or without refPath if absent).
// Preserves insertion order.
// ?????????????????????????????????????????????
function dedupeSectionSignals(signals) {
  if (!Array.isArray(signals)) return [];
  const seen = new Set();
  return signals.filter((s) => {
    if (!s || !s.signalKey) return false;
    const dedupeKey = s.refPath != null
      ? `${s.signalKey}||${s.sourceKey}||${s.polarity}||${s.refPath}`
      : `${s.signalKey}||${s.sourceKey}||${s.polarity}`;
    if (seen.has(dedupeKey)) return false;
    seen.add(dedupeKey);
    return true;
  });
}

// ?????????????????????????????????????????????
// collectSignalsFromSource (Phase 9-3)
// Best-effort extraction of signals from sourceObject by preferredKeys.
// Does not invent values ??skips null/ambiguous entries.
// ?????????????????????????????????????????????
function collectSignalsFromSource(sourceKey, sourceTier, sourceObject, preferredKeys, polarityHint, refBasePath) {
  if (!sourceObject || typeof sourceObject !== "object") return [];
  const signals = [];
  const keys = safeArr(preferredKeys);

  for (const pKey of keys) {
    const value = sourceObject[pKey];
    if (value === null || value === undefined) continue;

    const ref = refBasePath ? `${refBasePath}.${pKey}` : pKey;

    if (Array.isArray(value)) {
      for (const item of value.filter(Boolean)) {
        let signalKey = null;
        if (typeof item === "string") {
          signalKey = item;
        } else if (typeof item === "object") {
          signalKey = safeStr(item.id ?? item.key ?? item.type ?? item.name ?? item.signalKey ?? null);
        }
        if (!signalKey) continue;
        const sig = normalizeSectionSignal(signalKey, sourceKey, sourceTier, null, polarityHint ?? null, ref, undefined);
        if (sig) signals.push(sig);
      }
    } else if (typeof value === "boolean") {
      // Boolean: only add when true ??use the key name as signalKey
      if (!value) continue;
      const sig = normalizeSectionSignal(pKey, sourceKey, sourceTier, null, polarityHint ?? null, ref, undefined);
      if (sig) signals.push(sig);
    } else if (typeof value === "string") {
      const sig = normalizeSectionSignal(value, sourceKey, sourceTier, null, polarityHint ?? null, ref, undefined);
      if (sig) signals.push(sig);
    } else if (typeof value === "object") {
      const signalKey = safeStr(value.id ?? value.key ?? value.type ?? value.name ?? null);
      if (signalKey) {
        const sig = normalizeSectionSignal(signalKey, sourceKey, sourceTier, null, polarityHint ?? null, ref, undefined);
        if (sig) signals.push(sig);
      }
    }
  }
  return signals;
}

// ?????????????????????????????????????????????
// hydrateSectionSlots (Phase 9-3)
// Hydrates one section skeleton's slot arrays with structured signal objects.
// Uses section-specific source mapping; does not recompute winners or rule engine.
// ?????????????????????????????????????????????
function hydrateSectionSlots(sectionSkeleton, interpretationInput) {
  if (!sectionSkeleton || typeof sectionSkeleton !== "object") return sectionSkeleton;
  const interp = interpretationInput ?? {};

  const iDec    = interp.primarySource?.interactionDecision ?? null;
  const axPack  = interp.secondarySources?.candidateAxisPack ?? null;
  const indCtx  = interp.secondarySources?.industryContext ?? null;
  const jobCtx  = interp.secondarySources?.jobContext ?? null;
  const decDiag = interp.diagnosticsSources?.interactionDecisionDiagnostics ?? null;
  const selMeta = interp.diagnosticsSources?.selectionResolvedMeta ?? null;
  const selDiag = interp.diagnosticsSources?.selectionResolvedDiagnostics ?? null;
  const aiComp  = interp.diagnosticsSources?.aiResolvedComparison ?? null;

  const sectionKey = sectionSkeleton.key;
  let hydratedSlots = {};

  if (sectionKey === "careerAccumulation") {
    // primary: candidateAxisPack  secondary: interactionDecision
    // diagnostics: selectionResolvedDiagnostics, interactionDecisionDiagnostics
    const jobAxis = axPack?.jobAxis ?? null;
    const indAxis = axPack?.industryAxis ?? null;

    const relatedCareerRaw = [
      ...collectSignalsFromSource("candidateAxisPack.jobAxis", "primary", jobAxis,
        ["sameFamily", "adjacentFamily", "sameSubcategory", "sameMajorCategory"],
        null, "candidateAxisPack.jobAxis"),
    ];

    const continuityRaw = [
      ...collectSignalsFromSource("candidateAxisPack.jobAxis", "primary", jobAxis,
        ["sameFamily", "sameSubcategory"], "support", "candidateAxisPack.jobAxis"),
      ...collectSignalsFromSource("candidateAxisPack.industryAxis", "primary", indAxis,
        ["sameSector", "sameSubSector"], "support", "candidateAxisPack.industryAxis"),
    ];

    const consistencyRaw = [
      ...collectSignalsFromSource("candidateAxisPack.jobAxis", "primary", jobAxis,
        ["sameMajorCategory", "sameSubcategory", "sameFamily"], null, "candidateAxisPack.jobAxis"),
      ...collectSignalsFromSource("candidateAxisPack.industryAxis", "primary", indAxis,
        ["sameSector", "sameSubSector", "relatedByBoundaryHint"], null, "candidateAxisPack.industryAxis"),
    ];

    const transRaw = [
      ...(iDec ? collectSignalsFromSource("interactionDecision", "secondary", iDec,
        ["supportDrivers"], "support", "interactionDecision") : []),
      ...(iDec ? collectSignalsFromSource("interactionDecision", "secondary", iDec,
        ["riskDrivers"], "risk", "interactionDecision") : []),
      ...(selDiag ? collectSignalsFromSource("selectionResolvedDiagnostics", "diagnostics", selDiag,
        ["unresolvedKeys", "conflictKeys", "flaggedKeys"], "conflict", "selectionResolvedDiagnostics") : []),
    ];

    // Phase 11-7: structural career fallback when jobAxis is unresolved
    // When candidateAxisPack.jobAxis.available=false, all primary slots stay empty.
    // Use careerStructuralHint (experienceLevelScore, careerRiskScore, gapMonths) as fallback signals
    // so filledCount >= 1 and assembly can proceed past "unavailable" early-return.
    const __careerHint = interp.secondarySources?.careerStructuralHint ?? null;
    const __careerFallbackRelated = [];
    const __careerFallbackContinuity = [];
    if (!jobAxis?.available && __careerHint) {
      const __cs = __careerHint.careerSignals ?? null;
      const __cv = __careerHint.career ?? null;
      const __expLevel  = Number(__cs?.experienceLevelScore ?? 0);
      const __expGap    = Number(__cs?.experienceGap ?? -1);
      const __riskScore = Number(__cs?.careerRiskScore ?? 0);
      const __gapMonths = Number(__cv?.gapMonths ?? 0);
      if (__expLevel >= 0.5 && __expGap >= 0) {
        const __s = normalizeSectionSignal("experience-level-meets-requirement", "careerStructuralHint", "secondary", null, "support", "careerStructuralHint.careerSignals");
        if (__s) __careerFallbackRelated.push(__s);
      }
      if (__riskScore < 0.5 && __gapMonths < 6) {
        const __s = normalizeSectionSignal("low-career-continuity-risk", "careerStructuralHint", "secondary", null, "support", "careerStructuralHint.career");
        if (__s) __careerFallbackContinuity.push(__s);
      } else if (__riskScore >= 0.65 || __gapMonths >= 6) {
        const __s = normalizeSectionSignal("career-continuity-risk-present", "careerStructuralHint", "secondary", null, "risk", "careerStructuralHint.careerSignals");
        if (__s) __careerFallbackContinuity.push(__s);
      }
    }

    hydratedSlots = {
      relatedCareerSignals:      dedupeSectionSignals([...relatedCareerRaw, ...__careerFallbackRelated]),
      continuitySignals:         dedupeSectionSignals([...continuityRaw, ...__careerFallbackContinuity]),
      consistencySignals:        dedupeSectionSignals(consistencyRaw),
      transitionReadinessSignals:dedupeSectionSignals(transRaw),
    };

  } else if (sectionKey === "levelPositionFit") {
    // primary: candidateAxisPack  secondary: interactionDecision, jobContext
    // diagnostics: selectionResolvedMeta, interactionDecisionDiagnostics
    const jobAxis       = axPack?.jobAxis ?? null;
    const jobCtxTarget  = jobCtx?.target ?? null;

    const seniorityRaw = [
      ...collectSignalsFromSource("candidateAxisPack.jobAxis", "primary", jobAxis,
        ["sameMajorCategory", "sameSubcategory", "farTransition", "boundaryTransition"],
        null, "candidateAxisPack.jobAxis"),
    ];

    const scopeRaw = [
      ...collectSignalsFromSource("jobContext.target", "secondary", jobCtxTarget,
        ["roleFamily", "relatedRoles", "transitionHints"], "context", "jobContext.target"),
    ];

    const leadershipRaw = [
      ...collectSignalsFromSource("jobContext.target", "secondary", jobCtxTarget,
        ["capabilityHints"], "context", "jobContext.target"),
    ];

    const decDistRaw = [
      ...(iDec ? collectSignalsFromSource("interactionDecision", "secondary", iDec,
        ["riskDrivers", "conflicts"], "risk", "interactionDecision") : []),
      ...(decDiag ? collectSignalsFromSource("interactionDecisionDiagnostics", "diagnostics", decDiag,
        ["blockedCandidateIds", "notes"], "conflict", "interactionDecisionDiagnostics") : []),
    ];

    hydratedSlots = {
      senioritySignals:       dedupeSectionSignals(seniorityRaw),
      scopeSignals:           dedupeSectionSignals(scopeRaw),
      leadershipSignals:      dedupeSectionSignals(leadershipRaw),
      decisionDistanceSignals:dedupeSectionSignals(decDistRaw),
    };

  } else if (sectionKey === "compensationMobility") {
    // primary: candidateAxisPack  secondary: industryContext, interactionDecision
    // diagnostics: selectionResolvedDiagnostics
    const jobAxis      = axPack?.jobAxis ?? null;
    const indAxis      = axPack?.industryAxis ?? null;
    const indCtxTarget = indCtx?.target ?? null;

    const compRaw = [
      ...collectSignalsFromSource("candidateAxisPack.jobAxis", "primary", jobAxis,
        ["farTransition", "boundaryTransition", "adjacentFamily"], null, "candidateAxisPack.jobAxis"),
      ...collectSignalsFromSource("candidateAxisPack.industryAxis", "primary", indAxis,
        ["differentSector", "relatedByBoundaryHint", "sameSector"], null, "candidateAxisPack.industryAxis"),
    ];

    const marketRaw = indCtxTarget ? [
      ...collectSignalsFromSource("industryContext.target", "secondary", indCtxTarget,
        ["customerMarket", "decisionStructure", "buyingMotion"], "context", "industryContext.target"),
    ] : [];

    const scaleRaw = indCtxTarget ? [
      ...collectSignalsFromSource("industryContext.target", "secondary", indCtxTarget,
        ["coreContext"], "context", "industryContext.target"),
    ] : [];

    const jumpRaw = [
      ...collectSignalsFromSource("candidateAxisPack.jobAxis", "primary", jobAxis,
        ["farTransition", "boundaryTransition"], null, "candidateAxisPack.jobAxis"),
      ...collectSignalsFromSource("candidateAxisPack.industryAxis", "primary", indAxis,
        ["differentSector"], null, "candidateAxisPack.industryAxis"),
      ...(selDiag ? collectSignalsFromSource("selectionResolvedDiagnostics", "diagnostics", selDiag,
        ["unresolvedKeys", "flaggedKeys"], "conflict", "selectionResolvedDiagnostics") : []),
    ];

    hydratedSlots = {
      compensationSignals:   dedupeSectionSignals(compRaw),
      marketMobilitySignals: dedupeSectionSignals(marketRaw),
      companyScaleSignals:   dedupeSectionSignals(scaleRaw),
      jumpIntensitySignals:  dedupeSectionSignals(jumpRaw),
    };

  } else if (sectionKey === "workStyleExecution") {
    // primary: interactionDecision  secondary: candidateAxisPack, jobContext
    // diagnostics: interactionDecisionDiagnostics, aiResolvedComparison
    const jobAxis      = axPack?.jobAxis ?? null;
    const jobCtxTarget = jobCtx?.target ?? null;

    const primaryTypeSig = (iDec?.primaryType)
      ? normalizeSectionSignal(
          iDec.primaryType, "interactionDecision", "primary",
          iDec.confidence ?? null, "context",
          "interactionDecision.primaryType",
          iDec.primaryGroup ? { primaryGroup: iDec.primaryGroup } : undefined
        )
      : null;

    const workModeRaw = [
      ...(primaryTypeSig ? [primaryTypeSig] : []),
      ...(iDec ? collectSignalsFromSource("interactionDecision", "primary", iDec,
        ["supportDrivers"], "support", "interactionDecision") : []),
      ...collectSignalsFromSource("candidateAxisPack.jobAxis", "secondary", jobAxis,
        ["boundaryTransition", "farTransition", "adjacentFamily"], null, "candidateAxisPack.jobAxis"),
    ];

    const execRaw = jobCtxTarget ? [
      ...collectSignalsFromSource("jobContext.target", "secondary", jobCtxTarget,
        ["capabilityHints", "roleFamily"], "context", "jobContext.target"),
    ] : [];

    const transferRaw = iDec ? [
      ...collectSignalsFromSource("interactionDecision", "primary", iDec,
        ["supportDrivers"], "support", "interactionDecision"),
    ] : [];

    const frictionRaw = [
      ...(iDec ? collectSignalsFromSource("interactionDecision", "primary", iDec,
        ["riskDrivers", "conflicts"], "risk", "interactionDecision") : []),
      ...(decDiag ? collectSignalsFromSource("interactionDecisionDiagnostics", "diagnostics", decDiag,
        ["blockedCandidateIds", "notes"], "conflict", "interactionDecisionDiagnostics") : []),
      ...(aiComp ? collectSignalsFromSource("aiResolvedComparison", "diagnostics", aiComp,
        ["conflicts", "mismatchKeys", "unresolvedKeys"], "conflict", "aiResolvedComparison") : []),
    ];

    hydratedSlots = {
      workModeShiftSignals:     dedupeSectionSignals(workModeRaw),
      executionContextSignals:  dedupeSectionSignals(execRaw),
      transferabilitySignals:   dedupeSectionSignals(transferRaw),
      frictionSignals:          dedupeSectionSignals(frictionRaw),
    };

  } else if (sectionKey === "industryContext") {
    // primary: interactionDecision  secondary: industryContext, candidateAxisPack
    // diagnostics: aiResolvedComparison, selectionResolvedDiagnostics
    const indAxis      = axPack?.industryAxis ?? null;
    const indCtxTarget = indCtx?.target ?? null;

    const primaryTypeSig = (iDec?.primaryType)
      ? normalizeSectionSignal(
          iDec.primaryType, "interactionDecision", "primary",
          iDec.confidence ?? null, "context",
          "interactionDecision.primaryType",
          iDec.primaryGroup ? { primaryGroup: iDec.primaryGroup } : undefined
        )
      : null;

    const sectorRaw = [
      ...(primaryTypeSig ? [primaryTypeSig] : []),
      ...collectSignalsFromSource("candidateAxisPack.industryAxis", "secondary", indAxis,
        ["sameSector", "differentSector"], null, "candidateAxisPack.industryAxis"),
    ];

    const adjacencyRaw = [
      ...collectSignalsFromSource("candidateAxisPack.industryAxis", "secondary", indAxis,
        ["relatedByBoundaryHint"], "context", "candidateAxisPack.industryAxis"),
      ...(indCtxTarget ? collectSignalsFromSource("industryContext.target", "secondary", indCtxTarget,
        ["boundaryHints"], "context", "industryContext.target") : []),
    ];

    const boundaryRaw = [
      ...(indCtxTarget ? collectSignalsFromSource("industryContext.target", "secondary", indCtxTarget,
        ["boundaryHints"], "risk", "industryContext.target") : []),
      ...(aiComp ? collectSignalsFromSource("aiResolvedComparison", "diagnostics", aiComp,
        ["mismatchKeys", "unresolvedKeys", "conflicts"], "conflict", "aiResolvedComparison") : []),
      ...(selDiag ? collectSignalsFromSource("selectionResolvedDiagnostics", "diagnostics", selDiag,
        ["unresolvedKeys", "flaggedKeys"], "conflict", "selectionResolvedDiagnostics") : []),
    ];

    const transferRaw = [
      ...(iDec ? collectSignalsFromSource("interactionDecision", "primary", iDec,
        ["supportDrivers"], "support", "interactionDecision") : []),
      ...(indCtxTarget ? collectSignalsFromSource("industryContext.target", "secondary", indCtxTarget,
        ["proofSignals"], "context", "industryContext.target") : []),
    ];

    hydratedSlots = {
      sectorSignals:          dedupeSectionSignals(sectorRaw),
      adjacencySignals:       dedupeSectionSignals(adjacencyRaw),
      boundarySignals:        dedupeSectionSignals(boundaryRaw),
      industryTransferSignals:dedupeSectionSignals(transferRaw),
    };

  } else if (sectionKey === "riskSummary") {
    // primary: interactionDecision  secondary: interactionDecisionDiagnostics
    // diagnostics: selectionResolvedDiagnostics, aiResolvedComparison
    const primaryRisksRaw = iDec ? [
      ...collectSignalsFromSource("interactionDecision", "primary", iDec,
        ["riskDrivers"], "risk", "interactionDecision"),
    ] : [];

    const supportRaw = iDec ? [
      ...collectSignalsFromSource("interactionDecision", "primary", iDec,
        ["supportDrivers"], "support", "interactionDecision"),
    ] : [];

    const conflictsRaw = iDec ? [
      ...collectSignalsFromSource("interactionDecision", "primary", iDec,
        ["conflicts"], "conflict", "interactionDecision"),
    ] : [];

    const unresolvedRaw = [];
    if (iDec?.highConfidenceBlocked === true) {
      const sig = normalizeSectionSignal("highConfidenceBlocked", "interactionDecision", "primary",
        null, "risk", "interactionDecision.highConfidenceBlocked", undefined);
      if (sig) unresolvedRaw.push(sig);
    }
    if (iDec?.tieBreakApplied === true) {
      const sig = normalizeSectionSignal("tieBreakApplied", "interactionDecision", "primary",
        null, "context", "interactionDecision.tieBreakApplied", undefined);
      if (sig) unresolvedRaw.push(sig);
    }
    if (iDec?.unresolvedLevel) {
      const sig = normalizeSectionSignal(
        `unresolvedLevel_${iDec.unresolvedLevel}`, "interactionDecision", "primary",
        null, "risk", "interactionDecision.unresolvedLevel", { level: iDec.unresolvedLevel }
      );
      if (sig) unresolvedRaw.push(sig);
    }
    if (decDiag) {
      unresolvedRaw.push(...collectSignalsFromSource("interactionDecisionDiagnostics", "secondary", decDiag,
        ["blockedCandidateIds", "notes"], "conflict", "interactionDecisionDiagnostics"));
      if (decDiag.unresolvedCeilingApplied === true) {
        const sig = normalizeSectionSignal("unresolvedCeilingApplied", "interactionDecisionDiagnostics", "secondary",
          null, "risk", "interactionDecisionDiagnostics.unresolvedCeilingApplied", undefined);
        if (sig) unresolvedRaw.push(sig);
      }
      if (decDiag.provisionalUsed === true) {
        const sig = normalizeSectionSignal("provisionalUsed", "interactionDecisionDiagnostics", "secondary",
          null, "context", "interactionDecisionDiagnostics.provisionalUsed", undefined);
        if (sig) unresolvedRaw.push(sig);
      }
    }
    if (selDiag) {
      unresolvedRaw.push(...collectSignalsFromSource("selectionResolvedDiagnostics", "diagnostics", selDiag,
        ["unresolvedKeys", "flaggedKeys", "conflictKeys"], "conflict", "selectionResolvedDiagnostics"));
    }
    if (aiComp) {
      unresolvedRaw.push(...collectSignalsFromSource("aiResolvedComparison", "diagnostics", aiComp,
        ["conflicts", "mismatchKeys", "unresolvedKeys"], "conflict", "aiResolvedComparison"));
    }

    hydratedSlots = {
      primaryRisks:    dedupeSectionSignals(primaryRisksRaw),
      supportDrivers:  dedupeSectionSignals(supportRaw),
      conflicts:       dedupeSectionSignals(conflictsRaw),
      unresolvedFlags: dedupeSectionSignals(unresolvedRaw),
    };

  } else {
    // Unknown section ??preserve existing slots unchanged
    hydratedSlots = { ...(sectionSkeleton.slots ?? {}) };
  }

  // Recompute status based on slot fill
  const slotArrays = Object.values(hydratedSlots);
  const filledCount = slotArrays.filter((arr) => safeArr(arr).length > 0).length;
  const newStatus = filledCount === 0
    ? "empty"
    : filledCount < slotArrays.length
      ? "partial"
      : "ready";

  return {
    ...sectionSkeleton,
    slots: hydratedSlots,
    status: newStatus,
    sentenceDrafts: [],
  };
}

// ?????????????????????????????????????????????
// Phase 9-4: Section Narrative Frame helpers
// Assembles structured meaning frames from hydrated slots.
// No sentence generation ??machine-readable labels only.
// ?????????????????????????????????????????????

// pickDominantSectionSignals (Phase 9-4)
// Classifies all slot signals into dominant / support / blocked.
// Uses polarity + sourceTier for deterministic ordering.
function pickDominantSectionSignals(slots) {
  if (!slots || typeof slots !== "object") {
    return { dominantSignalKeys: [], supportSignalKeys: [], blockedSignalKeys: [] };
  }
  const dominantSet = new Set();
  const supportSet  = new Set();
  const blockedSet  = new Set();

  for (const slotArr of Object.values(slots)) {
    if (!Array.isArray(slotArr)) continue;
    for (const sig of slotArr) {
      if (!sig || !sig.signalKey) continue;
      const key     = sig.signalKey;
      const polarity = sig.polarity;
      const tier     = sig.sourceTier;
      if (polarity === "risk" || polarity === "conflict") {
        blockedSet.add(key);
      } else if (polarity === "support" && tier === "primary") {
        dominantSet.add(key);
      } else {
        // "support" secondary, "context", null ??goes to support
        supportSet.add(key);
      }
    }
  }

  return {
    dominantSignalKeys: Array.from(dominantSet),
    supportSignalKeys:  Array.from(supportSet).filter((k) => !dominantSet.has(k)),
    blockedSignalKeys:  Array.from(blockedSet).filter((k) => !dominantSet.has(k) && !supportSet.has(k)),
  };
}

// buildSectionTensionPairs (Phase 9-4)
// Creates tension pairs when both sides of a tension are present.
// Section-specific ??does not invent tensions from thin evidence.
function buildSectionTensionPairs(sectionKey, slots) {
  const pairs = [];
  if (!slots || typeof slots !== "object") return pairs;
  const hasSignals = (slotKey) => Array.isArray(slots[slotKey]) && slots[slotKey].length > 0;
  const hasRiskPolarity = (slotKey) =>
    (slots[slotKey] || []).some((s) => s.polarity === "risk" || s.polarity === "conflict");

  if (sectionKey === "careerAccumulation") {
    if (hasSignals("continuitySignals") && hasSignals("transitionReadinessSignals"))
      pairs.push({ left: "continuitySignals", right: "transitionReadinessSignals", relation: "offsetting" });
    if (hasSignals("consistencySignals") && hasSignals("transitionReadinessSignals") && hasRiskPolarity("transitionReadinessSignals"))
      pairs.push({ left: "consistencySignals", right: "transitionReadinessSignals", relation: "conflicting" });
  } else if (sectionKey === "levelPositionFit") {
    if (hasSignals("senioritySignals") && hasSignals("decisionDistanceSignals"))
      pairs.push({ left: "senioritySignals", right: "decisionDistanceSignals", relation: "conflicting" });
    if (hasSignals("scopeSignals") && hasSignals("decisionDistanceSignals"))
      pairs.push({ left: "scopeSignals", right: "decisionDistanceSignals", relation: "conflicting" });
  } else if (sectionKey === "compensationMobility") {
    if (hasSignals("marketMobilitySignals") && hasSignals("jumpIntensitySignals"))
      pairs.push({ left: "marketMobilitySignals", right: "jumpIntensitySignals", relation: "conflicting" });
    if (hasSignals("compensationSignals") && hasSignals("jumpIntensitySignals"))
      pairs.push({ left: "compensationSignals", right: "jumpIntensitySignals", relation: "offsetting" });
  } else if (sectionKey === "workStyleExecution") {
    if (hasSignals("transferabilitySignals") && hasSignals("frictionSignals"))
      pairs.push({ left: "transferabilitySignals", right: "frictionSignals", relation: "conflicting" });
    if (hasSignals("workModeShiftSignals") && hasSignals("frictionSignals"))
      pairs.push({ left: "workModeShiftSignals", right: "frictionSignals", relation: "offsetting" });
  } else if (sectionKey === "industryContext") {
    if (hasSignals("adjacencySignals") && hasSignals("boundarySignals"))
      pairs.push({ left: "adjacencySignals", right: "boundarySignals", relation: "offsetting" });
    if (hasSignals("sectorSignals") && hasSignals("boundarySignals"))
      pairs.push({ left: "sectorSignals", right: "boundarySignals", relation: "conflicting" });
  } else if (sectionKey === "riskSummary") {
    if (hasSignals("primaryRisks") && hasSignals("supportDrivers"))
      pairs.push({ left: "primaryRisks", right: "supportDrivers", relation: "conflicting" });
    if (hasSignals("supportDrivers") && hasSignals("conflicts"))
      pairs.push({ left: "supportDrivers", right: "conflicts", relation: "conflicting" });
    if (hasSignals("supportDrivers") && hasSignals("unresolvedFlags"))
      pairs.push({ left: "supportDrivers", right: "unresolvedFlags", relation: "offsetting" });
  }

  return pairs;
}

// resolveSectionPrimaryAngle (Phase 9-4)
// Returns a stable label-style string for the section's dominant interpretation angle.
// No Korean/English prose. Deterministic logic.
function resolveSectionPrimaryAngle(sectionKey, slots, dominantSignalKeys, blockedSignalKeys) {
  const hasSignals = (slotKey) => Array.isArray(slots[slotKey]) && slots[slotKey].length > 0;
  const hasRiskPolarity = (slotKey) =>
    (slots[slotKey] || []).some((s) => s.polarity === "risk" || s.polarity === "conflict");
  const dominated = dominantSignalKeys.length > 0;
  const blocked   = blockedSignalKeys.length > 0;

  if (sectionKey === "careerAccumulation") {
    const hasContinuity    = hasSignals("continuitySignals");
    const hasTransitionRisk = hasSignals("transitionReadinessSignals") && hasRiskPolarity("transitionReadinessSignals");
    if (hasContinuity && !hasTransitionRisk) return "cumulative_relevance";
    if (hasTransitionRisk && !hasContinuity) return "transition_friction";
    if (hasContinuity && hasTransitionRisk)  return "mixed_signal";
    return dominated ? "cumulative_relevance" : "transition_friction";
  }
  if (sectionKey === "levelPositionFit") {
    const hasDecisionRisk = hasSignals("decisionDistanceSignals") && hasRiskPolarity("decisionDistanceSignals");
    if (hasDecisionRisk) return "scope_stretch";
    const hasSeniority = hasSignals("senioritySignals") || hasSignals("scopeSignals");
    if (hasSeniority && !blocked) return "scope_alignment";
    if (hasSeniority && blocked)  return "mixed_signal";
    return blocked ? "scope_stretch" : "scope_alignment";
  }
  if (sectionKey === "compensationMobility") {
    const hasJumpRisk = hasSignals("jumpIntensitySignals") && hasRiskPolarity("jumpIntensitySignals");
    if (hasJumpRisk) return "mobility_friction";
    if (hasSignals("marketMobilitySignals") && !blocked) return "market_plausibility";
    return blocked ? "mobility_friction" : "market_plausibility";
  }
  if (sectionKey === "workStyleExecution") {
    const hasFriction = hasSignals("frictionSignals") && hasRiskPolarity("frictionSignals");
    if (hasFriction) return "execution_mismatch";
    if (hasSignals("transferabilitySignals") && !blocked) return "execution_fit";
    return blocked ? "execution_mismatch" : "execution_fit";
  }
  if (sectionKey === "industryContext") {
    const hasBoundary = hasSignals("boundarySignals") && hasRiskPolarity("boundarySignals");
    if (hasBoundary) return "industry_friction";
    if (hasSignals("adjacencySignals") && !blocked) return "industry_adjacency";
    return blocked ? "industry_friction" : "industry_adjacency";
  }
  if (sectionKey === "riskSummary") {
    if (hasSignals("primaryRisks") && hasSignals("conflicts")) return "risk_concentration";
    if (hasSignals("unresolvedFlags")) return "risk_concentration";
    return "mixed_signal";
  }
  return null;
}

// buildSectionEvidencePriority (Phase 9-4)
// Returns ordered array of slot contributions, most-influential first.
// Only slots with signals included; selectedSignalKeys capped at 3 per slot.
function buildSectionEvidencePriority(slots) {
  if (!slots || typeof slots !== "object") return [];
  const entries = [];
  for (const [slotKey, slotArr] of Object.entries(slots)) {
    if (!Array.isArray(slotArr) || slotArr.length === 0) continue;
    const selectedSignalKeys = slotArr.map((s) => s?.signalKey).filter(Boolean).slice(0, 3);
    if (selectedSignalKeys.length > 0) {
      entries.push({ slotKey, selectedSignalKeys, _count: slotArr.length });
    }
  }
  entries.sort((a, b) => b._count - a._count);
  return entries.map(({ slotKey, selectedSignalKeys }) => ({ slotKey, selectedSignalKeys }));
}

// buildSectionNarrativeFrame (Phase 9-4)
// Assembles the full narrativeFrame for one section.
// Always returns a stable frame even when sparse.
function buildSectionNarrativeFrame(section) {
  const sectionKey = section?.key    ?? "unknown";
  const slots      = section?.slots  ?? {};
  const status     = section?.status ?? "empty";

  const allSignals = Object.values(slots).flat().filter(Boolean);
  const isEmpty    = allSignals.length === 0;

  const { dominantSignalKeys, supportSignalKeys, blockedSignalKeys } = pickDominantSectionSignals(slots);

  const primaryAngle = isEmpty
    ? null
    : resolveSectionPrimaryAngle(sectionKey, slots, dominantSignalKeys, blockedSignalKeys);

  const secondaryAngles = [];
  if (!isEmpty && dominantSignalKeys.length > 0 && blockedSignalKeys.length > 0 && primaryAngle !== "mixed_signal") {
    secondaryAngles.push("mixed_signal");
  }

  const tensionPairs    = buildSectionTensionPairs(sectionKey, slots);
  const evidencePriority = buildSectionEvidencePriority(slots);

  const notes = [];
  if (isEmpty) notes.push("sparse_slots");
  if (!isEmpty && dominantSignalKeys.length > 0 && blockedSignalKeys.length > 0) notes.push("mixed_positive_negative");
  if (tensionPairs.some((p) => p.relation === "conflicting")) notes.push("blocking_signal_present");
  if (status === "partial") notes.push("low_confidence_section");
  if ((slots.transitionReadinessSignals?.length ?? 0) > 0 ||
      (slots.frictionSignals?.length ?? 0) > 0 ||
      (slots.unresolvedFlags?.length ?? 0) > 0) {
    notes.push("transition_signal_present");
  }

  const confidence = (status === "ready" && dominantSignalKeys.length >= 2) ? "medium" : "low";

  return {
    assemblyVersion: "frame-v1",
    sectionKey,
    status: isEmpty ? "empty" : status,
    confidence,
    primaryAngle,
    secondaryAngles,
    dominantSignalKeys,
    supportSignalKeys,
    blockedSignalKeys,
    tensionPairs,
    evidencePriority,
    notes,
  };
}

// attachNarrativeFramesToInterpretationPack (Phase 9-4)
// Iterates hydrated sections and appends narrativeFrame to each.
// Backward-compatible ??only adds new field; preserves all existing fields.
function attachNarrativeFramesToInterpretationPack(hydratedPack) {
  if (!hydratedPack || typeof hydratedPack !== "object") return hydratedPack;
  const sections        = hydratedPack.sections ?? {};
  const updatedSections = {};

  for (const [key, section] of Object.entries(sections)) {
    updatedSections[key] = {
      ...section,
      narrativeFrame: buildSectionNarrativeFrame(section),
    };
  }

  const withFrames = {
    ...hydratedPack,
    sections: updatedSections,
    meta: {
      ...hydratedPack.meta,
      phase: "9-4-narrative-frame",
      narrativeFrameReady: true,
    },
  };

  // ?? Phase 9-5: attach legacy narrative audit ??
  const withAudit = {
    ...withFrames,
    legacyNarrativeAudit: buildLegacyNarrativeAudit(withFrames),
    meta: {
      ...withFrames.meta,
      phase: "9-5-legacy-audit",
    },
  };

  // ?? Phase 9-8: attach sentence draft contract ??
  return attachSentenceDraftsToInterpretationPack(withAudit);
}

// ?????????????????????????????????????????????
// Phase 9-5: Legacy Narrative Inventory / Overlap Map
// Internal audit metadata only. No prose. No deletion.
// ?????????????????????????????????????????????

const LEGACY_NARRATIVE_SOURCES = [
  {
    legacyKey: "legacy_buildCareerStory",
    sourceFile: "src/lib/simulation/careerInterpretation.js",
    sourceFunction: "buildCareerStory",
    outputKind: "career_story",
    mappedSectionKeys: ["careerAccumulation"],
    currentReadPath: "live",
  },
  {
    legacyKey: "legacy_buildTopRiskNarratives",
    sourceFile: "src/lib/explanation/buildTopRiskNarratives.js",
    sourceFunction: "buildTopRiskNarratives",
    outputKind: "risk_summary",
    mappedSectionKeys: ["riskSummary"],
    currentReadPath: "live",
  },
  {
    legacyKey: "legacy_buildRoleInterpretation",
    sourceFile: "src/lib/simulation/careerInterpretation.js",
    sourceFunction: "buildRoleInterpretation",
    outputKind: "role_surface_compare",
    mappedSectionKeys: ["levelPositionFit"],
    currentReadPath: "reachable",
  },
  {
    legacyKey: "legacy_buildHiringLens",
    sourceFile: "src/lib/simulation/careerInterpretation.js",
    sourceFunction: "buildHiringLens",
    outputKind: "role_surface_compare",
    mappedSectionKeys: ["levelPositionFit", "workStyleExecution"],
    currentReadPath: "reachable",
  },
  {
    legacyKey: "legacy_buildNextMove",
    sourceFile: "src/lib/simulation/careerInterpretation.js",
    sourceFunction: "buildNextMove",
    outputKind: "other",
    mappedSectionKeys: ["compensationMobility", "levelPositionFit"],
    currentReadPath: "reachable",
  },
  {
    legacyKey: "legacy_buildRiskSummary",
    sourceFile: "src/lib/simulation/buildSimulationViewModel.js",
    sourceFunction: "buildRiskSummary",
    outputKind: "risk_summary",
    mappedSectionKeys: ["riskSummary"],
    currentReadPath: "live",
  },
  {
    legacyKey: "legacy_buildAxisAwareRiskSummary",
    sourceFile: "src/lib/simulation/buildSimulationViewModel.js",
    sourceFunction: "buildAxisAwareRiskSummary",
    outputKind: "risk_summary",
    mappedSectionKeys: ["riskSummary", "careerAccumulation"],
    currentReadPath: "live",
  },
  {
    legacyKey: "legacy___buildDomainSignal",
    sourceFile: "src/lib/simulation/buildSimulationViewModel.js",
    sourceFunction: "__buildDomainSignal",
    outputKind: "industry_surface_compare",
    mappedSectionKeys: ["industryContext"],
    currentReadPath: "live",
  },
  {
    legacyKey: "legacy___buildCurrentFlow",
    sourceFile: "src/lib/simulation/buildSimulationViewModel.js",
    sourceFunction: "__buildCurrentFlow",
    outputKind: "career_story",
    mappedSectionKeys: ["careerAccumulation"],
    currentReadPath: "live",
  },
];

// estimateLegacyOverlapLevel (Phase 9-5)
// Conservative overlap against narrativeFrame. Only "partial" when frame is populated.
function estimateLegacyOverlapLevel(legacyKey, hydratedPack) {
  const sections = hydratedPack?.sections ?? {};
  const hasPopulatedFrame = (sectionKey) => {
    const s = sections[sectionKey];
    return s?.narrativeFrame?.status !== "empty" && s?.narrativeFrame?.primaryAngle != null;
  };
  const overlapMap = {
    legacy_buildCareerStory:          hasPopulatedFrame("careerAccumulation") ? "partial" : "low",
    legacy_buildTopRiskNarratives:    hasPopulatedFrame("riskSummary") ? "partial" : "low",
    legacy_buildRoleInterpretation:   "low",
    legacy_buildHiringLens:           "low",
    legacy_buildNextMove:             "low",
    legacy_buildRiskSummary:          hasPopulatedFrame("riskSummary") ? "partial" : "low",
    legacy_buildAxisAwareRiskSummary: hasPopulatedFrame("riskSummary") ? "partial" : "low",
    legacy___buildDomainSignal:       "low",
    legacy___buildCurrentFlow:        hasPopulatedFrame("careerAccumulation") ? "partial" : "low",
  };
  return overlapMap[legacyKey] ?? "low";
}

// estimateLegacyUniquenessLevel (Phase 9-5)
function estimateLegacyUniquenessLevel(legacyKey) {
  const uniquenessMap = {
    legacy_buildCareerStory:          "medium",
    legacy_buildTopRiskNarratives:    "medium",
    legacy_buildRoleInterpretation:   "high",
    legacy_buildHiringLens:           "high",
    legacy_buildNextMove:             "high",
    legacy_buildRiskSummary:          "medium",
    legacy_buildAxisAwareRiskSummary: "medium",
    legacy___buildDomainSignal:       "high",
    legacy___buildCurrentFlow:        "medium",
  };
  return uniquenessMap[legacyKey] ?? "medium";
}

// decideLegacyNarrativePosture (Phase 9-5)
function decideLegacyNarrativePosture(legacyKey, overlapLevel, uniquenessLevel) {
  const _fallbackOnlyKeys = new Set([
    "legacy_buildCareerStory",
    "legacy_buildTopRiskNarratives",
  ]);
  if (_fallbackOnlyKeys.has(legacyKey)) return "fallback_only";
  if ((overlapLevel === "dominant" || overlapLevel === "high") && (uniquenessLevel === "none" || uniquenessLevel === "low")) return "replace_candidate";
  if (overlapLevel === "partial" && (uniquenessLevel === "medium" || uniquenessLevel === "high")) return "monitor";
  if (overlapLevel === "low" && uniquenessLevel === "high") return "keep";
  return "monitor";
}

// classifyLegacyNarrativeEntry (Phase 9-5)
function classifyLegacyNarrativeEntry(source, hydratedPack) {
  const overlapLevel    = estimateLegacyOverlapLevel(source.legacyKey, hydratedPack);
  const uniquenessLevel = estimateLegacyUniquenessLevel(source.legacyKey);
  const decision        = decideLegacyNarrativePosture(source.legacyKey, overlapLevel, uniquenessLevel);

  const reasons = [];
  const notes   = [];
  if (source.mappedSectionKeys.length > 1) notes.push("multi_section_ambiguous");
  if (decision === "fallback_only") reasons.push("wrapper_activation_complete_new_path_preferred");
  if (decision === "monitor")       reasons.push("unique_framing_retained_pending_sentence_layer");
  if (decision === "keep")          reasons.push("distinct_signal_type_no_new_layer_coverage");
  if (overlapLevel === "partial")   reasons.push("partial_semantic_overlap_with_narrativeFrame");
  if (overlapLevel === "low")       reasons.push("weak_thematic_overlap_only");
  if (source.currentReadPath === "live")      notes.push("actively_called_in_production");
  if (source.currentReadPath === "reachable") notes.push("reachable_via_generateCareerInterpretationV1");

  return {
    legacyKey:         source.legacyKey,
    sourceFile:        source.sourceFile,
    sourceFunction:    source.sourceFunction,
    outputKind:        source.outputKind,
    currentReadPath:   source.currentReadPath,
    mappedSectionKeys: source.mappedSectionKeys,
    overlapLevel,
    uniquenessLevel,
    decision,
    reasons,
    notes,
  };
}

// buildLegacyNarrativeSectionSummary (Phase 9-5)
function buildLegacyNarrativeSectionSummary(entries) {
  const SECTION_KEYS = [
    "careerAccumulation", "levelPositionFit", "compensationMobility",
    "workStyleExecution", "industryContext", "riskSummary",
  ];
  const summary = {};
  for (const sectionKey of SECTION_KEYS) {
    const sectionEntries = entries.filter((e) => e.mappedSectionKeys.includes(sectionKey));
    const overlappingLegacyKeys = sectionEntries
      .filter((e) => e.overlapLevel === "partial" || e.overlapLevel === "high" || e.overlapLevel === "dominant")
      .map((e) => e.legacyKey);
    const uniqueLegacyKeys = sectionEntries
      .filter((e) => (e.uniquenessLevel === "high" || e.uniquenessLevel === "medium") && !overlappingLegacyKeys.includes(e.legacyKey))
      .map((e) => e.legacyKey);

    const hasFallbackOnly = sectionEntries.some((e) => e.decision === "fallback_only");
    const hasMonitor      = sectionEntries.some((e) => e.decision === "monitor");
    const hasKeep         = sectionEntries.some((e) => e.decision === "keep");
    let recommendedPosture = "keep_parallel";
    if (hasFallbackOnly && !hasKeep && !hasMonitor) {
      recommendedPosture = "fallback_only";
    } else if (hasFallbackOnly && (hasMonitor || hasKeep)) {
      recommendedPosture = "needs_review";
    }

    summary[sectionKey] = { overlappingLegacyKeys, uniqueLegacyKeys, recommendedPosture };
  }
  return summary;
}

// buildLegacyNarrativeAudit (Phase 9-5)
// Returns structured audit metadata ??no prose, no deletions, no UI changes.
function buildLegacyNarrativeAudit(hydratedPack) {
  const entries        = LEGACY_NARRATIVE_SOURCES.map((source) => classifyLegacyNarrativeEntry(source, hydratedPack));
  const sectionSummary = buildLegacyNarrativeSectionSummary(entries);

  return {
    auditVersion: "legacy-audit-v1",
    generated: true,
    entries,
    sectionSummary,
    globalRecommendation: {
      immediateRemovalKeys: entries.filter((e) => e.decision === "remove_later").map((e) => e.legacyKey),
      fallbackOnlyKeys:     entries.filter((e) => e.decision === "fallback_only").map((e) => e.legacyKey),
      monitorKeys:          entries.filter((e) => e.decision === "monitor").map((e) => e.legacyKey),
      replaceReadyKeys:     entries.filter((e) => e.decision === "replace_candidate").map((e) => e.legacyKey),
      notes: [
        "sentence_generation_not_yet_complete",
        "fallback_only_entries_safe_until_sectionSentences_stable",
        "no_deletion_this_round",
      ],
    },
  };
}

// ?????????????????????????????????????????????
// Phase 9-8: Sentence Generation Contract
// Derives sentenceDraft seeds from narrativeFrame.
// No full prose rollout. Conservative suppression policy.
// ?????????????????????????????????????????????

// shouldSuppressSectionSentenceDrafts (Phase 9-8)
// Returns { suppressed: boolean, reason: string | null }
function shouldSuppressSectionSentenceDrafts(section) {
  if (!section || typeof section !== "object")
    return { suppressed: true, reason: "section_missing" };
  const frame = section.narrativeFrame;
  if (!frame)
    return { suppressed: true, reason: "narrative_frame_missing" };
  if (frame.status === "empty")
    return { suppressed: true, reason: "section_empty" };
  const hasPrimaryAngle    = typeof frame.primaryAngle === "string" && frame.primaryAngle.length > 0;
  const hasDominantSignals = Array.isArray(frame.dominantSignalKeys) && frame.dominantSignalKeys.length > 0;
  if (!hasPrimaryAngle && !hasDominantSignals)
    return { suppressed: true, reason: "no_primary_angle_or_dominant_signals" };
  return { suppressed: false, reason: null };
}

// getSectionSentenceBudget (Phase 9-8)
// Hard cap on draft count per section.
function getSectionSentenceBudget(sectionKey) {
  const budgetMap = {
    careerAccumulation:   2,
    levelPositionFit:     2,
    compensationMobility: 2,
    workStyleExecution:   2,
    industryContext:      2,
    riskSummary:          3,
  };
  return budgetMap[sectionKey] ?? 2;
}

// buildSentenceDraftTemplateHint (Phase 9-8)
// Maps primaryAngle to a stable label-style templateHint. No prose.
function buildSentenceDraftTemplateHint(primaryAngle) {
  const map = {
    cumulative_relevance: "angle_then_support",
    transition_friction:  "angle_with_blocker",
    scope_alignment:      "angle_then_support",
    scope_stretch:        "angle_with_blocker",
    market_plausibility:  "mobility_feasibility_with_support",
    mobility_friction:    "mobility_feasibility_with_friction",
    execution_fit:        "angle_then_support",
    execution_mismatch:   "angle_with_blocker",
    industry_adjacency:   "industry_adjacency_with_support",
    industry_friction:    "industry_adjacency_with_limit",
    risk_concentration:   "risk_concentration_summary",
    mixed_signal:         "tension_between_positive_and_friction",
  };
  return map[primaryAngle] ?? null;
}

// __primaryAngleToTextSeed (Phase 9-8 internal)
// Maps primaryAngle to a short controlled Korean seed clause.
function __primaryAngleToTextSeed(primaryAngle) {
  const seeds = {
    cumulative_relevance: "?꾩쟻 ?곌??깆씠 ?뺤씤?섎뒗 ?곹깭",
    transition_friction:  "?꾪솚 留덉같??二쇱슂 ?댁꽍 ?붿냼",
    scope_alignment:      "?덈꺼쨌踰붿쐞 痢〓㈃?먯꽌 ?꾨컲?곸쑝濡?遺?⑺븯???곹깭",
    scope_stretch:        "?덈꺼 ?먮뒗 寃곗젙嫄곕━ 痢〓㈃?먯꽌 ?뺤옣 ?붿냼 議댁옱",
    market_plausibility:  "market plausibility is supported at the market level",
    mobility_friction:    "?대룞 媛?μ꽦??蹂댁긽쨌媛뺣룄 痢〓㈃ 留덉같 議댁옱",
    execution_fit:        "?댁쁺 諛⑹떇 痢〓㈃?먯꽌 ?곹빀 ?좏샇 ?뺤씤",
    execution_mismatch:   "?댁쁺 諛⑹떇 ?먮뒗 ?ㅽ뻾 留λ씫?먯꽌 遺덉씪移??좏샇 議댁옱",
    industry_adjacency:   "?곗뾽 ?몄젒?깆씠 ?꾪솚 ?쇰━瑜?吏吏?섎뒗 諛⑺뼢",
    industry_friction:    "?곗뾽 留λ씫 李⑥씠濡??명븳 留덉같 ?좏샇 ?뺤씤",
    risk_concentration:   "二쇱슂 援ъ“??由ъ뒪?ш? 吏묒쨷???곹깭",
    mixed_signal:         "蹂듯빀 ?좏샇 ??湲띿젙怨?留덉같???④퍡 議댁옱",
  };
  return seeds[primaryAngle] ?? null;
}

// buildSentenceDraftSeedsForSection (Phase 9-8)
// Generates up to `budget` draft seed objects from section's narrativeFrame.
function buildSentenceDraftSeedsForSection(section, budget) {
  const frame            = section.narrativeFrame;
  const sectionKey       = section.key ?? "unknown";
  const primaryAngle     = frame.primaryAngle ?? null;
  const dominantKeys     = Array.isArray(frame.dominantSignalKeys) ? frame.dominantSignalKeys : [];
  const supportKeys      = Array.isArray(frame.supportSignalKeys)  ? frame.supportSignalKeys  : [];
  const blockedKeys      = Array.isArray(frame.blockedSignalKeys)  ? frame.blockedSignalKeys  : [];
  const tensionPairs     = Array.isArray(frame.tensionPairs)       ? frame.tensionPairs       : [];
  const templateHint     = buildSentenceDraftTemplateHint(primaryAngle);
  const drafts           = [];

  // Draft 0 ??summary: primary angle + dominant signals
  if (budget >= 1 && (primaryAngle || dominantKeys.length > 0)) {
    drafts.push({
      draftKey:           `${sectionKey}_draft_0`,
      generationMode:     "seed-v1",
      sentenceRole:       "summary",
      enabled:            true,
      suppressionReason:  null,
      sourcePrimaryAngle: primaryAngle,
      sourceSignalKeys:   dominantKeys.slice(0, 3),
      sourceTensionPairs: [],
      templateHint,
      textSeed:           __primaryAngleToTextSeed(primaryAngle),
    });
  }

  // Draft 1 ??risk / tension / support: only when secondary evidence present
  if (budget >= 2 && drafts.length > 0 && (blockedKeys.length > 0 || supportKeys.length > 0 || tensionPairs.length > 0)) {
    const role              = blockedKeys.length > 0 ? "risk" : tensionPairs.length > 0 ? "tension" : "support";
    const secondSignalKeys  = blockedKeys.length > 0 ? blockedKeys.slice(0, 2) : supportKeys.slice(0, 2);
    const secondTensions    = tensionPairs.length > 0 ? tensionPairs.slice(0, 1) : [];
    const secondHint        = blockedKeys.length > 0 ? "angle_with_blocker" : templateHint;
    drafts.push({
      draftKey:           `${sectionKey}_draft_1`,
      generationMode:     "seed-v1",
      sentenceRole:       role,
      enabled:            true,
      suppressionReason:  null,
      sourcePrimaryAngle: primaryAngle,
      sourceSignalKeys:   secondSignalKeys,
      sourceTensionPairs: secondTensions,
      templateHint:       secondHint,
      textSeed:           null,  // conservative: second draft seed suppressed
    });
  }

  // Draft 2 ??tension (riskSummary only, cap=3, tensionPairs required)
  if (budget >= 3 && sectionKey === "riskSummary" && tensionPairs.length > 0 && drafts.length >= 2) {
    drafts.push({
      draftKey:           `${sectionKey}_draft_2`,
      generationMode:     "seed-v1",
      sentenceRole:       "tension",
      enabled:            true,
      suppressionReason:  null,
      sourcePrimaryAngle: primaryAngle,
      sourceSignalKeys:   [...dominantKeys.slice(0, 1), ...blockedKeys.slice(0, 1)],
      sourceTensionPairs: tensionPairs.slice(0, 2),
      templateHint:       "tension_between_positive_and_friction",
      textSeed:           null,
    });
  }

  return drafts;
}

// buildSectionSentenceDrafts (Phase 9-8)
// Suppression check ??seed generation for one section. Returns [] when suppressed.
function buildSectionSentenceDrafts(section) {
  const { suppressed } = shouldSuppressSectionSentenceDrafts(section);
  if (suppressed) return [];
  return buildSentenceDraftSeedsForSection(section, getSectionSentenceBudget(section?.key ?? ""));
}

// attachSentenceDraftsToInterpretationPack (Phase 9-8)
// Replaces placeholder sentenceDrafts with structured seed contract per section.
// Must run after narrativeFrame is already attached.
function attachSentenceDraftsToInterpretationPack(pack) {
  if (!pack || typeof pack !== "object") return pack;
  const sections        = pack.sections ?? {};
  const updatedSections = {};

  for (const [key, section] of Object.entries(sections)) {
    updatedSections[key] = {
      ...section,
      sentenceDrafts: buildSectionSentenceDrafts(section),
    };
  }

  return {
    ...pack,
    sections: updatedSections,
    meta: {
      ...pack.meta,
      phase: "9-8-sentence-draft-contract",
      sentenceDraftContractReady: true,
    },
  };
}

// ?????????????????????????????????????????????
// buildHydratedInterpretationPack (Phase 9-3)
// Iterates all 6 section skeletons and produces hydrated interpretationPack.
// sentenceGenerationReady is always false ??sentence phase is 9-4+.
// ?????????????????????????????????????????????
function buildHydratedInterpretationPack(interpretationPackSkeleton, interpretationInput) {
  if (!interpretationPackSkeleton || typeof interpretationPackSkeleton !== "object") {
    return {
      sections: {},
      meta: {
        phase: "9-3-slot-hydration",
        sentenceGenerationReady: false,
        hydratedSectionCount: 0,
      },
    };
  }

  const skeletonSections = interpretationPackSkeleton.sections ?? {};
  const hydratedSections = {};

  for (const [key, sectionSkeleton] of Object.entries(skeletonSections)) {
    hydratedSections[key] = hydrateSectionSlots(sectionSkeleton, interpretationInput);
  }

  const hydratedSectionCount = Object.values(hydratedSections)
    .filter((s) => s && s.status !== "empty").length;

  // ?? Phase 9-4: attach narrative frames before returning ??
  return attachNarrativeFramesToInterpretationPack({
    sections: hydratedSections,
    meta: {
      phase: "9-3-slot-hydration",
      sentenceGenerationReady: false,
      hydratedSectionCount,
    },
  });
}

// ?????????????????????????????????????????????
// buildInteractionPack
// ?????????????????????????????????????????????
export function buildInteractionPack({
  currentIndustryContext = null,
  targetIndustryContext = null,
  currentJobContext = null,
  targetJobContext = null,
  candidateAxisPack = null,
  selectionResolvedMeta = null,
  diagnosticsMeta = null,
  careerStructuralHint = null,           // Phase 11-7: structural career fallback when jobAxis unresolved
} = {}) {
  // Input presence audit (meta only ??no interpretation)
  const inputPresence = {
    currentIndustryContext: hasContext(currentIndustryContext),
    targetIndustryContext: hasContext(targetIndustryContext),
    currentJobContext: hasContext(currentJobContext),
    targetJobContext: hasContext(targetJobContext),
    candidateAxisPack: hasAxisPack(candidateAxisPack),
    selectionResolvedMeta: Boolean(selectionResolvedMeta),
    diagnosticsMeta: Boolean(diagnosticsMeta),
  };

  const axisAvailable = hasAxisPack(candidateAxisPack);
  const industryAxisAvailable = axisAvailable && candidateAxisPack.industryAxis?.available === true;
  const jobAxisAvailable = axisAvailable && candidateAxisPack.jobAxis?.available === true;
  const anyContextAvailable = Object.values(inputPresence).some(Boolean);

  // ?? Phase 8-2: normalized axes ??
  const domainProximityAxis = buildDomainProximityAxis({
    currentIndustryContext,
    targetIndustryContext,
    candidateAxisPack,
  });

  const roleProximityAxis = buildRoleProximityAxis({
    currentJobContext,
    targetJobContext,
    candidateAxisPack,
  });

  const workModeShiftAxis = buildWorkModeShiftAxis({
    currentJobContext,
    targetJobContext,
  });

  const proofTransferAxis = buildProofTransferAxis({
    currentIndustryContext,
    targetIndustryContext,
    currentJobContext,
    targetJobContext,
  });

  const decisionFrictionAxis = buildDecisionFrictionAxis({
    currentIndustryContext,
    targetIndustryContext,
  });

  const axes = {
    domainProximityAxis,
    roleProximityAxis,
    workModeShiftAxis,
    proofTransferAxis,
    decisionFrictionAxis,
  };

  // ?? Phase 8-3: taxonomy candidate mapping ??
  const { interactionCandidates, matchedTaxonomyIds, candidateReasons, mappingMeta } =
    buildTaxonomyCandidates(axes);

  // ?? Phase 8-5: evidence ledger ??
  const evidenceBuckets = buildGlobalEvidenceBuckets(axes);
  const candidateEvidence = buildCandidateEvidenceLedger(interactionCandidates, evidenceBuckets, axes);
  const weightingMeta = buildWeightingMeta(interactionCandidates, evidenceBuckets, candidateEvidence);

  // ?? Phase 8-4: rule engine ??
  const __selDiag = diagnosticsMeta?.selectionResolvedDiagnostics ?? null;
  const __aiComp = diagnosticsMeta?.aiResolvedComparison ?? null;
  const __normalizedDiagnostics = normalizeDiagnosticsSources(
    selectionResolvedMeta ?? null,
    __selDiag,
    __aiComp
  );
  const __selMeta = __normalizedDiagnostics.selectionResolvedMeta ?? (selectionResolvedMeta ?? null);
  const __selDiagNormalized = __normalizedDiagnostics.selectionResolvedDiagnostics ?? __selDiag;
  const __aiCompNormalized = __normalizedDiagnostics.aiResolvedComparison ?? __aiComp;
  const ceilingMap = buildCandidateCeilingMap(
    interactionCandidates, candidateEvidence, axes,
    __selMeta, __selDiagNormalized, __aiCompNormalized
  );
  const winnerResult = pickPrimaryInteractionCandidate(
    interactionCandidates, candidateEvidence, axes, weightingMeta, ceilingMap
  );
  const driverResult = promoteTopLevelDrivers(
    winnerResult, candidateEvidence, evidenceBuckets, axes
  );
  const decisionResult = finalizeInteractionDecision(
    interactionCandidates, candidateEvidence, ceilingMap, winnerResult, driverResult, axes, evidenceBuckets
  );

  // ?? Phase 8-6: output contract ??
  const interactionDecision = buildInteractionDecisionContract(
    decisionResult, winnerResult, driverResult, ceilingMap, candidateEvidence, evidenceBuckets, axes
  );
  const interactionDecisionDiagnostics = buildInteractionDecisionDiagnostics(
    decisionResult, winnerResult, ceilingMap
  );

  // ?? Phase 9-1: interpretation input contract ??
  const __interpretReadPolicy = buildInterpretationReadPolicy();
  const interpretationInput = buildInterpretationInputContract(
    interactionDecision,
    interactionDecisionDiagnostics,
    candidateAxisPack ?? null,
    { current: currentIndustryContext ?? null, target: targetIndustryContext ?? null },
    { current: currentJobContext ?? null, target: targetJobContext ?? null },
    __selMeta,
    __selDiagNormalized,
    __aiCompNormalized,
    __interpretReadPolicy
  );

  // Phase 11-7: attach careerStructuralHint so hydrateSectionSlots can use structural fallback
  const __interpretInputFinal = careerStructuralHint
    ? { ...interpretationInput, secondarySources: { ...interpretationInput.secondarySources, careerStructuralHint } }
    : interpretationInput;

  // ?? Phase 9-2: interpretation pack skeleton ??
  const interpretationPackSkeleton = buildInterpretationPackSkeleton(__interpretInputFinal);

  // ?? Phase 9-3: slot hydration ??
  const interpretationPack = buildHydratedInterpretationPack(interpretationPackSkeleton, __interpretInputFinal);

  return {
    // overall availability ??true only when minimum context is present
    available: anyContextAvailable,

    // signals: empty ??populated in future phases
    signals: [],

    // Phase 8-4: rule engine ??winner selection results
    primaryInteractionType: decisionResult.primaryInteractionType,
    supportDrivers: decisionResult.supportDrivers,
    riskDrivers: decisionResult.riskDrivers,
    conflicts: decisionResult.conflicts,
    interactionDecisionMeta: decisionResult.interactionDecisionMeta,

    // Phase 8-2: normalized axis objects
    axes,

    // Phase 8-3: taxonomy candidate mapping results
    interactionCandidates,
    matchedTaxonomyIds,
    candidateReasons,
    mappingMeta,

    // Phase 8-5: evidence ledger
    candidateEvidence,
    evidenceBuckets,
    weightingMeta,

    // Phase 8-6: output contract (consumer-facing)
    interactionDecision,
    interactionDecisionDiagnostics,

    // Phase 9-1: interpretation input contract
    interpretationInput,

    // Phase 9-2: interpretation pack skeleton
    interpretationPackSkeleton,

    // Phase 9-3: hydrated interpretation pack (slot hydration)
    interpretationPack,

    // meta: input presence audit + axis availability summary
    meta: {
      inputPresence,
      industryAxisAvailable,
      jobAxisAvailable,
      industryAxisSummary: industryAxisAvailable
        ? {
            sameSector: candidateAxisPack.industryAxis.sameSector,
            sameSubSector: candidateAxisPack.industryAxis.sameSubSector,
            differentSector: candidateAxisPack.industryAxis.differentSector,
            relatedByBoundaryHint: candidateAxisPack.industryAxis.relatedByBoundaryHint,
          }
        : null,
      jobAxisSummary: jobAxisAvailable
        ? {
            sameMajorCategory: candidateAxisPack.jobAxis.sameMajorCategory,
            sameSubcategory: candidateAxisPack.jobAxis.sameSubcategory,
            sameFamily: candidateAxisPack.jobAxis.sameFamily,
            adjacentFamily: candidateAxisPack.jobAxis.adjacentFamily,
            boundaryTransition: candidateAxisPack.jobAxis.boundaryTransition,
            farTransition: candidateAxisPack.jobAxis.farTransition,
          }
        : null,
      // Phase 9-3: slot hydration complete
      phase: "9-3-slot-hydration",
    },
  };
}

