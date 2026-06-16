import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildGithubPrCareerCandidateContract,
  containsSensitiveContractValue,
} from "../src/lib/githubCareerCandidateContract.js";
import {
  buildGithubPrPersistenceRows,
  handleGithubRecentPullRequestsImport,
} from "../api/save-analysis-run.js";
import {
  buildGithubPullRequestCandidatePayload,
  buildGithubRecentPullRequestsImportResponse,
  fetchClosedGithubPullRequestsForRepo,
  fetchGithubPullRequestFiles,
  normalizeGithubPullRequestFiles,
  normalizeGithubRecentPullRequestsImportRequest,
  selectedGithubRepositoryRows,
} from "../server/api-helpers/github-recent-pull-requests.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const verifiedUserId = "00000000-0000-4000-8000-000000000916";
const now = () => Date.parse("2026-06-16T12:00:00Z");
const fakeToken = "ghs_recent_import_memory_only_token";
const fakePrivateKey = "-----BEGIN PRIVATE KEY-----must-not-leak-----END PRIVATE KEY-----";

function mockReq({ body = {}, token = "test-token", method = "POST" } = {}) {
  return {
    method,
    query: { action: "github_recent_pull_requests_import" },
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body,
  };
}

function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(key, value) {
      this.headers[key.toLowerCase()] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    end() {
      this.ended = true;
      return this;
    },
  };
}

function serialized(value) {
  return JSON.stringify(value);
}

function collectKeys(value, keys = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, keys);
    return keys;
  }
  if (!value || typeof value !== "object") return keys;
  for (const [key, child] of Object.entries(value)) {
    keys.push(key.toLowerCase());
    collectKeys(child, keys);
  }
  return keys;
}

function assertNoSecrets(value, { allowRawTextNull = false } = {}) {
  const text = serialized(value);
  assert.equal(text.includes(fakeToken), false, "response must not include installation token");
  assert.equal(text.includes(fakePrivateKey), false, "response must not include private key");
  assert.equal(text.includes("authorization"), false, "response must not include authorization");
  assert.equal(text.includes("jwt"), false, "response must not include jwt");
  assert.equal(text.includes("@@ diff"), false, "response must not include diff body");
  assert.equal(text.includes("patch-local-secret"), false, "response must not include patch-local data");
  for (const key of collectKeys(value)) {
    if (allowRawTextNull && key === "raw_text") continue;
    assert.equal(["token", "jwt", "private_key", "authorization", "patch", "diff", "raw_text"].includes(key), false);
  }
}

function countApiJsFiles(dir) {
  let count = 0;
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      count += countApiJsFiles(fullPath);
    } else if (entry.endsWith(".js")) {
      count += 1;
    }
  }
  return count;
}

async function callRecentImport(body, deps) {
  const res = mockRes();
  await handleGithubRecentPullRequestsImport(mockReq({ body }), res, deps);
  return res;
}

