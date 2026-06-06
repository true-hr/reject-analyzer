import assert from "node:assert/strict";

import {
  buildSchedulerV2ReminderRulePayload,
  saveSchedulerV2ReminderRule,
  SCHEDULER_V2_NOTIFICATION_SETTINGS_WRITE_RPC,
} from "../schedulerV2NotificationSettingsRepository.js";

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
  const payload = {
    p_reminder_kind: "experience_recall",
    p_cadence: "weekly",
    p_days_of_week: [6],
    p_time_local: "18:00",
    p_timezone: "Asia/Seoul",
    p_is_enabled: true,
    p_channels: [{ channel: "web_push", priority: 1, is_enabled: true }],
  };
  const data = [{ rule_id: "rule-1" }];
  const { client, calls } = createSupabaseMock({ data, error: null });

  const result = await saveSchedulerV2ReminderRule(client, payload);

  assert.equal(result, data);
  assert.deepEqual(calls, [
    { method: "rpc", functionName: SCHEDULER_V2_NOTIFICATION_SETTINGS_WRITE_RPC, payload },
  ]);
}

async function testErrorIsThrown() {
  const expectedError = new Error("rpc failed");
  const { client, calls } = createSupabaseMock({ data: null, error: expectedError });
  const payload = { p_reminder_kind: "experience_recall" };

  await assert.rejects(
    () => saveSchedulerV2ReminderRule(client, payload),
    expectedError
  );
  assert.deepEqual(calls, [
    { method: "rpc", functionName: SCHEDULER_V2_NOTIFICATION_SETTINGS_WRITE_RPC, payload },
  ]);
}

async function testInvalidClientThrows() {
  await assert.rejects(
    () => saveSchedulerV2ReminderRule({}, {}),
    /Supabase client with rpc\(\) is required/
  );
}

function testPayloadBuilder() {
  const payload = buildSchedulerV2ReminderRulePayload({
    preferred_day_of_week: 2,
    preferred_time_local: "09:30:00",
    timezone: "Asia/Seoul",
    is_enabled: false,
  });

  assert.deepEqual(payload, {
    p_reminder_kind: "experience_recall",
    p_cadence: "weekly",
    p_days_of_week: [2],
    p_time_local: "09:30",
    p_timezone: "Asia/Seoul",
    p_is_enabled: false,
    p_channels: [{ channel: "web_push", priority: 1, is_enabled: true }],
  });
}

await testRpcCallAndDataReturn();
await testErrorIsThrown();
await testInvalidClientThrows();
testPayloadBuilder();

console.log("schedulerV2NotificationSettingsRepository tests passed");
