// src/lib/analysis/buildAxisConnectivityPack.js
// 5축 연결성 점수 pack producer
//
// Input:  { currentJobId, targetJobId, currentIndustryId, targetIndustryId }
// Output: { version, axes: { jobStructure, industryContext, responsibilityScope, customerType, roleCharacter } }
//
// Scoring contract: v1
// - rawScore  = internal formula result
// - displayScore = rawScore normalized to 0~100 per axis raw range
// - band = rawScore-based enum
//
// Axis raw ranges (fixed):
//   Axis 1 jobStructure:       15~95
//   Axis 2 industryContext:    20~90
//   Axis 3 responsibilityScope: 30~80
//   Axis 4 customerType:       30~85
//   Axis 5 roleCharacter:      30~80
//
// DO NOT score: buyingMotion, decisionStructure, summaryTemplate, hints text
// DO NOT create new data assets — existing signals only

import { getJobOntologyItemById } from "../../data/job/jobOntology.index.js";
import { getIndustryRegistryItemById } from "../../data/industry/industryRegistry.index.js";
import { getTransitionReadJobMetaByJobItem } from "../../data/transitionLite/jobTransitionReadMetaRegistry.js";
import { classifyTransition } from "../transitionLite/classifyTransition.js";
import { JOB_CAPABILITY_CLUSTER_REGISTRY } from "../../data/transitionLite/jobCapabilityClusterRegistry.js";
import {
  buildJobStructureExplanation,
  buildIndustryContextExplanation,
  buildResponsibilityScopeExplanation,
  buildCustomerTypeExplanation,
  buildRoleCharacterExplanation,
} from "../../data/transitionLite/axisExplanationRegistry.js";

// ─── helpers ────────────────────────────────────────────────────────────────

function toArr(v) {
  return Array.isArray(v) ? v.filter(Boolean) : [];
}

function toStr(v) {
  return v && typeof v === "string" ? v.trim() : null;
}

