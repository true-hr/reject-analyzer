import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  MANUAL_GITHUB_PR_DEFAULT_CHANGED_FILES,
  buildManualGithubPrImportDisplay,
  buildManualGithubPrImportPayload,
  normalizeGithubRepositoryInput,
  parseManualGithubChangedFilesSummary,
  validateManualGithubPrImportInput,
} from "../src/lib/experience/manualGithubPrImport.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const fakeGitHubToken = "gh" + "p_" + "123456789012345678901234567890abcdef";
const fakeClientSecret = "client" + "_secret";
const fakeServiceRoleKey = "service" + "_role_key";
const rawDiff = "@@ full private diff must not enter client payload @@";

function serialized(value) {
  return JSON.stringify(value);
}

function assertNoForbiddenPayload(value) {
  const text = serialized(value);
  assert.equal(text.includes(fakeGitHubToken), false, "GitHub token must not be included");
  assert.equal(text.includes(fakeClientSecret), false, "client secret marker must not be included");
  assert.equal(text.includes(fakeServiceRoleKey), false, "service role marker must not be included");
  assert.equal(text.includes(rawDiff), false, "full diff must not be included");
  assert.equal(text.includes("do-not-leak"), false, "patch-local secret must not be included");
  assert.equal(text.includes("patch"), false, "patch key must not be included");
}

assert.equal(
  normalizeGithubRepositoryInput("https://github.com/true-hr/reject-analyzer/pull/882"),
  "true-hr/reject-analyzer"
);
assert.deepEqual(parseManualGithubChangedFilesSummary(MANUAL_GITHUB_PR_DEFAULT_CHANGED_FILES), [
  {
    filename: "src/components/example.js",
    status: "modified",
    additions: 24,
    deletions: 3,
  },
]);

const invalid = validateManualGithubPrImportInput({
  repository: "",
  prNumber: "0",
  title: "",
  changedFilesSummary: "",
});
assert.equal(invalid.ok, false, "required field validation must reject incomplete input");
assert.ok(invalid.errors.length >= 4);

const payload = buildManualGithubPrImportPayload({
  repository: "https://github.com/true-hr/reject-analyzer/pull/882",
  prNumber: "882",
  title: "Surface GitHub PR career candidates in inbox",
  body: `Manual summary with ${fakeGitHubToken}, ${fakeClientSecret}, ${fakeServiceRoleKey}, and ${rawDiff}.`,
  mergedAt: "2026-06-14T06:07:22Z",
  additions: "140",
  deletions: "5",
  changedFilesSummary: [
    "src/lib/experience/aiInboxRepository.js, modified, 20, 5",
    "scripts/test-github-pr-career-candidate-inbox-smoke.js, added, 120, 0",
    "docs/manual-import.md, modified, 1, 0",
  ].join("\n"),
  patch: `${rawDiff}\n+const leaked = "do-not-leak";`,
});

assert.equal(payload.action, "closed");
assert.equal(payload.repository.full_name, "true-hr/reject-analyzer");
assert.equal(payload.repository.html_url, "https://github.com/true-hr/reject-analyzer");
assert.equal(payload.pull_request.number, 882);
assert.equal(payload.pull_request.title, "Surface GitHub PR career candidates in inbox");
assert.equal(payload.pull_request.html_url, "https://github.com/true-hr/reject-analyzer/pull/882");
assert.equal(payload.pull_request.additions, 140);
assert.equal(payload.pull_request.deletions, 5);
assert.equal(payload.pull_request.merged_at, "2026-06-14T06:07:22Z");
assert.equal(payload.files.length, 3);
assert.equal(payload.files[0].filename, "src/lib/experience/aiInboxRepository.js");
assert.equal(serialized(payload).includes("[REDACTED]"), true, "sensitive values should be redacted when present in safe text fields");
assertNoForbiddenPayload(payload);

const display = buildManualGithubPrImportDisplay({
  ok: true,
  candidate_id: "candidate-882",
  raw_source_id: "source-882",
  dedupe_key: "github_pr:true-hr/reject-analyzer:882:abc123",
  status: "accepted",
  preview: {
    work_title: "Surface GitHub PR career candidates in inbox",
    summary: `Safe preview ${fakeGitHubToken}`,
    suggested_resume_bullet: `Delivered GitHub inbox surfacing without ${fakeServiceRoleKey}.`,
    evidence_count: 4,
  },
  raw_text: "must not be displayed",
  payload,
});

assert.equal(display.ok, true);
assert.equal(display.candidateId, "candidate-882");
assert.equal(display.rawSourceId, "source-882");
assert.equal(display.status, "accepted");
assert.equal(display.workTitle, "Surface GitHub PR career candidates in inbox");
assert.equal(display.evidenceCount, 4);
assert.equal(serialized(display).includes("raw_text"), false);
assertNoForbiddenPayload(display);

const inboxRepositorySource = readFileSync(
  path.join(root, "src/lib/experience/aiInboxRepository.js"),
  "utf8"
);
assert.equal(
  /const SOURCE_COLUMNS = "[^"]*raw_text/i.test(inboxRepositorySource),
  false,
  "raw_sources.raw_text must not be selected by the inbox repository"
);

console.log("PASS manual-github-pr-career-candidate-import-ui-contract");
