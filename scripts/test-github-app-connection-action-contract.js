import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import handler, {
  handleGithubConnectionCallbackStub,
  handleGithubConnectionPrepare,
  handleGithubConnectionStatus,
  handleGithubRepositoryAccessPreview,
} from "../api/save-analysis-run.js";
import {
  GITHUB_RAW_PAYLOAD_FORBIDDEN_KEYS,
  GITHUB_TOKEN_FORBIDDEN_KEYS,
} from "../server/api-helpers/github-app-connection.js";

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

async function callHandler(fn, body = {}, token = "test-token") {
  const res = mockRes();
  await fn(mockReq({ body, token }), res, authDeps);
  return res;
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

const prepareRes = await callHandler(handleGithubConnectionPrepare);
assert.equal(prepareRes.statusCode, 200);
assert.deepEqual(prepareRes.body, {
  ok: true,
  connect: {
    provider: "github",
    connection_type: "github_app",
    ready: false,
    reason: "github_app_not_configured",
    next_action: "configure_github_app",
  },
});
assertNoForbiddenResponseKeys(prepareRes.body);

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