function baseDeps(overrides = {}) {
  return {
    supabase: { auth: {} },
    verifyAccessToken: async ({ accessToken }) => {
      assert.equal(accessToken, "test-token");
      return { ok: true, userId: verifiedUserId };
    },
    readConnection: async () => ({
      ok: true,
      connection: {
        id: "connection-916",
        installation_id: "123456",
        github_login: "passmap-dev",
      },
    }),
    readRepositoryRows: async () => ({
      ok: true,
      rows: [
        {
          id: "repo-row-selected",
          connection_id: "connection-916",
          github_repo_id: "1001",
          owner: "true-hr",
          name: "reject-analyzer",
          full_name: "true-hr/reject-analyzer",
          selected: true,
        },
        {
          id: "repo-row-unselected",
          connection_id: "connection-916",
          github_repo_id: "1002",
          owner: "true-hr",
          name: "do-not-scan",
          full_name: "true-hr/do-not-scan",
          selected: false,
        },
      ],
    }),
    createInstallationToken: async () => ({ ok: true, token: fakeToken }),
    fetchClosedPullRequests: async () => ({ ok: true, pullRequests: [] }),
    fetchPullRequestDetail: async ({ pullRequestNumber }) => ({
      ok: true,
      pullRequest: {
        number: pullRequestNumber,
        title: `Detail PR ${pullRequestNumber}`,
        body: `Detailed body for ${pullRequestNumber} with ${fakePrivateKey}`,
        html_url: `https://github.com/true-hr/reject-analyzer/pull/${pullRequestNumber}`,
        additions: 120,
        deletions: 10,
        merged_at: "2026-06-16T10:05:35Z",
        user_login: "passmap-dev",
      },
    }),
    fetchPullRequestFiles: async () => ({
      ok: true,
      files: normalizeGithubPullRequestFiles([
        {
          filename: "api/save-analysis-run.js",
          status: "modified",
          additions: 80,
          deletions: 8,
          changes: 88,
          patch: "@@ diff patch-local-secret @@",
          diff: "diff --git patch-local-secret",
        },
      ]),
    }),
    buildCandidateContract: buildGithubPrCareerCandidateContract,
    persistCandidate: async ({ contract }) => ({
      ok: true,
      duplicate: false,
      response: { preview: { work_title: contract.career_asset_candidate.title } },
    }),
    now,
    ...overrides,
  };
}

