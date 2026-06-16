import assert from "node:assert/strict";
import {
  buildVerifiedGithubConnectionRecord,
  exchangeGithubOAuthCodeForUserToken,
  findGithubInstallationById,
  normalizeGithubOAuthCodeForCallback,
  readGithubOAuthConfig,
  readGithubUserInstallations,
  verifyAndPersistGithubInstallationConnection,
} from "../server/api-helpers/github-installation-verify.js";

const verifiedUserId = "00000000-0000-4000-8000-000000000912";
const safeCode = "abcDEF_123-456789";
const forbiddenNeedles = [
  "ghu_temp_user_token",
  "client-secret",
  "raw-token-response",
];

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
  const keys = collectKeys(value);
  for (const key of keys) {
    assert.equal([
      "token",
      "access_token",
      "refresh_token",
      "authorization",
      "secret",
      "private_key",
      "client_secret",
      "state",
      "state_hash",
      "raw_text",
      "diff",
      "patch",
    ].includes(key), false, `forbidden key returned: ${key}`);
  }
  const text = JSON.stringify(value);
  for (const needle of forbiddenNeedles) {
    assert.equal(text.includes(needle), false, `forbidden value returned: ${needle}`);
  }
}

function githubInstallation(id = "123456") {
  return {
    id,
    account: {
      id: 9001,
      login: "octocat",
      type: "User",
    },
    repository_selection: "selected",
    permissions: {
      contents: "read",
      pull_requests: "write",
    },
    events: ["pull_request"],
  };
}

function createFetchMock({
  tokenOk = true,
  installationsOk = true,
  installations = [githubInstallation()],
} = {}) {
  const calls = [];
  const fetchFn = async (url, options = {}) => {
    calls.push({ url, options });
    if (url === "https://github.com/login/oauth/access_token") {
      assert.equal(options.method, "POST");
      assert.equal(options.headers.accept, "application/json");
      const body = JSON.parse(options.body);
      assert.equal(body.client_id, "client-id");
      assert.equal(body.client_secret, "client-secret");
      assert.equal(body.code, safeCode);
      if (!tokenOk) {
        return { ok: true, json: async () => ({ error: "bad_verification_code" }) };
      }
      return { ok: true, json: async () => ({ access_token: "ghu_temp_user_token", token_type: "bearer" }) };
    }
    if (url === "https://api.github.com/user/installations") {
      assert.equal(options.method, "GET");
      assert.equal(options.headers.authorization, "Bearer ghu_temp_user_token");
      if (!installationsOk) {
        return { ok: false, json: async () => ({ message: "unavailable" }) };
      }
      return { ok: true, json: async () => ({ installations }) };
    }
    throw new Error(`unexpected GitHub URL: ${url}`);
  };
  return { calls, fetchFn };
}

function createConnectionSupabaseMock({ existing = null, readError = null, writeError = null } = {}) {
  const calls = [];
  const writes = [];

  function assertSafeWrite(table, row) {
    assert.equal(table, "github_connections", "must write only github_connections");
    const text = JSON.stringify(row);
    for (const needle of forbiddenNeedles) {
      assert.equal(text.includes(needle), false, `write must not include ${needle}`);
    }
    assert.equal(text.includes("access_token"), false, "write must not include access_token");
    assert.equal(text.includes("refresh_token"), false, "write must not include refresh_token");
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
      limit(value) {
        calls.push({ method: "limit", table, value });
        return this;
      },
      maybeSingle() {
        calls.push({ method: "maybeSingle", table });
        if (state.mode === "read") return Promise.resolve({ data: existing, error: readError });
        return Promise.resolve({ data: { id: existing?.id || "connection-row" }, error: writeError });
      },
      update(row) {
        calls.push({ method: "update", table, row });
        if (table === "github_repository_access") throw new Error("must not write github_repository_access");
        assertSafeWrite(table, row);
        state.mode = "write";
        writes.push({ method: "update", table, row });
        return this;
      },
      insert(row) {
        calls.push({ method: "insert", table, row });
        if (table === "github_repository_access") throw new Error("must not write github_repository_access");
        assertSafeWrite(table, row);
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
        return Promise.resolve({ data: { id: existing?.id || "connection-row" }, error: writeError }).then(resolve, reject);
      },
    };
  }

  return {
    calls,
    writes,
    from(table) {
      calls.push({ method: "from", table });
      return builder(table);
    },
  };
}

