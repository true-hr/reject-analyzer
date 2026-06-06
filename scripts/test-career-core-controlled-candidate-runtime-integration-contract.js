import assert from "node:assert/strict";
import { controlledCandidateRuntimeIntegrationContractCases } from "../src/lib/career-core/__fixtures__/controlledCandidateRuntimeIntegrationContractCases.js";

const REQUIRED_FORBIDDEN_BEHAVIORS = new Set([
  "auto_apply_to_career_profile",
  "default_enable_controlled_merge",
]);

const FORBIDDEN_FIXTURE_FIELDS = new Set([
  "caseId",
  "expectedRegex",
  "fixtureRegex",
]);

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function walk(value, visitor, path = []) {
  if (!value || typeof value !== "object") return;

  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, visitor, [...path, index]));
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    visitor(key, child, path);
    walk(child, visitor, [...path, key]);
  }
}

function forbiddenBehaviorsOf(item) {
  return new Set(item.expected?.forbiddenBehaviors ?? []);
}

function assertNoForbiddenFixtureFields(item) {
  walk(item, (key) => {
    assert.ok(!FORBIDDEN_FIXTURE_FIELDS.has(key), `${item.id} must not use ${key}`);
  });
}

function assertNoApplyToCareerProfileTrue(item) {
  walk(item, (key, value, path) => {
    if (key === "applyToCareerProfile" || key === "appliedToCareerProfile") {
      assert.notEqual(value, true, `${item.id} ${[...path, key].join(".")} must not be true`);
    }
  });
}

function findCase(id) {
  const item = controlledCandidateRuntimeIntegrationContractCases.find((candidate) => candidate.id === id);
  assert.ok(item, `fixture includes ${id}`);
  return item;
}

assert.ok(Array.isArray(controlledCandidateRuntimeIntegrationContractCases), "fixture exports cases array");
assert.ok(controlledCandidateRuntimeIntegrationContractCases.length >= 7, "fixture includes at least 7 cases");

for (const item of controlledCandidateRuntimeIntegrationContractCases) {
  assert.ok(item.id, "case has id");
  assert.ok(item.input && typeof item.input === "object", `${item.id} has input`);
  assert.ok(item.expected && typeof item.expected === "object", `${item.id} has expected`);
  assertNoForbiddenFixtureFields(item);
  assertNoApplyToCareerProfileTrue(item);

  const integrationMode = item.input.integrationMode ?? item.expected.recommendedIntegrationMode;
  assert.equal(integrationMode, "separate_read_only_orchestrator", `${item.id} uses recommended integration mode`);

  if (item.expected.forbiddenBehaviors) {
    assert.ok(Array.isArray(item.expected.forbiddenBehaviors), `${item.id} forbiddenBehaviors array`);
  }
}

const defaultCase = findCase("separate_read_only_orchestrator_default");
assert.equal(defaultCase.expected.recommendedIntegrationMode, "separate_read_only_orchestrator", "default recommended mode");
assert.equal(defaultCase.expected.shouldModifyExistingBuilders, false, "default does not modify existing builders");
assert.equal(defaultCase.expected.outputShape, "sibling_controlled_candidate_result", "default sibling output");
assert.equal(defaultCase.expected.appliedToCareerProfile, false, "default read-only");
assert.equal(defaultCase.expected.shouldWriteToCareerProfileMetaByDefault, false, "default does not write to meta");
for (const behavior of REQUIRED_FORBIDDEN_BEHAVIORS) {
  assert.ok(forbiddenBehaviorsOf(defaultCase).has(behavior), `default forbids ${behavior}`);
}
assert.ok(forbiddenBehaviorsOf(defaultCase).has("modify_existing_career_profile_schema"), "default forbids schema change");