const source = readFileSync(path.join(root, "api/save-analysis-run.js"), "utf8");
assert.match(source, /case "github_recent_pull_requests_import"/, "new action must be registered");
assert.match(source, /buildGithubPrCareerCandidateContract\(payload\)/, "recent import must reuse GitHub PR candidate builder");
assert.match(source, /persistGithubPrCandidate/, "recent import must reuse GitHub PR persistence helper");
assert.equal(source.includes("/api/github/recent"), false, "new API route must not be added");
assert.equal(countApiJsFiles(path.join(root, "api")), 12, "API JS count contract remains 12");
const recentHandlerSource = source.slice(
  source.indexOf("export async function handleGithubRecentPullRequestsImport"),
  source.indexOf("// ─── dispatcher")
);
assert.match(recentHandlerSource, /readConnectedGithubConnectionForUser/, "recent import must read connected GitHub connection");
assert.equal(/github_connections[\s\S]{0,160}\.update\(/.test(recentHandlerSource), false, "recent import must not write github_connections");
assert.equal(/github_repository_access[\s\S]{0,160}\.update\(/.test(recentHandlerSource), false, "recent import must not write github_repository_access");

const request = normalizeGithubRecentPullRequestsImportRequest({ lookback_days: 99, per_repo_limit: 99 });
assert.deepEqual({ ok: request.ok, lookbackDays: request.lookbackDays, perRepoLimit: request.perRepoLimit }, {
  ok: true,
  lookbackDays: 30,
  perRepoLimit: 20,
});
assert.equal(normalizeGithubRecentPullRequestsImportRequest({ token: "x" }).ok, false, "token input must be rejected");
assert.equal(normalizeGithubRecentPullRequestsImportRequest({ nested: { private_key: "x" } }).ok, false, "private key input must be rejected");
assert.equal(normalizeGithubRecentPullRequestsImportRequest({ raw_text: "x" }).ok, false, "raw_text input must be rejected");
assert.equal(normalizeGithubRecentPullRequestsImportRequest({ diff: "x" }).ok, false, "diff input must be rejected");
assert.equal(normalizeGithubRecentPullRequestsImportRequest({ patch: "x" }).ok, false, "patch input must be rejected");

assert.deepEqual(selectedGithubRepositoryRows([
  { full_name: "true-hr/reject-analyzer", selected: true },
  { full_name: "true-hr/unselected", selected: false },
]).map((repo) => repo.full_name), ["true-hr/reject-analyzer"]);

const normalizedFiles = normalizeGithubPullRequestFiles([
  { filename: "a.js", status: "modified", additions: 1, deletions: 2, changes: 3, patch: "@@ diff", diff: "raw diff" },
]);
assert.deepEqual(Object.keys(normalizedFiles[0]).sort(), ["additions", "changes", "deletions", "filename", "status"]);
assertNoSecrets(normalizedFiles);

const payload = buildGithubPullRequestCandidatePayload({
  repository: { github_repo_id: "1001", full_name: "true-hr/reject-analyzer" },
  pullRequest: {
    number: 916,
    title: "Add GitHub repository access selection",
    body: "Full body is transform input only",
    html_url: "https://github.com/true-hr/reject-analyzer/pull/916",
    additions: 120,
    deletions: 5,
    merged_at: "2026-06-16T10:05:35Z",
    user_login: "passmap-dev",
  },
  files: normalizedFiles,
});
assert.equal(serialized(payload).includes("@@ diff"), false, "candidate payload must not include patch/diff");
const contract = buildGithubPrCareerCandidateContract(payload);
assert.equal(containsSensitiveContractValue(contract), false);
const rows = buildGithubPrPersistenceRows({ userId: verifiedUserId, contract });
assert.equal(rows.rawSource.raw_text, null, "raw_sources.raw_text must stay null");
assert.equal(serialized(rows).includes("Full body is transform input only"), false, "full PR body must not persist");
assertNoSecrets(rows, { allowRawTextNull: true });

let tokenCalls = 0;
let fetchCalls = 0;
const noSelectionRes = await callRecentImport({}, baseDeps({
  readRepositoryRows: async () => ({ ok: true, rows: [] }),
  createInstallationToken: async () => {
    tokenCalls += 1;
    return { ok: true, token: fakeToken };
  },
  fetchClosedPullRequests: async () => {
    fetchCalls += 1;
    return { ok: true, pullRequests: [] };
  },
}));
assert.equal(noSelectionRes.statusCode, 200);
assert.equal(noSelectionRes.body.repositories_scanned, 0);
assert.equal(noSelectionRes.body.next_action, "select_github_repositories");
assert.equal(noSelectionRes.body.warning.code, "github_repository_selection_required");
assert.equal(tokenCalls, 0, "no token should be created without selected repositories");
assert.equal(fetchCalls, 0, "no GitHub API call should run without selected repositories");
assertNoSecrets(noSelectionRes.body);

tokenCalls = 0;
fetchCalls = 0;
const missingConfigRes = await callRecentImport({}, baseDeps({
  createInstallationToken: async () => {
    tokenCalls += 1;
    return { ok: false, code: "github_app_private_config_missing" };
  },
  fetchClosedPullRequests: async () => {
    fetchCalls += 1;
    return { ok: true, pullRequests: [] };
  },
}));
assert.equal(missingConfigRes.statusCode, 200);
assert.equal(missingConfigRes.body.warning.code, "github_app_private_config_missing");
assert.equal(missingConfigRes.body.repositories_scanned, 0);
assert.equal(tokenCalls, 1);
assert.equal(fetchCalls, 0, "config missing must not call GitHub API");
assertNoSecrets(missingConfigRes.body);

const scannedRepos = [];
const installationTokensSeen = [];
const persistedContracts = [];
const importRes = await callRecentImport({ lookback_days: 14, per_repo_limit: 10 }, baseDeps({
  fetchClosedPullRequests: async ({ repository, installationToken, perRepoLimit }) => {
    scannedRepos.push(repository.full_name);
    installationTokensSeen.push(installationToken);
    assert.equal(perRepoLimit, 10);
    return {
      ok: true,
      pullRequests: [
        {
          number: 916,
          title: "Add GitHub repository access selection",
          body: "List body",
          html_url: "https://github.com/true-hr/reject-analyzer/pull/916",
          merged_at: "2026-06-16T10:05:35Z",
          user_login: "passmap-dev",
        },
        {
          number: 917,
          title: "Duplicate import",
          body: "List body",
          html_url: "https://github.com/true-hr/reject-analyzer/pull/917",
          merged_at: "2026-06-15T10:05:35Z",
          user_login: "passmap-dev",
        },
        {
          number: 918,
          title: "Closed but not merged",
          html_url: "https://github.com/true-hr/reject-analyzer/pull/918",
          merged_at: null,
          user_login: "passmap-dev",
        },
        {
          number: 919,
          title: "Outside lookback",
          html_url: "https://github.com/true-hr/reject-analyzer/pull/919",
          merged_at: "2026-05-01T10:05:35Z",
          user_login: "passmap-dev",
        },
        {
          number: 920,
          title: "Other author",
          html_url: "https://github.com/true-hr/reject-analyzer/pull/920",
          merged_at: "2026-06-16T10:05:35Z",
          user_login: "other-author",
        },
      ],
    };
  },
  persistCandidate: async ({ contract }) => {
    persistedContracts.push(contract);
    const persistenceRows = buildGithubPrPersistenceRows({ userId: verifiedUserId, contract });
    assert.equal(persistenceRows.rawSource.raw_text, null);
    assertNoSecrets(persistenceRows, { allowRawTextNull: true });
    return {
      ok: true,
      duplicate: contract.trace.pr_number === 917,
      response: { preview: { work_title: contract.career_asset_candidate.title } },
    };
  },
}));
assert.deepEqual(scannedRepos, ["true-hr/reject-analyzer"], "only selected repository rows may be scanned");
assert.equal(installationTokensSeen.every((token) => token === fakeToken), true, "installation token is used only in memory for GitHub calls");
assert.equal(importRes.statusCode, 200);
assert.equal(importRes.body.repositories_scanned, 1);
assert.equal(importRes.body.pull_requests_found, 2);
assert.equal(importRes.body.candidates_created, 1);
assert.equal(importRes.body.duplicates_skipped, 1);
assert.equal(importRes.body.candidates.length, 1);
assert.equal(importRes.body.candidates[0].pull_request_number, 916);
assert.equal(persistedContracts.length, 2, "only merged, in-lookback, preferred-author PRs should persist or dedupe");
assertNoSecrets(importRes.body);

const safeResponse = buildGithubRecentPullRequestsImportResponse({
  repositoriesScanned: 1,
  pullRequestsFound: 1,
  candidatesCreated: 1,
  candidates: [{
    repo_full_name: "true-hr/reject-analyzer",
    pull_request_number: 916,
    pull_request_title: "Safe title",
    merged_at: "2026-06-16T10:05:35Z",
    candidate_title: "Safe candidate",
    patch: "must not pass",
  }],
});
assertNoSecrets(safeResponse);

const fetchUrls = [];
await fetchClosedGithubPullRequestsForRepo({
  repository: { owner: "true-hr", name: "reject-analyzer", full_name: "true-hr/reject-analyzer" },
  installationToken: fakeToken,
  perRepoLimit: 10,
  fetchFn: async (url) => {
    fetchUrls.push(url);
    return { ok: true, json: async () => [] };
  },
});
await fetchGithubPullRequestFiles({
  repository: { owner: "true-hr", name: "reject-analyzer", full_name: "true-hr/reject-analyzer" },
  pullRequestNumber: 916,
  installationToken: fakeToken,
  fetchFn: async (url) => {
    fetchUrls.push(url);
    return { ok: true, json: async () => [{ filename: "a.js", patch: "@@ diff" }] };
  },
});
assert.equal(fetchUrls[0], "https://api.github.com/repos/true-hr/reject-analyzer/pulls?state=closed&sort=updated&direction=desc&per_page=10");
assert.equal(fetchUrls[1], "https://api.github.com/repos/true-hr/reject-analyzer/pulls/916/files?per_page=100");

const manualUiSource = readFileSync(path.join(root, "src/components/home/HomeDashboard.jsx"), "utf8");
assert.match(manualUiSource, /github_recent_pull_requests_import/, "UI must call recent PR import action");
assert.match(manualUiSource, /최근 PR 불러오기/, "UI must expose the recent PR import CTA");
assert.match(manualUiSource, /수동 PR 입력/, "manual PR import fallback must remain available");

console.log("PASS github-recent-pull-requests-import-contract");
