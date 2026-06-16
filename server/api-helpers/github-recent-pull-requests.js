const GITHUB_API_BASE = "https://api.github.com";
const DEFAULT_LOOKBACK_DAYS = 14;
const MAX_LOOKBACK_DAYS = 30;
const DEFAULT_PER_REPO_LIMIT = 10;
const MAX_PER_REPO_LIMIT = 20;

const FORBIDDEN_IMPORT_REQUEST_KEYS = new Set([
  "user_id",
  "connection_id",
  "installation_id",
  "token",
  "jwt",
  "authorization",
  "private_key",
  "raw_text",
  "diff",
  "patch",
]);

function trimString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function clampInteger(value, fallback, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  const integer = Math.floor(number);
  if (integer <= 0) return fallback;
  return Math.min(integer, max);
}

function findForbiddenRequestKey(value) {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findForbiddenRequestKey(item);
      if (found) return found;
    }
    return null;
  }
  if (!value || typeof value !== "object") return null;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_IMPORT_REQUEST_KEYS.has(key.toLowerCase())) return key;
    const found = findForbiddenRequestKey(child);
    if (found) return found;
  }
  return null;
}

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function parseDateMs(value) {
  const text = trimString(value);
  if (!text) return null;
  const ms = Date.parse(text);
  return Number.isFinite(ms) ? ms : null;
}

function normalizeRepo(row = {}) {
  const fullName = trimString(row.full_name);
  const [ownerFromFullName, nameFromFullName] = fullName.includes("/") ? fullName.split("/") : ["", ""];
  const owner = trimString(row.owner) || ownerFromFullName;
  const name = trimString(row.name) || nameFromFullName;
  if (!owner || !name) return null;
  return {
    github_repo_id: row.github_repo_id == null ? null : String(row.github_repo_id),
    owner,
    name,
    full_name: fullName || `${owner}/${name}`,
  };
}

function githubHeaders(installationToken) {
  return {
    accept: "application/vnd.github+json",
    authorization: `Bearer ${installationToken}`,
    "x-github-api-version": "2022-11-28",
  };
}

async function fetchGithubJson({ url, installationToken, fetchFn }) {
  if (!fetchFn || !trimString(installationToken)) return { ok: false, code: "github_recent_pull_requests_unavailable" };
  try {
    const response = await fetchFn(url, {
      method: "GET",
      headers: githubHeaders(installationToken),
    });
    if (!response?.ok) return { ok: false, code: "github_recent_pull_requests_unavailable" };
    const data = await response.json().catch(() => null);
    return { ok: true, data };
  } catch {
    return { ok: false, code: "github_recent_pull_requests_unavailable" };
  }
}

export function normalizeGithubRecentPullRequestsImportRequest(body = {}) {
  const forbiddenKey = findForbiddenRequestKey(body);
  if (forbiddenKey) {
    return {
      ok: false,
      code: "github_recent_pull_requests_forbidden_scope",
      message: "Recent GitHub PR import request contains a forbidden field.",
      forbiddenKey,
    };
  }
  return {
    ok: true,
    lookbackDays: clampInteger(body.lookback_days ?? body.lookbackDays, DEFAULT_LOOKBACK_DAYS, MAX_LOOKBACK_DAYS),
    perRepoLimit: clampInteger(body.per_repo_limit ?? body.perRepoLimit, DEFAULT_PER_REPO_LIMIT, MAX_PER_REPO_LIMIT),
  };
}

export function selectedGithubRepositoryRows(rows = []) {
  return safeArray(rows)
    .filter((row) => row?.selected === true)
    .map(normalizeRepo)
    .filter(Boolean);
}

export function buildGithubRecentPullRequestsImportResponse({
  repositoriesScanned = 0,
  pullRequestsFound = 0,
  candidatesCreated = 0,
  duplicatesSkipped = 0,
  candidates = [],
  nextAction = "review_ai_experience_inbox",
  warning = null,
} = {}) {
  const response = {
    ok: true,
    repositories_scanned: Number(repositoriesScanned || 0),
    pull_requests_found: Number(pullRequestsFound || 0),
    candidates_created: Number(candidatesCreated || 0),
    duplicates_skipped: Number(duplicatesSkipped || 0),
    candidates: safeArray(candidates).map((candidate) => ({
      repo_full_name: trimString(candidate.repo_full_name),
      pull_request_number: numberOrZero(candidate.pull_request_number),
      pull_request_title: trimString(candidate.pull_request_title),
      merged_at: trimString(candidate.merged_at) || null,
      candidate_title: trimString(candidate.candidate_title),
      next_action: "review_ai_experience_inbox",
    })),
    next_action: nextAction,
  };
  if (warning) response.warning = warning;
  return response;
}

export function buildGithubRepositorySelectionRequiredResponse() {
  return buildGithubRecentPullRequestsImportResponse({
    nextAction: "select_github_repositories",
    warning: {
      code: "github_repository_selection_required",
      message: "Select at least one GitHub repository first.",
    },
  });
}

