// src/lib/analysis/buildCandidateAxisPack.js
// Phase 7 foundation: candidateAxis structural comparison
//
// Role:
//   - Compares current ↔ target job context and industry context
//   - Produces axis metadata for downstream diagnostics/interpretation
//   - No score/gate effect — read-only structural metadata only
//   - Degrades safely when resolved selection is missing or partial

import { buildOntologyContext } from "../adapters/buildIndustryContext.js";
import { buildJobOntologyContext } from "../adapters/buildJobContext.js";

// ─────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────
function safeStr(v) {
  return v && typeof v === "string" ? v.trim() : null;
}

function safeArr(v) {
  return Array.isArray(v) ? v.filter(Boolean) : [];
}

// Simple text-based relatedness check:
// Does any boundaryHint in `hints` mention the probe label/id?
function isRelatedByBoundaryHints(hints, probeLabel, probeId) {
  if (!safeArr(hints).length) return false;
  const probeTokens = [probeLabel, probeId]
    .filter(Boolean)
    .map((s) => s.toLowerCase().trim());
  if (!probeTokens.length) return false;
  return hints.some((hint) => {
    const h = String(hint ?? "").toLowerCase();
    return probeTokens.some((t) => t && h.includes(t));
  });
}

// ─────────────────────────────────────────────
// buildIndustryAxis
// Input: industryOntologyContext (from buildOntologyContext)
// Output: industry axis structural comparison
// ─────────────────────────────────────────────
function buildIndustryAxis(industryCtx) {
  const cur = industryCtx?.current ?? {};
  const tgt = industryCtx?.target ?? {};
  const bothAvailable = Boolean(cur.ok && tgt.ok);

  if (!bothAvailable) {
    return {
      available: false,
      sameSector: null,
      sameSubSector: null,
      relatedByBoundaryHint: null,
      differentSector: null,
      currentIndustryId: safeStr(cur.registryId) ?? null,
      targetIndustryId: safeStr(tgt.registryId) ?? null,
      limitationNote: "one or both industry selections not resolved",
    };
  }

  const sameSector = Boolean(
    cur.sectorId && tgt.sectorId && cur.sectorId === tgt.sectorId
  );
  const sameSubSector = Boolean(
    cur.subSectorId && tgt.subSectorId && cur.subSectorId === tgt.subSectorId
  );

  // relatedByBoundaryHint: does target's boundaryHints mention the current industry's label/sector?
  const relatedByBoundaryHint = !sameSector
    ? isRelatedByBoundaryHints(
        safeArr(tgt.boundaryHints),
        cur.label,
        cur.sectorId
      )
    : null; // same sector → not meaningful to check

  return {
    available: true,
    sameSector,
    sameSubSector,
    relatedByBoundaryHint,
    differentSector: !sameSector,
    currentIndustryId: safeStr(cur.registryId),
    targetIndustryId: safeStr(tgt.registryId),
  };
}

// ─────────────────────────────────────────────
// Phase 6/7 hardening helpers
// ─────────────────────────────────────────────

// classifyFamilyDistance: coarse-grained enum for job transition narrative
// Returns: "same_family" | "adjacent_family" | "bridgeable_family" | "distant_family" | "unclear_family"
function classifyFamilyDistance(sameFamily, adjacentFamily, boundaryTransition, farTransition) {
  if (sameFamily)                        return "same_family";
  if (adjacentFamily)                    return "adjacent_family";
  if (boundaryTransition && !farTransition) return "bridgeable_family";
  if (farTransition)                     return "distant_family";
  return "unclear_family";
}

// __buildAxisSummary: derive a semantic industry-axis summary string for buildIndustryContinuity
// Input: industryAxis result from buildIndustryAxis
// Output: non-generic string describing industry continuity path, or null if unavailable
// Consumed by: buildIndustryContinuity via narrativeContext.axisSummary
function __buildAxisSummary(industryAxis) {
  if (!industryAxis?.available) return null;
  const cur = safeStr(industryAxis.currentIndustryId);
  const tgt = safeStr(industryAxis.targetIndustryId);
  if (!cur && !tgt) return null;

  if (industryAxis.sameSubSector) {
    return `same_industry / ${cur ?? tgt}`;
  }
  if (industryAxis.sameSector) {
    return industryAxis.relatedByBoundaryHint
      ? `same_sector_boundary_adjacent / ${cur} → ${tgt}`
      : `same_sector_different_subsector / ${cur} → ${tgt}`;
  }
  return industryAxis.relatedByBoundaryHint
    ? `sector_shift_boundary_adjacent / ${cur} → ${tgt}`
    : `sector_shift / ${cur} → ${tgt}`;
}