function normalizeText(value) {
  return toStr(value)?.toLowerCase() ?? null;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function computeDisplayScore(rawScore, min, max) {
  if (max === min) return 100;
  return Math.min(100, Math.max(20, Math.round(20 + ((rawScore - min) / (max - min)) * 80)));
}

const AXIS1_MULTI_FAMILY_UMBRELLA_ALLOWLIST = Object.freeze({
  JOB_SALES_GENERAL_SALES: Object.freeze({
    bridgeGroup: "GO_TO_MARKET_UMBRELLA",
    minFamilies: 4,
  }),
  JOB_SALES_B2B_SALES: Object.freeze({
    bridgeGroup: "GO_TO_MARKET_UMBRELLA",
    minFamilies: 4,
  }),
  JOB_MARKETING_BRAND_MARKETING: Object.freeze({
    bridgeGroup: "GO_TO_MARKET_UMBRELLA",
    minFamilies: 4,
  }),
  JOB_MARKETING_PRODUCT_MARKETING_PMM: Object.freeze({
    bridgeGroup: "GO_TO_MARKET_UMBRELLA",
    minFamilies: 4,
  }),
});

// ─── job axis helpers (equivalent to buildCandidateAxisPack internals) ───────

function getPrimaryFamily(jobItem) {
  const families = toArr(jobItem?.families);
  return families.length > 0 && typeof families[0] === "object" ? families[0] : null;
}

function getAxis1FamilyReadPack(jobItem) {
  const jobId = toStr(jobItem?.id);
  const allowlistEntry = jobId ? AXIS1_MULTI_FAMILY_UMBRELLA_ALLOWLIST[jobId] : null;
  const families = toArr(jobItem?.families).filter((family) => typeof family === "object");
  const primaryFamily = families.length > 0 ? families[0] : null;
  const secondaryFamilies = families.slice(1);
  const secondaryFamilyIds = secondaryFamilies
    .map((family) => toStr(family?.id) ?? toStr(family?.label))
    .filter(Boolean);
  const minFamilies = allowlistEntry?.minFamilies ?? 3;

  return {
    jobId,
    primaryFamilyId: toStr(primaryFamily?.id) ?? toStr(primaryFamily?.label),
    secondaryFamilyIds: allowlistEntry ? secondaryFamilyIds : [],
    secondaryFamilyCount: allowlistEntry ? secondaryFamilyIds.length : 0,
    familyCount: families.length,
    isAllowlistedUmbrella: Boolean(
      allowlistEntry && families.length >= minFamilies && secondaryFamilyIds.length >= 1
    ),
    bridgeGroup: allowlistEntry?.bridgeGroup ?? null,
  };
}

function getPrimaryFamilyId(jobItem) {
  const primary = getPrimaryFamily(jobItem);
  return primary ? (toStr(primary.id) ?? toStr(primary.label)) : null;
}

function getAllFamilyIds(jobItem) {
  return toArr(jobItem?.families)
    .map((f) => toStr(f?.id) ?? toStr(f?.label))
    .filter(Boolean);
}

function uniqueNormalizedStrings(items = []) {
  const seen = new Set();
  return toArr(items)
    .map((item) => normalizeText(item))
    .filter((item) => {
      if (!item || seen.has(item)) return false;
      seen.add(item);
      return true;
    });
}

function getPrimaryFamilyStrongSignals(jobItem) {
  return uniqueNormalizedStrings(getPrimaryFamily(jobItem)?.strongSignals);
}

function getPrimaryFamilyMediumSignals(jobItem) {
  return uniqueNormalizedStrings(getPrimaryFamily(jobItem)?.mediumSignals);
}

// @MX:NOTE: Round 1 — all-family weighted read. primary weight=1.0, secondary weight=0.4.
// Secondary families are read for strong/medium signals only. responsibility/meta unchanged.
const SECONDARY_FAMILY_WEIGHT = 0.4;

function getWeightedSignalOverlapStats(currentJobItem, targetJobItem, signalKey) {
  const cFamilies = toArr(currentJobItem?.families).filter((f) => typeof f === "object");
  const tFamilies = toArr(targetJobItem?.families).filter((f) => typeof f === "object");

  const cPrimary = uniqueNormalizedStrings(cFamilies[0]?.[signalKey]);
  const tPrimary = uniqueNormalizedStrings(tFamilies[0]?.[signalKey]);
  const cSecondary = cFamilies.slice(1).flatMap((f) => uniqueNormalizedStrings(f?.[signalKey]));
  const tSecondary = tFamilies.slice(1).flatMap((f) => uniqueNormalizedStrings(f?.[signalKey]));

  const cPrimarySet = new Set(cPrimary);
  const tPrimarySet = new Set(tPrimary);
  const tSecondarySet = new Set(tSecondary);

  const ppOverlap = tPrimary.filter((s) => cPrimarySet.has(s)).length;
  const spOverlap = cSecondary.filter((s) => tPrimarySet.has(s)).length;
  const psOverlap = cPrimary.filter((s) => tSecondarySet.has(s)).length;

  const virtualOverlapCount = ppOverlap + (spOverlap + psOverlap) * SECONDARY_FAMILY_WEIGHT;
  const denominator = Math.max(tPrimary.length, 1);

  return {
    currentCount: cPrimary.length,
    targetCount: tPrimary.length,
    overlapCount: ppOverlap,
    overlapRatio: Math.min(1, virtualOverlapCount / denominator),
    secondaryContribution: Math.round((spOverlap + psOverlap) * SECONDARY_FAMILY_WEIGHT * 10) / 10,
  };
}

function getJobResponsibilityHints(jobItem) {
  return uniqueNormalizedStrings(
    toArr(jobItem?.roles).flatMap((role) => toArr(role?.responsibilityHints))
  );
}

function getOverlapStats(currentItems, targetItems) {
  const currentSet = new Set(uniqueNormalizedStrings(currentItems));
  const targetSet = uniqueNormalizedStrings(targetItems);
  const overlapCount = targetSet.filter((item) => currentSet.has(item)).length;
  const overlapRatio = targetSet.length > 0 ? overlapCount / targetSet.length : 0;
  return {
    currentCount: currentSet.size,
    targetCount: targetSet.length,
    overlapCount,
    overlapRatio,
  };
}

function resolveAxis1MetaSignals(currentJobItem, targetJobItem) {
  const currentMeta = getTransitionReadJobMetaByJobItem(currentJobItem);
  const targetMeta = getTransitionReadJobMetaByJobItem(targetJobItem);
  const currentMissionType = toStr(currentMeta?.missionType);
  const targetMissionType = toStr(targetMeta?.missionType);
  const currentOutputType = toStr(currentMeta?.outputType);
  const targetOutputType = toStr(targetMeta?.outputType);

  return {
    currentMissionType,
    targetMissionType,
    missionTypeMatch: Boolean(
      currentMissionType && targetMissionType && currentMissionType === targetMissionType
    ),
    currentOutputType,
    targetOutputType,
    outputTypeMatch: Boolean(
      currentOutputType && targetOutputType && currentOutputType === targetOutputType
    ),
  };
}

function resolveAxis1WeakUmbrellaBridgeSignals(currentJobItem, targetJobItem) {
  const currentFamilyReadPack = getAxis1FamilyReadPack(currentJobItem);
  const targetFamilyReadPack = getAxis1FamilyReadPack(targetJobItem);
  const weakUmbrellaBridgeGroup =
    currentFamilyReadPack.isAllowlistedUmbrella &&
    targetFamilyReadPack.isAllowlistedUmbrella &&
    currentFamilyReadPack.bridgeGroup &&
    currentFamilyReadPack.bridgeGroup === targetFamilyReadPack.bridgeGroup
      ? currentFamilyReadPack.bridgeGroup
      : null;

  return {
    currentFamilyReadPack,
    targetFamilyReadPack,
    weakUmbrellaBridgeGroup,
    weakUmbrellaBridgeEligible: Boolean(weakUmbrellaBridgeGroup),
  };
}

// @MX:NOTE: Round 4 — registry SSOT primary path. finance_planning_control single-group guard lifted.
// technical_build-only and extreme mismatch guards remain. GTM allowlist retained as fallback.
function resolveAxis1RegistryBridgeSignals(currentJobItem, targetJobItem) {
  const currentJobId = toStr(currentJobItem?.id);
  const targetJobId = toStr(targetJobItem?.id);
  const currentEntry = currentJobId ? JOB_CAPABILITY_CLUSTER_REGISTRY[currentJobId] : null;
  const targetEntry = targetJobId ? JOB_CAPABILITY_CLUSTER_REGISTRY[targetJobId] : null;

  if (!currentEntry || !targetEntry) {
    return {
      currentRegistryJobId: currentJobId ?? null,
      targetRegistryJobId: targetJobId ?? null,
      sharedBridgeGroups: [],
      sharedCapabilityClusters: [],
      registryBridgeEligible: false,
      registryBridgeReason: null,
    };
  }

  const cBridgeGroups = toArr(currentEntry.bridgeGroups);
  const tBridgeGroups = toArr(targetEntry.bridgeGroups);
  const sharedBridgeGroups = cBridgeGroups.filter((g) => tBridgeGroups.includes(g));

  const cClusters = toArr(currentEntry.capabilityClusters);
  const tClusters = toArr(targetEntry.capabilityClusters);
  const sharedCapabilityClusters = cClusters.filter((c) => tClusters.includes(c));

  const onlyTechnicalBuild =
    sharedBridgeGroups.length === 1 && sharedBridgeGroups[0] === "technical_build";
  const hasExtremeMismatch =
    sharedBridgeGroups.includes("technical_build") &&
    (cBridgeGroups.includes("commercial_gtm") || tBridgeGroups.includes("commercial_gtm")) &&
    !sharedBridgeGroups.includes("commercial_gtm");

  const registryBridgeEligible =
    sharedBridgeGroups.length >= 1 &&
    sharedCapabilityClusters.length >= 2 &&
    !onlyTechnicalBuild &&
    !hasExtremeMismatch;

  return {
    currentRegistryJobId: currentJobId,
    targetRegistryJobId: targetJobId,
    sharedBridgeGroups,
    sharedCapabilityClusters,
    registryBridgeEligible,
    registryBridgeReason: registryBridgeEligible
      ? `shared bridge groups: ${sharedBridgeGroups.join(", ")}`
      : null,
  };
}

// @MX:NOTE: Round 4 — limited cluster-based raw uplift. Max +4. Only for noDirectOverlap bridgeable cases.
function getRegistryClusterUplift(signals, breakdown) {
  const regSignals = signals.registryBridgeSignals;
  if (!regSignals) return { uplift: 0, reason: null };

  const sharedBridgeGroups = regSignals.sharedBridgeGroups ?? [];
  const sharedCapabilityClusters = regSignals.sharedCapabilityClusters ?? [];
  const isBridgeableDistance = signals.jobDistance === "adjacent" || signals.jobDistance === "cross";

  const noDirectOverlap =
    breakdown.strongSignals.overlapCount === 0 &&
    breakdown.responsibilityHints.overlapCount === 0 &&
    breakdown.mediumSignals.overlapCount === 0;

  if (
    sharedBridgeGroups.length < 1 ||
    sharedCapabilityClusters.length < 2 ||
    !isBridgeableDistance ||
    !noDirectOverlap
  ) {
    return { uplift: 0, reason: null };
  }

  const uplift = sharedCapabilityClusters.length >= 3 ? 4 : 2;
  const clusterList = sharedCapabilityClusters.slice(0, 2).join(", ");
  const suffix = sharedCapabilityClusters.length > 2 ? ", ..." : "";

  return {
    uplift,
    reason: `${sharedCapabilityClusters.length} shared clusters (${clusterList}${suffix})`,
  };
}

function resolveAxis5MetaSignals(currentJobItem, targetJobItem) {
  const currentMeta = getTransitionReadJobMetaByJobItem(currentJobItem);
  const targetMeta = getTransitionReadJobMetaByJobItem(targetJobItem);
  const currentMissionType = toStr(currentMeta?.missionType);
  const targetMissionType = toStr(targetMeta?.missionType);
  const currentOutputType = toStr(currentMeta?.outputType);
  const targetOutputType = toStr(targetMeta?.outputType);
  const currentSuccessMetricType = toStr(currentMeta?.successMetricType);
  const targetSuccessMetricType = toStr(targetMeta?.successMetricType);
  const currentHorizonType = toStr(currentMeta?.horizonType);
  const targetHorizonType = toStr(targetMeta?.horizonType);

  return {
    currentMissionType,
    targetMissionType,
    missionTypeMatch: Boolean(
      currentMissionType && targetMissionType && currentMissionType === targetMissionType
    ),
    currentOutputType,
    targetOutputType,
    outputTypeMatch: Boolean(
      currentOutputType && targetOutputType && currentOutputType === targetOutputType
    ),
    currentSuccessMetricType,
    targetSuccessMetricType,
    successMetricTypeMatch: Boolean(
      currentSuccessMetricType &&
        targetSuccessMetricType &&
        currentSuccessMetricType === targetSuccessMetricType
    ),
    currentHorizonType,
    targetHorizonType,
    horizonTypeMatch: Boolean(
      currentHorizonType && targetHorizonType && currentHorizonType === targetHorizonType
    ),
  };
}

function applyAxis1TaxonomyGuardrails(baseRaw, signals, min, max) {
  const { jobDistance, familyDistance, sharedFamiliesCount } = signals;
  let raw = baseRaw;

  if (jobDistance === "cross") raw -= 12;
  else if (jobDistance === "adjacent") raw += 0;
  else if (jobDistance === "same") raw += 4;

  if (familyDistance === "distant_family") raw -= 6;
  else if (familyDistance === "adjacent_family") raw += 2;
  else if (familyDistance === "same_family") raw += 3;

  if (sharedFamiliesCount >= 1) raw += 2;

  if (jobDistance === "adjacent" && familyDistance === "bridgeable_family") {
    raw = Math.max(raw, 20);
  }

  if (jobDistance === "cross") {
    raw = Math.min(raw, 72);
  } else if (jobDistance === "adjacent" && familyDistance === "distant_family") {
    raw = Math.min(raw, 78);
  }

  return clamp(raw, min, max);
}

function computeAxis1Raw(signals) {
  const strong =
    signals.strongSignalsWeightedStats ??
    getOverlapStats(signals.currentStrongSignals, signals.targetStrongSignals);
  const responsibility = getOverlapStats(
    signals.currentResponsibilityHints,
    signals.targetResponsibilityHints
  );
  const medium =
    signals.mediumSignalsWeightedStats ??
    getOverlapStats(signals.currentMediumSignals, signals.targetMediumSignals);

  let raw = 18;

  raw += Math.round(strong.overlapRatio * 42);
  raw += Math.min(14, responsibility.overlapCount * 5);
  raw += Math.min(8, medium.overlapCount * 2);

  if (strong.overlapCount >= 2) raw += 6;
  else if (strong.overlapCount >= 1) raw += 3;

  if (responsibility.overlapCount >= 2) raw += 4;
  else if (responsibility.overlapCount >= 1) raw += 2;

  if (strong.overlapCount === 0 && responsibility.overlapCount >= 3) {
    raw += 4;
  } else if (strong.overlapCount === 0 && responsibility.overlapCount >= 2) {
    raw += 2;
  }

  if (signals.missionTypeMatch && signals.outputTypeMatch) {
    raw += 6;
  } else if (signals.missionTypeMatch || signals.outputTypeMatch) {
    raw += 2;
  }

  raw = applyAxis1TaxonomyGuardrails(raw, signals, AXIS_RANGES.jobStructure.min, AXIS_RANGES.jobStructure.max);

  return {
    raw,
    breakdown: {
      strongSignals: strong,
      responsibilityHints: responsibility,
      mediumSignals: medium,
      missionTypeMatch: signals.missionTypeMatch,
      outputTypeMatch: signals.outputTypeMatch,
    },
  };
}

function applyAxis1WeakUmbrellaBridge(raw, signals, breakdown) {
  const noDirectOverlap =
    breakdown.strongSignals.overlapCount === 0 &&
    breakdown.responsibilityHints.overlapCount === 0 &&
    breakdown.mediumSignals.overlapCount === 0;
  const allowlistShouldApply =
    signals.weakUmbrellaBridgeEligible &&
    noDirectOverlap &&
    signals.familyDistance === "distant_family" &&
    (signals.jobDistance === "adjacent" || signals.jobDistance === "cross");
  // Registry-based eligibility (Round 3 — broader structured bridge)
  const regSignals = signals.registryBridgeSignals ?? null;
  const isBridgeableDistance = signals.jobDistance === "adjacent" || signals.jobDistance === "cross";
  const registryShouldApply =
    regSignals?.registryBridgeEligible === true &&
    noDirectOverlap &&
    isBridgeableDistance;

  const shouldApply = allowlistShouldApply || registryShouldApply;
  const floorApplied = shouldApply ? 40 : null;
  const nextRaw = floorApplied ? Math.max(raw, floorApplied) : raw;

  return {
    raw: nextRaw,
    applied: Boolean(floorApplied && nextRaw !== raw),
    floorApplied,
    bridgeFloorValue: floorApplied ?? null,
    bridgeFloorReason: allowlistShouldApply
      ? "GO_TO_MARKET_UMBRELLA weak bridge — Round 2 floor uplift"
      : registryShouldApply
      ? `registry bridge — ${regSignals?.registryBridgeReason ?? "shared bridge groups"}`
      : null,
    currentFamilyReadPack: signals.currentFamilyReadPack ?? null,
    targetFamilyReadPack: signals.targetFamilyReadPack ?? null,
    weakUmbrellaBridgeGroup: signals.weakUmbrellaBridgeGroup ?? null,
    currentRegistryJobId: regSignals?.currentRegistryJobId ?? null,
    targetRegistryJobId: regSignals?.targetRegistryJobId ?? null,
    sharedBridgeGroups: regSignals?.sharedBridgeGroups ?? [],
    sharedCapabilityClusters: regSignals?.sharedCapabilityClusters ?? [],
    registryBridgeEligible: regSignals?.registryBridgeEligible ?? false,
    registryBridgeReason: regSignals?.registryBridgeReason ?? null,
    bridgeEligibilitySource: registryShouldApply
      ? "registry"
      : allowlistShouldApply
      ? "allowlist_fallback"
      : null,
  };
}

// Uses primary family adjacentFamilies + item-level adjacentFamilies
// (matches buildJobContext.js getAdjacentFamilyIds contract)
function getAdjacentFamilyIds(jobItem) {
  const primary = getPrimaryFamily(jobItem);
  const primaryAdjacent = primary ? toArr(primary.adjacentFamilies) : [];
  const itemAdjacent = toArr(jobItem?.adjacentFamilies);
  return [...new Set([...primaryAdjacent, ...itemAdjacent])].filter(
    (v) => typeof v === "string" && v.trim()
  );
}

function classifyFamilyDistance(sameFamily, adjacentFamily, boundaryTransition, farTransition) {
  if (sameFamily) return "same_family";
  if (adjacentFamily) return "adjacent_family";
  if (boundaryTransition && !farTransition) return "bridgeable_family";
  if (farTransition) return "distant_family";
  return "unclear_family";
}

function resolveJobAxisSignals(currentJobItem, targetJobItem) {
  if (!currentJobItem || !targetJobItem) {
    return { familyDistance: null, sharedFamiliesCount: 0 };
  }

  const curFamilyId = getPrimaryFamilyId(currentJobItem);
  const tgtFamilyId = getPrimaryFamilyId(targetJobItem);
  const curAllFamilyIds = getAllFamilyIds(currentJobItem);
  const tgtAllFamilyIds = getAllFamilyIds(targetJobItem);
  const curAdjacentFamilyIds = getAdjacentFamilyIds(currentJobItem);
  const tgtAdjacentFamilyIds = getAdjacentFamilyIds(targetJobItem);

  const sameFamily = Boolean(curFamilyId && tgtFamilyId && curFamilyId === tgtFamilyId);
  const adjacentFamily =
    !sameFamily &&
    Boolean(
      (tgtFamilyId && curAdjacentFamilyIds.includes(tgtFamilyId)) ||
        (curFamilyId && tgtAdjacentFamilyIds.includes(curFamilyId))
    );
  const sameMajorCategory = Boolean(
    toStr(currentJobItem.majorCategory) &&
      toStr(currentJobItem.majorCategory) === toStr(targetJobItem.majorCategory)
  );
  const sameSubcategory = Boolean(
    toStr(currentJobItem.subcategory) &&
      toStr(currentJobItem.subcategory) === toStr(targetJobItem.subcategory)
  );
  const boundaryTransition = sameMajorCategory && !sameSubcategory;
  const farTransition = !sameMajorCategory;

  const familyDistance = classifyFamilyDistance(
    sameFamily,
    adjacentFamily,
    boundaryTransition,
    farTransition
  );
  const sharedFamilies = curAllFamilyIds.filter((f) => tgtAllFamilyIds.includes(f));

  return { familyDistance, sharedFamiliesCount: sharedFamilies.length };
}

// ─── industry axis helpers ───────────────────────────────────────────────────

function resolveIndustryAxisSignals(currentIndustryItem, targetIndustryItem) {
  if (!currentIndustryItem || !targetIndustryItem) {
    return {
      sameSector: false,
      sameSubSector: false,
      currentValueChainPosition: [],
      targetValueChainPosition: [],
      valueChainFit: "neutral",
      currentCoreContext: [],
      targetCoreContext: [],
      coreContextFit: "neutral",
      currentRegulationBarrier: null,
      targetRegulationBarrier: null,
      regulationBarrierFit: "neutral",
      currentSalesCycle: null,
      targetSalesCycle: null,
      salesCycleFit: "neutral",
    };
  }
  const sameSector = Boolean(
    toStr(currentIndustryItem.sector) &&
      toStr(currentIndustryItem.sector) === toStr(targetIndustryItem.sector)
  );
  const sameSubSector = Boolean(
    toStr(currentIndustryItem.subSector) &&
      toStr(currentIndustryItem.subSector) === toStr(targetIndustryItem.subSector)
  );
  const valueChainSignals = resolveAxis2ValueChainSignals(currentIndustryItem, targetIndustryItem);
  const coreContextSignals = resolveAxis2CoreContextSignals(currentIndustryItem, targetIndustryItem);
  const regulationSignals = resolveAxis2RegulationBarrierSignals(
    currentIndustryItem,
    targetIndustryItem
  );
  const salesCycleSignals = resolveAxis2SalesCycleSignals(currentIndustryItem, targetIndustryItem);

  return {
    sameSector,
    sameSubSector,
    ...valueChainSignals,
    ...coreContextSignals,
    ...regulationSignals,
    ...salesCycleSignals,
  };
}

function resolveCustomerMarketSignals(currentIndustryItem, targetIndustryItem) {
  const currentCustomerMarket = toStr(currentIndustryItem?.customerMarket);
  const targetCustomerMarket = toStr(targetIndustryItem?.customerMarket);
  const customerMarketFlip = Boolean(
    currentCustomerMarket &&
      targetCustomerMarket &&
      currentCustomerMarket !== targetCustomerMarket
  );
  return { currentCustomerMarket, targetCustomerMarket, customerMarketFlip };
}

function toSignalTextArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => toStr(item))
      .filter(Boolean);
  }
  const text = toStr(value);
  return text ? [text] : [];
}

