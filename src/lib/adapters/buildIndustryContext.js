// src/lib/adapters/buildIndustryContext.js
// Phase 6 foundation: industry adapter + context builder
//
// Role:
//   - Accepts a resolved industry registry item (from findIndustryRegistryByUiSelection)
//     or a raw sector/subSector pair for UI-to-registry mapping
//   - Produces a consumer-safe industry context pack
//   - Raw primitive (industryCurrent, industryTarget etc.) remains SSOT in state
//   - This adapter is read-only derived layer — no score/gate effect

import {
  INDUSTRY_REGISTRY_ITEMS,
  getIndustryRegistryItemById,
  getIndustryRegistryItemByLabel,
  getIndustryRegistryItemBySectorSubSector,
} from "../../data/industry/industryRegistry.index.js";

function toArr(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function toStr(value) {
  return value && typeof value === "string" ? value.trim() : null;
}

function toSourceValue(input = {}) {
  return {
    majorCategory: toStr(input.majorCategory),
    subCategory: toStr(input.subCategory),
    rawValue: toStr(input.rawValue),
  };
}

function buildEmptyIndustryMatch(input = {}, matchedBy = "not-found") {
  return {
    ok: false,
    registryId: null,
    sectorId: null,
    subSectorId: null,
    majorCategoryId: null,
    matchedBy,
    label: null,
    boundaryHints: [],
    path: {
      majorCategoryId: null,
      sectorId: null,
      subSectorId: null,
    },
    sourceValue: toSourceValue(input),
  };
}

function toIndustryMatchResult(item, input = {}, matchedBy = "not-found") {
  if (!item || typeof item !== "object") {
    return buildEmptyIndustryMatch(input, matchedBy);
  }

  const sectorId = toStr(item.sector);
  const subSectorId = toStr(item.subSector);

  return {
    ok: Boolean(toStr(item.id)),
    registryId: toStr(item.id),
    sectorId,
    subSectorId,
    majorCategoryId: sectorId,
    matchedBy,
    label: toStr(item.label),
    boundaryHints: Array.isArray(item.boundaryHints) ? item.boundaryHints.filter(Boolean) : [],
    path: {
      majorCategoryId: sectorId,
      sectorId,
      subSectorId,
    },
    sourceValue: toSourceValue(input),
  };
}

function findIndustryRegistryItemBySubLabel(value) {
  const normalized = String(value ?? "").normalize("NFKC").trim().toLowerCase();
  if (!normalized) return null;

  return (
    getIndustryRegistryItemByLabel(value) ||
    INDUSTRY_REGISTRY_ITEMS.find((item) => {
      const candidates = [
        item.label,
        item.subSector,
        ...toArr(item.aliases),
      ].map((candidate) => String(candidate ?? "").normalize("NFKC").trim().toLowerCase());

      return candidates.includes(normalized);
    }) ||
    null
  );
}

function normalizeIndustrySelectionArgs(inputOrMajorCategory, subCategory, rawValue, resolvedItem) {
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

function resolveIndustrySelection(inputOrMajorCategory, subCategory, rawValue, resolvedItem) {
  const input = normalizeIndustrySelectionArgs(inputOrMajorCategory, subCategory, rawValue, resolvedItem);
  const majorCategory = toStr(input.majorCategory);
  const subCategoryValue = toStr(input.subCategory);
  const rawValueString = toStr(input.rawValue);
  const resolvedItemObject = input.resolvedItem && typeof input.resolvedItem === "object"
    ? input.resolvedItem
    : null;

  const resolvedId = toStr(resolvedItemObject?.id);
  if (resolvedId) {
    const byId = getIndustryRegistryItemById(resolvedId);
    if (byId) {
      return {
        ...toIndustryMatchResult(byId, input, "resolved-id"),
        sourceType: "resolved",
      };
    }
  }

  if (majorCategory && subCategoryValue) {
    const byPair = getIndustryRegistryItemBySectorSubSector(majorCategory, subCategoryValue);

    if (byPair) {
      return {
        ...toIndustryMatchResult(byPair, input, "major+sub-label"),
        sourceType: resolvedItemObject ? "resolved" : "raw-adapted",
      };
    }
  }

  const labelCandidate = subCategoryValue || rawValueString;
  if (labelCandidate) {
    const byLabel = findIndustryRegistryItemBySubLabel(labelCandidate);
    if (byLabel) {
      return {
        ...toIndustryMatchResult(byLabel, input, "sub-label-only"),
        sourceType: resolvedItemObject ? "resolved" : "raw-adapted",
      };
    }
  }

  return {
    ...buildEmptyIndustryMatch(input),
    sourceType: majorCategory || subCategoryValue || rawValueString ? "raw-adapted" : "missing",
  };
}

// ─────────────────────────────────────────────
// mapUiIndustrySubToRegistryId
// Input:
//   {
//     majorCategory?: string,
//     subCategory?: string,
//     rawValue?: string,
//     resolvedItem?: object | null
//   }
// Output: contract-shaped registry resolution result
// ─────────────────────────────────────────────
export function mapUiIndustrySubToRegistryId(inputOrMajorCategory, subCategory, rawValue, resolvedItem) {
  try {
    return resolveIndustrySelection(inputOrMajorCategory, subCategory, rawValue, resolvedItem);
  } catch {
    return buildEmptyIndustryMatch(
      normalizeIndustrySelectionArgs(inputOrMajorCategory, subCategory, rawValue, resolvedItem)
    );
  }
}

// ─────────────────────────────────────────────
// buildIndustryContext
// Input:  resolvedIndustry — item returned by findIndustryRegistryByUiSelection
//         (may be null/undefined — always returns safe object)
// Output: consumer-safe industry context pack
// Fields: only what actually exists in registry items (no invented data)
// ─────────────────────────────────────────────
export function buildIndustryContext(resolvedIndustry) {
  if (!resolvedIndustry || typeof resolvedIndustry !== "object") {
    return {
      id: null,
      label: null,
      sector: null,
      subSector: null,
      aliases: [],
      customerMarket: null,
      buyingMotion: [],
      decisionStructure: [],
      proofSignals: [],
      coreContext: [],
      boundaryHints: [],
      summaryTemplate: null,
      jobInteractionHints: [],
      available: false,
    };
  }

  return {
    id: toStr(resolvedIndustry.id),
    label: toStr(resolvedIndustry.label),
    sector: toStr(resolvedIndustry.sector),
    subSector: toStr(resolvedIndustry.subSector),
    aliases: toArr(resolvedIndustry.aliases),
    customerMarket: toStr(resolvedIndustry.customerMarket),
    buyingMotion: toArr(resolvedIndustry.buyingMotion),
    decisionStructure: toArr(resolvedIndustry.decisionStructure),
    proofSignals: toArr(resolvedIndustry.proofSignals),
    coreContext: toArr(resolvedIndustry.coreContext),
    boundaryHints: toArr(resolvedIndustry.boundaryHints),
    summaryTemplate: toStr(resolvedIndustry.summaryTemplate),
    jobInteractionHints: toArr(resolvedIndustry.jobInteractionHints),
    available: true,
  };
}

export function buildOntologyContext({ current, target } = {}) {
  const currentMatch = resolveIndustrySelection(current);
  const targetMatch = resolveIndustrySelection(target);

  return {
    current: {
      ok: currentMatch.ok,
      registryId: currentMatch.registryId,
      majorCategoryId: currentMatch.majorCategoryId,
      sectorId: currentMatch.sectorId,
      subSectorId: currentMatch.subSectorId,
      label: currentMatch.label,
      boundaryHints: currentMatch.boundaryHints ?? [],
    },
    target: {
      ok: targetMatch.ok,
      registryId: targetMatch.registryId,
      majorCategoryId: targetMatch.majorCategoryId,
      sectorId: targetMatch.sectorId,
      subSectorId: targetMatch.subSectorId,
      label: targetMatch.label,
      boundaryHints: targetMatch.boundaryHints ?? [],
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