// classifyBoundaryHintTags: map raw boundary hint strings to typed signal tags
// Returns array of: "transferable_execution" | "domain_gap" | "ownership_gap" |
//                   "level_gap" | "evidence_thin" | "function_overlap" | "tool_overlap"
function classifyBoundaryHintTags(hints) {
  const h = safeArr(hints).map((s) => String(s ?? "").toLowerCase());
  if (!h.length) return [];

  const tags = new Set();
  for (const text of h) {
    if (/실행|execution|deliverable|output|산출/i.test(text))              tags.add("transferable_execution");
    if (/도메인|domain|산업|industry|sector|vertical/i.test(text))         tags.add("domain_gap");
    if (/오너십|ownership|책임|responsibility|decision|의사결정/i.test(text)) tags.add("ownership_gap");
    if (/경력|experience|연차|level|junior|senior|팀장|manager/i.test(text)) tags.add("level_gap");
    if (/근거|evidence|경험 없|without.*exp|lack|부족/i.test(text))          tags.add("evidence_thin");
    if (/기획|planning|분석|analysis|전략|strategy|pm|기능/i.test(text))     tags.add("function_overlap");
    if (/툴|tool|도구|stack|sql|excel|tableau|data/i.test(text))            tags.add("tool_overlap");
  }
  return [...tags];
}

// buildNarrativeContext: derive narrative-ready hint pack from job axis + job ontology context
function buildNarrativeContext(jobAxis, jobCtx) {
  const cur = jobCtx?.current ?? {};
  const tgt = jobCtx?.target ?? {};
  const dist = jobAxis?.familyDistance ?? "unclear_family";

  // transitionSupportSignals: hints that suggest the transition has structural support
  const transitionSupportSignals = [];
  if (jobAxis?.sameFamily)          transitionSupportSignals.push("same_role_family");
  if (jobAxis?.adjacentFamily)      transitionSupportSignals.push("adjacent_family_linkage");
  if (jobAxis?.sameMajorCategory)   transitionSupportSignals.push("same_major_category");
  if (jobAxis?.sameSubcategory)     transitionSupportSignals.push("same_subcategory");

  // Check family overlap between current allFamilyIds and target allFamilyIds
  const curAllFamilies = safeArr(cur.allFamilyIds);
  const tgtAllFamilies = safeArr(tgt.allFamilyIds);
  const sharedFamilies = curAllFamilies.filter((f) => tgtAllFamilies.includes(f));
  if (sharedFamilies.length > 0)    transitionSupportSignals.push("secondary_family_overlap");

  // boundaryFrictionSignals: derived from boundaryHint classification
  const boundaryFrictionSignals = safeArr(jobAxis?.boundaryHintClassification);

  // narrativeHints: high-level readable narrative tokens for first-wave consumers
  const narrativeHints = [];
  if (dist === "same_family")        narrativeHints.push("lateral_move");
  if (dist === "adjacent_family")    narrativeHints.push("adjacent_pivot");
  if (dist === "bridgeable_family")  narrativeHints.push("functional_bridge");
  if (dist === "distant_family")     narrativeHints.push("cross_domain_shift");
  if (dist === "unclear_family")     narrativeHints.push("unclassified_transition");
  if (sharedFamilies.length > 0)     narrativeHints.push("multi_family_candidate");

  // summaryHints: concise tokens for first-wave summary sentence generation
  const summaryHints = [...new Set([
    dist,
    ...narrativeHints,
    ...(boundaryFrictionSignals.length ? ["has_boundary_friction"] : []),
    ...(transitionSupportSignals.length ? ["has_transition_support"] : []),
  ])];

  // readableContextTags: all typed signals in one flat list, for consumers that want a tag bag
  const readableContextTags = [...new Set([
    ...narrativeHints,
    ...transitionSupportSignals,
    ...boundaryFrictionSignals,
  ])];

  return {
    familyDistance: dist,
    narrativeHints,
    summaryHints,
    readableContextTags,
    transitionSupportSignals,
    boundaryFrictionSignals,
    sharedFamilies,
    primaryCurrentFamily: safeStr(cur.familyId),
    primaryTargetFamily: safeStr(tgt.familyId),
    secondaryCurrentFamilies: curAllFamilies.filter((f) => f !== cur.familyId),
    secondaryTargetFamilies: tgtAllFamilies.filter((f) => f !== tgt.familyId),
    // Wave 1a: target family signal exposure — read-only, no judgment semantics yet
    targetFamilySignals: safeArr(tgt?.canonicalFamilySignals),
    targetToolSignals: safeArr(tgt?.canonicalFamilySignals).filter(
      (s) => /(tool|stack|crm|sql|tableau|excel|jira|salesforce|hubspot|도구|툴|시스템)/i.test(String(s || ""))
    ),
    // Wave 1d: target ownership signal exposure — ownership/decision/leadership terms from family strongSignals
    targetOwnershipSignals: safeArr(tgt?.canonicalFamilySignals).filter(
      (s) => /(주도|책임|결정|의사결정|ownership|소유|리드|lead|decision)/i.test(String(s || ""))
    ),
    // Wave 1e: target level hint exposure — role-level seniority differentiation strings, read-only
    targetLevelHints: safeArr(tgt?.targetLevelHints),
  };
}

