import { getJobRoleWeightProfile } from "../../data/transitionLite/JOB_ROLE_WEIGHT_PROFILE_MAP.js";
import { getJobResponsibilityProfile } from "../../data/transitionLite/JOB_RESPONSIBILITY_PROFILE_MAP.js";
import {
  getJobOntologyItemById,
  getJobOntologyItemByMajorSubcategory,
} from "../../data/job/jobOntology.index.js";
import { resolveLegacyJobKeyToTaxonomyPath } from "../../data/job/jobMigrationMap.js";
import { getIndustryRegistryItemById } from "../../data/industry/industryRegistry.index.js";

const RESPONSIBILITY_PROFILE_RANK = Object.freeze({
  individual_execution: 1,
  execution_plus_coordination: 2,
  cross_function_coordination: 3,
  planning_and_decision: 4,
  high_scope_ownership: 5,
});

function normalizeId(value) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function normalizeToken(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function toTokenSet(value) {
  const strings = Array.isArray(value) ? value : [value];
  const tokens = new Set();

  for (const raw of strings) {
    const text = String(raw ?? "").normalize("NFKC").trim().toLowerCase();
    if (!text) continue;

    for (const part of text.split(/[^\p{L}\p{N}]+/gu)) {
      const token = normalizeToken(part);
      if (token.length >= 2) tokens.add(token);
    }
  }

  return tokens;
}

function toRoleHintSet(value) {
  const strings = Array.isArray(value) ? value : [value];
  const hints = new Set();

  for (const raw of strings) {
    const text = String(raw ?? "").normalize("NFKC").trim();
    if (!text) continue;

    const match = text.match(/(.+?)직무/u);
    const candidate = normalizeToken(match?.[1] ?? "");
    if (candidate.length >= 2) hints.add(candidate);
  }

  return hints;
}

function getSetOverlapCount(leftSet, rightSet) {
  let count = 0;
  for (const value of leftSet) {
    if (rightSet.has(value)) count += 1;
  }
  return count;
}

function resolveJobItem(jobId) {
  const normalizedJobId = normalizeId(jobId);
  if (!normalizedJobId) return null;

  const direct = getJobOntologyItemById(normalizedJobId);
  if (direct) return direct;

  const legacyPath = resolveLegacyJobKeyToTaxonomyPath(normalizedJobId);
  if (!legacyPath) return null;

  return (
    getJobOntologyItemByMajorSubcategory(
      legacyPath.majorCategory,
      legacyPath.subcategory
    ) ?? null
  );
}

function resolveIndustryItem(industryId) {
  const normalizedIndustryId = normalizeId(industryId);
  if (!normalizedIndustryId) return null;
  return getIndustryRegistryItemById(normalizedIndustryId) ?? null;
}

function getJobFamilyIds(jobItem) {
  return new Set(
    toArray(jobItem?.families)
      .map((family) => normalizeToken(family?.id))
      .filter(Boolean)
  );
}

function getJobAdjacentFamilyIds(jobItem) {
  return new Set(
    toArray(jobItem?.families).flatMap((family) =>
      toArray(family?.adjacentFamilies)
        .map((value) => normalizeToken(value))
        .filter(Boolean)
    )
  );
}

function getJobAdjacentHints(jobItem) {
  return new Set(
    toArray(jobItem?.adjacentFamilies)
      .map((value) => normalizeToken(value))
      .filter(Boolean)
  );
}

function getJobIdentityHints(jobItem) {
  return new Set(
    [
      jobItem?.id,
      jobItem?.label,
      jobItem?.subcategory,
      ...toArray(jobItem?.aliases),
    ]
      .map((value) => normalizeToken(value))
      .filter(Boolean)
  );
}

function getJobBoundaryHints(jobItem) {
  return toArray(jobItem?.boundaryHints)
    .map((value) => String(value ?? "").normalize("NFKC").trim())
    .filter(Boolean);
}

function getJobBoundaryIdentityPhrases(jobItem) {
  return [
    jobItem?.label,
    jobItem?.subcategory,
    ...toArray(jobItem?.aliases),
  ]
    .map((value) => normalizeToken(value))
    .filter(Boolean);
}

function hasBoundaryAdjacentMatch(sourceJobItem, targetJobItem) {
  const boundaryHints = getJobBoundaryHints(sourceJobItem);
  const targetPhrases = getJobBoundaryIdentityPhrases(targetJobItem);

  if (boundaryHints.length === 0 || targetPhrases.length === 0) return false;

  return boundaryHints.some((hint) => {
    const normalizedHint = normalizeToken(hint);
    if (!normalizedHint) return false;

    return targetPhrases.some((phrase) => phrase.length >= 3 && normalizedHint.includes(phrase));
  });
}

function classifyJobDistance(currentJobId, targetJobId) {
  const currentId = normalizeId(currentJobId);
  const targetId = normalizeId(targetJobId);

  if (!currentId && !targetId) return "cross";
  if (!currentId || !targetId) return "cross";
  if (currentId === targetId) return "same";

  const currentItem = resolveJobItem(currentId);
  const targetItem = resolveJobItem(targetId);
  if (!currentItem || !targetItem) return "cross";

  if (
    normalizeToken(currentItem.subcategory) &&
    normalizeToken(currentItem.subcategory) === normalizeToken(targetItem.subcategory)
  ) {
    return "same";
  }

  const currentFamilyIds = getJobFamilyIds(currentItem);
  const targetFamilyIds = getJobFamilyIds(targetItem);
  if (getSetOverlapCount(currentFamilyIds, targetFamilyIds) > 0) {
    return "same";
  }

  const currentAdjacentFamilyIds = getJobAdjacentFamilyIds(currentItem);
  const targetAdjacentFamilyIds = getJobAdjacentFamilyIds(targetItem);
  if (
    getSetOverlapCount(currentAdjacentFamilyIds, targetFamilyIds) > 0 ||
    getSetOverlapCount(targetAdjacentFamilyIds, currentFamilyIds) > 0
  ) {
    return "adjacent";
  }

  const currentAdjacentHints = getJobAdjacentHints(currentItem);
  const targetAdjacentHints = getJobAdjacentHints(targetItem);
  const currentIdentityHints = getJobIdentityHints(currentItem);
  const targetIdentityHints = getJobIdentityHints(targetItem);
  if (
    getSetOverlapCount(currentAdjacentHints, targetIdentityHints) > 0 ||
    getSetOverlapCount(targetAdjacentHints, currentIdentityHints) > 0
  ) {
    return "adjacent";
  }

  if (
    hasBoundaryAdjacentMatch(currentItem, targetItem) ||
    hasBoundaryAdjacentMatch(targetItem, currentItem)
  ) {
    return "adjacent";
  }

  return "cross";
}

function getIndustrySimilaritySignals(industryItem) {
  const valueChainTokens = toTokenSet(industryItem?.valueChainPosition);
  const coreContextTokens = toTokenSet(industryItem?.coreContext);
  const boundaryHintTokens = toTokenSet(industryItem?.boundaryHints);
  const jobInteractionRoleTokens = toRoleHintSet(industryItem?.jobInteractionHints);

  return {
    customerMarket: normalizeToken(industryItem?.customerMarket),
    valueChainTokens,
    coreContextTokens,
    boundaryHintTokens,
    jobInteractionRoleTokens,
  };
}

function classifyIndustryDistance(currentIndustryId, targetIndustryId) {
  const currentId = normalizeId(currentIndustryId);
  const targetId = normalizeId(targetIndustryId);

  if (!currentId && !targetId) return "cross";
  if (!currentId || !targetId) return "cross";
  if (currentId === targetId) return "same";

  const currentItem = resolveIndustryItem(currentId);
  const targetItem = resolveIndustryItem(targetId);
  if (!currentItem || !targetItem) return "cross";

  if (
    normalizeToken(currentItem.subSector) &&
    normalizeToken(currentItem.subSector) === normalizeToken(targetItem.subSector)
  ) {
    return "same";
  }

  const currentSector = normalizeToken(currentItem.sector);
  const targetSector = normalizeToken(targetItem.sector);
  const currentSignals = getIndustrySimilaritySignals(currentItem);
  const targetSignals = getIndustrySimilaritySignals(targetItem);
  const sameCustomerMarket =
    currentSignals.customerMarket &&
    currentSignals.customerMarket === targetSignals.customerMarket;
  const valueChainOverlap = getSetOverlapCount(currentSignals.valueChainTokens, targetSignals.valueChainTokens);
  const contextOverlap =
    getSetOverlapCount(currentSignals.coreContextTokens, targetSignals.coreContextTokens) +
    getSetOverlapCount(currentSignals.boundaryHintTokens, targetSignals.boundaryHintTokens);
  const jobInteractionRoleOverlap = getSetOverlapCount(
    currentSignals.jobInteractionRoleTokens,
    targetSignals.jobInteractionRoleTokens
  );

  if (currentSector && currentSector === targetSector) {
    if (sameCustomerMarket && (valueChainOverlap >= 1 || contextOverlap >= 2)) {
      return "adjacent";
    }
    return "cross";
  }

  if (
    sameCustomerMarket &&
    valueChainOverlap >= 2 &&
    (contextOverlap >= 2 || (contextOverlap >= 1 && jobInteractionRoleOverlap >= 2))
  ) {
    return "adjacent";
  }

  return "cross";
}

function classifyRoleWeightShift(currentJobId, targetJobId) {
  const currentProfile = getJobRoleWeightProfile(normalizeId(currentJobId));
  const targetProfile = getJobRoleWeightProfile(normalizeId(targetJobId));

  if (!currentProfile || !targetProfile) return "similar";
  if (currentProfile === targetProfile) return "similar";

  if (currentProfile === "strategy" && targetProfile === "execution_or_hybrid") {
    return "strategy_to_execution";
  }
  if (currentProfile === "strategy" && targetProfile === "coordinator") {
    return "strategy_to_execution";
  }
  if (currentProfile === "strategy_or_coordinator" && targetProfile === "execution_or_hybrid") {
    return "strategy_to_execution";
  }
  if (currentProfile === "execution_or_hybrid" && targetProfile === "strategy") {
    return "execution_to_strategy";
  }
  if (currentProfile === "coordinator" && targetProfile === "strategy") {
    return "execution_to_strategy";
  }
  if (currentProfile === "execution_or_hybrid" && targetProfile === "strategy_or_coordinator") {
    return "execution_to_strategy";
  }
  if (currentProfile === "execution_or_hybrid" && targetProfile === "coordinator") {
    return "operator_to_coordinator";
  }
  if (currentProfile === "coordinator" && targetProfile === "execution_or_hybrid") {
    return "coordinator_to_operator";
  }
  if (currentProfile === "operator" && targetProfile === "strategy") {
    return "execution_to_strategy";
  }
  if (currentProfile === "operator" && targetProfile === "execution_or_hybrid") {
    return "operator_to_coordinator";
  }
  if (currentProfile === "execution_or_hybrid" && targetProfile === "operator") {
    return "coordinator_to_operator";
  }
  if (currentProfile === "strategy" && targetProfile === "operator") {
    return "strategy_to_execution";
  }
  if (currentProfile === "operator" && targetProfile === "coordinator") {
    return "operator_to_coordinator";
  }
  if (currentProfile === "operator" && targetProfile === "strategy_or_coordinator") {
    return "operator_to_coordinator";
  }
  if (currentProfile === "coordinator" && targetProfile === "operator") {
    return "coordinator_to_operator";
  }
  if (currentProfile === "strategy_or_coordinator" && targetProfile === "operator") {
    return "coordinator_to_operator";
  }

  return "similar";
}

function classifyResponsibilityShift(currentJobId, targetJobId) {
  const currentProfile = getJobResponsibilityProfile(normalizeId(currentJobId));
  const targetProfile = getJobResponsibilityProfile(normalizeId(targetJobId));

  if (!currentProfile || !targetProfile) return "similar";

  const currentRank = RESPONSIBILITY_PROFILE_RANK[currentProfile];
  const targetRank = RESPONSIBILITY_PROFILE_RANK[targetProfile];
  if (!currentRank || !targetRank) return "similar";

  const difference = targetRank - currentRank;
  if (difference === 0) return "similar";
  if (difference === 1) return "slightly_up";
  if (difference >= 2) return "meaningfully_up";
  return "down_or_narrower";
}

export function classifyTransition(input = {}) {
  const currentJobId = normalizeId(input.currentJobId);
  const currentIndustryId = normalizeId(input.currentIndustryId);
  const targetJobId = normalizeId(input.targetJobId);
  const targetIndustryId = normalizeId(input.targetIndustryId);

  return {
    jobDistance: classifyJobDistance(currentJobId, targetJobId),
    industryDistance: classifyIndustryDistance(currentIndustryId, targetIndustryId),
    roleWeightShift: classifyRoleWeightShift(currentJobId, targetJobId),
    responsibilityShift: classifyResponsibilityShift(currentJobId, targetJobId),
  };
}
