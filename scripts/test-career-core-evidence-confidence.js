import assert from "node:assert/strict";
import {
  calibrateEvidenceConfidence,
  classifyOwnershipSeniority,
} from "../src/lib/career-core/index.js";
import { evidenceConfidenceCases } from "../src/lib/career-core/__fixtures__/evidenceConfidenceCases.js";
import { ownershipPositiveCases } from "../src/lib/career-core/__fixtures__/ownershipPositiveCases.js";
import { ownershipDomainPrecisionCases } from "../src/lib/career-core/__fixtures__/ownershipDomainPrecisionCases.js";

const domainByPrecisionId = {
  domain_precision_01_sales_proposal_formatting_not_sales_lead: "sales",
  domain_precision_02_sns_posting_not_growth_strategy: "growth_marketing",
  domain_precision_03_customer_inquiry_routing_not_cx_planning: "cx_strategy",
  domain_precision_04_sql_export_not_data_analyst: "data_analysis",
  domain_precision_05_requirements_forwarding_not_pm_ownership: "product_planning_pm",
};

function assertEqualOrOneOf(actual, expected, expectedOneOf, context) {
  if (expectedOneOf) {
    assert.ok(expectedOneOf.includes(actual), `${context} oneOf ${expectedOneOf.join(", ")}`);
    return;
  }
  assert.equal(actual, expected, context);
}

for (const item of evidenceConfidenceCases) {
  const actual = calibrateEvidenceConfidence(item.resumeInput, {
    domain: item.domain,
    ...(item.options ?? {}),
  });
  const expected = item.expected;

  assertEqualOrOneOf(
    actual.overallEvidenceConfidence,
    expected.overallEvidenceConfidence,
    expected.overallEvidenceConfidenceOneOf,
    `${item.id} overallEvidenceConfidence`,
  );
  assert.equal(actual.shouldDowngrade, expected.shouldDowngrade, `${item.id} shouldDowngrade`);
  assert.equal(actual.shouldAskClarification, expected.shouldAskClarification, `${item.id} shouldAskClarification`);
  assert.equal(actual.appliedToCareerProfile, false, `${item.id} appliedToCareerProfile`);

  if (expected.positiveEvidenceCount != null) {
    assert.equal(actual.positiveEvidenceCount, expected.positiveEvidenceCount, `${item.id} positiveEvidenceCount`);
  }
  if (expected.weakEvidenceCount != null) {
    assert.equal(actual.weakEvidenceCount, expected.weakEvidenceCount, `${item.id} weakEvidenceCount`);
  }
  if (expected.contradictedEvidenceCountAtLeast != null) {
    assert.ok(
      actual.contradictedEvidenceCount >= expected.contradictedEvidenceCountAtLeast,
      `${item.id} contradictedEvidenceCount`,
    );
    assert.ok(
      actual.positiveEvidenceCount < Object.keys(actual.evidenceConfidenceBySignal).length,
      `${item.id} contradicted evidence is not counted as positive`,
    );
  }
}

const absentProbe = calibrateEvidenceConfidence(
  { roleTitle: "사무보조", artifact: "일정표", description: ["회의 일정을 정리했다."] },
  { signals: ["metric_definition"] },
);
assert.equal(absentProbe.evidenceConfidenceBySignal.metric_definition, "absent", "absent signal stays absent");
assert.equal(absentProbe.weakEvidenceCount, 0, "absent signal is not inferred_weak");
assert.equal(absentProbe.absentEvidenceCount, 1, "absent signal count");
assert.equal(absentProbe.appliedToCareerProfile, false, "absent probe appliedToCareerProfile");

for (const item of ownershipPositiveCases) {
  const classification = classifyOwnershipSeniority(item.resumeInput);
  const confidence = calibrateEvidenceConfidence(item.resumeInput, {
    roleFamily: classification.roleFamily,
    signals: item.expected.strengthSignalsIncludes,
  });

  assert.equal(classification.appliedToCareerProfile, false, `${item.id} classifier appliedToCareerProfile`);
  assert.equal(confidence.overallEvidenceConfidence, "explicit", `${item.id} positive ownership confidence`);
  assert.equal(confidence.shouldDowngrade, false, `${item.id} positive shouldDowngrade`);
  assert.equal(confidence.appliedToCareerProfile, false, `${item.id} confidence appliedToCareerProfile`);
}

for (const item of ownershipDomainPrecisionCases) {
  const classification = classifyOwnershipSeniority(item.resumeInput);
  const confidence = calibrateEvidenceConfidence(item.resumeInput, {
    domain: domainByPrecisionId[item.id],
  });

  assert.equal(classification.roleFamily, "unknown_admin_support", `${item.id} negative roleFamily preserved`);
  assert.notEqual(confidence.overallEvidenceConfidence, "explicit", `${item.id} negative not explicit`);
  assert.equal(confidence.appliedToCareerProfile, false, `${item.id} negative appliedToCareerProfile`);
}

console.log("PASS career-core evidence confidence calibration deterministic checks");
