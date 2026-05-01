// src/lib/analysis/axisInterpretation/axisInterpretationResolvers.js
//
// Pilot interpretation resolvers — 5 groups, 16 axes.
// Each resolver receives pre-resolved state/frame data and produces
// the interpretation fields specific to that axis.
//
// Inputs per resolver:
//   { axisEvidence, asset, resolvedStateKey, frame, entry }
// Outputs:
//   Partial axisInterpretation (evidenceFor, evidenceAgainst, missingProof are axis-specific)

// ─── shared builder ───────────────────────────────────────────────────────────

function __buildEvidenceFor(resolvedSignals) {
  if (!Array.isArray(resolvedSignals)) return [];
  return resolvedSignals.map((s) => ({ key: s.key, value: s.value, label: s.label ?? s.key }));
}

function __buildEvidenceAgainst(resolvedStateKey, interpretationState) {
  if (interpretationState === "risk" || interpretationState === "watch") {
    return [{ key: resolvedStateKey ?? "state", label: "신호 해석 결과 주의 또는 위험 범주" }];
  }
  return [];
}

function __buildMissingProof(missingSignals) {
  if (!Array.isArray(missingSignals)) return [];
  return missingSignals.map((s) => ({ key: s.key, label: s.label ?? s.key, reason: s.reason }));
}

// ─── GROUP 1: COMPENSATION ───────────────────────────────────────────────────

function resolveSalaryJumpIntensity({ axisEvidence, resolvedStateKey, frame }) {
  const iState = frame.interpretationState;
  const compSig = axisEvidence.comparison;
  const extraNote = compSig?.delta != null
    ? `salary_delta:${(compSig.delta * 100).toFixed(0)}%`
    : null;
  return {
    evidenceFor:     __buildEvidenceFor(axisEvidence.resolvedSignals),
    evidenceAgainst: __buildEvidenceAgainst(resolvedStateKey, iState),
    missingProof:    __buildMissingProof(axisEvidence.missingSignals),
    debug: { comparisonSummary: compSig, extraNote },
  };
}

function resolveCurrentCompLevel({ axisEvidence, resolvedStateKey, frame }) {
  return {
    evidenceFor:     __buildEvidenceFor(axisEvidence.resolvedSignals),
    evidenceAgainst: __buildEvidenceAgainst(resolvedStateKey, frame.interpretationState),
    missingProof:    __buildMissingProof(axisEvidence.missingSignals),
    debug: { comparisonSummary: null },
  };
}

function resolveCompMarketValue({ axisEvidence, resolvedStateKey, frame }) {
  return {
    evidenceFor:     __buildEvidenceFor(axisEvidence.resolvedSignals),
    evidenceAgainst: __buildEvidenceAgainst(resolvedStateKey, frame.interpretationState),
    missingProof:    __buildMissingProof(axisEvidence.missingSignals),
    debug: { comparisonSummary: null },
  };
}

function resolveSalaryGrowthLogicFit({ axisEvidence, resolvedStateKey, frame }) {
  return {
    evidenceFor:     __buildEvidenceFor(axisEvidence.resolvedSignals),
    evidenceAgainst: __buildEvidenceAgainst(resolvedStateKey, frame.interpretationState),
    missingProof:    __buildMissingProof(axisEvidence.missingSignals),
    debug: { comparisonSummary: null },
  };
}

function resolveCompensationExpectedRoleLevel({ axisEvidence, resolvedStateKey, frame }) {
  return {
    evidenceFor:     __buildEvidenceFor(axisEvidence.resolvedSignals),
    evidenceAgainst: __buildEvidenceAgainst(resolvedStateKey, frame.interpretationState),
    missingProof:    __buildMissingProof(axisEvidence.missingSignals),
    debug: { comparisonSummary: null },
  };
}

// ─── GROUP 2: ROLE LEVEL ─────────────────────────────────────────────────────

function resolveLevelYearsExpectationFit({ axisEvidence, resolvedStateKey, frame }) {
  return {
    evidenceFor:     __buildEvidenceFor(axisEvidence.resolvedSignals),
    evidenceAgainst: __buildEvidenceAgainst(resolvedStateKey, frame.interpretationState),
    missingProof:    __buildMissingProof(axisEvidence.missingSignals),
    debug: { comparisonSummary: axisEvidence.comparison },
  };
}

function resolveRoleScopeFit({ axisEvidence, resolvedStateKey, frame }) {
  return {
    evidenceFor:     __buildEvidenceFor(axisEvidence.resolvedSignals),
    evidenceAgainst: __buildEvidenceAgainst(resolvedStateKey, frame.interpretationState),
    missingProof:    __buildMissingProof(axisEvidence.missingSignals),
    debug: { comparisonSummary: axisEvidence.comparison },
  };
}

function resolveResponsibilityDepthFit({ axisEvidence, resolvedStateKey, frame }) {
  return {
    evidenceFor:     __buildEvidenceFor(axisEvidence.resolvedSignals),
    evidenceAgainst: __buildEvidenceAgainst(resolvedStateKey, frame.interpretationState),
    missingProof:    __buildMissingProof(axisEvidence.missingSignals),
    debug: { comparisonSummary: axisEvidence.comparison },
  };
}

