import { getIndustryRegistryItemById } from "../../data/industry/industryRegistry.index.js";
import { getJobOntologyItemById } from "../../data/job/jobOntology.index.js";
import {
  buildNewgradJobFitExplanation,
  buildNewgradDomainInterestExplanation,
  buildNewgradExecutionDepthExplanation,
  buildNewgradInteractionFitExplanation,
  buildNewgradSoftSkillMatchExplanation,
} from "../../data/transitionLite/axisExplanationRegistry.js";
import { getCapabilityMeta } from "../../data/transitionLite/capabilityRegistry.js";
import { getJobMajorDependencyProfile } from "../../data/transitionLite/jobMajorDependencyRegistry.js";
import { getAxisJobRationale } from "../../data/transitionLite/axisJobRationaleMap.js";
import { getDetailedReadRationale } from "../../data/transitionLite/detailedReadRationaleMap.js";
import { getRowCapabilityMeta } from "../../data/transitionLite/rowCapabilityMap.js";
import { getSubVerticalCapabilityProfile } from "../../data/transitionLite/subVerticalCapabilityMap.js";
import { getSubVerticalCapabilityImportanceReason } from "../../data/transitionLite/subVerticalCapabilityImportanceMap.js";
import { getAxis4StakeholderRelevanceByJobId } from "../../data/transitionLite/newgradAxis4JobStakeholderRelevanceRegistry.js";
import { resolveNewgradAxis1MajorPrior } from "../../data/transitionLite/newgradAxis1MajorPriorRegistry.js";
import {
  collectNewgradAxis4InteractionEvidence,
  computeAxis4BaseInteractionSignals,
  computeAxis4JobRelevanceSignals,
} from "../../data/transitionLite/newgradAxis4InteractionEvidenceUtils.js";
import { normalizeNewgradSelfReportTraits } from "../transitionLite/normalizeNewgradSelfReportTraits.js";
import { normalizeNewgradExperienceInput } from "../transitionLite/normalizeNewgradExperienceInput.js";

function toStr(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function toArr(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function flattenEvidenceText(items = []) {
  return toArr(items)
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (!item || typeof item !== "object") return "";
      return Object.values(item)
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter(Boolean)
        .join(" ");
    })
    .filter(Boolean);
}

function mergeCanonicalContractExperienceRows(primaryRows = [], aliasRows = []) {
  const merged = [];
  const seen = new Set();
  for (const item of [...toArr(primaryRows), ...toArr(aliasRows)]) {
    const dedupeKey = [
      toStr(item?.canonicalRoleId),
      toStr(item?.canonicalTypeId),
      toStr(item?.canonicalStakeholderId),
      String(Number(item?.durationRank || 0)),
      String(Number(item?.outcomeRank || 0)),
      toStr(item?.normalizedRoleLabel),
      toStr(item?.normalizedTypeLabel),
      toStr(item?.normalizedStakeholderLabel),
      toStr(item?.normalizedDurationLabel),
    ].join("||");
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    merged.push(item);
  }
  return merged;
}

function _getExperienceEvidencePack(input = {}) {
  const pack = input?.experienceEvidencePack;
  return pack && typeof pack === "object" ? pack : null;
}

function _getCertEvidencePack(input = {}) {
  const pack = input?.certEvidencePack;
  return pack && typeof pack === "object" ? pack : null;
}

function _getSelfReportEvidencePack(input = {}) {
  const pack = input?.selfReportEvidencePack;
  return pack && typeof pack === "object" ? pack : null;
}

function _getExperienceProjectRows(input = {}) {
  const packRows = toArr(_getExperienceEvidencePack(input)?.projectRows);
  if (packRows.length > 0) return packRows;
  return toArr(input.projectsRaw);
}

function _getExperienceCanonicalWorkRows(input = {}) {
  const packRows = toArr(_getExperienceEvidencePack(input)?.canonicalWorkRows);
  if (packRows.length > 0) return packRows;

  const canonicalRows = toArr(input.canonicalWorkRowsRaw);
  if (canonicalRows.length > 0) return canonicalRows;

  return [
    ...toArr(input.internshipsRaw),
    ...toArr(input.contractExperiencesRaw),
  ];
}

function _getExperienceAxisFitHints(input = {}, axisKey = "") {
  const pack = _getExperienceEvidencePack(input);
  const axisFitHints = pack && typeof pack.axisFitHints === "object" ? pack.axisFitHints : null;
  const axisHints = axisFitHints && typeof axisFitHints[axisKey] === "object" ? axisFitHints[axisKey] : null;
  return axisHints || {};
}

function _getRowStringValues(rows = [], fieldName, fallback = []) {
  const values = toArr(rows).map((row) => toStr(row?.[fieldName])).filter(Boolean);
  return values.length > 0 ? values : toArr(fallback).map((item) => toStr(item)).filter(Boolean);
}

function _getRowNumberValues(rows = [], fieldName, fallback = []) {
  const values = toArr(rows)
    .map((row) => Number(row?.[fieldName] || 0))
    .filter((value) => Number.isFinite(value) && value > 0);
  return values.length > 0 ? values : toArr(fallback).map((item) => Number(item || 0)).filter((value) => Number.isFinite(value) && value > 0);
}

function _getAxisHintLabels(input = {}, axisKey = "", keys = [], fallback = []) {
  const axisHints = _getExperienceAxisFitHints(input, axisKey);
  const labels = keys.flatMap((key) => toArr(axisHints?.[key]).map((item) => toStr(item)).filter(Boolean));
  return labels.length > 0 ? labels : toArr(fallback).map((item) => toStr(item)).filter(Boolean);
}

function _getCertAxisHintLabels(input = {}, axisKey = "", keys = [], fallback = []) {
  const pack = _getCertEvidencePack(input);
  const axisHints = pack && typeof pack.axisFitHints === "object" ? pack.axisFitHints?.[axisKey] : null;
  const labels = keys.flatMap((key) => toArr(axisHints?.[key]).map((item) => toStr(item)).filter(Boolean));
  return labels.length > 0 ? labels : toArr(fallback).map((item) => toStr(item)).filter(Boolean);
}

function _getSelfReportAxisHintLabels(input = {}, axisKey = "", keys = [], fallback = []) {
  const pack = _getSelfReportEvidencePack(input);
  const axisHints = pack && typeof pack.axisFitHints === "object" ? pack.axisFitHints?.[axisKey] : null;
  const labels = keys.flatMap((key) => toArr(axisHints?.[key]).map((item) => toStr(item)).filter(Boolean));
  return labels.length > 0 ? labels : toArr(fallback).map((item) => toStr(item)).filter(Boolean);
}

function _getSelfReportStrengthKeys(input = {}) {
  const pack = _getSelfReportEvidencePack(input);
  const rows = toArr(pack?.strengthRows);
  const keys = rows.map((row) => toStr(row?.id)).filter(Boolean);
  return keys.length > 0 ? keys : toArr(input.canonicalStrengthKeys).map((item) => toStr(item)).filter(Boolean);
}

function _getSelfReportWorkStyleKeys(input = {}) {
  const pack = _getSelfReportEvidencePack(input);
  const rows = toArr(pack?.workStyleRows);
  const keys = rows.map((row) => toStr(row?.id)).filter(Boolean);
  return keys.length > 0 ? keys : toArr(input.canonicalWorkStyleKeys).map((item) => toStr(item)).filter(Boolean);
}

function _getSelfReportStrengthLabels(input = {}) {
  const pack = _getSelfReportEvidencePack(input);
  const rows = toArr(pack?.strengthRows);
  const labels = rows.map((row) => toStr(row?.label)).filter(Boolean);
  return labels.length > 0 ? labels : toArr(input.strengths).map((item) => toStr(item)).filter(Boolean);
}

function _getSelfReportWorkStyleLabels(input = {}) {
  const pack = _getSelfReportEvidencePack(input);
  const rows = toArr(pack?.workStyleRows);
  const labels = rows.map((row) => toStr(row?.label)).filter(Boolean);
  return labels.length > 0 ? labels : toArr(input.workStyleList).map((item) => toStr(item)).filter(Boolean);
}

function _getSelfReportInteractionEligibleKeys(input = {}) {
  const pack = _getSelfReportEvidencePack(input);
  const rows = toArr(pack?.workStyleRows).filter((row) => row?.interactionEligible === true);
  const keys = rows.map((row) => toStr(row?.id)).filter(Boolean);
  return keys.length > 0 ? keys : toArr(input.interactionEligibleWorkStyleKeys).map((item) => toStr(item)).filter(Boolean);
}

function hasNonEmpty(value) {
  return Boolean(toStr(value));
}

function countEvidenceGroups(...groups) {
  return groups.filter((group) => {
    if (typeof group === "string") return hasNonEmpty(group);
    return toArr(group).length > 0;
  }).length;
}

function countEvidenceItems(...groups) {
  return groups.reduce((total, group) => {
    if (typeof group === "string") return total + (hasNonEmpty(group) ? 1 : 0);
    return total + toArr(group).length;
  }, 0);
}

function firstLabels(items = [], maxCount = 2) {
  return toArr(items).map((item) => toStr(item)).filter(Boolean).slice(0, maxCount);
}

function firstUniqueLabels(items = [], maxCount = 3) {
  const seen = new Set();
  const result = [];
  for (const item of toArr(items)) {
    const label = toStr(item);
    if (!label || seen.has(label)) continue;
    seen.add(label);
    result.push(label);
    if (result.length >= maxCount) break;
  }
  return result;
}

function joinLabels(items = []) {
  const labels = firstUniqueLabels(items, 3);
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return labels.join(", ");
  return `${labels[0]}, ${labels[1]} 외`;
}

function buildExperienceSupportLine(parts = [], suffix = "") {
  const safeParts = toArr(parts).map((part) => toStr(part)).filter(Boolean);
  if (safeParts.length === 0) return "";
  return `${safeParts.join(" / ")}${suffix}`;
}

function prefixHighlights(title, labels = [], maxCount = 2) {
  return firstUniqueLabels(labels, maxCount).map((label) => `${title} ${label}`);
}

function pickFirstLabel(...values) {
  for (const value of values) {
    const label = toStr(value);
    if (label) return label;
  }
  return "";
}

function getMajorDisplayLabel(value) {
  if (!value) return "";
  if (typeof value === "string") return toStr(value);
  if (typeof value !== "object") return "";
  return pickFirstLabel(value.label, value.subcategory, value.category);
}

function getTargetJobDisplayLabel(input = {}) {
  const directLabel = pickFirstLabel(
    input.targetJobLabel,
    input.targetContext?.targetJobLabel,
    input.labels?.targetJobLabel
  );
  if (directLabel) return directLabel;
  return pickFirstLabel(getJobOntologyItemById(toStr(input.targetJobId))?.label);
}

function getTargetIndustryDisplayLabel(input = {}) {
  const directLabel = pickFirstLabel(
    input.targetIndustryLabel,
    input.targetContext?.targetIndustryLabel,
    input.labels?.targetIndustryLabel
  );
  if (directLabel) return directLabel;
  return pickFirstLabel(getIndustryRegistryItemById(toStr(input.targetIndustryId))?.label);
}

function buildLabelPair(primary, secondary, suffix = "") {
  const labels = firstUniqueLabels([primary, secondary], 2);
  if (labels.length === 0) return "";
  if (labels.length === 1) return `${labels[0]}${suffix}`;
  return `${labels[0]} / ${labels[1]}${suffix}`;
}

function buildRoleContextLabel(roleLabel, typeLabel) {
  return buildLabelPair(roleLabel, typeLabel, " 경험");
}

function buildStyleContextLabel(strengthLabel, workStyleLabel) {
  return buildLabelPair(strengthLabel, workStyleLabel, " 선택");
}

function collectRepresentativeLabels(...values) {
  const flattened = [];
  for (const value of values) {
    if (Array.isArray(value)) {
      flattened.push(...value);
      continue;
    }
    flattened.push(value);
  }
  return firstUniqueLabels(flattened, 1);
}

function pickRepresentativeProjectRoleLabel(...values) {
  return collectRepresentativeLabels(...values)[0] || "";
}

function pickRepresentativeProjectTypeLabel(...values) {
  return collectRepresentativeLabels(...values)[0] || "";
}

function pickRepresentativeInternshipRoleLabel(...values) {
  return collectRepresentativeLabels(...values)[0] || "";
}

function pickRepresentativeInternshipTypeLabel(...values) {
  return collectRepresentativeLabels(...values)[0] || "";
}

function pickRepresentativeStakeholderLabel(...values) {
  return collectRepresentativeLabels(...values)[0] || "";
}

function pickRepresentativeStrengthLabel(...values) {
  return collectRepresentativeLabels(...values)[0] || "";
}

function pickRepresentativeWorkStyleLabel(...values) {
  return collectRepresentativeLabels(...values)[0] || "";
}

function scoreToBand(score5) {
  if (score5 >= 5) return "high";
  if (score5 >= 4) return "mid_high";
  if (score5 >= 3) return "mid";
  if (score5 >= 2) return "low";
  return "very_low";
}

function scoreToDisplayScore(score5) {
  if (score5 >= 5) return 100;
  if (score5 === 4) return 80;
  if (score5 === 3) return 60;
  if (score5 === 2) return 40;
  return 20;
}

function makeAxis(label, score5, signals = {}, description = "") {
  const safeScore5 = Math.max(1, Math.min(5, Number(score5) || 1));
  const displayScore = scoreToDisplayScore(safeScore5);

  return {
    label,
    rawScore: displayScore,
    displayScore,
    band: scoreToBand(safeScore5),
    signals,
    description,
  };
}

// Maps job majorCategory ??{ direct: canonical role ids, adjacent: canonical role ids }
const _JOB_MAJOR_ROLE_MAP = {
  BUSINESS:                         { direct: ["planning"], adjacent: ["marketing", "sales_business_development", "hr_management_support", "operations_customer_support", "operations_support"] },
  SALES:                            { direct: ["sales_business_development"], adjacent: ["marketing", "operations_customer_support", "operations_support", "planning"] },
  MARKETING:                        { direct: ["marketing"], adjacent: ["planning", "data_analytics", "design"] },
  CUSTOMER_OPERATIONS:              { direct: ["operations_customer_support", "operations_support"], adjacent: ["sales_business_development", "planning"] },
  HR_ORGANIZATION:                  { direct: ["hr_management_support"], adjacent: ["planning", "operations_customer_support", "operations_support"] },
  FINANCE_ACCOUNTING:               { direct: ["planning", "hr_management_support"], adjacent: ["data_analytics"] },
  PROCUREMENT_SCM:                  { direct: ["operations_customer_support", "operations_support"], adjacent: ["planning", "sales_business_development"] },
  MANUFACTURING_QUALITY_PRODUCTION: { direct: ["operations_support", "operations_customer_support"], adjacent: ["planning"] },
  ENGINEERING_DEVELOPMENT:          { direct: ["backend_development", "frontend_development", "development"], adjacent: ["data_analytics"] },
  IT_DATA_DIGITAL:                  { direct: ["data_analytics", "development", "backend_development", "frontend_development"], adjacent: ["planning", "design"] },
  DESIGN:                           { direct: ["design"], adjacent: ["frontend_development", "marketing"] },
  RESEARCH_PROFESSIONAL:            { direct: ["data_analytics"], adjacent: ["planning"] },
  EDUCATION_COUNSELING_COACHING:    { direct: ["operations_customer_support", "operations_support"], adjacent: ["planning", "hr_management_support"] },
  PUBLIC_ADMINISTRATION_SUPPORT:    { direct: ["planning", "operations_customer_support", "operations_support"], adjacent: ["hr_management_support"] },
};

// Maps job majorCategory ??Korean major keywords for relevance check
const _MAJOR_KEYWORD_BUCKET = {
  BUSINESS:                         ["??", "??", "??", "??", "??", "????"],
  SALES:                            ["??", "??", "??", "???", "??"],
  MARKETING:                        ["???", "??", "??", "???", "??????", "???"],
  CUSTOMER_OPERATIONS:              ["???", "??", "??", "??"],
  HR_ORGANIZATION:                  ["??", "??", "??", "??"],
  FINANCE_ACCOUNTING:               ["??", "??", "??", "??", "??", "??"],
  PROCUREMENT_SCM:                  ["??", "???", "??", "??", "??"],
  MANUFACTURING_QUALITY_PRODUCTION: ["????", "??", "??", "??", "??", "??"],
  ENGINEERING_DEVELOPMENT:          ["??", "???", "??", "??", "??", "?????"],
  IT_DATA_DIGITAL:                  ["???", "???", "??", "??", "?????", "???", "????"],
  DESIGN:                           ["???", "??", "?????", "UX"],
  RESEARCH_PROFESSIONAL:            ["??", "??", "??", "??", "??", "??"],
  EDUCATION_COUNSELING_COACHING:    ["??", "??", "??", "??", "??"],
  PUBLIC_ADMINISTRATION_SUPPORT:    ["??", "??", "?", "??", "??"],
};

// Extracts majorCategory from targetJobId (e.g. "JOB_BUSINESS_STRATEGY" ??"BUSINESS")
function _getJobMajorCategory(targetJobId) {
  const id = String(targetJobId || "").toUpperCase().trim();
  if (!id) return "";
  const body = id.startsWith("JOB_") ? id.slice(4) : id;
  // Ordered longest-first to avoid ambiguous prefix matches (e.g. CUSTOMER vs CUSTOMER_OPERATIONS)
  const knownMajors = [
    "CUSTOMER_OPERATIONS", "HR_ORGANIZATION", "FINANCE_ACCOUNTING",
    "PROCUREMENT_SCM", "MANUFACTURING_QUALITY_PRODUCTION", "ENGINEERING_DEVELOPMENT",
    "IT_DATA_DIGITAL", "RESEARCH_PROFESSIONAL", "EDUCATION_COUNSELING_COACHING",
    "PUBLIC_ADMINISTRATION_SUPPORT", "BUSINESS", "SALES", "MARKETING", "DESIGN",
  ];
  for (const major of knownMajors) {
    if (body === major || body.startsWith(major + "_")) return major;
  }
  // Fallback: partial inclusion
  for (const major of knownMajors) {
    if (id.includes(major)) return major;
  }
  return "";
}

// Returns 2 = direct match, 1 = adjacent match, 0 = no match
function _scoreRoleMatch(targetMajor, canonicalRoleId) {
  if (!targetMajor || !canonicalRoleId) return 0;
  const map = _JOB_MAJOR_ROLE_MAP[targetMajor];
  if (!map) return 0;
  if (map.direct.includes(canonicalRoleId)) return 2;
  if (map.adjacent.includes(canonicalRoleId)) return 1;
  return 0;
}

// Returns 1 if major text contains a relevant keyword for targetMajor, else 0
function _scoreMajorSupport(targetMajor, majorText) {
  if (!targetMajor || !majorText) return 0;
  const keywords = _MAJOR_KEYWORD_BUCKET[targetMajor] || [];
  const lower = majorText.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase())) ? 1 : 0;
}

function _normalizeMajorMatchLevel(label) {
  const safeLabel = toStr(label);
  return ["direct", "adjacent", "weak", "mismatch"].includes(safeLabel) ? safeLabel : "mismatch";
}

function _buildJobFitBaseScore(input) {
  const targetMajor = _getJobMajorCategory(toStr(input.targetJobId));
  const projectRows = _getExperienceProjectRows(input);
  const canonicalWorkRows = _getExperienceCanonicalWorkRows(input);
  const projectRoles = _getRowStringValues(projectRows, "canonicalRoleId", input.projectRoles);
  const workRoleFamilies = _getRowStringValues(canonicalWorkRows, "canonicalRoleId", input.internshipRoleFamilies);

  if (!targetMajor) {
    const evidenceGroupCount = countEvidenceGroups(projectRows, canonicalWorkRows, input.coursework, input.major);
    return {
      score: evidenceGroupCount >= 1 ? 2 : 1,
      targetMajor,
      bestRoleLevel: 0,
      directCount: 0,
    };
  }

  const allRoles = [...projectRoles, ...workRoleFamilies];
  const majorPrior = resolveNewgradAxis1MajorPrior(input.targetJobId, input.major);
  const majorPriorFinal = Number(majorPrior?.final || 0);

  let bestRoleLevel = 0;
  let directCount = 0;
  for (const role of allRoles) {
    const level = _scoreRoleMatch(targetMajor, role);
    if (level > bestRoleLevel) bestRoleLevel = level;
    if (level >= 2) directCount++;
  }

  // === MAJOR-CENTRIC BASE SCORING (Axis1 redesign) ===
  // Role evidence (project/internship) is retained for signal export and overlapGuard only.
  // majorPrior is the primary driver; role directness does NOT determine base score.
  const majorMatchLevel = _normalizeMajorMatchLevel(majorPrior?.label);

  let score;
  if (majorMatchLevel === "direct" || majorPriorFinal >= 3) {
    score = 4; // strong major match — can reach 5 via _applyJobMajorDependencyToJobFit
  } else if (majorMatchLevel === "adjacent" || majorPriorFinal >= 2) {
    score = 3; // adjacent major
  } else if (majorMatchLevel === "weak" || majorPriorFinal >= 1) {
    score = 2; // weak but present
  } else {
    score = 1; // mismatch or no major
  }

  // Ceiling: role evidence cannot push axis1 above the majorMatchLevel ceiling.
  const majorCeiling =
    majorMatchLevel === "direct" ? 5
    : majorMatchLevel === "adjacent" ? 3
    : 2; // weak / mismatch / no-major → max 2

  return {
    score: Math.min(score, majorCeiling),
    targetMajor,
    bestRoleLevel,
    directCount,
  };
}

function _applyJobMajorDependencyToJobFit(baseScore, {
  dependencyTier,
  majorMatchLevel,
  hasDirectRoleEvidence,
  hasAdjacentRoleEvidence,
  majorPresent,
}) {
  let score = Number(baseScore) || 1;
  let majorWeightApplied = "neutral";

  if (dependencyTier === "high") {
    if (majorMatchLevel === "direct") {
      majorWeightApplied = "strong_bonus";
      if (score < 5) score += 1;
    } else if (majorMatchLevel === "adjacent") {
      majorWeightApplied = "light_bonus";
    } else if (majorPresent) {
      majorWeightApplied = "strong_penalty";
      if (!hasDirectRoleEvidence && !hasAdjacentRoleEvidence && score > 1) score -= 1;
    }
  } else if (dependencyTier === "medium") {
    if (majorMatchLevel === "direct") {
      majorWeightApplied = "light_bonus";
    } else if (majorPresent && ["weak", "mismatch"].includes(majorMatchLevel)) {
      majorWeightApplied = "light_penalty";
    }
  } else if (dependencyTier === "low") {
    if (majorMatchLevel === "direct") {
      majorWeightApplied = "light_bonus";
    }
  }

  return {
    score: Math.max(1, Math.min(5, score)),
    majorWeightApplied,
  };
}

function _buildJobMajorImpactSummary({ dependencyTier, majorMatchLevel, majorPresent, majorWeightApplied }) {
  if (dependencyTier === "high" && majorMatchLevel === "direct") {
    return "전공 의존도가 높은 직무로, 전공 적합성이 강점으로 작동해 직무 연결성이 유리하게 반영되었습니다.";
  }
  if (dependencyTier === "high" && majorPresent && ["weak", "mismatch"].includes(majorMatchLevel)) {
    return "전공 의존도가 높은 직무에서 전공 연결성이 약하게 읽혀, 프로젝트나 인턴십 등 직무 연결 근거를 보완하는 것이 중요합니다.";
  }
  if (dependencyTier === "medium" && majorMatchLevel === "direct") {
    return "전공 적합성이 비교적 잘 맞아, 직무 방향성에서 긍정적인 신호로 반영되었습니다.";
  }
  if (dependencyTier === "medium" && majorPresent && ["weak", "mismatch"].includes(majorMatchLevel)) {
    return "전공 연결성이 약하게 읽히지만, 실제 직무 경험 근거가 있다면 이를 중심으로 보완할 수 있습니다.";
  }
  if (dependencyTier === "low" && majorWeightApplied !== "light_bonus") {
    return "전공보다 실제 직무 수행 경험과 역할 맥락을 더 중요하게 보는 직무로, 전공 연결성은 이차적으로 판단합니다.";
  }
  if (dependencyTier === "low" && majorMatchLevel === "direct") {
    return "전공보다 실제 직무 수행 경험이 더 중요하게 작동하지만, 전공 방향성이 참고 신호로 긍정적으로 반영되었습니다.";
  }
  return "";
}

function _normalizeToken(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s/()[\]{}.,:&+_-]+/g, "");
}

function buildCapabilityLabelLine(primaryCapabilityId, secondaryCapabilityIds = []) {
  const labels = buildCapabilityLabels(primaryCapabilityId, secondaryCapabilityIds);
  if (labels.length === 0) return "";
  return `핵심 역량: ${labels.join(" · ")}`;
}

function buildCapabilityLabels(primaryCapabilityId, secondaryCapabilityIds = []) {
  const labels = [primaryCapabilityId, ...secondaryCapabilityIds]
    .filter(Boolean)
    .slice(0, 2)
    .map((capabilityId) => getCapabilityMeta(capabilityId)?.label || "")
    .filter(Boolean);
  return labels;
}

function pickSubjectParticle(text) {
  const normalized = toStr(text);
  const lastChar = normalized.charCodeAt(normalized.length - 1);
  if (!normalized) return "가";
  if (lastChar >= 0xac00 && lastChar <= 0xd7a3) {
    return (lastChar - 0xac00) % 28 === 0 ? "가" : "이";
  }
  return "가";
}

function buildCapabilityWhyLine(axisKey, targetSubVertical = "", primaryCapabilityId = "") {
  const capabilityLabel = getCapabilityMeta(primaryCapabilityId)?.label || "";
  const importanceReason = getSubVerticalCapabilityImportanceReason(targetSubVertical, primaryCapabilityId, axisKey);
  const normalizedReason = toStr(importanceReason);
  if (!capabilityLabel || !normalizedReason) return "";
  if (axisKey === "axis5") {
    return `이 직무에서는 ${capabilityLabel}를 ${normalizedReason}`;
  }
  return `이 직무에서는 ${capabilityLabel}${pickSubjectParticle(capabilityLabel)} ${normalizedReason}`;
}

function buildComparisonCapabilityMeta(axisKey, rows = [], targetSubVertical = "") {
  const capabilityProfile = getSubVerticalCapabilityProfile(targetSubVertical, axisKey);
  const rowCapabilityMetaList = Array.isArray(rows)
    ? rows
        .map((row) => getRowCapabilityMeta(toStr(row?.rowKey)))
        .filter(Boolean)
    : [];

  const rowCapabilityIds = Array.from(new Set(
    rowCapabilityMetaList.flatMap((meta) => [
      meta?.primaryCapability || "",
      ...toArr(meta?.secondaryCapabilities),
    ].filter(Boolean))
  ));

  const pickCapability = (...candidateLists) => {
    for (const list of candidateLists) {
      for (const capabilityId of toArr(list)) {
        if (!capabilityId) continue;
        if (rowCapabilityIds.length === 0 || rowCapabilityIds.includes(capabilityId)) {
          return capabilityId;
        }
      }
    }
    for (const list of candidateLists) {
      const fallback = toArr(list).find(Boolean);
      if (fallback) return fallback;
    }
    return "";
  };

  if (axisKey === "axis1") {
    const primaryCapabilityId = pickCapability(capabilityProfile.primary, ["job_alignment"]);
    const secondaryCapabilityIds = [
      pickCapability(
        capabilityProfile.primary.filter((capabilityId) => capabilityId !== primaryCapabilityId),
        capabilityProfile.secondary,
        ["execution_depth", "structured_delivery"]
      ),
    ].filter(Boolean);
    return {
      primaryCapabilityId,
      secondaryCapabilityIds,
      capabilityLabels: buildCapabilityLabels(primaryCapabilityId, secondaryCapabilityIds),
      capabilityLabelLine: buildCapabilityLabelLine(primaryCapabilityId, secondaryCapabilityIds),
      capabilityWhyLine: buildCapabilityWhyLine(axisKey, targetSubVertical, primaryCapabilityId),
    };
  }

  if (axisKey === "axis2") {
    const primaryCapabilityId = pickCapability(capabilityProfile.primary, ["domain_context"]);
    const secondaryCapabilityIds = [
      pickCapability(
        capabilityProfile.primary.filter((capabilityId) => capabilityId !== primaryCapabilityId),
        capabilityProfile.secondary,
        ["user_or_customer_understanding", "stakeholder_communication"]
      ),
    ].filter(Boolean);
    return {
      primaryCapabilityId,
      secondaryCapabilityIds,
      capabilityLabels: buildCapabilityLabels(primaryCapabilityId, secondaryCapabilityIds),
      capabilityLabelLine: buildCapabilityLabelLine(primaryCapabilityId, secondaryCapabilityIds),
      capabilityWhyLine: buildCapabilityWhyLine(axisKey, targetSubVertical, primaryCapabilityId),
    };
  }

  if (axisKey === "axis3") {
    const primaryCapabilityId = pickCapability(capabilityProfile.primary, ["execution_depth"]);
    const secondaryCapabilityIds = [
      pickCapability(
        capabilityProfile.primary.filter((capabilityId) => capabilityId !== primaryCapabilityId),
        capabilityProfile.secondary,
        ["collaboration_coordination", "structured_delivery"]
      ),
    ].filter(Boolean);
    return {
      primaryCapabilityId,
      secondaryCapabilityIds,
      capabilityLabels: buildCapabilityLabels(primaryCapabilityId, secondaryCapabilityIds),
      capabilityLabelLine: buildCapabilityLabelLine(primaryCapabilityId, secondaryCapabilityIds),
      capabilityWhyLine: buildCapabilityWhyLine(axisKey, targetSubVertical, primaryCapabilityId),
    };
  }

  if (axisKey === "axis4") {
    const primaryCapabilityId = "stakeholder_communication";
    const secondaryCapabilityIds = ["collaboration_coordination"];
    return {
      primaryCapabilityId,
      secondaryCapabilityIds,
      capabilityLabels: buildCapabilityLabels(primaryCapabilityId, secondaryCapabilityIds),
      capabilityLabelLine: buildCapabilityLabelLine(primaryCapabilityId, secondaryCapabilityIds),
      capabilityWhyLine: buildCapabilityWhyLine(axisKey, targetSubVertical, primaryCapabilityId),
    };
  }

  if (axisKey === "axis5") {
    const primaryCapabilityId = "work_style_signal";
    const secondaryCapabilityIds = ["collaboration_coordination"];
    return {
      primaryCapabilityId,
      secondaryCapabilityIds,
      capabilityLabels: buildCapabilityLabels(primaryCapabilityId, secondaryCapabilityIds),
      capabilityLabelLine: buildCapabilityLabelLine(primaryCapabilityId, secondaryCapabilityIds),
      capabilityWhyLine: buildCapabilityWhyLine(axisKey, targetSubVertical, primaryCapabilityId),
    };
  }

  return {
    primaryCapabilityId: "",
    secondaryCapabilityIds: [],
    capabilityLabels: [],
    capabilityLabelLine: "",
    capabilityWhyLine: "",
  };
}

