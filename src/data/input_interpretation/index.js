// src/data/input_interpretation/index.js
// Axis Registry SSOT — Contract B fulfillment
//
// Rules:
//   - canonical key is axis id only
//   - label lookup FORBIDDEN
//   - file path lookup FORBIDDEN (use registry entry assetPath for diagnostics only)
//   - registry stores metadata/index only; getAxisAssetById returns full asset
//   - Axis Asset SSOT is valid only if runtime reads through this file
//   - no direct asset discovery outside registry
//   - no scoring / ranking / UI logic here

// ─────────────────────────────────────────────────────────────────────────────
// imports — 53 axis assets
// ─────────────────────────────────────────────────────────────────────────────

import { INPUT_CAREER_CONSISTENCY }            from "./career_accumulation/career_consistency.js";
import { INPUT_CAREER_CONTINUITY }             from "./career_accumulation/career_continuity.js";
import { INPUT_CAREER_GAP_INTENSITY }          from "./career_accumulation/gap_intensity.js";
import { INPUT_JOB_CHANGE_FREQUENCY }          from "./career_accumulation/job_change_frequency.js";
import { INPUT_RELATED_EXPERIENCE_LEVEL }      from "./career_accumulation/relevant_experience_level.js";
import { INPUT_CAREER_TOTAL_EXPERIENCE_LEVEL } from "./career_accumulation/total_experience_level.js";

import { INPUT_COMPANY_SCALE_TRANSITION_DIFFICULTY } from "./compensation_market_mobility/company_size_transition_difficulty.js";
import { INPUT_CURRENT_COMPENSATION_LEVEL }          from "./compensation_market_mobility/current_salary_level.js";
import { INPUT_COMPENSATION_EXPECTED_ROLE_LEVEL }    from "./compensation_market_mobility/expected_role_level_vs_compensation.js";
import { INPUT_COMP_MARKET_VALUE_POSITION }          from "./compensation_market_mobility/market_value_vs_compensation_position.js";
import { INPUT_SALARY_GROWTH_LOGIC_FIT }             from "./compensation_market_mobility/salary_growth_logic_fit.js";
import { INPUT_TARGET_SALARY_JUMP_INTENSITY }        from "./compensation_market_mobility/target_salary_jump_intensity.js";

import { INPUT_FOUNDATION_CERT_EDU_SIGNAL }     from "./education_foundation_signals/certification_training_signal.js";
import { INPUT_EARLY_CAREER_ENTRY_CREDIBILITY } from "./education_foundation_signals/early_career_entry_credibility.js";
import { INPUT_EDUCATION_COMPENSATION_NEED }    from "./education_foundation_signals/education_compensation_need.js";
import { INPUT_EDUCATION_REQUIRED_FIT }         from "./education_foundation_signals/education_requirement_fit.js";
import { INPUT_FINAL_EDUCATION_LEVEL }          from "./education_foundation_signals/highest_education_level.js";
import { INPUT_MAJOR_RELEVANCE }                from "./education_foundation_signals/major_relevance.js";

import { INPUT_DECISION_DISTANCE_FIT }           from "./level_position_fit/decision_distance_fit.js";
import { INPUT_LEVEL_YEARS_EXPECTATION_FIT }     from "./level_position_fit/expected_seniority_fit.js";
import { INPUT_LEADERSHIP_EXPERIENCE_FIT }       from "./level_position_fit/leadership_experience_fit.js";
import { INPUT_ORGANIZATIONAL_IMPACT_SCOPE_FIT } from "./level_position_fit/organizational_impact_scope_fit.js";
import { INPUT_RESPONSIBILITY_DEPTH_FIT }        from "./level_position_fit/responsibility_depth_fit.js";
import { INPUT_ROLE_SCOPE_FIT }                  from "./level_position_fit/role_scope_fit.js";
import { INPUT_LEVEL_SENIORITY_ESTIMATION_FIT }  from "./level_position_fit/title_level_inference_fit.js";

import { INPUT_COMPANY_SIZE_MISMATCH_RISK }      from "./mobility_risk_signals/company_size_mismatch_risk.js";
import { INPUT_EDUCATION_FILTER_RISK }           from "./mobility_risk_signals/education_filter_risk.js";
import { INPUT_FREQUENT_JOB_CHANGE_RISK }        from "./mobility_risk_signals/frequent_job_change_risk.js";
import { INPUT_LEADERSHIP_OVER_OR_UNDER_SIGNAL } from "./mobility_risk_signals/leadership_overstatement_or_gap_risk.js";
import { INPUT_LONG_CAREER_GAP_RISK }            from "./mobility_risk_signals/long_gap_risk.js";
import { INPUT_OVEREXPERIENCE_RISK }             from "./mobility_risk_signals/over_experience_risk.js";
import { INPUT_RISK_STEEP_SALARY_JUMP }          from "./mobility_risk_signals/steep_salary_jump_risk.js";
import { INPUT_INSUFFICIENT_YEARS_RISK }         from "./mobility_risk_signals/under_experience_risk.js";

