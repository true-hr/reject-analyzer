// src/lib/analysis/axisInterpretation/resolvePrimaryFrame.js
//
// Derives primaryFrame, tone, and severity from resolvedStateKey + axisEvidence + asset.
// Keeps headline / summary / actionGuides / interviewProbes aligned to a single frame.
//
// interpretation.state values:
//   strong_fit    — high confidence, clearly positive signal
//   supported_fit — resolved, moderately positive
//   watch         — resolved or partial, potential concern
//   risk          — resolved, concerning signal
//   blocked       — missing required evidence
//   unknown       — no resolver or failed resolution
//
// Priority base scores (before confidence weighting):
//   strong_fit: 85  |  supported_fit: 68  |  watch: 45  |  risk: 25  |  blocked: 10  |  unknown: 0

// ─── per-axis state classification tables ─────────────────────────────────────
// Maps stateModel key → interpretation state

const __AXIS_STATE_MAP = {
  INPUT_TARGET_SALARY_JUMP_INTENSITY: {
    MODEST:                    "strong_fit",
    ROLE_EXPANSION_DRIVEN:     "supported_fit",
    MARKET_REPRICING_DRIVEN:   "watch",
    NOTICEABLE:                "watch",
    HIGH:                      "risk",
    VERY_HIGH:                 "risk",
    CONTEXT_DEPENDENT:         "watch",
  },
  INPUT_CURRENT_COMPENSATION_LEVEL: {
    MARKET_LEADING:   "strong_fit",
    ABOVE_MARKET:     "supported_fit",
    MARKET_ALIGNED:   "supported_fit",
    MODEST_POSITION:  "watch",
    UNDER_MARKET:     "watch",
    STRUCTURE_COMPLEX:"watch",
  },
  INPUT_COMP_MARKET_VALUE_POSITION: {
    ABOVE_MARKET_VALUE:              "strong_fit",
    SLIGHTLY_ABOVE_MARKET_VALUE:     "supported_fit",
    BALANCED_WITH_MARKET_VALUE:      "supported_fit",
    SLIGHTLY_BELOW_MARKET_VALUE:     "watch",
    BELOW_MARKET_VALUE:              "risk",
    CONTEXT_DEPENDENT_POSITION:      "watch",
    UNCLEAR_MARKET_POSITION:         "watch",
  },
  INPUT_SALARY_GROWTH_LOGIC_FIT: {
    WELL_SUPPORTED:      "strong_fit",
    MARKET_BACKED:       "supported_fit",
    REASONABLE:          "supported_fit",
    PARTIALLY_SUPPORTED: "watch",
    WEAKLY_EXPLAINED:    "watch",
    STRETCHED:           "risk",
    UNDERPOSITIONED:     "watch",
    MISALIGNED:          "risk",
  },
  INPUT_COMPENSATION_EXPECTED_ROLE_LEVEL: {
    WELL_SUPPORTED:            "strong_fit",
    MOSTLY_SUPPORTED:          "supported_fit",
    STRETCHED_BUT_EXPLAINABLE: "watch",
    ROLE_UNDERPOWERED:         "watch",
    UNCLEAR_ALIGNMENT:         "watch",
  },
  INPUT_LEVEL_YEARS_EXPECTATION_FIT: {
    ABOVE_EXPECTATION:           "strong_fit",
    WELL_ALIGNED:                "supported_fit",
    SLIGHTLY_BELOW_EXPECTATION:  "watch",
    NON_LINEAR_BUT_EXPLAINABLE:  "watch",
    EARLY_FOR_EXPECTATION:       "watch",
    UNCLEAR_EXPECTATION_MATCH:   "watch",
    OVER_EXTENDED_FOR_SCOPE:     "risk",
  },
  INPUT_ROLE_SCOPE_FIT: {
    BROAD:                     "strong_fit",
    BALANCED:                  "supported_fit",
    EXPANDING:                 "supported_fit",
    PARTIAL_MATCH:             "watch",
    EXECUTION_HEAVY:           "watch",
    PLANNING_OR_COORDINATION_HEAVY: "watch",
    NARROW:                    "risk",
  },
  INPUT_RESPONSIBILITY_DEPTH_FIT: {
    HEAVY:        "strong_fit",
    SUBSTANTIAL:  "strong_fit",
    BALANCED:     "supported_fit",
    PARTIAL:      "watch",
    SHALLOW:      "watch",
    UNDEREXPOSED: "watch",
    OVEREXTENDED: "risk",
    MISALIGNED:   "risk",
  },
  INPUT_DECISION_DISTANCE_FIT: {
    VERY_CLOSE:        "strong_fit",
    CLOSE:             "supported_fit",
    PARTIALLY_CLOSE:   "watch",
    MODERATE:          "watch",
    DISTANT:           "risk",
    VERY_DISTANT:      "risk",
    CONTEXT_SENSITIVE: "watch",
  },
  INPUT_LEVEL_SENIORITY_ESTIMATION_FIT: {
    LEAD_TRACK_LEVEL:          "strong_fit",
    MANAGERIAL_LEVEL:          "strong_fit",
    ADVANCED_PRACTITIONER_LEVEL: "supported_fit",
    PRACTITIONER_LEVEL:        "supported_fit",
    EMERGING_LEVEL:            "watch",
    TITLE_ROLE_GAP:            "watch",
    LEVEL_MATCH_UNCLEAR:       "watch",
  },
  INPUT_INDUSTRY_TRANSITION: {
    LOW_TRANSITION:        "strong_fit",
    ADJACENT_TRANSITION:   "supported_fit",
    DOMAIN_TRANSLATABLE:   "supported_fit",
    MODERATE_TRANSITION:   "watch",
    HIGH_TRANSITION:       "risk",
    DOMAIN_INTENSIVE:      "risk",
    CROSS_INDUSTRY_READY:  "strong_fit",
  },
  INPUT_COMPANY_SIZE_TRANSITIONALITY: {
    HIGHLY_TRANSFERABLE:    "strong_fit",
    GENERALLY_ALIGNED:      "supported_fit",
    MIXED_SCALE_EXPERIENCE: "watch",
    PARTIALLY_TRANSFERABLE: "watch",
    STRETCH_TRANSITION:     "risk",
    CONTEXT_GAP_NOTICEABLE: "watch",
  },
  INPUT_COMPANY_SIZE_MISMATCH_RISK: {
    LOW_RISK:        "strong_fit",
    LIMITED_RISK:    "supported_fit",
    MODERATE_RISK:   "watch",
    NOTICEABLE_RISK: "watch",
    HIGH_RISK:       "risk",
    CONTEXT_DEPENDENT: "watch",
  },
  INPUT_LEADERSHIP_EXPERIENCE_FIT: {
    FULL_SCOPE_LEADERSHIP:        "strong_fit",
    STRONG_OPERATIONAL_LEADERSHIP: "supported_fit",
    PROJECT_LEAD_CENTERED:         "watch",
    EMERGING_LEADERSHIP:           "watch",
    SPECIALIST_WEIGHTED:           "watch",
    LIMITED_LEADERSHIP_EVIDENCE:   "risk",
  },
  INPUT_LEADERSHIP_OVER_OR_UNDER_SIGNAL: {
    FULL_SCOPE_LEADERSHIP:        "strong_fit",
    STRONG_OPERATIONAL_LEADERSHIP: "supported_fit",
    PROJECT_LEAD_CENTERED:         "watch",
    EMERGING_LEADERSHIP:           "watch",
    SPECIALIST_WEIGHTED:           "watch",
    LIMITED_LEADERSHIP_EVIDENCE:   "risk",
  },
  INPUT_LEADERSHIP_EXPERIENCE_OFFSET_POTENTIAL: {
    FULL_SCOPE_LEADERSHIP:        "strong_fit",
    STRONG_OPERATIONAL_LEADERSHIP: "supported_fit",
    PROJECT_LEAD_CENTERED:         "supported_fit",
    EMERGING_LEADERSHIP:           "watch",
    SPECIALIST_WEIGHTED:           "watch",
    LIMITED_LEADERSHIP_EVIDENCE:   "risk",
  },
};

