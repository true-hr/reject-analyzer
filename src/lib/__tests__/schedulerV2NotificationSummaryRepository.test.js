import assert from "node:assert/strict";

import {
  ensureCurrentPersonAuthIdentity,
  fetchSchedulerV2NotificationSummary,
  fetchSchedulerV2NotificationSummaryWithBootstrap,
  syncCurrentPersonAuthIdentities,
  SCHEDULER_V2_AUTH_IDENTITY_SYNC_RPC,
  SCHEDULER_V2_NOTIFICATION_SUMMARY_RPC,
  SCHEDULER_V2_PERSON_BOOTSTRAP_RPC,
} from "../schedulerV2NotificationSummaryRepository.js";
import {
  buildAccountLinkingCards,
  buildNotificationChannelCards,
  buildReminderRuleCards,
  formatSchedulerV2SummaryRow,
  hasActiveKakaoIdentity,
  hasKakaoLinkingDbReadiness,
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

function createSupabaseSequenceMock(resultsByFunctionName) {
  const calls = [];
  const queues = Object.fromEntries(
    Object.entries(resultsByFunctionName).map(([functionName, results]) => [
      functionName,
      [...results],
    ])
  );
  return {
    calls,
    client: {
      from(tableName) {
        calls.push({ method: "from", tableName });
        throw new Error("raw base table query is not allowed");
      },
      async rpc(functionName) {
        calls.push({ method: "rpc", functionName });
        const queue = queues[functionName] || [];
        if (queue.length === 0) {
          throw new Error(`Unexpected RPC call: ${functionName}`);
        }
        return queue.shift();
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

async function testIdentitySyncRpcCallAndReturn() {
  const syncResult = {
    providers: [
      { provider: "kakao", status: "active" },
    ],
  };
  const { client, calls } = createSupabaseMock({ data: syncResult, error: null });

  const result = await syncCurrentPersonAuthIdentities(client);

  assert.equal(result, syncResult);
  assert.deepEqual(calls, [
    { method: "rpc", functionName: SCHEDULER_V2_AUTH_IDENTITY_SYNC_RPC },
  ]);
}

async function testIdentitySyncDoesNotUseRawBaseTableQuery() {
  const { client, calls } = createSupabaseMock({ data: null, error: null });

  const result = await syncCurrentPersonAuthIdentities(client);

  assert.deepEqual(result, { providers: [] });
  assert.deepEqual(calls, [
    { method: "rpc", functionName: SCHEDULER_V2_AUTH_IDENTITY_SYNC_RPC },
  ]);
}

async function testBootstrapRpcCallAndReturn() {
  const bootstrapResult = {
    bootstrap_status: "created_person",
    providers: [{ provider: "google", status: "active" }],
  };
  const { client, calls } = createSupabaseMock({ data: bootstrapResult, error: null });

  const result = await ensureCurrentPersonAuthIdentity(client);

  assert.equal(result, bootstrapResult);
  assert.deepEqual(calls, [
    { method: "rpc", functionName: SCHEDULER_V2_PERSON_BOOTSTRAP_RPC },
  ]);
}

async function testBootstrapDoesNotUseRawBaseTableQuery() {
  const { client, calls } = createSupabaseMock({ data: null, error: null });

  const result = await ensureCurrentPersonAuthIdentity(client);

  assert.deepEqual(result, { bootstrap_status: "unknown", providers: [] });
  assert.deepEqual(calls, [
    { method: "rpc", functionName: SCHEDULER_V2_PERSON_BOOTSTRAP_RPC },
  ]);
}

async function testSummaryEmptyBootstrapsAndRefetches() {
  const rows = [
    {
      person_status: "active",
      providers: [{ provider: "google", status: "active" }],
      kakao: {
        identity: "missing",
        contact: "missing",
        consent: "missing",
        send_eligibility: "not_ready",
      },
    },
  ];
  const { client, calls } = createSupabaseSequenceMock({
    [SCHEDULER_V2_NOTIFICATION_SUMMARY_RPC]: [
      { data: [], error: null },
      { data: rows, error: null },
    ],
    [SCHEDULER_V2_PERSON_BOOTSTRAP_RPC]: [
      { data: { bootstrap_status: "created_person", providers: [{ provider: "google", status: "active" }] }, error: null },
    ],
  });

  const result = await fetchSchedulerV2NotificationSummaryWithBootstrap(client);

  assert.equal(result, rows);
  assert.deepEqual(calls, [
    { method: "rpc", functionName: SCHEDULER_V2_NOTIFICATION_SUMMARY_RPC },
    { method: "rpc", functionName: SCHEDULER_V2_PERSON_BOOTSTRAP_RPC },
    { method: "rpc", functionName: SCHEDULER_V2_NOTIFICATION_SUMMARY_RPC },
  ]);
  assert.equal(hasKakaoLinkingDbReadiness(rows[0]), true);
}

async function testSummaryWithRowsSkipsBootstrap() {
  const rows = [{ person_status: "active", providers: [], kakao: { identity: "missing" } }];
  const { client, calls } = createSupabaseSequenceMock({
    [SCHEDULER_V2_NOTIFICATION_SUMMARY_RPC]: [
      { data: rows, error: null },
    ],
    [SCHEDULER_V2_PERSON_BOOTSTRAP_RPC]: [],
  });

  const result = await fetchSchedulerV2NotificationSummaryWithBootstrap(client);

  assert.equal(result, rows);
  assert.deepEqual(calls, [
    { method: "rpc", functionName: SCHEDULER_V2_NOTIFICATION_SUMMARY_RPC },
  ]);
}

async function testBootstrapErrorDoesNotLoop() {
  const expectedError = new Error("AUTH_REQUIRED");
  const { client, calls } = createSupabaseSequenceMock({
    [SCHEDULER_V2_NOTIFICATION_SUMMARY_RPC]: [
      { data: [], error: null },
    ],
    [SCHEDULER_V2_PERSON_BOOTSTRAP_RPC]: [
      { data: null, error: expectedError },
    ],
  });

  await assert.rejects(
    () => fetchSchedulerV2NotificationSummaryWithBootstrap(client),
    expectedError
  );
  assert.deepEqual(calls, [
    { method: "rpc", functionName: SCHEDULER_V2_NOTIFICATION_SUMMARY_RPC },
    { method: "rpc", functionName: SCHEDULER_V2_PERSON_BOOTSTRAP_RPC },
  ]);
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
    providers: [
      { provider: "kakao", status: "active" },
    ],
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
      ["카카오 알림톡", "계정 연결과 별도로 수신 동의, 연락처, 서비스 발송 준비를 확인합니다.", "수신 연락처 인증 필요 / 발송 채널 준비 중", true],
      ["폰/디바이스 알림", "현재 브라우저와 기기에서 받는 보조 알림", "이 기기 등록됨", true],
      ["SMS fallback", "카카오 실패 또는 긴급 확인용 보조 fallback", "휴대폰 인증 필요", true],
    ]
  );

  assert.deepEqual(cards.map((card) => card.id), [
    "kakao_alimtalk",
    "device_notification",
    "sms_fallback",
  ]);

  const rendered = cards
    .map((card) => `${card.label} ${card.role} ${card.actionLabel}`)
    .join(" ");
  assert.match(rendered, /카카오 알림톡/);
  assert.match(rendered, /수신 동의/);
  assert.match(rendered, /폰\/디바이스 알림/);
  assert.match(rendered, /보조 알림/);
  assert.match(rendered, /SMS fallback/);
  assert.doesNotMatch(rendered, /web_push|sms|kakao_alimtalk/);
  assert.doesNotMatch(cards[2].role, /주 채널/);
}

function testMissingChannelFallbacks() {
  const cards = buildNotificationChannelCards(null);

  assert.deepEqual(
    cards.map((card) => [card.label, card.status]),
    [
      ["카카오 알림톡", "상태 확인 필요"],
      ["폰/디바이스 알림", "미등록"],
      ["SMS fallback", "휴대폰 인증 필요"],
    ]
  );
}

function testPhoneContactMapsToSmsFallbackState() {
  const cards = buildNotificationChannelCards({
    contact_channels: [
      { channel: "phone", status: "active", count: 1 },
    ],
    consents: [
      { channel: "sms", consent_type: "reminder", status: "granted", count: 1 },
    ],
  });
  const smsFallbackCard = cards[2];

  assert.equal(smsFallbackCard.label, "SMS fallback");
  assert.equal(smsFallbackCard.status, "저장됨");
  assert.equal(smsFallbackCard.role, "카카오 실패 또는 긴급 확인용 보조 fallback");
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
      ["Google", "연결됨", "Google 계정 연결됨", true],
      ["Kakao", "연결됨", "카카오 계정 연결됨", true],
      ["Naver", "준비중", "네이버 계정 연결 준비중", true],
    ]
  );
}

function testKakaoIdentityConnectedUsesNormalizedShapeFirst() {
  assert.equal(
    hasActiveKakaoIdentity({
      kakao: { identity: "active" },
      providers: [],
    }),
    true
  );
  assert.equal(
    hasActiveKakaoIdentity({
      kakao: { identity: "unknown" },
      providers: [{ provider: "kakao", status: "active" }],
    }),
    true
  );
  assert.equal(
    hasActiveKakaoIdentity({
      kakao: { identity: "missing" },
      providers: [],
    }),
    false
  );
}

function testKakaoLinkingDbReadinessRequiresNormalizedKakaoShape() {
  assert.equal(
    hasKakaoLinkingDbReadiness({
      kakao: { identity: "missing", contact: "missing", consent: "missing" },
    }),
    true
  );
  assert.equal(
    hasKakaoLinkingDbReadiness({
      providers: [{ provider: "kakao", status: "active" }],
    }),
    false
  );
  assert.equal(hasKakaoLinkingDbReadiness(null), false);
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
  assert.match(card.channelSummary, /SMS는 fallback/);
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
  assert.equal(summary.webPush, "기기 알림 없음");
}

await testRpcCallAndArrayReturn();
await testNullDataReturnsEmptyArray();
await testErrorIsThrown();
await testInvalidClientThrows();
await testIdentitySyncRpcCallAndReturn();
await testIdentitySyncDoesNotUseRawBaseTableQuery();
await testBootstrapRpcCallAndReturn();
await testBootstrapDoesNotUseRawBaseTableQuery();
await testSummaryEmptyBootstrapsAndRefetches();
await testSummaryWithRowsSkipsBootstrap();
await testBootstrapErrorDoesNotLoop();
testPopulatedSummaryFormatting();
testNotificationChannelCards();
testMissingChannelFallbacks();
testPhoneContactMapsToSmsFallbackState();
testAccountLinkingCards();
testKakaoIdentityConnectedUsesNormalizedShapeFirst();
testKakaoLinkingDbReadinessRequiresNormalizedKakaoShape();
testReminderRuleCardsHideRawEnums();
testMalformedSummaryFormattingDoesNotCrash();

console.log("schedulerV2NotificationSummaryRepository tests passed");