const _INDUSTRY_PREP_SIGNAL_MAP = {
  MANUFACTURING: {
    majorKeywords: ["??", "??", "??", "????", "??", "??", "??", "??"],
    certificationCategories: ["it", "data"],
    certificationKeywords: ["??", "??", "??", "???"],
  },
  IT_SOFTWARE_PLATFORM: {
    majorKeywords: ["???", "?????", "???", "??", "??", "????", "AI"],
    certificationCategories: ["it", "data"],
    certificationKeywords: ["????", "???", "SQL", "??", "??", "AI"],
  },
  DISTRIBUTION_COMMERCE_CONSUMER_GOODS: {
    majorKeywords: ["??", "??", "??", "???", "???", "???", "??"],
    certificationCategories: ["language", "data"],
    certificationKeywords: ["??", "??", "???", "???"],
  },
  LOGISTICS_TRANSPORT_SUPPLY_CHAIN: {
    majorKeywords: ["??", "???", "??", "??", "??"],
    certificationCategories: ["data", "language"],
    certificationKeywords: ["??", "??", "SCM", "??"],
  },
  FINANCE_INSURANCE_FINTECH: {
    majorKeywords: ["??", "??", "??", "??", "???", "??", "???"],
    certificationCategories: ["finance", "data"],
    certificationKeywords: ["??", "??", "??", "??", "SQL", "???"],
  },
  CONSTRUCTION_REAL_ESTATE_INFRA: {
    majorKeywords: ["??", "??", "??", "???", "???", "??", "??"],
    certificationCategories: ["it", "data"],
    certificationKeywords: ["??", "??", "??", "??"],
  },
  HEALTHCARE_PHARMA_BIO: {
    majorKeywords: ["??", "??", "??", "???", "??", "??", "??"],
    certificationCategories: ["data", "language"],
    certificationKeywords: ["??", "??", "???", "??"],
  },
  ENERGY_ENVIRONMENT_PUBLIC_INFRA: {
    majorKeywords: ["??", "???", "??", "??", "???", "??", "??"],
    certificationCategories: ["it", "data"],
    certificationKeywords: ["???", "??", "??", "???"],
  },
  MEDIA_CONTENT_EDUCATION: {
    majorKeywords: ["???", "???", "??", "??", "??", "??????", "???"],
    certificationCategories: ["language", "data"],
    certificationKeywords: ["???", "??", "???", "??"],
  },
  PROFESSIONAL_B2B_SERVICES: {
    majorKeywords: ["??", "?", "??", "??", "???", "??", "??????"],
    certificationCategories: ["hr", "finance", "language"],
    certificationKeywords: ["??", "??", "??", "??", "???"],
  },
  PUBLIC_ASSOCIATION_NONPROFIT: {
    majorKeywords: ["??", "??", "??", "??", "???", "??", "??"],
    certificationCategories: ["language", "data"],
    certificationKeywords: ["??", "??", "??", "???"],
  },
  LIFESTYLE_SERVICES: {
    majorKeywords: ["관광", "호텔", "조리", "외식", "식음료", "뷰티", "미용", "스포츠", "체육", "이벤트"],
    certificationCategories: [],
    certificationKeywords: ["관광", "호텔", "조리", "식음료", "위생", "미용", "스포츠", "이벤트"],
  },
};

function _getIndustryPrepProfile(targetIndustryId) {
  const item = getIndustryRegistryItemById(toStr(targetIndustryId));
  if (!item) return null;
  const sector = toStr(item.sector);
  const profile = _INDUSTRY_PREP_SIGNAL_MAP[sector] || null;
  return {
    item,
    sector,
    profile,
  };
}

function _containsAnyKeyword(text, keywords = []) {
  const lower = toStr(text).toLowerCase();
  return keywords.some((keyword) => lower.includes(String(keyword).toLowerCase()));
}

function _scoreIndustryMajorRelevance(profile, majorText) {
  if (!profile?.profile || !majorText) return 0;
  return _containsAnyKeyword(majorText, profile.profile.majorKeywords) ? 2 : 0;
}

function _getDirectRelevantCertSupport(certRoleRelevancePack) {
  const pack = certRoleRelevancePack && typeof certRoleRelevancePack === "object" ? certRoleRelevancePack : null;
  if (!pack || !["ok", "partial"].includes(toStr(pack.status))) {
    return { eligibleCount: 0, supportCount: 0 };
  }

  const eligibleItems = toArr(pack.items).filter((item) => {
    if (!item || typeof item !== "object") return false;
    return toStr(item.mappingStatus) === "mapped" && toStr(item.relevanceStatus) === "direct_relevant";
  });

  return {
    eligibleCount: eligibleItems.length,
    supportCount: Math.min(1, eligibleItems.length),
  };
}

function _getCertSupport(input = {}) {
  const certEvidencePack = _getCertEvidencePack(input);
  const scoringSummary = certEvidencePack && typeof certEvidencePack.scoringSummary === "object"
    ? certEvidencePack.scoringSummary
    : null;
  if (scoringSummary) {
    const alignedCount = Number(scoringSummary.alignedCount || 0);
    return {
      eligibleCount: Number(scoringSummary.eligibleCount || 0),
      supportCount: alignedCount > 0 ? 1 : 0,
      alignedCount,
      weakCount: Number(scoringSummary.weakCount || 0),
      alignedLevel: toStr(scoringSummary.alignedLevel) || "none",
      familyCapApplied: scoringSummary.familyCapApplied === true,
    };
  }

  const legacySupport = _getDirectRelevantCertSupport(input.certRoleRelevancePack);
  return {
    eligibleCount: legacySupport.eligibleCount,
    supportCount: legacySupport.supportCount,
    alignedCount: legacySupport.supportCount,
    weakCount: 0,
    alignedLevel: legacySupport.supportCount > 0 ? "aligned" : "none",
    familyCapApplied: false,
  };
}

function _scoreIndustryProjectSupport(projects = []) {
  let supportCount = 0;
  for (const project of toArr(projects)) {
    if (!project || typeof project !== "object") continue;
    const industrySignalLevel = toStr(project.industrySignalLevel);
    const axisEligible = toArr(project.typeAxisEligible);
    if (axisEligible.includes("axis2") && ["weak", "medium", "direct"].includes(industrySignalLevel)) {
      supportCount += 1;
    }
  }
  return supportCount;
}

function _classifyContextEvidence(items = []) {
  let strongCount = 0;
  let supportCount = 0;
  for (const item of toArr(items)) {
    if (!item || typeof item !== "object") continue;
    const hasTypedContext = Boolean(toStr(item.canonicalTypeId) || toStr(item.normalizedTypeLabel));
    const stakeholderWeight = toStr(item.stakeholderIndustryContextWeight);
    const hasStakeholderContext = Boolean(toStr(item.canonicalStakeholderId) || toStr(item.normalizedStakeholderLabel));
    if (!hasTypedContext && !hasStakeholderContext) continue;

    if (hasTypedContext && stakeholderWeight === "direct") {
      strongCount += 1;
      continue;
    }
    if (hasTypedContext && ["adjacent", "direct"].includes(stakeholderWeight)) {
      supportCount += 1;
      continue;
    }
    if (hasTypedContext || hasStakeholderContext) {
      supportCount += 1;
    }
  }
  return { strongCount, supportCount };
}

function _scoreJobFitLegacy(input) {
  const targetMajor = _getJobMajorCategory(toStr(input.targetJobId));

  // No targetJobId resolved ??conservative count-only fallback
  if (!targetMajor) {
    const evidenceGroupCount = countEvidenceGroups(input.projects, input.internships, input.coursework, input.major);
    if (evidenceGroupCount >= 1) return 2;
    return 1;
  }

  const projectRoles = toArr(input.projectRoles);
  const internshipRoleFamilies = toArr(input.internshipRoleFamilies);
  const allRoles = [...projectRoles, ...internshipRoleFamilies];
  const majorPrior = resolveNewgradAxis1MajorPrior(input.targetJobId, input.major);
  const majorPriorFinal = Number(majorPrior?.final || 0);

  let bestRoleLevel = 0;
  let directCount = 0;
  for (const role of allRoles) {
    const level = _scoreRoleMatch(targetMajor, role);
    if (level > bestRoleLevel) bestRoleLevel = level;
    if (level >= 2) directCount++;
  }

  const majorRelevant = majorPriorFinal >= 2;

  // Score bands: 5=repeated direct, 4=single direct, 3=adjacent+major or major-only, 2=adjacent-only or weak evidence, 1=no evidence
  if (directCount >= 2) return 5;
  if (directCount >= 1) return 4;
  if (bestRoleLevel >= 1) return majorRelevant ? 3 : 2;
  if (majorPriorFinal >= 3) return 3;
  if (majorPriorFinal >= 1) return 2;
  const evidenceGroupCount = countEvidenceGroups(input.projects, input.internships, input.coursework);
  return evidenceGroupCount >= 1 ? 2 : 1;
}

function scoreJobFit(input) {
  const majorPrior = resolveNewgradAxis1MajorPrior(input.targetJobId, input.major);
  const majorMatchLevel = _normalizeMajorMatchLevel(majorPrior?.label);
  const dependencyProfile = getJobMajorDependencyProfile(input.targetJobId);
  const base = _buildJobFitBaseScore(input);
  const adjusted = _applyJobMajorDependencyToJobFit(base.score, {
    dependencyTier: dependencyProfile.tier,
    majorMatchLevel,
    hasDirectRoleEvidence: base.directCount >= 1,
    hasAdjacentRoleEvidence: base.bestRoleLevel >= 1,
    majorPresent: hasNonEmpty(input.major),
  });
  return adjusted.score;
}

function scoreDomainInterest(input) {
  const projectRows = _getExperienceProjectRows(input);
  const canonicalWorkRows = _getExperienceCanonicalWorkRows(input);
  // 새 상위 분류 우선 사용. 없으면 기존 legacy fallback.
  const exploratoryRows = toArr(input.exploratoryExperienceRows).length > 0
    ? toArr(input.exploratoryExperienceRows)
    : projectRows;
  const practicalRows = toArr(input.practicalExperienceRows).length > 0
    ? toArr(input.practicalExperienceRows)
    : canonicalWorkRows;
  const axis2HintLabels = _getAxisHintLabels(input, "axis2", [
    "strongContextLabels",
    "supportContextLabels",
    "projectIndustryLabels",
  ]);
  const certAxis2HintLabels = _getCertAxisHintLabels(input, "axis2", ["alignedCertLabels", "weakCertLabels"]);
  const industryProfile = _getIndustryPrepProfile(input.targetIndustryId);
  const majorStrength = _scoreIndustryMajorRelevance(industryProfile, input.major);
  const certSupport = _getCertSupport(input);
  const projectSupportCount = _scoreIndustryProjectSupport(exploratoryRows);
  const workContext = _classifyContextEvidence(practicalRows);
  // 실무 경험 중 산업 직접 신호(direct/medium)가 있는 행 수
  const practicalIndustryCount = toArr(practicalRows).filter((row) => {
    const lvl = toStr(row.industrySignalLevel);
    return ["direct", "medium"].includes(lvl) && toArr(row.typeAxisEligible).includes("axis2");
  }).length;
  const exploratoryIndustryCount = _scoreIndustryProjectSupport(exploratoryRows);

  const strongContextCount = workContext.strongCount;
  const supportContextCount = workContext.supportCount;

  const majorAligned = majorStrength >= 2;
  const certificationsAligned = certSupport.supportCount > 0;
  const contextAligned = strongContextCount > 0;
  const weakProjectSignal = projectSupportCount > 0 || axis2HintLabels.length > 0;
  const weakCertSignal = certSupport.weakCount > 0 || certAxis2HintLabels.length > 0;

  const alignedSourceCount = [
    majorAligned,
    certificationsAligned,
    contextAligned,
  ].filter(Boolean).length;

  const weakSignalCount = [
    weakProjectSignal,
    supportContextCount > 0,
    // Removed: Boolean(input.major) && !majorAligned -- an unrelated major is not a positive industry signal
    certSupport.eligibleCount > 0 && !certificationsAligned,
    weakCertSignal,
  ].filter(Boolean).length;

  let score = 1;

  if (
    (alignedSourceCount >= 3 && strongContextCount >= 2) ||
    (practicalIndustryCount >= 2 && exploratoryIndustryCount > 0 && alignedSourceCount >= 2)
  ) {
    score = 5;
  } else if (
    (alignedSourceCount >= 2 && contextAligned && (supportContextCount > 0 || weakProjectSignal || certSupport.supportCount >= 1)) ||
    (practicalIndustryCount >= 2 && (majorAligned || certificationsAligned || weakProjectSignal))
  ) {
    score = 4;
  } else if (
    majorAligned ||
    contextAligned ||
    practicalIndustryCount >= 1 ||
    (certificationsAligned && (supportContextCount > 0 || weakProjectSignal)) ||
    weakSignalCount >= 3
  ) {
    score = 3;
  } else if (
    weakProjectSignal ||
    certificationsAligned ||
    supportContextCount > 0 ||
    Boolean(input.major) ||
    certSupport.eligibleCount > 0
  ) {
    score = 2;
  }

  // Conservative caps: thin or generic evidence should not inflate.
  if (majorAligned && !certificationsAligned && !contextAligned && !weakProjectSignal) {
    score = Math.min(score, 3);
  }
  if (certificationsAligned && !majorAligned && !contextAligned && !weakProjectSignal) {
    score = Math.min(score, 2);
  }
  if (weakProjectSignal && !majorAligned && !certificationsAligned && !contextAligned) {
    score = Math.min(score, 2);
  }
  // practicalIndustryCount >= 2이면 실무 증거로 충분히 뒷받침되므로 cap 면제
  if (!contextAligned && alignedSourceCount < 2 && practicalIndustryCount < 2) {
    score = Math.min(score, 3);
  }

  return Math.max(1, Math.min(5, score));
}

function _getProjectOutcomeLift(ranks = []) {
  if (ranks.some((rank) => Number(rank) >= 2)) return 2;
  if (ranks.some((rank) => Number(rank) >= 1)) return 1;
  return 0;
}

function _getDurationLift(ranks = []) {
  return ranks.some((rank) => Number(rank) >= 1) ? 1 : 0;
}

function scoreExecutionDepth(input) {
  const projectRows = _getExperienceProjectRows(input);
  const canonicalWorkRows = _getExperienceCanonicalWorkRows(input);
  const projectOutcomeRanks = _getRowNumberValues(projectRows, "outcomeRank", input.projectOutcomeRanks);
  const durationRanks = _getRowNumberValues(canonicalWorkRows, "durationRank", input.experienceDurationRanks);
  const evidenceGroupCount = countEvidenceGroups(
    input.projects,
    input.internships,
    input.extracurriculars,
    input.partTimeExperience
  );
  const evidenceItemCount = countEvidenceItems(
    input.projects,
    input.internships,
    input.extracurriculars,
    input.partTimeExperience
  );

  let base;
  if ((input.projects.length + input.internships.length) >= 3 && evidenceGroupCount >= 2) base = 5;
  else if (evidenceGroupCount >= 2 && evidenceItemCount >= 3) base = 4;
  else if (evidenceGroupCount >= 1 && evidenceItemCount >= 2) base = 3;
  else if (evidenceGroupCount >= 1) base = 2;
  else base = 1;

  const hasProjectInternshipCombo =
    (projectRows.length > 0 && canonicalWorkRows.length > 0)
    || (input.projects.length > 0 && input.internships.length > 0);
  const projectOutcomeLift = _getProjectOutcomeLift(projectOutcomeRanks);
  const durationLift = _getDurationLift(durationRanks);
  const semanticLift = Math.min(2, projectOutcomeLift + durationLift);
  const guardedSemanticLift =
    base === 4 && hasProjectInternshipCombo && projectOutcomeLift < 2
      ? Math.max(0, semanticLift - 1)
      : semanticLift;
  return Math.min(5, base + guardedSemanticLift);
}

function scoreAxis4PointsToScore5(points) {
  if (points >= 84) return 5;
  if (points >= 66) return 4;
  if (points >= 48) return 3;
  if (points >= 32) return 2;
  return 1;
}

function buildAxis4EvidenceSummary(baseSignals = {}, relevanceSignals = {}) {
  const stakeholderLabels = firstUniqueLabels(baseSignals.stakeholderLabels, 3);
  const primaryHitLabels = firstUniqueLabels(relevanceSignals.primaryHitLabels, 2);
  const sourceTypes = firstUniqueLabels(
    toArr(baseSignals.evidenceList).map((item) => toStr(item?.sourceType)),
    3
  );

  let line = "";
  if (stakeholderLabels.length > 0) {
    line = `${joinLabels(stakeholderLabels)}와의 상호작용 경험이 확인됩니다.`;
  } else if ((baseSignals.evidenceCount || 0) > 0) {
    line = "상호작용 경험의 단서는 있으나 상대 이해관계자가 선명하지 않습니다.";
  } else {
    line = "확인 가능한 이해관계자 소통 경험이 아직 많지 않습니다.";
  }

  if (primaryHitLabels.length > 0) {
    line += ` 이 중 ${joinLabels(primaryHitLabels)}는 목표 직무의 핵심 이해관계자와 직접 연결됩니다.`;
  }

  return {
    line,
    evidenceCount: Number(baseSignals.evidenceCount || 0),
    stakeholderLabels,
    primaryHitLabels,
    sourceTypes,
  };
}

function buildAxis4IntensitySummary(baseSignals = {}) {
  return {
    supportCount: Number(baseSignals.supportCount || 0),
    adjacentCount: Number(baseSignals.adjacentCount || 0),
    directCount: Number(baseSignals.directCount || 0),
    ownerCount: Number(baseSignals.ownerCount || 0),
    strongestIntensity: toStr(baseSignals.strongestIntensity) || "support",
  };
}

function evaluateInteractionFit(input = {}) {
  const evidenceList = collectNewgradAxis4InteractionEvidence(input);
  const baseSignals = computeAxis4BaseInteractionSignals(evidenceList);
  const relevanceMeta = getAxis4StakeholderRelevanceByJobId(input.targetJobId);
  const relevanceSignals = computeAxis4JobRelevanceSignals(evidenceList, relevanceMeta);
  const selfReportSupportScore = Math.max(0, Number(input.axis4SelfReportSupportScore || 0));
  const communicationCertLabels = toArr(input.axis4CommunicationCertLabels).map((item) => toStr(item)).filter(Boolean);
  const communicationCertSupportScore = communicationCertLabels.length > 0 ? 1 : 0;

  let selfReportPoints = 0;
  if (baseSignals.evidenceCount > 0) {
    selfReportPoints = Math.min(4, selfReportSupportScore * 2);
  } else if (selfReportSupportScore > 0) {
    selfReportPoints = Math.min(2, selfReportSupportScore);
  }

  let points = baseSignals.basePoints + relevanceSignals.relevancePoints + selfReportPoints + (communicationCertSupportScore * 2);

  if (baseSignals.evidenceCount === 0) {
    points = Math.min(points, 28);
  }
  if (baseSignals.reliableEvidenceCount === 0 && selfReportPoints > 0) {
    points = Math.min(points, 40);
  }
  if (baseSignals.onlyInternalTeam) {
    points = Math.min(points, 78);
  }
  if (baseSignals.onlyVagueEvidence) {
    points = Math.min(points, 58);
  }
  if (relevanceSignals.primaryHitKeys.length === 0 && baseSignals.evidenceCount > 0) {
    points = Math.min(points, 64);
  }
  if ((baseSignals.directCount + baseSignals.ownerCount) === 0 && relevanceSignals.primaryHitKeys.length === 0) {
    points = Math.min(points, 60);
  }

  const score = scoreAxis4PointsToScore5(points);
  const selfReportSupportLevel =
    selfReportPoints >= 3 ? "supporting"
    : selfReportPoints >= 1 ? "light"
    : "none";

  return {
    score,
    points,
    evidenceList,
    baseSignals,
    relevanceSignals,
    relevanceMeta,
    selfReportPoints,
    selfReportSupportLevel,
    communicationCertLabels,
    communicationCertSupportApplied: communicationCertLabels.length > 0,
    jobRelevantStakeholdersHit: {
      primaryKeys: relevanceSignals.primaryHitKeys,
      secondaryKeys: relevanceSignals.secondaryHitKeys,
      tertiaryKeys: relevanceSignals.tertiaryHitKeys,
      primaryLabels: relevanceSignals.primaryHitLabels,
      secondaryLabels: relevanceSignals.secondaryHitLabels,
      tertiaryLabels: relevanceSignals.tertiaryHitLabels,
      allLabels: [
        ...relevanceSignals.primaryHitLabels,
        ...relevanceSignals.secondaryHitLabels,
        ...relevanceSignals.tertiaryHitLabels,
      ],
    },
    missingImportantStakeholders: relevanceSignals.missingPrimaryLabels,
    interactionEvidenceSummary: buildAxis4EvidenceSummary(baseSignals, relevanceSignals),
    interactionIntensitySummary: buildAxis4IntensitySummary(baseSignals),
    axis4RelevanceMeta: relevanceMeta,
  };
}

const _AXIS5_TARGET_TRAITS = {
  BUSINESS: { strengths: ["analytical_thinking", "ownership", "communication", "problem_solving", "initiative", "prioritization", "learning_agility"], workstyles: ["structured_working", "need_sensing", "end_to_end_ownership", "context_first", "stepwise_prioritization"] },
  SALES: { strengths: ["communication", "persuasion", "empathy", "execution_speed", "initiative", "adaptability"], workstyles: ["frequent_communication", "need_sensing", "rapid_iteration"] },
  MARKETING: { strengths: ["analytical_thinking", "communication", "persuasion", "creativity", "problem_solving", "learning_agility", "adaptability"], workstyles: ["frequent_communication", "rapid_iteration", "idea_generation", "context_first", "evidence_based_judgment"] },
  CUSTOMER_OPERATIONS: { strengths: ["attention_to_detail", "ownership", "communication", "empathy", "problem_solving", "prioritization", "adaptability"], workstyles: ["frequent_communication", "error_detection", "end_to_end_ownership", "stepwise_prioritization"] },
  HR_ORGANIZATION: { strengths: ["attention_to_detail", "ownership", "communication", "empathy", "collaboration_orientation", "adaptability", "learning_agility"], workstyles: ["frequent_communication", "need_sensing", "end_to_end_ownership", "context_first"] },
  FINANCE_ACCOUNTING: { strengths: ["analytical_thinking", "attention_to_detail", "ownership", "problem_solving", "diligence", "prioritization"], workstyles: ["solo_deep_dive", "structured_working", "error_detection", "evidence_based_judgment", "stepwise_prioritization"] },
  PROCUREMENT_SCM: { strengths: ["analytical_thinking", "attention_to_detail", "ownership", "communication", "problem_solving", "prioritization", "adaptability"], workstyles: ["structured_working", "need_sensing", "end_to_end_ownership", "context_first", "stepwise_prioritization", "evidence_based_judgment"] },
  MANUFACTURING_QUALITY_PRODUCTION: { strengths: ["analytical_thinking", "attention_to_detail", "ownership", "problem_solving", "diligence", "adaptability"], workstyles: ["solo_deep_dive", "structured_working", "error_detection", "evidence_based_judgment", "stepwise_prioritization"] },
  ENGINEERING_DEVELOPMENT: { strengths: ["analytical_thinking", "attention_to_detail", "problem_solving", "creativity", "initiative", "learning_agility", "adaptability"], workstyles: ["solo_deep_dive", "structured_working", "rapid_iteration", "evidence_based_judgment", "context_first"] },
  IT_DATA_DIGITAL: { strengths: ["analytical_thinking", "attention_to_detail", "problem_solving", "creativity", "initiative", "learning_agility"], workstyles: ["solo_deep_dive", "structured_working", "rapid_iteration", "evidence_based_judgment", "context_first"] },
  DESIGN: { strengths: ["communication", "empathy", "problem_solving", "creativity", "collaboration_orientation", "adaptability"], workstyles: ["need_sensing", "idea_generation", "rapid_iteration", "context_first"] },
  RESEARCH_PROFESSIONAL: { strengths: ["analytical_thinking", "attention_to_detail", "ownership", "problem_solving", "diligence", "learning_agility"], workstyles: ["solo_deep_dive", "structured_working", "error_detection", "evidence_based_judgment", "context_first"] },
  EDUCATION_COUNSELING_COACHING: { strengths: ["ownership", "communication", "empathy", "problem_solving", "collaboration_orientation", "adaptability", "learning_agility"], workstyles: ["frequent_communication", "need_sensing", "end_to_end_ownership", "context_first"] },
  PUBLIC_ADMINISTRATION_SUPPORT: { strengths: ["analytical_thinking", "attention_to_detail", "ownership", "communication", "diligence", "prioritization"], workstyles: ["structured_working", "error_detection", "end_to_end_ownership", "evidence_based_judgment", "stepwise_prioritization"] },
};

function _splitWorkStyleNotes(notes) {
  return toStr(notes).split(",").map((item) => item.trim()).filter(Boolean);
}

function _countAxis5AlignedSignals(targetMajor, strengths = [], workstyles = []) {
  const traitMap = _AXIS5_TARGET_TRAITS[targetMajor];
  if (!traitMap) return { strengthsHits: 0, workstyleHits: 0, matchedStrengthKeys: [], matchedWorkStyleKeys: [] };
  const strengthSet = new Set(toArr(strengths));
  const workstyleSet = new Set(toArr(workstyles));
  const matchedStrengthKeys = traitMap.strengths.filter((item) => strengthSet.has(item));
  const matchedWorkStyleKeys = traitMap.workstyles.filter((item) => workstyleSet.has(item));
  return {
    strengthsHits: matchedStrengthKeys.length,
    workstyleHits: matchedWorkStyleKeys.length,
    matchedStrengthKeys,
    matchedWorkStyleKeys,
  };
}

function scoreSoftSkillMatch(input) {
  const targetMajor = _getJobMajorCategory(toStr(input.targetJobId));
  const strengths = _getSelfReportStrengthKeys(input);
  const workstyles = _getSelfReportWorkStyleKeys(input);
  const hasAxis5Input = strengths.length > 0 || workstyles.length > 0;
  if (!hasAxis5Input) return 1;

  if (!targetMajor) {
    const rawSignals = strengths.length + workstyles.length;
    if (rawSignals >= 4 && strengths.length > 0 && workstyles.length > 0) return 4;
    if (rawSignals >= 2) return 3;
    return 2;
  }

  const { strengthsHits, workstyleHits } = _countAxis5AlignedSignals(targetMajor, strengths, workstyles);
  const alignedSignals = strengthsHits + workstyleHits;
  if (alignedSignals <= 0) return 1;
  if (alignedSignals === 1) return 2;
  if (alignedSignals === 2) return 3;
  if (alignedSignals === 3) return workstyleHits > 0 && strengthsHits > 0 ? 4 : 3;
  if (workstyleHits > 0 && strengthsHits > 0) return 5;
  if (alignedSignals >= 4) return 4;
  return 1;
}

// Newgrad axis selection pack helpers
// These helpers build intermediate selection packs from existing signals.
// They do NOT affect scoring, signals, or description.
// Contract: 00_HQ/Axis_Selection_Pack_Contract.md