// __buildRoleSummary: derive a semantic job-axis summary string for buildTargetRoleFit
// Input: jobAxis result from buildJobAxis
// Output: non-generic string describing role transition path, or null if unavailable
// Consumed by: buildTargetRoleFit via vm.candidateAxisPack.narrativeContext.roleSummary
function __buildRoleSummary(jobAxis) {
  if (!jobAxis?.available) return null;
  const cur = safeStr(jobAxis.primaryRoleFamily);
  const tgt = safeStr(jobAxis.targetRoleFamily);
  const dist = safeStr(jobAxis.familyDistance);
  if (!cur && !dist) return null;

  if (jobAxis.sameFamily) return `same_role_family / ${cur ?? tgt}`;
  if (jobAxis.adjacentFamily) {
    return cur && tgt
      ? `adjacent_role_family / ${cur} → ${tgt}`
      : `adjacent_role_family / ${cur ?? tgt}`;
  }
  const distLabel = dist || "unclear";
  if (cur && tgt) return `role_shift_${distLabel} / ${cur} → ${tgt}`;
  if (cur)        return `role_source: ${cur} / ${distLabel}`;
  return `role_${distLabel}`;
}

// ─────────────────────────────────────────────
// buildJobAxis
// Input: jobOntologyContext (from buildJobOntologyContext)
// Output: job axis structural comparison
// ─────────────────────────────────────────────
function buildJobAxis(jobCtx) {
  const cur = jobCtx?.current ?? {};
  const tgt = jobCtx?.target ?? {};
  const bothAvailable = Boolean(cur.ok && tgt.ok);

  if (!bothAvailable) {
    return {
      available: false,
      sameMajorCategory: null,
      sameSubcategory: null,
      sameFamily: null,
      adjacentFamily: null,
      boundaryTransition: null,
      farTransition: null,
      familyDistance: "unclear_family",          // Phase 6/7: coarse-grained enum
      primaryRoleFamily: null,                   // Phase 6/7: current primary family id
      targetRoleFamily: null,                    // Phase 6/7: target primary family id
      familyCandidates: [],                      // Phase 6/7: all current allFamilyIds
      targetFamilyCandidates: [],                // Phase 6/7: all target allFamilyIds
      boundaryHintClassification: [],            // Phase 6/7: typed boundary signal tags
      currentJobId: safeStr(cur.ontologyId) ?? null,
      targetJobId: safeStr(tgt.ontologyId) ?? null,
      limitationNote: "one or both job selections not resolved",
    };
  }

  const sameMajorCategory = Boolean(
    cur.majorCategoryId && tgt.majorCategoryId &&
    cur.majorCategoryId === tgt.majorCategoryId
  );
  const sameSubcategory = Boolean(
    cur.subCategoryId && tgt.subCategoryId &&
    cur.subCategoryId === tgt.subCategoryId
  );
  const sameFamily = Boolean(
    cur.familyId && tgt.familyId &&
    cur.familyId === tgt.familyId
  );

  // adjacentFamily: is the target's familyId in the current's adjacentFamilyIds, or vice versa?
  // Uses adjacentFamilyIds (family-level keys, not role IDs)
  const curAdjacentFamilies = safeArr(cur.adjacentFamilyIds);
  const tgtAdjacentFamilies = safeArr(tgt.adjacentFamilyIds);
  const adjacentFamily = !sameFamily && (
    (tgt.familyId && curAdjacentFamilies.includes(tgt.familyId)) ||
    (cur.familyId && tgtAdjacentFamilies.includes(cur.familyId))
  );

  // boundaryTransition: same major but different sub (or different family within major)
  const boundaryTransition = sameMajorCategory && !sameSubcategory;

  // farTransition: different major category
  const farTransition = !sameMajorCategory;

  // Phase 6/7: coarse-grained family distance enum
  const familyDistance = classifyFamilyDistance(sameFamily, Boolean(adjacentFamily), boundaryTransition, farTransition);

  // Phase 6/7: boundary hint type classification from both sides' hints
  const combinedBoundaryHints = [
    ...safeArr(cur.boundaryTransitionHints),
    ...safeArr(tgt.boundaryTransitionHints),
  ];
  const boundaryHintClassification = classifyBoundaryHintTags(combinedBoundaryHints);

  return {
    available: true,
    sameMajorCategory,
    sameSubcategory,
    sameFamily,
    adjacentFamily: Boolean(adjacentFamily),
    boundaryTransition,
    farTransition,
    familyDistance,                              // Phase 6/7: "same_family"|"adjacent_family"|"bridgeable_family"|"distant_family"|"unclear_family"
    primaryRoleFamily: safeStr(cur.familyId),    // Phase 6/7: current primary family id
    targetRoleFamily: safeStr(tgt.familyId),     // Phase 6/7: target primary family id
    familyCandidates: safeArr(cur.allFamilyIds), // Phase 6/7: all current family memberships
    targetFamilyCandidates: safeArr(tgt.allFamilyIds), // Phase 6/7: all target family memberships
    boundaryHintClassification,                  // Phase 6/7: typed boundary signal tags
    currentJobId: safeStr(cur.ontologyId),
    targetJobId: safeStr(tgt.ontologyId),
    // adjacency note: adjacentFamilyIds are family-level keys; deeper traversal in Phase 8+
    adjacencyNote: "adjacentFamily based on family-level adjacentFamilyIds; role-level graph traversal pending",
  };
}

