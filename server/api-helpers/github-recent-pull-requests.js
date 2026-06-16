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

export function normalizeGithubRecentPullRequestsImportRequest(body = {}, options = {}) {
  const defaultLookbackDays = options.defaultLookbackDays || DEFAULT_LOOKBACK_DAYS;
  const maxLookbackDays = options.maxLookbackDays || MAX_LOOKBACK_DAYS;
  const defaultPerRepoLimit = options.defaultPerRepoLimit || DEFAULT_PER_REPO_LIMIT;
  const maxPerRepoLimit = options.maxPerRepoLimit || MAX_PER_REPO_LIMIT;
  const forbiddenCode = options.forbiddenCode || "github_recent_pull_requests_forbidden_scope";
  const invalidMessage = options.invalidMessage || "Recent GitHub PR import request contains a forbidden field.";
  const forbiddenKey = findForbiddenRequestKey(body);
  if (forbiddenKey) {
    return {
      ok: false,
      code: forbiddenCode,
      message: invalidMessage,
      forbiddenKey,
    };
  }
  return {
    ok: true,
    lookbackDays: clampInteger(body.lookback_days ?? body.lookbackDays, defaultLookbackDays, maxLookbackDays),
    perRepoLimit: clampInteger(body.per_repo_limit ?? body.perRepoLimit, defaultPerRepoLimit, maxPerRepoLimit),
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

export function buildGithubDailyReviewRequestResponse({
  repositoriesScanned = 0,
  pullRequestsFound = 0,
  candidatesCreated = 0,
  duplicatesSkipped = 0,
  candidates = [],
  nextAction = "review_ai_experience_inbox",
  warning = null,
} = {}) {
  const createdCount = Number(candidatesCreated || 0);
  const warningCode = trimString(warning?.code);
  const warningReviewByCode = {
    github_repository_selection_required: {
      title: "GitHub 저장소를 먼저 선택하세요",
      message: "PR을 분석하려면 GitHub 저장소 선택이 필요합니다.",
      sub_message: "저장소를 선택하면 최근 merged PR을 업무 후보로 만들 수 있어요.",
      cta_label: "저장소 선택하기",
      next_action: "select_github_repositories",
    },
    github_connection_not_connected: {
      title: "GitHub 연결이 필요해요",
      message: "오늘 PR을 분석하려면 먼저 GitHub를 연결해야 합니다.",
      sub_message: "연결하면 선택한 저장소의 merged PR을 업무 후보로 만들 수 있어요.",
      cta_label: "GitHub 연결하기",
      next_action: "connect_github_app",
    },
    github_connection_unavailable: {
      title: "GitHub 연결 상태를 확인하지 못했어요",
      message: "잠시 후 다시 시도하거나 연결 상태를 새로고침하세요.",
      sub_message: "문제가 계속되면 연결 설정을 다시 확인해야 합니다.",
      cta_label: "다시 시도하기",
      next_action: "retry_github_connection_status",
    },
    github_repository_access_unavailable: {
      title: "GitHub 저장소 정보를 확인하지 못했어요",
      message: "선택한 저장소 정보를 불러오지 못했습니다.",
      sub_message: "저장소를 다시 불러온 뒤 업무 후보를 만들어보세요.",
      cta_label: "저장소 다시 불러오기",
      next_action: "retry_github_repository_access_list",
    },
    github_app_private_config_missing: {
      title: "GitHub PR을 불러오지 못했어요",
      message: "GitHub 연결을 일시적으로 확인하지 못했습니다.",
      sub_message: "잠시 후 다시 시도해 주세요.",
      cta_label: "다시 시도하기",
      next_action: nextAction || "retry_github_recent_pull_requests_import",
    },
    github_installation_token_unavailable: {
      title: "GitHub PR을 불러오지 못했어요",
      message: "GitHub 연결을 일시적으로 확인하지 못했습니다.",
      sub_message: "잠시 후 다시 시도해 주세요.",
      cta_label: "다시 시도하기",
      next_action: nextAction || "retry_github_recent_pull_requests_import",
    },
  };
  const warningReview = warningCode ? warningReviewByCode[warningCode] : null;
  const review = warningReview || (createdCount > 0
    ? {
        title: "오늘 GitHub 업무 후보를 찾았어요",
        message: `오늘 GitHub 활동에서 이력서에 추가할 만한 업무 후보 ${createdCount}건을 발견했어요.`,
        sub_message: "확인하고 경력기록에 반영할까요?",
        cta_label: "업무 후보 확인하기",
        next_action: "review_ai_experience_inbox",
      }
    : {
        title: "오늘 새로 찾은 GitHub 업무 후보가 없어요",
        message: "선택한 저장소에서 새로 반영할 merged PR을 찾지 못했어요.",
        sub_message: "이미 가져온 PR은 중복으로 만들지 않았습니다.",
        cta_label: "AI 작업기록함 보기",
        next_action: "review_ai_experience_inbox",
      });

  const response = {
    ok: true,
    review,
    repositories_scanned: Number(repositoriesScanned || 0),
    pull_requests_found: Number(pullRequestsFound || 0),
    candidates_created: createdCount,
    duplicates_skipped: Number(duplicatesSkipped || 0),
    candidates: safeArray(candidates).map((candidate) => ({
      repo_full_name: trimString(candidate.repo_full_name),
      pull_request_number: numberOrZero(candidate.pull_request_number),
      pull_request_title: trimString(candidate.pull_request_title),
      merged_at: trimString(candidate.merged_at) || null,
      candidate_title: trimString(candidate.candidate_title),
    })),
    next_action: review.next_action,
  };
  if (warning) response.warning = warning;
  return response;
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