function buildAxis1SelectionPack(signals, band) {
  const projectBestLinkType = signals?.projectBestLinkType ?? "none";
  const internshipLinkType  = signals?.internshipLinkType  ?? "none";
  const majorPriorLabel     = signals?.majorPriorLabel     ?? "mismatch";
  const countOnlyFallback   = signals?.countOnlyFallbackUsed === true;
  const projectRoleLabels   = toArr(signals?.projectRoleExperienceLabels);
  const internRoleLabels    = toArr(signals?.internshipRoleExperienceLabels);

  let primaryPositiveEvidence = null;
  let primaryEvidenceType     = null;

  if (projectBestLinkType === "direct") {
    primaryPositiveEvidence = {
      sourceType: "project", sourceId: null,
      signalType: "role_directness", axisUsage: "role_directness",
      strengthTier: "A", observed: true, directness: "direct",
      specificity: projectRoleLabels.length > 0 ? "high" : "medium",
      summary: projectRoleLabels.length > 0
        ? `목표 직무와 직접 연결되는 프로젝트 역할(${projectRoleLabels[0]})이 확인됩니다.`
        : "목표 직무와 직접 연결되는 프로젝트 역할 경험이 확인됩니다.",
      limitingPoint: null, supportRole: "positive", confidence: "high",
      tags: ["direct_project"],
    };
    primaryEvidenceType = "project";
  } else if (internshipLinkType === "direct") {
    primaryPositiveEvidence = {
      sourceType: "internship", sourceId: null,
      signalType: "role_directness", axisUsage: "role_directness",
      strengthTier: "A", observed: true, directness: "direct",
      specificity: internRoleLabels.length > 0 ? "high" : "medium",
      summary: internRoleLabels.length > 0
        ? `목표 직무와 직접 연결되는 인턴 역할(${internRoleLabels[0]})이 확인됩니다.`
        : "목표 직무와 직접 연결되는 인턴 경험이 확인됩니다.",
      limitingPoint: null, supportRole: "positive", confidence: "high",
      tags: ["direct_internship"],
    };
    primaryEvidenceType = "internship";
  } else if (majorPriorLabel === "direct") {
    primaryPositiveEvidence = {
      sourceType: "major", sourceId: null,
      signalType: "role_directness", axisUsage: "role_directness",
      strengthTier: "B", observed: false, directness: "adjacent", specificity: "medium",
      summary: "전공이 목표 직무 방향과 직접 연결되는 기반으로 읽힙니다.",
      limitingPoint: "전공과 함께 프로젝트나 인턴에서의 역할 근거가 더해지면 직무 연결성이 더 분명해집니다.",
      supportRole: "positive", confidence: "medium", tags: ["major_direct"],
    };
    primaryEvidenceType = "major";
  } else if (projectBestLinkType === "adjacent" || internshipLinkType === "industry_only") {
    const isProj = projectBestLinkType === "adjacent";
    primaryPositiveEvidence = {
      sourceType: isProj ? "project" : "internship", sourceId: null,
      signalType: "role_directness", axisUsage: "role_directness",
      strengthTier: "B", observed: true, directness: "adjacent", specificity: "low",
      summary: isProj ? "직무와 인접한 프로젝트 경험이 확인됩니다." : "인턴 경험에서 직무와 맞닿는 실무 맥락이 일부 확인됩니다.",
      limitingPoint: "직무와 직접 이어지는 역할 경험이 추가되면 연결성이 더 또렷해집니다.",
      supportRole: "positive", confidence: "low", tags: ["adjacent_evidence"],
    };
    primaryEvidenceType = isProj ? "project" : "internship";
  }

  const hasDirectEvidence   = projectBestLinkType === "direct" || internshipLinkType === "direct";
  const hasAdjacentEvidence = projectBestLinkType === "adjacent" || internshipLinkType === "industry_only" || majorPriorLabel === "direct";

  let primaryLimitingEvidence = null;
  let limitingEvidenceType    = null;
  if (!hasDirectEvidence) {
    primaryLimitingEvidence = {
      sourceType: "mixed", sourceId: null,
      signalType: "role_directness", axisUsage: "role_directness",
      strengthTier: countOnlyFallback ? "C" : "B", observed: false,
      directness: countOnlyFallback ? "none" : "weak", specificity: "low",
      summary: countOnlyFallback
        ? "직무와 직접 연결되는 역할 경험이 아직 충분히 확인되지 않습니다."
        : "직접적인 역할 경험이 부족해 상위 구간으로 해석되기에는 제한이 있습니다.",
      limitingPoint: "직무와 직접 이어지는 프로젝트나 인턴 경험이 보완되면 해석이 더 분명해집니다.",
      supportRole: "limiting", confidence: countOnlyFallback ? "high" : "medium",
      tags: countOnlyFallback ? ["no_direct_evidence"] : ["role_directness_gap"],
    };
    limitingEvidenceType = "mixed";
  }

  const selectionMode      = countOnlyFallback ? "no_strong_evidence" : hasDirectEvidence ? "standard" : hasAdjacentEvidence ? "standard" : "weak_only";
  const selectorConfidence = hasDirectEvidence ? "high" : hasAdjacentEvidence ? "medium" : "low";

  return {
    axisKey: "axis1", axisVersion: "newgrad-selection-pack-v1",
    primaryPositiveEvidence, primaryLimitingEvidence, secondaryEvidenceList: [],
    selectorConfidence, selectionMode, primaryEvidenceType, limitingEvidenceType,
    weakOnly: !hasDirectEvidence && !hasAdjacentEvidence,
    selfReportOnly: false, noStrongObservedEvidence: !hasDirectEvidence,
    overlapGuardNotes: [
      "Axis1 reads project/internship as role_directness, not industry_context (Axis2) or execution_depth (Axis3)",
    ],
    selectionSummary: primaryPositiveEvidence
      ? `${primaryEvidenceType} 근거를 중심으로 직무 연결성을 해석했습니다.`
      : "직접 연결 근거가 부족해 제한 요인을 중심으로 해석했습니다.",
    assemblyHints: {
      recommendedLeadMode: hasDirectEvidence ? "positive_first" : hasAdjacentEvidence ? "balanced" : "limit_first",
      recommendedCriteriaFocus: ["role_directness"],
      recommendedLiftOrLimitMode: hasDirectEvidence ? "lift" : "limit",
      suppressOverclaim: !hasDirectEvidence,
    },
  };
}

function buildAxis2SelectionPack(signals, band) {
  const majorAligned          = signals?.majorAligned === true;
  const certificationsAligned = signals?.certificationsAligned === true;
  const contextAligned        = signals?.contextAligned === true;
  const weakProjectSignal     = signals?.weakProjectSignal === true;
  const internContextStrength = signals?.internContextStrength ?? "none";
  const internTypeLabels      = toArr(signals?.internshipTypeExperienceLabels);
  const projectTypeLabels     = toArr(signals?.projectTypeExperienceLabels);

  let primaryPositiveEvidence = null;
  let primaryEvidenceType     = null;

  if (contextAligned && internContextStrength === "strong") {
    primaryPositiveEvidence = {
      sourceType: "internship", sourceId: null,
      signalType: "industry_context", axisUsage: "industry_context",
      strengthTier: "A", observed: true, directness: "direct",
      specificity: internTypeLabels.length > 0 ? "high" : "medium",
      summary: internTypeLabels.length > 0
        ? `목표 산업과 직접 연결되는 인턴·계약 경험(${internTypeLabels[0]})이 확인됩니다.`
        : "목표 산업과 직접 연결되는 실무 경험이 확인됩니다.",
      limitingPoint: null, supportRole: "positive", confidence: "high",
      tags: ["industry_context_direct"],
    };
    primaryEvidenceType = "internship";
  } else if (certificationsAligned) {
    primaryPositiveEvidence = {
      sourceType: "certification", sourceId: null,
      signalType: "industry_context", axisUsage: "industry_context",
      strengthTier: "B", observed: true, directness: "adjacent", specificity: "medium",
      summary: "관련 자격증이 산업 이해를 보완하는 근거로 반영됩니다.",
      limitingPoint: "자격증만으로는 실제 산업 맥락을 충분히 보여주기 어려워 실무 경험이 함께 필요합니다.",
      supportRole: "positive", confidence: "medium", tags: ["cert_industry_support"],
    };
    primaryEvidenceType = "certification";
  } else if (majorAligned) {
    primaryPositiveEvidence = {
      sourceType: "major", sourceId: null,
      signalType: "industry_context", axisUsage: "industry_context",
      strengthTier: "B", observed: false, directness: "adjacent", specificity: "medium",
      summary: "전공이 목표 산업을 이해하는 기초 근거로 반영됩니다.",
      limitingPoint: "전공만으로는 실제 산업 맥락을 충분히 설명하기 어려워 관련 경험이 함께 필요합니다.",
      supportRole: "positive", confidence: "medium", tags: ["major_industry_aligned"],
    };
    primaryEvidenceType = "major";
  } else if (weakProjectSignal) {
    primaryPositiveEvidence = {
      sourceType: "project", sourceId: null,
      signalType: "industry_context", axisUsage: "industry_context",
      strengthTier: "C", observed: true, directness: "weak", specificity: "low",
      summary: "산업과 인접한 경험 근거가 일부 확인됩니다.",


      limitingPoint: "목표 산업과 직접 맞닿는 경험이 추가되면 산업 이해도가 더 분명해집니다.",
      supportRole: "positive", confidence: "low", tags: ["weak_project_signal"],
    };
    primaryEvidenceType = "project";
  }

  const hasStrong  = contextAligned && internContextStrength === "strong";
  const hasSupport = certificationsAligned || majorAligned || weakProjectSignal;

  let primaryLimitingEvidence = null;
  let limitingEvidenceType    = null;
  if (!hasStrong) {
    primaryLimitingEvidence = {
      sourceType: "mixed", sourceId: null,
      signalType: "industry_context", axisUsage: "industry_context",
      strengthTier: hasSupport ? "B" : "C", observed: false,
      directness: hasSupport ? "weak" : "none", specificity: "low",
      summary: hasSupport
        ? "산업과 연결되는 단서는 있으나, 목표 산업과 직접 맞닿는 경험 근거는 아직 제한적입니다."
        : "목표 산업과 직접 연결되는 경험 근거가 아직 충분히 선명하지 않습니다.",
      limitingPoint: "프로젝트, 인턴, 계약 경험 중 산업과 직접 맞닿는 사례가 추가되면 해석이 더 강해집니다.",
      supportRole: "limiting", confidence: hasSupport ? "medium" : "high",
      tags: hasSupport ? ["single_path_only"] : ["no_direct_industry_context"],
    };
    limitingEvidenceType = "mixed";
  }

  return {
    axisKey: "axis2", axisVersion: "newgrad-selection-pack-v1",
    primaryPositiveEvidence, primaryLimitingEvidence, secondaryEvidenceList: [],
    selectorConfidence: hasStrong ? "high" : hasSupport ? "medium" : "low",
    selectionMode: hasStrong || hasSupport ? "standard" : "weak_only",
    primaryEvidenceType, limitingEvidenceType,
    weakOnly: !hasStrong && !hasSupport, selfReportOnly: false,
    noStrongObservedEvidence: !hasStrong,
    overlapGuardNotes: [
      "Axis2 reads internship/project as industry_context, not role_directness (Axis1) or execution_depth (Axis3)",
      "Axis2 uses stakeholder only when it reveals industry environment, not interaction quality (Axis4)",
    ],
    selectionSummary: primaryPositiveEvidence
      ? `${primaryEvidenceType} 근거를 중심으로 산업 이해도를 해석했습니다.`
      : "직접적인 산업 맥락 근거가 부족해 제한 요인을 중심으로 해석했습니다.",
    assemblyHints: {
      recommendedLeadMode: hasStrong ? "positive_first" : hasSupport ? "balanced" : "limit_first",
      recommendedCriteriaFocus: ["industry_context"],
      recommendedLiftOrLimitMode: hasStrong ? "lift" : "limit",
      suppressOverclaim: !hasStrong,
    },
  };
}

function buildAxis3SelectionPack(signals, band) {
  const projectOutcomeLevel    = signals?.projectOutcomeLevel    ?? "none";
  const experienceDurationLevel = signals?.experienceDurationLevel ?? "none";
  const comboEvidence          = signals?.comboEvidence === true;
  const evidenceStrength       = signals?.evidenceStrength       ?? "none";
  const outcomeLabels          = toArr(signals?.outcomeExperienceLabels);
  const durationLabels         = toArr(signals?.durationExperienceLabels);

  let primaryPositiveEvidence = null;
  let primaryEvidenceType     = null;

  if (projectOutcomeLevel === "strong") {
    primaryPositiveEvidence = {
      sourceType: "project", sourceId: null,
      signalType: "ownership_depth", axisUsage: "execution_depth",
      strengthTier: "A", observed: true, directness: "direct",
      specificity: outcomeLabels.length > 0 ? "high" : "medium",
      summary: "결과를 만들어 본 프로젝트 경험이 확인됩니다.",


      limitingPoint: "결과 수준과 함께 맡은 범위가 더 구체적으로 드러나면 실행 깊이가 더 선명해집니다.", supportRole: "positive", confidence: "high",
      tags: ["strong_outcome"],
    };
    primaryEvidenceType = "project";
  } else if (comboEvidence) {
    primaryPositiveEvidence = {
      sourceType: "mixed", sourceId: null,
      signalType: "ownership_depth", axisUsage: "execution_depth",
      strengthTier: "A", observed: true, directness: "direct", specificity: "medium",
      summary: "프로젝트와 실무 경험이 함께 있어 실행 경험을 뒷받침합니다.",
      limitingPoint: "단순 참여를 넘어서 결과와 책임 범위가 함께 보이면 실행 깊이가 더 높게 읽힙니다.", supportRole: "positive", confidence: "high",
      tags: ["combo_evidence"],
    };
    primaryEvidenceType = "mixed";
  } else if (experienceDurationLevel === "long") {
    primaryPositiveEvidence = {
      sourceType: "internship", sourceId: null,
      signalType: "ownership_depth", axisUsage: "execution_depth",
      strengthTier: "B", observed: true, directness: "adjacent",
      specificity: durationLabels.length > 0 ? "high" : "medium",
      summary: "일정 기간 이어진 실무 경험이 확인됩니다.",


      limitingPoint: "지속 기간에 더해 실제로 어떤 결과를 만들었는지가 함께 보이면 해석이 더 강해집니다.",
      supportRole: "positive", confidence: "medium", tags: ["long_duration"],
    };
    primaryEvidenceType = "internship";
  } else if (projectOutcomeLevel === "support") {
    primaryPositiveEvidence = {
      sourceType: "project", sourceId: null,
      signalType: "ownership_depth", axisUsage: "execution_depth",
      strengthTier: "B", observed: true, directness: "adjacent", specificity: "low",
      summary: "프로젝트 경험이 실행 근거로 반영됩니다.",
      limitingPoint: "프로젝트에서 맡은 역할과 결과가 더 구체적으로 드러나면 실행 깊이가 더 선명해집니다.",
      supportRole: "positive", confidence: "low", tags: ["project_support_level"],
    };
    primaryEvidenceType = "project";
  }

  const hasStrong  = projectOutcomeLevel === "strong" || comboEvidence;
  const hasSupport = evidenceStrength !== "none";

  let primaryLimitingEvidence = null;
  let limitingEvidenceType    = null;
  if (evidenceStrength === "none") {
    primaryLimitingEvidence = {
      sourceType: "mixed", sourceId: null,
      signalType: "ownership_depth", axisUsage: "execution_depth",
      strengthTier: "C", observed: false, directness: "none", specificity: "low",
      summary: "책임을 맡아 수행한 경험 근거가 아직 충분히 확인되지 않습니다.",
      limitingPoint: "직접 맡아 끝까지 수행한 경험이나 결과를 만든 경험이 추가되면 해석이 더 분명해집니다.",
      supportRole: "limiting", confidence: "high", tags: ["no_evidence"],
    };
    limitingEvidenceType = "mixed";
  } else if (!hasStrong) {
    primaryLimitingEvidence = {
      sourceType: "mixed", sourceId: null,
      signalType: "ownership_depth", axisUsage: "execution_depth",
      strengthTier: "B", observed: true, directness: "weak", specificity: "low",
      summary: "경험은 보이지만 결과 수준이나 지속성이 충분히 선명하지 않습니다.",
      limitingPoint: "결과를 만든 경험과 일정 기간 이어진 경험이 함께 드러나면 실행 깊이가 더 높게 읽힙니다.",
      supportRole: "limiting", confidence: "medium", tags: ["outcome_duration_gap"],
    };
    limitingEvidenceType = "mixed";
  }

  return {
    axisKey: "axis3", axisVersion: "newgrad-selection-pack-v1",
    primaryPositiveEvidence, primaryLimitingEvidence, secondaryEvidenceList: [],
    selectorConfidence: hasStrong ? "high" : hasSupport ? "medium" : "low",
    selectionMode: hasStrong || hasSupport ? "standard" : "weak_only",
    primaryEvidenceType, limitingEvidenceType,
    weakOnly: !hasStrong && !hasSupport, selfReportOnly: false,
    noStrongObservedEvidence: !hasStrong,
    overlapGuardNotes: [
      "Axis3 reads project/internship as execution_depth (outcome/duration), not role_directness (Axis1) or industry_context (Axis2)",
      "Axis3 does not use role fit itself as depth evidence",
    ],
    selectionSummary: primaryPositiveEvidence
      ? `${primaryEvidenceType ?? "mixed"} 근거를 중심으로 실행 깊이를 해석했습니다.`
      : "실행 경험의 깊이보다 제한 요인이 더 크게 반영된 상태입니다.",
    assemblyHints: {
      recommendedLeadMode: hasStrong ? "positive_first" : hasSupport ? "balanced" : "limit_first",
      recommendedCriteriaFocus: ["ownership_depth", "outcome", "duration"],
      recommendedLiftOrLimitMode: hasStrong ? "lift" : "limit",
      suppressOverclaim: !hasStrong,
    },
  };
}

function buildAxis4SelectionPack(signals, band) {
  const stakeholderLabels               = toArr(signals?.stakeholderExperienceLabels);
  const interactionSupportTone          = signals?.interactionSupportTone ?? "support";
  const selfReportDirectApplied         = signals?.selfReportDirectApplied === true;
  const interactionEligibleWorkStyleLabels = toArr(signals?.interactionEligibleWorkStyleLabels);

  let primaryPositiveEvidence = null;
  let primaryEvidenceType     = null;

  if (stakeholderLabels.length > 0 && interactionSupportTone === "strong") {
    primaryPositiveEvidence = {
      sourceType: "internship", sourceId: null,
      signalType: "stakeholder_contact", axisUsage: "stakeholder_interaction",
      strengthTier: "A", observed: true, directness: "direct", specificity: "high",
      summary: "타인과 직접 소통하거나 조율한 경험이 확인됩니다.",
      limitingPoint: null, supportRole: "positive", confidence: "high",
      tags: ["direct_stakeholder"],
    };
    primaryEvidenceType = "internship";
  } else if (stakeholderLabels.length > 0) {
    primaryPositiveEvidence = {
      sourceType: "mixed", sourceId: null,
      signalType: "stakeholder_contact", axisUsage: "stakeholder_interaction",
      strengthTier: "B", observed: true, directness: "adjacent", specificity: "medium",
      summary: "이해관계자와의 상호작용 경험이 확인됩니다.",
      limitingPoint: "상대방을 직접 설득하거나 조율한 장면이 더 드러나면 소통 적합성이 더 선명해집니다.",
      supportRole: "positive", confidence: "medium", tags: ["stakeholder_support"],
    };
    primaryEvidenceType = "mixed";
  } else if (selfReportDirectApplied && interactionEligibleWorkStyleLabels.length > 0) {
    primaryPositiveEvidence = {
      sourceType: "self_report", sourceId: null,
      signalType: "stakeholder_contact", axisUsage: "stakeholder_interaction",
      strengthTier: "C", observed: false, directness: "weak", specificity: "low",
      summary: "역할 수행 과정에서 타인과 접점을 만든 경험이 확인됩니다.",
      limitingPoint: "직접 설명하거나 조율하거나 응대한 경험이 더 드러나면 소통 적합성이 더 분명해집니다.",
      supportRole: "positive", confidence: "low", tags: ["self_report_interaction_support"],
    };
    primaryEvidenceType = "self_report";
  }

  const hasStrong  = stakeholderLabels.length > 0 && interactionSupportTone === "strong";
  const hasSupport = stakeholderLabels.length > 0;

  let primaryLimitingEvidence = null;
  let limitingEvidenceType    = null;
  if (stakeholderLabels.length === 0) {
    primaryLimitingEvidence = {
      sourceType: "mixed", sourceId: null,
      signalType: "stakeholder_contact", axisUsage: "stakeholder_interaction",
      strengthTier: "C", observed: false, directness: "none", specificity: "low",
      summary: "직접 소통하거나 조율한 경험 근거는 아직 많지 않습니다.",
      limitingPoint: "협업, 조율, 응대처럼 직접 상호작용한 경험이 더 드러나면 해석이 강화됩니다.",
      supportRole: "limiting", confidence: "high", tags: ["no_stakeholder"],
    };
    limitingEvidenceType = "mixed";
  } else if (interactionSupportTone !== "strong") {
    primaryLimitingEvidence = {
      sourceType: "mixed", sourceId: null,
      signalType: "stakeholder_contact", axisUsage: "stakeholder_interaction",
      strengthTier: "B", observed: true, directness: "weak", specificity: "low",
      summary: "타인과의 접점은 보이지만 직접 상호작용 경험은 아직 제한적입니다.",
      limitingPoint: "협업, 조율, 응대처럼 직접 상호작용한 경험이 더 드러나면 해석이 강화됩니다.",
      supportRole: "limiting", confidence: "medium", tags: ["weak_external_contact"],
    };
    limitingEvidenceType = "mixed";
  }

  return {
    axisKey: "axis4", axisVersion: "newgrad-selection-pack-v1",
    primaryPositiveEvidence, primaryLimitingEvidence, secondaryEvidenceList: [],
    selectorConfidence: hasStrong ? "high" : hasSupport ? "medium" : "low",
    selectionMode: hasStrong || hasSupport ? "standard" : "weak_only",
    primaryEvidenceType, limitingEvidenceType,
    weakOnly: !hasStrong && !hasSupport,
    selfReportOnly: primaryEvidenceType === "self_report",
    noStrongObservedEvidence: !hasStrong,
    overlapGuardNotes: [
      "Axis4 reads internship/experience as stakeholder_interaction (who they worked with), not execution_depth (Axis3) or behavior_consistency (Axis5)",
      "Axis4 excludes generic teamwork without identified stakeholder counterpart",
    ],
    selectionSummary: primaryPositiveEvidence
      ? `${primaryEvidenceType} 근거를 중심으로 소통 적합성을 해석했습니다.`
      : "직접적인 상호작용 근거가 부족해 제한 요인을 중심으로 해석했습니다.",
    assemblyHints: {
      recommendedLeadMode: hasStrong ? "positive_first" : hasSupport ? "balanced" : "limit_first",
      recommendedCriteriaFocus: ["stakeholder_contact", "stakeholder_interaction"],
      recommendedLiftOrLimitMode: hasStrong ? "lift" : "limit",
      suppressOverclaim: !hasStrong,
    },
  };
}

function buildAxis5SelectionPack(signals, band) {
  const matchedStrengthLabels  = toArr(signals?.matchedStrengthLabels);
  const matchedWorkStyleLabels = toArr(signals?.matchedWorkStyleLabels);
  const selfReportAligned      = signals?.selfReportAlignedDirectly === true;
  const strengthsCount         = signals?.strengthsCount ?? 0;

  const hasMatchedStrengths  = matchedStrengthLabels.length > 0;
  const hasMatchedWorkStyles = matchedWorkStyleLabels.length > 0;
  const hasAnyMatch          = hasMatchedStrengths || hasMatchedWorkStyles;

  let primaryPositiveEvidence = null;
  let primaryEvidenceType     = null;

  if (hasMatchedStrengths && hasMatchedWorkStyles) {
    primaryPositiveEvidence = {
      sourceType: "self_report", sourceId: null,
      signalType: "workstyle_alignment", axisUsage: "behavior_consistency",
      strengthTier: selfReportAligned ? "B" : "C", observed: false,
      directness: "adjacent", specificity: "medium",
      summary: "강점과 일하는 방식이 목표 직무와 비교적 잘 맞습니다.",
      limitingPoint: "자기보고 성향이 실제 경험과 함께 드러나면 적합성이 더 설득력 있게 해석됩니다.",
      supportRole: "positive", confidence: selfReportAligned ? "medium" : "low",
      tags: ["strengths_and_workstyle_matched"],
    };
    primaryEvidenceType = "self_report";
  } else if (hasMatchedStrengths) {
    primaryPositiveEvidence = {
      sourceType: "self_report", sourceId: null,
      signalType: "workstyle_alignment", axisUsage: "behavior_consistency",
      strengthTier: "C", observed: false, directness: "adjacent", specificity: "low",
      summary: "강점 선택이 목표 직무 성향과 맞닿아 있습니다.",
      limitingPoint: "강점이 실제 경험 사례와 함께 제시되면 적합성이 더 분명해집니다.",
      supportRole: "positive", confidence: "low", tags: ["strengths_matched_only"],
    };
    primaryEvidenceType = "self_report";
  } else if (hasMatchedWorkStyles) {
    primaryPositiveEvidence = {
      sourceType: "self_report", sourceId: null,
      signalType: "workstyle_alignment", axisUsage: "behavior_consistency",
      strengthTier: "C", observed: false, directness: "adjacent", specificity: "low",
      summary: "일하는 방식이 목표 직무의 수행 스타일과 맞닿아 있습니다.",
      limitingPoint: "일하는 방식이 실제 프로젝트나 인턴 경험과 함께 보이면 해석이 더 설득력 있어집니다.",
      supportRole: "positive", confidence: "low", tags: ["workstyle_matched_only"],
    };
    primaryEvidenceType = "self_report";
  } else if (strengthsCount > 0) {
    primaryPositiveEvidence = {
      sourceType: "self_report", sourceId: null,
      signalType: "workstyle_alignment", axisUsage: "behavior_consistency",
      strengthTier: "C", observed: false, directness: "weak", specificity: "low",
      summary: "강점 정보는 입력되어 있지만 목표 직무 성향과 직접 맞닿는 항목은 아직 제한적입니다.",
      limitingPoint: "선택한 강점이 실제 프로젝트나 인턴 경험에서 어떻게 드러났는지 함께 제시되면 해석이 더 분명해집니다.",
      supportRole: "positive", confidence: "low", tags: ["strengths_present_unmatched"],
    };
    primaryEvidenceType = "self_report";
  }

  // Axis5 limiting is mandatory (self-report based axis)
  let primaryLimitingEvidence = null;
  if (!hasAnyMatch) {
    primaryLimitingEvidence = {
      sourceType: "self_report", sourceId: null,
      signalType: "workstyle_alignment", axisUsage: "behavior_consistency",
      strengthTier: "C", observed: false, directness: "none", specificity: "low",
      summary: "강점과 일하는 방식 정보는 있으나 직무 적합성을 강하게 뒷받침하기에는 아직 제한적입니다.",
      limitingPoint: "자기보고 외에 실제 경험에서 같은 성향이 함께 보이면 적합성이 더 분명해집니다.",
      supportRole: "limiting", confidence: "high", tags: ["no_match"],
    };
  } else if (!selfReportAligned) {
    primaryLimitingEvidence = {
      sourceType: "self_report", sourceId: null,
      signalType: "workstyle_alignment", axisUsage: "behavior_consistency",
      strengthTier: "C", observed: false, directness: "weak", specificity: "low",
      summary: "강점과 일하는 방식 정보는 있으나 직무 적합성을 강하게 뒷받침하기에는 아직 제한적입니다.",
      limitingPoint: "자기보고 외에 실제 경험에서 같은 성향이 함께 보이면 적합성이 더 분명해집니다.",
      supportRole: "limiting", confidence: "high", tags: ["self_report_only_type_a"],
    };
  } else {
    primaryLimitingEvidence = {
      sourceType: "self_report", sourceId: null,
      signalType: "workstyle_alignment", axisUsage: "behavior_consistency",
      strengthTier: "C", observed: false, directness: "adjacent", specificity: "low",
      summary: "강점과 일하는 방식 정보는 있으나 직무 적합성을 강하게 뒷받침하기에는 아직 제한적입니다.",
      limitingPoint: "자기보고 외에 실제 경험에서 같은 성향이 함께 보이면 적합성이 더 분명해집니다.",
      supportRole: "limiting", confidence: "medium", tags: ["self_report_experience_consistency_gap"],
    };
  }

  const selectionMode = !hasAnyMatch ? "no_strong_evidence" : "self_report_limited";

  return {
    axisKey: "axis5", axisVersion: "newgrad-selection-pack-v1",
    primaryPositiveEvidence, primaryLimitingEvidence, secondaryEvidenceList: [],
    selectorConfidence: "low",
    selectionMode,
    primaryEvidenceType: hasAnyMatch ? primaryEvidenceType : null,
    limitingEvidenceType: "self_report",
    weakOnly: !hasAnyMatch,
    selfReportOnly: true,
    noStrongObservedEvidence: true,
    overlapGuardNotes: [
      "Axis5 reads strengths/workstyle as behavior_consistency, not stakeholder_interaction (Axis4)",
      "Axis5 excludes generic teamwork already consumed by Axis4 as stakeholder contact",
      "Axis5 self-report is always limited; observed behavior support is required for higher confidence",
    ],
    selectionSummary: hasAnyMatch
      ? `${primaryEvidenceType} 근거를 중심으로 강점 적합성을 해석했습니다.`
      : "자기보고 정보만으로는 강한 적합성을 판단하기 어려워 제한 요인을 함께 반영했습니다.",
    assemblyHints: {
      recommendedLeadMode: hasMatchedStrengths && hasMatchedWorkStyles ? "balanced" : "limit_first",
      recommendedCriteriaFocus: ["workstyle_alignment", "behavior_consistency"],
      recommendedLiftOrLimitMode: "limit",
      suppressOverclaim: true,
    },
  };
}

function makeComparisonRow({
  rowKey,
  label,
  displayMode,
  valueType = "derived",
  sourceSignals = [],
  currentValue = null,
  targetValue = null,
  score = null,
  band = null,
  summaryText,
  verdictText = null,
  evidenceText = null,
  limitText = null,
  cautionText = null,
  positiveEvidenceLabels = [],
  exactEvidencePhrases = [],
  missingEvidenceLabels = [],
  actionHint = null,
  confidence = "medium",
  visible = true,
}) {
  const safeSummaryText = toStr(summaryText);
  const safeCautionText = toStr(cautionText);
  const safeVerdictText = toStr(verdictText)
    || (toStr(currentValue) ? `${toStr(currentValue)} 기준으로 판단됩니다.` : "현재 기준에서 보수적으로 판단합니다.");
  const safeEvidenceText = toStr(evidenceText) || safeSummaryText;
  const safeLimitText = toStr(limitText)
    || safeCautionText
    || (confidence === "high"
      ? "아직 뚜렷하게 드러난 근거는 많지 않습니다."
      : confidence === "low"
        ? "직접 연결되는 사례는 더 필요합니다."
        : "근거는 있으나 강하게 해석되기에는 아직 제한적입니다.");
  return {
    rowKey,
    label,
    displayMode,
    valueType,
    sourceSignals,
    currentValue,
    targetValue,
    score,
    band,
    verdictText: safeVerdictText,
    evidenceText: safeEvidenceText,
    limitText: safeLimitText,
    summaryText: safeSummaryText,
    cautionText,
    exactEvidencePhrases: firstUniqueLabels(exactEvidencePhrases, 2),
    positiveEvidenceLabels: firstUniqueLabels(positiveEvidenceLabels, 3),
    missingEvidenceLabels: firstUniqueLabels(missingEvidenceLabels, 3),
    actionHint: toStr(actionHint),
    confidence,
    visible,
  };
}

function formatDetailedReadLabelText(labels = [], maxCount = 2) {
  const safeLabels = firstUniqueLabels(labels, Math.max(1, maxCount)).filter(Boolean);
  if (safeLabels.length === 0) return "";
  if (safeLabels.length === 1) return safeLabels[0];
  if (safeLabels.length === 2) return `${safeLabels[0]}와 ${safeLabels[1]}`;
  return `${safeLabels[0]}, ${safeLabels[1]} 등`;
}

function makeDetailedReadLabelList(text, fallbackText) {
  const line = toStr(text) || toStr(fallbackText);
  return line ? [line] : [];
}

function buildExactEvidencePhrases(...groups) {
  const flat = groups.flatMap((group) => toArr(group))
    .map((item) => toStr(item))
    .filter(Boolean);
  return firstUniqueLabels(flat, 2);
}

