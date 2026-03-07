// src/lib/decision/riskProfiles/executionImpact/executionImpactGapRisk.js
// representative non-gate risk for execution/impact evidence gap

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toStr(v) {
  try {
    return (v ?? "").toString();
  } catch {
    return "";
  }
}

function isObj(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function clamp01(v) {
  const n = toNum(v, 0);
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function hasFlag(flags, id) {
  const arr = Array.isArray(flags) ? flags : [];
  const key = toStr(id);
  return arr.some((f) => {
    if (typeof f === "string") return f === key;
    return toStr(f?.id) === key;
  });
}

function getEvidence(ctx) {
  const ce = isObj(ctx?.competencyExpectation) ? ctx.competencyExpectation : {};
  const ceEvidence = isObj(ce?.evidence) ? ce.evidence : {};
  const metrics = isObj(ctx?.structural?.metrics) ? ctx.structural.metrics : {};
  const flags = Array.isArray(ctx?.structural?.flags)
    ? ctx.structural.flags
    : Array.isArray(ctx?.flags)
      ? ctx.flags
      : [];
  const minNumbers = toNum(metrics.minNumbersCount, 1);
  const minImpactVerbs = toNum(metrics.minImpactVerbs, 2);

  const noQuantifiedImpact =
    ceEvidence.IMPACT__NO_QUANTIFIED_IMPACT === true ||
    hasFlag(flags, "NO_QUANTIFIED_IMPACT") ||
    toNum(metrics.numbersCount, 0) < minNumbers;

  const lowImpactVerbs =
    ceEvidence.IMPACT__LOW_IMPACT_VERBS === true ||
    hasFlag(flags, "LOW_IMPACT_VERB_PATTERN") ||
    toNum(metrics.impactVerbCount, 0) < minImpactVerbs;

  const processOnly =
    ceEvidence.IMPACT__PROCESS_ONLY === true ||
    hasFlag(flags, "PROCESS_ONLY_PATTERN") ||
    (Array.isArray(metrics.processOnlySignals) && metrics.processOnlySignals.length >= 2);

  const row = {
    IMPACT__NO_QUANTIFIED_IMPACT: noQuantifiedImpact,
    IMPACT__LOW_IMPACT_VERBS: lowImpactVerbs,
    IMPACT__PROCESS_ONLY: processOnly,
  };
  const hitKeys = Object.keys(row).filter((k) => row[k] === true);

  return { row, hitKeys, hitCount: hitKeys.length };
}

function scoreByHitCount(hitCount) {
  if (hitCount >= 3) return 0.78;
  if (hitCount >= 2) return 0.56;
  return 0;
}

export const executionImpactGapRisk = {
  id: "RISK__EXECUTION_IMPACT_GAP",
  title: "Execution / impact expectation gap",
  group: "impactEvidence",
  layer: "hireability",
  priority: 91,
  when: (ctx) => {
    const ce = isObj(ctx?.competencyExpectation) ? ctx.competencyExpectation : {};
    if (ce?.executionExpected !== true) return false;
    const ev = getEvidence(ctx);
    return ev.hitCount >= 2;
  },
  score: (ctx) => {
    const ev = getEvidence(ctx);
    return clamp01(scoreByHitCount(ev.hitCount));
  },
  explain: (ctx) => {
    const ev = getEvidence(ctx);
    return {
      title: "Execution / impact expectation gap",
      why: [
        "Role/JD context implies execution and measurable impact expectation.",
        `Impact evidence shortage signals were combined (${ev.hitCount} sources).`,
      ],
      signals: ev.hitKeys,
      action: [
        "Rewrite bullets with outcome structure: action + measurable change + business effect.",
        "Add at least one quantified result (%/count/time/cost/quality) for each key project.",
      ],
      counter: [
        "If recent projects include clear metrics and impact verbs, this risk can fall quickly.",
      ],
    };
  },
};

export default executionImpactGapRisk;
