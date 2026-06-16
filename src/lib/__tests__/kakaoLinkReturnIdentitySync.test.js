import assert from "node:assert/strict";

import {
  hasActiveSchedulerKakaoIdentity,
  hasKakaoAuthIdentity,
  sanitizeKakaoLinkReturnSyncError,
  shouldSyncKakaoLinkReturnIdentity,
  syncKakaoLinkReturnIdentityIfNeeded,
} from "../kakaoLinkReturnIdentitySync.js";

function googleOnlySummary() {
  return [{
    providers: [{ provider: "google", status: "active" }],
    kakao: {
      identity: "missing",
      contact: "missing",
      consent: "missing",
      send_eligibility: "not_ready",
    },
  }];
}

function googleKakaoSummary() {
  return [{
    providers: [
      { provider: "google", status: "active" },
      { provider: "kakao", status: "active" },
    ],
    kakao: {
      identity: "active",
      contact: "missing",
      consent: "missing",
      send_eligibility: "not_ready",
    },
  }];
}

function authSummary(providers) {
  return {
    providers,
    hasKakao: providers.includes("kakao"),
    hasGoogle: providers.includes("google"),
    providerCounts: providers.reduce((acc, provider) => {
      acc[provider] = (acc[provider] || 0) + 1;
      return acc;
    }, {}),
  };
}

function createSyncHarness(options = {}) {
  const calls = [];
  const nextRows = options.nextRows || googleKakaoSummary();
  return {
    calls,
    options: {
      hasReturnSignal: options.hasReturnSignal ?? true,
      summaryRows: options.summaryRows || googleOnlySummary(),
      async getSession() {
        calls.push("getSession");
      },
      async loadAuthIdentitySummary() {
        calls.push("loadAuthIdentitySummary");
        return options.authIdentitySummary || authSummary(["google", "kakao"]);
      },
      async syncCurrentPersonAuthIdentities() {
        calls.push("syncCurrentPersonAuthIdentities");
        if (options.syncError) throw options.syncError;
        return { providers: [{ provider: "kakao", status: "active" }] };
      },
      async fetchSchedulerV2NotificationSummary() {
        calls.push("fetchSchedulerV2NotificationSummary");
        return nextRows;
      },
    },
  };
}

async function testPendingReturnSyncsMissingSchedulerKakao() {
  const { calls, options } = createSyncHarness();
  const result = await syncKakaoLinkReturnIdentityIfNeeded(options);

  assert.equal(result.status, "synced");
  assert.deepEqual(calls, [
    "getSession",
    "loadAuthIdentitySummary",
    "syncCurrentPersonAuthIdentities",
    "fetchSchedulerV2NotificationSummary",
  ]);
  assert.equal(result.rows[0].kakao.identity, "active");
  assert.equal(result.rows[0].kakao.consent, "missing");
  assert.equal(result.rows[0].kakao.contact, "missing");
  assert.equal(result.rows[0].kakao.send_eligibility, "not_ready");
}

async function testNoPendingSignalDoesNotSync() {
  const { calls, options } = createSyncHarness({ hasReturnSignal: false });
  const result = await syncKakaoLinkReturnIdentityIfNeeded(options);

  assert.equal(result.status, "skipped");
  assert.equal(result.reason, "return_signal_missing");
  assert.deepEqual(calls, []);
}

async function testAccountRecoveryWithoutReturnSignalDoesNotBroadSync() {
  const result = shouldSyncKakaoLinkReturnIdentity({
    hasReturnSignal: false,
    authIdentitySummary: authSummary(["google", "kakao"]),
    summaryRows: [],
  });

  assert.equal(result.shouldSync, false);
  assert.equal(result.reason, "return_signal_missing");
}

async function testAlreadyActiveSchedulerKakaoDoesNotSyncAgain() {
  const { calls, options } = createSyncHarness({ summaryRows: googleKakaoSummary() });
  const result = await syncKakaoLinkReturnIdentityIfNeeded(options);

  assert.equal(result.status, "skipped");
  assert.equal(result.reason, "scheduler_kakao_already_active");
  assert.deepEqual(calls, [
    "getSession",
    "loadAuthIdentitySummary",
  ]);
}

async function testAuthKakaoMissingDoesNotSync() {
  const { calls, options } = createSyncHarness({
    authIdentitySummary: authSummary(["google"]),
  });
  const result = await syncKakaoLinkReturnIdentityIfNeeded(options);

  assert.equal(result.status, "skipped");
  assert.equal(result.reason, "auth_kakao_missing");
  assert.deepEqual(calls, [
    "getSession",
    "loadAuthIdentitySummary",
  ]);
}

async function testSyncFailureSanitizesSensitiveDiagnostics() {
  const fakeUuid = ["123e4567", "e89b", "12d3", "a456", "426614174000"].join("-");
  const fakeEmail = ["user", "example.com"].join("@");
  const fakeTokenParam = ["tok", "en"].join("") + "=sensitive_value";
  const rawError = new Error(
    `failed for person ${fakeUuid} and email ${fakeEmail} ${fakeTokenParam}`
  );
  rawError.status = 500;
  const { options } = createSyncHarness({ syncError: rawError });

  await assert.rejects(
    () => syncKakaoLinkReturnIdentityIfNeeded(options),
    /failed/
  );

  const sanitized = sanitizeKakaoLinkReturnSyncError(rawError);
  const serialized = JSON.stringify(sanitized);
  assert.ok(!serialized.includes(fakeUuid));
  assert.ok(!serialized.includes(fakeEmail));
  assert.ok(!serialized.includes("sensitive_value"));
  assert.ok(serialized.includes("[redacted]"));
}

function testProviderShapeDetection() {
  assert.equal(hasKakaoAuthIdentity(authSummary(["google", "kakao"])), true);
  assert.equal(hasKakaoAuthIdentity({ providers: [{ provider: "kakao", count: 1 }] }), true);
  assert.equal(hasKakaoAuthIdentity(authSummary(["google"])), false);
  assert.equal(hasActiveSchedulerKakaoIdentity(googleKakaoSummary()), true);
  assert.equal(hasActiveSchedulerKakaoIdentity(googleOnlySummary()), false);
}

await testPendingReturnSyncsMissingSchedulerKakao();
await testNoPendingSignalDoesNotSync();
await testAccountRecoveryWithoutReturnSignalDoesNotBroadSync();
await testAlreadyActiveSchedulerKakaoDoesNotSyncAgain();
await testAuthKakaoMissingDoesNotSync();
await testSyncFailureSanitizesSensitiveDiagnostics();
testProviderShapeDetection();

console.log("kakaoLinkReturnIdentitySync tests passed");
