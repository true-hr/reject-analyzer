/**
 * Pure builder: deterministic VM to AI job-industry bridge payload contract.
 * No network calls, no AI calls, no side effects.
 */

import { getJobOntologyItemById } from "../../data/job/jobOntology.index.js";
import { getIndustryArchetype } from "../../data/transitionLite/industryArchetypeRegistry.js";
import { getNewgradAxis2JobIndustrySpecialization } from "../../data/transitionLite/newgradAxis2JobIndustrySpecializationRegistry.js";
import { classifyNewgradJobIndustryIntersection } from "./classifyNewgradJobIndustryIntersection.js";

const VERSION = "newgrad_job_industry_bridge_payload_v1";
const MAX_TEXT = 160;
const MAX_LABEL_COUNT = 3;
const MAX_ROW_COUNT = 3;
const MAX_GAP_COUNT = 3;
const MAX_SIGNAL_COUNT = 5;

function toStr(value) {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  return String(value).trim();
}

function toArr(value) {
  return Array.isArray(value) ? value : [];
}

function truncateText(value, max = MAX_TEXT) {
  const s = toStr(value);
  if (s.length <= max) return s;
  return s.slice(0, max).trimEnd() + "...";
}

function firstLabels(value, max = MAX_LABEL_COUNT) {
  return toArr(value)
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (!item || typeof item !== "object") return "";
      return toStr(
        item.label ||
          item.normalizedRoleLabel ||
          item.roleLabel ||
          item.normalizedTypeLabel ||
          item.displayLabel ||
          item.title ||
          item.name ||
          ""
      );
    })
    .filter(Boolean)
    .slice(0, max);
}

function extractInputSummary(resultVm, sourceInput) {
  const vi = resultVm?.validatedInput || {};
  const si = sourceInput && typeof sourceInput === "object" ? sourceInput : {};
  const profile = vi.selfReportProfile || {};

  return {
    major: toStr(vi.major || si.major),
    projectRoleLabels: firstLabels(vi.normalizedProjects || si.projects),
    internshipRoleLabels: firstLabels(vi.normalizedInternships || si.internships),
    certificationLabels: firstLabels(vi.certifications || si.certifications),
    strengthLabels: firstLabels(profile.normalizedStrengthLabels || si.strengths),
    workStyleLabels: firstLabels(profile.normalizedWorkStyleLabels || si.workStyleLabels),
  };
}

function resolveTarget(resultVm, sourceInput) {
  const si = sourceInput && typeof sourceInput === "object" ? sourceInput : {};
  const jobId = toStr(resultVm?.axisPack?.meta?.targetJobId || si.targetJobId);
  const jobLabel = toStr(resultVm?.targetJobDisplayLabel || si.targetJobLabel);
  const industryId = toStr(si.targetIndustryId);
  const industryLabel = toStr(resultVm?.targetIndustryDisplayLabel || si.targetIndustryLabel);

  let jobCategoryKey = "";
  let jobSubVertical = "";
  if (jobId) {
    const jobItem = getJobOntologyItemById(jobId);
    jobCategoryKey = toStr(jobItem?.majorCategory || jobItem?.categoryKey || jobItem?.majorKey);
    jobSubVertical = toStr(jobItem?.subVertical);
  }

  let industryArchetypeKey = "";
  if (industryLabel) {
    const archetype = getIndustryArchetype(industryLabel);
    industryArchetypeKey = toStr(archetype?.id);
  }

  return {
    jobId,
    jobLabel,
    jobCategoryKey,
    jobSubVertical,
    industryId,
    industryLabel,
    industryArchetypeKey,
  };
}

function extractIndustryContextAxis(axis) {
  if (!axis || typeof axis !== "object") return null;
  const rows = toArr(axis.comparisonBlock?.rows)
    .slice(0, MAX_ROW_COUNT)
    .map((row) => ({
      rowKey: toStr(row?.rowKey),
      label: toStr(row?.label || row?.itemLabel),
      itemLabel: toStr(row?.itemLabel || row?.label),
      verdictText: truncateText(row?.verdictText),
      evidenceText: truncateText(row?.evidenceText),
      limitText: truncateText(row?.limitText),
      actionHint: truncateText(row?.actionHint, 100),
      confidence: row?.confidence ?? null,
    }));

  return {
    axisKey: "industryContext",
    axisLabel: toStr(axis.label),
    band: toStr(axis.band),
    displayScore: axis.displayScore ?? null,
    currentRows: rows,
  };
}

