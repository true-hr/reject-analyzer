import assert from "node:assert/strict";

import {
  fetchSchedulerV2NotificationSummary,
  SCHEDULER_V2_NOTIFICATION_SUMMARY_RPC,
} from "../schedulerV2NotificationSummaryRepository.js";
import {
  buildAccountLinkingCards,
  buildNotificationChannelCards,
  buildReminderRuleCards,
  formatSchedulerV2SummaryRow,
} from "../../components/reminder/schedulerV2NotificationSummaryFormat.js";

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
}

function testNotificationChannelCards() {
  const row = {
    contact_channels: [
      { channel: "kakao_alimtalk", status: "active", count: 1 },
      { channel: "sms", status: "unverified", count: 1 },
      { channel: "email", status: "active", count: 1 },
    ],
    consents: [
      { channel: "kakao_alimtalk", consent_type: "reminder", status: "granted", count: 1 },
    ],
    web_push: [
      { ownership_status: "active", count: 1 },
    ],
  };

  const cards = buildNotificationChannelCards(row);

  assert.deepEqual(
    cards.map((card) => [card.label, card.role, card.status, card.actionDisabled]),
    [
      ["카카오 알림톡", "운영 알림 주 채널", "연결됨", true],
      ["SMS / 문자", "카카오 실패 시 보조 채널", "인증 필요", true],
      ["이메일", "보조 알림 채널", "연결됨", true],
      ["Web Push", "현재 브라우저/기기 보조 알림", "활성", true],
    ]
  );
}

function testMissingChannelFallbacks() {
  const cards = buildNotificationChannelCards(null);

  assert.deepEqual(
    cards.map((card) => [card.label, card.status]),
    [
      ["카카오 알림톡", "준비중"],
      ["SMS / 문자", "미연결"],
      ["이메일", "미연결"],
      ["Web Push", "미연결"],
    ]
  );
}

function testAccountLinkingCards() {
  const cards = buildAccountLinkingCards({
    providers: [
      { provider: "google", status: "active" },
      { provider: "kakao", status: "active" },
      { provider: "custom:naver", status: "active" },
    ],
  });

  assert.deepEqual(
    cards.map((card) => [card.label, card.status, card.actionLabel, card.actionDisabled]),
    [
      ["Google", "연결됨", "Google 계정 연결 상태 확인", true],
      ["Kakao", "연결됨", "카카오 계정 연결 준비중", true],
      ["Naver", "연결됨", "네이버 계정 연결 준비중", true],
    ]
  );
}

function testReminderRuleCardsHideRawEnums() {
  const [card] = buildReminderRuleCards({
    reminder_rules: [
      {
        reminder_kind: "experience_recall",
        cadence: "weekdays",
        time_local: "18:00:00",
        is_enabled: true,
        channels: [
          { channel: "kakao_alimtalk", priority: 1, is_enabled: true },
          { channel: "sms", priority: 2, is_enabled: true },
        ],
      },
    ],
  });
  const rendered = `${card.title} ${card.schedule} ${card.channelSummary}`;

  assert.equal(card.title, "업무기록 리마인드");
  assert.equal(card.schedule, "평일 18:00");
  assert.equal(card.status, "ON");
  assert.match(card.channelSummary, /카카오 알림톡\/문자/);
  assert.doesNotMatch(rendered, /kakao_alimtalk|experience_recall|weekdays/);
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
}

await testRpcCallAndArrayReturn();
await testNullDataReturnsEmptyArray();
await testErrorIsThrown();
await testInvalidClientThrows();
testPopulatedSummaryFormatting();
testNotificationChannelCards();
testMissingChannelFallbacks();
testAccountLinkingCards();
testReminderRuleCardsHideRawEnums();
testMalformedSummaryFormattingDoesNotCrash();

console.log("schedulerV2NotificationSummaryRepository tests passed");