function normalizeAxis2Phrase(value) {
  return normalizeText(value)?.replace(/\s+/g, " ") ?? null;
}

function getAxis2ContextTokens(values, options = {}) {
  const minTokenLength = Number.isFinite(options.minTokenLength) ? options.minTokenLength : 4;
  const exclusions = new Set(
    toArr(options.exclusions).map((item) => normalizeText(item)).filter(Boolean)
  );
  const seen = new Set();

  return toSignalTextArray(values)
    .flatMap((value) =>
      normalizeAxis2Phrase(value)
        ?.replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/) ?? []
    )
    .map((token) => normalizeText(token))
    .filter((token) => token && token.length >= minTokenLength && !exclusions.has(token))
    .filter((token) => {
      if (seen.has(token)) return false;
      seen.add(token);
      return true;
    });
}

function compareAxis2PhraseSignals(currentValues, targetValues, options = {}) {
  const currentPhrases = uniqueNormalizedStrings(toSignalTextArray(currentValues).map(normalizeAxis2Phrase));
  const targetPhrases = uniqueNormalizedStrings(toSignalTextArray(targetValues).map(normalizeAxis2Phrase));

  if (currentPhrases.length === 0 || targetPhrases.length === 0) {
    return {
      fit: "neutral",
      exactOverlapCount: 0,
      tokenOverlapCount: 0,
      tokenOverlapRatio: null,
    };
  }

  const currentPhraseSet = new Set(currentPhrases);
  const exactOverlapCount = targetPhrases.filter((value) => currentPhraseSet.has(value)).length;
  if (exactOverlapCount >= 1) {
    return {
      fit: "strong_match",
      exactOverlapCount,
      tokenOverlapCount: null,
      tokenOverlapRatio: null,
    };
  }

  const currentTokens = new Set(getAxis2ContextTokens(currentValues, options));
  const targetTokens = getAxis2ContextTokens(targetValues, options);

  if (currentTokens.size === 0 || targetTokens.length === 0) {
    return {
      fit: "neutral",
      exactOverlapCount: 0,
      tokenOverlapCount: 0,
      tokenOverlapRatio: null,
    };
  }

  const tokenOverlapCount = targetTokens.filter((token) => currentTokens.has(token)).length;
  const tokenOverlapRatio = targetTokens.length > 0 ? tokenOverlapCount / targetTokens.length : 0;

  if (tokenOverlapRatio >= 0.5 || tokenOverlapCount >= 3) {
    return {
      fit: "partial_match",
      exactOverlapCount: 0,
      tokenOverlapCount,
      tokenOverlapRatio,
    };
  }

  if (tokenOverlapCount >= 1) {
    return {
      fit: "light_match",
      exactOverlapCount: 0,
      tokenOverlapCount,
      tokenOverlapRatio,
    };
  }

  return {
    fit: "mismatch",
    exactOverlapCount: 0,
    tokenOverlapCount: 0,
    tokenOverlapRatio: 0,
  };
}