assert.equal(normalizeGithubOAuthCodeForCallback(safeCode), safeCode);
assert.equal(normalizeGithubOAuthCodeForCallback(""), null);
assert.equal(normalizeGithubOAuthCodeForCallback("short"), null);
assert.equal(normalizeGithubOAuthCodeForCallback("x".repeat(513)), null);
for (const unsafe of ["abc def 123", "https://evil.com/code", "abc/def", "abc?def", "abc#def", "abc.def", "abc%20def"]) {
  assert.equal(normalizeGithubOAuthCodeForCallback(unsafe), null, `${unsafe} must be rejected`);
}

assert.deepEqual(readGithubOAuthConfig({}), { configured: false });
assert.equal(readGithubOAuthConfig({
  GITHUB_CLIENT_ID: "client-id",
  GITHUB_CLIENT_SECRET: "client-secret",
}).configured, true);

const exchangeFetch = createFetchMock();
const tokenResult = await exchangeGithubOAuthCodeForUserToken({
  code: safeCode,
  config: readGithubOAuthConfig({
    GITHUB_CLIENT_ID: "client-id",
    GITHUB_CLIENT_SECRET: "client-secret",
  }),
  fetchFn: exchangeFetch.fetchFn,
});
assert.equal(tokenResult.ok, true);
assert.equal(tokenResult.accessToken, "ghu_temp_user_token");
assert.equal(exchangeFetch.calls.length, 1);

const failedTokenFetch = createFetchMock({ tokenOk: false });
const failedTokenResult = await exchangeGithubOAuthCodeForUserToken({
  code: safeCode,
  config: readGithubOAuthConfig({
    GITHUB_CLIENT_ID: "client-id",
    GITHUB_CLIENT_SECRET: "client-secret",
  }),
  fetchFn: failedTokenFetch.fetchFn,
});
assert.deepEqual(failedTokenResult, { ok: false, code: "github_user_token_exchange_failed" });
assertNoForbiddenKeys(failedTokenResult);

const readFetch = createFetchMock();
const installationsResult = await readGithubUserInstallations({
  accessToken: "ghu_temp_user_token",
  fetchFn: readFetch.fetchFn,
});
assert.equal(installationsResult.ok, true);
assert.equal(readFetch.calls.length, 1);
assert.equal(findGithubInstallationById(installationsResult.installations, "123456")?.account?.login, "octocat");
assert.equal(findGithubInstallationById(installationsResult.installations, "999999"), null);

const record = buildVerifiedGithubConnectionRecord({
  userId: verifiedUserId,
  installation: githubInstallation(),
  now: () => Date.parse("2026-06-16T05:00:00.000Z"),
});
assert.deepEqual(record, {
  user_id: verifiedUserId,
  github_account_id: "9001",
  github_login: "octocat",
  github_account_type: "User",
  installation_id: "123456",
  granted_permissions: {
    contents: "read",
    pull_requests: "write",
  },
  granted_events: ["pull_request"],
  connection_type: "github_app",
  status: "connected",
  connected_at: "2026-06-16T05:00:00.000Z",
  last_checked_at: "2026-06-16T05:00:00.000Z",
  updated_at: "2026-06-16T05:00:00.000Z",
  disconnected_at: null,
});
assertNoForbiddenKeys(record);

const missingConfigResult = await verifyAndPersistGithubInstallationConnection({
  supabase: createConnectionSupabaseMock(),
  userId: verifiedUserId,
  code: safeCode,
  installationId: "123456",
  env: {},
  fetchFn: async () => {
    throw new Error("fetch must not be called without config");
  },
});
assert.deepEqual(missingConfigResult, { ok: false, code: "github_oauth_config_missing" });