import { INPUT_COMPANY_SIZE_TRANSITIONALITY }          from "./organizational_context_transition/company_size_transitionability.js";
import { INPUT_CONTEXT_DECISION_STRUCTURE_TRANSITION } from "./organizational_context_transition/decision_structure_transitionability.js";
import { INPUT_INDUSTRY_TRANSITION }                   from "./organizational_context_transition/industry_transitionability.js";
import { INPUT_FUNCTION_TRANSITIONABILITY }            from "./organizational_context_transition/job_function_transitionability.js";
import { INPUT_MARKET_MODEL_TRANSITION }               from "./organizational_context_transition/market_type_transitionability.js";
import { INPUT_OPERATING_RHYTHM_TRANSITION }           from "./organizational_context_transition/operating_rhythm_transitionability.js";
import { INPUT_PERFORMANCE_PROOF_TRANSITIONALITY }     from "./organizational_context_transition/performance_proof_transitionability.js";

import { INPUT_BRAND_OR_COMPANY_CONTEXT_OFFSET }        from "./persuasion_potential_signals/brand_company_context_offset_potential.js";
import { INPUT_DOMAIN_FIT_COMPENSATION_POTENTIAL }      from "./persuasion_potential_signals/domain_fit_offset_potential.js";
import { INPUT_EDUCATION_WEAKNESS_OFFSET_POTENTIAL }    from "./persuasion_potential_signals/education_weakness_offset_potential.js";
import { INPUT_LEADERSHIP_EXPERIENCE_OFFSET_POTENTIAL } from "./persuasion_potential_signals/leadership_offset_potential.js";
import { INPUT_PERFORMANCE_BASED_OFFSET_POTENTIAL }     from "./persuasion_potential_signals/performance_based_offset_potential.js";
import { INPUT_PERSUASION_RARE_EXPERIENCE_OFFSET }      from "./persuasion_potential_signals/rare_experience_offset_potential.js";
import { INPUT_SALARY_JUMP_PERSUASION_POTENTIAL }       from "./persuasion_potential_signals/salary_jump_persuasion_potential.js";

import { INPUT_REPORT_EXPECTATION_LEVEL_SUMMARY } from "./report_context_translation/expected_level_summary.js";
import { INPUT_IMPROVEMENT_POINT_TRANSLATION }    from "./report_context_translation/improvement_needed_points.js";
import { INPUT_MARKET_BENCHMARK_SUMMARY }         from "./report_context_translation/market_benchmark_summary.js";
import { INPUT_REPORT_RISK_SUMMARY }              from "./report_context_translation/risk_summary.js";
import { INPUT_STRENGTH_HIGHLIGHT_POINTS }        from "./report_context_translation/strength_positioning_points.js";
import { INPUT_TRANSITION_DIFFICULTY_SUMMARY }    from "./report_context_translation/transition_difficulty_summary.js";

// ─────────────────────────────────────────────────────────────────────────────
// internal: asset manifest
// Sole authoritative list of assetKey ↔ assetPath bindings.
// Must stay in sync with import declarations above.
// ─────────────────────────────────────────────────────────────────────────────

