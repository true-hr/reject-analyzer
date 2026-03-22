import { JUDGMENT_REGISTRY } from "./registry.js";
import { JUDGMENT_STATUS } from "./judgmentTypes.js";

function __defaultItem(key) {
  return {
    key,
    status: JUDGMENT_STATUS.UNAVAILABLE,
    confidence: null,
    sourceFamily: "fallback",
    why: null,
    context: null,
    proofFor: [],
    proofMissing: [],
    actionHint: null,
  };
}

export function buildJudgmentPack(context = {}) {
  const items = {};

  for (const entry of JUDGMENT_REGISTRY) {
    try {
      const item = entry.build(context);
      items[entry.key] = item && typeof item === "object" ? { ...__defaultItem(entry.key), ...item, key: entry.key } : __defaultItem(entry.key);
    } catch {
      items[entry.key] = __defaultItem(entry.key);
    }
  }

  const emittedKeys = Object.keys(items).filter((key) => items[key]?.status === JUDGMENT_STATUS.READY || items[key]?.status === JUDGMENT_STATUS.PARTIAL);
  const unavailableKeys = Object.keys(items).filter((key) => items[key]?.status === JUDGMENT_STATUS.UNAVAILABLE);

  return {
    version: "judgment-pack-v1",
    status: emittedKeys.length > 0 ? "ready" : "unavailable",
    items,
    ranking: {
      headline: ["interviewReadRisk", "targetRoleFit", "industryContinuity"],
      topRisks: ["interviewReadRisk", "targetRoleFit", "industryContinuity", "evidenceDensity", "transitionReadiness"],
    },
    diagnostics: {
      emittedKeys,
      unavailableKeys,
    },
  };
}

