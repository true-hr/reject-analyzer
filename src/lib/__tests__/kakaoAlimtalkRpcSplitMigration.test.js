import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const migrationFileName = "20260616143000_kakao_alimtalk_rpc_split_readiness.sql";
const migrationPath = path.join(repoRoot, "supabase", "migrations", migrationFileName);

function loadMigrationSql() {
  assert.ok(fs.existsSync(migrationPath), "Kakao Alimtalk RPC split migration is required");
  return fs.readFileSync(migrationPath, "utf8");
}

function getFunctionBody(sql, functionName) {
  const marker = `create or replace function public.${functionName}`;
  const start = sql.toLowerCase().indexOf(marker.toLowerCase());
  assert.notEqual(start, -1, `${functionName} definition is required`);

  const asStart = sql.toLowerCase().indexOf("as $$", start);
  assert.notEqual(asStart, -1, `${functionName} body start is required`);

  const bodyStart = asStart + "as $$".length;
  const bodyEnd = sql.indexOf("$$;", bodyStart);
  assert.notEqual(bodyEnd, -1, `${functionName} body end is required`);

  return sql.slice(bodyStart, bodyEnd);
}

function assertFunctionGrantShape(sql, functionName) {
  const escapedFunction = functionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.match(
    sql,
    new RegExp(`revoke\\s+all\\s+on\\s+function\\s+public\\.${escapedFunction}\\(`, "i")
  );
  assert.match(
    sql,
    new RegExp(`grant\\s+execute\\s+on\\s+function\\s+public\\.${escapedFunction}\\(`, "i")
  );
}

function computeSplitSendEligibility({
  identity = "missing",
  contact = "missing",
  contactBasis = "missing",
  contactVerified = false,
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
    ["verified_phone", "provider_recipient"].includes(contactBasis) &&
    contactVerified === true &&
    consent === "granted" &&
    capability === "ready"
  ) {
    return "ready";
  }

  if (
    ["missing", "active"].includes(identity) ||
    ["missing", "active"].includes(contact) ||
    ["missing", "placeholder", "unknown"].includes(contactBasis) ||
    contactVerified !== true ||
    ["missing", "granted"].includes(consent) ||
    capability === null ||
    capability === "not_ready"
  ) {
    return "not_ready";
  }

  return "unknown";
}

function testKakaoSpecificRpcIsSafeBlocked() {
  const sql = loadMigrationSql();
  const body = getFunctionBody(sql, "upsert_current_person_kakao_alimtalk_consent");

  assert.match(body, /raise\s+exception\s+'KAKAO_ALIMTALK_CONSENT_RPC_DEPRECATED'/i);
  assert.doesNotMatch(body, /\binsert\s+into\s+public\.contact_points\b/i);
  assert.doesNotMatch(body, /\bupdate\s+public\.contact_points\b/i);
  assert.doesNotMatch(body, /\binsert\s+into\s+public\.notification_consents\b/i);
  assert.doesNotMatch(body, /\bupdate\s+public\.notification_consents\b/i);
  assertFunctionGrantShape(sql, "upsert_current_person_kakao_alimtalk_consent");
}

function testGenericRpcRejectsKakaoBeforeWrites() {
  const sql = loadMigrationSql();
  const body = getFunctionBody(sql, "upsert_current_person_contact_consent");
  const rejectIndex = body.indexOf("KAKAO_ALIMTALK_CONTACT_CONSENT_WRITE_UNSUPPORTED");
  const firstContactWrite = body.search(/\binsert\s+into\s+public\.contact_points\b/i);
  const firstConsentWrite = body.search(/\binsert\s+into\s+public\.notification_consents\b/i);

  assert.notEqual(rejectIndex, -1, "generic RPC must reject Kakao Alimtalk writes");
  assert.ok(rejectIndex < firstContactWrite, "Kakao reject must happen before contact writes");
  assert.ok(rejectIndex < firstConsentWrite, "Kakao reject must happen before consent writes");
  assert.match(body, /if\s+p_channel\s*=\s*'sms'\s+then/i);
  assert.match(body, /elsif\s+p_channel\s*=\s*'email'\s+then/i);
  assertFunctionGrantShape(sql, "upsert_current_person_contact_consent");
}

function testConsentOnlyRpcDoesNotWriteContacts() {
  const sql = loadMigrationSql();
  const body = getFunctionBody(sql, "upsert_current_person_notification_consent");

  assert.match(body, /\binsert\s+into\s+public\.notification_consents\b/i);
  assert.match(body, /\bupdate\s+public\.notification_consents\b/i);
  assert.match(body, /contact_point_id,\s+consent_type/i);
  assert.match(body, /v_person_id,\s+null,\s+v_consent_type/i);
  assert.doesNotMatch(body, /\binsert\s+into\s+public\.contact_points\b/i);
  assert.doesNotMatch(body, /\bupdate\s+public\.contact_points\b/i);
  assertFunctionGrantShape(sql, "upsert_current_person_notification_consent");
}

