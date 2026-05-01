// src/lib/analysis/axisInterpretation/resolveAxisStateKey.js
//
// Translates axisEvidence comparison signals into an actual stateModel key.
// Evidence labels (steep_jump, industry_transition, etc.) are NOT stateModel keys.
// This file is the explicit translation layer between Contract C (evidence) and interpretation.
//
// Translation method types:
//   comparison_summaryKey  — from evidence.comparison.summaryKey
//   comparison_relation    — from evidence.comparison.relation
//   resolved_signal_value  — from a specific resolvedSignal value
//   status_fallback        — from evidence.status when no signal is specific enough
//   no_resolver            — no translation registered for this axis

// ─── per-axis translation functions ──────────────────────────────────────────

function __translateSalaryJumpIntensity(ev) {
  const sk = ev.comparison?.summaryKey;
  if (sk === "steep_jump")     return { resolvedStateKey: "HIGH",               method: "comparison_summaryKey" };
  if (sk === "moderate_jump")  return { resolvedStateKey: "NOTICEABLE",         method: "comparison_summaryKey" };
  if (sk === "flat_or_minor")  return { resolvedStateKey: "MODEST",             method: "comparison_summaryKey" };
  if (ev.status === "partial") return { resolvedStateKey: "CONTEXT_DEPENDENT",  method: "status_fallback" };
  return null;
}

function __translateCurrentCompLevel(ev) {
  if (ev.status === "resolved") return { resolvedStateKey: "MARKET_ALIGNED",    method: "status_fallback" };
  if (ev.status === "partial")  return { resolvedStateKey: "STRUCTURE_COMPLEX", method: "status_fallback" };
  return null;
}

function __translateCompMarketValue(ev) {
  if (ev.status === "resolved") return { resolvedStateKey: "BALANCED_WITH_MARKET_VALUE", method: "status_fallback" };
  if (ev.status === "partial")  return { resolvedStateKey: "UNCLEAR_MARKET_POSITION",    method: "status_fallback" };
  return null;
}

function __translateSalaryGrowthLogicFit(ev) {
  if (ev.status === "resolved") return { resolvedStateKey: "REASONABLE",         method: "status_fallback" };
  if (ev.status === "partial")  return { resolvedStateKey: "PARTIALLY_SUPPORTED", method: "status_fallback" };
  return null;
}

function __translateCompensationExpectedRoleLevel(ev) {
  if (ev.status === "resolved") return { resolvedStateKey: "MOSTLY_SUPPORTED",       method: "status_fallback" };
  if (ev.status === "partial")  return { resolvedStateKey: "UNCLEAR_ALIGNMENT",      method: "status_fallback" };
  return null;
}

function __translateLevelYearsExpectationFit(ev) {
  if (ev.status === "resolved") return { resolvedStateKey: "WELL_ALIGNED",             method: "status_fallback" };
  if (ev.status === "partial")  return { resolvedStateKey: "UNCLEAR_EXPECTATION_MATCH", method: "status_fallback" };
  return null;
}

function __translateRoleScopeFit(ev) {
  const rel = ev.comparison?.relation;
  if (rel === "same")      return { resolvedStateKey: "BALANCED",      method: "comparison_relation" };
  if (rel === "different") return { resolvedStateKey: "PARTIAL_MATCH", method: "comparison_relation" };
  return null;
}

function __translateResponsibilityDepthFit(ev) {
  const rel = ev.comparison?.relation;
  if (rel === "same")      return { resolvedStateKey: "BALANCED",      method: "comparison_relation" };
  if (rel === "different") return { resolvedStateKey: "PARTIAL",        method: "comparison_relation" };
  return null;
}

function __translateDecisionDistanceFit(ev) {
  const leaderSig = ev.resolvedSignals?.find((s) => s.key === "leadershipLevel");
  const level = leaderSig?.value;
  if (level === "executive" || level === "director") return { resolvedStateKey: "VERY_CLOSE", method: "resolved_signal_value" };
  if (level === "manager")                           return { resolvedStateKey: "CLOSE",       method: "resolved_signal_value" };
  if (level === "individual")                        return { resolvedStateKey: "MODERATE",    method: "resolved_signal_value" };
  if (ev.status === "partial")                       return { resolvedStateKey: "CONTEXT_SENSITIVE", method: "status_fallback" };
  return null;
}

function __translateLevelSeniorityFit(ev) {
  if (ev.status === "resolved") return { resolvedStateKey: "PRACTITIONER_LEVEL", method: "status_fallback" };
  if (ev.status === "partial")  return { resolvedStateKey: "LEVEL_MATCH_UNCLEAR", method: "status_fallback" };
  return null;
}

function __translateIndustryTransition(ev) {
  const sk = ev.comparison?.summaryKey;
  if (sk === "industry_stay")       return { resolvedStateKey: "LOW_TRANSITION",      method: "comparison_summaryKey" };
  if (sk === "industry_transition") return { resolvedStateKey: "MODERATE_TRANSITION", method: "comparison_summaryKey" };
  return null;
}

function __translateCompanySizeTransitionality(ev) {
  const rel = ev.comparison?.relation;
  if (rel === "same")      return { resolvedStateKey: "GENERALLY_ALIGNED",    method: "comparison_relation" };
  if (rel === "different") return { resolvedStateKey: "PARTIALLY_TRANSFERABLE", method: "comparison_relation" };
  return null;
}

function __translateCompanySizeMismatchRisk(ev) {
  const rel = ev.comparison?.relation;
  if (rel === "same")      return { resolvedStateKey: "LOW_RISK",      method: "comparison_relation" };
  if (rel === "different") return { resolvedStateKey: "MODERATE_RISK", method: "comparison_relation" };
  return null;
}