function extractResponsibilityScopeAxis(axis, resultVm) {
  if (!axis || typeof axis !== "object") return null;
  const explanation = axis.explanation || {};
  const topRepairSignal = toArr(resultVm?.topRepairSignals).find(
    (signal) => signal?.axisKey === "responsibilityScope"
  );

  return {
    axisKey: "responsibilityScope",
    axisLabel: toStr(axis.label),
    band: toStr(axis.band),
    displayScore: axis.displayScore ?? null,
    currentSummary: truncateText(explanation.summary || explanation.body),
    whyThisAxisMatters: truncateText(explanation.whyThisAxisMatters || explanation.lead),
    gaps: toArr(explanation.gaps).slice(0, MAX_GAP_COUNT).map((gap) => truncateText(gap)),
    topRepairSignal: topRepairSignal
      ? {
          axisKey: toStr(topRepairSignal.axisKey),
          axisLabel: toStr(topRepairSignal.axisLabel),
          band: toStr(topRepairSignal.band),
          title: truncateText(topRepairSignal.title, 80),
          body: truncateText(topRepairSignal.body),
        }
      : null,
  };
}

function extractWeakOrMissingSignals(axisTargets) {
  const rowSignals = toArr(axisTargets?.industryContext?.currentRows)
    .flatMap((row) => [row.limitText, row.evidenceText])
    .map((text) => truncateText(text, 100))
    .filter(Boolean);
  const gapSignals = toArr(axisTargets?.responsibilityScope?.gaps)
    .map((text) => truncateText(text, 100))
    .filter(Boolean);
  return [...new Set([...rowSignals, ...gapSignals])].slice(0, MAX_SIGNAL_COUNT);
}

function buildDeterministicBridge(target, axisTargets) {
  let existingSpecializationFound = false;
  let specializationSource = "";

  if (target.industryArchetypeKey && target.jobSubVertical) {
    const spec = getNewgradAxis2JobIndustrySpecialization(
      target.industryArchetypeKey,
      target.jobSubVertical
    );
    existingSpecializationFound = Boolean(spec);
    specializationSource = existingSpecializationFound ? "axis2_job_industry_specialization" : "";
  }

  const intersectionProfile = classifyNewgradJobIndustryIntersection({
    archetypeId: target.industryArchetypeKey,
    targetJobSubVertical: target.jobSubVertical,
    specializationFound: existingSpecializationFound,
  });

  return {
    existingSpecializationFound,
    specializationSource,
    intersectionLevel: intersectionProfile.level,
    intersectionReasonCode: intersectionProfile.reasonCode,
    intersectionConfidence: intersectionProfile.confidence,
    isNaturalFit: intersectionProfile.isNaturalFit,
    shouldUseNeutralFallback: intersectionProfile.shouldUseNeutralFallback,
    shouldShowAiBridgeResult: intersectionProfile.shouldShowAiBridgeResult,
    roleInIndustry: "",
    industryVariablesForJob: [],
    importantEvidenceTypes: [],
    weakOrMissingSignals: extractWeakOrMissingSignals(axisTargets),
    goodNextExperiences: [],
  };
}

export function buildNewgradJobIndustryBridgePayload(resultVm, sourceInput = {}) {
  if (!resultVm || typeof resultVm !== "object") {
    return { version: VERSION, status: "skipped", skipReason: "missing_result_vm" };
  }

  const axes = resultVm?.axisPack?.axes;
  if (!axes || typeof axes !== "object") {
    return { version: VERSION, status: "skipped", skipReason: "missing_axes" };
  }

  const target = resolveTarget(resultVm, sourceInput);
  if (!(target.jobId || target.jobLabel) || !(target.industryId || target.industryLabel)) {
    return { version: VERSION, status: "skipped", skipReason: "missing_target_context" };
  }

  const industryContext = extractIndustryContextAxis(axes.industryContext);
  if (!industryContext) {
    return { version: VERSION, status: "skipped", skipReason: "missing_industry_context_axis" };
  }

  const axisTargets = {
    industryContext,
    responsibilityScope: extractResponsibilityScopeAxis(axes.responsibilityScope, resultVm),
  };

  return {
    version: VERSION,
    status: "ready",
    skipReason: "",
    target,
    inputSummary: extractInputSummary(resultVm, sourceInput),
    axisTargets,
    deterministicBridge: buildDeterministicBridge(target, axisTargets),
    guardContext: {
      noScoreChange: true,
      noBandChange: true,
      noExperienceGeneration: true,
      noAdmissionConclusion: true,
      axis1MajorToJobOnly: true,
      noUiAutoApply: true,
    },
  };
}
