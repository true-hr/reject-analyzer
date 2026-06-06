import assert from "node:assert/strict";

import {
  fetchSchedulerV2NotificationSummary,
  SCHEDULER_V2_NOTIFICATION_SUMMARY_RPC,
} from "../schedulerV2NotificationSummaryRepository.js";

function createSupabaseMock(result) {
  const calls = [];
  return {
    calls,
    client: {
      from(tableName) {
        calls.push({ method: "from", tableName });
        throw new Error("raw base table query is not allowed");
      },
      async rpc(functionName) {
        calls.push({ method: "rpc", functionName });
        return result;
      },
    },
  };
}

async function testRpcCallAndArrayReturn() {
  const rows = [{ person_id: "person-1", providers: [] }];
  const { client, calls } = createSupabaseMock({ data: rows, error: null });

  const result = await fetchSchedulerV2NotificationSummary(client);

  assert.equal(result, rows);
  assert.deepEqual(calls, [
    { method: "rpc", functionName: SCHEDULER_V2_NOTIFICATION_SUMMARY_RPC },
  ]);
}

async function testNullDataReturnsEmptyArray() {
  const { client, calls } = createSupabaseMock({ data: null, error: null });

  const result = await fetchSchedulerV2NotificationSummary(client);

  assert.deepEqual(result, []);
  assert.deepEqual(calls, [
    { method: "rpc", functionName: SCHEDULER_V2_NOTIFICATION_SUMMARY_RPC },
  ]);
}

async function testErrorIsThrown() {
  const expectedError = new Error("rpc failed");
  const { client, calls } = createSupabaseMock({ data: null, error: expectedError });

  await assert.rejects(
    () => fetchSchedulerV2NotificationSummary(client),
    expectedError
  );
  assert.deepEqual(calls, [
    { method: "rpc", functionName: SCHEDULER_V2_NOTIFICATION_SUMMARY_RPC },
  ]);
}

async function testInvalidClientThrows() {
  await assert.rejects(
    () => fetchSchedulerV2NotificationSummary({}),
    /Supabase client with rpc\(\) is required/
  );
}

await testRpcCallAndArrayReturn();
await testNullDataReturnsEmptyArray();
await testErrorIsThrown();
await testInvalidClientThrows();

console.log("schedulerV2NotificationSummaryRepository tests passed");
