import assert from "node:assert/strict";
import {
  ACCOUNT_RECOVERY_KAKAO_UNLINK_CONFIRMATION_TEXT,
  ACCOUNT_RECOVERY_TRANSFER_CONFIRMATION_TEXT,
  buildAccountRecoveryHelperState,
  getAccountRecoveryRedirectTo,
  getIdentityCreatedAtBucket,
  GOOGLE_LINK_CONFIRMATION_TOKEN,
  mapCurrentUserIdentities,
  runGuardedAuxiliaryGoogleLink,
  runGuardedKakaoUnlink,
  sanitizeAccountRecoveryAuthError,
  unlinkKakaoIdentityForAccountRecovery,
} from "../auth.js";

const NOW = Date.parse("2026-06-15T00:00:00.000Z");
const RAW_AUTH_ID = ["11111111", "1111", "1111", "1111", "111111111111"].join("-");
const RAW_USER_ID = ["22222222", "2222", "2222", "2222", "222222222222"].join("-");
const RAW_ERROR_ID = ["33333333", "3333", "3333", "3333", "333333333333"].join("-");
const RAW_EMAIL = ["source", "example.com"].join("@");
const RAW_PHONE = ["+", "82", "10", "1234", "5678"].join("");
const RAW_PROVIDER_SUBJECT = ["raw", "provider", "subject"].join("-");

{
  const summary = mapCurrentUserIdentities(
    {
      identities: [
        {
          id: RAW_AUTH_ID,
          user_id: RAW_USER_ID,
          provider: "kakao",
          provider_id: RAW_PROVIDER_SUBJECT,
          email: RAW_EMAIL,
          identity_data: {
            sub: RAW_PROVIDER_SUBJECT,
            email: RAW_EMAIL,
            phone: RAW_PHONE,
          },
          created_at: "2026-06-10T00:00:00.000Z",
        },
      ],
    },
    NOW
  );

  assert.equal(summary.identityCount, 1);
  assert.deepEqual(summary.providers, ["kakao"]);
  assert.equal(summary.identities[0].provider, "kakao");
  assert.equal(summary.identities[0].createdAtBucket, "last_7_days");
  assert.equal(summary.canUseUserUnlinkFlow, false);

  const serialized = JSON.stringify(summary);
  assert.doesNotMatch(
    serialized,
    new RegExp([RAW_AUTH_ID.slice(0, 8), RAW_USER_ID.slice(0, 8), RAW_PROVIDER_SUBJECT, RAW_EMAIL, RAW_PHONE.slice(1)].join("|"))
  );
}

{
  assert.equal(getIdentityCreatedAtBucket("2026-06-15T00:00:00.000Z", NOW), "today");
  assert.equal(getIdentityCreatedAtBucket("2026-06-01T00:00:00.000Z", NOW), "last_30_days");
  assert.equal(getIdentityCreatedAtBucket("not-a-date", NOW), "unknown");
}

{
  assert.equal(
    ACCOUNT_RECOVERY_TRANSFER_CONFIRMATION_TEXT,
    "source 데이터 이전이 완료됐고, duplicate 4건 skip 정책이 적용되었음을 확인했습니다."
  );
  assert.equal(
    ACCOUNT_RECOVERY_KAKAO_UNLINK_CONFIRMATION_TEXT,
    "이 Kakao identity를 source에서 연결 해제한 뒤 target Google 계정에 다시 연결할 것을 이해했습니다."
  );
}

{
  const summary = {
    identityCount: 2,
    providers: ["google", "kakao"],
    providerCounts: { google: 1, kakao: 1 },
  };
  const stateBeforeConfirmation = buildAccountRecoveryHelperState(summary, {
    enableGoogleLinkAction: true,
    explicitConfirmation: "",
  });

  assert.equal(stateBeforeConfirmation.canUseUserUnlinkFlow, true);
  assert.equal(stateBeforeConfirmation.kakaoUnlinkDisabled, true);
  assert.equal(stateBeforeConfirmation.canAttemptGoogleLink, false);
  assert.equal(stateBeforeConfirmation.googleLinkGuardRequired, true);
  assert.equal(stateBeforeConfirmation.canAttemptKakaoUnlink, false);
  assert.ok(stateBeforeConfirmation.kakaoUnlinkBlockers.includes("transfer_confirmation_required"));
  assert.ok(stateBeforeConfirmation.kakaoUnlinkBlockers.includes("unlink_confirmation_required"));

  const stateAfterConfirmation = buildAccountRecoveryHelperState(summary, {
    enableGoogleLinkAction: true,
    explicitConfirmation: GOOGLE_LINK_CONFIRMATION_TOKEN,
    dataTransferConfirmed: true,
    kakaoUnlinkConfirmed: true,
    currentLoginProvider: "kakao",
  });

  assert.equal(stateAfterConfirmation.canAttemptGoogleLink, true);
  assert.equal(stateAfterConfirmation.googleLinkGuardRequired, false);
  assert.equal(stateAfterConfirmation.canAttemptKakaoUnlink, true);
  assert.equal(stateAfterConfirmation.kakaoUnlinkDisabled, false);
  assert.deepEqual(stateAfterConfirmation.kakaoUnlinkBlockers, []);
}

