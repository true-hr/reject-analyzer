import { getJobOntologyItemById } from "../../data/job/jobOntology.index.js";
import { getIndustryRegistryItemById } from "../../data/industry/industryRegistry.index.js";
import { findSpecialTransitionDiagnostics } from "./specialTransitionDiagnostics.js";
import { getTransitionLiteRiskText } from "../../data/transitionLite/riskTextRegistry.js";
import { getTransitionLiteWhyFragmentsByRisk } from "../../data/transitionLite/whyFragmentRegistry.js";
import { getTransitionLiteHeroTemplate } from "../../data/transitionLite/heroTemplateRegistry.js";
import { getTransitionReadPatternCopyRegistry } from "../../data/transitionLite/transitionReadPatternCopyRegistry.js";
import { buildTransitionReadPatternResult } from "./buildTransitionReadPatternResult.js";
import { buildTransitionReadBlock, buildValidationReadBlock } from "./buildTransitionReadBlock.js";
import { classifyTransition } from "./classifyTransition.js";
import { buildTransitionLiteGenerationTags } from "./buildTransitionLiteGenerationTags.js";
import { INTERACTION_SUBCATEGORY_ADJACENT_ROLE_SHIFT } from "../../data/interaction/taxonomy/boundary_shift_hints/adjacent_role_shift.js";
import {
  buildTransitionLiteTargetJobRead,
  buildTransitionLiteTargetIndustryRead,
} from "../../data/transitionLite/targetReadAdapter.js";
import {
  getBuyingMotionHelpText,
  normalizeBuyingMotion,
} from "../../data/transitionLite/buyingMotionHelpRegistry.js";
import { TRANSITION_LITE2_SUPPORT_INDUSTRY_TRAITS_REGISTRY } from "../../data/transitionLite2/index.js";
import { buildJobContext } from "../adapters/buildJobContext.js";
import { buildIndustryContext } from "../adapters/buildIndustryContext.js";
import { buildTaxonomyContextPack } from "../shared/taxonomy/buildTaxonomyContextPack.js";
import { buildAxisConnectivityPack } from "../analysis/buildAxisConnectivityPack.js";
import { buildCareerTransitionCaseOverlays } from "../analysis/careerTransitionCaseOverlays.js";
import { resolveCareerTransitionArchetype } from "../analysis/careerTransitionArchetypeResolver.js";

const RISK_INDUSTRY_CONTEXT_SHIFT = "RISK_INDUSTRY_CONTEXT_SHIFT";
const RISK_JOB_EXPECTATION_SHIFT = "RISK_JOB_EXPECTATION_SHIFT";
const RISK_EXECUTION_LINK_CHECK = "RISK_EXECUTION_LINK_CHECK";
const RISK_STRATEGIC_VIEW_CHECK = "RISK_STRATEGIC_VIEW_CHECK";
const RISK_RESPONSIBILITY_EXPANSION = "RISK_RESPONSIBILITY_EXPANSION";
const RISK_SCOPE_REINTERPRETATION = "RISK_SCOPE_REINTERPRETATION";

