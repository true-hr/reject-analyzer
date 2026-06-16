import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildGithubPrCareerCandidateContract,
} from "../src/lib/githubCareerCandidateContract.js";
import {
  buildGithubPrPersistenceRows,
  handleGithubDailyReviewRequest,
} from "../api/save-analysis-run.js";
import {
  buildGithubDailyReviewRequestResponse,
  normalizeGithubPullRequestFiles,
  normalizeGithubRecentPullRequestsImportRequest,
} from "../server/api-helpers/github-recent-pull-requests.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const verifiedUserId = "00000000-0000-4000-8000-000000000921";
const now = () => Date.parse("2026-06-16T12:00:00Z");
const fakeToken = "ghs_daily_review_memory_only_token";
const fakePrivateKey = "-----BEGIN PRIVATE KEY-----daily-review-must-not-leak-----END PRIVATE KEY-----";

function mockReq({ body = {}, token = "test-token", method = "POST" } = {}) {
  return {
    method,
    query: { action: "github_daily_review_request" },
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
  const text = JSON.stringify(value);
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

function reviewText(response) {
  const review = response?.body?.review || response?.review || {};
  return [
    review.title,
    review.message,
    review.sub_message,
    review.cta_label,
  ].filter(Boolean).join(" ");
}

function assertReviewDoesNotContain(response, terms) {
  const text = reviewText(response).toLowerCase();
  for (const term of terms) {
    assert.equal(text.includes(term), false, `review payload must not include ${term}`);
  }
}

async function callDailyReview(body, deps, token = "test-token") {
  const res = mockRes();
  await handleGithubDailyReviewRequest(mockReq({ body, token }), res, deps);
  return res;
}

function baseDeps(overrides = {}) {
  return {
    supabase: { auth: {} },
    verifyAccessToken: async ({ accessToken }) => {
      if (accessToken !== "test-token") {
        return { ok: false, status: 401, message: "Invalid or expired Supabase token" };
      }
      return { ok: true, userId: verifiedUserId };
    },
    readConnection: async () => ({
      ok: true,
      connection: {
        id: "connection-921",
        installation_id: "123456",
        github_login: "passmap-dev",
      },
    }),
    readRepositoryRows: async () => ({
      ok: true,
      rows: [
        {
          github_repo_id: "1001",
          owner: "true-hr",
          name: "reject-analyzer",
          full_name: "true-hr/reject-analyzer",
          selected: true,
        },
        {
          github_repo_id: "1002",
          owner: "true-hr",
          name: "unselected",
          full_name: "true-hr/unselected",
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
        body: `Full PR body with ${fakePrivateKey}`,
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
          filename: "src/components/home/HomeDashboard.jsx",
          status: "modified",
          additions: 12,
          deletions: 3,
          changes: 15,
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
assert.match(source, /case "github_daily_review_request"/, "daily review action must be registered");
assert.match(source, /handleGithubDailyReviewRequest/, "daily review handler must be exported");
assert.match(source, /runGithubRecentPullRequestsImport/, "daily review must reuse recent PR import orchestration");
assert.match(source, /defaultLookbackDays:\s*1/, "daily review lookback default must be 1 day");
assert.match(source, /maxLookbackDays:\s*7/, "daily review lookback max must be 7 days");
assert.equal(source.includes("/api/github/daily-review"), false, "new API route must not be added");
assert.equal(countApiJsFiles(path.join(root, "api")), 12, "API JS count contract remains 12");

const dailyRequest = normalizeGithubRecentPullRequestsImportRequest(
  { lookback_days: 99, per_repo_limit: 99 },
  { defaultLookbackDays: 1, maxLookbackDays: 7, defaultPerRepoLimit: 10, maxPerRepoLimit: 20 }
);
assert.deepEqual({
  ok: dailyRequest.ok,
  lookbackDays: dailyRequest.lookbackDays,
  perRepoLimit: dailyRequest.perRepoLimit,
}, {
  ok: true,
  lookbackDays: 7,
  perRepoLimit: 20,
});
for (const forbidden of ["user_id", "connection_id", "installation_id", "token", "jwt", "authorization", "private_key", "raw_text", "diff", "patch"]) {
  assert.equal(
    normalizeGithubRecentPullRequestsImportRequest({ [forbidden]: "x" }, { forbiddenCode: "github_daily_review_request_forbidden_scope" }).ok,
    false,
    `${forbidden} input must be rejected`
  );
}

const unauthRes = await callDailyReview({}, baseDeps(), null);
assert.equal(unauthRes.statusCode, 401, "unauthenticated request must be rejected");
assert.equal(unauthRes.body?.error?.code, "AUTH_REQUIRED");
assertNoSecrets(unauthRes.body);

const forbiddenRes = await callDailyReview({ nested: { private_key: fakePrivateKey } }, baseDeps());
assert.equal(forbiddenRes.statusCode, 400, "forbidden request keys must be rejected");
assert.equal(forbiddenRes.body?.error?.code, "github_daily_review_request_forbidden_scope");
assert.equal(JSON.stringify(forbiddenRes.body).includes(fakePrivateKey), false);
assertNoSecrets(forbiddenRes.body);

const notConnectedRes = await callDailyReview({}, baseDeps({
  readConnection: async () => ({ ok: true, connection: null }),
}));
assert.equal(notConnectedRes.statusCode, 200);
assert.equal(notConnectedRes.body.review.title, "GitHub 연결이 필요해요");
assert.equal(notConnectedRes.body.review.cta_label, "GitHub 연결하기");
assert.equal(notConnectedRes.body.next_action, "connect_github_app");
assert.equal(reviewText(notConnectedRes).includes("후보가 없어요"), false);
assertNoSecrets(notConnectedRes.body);

const connectionUnavailableRes = await callDailyReview({}, baseDeps({
  readConnection: async () => ({ ok: false }),
}));
assert.equal(connectionUnavailableRes.statusCode, 200);
assert.equal(connectionUnavailableRes.body.review.title, "GitHub 연결 상태를 확인하지 못했어요");
assert.equal(connectionUnavailableRes.body.next_action, "retry_github_connection_status");
assert.equal(reviewText(connectionUnavailableRes).includes("후보가 없어요"), false);
assertNoSecrets(connectionUnavailableRes.body);

const repositoryAccessUnavailableRes = await callDailyReview({}, baseDeps({
  readRepositoryRows: async () => ({ ok: false }),
}));
assert.equal(repositoryAccessUnavailableRes.statusCode, 200);
assert.equal(repositoryAccessUnavailableRes.body.review.title, "GitHub 저장소 정보를 확인하지 못했어요");
assert.equal(repositoryAccessUnavailableRes.body.next_action, "retry_github_repository_access_list");
assertNoSecrets(repositoryAccessUnavailableRes.body);

const tokenUnavailableRes = await callDailyReview({}, baseDeps({
  createInstallationToken: async () => ({ ok: false, code: "github_installation_token_unavailable" }),
}));
assert.equal(tokenUnavailableRes.statusCode, 200);
assert.equal(tokenUnavailableRes.body.review.title, "GitHub PR을 불러오지 못했어요");
assert.equal(tokenUnavailableRes.body.next_action, "retry_github_recent_pull_requests_import");
assertReviewDoesNotContain(tokenUnavailableRes, ["token", "jwt", "private", "secret", "installation"]);
assertNoSecrets(tokenUnavailableRes.body);

let tokenCalls = 0;
let fetchCalls = 0;
const noSelectionRes = await callDailyReview({}, baseDeps({
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
assert.equal(noSelectionRes.body.review.title, "GitHub 저장소를 먼저 선택하세요");
assert.equal(noSelectionRes.body.review.cta_label, "저장소 선택하기");
assert.equal(noSelectionRes.body.next_action, "select_github_repositories");
assert.equal(noSelectionRes.body.warning.code, "github_repository_selection_required");
assert.equal(noSelectionRes.body.repositories_scanned, 0);
assert.equal(tokenCalls, 0, "no token should be created without selected repositories");
assert.equal(fetchCalls, 0, "no GitHub API call should run without selected repositories");
assertNoSecrets(noSelectionRes.body);

const emptyRes = await callDailyReview({}, baseDeps());
assert.equal(emptyRes.statusCode, 200);
assert.equal(emptyRes.body.review.title, "오늘 새로 찾은 GitHub 업무 후보가 없어요");
assert.equal(emptyRes.body.review.cta_label, "AI 작업기록함 보기");
assert.equal(emptyRes.body.repositories_scanned, 1);
assert.equal(emptyRes.body.candidates_created, 0);
assert.deepEqual(emptyRes.body.candidates, []);
assertNoSecrets(emptyRes.body);

const scannedRepos = [];
const persistedContracts = [];
const successRes = await callDailyReview({ lookback_days: 1, per_repo_limit: 10 }, baseDeps({
  fetchClosedPullRequests: async ({ repository, installationToken, perRepoLimit }) => {
    scannedRepos.push(repository.full_name);
    assert.equal(installationToken, fakeToken);
    assert.equal(perRepoLimit, 10);
    return {
      ok: true,
      pullRequests: [
        {
          number: 919,
          title: "Polish GitHub import onboarding and dashboard hierarchy",
          body: "List body",
          html_url: "https://github.com/true-hr/reject-analyzer/pull/919",
          merged_at: "2026-06-16T10:05:35Z",
          user_login: "passmap-dev",
        },
        {
          number: 918,
          title: "Duplicate PR",
          html_url: "https://github.com/true-hr/reject-analyzer/pull/918",
          merged_at: "2026-06-16T09:05:35Z",
          user_login: "passmap-dev",
        },
        {
          number: 917,
          title: "Closed but not merged",
          html_url: "https://github.com/true-hr/reject-analyzer/pull/917",
          merged_at: null,
          user_login: "passmap-dev",
        },
        {
          number: 916,
          title: "Outside lookback",
          html_url: "https://github.com/true-hr/reject-analyzer/pull/916",
          merged_at: "2026-06-01T10:05:35Z",
          user_login: "passmap-dev",
        },
        {
          number: 915,
          title: "Other author",
          html_url: "https://github.com/true-hr/reject-analyzer/pull/915",
          merged_at: "2026-06-16T10:05:35Z",
          user_login: "other-author",
        },
      ],
    };
  },
  persistCandidate: async ({ contract, logPrefix }) => {
    assert.equal(logPrefix, "github-daily-review-request");
    persistedContracts.push(contract);
    const rows = buildGithubPrPersistenceRows({ userId: verifiedUserId, contract });
    assert.equal(rows.rawSource.raw_text, null, "raw_sources.raw_text must stay null");
    assert.equal(JSON.stringify(rows).includes("Full PR body with"), false, "full PR body must not persist");
    assertNoSecrets(rows, { allowRawTextNull: true });
    return {
      ok: true,
      duplicate: contract.trace.pr_number === 918,
      response: { preview: { work_title: contract.career_asset_candidate.title } },
    };
  },
}));
assert.deepEqual(scannedRepos, ["true-hr/reject-analyzer"], "only selected repositories may be scanned");
assert.equal(successRes.statusCode, 200);
assert.equal(successRes.body.review.title, "오늘 GitHub 업무 후보를 찾았어요");
assert.equal(successRes.body.review.message, "오늘 GitHub 활동에서 이력서에 추가할 만한 업무 후보 1건을 발견했어요.");
assert.equal(successRes.body.review.cta_label, "업무 후보 확인하기");
assert.equal(successRes.body.repositories_scanned, 1);
assert.equal(successRes.body.pull_requests_found, 2);
assert.equal(successRes.body.candidates_created, 1);
assert.equal(successRes.body.duplicates_skipped, 1);
assert.equal(successRes.body.candidates.length, 1);
assert.equal(successRes.body.candidates[0].pull_request_number, 919);
assert.equal(persistedContracts.length, 2, "only merged, in-lookback, preferred-author PRs should persist or dedupe");
assertNoSecrets(successRes.body);

const safeReview = buildGithubDailyReviewRequestResponse({
  repositoriesScanned: 1,
  pullRequestsFound: 1,
  candidatesCreated: 1,
  candidates: [{
    repo_full_name: "true-hr/reject-analyzer",
    pull_request_number: 919,
    pull_request_title: "Safe title",
    merged_at: "2026-06-16T10:05:35Z",
    candidate_title: "Safe candidate",
    patch: "must not pass",
  }],
});
assertNoSecrets(safeReview);

const dashboardSource = readFileSync(path.join(root, "src/components/home/HomeDashboard.jsx"), "utf8");
assert.match(dashboardSource, /github_daily_review_request/, "HomeDashboard must call daily review action");
assert.match(dashboardSource, /오늘 업무 후보 만들기/, "HomeDashboard must expose daily review secondary CTA");
assert.match(dashboardSource, /오늘 GitHub 활동에서 업무 후보/, "HomeDashboard must show daily review completion copy");
assert.match(dashboardSource, /업무 후보 확인하기/, "HomeDashboard must expose daily review inbox CTA");
assert.match(dashboardSource, /github_recent_pull_requests_import/, "recent PR import action must remain wired");
assert.match(dashboardSource, /github_pr_preview/, "manual GitHub PR preview fallback must remain wired");

console.log("PASS github-daily-review-request-contract");