function buildPrefixedEvidencePhrases(prefix, labels = [], maxCount = 2) {
  return firstUniqueLabels(labels, maxCount)
    .map((label) => toStr(label))
    .filter(Boolean)
    .map((label) => `${prefix} ${label}`);
}

function buildGroupedPrefixedEvidencePhrase(prefix, labels = []) {
  const safe = firstUniqueLabels(labels, 2).map((l) => toStr(l)).filter(Boolean);
  if (safe.length === 0) return [];
  return [`${prefix} ${safe.join(", ")}`];
}

function getProjectSourceLabel(row = {}) {
  return pickFirstLabel(
    row?.normalizedTypeLabel,
    row?.title,
    row?.projectTitle,
    row?.name,
    row?.normalizedRoleLabel
  );
}

function getWorkSourceLabel(row = {}) {
  return pickFirstLabel(
    row?.normalizedRoleLabel,
    row?.normalizedTypeLabel,
    row?.sourceGroupLabel
  );
}

function getExperienceSourcePrefix(sourceKind) {
  const safeSourceKind = toStr(sourceKind);
  if (safeSourceKind === "internship") return "인턴";
  if (safeSourceKind === "contractExperience") return "계약직";
  if (safeSourceKind === "partTime") return "아르바이트";
  if (safeSourceKind === "project") return "프로젝트";
  return "경험";
}

function buildSourceLabelPhrase(prefix, label, suffix = "") {
  const safePrefix = toStr(prefix);
  const safeLabel = toStr(label);
  const safeSuffix = toStr(suffix);
  if (!safePrefix || !safeLabel) return "";
  return `${safePrefix} ${safeLabel}${safeSuffix}`;
}

function pickFirstAvailableLabel(...values) {
  for (const value of values) {
    const text = toStr(value);
    if (text) return text;
  }
  return "";
}

function pickAxisExperienceLabels(...labelGroups) {
  const merged = [];
  labelGroups.forEach((group) => {
    firstUniqueLabels(group, 2).forEach((label) => {
      const text = toStr(label);
      if (text) merged.push(text);
    });
  });
  return firstUniqueLabels(merged, 2);
}

function scoreFromLinkType(linkType) {
  if (linkType === "direct") return 5;
  if (linkType === "adjacent") return 3;
  if (linkType === "industry_only") return 2;
  return 1;
}

function bandFromScore(score) {
  if (!Number.isFinite(score)) return null;
  return scoreToBand(score);
}

function buildAxis1ComparisonBlock_legacy(signals = {}) {
  const majorPriorLabel = toStr(signals.majorPriorLabel) || "mismatch";
  const majorWeightApplied = toStr(signals.majorWeightApplied) || "neutral";
  const projectBestLinkType = toStr(signals.projectBestLinkType) || "none";
  const internshipLinkType = toStr(signals.internshipLinkType) || "none";
  const targetJobLabel = toStr(signals.targetJobLabel);
  const targetIndustryLabel = toStr(signals.targetIndustryLabel);
  const majorDisplayLabel = toStr(signals.majorDisplayLabel);
  const projectLabels = firstUniqueLabels(signals.projectRoleExperienceLabels, 2);
  const internshipLabels = firstUniqueLabels(signals.internshipRoleExperienceLabels, 2);
  const projectLeadLabel = projectLabels[0] || "";
  const internshipLeadLabel = internshipLabels[0] || "";
  const majorCurrentValue =
    majorPriorLabel === "direct" ? "\uB192\uC74C"
    : majorPriorLabel === "adjacent" ? "\uBCF4\uD1B5"
    : majorPriorLabel === "weak" ? "\uC57D\uD568"
    : "\uB0AE\uC74C";
  const majorScore =
    majorPriorLabel === "direct" && majorWeightApplied === "strong_bonus" ? 4
    : majorPriorLabel === "direct" ? 3
    : majorPriorLabel === "adjacent" ? 3
    : majorPriorLabel === "weak" ? 2
    : 1;

  return {
    version: "newgrad-comparison-v2",
    axisKey: "axis1",
    title: "\uC804\uACF5\uACFC \uC9C1\uBB34 \uAE30\uC900\uC5D0\uC11C \uB9DE\uB294 \uACBD\uD5D8\uC778\uC9C0 \uD655\uC778",
    introText: "\uC804\uACF5, \uD504\uB85C\uC81D\uD2B8, \uC778\uD134 \uACBD\uD5D8\uC774 \uBAA9\uD45C \uC9C1\uBB34\uC640 \uC5BC\uB9C8\uB098 \uB9DE\uB2FF\uB294\uC9C0\uB97C \uBE44\uAD50\uD569\uB2C8\uB2E4.",
    rows: [
      makeComparisonRow({
        rowKey: "major_job_relevance",
        label: "\uC804\uACF5 \uC5F0\uAD00 \uC815\uB3C4",
        displayMode: "label_with_score",
        valueType: "enum",
        sourceSignals: ["majorPriorLabel", "majorWeightApplied"],
        currentValue: majorCurrentValue,
        score: majorScore,
        band: bandFromScore(majorScore),
        summaryText:
          majorPriorLabel === "direct"
            ? (majorDisplayLabel && targetJobLabel ? `${majorDisplayLabel} 전공은 ${targetJobLabel} 직무와 직접 맞닿는 기반으로 해석됩니다.` : "\uC804\uACF5 \uBC30\uACBD\uC774 \uC9C1\uBB34 \uC774\uD574\uC640 \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uC774\uC5B4\uC9D1\uB2C8\uB2E4.")
            : majorPriorLabel === "adjacent"
              ? (majorDisplayLabel && targetJobLabel ? `${majorDisplayLabel} 전공은 ${targetJobLabel} 직무와 일부 연결될 수 있는 기반으로 해석됩니다.` : "\uC804\uACF5\uC774 \uC9C1\uBB34 \uC774\uD574\uC758 \uCD9C\uBC1C\uC810\uC73C\uB85C\uB294 \uC5F0\uACB0\uB429\uB2C8\uB2E4.")
              : majorPriorLabel === "weak"
                ? (majorDisplayLabel && targetJobLabel ? `${majorDisplayLabel} 전공만으로는 ${targetJobLabel} 직무와의 직접 연결성이 아직 제한적입니다.` : "\uC804\uACF5 \uC5F0\uACB0\uC740 \uC57D\uD574 \uB2E4\uB978 \uACBD\uD5D8 \uADFC\uAC70\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.")
                : "\uC804\uACF5\uB9CC\uC73C\uB85C\uB294 \uC9C1\uBB34 \uC5F0\uACB0 \uADFC\uAC70\uAC00 \uCDA9\uBD84\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
        verdictText:
          majorPriorLabel === "direct" ? (targetJobLabel && majorDisplayLabel ? `${majorDisplayLabel} \uC804\uACF5\uC740 ${targetJobLabel}\uC640 \uC9C1\uC811 \uB9DE\uB2FF\uB294 \uD3B8\uC785\uB2C8\uB2E4.` : "\uC804\uACF5 \uBD84\uB958\uC0C1 \uC9C1\uBB34\uC640 \uC9C1\uC811 \uB9DE\uB2FF\uB294 \uD3B8\uC785\uB2C8\uB2E4.")
          : majorPriorLabel === "adjacent" ? (targetJobLabel && majorDisplayLabel ? `${majorDisplayLabel} \uC804\uACF5\uC740 ${targetJobLabel}\uC758 \uD575\uC2EC \uACFC\uC5C5\uACFC\uB294 \uC77C\uBD80 \uAC70\uB9AC\uAC00 \uC788\uC2B5\uB2C8\uB2E4.` : "\uC804\uACF5\uC740 \uC788\uC9C0\uB9CC \uC9C1\uBB34 \uD575\uC2EC \uACFC\uC5C5\uACFC\uB294 \uC77C\uBD80 \uAC70\uB9AC\uAC00 \uC788\uC2B5\uB2C8\uB2E4.")
          : majorPriorLabel === "weak" ? (targetJobLabel ? `${targetJobLabel} \uAE30\uC900\uC73C\uB85C \uBCF4\uBA74 \uC804\uACF5 \uC790\uCCB4\uC758 \uC5F0\uACB0\uC131\uC740 \uC57D\uD55C \uD3B8\uC785\uB2C8\uB2E4.` : "\uC804\uACF5 \uC790\uCCB4\uC758 \uC9C1\uBB34 \uC5F0\uACB0\uC131\uC740 \uC57D\uD55C \uD3B8\uC785\uB2C8\uB2E4.")
          : "\uC804\uACF5 \uBD84\uB958\uB9CC\uC73C\uB85C\uB294 \uC9C1\uBB34 \uD574\uC11D \uADFC\uAC70\uAC00 \uB0AE\uAC8C \uC77D\uD799\uB2C8\uB2E4.",
        evidenceText:
          majorPriorLabel === "direct"
            ? (targetJobLabel && majorDisplayLabel ? `${majorDisplayLabel} \uC804\uACF5 \uBD84\uB958\uC640 \uD559\uC2B5 \uAE30\uBC18\uC740 ${targetJobLabel}\uC758 \uD575\uC2EC \uACFC\uC5C5\uC744 \uC774\uD574\uD558\uB294 \uCD9C\uBC1C\uC810\uC73C\uB85C \uC4F0\uC77C \uC218 \uC788\uC2B5\uB2C8\uB2E4.` : "\uC804\uACF5 \uBD84\uB958\uC640 \uD559\uC2B5 \uAE30\uBC18\uC774 \uBAA9\uD45C \uC9C1\uBB34\uC758 \uD575\uC2EC \uACFC\uC5C5\uC744 \uC774\uD574\uD558\uB294 \uCD9C\uBC1C\uC810\uC73C\uB85C \uC4F0\uC77C \uC218 \uC788\uC2B5\uB2C8\uB2E4.")
            : majorPriorLabel === "adjacent"
              ? (targetJobLabel && majorDisplayLabel ? `${majorDisplayLabel} \uC804\uACF5 \uB0B4\uC6A9\uC740 \uC77C\uBD80 \uACB9\uCE58\uC9C0\uB9CC ${targetJobLabel}\uC5D0\uC11C \uBC14\uB85C \uC4F0\uB294 \uACFC\uC5C5 \uC5B8\uC5B4\uB85C \uBC88\uC5ED\uD560 \uC815\uB3C4\uB85C\uB294 \uC548\uC815\uC801\uC774\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.` : "\uC804\uACF5 \uB0B4\uC6A9\uC740 \uC77C\uBD80 \uACB9\uCE58\uC9C0\uB9CC \uBAA9\uD45C \uC9C1\uBB34\uC5D0\uC11C \uBC14\uB85C \uC4F0\uB294 \uACFC\uC5C5 \uC5B8\uC5B4\uB85C \uBC88\uC5ED\uD560 \uC815\uB3C4\uB85C\uB294 \uC548\uC815\uC801\uC774\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.")
              : (targetJobLabel && majorDisplayLabel ? `${majorDisplayLabel} \uC804\uACF5 \uBD84\uB958\uC0C1 ${targetJobLabel}\uC758 \uD575\uC2EC \uACFC\uC5C5\uACFC \uBC14\uB85C \uC5F0\uACB0\uB418\uB294 \uC601\uC5ED\uC740 \uC81C\uD55C\uC801\uC785\uB2C8\uB2E4.` : "\uD604\uC7AC \uC804\uACF5 \uBD84\uB958\uC5D0\uC11C\uB294 \uBAA9\uD45C \uC9C1\uBB34\uC758 \uD575\uC2EC \uACFC\uC5C5\uC744 \uC9C1\uC811 \uC124\uBA85\uD560 \uB9CC\uD55C \uAE30\uBC18\uC774 \uD06C\uAC8C \uB4DC\uB7EC\uB098\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."),
        limitText:
          majorPriorLabel === "direct"
            ? (targetJobLabel ? `\uC804\uACF5 \uC801\uD569\uC131\uB9CC\uC73C\uB85C ${targetJobLabel} \uC0C1\uC704 \uD310\uC815\uC73C\uB85C \uC62C\uB77C\uAC00\uAE30\uBCF4\uB2E4, \uC2E4\uC81C \uC5ED\uD560 \uB2E8\uC704 \uACBD\uD5D8\uC774 \uD568\uAED8 \uBCF4\uAC15\uB418\uC5B4\uC57C \uD569\uB2C8\uB2E4.` : "\uC804\uACF5 \uC801\uD569\uC131\uB9CC\uC73C\uB85C \uC0C1\uC704 \uD310\uC815\uC73C\uB85C \uC62C\uB77C\uAC00\uAE30\uBCF4\uB2E4, \uC2E4\uC81C \uC5ED\uD560 \uB2E8\uC704 \uACBD\uD5D8\uC774 \uD568\uAED8 \uBCF4\uAC15\uB418\uC5B4\uC57C \uD569\uB2C8\uB2E4.")
            : (targetJobLabel ? `${targetJobLabel} \uAE30\uC900\uC73C\uB85C \uC124\uBA85 \uAC00\uB2A5\uD55C \uC5ED\uD560 \uB2E8\uC704 \uD504\uB85C\uC81D\uD2B8 \uB610\uB294 \uC778\uD134 \uADFC\uAC70\uAC00 \uB354 \uD544\uC694\uD569\uB2C8\uB2E4.` : "\uC804\uACF5 \uC5F0\uACB0\uC774 \uC57D\uD560 \uC218\uB85D \uC9C1\uBB34 \uACFC\uC5C5 \uAE30\uC900\uC73C\uB85C \uC124\uBA85\uAC00\uB2A5\uD55C \uD504\uB85C\uC81D\uD2B8 \uB610\uB294 \uC778\uD134 \uADFC\uAC70\uAC00 \uB354 \uD544\uC694\uD569\uB2C8\uB2E4."),
        confidence:
          majorPriorLabel === "direct" ? "high"
          : majorPriorLabel === "adjacent" ? "medium"
          : "low",
      }),
      makeComparisonRow({
        rowKey: "project_job_relevance",
        label: "\uD504\uB85C\uC81D\uD2B8 \uC5F0\uACB0 \uC815\uB3C4",
        displayMode: "label_with_score",
        valueType: "enum",
        sourceSignals: ["projectBestLinkType", "projectRoleExperienceLabels"],
        currentValue:
          projectBestLinkType === "direct" ? "\uB192\uC74C"
          : projectBestLinkType === "adjacent" ? "\uBCF4\uD1B5"
          : "\uB0AE\uC74C",
        score: scoreFromLinkType(projectBestLinkType),
        band: bandFromScore(scoreFromLinkType(projectBestLinkType)),
        summaryText:
          projectLeadLabel
            ? projectBestLinkType === "direct"
              ? `${projectLeadLabel} 프로젝트 경험이 ${targetJobLabel || "지원 직무"}와 직접 이어집니다.`
              : projectBestLinkType === "adjacent"
                ? `${projectLeadLabel} 프로젝트 경험이 목표 직무와 일부 연결되는 근거로 보입니다.`
                : `${projectLeadLabel} 프로젝트 경험만으로는 직무 연결 근거가 제한적입니다.`
            : projectBestLinkType === "direct"
              ? "\uD504\uB85C\uC81D\uD2B8 \uACBD\uD5D8\uC774 \uC9C0\uC6D0 \uC9C1\uBB34\uC640 \uC9C1\uC811 \uC774\uC5B4\uC9D1\uB2C8\uB2E4."
            : projectBestLinkType === "adjacent"
              ? "\uD504\uB85C\uC81D\uD2B8 \uACBD\uD5D8\uC774 \uC720\uC0AC \uC5ED\uD560\uAE4C\uC9C0\uB294 \uC5F0\uACB0\uB429\uB2C8\uB2E4."
              : "\uD504\uB85C\uC81D\uD2B8\uC5D0\uC11C \uC77D\uD788\uB294 \uC9C1\uBB34 \uC5F0\uACB0 \uADFC\uAC70\uB294 \uC81C\uD55C\uC801\uC785\uB2C8\uB2E4.",
        verdictText:
          projectBestLinkType === "direct" ? (targetJobLabel ? `\uD504\uB85C\uC81D\uD2B8 \uC5ED\uD560\uC774 ${targetJobLabel} \uACFC\uC5C5\uACFC \uBE44\uAD50\uC801 \uC9C1\uC811 \uB9DE\uB2FF\uB294 \uD3B8\uC785\uB2C8\uB2E4.` : "\uD504\uB85C\uC81D\uD2B8 \uC5ED\uD560\uC774 \uC9C1\uBB34 \uACFC\uC5C5\uACFC \uBE44\uAD50\uC801 \uC9C1\uC811 \uB9DE\uB2FF\uB294 \uD3B8\uC785\uB2C8\uB2E4.")
          : projectBestLinkType === "adjacent" ? (targetJobLabel ? `\uD504\uB85C\uC81D\uD2B8 \uACBD\uD5D8\uC740 \uC788\uC9C0\uB9CC ${targetJobLabel} \uACFC\uC5C5 \uC5F0\uACB0\uC740 \uC77C\uBD80\uC5D0 \uADF8\uCE69\uB2C8\uB2E4.` : "\uD504\uB85C\uC81D\uD2B8 \uACBD\uD5D8\uC740 \uC788\uC9C0\uB9CC \uC9C1\uBB34 \uACFC\uC5C5 \uC5F0\uACB0\uC740 \uC77C\uBD80\uC5D0 \uADF8\uCE69\uB2C8\uB2E4.")
          : (targetJobLabel ? `\uD504\uB85C\uC81D\uD2B8\uB85C\uB294 ${targetJobLabel} \uD575\uC2EC \uACFC\uC5C5 \uC5F0\uACB0\uC774 \uB0AE\uAC8C \uC77D\uD799\uB2C8\uB2E4.` : "\uD504\uB85C\uC81D\uD2B8\uB85C\uB294 \uC9C1\uBB34 \uD575\uC2EC \uACFC\uC5C5 \uC5F0\uACB0\uC774 \uB0AE\uAC8C \uC77D\uD799\uB2C8\uB2E4."),
        evidenceText:
          projectLeadLabel
            ? projectBestLinkType === "direct"
              ? `${projectLeadLabel} 프로젝트에서 맡은 역할과 산출물이 ${targetJobLabel || "목표 직무"}의 주요 과업과 맞닿습니다.`
              : projectBestLinkType === "adjacent"
                ? `${projectLeadLabel} 경험에서 보이는 ${targetJobLabel || "직무"} 관련 과업은 일부 연결되지만 세부 내용이 더 필요합니다.`
                : `${projectLeadLabel} 경험에서 보이는 ${targetJobLabel || "직무"} 관련 과업과의 직접 연결성이 아직 부족합니다.`
            : "\uD504\uB85C\uC81D\uD2B8 \uC5ED\uD560\uACFC \uC0B0\uCD9C\uBB3C\uC744 \uC9C1\uBB34 \uACFC\uC5C5 \uAE30\uC900\uC73C\uB85C \uBCF4\uC218\uC801\uC73C\uB85C \uBE44\uAD50\uD55C \uACB0\uACFC\uC785\uB2C8\uB2E4.",
        limitText:
          projectBestLinkType === "direct"
            ? "\uD504\uB85C\uC81D\uD2B8 \uBA85\uCE6D\uBCF4\uB2E4 \uBB34\uC5C7\uC744 \uB9E1\uC544 \uB05D\uB0C8\uB294\uC9C0\uB97C \uB354 \uAD6C\uCCB4\uD654\uD574\uC57C \uC0C1\uC704 \uD310\uC815\uC73C\uB85C \uC548\uC815\uD569\uB2C8\uB2E4."
            : (targetJobLabel ? `${targetJobLabel} \uAE30\uC900\uC73C\uB85C \uC124\uBA85 \uAC00\uB2A5\uD55C \uC5ED\uD560 \uB2E8\uC704 \uADFC\uAC70\uAC00 \uB354 \uD544\uC694\uD569\uB2C8\uB2E4.` : "\uD504\uB85C\uC81D\uD2B8 \uCC38\uC5EC \uACBD\uD5D8\uC744 \uB118\uC5B4 \uC9C1\uBB34 \uACFC\uC5C5 \uAE30\uC900\uC73C\uB85C \uC124\uBA85 \uAC00\uB2A5\uD55C \uC5ED\uD560 \uB2E8\uC704 \uADFC\uAC70\uAC00 \uB354 \uD544\uC694\uD569\uB2C8\uB2E4."),
        confidence:
          projectBestLinkType === "direct" ? "high"
          : projectBestLinkType === "adjacent" ? "medium"
          : "low",
      }),
      makeComparisonRow({
        rowKey: "internship_job_relevance",
        label: "\uC778\uD134 \uC5F0\uACB0 \uC815\uB3C4",
        displayMode: "label_with_score",
        valueType: "enum",
        sourceSignals: ["internshipLinkType", "internshipRoleExperienceLabels"],
        currentValue:
          internshipLinkType === "direct" ? "\uB192\uC74C"
          : internshipLinkType === "industry_only" ? "\uBCF4\uD1B5"
          : "\uB0AE\uC74C",
        score: scoreFromLinkType(internshipLinkType),
        band: bandFromScore(scoreFromLinkType(internshipLinkType)),
        summaryText:
          internshipLeadLabel
            ? internshipLinkType === "direct"
              ? `${internshipLeadLabel} 인턴 경험이 목표 직무와 직접 맞닿는 근거로 보입니다.`
              : internshipLinkType === "industry_only"
                ? `${internshipLeadLabel} 인턴 경험이 산업 맥락은 보여주지만 직무 연결은 제한적입니다.`
                : `${internshipLeadLabel} 인턴 경험만으로는 직무 연결 근거를 확인하기 어렵습니다.`
            : internshipLinkType === "direct"
              ? "\uC778\uD134 \uACBD\uD5D8\uC774 \uC9C0\uC6D0 \uC9C1\uBB34\uC640 \uC9C1\uC811 \uC5F0\uACB0\uB429\uB2C8\uB2E4."
            : internshipLinkType === "industry_only"
              ? "\uC778\uD134 \uACBD\uD5D8\uC774 \uC0B0\uC5C5 \uB9E5\uB77D\uC740 \uBCF4\uC5EC\uC8FC\uC9C0\uB9CC \uC9C1\uBB34 \uC5F0\uACB0\uC740 \uC81C\uD55C\uC801\uC785\uB2C8\uB2E4."
              : "\uC778\uD134 \uACBD\uD5D8\uC5D0\uC11C \uBCF4\uC774\uB294 \uC9C1\uBB34 \uC5F0\uACB0 \uADFC\uAC70\uB294 \uC57D\uD569\uB2C8\uB2E4.",
        verdictText:
          internshipLinkType === "direct" ? (targetJobLabel ? `\uC778\uD134 \uC2E4\uBB34 \uACBD\uD5D8\uC774 ${targetJobLabel} \uACFC\uC5C5\uACFC \uC9C1\uC811 \uB9DE\uB2FF\uB294 \uD3B8\uC785\uB2C8\uB2E4.` : "\uC778\uD134 \uC2E4\uBB34 \uACBD\uD5D8\uC774 \uC9C1\uBB34 \uACFC\uC5C5\uACFC \uC9C1\uC811 \uB9DE\uB2FF\uB294 \uD3B8\uC785\uB2C8\uB2E4.")
          : internshipLinkType === "industry_only" ? (targetJobLabel ? `\uC778\uD134\uC740 \uC0B0\uC5C5 \uB9E5\uB77D\uC740 \uBCF4\uC774\uC9C0\uB9CC ${targetJobLabel} \uACFC\uC5C5 \uC5F0\uACB0\uC740 \uC81C\uD55C\uC801\uC785\uB2C8\uB2E4.` : "\uC778\uD134\uC740 \uC0B0\uC5C5 \uB9E5\uB77D\uC740 \uBCF4\uC774\uC9C0\uB9CC \uC9C1\uBB34 \uACFC\uC5C5 \uC5F0\uACB0\uC740 \uC81C\uD55C\uC801\uC785\uB2C8\uB2E4.")
          : (targetJobLabel ? `\uC778\uD134 \uACBD\uD5D8\uC774 \uC788\uC5B4\uB3C4 ${targetJobLabel} \uC5F0\uACB0\uC740 \uC57D\uD55C \uD3B8\uC785\uB2C8\uB2E4.` : "\uC778\uD134 \uACBD\uD5D8\uC774 \uC788\uC5B4\uB3C4 \uC9C1\uBB34 \uC5F0\uACB0\uC740 \uC57D\uD55C \uD3B8\uC785\uB2C8\uB2E4."),
        evidenceText:
          internshipLeadLabel
            ? internshipLinkType === "direct"
              ? `${internshipLeadLabel} 인턴에서 맡은 역할이 ${targetJobLabel || "목표 직무"}의 관련 과업과 맞닿습니다.`
              : internshipLinkType === "industry_only"
                ? `${internshipLeadLabel} 경험에서 보이는 ${targetJobLabel || "직무"} 핵심 과업 범위의 근거가 더 필요합니다.`
                : `${internshipLeadLabel} 경험에서 보이는 ${targetJobLabel || "직무"} 핵심 과업 범위의 직접 근거가 부족합니다.`
            : "\uC778\uD134 \uC720\uBB34\uAC00 \uC544\uB2C8\uB77C \uC778\uD134 \uC548\uC5D0\uC11C \uB9E1\uC740 \uC2E4\uBB34 \uC5ED\uD560\uC744 \uAE30\uC900\uC73C\uB85C \uBE44\uAD50\uD55C \uACB0\uACFC\uC785\uB2C8\uB2E4.",
        limitText:
          internshipLinkType === "direct"
            ? "\uC778\uD134 \uACBD\uD5D8\uC744 \uC0C1\uC704 \uD310\uC815\uC73C\uB85C \uB04C\uC5B4\uC62C\uB9AC\uB824\uBA74 \uB2F4\uB2F9 \uACFC\uC5C5\uACFC \uACB0\uACFC\uBB3C \uCC45\uC784\uC744 \uB354 \uAD6C\uCCB4\uD654\uD574\uC57C \uD569\uB2C8\uB2E4."
            : (targetJobLabel || targetIndustryLabel ? `${targetJobLabel || "\uC9C1\uBB34"} \uAE30\uC900\uC73C\uB85C\uB294 ${targetIndustryLabel ? `${targetIndustryLabel} \uB9E5\uB77D\uC744 \uB118\uC5B4 ` : ""}\uC124\uBA85\uB418\uB294 \uC5ED\uD560 \uB2E8\uC704 \uADFC\uAC70\uAC00 \uB354 \uD544\uC694\uD569\uB2C8\uB2E4.` : "\uC778\uD134 \uCCB4\uD5D8 \uC790\uCCB4\uBCF4\uB2E4 \uC9C1\uBB34 \uACFC\uC5C5 \uAE30\uC900\uC73C\uB85C \uC124\uBA85\uB418\uB294 \uC5ED\uD560 \uB2E8\uC704 \uADFC\uAC70\uAC00 \uB354 \uD544\uC694\uD569\uB2C8\uB2E4."),
        confidence:
          internshipLinkType === "direct" ? "high"
          : internshipLinkType === "industry_only" ? "medium"
          : "low",
      }),
    ],
    cautionText: "\uC804\uACF5 \uC5F0\uACB0\uC774 \uC57D\uD558\uBA74 \uD504\uB85C\uC81D\uD2B8\uC640 \uC778\uD134\uC5D0\uC11C \uBB34\uC5C7\uC744 \uC2E4\uC81C\uB85C \uD588\uB294\uC9C0 \uC5ED\uD560 \uB2E8\uC704\uB85C \uBCF4\uC644\uD558\uB294 \uAC8C \uD575\uC2EC\uC785\uB2C8\uB2E4.",
  };
}