function resolveAxis2ValueChainSignals(currentIndustryItem, targetIndustryItem) {
  const currentValueChainPosition = toSignalTextArray(currentIndustryItem?.valueChainPosition);
  const targetValueChainPosition = toSignalTextArray(targetIndustryItem?.valueChainPosition);
  const comparison = compareAxis2PhraseSignals(currentValueChainPosition, targetValueChainPosition, {
    minTokenLength: 4,
    exclusions: ["영역", "중심", "구조", "운영", "관리", "지원", "실행", "제공"],
  });

  return {
    currentValueChainPosition,
    targetValueChainPosition,
    valueChainFit: comparison.fit,
  };
}

function resolveAxis2CoreContextSignals(currentIndustryItem, targetIndustryItem) {
  const currentCoreContext = toSignalTextArray(currentIndustryItem?.coreContext);
  const targetCoreContext = toSignalTextArray(targetIndustryItem?.coreContext);
  const comparison = compareAxis2PhraseSignals(currentCoreContext, targetCoreContext, {
    minTokenLength: 4,
    exclusions: [
      "중요하다",
      "중요함",
      "중요",
      "핵심",
      "구조",
      "환경",
      "산업",
      "운영",
      "중심",
      "기반",
    ],
  });

  return {
    currentCoreContext,
    targetCoreContext,
    coreContextFit: comparison.fit,
  };
}

