import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { workRecordsControlledSignalContractCases } from "../src/lib/career-core/__fixtures__/workRecordsControlledSignalContractCases.js";

const ALLOWED_CHANGED_FILES = new Set([
  "docs/career-core-work-records-controlled-signal-contract-20260605.md",
  "src/lib/career-core/__fixtures__/workRecordsControlledSignalContractCases.js",
  "scripts/test-career-core-work-records-controlled-signal-contract.js",
]);

const REQUIRED_SOURCE_FIELDS = ["sourceText", "sourceRecordId", "recordDate"];
const WEAK_OR_BLOCKED_LEVELS = new Set(["inferred_weak_activity", "contradicted_ownership", "missing_context"]);
const PROHIBITED_FIELD_NAMES = new Set(["caseId", "expectedRegex", "regex", "fixtureRegex", "runtimeCaseId"]);

function normalizePath(path) {
  return path.replaceAll("\\", "/");
}

function listGitPaths(args) {
  return execFileSync("git", args, { encoding: "utf8" })
    .split(/\r?\n/)
    .map(normalizePath)
    .filter(Boolean);
}

function assertNoProhibitedFields(value, context) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoProhibitedFields(item, `${context}[${index}]`));
    return;
  }

  for (const [key, nested] of Object.entries(value)) {
    assert.ok(!PROHIBITED_FIELD_NAMES.has(key), `${context} does not use prohibited field ${key}`);
    assert.ok(!key.toLowerCase().includes("caseid"), `${context} does not use caseId based fields`);
    assertNoProhibitedFields(nested, `${context}.${key}`);
  }
}

function assertIncludesAll(actual = [], expected = [], context) {
  for (const item of expected) {
    assert.ok(actual.includes(item), `${context} includes ${item}`);
  }
}

assert.ok(Array.isArray(workRecordsControlledSignalContractCases), "fixture exports cases array");
assert.ok(workRecordsControlledSignalContractCases.length >= 8, "fixture includes at least 8 cases");

for (const item of workRecordsControlledSignalContractCases) {
  assert.ok(item.id, "case has id");
  assert.ok(Array.isArray(item.workRecords) && item.workRecords.length > 0, `${item.id} has workRecords`);
  assert.ok(item.expected && typeof item.expected === "object", `${item.id} has expected`);
  assertNoProhibitedFields(item, item.id);

  for (const record of item.workRecords) {
    assert.ok(record.id, `${item.id} workRecord has id`);
    assert.ok(record.content, `${item.id} workRecord has content`);
    assert.ok(record.source, `${item.id} workRecord has source`);
  }

  const expected = item.expected;
  const eligibleStrengthSignals = expected.eligibleStrengthSignals ?? [];
  const forbiddenStrengthSignals = expected.forbiddenStrengthSignals ?? [];
  const riskSignals = expected.riskSignals ?? [];
  const missingIncludes = expected.missingIncludes ?? [];
  const clarificationQuestions = expected.clarificationQuestions ?? [];
  const evidenceLevels = expected.evidenceLevels ?? [];
  const requiredSourceFields = expected.requiredSourceFields ?? [];

  assert.ok(Array.isArray(eligibleStrengthSignals), `${item.id} eligibleStrengthSignals is an array`);
  assert.ok(Array.isArray(forbiddenStrengthSignals), `${item.id} forbiddenStrengthSignals is an array`);
  assert.ok(Array.isArray(riskSignals), `${item.id} riskSignals is an array`);
  assert.ok(Array.isArray(missingIncludes), `${item.id} missingIncludes is an array`);
  assert.ok(Array.isArray(clarificationQuestions), `${item.id} clarificationQuestions is an array`);
  assert.ok(Array.isArray(evidenceLevels), `${item.id} evidenceLevels is an array`);

  for (const signal of forbiddenStrengthSignals) {
    assert.ok(!eligibleStrengthSignals.includes(signal), `${item.id} forbidden strength is not eligible: ${signal}`);
  }

  if (eligibleStrengthSignals.length > 0) {
    assertIncludesAll(requiredSourceFields, REQUIRED_SOURCE_FIELDS, `${item.id} requiredSourceFields`);
    assert.ok(
      evidenceLevels.some((level) => ["explicit_ownership", "explicit_judgment", "explicit_impact"].includes(level)),
      `${item.id} eligible strength has ownership, judgment, or impact evidence`
    );
    assert.ok(!evidenceLevels.includes("contradicted_ownership"), `${item.id} eligible strength is not contradicted`);
  }

  if (evidenceLevels.some((level) => WEAK_OR_BLOCKED_LEVELS.has(level))) {
    assert.ok(riskSignals.length > 0 || missingIncludes.length > 0, `${item.id} weak/blocked case has risk or missing evidence`);
  }

  if (missingIncludes.length > 0) {
    assert.ok(clarificationQuestions.length > 0, `${item.id} missingIncludes has clarificationQuestions`);
    assert.ok(
      clarificationQuestions.every((question) => typeof question === "string" && question.trim().endsWith("?")),
      `${item.id} clarificationQuestions are questions`
    );
  }
}

const changedFiles = new Set([
  ...listGitPaths(["diff", "--name-only", "origin/main...HEAD"]),
  ...listGitPaths(["diff", "--name-only"]),
  ...listGitPaths(["diff", "--cached", "--name-only"]),
  ...listGitPaths(["ls-files", "--others", "--exclude-standard"]),
]);

for (const file of changedFiles) {
  assert.ok(ALLOWED_CHANGED_FILES.has(file), `changed file is allowed: ${file}`);
}

console.log("PASS career-core work records controlled signal contract deterministic checks");
