/**
 * Newgrad Axis2 Job×Industry intersection classifier v1.
 * Pure function — no registry writes, no side effects.
 */

const _PROF_SERVICE_ARCHETYPES = new Set(["legal_services"]);
const _PROF_SERVICE_COMPATIBLE_SUBVERTICALS = new Set([
  "LEGAL",
  "ACCOUNTING",
  "FINANCE",
  "MANAGEMENT_ACCOUNTING",
  "TAX",
  "INTERNAL_CONTROL",
]);

/**
 * Classify the strength and nature of a newgrad job×industry combination.
 *
 * @param {object} input
 * @param {string} input.archetypeId           - Industry archetype id from getIndustryArchetype()
 * @param {string} input.targetJobSubVertical  - Job sub-vertical from job ontology
 * @param {boolean} input.specializationFound  - Whether a specialization registry entry exists
 * @returns {object} intersection classification profile
 */
export function classifyNewgradJobIndustryIntersection({
  archetypeId = "",
  targetJobSubVertical = "",
  specializationFound = false,
} = {}) {
  const base = { archetypeId, specializationFound };

  // A. No industry archetype — cannot classify
  if (!archetypeId) {
    return {
      ...base,
      level: "unclear",
      reasonCode: "missing_archetype",
      confidence: "low",
      isNaturalFit: false,
      shouldUseNeutralFallback: false,
      shouldRequestAiBridge: false,
      shouldShowAiBridgeResult: false,
    };
  }

  // B. Specialization registry entry exists — strong, confirmed intersection
  if (specializationFound) {
    return {
      ...base,
      level: "strong",
      reasonCode: "specialization_found",
      confidence: "high",
      isNaturalFit: true,
      shouldUseNeutralFallback: false,
      shouldRequestAiBridge: true,
      shouldShowAiBridgeResult: true,
    };
  }

  const subVerticalUpper = String(targetJobSubVertical || "").toUpperCase();

  // C / D / D0. Professional service industry (e.g., legal_services)
  if (_PROF_SERVICE_ARCHETYPES.has(archetypeId)) {
    // D0. subVertical unknown — cannot determine compatibility; treat as low-confidence plausible
    if (!subVerticalUpper) {
      return {
        ...base,
        level: "plausible",
        reasonCode: "unknown_subvertical_prof_service",
        confidence: "low",
        isNaturalFit: false,
        shouldUseNeutralFallback: false,
        shouldRequestAiBridge: true,
        shouldShowAiBridgeResult: true,
      };
    }
    if (_PROF_SERVICE_COMPATIBLE_SUBVERTICALS.has(subVerticalUpper)) {
      // C. Natural fit: law/accounting/tax/finance jobs in professional service industry
      return {
        ...base,
        level: "plausible",
        reasonCode: "natural_prof_service_fit",
        confidence: "medium",
        isNaturalFit: true,
        shouldUseNeutralFallback: false,
        shouldRequestAiBridge: true,
        shouldShowAiBridgeResult: true,
      };
    }
    // D. Weak intersection: e.g., 제조혁신 × 법률/리걸서비스
    return {
      ...base,
      level: "weak",
      reasonCode: "weak_prof_service_mismatch",
      confidence: "medium",
      isNaturalFit: false,
      shouldUseNeutralFallback: true,
      shouldRequestAiBridge: true,
      shouldShowAiBridgeResult: false,
    };
  }

  // E. Archetype exists but no specialization entry — plausible, general fallback
  return {
    ...base,
    level: "plausible",
    reasonCode: "archetype_without_specialization",
    confidence: "medium",
    isNaturalFit: false,
    shouldUseNeutralFallback: false,
    shouldRequestAiBridge: true,
    shouldShowAiBridgeResult: true,
  };
}