function parseAxis2RegulationBarrierLevel(value) {
  const raw = toStr(value)?.toUpperCase() ?? null;
  if (!raw) return null;
  const match = raw.match(/\b(LOW|MEDIUM|HIGH)\b/);
  return match?.[1] ?? null;
}

function resolveAxis2RegulationBarrierSignals(currentIndustryItem, targetIndustryItem) {
  const currentRegulationBarrier = parseAxis2RegulationBarrierLevel(
    currentIndustryItem?.regulationBarrier
  );
  const targetRegulationBarrier = parseAxis2RegulationBarrierLevel(
    targetIndustryItem?.regulationBarrier
  );

  if (!currentRegulationBarrier || !targetRegulationBarrier) {
    return {
      currentRegulationBarrier,
      targetRegulationBarrier,
      regulationBarrierFit: "neutral",
    };
  }

  const REGULATION_RANK = { LOW: 1, MEDIUM: 2, HIGH: 3 };
  const gap = Math.abs(
    (REGULATION_RANK[currentRegulationBarrier] ?? 0) -
      (REGULATION_RANK[targetRegulationBarrier] ?? 0)
  );

  return {
    currentRegulationBarrier,
    targetRegulationBarrier,
    regulationBarrierFit: gap === 0 ? "same_level" : gap === 1 ? "near_level" : "far_level",
  };
}

function normalizeAxis2SalesCycle(value) {
  const raw = toStr(value)?.toUpperCase() ?? null;
  return raw === "SHORT" || raw === "MID" || raw === "LONG" ? raw : null;
}

function resolveAxis2SalesCycleSignals(currentIndustryItem, targetIndustryItem) {
  const currentSalesCycle = normalizeAxis2SalesCycle(currentIndustryItem?.salesCycle);
  const targetSalesCycle = normalizeAxis2SalesCycle(targetIndustryItem?.salesCycle);

  if (!currentSalesCycle || !targetSalesCycle) {
    return {
      currentSalesCycle,
      targetSalesCycle,
      salesCycleFit: "neutral",
    };
  }

  const SALES_RANK = { SHORT: 1, MID: 2, LONG: 3 };
  const gap = Math.abs((SALES_RANK[currentSalesCycle] ?? 0) - (SALES_RANK[targetSalesCycle] ?? 0));

  return {
    currentSalesCycle,
    targetSalesCycle,
    salesCycleFit: gap === 0 ? "same_cycle" : gap === 1 ? "near_cycle" : "far_cycle",
  };
}

function toAxis4BuyingMotionValues(value) {
  return toSignalTextArray(value);
}

function normalizeAxis4BuyingMotionValue(value) {
  const raw = toStr(value);
  if (!raw) return null;
  const head = raw.split(":")[0];
  return normalizeText(head)?.replace(/\s+/g, "_");
}

function toAxis4DecisionStructureValues(value) {
  return toSignalTextArray(value).map((item) => normalizeText(item)).filter(Boolean);
}

function normalizeAxis4CustomerMarketValue(value) {
  return toStr(value)?.toUpperCase() ?? null;
}

function getAxis4CustomerMarketGroup(value) {
  const normalized = normalizeAxis4CustomerMarketValue(value);
  if (!normalized) return null;

  const B2B_GROUP = new Set(["B2B", "B2G", "B2B_B2G_MIXED"]);
  const B2C_GROUP = new Set(["B2C", "B2C_B2G_B2B_MIXED", "B2G_B2C_MIXED"]);

  if (B2B_GROUP.has(normalized)) return "b2b";
  if (B2C_GROUP.has(normalized)) return "b2c";
  if (normalized.includes("MIXED")) return "mixed";
  return "other";
}

