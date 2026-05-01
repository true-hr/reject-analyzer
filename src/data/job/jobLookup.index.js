import {
  getIndustryRegistryItemById,
  getIndustryRegistryItemBySectorSubSector,
} from "../industry/industryRegistry.index.js";
import { resolveCompoundIndustryCandidates } from "../industry/industryCompoundResolver.js";
export { resolveCompoundIndustryCandidates } from "../industry/industryCompoundResolver.js";
import { getJobOntologyItemByMajorSubcategory } from "./jobOntology.index.js";

export function normalizeLookupValue(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[\s/()[\]{}.,:&+_-]+/g, "");
}

export function findJobOntologyByUiSelection({ majorCategory, subcategory } = {}) {
  if (!normalizeLookupValue(majorCategory) || !normalizeLookupValue(subcategory)) {
    return null;
  }

  return getJobOntologyItemByMajorSubcategory(majorCategory, subcategory);
}

export function findIndustryRegistryByUiSelection({ sector, subSector } = {}) {
  if (!normalizeLookupValue(sector) || !normalizeLookupValue(subSector)) {
    return null;
  }

  return getIndustryRegistryItemBySectorSubSector(sector, subSector);
}

export function shouldAutoAcceptCompoundCandidate(compoundResult) {
  const topCandidate = compoundResult?.candidates?.[0] || null;

  if (!compoundResult || compoundResult.unresolved || !topCandidate) {
    return false;
  }

  if (topCandidate.confidence !== "high") {
    return false;
  }

  if (Number(topCandidate.score || 0) < 0.8) {
    return false;
  }

  if (!topCandidate.canonicalId || !getIndustryRegistryItemById(topCandidate.canonicalId)) {
    return false;
  }

  return true;
}

export function buildCompoundDebugInfo({
  rawLabel,
  compoundResult,
  source = "unresolved",
} = {}) {
  const topCandidate = compoundResult?.candidates?.[0] || null;

  return {
    rawLabel: String(rawLabel ?? ""),
    source,
    blockedTokens: Array.isArray(compoundResult?.blockedTokens) ? compoundResult.blockedTokens : [],
    unresolved: Boolean(compoundResult?.unresolved),
    topCandidate,
    candidates: Array.isArray(compoundResult?.candidates) ? compoundResult.candidates : [],
  };
}

export function resolveIndustryRegistryWithCompoundFallback({
  sector,
  subSector,
  rawLabel,
  companyText,
  preferredSector,
  preferredSubSector,
} = {}) {
  const exactItem = findIndustryRegistryByUiSelection({ sector, subSector });

  if (exactItem) {
    return {
      item: exactItem,
      source: "exact",
      compoundResult: null,
      debugInfo: null,
    };
  }

  const resolvedRawLabel = String(rawLabel ?? subSector ?? "").trim();
  const compoundResult = resolveCompoundIndustryCandidates({
    rawLabel: resolvedRawLabel,
    companyText,
    preferredSector: preferredSector ?? sector,
    preferredSubSector: preferredSubSector ?? subSector,
  });

  if (shouldAutoAcceptCompoundCandidate(compoundResult)) {
    const topCandidate = compoundResult.candidates[0];
    const item = getIndustryRegistryItemById(topCandidate.canonicalId);

    if (item) {
      return {
        item,
        source: "compound_high_confidence",
        compoundResult,
        debugInfo: buildCompoundDebugInfo({
          rawLabel: resolvedRawLabel,
          compoundResult,
          source: "compound_high_confidence",
        }),
      };
    }
  }

  return {
    item: null,
    source: "unresolved",
    compoundResult,
    debugInfo: buildCompoundDebugInfo({
      rawLabel: resolvedRawLabel,
      compoundResult,
      source: compoundResult?.unresolved ? "compound_unresolved" : "compound_not_accepted",
    }),
  };
}