function testPhoneContactOnlyRpcDoesNotWriteConsentOrVerification() {
  const sql = loadMigrationSql();
  const body = getFunctionBody(sql, "upsert_current_person_phone_contact");

  assert.match(body, /\binsert\s+into\s+public\.contact_points\b/i);
  assert.match(body, /\bupdate\s+public\.contact_points\b/i);
  assert.match(body, /masked_destination/i);
  assert.doesNotMatch(body, /\binsert\s+into\s+public\.notification_consents\b/i);
  assert.doesNotMatch(body, /\bupdate\s+public\.notification_consents\b/i);
  assert.doesNotMatch(body, /\binsert\s+into\s+public\.contact_verifications\b/i);
  assert.doesNotMatch(body, /\bupdate\s+public\.contact_verifications\b/i);
  assertFunctionGrantShape(sql, "upsert_current_person_phone_contact");
}

function testSummaryAppendsContactBasisVerificationAndCapability() {
  const sql = loadMigrationSql();
  const body = getFunctionBody(sql, "get_current_person_notification_summary");

  assert.match(body, /'contact_basis',\s*kakao_state\.contact_basis/i);
  assert.match(body, /'contact_verified',\s*kakao_state\.contact_verified/i);
  assert.match(body, /'capability',\s*coalesce\(kakao_state\.capability_status,\s*'missing'\)/i);
  assert.match(body, /'provider_recipient'/i);
  assert.match(body, /'verified_phone'/i);
  assert.match(body, /'placeholder'/i);
  assert.match(body, /public\.contact_verifications\s+cv/i);
  assert.match(body, /cv\.status\s*=\s*'verified'/i);
  assert.match(body, /cv\.verified_at\s+is\s+not\s+null/i);
  assertFunctionGrantShape(sql, "get_current_person_notification_summary");
}

function testSummaryReadyRequiresFiveConditionReadiness() {
  const sql = loadMigrationSql();
  const body = getFunctionBody(sql, "get_current_person_notification_summary");

  assert.match(body, /kakao_state\.identity\s*=\s*'active'/i);
  assert.match(body, /kakao_state\.contact_basis\s+in\s+\('verified_phone',\s*'provider_recipient'\)/i);
  assert.match(body, /and\s+kakao_state\.contact_verified/i);
  assert.match(body, /kakao_state\.consent\s*=\s*'granted'/i);
  assert.match(body, /kakao_state\.capability_status\s*=\s*'ready'/i);
  assert.equal(
    computeSplitSendEligibility({
      identity: "active",
      contact: "active",
      contactBasis: "placeholder",
      contactVerified: false,
      consent: "granted",
      capability: "ready",
    }),
    "not_ready"
  );
  assert.equal(
    computeSplitSendEligibility({
      identity: "active",
      contact: "active",
      contactBasis: "verified_phone",
      contactVerified: false,
      consent: "granted",
      capability: "ready",
    }),
    "not_ready"
  );
  assert.equal(
    computeSplitSendEligibility({
      identity: "active",
      contact: "active",
      contactBasis: "missing",
      contactVerified: false,
      consent: "granted",
      capability: "ready",
    }),
    "not_ready"
  );
  assert.equal(
    computeSplitSendEligibility({
      identity: "active",
      contact: "active",
      contactBasis: "verified_phone",
      contactVerified: true,
      consent: "granted",
      capability: "ready",
    }),
    "ready"
  );
}

function testNoProviderRecipientRpcOrCapabilitySeed() {
  const sql = loadMigrationSql();

  assert.doesNotMatch(sql, /upsert_current_person_kakao_alimtalk_recipient/i);
  assert.doesNotMatch(
    sql,
    /\b(insert\s+into|update|delete\s+from)\s+public\.notification_channel_capabilities\b/i
  );
  assert.doesNotMatch(sql, /create\s+policy[\s\S]*\bto\s+authenticated\b/i);
  assert.doesNotMatch(sql, /grant\s+\w+[\s\S]*on\s+table[\s\S]*\bto\s+authenticated\b/i);
}

testKakaoSpecificRpcIsSafeBlocked();
testGenericRpcRejectsKakaoBeforeWrites();
testConsentOnlyRpcDoesNotWriteContacts();
testPhoneContactOnlyRpcDoesNotWriteConsentOrVerification();
testSummaryAppendsContactBasisVerificationAndCapability();
testSummaryReadyRequiresFiveConditionReadiness();
testNoProviderRecipientRpcOrCapabilitySeed();

console.log("kakaoAlimtalkRpcSplitMigration tests passed");