function buildAxis2ComparisonBlock_legacy(signals = {}) {
  const certDirectCount = Number(signals.certDirectCount || 0);
  const projectIndustrySupportCount = Number(signals.projectIndustrySupportCount || 0);
  const strongContextCount = Number(signals.strongContextCount || 0);
  const supportContextCount = Number(signals.supportContextCount || 0);
  const targetIndustryLabel = toStr(signals.targetIndustryLabel);
  const majorDisplayLabel = toStr(signals.majorDisplayLabel);
  const projectTypeLabel = pickRepresentativeProjectTypeLabel(signals.projectTypeExperienceLabels);
  const internshipTypeLabel = pickRepresentativeInternshipTypeLabel(signals.internshipTypeExperienceLabels);
  const stakeholderLabel = pickRepresentativeStakeholderLabel(signals.stakeholderExperienceLabels);
  const contextLabel = internshipTypeLabel || projectTypeLabel;
  const repeatCount = Math.max(strongContextCount, supportContextCount, projectIndustrySupportCount);

  return {
    version: "newgrad-comparison-v2",
    axisKey: "axis2",
    title: "산업 맥락과 관심 근거가 얼마나 드러나는지 확인",
    introText: "전공, 자격, 프로젝트, 인턴 맥락이 목표 산업 이해 근거로 얼마나 쓰일 수 있는지 보수적으로 본 결과입니다.",
    rows: [
      makeComparisonRow({
        rowKey: "major_cert_industry_relevance",
        label: "관련성",
        displayMode: "label_only",
        valueType: "derived",
        sourceSignals: ["majorAligned", "certificationsAligned", "certDirectCount"],
        currentValue: signals.majorAligned || signals.certificationsAligned ? "확인됨" : "제한적",
        summaryText:
          signals.majorAligned && signals.certificationsAligned
            ? (majorDisplayLabel && targetIndustryLabel ? `${majorDisplayLabel} 전공과 자격 근거가 함께 있어 ${targetIndustryLabel} 관련성이 비교적 또렷합니다.` : "전공과 자격 근거가 함께 있어 산업 관련성이 비교적 또렷합니다.")
            : signals.majorAligned
              ? (majorDisplayLabel && targetIndustryLabel ? `${majorDisplayLabel} 전공 배경이 ${targetIndustryLabel} 이해의 기본 근거로 읽힙니다.` : "전공 배경이 산업 관련성의 기본 근거로 읽힙니다.")
              : signals.certificationsAligned
                ? `자격 근거 ${certDirectCount > 0 ? `${certDirectCount}건 ` : ""}이 산업 관련성을 보완합니다.`.trim()
                : "전공이나 자격에서 드러나는 산업 관련성은 제한적입니다.",
        verdictText:
          signals.majorAligned && signals.certificationsAligned ? (targetIndustryLabel ? `${targetIndustryLabel} 산업 이해의 기본 기반이 비교적 또렷합니다.` : "산업 이해의 기본 기반이 비교적 또렷합니다.")
          : signals.majorAligned || signals.certificationsAligned ? (targetIndustryLabel ? `${targetIndustryLabel} 관련 기반은 일부 보이는 편입니다.` : "산업 관련 기반은 일부 보이는 편입니다.")
          : (targetIndustryLabel ? `${targetIndustryLabel} 산업 맥락을 바로 받쳐주는 기반은 아직 제한적입니다.` : "산업 관련 기반은 아직 제한적입니다."),
        evidenceText:
          signals.majorAligned && signals.certificationsAligned
            ? (targetIndustryLabel && majorDisplayLabel ? `${majorDisplayLabel} 전공과 자격 근거가 함께 있어 ${targetIndustryLabel} 관련성을 받쳐줍니다.` : "전공과 자격 근거가 함께 있어 산업 관련성을 받쳐줍니다.")
            : signals.majorAligned
              ? (targetIndustryLabel && majorDisplayLabel ? `${majorDisplayLabel} 전공 배경이 ${targetIndustryLabel} 업계에서 자주 다루는 환경이나 문제를 읽는 기본 기반으로 쓰입니다.` : "전공 배경이 산업 관련성의 기본 근거로 읽힙니다.")
              : signals.certificationsAligned
                ? (targetIndustryLabel ? `자격 근거${certDirectCount > 0 ? ` ${certDirectCount}건` : ""}이 ${targetIndustryLabel} 관련성을 보완합니다.` : `자격 근거${certDirectCount > 0 ? ` ${certDirectCount}건` : ""}이 산업 관련성을 보완합니다.`)
                : (targetIndustryLabel ? `${majorDisplayLabel ? `${majorDisplayLabel} 전공이나 ` : ""}자격에서 ${targetIndustryLabel} 산업 관련성을 바로 설명할 만한 근거는 아직 크지 않습니다.` : "전공이나 자격에서 드러나는 산업 관련성은 제한적입니다."),
        limitText:
          signals.majorAligned && signals.certificationsAligned
            ? (targetIndustryLabel ? `${targetIndustryLabel} 산업 상위 판정으로 올라가려면 전공/자격 기반 위에 실제 맥락 경험이 더 붙어야 합니다.` : "전공/자격 기반 위에 실제 맥락 경험이 더 붙어야 합니다.")
            : (targetIndustryLabel ? `${targetIndustryLabel}에 대한 반복 노출이나 실무 문맥 경험이 더 있어야 상위 판정으로 올라갈 수 있습니다.` : "산업에 대한 반복 노출이나 실무 문맥 경험이 더 있어야 상위 판정으로 올라갈 수 있습니다."),
        confidence:
          signals.majorAligned && signals.certificationsAligned ? "high"
          : signals.majorAligned || signals.certificationsAligned ? "medium"
          : "low",
      }),
      makeComparisonRow({
        rowKey: "context_industry_grounding",
        label: "산업 맥락 근거",
        displayMode: "label_only",
        valueType: "derived",
        sourceSignals: ["contextAligned", "internContextStrength", "projectIndustrySupportCount", "weakProjectSignal"],
        currentValue: signals.contextAligned ? "충분" : signals.weakProjectSignal ? "보조적" : "약함",
        summaryText:
          signals.contextAligned
            ? signals.internContextStrength === "strong"
              ? (contextLabel ? `${contextLabel} 경험이 실제 산업 환경 이해로 이어지는 편입니다.` : "인턴 맥락이 실제 산업 환경 이해로 이어지는 편입니다.")
              : (contextLabel ? `${contextLabel} 경험이 산업 문맥을 설명하는 근거로는 쓰이지만 강도는 보통 수준입니다.` : "산업 맥락을 설명할 근거는 있으나 강도는 보통 수준입니다.")
            : projectTypeLabel
              ? `${projectTypeLabel} 경험이 산업 이해를 보조합니다.`
              : projectIndustrySupportCount > 0
                ? `프로젝트 맥락 ${projectIndustrySupportCount}건이 산업 이해를 보조합니다.`
                : "산업 맥락을 직접 설명해 줄 경험 근거는 아직 약합니다.",
        verdictText:
          signals.contextAligned ? (targetIndustryLabel ? `${targetIndustryLabel} 산업 맥락을 직접 접한 경험이 드러나는 편입니다.` : "산업 맥락을 직접 접한 경험이 드러나는 편입니다.")
          : projectIndustrySupportCount > 0 || signals.weakProjectSignal ? (targetIndustryLabel ? `${targetIndustryLabel} 산업 맥락은 보조 수준으로 읽힙니다.` : "산업 맥락은 보조 수준으로 읽힙니다.")
          : (targetIndustryLabel ? `${targetIndustryLabel} 산업 맥락을 직접 설명해 줄 경험 근거는 아직 약합니다.` : "산업 맥락을 직접 설명해 줄 경험 근거는 아직 약합니다."),
        evidenceText:
          signals.contextAligned
            ? signals.internContextStrength === "strong"
              ? (targetIndustryLabel && contextLabel ? `${contextLabel} 경험이 ${targetIndustryLabel} 실무 문맥과 직접 맞닿아 있어 현업 환경 이해 근거로 읽힙니다.` : (targetIndustryLabel ? `${targetIndustryLabel} 맥락과 직접 맞닿는 인턴/계약 경험이 있어 현업 환경 이해 근거로 읽힙니다.` : "인턴/계약 맥락이 현업 환경 이해 근거로 읽힙니다."))
              : (targetIndustryLabel && contextLabel ? `${contextLabel} 경험이 ${targetIndustryLabel} 관련 문맥을 설명할 수는 있지만, 실무형 이해 근거로 읽히기에는 깊이가 제한적입니다.` : (targetIndustryLabel ? `${targetIndustryLabel} 관련 문맥을 설명할 근거는 있으나, 강도는 보통 수준입니다.` : "산업 문맥을 설명할 근거는 있으나, 강도는 보통 수준입니다."))
            : projectTypeLabel
              ? (targetIndustryLabel ? `${projectTypeLabel} 프로젝트 경험에서 ${targetIndustryLabel} 관련 문맥이 보이지만, 실무형 이해 근거로 읽히기에는 깊이가 제한적입니다.` : `${projectTypeLabel} 프로젝트 경험에서 산업 관련 문맥이 보이지만, 실무형 이해 근거로 읽히기에는 깊이가 제한적입니다.`)
              : (targetIndustryLabel ? `${targetIndustryLabel} 업계에서 자주 다루는 환경이나 문제를 경험했다고 보기에는 아직 단서가 부족합니다.` : "산업 문맥을 직접 설명해 줄 단서가 아직 부족합니다."),
        limitText:
          signals.contextAligned
            ? (targetIndustryLabel ? `${targetIndustryLabel}에서 설득력을 더 높이려면 단발 경험보다 반복 노출과 실무 문맥 설명이 더 붙어야 합니다.` : "반복 노출과 실무 문맥 설명이 더 붙어야 합니다.")
            : (targetIndustryLabel ? `${targetIndustryLabel}에 대한 반복 노출이나 실무 문맥 경험이 더 있어야 상위 판정으로 올라갈 수 있습니다.` : "산업에 대한 반복 노출이나 실무 문맥 경험이 더 있어야 상위 판정으로 올라갈 수 있습니다."),
        confidence:
          signals.contextAligned ? "high"
          : projectIndustrySupportCount > 0 || signals.weakProjectSignal ? "medium"
          : "low",
      }),
      makeComparisonRow({
        rowKey: "industry_exposure_repeatability",
        label: "반복성",
        displayMode: "label_only",
        valueType: "count",
        sourceSignals: ["strongContextCount", "supportContextCount", "projectIndustrySupportCount", "certEvidencePack.scoringSummary.alignedCount"],
        currentValue: strongContextCount >= 2 || supportContextCount >= 2 ? "반복 확인" : "단일 근거",
        summaryText:
          strongContextCount >= 2
            ? "강한 산업 맥락이 여러 경험에서 반복됩니다."
            : supportContextCount >= 2 || projectIndustrySupportCount >= 2
              ? (stakeholderLabel ? `${stakeholderLabel}와 맞물린 문맥까지 포함해 산업 관련 경험이 반복됩니다.` : "산업 관련 경험이 한 번으로 끝나지 않고 반복돼서 보입니다.")
              : "산업 관련성은 일부 근거에 기대고 있어 반복성은 크지 않습니다.",
        verdictText:
          strongContextCount >= 2 ? "산업 맥락 노출이 여러 경험에서 반복됩니다."
          : supportContextCount >= 2 || projectIndustrySupportCount >= 2 ? "반복 노출은 일부 확인됩니다."
          : "산업 노출은 단일 근거 수준으로 읽힙니다.",
        evidenceText:
          strongContextCount >= 2
            ? `강한 맥락 경험 ${strongContextCount}건에서 산업 문맥이 반복해 드러납니다.`
            : supportContextCount >= 2 || projectIndustrySupportCount >= 2
              ? `${buildLabelPair(contextLabel, stakeholderLabel) || "산업 관련 근거"}가 ${repeatCount}건 이상 반복되는 구조입니다.`
              : "현재는 일회성 근거에 기대고 있어 반복 노출 신호는 크지 않습니다.",
        limitText:
          strongContextCount >= 2
            ? "반복 노출이 있더라도 어떤 문제를 어떻게 이해했는지까지 함께 설명되면 더 강해집니다."
            : (targetIndustryLabel ? `${targetIndustryLabel} 기준으로는 기간/유형/문맥이 다르게 반복된 흔적이 더 필요합니다.` : "산업 노출은 넓이보다 기간/유형/문맥이 다르게 반복된 흔적이 더 필요합니다."),
        confidence:
          strongContextCount >= 2 ? "high"
          : supportContextCount >= 2 || projectIndustrySupportCount >= 2 ? "medium"
          : "low",
      }),
    ],
    cautionText: "산업 전환은 관심 표현보다 해당 업계 문맥을 실제로 접했는 경험 근거로 판단되는 편입니다.",
  };
}
function buildAxis3ComparisonBlock_legacy(signals = {}) {
  const outcomeLevel = toStr(signals.projectOutcomeLevel) || "none";
  const durationLevel = toStr(signals.experienceDurationLevel) || "none";
  const outcomeLabels = firstUniqueLabels(signals.outcomeExperienceLabels, 2);
  const durationLabels = firstUniqueLabels(signals.durationExperienceLabels, 2);
  const outcomeScore = outcomeLevel === "strong" ? 4 : outcomeLevel === "support" ? 3 : 2;
  const durationScore = durationLevel === "long" ? 4 : 2;

  return {
    version: "newgrad-comparison-v2",
    axisKey: "axis3",
    title: "\uC720\uC0AC \uACBD\uD5D8\uC774 \uC5BC\uB9C8\uB098 \uC2E4\uC81C \uC218\uD589 \uADFC\uAC70\uB85C \uC77D\uD788\uB294\uC9C0 \uD655\uC778",
    introText: "\uACB0\uACFC \uC218\uC900, \uC9C0\uC18D\uC131, \uC870\uD569 \uACBD\uD5D8 \uC5EC\uBD80\uB97C \uAE30\uC900\uC73C\uB85C \uC2E4\uBB34 \uD22C\uC785 \uAC00\uB2A5\uC131\uC744 \uBCF4\uC218\uC801\uC73C\uB85C \uD310\uB3C5\uD569\uB2C8\uB2E4.",
    rows: [
      makeComparisonRow({
        rowKey: "outcome_level",
        label: "\uACB0\uACFC \uC218\uC900",
        displayMode: "label_with_score",
        valueType: "band",
        sourceSignals: ["projectOutcomeLevel", "outcomeExperienceLabels"],
        currentValue: outcomeLevel === "strong" ? "\uB192\uC74C" : outcomeLevel === "support" ? "\uBCF4\uD1B5" : "\uB0AE\uC74C",
        score: outcomeScore,
        band: bandFromScore(outcomeScore),
        summaryText:
          outcomeLabels.length > 0
            ? outcomeLevel === "strong"
              ? `${joinLabels(outcomeLabels)} \uACBD\uD5D8\uC5D0\uC11C \uACB0\uACFC \uCC45\uC784\uC774 \uBE44\uAD50\uC801 \uC120\uBA85\uD569\uB2C8\uB2E4.`
              : outcomeLevel === "support"
                ? `${joinLabels(outcomeLabels)} \uACBD\uD5D8\uC774 \uACB0\uACFC \uC218\uC900\uC744 \uC5B4\uB290 \uC815\uB3C4 \uBCF4\uC5EC\uC90D\uB2C8\uB2E4.`
                : `${joinLabels(outcomeLabels)} \uACBD\uD5D8\uC740 \uC788\uC73C\uB098 \uACB0\uACFC \uC218\uC900 \uADFC\uAC70\uB294 \uC81C\uD55C\uC801\uC785\uB2C8\uB2E4.`
            : outcomeLevel === "strong"
              ? "\uACB0\uACFC\uB97C \uB9CC\uB4E0 \uACBD\uD5D8\uC774 \uBE44\uAD50\uC801 \uC120\uBA85\uD558\uAC8C \uC7A1\uD799\uB2C8\uB2E4."
              : outcomeLevel === "support"
                ? "\uACB0\uACFC \uC218\uC900\uC744 \uBCF4\uC870\uD558\uB294 \uACBD\uD5D8\uC774 \uC77C\uBD80 \uBCF4\uC785\uB2C8\uB2E4."
              : "\uACB0\uACFC \uC218\uC900\uC744 \uC124\uBA85\uD560 \uC9C1\uC811 \uADFC\uAC70\uB294 \uC57D\uD569\uB2C8\uB2E4.",
        verdictText:
          outcomeLevel === "strong" ? "결과나 산출물이 구체적으로 드러나 실행 깊이를 뒷받침합니다."
          : outcomeLevel === "support" ? "결과 근거는 있으나 더 구체적으로 보완되면 선명해집니다."
          : "결과가 충분히 드러나지 않아 실행 깊이 해석이 제한적입니다.",
        evidenceText:
          outcomeLabels.length > 0
            ? outcomeLevel === "strong"
              ? `${joinLabels(outcomeLabels)} 경험에서 높은 결과와 실행 범위가 명확하게 보입니다.`
              : outcomeLevel === "support"
                ? `${joinLabels(outcomeLabels)} 경험에서 결과 근거를 보완하면 실행 깊이로 이어질 수 있습니다.`
                : `${joinLabels(outcomeLabels)} 경험에서 보이는 결과를 높이 보기 어렵고 산출물이 더 구체적으로 드러나야 합니다.`
            : outcomeLevel === "strong"
              ? "여러 경험에서 결과와 실행력이 비교적 확인됩니다."
              : outcomeLevel === "support"
                ? "결과를 뒷받침하는 근거는 있으나 더 구체적인 산출물이 보강되면 좋습니다."
                : "맡은 일의 결과가 어떻게 드러났는지 확인되는 경험 근거가 부족합니다.",
        limitText:
          outcomeLevel === "strong"
            ? "상위 판정으로 이어지려면 결과의 양적·질적 실행 범위를 더 구체화해야 합니다."
            : "더 많은 경험에서 결과와 실행력을 확인할 수 있어야 상위 판정으로 올라갈 수 있습니다.",
        confidence: outcomeLevel === "strong" ? "high" : outcomeLevel === "support" ? "medium" : "low",
      }),
      makeComparisonRow({
        rowKey: "duration_continuity",
        label: "\uC9C0\uC18D\uC131",
        displayMode: "label_with_score",
        valueType: "band",
        sourceSignals: ["experienceDurationLevel", "durationExperienceLabels"],
        currentValue: durationLevel === "long" ? "\uC548\uC815\uC801" : "\uC9E7\uC74C",
        score: durationScore,
        band: bandFromScore(durationScore),
        summaryText:
          durationLabels.length > 0
            ? durationLevel === "long"
              ? `${joinLabels(durationLabels)} \uACBD\uD5D8\uC5D0\uC11C \uC77C\uC815 \uAE30\uAC04 \uC774\uC5B4\uC9C4 \uC218\uD589 \uD754\uC801\uC774 \uBCF4\uC785\uB2C8\uB2E4.`
              : `${joinLabels(durationLabels)} \uACBD\uD5D8\uC740 \uC788\uC73C\uB098 \uC9C0\uC18D\uC131 \uADFC\uAC70\uB294 \uC9E7\uAC8C \uC77D\uD799\uB2C8\uB2E4.`
            : durationLevel === "long"
              ? "\uACBD\uD5D8\uC774 \uC77C\uC815 \uAE30\uAC04 \uC774\uC5B4\uC838 \uC9C0\uC18D\uC131\uC744 \uBCF4\uC5EC\uC90D\uB2C8\uB2E4."
              : "\uC9C0\uC18D\uC801\uC73C\uB85C \uB9E1\uC544 \uBCF8 \uD754\uC801\uC740 \uC544\uC9C1 \uC81C\uD55C\uC801\uC785\uB2C8\uB2E4.",
        verdictText:
          durationLevel === "long" ? "일정 기간 지속적으로 수행한 실행 흔적이 확인됩니다."
          : "지속성 근거는 아직 제한적입니다.",
        evidenceText:
          durationLabels.length > 0
            ? durationLevel === "long"
              ? `${joinLabels(durationLabels)} 경험에서 일정 기간 이어진 수행 흔적이 보여 실행 지속성을 뒷받침합니다.`
              : `${joinLabels(durationLabels)} 경험은 있으나 지속 기간이 짧아 실행 지속성 근거는 제한적입니다.`
            : durationLevel === "long"
              ? "일정 기간 이어진 수행 흔적이 비교적 확인됩니다."
              : "경험이 어느 정도 이어졌는지 알 수 없어 지속성 판단이 어렵습니다.",
        limitText:
          durationLevel === "long"
            ? "기간 자체보다 그 기간 동안 맡은 역할의 실제 수행 내용이 더 구체화되면 상위 판정으로 이어집니다."
            : "짧은 경험에서 역할과 결과가 구체적이면 실행 근거로 활용할 수 있습니다.",
        confidence: durationLevel === "long" ? "medium" : "low",
      }),
      makeComparisonRow({
        rowKey: "combo_experience",
        label: "\uC870\uD569 \uACBD\uD5D8",
        displayMode: "label_only",
        valueType: "boolean",
        sourceSignals: ["comboEvidence", "comboGuarded", "evidenceStrength"],
        currentValue: signals.comboEvidence ? (signals.comboGuarded ? "\uC81C\uD55C\uC801 \uD655\uC778" : "\uD655\uC778\uB428") : "\uBBF8\uD655\uC778",
        summaryText:
          signals.comboEvidence
            ? signals.comboGuarded
              ? "\uD504\uB85C\uC81D\uD2B8\uC640 \uC778\uD134 \uC870\uD569\uC740 \uBCF4\uC774\uC9C0\uB9CC \uAE4A\uC774 \uD574\uC11D\uC740 \uBCF4\uC218\uC801\uC73C\uB85C \uC7A1\uB294 \uD3B8\uC774 \uC548\uC804\uD569\uB2C8\uB2E4."
              : "\uD504\uB85C\uC81D\uD2B8\uC640 \uC778\uD134\uC774 \uD568\uAED8 \uBCF4\uC5EC\uC11C \uC720\uC0AC \uACBD\uD5D8\uC744 \uC124\uBA85\uD558\uAE30 \uC218\uC6D4\uD569\uB2C8\uB2E4."
            : signals.evidenceStrength === "mixed"
              ? "\uC5EC\uB7EC \uACBD\uD5D8\uC774 \uC788\uC73C\uB098 \uC11C\uB85C \uC774\uC5B4\uC9C0\uB294 \uC870\uD569 \uADFC\uAC70\uB294 \uC544\uC9C1 \uC57D\uD569\uB2C8\uB2E4."
              : "\uC870\uD569 \uACBD\uD5D8\uBCF4\uB2E4\uB294 \uB2E8\uC77C \uACBD\uD5D8 \uC911\uC2EC\uC73C\uB85C \uC77D\uD788\uB294 \uCD95\uC785\uB2C8\uB2E4.",
        verdictText:
          signals.comboEvidence && !signals.comboGuarded ? "여러 경험의 조합이 명확하게 보여 수행 폭을 뒷받침합니다."
          : signals.comboEvidence ? "여러 경험이 보이지만 깊이 해석은 보수적으로 잡는 편입니다."
          : "여러 경험 근거는 아직 약합니다.",
        evidenceText:
          signals.comboEvidence
            ? signals.comboGuarded
              ? "프로젝트와 인턴 등 여러 경험에서 보이는 역할이 서로 이어지는 실행 흐름이 아직 확인되지 않습니다."
              : "프로젝트와 인턴에서 보이는 역할이 단일 경험보다 더 넓은 실행 범위를 뒷받침합니다."
            : signals.evidenceStrength === "mixed"
              ? "여러 경험은 있으나 따로따로 제시되어 조합 수행 경험으로 이어지지 않습니다."
              : "현재 입력된 경험만으로는 조합 근거로 해석할 여러 경험 근거가 부족합니다.",
        limitText:
          signals.comboEvidence && !signals.comboGuarded
            ? "여러 경험의 강점이 드러나려면 각 경험에서 맡은 역할 범위가 구체적으로 뒷받침되어야 합니다."
            : "경험이 있더라도 서로 보완하는 실행 흐름이 확인되지 않으면 조합 근거로 보기 어렵습니다.",
        confidence:
          signals.comboEvidence && !signals.comboGuarded ? "high"
          : signals.comboEvidence || signals.evidenceStrength === "mixed" ? "medium"
          : "low",
      }),
    ],
    cautionText: "\uC720\uC0AC \uACBD\uD5D8 \uC5EC\uBD80\uB294 \uC5ED\uD560 \uAE4A\uC774\uC640 \uC9C0\uC18D \uAE30\uAC04\uC744 \uD568\uAED8 \uBCF4\uC57C \uACFC\uC2E0\uC744 \uC904\uC77C \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
  };
}

function buildAxis4ComparisonBlock_legacy(signals = {}) {
  const stakeholderLabels = firstUniqueLabels(signals.stakeholderExperienceLabels, 2);
  const directCount = Number(signals._interactionDirectStakeholderCount || 0);
  const selfReportDirectApplied = signals.selfReportDirectApplied === true;

  return {
    version: "newgrad-comparison-v2",
    axisKey: "axis4",
    title: "\uACE0\uAC1D \uB610\uB294 \uC774\uD574\uAD00\uACC4\uC790 \uC18C\uD1B5 \uADFC\uAC70\uAC00 \uC5BC\uB9C8\uB098 \uBCF4\uC774\uB294\uC9C0 \uD655\uC778",
    introText: "\uC2E4\uC81C \uB300\uC751 \uB300\uC0C1, \uC9C1\uC811 \uC18C\uD1B5 \uACBD\uD5D8, \uC785\uB825 \uAE30\uBC18 \uBCF4\uC870 \uC2E0\uD638\uB97C \uB098\uB220 \uC77D\uC2B5\uB2C8\uB2E4.",
    rows: [
      makeComparisonRow({
        rowKey: "stakeholder_exposure_level",
        label: "\uC774\uD574\uAD00\uACC4\uC790 \uB178\uCD9C",
        displayMode: "label_only",
        valueType: "enum",
        sourceSignals: ["stakeholderExperienceLabels"],
        currentValue: stakeholderLabels.length > 0 ? "\uD655\uC778\uB428" : "\uC81C\uD55C\uC801",
        summaryText:
          stakeholderLabels.length > 0
            ? `${joinLabels(stakeholderLabels)} \uC811\uC810\uC774 \uBCF4\uC5EC\uC11C \uC18C\uD1B5 \uB9E5\uB77D\uC744 \uC77D\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4.`
            : "\uC9C1\uC811 \uB4DC\uB7EC\uB09C \uC774\uD574\uAD00\uACC4\uC790 \uC811\uC810\uC740 \uB9CE\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
        verdictText: stakeholderLabels.length > 0 ? "이해관계자 접점이 비교적 확인됩니다." : "이해관계자 접점 근거는 제한적입니다.",
        evidenceText:
          stakeholderLabels.length > 0
            ? `${joinLabels(stakeholderLabels)} 접점에서 상대방을 직접 설득하거나 조율한 경험을 확인할 수 있습니다.`
            : "고객, 사용자, 동료 등 이해관계자와 직접 맞닿은 접점 경험이 확인되지 않습니다.",
        limitText:
          stakeholderLabels.length > 0
            ? "상대방을 직접 설득하거나 조율한 구체적인 장면이 더 드러나면 소통 적합성이 더 선명해집니다."
            : "이해관계자와 직접 맞닿은 소통 경험의 근거가 더 필요합니다.",
        confidence: stakeholderLabels.length > 0 ? "medium" : "low",
      }),
      makeComparisonRow({
        rowKey: "direct_interaction_experience",
        label: "\uC9C1\uC811 \uC18C\uD1B5 \uACBD\uD5D8",
        displayMode: "label_only",
        valueType: "derived",
        sourceSignals: ["interactionSupportTone", "_interactionDirectStakeholderCount", "selfReportDirectApplied"],
        currentValue:
          signals.interactionSupportTone === "strong" ? "\uC9C1\uC811 \uD655\uC778"
          : stakeholderLabels.length > 0 ? "\uBCF4\uC870 \uD655\uC778"
          : "\uBBF8\uC57D",
        summaryText:
          signals.interactionSupportTone === "strong"
            ? `\uC9C1\uC811 \uC18C\uD1B5\uC73C\uB85C \uC77D\uD788\uB294 \uACBD\uD5D8\uC774 ${directCount > 0 ? `${directCount}? ` : ""}\uD655\uC778\uB429\uB2C8\uB2E4.`.trim()
            : stakeholderLabels.length > 0
              ? `${selfReportDirectApplied ? "???? ?? ??? ??? " : ""}?? ??? ???? ???? ??? ???? ????.`.trim()
              : "\uC9C1\uC811 \uC18C\uD1B5 \uACBD\uD5D8\uC744 \uC124\uBA85\uD560 \uADFC\uAC70\uB294 \uC544\uC9C1 \uC57D\uD569\uB2C8\uB2E4.",
        verdictText:
          signals.interactionSupportTone === "strong" ? "?? ?? ??? ??? ???? ?????."
          : stakeholderLabels.length > 0 ? "????? ?? ??? ???? ?? ?? ??? ?? ?????."
          : "?? ?? ??? ??? ??? ?? ??????.",
        evidenceText:
          signals.interactionSupportTone === "strong"
            ? `?? ???? ??? ??${directCount > 0 ? ` ${directCount}?` : ""}? ?????.`.trim()
            : stakeholderLabels.length > 0
              ? `${selfReportDirectApplied ? "???? ?? ??? ?? " : ""}????? ?? ??? ???? ?? ??? ?? ?? ??? ?? ??????.`
              : "?? ?? ??, ?? ??, ?? ??? ???? ??? ?? ?????.",
        limitText:
          signals.interactionSupportTone === "strong"
            ? "?? ?? ??? ??? ?? ???? ?? ???? ? ????? ??? ? ????."
            : "??? ??? ?? ???? ??? ????? ???? ?? ?? ??? ? ??????.",
        confidence:
          signals.interactionSupportTone === "strong" ? "high"
          : stakeholderLabels.length > 0 ? "medium"
          : "low",
      }),
    ],
    cautionText: "\uC18C\uD1B5 \uC801\uD569\uC131\uC740 \uB2E8\uC21C \uC790\uAE30\uC18C\uAC1C \uD45C\uD604\uBCF4\uB2E4 \uC2E4\uC81C \uB300\uC751 \uB300\uC0C1\uACFC \uC0C1\uD669 \uADFC\uAC70\uAC00 \uC788\uC5B4\uC57C \uAC15\uD574\uC9D1\uB2C8\uB2E4.",
  };
}