function scoreAxis4CustomerMarketFit(currentCustomerMarket, targetCustomerMarket) {
  const currentRaw = normalizeAxis4CustomerMarketValue(currentCustomerMarket);
  const targetRaw = normalizeAxis4CustomerMarketValue(targetCustomerMarket);

  if (!currentRaw || !targetRaw) {
    return {
      score: null,
      fit: "neutral",
    };
  }

  if (currentRaw === targetRaw) {
    return {
      score: 5,
      fit: "exact_match",
    };
  }

  const currentGroup = getAxis4CustomerMarketGroup(currentRaw);
  const targetGroup = getAxis4CustomerMarketGroup(targetRaw);

  if (currentGroup && targetGroup && currentGroup === targetGroup && currentGroup !== "mixed") {
    return {
      score: 4,
      fit: "broad_group_match",
    };
  }

  if (currentGroup === "mixed" || targetGroup === "mixed") {
    return {
      score: 3,
      fit: "mixed_partial",
    };
  }

  return {
    score: 1,
    fit: "mismatch",
  };
}

function scoreAxis4BuyingMotionFit(currentBuyingMotion, targetBuyingMotion) {
  const currentRaw = toAxis4BuyingMotionValues(currentBuyingMotion);
  const targetRaw = toAxis4BuyingMotionValues(targetBuyingMotion);

  if (currentRaw.length === 0 || targetRaw.length === 0) {
    return {
      score: null,
      fit: "neutral",
      overlapRatio: null,
    };
  }

  const currentKeys = uniqueNormalizedStrings(currentRaw.map(normalizeAxis4BuyingMotionValue));
  const targetKeys = uniqueNormalizedStrings(targetRaw.map(normalizeAxis4BuyingMotionValue));

  if (currentKeys.length === 0 || targetKeys.length === 0) {
    return {
      score: null,
      fit: "neutral",
      overlapRatio: null,
    };
  }

  const currentKeySet = new Set(currentKeys);
  const overlapCount = targetKeys.filter((key) => currentKeySet.has(key)).length;
  const overlapRatio = targetKeys.length > 0 ? overlapCount / targetKeys.length : 0;

  if (overlapCount >= targetKeys.length && targetKeys.length === currentKeys.length) {
    return {
      score: 5,
      fit: "exact_overlap",
      overlapRatio,
    };
  }

  if (overlapRatio >= 0.7) {
    return {
      score: 4,
      fit: "high_overlap",
      overlapRatio,
    };
  }

  if (overlapRatio >= 0.4) {
    return {
      score: 3,
      fit: "partial_overlap",
      overlapRatio,
    };
  }

  if (overlapCount >= 1) {
    return {
      score: 2,
      fit: "light_overlap",
      overlapRatio,
    };
  }

  return {
    score: 1,
    fit: "mismatch",
    overlapRatio,
  };
}

function scoreAxis4DecisionStructureFit(currentDecisionStructure, targetDecisionStructure) {
  const currentRaw = toAxis4DecisionStructureValues(currentDecisionStructure);
  const targetRaw = toAxis4DecisionStructureValues(targetDecisionStructure);

  if (currentRaw.length === 0 || targetRaw.length === 0) {
    return {
      score: null,
      fit: "neutral",
      overlapRatio: null,
    };
  }

  const currentJoined = currentRaw.join(" ");
  const targetTokens = uniqueNormalizedStrings(
    targetRaw.flatMap((value) => value.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/))
  ).filter((token) => token.length >= 4);

  if (targetTokens.length === 0) {
    return {
      score: null,
      fit: "neutral",
      overlapRatio: null,
    };
  }

  const matchedCount = targetTokens.filter((token) => currentJoined.includes(token)).length;
  const overlapRatio = matchedCount / targetTokens.length;

  if (overlapRatio >= 0.75) {
    return {
      score: 5,
      fit: "strong_overlap",
      overlapRatio,
    };
  }

  if (overlapRatio >= 0.45) {
    return {
      score: 4,
      fit: "moderate_overlap",
      overlapRatio,
    };
  }

  if (overlapRatio >= 0.2) {
    return {
      score: 3,
      fit: "light_overlap",
      overlapRatio,
    };
  }

  if (matchedCount >= 1) {
    return {
      score: 2,
      fit: "trace_overlap",
      overlapRatio,
    };
  }

  return {
    score: 1,
    fit: "mismatch",
    overlapRatio,
  };
}

// ─── scoring constants ────────────────────────────────────────────────────────

const AXIS_RANGES = Object.freeze({
  jobStructure: { min: 15, max: 95 },
  industryContext: { min: 20, max: 90 },
  responsibilityScope: { min: 30, max: 80 },
  customerType: { min: 30, max: 85 },
  roleCharacter: { min: 30, max: 80 },
});

const FAMILY_DISTANCE_ADJUST = Object.freeze({
  same_family: 15,
  adjacent_family: 5,
  bridgeable_family: 0,
  distant_family: -5,
  unclear_family: 0,
});

const RESPONSIBILITY_SHIFT_SCORE = Object.freeze({
  similar: 80,
  down_or_narrower: 58,
  slightly_up: 52,
  meaningfully_up: 30,
});

const ROLE_WEIGHT_SHIFT_SCORE = Object.freeze({
  similar: 80,
  operator_to_coordinator: 55,
  coordinator_to_operator: 55,
  strategy_to_execution: 30,
  execution_to_strategy: 30,
});

// ─── band classifiers (rawScore-based, per-axis) ─────────────────────────────

function getAxis1Band(raw) {
  if (raw >= 88) return "high";
  if (raw >= 56) return "mid_high";
  if (raw >= 40) return "mid";
  if (raw >= 20) return "low";
  return "very_low";
}

function getAxis2Band(raw) {
  if (raw >= 80) return "high";
  if (raw >= 60) return "mid_high";
  if (raw >= 40) return "mid";
  if (raw >= 20) return "low";
  return "very_low";
}

function getAxis3Band(raw) {
  if (raw >= 75) return "high";
  if (raw >= 60) return "mid_high";
  if (raw >= 45) return "mid";
  if (raw >= 30) return "low";
  return "very_low";
}

function getAxis4Band(raw) {
  if (raw >= 80) return "high";
  if (raw >= 55) return "mid_high";
  if (raw >= 40) return "mid";
  return "low";
}

function getAxis5Band(raw) {
  if (raw >= 75) return "high";
  if (raw >= 50) return "mid_high";
  if (raw >= 35) return "mid";
  return "low";
}

// ─── axis scorers ─────────────────────────────────────────────────────────────

function scoreAxis1(signals) {
  const { min, max } = AXIS_RANGES.jobStructure;
  const { raw: rawAfterGuardrail, breakdown } = computeAxis1Raw(signals);
  const clusterUplift = getRegistryClusterUplift(signals, breakdown);
  const rawWithUplift = clamp(rawAfterGuardrail + clusterUplift.uplift, min, max);
  const weakUmbrellaBridge = applyAxis1WeakUmbrellaBridge(rawWithUplift, signals, breakdown);
  const finalRaw = clamp(weakUmbrellaBridge.raw, min, max);

  return {
    rawScore: finalRaw,
    displayScore: computeDisplayScore(finalRaw, min, max),
    band: getAxis1Band(finalRaw),
    breakdown: {
      ...breakdown,
      weakUmbrellaBridge,
      registryClusterUplift: clusterUplift.uplift,
      registryClusterUpliftReason: clusterUplift.reason,
    },
  };
}

