import assert from "node:assert/strict";
import {
  GITHUB_CONNECTION_STATE_TTL_MS,
  buildGithubConnectionStateRecord,
  generateGithubConnectionState,
  hashGithubConnectionState,
  normalizeGithubConnectionReturnTo,
} from "../server/api-helpers/github-connection-state.js";

const first = generateGithubConnectionState();
const second = generateGithubConnectionState();

assert.match(first, /^[A-Za-z0-9_-]+$/, "state must be URL-safe");
assert.ok(first.length >= 40, "state must have enough encoded entropy");
assert.notEqual(first, second, "generated states must differ");

const hashA = hashGithubConnectionState(first);
const hashB = hashGithubConnectionState(first);
assert.equal(hashA, hashB, "hash must be deterministic");
assert.notEqual(hashA, first, "hash must not equal raw state");
assert.match(hashA, /^[a-f0-9]{64}$/, "hash must be sha256 hex");

const nowMs = Date.parse("2026-06-16T00:00:00.000Z");
const record = buildGithubConnectionStateRecord({
  userId: "00000000-0000-4000-8000-000000000916",
  state: first,
  returnTo: "/settings/integrations",
  now: () => nowMs,
});

assert.equal(record.user_id, "00000000-0000-4000-8000-000000000916");
assert.equal(record.state_hash, hashA);
assert.equal(Object.hasOwn(record, "state"), false, "record must not store raw state");
assert.equal(record.purpose, "github_app_install");
assert.equal(record.status, "pending");
assert.equal(record.return_to, "/settings/integrations");
assert.equal(
  Date.parse(record.expires_at) - nowMs,
  GITHUB_CONNECTION_STATE_TTL_MS,
  "default expiry must be 10 minutes after created time"
);

assert.equal(normalizeGithubConnectionReturnTo("/settings/integrations"), "/settings/integrations");
for (const unsafe of [
  "https://evil.com",
  "//evil.com",
  "javascript:alert(1)",
  "data:text/html",
  "/bad\u0000path",
  "",
  `/${"x".repeat(1025)}`,
]) {
  assert.equal(normalizeGithubConnectionReturnTo(unsafe), null, `${JSON.stringify(unsafe)} must be rejected`);
}

console.log("PASS github-connection-state-helper-contract");
