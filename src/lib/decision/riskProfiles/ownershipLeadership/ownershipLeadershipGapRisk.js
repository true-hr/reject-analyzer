// src/lib/decision/riskProfiles/ownershipLeadership/ownershipLeadershipGapRisk.js
// 대표 ownership/leadership gap risk (non-gate)

function safeStr(v) {
  try {
    return (v ?? "").toString();
  } catch {
    return "";
  }
}

function isObj(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function toBool(v) {
  return v === true;
}

function clamp01(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function hasAny(text, regs) {
  const t = safeStr(text);
  for (const re of regs || []) {
    if (re.test(t)) return true;
  }
  return false;
}

function countHits(text, regs) {
  const t = safeStr(text);
  let n = 0;
  for (const re of regs || []) {
    const m = t.match(re);
    if (Array.isArray(m)) n += m.length;
  }
  return n;
}

function pickEvidence(ctx) {
  const ce = isObj(ctx?.competencyExpectation) ? ctx.competencyExpectation : {};
  const ev = isObj(ce?.evidence) ? ce.evidence : {};

  const structuralFlags = Array.isArray(ctx?.structural?.flags)
    ? ctx.structural.flags
    : Array.isArray(ctx?.flags)
      ? ctx.flags
      : [];
  const hasFlag = (id) =>
    structuralFlags.some((f) => (typeof f === "string" ? f === id : safeStr(f?.id) === id));

  const state = isObj(ctx?.state) ? ctx.state : {};
  const resumeText = safeStr(state?.resume || state?.resumeText || "");
  const leadRegs = [
    /\b(lead|leading|led|owner|ownership|own|manage|managed|mentor)\w*\b/gi,
    /\b(pm|po|tech lead|team lead)\b/gi,
    /\b(주도|리드|총괄|오너십|책임|의사결정|조율|코칭|멘토)\b/g,
  ];
  const leadHits = countHits(resumeText, leadRegs);

  const currentLevel = safeStr(state?.career?.leadershipLevel || state?.leadershipLevel).toLowerCase();
  const targetText = safeStr(
    state?.levelTarget ||
    state?.targetRoleLevel ||
    state?.roleTargetLevel ||
    state?.targetRole ||
    state?.roleTarget ||
    state?.career?.targetRole ||
    ""
  );
  const leadershipGapProxy =
    /(?:^|[^a-z])(individual|ic)(?:$|[^a-z])/i.test(currentLevel) &&
    hasAny(targetText, [/\blead\b/i, /\bmanager\b/i, /\bhead\b/i, /\bdirector\b/i]);

  const row = {
    OWNERSHIP__NO_PROJECT_INITIATION_SIGNAL:
      toBool(ev.OWNERSHIP__NO_PROJECT_INITIATION_SIGNAL) || hasFlag("NO_PROJECT_INITIATION_PATTERN"),
    OWNERSHIP__LOW_OWNERSHIP_VERB_RATIO:
      toBool(ev.OWNERSHIP__LOW_OWNERSHIP_VERB_RATIO) || hasFlag("LOW_OWNERSHIP_VERB_RATIO"),
    OWNERSHIP__NO_DECISION_AUTHORITY_SIGNAL:
      toBool(ev.OWNERSHIP__NO_DECISION_AUTHORITY_SIGNAL) || hasFlag("NO_DECISION_AUTHORITY_PATTERN"),
    EXP__LEADERSHIP__MISSING:
      toBool(ev.EXP__LEADERSHIP__MISSING) || leadHits === 0,
    leadershipGap:
      toBool(ev.leadershipGap) || leadershipGapProxy,
    leadershipRisk:
      toBool(ev.leadershipRisk),
  };

  const hitKeys = Object.keys(row).filter((k) => row[k] === true);
  return { row, hitKeys, hitCount: hitKeys.length };
}

function shouldTrigger(ctx) {
  const ce = isObj(ctx?.competencyExpectation) ? ctx.competencyExpectation : {};
  if (ce?.ownershipExpected !== true) return false;

  const ev = pickEvidence(ctx);
  return ev.hitCount >= 2;
}

function scoreByHitCount(n) {
  if (n >= 5) return 0.9;
  if (n >= 4) return 0.78;
  if (n >= 3) return 0.66;
  if (n >= 2) return 0.54;
  return 0;
}

export const ownershipLeadershipGapRisk = {
  id: "RISK__OWNERSHIP_LEADERSHIP_GAP",
  title: "Ownership / leadership expectation gap",
  group: "ownershipLeadership",
  layer: "hireability",
  priority: 94,
  when: (ctx) => shouldTrigger(ctx),
  score: (ctx) => {
    const ev = pickEvidence(ctx);
    return clamp01(scoreByHitCount(ev.hitCount));
  },
  explain: (ctx) => {
    const ev = pickEvidence(ctx);
    return {
      title: "Ownership / leadership expectation gap",
      why: [
        "Role/JD context implies ownership or leadership expectation.",
        `Multiple shortage signals were observed (${ev.hitCount} sources).`,
      ],
      signals: ev.hitKeys,
      action: [
        "Add one or two bullets with decision ownership, initiative start point, and scope of responsibility.",
        "Make explicit what you decided, what you led, and what changed as measurable outcome.",
      ],
      counter: [
        "If recent projects clearly show end-to-end ownership and decision authority, this risk can reduce.",
      ],
    };
  },
};

export default ownershipLeadershipGapRisk;