function toStr(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function toArr(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalizeText(value) {
  return toStr(value).toLowerCase();
}

function normalizeIndustryLookupKey(value) {
  return toStr(value).replace(/^IND_/, "").toLowerCase();
}

function normalizeIndustrySectorKey(value) {
  return toStr(value).toLowerCase();
}

function uniqueStrings(items = []) {
  const seen = new Set();
  return toArr(items)
    .map((item) => toStr(item))
    .filter((item) => {
      if (!item) return false;
      const key = normalizeText(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function includesAny(source, candidates = []) {
  const text = normalizeText(source);
  return candidates.some((candidate) => text.includes(normalizeText(candidate)));
}

function makeEmptyVm() {
  return {
    heroSummary: "",
    topRisks: [],
    whyThisRead: [],
    strengths: [],
    transitionReadPatterns: {
      mainPatterns: [],
      supportPatterns: [],
    },
    transitionReadPatternResult: {
      mainPattern: "CROSS_FAMILY",
      supportPatterns: [],
      debug: {
        reason: "empty_vm",
      },
    },
    transitionReadBlock: {
      sectionTitle: "",
      intro: "",
      cards: [],
      meta: {
        mainPattern: "",
        displaySupportPatterns: [],
        currentJobLabel: "",
        targetJobLabel: "",
      },
    },
    validationReadBlock: null,
    targetJobRead: {
      title: "",
      summary: "",
      body: "",
      bullets: [],
      source: "",
    },
    targetIndustryRead: {
      label: "",
      title: "",
      summary: "",
      bullets: [],
    },
    whyThisReadSupportLine: null,
    industryTraitsAsset: null,
    buyingMotionPanel: null,
    transitionCompoundRead: null,
    axisPack: null,
  };
}

function getPrimaryFamily(jobItem) {
  const families = toArr(jobItem?.families);
  return families.length > 0 && families[0] && typeof families[0] === "object" ? families[0] : null;
}

function getPrimaryRole(jobItem) {
  const roles = toArr(jobItem?.roles);
  return roles.length > 0 && roles[0] && typeof roles[0] === "object" ? roles[0] : null;
}

function getJobResponsibilityHints(jobItem) {
  return toArr(jobItem?.roles).flatMap((role) => toArr(role?.responsibilityHints));
}

function getJobLevelHints(jobItem) {
  return toArr(jobItem?.roles).flatMap((role) => toArr(role?.levelHints));
}

function makeBulletList(...groups) {
  return uniqueStrings(groups.flatMap((group) => toArr(group)).map((item) => toStr(item))).filter(Boolean);
}

function resolveIndustryTraitsText(value, label) {
  const text = toStr(value);
  if (!text) return "";
  return text
    .replace(/\{label\}/gi, toStr(label))
    .replace(/\{[^}]+\}/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveIndustryTraitsList(values, label) {
  return uniqueStrings(
    toArr(values)
      .map((item) => resolveIndustryTraitsText(item, label))
      .filter(Boolean)
  );
}

function isMatchingIndustryTraitsKey(candidateKey, lookupKey) {
  const normalizeIndustryTraitsAliasKey = (value) =>
    normalizeIndustryLookupKey(value)
      .replace(/_association_group$/, "_association_organization")
      .replace(/_medical_devices$/, "_medical_device")
      .replace(/_hospital_medical_services$/, "_hospital_medical_service")
      .replace(/_pharmaceuticals$/, "_pharma")
      .replace(/_three_pl_/, "_3pl_")
      .replace(/_warehousing_fulfillment$/, "_warehouse_fulfillment")
      .replace(/_ocean_air_forwarding$/, "_shipping_air_forwarding");
  const normalizedCandidateKey = normalizeIndustryTraitsAliasKey(candidateKey);
  const normalizedLookupKey = normalizeIndustryTraitsAliasKey(lookupKey);

  if (!normalizedCandidateKey || !normalizedLookupKey) return false;
  if (normalizedCandidateKey === normalizedLookupKey) return true;
  if (`${normalizedCandidateKey}_services` === normalizedLookupKey) return true;
  if (normalizedCandidateKey === `${normalizedLookupKey}_services`) return true;
  return false;
}

function getIndustryTraitsAsset(targetIndustryItem, targetIndustryContext) {
  const lookupKey = normalizeIndustryLookupKey(
    targetIndustryItem?.id || targetIndustryContext?.id
  );
  const sectorKey = normalizeIndustrySectorKey(
    targetIndustryItem?.sector || targetIndustryContext?.sector
  );

  if (!lookupKey || !sectorKey) return null;

  const registry = TRANSITION_LITE2_SUPPORT_INDUSTRY_TRAITS_REGISTRY?.[sectorKey] || null;
  const matchedItem = toArr(registry?.items).find(
    (item) => isMatchingIndustryTraitsKey(item?.industryKey, lookupKey)
  );

  if (!matchedItem) return null;

  const resolvedLabel =
    resolveIndustryTraitsText(matchedItem?.label, targetIndustryItem?.label) ||
    toStr(targetIndustryItem?.label);

  return {
    id: toStr(matchedItem?.id),
    industryKey: toStr(matchedItem?.industryKey),
    label: resolvedLabel,
    summaryTemplate: resolveIndustryTraitsText(matchedItem?.summaryTemplate, resolvedLabel),
    whyIndustryMatters: resolveIndustryTraitsList(matchedItem?.whyIndustryMatters, resolvedLabel),
    businessStructure: resolveIndustryTraitsList(matchedItem?.businessStructure, resolvedLabel),
    customerStructure: resolveIndustryTraitsList(matchedItem?.customerStructure, resolvedLabel),
    operatingLanguage: resolveIndustryTraitsList(matchedItem?.operatingLanguage, resolvedLabel),
    problemTypes: resolveIndustryTraitsList(matchedItem?.problemTypes, resolvedLabel),
    evaluationCriteria: resolveIndustryTraitsList(matchedItem?.evaluationCriteria, resolvedLabel),
    jobShiftPoints: resolveIndustryTraitsList(matchedItem?.jobShiftPoints, resolvedLabel),
    transitionInterpretationPoints: resolveIndustryTraitsList(matchedItem?.transitionInterpretationPoints, resolvedLabel),
    keywords: resolveIndustryTraitsList(matchedItem?.keywords, resolvedLabel),
    source: "support_industry_traits.raw.v1",
    version: "transitionLite2.raw.v1",
  };
}


function validateTransitionLiteInput(payload = {}) {
  const input = {
    currentJobId: toStr(payload?.currentJobId),
    currentIndustryId: toStr(payload?.currentIndustryId),
    targetJobId: toStr(payload?.targetJobId),
    targetIndustryId: toStr(payload?.targetIndustryId),
  };

  const isValid = Boolean(
    input.currentJobId &&
    input.currentIndustryId &&
    input.targetJobId &&
    input.targetIndustryId
  );

  return {
    ok: isValid,
    input,
  };
}

function resolveTransitionLiteAssets(input) {
  const currentJobItem = getJobOntologyItemById(input.currentJobId);
  const targetJobItem = getJobOntologyItemById(input.targetJobId);
  const currentIndustryItem = getIndustryRegistryItemById(input.currentIndustryId);
  const targetIndustryItem = getIndustryRegistryItemById(input.targetIndustryId);

  if (!currentJobItem || !targetJobItem || !currentIndustryItem || !targetIndustryItem) {
    return {
      ok: false,
      input,
    };
  }

  return {
    ok: true,
    input,
    currentJobItem,
    targetJobItem,
    currentIndustryItem,
    targetIndustryItem,
    currentJob: buildJobContext(currentJobItem),
    targetJob: buildJobContext(targetJobItem),
    currentIndustry: buildIndustryContext(currentIndustryItem),
    targetIndustry: buildIndustryContext(targetIndustryItem),
  };
}

function getJobRelationAdjacency(currentJob, targetJob) {
  return Boolean(
    (
      toArr(currentJob?.relatedRoles).includes(targetJob?.roleFamily) ||
      toArr(currentJob?.transitionHints).includes(targetJob?.roleFamily) ||
      toArr(targetJob?.relatedRoles).includes(currentJob?.roleFamily) ||
      toArr(targetJob?.transitionHints).includes(currentJob?.roleFamily)
    )
  );
}

function takeFirstNonEmptyText(value) {
  if (typeof value === "string") return toStr(value);
  if (Array.isArray(value)) {
    for (const item of value) {
      const text = takeFirstNonEmptyText(item);
      if (text) return text;
    }
  }
  return "";
}

function takeLeadingSentence(value) {
  const text = toStr(value);
  if (!text) return "";
  const matched = text.match(/[^.!?]+[.!?]?/);
  return toStr(matched?.[0] || text);
}

function takeFirstMeaningfulSentence(value) {
  return takeLeadingSentence(value).replace(/\s+/g, " ").trim();
}

function takeArrayItems(value, limit = 1) {
  return toArr(value)
    .map((item) => toStr(item).replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, Math.max(1, limit));
}

function formatComparisonValue(value, { maxItems = 1, sentenceMode = "full" } = {}) {
  if (typeof value === "string") {
    return sentenceMode === "first"
      ? takeLeadingSentence(value)
      : toStr(value);
  }

  if (!Array.isArray(value)) {
    return "";
  }

  const items = value
    .map((item) => toStr(item))
    .filter(Boolean)
    .slice(0, Math.max(1, maxItems));

  if (items.length === 0) return "";
  if (sentenceMode === "first") {
    return takeLeadingSentence(items[0]);
  }
  return items.join(" / ");
}

// --- Row fit scoring helpers (phase 1) ---

function fitScoreToBand(score) {
  if (!Number.isFinite(score)) return null;
  if (score >= 4) return "높음";
  if (score >= 3) return "보통";
  return "낮음";
}

function scoreJobKeyOutputsFit(currentJobItem, targetJobItem, classification) {
  const jobDistance = toStr(classification?.jobDistance);
  const roleWeightShift = toStr(classification?.roleWeightShift);
  const currentSignals = toArr(getPrimaryFamily(currentJobItem)?.strongSignals).map(normalizeText);
  const targetSignals = toArr(getPrimaryFamily(targetJobItem)?.strongSignals).map(normalizeText);
  const currentHints = getJobResponsibilityHints(currentJobItem).map(normalizeText);
  const targetHints = getJobResponsibilityHints(targetJobItem).map(normalizeText);

  const signalSet = new Set([...currentSignals, ...currentHints]);
  const targetAll = [...targetSignals, ...targetHints].filter(Boolean);
  const overlapCount = targetAll.filter((t) => signalSet.has(t)).length;
  const overlapRatio = targetAll.length > 0 ? overlapCount / targetAll.length : 0;

  if (jobDistance === "same") return overlapRatio >= 0.5 ? 5 : 4;
  if (jobDistance === "adjacent") return roleWeightShift === "similar" || overlapRatio >= 0.3 ? 3 : 2;
  return 2;
}

function scoreJobScopeFit(classification) {
  const responsibilityShift = toStr(classification?.responsibilityShift);
  const jobDistance = toStr(classification?.jobDistance);
  if (responsibilityShift === "similar") {
    if (jobDistance === "same") return 5;
    if (jobDistance === "adjacent") return 3;
    return 2;
  }
  if (responsibilityShift === "slightly_up") return 3;
  if (responsibilityShift === "meaningfully_up") return 2;
  if (responsibilityShift === "down_or_narrower") return jobDistance === "same" ? 4 : 3;
  return 3;
}

function getIndustryRegulationLevel(industry) {
  const raw = toStr(takeFirstNonEmptyText(industry?.regulationBarrier)).toUpperCase();
  if (raw.startsWith("HIGH")) return "HIGH";
  if (raw.startsWith("MEDIUM")) return "MEDIUM";
  if (raw.startsWith("LOW")) return "LOW";
  return "";
}

function getIndustrySectorKey(industry) {
  return toStr(
    takeFirstNonEmptyText(
      industry?.category ||
      industry?.sector ||
      industry?.industryCategory ||
      industry?.parentCategory ||
      industry?.domain ||
      industry?.id
    )
  ).toLowerCase();
}

function isMeaningfullyDifferentRegulatedCustomerContext(currentIndustry, targetIndustry) {
  const currentSector = getIndustrySectorKey(currentIndustry);
  const targetSector = getIndustrySectorKey(targetIndustry);

  if (!currentSector || !targetSector || currentSector === targetSector) return false;

  const currentRegulation = getIndustryRegulationLevel(currentIndustry);
  const targetRegulation = getIndustryRegulationLevel(targetIndustry);

  const regulated = new Set(["MEDIUM", "HIGH"]);
  if (!regulated.has(currentRegulation) || !regulated.has(targetRegulation)) return false;
  if (currentRegulation !== "HIGH" && targetRegulation !== "HIGH") return false;

  return true;
}

function scoreIndustryCustomerStructureFit(currentIndustry, targetIndustry) {
  const B2B_GROUP = new Set(["B2B", "B2G", "B2B_B2G_MIXED"]);
  const B2C_GROUP = new Set(["B2C", "B2C_B2G_B2B_MIXED", "B2G_B2C_MIXED"]);
  const currentRaw = toStr(takeFirstNonEmptyText(currentIndustry?.customerMarket));
  const targetRaw = toStr(takeFirstNonEmptyText(targetIndustry?.customerMarket));
  if (!currentRaw || !targetRaw) return null;
  let baseScore = 1;
  if (currentRaw === targetRaw) {
    baseScore = 5;
  } else if (B2B_GROUP.has(currentRaw) && B2B_GROUP.has(targetRaw)) {
    baseScore = 4;
  } else if (B2C_GROUP.has(currentRaw) && B2C_GROUP.has(targetRaw)) {
    baseScore = 4;
  } else if (currentRaw.includes("MIXED") || targetRaw.includes("MIXED")) {
    baseScore = 3;
  }

  const getCustomerStructureSupportLines = (industry) =>
    toArr(getIndustryTraitsAsset(industry, industry)?.customerStructure)
      .map((item) => toStr(item))
      .filter(Boolean);

  const extractCustomerStructureTokens = (lines) => {
    const GENERIC_EXCLUSION = new Set([
      "고객구조",
      "고객군",
      "이해관계자",
      "최종고객",
      "최종사용자",
      "실무적으로",
      "실무에서는",
      "실무에서",
      "중요합니다",
      "중요한",
      "중요하며",
      "구조입니다",
      "함께",
      "작동하는",
      "복합적인",
      "복합",
      "여러",
      "중심",
      "포함",
    ]);

    const seen = new Set();
    return lines
      .flatMap((line) => line.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/))
      .map((token) => normalizeText(token).replace(/\s+/g, ""))
      .filter((token) => token.length >= 4 && !GENERIC_EXCLUSION.has(token))
      .filter((token) => {
        if (seen.has(token)) return false;
        seen.add(token);
        return true;
      });
  };

  const currentSupportLines = getCustomerStructureSupportLines(currentIndustry);
  const targetSupportLines = getCustomerStructureSupportLines(targetIndustry);
  if (currentSupportLines.length === 0 || targetSupportLines.length === 0) {
    return baseScore;
  }

  const currentTokens = extractCustomerStructureTokens(currentSupportLines);
  const targetTokens = extractCustomerStructureTokens(targetSupportLines);
  if (currentTokens.length === 0 || targetTokens.length === 0) {
    return baseScore;
  }

  const currentJoined = normalizeText(currentSupportLines.join(" "));
  const targetJoined = normalizeText(targetSupportLines.join(" "));
  const currentMatched = currentTokens.filter((token) => targetJoined.includes(token)).length;
  const targetMatched = targetTokens.filter((token) => currentJoined.includes(token)).length;
  const overlapRatio =
    (currentMatched + targetMatched) / (currentTokens.length + targetTokens.length);

  let finalScore = baseScore;

  if (baseScore === 1 && overlapRatio >= 0.18 && (currentMatched >= 1 || targetMatched >= 1)) {
    finalScore = 2;
  } else if (baseScore === 3 && overlapRatio >= 0.45 && currentMatched >= 2 && targetMatched >= 2) {
    finalScore = 4;
  }

  if (isMeaningfullyDifferentRegulatedCustomerContext(currentIndustry, targetIndustry)) {
    finalScore = Math.min(finalScore, 3);
  }

  return finalScore;
}

function scoreIndustryBuyingMotionFit(currentIndustry, targetIndustry) {
  const currentRaw = toBuyingMotionRawValues(currentIndustry?.buyingMotion);
  const targetRaw = toBuyingMotionRawValues(targetIndustry?.buyingMotion);
  if (currentRaw.length === 0 || targetRaw.length === 0) return null;
  const normalizeKey = (r) => normalizeBuyingMotion(r) || toStr(r).split(":")[0].trim().toLowerCase();
  const currentKeys = new Set(currentRaw.map(normalizeKey));
  const targetKeys = targetRaw.map(normalizeKey);
  const matchCount = targetKeys.filter((k) => currentKeys.has(k)).length;
  if (matchCount >= targetKeys.length && targetKeys.length === currentRaw.length) return 5;
  if (targetKeys.length > 0 && matchCount / targetKeys.length >= 0.7) return 4;
  if (targetKeys.length > 0 && matchCount / targetKeys.length >= 0.4) return 3;
  if (matchCount >= 1) return 2;
  return 1;
}

function scoreIndustryDecisionStructureFit(currentIndustry, targetIndustry, classification) {
  // decisionStructure can be a string or array depending on industry data; normalize both
  const toDecisionArr = (v) =>
    Array.isArray(v) ? v.filter(Boolean) : (toStr(v) ? [toStr(v)] : []);
  const currentRaw = toDecisionArr(currentIndustry?.decisionStructure).map(normalizeText).filter(Boolean);
  const targetRaw = toDecisionArr(targetIndustry?.decisionStructure).map(normalizeText).filter(Boolean);
  if (currentRaw.length === 0 || targetRaw.length === 0) return null;
  const currentJoinedText = currentRaw.join(" ");
  // adjacent floor: sentence-form decisionStructure values rarely produce exact overlap even for
  // structurally similar adjacent industries; apply floor of 2 to avoid over-penalizing adjacency.
  // cross industries with genuine disconnect remain at 1.
  const adjacentFloor = toStr(classification?.industryDistance) === "adjacent" ? 2 : 1;
  const GENERIC_EXCLUSION = new Set([
    "중요함","중요하다","구조가","구조는","결정이","결정은",
    "과정이","과정은","운영이","운영은","성과가","성과는",
  ]);
  const targetTokens = targetRaw
    .flatMap((s) => s.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/))
    .filter((t) => t.length >= 4 && !GENERIC_EXCLUSION.has(t));
  if (targetTokens.length === 0) return adjacentFloor;
  const matchedCount = targetTokens.filter((t) => currentJoinedText.includes(t)).length;
  const ratio = matchedCount / targetTokens.length;
  if (ratio >= 0.8) return 5;
  if (ratio >= 0.5) return 4;
  if (ratio >= 0.25) return 3;
  if (ratio >= 0.1) return 2;
  return adjacentFloor;
}

function scoreJobCoreRoleFit(classification) {
  const jobDistance = toStr(classification?.jobDistance);
  const roleWeightShift = toStr(classification?.roleWeightShift);
  if (jobDistance === "same") return roleWeightShift === "similar" ? 5 : 4;
  if (jobDistance === "adjacent") return roleWeightShift === "similar" ? 3 : 2;
  return 2;
}

function scoreJobDecisionCriteriaFit(currentJobItem, targetJobItem, classification) {
  const jobDistance = toStr(classification?.jobDistance);
  const currentSet = new Set([
    ...toArr(getPrimaryFamily(currentJobItem)?.boundarySignals).map(normalizeText),
    ...getJobLevelHints(currentJobItem).map(normalizeText),
  ]);
  const targetAll = [
    ...toArr(getPrimaryFamily(targetJobItem)?.boundarySignals).map(normalizeText),
    ...getJobLevelHints(targetJobItem).map(normalizeText),
  ].filter(Boolean);
  const overlapRatio = targetAll.length > 0 ? targetAll.filter((t) => currentSet.has(t)).length / targetAll.length : 0;
  if (jobDistance === "same") return overlapRatio >= 0.3 ? 5 : 4;
  if (jobDistance === "adjacent") return overlapRatio >= 0.15 ? 3 : 2;
  return 2;
}

function scoreIndustryOperatingContextFit(currentIndustry, targetIndustry, classification) {
  // coreContext can be a string or array depending on industry data; normalize both
  const toCtxArr = (v) =>
    Array.isArray(v) ? v.filter(Boolean) : (toStr(v) ? [toStr(v)] : []);
  if (!toCtxArr(currentIndustry?.coreContext).length) return null;
  if (!toCtxArr(targetIndustry?.coreContext).length) return null;
  const industryDistance = toStr(classification?.industryDistance);
  if (industryDistance === "same") return 5;
  if (industryDistance === "adjacent") return 3;
  // cross: allow limited uplift when coreContext tokens meaningfully overlap
  const toCtxTokenSet = (ctx) => {
    const tokens = new Set();
    for (const s of toCtxArr(ctx)) {
      for (const t of normalizeText(s).replace(/[^\p{L}\p{N}\s]/gu, "").split(/\s+/)) {
        if (t.length >= 3) tokens.add(t);
      }
    }
    return tokens;
  };
  const currentTokens = toCtxTokenSet(currentIndustry.coreContext);
  const targetTokens = [...toCtxTokenSet(targetIndustry.coreContext)];
  const overlapRatio = targetTokens.length > 0
    ? targetTokens.filter((t) => currentTokens.has(t)).length / targetTokens.length
    : 0;
  return overlapRatio >= 0.25 ? 3 : 2;
}

// --- end row fit scoring helpers ---

function toBuyingMotionRawValues(value) {
  if (Array.isArray(value)) {
    return uniqueStrings(value);
  }

  const text = toStr(value);
  if (!text) return [];
  if (text.includes(":")) {
    return [text];
  }

  if (text.includes(",")) {
    return uniqueStrings(text.split(",").map((item) => toStr(item)));
  }

  return [text];
}

function buildBuyingMotionPanelSection(industry) {
  const rawValues = toBuyingMotionRawValues(industry?.buyingMotion);
  const items = rawValues.map((raw) => {
    const helpItem = getBuyingMotionHelpText(raw);
    return {
      raw,
      normalizedKey: normalizeBuyingMotion(raw),
      displayLabel: raw,
      shortDescription: helpItem?.shortDescription || "",
      category: helpItem?.category || "",
    };
  });

  return {
    label: toStr(industry?.label),
    rawValues,
    items,
  };
}

function buildBuyingMotionPanel(currentIndustry, targetIndustry) {
  const current = buildBuyingMotionPanelSection(currentIndustry);
  const target = buildBuyingMotionPanelSection(targetIndustry);
  const visible = current.rawValues.length > 0 || target.rawValues.length > 0;

  if (!visible) return null;

  return {
    visible,
    title: "구매/도입 방식 읽는 법",
    intro: "같은 업무라도 산업에 따라 실제 구매가 일어나는 방식이 달라집니다.",
    current,
    target,
  };
}

function toDecisionStructureRawValues(value) {
  const items = Array.isArray(value) ? value : [value];
  return uniqueStrings(
    items.flatMap((item) => {
      const text = toStr(item);
      if (!text) return [];
      if (text.includes(":")) return [text];
      if (text.includes(",")) {
        return text.split(",").map((part) => toStr(part)).filter(Boolean);
      }
      return [text];
    })
  );
}

function normalizeDecisionStructureText(raw) {
  const text = toStr(raw);
  return text.replace(/\s+/g, " ").trim();
}

const DECISION_STRUCTURE_BUCKET_OVERRIDE_RULES = Object.freeze([
  {
    pattern: /(활성화|재계약|좌석 확대|매출 성과)/,
    bucket: "unmatched",
    reason: "mixed_or_context",
  },
  {
    pattern: /(공모|용역|위탁|정산 구조)/,
    bucket: "unmatched",
    reason: "mixed_or_context",
  },
  {
    pattern: /(규제·보안 승인 구조|보안 검토와 내부 승인 절차)/,
    bucket: "approvalFlow",
  },
  {
    pattern: /(함께 검토하며 비용, 안정성, 전환 리스크, SLA 준수 가능성을 본다)/,
    bucket: "reviewers",
  },
  {
    pattern: /(함께 보고 성과지표와 제안 퀄리티를 평가한다)/,
    bucket: "reviewers",
  },
  {
    pattern: /(함께 검토하며 채용 성공률, 운영 신뢰도, 커뮤니케이션 품질을 중시한다)/,
    bucket: "reviewers",
  },
  {
    pattern: /(함께 검토하며 단가, 서비스 범위, 전환 안정성, KPI 달성 가능성이 핵심이다)/,
    bucket: "reviewers",
  },
  {
    pattern: /(함께 검토하며 ROI, 구축 난이도, 현업 정착 가능성이 중요하다)/,
    bucket: "reviewers",
  },
  {
    pattern: /(함께 검토한다|기준으로 판단한다)/,
    match: /(의료진|병원|약사|행정|원무|SCM|물류|구매|무역|생산계획|브랜드 담당|고객사|HRD|조직장|교육 담당자|개인 고객|공공기관)/,
    bucket: "reviewers",
  },
  {
    pattern: /(함께 운영 의사결정에 영향을 준다)/,
    match: /(의료진|진료과|행정|원무|경영진|심사·보험|공공 규제 체계)/,
    bucket: "reviewers",
  },
  {
    pattern: /(함께 판단 구조를 형성한다|복합적으로 영향을 미친다)/,
    match: /(투자자|규제기관|임상 파트너|생산 및 품질 조직|유통채널)/,
    bucket: "reviewers",
  },
  {
    pattern: /(사업 추진은 개발, 인허가, 금융, EPC, 운영, 정책 검토가 함께 작동함)/,
    bucket: "reviewers",
  },
]);

function applyDecisionStructureBucketOverride(raw) {
  const text = normalizeDecisionStructureText(raw);
  if (!text) return null;

  return (
    DECISION_STRUCTURE_BUCKET_OVERRIDE_RULES.find((rule) => {
      if (!rule.pattern.test(text)) return false;
      if (rule.match && !rule.match.test(text)) return false;
      return true;
    }) || null
  );
}

function buildDecisionStructureDisplayLabel(raw, bucket = "") {
  const text = normalizeDecisionStructureText(raw);
  if (!text) return "";

  if (bucket === "reviewers") {
    const firstChunk = toStr(text.split(/[:,-]/)[0]);
    if (firstChunk && firstChunk.length <= 24) return firstChunk;
    if (text.length <= 24) return text;
    return `${text.slice(0, 24).trim()}...`;
  }

  if (bucket === "approvalFlow") {
    if (/(인허가|대외 승인)/.test(text)) return "대외 승인 영향이 큼";
    if (/(내부 승인|내부 결재|결재|승인 절차)/.test(text)) return "내부 승인 절차가 중요함";
    if (/(위원회|이사회)/.test(text)) return "위원회·상위 승인 구조";
    if (/(예산|규정)/.test(text)) return "예산·규정 구조 영향";
    if (text.length <= 32) return text;
    return `${text.slice(0, 32).trim()}...`;
  }

  if (bucket === "decisionCriteria") {
    const criteriaMatch = text.match(
      /(성과지표와\s*[^.]+|비용[^.]+|ROI[^.]+|사업성[^.]+|가격경쟁력[^.]+|신뢰[^.]+|안정성[^.]+|리스크[^.]+|SLA[^.]+|정착 가능성[^.]+|품질[^.]+|분양성[^.]+)/i
    );
    if (criteriaMatch?.[1]) {
      const criteriaText = toStr(criteriaMatch[1]);
      if (criteriaText.length <= 28) return criteriaText;
      return `${criteriaText.slice(0, 28).trim()}...`;
    }
    if (text.length <= 28) return text;
    return `${text.slice(0, 28).trim()}...`;
  }

  const firstChunk = toStr(text.split(/[:,-]/)[0]);
  if (firstChunk && firstChunk.length <= 20) return firstChunk;
  if (text.length <= 20) return text;
  return `${text.slice(0, 20).trim()}...`;
}

function classifyDecisionStructureBucket(raw) {
  const text = normalizeDecisionStructureText(raw);
  if (!text) return { bucket: "unmatched", reason: "empty" };

  const override = applyDecisionStructureBucketOverride(text);
  if (override) {
    return {
      bucket: override.bucket,
      reason: override.reason || "override_rule",
    };
  }

  if (
    /(성과지표|비용|안정성|전환 리스크|리스크|SLA|ROI|사업성|가격경쟁력|가격 경쟁력|품질|정착 가능성|분양성|신뢰성|정확성|커뮤니케이션 품질|학습 효과|강사 적합성|제안 퀄리티|수치 증명|레퍼런스)/.test(text)
  ) {
    return { bucket: "decisionCriteria" };
  }

  if (
    /(승인|결재|의사결정|의결|단계|절차|위원회|이사회|인허가|예산|규정|대외 승인|내부 승인)/.test(text)
  ) {
    return { bucket: "approvalFlow" };
  }

  if (
    /(실사용 부서|팀 리더|구매|보안|IT|재무|법무|리스크|경영진|대표|투자자|금융기관|토지주|발주처|기관|담당자|부서|조직|의료진|병원|약사|행정|원무|심사·보험|HRD|조직장|고객사|브랜드 담당|영업 조직|SCM|물류|무역|생산계획)/.test(text)
  ) {
    return { bucket: "reviewers" };
  }

  if (/(도입을 검토|함께 검토|함께 관여|함께 들어옴)/.test(text)) {
    return { bucket: "reviewers" };
  }

  return { bucket: "unmatched", reason: "mixed_or_context" };
}

function buildDecisionStructureBucketItem(raw, bucket) {
  const label = buildDecisionStructureDisplayLabel(raw, bucket);
  const text = normalizeDecisionStructureText(raw);

  return {
    raw: text,
    label: label || text,
    sourceType:
      bucket === "reviewers"
        ? "actor"
        : bucket === "approvalFlow"
        ? "flow"
        : bucket === "decisionCriteria"
        ? "criteria"
        : "mixed",
  };
}

function bucketDecisionStructureRawValues(rawValues) {
  return rawValues.reduce(
    (acc, raw) => {
      const classification = classifyDecisionStructureBucket(raw);
      if (classification.bucket === "reviewers") {
        acc.reviewers.push(buildDecisionStructureBucketItem(raw, "reviewers"));
        return acc;
      }
      if (classification.bucket === "approvalFlow") {
        acc.approvalFlow.push(buildDecisionStructureBucketItem(raw, "approvalFlow"));
        return acc;
      }
      if (classification.bucket === "decisionCriteria") {
        acc.decisionCriteria.push(buildDecisionStructureBucketItem(raw, "decisionCriteria"));
        return acc;
      }

      acc.unmatched.push({
        raw: normalizeDecisionStructureText(raw),
        reason: classification.reason || "mixed_or_context",
      });
      return acc;
    },
    {
      reviewers: [],
      approvalFlow: [],
      decisionCriteria: [],
      unmatched: [],
    }
  );
}

function buildDecisionStructurePanelSection(industry) {
  const rawValues = toDecisionStructureRawValues(industry?.decisionStructure);
  const bucketed = bucketDecisionStructureRawValues(rawValues);

  return {
    label: toStr(industry?.label),
    rawValues,
    reviewers: bucketed.reviewers,
    approvalFlow: bucketed.approvalFlow,
    decisionCriteria: bucketed.decisionCriteria,
    unmatched: bucketed.unmatched,
  };
}

function buildDecisionStructurePanel(currentIndustry, targetIndustry) {
  const current = buildDecisionStructurePanelSection(currentIndustry);
  const target = buildDecisionStructurePanelSection(targetIndustry);
  const visible =
    current.reviewers.length > 0 ||
    current.approvalFlow.length > 0 ||
    current.decisionCriteria.length > 0 ||
    target.reviewers.length > 0 ||
    target.approvalFlow.length > 0 ||
    target.decisionCriteria.length > 0;

  if (!visible) return null;

  return {
    visible,
    title: "의사결정 구조 읽는 법",
    intro: "같은 업무라도 산업에 따라 누가 검토하고, 어떤 절차를 거치며, 무엇을 기준으로 판단하는지가 달라질 수 있습니다.",
    current,
    target,
  };
}

function toCustomerStructureRawValues(value) {
  const raw = toStr(value);
  return raw ? [raw] : [];
}

function buildCustomerStructureDisplayLabel(raw) {
  const text = toStr(raw);
  if (!text) return "";
  return getCustomerMarketDisplay(text, { mode: "short" }) || text;
}

function buildCustomerStructureShortDescription(raw, displayLabel) {
  const text = toStr(raw);
  if (!text) return "";
  const longText = getCustomerMarketDisplay(text, { mode: "long" });
  if (longText) return longText;
  if (displayLabel && displayLabel !== text) return text;
  return "";
}

function getCustomerStructureCategory(raw) {
  const text = toStr(raw).toUpperCase();
  if (!text) return "";
  if (text === "B2B") return "기업 고객";
  if (text === "B2C") return "소비자";
  if (text === "B2G") return "공공/기관";
  if (text.includes("MIXED")) return "혼합 구조";
  return "일반";
}

function buildCustomerStructurePanelSection(industry) {
  const rawValues = toCustomerStructureRawValues(industry?.customerMarket);
  const items = rawValues.map((raw) => {
    const displayLabel = buildCustomerStructureDisplayLabel(raw);
    return {
      raw,
      displayLabel: displayLabel || raw,
      shortDescription: buildCustomerStructureShortDescription(raw, displayLabel),
      category: getCustomerStructureCategory(raw),
    };
  });

  return {
    label: toStr(industry?.label),
    rawValues,
    items,
  };
}

function buildCustomerStructurePanel(currentIndustry, targetIndustry) {
  const current = buildCustomerStructurePanelSection(currentIndustry);
  const target = buildCustomerStructurePanelSection(targetIndustry);
  const visible = current.items.length > 0 || target.items.length > 0;

  if (!visible) return null;

  return {
    visible,
    title: "고객 구조 읽는 법",
    intro: "같은 업무라도 산업에 따라 주로 상대하는 고객군과 시장 구조가 달라질 수 있습니다.",
    current,
    target,
  };
}

function decodeUnicodeEscapeLiterals(value) {
  const text = toStr(value);
  if (!text || !/\\u[0-9a-fA-F]{4}/.test(text)) return text;
  try {
    return text.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
  } catch (_e) {
    return text;
  }
}

function normalizeOperatingContextText(raw) {
  const text = decodeUnicodeEscapeLiterals(toStr(raw));
  return text.replace(/\s+/g, " ").trim();
}

function classifyOperatingContextBucket(raw) {
  const text = normalizeOperatingContextText(raw);
  if (!text) return { bucket: "unmatched", reason: "empty" };

  if (/(수주|납기|사이클|리드타임|라이브 운영|출시 이후|반복 이용|변화 속도|프로젝트 단위|도입 사이클|업데이트.*성과|장기 운영|운영 주기|콘텐츠 업데이트|이벤트.*운영|서비스 주기|주기|장주기|라이프사이클|회전율|수요 예측|재고|반복 구매|반복 수주|반복 공급|반복 방문|히트작|성과 변동|매출 변동|CAPEX|갱신|거래량|변동성|대응 속도|흥행|작품|편성|제작|배급)/.test(text)) {
    return { bucket: "workRhythm" };
  }

  if (/(규제|인허가|허가와|약가|규정 준수|문서 신뢰|절차 정합|공공 책임|보안 요구|제도 적합|컴플라이언스|GMP|QA·|RA·|안전성 요구|인력 운영 제약|변화 저항|강한 규제|안전 기준|규격|품질 이슈|품질 편차|문서|추적성|실사|승인과|QA|공공성|인프라|대규모 시설|저작권|위생|Fraud|이상거래|내부통제|불완전판매|소비자보호|안전성|운영 조직 정합)/.test(text)) {
    return { bucket: "constraints" };
  }

  if (/(파이프라인|기술 검증|신뢰를 동시|운영 안정화|재계약|집행 품질|환자 안전|의료진 협업|임팩트|사업성|성과.*증명|증명해야|기여도로|핵심 지표|트랜잭션 규모|편의성과|협업 조율|IP|수익 전환|유통 채널|팬덤|사업화|수율|원가|공급 안정|직결|수치로|리포팅|역량|플랫폼|회수 구조|투자자|수익성|운영 안정성)/.test(text)) {
    return { bucket: "practicalFocus" };
  }

  return { bucket: "unmatched", reason: "too_abstract_or_overlap" };
}

function buildOperatingContextLabel(raw) {
  const text = normalizeOperatingContextText(raw);
  if (!text) return "";
  if (text.length <= 48) return text;
  return `${text.slice(0, 46).replace(/[·,.。]?\s*$/, "").trim()}…`;
}

function buildOperatingContextBucketItem(raw, bucket) {
  const text = normalizeOperatingContextText(raw);
  return {
    raw: text,
    label: buildOperatingContextLabel(text),
    sourceType: bucket,
  };
}

function bucketOperatingContextRawValues(rawValues) {
  return rawValues.reduce(
    (acc, raw) => {
      const classification = classifyOperatingContextBucket(raw);
      if (classification.bucket === "workRhythm") {
        acc.workRhythm.push(buildOperatingContextBucketItem(raw, "workRhythm"));
        return acc;
      }
      if (classification.bucket === "constraints") {
        acc.constraints.push(buildOperatingContextBucketItem(raw, "constraints"));
        return acc;
      }
      if (classification.bucket === "practicalFocus") {
        acc.practicalFocus.push(buildOperatingContextBucketItem(raw, "practicalFocus"));
        return acc;
      }
      acc.unmatched.push({
        raw: normalizeOperatingContextText(raw),
        reason: classification.reason || "too_abstract_or_overlap",
      });
      return acc;
    },
    { workRhythm: [], constraints: [], practicalFocus: [], unmatched: [] }
  );
}

function buildOperatingContextPanelSection(industry) {
  const rawArr = Array.isArray(industry?.coreContext)
    ? industry.coreContext
    : industry?.coreContext
      ? [industry.coreContext]
      : [];
  const rawValues = uniqueStrings(rawArr.map(toStr).filter(Boolean));
  const bucketed = bucketOperatingContextRawValues(rawValues);
  return {
    label: toStr(industry?.label),
    rawValues,
    workRhythm: bucketed.workRhythm,
    constraints: bucketed.constraints,
    practicalFocus: bucketed.practicalFocus,
    unmatched: bucketed.unmatched,
  };
}

function buildOperatingContextPanel(currentIndustry, targetIndustry) {
  const current = buildOperatingContextPanelSection(currentIndustry);
  const target = buildOperatingContextPanelSection(targetIndustry);
  const visible =
    current.workRhythm.length > 0 ||
    current.constraints.length > 0 ||
    current.practicalFocus.length > 0 ||
    target.workRhythm.length > 0 ||
    target.constraints.length > 0 ||
    target.practicalFocus.length > 0;
  if (!visible) return null;
  return {
    visible,
    title: "운영 맥락 읽는 법",
    intro: "같은 업무라도 산업에 따라 일이 굴러가는 리듬과 제약, 그리고 실무에서 먼저 챙겨야 하는 기준이 달라질 수 있습니다.",
    current,
    target,
  };
}

function collectJobOutputSignals(jobItem) {
  const family = getPrimaryFamily(jobItem);
  const signals = takeArrayItems(toArr(family?.strongSignals), 2);
  if (signals.length > 0) return signals.map(toStr).filter(Boolean);
  return takeArrayItems(getJobResponsibilityHints(jobItem), 2).map(toStr).filter(Boolean);
}

function buildJobScopePanel(currentJobItem, targetJobItem) {
  if (!currentJobItem || !targetJobItem) return null;
  const buildScopeSection = (jobItem) => {
    const directOwnership = takeArrayItems(getJobResponsibilityHints(jobItem), 2).map(toStr).filter(Boolean);
    const expandedResponsibility = takeArrayItems(getJobLevelHints(jobItem), 1).map(toStr).filter(Boolean);
    return {
      label: toStr(jobItem?.label),
      directOwnership,
      expandedResponsibility,
    };
  };
  const current = buildScopeSection(currentJobItem);
  const target = buildScopeSection(targetJobItem);
  if (
    current.directOwnership.length === 0 && current.expandedResponsibility.length === 0 &&
    target.directOwnership.length === 0 && target.expandedResponsibility.length === 0
  ) return null;
  return {
    visible: true,
    panelKind: "job_scope_2block",
    title: "책임 범위 읽는 법",
    intro: "같은 업무명이라도 어디까지 직접 책임지고, 어디까지 조율하는지는 다를 수 있습니다.",
    current,
    target,
  };
}

function collectJobDecisionCriteriaSignals(jobItem) {
  const family = getPrimaryFamily(jobItem);
  const boundary = takeArrayItems(toArr(family?.boundarySignals), 2);
  if (boundary.length > 0) return boundary.map((item) => takeFirstMeaningfulSentence(toStr(item))).filter(Boolean);
  return takeArrayItems(getJobLevelHints(jobItem), 1).map((item) => takeFirstMeaningfulSentence(toStr(item))).filter(Boolean);
}

function buildJobRoleSummaryPanel(currentJobItem, targetJobItem) {
  if (!currentJobItem || !targetJobItem) return null;
  const currentFamily = getPrimaryFamily(currentJobItem);
  const targetFamily = getPrimaryFamily(targetJobItem);
  const currentRole = getPrimaryRole(currentJobItem);
  const targetRole = getPrimaryRole(targetJobItem);
  const currentSummary = toStr(
    takeFirstMeaningfulSentence(currentRole?.summaryTemplate) ||
    takeFirstMeaningfulSentence(currentFamily?.summaryTemplate) ||
    takeArrayItems(toArr(currentFamily?.strongSignals), 1)[0] ||
    ""
  );
  const targetSummary = toStr(
    takeFirstMeaningfulSentence(targetRole?.summaryTemplate) ||
    takeFirstMeaningfulSentence(targetFamily?.summaryTemplate) ||
    takeArrayItems(toArr(targetFamily?.strongSignals), 1)[0] ||
    ""
  );
  if (!currentSummary && !targetSummary) return null;
  return {
    visible: true,
    panelKind: "job_role_summary",
    title: "핵심 역할 읽는 법",
    intro: "같은 직무군처럼 보여도 실제로 역할의 중심과 강점 포인트는 다를 수 있습니다.",
    current: {
      label: toStr(currentJobItem?.label),
      summary: currentSummary,
      supportingSignals: takeArrayItems(toArr(currentFamily?.strongSignals), 2).map(toStr).filter(Boolean),
    },
    target: {
      label: toStr(targetJobItem?.label),
      summary: targetSummary,
      supportingSignals: takeArrayItems(toArr(targetFamily?.strongSignals), 2).map(toStr).filter(Boolean),
    },
  };
}

function buildJobOutputsPanel(currentJobItem, targetJobItem) {
  if (!currentJobItem || !targetJobItem) return null;
  const buildSection = (jobItem) => {
    const family = getPrimaryFamily(jobItem);
    const strongSignals = takeArrayItems(toArr(family?.strongSignals), 2).map(toStr).filter(Boolean);
    const respHints = takeArrayItems(getJobResponsibilityHints(jobItem), 2).map(toStr).filter(Boolean);
    const primaryOutputs = strongSignals.length > 0 ? strongSignals : respHints;
    const performanceOutputs = strongSignals.length > 0 ? respHints : [];
    return { label: toStr(jobItem?.label), primaryOutputs, performanceOutputs };
  };
  const current = buildSection(currentJobItem);
  const target = buildSection(targetJobItem);
  if (
    current.primaryOutputs.length === 0 && current.performanceOutputs.length === 0 &&
    target.primaryOutputs.length === 0 && target.performanceOutputs.length === 0
  ) return null;
  return {
    visible: true,
    panelKind: "job_outputs_2block",
    title: "주요 기대 산출물 읽는 법",
    intro: "같은 직무라도 실제로 기대되는 결과물과 성과 출력은 다를 수 있습니다.",
    current,
    target,
  };
}

function buildJobDecisionCriteria2Panel(currentJobItem, targetJobItem) {
  if (!currentJobItem || !targetJobItem) return null;
  const buildSection = (jobItem) => {
    const family = getPrimaryFamily(jobItem);
    const boundary = takeArrayItems(toArr(family?.boundarySignals), 2).map((item) => takeFirstMeaningfulSentence(toStr(item))).filter(Boolean);
    const levelHints = takeArrayItems(getJobLevelHints(jobItem), 1).map((item) => takeFirstMeaningfulSentence(toStr(item))).filter(Boolean);
    const coreCriteria = boundary.length > 0 ? boundary : levelHints;
    const roleShiftSignals = boundary.length > 0 ? levelHints : [];
    return { label: toStr(jobItem?.label), coreCriteria, roleShiftSignals };
  };
  const current = buildSection(currentJobItem);
  const target = buildSection(targetJobItem);
  if (current.coreCriteria.length === 0 && target.coreCriteria.length === 0) return null;
  return {
    visible: true,
    panelKind: "job_decision_criteria_2block",
    title: "판단 기준 읽는 법",
    intro: "같은 역할처럼 보여도 실제로 중요하게 보는 기준과, 그 기준이 커질 때 가까워지는 역할 방향은 다를 수 있습니다.",
    current,
    target,
  };
}

function buildJobSignalListPanel({ title, intro, currentJobItem, targetJobItem, signalCollector }) {
  if (!currentJobItem || !targetJobItem) return null;
  const currentSignals = signalCollector(currentJobItem);
  const targetSignals = signalCollector(targetJobItem);
  if (currentSignals.length === 0 && targetSignals.length === 0) return null;
  return {
    visible: true,
    panelKind: "job_signal_list",
    title,
    intro,
    current: { label: toStr(currentJobItem?.label), signals: currentSignals },
    target: { label: toStr(targetJobItem?.label), signals: targetSignals },
  };
}

function getCustomerMarketDisplay(rawValue, options = {}) {
  const raw = toStr(rawValue);
  const mode = toStr(options?.mode) === "long" ? "long" : "short";
  const sector = toStr(options?.sector);

  if (!raw) return "";

  const mixedOverrides = {
    CONSTRUCTION_REAL_ESTATE_INFRA: {
      short: "다층 이해관계자 구조",
      long: "발주처, 시행 주체, 시공사 등 여러 이해관계자가 함께 얽힌 고객 구조입니다",
    },
    DISTRIBUTION_COMMERCE_CONSUMER_GOODS: {
      short: "유통·소비자 중심",
      long: "최종 소비자와 유통 채널, 리테일 바이어가 함께 중요한 고객 구조입니다",
    },
    ENERGY_ENVIRONMENT_PUBLIC_INFRA: {
      short: "공공·산업 수요 중심",
      long: "공공 발주와 산업 수요처가 함께 작동하는 프로젝트형 고객 구조입니다",
    },
    FINANCE_INSURANCE_FINTECH: {
      short: "기관·개인 고객 혼합",
      long: "법인 고객, 개인 고객, 제휴 파트너가 함께 얽히는 복합 고객 구조입니다",
    },
    HEALTHCARE_PHARMA_BIO: {
      short: "환자·의료기관 중심",
      long: "환자, 의료진, 병원, 유통 파트너가 함께 얽히는 고객 구조입니다",
    },
    IT_SOFTWARE_PLATFORM: {
      short: "기업·사용자 혼합",
      long: "최종 사용자와 도입 의사결정자, 운영 담당자가 함께 중요한 고객 구조입니다",
    },
    LOGISTICS_TRANSPORT_SUPPLY_CHAIN: {
      short: "기업·현장 운영 중심",
      long: "화주, 운영 조직, 물류 파트너가 함께 얽히는 다층 고객 구조입니다",
    },
    MANUFACTURING: {
      short: "법인·유통 고객 중심",
      long: "법인 고객과 유통 채널, 파트너사가 함께 중요한 고객 구조입니다",
    },
    MEDIA_CONTENT_EDUCATION: {
      short: "이용자·광고주 혼합",
      long: "이용자, 학습자, 광고주, 플랫폼 파트너가 함께 얽히는 고객 구조입니다",
    },
    PROFESSIONAL_B2B_SERVICES: {
      short: "기업 의사결정자 중심",
      long: "실무 담당자뿐 아니라 관리자, 임원, 발주 책임자가 함께 중요한 고객 구조입니다",
    },
    PUBLIC_ASSOCIATION_NONPROFIT: {
      short: "공공·회원·시민 혼합",
      long: "공공기관, 회원 조직, 시민 수요자가 함께 얽히는 고객 구조입니다",
    },
  };

  if (raw === "MIXED" && sector && mixedOverrides[sector]?.[mode]) {
    return mixedOverrides[sector][mode];
  }

  const baseMap = {
    B2B: {
      short: "기업 고객 중심",
      long: "기업 고객과 실무 담당자, 구매자, 의사결정자가 핵심인 고객 구조입니다",
    },
    B2C: {
      short: "일반 소비자 중심",
      long: "최종 소비자 경험과 수요 반응이 핵심인 고객 구조입니다",
    },
    B2G: {
      short: "공공기관 중심",
      long: "공공기관 발주와 승인 절차, 정책 맥락이 중요한 고객 구조입니다",
    },
    B2B2C: {
      short: "기업·소비자 연결",
      long: "중간 사업자와 최종 소비자가 함께 연결되는 고객 구조입니다",
    },
    MIXED: {
      short: "복합 고객 구조",
      long: "여러 고객군과 이해관계자가 함께 작동하는 복합 고객 구조입니다",
    },
    B2B_B2G_MIXED: {
      short: "기업·공공 혼합",
      long: "기업 고객과 공공 발주 주체가 함께 중요한 복합 고객 구조입니다",
    },
    B2G_B2B_B2C_MIXED: {
      short: "공공·기업·소비자 혼합",
      long: "공공기관, 기업 고객, 최종 소비자가 함께 얽히는 복합 고객 구조입니다",
    },
    B2C_B2G_B2B_MIXED: {
      short: "소비자·공공·기업 혼합",
      long: "최종 소비자, 공공기관, 기업 고객이 함께 작동하는 복합 고객 구조입니다",
    },
    B2G_B2C_MIXED: {
      short: "공공·소비자 혼합",
      long: "공공 서비스 수요자와 일반 소비자 접점이 함께 존재하는 고객 구조입니다",
    },
  };

  return baseMap[raw]?.[mode] || raw;
}

function buildJobExpectationComparisonTable(currentJobItem, targetJobItem, classification) {
  if (!currentJobItem || !targetJobItem) return null;

  const currentFamily = getPrimaryFamily(currentJobItem);
  const targetFamily = getPrimaryFamily(targetJobItem);
  const currentRole = getPrimaryRole(currentJobItem);
  const targetRole = getPrimaryRole(targetJobItem);
  const rows = [];
  const pushRow = (rowKey, label, currentValue, targetValue, fitMeta) => {
    if (!currentValue || !targetValue) return;
    const row = { rowKey, label, current: currentValue, target: targetValue };
    if (fitMeta && Number.isFinite(fitMeta.fitScore)) {
      row.fitScore = fitMeta.fitScore;
      if (fitMeta.fitBand) row.fitBand = fitMeta.fitBand;
    }
    rows.push(row);
  };

  const coreRoleFitScore = classification ? scoreJobCoreRoleFit(classification) : null;
  pushRow(
    "job_core_role",
    "핵심 역할",
    takeFirstMeaningfulSentence(currentRole?.summaryTemplate) ||
      takeFirstMeaningfulSentence(currentFamily?.summaryTemplate) ||
      takeArrayItems(currentFamily?.strongSignals, 1)[0] ||
      "",
    takeFirstMeaningfulSentence(targetRole?.summaryTemplate) ||
      takeFirstMeaningfulSentence(targetFamily?.summaryTemplate) ||
      takeArrayItems(targetFamily?.strongSignals, 1)[0] ||
      "",
    Number.isFinite(coreRoleFitScore) ? { fitScore: coreRoleFitScore, fitBand: fitScoreToBand(coreRoleFitScore) } : null
  );

  const currentStrongSignals = takeArrayItems(currentFamily?.strongSignals, 2);
  const targetStrongSignals = takeArrayItems(targetFamily?.strongSignals, 2);
  const keyOutputsFitScore = classification ? scoreJobKeyOutputsFit(currentJobItem, targetJobItem, classification) : null;
  pushRow(
    "job_key_outputs",
    "주요 기대 산출물",
    (currentStrongSignals.length > 0
      ? currentStrongSignals
      : takeArrayItems(getJobResponsibilityHints(currentJobItem), 2)).join(" / "),
    (targetStrongSignals.length > 0
      ? targetStrongSignals
      : takeArrayItems(getJobResponsibilityHints(targetJobItem), 2)).join(" / "),
    Number.isFinite(keyOutputsFitScore) ? { fitScore: keyOutputsFitScore, fitBand: fitScoreToBand(keyOutputsFitScore) } : null
  );

  const currentResponsibilities = takeArrayItems(getJobResponsibilityHints(currentJobItem), 2);
  const targetResponsibilities = takeArrayItems(getJobResponsibilityHints(targetJobItem), 2);
  const scopeFitScore = classification ? scoreJobScopeFit(classification) : null;
  pushRow(
    "job_scope",
    "책임 범위",
    (currentResponsibilities.length > 0
      ? currentResponsibilities
      : takeArrayItems(getJobLevelHints(currentJobItem), 1)).join(" / "),
    (targetResponsibilities.length > 0
      ? targetResponsibilities
      : takeArrayItems(getJobLevelHints(targetJobItem), 1)).join(" / "),
    Number.isFinite(scopeFitScore) ? { fitScore: scopeFitScore, fitBand: fitScoreToBand(scopeFitScore) } : null
  );

  const currentBoundarySignals = takeArrayItems(currentFamily?.boundarySignals, 2);
  const targetBoundarySignals = takeArrayItems(targetFamily?.boundarySignals, 2);
  const decisionCriteriaFitScore = classification ? scoreJobDecisionCriteriaFit(currentJobItem, targetJobItem, classification) : null;
  pushRow(
    "job_decision_criteria",
    "중요하게 보는 판단 기준",
    (currentBoundarySignals.length > 0
      ? currentBoundarySignals.map((item) => takeFirstMeaningfulSentence(item))
      : takeArrayItems(getJobLevelHints(currentJobItem), 1).map((item) => takeFirstMeaningfulSentence(item))).join(" / "),
    (targetBoundarySignals.length > 0
      ? targetBoundarySignals.map((item) => takeFirstMeaningfulSentence(item))
      : takeArrayItems(getJobLevelHints(targetJobItem), 1).map((item) => takeFirstMeaningfulSentence(item))).join(" / "),
    Number.isFinite(decisionCriteriaFitScore) ? { fitScore: decisionCriteriaFitScore, fitBand: fitScoreToBand(decisionCriteriaFitScore) } : null
  );

  if (rows.length < 2) return null;

  return {
    tableKind: "job_structure",
    title: "직무 구조 비교",
    columns: {
      current: toStr(currentJobItem?.label),
      target: toStr(targetJobItem?.label),
    },
    rows,
  };
}

function buildIndustryContextComparisonTable(currentIndustry, targetIndustry, classification) {
  const rows = [];
  // Normalize fitScore to 1–5 integer; rejects NaN/undefined/0/out-of-range
  const safeRowFitScore = (s) => {
    const n = Math.round(s);
    return Number.isFinite(n) && n >= 1 && n <= 5 ? n : null;
  };
  const pushRow = (rowKey, label, currentValue, targetValue, fitMeta) => {
    if (!currentValue || !targetValue) return;
    const row = { rowKey, label, current: currentValue, target: targetValue };
    if (fitMeta) {
      const safe = safeRowFitScore(fitMeta.fitScore);
      if (safe !== null) {
        row.fitScore = safe;
        if (fitMeta.fitBand) row.fitBand = fitMeta.fitBand;
      }
    }
    rows.push(row);
  };

  const customerStructureFitScore = scoreIndustryCustomerStructureFit(currentIndustry, targetIndustry);
  pushRow(
    "industry_customer_structure",
    "고객 구조",
    getCustomerMarketDisplay(takeFirstNonEmptyText(currentIndustry?.customerMarket), {
      mode: "short",
      sector: currentIndustry?.sector,
    }),
    getCustomerMarketDisplay(takeFirstNonEmptyText(targetIndustry?.customerMarket), {
      mode: "short",
      sector: targetIndustry?.sector,
    }),
    Number.isFinite(customerStructureFitScore) ? { fitScore: customerStructureFitScore, fitBand: fitScoreToBand(customerStructureFitScore) } : null
  );

  const buyingMotionFitScore = scoreIndustryBuyingMotionFit(currentIndustry, targetIndustry);
  pushRow(
    "industry_buying_motion",
    "구매/도입 방식",
    formatComparisonValue(currentIndustry?.buyingMotion, { maxItems: 2 }),
    formatComparisonValue(targetIndustry?.buyingMotion, { maxItems: 2 }),
    Number.isFinite(buyingMotionFitScore) ? { fitScore: buyingMotionFitScore, fitBand: fitScoreToBand(buyingMotionFitScore) } : null
  );

  const decisionStructureFitScore = scoreIndustryDecisionStructureFit(currentIndustry, targetIndustry, classification);
  pushRow(
    "industry_decision_structure",
    "의사결정 구조",
    formatComparisonValue(currentIndustry?.decisionStructure, { maxItems: 1, sentenceMode: "first" }),
    formatComparisonValue(targetIndustry?.decisionStructure, { maxItems: 1, sentenceMode: "first" }),
    Number.isFinite(decisionStructureFitScore) ? { fitScore: decisionStructureFitScore, fitBand: fitScoreToBand(decisionStructureFitScore) } : null
  );

  const operatingContextFitScore = classification
    ? scoreIndustryOperatingContextFit(currentIndustry, targetIndustry, classification)
    : null;
  pushRow(
    "industry_operating_context",
    "운영 맥락",
    formatComparisonValue(currentIndustry?.coreContext, { maxItems: 2 }),
    formatComparisonValue(targetIndustry?.coreContext, { maxItems: 2 }),
    Number.isFinite(operatingContextFitScore) ? { fitScore: operatingContextFitScore, fitBand: fitScoreToBand(operatingContextFitScore) } : null
  );

  const offeringModelRow = {
    label: "사업 구조",
    current: formatComparisonValue(currentIndustry?.offeringModel, { maxItems: 1, sentenceMode: "first" }),
    target: formatComparisonValue(targetIndustry?.offeringModel, { maxItems: 1, sentenceMode: "first" }),
  };
  void offeringModelRow;

  if (rows.length < 2) return null;

  return {
    tableKind: "industry_context_support",
    title: "산업·고객·구매 구조 보조 비교",
    description: "이 표는 산업 운영 맥락뿐 아니라 고객 구조, 구매 방식, 의사결정 구조 차이까지 함께 보여주는 보조 비교입니다.",
    metaNote: "레이더의 산업 맥락 점수를 그대로 분해한 표는 아니며, 일부 행은 고객 유형 축과 겹치는 신호를 함께 보여줍니다.",
    columns: {
      current: toStr(currentIndustry?.label),
      target: toStr(targetIndustry?.label),
    },
    rows,
  };
}

function getIndustryRelationAdjacency(currentIndustryItem, targetIndustryItem) {
  const currentAdjacent = makeBulletList(
    currentIndustryItem?.adjacentIndustries,
    currentIndustryItem?.relatedIndustries,
    currentIndustryItem?.adjacentSubSectors,
    currentIndustryItem?.adjacentSectors
  );
  const targetAdjacent = makeBulletList(
    targetIndustryItem?.adjacentIndustries,
    targetIndustryItem?.relatedIndustries,
    targetIndustryItem?.adjacentSubSectors,
    targetIndustryItem?.adjacentSectors
  );

  return Boolean(
    currentAdjacent.includes(toStr(targetIndustryItem?.id)) ||
    currentAdjacent.includes(toStr(targetIndustryItem?.subSector)) ||
    currentAdjacent.includes(toStr(targetIndustryItem?.sector)) ||
    targetAdjacent.includes(toStr(currentIndustryItem?.id)) ||
    targetAdjacent.includes(toStr(currentIndustryItem?.subSector)) ||
    targetAdjacent.includes(toStr(currentIndustryItem?.sector))
  );
}

function collectJobSignalText(jobItem, jobContext) {
  return [
    toStr(jobItem?.id),
    toStr(jobItem?.label),
    toStr(jobContext?.roleFamily),
    toStr(jobItem?.majorCategory),
    toStr(jobItem?.subcategory),
    toStr(getPrimaryFamily(jobItem)?.summaryTemplate),
    ...toArr(getPrimaryFamily(jobItem)?.strongSignals),
    ...toArr(getPrimaryFamily(jobItem)?.boundarySignals),
    ...toArr(getPrimaryFamily(jobItem)?.adjacentFamilies),
    ...toArr(getJobResponsibilityHints(jobItem)),
    ...toArr(getJobLevelHints(jobItem)),
  ].join(" ");
}

function deriveJobWeightMode(jobItem, jobContext) {
  const signal = collectJobSignalText(jobItem, jobContext);

  if (includesAny(signal, [
    "strategy",
    "planning",
    "policy",
    "consulting",
    "research",
    "analysis",
    "business_development",
    "corporate_strategy",
  ])) {
    return "strategy";
  }

  if (includesAny(signal, [
    "project",
    "program",
    "coord",
    "coordination",
    "partnership",
    "community",
    "customer_success",
    "success",
    "enablement",
  ])) {
    return "coordinator";
  }

  if (includesAny(signal, [
    "operator",
    "support",
    "backoffice",
    "admin",
    "assistant",
    "clerk",
  ])) {
    return "operator";
  }

  return "execution";
}

function deriveResponsibilityBand(jobItem, jobContext) {
  const signal = collectJobSignalText(jobItem, jobContext);
  let score = 1;

  if (includesAny(signal, [
    "strategy",
    "planning",
    "policy",
    "consulting",
    "director",
    "head",
    "lead",
    "owner",
    "management",
  ])) {
    score += 2;
  }

  if (includesAny(signal, [
    "project",
    "program",
    "coord",
    "coordination",
    "stakeholder",
    "partnership",
    "success",
    "enablement",
  ])) {
    score += 1;
  }

  if (includesAny(signal, [
    "support",
    "backoffice",
    "admin",
    "operator",
    "service",
    "cs",
    "qa",
    "logistics",
    "warehouse",
    "fulfillment",
  ])) {
    score -= 1;
  }

  if (toArr(getJobLevelHints(jobItem)).length >= 4) {
    score += 1;
  }

  if (toArr(jobContext?.capabilityHints).length >= 4) {
    score += 1;
  }

  return Math.max(0, Math.min(4, score));
}

function pushRiskKey(list, key) {
  if (!list.includes(key)) list.push(key);
}

function buildDiscriminatorPack(resolved) {
  const currentMarket = resolved?.currentIndustry?.customerMarket ?? null;
  const targetMarket  = resolved?.targetIndustry?.customerMarket ?? null;
  const currentFamily = resolved?.currentJob?.roleFamily ?? null;
  const targetFamily  = resolved?.targetJob?.roleFamily ?? null;

  const customerMarketFlip =
    currentMarket !== null &&
    targetMarket !== null &&
    currentMarket !== targetMarket;

  const PRODUCT_EXECUTION_FAMILIES = new Set(["FEATURE_PRODUCT_PLANNING", "UX_SERVICE_DESIGN", "GROWTH_DATA_DRIVEN_PLANNING"]);
  const STRATEGY_COORD_FAMILIES    = new Set(["BUSINESS_OPERATION_PLANNING", "BUSINESS_PERFORMANCE_MANAGEMENT", "PROJECT_BASED_PLANNING"]);

  const toGroup = (fam) =>
    fam === null ? "other"
    : PRODUCT_EXECUTION_FAMILIES.has(fam) ? "product_execution"
    : STRATEGY_COORD_FAMILIES.has(fam)    ? "strategy_coordination"
    : "other";

  const currentGroup = toGroup(currentFamily);
  const targetGroup  = toGroup(targetFamily);
  const jobFamilyGroupMismatch =
    currentGroup !== "other" && targetGroup !== "other" && currentGroup !== targetGroup;

  return { customerMarketFlip, jobFamilyGroupMismatch };
}

function getTransitionLiteRiskPriorityScore(riskKey, classification = {}, discriminatorPack = {}) {
  const {
    jobDistance,
    industryDistance,
    roleWeightShift,
    responsibilityShift,
  } = classification;

  let score = 0;

  if (riskKey === RISK_INDUSTRY_CONTEXT_SHIFT) {
    score += industryDistance === "cross" ? 40 : 0;
    score += jobDistance === "same" ? 24 : 0;
    score -= jobDistance === "adjacent" && roleWeightShift === "similar" && responsibilityShift === "similar" ? 18 : 0;
    score -= jobDistance === "cross" ? 12 : 0;
    score -= roleWeightShift !== "similar" ? 6 : 0;
    score -= responsibilityShift !== "similar" ? 6 : 0;
    // cross+cross boost: in full-cross transitions, industry structural adaptation is the primary
    // challenge when the job role-type stays stable (similar) or the responsibility scope narrows.
    // Without this, INDUSTRY_CONTEXT_SHIFT can never beat JOB_EXPECTATION_SHIFT (40-12=28 < 42).
    if (industryDistance === "cross" && jobDistance === "cross") {
      score += roleWeightShift === "similar" ? 32 : 0;
      score += roleWeightShift !== "similar" && responsibilityShift === "down_or_narrower" ? 43 : 0;
    }
  }

  if (riskKey === RISK_JOB_EXPECTATION_SHIFT) {
    score += jobDistance === "cross" ? 42 : 0;
    score += roleWeightShift !== "similar" ? 8 : 0;
    score += responsibilityShift !== "similar" ? 8 : 0;
  }

  if (riskKey === RISK_EXECUTION_LINK_CHECK) {
    score += jobDistance === "adjacent" && roleWeightShift === "strategy_to_execution" ? 34 : 0;
    score += responsibilityShift === "meaningfully_up" ? 6 : 0;
  }

  if (riskKey === RISK_STRATEGIC_VIEW_CHECK) {
    score += jobDistance === "adjacent" && roleWeightShift === "execution_to_strategy" ? 34 : 0;
    score += responsibilityShift === "meaningfully_up" ? 6 : 0;
  }

  if (riskKey === RISK_RESPONSIBILITY_EXPANSION) {
    score += responsibilityShift === "meaningfully_up" ? 26 : 0;
    score += responsibilityShift === "slightly_up" ? 12 : 0;
  }

  if (riskKey === RISK_SCOPE_REINTERPRETATION) {
    score += jobDistance === "adjacent" ? 20 : 0;
    score += roleWeightShift !== "similar" ? 10 : 0;
    score += responsibilityShift !== "similar" ? 6 : 0;
    score += industryDistance === "cross" ? 4 : 0;
  }

  // discriminator boosts: only within adjacent+cross+similar+similar bucket
  const isTargetBucket =
    jobDistance === "adjacent" &&
    industryDistance === "cross" &&
    roleWeightShift === "similar" &&
    responsibilityShift === "similar";

  if (isTargetBucket) {
    if (riskKey === RISK_INDUSTRY_CONTEXT_SHIFT) {
      score += discriminatorPack.customerMarketFlip === true ? 8 : 0;
    }
    if (riskKey === RISK_SCOPE_REINTERPRETATION) {
      score += (discriminatorPack.jobFamilyGroupMismatch === true && discriminatorPack.customerMarketFlip !== true) ? 4 : 0;
    }
  }

  return score;
}

function orderTransitionLiteRiskKeys(selected = [], classification = {}, discriminatorPack = {}) {
  const originalOrder = new Map(selected.map((key, index) => [key, index]));
  const getScore = (riskKey) =>
    getTransitionLiteRiskPriorityScore(riskKey, classification, discriminatorPack) +
    (
      classification?.jobDistance === "cross" &&
      classification?.industryDistance === "cross" &&
      riskKey === RISK_JOB_EXPECTATION_SHIFT
        ? 20
        : 0
    );

  return [...selected].sort((a, b) => {
    const scoreDiff = getScore(b) - getScore(a);
    if (scoreDiff !== 0) return scoreDiff;
    return (originalOrder.get(a) ?? 99) - (originalOrder.get(b) ?? 99);
  });
}

function pickTransitionLiteRiskKeys(classification, discriminatorPack = {}) {
  const {
    jobDistance,
    industryDistance,
    roleWeightShift,
    responsibilityShift,
  } = classification;

  if (
    jobDistance === "same" &&
    industryDistance === "same" &&
    roleWeightShift === "similar" &&
    responsibilityShift === "similar"
  ) {
    return [];
  }

  if (
    jobDistance === "same" &&
    industryDistance === "same" &&
    responsibilityShift === "meaningfully_up"
  ) {
    return [RISK_RESPONSIBILITY_EXPANSION];
  }

  if (
    jobDistance === "adjacent" &&
    industryDistance === "cross" &&
    roleWeightShift === "strategy_to_execution"
  ) {
    return [
      RISK_INDUSTRY_CONTEXT_SHIFT,
      RISK_EXECUTION_LINK_CHECK,
      RISK_SCOPE_REINTERPRETATION,
    ];
  }

  if (
    jobDistance === "cross" &&
    industryDistance === "same" &&
    roleWeightShift === "execution_to_strategy"
  ) {
    return [
      RISK_JOB_EXPECTATION_SHIFT,
      RISK_STRATEGIC_VIEW_CHECK,
    ];
  }

  const selected = [];

  // Include industry risk for both "cross" and "adjacent" industry gaps.
  // "cross" gets higher priority score (+40) than "adjacent" (+0) via getTransitionLiteRiskPriorityScore,
  // so ordering is naturally preserved. This ensures materially different industries always surface a risk card.
  if (industryDistance === "cross" || industryDistance === "adjacent") {
    pushRiskKey(selected, RISK_INDUSTRY_CONTEXT_SHIFT);
  }

  if (jobDistance === "cross") {
    pushRiskKey(selected, RISK_JOB_EXPECTATION_SHIFT);
  }

  if (jobDistance === "adjacent" && roleWeightShift === "strategy_to_execution") {
    pushRiskKey(selected, RISK_EXECUTION_LINK_CHECK);
  }

  if (jobDistance === "adjacent" && roleWeightShift === "execution_to_strategy") {
    pushRiskKey(selected, RISK_STRATEGIC_VIEW_CHECK);
  }

  if (responsibilityShift === "meaningfully_up") {
    pushRiskKey(selected, RISK_RESPONSIBILITY_EXPANSION);
  }

  if (
    (jobDistance === "adjacent" || jobDistance === "cross") &&
    !selected.includes(RISK_JOB_EXPECTATION_SHIFT)
  ) {
    pushRiskKey(selected, RISK_SCOPE_REINTERPRETATION);
  }

  if (
    responsibilityShift === "slightly_up" &&
    selected.length === 0
  ) {
    pushRiskKey(selected, RISK_RESPONSIBILITY_EXPANSION);
  }

  return orderTransitionLiteRiskKeys(selected, classification, discriminatorPack).slice(0, 3);
}

function getTransitionLiteRiskVariant(riskKey, classification, selectedRiskKeys) {
  if (
    riskKey === RISK_RESPONSIBILITY_EXPANSION &&
    (
      classification.responsibilityShift === "slightly_up" ||
      (
        classification.jobDistance === "same" &&
        classification.industryDistance === "same" &&
        classification.responsibilityShift === "meaningfully_up"
      )
    )
  ) {
    return "weak";
  }

  if (
    riskKey === RISK_SCOPE_REINTERPRETATION &&
    selectedRiskKeys.includes(RISK_JOB_EXPECTATION_SHIFT)
  ) {
    return "weak";
  }

  return "default";
}

function resolveRiskBodyVariantKey(riskKey, classification, targetIndustry) {
  const jobDistance = toStr(classification?.jobDistance);
  const industryDistance = toStr(classification?.industryDistance);
  const roleWeightShift = toStr(classification?.roleWeightShift);
  if (riskKey === RISK_INDUSTRY_CONTEXT_SHIFT) {
    if (industryDistance === "cross") {
      const B2B_GROUP = new Set(["B2B", "B2G", "B2B_B2G_MIXED"]);
      const B2C_GROUP = new Set(["B2C", "B2C_B2G_B2B_MIXED", "B2G_B2C_MIXED"]);
      const cm = toStr(takeFirstNonEmptyText(targetIndustry?.customerMarket));
      if (cm && B2B_GROUP.has(cm)) return "crossIndustryB2B";
      if (cm && B2C_GROUP.has(cm)) return "crossIndustryB2C";
      return "crossIndustry";
    }
    if (industryDistance === "adjacent") return "adjacentIndustry";
    return null;
  }
  if (riskKey === RISK_STRATEGIC_VIEW_CHECK) {
    if (roleWeightShift === "execution_to_strategy") return "executionToStrategy";
    if (jobDistance === "cross") return "crossJob";
    if (jobDistance === "adjacent") return "adjacentJob";
    return null;
  }
  return null;
}

function getTransitionLiteRiskCopy(riskKey, variant = "default", ctx = null) {
  const bodyVariantKey = ctx
    ? resolveRiskBodyVariantKey(riskKey, ctx.classification, ctx.targetIndustry)
    : null;
  const base = getTransitionLiteRiskText(riskKey, variant, bodyVariantKey);
  if (!base) {
    return null;
  }

  return {
    key: riskKey,
    label: toStr(base.label),
    shortTitle: toStr(base.shortTitle),
    title: toStr(base.title),
    body: toStr(base.body),
  };
}

function buildTransitionLiteWhyFallbackLine(classification = {}, selectedRiskKeys = []) {
  const jobDistance = toStr(classification?.jobDistance);
  const industryDistance = toStr(classification?.industryDistance);
  const responsibilityShift = toStr(classification?.responsibilityShift);
  const hasIndustryRisk = toArr(selectedRiskKeys).includes(RISK_INDUSTRY_CONTEXT_SHIFT);
  const hasJobRisk = toArr(selectedRiskKeys).includes(RISK_JOB_EXPECTATION_SHIFT);

  if (
    jobDistance === "same" &&
    industryDistance === "same" &&
    toStr(classification?.roleWeightShift) === "similar" &&
    responsibilityShift === "similar"
  ) {
    return "직무와 산업 축이 모두 유사해 큰 방향 전환보다는, 같은 맥락의 경험을 얼마나 선명하게 연결하느냐가 핵심으로 읽힙니다.";
  }

  if (jobDistance === "cross" && industryDistance === "cross") {
    return hasJobRisk
      ? "직무와 산업 축이 함께 바뀌는 전환이라, 기존 경험을 그대로 옮기기보다 목표 직무 기준으로 다시 묶어 설명하는 편이 안전합니다."
      : "직무와 산업 축이 함께 바뀌는 전환이라, 익숙한 맥락을 그대로 옮기기보다 새로운 기준에 맞춰 경험을 다시 정리하는 편이 안전합니다.";
  }

  if (jobDistance === "cross") {
    return "산업보다 직무 기준이 먼저 달라지므로, 기존 경험을 목표 직무의 산출물과 판단 기준에 맞춰 다시 설명하는 편이 중요합니다.";
  }

  if (industryDistance === "cross" && hasIndustryRisk) {
    return "직무는 가깝더라도 업계 문맥이 달라져, 같은 경험도 고객 구조와 운영 방식의 차이까지 함께 설명해야 설득력이 생깁니다.";
  }

  if (jobDistance === "adjacent" && responsibilityShift === "meaningfully_up") {
    return "인접 전환이지만 책임 범위가 넓어져, 해온 일보다 어떤 판단과 조율까지 맡았는지가 더 중요하게 읽힙니다.";
  }

  if (jobDistance === "adjacent") {
    return "인접 전환일수록 비슷한 업무를 했다는 사실보다, 목표 역할 언어로 경험을 다시 묶어 설명하는 편이 중요합니다.";
  }

  return "";
}

function buildSameRoleCrossIndustryWhyLine(classification = {}, targetContext = {}) {
  if (
    toStr(classification?.jobDistance) !== "same" ||
    toStr(classification?.industryDistance) !== "cross"
  ) {
    return "";
  }

  const sameRoleCrossIndustryFamily = resolveSameRoleCrossIndustryFamily(targetContext);

  if (sameRoleCrossIndustryFamily === "PROCUREMENT_SCM") {
    return "같은 구매 역할이라도 산업이 바뀌면 다루는 구매 대상, 공급시장 구조, 평가 기준이 달라져 기존 경험을 그대로 이전하기 어렵게 읽힐 수 있습니다.";
  }

  if (sameRoleCrossIndustryFamily === "SALES") {
    return "같은 영업 역할이어도 산업이 달라지면 고객군, 세일즈 사이클, 설득 포인트가 달라져 성과를 설명하는 방식이 바뀔 수 있습니다.";
  }

  if (sameRoleCrossIndustryFamily === "MARKETING") {
    return "같은 마케팅이라도 산업에 따라 핵심 채널, 고객 의사결정 구조, 성과 지표가 달라 기존 방식이 그대로 통하지 않을 수 있습니다.";
  }

  if (sameRoleCrossIndustryFamily === "HR_ORGANIZATION") {
    const hrSubtype = resolveHrSubtype(targetContext);
    if (hrSubtype === "HR_OPS") {
      return "같은 HR 운영 역할이어도 산업이 달라지면 자주 다루는 인사 운영 이슈, 처리 기준과 리듬, 현업과 맞물리는 방식이 달라져 기존 경험을 그대로 옮기기 어렵게 읽힐 수 있습니다.";
    }
    if (hrSubtype === "HRBP") {
      return "같은 HRBP 역할이어도 산업이 달라지면 조직의 의사결정 구조, 현업 리더와 파트너링하는 방식, 사업과 연결되는 인사 판단 기준이 달라져 기존 경험을 그대로 옮기기 어렵게 읽힐 수 있습니다.";
    }
    return "같은 HR 역할이어도 산업이 달라지면 조직의 의사결정 구조, 현업과 맞물리는 방식, 자주 다루는 인사 이슈가 달라져 기존 경험을 그대로 옮기기 어렵게 읽힐 수 있습니다.";
  }

  if (sameRoleCrossIndustryFamily === "CUSTOMER_OPERATIONS") {
    return "같은 운영 역할이어도 산업이 달라지면 고객 접점의 성격, 처리 기준과 속도, 운영 품질을 증명하는 방식이 달라져 기존 경험을 그대로 연결하기 어렵게 읽힐 수 있습니다.";
  }

  return "";
}

function resolveSameRoleCrossIndustryFamily(targetContext = {}) {
  const majorCategory =
    toStr(targetContext?.targetJobItem?.majorCategory) ||
    toStr(targetContext?.currentJobItem?.majorCategory);
  const roleFamily =
    toStr(targetContext?.targetJob?.roleFamily) ||
    toStr(targetContext?.currentJob?.roleFamily);

  if (
    majorCategory === "PROCUREMENT_SCM" ||
    includesAny(roleFamily, ["procurement", "purchasing", "sourcing", "scm"])
  ) {
    return "PROCUREMENT_SCM";
  }

  if (
    majorCategory === "SALES" ||
    includesAny(roleFamily, ["sales", "account", "solution_sales", "channel_sales"])
  ) {
    return "SALES";
  }

  if (
    majorCategory === "MARKETING" ||
    includesAny(roleFamily, ["marketing", "brand", "product_marketing", "performance"])
  ) {
    return "MARKETING";
  }

  if (
    majorCategory === "HR_ORGANIZATION" ||
    includesAny(roleFamily, ["hr", "people", "recruit", "talent", "hrbp"])
  ) {
    return "HR_ORGANIZATION";
  }

  if (
    majorCategory === "CUSTOMER_OPERATIONS" ||
    includesAny(roleFamily, ["customer", "service", "operations", "cs"])
  ) {
    return "CUSTOMER_OPERATIONS";
  }

  return "";
}

function resolveHrSubtype(targetContext = {}) {
  const targetJobId = toStr(targetContext?.targetJobId);
  const currentJobId = toStr(targetContext?.currentJobId);
  const roleFamily =
    toStr(targetContext?.targetJob?.roleFamily) ||
    toStr(targetContext?.currentJob?.roleFamily);
  const label = [
    toStr(targetContext?.targetJobLabel),
    toStr(targetContext?.currentJobLabel),
    toStr(targetContext?.targetJobItem?.label),
    toStr(targetContext?.currentJobItem?.label),
  ]
    .filter(Boolean)
    .join(" ");

  if (
    includesAny(targetJobId, ["HR_OPS"]) ||
    includesAny(currentJobId, ["HR_OPS"]) ||
    includesAny(roleFamily, ["hr_ops", "hr_operations"]) ||
    includesAny(label, ["HR Ops", "HR OPS", "HR운영", "인사운영"])
  ) {
    return "HR_OPS";
  }

  if (
    includesAny(targetJobId, ["HRBP"]) ||
    includesAny(currentJobId, ["HRBP"]) ||
    includesAny(roleFamily, ["hrbp"]) ||
    includesAny(label, ["HRBP", "HR BP"])
  ) {
    return "HRBP";
  }

  return "HR_GENERIC";
}

function buildSameRoleCrossIndustryFollowupLine(classification = {}, targetContext = {}) {
  if (
    toStr(classification?.jobDistance) !== "same" ||
    toStr(classification?.industryDistance) !== "cross"
  ) {
    return "";
  }

  const sameRoleCrossIndustryFamily = resolveSameRoleCrossIndustryFamily(targetContext);

  if (sameRoleCrossIndustryFamily === "PROCUREMENT_SCM") {
    return "기존 경험이 새 업계의 구매 대상과 평가 기준 안에서 어떻게 해석되는지를 함께 보게 될 수 있습니다.";
  }

  if (sameRoleCrossIndustryFamily === "SALES") {
    return "기존 경험이 새 업계의 고객군과 세일즈 사이클 안에서 어떻게 이어지는지를 함께 보게 될 수 있습니다.";
  }

  if (sameRoleCrossIndustryFamily === "MARKETING") {
    return "기존 경험이 새 업계의 고객 여정과 성과 지표 안에서 어떻게 이어지는지를 함께 보게 될 수 있습니다.";
  }

  if (sameRoleCrossIndustryFamily === "HR_ORGANIZATION") {
    const hrSubtype = resolveHrSubtype(targetContext);
    if (hrSubtype === "HR_OPS") {
      return "기존 경험이 새 조직의 인사 운영 이슈와 운영 리듬 안에서 어떻게 이어지는지를 함께 보게 될 수 있습니다.";
    }
    if (hrSubtype === "HRBP") {
      return "기존 경험이 새 조직의 현업 파트너링 구조와 인사 판단 맥락 안에서 어떻게 이어지는지를 함께 보게 될 수 있습니다.";
    }
    return "기존 경험이 새 조직의 인사 운영 이슈와 협업 구조 안에서 어떻게 이어지는지를 함께 보게 될 수 있습니다.";
  }

  if (sameRoleCrossIndustryFamily === "CUSTOMER_OPERATIONS") {
    return "기존 경험이 새 업계의 운영 기준과 고객 접점 흐름 안에서 어떻게 이어지는지를 함께 보게 될 수 있습니다.";
  }

  return "";
}

function resolveAdjacentTransitionSubtype(targetContext = {}, classification = {}) {
  if (toStr(classification?.jobDistance) !== "adjacent") return "";

  const currentMajor = toStr(targetContext?.currentJobItem?.majorCategory);
  const targetMajor = toStr(targetContext?.targetJobItem?.majorCategory);
  const currentSubVertical = toStr(targetContext?.currentJobItem?.subVertical);
  const targetSubVertical = toStr(targetContext?.targetJobItem?.subVertical);
  const currentRoleFamily = toStr(targetContext?.currentJob?.roleFamily);
  const targetRoleFamily = toStr(targetContext?.targetJob?.roleFamily);
  const currentJobId = toStr(targetContext?.currentJobId);
  const targetJobId = toStr(targetContext?.targetJobId);
  const currentLabel = [
    toStr(targetContext?.currentJobLabel),
    toStr(targetContext?.currentJobItem?.label),
  ].join(" ");
  const targetLabel = [
    toStr(targetContext?.targetJobLabel),
    toStr(targetContext?.targetJobItem?.label),
  ].join(" ");

  const isSales = (major, roleFamily, jobId, label) =>
    major === "SALES" ||
    includesAny(roleFamily, ["sales", "account", "solution_sales", "channel_sales"]) ||
    includesAny(jobId, ["JOB_SALES"]) ||
    includesAny(label, ["영업", "세일즈"]);
  const isMarketing = (major, roleFamily, jobId, label) =>
    major === "MARKETING" ||
    includesAny(roleFamily, ["marketing", "brand", "product_marketing", "performance"]) ||
    includesAny(jobId, ["JOB_MARKETING"]) ||
    includesAny(label, ["마케팅"]);
  const isOperations = (major, subVertical, roleFamily, jobId, label) =>
    major === "CUSTOMER_OPERATIONS" &&
    (
      includesAny(subVertical, ["SERVICE_OPERATIONS"]) ||
      includesAny(roleFamily, ["customer", "service", "operations", "cs"]) ||
      includesAny(jobId, ["SERVICE_OPERATIONS"]) ||
      includesAny(label, ["서비스운영", "운영"])
    ) &&
    !includesAny(subVertical, ["OPERATION_PLANNING"]) &&
    !includesAny(jobId, ["OPERATION_PLANNING"]);
  const isPlanning = (major, subVertical, roleFamily, jobId, label) =>
    includesAny(subVertical, ["OPERATION_PLANNING", "SERVICE_PLANNING"]) ||
    includesAny(roleFamily, ["planning", "planner", "pm", "product", "service_planning"]) ||
    includesAny(jobId, ["OPERATION_PLANNING", "SERVICE_PLANNING", "FEATURE_PRODUCT_PLANNING"]) ||
    includesAny(label, ["운영기획", "서비스기획", "기획", "PM", "프로덕트"]);
  const isOperationPlanning = (major, subVertical, roleFamily, jobId, label) =>
    (
      major === "CUSTOMER_OPERATIONS" &&
      includesAny(subVertical, ["OPERATION_PLANNING"])
    ) ||
    includesAny(roleFamily, [
      "PROCESS_POLICY_PLANNING",
      "DATA_DRIVEN_OPERATION_PLANNING",
      "SERVICE_IMPROVEMENT_PLANNING",
      "EXECUTION_COORDINATION_OPERATION",
    ]) ||
    includesAny(jobId, [
      "OPERATION_PLANNER",
      "OPS_ANALYST",
      "OPS_IMPROVEMENT_MANAGER",
      "OPS_COORDINATOR",
    ]) ||
    includesAny(label, ["운영기획", "서비스 운영기획", "운영 정책 기획"]);
  const isServicePlanning = (major, subVertical, roleFamily, jobId, label) =>
    (
      major === "BUSINESS" &&
      includesAny(subVertical, ["SERVICE_PLANNING"])
    ) ||
    includesAny(roleFamily, [
      "FEATURE_PRODUCT_PLANNING",
      "UX_SERVICE_DESIGN",
      "GROWTH_DATA_DRIVEN_PLANNING",
      "PRODUCT_STRATEGY_PLANNING",
    ]) ||
    includesAny(jobId, [
      "PRODUCT_MANAGER",
      "UX_PLANNER",
      "GROWTH_PM",
      "PRODUCT_STRATEGIST",
    ]) ||
    includesAny(label, ["서비스기획", "서비스 기획", "프로덕트 기획"]);
  const isPmPlanning = (major, subVertical, roleFamily, jobId, label) =>
    (
      includesAny(subVertical, ["SERVICE_PLANNING"]) &&
      includesAny(jobId, ["PRODUCT_MANAGER"])
    ) ||
    includesAny(roleFamily, ["FEATURE_PRODUCT_PLANNING", "PRODUCT_MANAGEMENT"]) ||
    includesAny(jobId, ["PRODUCT_MANAGER"]) ||
    includesAny(label, ["PM", "프로덕트 매니저", "product manager"]);

  if (
    isSales(currentMajor, currentRoleFamily, currentJobId, currentLabel) &&
    isMarketing(targetMajor, targetRoleFamily, targetJobId, targetLabel)
  ) {
    return "SALES_TO_MARKETING";
  }

  if (
    isMarketing(currentMajor, currentRoleFamily, currentJobId, currentLabel) &&
    isSales(targetMajor, targetRoleFamily, targetJobId, targetLabel)
  ) {
    return "MARKETING_TO_SALES";
  }

  if (
    isOperationPlanning(currentMajor, currentSubVertical, currentRoleFamily, currentJobId, currentLabel) &&
    isPmPlanning(targetMajor, targetSubVertical, targetRoleFamily, targetJobId, targetLabel)
  ) {
    return "OPERATION_PLANNING_TO_PM";
  }

  if (
    isPmPlanning(currentMajor, currentSubVertical, currentRoleFamily, currentJobId, currentLabel) &&
    isOperationPlanning(targetMajor, targetSubVertical, targetRoleFamily, targetJobId, targetLabel)
  ) {
    return "PM_TO_OPERATION_PLANNING";
  }

  if (
    isServicePlanning(currentMajor, currentSubVertical, currentRoleFamily, currentJobId, currentLabel) &&
    isOperationPlanning(targetMajor, targetSubVertical, targetRoleFamily, targetJobId, targetLabel)
  ) {
    return "SERVICE_PLANNING_TO_OPERATION_PLANNING";
  }

  if (
    isOperationPlanning(currentMajor, currentSubVertical, currentRoleFamily, currentJobId, currentLabel) &&
    isServicePlanning(targetMajor, targetSubVertical, targetRoleFamily, targetJobId, targetLabel)
  ) {
    return "OPERATION_PLANNING_TO_SERVICE_PLANNING";
  }

  if (
    isOperations(currentMajor, currentSubVertical, currentRoleFamily, currentJobId, currentLabel) &&
    isPlanning(targetMajor, targetSubVertical, targetRoleFamily, targetJobId, targetLabel)
  ) {
    return "OPERATIONS_TO_PLANNING";
  }

  if (
    isPlanning(currentMajor, currentSubVertical, currentRoleFamily, currentJobId, currentLabel) &&
    isOperations(targetMajor, targetSubVertical, targetRoleFamily, targetJobId, targetLabel)
  ) {
    return "PLANNING_TO_OPERATIONS";
  }

  return "";
}

function buildAdjacentTransitionFollowupLine(targetContext = {}, classification = {}) {
  const subtype = resolveAdjacentTransitionSubtype(targetContext, classification);

  if (subtype === "SALES_TO_MARKETING") {
    return "기존 고객 이해와 채널 감각은 연결될 수 있지만, 성과를 만드는 방식은 실행보다 메시지 포지셔닝과 캠페인 설계 쪽으로 다르게 읽힐 수 있습니다.";
  }

  if (subtype === "MARKETING_TO_SALES") {
    return "시장과 고객에 대한 이해는 연결되지만, 성과는 캠페인 설계보다 실제 설득과 관계 관리, 딜 전환 쪽에서 다시 증명해야 할 수 있습니다.";
  }

  if (subtype === "SERVICE_PLANNING_TO_OPERATION_PLANNING") {
    return "서비스 구조를 보는 강점은 이어지지만, 실제 운영기획에서는 정책·프로세스·운영 기준을 설계한 경험으로 다시 묶어 설명해야 할 수 있습니다.";
  }

  if (subtype === "OPERATION_PLANNING_TO_SERVICE_PLANNING") {
    return "운영 기준을 설계한 경험은 연결되지만, 서비스기획에서는 사용자 흐름과 기능 의도까지 함께 설명해야 할 수 있습니다.";
  }

  if (subtype === "OPERATION_PLANNING_TO_PM") {
    return "운영 우선순위를 다뤄본 경험은 강점이지만, PM 역할에서는 기능 선택과 제품 의도, 문제 정의 언어로 다시 묶어 설명해야 할 수 있습니다.";
  }

  if (subtype === "PM_TO_OPERATION_PLANNING") {
    return "제품 기획 경험은 연결되지만, 운영기획에서는 실제 운영 기준과 예외 처리, 실행 정합성을 만드는 방식으로 성과를 다시 보여줘야 할 수 있습니다.";
  }

  if (subtype === "OPERATIONS_TO_PLANNING") {
    return "현장을 이해하는 강점은 이어지지만, 실행 경험을 기획 의도와 우선순위, 운영 정책을 설계하는 언어로 바꿔 설명해야 할 수 있습니다.";
  }

  if (subtype === "PLANNING_TO_OPERATIONS") {
    return "기획 관점은 강점이지만, 실제 운영에서는 설계보다 예외 처리와 실행 속도, 현장 리듬 안에서 성과를 다시 증명해야 할 수 있습니다.";
  }

  return "";
}

function buildAdjacentTransitionWhyLine(targetContext = {}, classification = {}) {
  const subtype = resolveAdjacentTransitionSubtype(targetContext, classification);

  if (subtype === "SALES_TO_MARKETING") {
    return "같은 고객을 다루더라도 영업에서 마케팅으로 가면 성과는 직접 설득보다 메시지 구조화, 채널 운영, 캠페인 결과를 설계하는 방식으로 다르게 읽힐 수 있습니다.";
  }

  if (subtype === "MARKETING_TO_SALES") {
    return "같은 시장을 이해하더라도 마케팅에서 영업으로 가면 성과는 인지도나 캠페인 반응보다 실제 관계 형성, 설득 과정, 딜 전환으로 다시 판단될 수 있습니다.";
  }

  if (subtype === "SERVICE_PLANNING_TO_OPERATION_PLANNING") {
    return "서비스기획에서 운영기획으로 가면 구조 이해는 강점이지만, 실제 역할 평가는 서비스 의도보다 운영 기준과 실행 구조를 얼마나 설계했는지에 더 실릴 수 있습니다.";
  }

  if (subtype === "OPERATION_PLANNING_TO_SERVICE_PLANNING") {
    return "운영기획에서 서비스기획으로 가면 프로세스 설계 경험은 연결되지만, 무엇을 왜 사용자에게 제공할지에 대한 기능·경험 설계 판단이 더 중요하게 읽힐 수 있습니다.";
  }

  if (subtype === "OPERATION_PLANNING_TO_PM") {
    return "운영기획에서 PM으로 가면 운영 구조를 보는 시각은 강점이지만, 제품에서는 문제 정의와 기능 우선순위, 제품 성과 판단으로 역할 무게중심이 이동할 수 있습니다.";
  }

  if (subtype === "PM_TO_OPERATION_PLANNING") {
    return "PM에서 운영기획으로 가면 제품 설계 경험은 연결되지만, 실제 평가는 기능 기획보다 운영 기준과 실행 안정성을 어떻게 만들었는지에 더 실릴 수 있습니다.";
  }

  if (subtype === "OPERATIONS_TO_PLANNING") {
    return "운영에서 기획으로 가면 현장 이해는 강점이지만, 무엇을 왜 우선할지 정하고 운영 기준을 설계하는 판단이 더 중요하게 읽힐 수 있습니다.";
  }

  if (subtype === "PLANNING_TO_OPERATIONS") {
    return "기획에서 운영으로 가면 설계 경험은 연결되지만, 실제 역할 평가는 계획보다 처리 기준, 예외 대응, 운영 안정성을 어떻게 만들었는지에 더 실릴 수 있습니다.";
  }

  return "";
}

function pickTransitionLiteWhyLineForRisk(
  riskKey,
  classification,
  selectedRiskKeys,
  seenFamilies = new Set(),
  blockedTexts = []
) {
  const normalizedBlocked = new Set(
    toArr(blockedTexts)
      .map((item) => normalizeText(item))
      .filter(Boolean)
  );
  const copy = getTransitionLiteRiskCopy(
    riskKey,
    getTransitionLiteRiskVariant(riskKey, classification, selectedRiskKeys),
    { classification }
  );
  const riskBody = normalizeText(copy?.body);
  const fragments = getTransitionLiteWhyFragmentsByRisk(riskKey)
    .filter((item) => item && typeof item === "object")
    .sort((a, b) => {
      const pa = Number.isFinite(a?.priorityHint) ? a.priorityHint : 99;
      const pb = Number.isFinite(b?.priorityHint) ? b.priorityHint : 99;
      if (pa !== pb) return pa - pb;
      return toStr(a?.id).localeCompare(toStr(b?.id));
    });

  for (const fragment of fragments) {
    const text = toStr(fragment?.text);
    const causeFamily = toStr(fragment?.causeFamily);
    const normalized = normalizeText(text);

    if (!text || !causeFamily || !normalized) continue;
    if (normalized === riskBody) continue;
    if (riskBody && (normalized.includes(riskBody) || riskBody.includes(normalized))) continue;
    if (seenFamilies.has(causeFamily)) continue;
    if (normalizedBlocked.has(normalized)) continue;

    seenFamilies.add(causeFamily);
    return text;
  }

  return "";
}

function buildTransitionLiteWhy(selectedRiskKeys, classification, targetContext = {}) {
  const primaryRiskKey = toArr(selectedRiskKeys)[0];
  const sameRoleCrossIndustryFollowupLine = buildSameRoleCrossIndustryFollowupLine(
    classification,
    targetContext
  );
  const sameRoleCrossIndustryWhyLine = buildSameRoleCrossIndustryWhyLine(
    classification,
    targetContext
  );
  const adjacentTransitionFollowupLine = buildAdjacentTransitionFollowupLine(
    targetContext,
    classification
  );
  const adjacentTransitionWhyLine = buildAdjacentTransitionWhyLine(
    targetContext,
    classification
  );
  if (!primaryRiskKey) {
    const fallbackLine =
      sameRoleCrossIndustryWhyLine ||
      buildTransitionLiteWhyFallbackLine(classification, selectedRiskKeys);
    return fallbackLine ? [fallbackLine] : [];
  }

  const selected = [];
  const seenFamilies = new Set();
  const primaryLineOne = pickTransitionLiteWhyLineForRisk(
    primaryRiskKey,
    classification,
    selectedRiskKeys,
    seenFamilies,
    selected
  );
  if (primaryLineOne) selected.push(primaryLineOne);

  if (sameRoleCrossIndustryFollowupLine && selected.length < 3) {
    selected.push(sameRoleCrossIndustryFollowupLine);
  }

  if (sameRoleCrossIndustryWhyLine && selected.length < 3) {
    selected.push(sameRoleCrossIndustryWhyLine);
  }

  if (sameRoleCrossIndustryFollowupLine && sameRoleCrossIndustryWhyLine) {
    return uniqueStrings(selected).slice(0, 3);
  }

  if (adjacentTransitionFollowupLine && selected.length < 3) {
    selected.push(adjacentTransitionFollowupLine);
  }

  if (adjacentTransitionWhyLine && selected.length < 3) {
    selected.push(adjacentTransitionWhyLine);
  }

  if (adjacentTransitionFollowupLine && adjacentTransitionWhyLine) {
    return uniqueStrings(selected).slice(0, 3);
  }

  const primaryLineTwo = pickTransitionLiteWhyLineForRisk(
    primaryRiskKey,
    classification,
    selectedRiskKeys,
    seenFamilies,
    selected
  );
  if (primaryLineTwo) selected.push(primaryLineTwo);

  const secondaryRiskKey = toArr(selectedRiskKeys)[1];
  if (secondaryRiskKey && selected.length < 3) {
    const secondaryLine = pickTransitionLiteWhyLineForRisk(
      secondaryRiskKey,
      classification,
      selectedRiskKeys,
      seenFamilies,
      selected
    );
    if (secondaryLine) selected.push(secondaryLine);
  }

  if (selected.length === 0 || (selected.length < 3 && !secondaryRiskKey)) {
    const fallbackLine =
      sameRoleCrossIndustryWhyLine ||
      buildTransitionLiteWhyFallbackLine(classification, selectedRiskKeys);
    if (fallbackLine) selected.push(fallbackLine);
  }

  return uniqueStrings(selected).slice(0, 3);
}

function normalizeTransitionLiteSupportText(value) {
  return toStr(value)
    .replace(/\s+/g, " ")
    .replace(/[“”"'`]/g, "")
    .trim();
}

function hasMeaningfulWhyOverlap(items = [], supportLine = "") {
  const normalizedSupportLine = normalizeTransitionLiteSupportText(supportLine).toLowerCase();
  if (!normalizedSupportLine) return false;

  return toArr(items).some((item) => {
    const normalizedItem = normalizeTransitionLiteSupportText(item).toLowerCase();
    if (!normalizedItem) return false;
    return (
      normalizedItem === normalizedSupportLine ||
      normalizedItem.includes(normalizedSupportLine) ||
      normalizedSupportLine.includes(normalizedItem)
    );
  });
}

function buildTransitionLiteWhySupportLine(classification, whyThisRead = []) {
  if (toStr(classification?.jobDistance) !== "adjacent") return null;

  const adjacentRoleShiftTaxonomy = INTERACTION_SUBCATEGORY_ADJACENT_ROLE_SHIFT;
  if (!adjacentRoleShiftTaxonomy || typeof adjacentRoleShiftTaxonomy !== "object") return null;

  const hasDefinition = Boolean(normalizeTransitionLiteSupportText(adjacentRoleShiftTaxonomy.definition));
  const hasWhenItAppears = toArr(adjacentRoleShiftTaxonomy.whenItAppears).length > 0;
  const hasBoundaryShift = toArr(adjacentRoleShiftTaxonomy.boundaryShift).length > 0;
  const hasProofShift = toArr(adjacentRoleShiftTaxonomy.proofShift).length > 0;
  const hasReportIntent = Boolean(normalizeTransitionLiteSupportText(adjacentRoleShiftTaxonomy.reportIntent));

  let supportLine = "";
  if (hasBoundaryShift && hasProofShift) {
    supportLine = "이 이동은 완전 전환보다, 기존 경험을 인접 직무 언어로 다시 설명해야 하는 경계 이동에 가깝습니다.";
  } else if (hasWhenItAppears && hasDefinition) {
    supportLine = "직무명이 완전히 같지 않아도, 실제 과업 구조가 겹치면 인접 이동으로 읽힐 수 있습니다.";
  } else if (hasReportIntent || hasDefinition) {
    supportLine = "현재 경험과 목표 직무 사이의 연결 구조를 어떻게 설명하느냐가 해석의 핵심으로 작동할 수 있습니다.";
  }

  const normalizedSupportLine = normalizeTransitionLiteSupportText(supportLine);
  if (!normalizedSupportLine || normalizedSupportLine.length > 90) return null;
  if (hasMeaningfulWhyOverlap(whyThisRead, normalizedSupportLine)) return null;
  return normalizedSupportLine;
}

function normalizeTransitionLiteStrengthText(value) {
  return toStr(value)
    .replace(/\s+/g, " ")
    .replace(/[“”"'`]/g, "")
    .trim()
    .toLowerCase();
}

function buildTransitionLiteStrengthBlockedTexts({
  whyThisRead = [],
  whyThisReadSupportLine = "",
  transitionReadBlock = {},
  targetContext = {},
} = {}) {
  const blocked = [
    ...toArr(whyThisRead),
    toStr(whyThisReadSupportLine),
    toStr(transitionReadBlock?.intro),
    ...toArr(transitionReadBlock?.cards).flatMap((card) => [
      toStr(card?.title),
      ...toArr(card?.body),
    ]),
    toStr(targetContext?.targetJobRead?.summary),
    toStr(targetContext?.targetJobRead?.body),
    ...toArr(targetContext?.targetJobRead?.bullets),
    toStr(targetContext?.targetIndustryRead?.summary),
    ...toArr(targetContext?.targetIndustryRead?.bullets),
  ];

  return uniqueStrings(blocked).filter(Boolean);
}

function hasMeaningfulTransitionLiteStrengthOverlap(value, blockedTexts = []) {
  const normalizedValue = normalizeTransitionLiteStrengthText(value);
  if (!normalizedValue) return true;

  return toArr(blockedTexts).some((blocked) => {
    const normalizedBlocked = normalizeTransitionLiteStrengthText(blocked);
    if (!normalizedBlocked) return false;
    return (
      normalizedBlocked === normalizedValue ||
      normalizedBlocked.includes(normalizedValue) ||
      normalizedValue.includes(normalizedBlocked)
    );
  });
}

function pickTransitionLiteStrengthLine(candidates = [], blockedTexts = [], selected = []) {
  for (const candidate of toArr(candidates)) {
    const text = toStr(candidate).replace(/\s+/g, " ").trim();
    if (!text) continue;
    if (text.length > 140) continue;
    if (hasMeaningfulTransitionLiteStrengthOverlap(text, blockedTexts)) continue;
    if (hasMeaningfulTransitionLiteStrengthOverlap(text, selected)) continue;
    return text;
  }

  return "";
}

function pickTransitionLiteJobSignalCandidates(targetJobItem) {
  return uniqueStrings([
    ...toArr(getPrimaryFamily(targetJobItem)?.strongSignals).slice(0, 1),
    ...toArr(getJobLevelHints(targetJobItem)).slice(0, 1),
  ]);
}

function pickTransitionLiteIndustrySignalCandidates(targetIndustry) {
  return uniqueStrings(toArr(targetIndustry?.proofSignals).slice(0, 1));
}

function normalizeTransitionLiteSentence(value) {
  return toStr(value)
    .replace(/\s+/g, " ")
    .replace(/[.]+$/g, "")
    .trim();
}

function stripTransitionLiteLead(value, prefixes = []) {
  let text = normalizeTransitionLiteSentence(value);
  for (const prefix of toArr(prefixes)) {
    if (text.startsWith(prefix)) {
      text = text.slice(prefix.length).trim();
      break;
    }
  }
  return text;
}

function toTransitionLiteClause(value) {
  let text = normalizeTransitionLiteSentence(value);
  if (!text) return "";

  const replacements = [
    [/합니다$/g, "한다"],
    [/읽힙니다$/g, "읽힌다"],
    [/있습니다$/g, "있다"],
    [/됩니다$/g, "된다"],
    [/중요함$/g, "중요하다"],
    [/좌우됨$/g, "좌우된다"],
    [/작동함$/g, "작동한다"],
  ];

  for (const [pattern, replacement] of replacements) {
    if (pattern.test(text)) {
      text = text.replace(pattern, replacement);
      break;
    }
  }

  return text;
}

function takeTransitionLiteCurrentActionSignals(targetContext = {}) {
  const allSignals = uniqueStrings([
    ...toArr(getPrimaryFamily(targetContext?.currentJobItem)?.strongSignals),
    ...toArr(getJobResponsibilityHints(targetContext?.currentJobItem)),
  ]);
  const preferredSignals = allSignals.filter((item) =>
    /우선순위|모니터링|협업|정리|정의|조정|개선|분석/.test(toStr(item))
  );

  return uniqueStrings([
    ...preferredSignals,
    ...allSignals,
  ]).slice(0, 3);
}

function takeTransitionLiteTargetActionSignals(targetContext = {}) {
  return uniqueStrings([
    ...toArr(getJobResponsibilityHints(targetContext?.targetJobItem)),
    ...toArr(getPrimaryFamily(targetContext?.targetJobItem)?.strongSignals),
  ]).slice(0, 3);
}

function buildTransitionLiteOriginEvidenceContext({ whyThisRead, whyThisReadSupportLine } = {}) {
  const supportLine = toStr(whyThisReadSupportLine).trim();

  const readTexts = Array.isArray(whyThisRead)
    ? whyThisRead
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object") {
            return [
              item.content,
              item.text,
              item.answer,
              item.label,
              item.summary,
            ].map(toStr).filter(Boolean).join(" ");
          }
          return "";
        })
        .map((value) => value.trim())
        .filter(Boolean)
    : [toStr(whyThisRead).trim()].filter(Boolean);

  const combinedText = [supportLine, ...readTexts].filter(Boolean).join(" ");

  return {
    hasSupportLine: supportLine.length >= 8,
    hasAnyEvidenceText: combinedText.length >= 12,
    supportLine,
    combinedText,
  };
}

function buildTransitionLiteCandidateOriginLine(targetContext = {}, generationTags = {}, evidenceContext = {}) {
  const currentJobLabel = toStr(targetContext?.currentJobLabel) || "현재 역할";
  const actionSignals = takeTransitionLiteCurrentActionSignals(targetContext);
  const sourceExperienceType = toStr(generationTags?.sourceExperienceType);
  const sourceExperienceNuance = toStr(generationTags?.sourceExperienceNuance);
  const hasOriginEvidence = Boolean(evidenceContext?.hasSupportLine || evidenceContext?.hasAnyEvidenceText);

  if (sourceExperienceType === "STAKEHOLDER_COORDINATION") {
    if (sourceExperienceNuance === "COMPLIANCE_SENSITIVE") {
      return `${currentJobLabel}에서 여러 부서 요청이 충돌할 때도 기준과 절차를 먼저 맞추고, 오류 없이 실행안을 정리해 온 경험이 있다면, 이를 전환 과정에서 조율 역량으로 활용할 수 있습니다.`;
    }
    if (sourceExperienceNuance === "CROSS_FUNCTIONAL") {
      return `${currentJobLabel}에서 여러 부서와 이해관계자 요청이 한꺼번에 들어올 때 우선순위를 맞추고 실행안으로 묶어 온 경험이 있다면, 이를 강점으로 정리해볼 수 있습니다.`;
    }
    if (sourceExperienceNuance === "CUSTOMER_FACING") {
      if (hasOriginEvidence) {
        return `${currentJobLabel}에서 사용자 요구와 내부 요청이 엇갈릴 때 혼선을 정리해 실행 기준으로 연결한 경험을 바탕으로, 전환 과정에서 조율 역량으로 설명해볼 수 있습니다.`;
      }
      return `${currentJobLabel}에서 사용자 요구와 내부 요청이 엇갈릴 때도 혼선을 정리해 실행 기준으로 연결해 온 경험이 있다면, 전환 과정에서 조율 역량으로 활용할 수 있습니다.`;
    }
    if (sourceExperienceNuance === "OPERATIONS") {
      return `${currentJobLabel}에서 운영 이슈와 유관부서 요청이 겹칠 때 처리 흐름이 끊기지 않게 조율해 온 경험이 있다면, 이를 핵심 강점으로 설명해볼 수 있습니다.`;
    }
    return `${currentJobLabel}에서 여러 부서와 이해관계자 요청을 모아 실행안으로 정리해 온 경험이 있다면, 이를 전환 근거로 활용할 수 있습니다.`;
  }

  if (sourceExperienceType === "PRIORITY_HANDLING") {
    if (sourceExperienceNuance === "COMPLIANCE_SENSITIVE") {
      return `${currentJobLabel}에서 기준과 절차를 벗어나지 않는 선에서 급한 이슈와 누락 위험을 먼저 가려 처리 순서를 조정해 온 경험이 있다면, 이를 전환 과정에서의 판단 근거로 활용할 수 있습니다.`;
    }
    if (sourceExperienceNuance === "CROSS_FUNCTIONAL") {
      return `${currentJobLabel}에서 여러 부서 요청이 충돌할 때 영향도와 마감 기준으로 우선순위를 다시 세우고 실행 순서를 맞춰 온 경험이 있다면, 조율 역량으로 어필할 수 있습니다.`;
    }
    if (sourceExperienceNuance === "CUSTOMER_FACING") {
      if (hasOriginEvidence) {
        return `${currentJobLabel}에서 반복 문의와 사용자 혼선이 커지는 지점을 먼저 정리하고, 이를 기반으로 급한 이슈부터 처리 순서를 잡은 사례를 통해 우선순위 판단 능력으로 설명해볼 수 있습니다.`;
      }
      return `${currentJobLabel}에서 반복 문의와 사용자 혼선이 커지는 지점을 먼저 정리하고, 급한 이슈부터 처리 순서를 잡아 온 경험이 있다면, 우선순위 판단 능력으로 설명해볼 수 있습니다.`;
    }
    if (sourceExperienceNuance === "OPERATIONS") {
      return `${currentJobLabel}에서 운영 이슈와 실행 과제가 몰릴 때 병목이 생기는 지점부터 우선순위를 나눠 처리해 온 경험이 있다면, 이를 강점으로 정리해볼 수 있습니다.`;
    }
    return `${currentJobLabel}에서 여러 요청과 이슈를 우선순위로 나누고 실행 순서를 맞춰 온 경험이 있다면, 의사결정 역량으로 활용할 수 있습니다.`;
  }

  if (sourceExperienceType === "PROCESS_DISCIPLINE") {
    if (sourceExperienceNuance === "COMPLIANCE_SENSITIVE") {
      return `${currentJobLabel}에서 기준과 절차가 흔들리면 오류가 커지는 지점을 먼저 점검하고, 정합성을 맞추며 결과를 관리해 온 경험이 있다면, 이를 리스크 관리 역량으로 활용할 수 있습니다.`;
    }
    if (sourceExperienceNuance === "CROSS_FUNCTIONAL") {
      return `${currentJobLabel}에서 유관부서 간 처리 기준이 어긋나지 않게 맞추고, 절차 혼선을 줄이면서 결과를 관리해 온 경험이 있다면, 조율 및 표준화 역량으로 설명해볼 수 있습니다.`;
    }
    if (sourceExperienceNuance === "CUSTOMER_FACING") {
      if (hasOriginEvidence) {
        return `${currentJobLabel}에서 사용자 응대나 처리 과정에서 혼선이 생기지 않도록 기준을 정리하고 결과를 관리해 온 경험을 바탕으로, 고객 지향 운영 능력을 구체적으로 설명할 수 있습니다.`;
      }
      return `${currentJobLabel}에서 사용자 응대나 처리 과정에서 혼선이 생기지 않도록 기준을 정리하고 결과를 관리해 온 경험이 있다면, 고객 지향 운영 능력으로 정리할 수 있습니다.`;
    }
    if (sourceExperienceNuance === "OPERATIONS") {
      return `${currentJobLabel}에서 운영 기준과 처리 절차를 놓치지 않으면서도 일정과 결과를 안정적으로 관리해 온 경험이 있다면, 실행력과 엄밀성을 강점으로 어필할 수 있습니다.`;
    }
    return `${currentJobLabel}에서 기준과 절차를 놓치지 않으면서도 일정과 결과를 끝까지 관리해 온 경험이 있다면, 이를 전환 과정에서의 강점으로 활용할 수 있습니다.`;
  }

  if (sourceExperienceType === "FLOW_OBSERVATION") {
    return `${currentJobLabel}에서 운영 흐름을 보며 병목이 생기는 지점을 먼저 찾고 손볼 순서를 잡아 온 경험이 있다면, 프로세스 개선 능력으로 활용할 수 있습니다.`;
  }

  if (sourceExperienceType === "REPEATED_ISSUE_READING") {
    return `${currentJobLabel}에서 반복되는 문제를 나눠 보고 원인을 정리해 대응 방향을 잡아 온 경험이 있다면, 분석 및 문제해결 역량으로 어필할 수 있습니다.`;
  }

  if (actionSignals.length >= 2) {
    return `${currentJobLabel}에서 ${actionSignals[0]}, ${actionSignals[1]}을 함께 다뤄본 경험이 있다면, 이를 통합 역량으로 설명해볼 수 있습니다.`;
  }

  const currentSummary =
    takeFirstMeaningfulSentence(targetContext?.currentJobRead?.summary) ||
    takeFirstMeaningfulSentence(getPrimaryFamily(targetContext?.currentJobItem)?.summaryTemplate);
  if (currentSummary) {
    return `${currentSummary.replace(/^이 직무는 /, "").replace(/^이 역할은 /, "")} 경험을 보유하고 있다면, 이를 강점으로 정리해볼 수 있습니다.`;
  }

  const currentIndustryContext = normalizeTransitionLiteSentence(toArr(targetContext?.currentIndustry?.coreContext)[0]);
  if (currentIndustryContext) {
    return `${currentIndustryContext} 흐름 안에서 실행을 조율해 온 경험이 있다면, 산업 이해 기반의 전환으로 설명할 수 있습니다.`;
  }

  return "";
}

function buildTransitionLiteIndustryTranslationLine(targetContext = {}, generationTags = {}) {
  const targetIndustryLabel = toStr(targetContext?.targetIndustryLabel) || "목표 산업";
  const targetJobLabel = toStr(targetContext?.targetJobLabel) || "목표 직무";
  const targetStructureTags = toArr(generationTags?.targetStructureTags);
  const contextLine = stripTransitionLiteLead(
    toArr(targetContext?.targetIndustry?.coreContext)[0] ||
      toArr(targetContext?.industryTraitsAsset?.whyIndustryMatters)[0] ||
      toArr(targetContext?.targetIndustryRead?.bullets)[0],
    ["결과물은 보고서지만 실제 가치는 ", "이 산업은 ", "같은 직무라도 ", "결과물은 ", "성과는 "]
  );
  const decisionLine = stripTransitionLiteLead(
    toArr(targetContext?.targetIndustry?.decisionStructure)[0] ||
      toArr(targetContext?.targetIndustry?.buyingMotion)[0],
    ["사업 추진은 ", "조직 의사결정은 ", "고객사 경영진, ", "실사용 부서, "]
  );
  const contextClause = toTransitionLiteClause(contextLine);
  const decisionClause = toTransitionLiteClause(decisionLine);

  const customerMarket = toStr(targetContext?.targetIndustry?.customerMarket);
  const isB2CProductIndustry = /B2C|비투씨|플랫폼|모바일 앱|앱 서비스|앱서비스|커머스|이커머스|마켓플레이스|O2O|구독|콘텐츠 플랫폼|커뮤니티 플랫폼|소비자 서비스|D2C|리테일 플랫폼/.test(`${targetIndustryLabel} ${customerMarket}`);
  const isProductExecutionJob = /프로젝트관리|PM|PO|PL|Product Manager|Product Owner|서비스기획|서비스 기획|프로덕트|프로덕트매니저|기획|서비스 운영 기획/.test(targetJobLabel);

  if (isB2CProductIndustry && isProductExecutionJob) {
    return `${targetIndustryLabel}에서는 요구사항 정리나 협업 조율 경험이 제품·개발·디자인·마케팅 간 실행을 맞추는 역할로 읽힙니다.`;
  }

  if (targetStructureTags.includes("PUBLIC_PROCESS")) {
    return `${targetIndustryLabel}에서는 이 경험이 빠른 처리보다 기준과 절차를 이해한 상태에서 설명 가능한 실행으로 읽힙니다.`;
  }

  if (targetStructureTags.includes("EXPERT_BUYING") && targetStructureTags.includes("LONG_CYCLE")) {
    return `${targetIndustryLabel}에서는 이 경험이 단순 실행보다 고객의 질문을 구조화하고 긴 검토 과정을 버티는 힘으로 읽힙니다.`;
  }

  if (targetStructureTags.includes("FIELD_CONSTRAINT")) {
    return `${targetIndustryLabel}에서는 이 경험이 현장 변수와 운영 제약을 먼저 읽고 실행안을 조정하는 감각으로 이어집니다.`;
  }

  if (contextClause && decisionClause) {
    return `${targetIndustryLabel}에서는 ${contextClause}는 맥락과 ${decisionClause}는 의사결정 구조를 함께 이해한 경험으로 설명하는 편이 맞습니다.`;
  }

  if (contextClause) {
    return `${targetIndustryLabel}에서는 이 경험이 ${contextClause}는 맥락을 읽고 움직인 사례로 해석됩니다.`;
  }

  return "";
}

function buildTransitionLiteScopeTranslationLine(targetContext = {}, generationTags = {}) {
  const targetJobLabel = toStr(targetContext?.targetJobLabel) || "목표 직무";
  const actionSignals = takeTransitionLiteTargetActionSignals(targetContext);
  const depthLine =
    normalizeTransitionLiteSentence(toArr(getPrimaryFamily(targetContext?.targetJobItem)?.boundarySignals)[0]) ||
    normalizeTransitionLiteSentence(toArr(getJobLevelHints(targetContext?.targetJobItem))[0]) ||
    normalizeTransitionLiteSentence(toArr(targetContext?.targetJobRead?.bullets)[1]);

  if (actionSignals.length >= 2) {
    return `${targetJobLabel}에서는 무엇을 했는가보다 ${actionSignals[0]}과 ${actionSignals[1]}까지 어디에 관여했는지로 해석됩니다.`;
  }

  if (depthLine) {
    return `${targetJobLabel}에서는 역할 범위와 관여 깊이를 ${depthLine.toLowerCase()}는 쪽으로 설명해야 맥락이 맞습니다.`;
  }

  if (toStr(generationTags?.sourceExperienceType) === "STAKEHOLDER_COORDINATION") {
    return `${targetJobLabel}에서는 이 경험이 단순 지원보다 여러 주체를 묶어 방향을 맞춘 역할로 읽힙니다.`;
  }

  return "";
}

function buildTransitionLiteGenericTranslationLine(targetContext = {}) {
  const targetJobLabel = toStr(targetContext?.targetJobLabel) || "목표 직무";
  const targetIndustryLabel = toStr(targetContext?.targetIndustryLabel) || "목표 산업";
  return `${targetJobLabel}와 ${targetIndustryLabel} 맥락에서는 이 경험을 문제를 어떻게 정리하고 실행으로 연결했는지 중심으로 풀어야 합니다.`;
}

function buildTransitionLiteInterviewLinkageLine(primaryRiskKey, targetContext = {}, whyThisReadSupportLine = "", generationTags = {}) {
  const targetIndustryLabel = toStr(targetContext?.targetIndustryLabel) || "목표 산업";
  const targetJobLabel = toStr(targetContext?.targetJobLabel) || "목표 직무";
  const supportLine = normalizeTransitionLiteSentence(whyThisReadSupportLine);
  const customerMarket = toStr(targetContext?.targetIndustry?.customerMarket);
  const compoundTargetText = `${targetJobLabel} ${targetIndustryLabel} ${customerMarket}`.toLowerCase();

  if (primaryRiskKey === RISK_INDUSTRY_CONTEXT_SHIFT) {
    if (toArr(generationTags?.targetStructureTags).includes("PUBLIC_PROCESS")) {
      return `면접에서는 "${targetIndustryLabel}에서는 왜 그 방식이 절차와 설명 책임에 맞았는지"를 사례 하나로 바로 말하는 편이 좋습니다.`;
    }
    if (/핀테크|증권|자산운용|금융|은행|보험|투자/.test(compoundTargetText) && /서비스기획|pm|po|기획/.test(compoundTargetText)) {
      return `면접에서는 "${targetIndustryLabel}에서 신뢰와 규제를 고려했을 때, 왜 그 사용자 경험과 제품 판단을 내렸는지"를 사례로 말하는 편이 좋습니다.`;
    }
    if (/의료|헬스|병원|디지털헬스|환자|약|식약|보건/.test(compoundTargetText) && /서비스기획|pm|po|기획/.test(compoundTargetText)) {
      return `면접에서는 "${targetIndustryLabel}에서 환자 안전과 의료 신뢰를 바탕으로, 왜 그 서비스 설계와 운영 방식을 선택했는지"를 사례로 말하는 편이 좋습니다.`;
    }
    if (/브랜드|뷰티|소비재|화장품|콘텐츠|엔터/.test(compoundTargetText)) {
      return `면접에서는 "${targetIndustryLabel}에서 고객 인식 변화와 구매전환을 만들기 위해, 왜 그 채널과 메시지로 실험했는지"를 사례로 말하는 편이 좋습니다.`;
    }
    return `면접에서는 "${targetIndustryLabel}의 고객 구조에서 왜 그 방식으로 문제를 풀었는지"를 사례 하나로 바로 연결해 말하는 편이 좋습니다.`;
  }

  if (primaryRiskKey === RISK_SCOPE_REINTERPRETATION) {
    if (supportLine) {
      return `면접에서는 "${targetJobLabel} 기준으로 어디까지 맡았고 누구와 어떻게 맞췄는지"를 먼저 꺼내는 편이 좋습니다.`;
    }
    return `면접에서는 "${targetJobLabel}에서 맡게 될 범위와 연결되는 지점이 어디인지"를 먼저 짚고, 어디까지 관여했는지 붙여 말하면 됩니다.`;
  }

  return `면접에서는 "${targetJobLabel} 기준에서 내가 남긴 결과와 판단 방식이 무엇인지"를 한 문장으로 먼저 정리해 두는 편이 좋습니다.`;
}

function buildTransitionCompoundRead({
  classification = {},
  targetContext = {},
  generationTags = {},
  transitionReadBlock = {},
} = {}) {
  const targetJobLabel = toStr(targetContext?.targetJobLabel) || "목표 직무";
  const targetIndustryLabel = toStr(targetContext?.targetIndustryLabel) || "목표 산업";
  const currentJobLabel = toStr(targetContext?.currentJobLabel) || "현재 역할";
  const currentIndustryLabel = toStr(targetContext?.currentIndustry?.label) || "현재 산업";

  const targetStructureTags = toArr(generationTags?.targetStructureTags);
  const jobDistance = toStr(classification?.jobDistance);
  const industryDistance = toStr(classification?.industryDistance);
  const sourceExperienceType = toStr(generationTags?.sourceExperienceType);

  const targetJobItem = targetContext?.targetJobItem;
  const targetIndustry = targetContext?.targetIndustry;

  if (!targetJobLabel || !targetIndustryLabel) {
    return null;
  }

  let headline = "";
  let body = "";
  let actionFrame = "";

  const compoundTargetText = normalizeText(`${targetJobLabel} ${targetIndustryLabel}`);
  const isCreativeDesignJob = /영상|디자인|콘텐츠|모션|그래픽|브랜드|크리에이티브|시각/.test(compoundTargetText);
  const isInfraPlantIndustry = /플랜트|인프라|건설|엔지니어링|EPC|시공|설계|발주|프로젝트/.test(compoundTargetText);

  const isPublicJob = /공공|지원사업|정책|기관|사업 운영|사업관리/.test(targetJobLabel);
  const isHealthcareTarget = /의료|헬스|병원|약|식약|보건|환자/.test(compoundTargetText);
  const isBrandingConsumerTarget = /브랜드|콘텐츠|뷰티|소비재|화장품/.test(compoundTargetText) && /마케팅|기획|콘텐츠|브랜드/.test(targetJobLabel);
  const isServicePlanningJob = /서비스기획|서비스 기획|PM|프로덕트|프로덕트매니저|기획/.test(targetJobLabel);
  const isFinanceTarget = /핀테크|증권|자산운용|자산|금융|은행|보험|투자/.test(compoundTargetText);
  const isProductExecutionJob = /프로젝트관리|PM|PO|PL|Product Manager|Product Owner|서비스기획|서비스 기획|프로덕트|프로덕트매니저|기획|서비스 운영 기획/.test(targetJobLabel);
  const isB2CProductIndustry = /B2C|비투씨|플랫폼|모바일 앱|앱 서비스|앱서비스|커머스|이커머스|마켓플레이스|O2O|구독|콘텐츠 플랫폼|커뮤니티 플랫폼|소비자 서비스|D2C|리테일 플랫폼/.test(compoundTargetText);

  // Creative/Design + Infrastructure case (before PUBLIC_PROCESS)
  if (isCreativeDesignJob && isInfraPlantIndustry) {
    headline = `${targetIndustryLabel}에서 ${targetJobLabel}은 복잡한 기술·사업 내용을 이해관계자가 이해할 수 있는 시각 자료와 영상 메시지로 바꾸는 역할로 읽힙니다.`;
    body = `현재 ${currentJobLabel} 경험은 제도와 기준을 정리해 온 경험으로 연결될 수 있지만, ${targetIndustryLabel}에서는 발주처·시공사·엔지니어링 조직이 이해할 수 있도록 핵심 메시지와 근거를 시각적으로 구조화해 설명해야 설득력이 생깁니다.`;
    actionFrame = `준비할 때는 "디자인을 만들었다"보다 "복잡한 사업 내용을 누구에게 어떤 메시지로 이해시켰는가"를 스토리보드, 영상 목적, 전달 대상 중심으로 정리하는 편이 좋습니다.`;

    if (headline && body && actionFrame) {
      return {
        title: "이 전환은 어떻게 읽히나요?",
        headline,
        body,
        actionFrame,
        signals: ["기술·사업 내용의 시각화", "이해관계자 설득 자료", "스토리보드 기반 메시지 구조화"],
        cautions: ["감각적 디자인만 강조하면 산업 문맥이 약해짐"],
        source: "transition_compound_read.v1"
      };
    }
  }

  // Healthcare service planning branch
  if (isHealthcareTarget && isServicePlanningJob) {
    headline = `${targetIndustryLabel}에서 ${targetJobLabel}은 환자 안전과 의료 신뢰를 해치지 않으면서 서비스 경험과 운영 효율을 함께 설계하는 역할로 읽힙니다.`;
    body = `현재 ${currentJobLabel} 경험은 사용자 흐름을 정리하고 운영 문제를 개선한 경험으로 연결될 수 있지만, ${targetIndustryLabel}에서는 개인정보·규제·의료 신뢰 기준 안에서 왜 그 설계가 안전하고 타당한지까지 설명해야 설득력이 커집니다.`;
    actionFrame = `준비할 때는 "기능을 기획했다"보다 "사용자 경험, 운영 효율, 안전·신뢰 기준을 어떻게 함께 맞췄는가"를 사례로 정리하는 편이 좋습니다.`;

    if (headline && body && actionFrame) {
      return {
        title: "이 전환은 어떻게 읽히나요?",
        headline,
        body,
        actionFrame,
        signals: ["환자 안전과 의료 신뢰", "개인정보·규제 기준", "서비스 경험과 운영 효율"],
        cautions: ["일반 서비스 개선만 강조하면 의료/헬스케어 문맥이 약해짐"],
        source: "transition_compound_read.v1"
      };
    }
  }

  // Finance service planning branch
  if (isFinanceTarget && isServicePlanningJob) {
    headline = `${targetIndustryLabel}에서 ${targetJobLabel}은 고객 신뢰와 규제 기준을 지키면서 금융 경험을 제품과 UX로 설계하는 역할로 읽힙니다.`;
    body = `현재 ${currentJobLabel} 경험은 고객 접점과 서비스 흐름을 개선한 경험으로 연결될 수 있지만, ${targetIndustryLabel}에서는 투자자·사용자 보호, 설명 책임, 리스크 관리 기준 안에서 왜 그 설계가 타당한지까지 보여줘야 합니다.`;
    actionFrame = `준비할 때는 "서비스를 개선했다"보다 "금융 신뢰, 규제 기준, 사용자 보호를 고려해 어떤 UX와 제품 판단을 했는가"를 사례로 정리하는 편이 좋습니다.`;

    if (headline && body && actionFrame) {
      return {
        title: "이 전환은 어떻게 읽히나요?",
        headline,
        body,
        actionFrame,
        signals: ["금융 신뢰와 규제 기준", "투자자·사용자 보호", "제품·UX 설계"],
        cautions: ["일반 플랫폼 기획처럼만 설명하면 금융 산업의 신뢰 기준이 약해짐"],
        source: "transition_compound_read.v1"
      };
    }
  }

  // Brand/content + consumer/beauty branch
  if (isBrandingConsumerTarget) {
    headline = `${targetIndustryLabel}에서 ${targetJobLabel}은 고객 인식과 구매전환을 움직이는 브랜드 메시지와 콘텐츠 실험을 설계하는 역할로 읽힙니다.`;
    body = `현재 ${currentJobLabel} 경험은 메시지를 만들고 고객 반응을 확인한 경험으로 연결될 수 있지만, ${targetIndustryLabel}에서는 브랜드 감도, 채널별 반응, 구매 전환까지 이어지는 흐름을 숫자와 사례로 보여줘야 설득력이 생깁니다.`;
    actionFrame = `준비할 때는 "콘텐츠를 만들었다"보다 "어떤 고객 인식을 바꾸고, 어떤 채널에서 반응과 전환을 만들었는가"를 캠페인·콘텐츠·성과 단위로 정리하는 편이 좋습니다.`;

    if (headline && body && actionFrame) {
      return {
        title: "이 전환은 어떻게 읽히나요?",
        headline,
        body,
        actionFrame,
        signals: ["브랜드 메시지", "고객 인식 변화", "구매전환과 채널 실험"],
        cautions: ["콘텐츠 제작량만 강조하면 소비재/뷰티의 전환 문맥이 약해짐"],
        source: "transition_compound_read.v1"
      };
    }
  }

  // B2C/platform product execution branch
  if (isB2CProductIndustry && isProductExecutionJob) {
    headline = `${targetIndustryLabel}에서 ${targetJobLabel}은 사용자 행동과 핵심 지표를 기준으로 제품·개발·디자인·마케팅 조직의 실행을 조율하는 역할로 읽힙니다.`;
    body = `현재 ${currentJobLabel} 경험은 요구사항을 정리하고 협업을 조율한 경험으로 연결될 수 있지만, ${targetIndustryLabel}에서는 기능 출시, 우선순위 조정, 이슈 관리, 사용자 지표 개선까지 이어진 사례로 설명해야 설득력이 커집니다.`;
    actionFrame = `준비할 때는 "무엇을 기획했는가"보다 "어떤 문제를 일정과 범위 안에서 조율했고, 사용자 행동이나 제품 지표가 어떻게 달라졌는가"를 사례로 정리하는 편이 좋습니다.`;

    if (headline && body && actionFrame) {
      return {
        title: "이 전환은 어떻게 읽히나요?",
        headline,
        body,
        actionFrame,
        signals: ["사용자 행동과 핵심 지표", "제품·개발·디자인·마케팅 협업", "릴리즈·우선순위·이슈 관리"],
        cautions: ["클라이언트 요청 처리나 캠페인 실행만 강조하면 제품 지표 중심의 플랫폼 문맥이 약해짐"],
        source: "transition_compound_read.v1"
      };
    }
  }

  // Case 1: PUBLIC_PROCESS (exclude healthcare & branding+consumer targets)
  if (targetStructureTags.includes("PUBLIC_PROCESS") && !isHealthcareTarget && !isBrandingConsumerTarget) {
    headline = `${targetIndustryLabel}에서 ${targetJobLabel}은 단순 운영보다 기준·절차·이해관계자 설명 책임을 함께 다루는 역할로 읽힙니다.`;
    body = `현재 ${currentJobLabel} 경험은 운영 기준을 맞추고 문제를 정리한 경험으로 연결될 수 있지만, ${targetIndustryLabel}에서는 예산·정책·감시 구조 안에서 왜 그 방식이 타당했는지까지 설명해야 설득력이 커집니다.`;
    actionFrame = `준비할 때는 "무엇을 처리했는가"보다 "어떤 기준을 지켰고, 누구에게 어떤 근거로 설명했는가"를 사례로 정리하는 편이 좋습니다.`;

    if (headline && body && actionFrame) {
      return {
        title: "이 전환은 어떻게 읽히나요?",
        headline,
        body,
        actionFrame,
        signals: ["기준과 절차 이해", "예산·정책·감시 문맥", "이해관계자 설명"],
        cautions: ["단순 실행 경험만으로는 부족함"],
        source: "transition_compound_read.v1"
      };
    }
  }

  // Case 2: EXPERT_BUYING or LONG_CYCLE
  if (targetStructureTags.includes("EXPERT_BUYING") || targetStructureTags.includes("LONG_CYCLE")) {
    const isHealthcare = /의료|헬스|병원|약|식약|보건/.test(`${targetIndustryLabel}${targetJobLabel}`);

    if (isHealthcare) {
      headline = `${targetIndustryLabel}에서 ${targetJobLabel}은 의료 전문가의 신뢰와 장기적 가치 창출을 함께 고려하는 역할로 읽힙니다.`;
      body = `현재 ${currentJobLabel} 경험이 의료 현장의 실제 니즈를 반영한 사례라면 좋지만, ${targetIndustryLabel}의 전문가 검증 과정과 신뢰 구축, 장기적 의료 가치까지 함께 설명해야 맥락이 맞습니다.`;
      actionFrame = `준비할 때는 "빠른 성과"보다 "의료 전문가가 신뢰할 수 있는 근거와 장기적 안전성"을 말할 수 있게 정리하는 편이 좋습니다.`;
    } else {
      headline = `${targetIndustryLabel}에서 ${targetJobLabel}은 빠른 실행보다 전문가 검토와 신뢰 형성을 함께 다루는 역할로 읽힙니다.`;
      body = `현재 ${currentJobLabel} 경험이 실제 변화를 만들었던 사례라면 좋지만, ${targetIndustryLabel}의 구매 구조와 의사결정 주기, 검토 과정을 함께 설명해야 맥락이 맞습니다.`;
      actionFrame = `준비할 때는 "결과가 빠르게 나왔다"보다 "검토와 승인 과정에서 어떤 기준으로 신뢰를 얻었는지"를 말할 수 있게 정리하는 편이 좋습니다.`;
    }

    if (headline && body && actionFrame) {
      return {
        title: "이 전환은 어떻게 읽히나요?",
        headline,
        body,
        actionFrame,
        signals: isHealthcare ? ["의료 전문가 신뢰", "장기 가치 창출"] : ["전문가 신뢰 형성", "긴 의사결정 주기 이해"],
        cautions: isHealthcare ? ["빠른 성과보다 안전성 검증 우선"] : ["빠른 성과 중심의 설명은 피함"],
        source: "transition_compound_read.v1"
      };
    }
  }

  // Case 3-A: PUBLIC_JOB + FINANCIAL (공공성 × 금융 산업)
  if (isPublicJob && /증권|자산|금융|은행|보험|투자/.test(targetIndustryLabel)) {
    headline = `${targetIndustryLabel}에서 ${targetJobLabel}은 공공성 있는 사업 운영을 금융 산업의 신뢰·규제·투자자 보호 문맥 안에서 실행하는 역할로 읽힙니다.`;
    body = `현재 ${currentJobLabel} 경험은 기준을 맞추고 오류를 줄이는 실행 감각으로 연결될 수 있지만, ${targetIndustryLabel}에서는 금융상품·투자자·감독 기준이 얽힌 상황에서 왜 그 운영 방식이 안전하고 설명 가능한지까지 말해야 설득력이 생깁니다.`;
    actionFrame = `준비할 때는 "운영을 잘했다"보다 "금융 산업의 기준과 공공적 설명 책임을 동시에 고려해 어떻게 판단했는가"를 사례로 정리하는 편이 좋습니다.`;

    if (headline && body && actionFrame) {
      return {
        title: "이 전환은 어떻게 읽히나요?",
        headline,
        body,
        actionFrame,
        signals: ["금융 신뢰·규제 문맥", "공공성 있는 운영", "설명 가능한 기준 판단"],
        cautions: ["금융 문맥 없이 운영 일반론으로만 설명하면 약함"],
        source: "transition_compound_read.v1"
      };
    }
  }

  // Case 3: REGULATED
  if (targetStructureTags.includes("REGULATED")) {
    // 핀테크, 금융 특수화
    const isFinancialOrFintech = /핀테크|증권|자산|금융|은행|보험/.test(`${targetIndustryLabel}${targetJobLabel}`);
    const isHealthcare = /의료|헬스|병원|약|식약|보건/.test(`${targetIndustryLabel}${targetJobLabel}`);
    const isServiceRole = /기획|분석|리더|전략|매니저/.test(targetJobLabel);

    if (isFinancialOrFintech && isServiceRole) {
      headline = `${targetIndustryLabel}에서 ${targetJobLabel}은 규제 준수와 고객 신뢰를 기반으로 한 제품/서비스 설계를 함께 다루는 역할로 읽힙니다.`;
      body = `현재 ${currentJobLabel} 경험이 금융 고객의 니즈를 이해한 사례라면 좋지만, ${targetIndustryLabel}의 규제 환경 속에서 그 니즈를 어떻게 제품/UX로 구현했는지까지 설명해야 설득력이 커집니다.`;
      actionFrame = `준비할 때는 "효율적으로 처리했다"보다 "규제 안에서 고객 경험을 어떻게 개선했는지"를 말할 수 있게 정리하는 편이 좋습니다.`;
    } else if (isHealthcare && isServiceRole) {
      headline = `${targetIndustryLabel}에서 ${targetJobLabel}은 환자 안전·신뢰와 운영 효율을 함께 고려하는 역할로 읽힙니다.`;
      body = `현재 ${currentJobLabel} 경험이 실제 현장의 문제를 정리한 사례라면 좋지만, ${targetIndustryLabel}의 규제 환경과 환자 안전 기준, 신뢰 구조까지 함께 설명해야 설득력이 생깁니다.`;
      actionFrame = `준비할 때는 "효율적으로 처리했다"보다 "안전과 신뢰를 유지하면서 어떻게 개선했는지"를 말할 수 있게 정리하는 편이 좋습니다.`;
    } else {
      headline = `${targetIndustryLabel}에서 ${targetJobLabel}은 운영 효율성과 규제·리스크 관리를 함께 다루는 역할로 읽힙니다.`;
      body = `현재 ${currentJobLabel} 경험은 문제를 빠르게 해결한 사례로 활용할 수 있지만, ${targetIndustryLabel}의 규제 기준과 신뢰 구조, 리스크 판단 기준까지 함께 설명해야 설득력이 생깁니다.`;
      actionFrame = `준비할 때는 "효율적으로 처리했다"보다 "기준을 지키면서 효율을 어떻게 만들었는지"를 말할 수 있게 정리하는 편이 좋습니다.`;
    }

    if (headline && body && actionFrame) {
      return {
        title: "이 전환은 어떻게 읽히나요?",
        headline,
        body,
        actionFrame,
        signals: isFinancialOrFintech || isHealthcare ? (isFinancialOrFintech ? ["규제 준수", "고객 신뢰 형성", "제품화"] : ["환자 안전", "규제 준수", "신뢰 관리"]) : ["규제·기준 준수", "리스크 관리 감각"],
        cautions: isFinancialOrFintech || isHealthcare ? [] : ["규정을 무시한 빠른 처리는 리스크"],
        source: "transition_compound_read.v1"
      };
    }
  }

  // Case 4: targetJob actionSignals >= 2
  const actionSignals = targetJobItem
    ? uniqueStrings([
        ...toArr(getJobResponsibilityHints(targetJobItem)),
        ...toArr(getPrimaryFamily(targetJobItem)?.strongSignals),
      ]).slice(0, 2)
    : [];

  if (actionSignals.length >= 2) {
    const isHealthcare = /의료|헬스|병원|약|식약|보건/.test(`${targetIndustryLabel}${currentJobLabel}`);
    const isServiceOrProductRole = /기획|전략|분석|리더|매니저/.test(targetJobLabel);

    let contextPhrase = "";
    if (isHealthcare && isServiceOrProductRole) {
      contextPhrase = `${targetIndustryLabel}의 환자 중심 가치`;
    } else if (isServiceOrProductRole) {
      contextPhrase = `${targetIndustryLabel}의 비즈니스 맥락`;
    } else {
      contextPhrase = `${targetIndustryLabel}의 평가 기준`;
    }

    headline = `${targetIndustryLabel}에서 ${targetJobLabel}은 ${actionSignals[0]}과 ${actionSignals[1]}을 ${contextPhrase}에 맞춰 연결하는 역할로 읽힙니다.`;
    body = `현재 ${currentJobLabel} 경험이 두 영역을 함께 다룬 사례가 있다면 좋지만, ${contextPhrase} 안에서 어떻게 그 두 요소를 함께 움직였는지를 설명해야 합니다.`;
    actionFrame = `준비할 때는 각각의 역할만 보여주기보다, ${contextPhrase} 안에서 둘이 어떻게 함께 작동하는지를 말할 수 있게 정리하는 편이 좋습니다.`;

    if (headline && body && actionFrame) {
      return {
        title: "이 전환은 어떻게 읽히나요?",
        headline,
        body,
        actionFrame,
        signals: actionSignals.slice(0, 2),
        cautions: [],
        source: "transition_compound_read.v1"
      };
    }
  }

  // Case 5: Fallback
  if (industryDistance === "cross" || jobDistance === "cross") {
    headline = `${targetIndustryLabel}에서 ${targetJobLabel}로 이동한다는 것은 직무 역할만 바꾸는 것이 아니라, 그 역할을 평가하는 산업 문맥까지 함께 바뀌는 전환입니다.`;
    body = `현재 ${currentJobLabel} 경험은 문제를 정리하고 실행으로 연결한 사례로 활용할 수 있지만, 목표 산업에서 어떤 기준으로 성과와 리스크를 판단하는지까지 붙여 설명해야 합니다.`;
    actionFrame = `준비할 때는 "무엇을 했다"보다 "${targetIndustryLabel}의 기준에서 왜 그 방식이 맞았는지"를 말할 수 있게 정리하는 편이 좋습니다.`;

    if (headline && body && actionFrame) {
      return {
        title: "이 전환은 어떻게 읽히나요?",
        headline,
        body,
        actionFrame,
        signals: [],
        cautions: ["산업 맥락의 차이를 함께 설명해야 함"],
        source: "transition_compound_read.v1"
      };
    }
  }

  // Generic fallback
  headline = `${targetIndustryLabel}에서 ${targetJobLabel}로 이동한다는 것은 직무 역할만 바꾸는 것이 아니라, 그 역할을 평가하는 산업 문맥까지 함께 바뀌는 전환입니다.`;
  body = `현재 ${currentJobLabel} 경험은 문제를 정리하고 실행으로 연결한 사례로 활용할 수 있지만, 목표 산업에서 어떤 기준으로 성과와 리스크를 판단하는지까지 붙여 설명해야 합니다.`;
  actionFrame = `준비할 때는 "무엇을 했다"보다 "${targetIndustryLabel}의 기준에서 왜 그 방식이 맞았는지"를 말할 수 있게 정리하는 편이 좋습니다.`;

  return {
    title: "이 전환은 어떻게 읽히나요?",
    headline,
    body,
    actionFrame,
    signals: [],
    cautions: [],
    source: "transition_compound_read.v1"
  };
}

function pushTransitionLiteStrengthLine(lines = [], candidate = "", blockedTexts = []) {
  const text = toStr(candidate).replace(/\s+/g, " ").trim();
  if (!text) return;
  if (text.length > 180) return;
  if (hasMeaningfulTransitionLiteStrengthOverlap(text, lines)) return;
  if (hasMeaningfulTransitionLiteStrengthOverlap(text, blockedTexts)) return;
  lines.push(text);
}

function shouldPreferIndustryStrengthSignal(classification, questionMeta, targetIndustry) {
  const boundaryTaxonomyId = toStr(questionMeta?.boundaryTaxonomyId);
  const industrySector = toStr(targetIndustry?.sector);

  if (boundaryTaxonomyId === "INDUSTRY_SPECIALIZED_ROLE_SHIFT") return true;
  if (toStr(classification?.jobDistance) === "same" && toStr(classification?.industryDistance) !== "same") return true;
  if (industrySector === "PUBLIC_ASSOCIATION_NONPROFIT" || industrySector === "MANUFACTURING") return true;
  return false;
}

function shouldPreferJobStrengthSignal(classification) {
  return (
    toStr(classification?.industryDistance) === "same" &&
    toStr(classification?.jobDistance) === "adjacent"
  );
}

function buildTransitionLiteStrengths({
  classification,
  selectedRiskKeys,
  whyThisRead,
  whyThisReadSupportLine,
  transitionReadBlock,
  targetContext,
} = {}) {
  const questionMeta =
    transitionReadBlock?.meta?.selectedQuestionCard &&
    typeof transitionReadBlock.meta.selectedQuestionCard === "object"
      ? transitionReadBlock.meta.selectedQuestionCard
      : {};
  const generationTags = buildTransitionLiteGenerationTags({
    classification,
    selectedQuestionCardMeta: questionMeta,
    currentJobItem: targetContext?.currentJobItem,
    targetJobItem: targetContext?.targetJobItem,
    targetIndustry: targetContext?.targetIndustry,
  });
  const blockedTexts = buildTransitionLiteStrengthBlockedTexts({
    whyThisRead,
    whyThisReadSupportLine,
    transitionReadBlock,
    targetContext,
  });
  const strengths = [];
  const primaryRiskKey = toArr(selectedRiskKeys)[0] || "";
  const evidenceContext = buildTransitionLiteOriginEvidenceContext({ whyThisRead, whyThisReadSupportLine });

  const line1 = buildTransitionLiteCandidateOriginLine(targetContext, generationTags, evidenceContext);
  pushTransitionLiteStrengthLine(strengths, line1, blockedTexts);

  const line2 =
    primaryRiskKey === RISK_INDUSTRY_CONTEXT_SHIFT
      ? buildTransitionLiteIndustryTranslationLine(targetContext, generationTags)
      : primaryRiskKey === RISK_SCOPE_REINTERPRETATION
        ? buildTransitionLiteScopeTranslationLine(targetContext, generationTags)
        : buildTransitionLiteGenericTranslationLine(targetContext);
  pushTransitionLiteStrengthLine(strengths, line2, blockedTexts);

  const line3 = buildTransitionLiteInterviewLinkageLine(
    primaryRiskKey,
    targetContext,
    whyThisReadSupportLine,
    generationTags
  );
  pushTransitionLiteStrengthLine(strengths, line3, blockedTexts);

  if (strengths.length < 3) {
    const fallbackCandidates = [
      ...toArr(questionMeta?.strengthFocusCandidates),
      ...toArr(questionMeta?.strengthFocusFallbackCandidates),
      ...toArr(questionMeta?.strengthProofCandidates),
      ...pickTransitionLiteJobSignalCandidates(targetContext?.targetJobItem),
      ...uniqueStrings(toArr(questionMeta?.strengthSignalCandidates).slice(0, 1)),
      ...pickTransitionLiteIndustrySignalCandidates(targetContext?.targetIndustry).filter(
        (item) => !/수주|집행|입찰|예산|과제/.test(toStr(item))
      ),
    ];
    for (const candidate of fallbackCandidates) {
      pushTransitionLiteStrengthLine(strengths, candidate, blockedTexts);
      if (strengths.length >= 3) break;
    }
  }

  return uniqueStrings(strengths).slice(0, 3);
}

function pickTransitionLiteTargetContext(resolved) {
  return {
    currentJobId: toStr(resolved?.currentJobItem?.id),
    targetJobId: toStr(resolved?.targetJobItem?.id),
    currentJobLabel: toStr(resolved?.currentJobItem?.label),
    targetJobLabel: toStr(resolved?.targetJobItem?.label),
    targetIndustryLabel: toStr(resolved?.targetIndustryItem?.label),
    currentJobRead: buildTransitionLiteTargetJobRead(
      resolved.currentJobItem,
      resolved.currentJob
    ),
    targetJobRead: buildTransitionLiteTargetJobRead(
      resolved.targetJobItem,
      resolved.targetJob
    ),
    targetIndustryRead: buildTransitionLiteTargetIndustryRead(
      resolved.targetIndustryItem,
      resolved.targetIndustry
    ),
    industryTraitsAsset: getIndustryTraitsAsset(
      resolved.targetIndustryItem,
      resolved.targetIndustry
    ),
    currentIndustry: {
      ...(resolved?.currentIndustry || {}),
      ...(resolved?.currentIndustryItem || {}),
    },
    currentJobItem: resolved?.currentJobItem || null,
    targetIndustry: {
      ...(resolved?.targetIndustry || {}),
      ...(resolved?.targetIndustryItem || {}),
    },
    targetJobItem: resolved?.targetJobItem || null,
  };

}
function selectTransitionLiteHeroTemplateKey(classification) {
  const jobDistance = toStr(classification?.jobDistance) || "cross";
  const industryDistance = toStr(classification?.industryDistance) || "cross";

  if (jobDistance === "same" && industryDistance === "same") return "HERO_JOB_SAME_INDUSTRY_SAME";
  if (jobDistance === "same" && industryDistance === "adjacent") return "HERO_JOB_SAME_INDUSTRY_ADJACENT";
  if (jobDistance === "same") return "HERO_JOB_SAME_INDUSTRY_CROSS";
  if (jobDistance === "adjacent" && industryDistance === "same") return "HERO_JOB_ADJACENT_INDUSTRY_SAME";
  if (jobDistance === "adjacent" && industryDistance === "adjacent") return "HERO_JOB_ADJACENT_INDUSTRY_ADJACENT";
  if (jobDistance === "adjacent") return "HERO_JOB_ADJACENT_INDUSTRY_CROSS";
  if (industryDistance === "same") return "HERO_JOB_CROSS_INDUSTRY_SAME";
  if (industryDistance === "adjacent") return "HERO_JOB_CROSS_INDUSTRY_ADJACENT";
  return "HERO_JOB_CROSS_INDUSTRY_CROSS";
}


// Compose a context-specific risk headline by injecting target job/industry label.
// Falls back to the registry title when labels are unavailable.
function composeRiskTitle(riskKey, fallbackTitle, classification, targetContext) {
  const industryDistance = toStr(classification?.industryDistance);
  const targetIndustryLabel = toStr(targetContext?.targetIndustryLabel);
  const targetJobLabel = toStr(targetContext?.targetJobLabel);

  if (riskKey === RISK_INDUSTRY_CONTEXT_SHIFT) {
    if (targetIndustryLabel) {
      if (industryDistance === "adjacent") {
        return `${targetIndustryLabel} 업계 구조 차이 확인`;
      }
      return `새 ${targetIndustryLabel} 업계에서 통할 경험인지 확인`;
    }
    if (industryDistance === "adjacent") return "인접 업계 구조 차이 확인";
    return "새 업계 구조와 맥락에서 경험 연결 확인";
  }

  if (riskKey === RISK_JOB_EXPECTATION_SHIFT) {
    if (targetJobLabel) {
      return `${targetJobLabel} 직무 기준에 맞는 경험인지 확인`;
    }
    return "목표 직무 역할 기준 적합성 확인";
  }

  return fallbackTitle;
}

function buildTransitionLiteVM({ classification, selectedRiskKeys, whyThisRead, whyThisReadSupportLine, targetContext }) {
  const heroTemplateKey = selectTransitionLiteHeroTemplateKey(classification);
  const heroTemplate = getTransitionLiteHeroTemplate(heroTemplateKey);
  const transitionReadPatterns = getTransitionReadPatternCopyRegistry();
  const transitionReadPatternResult = buildTransitionReadPatternResult({
    currentJobId: targetContext?.currentJobId,
    targetJobId: targetContext?.targetJobId,
    classification,
  });
  const transitionReadBlock = buildTransitionReadBlock({
    currentJobLabel: targetContext?.currentJobLabel,
    targetJobLabel: targetContext?.targetJobLabel,
    currentIndustryLabel: targetContext?.currentIndustry?.label,
    targetIndustryLabel: targetContext?.targetIndustryLabel,
    classification,
    patternResult: transitionReadPatternResult,
    currentJobItem: targetContext?.currentJobItem,
    targetJobItem: targetContext?.targetJobItem,
    targetIndustry: targetContext?.targetIndustry,
  });
  const validationReadBlock = buildValidationReadBlock({
    currentJobLabel: targetContext?.currentJobLabel,
    targetJobLabel: targetContext?.targetJobLabel,
    currentIndustryLabel: targetContext?.currentIndustry?.label,
    targetIndustryLabel: targetContext?.targetIndustryLabel,
    currentJobItem: targetContext?.currentJobItem,
    targetJobItem: targetContext?.targetJobItem,
    currentIndustryItem: targetContext?.currentIndustry,
    targetIndustryItem: targetContext?.targetIndustry,
    targetJobRead: targetContext?.targetJobRead,
    targetIndustryRead: targetContext?.targetIndustryRead,
    industryTraitsAsset: targetContext?.industryTraitsAsset,
    transitionReadBlock,
  }) || null;
  const generationTags = buildTransitionLiteGenerationTags({
    classification,
    selectedQuestionCardMeta: transitionReadBlock?.meta?.selectedQuestionCard,
    currentJobItem: targetContext?.currentJobItem,
    targetJobItem: targetContext?.targetJobItem,
    targetIndustry: targetContext?.targetIndustry,
  });
  const transitionCompoundRead = buildTransitionCompoundRead({
    classification,
    targetContext,
    generationTags,
    transitionReadBlock,
  });
  const strengths = buildTransitionLiteStrengths({
    classification,
    selectedRiskKeys,
    whyThisRead,
    whyThisReadSupportLine,
    transitionReadBlock,
    targetContext,
  });

  const topRisks = selectedRiskKeys
    .map((riskKey) => {
      const variant = getTransitionLiteRiskVariant(riskKey, classification, selectedRiskKeys);
      const copy = getTransitionLiteRiskCopy(riskKey, variant, { classification, targetIndustry: targetContext?.targetIndustry });
      if (!copy?.title || !copy?.body) return null;
      const comparisonTable = riskKey === RISK_INDUSTRY_CONTEXT_SHIFT
        ? buildIndustryContextComparisonTable(
            targetContext?.currentIndustry,
            targetContext?.targetIndustry,
            classification
          )
        : riskKey === RISK_JOB_EXPECTATION_SHIFT || riskKey === RISK_SCOPE_REINTERPRETATION
          ? buildJobExpectationComparisonTable(
              targetContext?.currentJobItem,
              targetContext?.targetJobItem,
              classification
            )
        : null;
      return {
        key: riskKey,
        title: composeRiskTitle(riskKey, copy.title, classification, targetContext),
        body: copy.body,
        ...(comparisonTable ? { comparisonTable } : {}),
      };
    })
    .filter(Boolean)
    .slice(0, 3);

  return {
    heroSummary: toStr(heroTemplate?.summary),
    topRisks,
    whyThisRead: uniqueStrings(whyThisRead).slice(0, 3),
    whyThisReadSupportLine: toStr(whyThisReadSupportLine),
    strengths: uniqueStrings(strengths).slice(0, 3),
    transitionReadPatterns,
    transitionReadPatternResult,
    transitionReadBlock,
    validationReadBlock,
    generationTags,
    targetIndustryLabel: toStr(targetContext?.targetIndustryLabel),
    targetJobRead: targetContext.targetJobRead || { title: "", summary: "", body: "", bullets: [], source: "" },
    targetIndustryRead: targetContext.targetIndustryRead || { label: "", title: "", summary: "", bullets: [] },
    industryTraitsAsset: targetContext?.industryTraitsAsset || null,
    transitionCompoundRead,
    buyingMotionPanel: buildBuyingMotionPanel(
      targetContext?.currentIndustry,
      targetContext?.targetIndustry
    ),
    decisionStructurePanel: buildDecisionStructurePanel(
      targetContext?.currentIndustry,
      targetContext?.targetIndustry
    ),
    customerStructurePanel: buildCustomerStructurePanel(
      targetContext?.currentIndustry,
      targetContext?.targetIndustry
    ),
    operatingContextPanel: buildOperatingContextPanel(
      targetContext?.currentIndustry,
      targetContext?.targetIndustry
    ),
    jobRoleSummaryPanel: buildJobRoleSummaryPanel(
      targetContext?.currentJobItem,
      targetContext?.targetJobItem
    ),
    jobKeyOutputsPanel: buildJobOutputsPanel(
      targetContext?.currentJobItem,
      targetContext?.targetJobItem
    ),
    jobScopePanel: buildJobScopePanel(
      targetContext?.currentJobItem,
      targetContext?.targetJobItem
    ),
    jobDecisionCriteriaPanel: buildJobDecisionCriteria2Panel(
      targetContext?.currentJobItem,
      targetContext?.targetJobItem
    ),
  };
}

// @MX:NOTE: [AUTO] Phase 4 resolver fallback. Safe statuses only — BLOCKED/PENDING/FALLBACK never applied to axisPack.
const RESOLVER_SAFE_STATUSES = new Set(['ARCHETYPE_MATCH', 'ARCHETYPE_WITH_MODIFIER', 'CURATED_MATCH']);

function applyResolverOverlaysToAxisPack(axisPack, overlays) {
  if (!axisPack?.axes || !overlays) return axisPack;
  const axes = { ...axisPack.axes };
  for (const [axisKey, slotOverlay] of Object.entries(overlays)) {
    if (!axes[axisKey] || typeof slotOverlay !== 'object') continue;
    const existing = axes[axisKey].explanation ?? {};
    const merged = { ...existing };
    for (const slot of ['lead', 'scoreReason', 'liftOrLimit', 'criteria']) {
      if (typeof slotOverlay[slot] === 'string' && slotOverlay[slot].trim()) {
        merged[slot] = slotOverlay[slot].trim();
      }
    }
    axes[axisKey] = { ...axes[axisKey], explanation: merged };
  }
  return { ...axisPack, axes };
}

export function buildTransitionLiteResult(payload = {}) {
  const validated = validateTransitionLiteInput(payload);
  if (!validated.ok) {
    return makeEmptyVm();
  }

  const resolved = resolveTransitionLiteAssets(validated.input);
  if (!resolved.ok) {
    return makeEmptyVm();
  }

  const classification = classifyTransition(validated.input);
  const discriminatorPack = buildDiscriminatorPack(resolved);
  const selectedRiskKeys = pickTransitionLiteRiskKeys(classification, discriminatorPack);
  const targetContext = pickTransitionLiteTargetContext(resolved);
  const whyThisRead = buildTransitionLiteWhy(selectedRiskKeys, classification, targetContext);
  const whyThisReadSupportLine = buildTransitionLiteWhySupportLine(classification, whyThisRead);
  const axisPack = buildAxisConnectivityPack(validated.input);
  const {
    axisPack: overlaidAxisPack,
    firedProfileIds: careerTransitionFiredProfileIds,
  } = buildCareerTransitionCaseOverlays(axisPack, validated.input);

  // Phase 4: resolver fallback — only when no curated profile fired
  let archetypeResolutionMeta = null;
  let finalAxisPack = overlaidAxisPack;
  if (careerTransitionFiredProfileIds.length === 0) {
    const resolverInput = {
      sourceJobId: validated.input.currentJobId,
      targetJobId: validated.input.targetJobId,
      targetSubType: payload?.targetSubType ?? null,
      yearsOfExperience: payload?.yearsOfExperience ?? null,
      sourceIndustryId: validated.input.currentIndustryId,
      targetIndustryId: validated.input.targetIndustryId,
      candidateEvidencePack: payload?.candidateEvidencePack ?? null,
    };
    const resolverResult = resolveCareerTransitionArchetype(resolverInput);
    archetypeResolutionMeta = {
      archetypeResolutionStatus: resolverResult.resolutionStatus,
      selectedArchetypeId: resolverResult.selectedArchetypeId,
      selectedModifiers: resolverResult.selectedModifiers,
      sourceGroup: resolverResult.sourceGroup,
      targetGroup: resolverResult.targetGroup,
      blockedReason: resolverResult.blockedReason,
      confidence: resolverResult.confidence,
    };
    if (RESOLVER_SAFE_STATUSES.has(resolverResult.resolutionStatus)) {
      finalAxisPack = applyResolverOverlaysToAxisPack(overlaidAxisPack, resolverResult.overlays);
    }
  }

  const vm = buildTransitionLiteVM({
    classification,
    selectedRiskKeys,
    whyThisRead,
    whyThisReadSupportLine,
    targetContext,
  });

  const specialDiagnostics = findSpecialTransitionDiagnostics({
    currentJobItem: resolved.currentJobItem,
    targetJobItem: resolved.targetJobItem,
    currentIndustryItem: resolved.currentIndustryItem,
    targetIndustryItem: resolved.targetIndustryItem,
    classification,
  });

  const topRisks = specialDiagnostics.length > 0
    ? [
        ...vm.topRisks,
        {
          key: `special:${specialDiagnostics[0].id}`,
          title: specialDiagnostics[0].title,
          body: specialDiagnostics[0].body,
        },
      ]
    : vm.topRisks;
  const currentTaxonomyContextPack = buildTaxonomyContextPack({
    jobItem: resolved.currentJobItem,
    industryItem: resolved.currentIndustryItem,
    rawJobLabel: resolved?.currentJob?.displayLabel ?? toStr(resolved?.currentJobItem?.label),
    rawIndustryLabel: resolved?.currentIndustry?.displayLabel ?? toStr(resolved?.currentIndustryItem?.label),
    source: "transition_lite_current_vm",
  });
  const targetTaxonomyContextPack = buildTaxonomyContextPack({
    jobItem: resolved.targetJobItem,
    industryItem: resolved.targetIndustryItem,
    rawJobLabel: resolved?.targetJob?.displayLabel ?? toStr(resolved?.targetJobItem?.label),
    rawIndustryLabel: resolved?.targetIndustry?.displayLabel ?? toStr(resolved?.targetIndustryItem?.label),
    source: "transition_lite_target_vm",
  });
  const taxonomyContextPack = {
    currentJobContext: currentTaxonomyContextPack.jobContext,
    targetJobContext: targetTaxonomyContextPack.jobContext,
    currentIndustryContext: currentTaxonomyContextPack.industryContext,
    targetIndustryContext: targetTaxonomyContextPack.industryContext,
    meta: {
      source: "transition_lite_result_vm",
      current: currentTaxonomyContextPack.meta,
      target: targetTaxonomyContextPack.meta,
      warnings: [
        ...toArr(currentTaxonomyContextPack.meta?.warnings),
        ...toArr(targetTaxonomyContextPack.meta?.warnings),
      ],
    },
  };

  return {
    ...vm,
    topRisks,
    axisPack: finalAxisPack,
    careerTransitionFiredProfileIds,
    archetypeResolutionMeta,
    targetJobDisplayLabel: resolved?.targetJob?.displayLabel ?? toStr(resolved?.targetJobItem?.label),
    targetIndustryDisplayLabel: resolved?.targetIndustry?.displayLabel ?? toStr(resolved?.targetIndustryItem?.label),
    taxonomyContextPack,
  };
}

export default buildTransitionLiteResult;