function resolveDecisionDistanceFit({ axisEvidence, resolvedStateKey, frame }) {
  return {
    evidenceFor:     __buildEvidenceFor(axisEvidence.resolvedSignals),
    evidenceAgainst: __buildEvidenceAgainst(resolvedStateKey, frame.interpretationState),
    missingProof:    __buildMissingProof(axisEvidence.missingSignals),
    debug: { comparisonSummary: null },
  };
}

function resolveLevelSeniorityFit({ axisEvidence, resolvedStateKey, frame }) {
  return {
    evidenceFor:     __buildEvidenceFor(axisEvidence.resolvedSignals),
    evidenceAgainst: __buildEvidenceAgainst(resolvedStateKey, frame.interpretationState),
    missingProof:    __buildMissingProof(axisEvidence.missingSignals),
    debug: { comparisonSummary: null },
  };
}

// ─── GROUP 3: INDUSTRY ────────────────────────────────────────────────────────

function resolveIndustryTransition({ axisEvidence, resolvedStateKey, frame }) {
  return {
    evidenceFor:     __buildEvidenceFor(axisEvidence.resolvedSignals),
    evidenceAgainst: __buildEvidenceAgainst(resolvedStateKey, frame.interpretationState),
    missingProof:    __buildMissingProof(axisEvidence.missingSignals),
    debug: { comparisonSummary: axisEvidence.comparison },
  };
}

// ─── GROUP 4: ORG SCALE ──────────────────────────────────────────────────────

function resolveOrgScale({ axisEvidence, resolvedStateKey, frame }) {
  return {
    evidenceFor:     __buildEvidenceFor(axisEvidence.resolvedSignals),
    evidenceAgainst: __buildEvidenceAgainst(resolvedStateKey, frame.interpretationState),
    missingProof:    __buildMissingProof(axisEvidence.missingSignals),
    debug: { comparisonSummary: axisEvidence.comparison },
  };
}

// ─── GROUP 5: MANAGEMENT SCOPE ───────────────────────────────────────────────

function resolveLeadershipScope({ axisEvidence, resolvedStateKey, frame }) {
  const leaderSig = axisEvidence.resolvedSignals?.find((s) => s.key === "leadershipLevel");
  return {
    evidenceFor:     __buildEvidenceFor(axisEvidence.resolvedSignals),
    evidenceAgainst: __buildEvidenceAgainst(resolvedStateKey, frame.interpretationState),
    missingProof:    __buildMissingProof(axisEvidence.missingSignals),
    debug: {
      comparisonSummary: null,
      leadershipLevelSignal: leaderSig?.value ?? null,
    },
  };
}

// ─── DISPATCH MAP ─────────────────────────────────────────────────────────────
// @MX:ANCHOR: [AUTO] Pilot interpretation resolver registry
// @MX:REASON: All 16 pilot axes resolve through this map; fan_in grows as resolvers are added

const __RESOLVERS = {
  INPUT_TARGET_SALARY_JUMP_INTENSITY:     resolveSalaryJumpIntensity,
  INPUT_CURRENT_COMPENSATION_LEVEL:       resolveCurrentCompLevel,
  INPUT_COMP_MARKET_VALUE_POSITION:       resolveCompMarketValue,
  INPUT_SALARY_GROWTH_LOGIC_FIT:          resolveSalaryGrowthLogicFit,
  INPUT_COMPENSATION_EXPECTED_ROLE_LEVEL: resolveCompensationExpectedRoleLevel,
  INPUT_LEVEL_YEARS_EXPECTATION_FIT:      resolveLevelYearsExpectationFit,
  INPUT_ROLE_SCOPE_FIT:                   resolveRoleScopeFit,
  INPUT_RESPONSIBILITY_DEPTH_FIT:         resolveResponsibilityDepthFit,
  INPUT_DECISION_DISTANCE_FIT:            resolveDecisionDistanceFit,
  INPUT_LEVEL_SENIORITY_ESTIMATION_FIT:   resolveLevelSeniorityFit,
  INPUT_INDUSTRY_TRANSITION:              resolveIndustryTransition,
  INPUT_COMPANY_SIZE_TRANSITIONALITY:     resolveOrgScale,
  INPUT_COMPANY_SIZE_MISMATCH_RISK:       resolveOrgScale,
  INPUT_LEADERSHIP_EXPERIENCE_FIT:              resolveLeadershipScope,
  INPUT_LEADERSHIP_OVER_OR_UNDER_SIGNAL:        resolveLeadershipScope,
  INPUT_LEADERSHIP_EXPERIENCE_OFFSET_POTENTIAL: resolveLeadershipScope,
};

/**
 * resolveAxisInterpretation
 *
 * @param {{ axisId, axisEvidence, asset, entry, resolvedStateKey, frame }} params
 * @returns {{ evidenceFor, evidenceAgainst, missingProof, debug }} — partial axisInterpretation
 */
export function resolveAxisInterpretation({ axisId, axisEvidence, asset, entry, resolvedStateKey, frame }) {
  const resolver = __RESOLVERS[axisId];
  if (!resolver) {
    return {
      evidenceFor:     [],
      evidenceAgainst: [],
      missingProof:    [],
      debug: { comparisonSummary: null, note: "no_pilot_resolver_registered" },
    };
  }
  return resolver({ axisEvidence, asset, entry, resolvedStateKey, frame });
}
