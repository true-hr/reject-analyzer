import assert from "node:assert/strict";

import {
  fetchSchedulerV2NotificationSummary,
  SCHEDULER_V2_NOTIFICATION_SUMMARY_RPC,
} from "../schedulerV2NotificationSummaryRepository.js";
import { formatSchedulerV2SummaryRow } from "../../components/reminder/schedulerV2NotificationSummaryFormat.js";

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

function testPopulatedSummaryFormatting() {
  const [row] = [
    {
      person_id: "person-1",
      person_status: "active",
      providers: [
        { provider: "google", status: "active" },
        { provider: "kakao", status: "active" },
      ],
      contact_channels: [
        { channel: "email", status: "active", count: 1 },
        { channel: "sms", status: "unverified", count: 1 },
      ],
      consents: [
        { channel: "kakao_alimtalk", consent_type: "reminder", status: "agreed", count: 1 },
      ],
      reminder_rules: [
        {
          reminder_kind: "experience_recall",
          cadence: "weekdays",
          time_local: "18:00:00",
          timezone: "Asia/Seoul",
          is_enabled: true,
          channels: [
            { channel: "kakao_alimtalk", priority: 1, is_enabled: true },
            { channel: "sms", priority: 2, is_enabled: true },
          ],
        },
      ],
      web_push: [
        { ownership_status: "active", count: 1 },
      ],
    },
  ];

  const summary = formatSchedulerV2SummaryRow(row);

  assert.equal(summary.title, "알림 프로필 · 활성");
  assert.equal(summary.providers, "Google 활성, Kakao 활성");
  assert.equal(summary.contactChannels, "이메일 활성 1개, 문자 인증 필요 1개");
  assert.equal(summary.consents, "카카오 알림톡 리마인드 동의");
  assert.equal(summary.reminderRules, "업무기록 리마인드 · 평일 18:00 · 카카오 알림톡/문자 · ON");
  assert.equal(summary.webPush, "활성 1개");

  assert.deepEqual(summary.channelCards.map((card) => `${card.label} · ${card.status}`), [
    "카카오 알림톡 · 동의됨",
    "문자 · 인증 필요",
    "이메일 · 연결됨 1개",
    "Web Push · 활성 1개",
  ]);
  assert.equal(summary.channelCards.find((card) => card.key === "sms")?.actionLabel, "휴대폰 인증 준비중");
  assert.equal(summary.reminderActionLabel, "알림 규칙 추가 준비중");
  assert.equal(summary.hasReminderRules, true);

  const renderedText = JSON.stringify(summary);
  assert.equal(renderedText.includes("kakao_alimtalk"), false);
  assert.equal(renderedText.includes("experience_recall"), false);
  assert.equal(renderedText.includes("weekdays"), false);
  assert.equal(renderedText.includes("Person active"), false);
}

function testMalformedSummaryFormattingDoesNotCrash() {
  const summary = formatSchedulerV2SummaryRow({
    person_id: "person-2",
    person_status: null,
    providers: null,
    contact_channels: {},
    consents: undefined,
    reminder_rules: [
      {
        reminder_kind: null,
        cadence: null,
        time_local: null,
        channels: null,
        is_enabled: false,
      },
    ],
    web_push: "not-array",
  }, 1);

  assert.equal(summary.fallbackTitle, "알림 프로필 2");
  assert.equal(summary.providers, "연결 계정 없음");
  assert.equal(summary.contactChannels, "알림 채널 없음");
  assert.equal(summary.consents, "수신 동의 없음");
  assert.equal(summary.reminderRules, "리마인드 · OFF");
  assert.equal(summary.webPush, "Web Push 없음");
  assert.equal(summary.channelCards.length, 4);
  assert.equal(summary.channelCards.find((card) => card.key === "kakao")?.status, "동의 필요");
  assert.equal(summary.channelCards.find((card) => card.key === "sms")?.status, "없음");
  assert.equal(summary.hasReminderRules, true);
}

function testMissingChannelsFallback() {
  const summary = formatSchedulerV2SummaryRow({
    person_id: "person-empty",
    person_status: "active",
    providers: [],
    contact_channels: [],
    consents: [],
    reminder_rules: [],
    web_push: [],
  });

  assert.deepEqual(summary.channelCards.map((card) => `${card.label} · ${card.status}`), [
    "카카오 알림톡 · 동의 필요",
    "문자 · 없음",
    "이메일 · 없음",
    "Web Push · 없음",
  ]);
  assert.equal(summary.hasReminderRules, false);
}

function testWebPushOnlyFormatting() {
  const summary = formatSchedulerV2SummaryRow({
    person_id: "person-web-push",
    person_status: "active",
    web_push: [{ ownership_status: "active", count: 2 }],
  });

  assert.equal(summary.channelCards.find((card) => card.key === "web_push")?.status, "활성 2개");
  assert.equal(summary.channelCards.find((card) => card.key === "web_push")?.description, "현재 브라우저/기기 알림이 연결되어 있습니다.");
}

function testKakaoConsentAndSmsUnverifiedFormatting() {
  const summary = formatSchedulerV2SummaryRow({
    person_id: "person-kakao-sms",
    consents: [{ channel: "kakao_alimtalk", consent_type: "reminder", status: "agreed", count: 1 }],
    contact_channels: [{ channel: "sms", status: "unverified", count: 1 }],
  });

  assert.equal(summary.channelCards.find((card) => card.key === "kakao")?.status, "동의됨");
  assert.equal(summary.channelCards.find((card) => card.key === "sms")?.status, "인증 필요");
}

await testRpcCallAndArrayReturn();
await testNullDataReturnsEmptyArray();
await testErrorIsThrown();
await testInvalidClientThrows();
testPopulatedSummaryFormatting();
testMalformedSummaryFormattingDoesNotCrash();
testMissingChannelsFallback();
testWebPushOnlyFormatting();
testKakaoConsentAndSmsUnverifiedFormatting();

console.log("schedulerV2NotificationSummaryRepository tests passed");
