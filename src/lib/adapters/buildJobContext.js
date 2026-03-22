// src/lib/adapters/buildJobContext.js
// Phase 6 foundation: job adapter + context builder
//
// Role:
//   - Accepts a resolved job ontology item (from findJobOntologyByUiSelection)
//     or a legacy flat job key for backward-compatible taxonomy path resolution
//   - Produces a consumer-safe job context pack
//   - Legacy key mapping is isolated here — downstream consumers should not
//     directly interpret legacy keys if a context pack is available
//   - Raw primitive (roleCurrent, roleTarget etc.) remains SSOT in state
//   - This adapter is read-only derived layer — no score/gate effect

import { findJobOntologyByUiSelection } from "../../data/job/jobLookup.index.js";
import {
  JOB_ONTOLOGY_ITEMS,
  getJobOntologyItemById,
  getJobOntologyItemByMajorSubcategory,
} from "../../data/job/jobOntology.index.js";
import { resolveLegacyJobKeyToTaxonomyPath as resolveLegacyJobKeyToTaxonomyPathData } from "../../data/job/jobMigrationMap.js";

function toArr(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function toStr(value) {
  return value && typeof value === "string" ? value.trim() : null;
}

function getPrimaryFamily(item) {
  const families = toArr(item?.families);
  return families.length > 0 && families[0] && typeof families[0] === "object" ? families[0] : null;
}

function getJobBoundaryTransitionHints(item) {
  const primaryFamily = getPrimaryFamily(item);
  const familySignals = primaryFamily ? toArr(primaryFamily.boundarySignals) : [];
  const familyNote = primaryFamily ? toStr(primaryFamily.boundaryNote) : null;
  const itemHints = toArr(item?.boundaryHints);

  return [...new Set([
    ...familySignals,
    ...(familyNote ? [familyNote] : []),
    ...itemHints,
  ])];
}

// Returns family-level adjacency IDs (not role IDs — these are family/sub-family keys like "business_analytics")
function getAdjacentFamilyIds(item) {
  const primaryFamily = getPrimaryFamily(item);
  return [...new Set([
    ...toArr(primaryFamily?.adjacentFamilies),
    ...toArr(item?.adjacentFamilies),
  ])];
}

function toSourceValue(input = {}) {
  return {
    majorCategory: toStr(input.majorCategory),
    subCategory: toStr(input.subCategory),
    rawValue: toStr(input.rawValue),
  };
}

function buildEmptyJobMatch(input = {}, matchedBy = "not-found") {
  return {
    ok: false,
    ontologyId: null,
    majorCategoryId: null,
    subCategoryId: null,
    familyId: null,
    allFamilyIds: [],                // Phase 6/7: all family memberships (empty for no-match)
    adjacentFamilyIds: [],           // family-level adjacency keys, not role IDs
    boundaryTransitionHints: [],
    matchedBy,
    label: null,
    path: {
      majorCategoryId: null,
      subCategoryId: null,
    },
    sourceValue: toSourceValue(input),
  };
}

function toJobMatchResult(item, input = {}, matchedBy = "not-found") {
  if (!item || typeof item !== "object") {
    return buildEmptyJobMatch(input, matchedBy);
  }

  const majorCategoryId = toStr(item.majorCategory ?? item.vertical);
  const subCategoryId = toStr(item.subcategory ?? item.subVertical);
  const primaryFamily = getPrimaryFamily(item);
  // Phase 6/7 hardening: collect all family ids (not just primary) for roleFamily plurality
  const allFamilyIds = toArr(item.families)
    .map((f) => toStr(f?.id) ?? toStr(f?.label))
    .filter(Boolean);

  // Wave 1e: collect level differentiation hints from role items in this ontology entry
  // levelHints lives in item.roles[n].levelHints (not item.families)
  const targetLevelHints = toArr(item.roles)
    .flatMap((r) => toArr(r?.levelHints))
    .filter(Boolean)
    .slice(0, 6);

  return {
    ok: Boolean(toStr(item.id)),
    ontologyId: toStr(item.id),
    majorCategoryId,
    subCategoryId,
    familyId: toStr(primaryFamily?.id) ?? toStr(primaryFamily?.label),
    allFamilyIds,                                    // all family memberships, not just primary
    adjacentFamilyIds: getAdjacentFamilyIds(item),  // family-level adjacency keys, not role IDs
    canonicalFamilySignals: toArr(getPrimaryFamily(item)?.strongSignals).slice(0, 10), // Wave 1a: target family canonical evidence signals
    boundaryFamilySignals: toArr(getPrimaryFamily(item)?.boundarySignals),             // Wave 1a: target family bleed/anti signals
    boundaryTransitionHints: getJobBoundaryTransitionHints(item),
    targetLevelHints,                                                                   // Wave 1e: role-level seniority differentiation hints
    matchedBy,
    label: toStr(item.label),
    path: {
      majorCategoryId,
      subCategoryId,
    },
    sourceValue: toSourceValue(input),
  };
}

function findJobOntologyItemBySubLabel(value) {
  const normalized = String(value ?? "").normalize("NFKC").trim().toLowerCase();
  if (!normalized) return null;

  return (
    JOB_ONTOLOGY_ITEMS.find((item) => {
      const candidates = [
        item.label,
        item.subcategory,
        item.subVertical,
        ...toArr(item.aliases),
      ].map((candidate) => String(candidate ?? "").normalize("NFKC").trim().toLowerCase());

      return candidates.includes(normalized);
    }) || null
  );
}

function normalizeJobSelectionArgs(inputOrMajorCategory, subCategory, rawValue, resolvedItem) {
  if (inputOrMajorCategory && typeof inputOrMajorCategory === "object" && !Array.isArray(inputOrMajorCategory)) {
    return inputOrMajorCategory;
  }

  return {
    majorCategory: inputOrMajorCategory,
    subCategory,
    rawValue,
    resolvedItem: resolvedItem ?? null,
  };
}

function resolveJobSelection(inputOrMajorCategory, subCategory, rawValue, resolvedItem) {
  const input = normalizeJobSelectionArgs(inputOrMajorCategory, subCategory, rawValue, resolvedItem);
  const majorCategory = toStr(input.majorCategory);
  const subCategoryValue = toStr(input.subCategory);
  const rawValueString = toStr(input.rawValue);
  const resolvedItemObject = input.resolvedItem && typeof input.resolvedItem === "object"
    ? input.resolvedItem
    : null;

  const resolvedId = toStr(resolvedItemObject?.id);
  if (resolvedId) {
    const byId = getJobOntologyItemById(resolvedId);
    if (byId) {
      return {
        ...toJobMatchResult(byId, input, "resolved-id"),
        sourceType: "resolved",
      };
    }
  }

  if (majorCategory && subCategoryValue) {
    const byPair = findJobOntologyByUiSelection({
      majorCategory,
      subcategory: subCategoryValue,
    });

    if (byPair) {
      return {
        ...toJobMatchResult(byPair, input, "major+sub-label"),
        sourceType: resolvedItemObject ? "resolved" : "raw-adapted",
      };
    }
  }

  const labelCandidate = subCategoryValue || rawValueString;
  if (labelCandidate) {
    const byLabel = findJobOntologyItemBySubLabel(labelCandidate);
    if (byLabel) {
      return {
        ...toJobMatchResult(byLabel, input, "sub-label-only"),
        sourceType: resolvedItemObject ? "resolved" : "raw-adapted",
      };
    }
  }

  const legacyValue = rawValueString || subCategoryValue || majorCategory;
  if (legacyValue) {
    const legacyResolved = resolveLegacyJobKeyToTaxonomyPath(legacyValue);
    if (legacyResolved.ok && legacyResolved.ontologyId) {
      const legacyItem = getJobOntologyItemById(legacyResolved.ontologyId);
      if (legacyItem) {
        return {
          ...toJobMatchResult(legacyItem, input, "legacy-map"),
          sourceType: "legacy-adapted",
        };
      }
    }
  }

  return {
    ...buildEmptyJobMatch(input),
    sourceType: majorCategory || subCategoryValue || rawValueString ? "raw-adapted" : "missing",
  };
}

// ─────────────────────────────────────────────
// mapUiJobSubToOntologyId
// Input:
//   {
//     majorCategory?: string,
//     subCategory?: string,
//     rawValue?: string,
//     resolvedItem?: object | null
//   }
// Output: contract-shaped ontology resolution result
// ─────────────────────────────────────────────
export function mapUiJobSubToOntologyId(inputOrMajorCategory, subCategory, rawValue, resolvedItem) {
  try {
    return resolveJobSelection(inputOrMajorCategory, subCategory, rawValue, resolvedItem);
  } catch {
    return buildEmptyJobMatch(
      normalizeJobSelectionArgs(inputOrMajorCategory, subCategory, rawValue, resolvedItem)
    );
  }
}

// ─────────────────────────────────────────────
// resolveLegacyJobKey (adapter boundary)
// Input:  legacyKey (e.g. "pm", "data", "dev")
// Output: { majorCategory, subcategory } | null
// Legacy mapping is isolated in this adapter — do not spread to consumers directly
// ─────────────────────────────────────────────
export function resolveLegacyJobKey(legacyKey) {
  try {
    return resolveLegacyJobKeyToTaxonomyPathData(legacyKey) ?? null;
  } catch {
    return null;
  }
}

export function resolveLegacyJobKeyToTaxonomyPath(legacyValue) {
  try {
    const mapped = resolveLegacyJobKeyToTaxonomyPathData(legacyValue);
    if (mapped?.majorCategory && mapped?.subcategory) {
      const item = getJobOntologyItemByMajorSubcategory(mapped.majorCategory, mapped.subcategory);
      const primaryFamily = getPrimaryFamily(item);

      return {
        ok: Boolean(item?.id),
        ontologyId: toStr(item?.id),
        majorCategoryId: toStr(mapped.majorCategory),
        subCategoryId: toStr(mapped.subcategory),
        familyId: toStr(primaryFamily?.id) ?? toStr(primaryFamily?.label),
        mappedFrom: "legacy-key",
      };
    }

    const matchedItem = findJobOntologyItemBySubLabel(legacyValue);
    if (matchedItem) {
      const matchedValue = String(legacyValue ?? "").normalize("NFKC").trim().toLowerCase();
      const labelValue = String(matchedItem.label ?? "").normalize("NFKC").trim().toLowerCase();
      const aliasValues = toArr(matchedItem.aliases).map((alias) =>
        String(alias ?? "").normalize("NFKC").trim().toLowerCase()
      );
      const primaryFamily = getPrimaryFamily(matchedItem);

      return {
        ok: Boolean(matchedItem.id),
        ontologyId: toStr(matchedItem.id),
        majorCategoryId: toStr(matchedItem.majorCategory ?? matchedItem.vertical),
        subCategoryId: toStr(matchedItem.subcategory ?? matchedItem.subVertical),
        familyId: toStr(primaryFamily?.id) ?? toStr(primaryFamily?.label),
        mappedFrom: aliasValues.includes(matchedValue) && matchedValue !== labelValue ? "alias" : "legacy-label",
      };
    }

    return {
      ok: false,
      ontologyId: null,
      majorCategoryId: null,
      subCategoryId: null,
      familyId: null,
      mappedFrom: "not-found",
    };
  } catch {
    return {
      ok: false,
      ontologyId: null,
      majorCategoryId: null,
      subCategoryId: null,
      familyId: null,
      mappedFrom: "not-found",
    };
  }
}

// ─────────────────────────────────────────────
// buildJobContext
// Input:  resolvedJob — item returned by findJobOntologyByUiSelection
//         (may be null/undefined — always returns safe object)
// Output: consumer-safe job context pack
// Fields: only what actually exists in ontology items (no invented data)
// ─────────────────────────────────────────────
export function buildJobContext(resolvedJob) {
  if (!resolvedJob || typeof resolvedJob !== "object") {
    return {
      id: null,
      label: null,
      majorCategory: null,
      subcategory: null,
      aliases: [],
      roleFamily: null,         // primary family id from families[0]
      relatedRoles: [],         // adjacentFamilies from families[0]
      capabilityHints: [],      // strongSignals from families[0]
      boundaryHints: [],        // boundarySignals + boundaryNote from families[0]
      transitionHints: [],      // adjacentFamilies from families[0] (consumer alias)
      families: [],             // full families array if needed
      available: false,
    };
  }

  // Primary family = families[0] (most representative)
  const families = toArr(resolvedJob.families);
  const primaryFamily = families.length > 0 && families[0] && typeof families[0] === "object"
    ? families[0]
    : null;

  const roleFamily = primaryFamily ? (toStr(primaryFamily.id) ?? toStr(primaryFamily.label)) : null;
  const relatedRoles = primaryFamily ? toArr(primaryFamily.adjacentFamilies) : [];
  const capabilityHints = primaryFamily ? toArr(primaryFamily.strongSignals) : [];
  const boundarySignals = primaryFamily ? toArr(primaryFamily.boundarySignals) : [];
  const boundaryNote = primaryFamily ? toStr(primaryFamily.boundaryNote) : null;
  const boundaryHints = boundaryNote
    ? [...boundarySignals, boundaryNote]
    : boundarySignals;

  return {
    id: toStr(resolvedJob.id),
    label: toStr(resolvedJob.label),
    majorCategory: toStr(resolvedJob.majorCategory),
    subcategory: toStr(resolvedJob.subcategory),
    aliases: toArr(resolvedJob.aliases),
    roleFamily,
    relatedRoles,
    capabilityHints,
    boundaryHints,
    transitionHints: relatedRoles,  // alias for downstream clarity
    families,
    available: true,
  };
}

export function buildJobOntologyContext({ current, target } = {}) {
  const currentMatch = resolveJobSelection(current);
  const targetMatch = resolveJobSelection(target);

  return {
    current: {
      ok: currentMatch.ok,
      ontologyId: currentMatch.ontologyId,
      majorCategoryId: currentMatch.majorCategoryId,
      subCategoryId: currentMatch.subCategoryId,
      familyId: currentMatch.familyId,
      allFamilyIds: currentMatch.allFamilyIds ?? [],     // Phase 6/7: all family memberships
      adjacentFamilyIds: currentMatch.adjacentFamilyIds,  // family-level adjacency keys
      boundaryTransitionHints: currentMatch.boundaryTransitionHints,
      label: currentMatch.label,
    },
    target: {
      ok: targetMatch.ok,
      ontologyId: targetMatch.ontologyId,
      majorCategoryId: targetMatch.majorCategoryId,
      subCategoryId: targetMatch.subCategoryId,
      familyId: targetMatch.familyId,
      allFamilyIds: targetMatch.allFamilyIds ?? [],       // Phase 6/7: all family memberships
      adjacentFamilyIds: targetMatch.adjacentFamilyIds,  // family-level adjacency keys
      canonicalFamilySignals: targetMatch.canonicalFamilySignals ?? [], // Wave 1a: family canonical signals
      boundaryFamilySignals: targetMatch.boundaryFamilySignals ?? [],   // Wave 1a: family bleed/anti signals
      boundaryTransitionHints: targetMatch.boundaryTransitionHints,
      targetLevelHints: targetMatch.targetLevelHints ?? [],             // Wave 1e: role-level seniority hints
      label: targetMatch.label,
    },
    relationReady: {
      currentExists: currentMatch.ok,
      targetExists: targetMatch.ok,
      comparable: currentMatch.ok && targetMatch.ok,
    },
    source: {
      current: currentMatch.sourceType,
      target: targetMatch.sourceType,
    },
  };
}
