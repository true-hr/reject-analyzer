import assert from "node:assert/strict";

import {
  buildEmailContactConsentPayload,
  buildPhoneContactPayload,
  buildSmsContactConsentPayload,
  saveSchedulerV2ContactConsent,
  upsertCurrentPersonPhoneContact,
  SCHEDULER_V2_CONTACT_CONSENT_WRITE_RPC,
  SCHEDULER_V2_PHONE_CONTACT_WRITE_RPC,
} from "../schedulerV2ContactConsentRepository.js";

function createSupabaseMock(result) {
  const calls = [];
  return {
    calls,
    client: {
      from(tableName) {
        calls.push({ method: "from", tableName });
        throw new Error("raw base table query is not allowed");
      },
      async rpc(functionName, payload) {
        calls.push({ method: "rpc", functionName, payload });
        return result;
      },
    },
  };
}

async function testRpcCallAndDataReturn() {
  const payload = buildSmsContactConsentPayload("010-1234-5678");
  const data = [
    {
      contact_point_id: "contact-1",
      channel: "sms",
      masked_destination: "*******5678",
      value_normalized: "raw-or-hash-should-not-leak",
    },
  ];
  const { client, calls } = createSupabaseMock({ data, error: null });

  const result = await saveSchedulerV2ContactConsent(client, payload);

  assert.deepEqual(result, [
    {
      contact_point_id: "contact-1",
      channel: "sms",
      masked_destination: "*******5678",
    },
  ]);
  assert.deepEqual(calls, [
    { method: "rpc", functionName: SCHEDULER_V2_CONTACT_CONSENT_WRITE_RPC, payload },
  ]);
}

async function testPhoneOnlyRpcCallAndMaskedDataReturn() {
  const data = [
    {
      contact_point_id: "contact-1",
      contact_type: "phone",
      contact_status: "active",
      masked_destination: "*******5678",
      destination_hash: "hash-should-not-leak",
      p_phone: "raw-phone-should-not-leak",
      phone: "raw-phone-should-not-leak",
      value_normalized: "normalized-should-not-leak",
    },
  ];
  const { client, calls } = createSupabaseMock({ data, error: null });

  const result = await upsertCurrentPersonPhoneContact(client, "010-1234-5678");

  assert.deepEqual(result, [
    {
      contact_point_id: "contact-1",
      contact_type: "phone",
      contact_status: "active",
      masked_destination: "*******5678",
    },
  ]);
  assert.deepEqual(calls, [
    {
      method: "rpc",
      functionName: SCHEDULER_V2_PHONE_CONTACT_WRITE_RPC,
      payload: buildPhoneContactPayload("010-1234-5678"),
    },
  ]);
  assert.notEqual(calls[0].functionName, SCHEDULER_V2_CONTACT_CONSENT_WRITE_RPC);
  assert.notEqual(calls[0].functionName, "upsert_current_person_notification_consent");
}

async function testErrorIsThrown() {
  const expectedError = new Error("rpc failed");
  const { client, calls } = createSupabaseMock({ data: null, error: expectedError });
  const payload = buildSmsContactConsentPayload("010-1234-5678");

  await assert.rejects(
    () => saveSchedulerV2ContactConsent(client, payload),
    expectedError
  );
  assert.deepEqual(calls, [
    { method: "rpc", functionName: SCHEDULER_V2_CONTACT_CONSENT_WRITE_RPC, payload },
  ]);
}

async function testPhoneOnlyRpcErrorIsThrownWithoutExtraCalls() {
  const expectedError = new Error("rpc failed");
  const { client, calls } = createSupabaseMock({ data: null, error: expectedError });

  await assert.rejects(
    () => upsertCurrentPersonPhoneContact(client, "010-1234-5678"),
    expectedError
  );
  assert.deepEqual(calls, [
    {
      method: "rpc",
      functionName: SCHEDULER_V2_PHONE_CONTACT_WRITE_RPC,
      payload: buildPhoneContactPayload("010-1234-5678"),
    },
  ]);
}

async function testInvalidClientThrows() {
  await assert.rejects(
    () => saveSchedulerV2ContactConsent({}, {}),
    /Supabase client with rpc\(\) is required/
  );
}

function testPhoneContactPayloadBuilder() {
  const payload = buildPhoneContactPayload("010 1234 5678", {
    isPrimary: false,
    metadata: { ui_surface: "test" },
  });

  assert.deepEqual(payload, {
    p_phone: "01012345678",
    p_is_primary: false,
    p_metadata: {
      ui_surface: "test",
      contact_source: "reminder_settings_panel",
      contact_purpose: "notification_contact",
    },
  });
}

function testSmsPayloadBuilder() {
  const payload = buildSmsContactConsentPayload("010 1234 5678", {
    isPrimary: false,
    metadata: { ui_surface: "test" },
  });

  assert.deepEqual(payload, {
    p_channel: "sms",
    p_destination: "01012345678",
    p_consent_type: "reminder",
    p_consent_status: "granted",
    p_is_primary: false,
    p_metadata: {
      ui_surface: "test",
      contact_source: "reminder_settings_panel",
      copy_version: "scheduler-v2-contact-consent-20260612",
    },
  });
}

function testEmailPayloadBuilder() {
  const payload = buildEmailContactConsentPayload("USER@example.com");

  assert.equal(payload.p_channel, "email");
  assert.equal(payload.p_destination, "user@example.com");
  assert.equal(payload.p_is_primary, false);
}

async function testEmailWriteUsesRpc() {
  const payload = buildEmailContactConsentPayload("USER@example.com");
  const { client, calls } = createSupabaseMock({ data: [], error: null });

  await saveSchedulerV2ContactConsent(client, payload);

  assert.deepEqual(calls, [
    { method: "rpc", functionName: SCHEDULER_V2_CONTACT_CONSENT_WRITE_RPC, payload },
  ]);
}

async function testKakaoChannelWriteIsBlockedBeforeRpc() {
  const { client, calls } = createSupabaseMock({ data: [], error: null });
  const blockedChannel = ["kakao", "alimtalk"].join("_");
  const payload = {
    p_channel: blockedChannel,
    p_destination: ["kakao", "alimtalk:pending"].join("_"),
    p_consent_type: "reminder",
    p_consent_status: "granted",
    p_is_primary: true,
    p_metadata: {},
  };

  await assert.rejects(
    () => saveSchedulerV2ContactConsent(client, payload),
    /Unsupported contact consent write channel/
  );
  assert.deepEqual(calls, []);
}

function testInvalidPayloadsThrow() {
  assert.throws(() => buildPhoneContactPayload("123"), /valid phone number/);
  assert.throws(() => buildSmsContactConsentPayload("123"), /valid phone number/);
  assert.throws(() => buildEmailContactConsentPayload("not-email"), /valid email address/);
}

await testRpcCallAndDataReturn();
await testPhoneOnlyRpcCallAndMaskedDataReturn();
await testErrorIsThrown();
await testPhoneOnlyRpcErrorIsThrownWithoutExtraCalls();
await testInvalidClientThrows();
testPhoneContactPayloadBuilder();
testSmsPayloadBuilder();
testEmailPayloadBuilder();
await testEmailWriteUsesRpc();
await testKakaoChannelWriteIsBlockedBeforeRpc();
testInvalidPayloadsThrow();

console.log("schedulerV2ContactConsentRepository tests passed");
