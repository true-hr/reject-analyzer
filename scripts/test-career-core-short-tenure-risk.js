import assert from "node:assert/strict";
import {
  evaluateShortTenureRisk,
  getEmploymentTypeMetadata,
} from "../src/lib/career-core/index.js";

function assertRisk(input, expected, context, options = {}) {
  const actual = evaluateShortTenureRisk(input, options);
  for (const [key, value] of Object.entries(expected)) {
    assert.deepEqual(actual[key], value, `${context} ${key}`);
  }
  assert.equal(actual.appliedToCareerProfile, false, `${context} appliedToCareerProfile`);
  assert.ok(Array.isArray(actual.warnings), `${context} warnings array`);
  return actual;
}

assertRisk(
  { durationMonthsInclusive: 5, employmentType: "full-time" },
  {
    normalizedEmploymentType: "full_time",
    metadataVariant: "full_time",
    isShortDuration: true,
    shortTenureApplicable: true,
    shortTenureRisk: true,
    riskSignalsPossible: ["short_tenure"],
    overrideReason: null,
    confidence: "high",
  },
  "full_time 5 months"
);

assertRisk(
  { durationMonthsInclusive: 12, employmentType: "full-time" },
  { isShortDuration: false, shortTenureRisk: false, riskSignalsPossible: [], overrideReason: null },
  "full_time 12 months"
);

assertRisk(
  { durationMonthsInclusive: 13, employmentType: "full-time" },
  { isShortDuration: false, shortTenureRisk: false, riskSignalsPossible: [], overrideReason: null },
  "full_time 13 months"
);

assertRisk(
  { durationMonthsInclusive: 3, employmentType: "intern" },
  {
    normalizedEmploymentType: "internship",
    isShortDuration: true,
    shortTenureApplicable: false,
    shortTenureRisk: false,
    riskSignalsPossible: [],
    overrideReason: "internship_not_short_tenure_applicable",
  },
  "internship 3 months"
);

assertRisk(
  { durationMonthsInclusive: 6, employmentType: "experience internship" },
  { normalizedEmploymentType: "experience_internship", shortTenureRisk: false, overrideReason: "internship_not_short_tenure_applicable" },
  "experience internship 6 months"
);

assertRisk(
  { durationMonthsInclusive: 6, employmentType: "conversion internship" },
  { normalizedEmploymentType: "conversion_internship", shortTenureRisk: false, overrideReason: "internship_not_short_tenure_applicable" },
  "conversion internship 6 months"
);

assertRisk(
  { durationMonthsInclusive: 5, employmentTypeMetadata: getEmploymentTypeMetadata("contract") },
  {
    normalizedEmploymentType: "contract",
    shortTenureApplicable: "contextual",
    shortTenureRisk: "contextual",
    riskSignalsPossible: ["contract_continuity_risk"],
    overrideReason: "employment_type_contextual_short_tenure",
    confidence: "medium",
  },
  "contract 5 months"
);

assertRisk(
  { durationMonthsInclusive: 5, employmentType: "dispatch" },
  { normalizedEmploymentType: "dispatch", shortTenureRisk: "contextual", riskSignalsPossible: ["employment_stability_risk"] },
  "dispatch 5 months"
);

assertRisk(
  { durationMonthsInclusive: 5, employmentType: "freelance" },
  { normalizedEmploymentType: "freelance", shortTenureRisk: "contextual", riskSignalsPossible: ["scope_clarity_risk", "continuity_risk"] },
  "freelance 5 months"
);

assertRisk(
  { durationMonthsInclusive: 2, employmentType: "outsourcing" },
  { normalizedEmploymentType: "project_contract", metadataVariant: "outsourcing", shortTenureRisk: "contextual", riskSignalsPossible: ["scope_clarity_risk"] },
  "outsourcing 2 months"
);

assertRisk(
  { durationMonthsInclusive: 2, employmentType: "project contract" },
  { normalizedEmploymentType: "project_contract", metadataVariant: "project_contract", shortTenureRisk: "contextual", riskSignalsPossible: ["continuity_risk", "scope_clarity_risk"] },
  "project contract 2 months"
);

assertRisk(
  { durationMonthsInclusive: 4, employmentType: "trainee" },
  { normalizedEmploymentType: "training", metadataVariant: "trainee", shortTenureRisk: false, overrideReason: "training_not_work_experience" },
  "trainee 4 months"
);

assertRisk(
  { durationMonthsInclusive: 4, employmentType: "bootcamp" },
  { normalizedEmploymentType: "training", metadataVariant: "bootcamp", shortTenureRisk: false, overrideReason: "training_not_work_experience" },
  "bootcamp 4 months"
);

assertRisk(
  { durationMonthsInclusive: 5, employmentType: "gap" },
  { normalizedEmploymentType: "gap", metadataVariant: "career_gap", shortTenureRisk: false, overrideReason: "gap_not_employment_tenure" },
  "gap 5 months"
);

assertRisk(
  { durationMonthsInclusive: 5, employmentType: "career exploration" },
  { normalizedEmploymentType: "gap", metadataVariant: "career_exploration", shortTenureRisk: false, overrideReason: "gap_not_employment_tenure" },
  "career exploration 5 months"
);

assertRisk(
  { durationMonthsInclusive: 18, employmentType: "military service" },
  { normalizedEmploymentType: "military_service", isShortDuration: false, shortTenureRisk: false, overrideReason: null },
  "military service 18 months"
);

assertRisk(
  { durationMonthsInclusive: 6, employmentType: "leave of absence" },
  { normalizedEmploymentType: "leave_of_absence", shortTenureRisk: false, overrideReason: "leave_not_employment_tenure" },
  "leave 6 months"
);

assertRisk(
  { durationMonthsInclusive: null, employmentType: "full-time" },
  {
    durationMonthsInclusive: null,
    isShortDuration: "unknown",
    shortTenureRisk: "unknown",
    riskSignalsPossible: [],
    overrideReason: "duration_missing",
    confidence: "low",
    warnings: ["duration_missing"],
  },
  "duration missing"
);

assertRisk(
  { durationMonthsInclusive: 5, employmentType: "unknown employment type" },
  {
    normalizedEmploymentType: "unknown",
    metadataVariant: "unknown",
    isShortDuration: "unknown",
    shortTenureApplicable: "unknown",
    shortTenureRisk: "unknown",
    overrideReason: "employment_type_unknown",
    confidence: "low",
  },
  "unknown employment type"
);

assertRisk(
  { durationMonthsInclusive: 5, employmentType: "full-time" },
  { shortTenureThresholdMonths: 6, isShortDuration: true, shortTenureRisk: true },
  "custom threshold 5 months",
  { shortTenureThresholdMonths: 6 }
);

assertRisk(
  { durationMonthsInclusive: 6, employmentType: "full-time" },
  { shortTenureThresholdMonths: 6, isShortDuration: false, shortTenureRisk: false },
  "custom threshold 6 months",
  { shortTenureThresholdMonths: 6 }
);

console.log("PASS career-core short tenure risk deterministic checks");