const __ASSET_MANIFEST = [
  // CAREER_ACCUMULATION (6)
  { assetKey: "INPUT_CAREER_CONSISTENCY",            assetPath: "./career_accumulation/career_consistency.js" },
  { assetKey: "INPUT_CAREER_CONTINUITY",             assetPath: "./career_accumulation/career_continuity.js" },
  { assetKey: "INPUT_CAREER_GAP_INTENSITY",          assetPath: "./career_accumulation/gap_intensity.js" },
  { assetKey: "INPUT_JOB_CHANGE_FREQUENCY",          assetPath: "./career_accumulation/job_change_frequency.js" },
  { assetKey: "INPUT_RELATED_EXPERIENCE_LEVEL",      assetPath: "./career_accumulation/relevant_experience_level.js" },
  { assetKey: "INPUT_CAREER_TOTAL_EXPERIENCE_LEVEL", assetPath: "./career_accumulation/total_experience_level.js" },
  // COMPENSATION_MARKET_MOBILITY (6)
  { assetKey: "INPUT_COMPANY_SCALE_TRANSITION_DIFFICULTY", assetPath: "./compensation_market_mobility/company_size_transition_difficulty.js" },
  { assetKey: "INPUT_CURRENT_COMPENSATION_LEVEL",          assetPath: "./compensation_market_mobility/current_salary_level.js" },
  { assetKey: "INPUT_COMPENSATION_EXPECTED_ROLE_LEVEL",    assetPath: "./compensation_market_mobility/expected_role_level_vs_compensation.js" },
  { assetKey: "INPUT_COMP_MARKET_VALUE_POSITION",          assetPath: "./compensation_market_mobility/market_value_vs_compensation_position.js" },
  { assetKey: "INPUT_SALARY_GROWTH_LOGIC_FIT",             assetPath: "./compensation_market_mobility/salary_growth_logic_fit.js" },
  { assetKey: "INPUT_TARGET_SALARY_JUMP_INTENSITY",        assetPath: "./compensation_market_mobility/target_salary_jump_intensity.js" },
  // EDUCATION_FOUNDATION_SIGNALS (6)
  { assetKey: "INPUT_FOUNDATION_CERT_EDU_SIGNAL",     assetPath: "./education_foundation_signals/certification_training_signal.js" },
  { assetKey: "INPUT_EARLY_CAREER_ENTRY_CREDIBILITY", assetPath: "./education_foundation_signals/early_career_entry_credibility.js" },
  { assetKey: "INPUT_EDUCATION_COMPENSATION_NEED",    assetPath: "./education_foundation_signals/education_compensation_need.js" },
  { assetKey: "INPUT_EDUCATION_REQUIRED_FIT",         assetPath: "./education_foundation_signals/education_requirement_fit.js" },
  { assetKey: "INPUT_FINAL_EDUCATION_LEVEL",          assetPath: "./education_foundation_signals/highest_education_level.js" },
  { assetKey: "INPUT_MAJOR_RELEVANCE",                assetPath: "./education_foundation_signals/major_relevance.js" },
  // LEVEL_POSITION_FIT (7)
  { assetKey: "INPUT_DECISION_DISTANCE_FIT",           assetPath: "./level_position_fit/decision_distance_fit.js" },
  { assetKey: "INPUT_LEVEL_YEARS_EXPECTATION_FIT",     assetPath: "./level_position_fit/expected_seniority_fit.js" },
  { assetKey: "INPUT_LEADERSHIP_EXPERIENCE_FIT",       assetPath: "./level_position_fit/leadership_experience_fit.js" },
  { assetKey: "INPUT_ORGANIZATIONAL_IMPACT_SCOPE_FIT", assetPath: "./level_position_fit/organizational_impact_scope_fit.js" },
  { assetKey: "INPUT_RESPONSIBILITY_DEPTH_FIT",        assetPath: "./level_position_fit/responsibility_depth_fit.js" },
  { assetKey: "INPUT_ROLE_SCOPE_FIT",                  assetPath: "./level_position_fit/role_scope_fit.js" },
  { assetKey: "INPUT_LEVEL_SENIORITY_ESTIMATION_FIT",  assetPath: "./level_position_fit/title_level_inference_fit.js" },
  // MOBILITY_RISK_SIGNALS (8)
  { assetKey: "INPUT_COMPANY_SIZE_MISMATCH_RISK",      assetPath: "./mobility_risk_signals/company_size_mismatch_risk.js" },
  { assetKey: "INPUT_EDUCATION_FILTER_RISK",           assetPath: "./mobility_risk_signals/education_filter_risk.js" },
  { assetKey: "INPUT_FREQUENT_JOB_CHANGE_RISK",        assetPath: "./mobility_risk_signals/frequent_job_change_risk.js" },
  { assetKey: "INPUT_LEADERSHIP_OVER_OR_UNDER_SIGNAL", assetPath: "./mobility_risk_signals/leadership_overstatement_or_gap_risk.js" },
  { assetKey: "INPUT_LONG_CAREER_GAP_RISK",            assetPath: "./mobility_risk_signals/long_gap_risk.js" },
  { assetKey: "INPUT_OVEREXPERIENCE_RISK",             assetPath: "./mobility_risk_signals/over_experience_risk.js" },
  { assetKey: "INPUT_RISK_STEEP_SALARY_JUMP",          assetPath: "./mobility_risk_signals/steep_salary_jump_risk.js" },
  { assetKey: "INPUT_INSUFFICIENT_YEARS_RISK",         assetPath: "./mobility_risk_signals/under_experience_risk.js" },
  // ORGANIZATIONAL_CONTEXT_TRANSITION (7)
  { assetKey: "INPUT_COMPANY_SIZE_TRANSITIONALITY",          assetPath: "./organizational_context_transition/company_size_transitionability.js" },
  { assetKey: "INPUT_CONTEXT_DECISION_STRUCTURE_TRANSITION", assetPath: "./organizational_context_transition/decision_structure_transitionability.js" },
  { assetKey: "INPUT_INDUSTRY_TRANSITION",                   assetPath: "./organizational_context_transition/industry_transitionability.js" },
  { assetKey: "INPUT_FUNCTION_TRANSITIONABILITY",            assetPath: "./organizational_context_transition/job_function_transitionability.js" },
  { assetKey: "INPUT_MARKET_MODEL_TRANSITION",               assetPath: "./organizational_context_transition/market_type_transitionability.js" },
  { assetKey: "INPUT_OPERATING_RHYTHM_TRANSITION",           assetPath: "./organizational_context_transition/operating_rhythm_transitionability.js" },
  { assetKey: "INPUT_PERFORMANCE_PROOF_TRANSITIONALITY",     assetPath: "./organizational_context_transition/performance_proof_transitionability.js" },
  // PERSUASION_POTENTIAL_SIGNALS (7)
  { assetKey: "INPUT_BRAND_OR_COMPANY_CONTEXT_OFFSET",        assetPath: "./persuasion_potential_signals/brand_company_context_offset_potential.js" },
  { assetKey: "INPUT_DOMAIN_FIT_COMPENSATION_POTENTIAL",      assetPath: "./persuasion_potential_signals/domain_fit_offset_potential.js" },
  { assetKey: "INPUT_EDUCATION_WEAKNESS_OFFSET_POTENTIAL",    assetPath: "./persuasion_potential_signals/education_weakness_offset_potential.js" },
  { assetKey: "INPUT_LEADERSHIP_EXPERIENCE_OFFSET_POTENTIAL", assetPath: "./persuasion_potential_signals/leadership_offset_potential.js" },
  { assetKey: "INPUT_PERFORMANCE_BASED_OFFSET_POTENTIAL",     assetPath: "./persuasion_potential_signals/performance_based_offset_potential.js" },
  { assetKey: "INPUT_PERSUASION_RARE_EXPERIENCE_OFFSET",      assetPath: "./persuasion_potential_signals/rare_experience_offset_potential.js" },
  { assetKey: "INPUT_SALARY_JUMP_PERSUASION_POTENTIAL",       assetPath: "./persuasion_potential_signals/salary_jump_persuasion_potential.js" },
  // REPORT_CONTEXT_TRANSLATION (6)
  { assetKey: "INPUT_REPORT_EXPECTATION_LEVEL_SUMMARY", assetPath: "./report_context_translation/expected_level_summary.js" },
  { assetKey: "INPUT_IMPROVEMENT_POINT_TRANSLATION",    assetPath: "./report_context_translation/improvement_needed_points.js" },
  { assetKey: "INPUT_MARKET_BENCHMARK_SUMMARY",         assetPath: "./report_context_translation/market_benchmark_summary.js" },
  { assetKey: "INPUT_REPORT_RISK_SUMMARY",              assetPath: "./report_context_translation/risk_summary.js" },
  { assetKey: "INPUT_STRENGTH_HIGHLIGHT_POINTS",        assetPath: "./report_context_translation/strength_positioning_points.js" },
  { assetKey: "INPUT_TRANSITION_DIFFICULTY_SUMMARY",    assetPath: "./report_context_translation/transition_difficulty_summary.js" },
];

