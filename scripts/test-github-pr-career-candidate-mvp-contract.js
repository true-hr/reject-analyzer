import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  GITHUB_PR_STATUS_MAPPING,
  buildGithubPrCareerCandidateContract,
  containsSensitiveContractValue,
} from "../src/lib/githubCareerCandidateContract.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const fakeGitHubToken = "gh" + "p_" + "123456789012345678901234567890abcdef";
const fakeClientSecretLabel = "client" + "_secret";

const fixturePayload = {
  action: "closed",
  repository: {
    full_name: "passmap/reject-analyzer-private",
    html_url: "https://github.com/passmap/reject-analyzer-private",
  },
  pull_request: {
    number: 42,
    title: "Add career candidate preview contract for GitHub PR traces",
    body: `Creates a deterministic contract preview. Includes fake ${fakeGitHubToken} and ${fakeClientSecretLabel} example that must not leak.`,
    html_url: "https://github.com/passmap/reject-analyzer-private/pull/42",
    additions: 188,
    deletions: 27,
    merged_at: "2026-06-12T09:00:00Z",
  },
  files: [
    {
      filename: "src/lib/githubCareerCandidateContract.js",
      status: "added",
      additions: 120,
      deletions: 0,
      patch: "@@ full private repo diff must not be returned @@\n+const rawOAuthCredential = 'do-not-leak';",
    },
    {
      filename: "api/save-analysis-run.js",
      status: "added",
      additions: 48,
      deletions: 0,
      patch: "@@ another private full diff @@",
    },
  ],
};

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function assertNoPrivateDiff(candidate) {
  const text = JSON.stringify(candidate);
  assert.equal(text.includes("@@ full private repo diff must not be returned @@"), false);
  assert.equal(text.includes("rawOAuthCredential"), false);
  assert.equal(text.includes("another private full diff"), false);
}

function assertDocStatusMapping() {
  const doc = readFileSync(path.join(root, "docs/github-pr-career-candidate-mvp-contract.md"), "utf8");
  assert.match(doc, /Reject\/exclude\s*->\s*experience_cards\.status = archived/);
  assert.match(doc, /Approve\/convert\s*->\s*experience_cards\.status = converted/);
}

const first = buildGithubPrCareerCandidateContract(fixturePayload);
const second = buildGithubPrCareerCandidateContract(fixturePayload);

assert.deepEqual(first, second, "candidate generation must be deterministic");
assert.equal(first.source_type, "github_pull_request");
assert.ok(first.trace, "trace is required");
assert.ok(first.work_signal, "work_signal is required");
assert.ok(first.career_asset_candidate, "career_asset_candidate is required");
assert.ok(Array.isArray(first.resume_bullet_candidates), "resume_bullet_candidates must be an array");
assert.ok(first.resume_bullet_candidates[0], "suggested resume bullet must not be empty");
assert.ok(Array.isArray(first.evidence), "evidence must be an array");
assert.equal(first.recommended_action, "review_career_asset_candidate");

assert.match(
  first.dedupe_key,
  /^github_pr:passmap\/reject-analyzer-private:42:[a-f0-9]{16}$/,
  "dedupe_key must include repo identifier, PR number, and normalized work signal hash"
);
assert.equal(first.work_signal.normalized_hash, first.dedupe_key.split(":").at(-1));

assert.equal(containsSensitiveContractValue(first), false, "candidate response must not include sensitive values");
assertNoPrivateDiff(first);

assert.equal(first.career_asset_candidate.review_status_mapping.reject, GITHUB_PR_STATUS_MAPPING.rejected);
assert.equal(first.career_asset_candidate.review_status_mapping.approve, GITHUB_PR_STATUS_MAPPING.accepted);
assert.equal(GITHUB_PR_STATUS_MAPPING.rejected, "archived");
assert.equal(GITHUB_PR_STATUS_MAPPING.accepted, "converted");
assertDocStatusMapping();

const changedTitle = buildGithubPrCareerCandidateContract({
  ...fixturePayload,
  pull_request: { ...fixturePayload.pull_request, title: "Different deterministic signal" },
});
assert.notEqual(
  first.dedupe_key,
  changedTitle.dedupe_key,
  "normalized work signal changes must alter the dedupe key"
);

assert.equal(
  stableStringify(first).includes("patch"),
  false,
  "candidate response must not expose raw patch fields"
);

console.log("PASS github-pr-career-candidate-mvp-contract");