function buildAxis5ComparisonBlock_legacy(signals = {}) {
  const matchedStrengthLabels = firstUniqueLabels(signals.matchedStrengthLabels, 2);
  const matchedWorkStyleLabels = firstUniqueLabels(signals.matchedWorkStyleLabels, 2);

  return {
    version: "newgrad-comparison-v2",
    axisKey: "axis5",
    title: "\uAC15\uC810\uACFC \uC77C\uD558\uB294 \uBC29\uC2DD\uC774 \uC9C1\uBB34 \uC131\uACA9\uACFC \uB9DE\uB2FF\uB294\uC9C0 \uCC38\uACE0 \uC218\uC900\uC73C\uB85C \uD655\uC778",
    introText: "\uAC15\uC810\uACFC \uC5C5\uBB34 \uC2A4\uD0C0\uC77C\uC740 \uC790\uAE30\uBCF4\uACE0 \uAE30\uBC18\uC774\uBBC0\uB85C, \uC218\uCE58 \uACFC\uC2E0 \uC5C6\uC774 \uBCF4\uC870 \uD310\uB3C5\uC73C\uB85C\uB9CC \uC0AC\uC6A9\uD569\uB2C8\uB2E4.",
    cautionText: "\uAC15\uC810\uACFC \uC77C\uD558\uB294 \uBC29\uC2DD\uC740 \uC790\uAE30\uBCF4\uACE0 \uAE30\uBC18\uC774\uBBC0\uB85C \uCC38\uACE0 \uC2E0\uD638\uB85C\uB9CC \uBCF4\uB294 \uD3B8\uC774 \uC548\uC804\uD569\uB2C8\uB2E4.",
    rows: [
      makeComparisonRow({
        rowKey: "strength_role_relevance",
        label: "\uAC15\uC810 \uAD00\uB828\uC131",
        displayMode: "label_only",
        valueType: "count",
        sourceSignals: ["matchedStrengthLabels", "strengthsCount"],
        currentValue: matchedStrengthLabels.length > 0 ? "\uC5F0\uACB0 \uD3EC\uC778\uD2B8 \uC788\uC74C" : "\uC81C\uD55C\uC801",
        score: null,
        summaryText:
          matchedStrengthLabels.length > 0
            ? `${joinLabels(matchedStrengthLabels)} \uAC15\uC810\uC774 \uC9C1\uBB34 \uD574\uC11D\uC5D0 \uCC38\uACE0 \uC2E0\uD638\uB85C \uC4F0\uC785\uB2C8\uB2E4.`
            : "\uC785\uB825\uB41C \uAC15\uC810\uB9CC\uC73C\uB85C\uB294 \uC5ED\uD560 \uAD00\uB828\uC131\uC744 \uAC15\uD558\uAC8C \uB9D0\uD558\uAE30 \uC5B4\uB835\uC2B5\uB2C8\uB2E4.",
        verdictText: matchedStrengthLabels.length > 0 ? "선택한 강점이 직무 해석에 참고 근거로 쓰입니다." : "강점만으로는 직무 성향을 강하게 말하기 어렵습니다.",
        evidenceText:
          matchedStrengthLabels.length > 0
            ? `${joinLabels(matchedStrengthLabels)} 강점이 직무에서 활용 가능한 방향으로 보이지만 실제 경험에서 어떻게 드러났는지 더 필요합니다.`
            : "입력된 강점 선택만으로는 실제 직무에서 어떻게 발휘되는지 확인이 어렵습니다.",
        limitText: "선택한 강점이 실제 역할 단위 경험에서 어떻게 드러났는지 함께 제시되면 해석이 더 분명해집니다.",
        confidence: matchedStrengthLabels.length > 0 ? "medium" : "low",
      }),
      makeComparisonRow({
        rowKey: "workstyle_role_relevance",
        label: "\uC77C\uD558\uB294 \uBC29\uC2DD \uAD00\uB828\uC131",
        displayMode: "label_only",
        valueType: "boolean",
        sourceSignals: ["matchedWorkStyleLabels", "workStyleNotesPresent"],
        currentValue: matchedWorkStyleLabels.length > 0 ? "\uCC38\uACE0 \uAC00\uB2A5" : "\uBCF4\uC870\uC801",
        score: null,
        summaryText:
          matchedWorkStyleLabels.length > 0
            ? `${joinLabels(matchedWorkStyleLabels)} \uC131\uD5A5\uC774 \uC5ED\uD560 \uC774\uD574\uB97C \uBCF4\uC870\uD569\uB2C8\uB2E4.`
            : signals.workStyleNotesPresent
              ? "\uC77C\uD558\uB294 \uBC29\uC2DD \uBA54\uBAA8\uB294 \uC788\uC73C\uB098 \uC5ED\uD560 \uAD00\uB828\uC131\uC740 \uBCF4\uC218\uC801\uC73C\uB85C \uC77D\uB294 \uD3B8\uC774 \uC548\uC804\uD569\uB2C8\uB2E4."
              : "\uC77C\uD558\uB294 \uBC29\uC2DD \uAD00\uB828 \uC785\uB825\uC740 \uBCF4\uC870 \uCC38\uACE0 \uC218\uC900\uC5D0 \uBA38\uBB35\uB2C8\uB2E4.",
        verdictText: matchedWorkStyleLabels.length > 0 ? "일하는 방식 선택이 직무 수행 방식과 연결되는 편입니다." : "일하는 방식 입력이 직무와 연결되기에 보조적입니다.",
        evidenceText:
          matchedWorkStyleLabels.length > 0
            ? `${joinLabels(matchedWorkStyleLabels)} 성향이 직무에서 필요한 방식과 일부 맞닿아 있어 보조 참고로 활용합니다.`
            : signals.workStyleNotesPresent
              ? "일하는 방식 메모는 있으나 실제 업무 상황에서 드러난 구체적인 성향이 확인되지 않습니다."
              : "일하는 방식 관련 입력이 있어도 직무 성향 판단으로 활용하기에는 제한적입니다.",
        limitText: "일하는 방식이 실제 경험과 연결되어 직무 성향 판단을 보완하는 경험 근거가 더 필요합니다.",
        confidence: matchedWorkStyleLabels.length > 0 ? "medium" : "low",
      }),
    ],
  };
}

function buildAxis1ComparisonBlock(signals = {}) {
  const majorPriorLabel = toStr(signals.majorPriorLabel) || "mismatch";
  const majorWeightApplied = toStr(signals.majorWeightApplied) || "neutral";
  const targetJobLabel = toStr(signals.targetJobLabel);
  const majorDisplayLabel = toStr(signals.majorDisplayLabel);
  const courseworkLabel = toStr(signals.courseworkRepresentativeLabel);
  const projectLabel = toStr(signals.projectRepresentativeLabel);
  const internshipLabel = toStr(signals.internshipRepresentativeLabel);
  const majorCurrentValue =
    majorPriorLabel === "direct" ? "높음"
    : majorPriorLabel === "adjacent" ? "보통"
    : majorPriorLabel === "weak" ? "약함"
    : "낮음";
  const majorScore =
    majorPriorLabel === "direct" && majorWeightApplied === "strong_bonus" ? 4
    : majorPriorLabel === "direct" ? 3
    : majorPriorLabel === "adjacent" ? 3
    : majorPriorLabel === "weak" ? 2
    : 1;

  return {
    version: "newgrad-comparison-v2",
    axisKey: "axis1",
    title: "전공과 직무의 연결성",
    introText: "전공 분류와 학습 배경이 목표 직무와 얼마나 직접 연결되는지 봅니다.",
    rows: [
      makeComparisonRow({
        rowKey: "major_job_relevance",
        label: "전공이 이 직무와 얼마나 맞는지",
        displayMode: "label_with_score",
        valueType: "enum",
        sourceSignals: ["majorPriorLabel", "majorWeightApplied"],
        currentValue: majorCurrentValue,
        score: majorScore,
        band: bandFromScore(majorScore),
        summaryText: majorDisplayLabel ? `${majorDisplayLabel} 전공 기준 판단입니다.` : "전공 기준 판단입니다.",
        verdictText:
          majorPriorLabel === "direct"
            ? (targetJobLabel && majorDisplayLabel ? `${majorDisplayLabel} 전공은 ${targetJobLabel}와 직접 맞닿는 편입니다.` : "전공이 목표 직무와 직접 맞닿는 편입니다.")
            : majorPriorLabel === "adjacent"
              ? (targetJobLabel && majorDisplayLabel ? `${majorDisplayLabel} 전공은 ${targetJobLabel}의 출발점으로는 읽히지만 핵심 과업과는 거리가 일부 있습니다.` : "전공이 목표 직무의 출발점으로는 읽히지만 핵심 과업과는 거리가 일부 있습니다.")
              : (targetJobLabel ? `${targetJobLabel} 기준으로 보면 전공 자체의 연결성은 아직 약한 편입니다.` : "전공 자체의 직무 연결성은 아직 약한 편입니다."),
        evidenceText:
          majorPriorLabel === "direct"
            ? "전공 분류와 학습 배경이 직무 이해의 기본 근거로 읽힙니다."
            : majorPriorLabel === "adjacent"
              ? "전공 내용이 일부 겹치지만 바로 역할 언어로 번역되기에는 거리감이 있습니다."
              : "현재 전공 정보만으로는 직무 핵심 과업을 직접 설명할 근거가 크지 않습니다.",
        limitText:
          majorPriorLabel === "direct"
            ? "전공 적합성만으로 상위 판단에 도달하기보다 전공 안에서 어떤 과목과 학습 기반을 쌓았는지까지 함께 설명되면 더 안정적입니다."
            : "직무 기준으로 연결되는 전공 수업, 과제, 학습 기반을 더 분명하게 설명할 필요가 있습니다.",
        positiveEvidenceLabels: makeDetailedReadLabelList(
          majorDisplayLabel && targetJobLabel
            ? (majorPriorLabel === "direct"
              ? `${majorDisplayLabel}과 ${targetJobLabel}는 꽤 가깝게 읽힙니다.`
              : majorPriorLabel === "adjacent"
                ? `${majorDisplayLabel} 전공은 ${targetJobLabel}와 일정 수준 연결됩니다.`
                : majorPriorLabel === "weak"
                  ? `${majorDisplayLabel}과 ${targetJobLabel}는 완전히 먼 조합은 아닙니다.`
                  : `${majorDisplayLabel} 기준으로 보면 ${targetJobLabel}와 일부 접점이 있습니다.`)
            : (majorPriorLabel === "direct"
              ? "전공 기준으로 보면 지원 직무와 일정 수준 연결됩니다."
              : majorPriorLabel === "adjacent"
                ? "전공과 직무가 완전히 동떨어진 조합은 아닙니다."
                : "전공 기준 접점은 일부 확인됩니다."),
          "전공 기준 접점은 일부 확인됩니다."
        ),
        exactEvidencePhrases: buildExactEvidencePhrases(
          majorDisplayLabel ? [`전공 ${majorDisplayLabel}`] : [],
          courseworkLabel ? [`과목 ${courseworkLabel}`] : [],
          projectLabel ? [`프로젝트 ${projectLabel}`] : [],
          internshipLabel ? [`인턴 ${internshipLabel}`] : []
        ),
        missingEvidenceLabels: makeDetailedReadLabelList(
          majorDisplayLabel && targetJobLabel
            ? (majorPriorLabel === "direct"
              ? `${majorDisplayLabel}은 ${targetJobLabel}와 일부 연결되지만, 더 직접적인 근거가 함께 보이면 해석이 더 선명해질 수 있습니다.`
              : majorPriorLabel === "adjacent"
                ? `현재는 ${majorDisplayLabel} 중심으로 읽히고 있어, ${targetJobLabel}와 더 바로 이어지는 입력이 있으면 더 유리합니다.`
                : `${majorDisplayLabel}만으로는 ${targetJobLabel}와의 직접 연결 근거가 충분히 강하지 않을 수 있습니다.`)
            : (majorPriorLabel === "direct"
              ? "전공 외에 직무와 더 직접 연결되는 입력이 있으면 해석이 더 선명해질 수 있습니다."
              : majorPriorLabel === "adjacent"
                ? "현재는 전공 중심으로 읽히고 있어, 더 직접적인 직무 근거가 보이면 유리합니다."
                : "전공만으로는 직무 연결 근거가 충분히 강하지 않을 수 있습니다."),
          "전공만으로는 직무 연결 근거가 충분히 강하지 않을 수 있습니다."
        ),
        actionHint: "",
        confidence: majorPriorLabel === "direct" ? "high" : majorPriorLabel === "adjacent" ? "medium" : "low",
      }),
    ],
    cautionText:
      majorDisplayLabel && targetJobLabel
        ? (majorPriorLabel === "direct"
          ? `이 축은 ${majorDisplayLabel}이 ${targetJobLabel}와 얼마나 가까운지에 크게 영향을 받습니다. 지금은 전공 기준 신호는 보이지만, 연결을 더 강하게 만드는 추가 근거는 제한적입니다.`
          : majorPriorLabel === "adjacent"
            ? `현재는 ${majorDisplayLabel} 중심으로 ${targetJobLabel} 적합성이 해석되고 있습니다. 전공 외에도 직무와 직접 이어지는 입력이 함께 잡히면 더 높게 읽힐 수 있습니다.`
            : `${majorDisplayLabel}과 ${targetJobLabel} 사이 접점은 확인되지만, 직무 적합성을 더 강하게 뒷받침할 입력은 아직 많지 않은 상태입니다.`)
        : (majorPriorLabel === "direct"
          ? "이 축은 전공이 지원 직무와 얼마나 가까운지에 크게 영향을 받습니다. 지금은 전공 기준 신호는 보이지만, 연결을 더 강하게 만드는 추가 근거는 제한적입니다."
          : majorPriorLabel === "adjacent"
            ? "현재는 전공 중심으로 적합성이 해석되고 있습니다. 전공 외에도 직무와 직접 이어지는 입력이 함께 잡히면 더 높게 읽힐 수 있습니다."
            : "전공과 직무 사이 접점은 확인되지만, 적합성을 더 강하게 뒷받침할 입력은 아직 많지 않은 상태입니다."),
  };
}

function buildAxis2ComparisonBlock(signals = {}) {
  const certDirectCount = Number(signals.certDirectCount || 0);
  const projectIndustrySupportCount = Number(signals.projectIndustrySupportCount || 0);
  const strongContextCount = Number(signals.strongContextCount || 0);
  const supportContextCount = Number(signals.supportContextCount || 0);
  const targetIndustryLabel = toStr(signals.targetIndustryLabel);
  const majorDisplayLabel = toStr(signals.majorDisplayLabel);
  const certLabels = firstUniqueLabels([
    ...toArr(signals.certAlignedLabels),
    ...toArr(signals.certWeakLabels),
  ], 2);
  const projectTypeLabel = pickRepresentativeProjectTypeLabel(signals.projectTypeExperienceLabels);
  const internshipTypeLabel = pickRepresentativeInternshipTypeLabel(signals.internshipTypeExperienceLabels);
  const stakeholderLabel = pickRepresentativeStakeholderLabel(signals.stakeholderExperienceLabels);
  const contextLabel = internshipTypeLabel || projectTypeLabel;
  const repeatCount = Math.max(strongContextCount, supportContextCount, projectIndustrySupportCount);

  return {
    version: "newgrad-comparison-v2",
    axisKey: "axis2",
    title: "산업 분야 이해도",
    introText: "전공, 자격, 프로젝트, 인턴 맥락이 목표 산업 이해 근거로 얼마나 읽히는지 보수적으로 나눠 봅니다.",
    rows: [
      makeComparisonRow({
        rowKey: "major_cert_industry_relevance",
        label: "이 산업을 이해할 수 있는 배경 경험",
        displayMode: "label_only",
        valueType: "derived",
        sourceSignals: ["majorAligned", "certificationsAligned", "certDirectCount"],
        currentValue: signals.majorAligned || signals.certificationsAligned ? "확인됨" : "일부 보임",
        verdictText:
          signals.majorAligned && signals.certificationsAligned
            ? (targetIndustryLabel ? `${targetIndustryLabel} 산업 이해의 기본 기반이 비교적 또렷합니다.` : "산업 이해의 기본 기반이 비교적 또렷합니다.")
            : signals.majorAligned
              ? (majorDisplayLabel && targetIndustryLabel ? `${majorDisplayLabel} 전공 배경이 ${targetIndustryLabel} 이해의 기초 근거로 읽힙니다.` : "전공 배경이 산업 이해의 기초 근거로 읽힙니다.")
              : signals.certificationsAligned
                ? `자격 근거${certDirectCount > 0 ? ` ${certDirectCount}건` : ""}이 산업 관련성을 보완합니다.`
                : (targetIndustryLabel ? `${targetIndustryLabel} 산업 관련성은 아직 제한적으로 읽힙니다.` : "산업 관련성은 아직 제한적으로 읽힙니다."),
        evidenceText:
          signals.majorAligned && signals.certificationsAligned
            ? "전공과 자격이 함께 보여 산업 이해의 기본 근거가 두 겹으로 확인됩니다."
            : signals.majorAligned
              ? "전공 배경이 산업 이해의 출발점으로 읽힙니다."
              : signals.certificationsAligned
                ? "자격 근거가 산업 관련성을 보조합니다."
                : "전공이나 자격에서 산업 관련성을 바로 설명할 만한 단서는 아직 크지 않습니다.",
        limitText: targetIndustryLabel ? `${targetIndustryLabel} 기준 상위 판단으로 가려면 실제 현업 맥락 경험이 더 필요합니다.` : "상위 판단으로 가려면 실제 현업 맥락 경험이 더 필요합니다.",
        positiveEvidenceLabels: makeDetailedReadLabelList(
          majorDisplayLabel && signals.certificationsAligned && targetIndustryLabel
            ? `${majorDisplayLabel} 전공과 관련 자격은 ${targetIndustryLabel}과 연결되는 근거로 반영됩니다.`
            : majorDisplayLabel && targetIndustryLabel
              ? `${majorDisplayLabel} 전공은 ${targetIndustryLabel}과 일부 연결됩니다.`
              : signals.certificationsAligned && targetIndustryLabel
                ? `관련 자격은 ${targetIndustryLabel}과 연결되는 신호로 반영됩니다.`
                : "전공이나 자격 정보에서 지원 산업과 연결되는 신호가 확인됩니다.",
          "전공이나 자격 정보에서 지원 산업과 연결되는 신호가 확인됩니다."
        ),
        exactEvidencePhrases: buildExactEvidencePhrases(
          buildPrefixedEvidencePhrases("자격증", certLabels),
          majorDisplayLabel ? [`전공 ${majorDisplayLabel}`] : []
        ),
        missingEvidenceLabels: makeDetailedReadLabelList(
          targetIndustryLabel && (majorDisplayLabel || signals.certificationsAligned)
            ? `${majorDisplayLabel || "전공"}이나 관련 자격 쪽 연결은 보이지만, ${targetIndustryLabel}과 직접 맞닿는 경험 신호는 더 보완될 여지가 있습니다.`
            : "전공이나 자격 쪽 연결은 보이지만, 실제 경험 쪽 산업 신호는 더 보완될 여지가 있습니다.",
          "전공이나 자격 쪽 연결은 보이지만, 실제 경험 쪽 산업 신호는 더 보완될 여지가 있습니다."
        ),
        actionHint: "",
        confidence: signals.majorAligned && signals.certificationsAligned ? "high" : signals.majorAligned || signals.certificationsAligned ? "medium" : "low",
      }),
      makeComparisonRow({
        rowKey: "context_industry_grounding",
        label: "실제 업무 환경에 대한 이해",
        displayMode: "label_only",
        valueType: "derived",
        sourceSignals: ["contextAligned", "internContextStrength", "projectIndustrySupportCount", "weakProjectSignal"],
        currentValue: signals.contextAligned ? "충분" : signals.weakProjectSignal ? "참고 수준" : "약함",
        verdictText:
          signals.contextAligned
            ? (targetIndustryLabel ? `${contextLabel || "인턴 경험"}이 ${targetIndustryLabel} 실무 문맥과 직접 맞닿는 편입니다.` : "인턴·프로젝트 맥락이 실무 문맥과 직접 맞닿는 편입니다.")
            : projectIndustrySupportCount > 0 || signals.weakProjectSignal
              ? (targetIndustryLabel ? `${targetIndustryLabel} 산업 문맥은 일부 보이지만 깊이는 아직 보조 수준입니다.` : "산업 문맥은 일부 보이지만 깊이는 아직 보조 수준입니다.")
              : (targetIndustryLabel ? `${targetIndustryLabel} 산업 문맥을 직접 설명해 줄 경험 근거는 아직 약합니다.` : "산업 문맥을 직접 설명해 줄 경험 근거는 아직 약합니다."),
        evidenceText:
          signals.contextAligned
            ? "인턴 또는 프로젝트 맥락이 실제 산업 환경 이해 근거로 읽힙니다."
            : projectTypeLabel
              ? `${projectTypeLabel} 경험이 산업 이해를 보조합니다.`
              : projectIndustrySupportCount > 0
                ? `프로젝트 맥락 ${projectIndustrySupportCount}건이 산업 이해를 보조합니다.`
                : "산업 맥락을 직접 보여 주는 경험 단서는 아직 많지 않습니다.",
        limitText: targetIndustryLabel ? `${targetIndustryLabel} 기준으로는 단발 경험보다 반복 노출과 실무 문맥 설명이 더 필요합니다.` : "단발 경험보다 반복 노출과 실무 문맥 설명이 더 필요합니다.",
        positiveEvidenceLabels: makeDetailedReadLabelList(
          contextLabel && stakeholderLabel && targetIndustryLabel
            ? `${contextLabel} 역할과 ${stakeholderLabel} 접점은 ${targetIndustryLabel}과 관련된 입력으로 읽힙니다.`
            : contextLabel && targetIndustryLabel
              ? `${contextLabel} 경험은 ${targetIndustryLabel}과 일부 맞닿아 있습니다.`
              : "경험 입력 중 일부가 지원 산업과 맞닿아 있는 것으로 읽힙니다.",
          "경험 입력 중 일부가 지원 산업과 맞닿아 있는 것으로 읽힙니다."
        ),
        exactEvidencePhrases: buildExactEvidencePhrases(
          contextLabel && stakeholderLabel ? [`${contextLabel} 역할과 ${stakeholderLabel} 접점`] : [],
          projectTypeLabel ? [`프로젝트 ${projectTypeLabel}`] : [],
          internshipTypeLabel ? [`인턴 ${internshipTypeLabel}`] : []
        ),
        missingEvidenceLabels: makeDetailedReadLabelList(
          contextLabel && targetIndustryLabel
            ? `${contextLabel} 경험은 ${targetIndustryLabel}과 일부 연결되지만, 반복적으로 확인되는 수준은 아직 약한 편입니다.`
            : "산업 관련 신호는 보이지만, 반복적으로 확인되는 수준은 아직 약합니다.",
          "산업 관련 신호는 보이지만, 반복적으로 확인되는 수준은 아직 약합니다."
        ),
        actionHint: "",
        confidence: signals.contextAligned ? "high" : projectIndustrySupportCount > 0 || signals.weakProjectSignal ? "medium" : "low",
      }),
      makeComparisonRow({
        rowKey: "industry_exposure_repeatability",
        label: "여러 번 접한 경험",
        displayMode: "label_only",
        valueType: "count",
        sourceSignals: ["strongContextCount", "supportContextCount", "projectIndustrySupportCount"],
        currentValue: strongContextCount >= 2 || supportContextCount >= 2 ? "반복 확인" : "근거가 하나 있음",
        verdictText:
          strongContextCount >= 2
            ? "강한 산업 맥락 노출이 여러 경험에서 반복됩니다."
            : supportContextCount >= 2 || projectIndustrySupportCount >= 2
              ? "산업 관련 노출은 일부 반복되지만 강도는 아직 제한적입니다."
              : "산업 노출은 단일 근거 수준으로 읽힙니다.",
        evidenceText:
          strongContextCount >= 2
            ? `강한 맥락 경험 ${strongContextCount}건에서 산업 문맥이 반복됩니다.`
            : supportContextCount >= 2 || projectIndustrySupportCount >= 2
              ? `${repeatCount}건 이상의 관련 경험이 반복되어 보입니다.`
              : "현재는 일부 경험에 기대고 있어 반복 노출 신호는 크지 않습니다.",
        limitText: targetIndustryLabel ? `${targetIndustryLabel} 기준으로는 기간·유형·문맥이 다르게 반복된 흔적이 더 필요합니다.` : "기간·유형·문맥이 다르게 반복된 흔적이 더 필요합니다.",
        positiveEvidenceLabels: makeDetailedReadLabelList(
          contextLabel && stakeholderLabel && targetIndustryLabel
            ? `${contextLabel} 역할과 ${stakeholderLabel} 접점은 ${targetIndustryLabel}과 관련된 입력으로 읽힙니다.`
            : targetIndustryLabel && repeatCount >= 2
              ? `${targetIndustryLabel} 관련 입력은 일부 반영되고 있습니다.`
              : "산업 관련 입력은 일부 확인되지만, 반복성은 아직 강하지 않습니다.",
          "산업 관련 입력은 일부 확인되지만, 반복성은 아직 강하지 않습니다."
        ),
        exactEvidencePhrases: buildExactEvidencePhrases(
          contextLabel && stakeholderLabel ? [`${contextLabel} 역할과 ${stakeholderLabel} 접점`] : [],
          projectTypeLabel ? [`프로젝트 ${projectTypeLabel}`] : [],
          internshipTypeLabel ? [`인턴 ${internshipTypeLabel}`] : []
        ),
        missingEvidenceLabels: makeDetailedReadLabelList(
          targetIndustryLabel
            ? `지금은 ${targetIndustryLabel}과의 접점이 일부 보이지만, 여러 입력 항목에서 같은 방향의 연결이 더 잡히면 해석이 더 강해질 수 있습니다.`
            : "여러 입력 항목에서 같은 방향의 연결이 더 잡히면 해석이 더 강해질 수 있습니다.",
          "여러 입력 항목에서 같은 방향의 연결이 더 잡히면 해석이 더 강해질 수 있습니다."
        ),
        actionHint: "",
        confidence: strongContextCount >= 2 ? "high" : supportContextCount >= 2 || projectIndustrySupportCount >= 2 ? "medium" : "low",
      }),
    ],
    cautionText:
      targetIndustryLabel && majorDisplayLabel && signals.certificationsAligned
        ? `현재는 ${targetIndustryLabel}과의 접점이 한정적으로 확인되는 상태입니다. ${majorDisplayLabel}, 관련 자격, 경험 입력 중 두 개 이상에서 같은 방향의 신호가 잡히면 더 강하게 해석될 수 있습니다.`
        : targetIndustryLabel
          ? `이 축은 ${targetIndustryLabel}과 관련된 신호가 여러 입력 항목에서 반복적으로 보일수록 더 높게 읽힙니다. 지금은 일부 연결은 보이지만, 누적된 산업 맥락은 아직 제한적입니다.`
          : "이 축은 지원 산업과 관련된 신호가 여러 입력 항목에서 반복적으로 보일수록 더 높게 읽힙니다. 지금은 일부 연결은 보이지만, 누적된 산업 맥락은 아직 제한적입니다.",
  };
}

function buildAxis3ComparisonBlock(signals = {}) {
  const outcomeLevel = toStr(signals.projectOutcomeLevel) || "none";
  const durationLevel = toStr(signals.experienceDurationLevel) || "none";
  const outcomeLabels = firstUniqueLabels(signals.outcomeExperienceLabels, 2);
  const durationLabels = firstUniqueLabels(signals.durationExperienceLabels, 2);
  const projectSourceLabels = firstUniqueLabels(signals.projectSourceLabels, 2);
  const workSourceLabels = firstUniqueLabels(signals.workSourceLabels, 2);
  const outcomeScore = outcomeLevel === "strong" ? 4 : outcomeLevel === "support" ? 3 : 2;
  const durationScore = durationLevel === "long" ? 4 : 2;

  return {
    version: "newgrad-comparison-v2",
    axisKey: "axis3",
    title: "이력·스펙·경험 연결성",
    introText: "결과 수준, 지속성, 경험 조합 여부를 나눠서 실제 투입 가능성을 보수적으로 판독합니다.",
    rows: [
      makeComparisonRow({
        rowKey: "outcome_level",
        label: "성과를 낸 경험",
        displayMode: "label_with_score",
        valueType: "band",
        sourceSignals: ["projectOutcomeLevel", "outcomeExperienceLabels"],
        currentValue: outcomeLevel === "strong" ? "높음" : outcomeLevel === "support" ? "보통" : "낮음",
        score: outcomeScore,
        band: bandFromScore(outcomeScore),
        verdictText:
          outcomeLevel === "strong" ? "결과 책임이 비교적 또렷하게 확인됩니다."
          : outcomeLevel === "support" ? "결과 수준을 보조하는 경험은 일부 보입니다."
          : "결과 수준을 직접 설명할 근거는 아직 약합니다.",
        evidenceText:
          outcomeLabels.length > 0
            ? `${joinLabels(outcomeLabels)} 경험에서 산출물이나 결과 책임 흔적이 보입니다.`
            : "경험은 있으나 결과를 어떻게 냈는지까지는 아직 선명하지 않습니다.",
        limitText: "무엇을 만들었는지보다 그 결과가 어떤 기준으로 인정됐는지까지 붙으면 더 강해집니다.",
        positiveEvidenceLabels: makeDetailedReadLabelList(
          outcomeLabels.length >= 2
            ? `${formatDetailedReadLabelText(outcomeLabels)} 경험이 함께 확인되어 실행 근거가 쌓인 것으로 해석됩니다.`
            : outcomeLabels.length === 1
              ? `${outcomeLabels[0]} 경험이 확인되어 기본적인 실행 경험으로 반영됩니다.`
              : "프로젝트 또는 실무형 경험이 확인되어 기본적인 실행 경험으로 반영됩니다.",
          "프로젝트 또는 실무형 경험이 확인되어 기본적인 실행 경험으로 반영됩니다."
        ),
        exactEvidencePhrases: buildExactEvidencePhrases(
          buildPrefixedEvidencePhrases("프로젝트", projectSourceLabels, 1),
          outcomeLabels[0] ? [`${outcomeLabels[0]}`] : []
        ),
        missingEvidenceLabels: makeDetailedReadLabelList(
          outcomeLabels.length >= 2
            ? `${formatDetailedReadLabelText(outcomeLabels)} 경험이 있더라도, 얼마나 이어졌는지와 어느 수준까지 경험했는지가 함께 잡혀야 더 높게 읽힐 수 있습니다.`
            : outcomeLabels.length === 1
              ? `${outcomeLabels[0]} 경험은 보이지만, 결과 수준과 지속성이 함께 잡히는 근거는 아직 더 보완될 여지가 있습니다.`
              : "경험은 확인되지만, 결과 수준과 지속성이 함께 잡히는 입력은 더 보완될 여지가 있습니다.",
          "경험은 확인되지만, 결과 수준과 지속성이 함께 잡히는 입력은 더 보완될 여지가 있습니다."
        ),
        actionHint: "",
        confidence: outcomeLevel === "strong" ? "high" : outcomeLevel === "support" ? "medium" : "low",
      }),
      makeComparisonRow({
        rowKey: "duration_continuity",
        label: "꾸준히 해본 경험",
        displayMode: "label_with_score",
        valueType: "band",
        sourceSignals: ["experienceDurationLevel", "durationExperienceLabels"],
        currentValue: durationLevel === "long" ? "어느 정도 이어짐" : "짧음",
        score: durationScore,
        band: bandFromScore(durationScore),
        verdictText:
          durationLevel === "long" ? "경험이 일정 기간 이어져 지속성이 보입니다."
          : "지속성 근거는 아직 짧게 읽힙니다.",
        evidenceText:
          durationLabels.length > 0
            ? `${joinLabels(durationLabels)} 경험에서 일정 기간 이어진 수행 흔적이 보입니다.`
            : "경험은 있으나 꾸준히 맡아 본 흔적은 아직 제한적입니다.",
        limitText: "한 번의 수행보다 일정 기간 반복해서 맡은 경험이 더 분명하게 보이면 좋습니다.",
        positiveEvidenceLabels: makeDetailedReadLabelList(
          durationLabels.length === 1
            ? `${durationLabels[0]} 경험은 일정 수준의 실행 경험으로 반영됩니다.`
            : durationLabels.length >= 2
              ? `${formatDetailedReadLabelText(durationLabels)} 경험이 함께 확인되어 실행 근거가 쌓인 것으로 해석됩니다.`
              : "실행 경험 신호는 보이지만, 깊이까지 강하게 읽히는 수준은 아닙니다.",
          "실행 경험 신호는 보이지만, 깊이까지 강하게 읽히는 수준은 아닙니다."
        ),
        exactEvidencePhrases: buildExactEvidencePhrases(
          buildPrefixedEvidencePhrases("인턴", workSourceLabels, 1),
          durationLabels[0] ? [`${durationLabels[0]}`] : []
        ),
        missingEvidenceLabels: makeDetailedReadLabelList(
          durationLabels.length >= 2
            ? `${formatDetailedReadLabelText(durationLabels)} 경험이 있더라도, 얼마나 이어졌는지와 어느 수준까지 경험했는지가 함께 잡혀야 더 높게 읽힐 수 있습니다.`
            : durationLabels.length === 1
              ? `지금은 ${durationLabels[0]} 경험이 확인되지만, 단발 경험보다 반복되거나 이어진 경험 신호가 더해지면 유리합니다.`
              : "단발 경험으로는 읽히지만, 반복되거나 이어진 경험 신호는 아직 약한 편입니다.",
          "단발 경험으로는 읽히지만, 반복되거나 이어진 경험 신호는 아직 약한 편입니다."
        ),
        actionHint: "",
        confidence: durationLevel === "long" ? "medium" : "low",
      }),
      makeComparisonRow({
        rowKey: "combo_experience",
        label: "여러 경험이 함께 있는지",
        displayMode: "label_only",
        valueType: "boolean",
        sourceSignals: ["comboEvidence", "comboGuarded", "evidenceStrength"],
        currentValue: signals.comboEvidence ? (signals.comboGuarded ? "일부 확인됨" : "확인됨") : "미확인",
        verdictText:
          signals.comboEvidence && !signals.comboGuarded ? "프로젝트와 인턴이 이어지는 경험으로 읽힙니다."
          : signals.comboEvidence ? "경험 조합은 보이지만 깊게 해석하기에는 아직 조심스럽습니다."
          : "조합 경험 근거는 아직 약합니다.",
        evidenceText:
          signals.comboEvidence
            ? "프로젝트와 인턴을 함께 설명할 수 있는 연결 흔적이 보입니다."
            : signals.evidenceStrength === "mixed"
              ? "여러 경험은 있으나 서로 이어지는 조합 근거는 아직 약합니다."
              : "단일 경험 중심으로 읽히는 축입니다.",
        limitText: "경험들이 어떻게 이어졌는지, 이전 경험이 다음 경험에 어떤 영향을 줬는지까지 보강되면 더 좋습니다.",
        positiveEvidenceLabels: makeDetailedReadLabelList(
          signals.comboEvidence
            ? "여러 경험이 함께 확인되어 실행 근거가 쌓인 것으로 해석됩니다."
            : "실행 경험 신호는 보이지만, 깊이까지 강하게 읽히는 수준은 아닙니다.",
          "실행 경험 신호는 보이지만, 깊이까지 강하게 읽히는 수준은 아닙니다."
        ),
        exactEvidencePhrases: buildExactEvidencePhrases(
          buildPrefixedEvidencePhrases("프로젝트", projectSourceLabels, 1),
          buildPrefixedEvidencePhrases("인턴", workSourceLabels, 1)
        ),
        missingEvidenceLabels: makeDetailedReadLabelList(
          signals.comboEvidence
            ? "여러 경험이 함께 보이면 유리하지만, 각 경험의 지속성과 결과 수준이 함께 잡혀야 더 강하게 해석됩니다."
            : "실행 경험 자체는 보이지만, 깊이 있게 읽히는 조합은 제한적입니다.",
          "실행 경험 자체는 보이지만, 깊이 있게 읽히는 조합은 제한적입니다."
        ),
        actionHint: "",
        confidence: signals.comboEvidence && !signals.comboGuarded ? "high" : signals.comboEvidence || signals.evidenceStrength === "mixed" ? "medium" : "low",
      }),
    ],
    cautionText: (() => {
      const experienceLabels = pickAxisExperienceLabels(outcomeLabels, durationLabels);
      const experienceText = formatDetailedReadLabelText(experienceLabels);
      if (experienceLabels.length >= 2) {
        return `${experienceText} 경험이 함께 보이면 유리하지만, 각 경험의 지속성과 결과 수준이 함께 잡혀야 더 강하게 해석됩니다.`;
      }
      if (experienceLabels.length === 1) {
        return `현재는 ${experienceText} 경험이 실행 신호로 반영되고 있지만, 깊이까지 강하게 읽히는 근거는 아직 제한적입니다.`;
      }
      return "이 축은 경험의 개수보다도 결과 수준과 지속성이 함께 보일 때 더 높게 읽힙니다.";
    })(),
  };
}