// ─────────────────────────────────────────────────────────────────────────────
// internal: assetKey → asset object binding
// One authoritative map. Any new import MUST be added here.
// ─────────────────────────────────────────────────────────────────────────────

const __ASSET_OBJECT_MAP = {
  INPUT_CAREER_CONSISTENCY:            INPUT_CAREER_CONSISTENCY,
  INPUT_CAREER_CONTINUITY:             INPUT_CAREER_CONTINUITY,
  INPUT_CAREER_GAP_INTENSITY:          INPUT_CAREER_GAP_INTENSITY,
  INPUT_JOB_CHANGE_FREQUENCY:          INPUT_JOB_CHANGE_FREQUENCY,
  INPUT_RELATED_EXPERIENCE_LEVEL:      INPUT_RELATED_EXPERIENCE_LEVEL,
  INPUT_CAREER_TOTAL_EXPERIENCE_LEVEL: INPUT_CAREER_TOTAL_EXPERIENCE_LEVEL,

  INPUT_COMPANY_SCALE_TRANSITION_DIFFICULTY: INPUT_COMPANY_SCALE_TRANSITION_DIFFICULTY,
  INPUT_CURRENT_COMPENSATION_LEVEL:          INPUT_CURRENT_COMPENSATION_LEVEL,
  INPUT_COMPENSATION_EXPECTED_ROLE_LEVEL:    INPUT_COMPENSATION_EXPECTED_ROLE_LEVEL,
  INPUT_COMP_MARKET_VALUE_POSITION:          INPUT_COMP_MARKET_VALUE_POSITION,
  INPUT_SALARY_GROWTH_LOGIC_FIT:             INPUT_SALARY_GROWTH_LOGIC_FIT,
  INPUT_TARGET_SALARY_JUMP_INTENSITY:        INPUT_TARGET_SALARY_JUMP_INTENSITY,

  INPUT_FOUNDATION_CERT_EDU_SIGNAL:     INPUT_FOUNDATION_CERT_EDU_SIGNAL,
  INPUT_EARLY_CAREER_ENTRY_CREDIBILITY: INPUT_EARLY_CAREER_ENTRY_CREDIBILITY,
  INPUT_EDUCATION_COMPENSATION_NEED:    INPUT_EDUCATION_COMPENSATION_NEED,
  INPUT_EDUCATION_REQUIRED_FIT:         INPUT_EDUCATION_REQUIRED_FIT,
  INPUT_FINAL_EDUCATION_LEVEL:          INPUT_FINAL_EDUCATION_LEVEL,
  INPUT_MAJOR_RELEVANCE:                INPUT_MAJOR_RELEVANCE,

  INPUT_DECISION_DISTANCE_FIT:           INPUT_DECISION_DISTANCE_FIT,
  INPUT_LEVEL_YEARS_EXPECTATION_FIT:     INPUT_LEVEL_YEARS_EXPECTATION_FIT,
  INPUT_LEADERSHIP_EXPERIENCE_FIT:       INPUT_LEADERSHIP_EXPERIENCE_FIT,
  INPUT_ORGANIZATIONAL_IMPACT_SCOPE_FIT: INPUT_ORGANIZATIONAL_IMPACT_SCOPE_FIT,
  INPUT_RESPONSIBILITY_DEPTH_FIT:        INPUT_RESPONSIBILITY_DEPTH_FIT,
  INPUT_ROLE_SCOPE_FIT:                  INPUT_ROLE_SCOPE_FIT,
  INPUT_LEVEL_SENIORITY_ESTIMATION_FIT:  INPUT_LEVEL_SENIORITY_ESTIMATION_FIT,

  INPUT_COMPANY_SIZE_MISMATCH_RISK:      INPUT_COMPANY_SIZE_MISMATCH_RISK,
  INPUT_EDUCATION_FILTER_RISK:           INPUT_EDUCATION_FILTER_RISK,
  INPUT_FREQUENT_JOB_CHANGE_RISK:        INPUT_FREQUENT_JOB_CHANGE_RISK,
  INPUT_LEADERSHIP_OVER_OR_UNDER_SIGNAL: INPUT_LEADERSHIP_OVER_OR_UNDER_SIGNAL,
  INPUT_LONG_CAREER_GAP_RISK:            INPUT_LONG_CAREER_GAP_RISK,
  INPUT_OVEREXPERIENCE_RISK:             INPUT_OVEREXPERIENCE_RISK,
  INPUT_RISK_STEEP_SALARY_JUMP:          INPUT_RISK_STEEP_SALARY_JUMP,
  INPUT_INSUFFICIENT_YEARS_RISK:         INPUT_INSUFFICIENT_YEARS_RISK,

  INPUT_COMPANY_SIZE_TRANSITIONALITY:          INPUT_COMPANY_SIZE_TRANSITIONALITY,
  INPUT_CONTEXT_DECISION_STRUCTURE_TRANSITION: INPUT_CONTEXT_DECISION_STRUCTURE_TRANSITION,
  INPUT_INDUSTRY_TRANSITION:                   INPUT_INDUSTRY_TRANSITION,
  INPUT_FUNCTION_TRANSITIONABILITY:            INPUT_FUNCTION_TRANSITIONABILITY,
  INPUT_MARKET_MODEL_TRANSITION:               INPUT_MARKET_MODEL_TRANSITION,
  INPUT_OPERATING_RHYTHM_TRANSITION:           INPUT_OPERATING_RHYTHM_TRANSITION,
  INPUT_PERFORMANCE_PROOF_TRANSITIONALITY:     INPUT_PERFORMANCE_PROOF_TRANSITIONALITY,

  INPUT_BRAND_OR_COMPANY_CONTEXT_OFFSET:        INPUT_BRAND_OR_COMPANY_CONTEXT_OFFSET,
  INPUT_DOMAIN_FIT_COMPENSATION_POTENTIAL:      INPUT_DOMAIN_FIT_COMPENSATION_POTENTIAL,
  INPUT_EDUCATION_WEAKNESS_OFFSET_POTENTIAL:    INPUT_EDUCATION_WEAKNESS_OFFSET_POTENTIAL,
  INPUT_LEADERSHIP_EXPERIENCE_OFFSET_POTENTIAL: INPUT_LEADERSHIP_EXPERIENCE_OFFSET_POTENTIAL,
  INPUT_PERFORMANCE_BASED_OFFSET_POTENTIAL:     INPUT_PERFORMANCE_BASED_OFFSET_POTENTIAL,
  INPUT_PERSUASION_RARE_EXPERIENCE_OFFSET:      INPUT_PERSUASION_RARE_EXPERIENCE_OFFSET,
  INPUT_SALARY_JUMP_PERSUASION_POTENTIAL:       INPUT_SALARY_JUMP_PERSUASION_POTENTIAL,

  INPUT_REPORT_EXPECTATION_LEVEL_SUMMARY: INPUT_REPORT_EXPECTATION_LEVEL_SUMMARY,
  INPUT_IMPROVEMENT_POINT_TRANSLATION:    INPUT_IMPROVEMENT_POINT_TRANSLATION,
  INPUT_MARKET_BENCHMARK_SUMMARY:         INPUT_MARKET_BENCHMARK_SUMMARY,
  INPUT_REPORT_RISK_SUMMARY:              INPUT_REPORT_RISK_SUMMARY,
  INPUT_STRENGTH_HIGHLIGHT_POINTS:        INPUT_STRENGTH_HIGHLIGHT_POINTS,
  INPUT_TRANSITION_DIFFICULTY_SUMMARY:    INPUT_TRANSITION_DIFFICULTY_SUMMARY,
};

