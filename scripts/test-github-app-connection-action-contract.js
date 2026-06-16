import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import handler, {
  handleGithubConnectionCallbackStub,
  handleGithubConnectionPrepare,
  handleGithubConnectionStatus,
  handleGithubRepositoryAccessPreview,
  readGithubConnectionStatus,
} from "../api/save-analysis-run.js";
import {
  GITHUB_RAW_PAYLOAD_FORBIDDEN_KEYS,
  GITHUB_TOKEN_FORBIDDEN_KEYS,
} from "../server/api-helpers/github-app-connection.js";
import {
  buildGithubAppInstallUrl,
  normalizeGithubAppSlug,
  readGithubAppPublicConfig,
} from "../server/api-helpers/github-app-config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const verifiedUserId = "00000000-0000-4000-8000-000000000904";

const forbiddenResponseKeys = new Set([
  ...GITHUB_TOKEN_FORBIDDEN_KEYS,
  ...GITHUB_RAW_PAYLOAD_FORBIDDEN_KEYS,
]);

const authDeps = {
  supabase: { auth: {} },
  verifyAccessToken: async ({ accessToken }) => {
    if (accessToken !== "test-token") {
      return { ok: false, status: 401, message: "Invalid or expired Supabase token" };
    }
    return { ok: true, userId: verifiedUserId };
  },
  readStatus: async () => ({ connection: null, repositoriesSelected: 0 }),
  readConfig: () => readGithubAppPublicConfig({}),
};

