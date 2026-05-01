// src/lib/analysis/buildAxisInterpretationMap.js
// Axis Interpretation Result Contract
//
// Produces producer-side axisInterpretationMap from axisEvidenceMap + registry.
// Prevents downstream consumers from needing to humanize raw axisEvidence.
// Does NOT replace buildSimulationViewModel / ReportV2Container behavior yet.
//
// Dependencies (in pipeline order):
//   1. axisRegistry (from src/data/input_interpretation/index.js)
//   2. axisEvidenceMap (from buildAxisEvidenceMap)
//   3. resolveAxisStateKey  — evidence → stateModel key translation
//   4. resolvePrimaryFrame  — stateKey → interpretation state / tone / severity
//   5. copyHelpers          — asset content → headline / summary / shortReason
//   6. axisInterpretationResolvers — axis-specific evidenceFor / evidenceAgainst
//
// @MX:ANCHOR: [AUTO] Interpretation SSOT entry point; all axisInterpretation produced here
// @MX:REASON: Fan_in = analyzer.js; downstream D-contract anchors will read from this output

import { getAllAxisRegistryEntries, getAxisAssetById } from "../../data/input_interpretation/index.js";
import { resolveAxisStateKey }        from "./axisInterpretation/resolveAxisStateKey.js";
import { resolvePrimaryFrame }        from "./axisInterpretation/resolvePrimaryFrame.js";
import { resolveAxisInterpretation }  from "./axisInterpretation/axisInterpretationResolvers.js";
import {
  buildHeadline,
  buildSummary,
  buildShortReason,
  buildDetailedReason,
  buildActionGuides,
  buildInterviewProbes,
} from "./axisInterpretation/copyHelpers.js";

// ─── fallback for unresolvable axes ──────────────────────────────────────────

function __makeUnknownInterpretation(entry) {
  return {
    axisId:        entry.id,
    categoryId:    entry.categoryId,
    subcategoryId: entry.subcategoryId,
    state:         "unknown",
    priorityScore: 0,
    confidence:    0,
    framing: {
      primaryFrame: "unresolved",
      tone:         "neutral",
      severity:     "low",
    },
    headline:        null,
    summary:         null,
    shortReason:     "resolver_not_registered",
    detailedReason:  null,
    evidenceFor:     [],
    evidenceAgainst: [],
    missingProof:    [],
    actionGuides:    [],
    interviewProbes: [],
    debug: {
      fromEvidenceStatus: "unknown",
      resolvedSignals:    [],
      missingSignals:     [],
      comparisonSummary:  null,
      resolvedStateKey:   null,
    },
  };
}

// ─── main builder ─────────────────────────────────────────────────────────────

/**
 * buildAxisInterpretationMap
 *
 * @param {{
 *   axisRegistry?: object[],
 *   axisEvidenceMap: { byAxisId: object },
 *   canonicalInput?: object
 * }} params
 *
 * @returns {{
 *   byAxisId:           Record<string, axisInterpretation>,
 *   orderingCandidates: axisInterpretation[],
 *   summary:            object
 * }}
 */
export function buildAxisInterpretationMap({ axisRegistry, axisEvidenceMap, canonicalInput } = {}) {
  const entries  = axisRegistry ?? getAllAxisRegistryEntries();
  const evidMap  = axisEvidenceMap?.byAxisId ?? {};
  const byAxisId = {};

  for (const entry of entries) {
    if (!entry?.id) continue;

    const axisEvidence = evidMap[entry.id];
    const asset        = getAxisAssetById(entry.id);

    // Guard: no asset or no evidence → unknown
    if (!asset || !axisEvidence) {
      byAxisId[entry.id] = __makeUnknownInterpretation(entry);
      continue;
    }

    let interpretation;
    try {
      // Step 1: stateKey translation
      const stateKeyResult = resolveAxisStateKey(entry.id, axisEvidence);
      const { resolvedStateKey, translationMethod, note: stateKeyNote } = stateKeyResult;

      // Step 2: primary frame resolution
      const frame = resolvePrimaryFrame({ axisId: entry.id, resolvedStateKey, axisEvidence });

      // Step 3: axis-specific evidence fields
      const specific = resolveAxisInterpretation({
        axisId:          entry.id,
        axisEvidence,
        asset,
        entry,
        resolvedStateKey,
        frame,
      });

      // Step 4: copy materialization from asset stateModel
      const headline       = buildHeadline(asset, resolvedStateKey);
      const summary        = buildSummary(asset, resolvedStateKey);
      const shortReason    = buildShortReason(asset, resolvedStateKey);
      const detailedReason = buildDetailedReason(asset, resolvedStateKey);
      const actionGuides   = buildActionGuides(axisEvidence.missingSignals, asset);
      const interviewProbes = buildInterviewProbes(asset, resolvedStateKey);

      interpretation = {
        axisId:        entry.id,
        categoryId:    entry.categoryId,
        subcategoryId: entry.subcategoryId,
        state:         frame.interpretationState,
        priorityScore: frame.priorityScore,
        confidence:    axisEvidence.confidence ?? 0,
        framing: {
          primaryFrame: frame.primaryFrame,
          tone:         frame.tone,
          severity:     frame.severity,
        },
        headline,
        summary,
        shortReason,
        detailedReason,
        evidenceFor:     specific.evidenceFor     ?? [],
        evidenceAgainst: specific.evidenceAgainst ?? [],
        missingProof:    specific.missingProof    ?? [],
        actionGuides,
        interviewProbes,
        debug: {
          fromEvidenceStatus: axisEvidence.status,
          resolvedSignals:    axisEvidence.resolvedSignals ?? [],
          missingSignals:     axisEvidence.missingSignals  ?? [],
          comparisonSummary:  axisEvidence.comparison      ?? null,
          resolvedStateKey,
          translationMethod,
          stateKeyNote,
          ...(specific.debug ?? {}),
        },
      };
    } catch (err) {
      interpretation = {
        ...__makeUnknownInterpretation(entry),
        debug: {
          fromEvidenceStatus: axisEvidence?.status ?? "unknown",
          resolvedSignals:    [],
          missingSignals:     [],
          comparisonSummary:  null,
          resolvedStateKey:   null,
          buildError:         err?.message ?? "unknown",
        },
      };
    }

    byAxisId[entry.id] = interpretation;
  }

  // orderingCandidates: pilot axes with resolved state, sorted by priorityScore desc
  const orderingCandidates = Object.values(byAxisId)
    .filter((i) => i.state !== "unknown" && i.state !== "blocked" && i.priorityScore > 0)
    .sort((a, b) => b.priorityScore - a.priorityScore);

  // summary counts
  const stateCounts = { strong_fit: 0, supported_fit: 0, watch: 0, risk: 0, blocked: 0, unknown: 0 };
  for (const i of Object.values(byAxisId)) {
    const s = i.state;
    if (Object.prototype.hasOwnProperty.call(stateCounts, s)) stateCounts[s]++;
  }

  return {
    byAxisId,
    orderingCandidates,
    summary: {
      total:            Object.keys(byAxisId).length,
      pilotCoverage:    orderingCandidates.length,
      ...stateCounts,
    },
  };
}
