import { getIndustryRegistryItemBySectorSubSector } from "../industry/industryRegistry.index.js";
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