function buildAxis4ComparisonBlock(signals = {}) {
  const stakeholderLabels = firstUniqueLabels(
    toArr(signals.jobRelevantStakeholdersHit?.allLabels).length > 0
      ? signals.jobRelevantStakeholdersHit?.allLabels
      : signals.stakeholderExperienceLabels,
    2
  );
  const directCount = Number(signals._interactionDirectStakeholderCount || 0);
  const selfReportDirectApplied = signals.selfReportDirectApplied === true;
  const missingLabels = firstUniqueLabels(signals.missingImportantStakeholders, 2);
  const stakeholderText = formatDetailedReadLabelText(stakeholderLabels);
  const workStyleLabel = pickFirstAvailableLabel(toArr(signals.interactionEligibleWorkStyleLabels)[0]);
  const sourceStakeholderPhrases = firstUniqueLabels(toArr(signals.sourceStakeholderPhrases), 2);
  const roleEvidencePhrases = firstUniqueLabels(toArr(signals.roleEvidencePhrases), 2);
  const stakeholderExactPhrases = stakeholderLabels.map((label) => `${label} 접점`);

  return {
    version: "newgrad-comparison-v2",
    axisKey: "axis4",
    title: "이해관계자 소통 적합성",
    introText: "목표 직무에서 중요한 상대를 얼마나 직접적으로 상대했고 조율했는지를 분리해 읽습니다.",
    rows: [
      makeComparisonRow({
        rowKey: "stakeholder_exposure_level",
        label: "중요 이해관계자와 맞닿은 경험",
        displayMode: "label_only",
        valueType: "enum",
        sourceSignals: ["stakeholderExperienceLabels"],
        currentValue: stakeholderLabels.length > 0 ? "확인됨" : "일부 보임",
        verdictText: stakeholderLabels.length > 0 ? "목표 직무에서 의미 있는 이해관계자 접점이 일부 확인됩니다." : "직무 핵심 이해관계자 접점은 아직 선명하지 않습니다.",
        evidenceText:
          stakeholderLabels.length > 0
            ? `${joinLabels(stakeholderLabels)} 접점이 보여 어떤 이해관계자를 상대했는지 읽힙니다.`
            : "활동 경험은 보이지만 누구와 맞물려 소통했는지는 아직 선명하지 않습니다.",
        limitText: stakeholderLabels.length > 0
          ? (missingLabels.length > 0 ? `${joinLabels(missingLabels)}처럼 이 직무에서 중요한 상대와의 접점 근거가 더 보강되면 좋습니다.` : "상대 이름만보다 어떤 요청을 처리했는지까지 붙으면 소통 맥락이 더 분명해집니다.")
          : "목표 직무에서 중요한 상대가 누구였는지 드러내는 사례가 더 필요합니다.",
        positiveEvidenceLabels: makeDetailedReadLabelList(
          stakeholderLabels.length >= 2
            ? `${stakeholderText}와 연결되는 경험이 일부 확인됩니다.`
            : stakeholderLabels.length === 1
              ? `${stakeholderText}과 맞닿는 경험이 일부 확인됩니다.`
              : "사람을 상대하는 경험 신호가 일부 보입니다.",
          "사람을 상대하는 경험 신호가 일부 보입니다."
        ),
        exactEvidencePhrases: buildExactEvidencePhrases(
          sourceStakeholderPhrases,
          roleEvidencePhrases,
          stakeholderExactPhrases
        ),
        missingEvidenceLabels: makeDetailedReadLabelList(
          stakeholderLabels.length > 0
            ? `${stakeholderText} 접점은 보이지만, 직접 상호작용으로 읽히는 근거는 아직 강하지 않습니다.`
            : "타인과의 접점은 보이지만, 직접 상호작용으로 읽히는 신호는 아직 약한 편입니다.",
          "타인과의 접점은 보이지만, 직접 상호작용으로 읽히는 신호는 아직 약한 편입니다."
        ),
        actionHint: "",
        confidence: stakeholderLabels.length > 0 ? "medium" : "low",
      }),
      makeComparisonRow({
        rowKey: "direct_interaction_experience",
        label: "직접 소통·조율 경험",
        displayMode: "label_only",
        valueType: "derived",
        sourceSignals: ["interactionSupportTone", "_interactionDirectStakeholderCount", "selfReportDirectApplied"],
        currentValue: signals.interactionSupportTone === "strong" ? "직접 확인" : stakeholderLabels.length > 0 ? "보조 확인" : "미약",
        verdictText:
          signals.interactionSupportTone === "strong" ? "직접 설명하거나 조율한 경험이 확인됩니다."
          : stakeholderLabels.length > 0 ? "이해관계자 접점은 보이지만 직접 소통 증거는 아직 보조 수준입니다."
          : "직접 소통 경험을 설명할 근거는 아직 약합니다.",
        evidenceText:
          signals.interactionSupportTone === "strong"
            ? `직접 소통으로 읽히는 경험이${directCount > 0 ? ` ${directCount}건` : ""} 확인됩니다.`
            : stakeholderLabels.length > 0
              ? `${selfReportDirectApplied ? "자기보고 보조 신호는 있으나 " : ""}직접 설명, 응대, 조율 역할은 아직 선명하지 않습니다.`
              : "직접 대응, 설명, 조율 경험을 뒷받침할 근거는 아직 많지 않습니다.",
        limitText:
          signals.interactionSupportTone === "strong"
            ? "직접 대응 대상과 상황이 함께 드러나면 소통 적합성을 더 안정적으로 설명할 수 있습니다."
            : "누구를 상대로 어떤 설명이나 대응을 했는지까지 보강되면 직접 소통 근거가 더 분명해집니다.",
        positiveEvidenceLabels: makeDetailedReadLabelList(
          stakeholderLabels.length >= 2
            ? `${stakeholderText}와 연결되는 경험이 일부 확인됩니다.`
            : stakeholderLabels.length === 1
              ? (signals.interactionSupportTone === "strong"
                ? `${stakeholderText}을 상대하는 역할 신호가 일부 반영됩니다.`
                : `${stakeholderText} 접점은 보이지만, 강한 직접 경험으로까지 읽히지는 않습니다.`)
              : "이해관계자와의 접점이 있는 경험이 반영됩니다.",
          "이해관계자와의 접점이 있는 경험이 반영됩니다."
        ),
        exactEvidencePhrases: buildExactEvidencePhrases(
          sourceStakeholderPhrases,
          roleEvidencePhrases,
          stakeholderExactPhrases
        ),
        missingEvidenceLabels: makeDetailedReadLabelList(
          stakeholderLabels.length > 0
            ? `${stakeholderText}과 맞닿는 입력은 일부 반영되지만, 이 축을 강하게 끌어올릴 정도로 충분하지는 않습니다.`
            : workStyleLabel
              ? `${workStyleLabel}은 참고 신호로 반영되지만, 실제 경험 기반 접점이 더 중요하게 읽힙니다.`
              : "일하는 방식 선택값은 참고 신호로 반영되지만, 실제 경험 신호가 더 중요하게 읽힙니다.",
          "일하는 방식 선택값은 참고 신호로 반영되지만, 실제 경험 신호가 더 중요하게 읽힙니다."
        ),
        actionHint: "",
        confidence: signals.interactionSupportTone === "strong" ? "high" : stakeholderLabels.length > 0 ? "medium" : "low",
      }),
    ],
    cautionText:
      stakeholderLabels.length > 0
        ? (signals.interactionSupportTone === "strong"
          ? `${stakeholderText}과 연결되는 경험은 반영되고 있지만, 더 분명한 직접 접점이 함께 보이면 더 높게 읽힐 수 있습니다.`
          : `이 축은 ${stakeholderText} 같은 대상과 얼마나 직접 맞닿아 있었는지가 중요합니다. 지금은 관련 신호가 일부 보이지만, 직접 상호작용으로 강하게 읽히는 입력은 제한적입니다.`)
        : "이 축은 어떤 사람들과 얼마나 직접 맞닿아 있었는지가 중요합니다. 지금은 관련 신호가 일부 보이지만, 직접 상호작용으로 강하게 읽히는 입력은 제한적입니다.",
  };
}

function buildAxis5ComparisonBlock(signals = {}) {
  const matchedStrengthLabels = firstUniqueLabels(signals.matchedStrengthLabels, 2);
  const matchedWorkStyleLabels = firstUniqueLabels(signals.matchedWorkStyleLabels, 2);
  const targetJobLabel = toStr(signals.targetJobLabel);
  const strengthText = formatDetailedReadLabelText(matchedStrengthLabels);
  const workStyleText = formatDetailedReadLabelText(matchedWorkStyleLabels);

  return {
    version: "newgrad-comparison-v2",
    axisKey: "axis5",
    title: "강점과 재능",
    introText: "강점과 업무 스타일은 자기보고 기반이므로 과신 없이 보조 신호로만 해석합니다.",
    cautionText:
      targetJobLabel && strengthText && workStyleText
        ? `이 축은 ${strengthText}, ${workStyleText} 같은 입력이 ${targetJobLabel} 성향과 얼마나 맞는지 보는 참고 지표입니다. 일부 연결 신호는 보이지만, 실제 경험 축보다 영향은 제한적입니다.`
        : targetJobLabel
          ? `강점과 일하는 방식은 ${targetJobLabel}과의 방향성을 보여주지만, 단독으로 높은 적합성을 만들기에는 한계가 있습니다.`
          : "이 축은 강점과 일하는 방식이 직무 성향과 얼마나 맞는지 보는 참고 지표입니다. 일부 연결 신호는 보이지만, 실제 경험 축보다 영향은 제한적입니다.",
    rows: [
      makeComparisonRow({
        rowKey: "strength_role_relevance",
        label: "내 강점이 이 직무와 맞는지",
        displayMode: "label_only",
        valueType: "count",
        sourceSignals: ["matchedStrengthLabels", "strengthsCount"],
        currentValue: matchedStrengthLabels.length > 0 ? "연결 포인트 있음" : "일부 보임",
        score: null,
        verdictText: matchedStrengthLabels.length > 0 ? "직무와 맞닿는 강점 신호는 일부 보입니다." : "입력된 강점만으로 역할 관련성을 강하게 말하기는 어렵습니다.",
        evidenceText:
          matchedStrengthLabels.length > 0
            ? `${joinLabels(matchedStrengthLabels)} 강점이 직무 해석의 보조 신호로 읽힙니다.`
            : "강점 입력은 있으나 실경험 근거처럼 해석할 수준은 아닙니다.",
        limitText: "강점 문장만보다 실제 경험 사례와 연결될 때 설득력이 더 올라갑니다.",
        positiveEvidenceLabels: makeDetailedReadLabelList(
          strengthText && targetJobLabel
            ? (matchedStrengthLabels.length >= 2
              ? `${strengthText}는 ${targetJobLabel}과 어울리는 강점으로 읽힙니다.`
              : `${strengthText}은 ${targetJobLabel} 성향과 일부 맞닿아 있습니다.`)
            : "입력한 강점과 일하는 방식 중 일부가 지원 직무 성향과 맞닿아 있습니다.",
          "입력한 강점과 일하는 방식 중 일부가 지원 직무 성향과 맞닿아 있습니다."
        ),
        exactEvidencePhrases: buildExactEvidencePhrases(
          buildGroupedPrefixedEvidencePhrase("강점", matchedStrengthLabels)
        ),
        missingEvidenceLabels: makeDetailedReadLabelList(
          targetJobLabel && (strengthText || workStyleText)
            ? `${strengthText || workStyleText}은 참고 신호로는 의미가 있지만, ${targetJobLabel} 적합성을 강하게 설명하기에는 제한이 있습니다.`
            : "현재 입력된 강점과 일하는 방식만으로는 직무 적합성을 강하게 설명하기에는 제한이 있습니다.",
          "현재 입력된 강점과 일하는 방식만으로는 직무 적합성을 강하게 설명하기에는 제한이 있습니다."
        ),
        actionHint: "",
        confidence: matchedStrengthLabels.length > 0 ? "medium" : "low",
      }),
      makeComparisonRow({
        rowKey: "workstyle_role_relevance",
        label: "내 일하는 방식이 이 직무와 맞는지",
        displayMode: "label_only",
        valueType: "boolean",
        sourceSignals: ["matchedWorkStyleLabels", "workStyleNotesPresent"],
        currentValue: matchedWorkStyleLabels.length > 0 ? "참고 가능" : "참고 수준",
        score: null,
        verdictText: matchedWorkStyleLabels.length > 0 ? "업무 스타일 신호가 역할 이해를 일부 보조합니다." : "업무 스타일 정보는 있으나 참고 수준으로만 읽는 편이 안전합니다.",
        evidenceText:
          matchedWorkStyleLabels.length > 0
            ? `${joinLabels(matchedWorkStyleLabels)} 성향이 역할 이해를 보조합니다.`
            : signals.workStyleNotesPresent
              ? "업무 스타일 메모는 있으나 역할 관련성은 보수적으로 읽는 편이 안전합니다."
              : "일하는 방식 정보는 아직 보조 참고 수준에 머뭅니다.",
        limitText: "업무 스타일은 선호 신호일 뿐 실경험 근거처럼 읽히지 않도록 주의가 필요합니다.",
        positiveEvidenceLabels: makeDetailedReadLabelList(
          workStyleText && targetJobLabel
            ? `${workStyleText}은 ${targetJobLabel}과 맞는 참고 신호로 반영됩니다.`
            : "일하는 방식 신호는 일부 반영되지만, 강한 적합성으로까지 읽히지는 않습니다.",
          "일하는 방식 신호는 일부 반영되지만, 강한 적합성으로까지 읽히지는 않습니다."
        ),
        exactEvidencePhrases: buildExactEvidencePhrases(
          buildGroupedPrefixedEvidencePhrase("일하는 방식", matchedWorkStyleLabels)
        ),
        missingEvidenceLabels: makeDetailedReadLabelList(
          targetJobLabel
            ? `현재 입력된 강점과 일하는 방식만으로는 ${targetJobLabel} 적합성을 강하게 끌어올리기 어렵습니다.`
            : "이 축은 참고 신호 성격이 강하므로, 단독으로 점수를 크게 끌어올리기는 어렵습니다.",
          "이 축은 참고 신호 성격이 강하므로, 단독으로 점수를 크게 끌어올리기는 어렵습니다."
        ),
        actionHint: "",
        confidence: matchedWorkStyleLabels.length > 0 ? "medium" : "low",
      }),
    ],
  };
}

