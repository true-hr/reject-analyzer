import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import {
  createGithubAppJwt,
  createGithubInstallationAccessToken,
  normalizeGithubAppId,
  normalizeGithubPrivateKey,
  readGithubAppPrivateConfig,
} from "../server/api-helpers/github-app-installation-token.js";
import {
  buildGithubRepositoryAccessListResponse,
  buildGithubRepositorySelectionResponse,
  fetchGithubInstallationRepositories,
  normalizeGithubRepositoryFromInstallation,
  normalizeGithubRepositorySelectionPayload,
  persistGithubRepositoryAccessSnapshots,
  readConnectedGithubConnectionForUser,
  readGithubRepositoryAccessRows,
  updateGithubRepositorySelection,
} from "../server/api-helpers/github-repository-access.js";

const verifiedUserId = "00000000-0000-4000-8000-000000000914";
const connectionId = "11111111-1111-4111-8111-111111111111";
const privateKey = generateKeyPairSync("rsa", { modulusLength: 2048 })
  .privateKey
  .export({ type: "pkcs8", format: "pem" });

const forbiddenKeys = new Set([
  "token",
  "access_token",
  "refresh_token",
  "jwt",
  "authorization",
  "secret",
  "private_key",
  "client_secret",
  "raw_text",
  "diff",
  "patch",
]);

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

function assertNoForbiddenKeys(value) {
  for (const key of collectKeys(value)) {
    assert.equal(forbiddenKeys.has(key), false, `forbidden key returned: ${key}`);
  }
  const text = JSON.stringify(value);
  assert.equal(text.includes("ghs_installation_token"), false, "installation token must not be returned");
  assert.equal(text.includes("BEGIN PRIVATE KEY"), false, "private key must not be returned");
}

function installationRepo(id = 123, selected = false) {
  return {
    id,
    name: id === 123 ? "reject-analyzer" : "passmap-api",
    full_name: id === 123 ? "true-hr/reject-analyzer" : "true-hr/passmap-api",
    private: id !== 123,
    owner: { login: "true-hr" },
    permissions: { admin: false, push: true, pull: true },
    selected,
  };
}

function createRepositorySupabaseMock({ connection = null, rows = [], connectionError = null, rowsError = null, writeError = null } = {}) {
  const calls = [];
  const writes = [];

  function tableResult(table) {
    if (table === "github_connections") return { data: connection, error: connectionError };
    if (table === "github_repository_access") return { data: rows, error: rowsError };
    return { data: null, error: { code: "UNKNOWN_TABLE", message: table } };
  }

  function builder(table) {
    const state = { mode: "read" };
    return {
      select(columns) {
        calls.push({ method: "select", table, columns });
        return this;
      },
      eq(column, value) {
        calls.push({ method: "eq", table, column, value });
        return this;
      },
      order(column, options) {
        calls.push({ method: "order", table, column, options });
        return this;
      },
      limit(value) {
        calls.push({ method: "limit", table, value });
        return this;
      },
      maybeSingle() {
        calls.push({ method: "maybeSingle", table });
        if (table === "github_connections") return Promise.resolve(tableResult(table));
        return Promise.resolve({ data: null, error: rowsError });
      },
      update(row) {
        calls.push({ method: "update", table, row });
        if (table !== "github_repository_access") throw new Error(`must not write ${table}`);
        assertNoForbiddenKeys(row);
        state.mode = "write";
        writes.push({ method: "update", table, row });
        return this;
      },
      insert(row) {
        calls.push({ method: "insert", table, row });
        if (table !== "github_repository_access") throw new Error(`must not write ${table}`);
        assertNoForbiddenKeys(row);
        writes.push({ method: "insert", table, row });
        return Promise.resolve({ data: null, error: writeError });
      },
      upsert(row) {
        calls.push({ method: "upsert", table, row });
        throw new Error("must not upsert");
      },
      delete() {
        calls.push({ method: "delete", table });
        throw new Error("must not delete");
      },
      then(resolve, reject) {
        if (state.mode === "write") return Promise.resolve({ data: null, error: writeError }).then(resolve, reject);
        return Promise.resolve(tableResult(table)).then(resolve, reject);
      },
    };
  }

  return {
    calls,
    writes,
    from(table) {
      calls.push({ method: "from", table });
      if (["raw_sources", "experience_cards", "experience_evidence"].includes(table)) {
        throw new Error(`must not touch ${table}`);
      }
      return builder(table);
    },
  };
}

