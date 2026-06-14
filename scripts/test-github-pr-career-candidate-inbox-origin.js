import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
  ALLOWED_ORIGIN_FILTER,
  ALLOWED_PLATFORMS,
  CARD_COLUMNS,
  CHATGPT_ACTION_IMPORT_METHOD,
  GITHUB_PR_CAREER_CANDIDATE_IMPORT_METHOD,
  MCP_IMPORT_METHOD,
  WORK_TRACE_IMPORT_METHODS,
  WORK_TRACE_SOURCE,
  _hasAllowedInboxOrigin,
  _normalizeItem,
} = __TEST_ONLY__;

assert.equal(
  GITHUB_PR_CAREER_CANDIDATE_IMPORT_METHOD,
  "github_pr_career_candidate_preview"
);

assert.match(
  ALLOWED_ORIGIN_FILTER,
  /metadata->>importMethod\.eq\.github_pr_career_candidate_preview/,
  "GitHub PR candidate importMethod must be included in the list query OR filter"
);

assert.equal(
  _hasAllowedInboxOrigin({ importMethod: GITHUB_PR_CAREER_CANDIDATE_IMPORT_METHOD }),
  true,
  "GitHub PR career candidates must be status-updatable inbox origins"
);
assert.equal(_hasAllowedInboxOrigin({ importMethod: MCP_IMPORT_METHOD }), true);
assert.equal(_hasAllowedInboxOrigin({ importMethod: CHATGPT_ACTION_IMPORT_METHOD }), true);
for (const importMethod of WORK_TRACE_IMPORT_METHODS) {
  assert.equal(_hasAllowedInboxOrigin({ importMethod }), true);
}
assert.equal(_hasAllowedInboxOrigin({ source: WORK_TRACE_SOURCE }), true);
assert.equal(_hasAllowedInboxOrigin({ importMethod: "unknown_import" }), false);
assert.equal(_hasAllowedInboxOrigin(null), false);

assert.equal(CARD_COLUMNS.includes("raw_text"), false, "raw_sources.raw_text must not be selected");
assert.equal(CARD_COLUMNS.includes("raw_sources.raw_text"), false);
assert.equal(ALLOWED_LIST_STATUSES.has("accepted"), true, "accepted remains the Inbox status");
assert.equal(ALLOWED_LIST_STATUSES.has("converted"), true, "converted remains the Resume Material status");
assert.equal(ALLOWED_LIST_STATUSES.has("archived"), false, "archived remains excluded from list views");
assert.equal(ALLOWED_PLATFORMS.has("github"), true, "github platform filter must be recognized");

const normalized = _normalizeItem({
  id: "card-881",
  title: "Add GitHub PR career candidate persistence",
  situation: "Fallback candidate summary",
  suggested_resume_bullet: "Delivered GitHub PR candidate persistence.",
  status: "accepted",
  metadata: {
    importMethod: GITHUB_PR_CAREER_CANDIDATE_IMPORT_METHOD,
  },
  raw_sources: {
    source_label: "GitHub PR #881: Add GitHub PR career candidate persistence",
    summary: "Stored safe GitHub PR candidate metadata.",
    metadata: {
      importMethod: GITHUB_PR_CAREER_CANDIDATE_IMPORT_METHOD,
      pr_url: "https://github.com/true-hr/reject-analyzer/pull/881",
    },
  },
  experience_evidence: [
    { evidence_text: "PR title: Add GitHub PR candidate persistence", evidence_type: "github_pr_metadata" },
    { evidence_text: "PR stats: 3 files, +480/-32", evidence_type: "github_pr_metadata" },
  ],
});

assert.equal(normalized.sourcePlatform, "github");
assert.equal(normalized.sourceUrl, "https://github.com/true-hr/reject-analyzer/pull/881");
assert.equal(normalized.sourceLabel, "GitHub PR #881: Add GitHub PR career candidate persistence");
assert.equal(normalized.title, "Add GitHub PR career candidate persistence");
assert.equal(normalized.summary, "Stored safe GitHub PR candidate metadata.");
assert.equal(normalized.suggestedResumeBullet, "Delivered GitHub PR candidate persistence.");
assert.deepEqual(normalized.evidenceTexts, [
  "PR title: Add GitHub PR candidate persistence",
  "PR stats: 3 files, +480/-32",
]);

const fallbackSummary = _normalizeItem({
  id: "card-fallback",
  title: "GitHub fallback",
  situation: "Situation fallback summary",
  metadata: { importMethod: GITHUB_PR_CAREER_CANDIDATE_IMPORT_METHOD },
  raw_sources: {
    source_label: "GitHub PR #1: fallback",
    metadata: { importMethod: GITHUB_PR_CAREER_CANDIDATE_IMPORT_METHOD },
  },
});

assert.equal(fallbackSummary.sourcePlatform, "github");
assert.equal(fallbackSummary.summary, "Situation fallback summary");

console.log("PASS github-pr-career-candidate-inbox-origin");
