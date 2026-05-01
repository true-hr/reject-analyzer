// src/lib/analysis/buildAxisEvidenceMap.js
// Input → Axis Evidence Normalization Contract (Contract C activation)
//
// Contract rules:
//   - registry is the ONLY discovery path (no filename/label lookup)
//   - supports B-grade assets: inputSignals may be string[]
//   - does NOT generate user-facing sentences
//   - does NOT affect scoring/ranking
//   - first real producer-side consumer of src/data/input_interpretation/index.js
//
// @MX:ANCHOR: [AUTO] First runtime consumer of Axis Registry SSOT; getAxisAssetById enters producer chain here
// @MX:REASON: This file is the sole activation point of the registry → evidence pipeline; fan_in = analyzer.js

import { getAllAxisRegistryEntries, getAxisAssetById } from "../../data/input_interpretation/index.js";
import { resolveAxisSignals } from "./axisEvidence/axisSignalResolvers.js";

function __makeEmptyEvidence(entry) {
  return {
    axisId:          entry.id,
    categoryId:      entry.categoryId,
    subcategoryId:   entry.subcategoryId,
    status:          "missing",
    confidence:      0,
    rawInputs:       [],
    resolvedSignals: [],
    missingSignals:  [],
    comparison:      { hasComparablePair: false, relation: null, summaryKey: null, delta: null },
    sourceRefs:      [],
    notes:           [],
  };
}

function __computeCoverageSummary(byAxisId) {
  const all   = Object.values(byAxisId);
  const total = all.length;
  const counts = { resolved: 0, partial: 0, missing: 0, conflicted: 0, not_applicable: 0 };
  for (const e of all) {
    const s = e.status;
    if (Object.prototype.hasOwnProperty.call(counts, s)) counts[s]++;
  }
  return {
    total,
    ...counts,
    resolvedRate: total > 0 ? +(counts.resolved / total).toFixed(3) : 0,
  };
}

/**
 * buildAxisEvidenceMap
 *
 * @param {{ canonicalInput: object, axisRegistry?: object[] }} params
 *   canonicalInput — result of buildCanonicalAnalysisInput(state)
 *   axisRegistry   — optional override; defaults to getAllAxisRegistryEntries()
 *
 * @returns {{
 *   byAxisId:        Record<string, axisEvidence>,
 *   byCategory:      Record<string, axisEvidence[]>,
 *   coverageSummary: { total, resolved, partial, missing, conflicted, not_applicable, resolvedRate }
 * }}
 */
export function buildAxisEvidenceMap({ canonicalInput, axisRegistry } = {}) {
  const canonical = canonicalInput?.canonical ?? null;
  const entries   = axisRegistry ?? getAllAxisRegistryEntries();

  const byAxisId = {};

  for (const entry of entries) {
    if (!entry?.id) continue;

    const asset = getAxisAssetById(entry.id);

    if (!asset) {
      byAxisId[entry.id] = {
        ...__makeEmptyEvidence(entry),
        notes: ["asset_not_found_in_registry"],
      };
      continue;
    }

    let evidence;
    try {
      evidence = resolveAxisSignals(entry.id, canonical, asset, entry);
    } catch (err) {
      evidence = {
        ...__makeEmptyEvidence(entry),
        notes: [`resolver_error: ${err?.message ?? "unknown"}`],
      };
    }

    byAxisId[entry.id] = evidence;
  }

  // byCategory secondary index
  const byCategory = {};
  for (const ev of Object.values(byAxisId)) {
    const cat = ev.categoryId;
    if (!cat) continue;
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(ev);
  }

  return {
    byAxisId,
    byCategory,
    coverageSummary: __computeCoverageSummary(byAxisId),
  };
}
