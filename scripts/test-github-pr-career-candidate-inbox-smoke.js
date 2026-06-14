import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildGithubPrCareerCandidateContract } from "../src/lib/githubCareerCandidateContract.js";
import { buildGithubPrPersistenceRows } from "../api/github/pr-preview.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const repositorySource = readFileSync(
  path.join(root, "src/lib/experience/aiInboxRepository.js"),
  "utf8"
);

const testableSource = repositorySource
  .replace('import { supabase } from "../supabaseClient.js";', "const supabase = null;")
  .replace(/export async function listAiInboxExperiences/g, "async function listAiInboxExperiences")
  .replace(/export async function listAiResumeMaterialExperiences/g, "async function listAiResumeMaterialExperiences")
  .replace(/export async function updateAiInboxExperienceStatus/g, "async function updateAiInboxExperienceStatus")
  .replace("export const __TEST_ONLY__ =", "const __TEST_ONLY__ =")
  .concat("\nexport { __TEST_ONLY__ };\n");

const { __TEST_ONLY__ } = await import(
  `data:text/javascript;base64,${Buffer.from(testableSource, "utf8").toString("base64")}`
);

const {
  ALLOWED_LIST_STATUSES,
  CARD_COLUMNS,
  GITHUB_PR_CAREER_CANDIDATE_IMPORT_METHOD,
  _hasAllowedInboxOrigin,
  _normalizeItem,
} = __TEST_ONLY__;

const fakeGitHubToken = "gh" + "p_" + "123456789012345678901234567890abcdef";
const fakeClientSecret = "client" + "_secret";
const fakeServiceRoleKey = "service" + "_role_key";
const fullDiffText = "@@ private full diff must never reach inbox @@";

const payload = {
  action: "closed",
  repository: {
    full_name: "passmap/reject-analyzer-private",
    html_url: "https://github.com/passmap/reject-analyzer-private",
  },
  pull_request: {
    number: 882,
    title: "Surface GitHub PR career candidates in inbox",
    body: `Adds inbox surfacing without leaking ${fakeGitHubToken}, ${fakeClientSecret}, or ${fakeServiceRoleKey}.`,
    html_url: "https://github.com/passmap/reject-analyzer-private/pull/882",
    additions: 140,
    deletions: 5,
    merged_at: "2026-06-14T05:40:00Z",
  },
  files: [
    {
      filename: "src/lib/experience/aiInboxRepository.js",
      status: "modified",
      additions: 20,
      deletions: 5,
      patch: `${fullDiffText}\n+const leaked = "do-not-leak";`,
    },
    {
      filename: "scripts/test-github-pr-career-candidate-inbox-origin.js",
      status: "added",
      additions: 120,
      deletions: 0,
      patch: "@@ another private patch hunk @@",
    },
  ],
};

function serialized(value) {
  return JSON.stringify(value);
}

function assertNoForbiddenPayload(value) {
  const text = serialized(value);
  assert.equal(text.includes(fakeGitHubToken), false, "GitHub token must not be normalized");
  assert.equal(text.includes(fakeClientSecret), false, "client secret marker must not be normalized");
  assert.equal(text.includes(fakeServiceRoleKey), false, "service role marker must not be normalized");
  assert.equal(text.includes(fullDiffText), false, "full diff must not be normalized");
  assert.equal(text.includes("do-not-leak"), false, "diff-local secret text must not be normalized");
  assert.equal(text.includes("patch"), false, "raw patch keys must not reach normalized inbox item");
  assert.equal(text.includes("raw_text"), false, "raw_sources.raw_text must not reach normalized inbox item");
}

const contract = buildGithubPrCareerCandidateContract(payload);
const rows = buildGithubPrPersistenceRows({
  userId: "00000000-0000-4000-8000-000000000882",
  contract,
});

assert.equal(rows.rawSource.raw_text, null, "PR #881 persistence rows must keep raw_sources.raw_text null");
assert.equal(rows.card.metadata.importMethod, GITHUB_PR_CAREER_CANDIDATE_IMPORT_METHOD);
assert.equal(_hasAllowedInboxOrigin(rows.card.metadata), true);
assert.equal(CARD_COLUMNS.includes("raw_text"), false, "Inbox select columns must still exclude raw_text");
assert.equal(ALLOWED_LIST_STATUSES.has("accepted"), true);
assert.equal(ALLOWED_LIST_STATUSES.has("converted"), true);
assert.equal(ALLOWED_LIST_STATUSES.has("archived"), false);

const fakeJoinedRow = {
  id: "card-882",
  title: rows.card.title,
  situation: rows.card.situation,
  task: rows.card.task,
  actions: rows.card.actions,
  status: rows.card.status,
  created_at: "2026-06-14T05:45:00Z",
  updated_at: "2026-06-14T05:45:00Z",
  work_record_id: null,
  suggested_resume_bullet: rows.card.suggested_resume_bullet,
  skills: rows.card.skills,
  job_tags: rows.card.job_tags,
  industry_tags: rows.card.industry_tags,
  risk_notes: rows.card.risk_notes,
  metadata: rows.card.metadata,
  source_id: "raw-882",
  raw_sources: {
    id: "raw-882",
    source_label: rows.rawSource.source_label,
    summary: rows.rawSource.summary,
    metadata: rows.rawSource.metadata,
    source_type: rows.rawSource.source_type,
    created_at: "2026-06-14T05:45:00Z",
    raw_text: rows.rawSource.raw_text,
  },
  work_records: null,
  experience_evidence: rows.evidence.map((row) => ({
    evidence_text: row.evidence_text,
    evidence_type: row.evidence_type,
  })),
};

const normalized = _normalizeItem(fakeJoinedRow);

assert.equal(normalized.sourcePlatform, "github");
assert.equal(normalized.sourceUrl, payload.pull_request.html_url);
assert.match(normalized.sourceLabel, /^GitHub PR #882:/);
assert.equal(normalized.title, contract.career_asset_candidate.title);
assert.ok(normalized.summary, "safe summary or situation fallback must be present");
assert.equal(normalized.suggestedResumeBullet, contract.resume_bullet_candidates[0]);
assert.ok(normalized.evidenceTexts.length >= 3, "safe evidence should be available to the inbox");
assert.ok(normalized.evidenceTexts.some((text) => text.startsWith("PR title:")));
assert.ok(normalized.evidenceTexts.some((text) => text.startsWith("Changed files:")));
assert.ok(normalized.evidenceTexts.some((text) => text.startsWith("PR stats:")));
assert.equal(normalized.evidenceTexts.some((text) => text.includes("@@")), false);
assert.equal(normalized.evidenceTexts.some((text) => /token|secret|service_role/i.test(text)), false);
assertNoForbiddenPayload(normalized);

const fallbackRow = {
  ...fakeJoinedRow,
  id: "card-882-fallback",
  situation: "Situation fallback summary",
  raw_sources: {
    ...fakeJoinedRow.raw_sources,
    summary: null,
    raw_text: null,
  },
};
const fallbackNormalized = _normalizeItem(fallbackRow);
assert.equal(fallbackNormalized.summary, "Situation fallback summary");
assertNoForbiddenPayload(fallbackNormalized);

console.log("PASS github-pr-career-candidate-inbox-smoke");
