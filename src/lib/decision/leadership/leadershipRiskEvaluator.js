// src/lib/decision/leadership/leadershipRiskEvaluator.js

function normalizeLeadershipLevel(value) {
  const v = String(value || "").trim().toLowerCase();
  if (v === "individual") return "individual";
  if (v === "manager") return "manager";
  if (v === "executive") return "executive";
  return null;
}

function normalizeTargetRole(value) {
  const v = String(value || "").trim().toLowerCase();
  if (v === "individual") return "individual";
  if (v === "manager") return "manager";
  if (v === "executive") return "executive";
  return null;
}

function normalizeScale(value) {
  const v = String(value || "").trim().toLowerCase();
  if (v === "startup") return "startup";
  if (v === "small") return "small";
  if (v === "mid") return "mid";
  if (v === "large") return "large";
  return null;
}

function scaleRank(scale) {
  if (scale === "startup") return 1;
  if (scale === "small") return 2;
  if (scale === "mid") return 3;
  if (scale === "large") return 4;
  return 0;
}

function compareScale(current, target) {
  const c = scaleRank(normalizeScale(current));
  const t = scaleRank(normalizeScale(target));

  if (!c || !t) return "similar";
  if (t > c) return "upgrade";
  if (t < c) return "downgrade";
  return "similar";
}

function buildResult(riskLevel, type, scaleDirection) {
  return {
    riskLevel: riskLevel || "none",
    type: type || null,
    scaleDirection: scaleDirection || "similar",
  };
}

export function evaluateLeadershipRisk(ctx) {
  const leadershipLevel = normalizeLeadershipLevel(ctx?.state?.career?.leadershipLevel);
  const targetRole = normalizeTargetRole(ctx?.objective?.targetRole);
  const companyScaleCurrent = normalizeScale(ctx?.objective?.companyScaleCurrent);
  const companyScaleTarget = normalizeScale(ctx?.objective?.companyScaleTarget);

  const scaleDirection = compareScale(companyScaleCurrent, companyScaleTarget);

  if (!leadershipLevel || !targetRole) {
    return buildResult("none", null, scaleDirection);
  }

  if (leadershipLevel === "individual" && targetRole === "individual") {
    return buildResult("none", null, scaleDirection);
  }

  if (leadershipLevel === "individual" && targetRole === "manager") {
    return buildResult("high", "leadership_gap", scaleDirection);
  }

  if (leadershipLevel === "manager" && targetRole === "manager") {
    return buildResult("none", null, scaleDirection);
  }

  if (leadershipLevel === "manager" && targetRole === "individual") {
    if (scaleDirection === "upgrade") return buildResult("low", "scope_mismatch", scaleDirection);
    if (scaleDirection === "similar") return buildResult("medium", "scope_mismatch", scaleDirection);
    if (scaleDirection === "downgrade") return buildResult("high", "scope_mismatch", scaleDirection);
    return buildResult("medium", "scope_mismatch", scaleDirection);
  }

  if (leadershipLevel === "executive" && targetRole === "individual") {
    return buildResult("high", "overqualified", scaleDirection);
  }

  if (leadershipLevel === "executive" && targetRole === "manager") {
    return buildResult("medium", "scope_mismatch", scaleDirection);
  }

  if (leadershipLevel === "executive" && targetRole === "executive") {
    return buildResult("none", null, scaleDirection);
  }

  return buildResult("none", null, scaleDirection);
}
