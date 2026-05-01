import { getJobOntologyItemById } from "../../data/job/jobOntology.index.js";
import {
  getTransitionReadJobMeta,
  getTransitionReadJobMetaByJobItem,
} from "../../data/transitionLite/jobTransitionReadMetaRegistry.js";
import { buildJobContext } from "../adapters/buildJobContext.js";

function toStr(value) {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function normalizeId(value) {
  const normalized = toStr(value);
  return normalized || null;
}

function resolveJobItem(jobId) {
  const normalizedJobId = normalizeId(jobId);
  if (!normalizedJobId) return null;
  return getJobOntologyItemById(normalizedJobId) ?? null;
}

function resolveReadMeta(jobMeta, jobItem, jobId) {
  if (jobMeta && typeof jobMeta === "object" && !Array.isArray(jobMeta)) {
    return Object.freeze({
      family: toStr(jobMeta.family) || null,
      missionType: toStr(jobMeta.missionType) || null,
      outputType: toStr(jobMeta.outputType) || null,
      stakeholderPrimary: toStr(jobMeta.stakeholderPrimary) || null,
      successMetricType: toStr(jobMeta.successMetricType) || null,
      horizonType: toStr(jobMeta.horizonType) || null,
    });
  }

  if (jobItem) {
    return getTransitionReadJobMetaByJobItem(jobItem) ?? null;
  }

  if (jobId) {
    return getTransitionReadJobMeta(jobId) ?? null;
  }

  return null;
}

function getFamilyGroup(jobItem) {
  const majorCategory = toStr(jobItem?.majorCategory ?? jobItem?.vertical);
  return majorCategory || null;
}

function getSubFamilyId(jobMeta, jobItem) {
  const fromMeta = toStr(jobMeta?.family);
  if (fromMeta) return fromMeta;

  const fromFamily = Array.isArray(jobItem?.families)
    ? toStr(jobItem.families.find((family) => family && family.id)?.id)
    : "";
  if (fromFamily) return fromFamily;

  const fromRole = Array.isArray(jobItem?.roles)
    ? toStr(jobItem.roles.find((role) => role && role.family)?.family)
    : "";
  return fromRole || null;
}

function getAdjacentSubFamilyIds(jobItem) {
  if (!jobItem) return [];

  const context = buildJobContext(jobItem);
  return Array.isArray(context?.adjacentFamilyIds)
    ? context.adjacentFamilyIds.map((value) => toStr(value)).filter(Boolean)
    : [];
}

function resolveMissionPair(currentJobMeta, targetJobMeta) {
  const currentMission = toStr(currentJobMeta?.missionType);
  const targetMission = toStr(targetJobMeta?.missionType);
  if (!currentMission || !targetMission) return null;
  return `${currentMission}->${targetMission}`;
}

function resolveFieldEquality(leftValue, rightValue) {
  const left = toStr(leftValue);
  const right = toStr(rightValue);
  if (!left || !right) return null;
  return left === right;
}

function hasAdjacentFamilyRelation(currentJobItem, currentSubFamily, targetJobItem, targetSubFamily) {
  const currentAdjacentIds = getAdjacentSubFamilyIds(currentJobItem);
  const targetAdjacentIds = getAdjacentSubFamilyIds(targetJobItem);

  if (targetSubFamily && currentAdjacentIds.includes(targetSubFamily)) return true;
  if (currentSubFamily && targetAdjacentIds.includes(currentSubFamily)) return true;
  return false;
}

function resolveMainPattern(debug) {
  if (debug.exactSame) return "SAME_ROLE_EXACT";
  if (debug.missionPair === "select_people->develop_people") {
    return "SELECTION_TO_DEVELOPMENT";
  }
  if (debug.missionPair === "operate->plan") return "OPERATION_TO_PLAN";
  if (debug.missionPair === "plan->operate") return "PLAN_TO_OPERATION";
  if (debug.sameFamily && (debug.sameSubFamily || debug.missionSame)) {
    return "SAME_FAMILY_NEAR";
  }
  if (debug.sameFamily) return "SAME_FAMILY_DIFFERENT_FOCUS";
  if (debug.adjacentFamily) return "ADJACENT_FAMILY";
  return "CROSS_FAMILY";
}

function resolveSupportPatterns(debug) {
  const patterns = [];

  if (debug.missionPair === "develop_people->select_people") {
    patterns.push("DEVELOPMENT_TO_SELECTION");
  }

  if (debug.outputSame === true) patterns.push("OUTPUT_SIMILAR");
  if (debug.outputSame === false) patterns.push("OUTPUT_DIFFERENT");

  if (debug.stakeholderSame === true) patterns.push("STAKEHOLDER_SIMILAR");
  if (debug.stakeholderSame === false) patterns.push("STAKEHOLDER_DIFFERENT");

  if (debug.metricSame === true) patterns.push("METRIC_SIMILAR");
  if (debug.metricSame === false) patterns.push("METRIC_DIFFERENT");

  if (debug.horizonSame === false) patterns.push("HORIZON_DIFFERENT");

  return patterns.slice(0, 4);
}

export function selectTopSupportPatterns(patterns = [], maxCount = 3) {
  const priority = Object.freeze({
    DEVELOPMENT_TO_SELECTION: 1,
    OUTPUT_SIMILAR: 2,
    OUTPUT_DIFFERENT: 2,
    STAKEHOLDER_SIMILAR: 3,
    STAKEHOLDER_DIFFERENT: 3,
    METRIC_SIMILAR: 4,
    METRIC_DIFFERENT: 4,
    HORIZON_DIFFERENT: 5,
  });

  return [...new Set((Array.isArray(patterns) ? patterns : []).filter(Boolean))]
    .sort((left, right) => {
      const leftRank = priority[left] ?? 99;
      const rightRank = priority[right] ?? 99;
      if (leftRank !== rightRank) return leftRank - rightRank;
      return left.localeCompare(right);
    })
    .slice(0, Math.max(0, maxCount));
}

export function classifyTransitionReadPatterns(currentJobMeta, targetJobMeta, options = {}) {
  try {
    const currentJobId = normalizeId(options.currentJobId);
    const targetJobId = normalizeId(options.targetJobId);
    const currentJobItem = options.currentJobItem ?? resolveJobItem(currentJobId);
    const targetJobItem = options.targetJobItem ?? resolveJobItem(targetJobId);
    const resolvedCurrentJobMeta = resolveReadMeta(currentJobMeta, currentJobItem, currentJobId);
    const resolvedTargetJobMeta = resolveReadMeta(targetJobMeta, targetJobItem, targetJobId);

    const debug = {
      exactSame: Boolean(currentJobId && targetJobId && currentJobId === targetJobId),
      sameFamily: false,
      sameSubFamily: false,
      missionPair: null,
      missionSame: null,
      outputSame: null,
      stakeholderSame: null,
      metricSame: null,
      horizonSame: null,
      adjacentFamily: false,
      currentFamily: getFamilyGroup(currentJobItem),
      targetFamily: getFamilyGroup(targetJobItem),
      currentSubFamily: getSubFamilyId(resolvedCurrentJobMeta, currentJobItem),
      targetSubFamily: getSubFamilyId(resolvedTargetJobMeta, targetJobItem),
    };

    debug.sameFamily = Boolean(
      debug.currentFamily &&
      debug.targetFamily &&
      debug.currentFamily === debug.targetFamily
    );
    debug.sameSubFamily = Boolean(
      debug.currentSubFamily &&
      debug.targetSubFamily &&
      debug.currentSubFamily === debug.targetSubFamily
    );
    debug.missionPair = resolveMissionPair(resolvedCurrentJobMeta, resolvedTargetJobMeta);
    debug.missionSame = resolveFieldEquality(
      resolvedCurrentJobMeta?.missionType,
      resolvedTargetJobMeta?.missionType
    );
    debug.outputSame = resolveFieldEquality(
      resolvedCurrentJobMeta?.outputType,
      resolvedTargetJobMeta?.outputType
    );
    debug.stakeholderSame = resolveFieldEquality(
      resolvedCurrentJobMeta?.stakeholderPrimary,
      resolvedTargetJobMeta?.stakeholderPrimary
    );
    debug.metricSame = resolveFieldEquality(
      resolvedCurrentJobMeta?.successMetricType,
      resolvedTargetJobMeta?.successMetricType
    );
    debug.horizonSame = resolveFieldEquality(
      resolvedCurrentJobMeta?.horizonType,
      resolvedTargetJobMeta?.horizonType
    );
    debug.adjacentFamily = hasAdjacentFamilyRelation(
      currentJobItem,
      debug.currentSubFamily,
      targetJobItem,
      debug.targetSubFamily
    );

    const metaMissing = !resolvedCurrentJobMeta || !resolvedTargetJobMeta;
    const mainPattern = resolveMainPattern(debug);
    const supportPatterns = metaMissing ? [] : resolveSupportPatterns(debug);

    return {
      mainPattern,
      supportPatterns,
      topSupportPatterns: selectTopSupportPatterns(supportPatterns),
      debug: metaMissing
        ? {
            ...debug,
            reason: "job_meta_missing",
          }
        : debug,
    };
  } catch {
    return {
      mainPattern: "CROSS_FAMILY",
      supportPatterns: [],
      topSupportPatterns: [],
      debug: {
        exactSame: false,
        sameFamily: false,
        sameSubFamily: false,
        missionPair: null,
        outputSame: null,
        stakeholderSame: null,
        metricSame: null,
        horizonSame: null,
        reason: "classifier_error",
      },
    };
  }
}

export function getTransitionReadPatternResult(currentJobId, targetJobId) {
  const normalizedCurrentJobId = normalizeId(currentJobId);
  const normalizedTargetJobId = normalizeId(targetJobId);
  const currentJobItem = resolveJobItem(normalizedCurrentJobId);
  const targetJobItem = resolveJobItem(normalizedTargetJobId);

  return classifyTransitionReadPatterns(
    getTransitionReadJobMetaByJobItem(currentJobItem),
    getTransitionReadJobMetaByJobItem(targetJobItem),
    {
      currentJobId: normalizedCurrentJobId,
      targetJobId: normalizedTargetJobId,
      currentJobItem,
      targetJobItem,
    }
  );
}
