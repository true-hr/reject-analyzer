// src/lib/decision/leadership/leadershipRiskEvaluator.js
// Leadership scope mismatch + company scale 보정 helper
//
// 입력: ctx.state.career.leadershipLevel
//       ctx.objective.targetRole
//       ctx.objective.companyScaleCurrent
//       ctx.objective.companyScaleTarget
//
// 출력: { riskLevel: "none"|"low"|"medium"|"high", type: string|null }

const SCALE_RANK = { startup: 1, small: 2, mid: 3, large: 4 };

/**
 * 회사 규모 방향 비교
 * @returns "upgrade" | "downgrade" | "similar"
 */
function compareScale(current, target) {
  const c = SCALE_RANK[current] ?? null;
  const t = SCALE_RANK[target] ?? null;
  if (c === null || t === null) return "similar";
  if (t > c) return "upgrade";
  if (t < c) return "downgrade";
  return "similar";
}

/**
 * leadership mismatch 판단
 *
 * CASE L1: individual → individual  → none
 * CASE L2: individual → manager     → leadership_gap / high
 * CASE L3: manager   → manager      → none
 * CASE L4: manager   → individual   → scale에 따라 low/medium/high
 * CASE L5: executive → individual   → overqualified
 * CASE L6: executive → manager      → scope_mismatch
 */
function computeLeadershipRisk(leadershipLevel, targetRole, scaleDirection) {
  const lv = String(leadershipLevel || "").toLowerCase();
  const tr = String(targetRole || "").toLowerCase();

  // 데이터 미입력 시 판단 보류
  if (!lv || !tr) return { riskLevel: "none", type: null };

  // CASE L1
  if (lv === "individual" && tr === "individual") {
    return { riskLevel: "none", type: null };
  }

  // CASE L2
  if (lv === "individual" && tr === "manager") {
    return { riskLevel: "high", type: "leadership_gap" };
  }

  // CASE L3
  if (lv === "manager" && tr === "manager") {
    return { riskLevel: "none", type: null };
  }

  // CASE L4: manager → individual (규모 downshift)
  if (lv === "manager" && tr === "individual") {
    if (scaleDirection === "upgrade") return { riskLevel: "low", type: "scope_mismatch" };
    if (scaleDirection === "downgrade") return { riskLevel: "high", type: "scope_mismatch" };
    return { riskLevel: "medium", type: "scope_mismatch" };
  }

  // CASE L5
  if (lv === "executive" && tr === "individual") {
    return { riskLevel: "high", type: "overqualified" };
  }

  // CASE L6
  if (lv === "executive" && tr === "manager") {
    return { riskLevel: "medium", type: "scope_mismatch" };
  }

  return { riskLevel: "none", type: null };
}

/**
 * @param {object} ctx
 * @param {object} ctx.state
 * @param {object} [ctx.objective]
 * @returns {{ riskLevel: "none"|"low"|"medium"|"high", type: string|null, scaleDirection: string }}
 */
export function evaluateLeadershipRisk(ctx) {
  const leadershipLevel = ctx?.state?.career?.leadershipLevel ?? null;
  const targetRole = ctx?.objective?.targetRole ?? null;
  const companyScaleCurrent = ctx?.objective?.companyScaleCurrent ?? null;
  const companyScaleTarget = ctx?.objective?.companyScaleTarget ?? null;

  const scaleDirection = compareScale(companyScaleCurrent, companyScaleTarget);
  const { riskLevel, type } = computeLeadershipRisk(leadershipLevel, targetRole, scaleDirection);

  return { riskLevel, type, scaleDirection };
}
