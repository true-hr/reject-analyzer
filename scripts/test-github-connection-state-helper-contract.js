import assert from "node:assert/strict";
import {
  GITHUB_CONNECTION_STATE_TTL_MS,
  buildGithubConnectionStateRecord,
  generateGithubConnectionState,
  hashGithubConnectionState,
  normalizeGithubConnectionCallbackState,
  normalizeGithubInstallationIdForCallback,
  normalizeGithubConnectionReturnTo,
} from "../server/api-helpers/github-connection-state.js";

const first = generateGithubConnectionState();
const second = generateGithubConnectionState();

assert.match(first, /^[A-Za-z0-9_-]+$/, "state must be URL-safe");
assert.ok(first.length >= 40, "state must have enough encoded entropy");
assert.notEqual(first, second, "generated states must differ");
assert.equal(normalizeGithubConnectionCallbackState(first), first, "generated state must normalize successfully");
assert.equal(normalizeGithubConnectionCallbackState(null), null, "missing state must be rejected");
assert.equal(normalizeGithubConnectionCallbackState("short"), null, "short state must be rejected");
assert.equal(normalizeGithubConnectionCallbackState("a".repeat(257)), null, "overly long state must be rejected");

for (const unsafeState of [
  `${first} x`,
  `${first}/x`,
  `${first}?x=1`,
  `${first}#x`,
  `${first}:x`,
  `${first}.x`,
  `${first}%20`,
  `${first}"`,
  `${first}'`,
  `${first}<x>`,
  `${first}\u0000`,
]) {
  assert.equal(normalizeGithubConnectionCallbackState(unsafeState), null, `${JSON.stringify(unsafeState)} must be rejected`);
}

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
assert.equal(JSON.stringify(record).includes(first), false, "state record result must not include raw state");
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

assert.equal(normalizeGithubInstallationIdForCallback("123456"), "123456");
assert.equal(normalizeGithubInstallationIdForCallback(123456), null, "callback installation id parser should not trust non-string values");
assert.equal(normalizeGithubInstallationIdForCallback("123abc"), null);
assert.equal(normalizeGithubInstallationIdForCallback(""), null);

console.log("PASS github-connection-state-helper-contract");