function mockReq({ action, method = "POST", body = {}, token = "test-token" } = {}) {
  return {
    method,
    query: action ? { action } : {},
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

function assertNoForbiddenResponseKeys(value) {
  const keys = collectKeys(value);
  for (const key of keys) {
    assert.equal(forbiddenResponseKeys.has(key), false, `response must not include forbidden key: ${key}`);
  }
}

async function callRoute(action, body = {}, token = "test-token") {
  const res = mockRes();
  await handler(mockReq({ action, body, token }), res);
  return res;
}

async function callHandler(fn, body = {}, token = "test-token", deps = authDeps) {
  const res = mockRes();
  await fn(mockReq({ body, token }), res, deps);
  return res;
}

function createGithubStatusSupabaseMock({ connection = null, connectionError = null, repoCount = 0, repoError = null } = {}) {
  const calls = [];
  const terminalForTable = (table) => {
    if (table === "github_connections") {
      return { data: connection, error: connectionError };
    }
    if (table === "github_repository_access") {
      return { count: repoCount, error: repoError };
    }
    return { data: null, error: { code: "UNKNOWN_TABLE", message: "Unknown table" } };
  };

  function builder(table) {
    return {
      select(columns, options) {
        calls.push({ method: "select", table, columns, options });
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
        return Promise.resolve(terminalForTable(table));
      },
      then(resolve, reject) {
        return Promise.resolve(terminalForTable(table)).then(resolve, reject);
      },
      insert(value) {
        calls.push({ method: "insert", table, value });
        throw new Error("insert must not be called");
      },
      update(value) {
        calls.push({ method: "update", table, value });
        throw new Error("update must not be called");
      },
      upsert(value) {
        calls.push({ method: "upsert", table, value });
        throw new Error("upsert must not be called");
      },
      delete() {
        calls.push({ method: "delete", table });
        throw new Error("delete must not be called");
      },
    };
  }

  return {
    calls,
    from(table) {
      calls.push({ method: "from", table });
      return builder(table);
    },
  };
}

function assertReadOnly(calls) {
  const writeCalls = calls.filter((call) => ["insert", "update", "upsert", "delete"].includes(call.method));
  assert.deepEqual(writeCalls, [], "github_connection_status must not call write methods");
}

const source = readFileSync(path.join(root, "api/save-analysis-run.js"), "utf8");
for (const action of [
  "github_connection_status",
  "github_connection_prepare",
  "github_connection_callback_stub",
  "github_repository_access_preview",
  "github_pr_preview",
]) {
  assert.match(source, new RegExp(`case "${action}"`), `${action} must be registered in save-analysis-run`);
}

for (const action of [
  "github_connection_status",
  "github_connection_prepare",
  "github_connection_callback_stub",
  "github_repository_access_preview",
]) {
  const res = await callRoute(action, {}, null);
  assert.equal(res.statusCode, 401, `${action} must reject unauthenticated requests`);
  assert.equal(res.body?.error?.code, "AUTH_REQUIRED");
  assertNoForbiddenResponseKeys(res.body);
}

const statusRes = await callHandler(handleGithubConnectionStatus);
assert.equal(statusRes.statusCode, 200);
assert.deepEqual(statusRes.body, {
  ok: true,
  connection: {
    connected: false,
    status: "not_connected",
    provider: "github",
    connection_type: "github_app",
    github_login: null,
    installation_id: null,
    repositories_selected: 0,
    last_checked_at: null,
  },
});
assertNoForbiddenResponseKeys(statusRes.body);

const noConnectionSupabase = createGithubStatusSupabaseMock();
const noConnectionRead = await readGithubConnectionStatus({
  supabase: noConnectionSupabase,
  userId: verifiedUserId,
});
assert.deepEqual(noConnectionRead, { connection: null, repositoriesSelected: 0 });
assert.ok(
  noConnectionSupabase.calls.some((call) => call.method === "eq" && call.column === "user_id" && call.value === verifiedUserId),
  "github_connections query must filter by verified user id"
);
assertReadOnly(noConnectionSupabase.calls);

const connectedSupabase = createGithubStatusSupabaseMock({
  connection: {
    id: "connection-904",
    user_id: "must-not-return",
    github_login: "octocat",
    installation_id: "123",
    connection_type: "github_app",
    status: "connected",
    granted_permissions: { contents: "read" },
    last_checked_at: "2026-06-15T00:00:00.000Z",
    connected_at: "2026-06-14T00:00:00.000Z",
    updated_at: "2026-06-15T00:00:00.000Z",
  },
  repoCount: 2,
});
const connectedRes = await callHandler(
  handleGithubConnectionStatus,
  {},
  "test-token",
  {
    supabase: connectedSupabase,
    verifyAccessToken: authDeps.verifyAccessToken,
  }
);
assert.equal(connectedRes.statusCode, 200);
assert.deepEqual(connectedRes.body, {
  ok: true,
  connection: {
    connected: true,
    status: "connected",
    provider: "github",
    connection_type: "github_app",
    github_login: "octocat",
    installation_id: 123,
    repositories_selected: 2,
    last_checked_at: "2026-06-15T00:00:00.000Z",
  },
});
assertNoForbiddenResponseKeys(connectedRes.body);
assert.equal(JSON.stringify(connectedRes.body).includes("connection-904"), false, "connection id must not be returned");
assert.equal(JSON.stringify(connectedRes.body).includes("must-not-return"), false, "user_id must not be returned");
assert.equal(JSON.stringify(connectedRes.body).includes("granted_permissions"), false, "granted_permissions must not be returned");
assert.ok(
  connectedSupabase.calls.some((call) => call.table === "github_repository_access" && call.method === "select" && call.options?.count === "exact" && call.options?.head === true),
  "selected repository count must use an exact head count"
);
assert.ok(
  connectedSupabase.calls.some((call) => call.table === "github_repository_access" && call.method === "eq" && call.column === "selected" && call.value === true),
  "repository count must include selected=true"
);
assertReadOnly(connectedSupabase.calls);

const unavailableSupabase = createGithubStatusSupabaseMock({
  connectionError: { code: "PGRST205", message: "table unavailable" },
});
const unavailableRes = await callHandler(
  handleGithubConnectionStatus,
  {},
  "test-token",
  {
    supabase: unavailableSupabase,
    verifyAccessToken: authDeps.verifyAccessToken,
  }
);
assert.equal(unavailableRes.statusCode, 200);
assert.deepEqual(unavailableRes.body, {
  ok: true,
  connection: {
    connected: false,
    status: "unavailable",
    provider: "github",
    connection_type: "github_app",
    github_login: null,
    installation_id: null,
    repositories_selected: 0,
    last_checked_at: null,
  },
  warning: {
    code: "github_connection_tables_unavailable",
    message: "GitHub connection tables are not available in this environment.",
  },
});
assertNoForbiddenResponseKeys(unavailableRes.body);
assertReadOnly(unavailableSupabase.calls);

const prepareRes = await callHandler(handleGithubConnectionPrepare);
assert.equal(prepareRes.statusCode, 200);
assert.deepEqual(prepareRes.body, {
  ok: true,
  connect: {
    provider: "github",
    connection_type: "github_app",
    configured: false,
    ready: false,
    reason: "github_app_not_configured",
    next_action: "configure_github_app",
    installation_url: null,
    state_required: true,
  },
});
assertNoForbiddenResponseKeys(prepareRes.body);

assert.equal(readGithubAppPublicConfig({}).reason, "github_app_not_configured");
assert.equal(readGithubAppPublicConfig({ GITHUB_APP_SLUG: "   " }).reason, "github_app_not_configured");

for (const maliciousSlug of ["https://evil.com/app", "foo/bar", "foo?x=1", "foo#bar", "foo bar"]) {
  assert.equal(normalizeGithubAppSlug(maliciousSlug), null, `${maliciousSlug} must be rejected`);
  assert.deepEqual(readGithubAppPublicConfig({ GITHUB_APP_SLUG: maliciousSlug }), {
    configured: false,
    reason: "github_app_invalid_config",
    installation_url: null,
  });
}

const invalidPrepareRes = await callHandler(
  handleGithubConnectionPrepare,
  {},
  "test-token",
  {
    ...authDeps,
    readConfig: () => readGithubAppPublicConfig({ GITHUB_APP_SLUG: "foo/bar" }),
  }
);
assert.equal(invalidPrepareRes.statusCode, 200);
assert.deepEqual(invalidPrepareRes.body, {
  ok: true,
  connect: {
    provider: "github",
    connection_type: "github_app",
    configured: false,
    ready: false,
    reason: "github_app_invalid_config",
    next_action: "fix_github_app_config",
    installation_url: null,
    state_required: true,
  },
});
assertNoForbiddenResponseKeys(invalidPrepareRes.body);

assert.equal(normalizeGithubAppSlug(" Passmap-GitHub-App-1 "), "Passmap-GitHub-App-1");
assert.equal(
  buildGithubAppInstallUrl({ appSlug: "Passmap-GitHub-App-1" }),
  "https://github.com/apps/Passmap-GitHub-App-1/installations/new"
);

const validPrepareRes = await callHandler(
  handleGithubConnectionPrepare,
  {},
  "test-token",
  {
    ...authDeps,
    readConfig: () => readGithubAppPublicConfig({ GITHUB_APP_SLUG: "passmap-github-app" }),
  }
);
assert.equal(validPrepareRes.statusCode, 200);
assert.deepEqual(validPrepareRes.body, {
  ok: true,
  connect: {
    provider: "github",
    connection_type: "github_app",
    configured: true,
    ready: false,
    reason: "github_connection_state_not_implemented",
    next_action: "implement_github_connection_state",
    installation_url: "https://github.com/apps/passmap-github-app/installations/new",
    state_required: true,
  },
});
assertNoForbiddenResponseKeys(validPrepareRes.body);

const originalFetch = globalThis.fetch;
let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("GitHub API must not be called");
};
try {
  const prepareNoDbRes = await callHandler(
    handleGithubConnectionPrepare,
    {},
    "test-token",
    {
      supabase: {
        from() {
          throw new Error("prepare action must not query the DB");
        },
      },
      verifyAccessToken: authDeps.verifyAccessToken,
      readConfig: () => readGithubAppPublicConfig({
        GITHUB_APP_SLUG: "safe-app",
        GITHUB_CLIENT_SECRET: "never-return",
      }),
    }
  );
  assert.equal(prepareNoDbRes.statusCode, 200);
  assert.equal(prepareNoDbRes.body.connect.installation_url, "https://github.com/apps/safe-app/installations/new");
  assert.equal(JSON.stringify(prepareNoDbRes.body).includes("never-return"), false);
  assert.equal(fetchCalls, 0, "prepare action must not call GitHub API");
  assertNoForbiddenResponseKeys(prepareNoDbRes.body);
} finally {
  globalThis.fetch = originalFetch;
}

const callbackRes = await callHandler(handleGithubConnectionCallbackStub);
assert.equal(callbackRes.statusCode, 501);
assert.deepEqual(callbackRes.body, {
  ok: false,
  error: {
    code: "github_callback_not_implemented",
    message: "GitHub App callback is not implemented yet.",
  },
});
assertNoForbiddenResponseKeys(callbackRes.body);

const validRepoSnapshot = {
  repository: {
    id: 123,
    owner: { login: "true-hr" },
    name: "reject-analyzer",
    full_name: "true-hr/reject-analyzer",
    private: false,
    permissions: { pull: true, push: false, admin: false },
  },
};

const repoPreviewRes = await callHandler(handleGithubRepositoryAccessPreview, validRepoSnapshot);
assert.equal(repoPreviewRes.statusCode, 200);
assert.deepEqual(repoPreviewRes.body, {
  ok: true,
  repository: {
    github_repo_id: "123",
    owner: "true-hr",
    name: "reject-analyzer",
    full_name: "true-hr/reject-analyzer",
    private: false,
    permission_snapshot: { pull: true, push: false, admin: false },
  },
});
assertNoForbiddenResponseKeys(repoPreviewRes.body);

const tokenLikeRes = await callHandler(handleGithubRepositoryAccessPreview, {
  repository: {
    ...validRepoSnapshot.repository,
    access_token: "never-return",
  },
});
assert.equal(tokenLikeRes.statusCode, 400);
assert.equal(tokenLikeRes.body?.error?.code, "FORBIDDEN_STORAGE_KEY");
assert.equal(JSON.stringify(tokenLikeRes.body).includes("never-return"), false);
assertNoForbiddenResponseKeys(tokenLikeRes.body);

const topLevelTokenLikeRes = await callHandler(handleGithubRepositoryAccessPreview, {
  repository: validRepoSnapshot.repository,
  client_secret: "never-return",
});
assert.equal(topLevelTokenLikeRes.statusCode, 400);
assert.equal(topLevelTokenLikeRes.body?.error?.code, "FORBIDDEN_STORAGE_KEY");
assert.equal(JSON.stringify(topLevelTokenLikeRes.body).includes("never-return"), false);
assertNoForbiddenResponseKeys(topLevelTokenLikeRes.body);

for (const forbiddenKey of ["diff", "patch", "raw_text"]) {
  const res = await callHandler(handleGithubRepositoryAccessPreview, {
    repository: {
      ...validRepoSnapshot.repository,
      permission_snapshot: { [forbiddenKey]: "@@ private payload @@" },
    },
  });
  assert.equal(res.statusCode, 400, `${forbiddenKey} must be rejected`);
  assert.equal(res.body?.error?.code, "FORBIDDEN_STORAGE_KEY");
  assert.equal(JSON.stringify(res.body).includes("@@ private payload @@"), false);
  assertNoForbiddenResponseKeys(res.body);
}

console.log("PASS github-app-connection-action-contract");