{
  const oneIdentityState = buildAccountRecoveryHelperState(
    { identityCount: 1, providers: ["kakao"], providerCounts: { kakao: 1 } },
    { dataTransferConfirmed: true, kakaoUnlinkConfirmed: true }
  );
  assert.equal(oneIdentityState.canAttemptKakaoUnlink, false);
  assert.ok(oneIdentityState.kakaoUnlinkBlockers.includes("identity_count_too_low"));

  const noGoogleState = buildAccountRecoveryHelperState(
    { identityCount: 2, providers: ["kakao", "naver"], providerCounts: { kakao: 1, naver: 1 } },
    { dataTransferConfirmed: true, kakaoUnlinkConfirmed: true }
  );
  assert.equal(noGoogleState.canAttemptKakaoUnlink, false);
  assert.ok(noGoogleState.kakaoUnlinkBlockers.includes("google_identity_missing"));

  const duplicateKakaoState = buildAccountRecoveryHelperState(
    { identityCount: 3, providers: ["google", "kakao"], providerCounts: { google: 1, kakao: 2 } },
    { dataTransferConfirmed: true, kakaoUnlinkConfirmed: true }
  );
  assert.equal(duplicateKakaoState.canAttemptKakaoUnlink, false);
  assert.ok(duplicateKakaoState.kakaoUnlinkBlockers.includes("kakao_identity_count_invalid"));
}

{
  let unlinkCalled = false;
  const guarded = await runGuardedKakaoUnlink({
    identitySummary: { identityCount: 2, providers: ["google", "kakao"], providerCounts: { google: 1, kakao: 1 } },
    dataTransferConfirmed: true,
    kakaoUnlinkConfirmed: false,
    unlinkKakaoIdentity: async () => {
      unlinkCalled = true;
    },
  });

  assert.equal(guarded.started, false);
  assert.equal(unlinkCalled, false);
  assert.equal(guarded.state.canAttemptKakaoUnlink, false);
}

{
  let unlinkTargetProvider = null;
  const authClient = {
    auth: {
      async getUserIdentities() {
        return {
          data: {
            identities: [
              { provider: "google", id: RAW_AUTH_ID, provider_id: RAW_PROVIDER_SUBJECT, email: RAW_EMAIL },
              { provider: "kakao", id: RAW_USER_ID, provider_id: RAW_PROVIDER_SUBJECT, email: RAW_EMAIL },
            ],
          },
        };
      },
      async unlinkIdentity(identity) {
        unlinkTargetProvider = identity.provider;
        return { error: null };
      },
    },
  };
  const result = await unlinkKakaoIdentityForAccountRecovery(authClient);
  assert.equal(unlinkTargetProvider, "kakao");
  assert.equal(result.provider, "kakao");
  assert.equal(result.summary.identityCount, 2);
}

{
  const redirectTo = getAccountRecoveryRedirectTo("https://app.example.test/reject-analyzer/?foo=bar");
  assert.match(redirectTo, /account_recovery=1/);
  assert.match(redirectTo, /foo=bar/);
}

{
  let linkCalledWith = null;
  let reloadCount = 0;
  const result = await runGuardedAuxiliaryGoogleLink({
    identitySummary: { identityCount: 1, providers: ["kakao"] },
    confirmed: true,
    redirectTo: getAccountRecoveryRedirectTo("https://app.example.test/reject-analyzer/"),
    linkGoogle: async (options) => {
      linkCalledWith = options;
      return { provider: "google", started: true };
    },
    reloadIdentities: async () => {
      reloadCount += 1;
      return { identityCount: 2, providers: ["google", "kakao"] };
    },
  });

  assert.equal(result.started, true);
  assert.equal(result.reloaded, true);
  assert.equal(reloadCount, 1);
  assert.match(linkCalledWith.redirectTo, /account_recovery=1/);
  assert.deepEqual(result.summary.providers, ["google", "kakao"]);
}

{
  let linkCalled = false;
  let reloadCalled = false;
  const result = await runGuardedAuxiliaryGoogleLink({
    identitySummary: { identityCount: 1, providers: ["kakao"] },
    confirmed: false,
    linkGoogle: async () => {
      linkCalled = true;
    },
    reloadIdentities: async () => {
      reloadCalled = true;
    },
  });

  assert.equal(result.started, false);
  assert.equal(result.reloaded, false);
  assert.equal(linkCalled, false);
  assert.equal(reloadCalled, false);
  assert.equal(result.state.kakaoUnlinkDisabled, true);
}

{
  const diagnostic = sanitizeAccountRecoveryAuthError(
    new Error(
      `link failed code=abc state=def provider_id=${RAW_PROVIDER_SUBJECT} user=${RAW_ERROR_ID} contact ${RAW_EMAIL} ${RAW_PHONE}`
    )
  );

  assert.doesNotMatch(
    JSON.stringify(diagnostic),
    new RegExp(["abc", "def", RAW_PROVIDER_SUBJECT, RAW_ERROR_ID.slice(0, 8), RAW_EMAIL, RAW_PHONE.slice(1)].join("|"))
  );
  assert.equal(diagnostic.category, "provider_config");
  assert.equal(Object.keys(diagnostic).sort().join(","), "category,message,name,status");
}

console.log("accountRecoveryAuth tests passed");