const verifyFetch = createFetchMock();
const verifySupabase = createConnectionSupabaseMock();
const verifyResult = await verifyAndPersistGithubInstallationConnection({
  supabase: verifySupabase,
  userId: verifiedUserId,
  code: safeCode,
  installationId: "123456",
  env: {
    GITHUB_CLIENT_ID: "client-id",
    GITHUB_CLIENT_SECRET: "client-secret",
  },
  fetchFn: verifyFetch.fetchFn,
  now: () => Date.parse("2026-06-16T05:00:00.000Z"),
});
assert.deepEqual(verifyResult, {
  ok: true,
  github_login: "octocat",
  installation_id: "123456",
  persistence: "inserted",
});
assert.equal(verifyFetch.calls.length, 2, "must call token exchange then installations only");
assert.equal(verifySupabase.writes.length, 1, "must write one github_connections row");
assert.equal(verifySupabase.writes[0].method, "insert");
assert.equal(verifySupabase.writes[0].row.user_id, verifiedUserId);
assert.equal(verifySupabase.writes[0].row.installation_id, "123456");
assert.equal(verifySupabase.calls.some((call) => call.table === "github_repository_access"), false);
assertNoForbiddenKeys(verifyResult);

const updateFetch = createFetchMock();
const updateSupabase = createConnectionSupabaseMock({ existing: { id: "existing-connection" } });
const updateResult = await verifyAndPersistGithubInstallationConnection({
  supabase: updateSupabase,
  userId: verifiedUserId,
  code: safeCode,
  installationId: "123456",
  env: {
    GITHUB_CLIENT_ID: "client-id",
    GITHUB_CLIENT_SECRET: "client-secret",
  },
  fetchFn: updateFetch.fetchFn,
});
assert.equal(updateResult.ok, true);
assert.equal(updateResult.persistence, "updated");
assert.equal(updateSupabase.writes.length, 1);
assert.equal(updateSupabase.writes[0].method, "update");
assert.equal(updateSupabase.writes[0].row.user_id, undefined, "update patch should not overwrite user_id");

const notFoundFetch = createFetchMock({ installations: [githubInstallation("999999")] });
const notFoundResult = await verifyAndPersistGithubInstallationConnection({
  supabase: createConnectionSupabaseMock(),
  userId: verifiedUserId,
  code: safeCode,
  installationId: "123456",
  env: {
    GITHUB_CLIENT_ID: "client-id",
    GITHUB_CLIENT_SECRET: "client-secret",
  },
  fetchFn: notFoundFetch.fetchFn,
});
assert.deepEqual(notFoundResult, { ok: false, code: "github_installation_not_accessible" });
assertNoForbiddenKeys(notFoundResult);

const unavailableFetch = createFetchMock({ installationsOk: false });
const unavailableResult = await verifyAndPersistGithubInstallationConnection({
  supabase: createConnectionSupabaseMock(),
  userId: verifiedUserId,
  code: safeCode,
  installationId: "123456",
  env: {
    GITHUB_CLIENT_ID: "client-id",
    GITHUB_CLIENT_SECRET: "client-secret",
  },
  fetchFn: unavailableFetch.fetchFn,
});
assert.deepEqual(unavailableResult, { ok: false, code: "github_installation_verification_unavailable" });

const persistenceResult = await verifyAndPersistGithubInstallationConnection({
  supabase: createConnectionSupabaseMock({ writeError: { code: "PGRST205", message: "github_connections unavailable" } }),
  userId: verifiedUserId,
  code: safeCode,
  installationId: "123456",
  env: {
    GITHUB_CLIENT_ID: "client-id",
    GITHUB_CLIENT_SECRET: "client-secret",
  },
  fetchFn: createFetchMock().fetchFn,
});
assert.deepEqual(persistenceResult, { ok: false, code: "github_connection_persistence_unavailable" });

console.log("PASS github-installation-verify-contract");
