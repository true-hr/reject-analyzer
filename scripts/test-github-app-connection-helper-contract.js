import assert from "node:assert/strict";
import {
  GITHUB_RAW_PAYLOAD_FORBIDDEN_KEYS,
  GITHUB_TOKEN_FORBIDDEN_KEYS,
  buildGithubConnectionRecord,
  buildGithubRepositoryAccessRecord,
  normalizeGithubAccount,
  normalizeGithubInstallation,
  normalizeGithubRepository,
  validateGithubRepositoryAccessSnapshot,
} from "../server/api-helpers/github-app-connection.js";

const verifiedUserId = "00000000-0000-4000-8000-000000000901";
const connectionId = "11111111-1111-4111-8111-111111111901";

function assertThrowsCode(fn, code) {
  assert.throws(fn, (error) => error?.code === code);
}

function assertNoForbiddenKeys(value) {
  const text = JSON.stringify(value).toLowerCase();
  for (const key of [...GITHUB_TOKEN_FORBIDDEN_KEYS, ...GITHUB_RAW_PAYLOAD_FORBIDDEN_KEYS]) {
    assert.equal(text.includes(`"${key}"`), false, `output must not include ${key}`);
  }
}

const account = normalizeGithubAccount({
  id: "123456789012345",
  login: "passmap-dev",
  type: "org",
  email: "ignored@example.com",
});

assert.deepEqual(account, {
  github_account_id: "123456789012345",
  github_login: "passmap-dev",
  github_account_type: "Organization",
});

assertThrowsCode(() => normalizeGithubAccount({ login: "missing-id", type: "User" }), "INVALID_BIGINT");

const installation = normalizeGithubInstallation({
  id: 987654321,
  permissions: { contents: "read", pull_requests: "read" },
  events: ["pull_request", "push"],
});

assert.deepEqual(installation, {
  installation_id: "987654321",
  granted_permissions: { contents: "read", pull_requests: "read" },
  granted_events: ["pull_request", "push"],
});

assertThrowsCode(
  () => normalizeGithubInstallation({ id: "1", permissions: { access_token: "never-store" } }),
  "FORBIDDEN_STORAGE_KEY"
);

const repository = normalizeGithubRepository({
  id: "555555555555",
  owner: { login: "true-hr" },
  name: "reject-analyzer",
  full_name: "true-hr/reject-analyzer",
  private: true,
  permissions: { pull: true, push: false, admin: false },
});

assert.deepEqual(repository, {
  github_repo_id: "555555555555",
  owner: "true-hr",
  name: "reject-analyzer",
  full_name: "true-hr/reject-analyzer",
  private: true,
  permission_snapshot: { pull: true, push: false, admin: false },
});

assertThrowsCode(
  () =>
    normalizeGithubRepository({
      id: "555555555555",
      owner: "true-hr",
      name: "reject-analyzer",
      full_name: "other/reject-analyzer",
    }),
  "INVALID_FULL_NAME"
);

assertThrowsCode(
  () =>
    normalizeGithubRepository({
      id: "555555555555",
      owner: "true-hr",
      name: "reject-analyzer",
      full_name: "true-hr/reject-analyzer",
      permission_snapshot: { diff: "@@ private patch @@", raw_text: "raw private payload" },
    }),
  "FORBIDDEN_STORAGE_KEY"
);

assert.deepEqual(validateGithubRepositoryAccessSnapshot(repository), { ok: true });
const invalidSnapshot = validateGithubRepositoryAccessSnapshot({
  ...repository,
  patch: "@@ do not store @@",
});
assert.equal(invalidSnapshot.ok, false);
assert.equal(invalidSnapshot.error.code, "FORBIDDEN_STORAGE_KEY");

const connectionRecord = buildGithubConnectionRecord({
  userId: verifiedUserId,
  account: { id: "123", login: "passmap-dev", type: "User", user_id: "github-user-id-is-ignored" },
  installation: { id: "987", permissions: { contents: "read" }, events: ["pull_request"] },
});

assert.equal(connectionRecord.user_id, verifiedUserId);
assert.equal(connectionRecord.connection_type, "github_app");
assert.equal(connectionRecord.status, "connected");
assert.equal(connectionRecord.github_account_type, "User");
assert.equal(connectionRecord.installation_id, "987");
assertNoForbiddenKeys(connectionRecord);

const repoAccessRecord = buildGithubRepositoryAccessRecord({
  userId: verifiedUserId,
  connectionId,
  repository,
  selected: true,
});

assert.equal(repoAccessRecord.user_id, verifiedUserId);
assert.equal(repoAccessRecord.connection_id, connectionId);
assert.equal(repoAccessRecord.selected, true);
assert.equal(repoAccessRecord.full_name, "true-hr/reject-analyzer");
assertNoForbiddenKeys(repoAccessRecord);
assertNoForbiddenKeys(account);
assertNoForbiddenKeys(installation);
assertNoForbiddenKeys(repository);

console.log("PASS github-app-connection-helper-contract");
