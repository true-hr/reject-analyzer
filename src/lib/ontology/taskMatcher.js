// src/lib/ontology/taskMatcher.js
// PASSMAP Task Ontology v1.1 matcher (precision patch)

import { TASK_ONTOLOGY_V1, TASK_ONTOLOGY_V1_BY_ID } from "./taskOntology.js";

function clamp01(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function toStr(v) {
  return v == null ? "" : String(v);
}

function norm(v) {
  return toStr(v).toLowerCase().replace(/\s+/g, " ").trim();
}

function compact(v) {
  return norm(v).replace(/[^0-9a-z가-힣%-]/g, "");
}

function splitLines(text) {
  return toStr(text)
    .split(/\r?\n|[.!?]\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function hasAny(text, cues) {
  const t = norm(text);
  if (!t) return false;
  for (const cue of (Array.isArray(cues) ? cues : [])) {
    const q = norm(cue);
    if (q && t.includes(q)) return true;
  }
  return false;
}

function allTextFrom(value) {
  if (value == null) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(allTextFrom);
  if (typeof value === "object") {
    const out = [];
    for (const k of Object.keys(value)) out.push(...allTextFrom(value[k]));
    return out;
  }
  return [String(value)];
}

function asParsedJdSegments(parsedJd) {
  const pj = parsedJd && typeof parsedJd === "object" ? parsedJd : {};
  const pushSegs = (source, value, bucket) => {
    for (const s of allTextFrom(value)) {
      const text = toStr(s).trim();
      if (text) bucket.push({ source, text });
    }
  };
  const segs = [];
  pushSegs("must", pj.mustHave, segs);
  pushSegs("core", pj.coreTasks || pj.keyResponsibilities || pj.mainTasks, segs);
  pushSegs("supporting", pj.tasks, segs);
  pushSegs("preferred", pj.preferred, segs);
  return segs;
}

function __isLikelyJdMetaLine(text) {
  const raw = toStr(text).trim();
  const t = norm(raw);
  if (!t) return true;
  if (t.length <= 2) return true;
  if (/^(?:\uD3EC\uC9C0\uC158|\uC9C1\uBB34|\uC18C\uC18D|\uBD80\uC11C|\uD300|\uC8FC\uC694 \uC5C5\uBB34|\uB2F4\uB2F9 \uC5C5\uBB34|must-have|preferred|\uC790\uACA9\uC694\uAC74|\uC790\uACA9 \uC694\uAC74|\uC6B0\uB300\uC0AC\uD56D|\uC6B0\uB300 \uC0AC\uD56D)\s*[:\uFF1A]?$/.test(t)) return true;
  if (/^(?:\uC804\uB7B5\uAE30\uD68D \uB2F4\uB2F9|\uC0AC\uC5C5\uAE30\uD68D \uB2F4\uB2F9|\uC6B4\uC601\uAE30\uD68D \uB9E4\uB2C8\uC800|\uC804\uB7B5\uAE30\uD68D\uD300|\uC804\uB7B5\uAE30\uD68D\uD300 \| \uC804\uB7B5\uAE30\uD68D \uB2F4\uB2F9.*)$/.test(t)) return true;
  if (!/\s/.test(raw) && raw.length <= 12) return true;
  return false;
}

function __buildStrategyPlanningSeedSegments(jdText) {
  const lines = toStr(jdText)
    .split(/\r?\n/)
    .map((line) => toStr(line).trim())
    .filter(Boolean);

  const seeds = [];
  const seen = new Set();
  const pushSeed = (taskId, line) => {
    if (!TASK_ONTOLOGY_V1_BY_ID[taskId]) return;
    const text = toStr(line).trim();
    if (!text) return;
    const key = `${taskId}::${compact(text)}`;
    if (!key || seen.has(key)) return;
    seen.add(key);
    seeds.push({ source: "core", text, __seedTaskId: taskId });
  };

  for (const line of lines) {
    const t = norm(line);
    if (!t) continue;
    if (__isLikelyJdMetaLine(line)) continue;

    if (t.includes("\uC2DC\uC7A5") && t.includes("\uACBD\uC7C1\uC0AC") && t.includes("\uBD84\uC11D")) {
      pushSeed("TASK__MARKET_RESEARCH", line);
    }
    if (t.includes("\uC0AC\uC5C5 \uAE30\uD68C") && t.includes("\uBC1C\uAD74")) {
      pushSeed("TASK__STRATEGY_PLANNING", line);
    }
    if (t.includes("\uC911\uC7A5\uAE30") && t.includes("\uC804\uB7B5 \uACFC\uC81C") && (t.includes("\uB3C4\uCD9C") || t.includes("\uC218\uB9BD"))) {
      pushSeed("TASK__STRATEGY_PLANNING", line);
    }
    if (
      (t.includes("\uC2E4\uD589 \uB85C\uB4DC\uB9F5") && t.includes("\uC218\uB9BD")) ||
      (t.includes("\uB85C\uB4DC\uB9F5") && t.includes("\uC218\uB9BD"))
    ) {
      pushSeed("TASK__ROADMAP_PLANNING", line);
    }
    if ((t.includes("kpi") || t.includes("\uC2E4\uC801")) && t.includes("\uBD84\uC11D")) {
      pushSeed("TASK__DATA_ANALYSIS", line);
      pushSeed("TASK__KPI_DESIGN", line);
    }
    if (t.includes("\uACBD\uC601\uC9C4") && (t.includes("\uBCF4\uACE0\uC790\uB8CC") || t.includes("\uBCF4\uACE0"))) {
      pushSeed("TASK__DASHBOARD_REPORTING", line);
    }
    if (t.includes("\uC720\uAD00") && t.includes("\uD611\uC5C5") && t.includes("\uC804\uB7B5 \uC2E4\uD589")) {
      pushSeed("TASK__STRATEGY_EXECUTION_SUPPORT", line);
      pushSeed("TASK__STAKEHOLDER_COMMUNICATION", line);
    }
  }

  return seeds;
}

const IMPORTANCE_RANK = { must: 5, core: 4, supporting: 3, preferred: 2, context: 1 };

function resolveImportance(source, text) {
  const t = norm(text);
  if (source === "must" || /(필수|required|must|mandatory)/.test(t)) return "must";
  if (source === "core" || /(핵심|주요업무|responsibilit)/.test(t)) return "core";
  if (source === "supporting" || /(담당|수행)/.test(t)) return "supporting";
  if (source === "preferred" || /(우대|preferred|nice\s*to\s*have)/.test(t)) return "preferred";
  return "context";
}

function matchTaskHitInText(text, task) {
  const tNorm = norm(text);
  const tCompact = compact(text);
  if (!tNorm || !tCompact) return { hit: false, broadOnly: false, matchedBy: "none" };

  const synHit = (Array.isArray(task.synonyms) ? task.synonyms : [])
    .map((x) => compact(x))
    .filter(Boolean)
    .some((q) => tCompact.includes(q));

  const broadHit = (Array.isArray(task.broadAliases) ? task.broadAliases : [])
    .map((x) => compact(x))
    .filter(Boolean)
    .some((q) => tCompact.includes(q));

  const negativeHit = (Array.isArray(task.negativeCues) ? task.negativeCues : [])
    .map((x) => compact(x))
    .filter(Boolean)
    .some((q) => tCompact.includes(q));

  if (negativeHit && !synHit) return { hit: false, broadOnly: false, matchedBy: "negative" };
  if (synHit) return { hit: true, broadOnly: false, matchedBy: "synonym" };
  if (broadHit) return { hit: true, broadOnly: true, matchedBy: "broad" };
  return { hit: false, broadOnly: false, matchedBy: "none" };
}

const __KOREAN_IMPACT_OUTCOME_CUES = [
  "\uC808\uAC10",
  "\uAC1C\uC120",
  "\uAC1C\uC120\uC548",
  "\uC99D\uAC00",
  "\uAC10\uC18C",
  "\uD5A5\uC0C1",
  "\uD6A8\uC728\uD654",
  "\uCD5C\uC801\uD654",
  "\uACE0\uB3C4\uD654",
  "\uB3C4\uCD9C",
  "\uCC3D\uCD9C",
  "\uC218\uC775\uC131",
];

const __METRIC_NOUN_CUES = [
  "roi",
  "kpi",
  "cac",
  "\uC804\uD658\uC728",
  "\uB9E4\uCD9C",
  "\uBE44\uC6A9",
  "\uB9AC\uB4DC\uD0C0\uC784",
  "\uC0DD\uC0B0\uC131",
  "\uC2E4\uC801",
  "\uC131\uACFC",
];

const __PERIOD_OR_VOLUME_CUES = [
  "\uC6D4\uAC04",
  "\uBD84\uAE30",
  "\uC5F0\uAC04",
  "\uBA85",
  "\uAC1C",
  "\uAC74",
  "\uD68C",
  "\uC6D0",
  "\uB9CC\uC6D0",
  "\uC5B5",
];

function __hasMetricRegex(text) {
  const t = norm(text);
  if (!t) return false;
  return /(\d+(\.\d+)?\s*%|\d{1,3}(,\d{3})+|\d+\s*(days?|months?|years?|\uBA85|\uAC1C|\uAC74|\uD68C|\uB9CC\uC6D0|\uC5B5|\uC6D0))/.test(t);
}

function __hasImpactMetricCombo(text) {
  const t = norm(text);
  if (!t) return false;
  const hasImpactCue = __hasCue(t, __KOREAN_IMPACT_OUTCOME_CUES) || __hasCue(t, __IMPACT_EVIDENCE_CUES);
  const hasMetricCue = __hasCue(t, __METRIC_NOUN_CUES) || /\b(roi|kpi|cac)\b/.test(t);
  const hasMetricRegex = __hasMetricRegex(t);
  const hasPeriodOrVolumeCue = __hasCue(t, __PERIOD_OR_VOLUME_CUES);
  return (
    (hasImpactCue && (hasMetricRegex || hasMetricCue || hasPeriodOrVolumeCue)) ||
    (hasMetricCue && hasMetricRegex) ||
    (hasMetricCue && hasImpactCue)
  );
}

function detectBoosterStrength(text, task) {
  const t = norm(text);
  const b = task?.strengthBoosters || {};
  const outcome = hasAny(t, b.outcome) ? 1 : 0;
  const metricRegexHit = /(\d+(\.\d+)?\s*%|\d{1,3}(,\d{3})+|\d+\s*(명|건|회|개|원|만원|억원|days?|months?|years?))/i.test(t) ? 1 : 0;
  const metric = hasAny(t, b.metric) || metricRegexHit ? 1 : 0;
  const deliverable = hasAny(t, b.deliverable) ? 1 : 0;
  const ownership = hasAny(t, b.ownership) ? 1 : 0;
  return { outcome, metric, deliverable, ownership };
}

const __WEAK_SUPPORT_CUES = [
  "\uC9C0\uC6D0",
  "\uBCF4\uC870",
  "\uC791\uC131 \uC9C0\uC6D0",
  "\uC791\uC131 \uBCF4\uC870",
  "\uC790\uB8CC \uC870\uC0AC",
  "\uC790\uB8CC \uC815\uB9AC",
  "\uD68C\uC758 \uC790\uB8CC \uC900\uBE44",
  "\uCDE8\uD569",
  "\uB9AC\uC11C\uCE58 \uC218\uD589",
  "\uC6B4\uC601 \uC9C0\uC6D0",
  "\uD611\uC5C5 \uC9C0\uC6D0",
  "\uCC38\uC5EC",
  "\uAC80\uD1A0 \uC9C0\uC6D0",
];

const __OWNERSHIP_ACTION_CUES = [
  "\uC8FC\uB3C4",
  "\uB9AC\uB529",
  "\uB9AC\uB4DC",
  "\uCC45\uC784",
  "end-to-end",
  "e2e",
];

const __STRONG_ACTION_CUES = [
  "\uC218\uB9BD",
  "\uB3C4\uCD9C",
  "\uC2E4\uD589",
  "\uC124\uACC4",
  "\uAD6C\uCD95",
  "\uAC1C\uC120\uC548 \uC81C\uC2DC",
  "\uBCF4\uACE0",
  "\uBD84\uC11D \uC218\uD589",
  "\uD504\uB85C\uC81D\uD2B8 \uC8FC\uB3C4",
  "\uC131\uACFC \uCC3D\uCD9C",
];

const __DELIVERABLE_CUES = [
  "\uBCF4\uACE0\uC11C",
  "\uBCF4\uACE0\uC790\uB8CC",
  "\uBCF4\uACE0",
  "\uB300\uC2DC\uBCF4\uB4DC",
  "\uB85C\uB4DC\uB9F5",
  "\uC81C\uC548",
  "\uB9AC\uD3EC\uD2B8",
  "ppt",
  "powerpoint",
];

const __IMPACT_EVIDENCE_CUES = [
  "\uAC1C\uC120",
  "\uAC1C\uC120\uC548",
  "\uC99D\uAC00",
  "\uAC10\uC18C",
  "\uC808\uAC10",
  "\uD6A8\uC728\uD654",
  "\uC131\uACFC",
  "\uC218\uC775\uC131",
  "roi",
  "kpi",
];

__IMPACT_EVIDENCE_CUES.push(
  "\uD5A5\uC0C1",
  "\uCD5C\uC801\uD654",
  "\uACE0\uB3C4\uD654",
  "\uB3C4\uCD9C",
  "\uCC3D\uCD9C",
  "\uC804\uD658\uC728",
  "\uB9E4\uCD9C",
  "\uBE44\uC6A9",
  "\uB9AC\uB4DC\uD0C0\uC784",
  "\uC0DD\uC0B0\uC131",
);

const __DECISION_OR_LEADERSHIP_CUES = [
  "\uC218\uB9BD",
  "\uB3C4\uCD9C",
  "\uC8FC\uB3C4",
  "\uB9AC\uB529",
  "\uBCF4\uACE0",
  "\uC81C\uC2DC",
  "\uC758\uC0AC\uACB0\uC815",
];

function __hasCue(text, cues) {
  const t = norm(text);
  if (!t) return false;
  return (Array.isArray(cues) ? cues : []).some((cue) => {
    const q = norm(cue);
    return q && t.includes(q);
  });
}

function __buildEvidenceProfile(text, boost) {
  const t = norm(text);
  const metricRegexHit = /(\d+(\.\d+)?\s*%|\d{1,3}(,\d{3})+|\d+\s*(days?|months?|years?|\uBA85|\uAC1C|\uAC74|\uB9CC\uC6D0|\uC5B5|\uC6D0))/.test(t);
  return {
    hasWeakSupportVerb: __hasCue(t, __WEAK_SUPPORT_CUES),
    hasOwnershipVerb: __hasCue(t, __OWNERSHIP_ACTION_CUES) || Number(boost?.ownership) > 0,
    hasStrongActionCue: __hasCue(t, __STRONG_ACTION_CUES),
    hasDeliverable: __hasCue(t, __DELIVERABLE_CUES) || Number(boost?.deliverable) > 0,
    hasImpactEvidence: __hasCue(t, __IMPACT_EVIDENCE_CUES) || Number(boost?.outcome) > 0 || Number(boost?.metric) > 0 || metricRegexHit,
    hasDecisionOrLeadershipCue: __hasCue(t, __DECISION_OR_LEADERSHIP_CUES),
  };
}

const __P3_IMPACT_OUTCOME_CUES = [
  "\uC808\uAC10",
  "\uAC1C\uC120",
  "\uAC1C\uC120\uC548",
  "\uC99D\uAC00",
  "\uAC10\uC18C",
  "\uD5A5\uC0C1",
  "\uD6A8\uC728\uD654",
  "\uCD5C\uC801\uD654",
  "\uACE0\uB3C4\uD654",
  "\uB3C4\uCD9C",
  "\uCC3D\uCD9C",
  "\uC218\uC775\uC131",
];

const __P3_METRIC_NOUN_CUES = [
  "roi",
  "kpi",
  "cac",
  "\uC804\uD658\uC728",
  "\uB9E4\uCD9C",
  "\uBE44\uC6A9",
  "\uB9AC\uB4DC\uD0C0\uC784",
  "\uC0DD\uC0B0\uC131",
  "\uC2E4\uC801",
  "\uC131\uACFC",
];

const __P3_PERIOD_OR_VOLUME_CUES = [
  "\uC6D4\uAC04",
  "\uBD84\uAE30",
  "\uC5F0\uAC04",
  "\uBA85",
  "\uAC1C",
  "\uAC74",
  "\uD68C",
  "\uC6D0",
  "\uB9CC\uC6D0",
  "\uC5B5",
];

function __hasMetricRegexP3(text) {
  const t = norm(text);
  if (!t) return false;
  return /(\d+(\.\d+)?\s*%|\d{1,3}(,\d{3})+|\d+\s*(days?|months?|years?|\uBA85|\uAC1C|\uAC74|\uD68C|\uB9CC\uC6D0|\uC5B5|\uC6D0))/.test(t);
}

function __hasImpactMetricComboP3(text) {
  const t = norm(text);
  if (!t) return false;
  const hasImpactCue = __hasCue(t, __P3_IMPACT_OUTCOME_CUES) || __hasCue(t, __IMPACT_EVIDENCE_CUES);
  const hasMetricCue = __hasCue(t, __P3_METRIC_NOUN_CUES) || /\b(roi|kpi|cac)\b/.test(t);
  const hasMetricRegex = __hasMetricRegexP3(t);
  const hasPeriodOrVolumeCue = __hasCue(t, __P3_PERIOD_OR_VOLUME_CUES);
  return (
    (hasImpactCue && (hasMetricRegex || hasMetricCue || hasPeriodOrVolumeCue)) ||
    (hasMetricCue && hasMetricRegex) ||
    (hasMetricCue && hasImpactCue)
  );
}

function detectBoosterStrengthP3(text, task) {
  const t = norm(text);
  const b = task?.strengthBoosters || {};
  const metricRegexHit = __hasMetricRegexP3(t) ? 1 : 0;
  const impactMetricCombo = __hasImpactMetricComboP3(t);
  const outcome = hasAny(t, b.outcome) || __hasCue(t, __P3_IMPACT_OUTCOME_CUES) || impactMetricCombo ? 1 : 0;
  const metric = hasAny(t, b.metric) || metricRegexHit || (__hasCue(t, __P3_METRIC_NOUN_CUES) && (impactMetricCombo || metricRegexHit)) ? 1 : 0;
  const deliverableContext =
    __hasCue(t, __DELIVERABLE_CUES) &&
    (impactMetricCombo || __hasCue(t, __P3_METRIC_NOUN_CUES) || __hasCue(t, __DECISION_OR_LEADERSHIP_CUES));
  const deliverable = hasAny(t, b.deliverable) || deliverableContext ? 1 : 0;
  const ownership = hasAny(t, b.ownership) ? 1 : 0;
  return { outcome, metric, deliverable, ownership };
}

function __buildEvidenceProfileP3(text, boost) {
  const t = norm(text);
  const metricRegexHit = __hasMetricRegexP3(t);
  const impactMetricCombo = __hasImpactMetricComboP3(t);
  return {
    hasWeakSupportVerb: __hasCue(t, __WEAK_SUPPORT_CUES),
    hasOwnershipVerb: __hasCue(t, __OWNERSHIP_ACTION_CUES) || Number(boost?.ownership) > 0,
    hasStrongActionCue: __hasCue(t, __STRONG_ACTION_CUES),
    hasDeliverable: __hasCue(t, __DELIVERABLE_CUES) || Number(boost?.deliverable) > 0,
    hasImpactEvidence:
      __hasCue(t, __IMPACT_EVIDENCE_CUES) ||
      Number(boost?.outcome) > 0 ||
      Number(boost?.metric) > 0 ||
      metricRegexHit ||
      impactMetricCombo,
    hasDecisionOrLeadershipCue: __hasCue(t, __DECISION_OR_LEADERSHIP_CUES),
  };
}

function applyStrengthCeiling(baseScore, flags) {
  let score = baseScore;
  const hasStrongPrereq =
    flags.hasOwnership ||
    flags.hasDeliverable ||
    (flags.hasImpactEvidence && (flags.hasStrongActionCue || flags.hasDecisionOrLeadershipCue));
  const hasActionDepth =
    flags.hasOwnershipVerb ||
    flags.hasDecisionOrLeadershipCue ||
    flags.hasStrongActionCue;
  const hasEvidenceDepth =
    flags.hasDeliverable ||
    flags.hasImpactEvidence;

  // weak cue 포함 시 strong ceiling
  if (flags.hasWeak) score = Math.min(score, 0.69);
  if (flags.hasWeakSupportVerb) score = Math.min(score, 0.58);
  if (flags.broadOnly && flags.hasWeakSupportVerb) score = Math.min(score, 0.44);
  // ownership 또는 deliverable 없으면 strong 금지
  if (!hasStrongPrereq) score = Math.min(score, 0.69);
  // broad alias 단독 hit는 max medium
  if (flags.broadOnly) score = Math.min(score, 0.69);
  if (!hasActionDepth && !hasEvidenceDepth) score = Math.min(score, 0.58);
  if (!hasActionDepth && flags.broadOnly) score = Math.min(score, 0.58);

  return clamp01(score);
}

function scoreEvidence(text, task, hitMeta) {
  const weakHit = hasAny(text, task?.weakCues || []);
  const boost = detectBoosterStrengthP3(text, task);
  const profile = __buildEvidenceProfileP3(text, boost);
  const boostScore =
    (boost.outcome * 0.16) +
    (boost.metric * 0.16) +
    (boost.deliverable * 0.14) +
    (boost.ownership * 0.16);
  const weakPenalty = weakHit ? 0.2 : 0;
  const base = 0.42;
  const raw = clamp01(base + boostScore - weakPenalty);
  const score = applyStrengthCeiling(raw, {
    hasWeak: weakHit,
    hasOwnership: boost.ownership > 0,
    hasDeliverable: boost.deliverable > 0,
    broadOnly: !!hitMeta?.broadOnly,
    hasWeakSupportVerb: profile.hasWeakSupportVerb,
    hasOwnershipVerb: profile.hasOwnershipVerb,
    hasStrongActionCue: profile.hasStrongActionCue,
    hasImpactEvidence: profile.hasImpactEvidence,
    hasDecisionOrLeadershipCue: profile.hasDecisionOrLeadershipCue,
  });
  return {
    score,
    hasWeakCue: weakHit,
    hasWeakSupportVerb: profile.hasWeakSupportVerb,
    hasOwnershipVerb: profile.hasOwnershipVerb,
    hasDeliverable: profile.hasDeliverable,
    hasImpactEvidence: profile.hasImpactEvidence,
    hasDecisionOrLeadershipCue: profile.hasDecisionOrLeadershipCue,
    weakOnly:
      (weakHit || profile.hasWeakSupportVerb) &&
      !profile.hasOwnershipVerb &&
      !profile.hasStrongActionCue &&
      !profile.hasDeliverable &&
      !profile.hasImpactEvidence &&
      !profile.hasDecisionOrLeadershipCue,
    boosters: boost,
    broadOnly: !!hitMeta?.broadOnly,
  };
}

function scoreToLabel(score) {
  if (score >= 0.7) return "strong";
  if (score < 0.45) return "weak";
  return "medium";
}

export function extractTasksFromJd(parsedJd, jdText) {
  const __strategySeeds = __buildStrategyPlanningSeedSegments(jdText);
  const segments = [
    ...__strategySeeds,
    ...asParsedJdSegments(parsedJd),
    ...splitLines(jdText).map((text) => ({ source: "context", text })),
  ];

  const byId = new Map();
  for (const seg of segments) {
    const importance = resolveImportance(seg.source, seg.text);
    if (seg?.__seedTaskId && TASK_ONTOLOGY_V1_BY_ID[seg.__seedTaskId]) {
      const seededTask = TASK_ONTOLOGY_V1_BY_ID[seg.__seedTaskId];
      const prev = byId.get(seededTask.id) || {
        id: seededTask.id,
        label: seededTask.label,
        group: seededTask.group,
        importance: "context",
        requirementType: "action_requirement",
        sources: [],
        examples: [],
      };
      if (IMPORTANCE_RANK[importance] > IMPORTANCE_RANK[prev.importance]) prev.importance = importance;
      if (!prev.sources.includes(seg.source)) prev.sources.push(seg.source);
      if (prev.examples.length < 2) prev.examples.push(seg.text.slice(0, 140));
      byId.set(seededTask.id, prev);
      continue;
    }
    for (const task of TASK_ONTOLOGY_V1) {
      const hitMeta = matchTaskHitInText(seg.text, task);
      if (!hitMeta.hit) continue;

      const prev = byId.get(task.id) || {
        id: task.id,
        label: task.label,
        group: task.group,
        importance: "context",
        requirementType: "action_requirement",
        sources: [],
        examples: [],
      };
      if (IMPORTANCE_RANK[importance] > IMPORTANCE_RANK[prev.importance]) prev.importance = importance;
      const requirementType = __classifyRequirementType(seg.text, seg.source);
      if (prev.requirementType !== "action_requirement" || requirementType === "action_requirement") {
        prev.requirementType = requirementType;
      }
      if (!prev.sources.includes(seg.source)) prev.sources.push(seg.source);
      if (prev.examples.length < 2) prev.examples.push(seg.text.slice(0, 140));
      byId.set(task.id, prev);
    }
  }

  return Array.from(byId.values()).sort((a, b) => {
    const d = (IMPORTANCE_RANK[b.importance] || 0) - (IMPORTANCE_RANK[a.importance] || 0);
    if (d !== 0) return d;
    return a.id.localeCompare(b.id);
  });
}

export function extractTaskEvidenceFromResume(resumeText) {
  const lines = splitLines(resumeText);
  const strongestByTask = new Map();

  for (const line of lines) {
    for (const task of TASK_ONTOLOGY_V1) {
      const hitMeta = matchTaskHitInText(line, task);
      if (!hitMeta.hit) continue;

      const ev = scoreEvidence(line, task, hitMeta);
      const prev = strongestByTask.get(task.id);
      if (!prev || ev.score > prev.strength) {
        strongestByTask.set(task.id, {
          id: task.id,
          label: task.label,
          group: task.group,
          sentence: line.slice(0, 220),
          strength: ev.score,
          strengthLabel: scoreToLabel(ev.score),
          hasWeakCue: ev.hasWeakCue,
          hasWeakSupportVerb: ev.hasWeakSupportVerb,
          hasOwnershipVerb: ev.hasOwnershipVerb,
          hasDeliverable: ev.hasDeliverable,
          hasImpactEvidence: ev.hasImpactEvidence,
          hasDecisionOrLeadershipCue: ev.hasDecisionOrLeadershipCue,
          weakOnly: ev.weakOnly,
          broadOnly: ev.broadOnly,
          boosters: ev.boosters,
        });
      }
    }
  }

  return Array.from(strongestByTask.values()).sort((a, b) => b.strength - a.strength);
}

function __buildWeakReasons(ev) {
  const out = [];
  const boosters = ev?.boosters || {};
  if (ev?.hasWeakCue) out.push("지원/보조 표현");
  if (!(Number(boosters.ownership) > 0)) out.push("ownership 부재");
  if (!(Number(boosters.deliverable) > 0)) out.push("deliverable 부재");
  if (!(Number(boosters.outcome) > 0 || Number(boosters.metric) > 0)) out.push("outcome/metric 부재");
  if (ev?.broadOnly) out.push("broad alias only");
  return Array.from(new Set(out));
}

function __pickRewriteHint(taskInfo, weakReasons) {
  const guide = taskInfo?.rewriteGuide && typeof taskInfo.rewriteGuide === "object" ? taskInfo.rewriteGuide : null;
  if (guide?.weakHint) return String(guide.weakHint);
  if ((weakReasons || []).includes("ownership 부재")) return "본인 결정/책임 범위를 문장 첫 부분에서 명확히 밝혀주세요.";
  if ((weakReasons || []).includes("deliverable 부재")) return "산출물(문서/리포트/대시보드) 명칭을 구체적으로 적어주세요.";
  if ((weakReasons || []).includes("outcome/metric 부재")) return "결과 지표(전/후 수치 또는 KPI)를 1개 이상 포함해 주세요.";
  return "직접 설계/주도/개선 성과가 드러나는 bullet로 보완해 주세요.";
}

function __pickRewriteSkeleton(taskInfo, mode = "weak") {
  const guide = taskInfo?.rewriteGuide && typeof taskInfo.rewriteGuide === "object" ? taskInfo.rewriteGuide : null;
  const sk = Array.isArray(guide?.bulletSkeleton) ? guide.bulletSkeleton.filter(Boolean) : [];
  if (sk.length > 0) return sk.slice(0, 2);
  if (mode === "missing") {
    return [
      "[업무 과제] [본인 역할] [핵심 산출물]",
      "[적용/실행] [결과 또는 변화]",
    ];
  }
  return [
    "[문장 첫부분에 본인 책임/결정 범위 명시]",
    "[산출물 + 결과(가능한 경우 수치)]",
  ];
}

function __pickExampleStem(taskInfo) {
  const guide = taskInfo?.rewriteGuide && typeof taskInfo.rewriteGuide === "object" ? taskInfo.rewriteGuide : null;
  return guide?.exampleStem ? String(guide.exampleStem) : "";
}

function __pickRewriteCaution() {
  return "없는 성과/책임을 만들어내지 말고 실제 수행한 범위만 강조하세요.";
}

const QUALIFICATION_REQUIREMENT_RE =
  /(대졸|학사|석사|박사|학위|전공|졸업|전문학사|전문대|관련학과|전공자|자격증|면허|certification|certificate|degree|major|phd|master|bachelor|gpa|학점|신입|경력무관|인턴|병역|어학|toeic|toefl|opic)/i;
const PREFERENCE_REQUIREMENT_RE =
  /(우대|preferred|nice\s*to\s*have|plus|preferred qualification|우대사항|가점|선호)/i;
const ACTION_REQUIREMENT_RE =
  /(경험|프로젝트|수행|운영|설계|개발|분석|검증|측정|개선|도출|구축|작성|주도|운용|협업|테스트|최적화|관리|기획|리포트|대시보드|simulation|design|develop|analy|measure|test|verify|operate|build|lead|improve|deliver)/i;

const ACTION_DOMAIN_RE =
  /(설계|분석|측정|운영|검증|작성|개선|개발|수행|활용|운용|도구|산출물|simulation|design|analysis|analy|measure|operate|verify|test|build|develop|tool|cst|antenna)/i;
const EXPERIENCE_ACTOR_RE = /(경험자|유경험자|experience\s*in|experience\s*with)/i;
const QUALIFICATION_CORE_RE =
  /(학위|전공|학과|졸업|자격증|면허|어학|학점|석사|박사|학사|대졸|전공자|certificate|degree|major|license|toeic|toefl|opic)/i;

const ACTION_SIGNAL_LEXICON = {
  verbs: [
    "설계", "분석", "측정", "운영", "검증", "작성", "개선", "개발", "구축", "수행",
    "관리", "대응", "실행", "기획", "협업", "리드", "수립", "도출", "진행", "리딩",
  ],
  tools: [
    "Excel", "PowerPoint", "PPT", "Python", "SQL", "Power BI", "Tableau", "MATLAB",
    "SAP", "ERP", "CST", "HFSS", "R",
  ],
  deliverables: [
    "보고서", "리포트", "대시보드", "제안서", "프로세스", "지표", "KPI", "전략",
    "로드맵", "계획", "개선", "향상", "절감", "최적화",
  ],
  ownership: [
    "주도", "총괄", "리드", "담당", "오너", "end-to-end", "E2E",
  ],
};

const QUALIFICATION_SIGNAL_LEXICON = [
  "학사", "석사", "박사", "대졸", "대졸 이상", "전공자", "자격증", "면허", "어학", "보유자",
  "병역",
];

const PREFERENCE_SIGNAL_LEXICON = [
  "우대", "선호", "가점", "preferred", "plus", "bonus",
];

function __countSignalHits(text, lexicon) {
  const raw = toStr(text).trim();
  if (!raw || !lexicon) return 0;
  const hay = norm(raw);
  if (Array.isArray(lexicon)) {
    return lexicon.reduce((acc, item) => {
      const needle = norm(item);
      return needle && hay.includes(needle) ? acc + 1 : acc;
    }, 0);
  }
  if (typeof lexicon === "object") {
    return Object.values(lexicon).reduce((acc, arr) => acc + __countSignalHits(raw, arr), 0);
  }
  return 0;
}

function __classifyRequirementType(text, source) {
  const raw = toStr(text).trim();
  const src = toStr(source).trim().toLowerCase();
  if (!raw) return "action_requirement";
  const verbHits = __countSignalHits(raw, ACTION_SIGNAL_LEXICON.verbs);
  const toolHits = __countSignalHits(raw, ACTION_SIGNAL_LEXICON.tools);
  const deliverableHits = __countSignalHits(raw, ACTION_SIGNAL_LEXICON.deliverables);
  const ownershipHits = __countSignalHits(raw, ACTION_SIGNAL_LEXICON.ownership);
  const actionScore = verbHits + toolHits + deliverableHits + ownershipHits;
  const qualificationHits = __countSignalHits(raw, QUALIFICATION_SIGNAL_LEXICON);
  const preferenceHits = __countSignalHits(raw, PREFERENCE_SIGNAL_LEXICON);
  if (qualificationHits >= 1 && actionScore < 2) return "qualification_requirement";
  if (preferenceHits >= 1 && actionScore < 2) return "preference_requirement";
  if (actionScore >= 1) return "action_requirement";
  const hasPreference = src === "preferred" || PREFERENCE_REQUIREMENT_RE.test(raw);
  const hasAction = ACTION_REQUIREMENT_RE.test(raw) || ACTION_DOMAIN_RE.test(raw);
  const hasQualification = QUALIFICATION_REQUIREMENT_RE.test(raw) || QUALIFICATION_CORE_RE.test(raw);
  const isExperienceActor = EXPERIENCE_ACTOR_RE.test(raw);
  if (isExperienceActor && hasAction && !QUALIFICATION_CORE_RE.test(raw)) return "action_requirement";
  if (hasPreference) {
    if (isExperienceActor && hasAction && !hasQualification) return "action_requirement";
    return "preference_requirement";
  }
  if (hasQualification && !hasAction) return "qualification_requirement";
  return "action_requirement";
}

const __STRICT_STRATEGY_SEED_TASK_IDS = new Set([
  "TASK__MARKET_RESEARCH",
  "TASK__STRATEGY_PLANNING",
  "TASK__ROADMAP_PLANNING",
  "TASK__STRATEGY_EXECUTION_SUPPORT",
]);

function __isSeededStrategyOverclaim(taskId, ev) {
  if (!__STRICT_STRATEGY_SEED_TASK_IDS.has(String(taskId || ""))) return false;
  if (!ev || typeof ev !== "object") return false;
  return Boolean(ev.broadOnly) && Number(ev.strength || 0) < 0.7;
}

const __ROLE_FAMILY_CUES = {
  strategy: [
    { cue: "\uC804\uB7B5\uAE30\uD68D", weight: 3 },
    { cue: "\uC0AC\uC5C5\uAE30\uD68D", weight: 2 },
    { cue: "\uACBD\uC601\uAE30\uD68D", weight: 2 },
    { cue: "\uC911\uC7A5\uAE30 \uC804\uB7B5", weight: 2 },
    { cue: "\uC804\uB7B5 \uACFC\uC81C", weight: 2 },
    { cue: "\uC2DC\uC7A5 \uBD84\uC11D", weight: 1 },
    { cue: "\uACBD\uC7C1\uC0AC \uBD84\uC11D", weight: 1 },
    { cue: "\uC0AC\uC5C5 \uAE30\uD68C \uBC1C\uAD74", weight: 2 },
    { cue: "\uC2E0\uADDC \uC0AC\uC5C5", weight: 1 },
    { cue: "\uACBD\uC601\uC9C4 \uBCF4\uACE0", weight: 2 },
    { cue: "ceo \uBCF4\uACE0", weight: 2 },
    { cue: "\uC804\uC0AC \uACFC\uC81C", weight: 2 },
  ],
  operations: [
    { cue: "\uC6B4\uC601\uAE30\uD68D", weight: 3 },
    { cue: "\uC6B4\uC601 \uC815\uCC45", weight: 2 },
    { cue: "\uC6B4\uC601 \uD504\uB85C\uC138\uC2A4", weight: 2 },
    { cue: "cs \uC6B4\uC601", weight: 3 },
    { cue: "\uC751\uB2F5\uB960", weight: 1 },
    { cue: "\uCC98\uB9AC \uC2DC\uAC04", weight: 1 },
    { cue: "\uC6B4\uC601 \uD6A8\uC728\uD654", weight: 2 },
    { cue: "\uACE0\uAC1D\uC9C0\uC6D0", weight: 2 },
    { cue: "voc", weight: 1 },
    { cue: "\uC6B4\uC601 \uC9C0\uD45C", weight: 2 },
  ],
  marketing_content: [
    { cue: "\uB9C8\uCF00\uD305\uAE30\uD68D", weight: 3 },
    { cue: "\uCEA0\uD398\uC778", weight: 2 },
    { cue: "\uD504\uB85C\uBAA8\uC158", weight: 2 },
    { cue: "\uCF58\uD150\uCE20 \uAE30\uD68D", weight: 3 },
    { cue: "\uBE0C\uB79C\uB529", weight: 2 },
    { cue: "\uAD11\uACE0 \uC131\uACFC", weight: 2 },
  ],
  pmo_support: [
    { cue: "pmo", weight: 3 },
    { cue: "\uC77C\uC815 \uAD00\uB9AC", weight: 2 },
    { cue: "\uC774\uC288 \uD2B8\uB798\uD0B9", weight: 2 },
    { cue: "\uD68C\uC758\uCCB4 \uC6B4\uC601", weight: 2 },
    { cue: "\uD504\uB85C\uC81D\uD2B8 \uC9C0\uC6D0", weight: 2 },
    { cue: "coordination", weight: 2 },
  ],
};

const __ROLE_FAMILY_STRATEGY_TASK_IDS = new Set([
  "TASK__MARKET_RESEARCH",
  "TASK__STRATEGY_PLANNING",
  "TASK__ROADMAP_PLANNING",
  "TASK__STRATEGY_EXECUTION_SUPPORT",
  "TASK__STAKEHOLDER_COMMUNICATION",
  "TASK__DASHBOARD_REPORTING",
]);

function __scoreRoleFamily(text, familyId) {
  const hay = norm(text);
  const cues = Array.isArray(__ROLE_FAMILY_CUES?.[familyId]) ? __ROLE_FAMILY_CUES[familyId] : [];
  let score = 0;
  const matchedCues = [];
  for (const entry of cues) {
    const cue = norm(entry?.cue);
    if (!cue || !hay.includes(cue)) continue;
    score += Number(entry?.weight) > 0 ? Number(entry.weight) : 1;
    matchedCues.push(String(entry.cue));
  }
  return { score, matchedCues };
}

function __resolveRoleFamily(text) {
  const scored = Object.keys(__ROLE_FAMILY_CUES)
    .map((family) => {
      const out = __scoreRoleFamily(text, family);
      return { family, score: out.score, matchedCues: out.matchedCues };
    })
    .sort((a, b) => b.score - a.score);
  const top = scored[0] || { family: "unknown", score: 0, matchedCues: [] };
  const second = scored[1] || { family: "unknown", score: 0, matchedCues: [] };
  const isResolved = top.score >= 2 && (second.score === 0 || top.score - second.score >= 1);
  return {
    family: isResolved ? top.family : "unknown",
    confidence: top.score,
    matchedCues: isResolved ? top.matchedCues.slice(0, 6) : [],
    scores: scored.reduce((acc, item) => {
      acc[item.family] = item.score;
      return acc;
    }, {}),
  };
}

function __getRoleFamilyDistance(jdFamily, resumeFamily) {
  const left = String(jdFamily || "unknown");
  const right = String(resumeFamily || "unknown");
  if (!left || !right || left === "unknown" || right === "unknown") return 0;
  if (left === right) return 0;
  if ((left === "strategy" && right === "operations") || (left === "operations" && right === "strategy")) return 2;
  if ((left === "strategy" && right === "marketing_content") || (left === "marketing_content" && right === "strategy")) return 1;
  if ((left === "strategy" && right === "pmo_support") || (left === "pmo_support" && right === "strategy")) return 1;
  return 1;
}

function __isRoleFamilyMismatchOverclaim(taskId, ev, familyMeta) {
  if (!__ROLE_FAMILY_STRATEGY_TASK_IDS.has(String(taskId || ""))) return false;
  if (!ev || typeof ev !== "object") return false;
  if (String(familyMeta?.jdFamily || "") !== "strategy") return false;
  if (String(familyMeta?.resumeFamily || "") !== "operations") return false;
  if (Number(familyMeta?.familyDistance || 0) <= 0) return false;
  if (ev.hasOwnershipVerb && ev.hasDecisionOrLeadershipCue && ev.hasImpactEvidence && Number(ev.strength || 0) >= 0.7) {
    return false;
  }
  return Boolean(ev.broadOnly || ev.weakOnly || !ev.hasOwnershipVerb || !ev.hasDecisionOrLeadershipCue);
}

export function buildTaskOntologyMeta(parsedJd, jdText, resumeText) {
  const jdTasks = extractTasksFromJd(parsedJd, jdText);
  const resumeEvidence = extractTaskEvidenceFromResume(resumeText);
  const evById = new Map(resumeEvidence.map((e) => [e.id, e]));
  const jdFamilyMeta = __resolveRoleFamily(jdText);
  const resumeFamilyMeta = __resolveRoleFamily(resumeText);
  const familyDistance = __getRoleFamilyDistance(jdFamilyMeta.family, resumeFamilyMeta.family);
  const mismatchFlags = {
    roleFamilyMismatch: familyDistance > 0,
    strategyVsOperations: jdFamilyMeta.family === "strategy" && resumeFamilyMeta.family === "operations",
  };

  const jdCriticalTaskIds = jdTasks
    .filter((t) => t.importance === "must" || t.importance === "core")
    .map((t) => t.id);
  const jdCriticalImportanceById = new Map(
    jdTasks
      .filter((t) => t.importance === "must" || t.importance === "core")
      .map((t) => [t.id, t.importance])
  );
  const jdRequirementTypeById = new Map(
    jdTasks
      .filter((t) => t.importance === "must" || t.importance === "core")
      .map((t) => [t.id, t.requirementType || "action_requirement"])
  );

  const criticalSet = new Set(jdCriticalTaskIds);
  const matchedAnyCore = [];
  const matchedStrongCore = [];
  const missingCoreTaskIds = [];
  const missingCriticalTasks = [];
  const weakOnlyTaskIds = [];
  const weakMatchedTasks = [];
  const familyMismatchTaskIds = [];
  const familyMismatchMatchedTasks = [];

  for (const taskId of jdCriticalTaskIds) {
    const taskInfo = TASK_ONTOLOGY_V1_BY_ID[taskId] || { id: taskId, label: taskId, group: "기타" };
    const ev = evById.get(taskId);
    const familyMismatchOverclaim = __isRoleFamilyMismatchOverclaim(taskId, ev, {
      jdFamily: jdFamilyMeta.family,
      resumeFamily: resumeFamilyMeta.family,
      familyDistance,
    });
    if (familyMismatchOverclaim) {
      familyMismatchTaskIds.push(taskId);
      familyMismatchMatchedTasks.push({
        id: taskInfo.id,
        label: taskInfo.label,
        group: taskInfo.group,
        sentence: ev?.sentence || "",
        strength: Number(ev?.strength || 0),
        strengthLabel: ev?.strengthLabel || "weak",
      });
    }
    if (!ev || __isSeededStrategyOverclaim(taskId, ev) || familyMismatchOverclaim) {
      missingCoreTaskIds.push(taskId);
      const guide = taskInfo?.rewriteGuide && typeof taskInfo.rewriteGuide === "object" ? taskInfo.rewriteGuide : null;
      missingCriticalTasks.push({
        id: taskInfo.id,
        label: taskInfo.label,
        group: taskInfo.group,
        importance: String(jdCriticalImportanceById.get(taskId) || "core"),
        requirementType: String(jdRequirementTypeById.get(taskId) || "action_requirement"),
        rewriteHint: guide?.missingHint ? String(guide.missingHint) : "",
        addBulletGuide: __pickRewriteSkeleton(taskInfo, "missing"),
        exampleStem: __pickExampleStem(taskInfo),
        caution: __pickRewriteCaution(),
      });
      continue;
    }
    matchedAnyCore.push(taskId);
    if (ev.strength >= 0.7) matchedStrongCore.push(taskId);
    if (ev.weakOnly || ev.strength < 0.45) {
      weakOnlyTaskIds.push(taskId);
      const weakReasons = __buildWeakReasons(ev);
      weakMatchedTasks.push({
        id: taskInfo.id,
        label: taskInfo.label,
        group: taskInfo.group,
        requirementType: String(jdRequirementTypeById.get(taskId) || "action_requirement"),
        original: ev.sentence,
        sentence: ev.sentence,
        strengthLabel: ev.strengthLabel,
        weakReasons,
        rewriteHint: __pickRewriteHint(taskInfo, weakReasons),
        rewriteSkeleton: __pickRewriteSkeleton(taskInfo, "weak"),
        rewriteExample: __pickExampleStem(taskInfo),
        caution: __pickRewriteCaution(),
      });
    }
  }

  // coreTasks(legacy)은 critical 기준으로 유지해 coverage 분모를 일치시킴
  const coreTasks = jdTasks.filter((t) => criticalSet.has(t.id));

  const topMatchedTasks = resumeEvidence
    .filter((e) => criticalSet.has(e.id))
    .slice(0, 5)
    .map((e) => ({
      id: e.id,
      label: e.label,
      group: e.group,
      strength: e.strength,
      strengthLabel: e.strengthLabel,
      weakOnly: e.weakOnly,
      broadOnly: e.broadOnly,
      sentence: e.sentence,
    }));

  return {
    jdCoreTaskCount: coreTasks.length,
    matchedStrongCount: matchedStrongCore.length,
    matchedAnyCount: matchedAnyCore.length,
    missingCoreTaskIds,
    weakOnlyTaskIds,
    topMatchedTasks,
    jdCriticalTaskIds,
    missingCriticalTasks,
    weakMatchedTasks,
    jdFamily: jdFamilyMeta.family,
    resumeFamily: resumeFamilyMeta.family,
    familyDistance,
    mismatchFlags,
    jdFamilyScores: jdFamilyMeta.scores,
    resumeFamilyScores: resumeFamilyMeta.scores,
    jdFamilyMatchedCues: jdFamilyMeta.matchedCues,
    resumeFamilyMatchedCues: resumeFamilyMeta.matchedCues,
    familyMismatchTaskIds,
    familyMismatchMatchedTasks,
  };
}

export { TASK_ONTOLOGY_V1_BY_ID };