const __BASE_SCORES = {
  strong_fit:    85,
  supported_fit: 68,
  watch:         45,
  risk:          25,
  blocked:       10,
  unknown:       0,
};

const __TONE_MAP = {
  strong_fit:    "positive",
  supported_fit: "positive",
  watch:         "neutral",
  risk:          "cautionary",
  blocked:       "cautionary",
  unknown:       "neutral",
};

const __SEVERITY_MAP = {
  strong_fit:    "low",
  supported_fit: "low",
  watch:         "medium",
  risk:          "high",
  blocked:       "medium",
  unknown:       "low",
};

/**
 * resolvePrimaryFrame
 *
 * @param {{ axisId, resolvedStateKey, axisEvidence, evidenceStatus }} params
 * @returns {{
 *   interpretationState: string,
 *   priorityScore: number,
 *   primaryFrame: string,
 *   tone: string,
 *   severity: string
 * }}
 */
export function resolvePrimaryFrame({ axisId, resolvedStateKey, axisEvidence }) {
  const evidenceStatus = axisEvidence?.status ?? "missing";

  // Early exits
  if (evidenceStatus === "missing" || evidenceStatus === "not_applicable") {
    const iState = evidenceStatus === "not_applicable" ? "blocked" : "blocked";
    return {
      interpretationState: iState,
      priorityScore:       __BASE_SCORES[iState],
      primaryFrame:        "evidence_unavailable",
      tone:                __TONE_MAP[iState],
      severity:            __SEVERITY_MAP[iState],
    };
  }

  if (!resolvedStateKey) {
    return {
      interpretationState: "unknown",
      priorityScore:       0,
      primaryFrame:        "state_unresolved",
      tone:                "neutral",
      severity:            "low",
    };
  }

  const axisStateTable = __AXIS_STATE_MAP[axisId];
  const interpretationState = axisStateTable?.[resolvedStateKey] ?? "watch";

  const confidence = axisEvidence?.confidence ?? 1;
  const base       = __BASE_SCORES[interpretationState] ?? 0;
  const priorityScore = Math.round(base * confidence);

  return {
    interpretationState,
    priorityScore,
    primaryFrame: `${interpretationState}_${resolvedStateKey.toLowerCase()}`,
    tone:         __TONE_MAP[interpretationState]     ?? "neutral",
    severity:     __SEVERITY_MAP[interpretationState] ?? "low",
  };
}