// ─────────────────────────────────────────────
// buildCandidateAxisPack
// Input: selectionResolved = { currentJob, targetJob, currentIndustry, targetIndustry }
//        (canonical.selectionResolved shape from buildCanonicalAnalysisInput)
// Output: candidateAxisPack — read-only structural metadata, no score/gate effect
// ─────────────────────────────────────────────
export function buildCandidateAxisPack(selectionResolved) {
  if (!selectionResolved || typeof selectionResolved !== "object") {
    return {
      available: false,
      industryAxis: buildIndustryAxis(null),
      jobAxis: buildJobAxis(null),
      limitationNote: "selectionResolved unavailable",
    };
  }

  const { currentJob, targetJob, currentIndustry, targetIndustry } = selectionResolved;

  // Build industry ontology context using adapter
  const industryCtx = (() => {
    try {
      return buildOntologyContext({
        current: { resolvedItem: currentIndustry ?? null },
        target: { resolvedItem: targetIndustry ?? null },
      });
    } catch {
      return null;
    }
  })();

  // Build job ontology context using adapter
  const jobCtx = (() => {
    try {
      return buildJobOntologyContext({
        current: { resolvedItem: currentJob ?? null },
        target: { resolvedItem: targetJob ?? null },
      });
    } catch {
      return null;
    }
  })();

  const jobAxisResult = buildJobAxis(jobCtx);

  // Phase 6/7: narrative-ready context pack derived from job axis + job ontology context
  const narrativeContextBase = (() => {
    try {
      return buildNarrativeContext(jobAxisResult, jobCtx);
    } catch {
      return null;
    }
  })();

  // Phase 4 re-hardening: compute industry axis once, derive axisSummary for buildIndustryContinuity
  const industryAxisResult = buildIndustryAxis(industryCtx);
  const axisSummary = __buildAxisSummary(industryAxisResult) ?? null;
  // Phase 4 sub-round B: derive roleSummary for buildTargetRoleFit
  const roleSummary = __buildRoleSummary(jobAxisResult) ?? null;
  // Merge axisSummary + roleSummary into narrativeContext
  const narrativeContext = narrativeContextBase
    ? { ...narrativeContextBase, axisSummary, roleSummary }
    : (axisSummary || roleSummary ? { axisSummary, roleSummary } : null);

  return {
    available: Boolean(industryCtx || jobCtx),
    industryAxis: industryAxisResult,
    jobAxis: jobAxisResult,
    narrativeContext,  // Phase 6/7 + Phase 4 re-hardening: includes axisSummary for industryContinuity
  };
}