function __translateLeadershipFit(ev) {
  const leaderSig = ev.resolvedSignals?.find((s) => s.key === "leadershipLevel");
  const level = leaderSig?.value;
  if (level === "executive") return { resolvedStateKey: "FULL_SCOPE_LEADERSHIP",        method: "resolved_signal_value" };
  if (level === "director")  return { resolvedStateKey: "STRONG_OPERATIONAL_LEADERSHIP", method: "resolved_signal_value" };
  if (level === "manager")   return { resolvedStateKey: "PROJECT_LEAD_CENTERED",         method: "resolved_signal_value" };
  if (level === "individual") return { resolvedStateKey: "SPECIALIST_WEIGHTED",          method: "resolved_signal_value" };
  if (ev.status === "partial") return { resolvedStateKey: "EMERGING_LEADERSHIP",          method: "status_fallback" };
  return null;
}

function __translateLeadershipOverUnder(ev) {
  const leaderSig = ev.resolvedSignals?.find((s) => s.key === "leadershipLevel");
  const level = leaderSig?.value;
  if (level === "executive" || level === "director") return { resolvedStateKey: "FULL_SCOPE_LEADERSHIP",  method: "resolved_signal_value" };
  if (level === "manager")                           return { resolvedStateKey: "PROJECT_LEAD_CENTERED",  method: "resolved_signal_value" };
  if (level === "individual")                        return { resolvedStateKey: "LIMITED_LEADERSHIP_EVIDENCE", method: "resolved_signal_value" };
  return null;
}

function __translateLeadershipOffsetPotential(ev) {
  const leaderSig = ev.resolvedSignals?.find((s) => s.key === "leadershipLevel");
  const level = leaderSig?.value;
  if (level === "executive" || level === "director") return { resolvedStateKey: "FULL_SCOPE_LEADERSHIP",        method: "resolved_signal_value" };
  if (level === "manager")                           return { resolvedStateKey: "STRONG_OPERATIONAL_LEADERSHIP", method: "resolved_signal_value" };
  if (level === "individual")                        return { resolvedStateKey: "EMERGING_LEADERSHIP",           method: "resolved_signal_value" };
  return null;
}

// ─── dispatch map ─────────────────────────────────────────────────────────────

const __TRANSLATORS = {
  INPUT_TARGET_SALARY_JUMP_INTENSITY:     __translateSalaryJumpIntensity,
  INPUT_CURRENT_COMPENSATION_LEVEL:       __translateCurrentCompLevel,
  INPUT_COMP_MARKET_VALUE_POSITION:       __translateCompMarketValue,
  INPUT_SALARY_GROWTH_LOGIC_FIT:          __translateSalaryGrowthLogicFit,
  INPUT_COMPENSATION_EXPECTED_ROLE_LEVEL: __translateCompensationExpectedRoleLevel,
  INPUT_LEVEL_YEARS_EXPECTATION_FIT:      __translateLevelYearsExpectationFit,
  INPUT_ROLE_SCOPE_FIT:                   __translateRoleScopeFit,
  INPUT_RESPONSIBILITY_DEPTH_FIT:         __translateResponsibilityDepthFit,
  INPUT_DECISION_DISTANCE_FIT:            __translateDecisionDistanceFit,
  INPUT_LEVEL_SENIORITY_ESTIMATION_FIT:   __translateLevelSeniorityFit,
  INPUT_INDUSTRY_TRANSITION:              __translateIndustryTransition,
  INPUT_COMPANY_SIZE_TRANSITIONALITY:     __translateCompanySizeTransitionality,
  INPUT_COMPANY_SIZE_MISMATCH_RISK:       __translateCompanySizeMismatchRisk,
  INPUT_LEADERSHIP_EXPERIENCE_FIT:              __translateLeadershipFit,
  INPUT_LEADERSHIP_OVER_OR_UNDER_SIGNAL:        __translateLeadershipOverUnder,
  INPUT_LEADERSHIP_EXPERIENCE_OFFSET_POTENTIAL: __translateLeadershipOffsetPotential,
};

/**
 * resolveAxisStateKey
 *
 * @param {string} axisId
 * @param {object} axisEvidence  — from axisEvidenceMap.byAxisId[axisId]
 * @returns {{
 *   resolvedStateKey: string | null,
 *   translationMethod: string,
 *   confidence: number,
 *   note: string | null
 * }}
 */
export function resolveAxisStateKey(axisId, axisEvidence) {
  if (!axisId || !axisEvidence) {
    return { resolvedStateKey: null, translationMethod: "no_input", confidence: 0, note: "missing_axis_id_or_evidence" };
  }

  const translator = __TRANSLATORS[axisId];

  if (!translator) {
    return { resolvedStateKey: null, translationMethod: "no_resolver", confidence: 0, note: "no_translation_registered" };
  }

  if (axisEvidence.status === "missing" || axisEvidence.status === "not_applicable") {
    return {
      resolvedStateKey:   null,
      translationMethod:  "status_early_exit",
      confidence:         0,
      note:               `evidence_status_${axisEvidence.status}`,
    };
  }

  let result = null;
  try {
    result = translator(axisEvidence);
  } catch (err) {
    return {
      resolvedStateKey:  null,
      translationMethod: "translator_error",
      confidence:        0,
      note:              `translator_threw: ${err?.message ?? "unknown"}`,
    };
  }

  if (!result) {
    return {
      resolvedStateKey:  null,
      translationMethod: "translator_returned_null",
      confidence:        axisEvidence.confidence ?? 0,
      note:              "evidence_present_but_translation_failed",
    };
  }

  return {
    resolvedStateKey:  result.resolvedStateKey,
    translationMethod: result.method,
    confidence:        axisEvidence.confidence ?? 1,
    note:              null,
  };
}