function scoreAxis2(signals) {
  const {
    industryDistance,
    sameSector,
    sameSubSector,
    valueChainFit,
    coreContextFit,
    regulationBarrierFit,
    salesCycleFit,
  } = signals;
  const { min, max } = AXIS_RANGES.industryContext;

  let raw = industryDistance === "same" ? 62 : industryDistance === "adjacent" ? 44 : 26;

  if (valueChainFit === "strong_match") raw += 6;
  else if (valueChainFit === "partial_match") raw += 3;
  else if (valueChainFit === "light_match") raw += 1;
  else if (valueChainFit === "mismatch") raw -= 2;

  if (coreContextFit === "strong_match") raw += 5;
  else if (coreContextFit === "partial_match") raw += 2;
  else if (coreContextFit === "light_match") raw += 1;
  else if (coreContextFit === "mismatch") raw -= 1;

  if (regulationBarrierFit === "same_level") raw += 3;
  else if (regulationBarrierFit === "near_level") raw += 1;
  else if (regulationBarrierFit === "far_level") raw -= 2;

  if (sameSubSector) {
    raw += 12;
  } else if (sameSector) {
    raw += 4;
  }

  if (salesCycleFit === "same_cycle") {
    raw += 2;
  } else if (salesCycleFit === "far_cycle") {
    raw -= 1;
  }

  if (industryDistance === "adjacent" && valueChainFit === "mismatch" && coreContextFit === "mismatch") {
    raw = Math.min(raw, 50);
  }

  if (industryDistance === "cross") {
    raw = Math.min(raw, 48);
  } else if (industryDistance === "adjacent") {
    raw = Math.min(raw, 74);
  }

  raw = clamp(raw, min, max);
  return {
    rawScore: raw,
    displayScore: computeDisplayScore(raw, min, max),
    band: getAxis2Band(raw),
  };
}

function scoreAxis3(signals) {
  const {
    responsibilityShift,
    jobDistance,
    jobStructureBand,
    strongOverlapCount = 0,
    responsibilityOverlapCount = 0,
    mediumOverlapCount = 0,
  } = signals;
  const { min, max } = AXIS_RANGES.responsibilityScope;

  let raw = clamp(
    RESPONSIBILITY_SHIFT_SCORE[responsibilityShift] ?? RESPONSIBILITY_SHIFT_SCORE.slightly_up,
    min,
    max
  );
  const hasNoDirectJobOverlap =
    strongOverlapCount === 0 &&
    responsibilityOverlapCount === 0 &&
    mediumOverlapCount === 0;
  if (
    responsibilityShift === "similar" &&
    jobDistance === "cross" &&
    (jobStructureBand === "very_low" || jobStructureBand === "low") &&
    hasNoDirectJobOverlap
  ) {
    raw = Math.min(raw, 60);
    if (jobStructureBand === "very_low") {
      raw = Math.min(raw, 45);
    }
  }
  return {
    rawScore: raw,
    displayScore: computeDisplayScore(raw, min, max),
    band: getAxis3Band(raw),
  };
}

function scoreAxis4(signals) {
  const {
    currentCustomerMarket,
    targetCustomerMarket,
    currentBuyingMotion,
    targetBuyingMotion,
    currentDecisionStructure,
    targetDecisionStructure,
  } = signals;
  const { min, max } = AXIS_RANGES.customerType;

  const customerMarketFit = scoreAxis4CustomerMarketFit(
    currentCustomerMarket,
    targetCustomerMarket
  );
  const buyingMotionFit = scoreAxis4BuyingMotionFit(currentBuyingMotion, targetBuyingMotion);
  const decisionStructureFit = scoreAxis4DecisionStructureFit(
    currentDecisionStructure,
    targetDecisionStructure
  );

  let raw = 58;

  if (customerMarketFit.score === 5) raw = 80;
  else if (customerMarketFit.score === 4) raw = 64;
  else if (customerMarketFit.score === 3) raw = 52;
  else if (customerMarketFit.score === 1) raw = 40;

  if (buyingMotionFit.score === 5) raw += 5;
  else if (buyingMotionFit.score === 4) raw += 4;
  else if (buyingMotionFit.score === 3) raw += 2;
  else if (buyingMotionFit.score === 2) raw += 1;
  else if (buyingMotionFit.score === 1) raw -= 2;

  if (decisionStructureFit.score === 5) raw += 2;
  else if (decisionStructureFit.score === 4) raw += 1;
  else if (decisionStructureFit.score === 1) raw -= 1;

  raw = clamp(raw, min, max);
  return {
    rawScore: raw,
    displayScore: computeDisplayScore(raw, min, max),
    band: getAxis4Band(raw),
    breakdown: {
      customerMarketFit,
      buyingMotionFit,
      decisionStructureFit,
    },
  };
}

function scoreAxis5(signals) {
  const {
    roleWeightShift,
    missionTypeMatch,
    currentMissionType,
    targetMissionType,
    successMetricTypeMatch,
    currentSuccessMetricType,
    targetSuccessMetricType,
    horizonTypeMatch,
    currentHorizonType,
    targetHorizonType,
    outputTypeMatch,
    currentOutputType,
    targetOutputType,
  } = signals;
  const { min, max } = AXIS_RANGES.roleCharacter;

  const baseRaw = ROLE_WEIGHT_SHIFT_SCORE[roleWeightShift] ?? ROLE_WEIGHT_SHIFT_SCORE.similar;
  let adjustment = 0;

  if (missionTypeMatch) {
    adjustment += 4;
  } else if (currentMissionType && targetMissionType) {
    adjustment -= 1;
  }

  if (successMetricTypeMatch) {
    adjustment += 3;
  } else if (currentSuccessMetricType && targetSuccessMetricType) {
    adjustment -= 1;
  }

  if (horizonTypeMatch) {
    adjustment += 2;
  } else if (currentHorizonType && targetHorizonType) {
    adjustment -= 1;
  }

  if (outputTypeMatch) {
    adjustment += 1;
  }

  adjustment = clamp(adjustment, -3, 6);

  let raw = clamp(baseRaw + adjustment, min, max);
  if (
    signals.jobDistance === "cross" &&
    signals.jobStructureBand === "very_low" &&
    (signals.hasNoOverlap ?? false)
  ) {
    raw = Math.min(raw, 50);
  }
  return {
    rawScore: raw,
    displayScore: computeDisplayScore(raw, min, max),
    band: getAxis5Band(raw),
    breakdown: {
      baseRoleWeightShift: roleWeightShift,
      baseRaw,
      missionTypeMatch,
      successMetricTypeMatch,
      horizonTypeMatch,
      outputTypeMatch,
      adjustment,
    },
  };
}

