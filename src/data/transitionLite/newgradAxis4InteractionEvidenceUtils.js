import {
  resolveNewgradStakeholderDisplayLabel,
  resolveNewgradStakeholderKey,
} from "./newgradStakeholderTaxonomyRegistry.js";

function toStr(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function toArr(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

const INTENSITY_WEIGHT = Object.freeze({
  support: 0.6,
  adjacent: 1,
  direct: 1.35,
  owner: 1.7,
});

const SOURCE_RELIABILITY_WEIGHT = Object.freeze({
  internship: 1.2,
  contract: 1.15,
  partTime: 1.05,
  extracurricular: 0.9,
  project: 0.85,
  unknown: 0.75,
});

function unique(items = []) {
  return [...new Set(toArr(items).map((item) => toStr(item)).filter(Boolean))];
}

function getSourceReliabilityWeight(sourceType) {
  return SOURCE_RELIABILITY_WEIGHT[toStr(sourceType)] || SOURCE_RELIABILITY_WEIGHT.unknown;
}

function normalizeIntensity(value) {
  const normalized = toStr(value);
  if (normalized === "owner") return "owner";
  if (normalized === "direct" || normalized === "high") return "direct";
  if (normalized === "adjacent") return "adjacent";
  return "support";
}

function resolveFallbackIntensityFromRow(row = {}) {
  const weight = toStr(row?.stakeholderInteractionWeight);
  if (weight === "high") return "direct";
  if (weight === "direct") return "direct";
  if (weight === "adjacent") return "adjacent";
  return "support";
}

function buildEvidenceItem(item = {}) {
  const stakeholderKeys = unique(toArr(item.stakeholderKeys).map((key) => resolveNewgradStakeholderKey(key))).slice(0, 2);
  const normalizedStakeholderKeys = stakeholderKeys.length > 0 ? stakeholderKeys : ["unknown_other"];
  const displayLabels = normalizedStakeholderKeys.map((key) => resolveNewgradStakeholderDisplayLabel(key));

  return {
    sourceType: toStr(item.sourceType) || "unknown",
    stakeholderKeys: normalizedStakeholderKeys,
    stakeholderLabels: displayLabels,
    interactionIntensity: normalizeIntensity(item.interactionIntensity),
    interactionCount: Math.max(1, Number(item.interactionCount || 1)),
    rawStakeholderLabel: toStr(item.rawStakeholderLabel),
    confidence: toStr(item.confidence) || "low",
    durationRank: Math.max(0, Number(item.durationRank || 0)),
    sourceLabel: toStr(item.sourceLabel),
    directEvidence: ["direct", "owner"].includes(normalizeIntensity(item.interactionIntensity)),
    reliabilityWeight: getSourceReliabilityWeight(item.sourceType),
  };
}

export function resolveAxis4EvidenceIntensity(evidenceItem = {}) {
  return normalizeIntensity(evidenceItem?.interactionIntensity);
}

export function collectNewgradAxis4InteractionEvidence(normalizedInput = {}) {
  const appendedEvidence = toArr(normalizedInput.axis4InteractionEvidenceList).map((item) => buildEvidenceItem(item));
  if (appendedEvidence.length > 0) return appendedEvidence;

  return toArr(normalizedInput.canonicalWorkRowsRaw).map((row) =>
    buildEvidenceItem({
      sourceType: toStr(row?.sourceKind) === "contractExperience" ? "contract" : toStr(row?.sourceKind) || "internship",
      stakeholderKeys: [
        toStr(row?.canonicalStakeholderId),
        toStr(row?.normalizedStakeholderLabel),
      ],
      interactionIntensity: resolveFallbackIntensityFromRow(row),
      interactionCount: 1,
      rawStakeholderLabel: toStr(row?.normalizedStakeholderLabel),
      confidence: row?.canonicalStakeholderId ? "high" : "medium",
      durationRank: Number(row?.durationRank || 0),
      sourceLabel: toStr(row?.sourceGroupLabel),
    })
  );
}

export function computeAxis4BaseInteractionSignals(evidenceList = []) {
  const safeEvidenceList = toArr(evidenceList).map((item) => buildEvidenceItem(item));
  const evidenceCount = safeEvidenceList.reduce((total, item) => total + Math.max(1, Number(item.interactionCount || 1)), 0);
  const reliableEvidenceCount = safeEvidenceList.filter((item) => item.reliabilityWeight >= 1).length;
  const directCount = safeEvidenceList.filter((item) => item.interactionIntensity === "direct").length;
  const ownerCount = safeEvidenceList.filter((item) => item.interactionIntensity === "owner").length;
  const adjacentCount = safeEvidenceList.filter((item) => item.interactionIntensity === "adjacent").length;
  const supportCount = safeEvidenceList.filter((item) => item.interactionIntensity === "support").length;
  const allStakeholderKeys = unique(safeEvidenceList.flatMap((item) => item.stakeholderKeys));
  const specificStakeholderKeys = allStakeholderKeys.filter((key) => !["unknown_other", "mixed_stakeholders"].includes(key));
  const repeatedStakeholderKeys = specificStakeholderKeys.filter((key) =>
    safeEvidenceList.filter((item) => item.stakeholderKeys.includes(key)).length >= 2
  );
  const hasProjectEvidence = safeEvidenceList.some((item) => item.sourceType === "project");
  const hasWorkEvidence = safeEvidenceList.some((item) => ["internship", "contract", "partTime"].includes(item.sourceType));
  const strongestIntensity = ownerCount > 0 ? "owner" : directCount > 0 ? "direct" : adjacentCount > 0 ? "adjacent" : "support";

  let basePoints = 20;
  if (evidenceCount >= 4) basePoints += 16;
  else if (evidenceCount >= 2) basePoints += 10;
  else if (evidenceCount >= 1) basePoints += 6;

  if (reliableEvidenceCount >= 2) basePoints += 10;
  else if (reliableEvidenceCount >= 1) basePoints += 6;

  if (ownerCount >= 1) basePoints += 18;
  else if (directCount >= 2) basePoints += 16;
  else if (directCount >= 1) basePoints += 12;
  else if (adjacentCount >= 2) basePoints += 7;
  else if (adjacentCount >= 1) basePoints += 4;

  if (specificStakeholderKeys.length >= 3) basePoints += 10;
  else if (specificStakeholderKeys.length >= 2) basePoints += 6;
  else if (specificStakeholderKeys.length >= 1) basePoints += 3;

  if (repeatedStakeholderKeys.length >= 1) basePoints += 6;
  if (safeEvidenceList.some((item) => item.durationRank >= 3)) basePoints += 5;
  if (hasProjectEvidence && hasWorkEvidence) basePoints += 5;

  return {
    evidenceList: safeEvidenceList,
    evidenceCount,
    reliableEvidenceCount,
    directCount,
    ownerCount,
    adjacentCount,
    supportCount,
    strongestIntensity,
    stakeholderKeys: allStakeholderKeys,
    stakeholderLabels: specificStakeholderKeys.map((key) => resolveNewgradStakeholderDisplayLabel(key)),
    repeatedStakeholderKeys,
    repeatedStakeholderLabels: repeatedStakeholderKeys.map((key) => resolveNewgradStakeholderDisplayLabel(key)),
    hasProjectEvidence,
    hasWorkEvidence,
    onlyInternalTeam:
      specificStakeholderKeys.length > 0
      && specificStakeholderKeys.every((key) => key === "internal_team"),
    onlyVagueEvidence:
      allStakeholderKeys.length > 0
      && allStakeholderKeys.every((key) => ["unknown_other", "mixed_stakeholders"].includes(key)),
    basePoints,
  };
}

export function computeAxis4JobRelevanceSignals(evidenceList = [], relevanceMeta = {}) {
  const safeEvidenceList = toArr(evidenceList).map((item) => buildEvidenceItem(item));
  const primary = unique(relevanceMeta.primary);
  const secondary = unique(relevanceMeta.secondary);
  const tertiary = unique(relevanceMeta.tertiary);
  const hitWeightByKey = new Map();

  for (const item of safeEvidenceList) {
    const intensityWeight = INTENSITY_WEIGHT[item.interactionIntensity] || 0.6;
    for (const key of item.stakeholderKeys) {
      if (!key || key === "unknown_other") continue;
      const current = hitWeightByKey.get(key) || 0;
      hitWeightByKey.set(key, Math.max(current, intensityWeight * item.reliabilityWeight));
    }
  }

  const primaryHitKeys = primary.filter((key) => hitWeightByKey.has(key));
  const secondaryHitKeys = secondary.filter((key) => hitWeightByKey.has(key));
  const tertiaryHitKeys = tertiary.filter((key) => hitWeightByKey.has(key));
  const missingPrimaryKeys = primary.filter((key) => !hitWeightByKey.has(key));

  let relevancePoints = 0;
  relevancePoints += Math.min(12, primaryHitKeys.reduce((sum, key) => sum + Math.min(4.5, hitWeightByKey.get(key) * 3.25), 0));
  relevancePoints += Math.min(6, secondaryHitKeys.reduce((sum, key) => sum + Math.min(2.5, hitWeightByKey.get(key) * 1.8), 0));
  relevancePoints += Math.min(3, tertiaryHitKeys.reduce((sum, key) => sum + Math.min(1.25, hitWeightByKey.get(key) * 1.1), 0));

  if (primaryHitKeys.length === 0 && safeEvidenceList.length > 0) relevancePoints -= 4;

  return {
    primaryHitKeys,
    secondaryHitKeys,
    tertiaryHitKeys,
    primaryHitLabels: primaryHitKeys.map((key) => resolveNewgradStakeholderDisplayLabel(key)),
    secondaryHitLabels: secondaryHitKeys.map((key) => resolveNewgradStakeholderDisplayLabel(key)),
    tertiaryHitLabels: tertiaryHitKeys.map((key) => resolveNewgradStakeholderDisplayLabel(key)),
    missingPrimaryKeys,
    missingPrimaryLabels: missingPrimaryKeys.map((key) => resolveNewgradStakeholderDisplayLabel(key)),
    relevancePoints,
    totalHitCount: primaryHitKeys.length + secondaryHitKeys.length + tertiaryHitKeys.length,
  };
}
