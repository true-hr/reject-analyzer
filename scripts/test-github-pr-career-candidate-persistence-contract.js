import assert from "node:assert/strict";
import {
  buildGithubPrCareerCandidateContract,
  containsSensitiveContractValue,
} from "../src/lib/githubCareerCandidateContract.js";
import {
  buildGithubPrPersistenceResponse,
  buildGithubPrPersistenceRows,
  findExistingGithubPrCandidate,
} from "../api/save-analysis-run.js";

const GITHUB_PR_CANDIDATE_IMPORT_METHOD = "github_pr_career_candidate_preview";
const GITHUB_PR_CANDIDATE_DEFAULT_STATUS = "accepted";

const fakeGitHubToken = "gh" + "p_" + "123456789012345678901234567890abcdef";
const fakeServiceRoleKey = "service" + "_role_key";

const fixturePayload = {
  action: "closed",
  repository: {
    full_name: "passmap/reject-analyzer-private",
    html_url: "https://github.com/passmap/reject-analyzer-private",
  },
  pull_request: {
    number: 880,
    title: "Add GitHub PR career candidate contract",
    body: `Builds the candidate contract. Must redact ${fakeGitHubToken} and ${fakeServiceRoleKey}.`,
    html_url: "https://github.com/passmap/reject-analyzer-private/pull/880",
    additions: 188,
    deletions: 27,
    merged_at: "2026-06-14T04:59:48Z",
  },
  files: [
    {
      filename: "src/lib/githubCareerCandidateContract.js",
      status: "added",
      additions: 120,
      deletions: 0,
      patch: "@@ private full diff must never persist @@\n+const token = 'do-not-leak';",
    },
    {
      filename: "api/save-analysis-run.js",
      status: "modified",
      additions: 68,
      deletions: 27,
      patch: "@@ another full diff that must not be returned @@",
    },
  ],
};

function serialized(value) {
  return JSON.stringify(value);
}

function assertNoForbiddenPayload(value) {
  const text = serialized(value);
  assert.equal(text.includes(fakeGitHubToken), false, "GitHub token must not leak");
  assert.equal(text.includes(fakeServiceRoleKey), false, "service role marker must not leak");
  assert.equal(text.includes("@@ private full diff must never persist @@"), false, "full diff must not persist");
  assert.equal(text.includes("another full diff that must not be returned"), false, "full diff must not be returned");
  assert.equal(text.includes("do-not-leak"), false, "diff-local secret text must not leak");
}

const contract = buildGithubPrCareerCandidateContract(fixturePayload);
const duplicateContract = buildGithubPrCareerCandidateContract(fixturePayload);
assert.deepEqual(contract, duplicateContract, "contract mapping must be deterministic");
assert.ok(contract.dedupe_key, "dedupe_key is required before persistence");
assert.equal(containsSensitiveContractValue(contract), false, "contract must not contain sensitive values");
assertNoForbiddenPayload(contract);

const rows = buildGithubPrPersistenceRows({
  userId: "00000000-0000-4000-8000-000000000880",
  contract,
});

assert.equal(rows.rawSource.source_type, "github_pull_request");
assert.equal(rows.rawSource.raw_text, null, "raw_sources.raw_text must stay null for GitHub PR traces");
assert.equal(rows.rawSource.metadata.importMethod, GITHUB_PR_CANDIDATE_IMPORT_METHOD);
assert.equal(rows.rawSource.metadata.rawTextStored, false);
assert.equal(rows.rawSource.metadata.fullDiffStored, false);
assert.equal(rows.rawSource.metadata.dedupe_key, contract.dedupe_key);
assert.ok(Array.isArray(rows.rawSource.metadata.changed_files), "changed file summary must be metadata only");

assert.equal(rows.card.status, GITHUB_PR_CANDIDATE_DEFAULT_STATUS);
assert.equal(rows.card.metadata.dedupe_key, contract.dedupe_key);
assert.equal(rows.card.suggested_resume_bullet, contract.resume_bullet_candidates[0]);
assert.ok(["high", "medium", "low"].includes(rows.card.resume_potential));
assert.ok(["high", "medium", "low"].includes(rows.card.confidence_level));
assert.equal(rows.card.metadata.career_asset_candidate.review_status_mapping.reject, "archived");
assert.equal(rows.card.metadata.career_asset_candidate.review_status_mapping.approve, "converted");

assert.ok(rows.evidence.length >= 3, "safe evidence rows must be produced");
assert.ok(rows.evidence.every((row) => row.evidence_type === "github_pr_metadata"));
assert.ok(rows.evidence.every((row) => row.metadata.dedupe_key === contract.dedupe_key));
assertNoForbiddenPayload(rows);

const acceptedExisting = findExistingGithubPrCandidate([
  { id: "archived-card", status: "archived", source_id: "raw-archived" },
  { id: "accepted-card", status: "accepted", source_id: "raw-accepted" },
]);
assert.equal(acceptedExisting.id, "accepted-card", "accepted candidate should be reused instead of duplicated");

const archivedExisting = findExistingGithubPrCandidate([
  { id: "archived-card", status: "archived", source_id: "raw-archived" },
]);
assert.equal(archivedExisting.id, "archived-card", "archived candidate must block re-recommendation");

const convertedExisting = findExistingGithubPrCandidate([
  { id: "converted-card", status: "converted", source_id: "raw-converted" },
]);
assert.equal(convertedExisting.id, "converted-card", "converted candidate must block duplicate creation");

const response = buildGithubPrPersistenceResponse({
  card: { id: "card-880", source_id: "raw-880", status: "accepted" },
  rawSourceId: "raw-880",
  contract,
  evidenceCount: rows.evidence.length,
});

assert.equal(response.ok, true);
assert.equal(response.candidate_id, "card-880");
assert.equal(response.raw_source_id, "raw-880");
assert.equal(response.dedupe_key, contract.dedupe_key);
assert.equal(response.status, "accepted");
assert.equal(response.preview.work_title, contract.career_asset_candidate.title);
assert.equal(response.preview.summary, contract.career_asset_candidate.evidence_summary);
assert.equal(response.preview.suggested_resume_bullet, contract.resume_bullet_candidates[0]);
assert.equal(response.preview.evidence_count, rows.evidence.length);
assert.equal(serialized(response).includes("raw_text"), false, "response must not include raw_sources.raw_text");
assert.equal(serialized(response).includes("work_signal"), false, "response must stay preview-shaped");
assertNoForbiddenPayload(response);

console.log("PASS github-pr-career-candidate-persistence-contract");