export function buildNewgradAxisPack(input = {}) {
  const safeInput = input && typeof input === "object" ? input : {};
  const experienceInput = safeInput.normalizedExperienceInput && typeof safeInput.normalizedExperienceInput === "object"
    ? safeInput.normalizedExperienceInput
    : normalizeNewgradExperienceInput(safeInput);
  const experienceEvidencePack = safeInput.experienceEvidencePack && typeof safeInput.experienceEvidencePack === "object"
    ? safeInput.experienceEvidencePack
    : null;
  const normalizedProjectsRaw = toArr(experienceInput.normalizedProjects);
  const normalizedInternshipsRaw = toArr(experienceInput.normalizedInternships);
  const normalizedCanonicalContractRaw = mergeCanonicalContractExperienceRows(
    experienceInput.normalizedContractExperiences,
    experienceInput.normalizedPartTimeExperience
  );
  const packProjectRows = toArr(experienceEvidencePack?.projectRows).length > 0
    ? toArr(experienceEvidencePack?.projectRows)
    : normalizedProjectsRaw;
  const packCanonicalWorkRows = toArr(experienceEvidencePack?.canonicalWorkRows).length > 0
    ? toArr(experienceEvidencePack?.canonicalWorkRows)
    : [...normalizedInternshipsRaw, ...normalizedCanonicalContractRaw];
  const axis1HintLabels = _getAxisHintLabels({ experienceEvidencePack }, "axis1", ["directRoleLabels"]);
  const axis2ProjectHintLabels = _getAxisHintLabels({ experienceEvidencePack }, "axis2", ["projectIndustryLabels"]);
  const axis2ContextHintLabels = _getAxisHintLabels({ experienceEvidencePack }, "axis2", ["strongContextLabels", "supportContextLabels"]);
  const axis3OutcomeHintLabels = _getAxisHintLabels({ experienceEvidencePack }, "axis3", ["topOutcomeLabels"]);
  const axis3DurationHintLabels = _getAxisHintLabels({ experienceEvidencePack }, "axis3", ["topDurationLabels"]);
  const axis4StakeholderHintLabels = _getAxisHintLabels({ experienceEvidencePack }, "axis4", ["directStakeholderLabels", "supportStakeholderLabels"]);
  const certEvidencePack = safeInput.certEvidencePack && typeof safeInput.certEvidencePack === "object"
    ? safeInput.certEvidencePack
    : null;
  const certAxis2AlignedLabels = _getCertAxisHintLabels({ certEvidencePack }, "axis2", ["alignedCertLabels"]);
  const certAxis2WeakLabels = _getCertAxisHintLabels({ certEvidencePack }, "axis2", ["weakCertLabels"]);
  const certAxis4CommunicationLabels = _getCertAxisHintLabels({ certEvidencePack }, "axis4", ["communicationCertLabels"]);
  const selfReportEvidencePack = safeInput.selfReportEvidencePack && typeof safeInput.selfReportEvidencePack === "object"
    ? safeInput.selfReportEvidencePack
    : null;
  const selfReportAxis4SupportStrengthLabels = _getSelfReportAxisHintLabels({ selfReportEvidencePack }, "axis4", ["supportStrengthLabels"]);
  const selfReportAxis4InteractionLabels = _getSelfReportAxisHintLabels({ selfReportEvidencePack }, "axis4", ["interactionEligibleWorkStyleLabels"]);
  const selfReportAxis5StrengthLabels = _getSelfReportAxisHintLabels({ selfReportEvidencePack }, "axis5", ["strengthLabels"]);
  const selfReportAxis5WorkStyleLabels = _getSelfReportAxisHintLabels({ selfReportEvidencePack }, "axis5", ["workStyleLabels"]);
  const selfReportProfile = safeInput.selfReportProfile && typeof safeInput.selfReportProfile === "object"
    ? safeInput.selfReportProfile
    : normalizeNewgradSelfReportTraits({
      strengths: safeInput.strengths,
      workStyleNotes: safeInput.workStyleNotes,
    });
  const majorDisplayLabel = getMajorDisplayLabel(safeInput.major);
  const targetJobLabel = getTargetJobDisplayLabel(safeInput);
  const targetIndustryLabel = getTargetIndustryDisplayLabel(safeInput);
  const normalized = {
    major: majorDisplayLabel,
    coursework: flattenEvidenceText(safeInput.coursework),
    projects: flattenEvidenceText(safeInput.projects),
    internships: flattenEvidenceText(safeInput.internships),
    extracurriculars: flattenEvidenceText(safeInput.extracurriculars),
    partTimeExperience: flattenEvidenceText(normalizedCanonicalContractRaw),
    domainInterestEvidence: flattenEvidenceText(safeInput.domainInterestEvidence),
    strengths: toArr(selfReportProfile.normalizedStrengthLabels).length > 0
      ? toArr(selfReportProfile.normalizedStrengthLabels).map((item) => toStr(item)).filter(Boolean)
      : toArr(safeInput.strengths).map((item) => toStr(item)).filter(Boolean),
    workStyleNotes: toStr(safeInput.workStyleNotes),
    workStyleList: toArr(selfReportProfile.normalizedWorkStyleLabels).length > 0
      ? toArr(selfReportProfile.normalizedWorkStyleLabels).map((item) => toStr(item)).filter(Boolean)
      : _splitWorkStyleNotes(safeInput.workStyleNotes),
    canonicalStrengthKeys: toArr(selfReportProfile.canonicalStrengthKeys).map((item) => toStr(item)).filter(Boolean),
    canonicalWorkStyleKeys: toArr(selfReportProfile.canonicalWorkStyleKeys).map((item) => toStr(item)).filter(Boolean),
    interactionEligibleWorkStyleKeys: toArr(selfReportProfile.interactionEligibleWorkStyleKeys).map((item) => toStr(item)).filter(Boolean),
    interactionEligibleWorkStyleLabels: toArr(selfReportProfile.interactionEligibleWorkStyleLabels).map((item) => toStr(item)).filter(Boolean),
    axis4SupportStrengthLabels: toArr(selfReportProfile.axis4SupportStrengthLabels).map((item) => toStr(item)).filter(Boolean),
    axis4SelfReportSignalKeys: toArr(selfReportProfile.axis4SelfReportSignalKeys).map((item) => toStr(item)).filter(Boolean),
    axis4SelfReportSupportScore: Math.max(0, Number(selfReportProfile.axis4SelfReportSupportScore || 0)),
    axis4InteractionEvidenceList: toArr(experienceEvidencePack?.axis4InteractionEvidenceList).length > 0
      ? toArr(experienceEvidencePack.axis4InteractionEvidenceList)
      : toArr(safeInput.axis4InteractionEvidenceList),
    experienceEvidencePack,
    certEvidencePack,
    axis4CommunicationCertLabels: certAxis4CommunicationLabels,
    selfReportEvidencePack,
    projectOutcomeRanks: packProjectRows.map((item) => Number(item?.outcomeRank || 0)),
    projectOutcomeLabels: _getRowStringValues(packProjectRows, "normalizedOutcomeLabel", axis3OutcomeHintLabels),
    experienceDurationRanks: packCanonicalWorkRows.map((item) => Number(item?.durationRank || 0)),
    experienceDurationLabels: _getRowStringValues(packCanonicalWorkRows, "normalizedDurationLabel", axis3DurationHintLabels),
    projectRoles: _getRowStringValues(packProjectRows, "canonicalRoleId"),
    projectRoleLabels: _getRowStringValues(packProjectRows, "normalizedRoleLabel", axis1HintLabels),
    internshipRoleFamilies: _getRowStringValues(packCanonicalWorkRows, "canonicalRoleId"),
    internshipRoleLabels: _getRowStringValues(packCanonicalWorkRows, "normalizedRoleLabel"),
    internshipTypeLabels: _getRowStringValues(packCanonicalWorkRows, "normalizedTypeLabel", axis2ContextHintLabels),
    interactionStakeholders: packCanonicalWorkRows,
    interactionStakeholderLabels: _getRowStringValues(packCanonicalWorkRows, "normalizedStakeholderLabel", axis4StakeholderHintLabels),
    projectTypeLabels: _getRowStringValues(packProjectRows, "normalizedTypeLabel", axis2ProjectHintLabels),
    projectSourceLabels: firstUniqueLabels(packProjectRows.map((item) => getProjectSourceLabel(item)).filter(Boolean), 2),
    workSourceLabels: firstUniqueLabels(packCanonicalWorkRows.map((item) => getWorkSourceLabel(item)).filter(Boolean), 2),
    targetJobId: toStr(safeInput.targetJobId),
    targetIndustryId: toStr(safeInput.targetIndustryId),
    targetJobLabel,
    targetIndustryLabel,
    majorDisplayLabel,
    certRoleRelevancePack: safeInput.certRoleRelevancePack && typeof safeInput.certRoleRelevancePack === "object"
      ? safeInput.certRoleRelevancePack
      : null,
    certificationsRaw: toArr(safeInput.certifications),
    projectsRaw: packProjectRows,
    internshipsRaw: normalizedInternshipsRaw,
    contractExperiencesRaw: normalizedCanonicalContractRaw,
    canonicalWorkRowsRaw: packCanonicalWorkRows,
  };

  normalized.strengths = _getSelfReportStrengthLabels(normalized);
  normalized.workStyleList = _getSelfReportWorkStyleLabels(normalized);
  normalized.canonicalStrengthKeys = _getSelfReportStrengthKeys(normalized);
  normalized.canonicalWorkStyleKeys = _getSelfReportWorkStyleKeys(normalized);
  normalized.interactionEligibleWorkStyleKeys = _getSelfReportInteractionEligibleKeys(normalized);
  normalized.interactionEligibleWorkStyleLabels =
    selfReportAxis4InteractionLabels.length > 0
      ? selfReportAxis4InteractionLabels
      : toArr(normalized.interactionEligibleWorkStyleLabels).map((item) => toStr(item)).filter(Boolean);
  normalized.axis4SupportStrengthLabels =
    selfReportAxis4SupportStrengthLabels.length > 0
      ? selfReportAxis4SupportStrengthLabels
      : toArr(normalized.axis4SupportStrengthLabels).map((item) => toStr(item)).filter(Boolean);

  const _targetSubVertical = getJobOntologyItemById(normalized.targetJobId)?.subVertical || "";

  const certSupport = _getCertSupport(normalized);
  const _domainInterestProfile = _getIndustryPrepProfile(normalized.targetIndustryId);
  const _domainInterestMajorStrength = _scoreIndustryMajorRelevance(_domainInterestProfile, normalized.major);
  const _domainInterestProjectSupportCount = _scoreIndustryProjectSupport(normalized.projectsRaw);
  const _domainInterestWorkContext = _classifyContextEvidence(normalized.canonicalWorkRowsRaw);
  const _domainInterestStrongContextCount = _domainInterestWorkContext.strongCount;
  const _domainInterestSupportContextCount = _domainInterestWorkContext.supportCount;
  const _domainInterestMajorAligned = _domainInterestMajorStrength >= 2;
  const _domainInterestCertificationsAligned = certSupport.supportCount > 0;
  const _domainInterestContextAligned = _domainInterestStrongContextCount > 0;
  const _domainInterestWeakProjectSignal = _domainInterestProjectSupportCount > 0;
  const _domainInterestInternContextStrength =
    _domainInterestStrongContextCount > 0
      ? "strong"
      : _domainInterestSupportContextCount > 0
        ? "support"
        : "none";

  // Axis 1 rich context ??recompute for signals (scoring already done above, these do not affect score)
  const _jobFitTargetMajor = _getJobMajorCategory(normalized.targetJobId);
  const _jobFitMajorDependencyProfile = getJobMajorDependencyProfile(normalized.targetJobId);
  const _jobFitMajorPrior = resolveNewgradAxis1MajorPrior(normalized.targetJobId, normalized.major);
  const _jobFitMajorMatchLevel = _normalizeMajorMatchLevel(_jobFitMajorPrior.label);
  const _jobFitMajorRelevant = _jobFitMajorPrior.final >= 2;
  const _jobFitProjectLevels = _jobFitTargetMajor
    ? normalized.projectRoles.map((r) => _scoreRoleMatch(_jobFitTargetMajor, r))
    : [];
  const _jobFitInternLevels = _jobFitTargetMajor
    ? normalized.internshipRoleFamilies.map((r) => _scoreRoleMatch(_jobFitTargetMajor, r))
    : [];
  const _jobFitProjectBest = _jobFitProjectLevels.length > 0 ? Math.max(..._jobFitProjectLevels) : 0;
  const _jobFitInternBest  = _jobFitInternLevels.length  > 0 ? Math.max(..._jobFitInternLevels)  : 0;
  const _jobFitProjectDirectCount = _jobFitProjectLevels.filter((l) => l >= 2).length;
  const _jobFitHasDirectRoleEvidence = _jobFitProjectDirectCount >= 1 || _jobFitInternLevels.some((l) => l >= 2);
  const _jobFitHasAdjacentRoleEvidence = _jobFitProjectBest >= 1 || _jobFitInternBest >= 1;
  const _jobFitCountOnlyFallbackUsed =
    !_jobFitTargetMajor
    || (
      !_jobFitMajorRelevant
      && _jobFitProjectBest === 0
      && _jobFitInternBest === 0
      && (
        normalized.projects.length > 0
        || normalized.internships.length > 0
        || normalized.coursework.length > 0
        || Boolean(normalized.major)
      )
    );

  // majorLinkType: major signal only ??project/internship signals must NOT bleed in here
  const _jobFitMajorLinkType = _jobFitMajorPrior.label === "direct" ? "direct" : "none";
  const _jobFitProjectBestLinkType =
    _jobFitProjectBest >= 2 ? "direct" : _jobFitProjectBest === 1 ? "adjacent" : "none";
  const _jobFitInternLinkType =
    _jobFitInternBest >= 2 ? "direct" : _jobFitInternBest === 1 ? "industry_only" : "none";

  const _jobFitDirectSources = [
    _jobFitMajorLinkType === "direct"       ? "major"       : null,
    _jobFitProjectBestLinkType === "direct" ? "project"     : null,
    _jobFitInternLinkType === "direct"      ? "internship"  : null,
  ].filter(Boolean);
  const _jobFitPrimaryEvidenceSource =
    _jobFitDirectSources.length >= 2 ? "mixed"
    : _jobFitDirectSources.length === 1 ? _jobFitDirectSources[0]
    : _jobFitCountOnlyFallbackUsed ? "fallback"
    : normalized.internships.length > 0 ? "internship"
    : normalized.projects.length > 0   ? "project"
    : Boolean(normalized.major)        ? "major"
    : "none";
  const _jobFitMajorAdjustment = _applyJobMajorDependencyToJobFit(_buildJobFitBaseScore(normalized).score, {
    dependencyTier: _jobFitMajorDependencyProfile.tier,
    majorMatchLevel: _jobFitMajorMatchLevel,
    hasDirectRoleEvidence: _jobFitHasDirectRoleEvidence,
    hasAdjacentRoleEvidence: _jobFitHasAdjacentRoleEvidence,
    majorPresent: Boolean(normalized.major),
  });
  const _jobFitMajorImpactSummary = _buildJobMajorImpactSummary({
    dependencyTier: _jobFitMajorDependencyProfile.tier,
    majorMatchLevel: _jobFitMajorMatchLevel,
    majorPresent: Boolean(normalized.major),
    majorWeightApplied: _jobFitMajorAdjustment.majorWeightApplied,
  });
  const _jobFitProjectRoleHighlights = firstUniqueLabels(normalized.projectRoleLabels, 2);
  const _jobFitInternRoleHighlights = firstUniqueLabels(normalized.internshipRoleLabels, 2);
  const _jobFitCourseworkHighlights = firstUniqueLabels(normalized.coursework, 1);
  const _jobFitExperienceHighlights = [
    ...prefixHighlights("???? ??", _jobFitProjectRoleHighlights, 2),
    ...prefixHighlights("??/?? ??", _jobFitInternRoleHighlights, 2),
  ].slice(0, 3);
  const _jobFitExperienceSupportLine =
    _jobFitProjectRoleHighlights.length > 0 && _jobFitInternRoleHighlights.length > 0
      ? `???? ??: ${joinLabels(_jobFitProjectRoleHighlights)} / ????? ??: ${joinLabels(_jobFitInternRoleHighlights)}. ?? ?? ??? ?? ?? ?? ?? ??? ????.`
      : _jobFitProjectRoleHighlights.length > 0
        ? `???? ??: ${joinLabels(_jobFitProjectRoleHighlights)}. ???? ?? ??? ?? ?? ?? ??? ????.`
        : _jobFitInternRoleHighlights.length > 0
          ? `????? ??: ${joinLabels(_jobFitInternRoleHighlights)}. ????? ?? ??? ?? ?? ?? ??? ????.`
          : "";

  const _jobFit         = makeAxis("전공과 직무의 연결성", scoreJobFit(normalized), {
    majorPresent:    Boolean(normalized.major),
    courseworkCount: normalized.coursework.length,
    projectCount:    normalized.projects.length,
    internshipCount: normalized.internships.length,
    // Axis 1 contextual signals ??append-only, do not affect scoring
    majorLinkType:          _jobFitMajorLinkType,
    majorPriorBase:         _jobFitMajorPrior.base,
    majorPriorOverride:     _jobFitMajorPrior.override,
    majorPriorFinal:        _jobFitMajorPrior.final,
    majorPriorLabel:        _jobFitMajorPrior.label,
    majorPriorExceptionAdjustment: _jobFitMajorPrior.exceptionAdjustment ?? 0,
    majorPriorResolutionMode:      _jobFitMajorPrior.resolutionMode ?? "single",
    majorPriorMatchedBy:           _jobFitMajorPrior.matchedBy ?? "base",
    majorMatchLevel:        _jobFitMajorMatchLevel,
    jobMajorDependency:     _jobFitMajorDependencyProfile.tier,
    majorWeightApplied:     _jobFitMajorAdjustment.majorWeightApplied,
    majorImportanceReason:  _jobFitMajorDependencyProfile.reason,
    majorImpactSummary:     _jobFitMajorImpactSummary,
    projectDirectCount:     _jobFitProjectDirectCount,
    projectBestLinkType:    _jobFitProjectBestLinkType,
    internshipLinkType:     _jobFitInternLinkType,
    countOnlyFallbackUsed:  _jobFitCountOnlyFallbackUsed,
    primaryEvidenceSource:  _jobFitPrimaryEvidenceSource,
    targetJobLabel:         normalized.targetJobLabel,
    targetIndustryLabel:    normalized.targetIndustryLabel,
    majorDisplayLabel:      normalized.majorDisplayLabel,
    courseworkRepresentativeLabel: _jobFitCourseworkHighlights[0] || "",
    projectRepresentativeLabel: _jobFitProjectRoleHighlights[0] || "",
    internshipRepresentativeLabel: _jobFitInternRoleHighlights[0] || "",
    projectRoleExperienceLabels: _jobFitProjectRoleHighlights,
    internshipRoleExperienceLabels: _jobFitInternRoleHighlights,
    experienceSupportLine:  _jobFitExperienceSupportLine,
    experienceHighlights:   _jobFitExperienceHighlights,
    experienceReason:       _jobFitProjectRoleHighlights.length > 0 || _jobFitInternRoleHighlights.length > 0
      ? "?? ?? ??? ??? ?? ??? ???? ?? ?? ??? ????."
      : "",
  }, "전공이 목표 직무의 핵심 역할과 얼마나 직접 연결되는지를 봅니다. 프로젝트·인턴 경험은 전공과 직무의 연결을 확인하는 보조 근거로 함께 활용됩니다.");

  const _domainInterestProjectHighlights = firstUniqueLabels(normalized.projectTypeLabels, 2);
  const _domainInterestInternTypeHighlights = firstUniqueLabels(normalized.internshipTypeLabels, 2);
  const _domainInterestStakeholderHighlights = firstUniqueLabels(normalized.interactionStakeholderLabels, 2);
  const _domainInterestExperienceHighlights = [
    ...prefixHighlights("???? ??", _domainInterestProjectHighlights, 1),
    ...prefixHighlights("????? ??", _domainInterestInternTypeHighlights, 1),
    ...prefixHighlights("?????", _domainInterestStakeholderHighlights, 1),
  ].slice(0, 3);
  const _domainInterestExperienceSupportLine =
    _domainInterestInternTypeHighlights.length > 0 && _domainInterestStakeholderHighlights.length > 0
      ? `????? ??: ${joinLabels(_domainInterestInternTypeHighlights)} / ?????: ${joinLabels(_domainInterestStakeholderHighlights)}. ?? ??? ??? ?? ??? ?? ????.`
      : _domainInterestProjectHighlights.length > 0 && _domainInterestStakeholderHighlights.length > 0
        ? `???? ??: ${joinLabels(_domainInterestProjectHighlights)} / ?????: ${joinLabels(_domainInterestStakeholderHighlights)}. ???? ??? ????? ??? ?? ?? ?? ??? ??? ????.`
        : _domainInterestProjectHighlights.length > 0
          ? `???? ??: ${joinLabels(_domainInterestProjectHighlights)}. ???? ??? ?? ??? ??? ????.`
          : _domainInterestStakeholderHighlights.length > 0
            ? `?????: ${joinLabels(_domainInterestStakeholderHighlights)}. ??? ??? ????? ?? ?? ?? ??? ????.`
            : _domainInterestInternTypeHighlights.length > 0
              ? `????? ??: ${joinLabels(_domainInterestInternTypeHighlights)}. ????? ??? ?? ??? ??? ????.`
              : "";

  const _domainInterest = makeAxis("산업 분야 이해도", scoreDomainInterest(normalized), {
    majorPresent:      Boolean(normalized.major),
    certificationCount: certSupport.eligibleCount,
    projectCount:      normalized.projectsRaw.length,
    internshipCount:   normalized.internshipsRaw.length,
    contractCount:     normalized.contractExperiencesRaw.length,
    majorAligned:      _domainInterestMajorAligned,
    certificationsAligned: _domainInterestCertificationsAligned,
    certDirectCount:   certSupport.alignedCount,
    certFamilyCapApplied: certSupport.familyCapApplied === true,
    projectIndustrySupportCount: _domainInterestProjectSupportCount,
    weakProjectSignal: _domainInterestWeakProjectSignal,
    internContextStrength: _domainInterestInternContextStrength,
    strongContextCount: _domainInterestStrongContextCount,
    supportContextCount: _domainInterestSupportContextCount,
    contextAligned:    _domainInterestContextAligned,
    targetIndustryLabel: normalized.targetIndustryLabel,
    majorDisplayLabel: normalized.majorDisplayLabel,
    certAlignedLabels: certAxis2AlignedLabels,
    certWeakLabels: certAxis2WeakLabels,
    projectTypeExperienceLabels: _domainInterestProjectHighlights,
    internshipTypeExperienceLabels: _domainInterestInternTypeHighlights,
    stakeholderExperienceLabels: _domainInterestStakeholderHighlights,
    experienceSupportLine: _domainInterestExperienceSupportLine,
    experienceHighlights: _domainInterestExperienceHighlights,
    experienceReason: _domainInterestProjectHighlights.length > 0 || _domainInterestInternTypeHighlights.length > 0 || _domainInterestStakeholderHighlights.length > 0
      ? "경험에서 직접 드러난 내용이 있어 산업 맥락 해석의 근거로 활용합니다."
      : "",
  }, "목표 산업에 대한 이해가 어느 정도 준비되어 있는지 봅니다. 전공, 프로젝트, 인턴, 자격증 등에서 산업 맥락이 얼마나 읽히는지가 중요합니다.");

  const _execDepthEvidenceGroupCount = countEvidenceGroups(
    normalized.projects,
    normalized.internships,
    normalized.extracurriculars,
    normalized.partTimeExperience
  );
  const _execDepthEvidenceItemCount = countEvidenceItems(
    normalized.projects,
    normalized.internships,
    normalized.extracurriculars,
    normalized.partTimeExperience
  );
  const _execDepthHasProjectInternshipCombo =
    normalized.projects.length > 0 && normalized.internships.length > 0;
  const _execDepthProjectOutcomeLift = _getProjectOutcomeLift(normalized.projectOutcomeRanks || []);
  const _execDepthDurationLift = _getDurationLift(normalized.experienceDurationRanks || []);
  const _execDepthSemanticLift = Math.min(2, _execDepthProjectOutcomeLift + _execDepthDurationLift);
  const _execDepthComboGuarded =
    _execDepthEvidenceGroupCount >= 2
      && _execDepthEvidenceItemCount >= 3
      && _execDepthHasProjectInternshipCombo
      && _execDepthProjectOutcomeLift < 2;
  const _execDepthProjectOutcomeLevel =
    _execDepthProjectOutcomeLift >= 2 ? "strong"
    : _execDepthProjectOutcomeLift === 1 ? "support"
    : "none";
  const _execDepthExperienceDurationLevel =
    _execDepthDurationLift >= 1 ? "long" : "none";
  const _execDepthEvidenceStrength =
    (_execDepthHasProjectInternshipCombo && _execDepthProjectOutcomeLift >= 2)
      || (_execDepthProjectOutcomeLift >= 1 && _execDepthDurationLift >= 1)
      || _execDepthSemanticLift >= 2
      ? "strong"
      : _execDepthProjectOutcomeLift >= 1
        || _execDepthDurationLift >= 1
        || _execDepthHasProjectInternshipCombo
        || _execDepthEvidenceGroupCount >= 2
        ? "mixed"
        : _execDepthEvidenceItemCount > 0
          ? "weak"
          : "none";
  const _execDepthOutcomeHighlights = firstUniqueLabels(normalized.projectOutcomeLabels, 2);
  const _execDepthDurationHighlights = firstUniqueLabels(normalized.experienceDurationLabels, 2);
  const _execDepthProjectRoleHighlights = firstUniqueLabels(normalized.projectRoleLabels, 2);
  const _execDepthInternTypeHighlights = firstUniqueLabels(normalized.internshipTypeLabels, 2);
  const _execDepthProjectSourceHighlights = firstUniqueLabels(normalized.projectSourceLabels, 2);
  const _execDepthWorkSourceHighlights = firstUniqueLabels(normalized.workSourceLabels, 2);
  const _execDepthExperienceHighlights = [
    ...prefixHighlights("???? ??", _execDepthOutcomeHighlights, 2),
    ...prefixHighlights("????? ??", _execDepthDurationHighlights, 2),
  ].slice(0, 3);
  const _execDepthExperienceSupportLine =
    _execDepthOutcomeHighlights.length > 0 && _execDepthDurationHighlights.length > 0
      ? `???? ??: ${joinLabels(_execDepthOutcomeHighlights)} / ????? ??: ${joinLabels(_execDepthDurationHighlights)}. ?? ??? ???? ?? ?? ?? ?? ??? ????.`
      : _execDepthOutcomeHighlights.length > 0
        ? `???? ??: ${joinLabels(_execDepthOutcomeHighlights)}. ?? ??? ?? ?? ?? ??? ????.`
        : _execDepthDurationHighlights.length > 0
          ? `????? ??: ${joinLabels(_execDepthDurationHighlights)}. ???? ?? ?? ?? ??? ????.`
          : "";

  const _execDepth      = makeAxis("이력·스펙·경험 연결성", scoreExecutionDepth(normalized), {
    projectCount:        normalized.projects.length,
    internshipCount:     normalized.internships.length,
    extracurricularCount: normalized.extracurriculars.length,
    partTimeCount:       normalized.partTimeExperience.length,
    evidenceGroupCount:  _execDepthEvidenceGroupCount,
    evidenceItemCount:   _execDepthEvidenceItemCount,
    projectOutcomeLevel: _execDepthProjectOutcomeLevel,
    experienceDurationLevel: _execDepthExperienceDurationLevel,
    comboEvidence:       _execDepthHasProjectInternshipCombo,
    comboGuarded:        _execDepthComboGuarded,
    semanticLift:        _execDepthSemanticLift,
    evidenceStrength:    _execDepthEvidenceStrength,
    targetJobLabel:      normalized.targetJobLabel,
    outcomeExperienceLabels: _execDepthOutcomeHighlights,
    durationExperienceLabels: _execDepthDurationHighlights,
    projectSourceLabels: _execDepthProjectSourceHighlights,
    workSourceLabels: _execDepthWorkSourceHighlights,
    projectRoleExperienceLabels: _execDepthProjectRoleHighlights,
    internshipTypeExperienceLabels: _execDepthInternTypeHighlights,
    experienceSupportLine: _execDepthExperienceSupportLine,
    experienceHighlights: _execDepthExperienceHighlights,
    experienceReason: _execDepthOutcomeHighlights.length > 0 || _execDepthDurationHighlights.length > 0
      ? "?? ??? ???? ?? ??? ?? ?? ???? ??? ?? ????."
      : "",
  }, "프로젝트, 인턴, 대외활동, 아르바이트 등 전공 외 경험이 얼마나 폭넓고, 결과와 지속성을 갖추고 있는지를 봅니다.");

  const _axis4Diagnostics = evaluateInteractionFit(normalized);
  const _interactionSupportTone =
    (Number(_axis4Diagnostics.interactionIntensitySummary.directCount || 0) + Number(_axis4Diagnostics.interactionIntensitySummary.ownerCount || 0)) > 0
      ? "strong"
      : "support";
  const _interactionStakeholderHighlights = firstUniqueLabels(
    _axis4Diagnostics.jobRelevantStakeholdersHit.allLabels.length > 0
      ? _axis4Diagnostics.jobRelevantStakeholdersHit.allLabels
      : _axis4Diagnostics.interactionEvidenceSummary.stakeholderLabels,
    3
  );
  const _axis4SourceStakeholderPhrases = firstUniqueLabels([
    ...packCanonicalWorkRows.map((row) => {
      const stakeholderLabel = toStr(row?.normalizedStakeholderLabel);
      if (!stakeholderLabel) return "";
      return buildSourceLabelPhrase(getExperienceSourcePrefix(row?.sourceKind), stakeholderLabel);
    }),
    ...packProjectRows.map((row) => {
      const stakeholderLabel = toStr(row?.normalizedStakeholderLabel);
      if (!stakeholderLabel) return "";
      return buildSourceLabelPhrase("프로젝트", stakeholderLabel);
    }),
  ], 2);
  const _axis4RoleEvidencePhrases = firstUniqueLabels([
    ...packCanonicalWorkRows.map((row) => {
      const roleLabel = toStr(row?.normalizedRoleLabel);
      if (!roleLabel) return "";
      return buildSourceLabelPhrase(getExperienceSourcePrefix(row?.sourceKind), roleLabel, " 역할");
    }),
    ...packProjectRows.map((row) => {
      const projectLabel = getProjectSourceLabel(row);
      if (!projectLabel) return "";
      return buildSourceLabelPhrase("프로젝트", projectLabel);
    }),
  ], 2);
  const _interactionExperienceSupportLine = toStr(_axis4Diagnostics.interactionEvidenceSummary.line);

  const _interactionFit = makeAxis("이해관계자 소통 적합성", _axis4Diagnostics.score, {
    internshipCount:     normalized.internships.length,
    projectCount:        normalized.projects.length,
    extracurricularCount: normalized.extracurriculars.length,
    partTimeCount:       normalized.partTimeExperience.length,
    workStyleNotesPresent: normalized.workStyleList.length > 0,
    interactionEligibleWorkStyleCount: normalized.interactionEligibleWorkStyleKeys.length,
    targetJobId: normalized.targetJobId,
    targetJobLabel: normalized.targetJobLabel,
    interactionEligibleWorkStyleLabels: firstLabels(normalized.interactionEligibleWorkStyleLabels),
    axis4SupportStrengthLabels: firstLabels(normalized.axis4SupportStrengthLabels),
    selfReportDirectApplied: _axis4Diagnostics.selfReportSupportLevel === "supporting",
    communicationCertLabels: firstLabels(_axis4Diagnostics.communicationCertLabels),
    communicationCertSupportApplied: _axis4Diagnostics.communicationCertSupportApplied === true,
    stakeholderExperienceLabels: _interactionStakeholderHighlights,
    sourceStakeholderPhrases: _axis4SourceStakeholderPhrases,
    roleEvidencePhrases: _axis4RoleEvidencePhrases,
    _interactionDirectStakeholderCount: Number(_axis4Diagnostics.interactionIntensitySummary.directCount || 0) + Number(_axis4Diagnostics.interactionIntensitySummary.ownerCount || 0),
    interactionSupportTone: _interactionSupportTone,
    experienceSupportLine: _interactionExperienceSupportLine,
    experienceHighlights: [
      ...prefixHighlights("이해관계자", _interactionStakeholderHighlights, 2),
      _axis4Diagnostics.missingImportantStakeholders.length > 0 ? `부족한 핵심 상대 ${joinLabels(_axis4Diagnostics.missingImportantStakeholders)}` : "",
    ].filter(Boolean).slice(0, 3),
    experienceReason: _axis4Diagnostics.relevanceMeta.rationale,
    jobRelevantStakeholdersHit: _axis4Diagnostics.jobRelevantStakeholdersHit,
    missingImportantStakeholders: _axis4Diagnostics.missingImportantStakeholders,
    interactionEvidenceSummary: _axis4Diagnostics.interactionEvidenceSummary,
    interactionIntensitySummary: _axis4Diagnostics.interactionIntensitySummary,
    axis4RelevanceMeta: _axis4Diagnostics.axis4RelevanceMeta,
    selfReportSupportLevel: _axis4Diagnostics.selfReportSupportLevel,
  }, "목표 직무에서 중요한 이해관계자와 얼마나 직접적으로 맞닿았고, 실제로 설명·조율·응대했는지를 봅니다.");

  const _axis5Matches = _countAxis5AlignedSignals(
    _getJobMajorCategory(normalized.targetJobId),
    normalized.canonicalStrengthKeys,
    normalized.canonicalWorkStyleKeys
  );
  const _axis5StrengthLabels = selfReportAxis5StrengthLabels.length > 0
    ? selfReportAxis5StrengthLabels
    : toArr(normalized.strengths).map((item) => toStr(item)).filter(Boolean);
  const _axis5WorkStyleLabels = selfReportAxis5WorkStyleLabels.length > 0
    ? selfReportAxis5WorkStyleLabels
    : toArr(normalized.workStyleList).map((item) => toStr(item)).filter(Boolean);
  const _softSkill      = makeAxis("강점과 재능", scoreSoftSkillMatch({
    ...normalized,
    strengths: normalized.canonicalStrengthKeys,
    workStyleList: normalized.canonicalWorkStyleKeys,
  }), {
    strengthsCount:       normalized.canonicalStrengthKeys.length,
    workStyleNotesPresent: normalized.canonicalWorkStyleKeys.length > 0,
    targetJobLabel: normalized.targetJobLabel,
    projectCount:         normalized.projects.length,
    internshipCount:      normalized.internships.length,
    matchedStrengthLabels: firstLabels(
      _axis5StrengthLabels.filter((label, index) => _axis5Matches.matchedStrengthKeys.includes(normalized.canonicalStrengthKeys[index]))
    ),
    matchedWorkStyleLabels: firstLabels(
      _axis5WorkStyleLabels.filter((label, index) => _axis5Matches.matchedWorkStyleKeys.includes(normalized.canonicalWorkStyleKeys[index]))
    ),
    selfReportAlignedDirectly: _axis5Matches.strengthsHits + _axis5Matches.workstyleHits > 0,
  }, "본인의 강점, 성향, 일하는 방식이 목표 직무의 성격과 얼마나 잘 맞는지를 봅니다.");

  const _axis1ComparisonBlock = buildAxis1ComparisonBlock(_jobFit.signals);
  const _axis2ComparisonBlock = buildAxis2ComparisonBlock(_domainInterest.signals);
  const _axis3ComparisonBlock = buildAxis3ComparisonBlock(_execDepth.signals);
  const _axis4ComparisonBlock = buildAxis4ComparisonBlock(_interactionFit.signals);
  const _axis5ComparisonBlock = buildAxis5ComparisonBlock(_softSkill.signals);
  const _axis1ComparisonCapabilityMeta = buildComparisonCapabilityMeta("axis1", _axis1ComparisonBlock.rows, _targetSubVertical);
  const _axis2ComparisonCapabilityMeta = buildComparisonCapabilityMeta("axis2", _axis2ComparisonBlock.rows, _targetSubVertical);
  const _axis3ComparisonCapabilityMeta = buildComparisonCapabilityMeta("axis3", _axis3ComparisonBlock.rows, _targetSubVertical);
  const _axis4ComparisonCapabilityMeta = buildComparisonCapabilityMeta("axis4", _axis4ComparisonBlock.rows, _targetSubVertical);
  const _axis5ComparisonCapabilityMeta = buildComparisonCapabilityMeta("axis5", _axis5ComparisonBlock.rows, _targetSubVertical);

  return {
    version: "newgrad.v1",
    axes: {
      jobStructure:        {
        ..._jobFit,
        comparisonBlock: {
          ..._axis1ComparisonBlock,
          whyThisDetailedReadMatters: getDetailedReadRationale("axis1", _targetSubVertical),
          primaryCapabilityId: _axis1ComparisonCapabilityMeta.primaryCapabilityId,
          secondaryCapabilityIds: _axis1ComparisonCapabilityMeta.secondaryCapabilityIds,
          capabilityLabels: _axis1ComparisonCapabilityMeta.capabilityLabels,
          capabilityLabelLine: _axis1ComparisonCapabilityMeta.capabilityLabelLine,
          capabilityWhyLine: _axis1ComparisonCapabilityMeta.capabilityWhyLine,
        },
        explanation: {
          ...buildNewgradJobFitExplanation(_jobFit.signals, _jobFit.band, buildAxis1SelectionPack(_jobFit.signals, _jobFit.band)),
          whyThisAxisMatters: getAxisJobRationale("axis1", _targetSubVertical),
        },
      },
      industryContext:     {
        ..._domainInterest,
        comparisonBlock: {
          ..._axis2ComparisonBlock,
          whyThisDetailedReadMatters: getDetailedReadRationale("axis2", _targetSubVertical),
          primaryCapabilityId: _axis2ComparisonCapabilityMeta.primaryCapabilityId,
          secondaryCapabilityIds: _axis2ComparisonCapabilityMeta.secondaryCapabilityIds,
          capabilityLabels: _axis2ComparisonCapabilityMeta.capabilityLabels,
          capabilityLabelLine: _axis2ComparisonCapabilityMeta.capabilityLabelLine,
          capabilityWhyLine: _axis2ComparisonCapabilityMeta.capabilityWhyLine,
        },
        explanation: {
          ...buildNewgradDomainInterestExplanation(_domainInterest.signals, _domainInterest.band, buildAxis2SelectionPack(_domainInterest.signals, _domainInterest.band)),
          whyThisAxisMatters: getAxisJobRationale("axis2", _targetSubVertical),
        },
      },
      responsibilityScope: {
        ..._execDepth,
        comparisonBlock: {
          ..._axis3ComparisonBlock,
          whyThisDetailedReadMatters: getDetailedReadRationale("axis3", _targetSubVertical),
          primaryCapabilityId: _axis3ComparisonCapabilityMeta.primaryCapabilityId,
          secondaryCapabilityIds: _axis3ComparisonCapabilityMeta.secondaryCapabilityIds,
          capabilityLabels: _axis3ComparisonCapabilityMeta.capabilityLabels,
          capabilityLabelLine: _axis3ComparisonCapabilityMeta.capabilityLabelLine,
          capabilityWhyLine: _axis3ComparisonCapabilityMeta.capabilityWhyLine,
        },
        explanation: {
          ...buildNewgradExecutionDepthExplanation(_execDepth.signals, _execDepth.band, buildAxis3SelectionPack(_execDepth.signals, _execDepth.band)),
          whyThisAxisMatters: getAxisJobRationale("axis3", _targetSubVertical),
        },
      },
      customerType:        {
        ..._interactionFit,
        comparisonBlock: {
          ..._axis4ComparisonBlock,
          whyThisDetailedReadMatters: getDetailedReadRationale("axis4", _targetSubVertical),
          primaryCapabilityId: _axis4ComparisonCapabilityMeta.primaryCapabilityId,
          secondaryCapabilityIds: _axis4ComparisonCapabilityMeta.secondaryCapabilityIds,
          capabilityLabels: _axis4ComparisonCapabilityMeta.capabilityLabels,
          capabilityLabelLine: _axis4ComparisonCapabilityMeta.capabilityLabelLine,
          capabilityWhyLine: _axis4ComparisonCapabilityMeta.capabilityWhyLine,
        },
        explanation: {
          ...buildNewgradInteractionFitExplanation(_interactionFit.signals, _interactionFit.band, buildAxis4SelectionPack(_interactionFit.signals, _interactionFit.band)),
          whyThisAxisMatters: getAxisJobRationale("axis4", _targetSubVertical),
        },
      },
      roleCharacter:       {
        ..._softSkill,
        comparisonBlock: {
          ..._axis5ComparisonBlock,
          whyThisDetailedReadMatters: getDetailedReadRationale("axis5", _targetSubVertical),
          primaryCapabilityId: _axis5ComparisonCapabilityMeta.primaryCapabilityId,
          secondaryCapabilityIds: _axis5ComparisonCapabilityMeta.secondaryCapabilityIds,
          capabilityLabels: _axis5ComparisonCapabilityMeta.capabilityLabels,
          capabilityLabelLine: _axis5ComparisonCapabilityMeta.capabilityLabelLine,
          capabilityWhyLine: _axis5ComparisonCapabilityMeta.capabilityWhyLine,
        },
        explanation: {
          ...buildNewgradSoftSkillMatchExplanation(_softSkill.signals, _softSkill.band, buildAxis5SelectionPack(_softSkill.signals, _softSkill.band)),
          whyThisAxisMatters: getAxisJobRationale("axis5", _targetSubVertical),
        },
      },
    },
  };
}

export default buildNewgradAxisPack;
