import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const migrationsDir = path.join(repoRoot, "supabase", "migrations");

function loadMigrationSql() {
  const fileName = fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith("_kakao_summary_capability_aware_readiness.sql"))
    .sort()
    .at(-1);

  assert.ok(fileName, "capability-aware Kakao summary migration is required");
  return fs.readFileSync(path.join(migrationsDir, fileName), "utf8");
}

function computeSendEligibility({
  identity = "missing",
  contact = "missing",
  consent = "missing",
  capability = null,
} = {}) {
  if (
    identity === "blocked" ||
    contact === "blocked" ||
    consent === "revoked" ||
    capability === "blocked"
  ) {
    return "blocked";
  }

  if (
    identity === "active" &&
    contact === "active" &&
    consent === "granted" &&
    capability === "ready"
  ) {
    return "ready";
  }

  if (
    ["missing", "active"].includes(identity) ||
    ["missing", "active"].includes(contact) ||
    ["missing", "granted"].includes(consent) ||
    capability === null ||
    capability === "not_ready"
  ) {
    return "not_ready";
  }

  return "unknown";
}

function testMigrationReadsCapabilityWithoutWritingReadinessTables() {
  const sql = loadMigrationSql();

  assert.match(sql, /from\s+public\.notification_channel_capabilities\s+ncc/i);
  assert.match(sql, /ncc\.channel\s*=\s*'kakao_alimtalk'/i);
  assert.match(sql, /ncc\.capability\s*=\s*'reminder_send'/i);
  assert.match(sql, /ncc\.status\s*=\s*'ready'/i);
  assert.match(sql, /ncc\.status\s*=\s*'not_ready'/i);
  assert.match(sql, /ncc\.status\s*=\s*'blocked'/i);
  assert.match(sql, /grant\s+execute\s+on\s+function\s+public\.get_current_person_notification_summary\(\)\s+to\s+authenticated/i);

  assert.doesNotMatch(sql, /insert\s+into\s+public\.(account_identities|contact_points|notification_consents|notification_channel_capabilities)\b/i);
  assert.doesNotMatch(sql, /update\s+public\.(account_identities|contact_points|notification_consents|notification_channel_capabilities)\b/i);
  assert.doesNotMatch(sql, /delete\s+from\s+public\.(account_identities|contact_points|notification_consents|notification_channel_capabilities)\b/i);
  assert.doesNotMatch(sql, /create\s+policy[\s\S]*\bto\s+authenticated\b/i);
  assert.doesNotMatch(sql, /grant\s+\w+[\s\S]*on\s+table[\s\S]*\bto\s+authenticated\b/i);
}

function testCapabilityAwareSendEligibilityContract() {
  assert.equal(
    computeSendEligibility({
      identity: "active",
      contact: "missing",
      consent: "missing",
      capability: null,
    }),
    "not_ready"
  );
  assert.equal(
    computeSendEligibility({
      identity: "active",
      contact: "active",
      consent: "granted",
      capability: null,
    }),
    "not_ready"
  );
  assert.equal(
    computeSendEligibility({
      identity: "active",
      contact: "active",
      consent: "granted",
      capability: "ready",
    }),
    "ready"
  );
  assert.equal(
    computeSendEligibility({
      identity: "missing",
      contact: "active",
      consent: "granted",
      capability: "ready",
    }),
    "not_ready"
  );
  assert.equal(
    computeSendEligibility({
      identity: "active",
      contact: "active",
      consent: "revoked",
      capability: "ready",
    }),
    "blocked"
  );
  assert.equal(
    computeSendEligibility({
      identity: "active",
      contact: "active",
      consent: "granted",
      capability: "blocked",
    }),
    "blocked"
  );
}

testMigrationReadsCapabilityWithoutWritingReadinessTables();
testCapabilityAwareSendEligibilityContract();

console.log("kakaoSummaryCapabilityAwareMigration tests passed");