export function normalizeGithubPullRequest(pr = {}) {
  const mergedAt = trimString(pr.merged_at);
  return {
    number: numberOrZero(pr.number),
    title: trimString(pr.title),
    body: trimString(pr.body),
    html_url: trimString(pr.html_url),
    merged_at: mergedAt || null,
    updated_at: trimString(pr.updated_at) || null,
    additions: numberOrZero(pr.additions),
    deletions: numberOrZero(pr.deletions),
    changed_files: numberOrZero(pr.changed_files),
    user_login: trimString(pr.user?.login || pr.user_login),
  };
}

export function normalizeGithubPullRequestFiles(files = []) {
  return safeArray(files)
    .map((file) => ({
      filename: trimString(file?.filename),
      status: trimString(file?.status) || "modified",
      additions: numberOrZero(file?.additions),
      deletions: numberOrZero(file?.deletions),
      changes: numberOrZero(file?.changes),
    }))
    .filter((file) => file.filename)
    .slice(0, 100);
}

export function isPullRequestInsideLookback(pr = {}, { lookbackDays = DEFAULT_LOOKBACK_DAYS, now = Date.now } = {}) {
  const mergedAtMs = parseDateMs(pr.merged_at);
  if (!mergedAtMs) return false;
  const nowMs = Number(now());
  if (!Number.isFinite(nowMs)) return false;
  const earliestMs = nowMs - Number(lookbackDays || DEFAULT_LOOKBACK_DAYS) * 24 * 60 * 60 * 1000;
  return mergedAtMs >= earliestMs && mergedAtMs <= nowMs + 60 * 1000;
}

export function isPreferredGithubAuthor(pr = {}, githubLogin = "") {
  const expected = trimString(githubLogin).toLowerCase();
  if (!expected) return true;
  const actual = trimString(pr.user_login).toLowerCase();
  return actual === expected;
}

export function buildGithubPullRequestCandidatePayload({ repository, pullRequest, files = [] } = {}) {
  const repo = normalizeRepo(repository);
  const pr = normalizeGithubPullRequest(pullRequest);
  return {
    repository: {
      id: repo?.github_repo_id || null,
      full_name: repo?.full_name || "unknown-repository",
      html_url: repo?.full_name ? `https://github.com/${repo.full_name}` : "",
    },
    pull_request: {
      number: pr.number,
      title: pr.title,
      body: pr.body,
      html_url: pr.html_url,
      additions: pr.additions,
      deletions: pr.deletions,
      merged_at: pr.merged_at,
      user: pr.user_login ? { login: pr.user_login } : undefined,
    },
    files: normalizeGithubPullRequestFiles(files),
  };
}

export async function fetchClosedGithubPullRequestsForRepo({
  repository,
  installationToken,
  perRepoLimit = DEFAULT_PER_REPO_LIMIT,
  fetchFn = globalThis.fetch,
} = {}) {
  const repo = normalizeRepo(repository);
  if (!repo) return { ok: false, code: "github_repository_invalid", pullRequests: [] };
  const limit = clampInteger(perRepoLimit, DEFAULT_PER_REPO_LIMIT, MAX_PER_REPO_LIMIT);
  const url = `${GITHUB_API_BASE}/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}/pulls?state=closed&sort=updated&direction=desc&per_page=${limit}`;
  const result = await fetchGithubJson({ url, installationToken, fetchFn });
  if (!result.ok) return { ...result, pullRequests: [] };
  return { ok: true, pullRequests: safeArray(result.data).map(normalizeGithubPullRequest) };
}

export async function fetchGithubPullRequestDetail({
  repository,
  pullRequestNumber,
  installationToken,
  fetchFn = globalThis.fetch,
} = {}) {
  const repo = normalizeRepo(repository);
  const number = numberOrZero(pullRequestNumber);
  if (!repo || !number) return { ok: false, code: "github_pull_request_detail_unavailable", pullRequest: null };
  const url = `${GITHUB_API_BASE}/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}/pulls/${number}`;
  const result = await fetchGithubJson({ url, installationToken, fetchFn });
  if (!result.ok) return { ...result, pullRequest: null };
  return { ok: true, pullRequest: normalizeGithubPullRequest(result.data) };
}

export async function fetchGithubPullRequestFiles({
  repository,
  pullRequestNumber,
  installationToken,
  fetchFn = globalThis.fetch,
} = {}) {
  const repo = normalizeRepo(repository);
  const number = numberOrZero(pullRequestNumber);
  if (!repo || !number) return { ok: false, code: "github_pull_request_files_unavailable", files: [] };
  const url = `${GITHUB_API_BASE}/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}/pulls/${number}/files?per_page=100`;
  const result = await fetchGithubJson({ url, installationToken, fetchFn });
  if (!result.ok) return { ...result, files: [] };
  return { ok: true, files: normalizeGithubPullRequestFiles(result.data) };
}