// ─── main export ──────────────────────────────────────────────────────────────

export function buildAxisConnectivityPack(input = {}) {
  const currentJobId = toStr(input.currentJobId);
  const targetJobId = toStr(input.targetJobId);
  const currentIndustryId = toStr(input.currentIndustryId);
  const targetIndustryId = toStr(input.targetIndustryId);

  if (!currentJobId || !targetJobId || !currentIndustryId || !targetIndustryId) {
    return null;
  }

  const currentJobItem = getJobOntologyItemById(currentJobId);
  const targetJobItem = getJobOntologyItemById(targetJobId);
  const currentIndustryItem = getIndustryRegistryItemById(currentIndustryId);
  const targetIndustryItem = getIndustryRegistryItemById(targetIndustryId);

  if (!currentJobItem || !targetJobItem || !currentIndustryItem || !targetIndustryItem) {
    return null;
  }

  const classification = classifyTransition({ currentJobId, targetJobId, currentIndustryId, targetIndustryId });
  const { familyDistance, sharedFamiliesCount } = resolveJobAxisSignals(currentJobItem, targetJobItem);
  const axis2ResolvedSignals = resolveIndustryAxisSignals(currentIndustryItem, targetIndustryItem);
  const { sameSector, sameSubSector } = axis2ResolvedSignals;
  const { currentCustomerMarket, targetCustomerMarket, customerMarketFlip } =
    resolveCustomerMarketSignals(currentIndustryItem, targetIndustryItem);

  const axis1Signals = {
    jobDistance: classification.jobDistance,
    familyDistance: familyDistance ?? null,
    sharedFamiliesCount,
    currentJobLabel: toStr(currentJobItem?.label) ?? null,
    targetJobLabel: toStr(targetJobItem?.label) ?? null,
    currentStrongSignals: getPrimaryFamilyStrongSignals(currentJobItem),
    targetStrongSignals: getPrimaryFamilyStrongSignals(targetJobItem),
    currentResponsibilityHints: getJobResponsibilityHints(currentJobItem),
    targetResponsibilityHints: getJobResponsibilityHints(targetJobItem),
    currentMediumSignals: getPrimaryFamilyMediumSignals(currentJobItem),
    targetMediumSignals: getPrimaryFamilyMediumSignals(targetJobItem),
    strongSignalsWeightedStats: getWeightedSignalOverlapStats(currentJobItem, targetJobItem, "strongSignals"),
    mediumSignalsWeightedStats: getWeightedSignalOverlapStats(currentJobItem, targetJobItem, "mediumSignals"),
    ...resolveAxis1MetaSignals(currentJobItem, targetJobItem),
    ...resolveAxis1WeakUmbrellaBridgeSignals(currentJobItem, targetJobItem),
    registryBridgeSignals: resolveAxis1RegistryBridgeSignals(currentJobItem, targetJobItem),
  };
  const axis2Signals = {
    industryDistance: classification.industryDistance,
    ...axis2ResolvedSignals,
  };
  const axis3Signals = {
    responsibilityShift: classification.responsibilityShift,
    currentJobLabel: toStr(currentJobItem?.label) ?? null,
    targetJobLabel: toStr(targetJobItem?.label) ?? null,
  };
  const axis4Signals = {
    customerMarketFlip,
    currentCustomerMarket,
    targetCustomerMarket,
    currentJobLabel: toStr(currentJobItem?.label) ?? null,
    targetJobLabel: toStr(targetJobItem?.label) ?? null,
    sameSector,
    currentBuyingMotion: currentIndustryItem?.buyingMotion ?? null,
    targetBuyingMotion: targetIndustryItem?.buyingMotion ?? null,
    currentDecisionStructure: currentIndustryItem?.decisionStructure ?? null,
    targetDecisionStructure: targetIndustryItem?.decisionStructure ?? null,
  };
  const axis5Signals = {
    roleWeightShift: classification.roleWeightShift,
    ...resolveAxis5MetaSignals(currentJobItem, targetJobItem),
  };

  const axis1Score = scoreAxis1(axis1Signals);
  axis3Signals.jobDistance = classification.jobDistance;
  axis3Signals.industryDistance = classification.industryDistance;
  axis3Signals.jobStructureBand = axis1Score.band;
  axis3Signals.strongOverlapCount = axis1Score.breakdown?.strongSignals?.overlapCount ?? 0;
  axis3Signals.responsibilityOverlapCount = axis1Score.breakdown?.responsibilityHints?.overlapCount ?? 0;
  axis3Signals.mediumOverlapCount = axis1Score.breakdown?.mediumSignals?.overlapCount ?? 0;
  axis5Signals.jobDistance = classification.jobDistance;
  axis5Signals.jobStructureBand = axis1Score.band;
  axis5Signals.hasNoOverlap =
    axis3Signals.strongOverlapCount === 0 &&
    axis3Signals.responsibilityOverlapCount === 0 &&
    axis3Signals.mediumOverlapCount === 0;
  const axis2Score = scoreAxis2(axis2Signals);
  const axis3Score = scoreAxis3(axis3Signals);
  const axis4Score = scoreAxis4(axis4Signals);
  const axis5Score = scoreAxis5(axis5Signals);

  return {
    version: "v1",
    axes: {
      jobStructure: {
        label: "직무 구조 연결성",
        ...axis1Score,
        signals: axis1Signals,
        explanation: buildJobStructureExplanation(axis1Signals, axis1Score.band, axis1Score.breakdown),
      },
      industryContext: {
        label: "산업 맥락 연결성",
        ...axis2Score,
        signals: axis2Signals,
        explanation: buildIndustryContextExplanation(axis2Signals, axis2Score.band),
      },
      responsibilityScope: {
        label: "역할 범위 연결성",
        ...axis3Score,
        signals: axis3Signals,
        explanation: buildResponsibilityScopeExplanation(axis3Signals, axis3Score.band),
      },
      customerType: {
        label: "고객 유형 연결성",
        ...axis4Score,
        signals: axis4Signals,
        caveat: "고객 유형을 중심으로 보되, 구매 방식과 의사결정 구조 차이도 일부 함께 반영하는 보조 축입니다.",
        explanation: buildCustomerTypeExplanation(axis4Signals, axis4Score.band, axis4Score.breakdown),
      },
      roleCharacter: {
        label: "직무 성격 연결성",
        ...axis5Score,
        signals: axis5Signals,
        explanation: buildRoleCharacterExplanation(axis5Signals, axis5Score.band, axis5Score.breakdown),
      },
    },
  };
}

export default buildAxisConnectivityPack;