const autoApplyCase = findCase("auto_apply_forbidden_without_manual_confirmation");
assert.equal(autoApplyCase.input.options.enableMergedControlledCandidates, true, "auto apply case enables merged candidates");
assert.equal(autoApplyCase.input.manualConfirmedCandidates, null, "auto apply case has no manual confirmation");
assert.equal(autoApplyCase.expected.shouldBlockFinalApply, true, "manual missing blocks final apply");
assert.equal(autoApplyCase.expected.mergeStatus, "read_only_candidate", "manual missing remains read-only");
assert.ok(forbiddenBehaviorsOf(autoApplyCase).has("auto_apply_to_career_profile"), "auto apply forbidden without manual");
assert.ok(forbiddenBehaviorsOf(autoApplyCase).has("default_enable_controlled_merge"), "default enable forbidden");

const manualCase = findCase("manual_confirmed_still_read_only_before_ui_contract");
assert.ok(manualCase.input.manualConfirmedCandidates?.strengthSignals?.length > 0, "manual case has manual confirmation");
assert.equal(manualCase.input.uiApiContractStatus, "not_defined", "manual case has no UI/API contract");
assert.equal(manualCase.expected.shouldBlockFinalApply, true, "manual still blocks before UI/API contract");
assert.equal(manualCase.expected.appliedToCareerProfile, false, "manual still read-only");
assert.ok(forbiddenBehaviorsOf(manualCase).has("render_to_ui_as_final_strength"), "manual case forbids final UI rendering");

const contradictionCase = findCase("contradiction_blocks_final_apply");
assert.equal(contradictionCase.expected.shouldBlockFinalApply, true, "contradiction blocks final apply");
assert.equal(contradictionCase.expected.shouldPreserveRiskOrContradiction, true, "contradiction preserves risk");
assert.equal(contradictionCase.expected.shouldPreserveClarificationQuestion, true, "contradiction preserves clarification");
assert.ok(contradictionCase.input.controlledCandidateResult.contradictedSignals.length > 0, "contradiction keeps contradictedSignals");
assert.ok(contradictionCase.input.controlledCandidateResult.mergedRiskSignals.length > 0, "contradiction keeps riskSignals");
assert.ok(
  contradictionCase.input.controlledCandidateResult.mergedMissingEvidence.every((item) => item.clarificationQuestion),
  "contradiction missing evidence has clarificationQuestion"
);

const sourceMissingCase = findCase("source_missing_invalid_candidate");
assert.equal(sourceMissingCase.expected.expectsInvalidCandidates, true, "source missing expects invalid candidates");
assert.equal(sourceMissingCase.expected.sourceMissingStrengthDisposition, "invalidCandidates", "source missing goes invalid");
assert.ok(sourceMissingCase.input.controlledCandidateResult.invalidCandidates.length > 0, "source missing fixture has invalidCandidates");
assert.equal(sourceMissingCase.expected.shouldModifyCareerProfileStrengthSignals, false, "source missing does not alter strength");

const dbCase = findCase("db_write_forbidden_before_storage_contract");
assert.equal(dbCase.expected.shouldWriteToDatabase, false, "DB write forbidden");
assert.equal(dbCase.expected.shouldWriteToSupabase, false, "Supabase write forbidden");
assert.ok(forbiddenBehaviorsOf(dbCase).has("write_to_supabase"), "Supabase write listed as forbidden");
assert.ok(forbiddenBehaviorsOf(dbCase).has("write_to_database"), "DB write listed as forbidden");

const apiUiCase = findCase("api_ui_candidate_label_required");
assert.equal(apiUiCase.expected.requiresCandidateLabel, true, "API/UI requires candidate label");
assert.equal(apiUiCase.expected.apiResponseMustMarkCandidate, true, "API marks candidate");
assert.equal(apiUiCase.expected.uiMustDistinguishCandidateFromFinal, true, "UI distinguishes candidate from final");
assert.equal(apiUiCase.expected.shouldRenderAsFinalStrength, false, "UI final strength copy forbidden");
assert.ok(forbiddenBehaviorsOf(apiUiCase).has("render_to_ui_as_final_strength"), "UI final rendering forbidden");

console.log("PASS career-core controlled candidate runtime integration contract deterministic checks");
