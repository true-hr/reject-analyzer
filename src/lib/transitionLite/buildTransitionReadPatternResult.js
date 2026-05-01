import { getTransitionReadPatternResult } from "./classifyTransitionReadPatterns.js";

function toStr(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

export function buildTransitionReadPatternResult({
  currentJobId,
  targetJobId,
} = {}) {
  const normalizedCurrentJobId = toStr(currentJobId);
  const normalizedTargetJobId = toStr(targetJobId);

  const result = getTransitionReadPatternResult(
    normalizedCurrentJobId,
    normalizedTargetJobId
  );

  return {
    mainPattern: toStr(result?.mainPattern) || "CROSS_FAMILY",
    supportPatterns: Array.isArray(result?.supportPatterns)
      ? result.supportPatterns.filter(Boolean)
      : [],
    topSupportPatterns: Array.isArray(result?.topSupportPatterns)
      ? result.topSupportPatterns.filter(Boolean)
      : [],
    debug:
      result && typeof result.debug === "object" && result.debug
        ? result.debug
        : {
            reason: "pattern_result_missing",
          },
  };
}