// ─────────────────────────────────────────────────────────────────────────────
// internal: registry entry builder
// Derives metadata from live asset object. Never copies content fields.
// ─────────────────────────────────────────────────────────────────────────────

function __buildRegistryEntry(assetKey, assetPath) {
  const asset = __ASSET_OBJECT_MAP[assetKey];
  if (!asset || typeof asset !== "object") return null;
  const rawSignals = Array.isArray(asset.inputSignals) ? asset.inputSignals : [];
  // inputSignalKeys: extract key from object shape if available, fallback to raw string
  const inputSignalKeys = rawSignals
    .map((sig) => {
      if (sig && typeof sig === "object" && sig.key) return sig.key;
      if (typeof sig === "string") return sig;
      return null;
    })
    .filter(Boolean);
  return {
    id:            asset.id,
    categoryId:    asset.categoryId,
    subcategoryId: asset.subcategoryId,
    assetKey,
    assetPath,
    inputSignalKeys,
    active: true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// public: axisRegistryEntries — array of registry metadata objects
// One entry per axis asset. Does not contain full asset content.
// ─────────────────────────────────────────────────────────────────────────────

export const axisRegistryEntries = __ASSET_MANIFEST
  .map(({ assetKey, assetPath }) => __buildRegistryEntry(assetKey, assetPath))
  .filter(Boolean);

// ─────────────────────────────────────────────────────────────────────────────
// public: axisById — id → full asset object
// Use getAxisAssetById(id) instead for safe access.
// ─────────────────────────────────────────────────────────────────────────────

export const axisById = Object.fromEntries(
  __ASSET_MANIFEST
    .map(({ assetKey }) => {
      const asset = __ASSET_OBJECT_MAP[assetKey];
      return asset ? [asset.id, asset] : null;
    })
    .filter(Boolean)
);

// ─────────────────────────────────────────────────────────────────────────────
// internal: index maps (built once at module load)
// ─────────────────────────────────────────────────────────────────────────────

const __registryEntryById = Object.fromEntries(
  axisRegistryEntries.map((e) => [e.id, e])
);

// ─────────────────────────────────────────────────────────────────────────────
// public: grouped lookup maps
// ─────────────────────────────────────────────────────────────────────────────

export const axesByCategory = axisRegistryEntries.reduce((acc, e) => {
  if (!acc[e.categoryId]) acc[e.categoryId] = [];
  acc[e.categoryId].push(e);
  return acc;
}, {});

export const axesBySubcategory = axisRegistryEntries.reduce((acc, e) => {
  if (!acc[e.subcategoryId]) acc[e.subcategoryId] = [];
  acc[e.subcategoryId].push(e);
  return acc;
}, {});

// many-to-many: one signal key may appear in multiple axes
export const axesByInputSignalKey = axisRegistryEntries.reduce((acc, e) => {
  for (const sigKey of e.inputSignalKeys) {
    if (!acc[sigKey]) acc[sigKey] = [];
    acc[sigKey].push(e);
  }
  return acc;
}, {});

// ─────────────────────────────────────────────────────────────────────────────
// public: accessor functions
// ─────────────────────────────────────────────────────────────────────────────

export function getAllAxisRegistryEntries() {
  return axisRegistryEntries;
}

export function getAxisRegistryEntryById(axisId) {
  if (!axisId || typeof axisId !== "string") return null;
  return __registryEntryById[axisId] ?? null;
}

// Primary runtime lookup. Called by producer path in next D-contract round.
export function getAxisAssetById(axisId) {
  if (!axisId || typeof axisId !== "string") return null;
  return axisById[axisId] ?? null;
}

export function getAxisEntriesByCategory(categoryId) {
  if (!categoryId || typeof categoryId !== "string") return [];
  return axesByCategory[categoryId] ?? [];
}

export function getAxisEntriesBySubcategory(subcategoryId) {
  if (!subcategoryId || typeof subcategoryId !== "string") return [];
  return axesBySubcategory[subcategoryId] ?? [];
}

export function getAxisEntriesByInputSignalKey(signalKey) {
  if (!signalKey || typeof signalKey !== "string") return [];
  return axesByInputSignalKey[signalKey] ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// validation: validateAxisRegistryConsistency
//
// Checks:
//   - duplicate axis id
//   - missing asset binding
//   - orphan asset (in ASSET_OBJECT_MAP but not in MANIFEST)
//   - asset/registry id mismatch
//   - category/subcategory missing
//   - input signal drift (non-standard string array shape)
//   - inactive but referenced (future guard)
//
// Grade criteria:
//   A — all required + all semi-required + stateModel semi-required
//       (severity, defaultPosture, evidenceFocus) + inputSignals as object array
//   B — all required + all semi-required (interpretationFocus, evidenceGuide,
//       examplePhrases) + stateModel minimal (key, label, meaning, reportHint)
//       + inputSignals as string array
//   C — all required + stateModel minimal + missing some semi-required
//   D — missing any required field
// ─────────────────────────────────────────────────────────────────────────────

const __REQUIRED_KEYS      = ["id", "categoryId", "subcategoryId", "label", "definition", "reviewIntent", "reportIntent", "inputSignals", "stateModel", "summaryTemplate"];
const __SEMI_REQUIRED_KEYS = ["interpretationFocus", "evidenceGuide", "examplePhrases"];
const __STATEMODEL_MIN     = ["key", "label", "meaning", "reportHint"];
const __STATEMODEL_SEMI    = ["severity", "defaultPosture", "evidenceFocus"];

function __gradeAsset(asset) {
  if (!asset || typeof asset !== "object") return { grade: "D", reasons: ["asset_missing"] };
  const reasons = [];

  // Required
  for (const k of __REQUIRED_KEYS) {
    if (asset[k] === undefined || asset[k] === null) {
      reasons.push(`required_missing:${k}`);
    }
  }
  if (reasons.length) return { grade: "D", reasons };

  // stateModel minimal shape
  const stateModel = Array.isArray(asset.stateModel) ? asset.stateModel : [];
  for (const state of stateModel) {
    for (const sk of __STATEMODEL_MIN) {
      if (!state[sk]) reasons.push(`stateModel_min_missing:${sk}`);
    }
  }
  if (reasons.length) return { grade: "C", reasons };

  // Semi-required
  for (const k of __SEMI_REQUIRED_KEYS) {
    if (!asset[k]) reasons.push(`semi_required_missing:${k}`);
  }
  if (reasons.length) return { grade: "C", reasons };

  // inputSignals proper object shape
  const inputSignals = Array.isArray(asset.inputSignals) ? asset.inputSignals : [];
  const hasProperInputShape = inputSignals.length > 0 &&
    inputSignals.every((s) => s && typeof s === "object" && s.key && s.required !== undefined && s.sourceType);
  if (!hasProperInputShape) reasons.push("input_signal_shape_non_standard");

  // stateModel semi-required
  const hasStateModelSemi = stateModel.length > 0 &&
    stateModel.every((s) => __STATEMODEL_SEMI.every((sk) => s[sk] !== undefined));
  if (!hasStateModelSemi) reasons.push("stateModel_semi_keys_missing");

  if (reasons.length) return { grade: "B", reasons };
  return { grade: "A", reasons: [] };
}

export function validateAxisRegistryConsistency() {
  const errors   = [];
  const warnings = [];
  const grades   = { A: 0, B: 0, C: 0, D: 0 };
  const gradeDetails = [];
  const seenIds  = new Set();

  const manifestKeys = new Set(__ASSET_MANIFEST.map((m) => m.assetKey));

  for (const { assetKey, assetPath } of __ASSET_MANIFEST) {
    const asset = __ASSET_OBJECT_MAP[assetKey];

    if (!asset) {
      errors.push({ type: "missing_asset_binding", assetKey, assetPath });
      grades.D++;
      gradeDetails.push({ assetKey, assetPath, id: null, grade: "D", reasons: ["missing_asset_binding"] });
      continue;
    }

    if (!asset.id) {
      errors.push({ type: "asset_id_missing", assetKey });
      grades.D++;
      gradeDetails.push({ assetKey, assetPath, id: null, grade: "D", reasons: ["asset_id_missing"] });
      continue;
    }

    if (seenIds.has(asset.id)) {
      errors.push({ type: "duplicate_axis_id", id: asset.id, assetKey });
    }
    seenIds.add(asset.id);

    if (!asset.categoryId)    errors.push({ type: "category_missing",    id: asset.id, assetKey });
    if (!asset.subcategoryId) errors.push({ type: "subcategory_missing", id: asset.id, assetKey });

    // input signal drift
    const inputSignals = Array.isArray(asset.inputSignals) ? asset.inputSignals : [];
    const hasStringSignals = inputSignals.some((s) => typeof s === "string");
    if (hasStringSignals) {
      warnings.push({
        type: "input_signal_shape_non_standard",
        id: asset.id,
        assetKey,
        note: "inputSignals are string array; minimal shape requires key/required/sourceType/valueType/normalizationHint",
      });
    }

    const { grade, reasons } = __gradeAsset(asset);
    grades[grade]++;
    gradeDetails.push({ id: asset.id, assetKey, assetPath, grade, reasons });
  }

  // orphan check: in ASSET_OBJECT_MAP but not in MANIFEST
  for (const key of Object.keys(__ASSET_OBJECT_MAP)) {
    if (!manifestKeys.has(key)) {
      warnings.push({ type: "orphan_asset", assetKey: key });
    }
  }

  return {
    valid:           errors.length === 0,
    registeredCount: axisRegistryEntries.length,
    errors,
    warnings,
    grades,
    gradeDetails,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// D-CONTRACT HANDOFF NOTES (Task 3)
//
// These notes identify exact anchors where getAxisAssetById(axisId) should
// enter the producer path in the next implementation round.
//
// --- Anchor 1: buildInteractionPack.js:3136 ---
// Current:  __primaryAngleToTextSeed(primaryAngle) → 12-entry hardcoded map
// Target:   getAxisAssetById(resolvedAxisId)?.summaryTemplate?.[0] ?? seed fallback
// Mapping:  primaryAngle key → axisId
//   cumulative_relevance → INPUT_CAREER_CONTINUITY (or INPUT_CAREER_CONSISTENCY)
//   scope_alignment      → INPUT_ROLE_SCOPE_FIT (or INPUT_RESPONSIBILITY_DEPTH_FIT)
//   scope_stretch        → INPUT_LEVEL_YEARS_EXPECTATION_FIT
//   market_plausibility  → INPUT_COMP_MARKET_VALUE_POSITION
//   mobility_friction    → INPUT_RISK_STEEP_SALARY_JUMP (or INPUT_COMPANY_SIZE_MISMATCH_RISK)
//   execution_fit        → INPUT_FUNCTION_TRANSITIONABILITY
//   execution_mismatch   → INPUT_OPERATING_RHYTHM_TRANSITION
//   industry_adjacency   → INPUT_INDUSTRY_TRANSITION
//   industry_friction    → INPUT_MARKET_MODEL_TRANSITION
//   risk_concentration   → INPUT_REPORT_RISK_SUMMARY
//   mixed_signal         → INPUT_REPORT_RISK_SUMMARY
//   transition_friction  → INPUT_INDUSTRY_TRANSITION (or INPUT_FUNCTION_TRANSITIONABILITY)
// Required future contract input:  { primaryAngle: string, resolvedAxisId: string | null }
// Required future contract output: string (summaryTemplate[0] from asset, fallback to current seed)
//
// --- Anchor 2: buildInterpretationPack.js:787 (careerAccumulation shortSummary) ---
// Current:  hardcoded Korean by thesis key (strong-accumulation / related-but-fragmented / ...)
// Target:   getAxisAssetById("INPUT_CAREER_CONTINUITY")?.stateModel
//             ?.find(s => s.key === resolvedStateKey)?.reportHint
// Mapping (thesis → stateKey):
//   strong-accumulation   → HIGHLY_CONTINUOUS / GENERALLY_CONTINUOUS
//   related-but-fragmented→ PARTIALLY_CONNECTED / MIXED_OR_FRAGMENTED
//   transition-building   → NONLINEAR_BUT_EXPLAINABLE
//   continuity-risk       → DISCONTINUOUS
// Required future contract input:  { primaryThesis: string, stateKey: string | null }
// Required future contract output: { shortSummary: reportHint, cautionLine: cautionNotes[0] }
//
// --- Anchor 3: buildInterpretationPack.js:901 (riskSummary headline) ---
// Current:  hardcoded Korean by thesis key (risk-led / balanced / support-led / conflicted)
// Target:   getAxisAssetById("INPUT_REPORT_RISK_SUMMARY")?.stateModel
//             ?.find(s => s.key === resolvedStateKey)?.reportHint
// Mapping (thesis → stateKey):
//   risk-led     → OWNERSHIP_HEAVY / IMPLICIT_BUT_HIGH
//   support-led  → MODERATELY_DEFINED
//   balanced     → MIXED_EXPECTATION
//   conflicted   → CLEAR_AND_STRUCTURED (conflicted reading)
//   unclear      → CONTEXT_DEPENDENT
// Required future contract input:  { primaryThesis: string, stateKey: string | null }
// Required future contract output: { headline: reportHint, cautionLine: cautionNotes[0] }
//
// --- Anchor 4: buildSimulationViewModel.js:391 (__TYPE_DETAIL_MAP) ---
// Current:  4-entry hardcoded map keyed by currentTypeCandidate label (한국어)
//   "축 명확형" / "축 잠재형" / "전환 설득형" / "맥락 보강형"
// Target:   getAxisAssetById(axisIdMatchingType)?.summaryTemplate?.[0]
//           or ?.examplePhrases?.[0]
// Candidate axis assets for type labels:
//   "축 명확형"    → INPUT_RELATED_EXPERIENCE_LEVEL / INPUT_CAREER_CONTINUITY
//   "축 잠재형"    → INPUT_CAREER_CONSISTENCY / INPUT_RESPONSIBILITY_DEPTH_FIT
//   "전환 설득형"  → INPUT_FUNCTION_TRANSITIONABILITY / INPUT_INDUSTRY_TRANSITION
//   "맥락 보강형"  → INPUT_REPORT_RISK_SUMMARY / INPUT_IMPROVEMENT_POINT_TRANSLATION
// Required future contract input:  { typeLabel: string, resolvedAxisId: string | null }
// Required future contract output: string (examplePhrases[0] or summaryTemplate[0] from asset)
//
// PRECONDITION for all anchors:
//   - getAxisAssetById must be called with a resolved axisId (not a hardcoded string)
//   - the producer path (buildInteractionPack / buildInterpretationPack / buildSimulationViewModel)
//     must receive the axisId as a parameter or derive it from existing data
//   - do NOT hardcode axisId strings at call sites; derive from candidateAxisPack or
//     interpretationPack.sections metadata
// ─────────────────────────────────────────────────────────────────────────────