assert.equal(normalizeGithubAppId("12345"), "12345");
assert.equal(normalizeGithubAppId("abc"), null);
assert.equal(normalizeGithubPrivateKey(privateKey.replace(/\n/g, "\\n"))?.includes("BEGIN PRIVATE KEY"), true);
assert.deepEqual(readGithubAppPrivateConfig({}), { configured: false });

const jwtResult = createGithubAppJwt({
  appId: "12345",
  privateKey,
  now: () => Date.parse("2026-06-16T06:00:00.000Z"),
});
assert.equal(jwtResult.ok, true);
assert.equal(jwtResult.jwt.split(".").length, 3);

const tokenCalls = [];
const tokenResult = await createGithubInstallationAccessToken({
  installationId: "98765",
  env: {
    GITHUB_APP_ID: "12345",
    GITHUB_APP_PRIVATE_KEY: privateKey,
  },
  now: () => Date.parse("2026-06-16T06:00:00.000Z"),
  fetchFn: async (url, options = {}) => {
    tokenCalls.push({ url, options });
    assert.equal(url, "https://api.github.com/app/installations/98765/access_tokens");
    assert.equal(options.method, "POST");
    assert.match(options.headers.authorization, /^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    return { ok: true, json: async () => ({ token: "ghs_installation_token" }) };
  },
});
assert.equal(tokenResult.ok, true);
assert.equal(tokenResult.token, "ghs_installation_token");
assert.equal(tokenCalls.length, 1);

const repoFetchCalls = [];
const fetchResult = await fetchGithubInstallationRepositories({
  installationToken: "ghs_installation_token",
  fetchFn: async (url, options = {}) => {
    repoFetchCalls.push({ url, options });
    assert.equal(url, "https://api.github.com/installation/repositories");
    assert.equal(options.method, "GET");
    assert.equal(options.headers.authorization, "Bearer ghs_installation_token");
    return {
      ok: true,
      json: async () => ({ repositories: [installationRepo(123), installationRepo(456)] }),
    };
  },
});
assert.equal(fetchResult.ok, true);
assert.deepEqual(fetchResult.repositories[0], {
  github_repo_id: "123",
  owner: "true-hr",
  name: "reject-analyzer",
  full_name: "true-hr/reject-analyzer",
  private: false,
  permission_snapshot: { admin: false, push: true, pull: true },
});
assert.equal(repoFetchCalls.length, 1);

assert.deepEqual(normalizeGithubRepositoryFromInstallation(installationRepo(123)), fetchResult.repositories[0]);

const connectedSupabase = createRepositorySupabaseMock({
  connection: {
    id: connectionId,
    user_id: verifiedUserId,
    installation_id: "98765",
    status: "connected",
  },
});
const connectionResult = await readConnectedGithubConnectionForUser({
  supabase: connectedSupabase,
  userId: verifiedUserId,
});
assert.equal(connectionResult.ok, true);
assert.equal(connectionResult.connection.id, connectionId);
assert.equal(
  connectedSupabase.writes.length,
  0,
  "github_connections must be read only"
);

const existingRows = [
  {
    id: "repo-row-123",
    user_id: verifiedUserId,
    connection_id: connectionId,
    github_repo_id: "123",
    owner: "true-hr",
    name: "reject-analyzer",
    full_name: "true-hr/reject-analyzer",
    private: false,
    selected: true,
    permission_snapshot: { pull: true },
  },
];
const persistSupabase = createRepositorySupabaseMock({ rows: existingRows });
const rowsResult = await readGithubRepositoryAccessRows({
  supabase: persistSupabase,
  userId: verifiedUserId,
  connectionId,
});
assert.equal(rowsResult.ok, true);
assert.equal(rowsResult.rows.length, 1);

const persistResult = await persistGithubRepositoryAccessSnapshots({
  supabase: persistSupabase,
  userId: verifiedUserId,
  connectionId,
  repositories: fetchResult.repositories,
  existingRows,
});
assert.equal(persistResult.ok, true);
assert.equal(persistResult.rows.length, 2);
assert.equal(persistResult.rows.find((row) => row.github_repo_id === "123").selected, true, "existing selected value must be preserved");
assert.equal(persistSupabase.writes.length, 2);
assert.equal(persistSupabase.writes.some((write) => write.table !== "github_repository_access"), false);

const listResponse = buildGithubRepositoryAccessListResponse({ rows: persistResult.rows });
assert.equal(listResponse.ok, true);
assert.equal(listResponse.repositories.length, 2);
assert.equal(listResponse.repositories[0].selected, true);
assertNoForbiddenKeys(listResponse);

assert.deepEqual(normalizeGithubRepositorySelectionPayload({ selected_repo_ids: ["123", "456", "123"] }), {
  ok: true,
  selectedRepoIds: ["123", "456"],
});
assert.deepEqual(normalizeGithubRepositorySelectionPayload({
  repositories: [
    { github_repo_id: "123", selected: true, owner: "ignored" },
    { github_repo_id: "456", selected: false, full_name: "ignored/repo" },
  ],
}), {
  ok: true,
  selectedRepoIds: ["123"],
});
assert.equal(normalizeGithubRepositorySelectionPayload({ user_id: verifiedUserId }).code, "github_repository_selection_scope_forbidden");
assert.equal(normalizeGithubRepositorySelectionPayload({ connection_id: connectionId }).code, "github_repository_selection_scope_forbidden");

const selectionSupabase = createRepositorySupabaseMock({ rows: persistResult.rows });
const selectionResult = await updateGithubRepositorySelection({
  supabase: selectionSupabase,
  userId: verifiedUserId,
  connectionId,
  selectedRepoIds: ["456"],
  existingRows: persistResult.rows,
});
assert.equal(selectionResult.ok, true);
assert.equal(selectionResult.selectedRows.length, 1);
assert.equal(selectionResult.selectedRows[0].github_repo_id, "456");
assert.equal(selectionSupabase.writes.length, 2, "selection update must update rows scoped to connection");
assert.ok(
  selectionSupabase.calls.some((call) => call.method === "eq" && call.column === "user_id" && call.value === verifiedUserId),
  "selection update must filter by verified user id"
);
assert.ok(
  selectionSupabase.calls.some((call) => call.method === "eq" && call.column === "connection_id" && call.value === connectionId),
  "selection update must filter by connection id"
);
assert.deepEqual(
  buildGithubRepositorySelectionResponse({ selectedRows: selectionResult.selectedRows }),
  {
    ok: true,
    repositories_selected: 1,
    selected_repositories: [
      {
        github_repo_id: "456",
        full_name: "true-hr/passmap-api",
        selected: true,
      },
    ],
    next_action: "import_recent_github_pull_requests",
  }
);
assertNoForbiddenKeys(buildGithubRepositorySelectionResponse({ selectedRows: selectionResult.selectedRows }));

const missingSelectionResult = await updateGithubRepositorySelection({
  supabase: createRepositorySupabaseMock({ rows: persistResult.rows }),
  userId: verifiedUserId,
  connectionId,
  selectedRepoIds: ["999"],
  existingRows: persistResult.rows,
});
assert.deepEqual(missingSelectionResult, { ok: false, code: "github_repository_not_found" });

console.log("PASS github-repository-access-contract");
