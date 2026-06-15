import assert from "node:assert/strict";
import {
  buildAccountRecoveryHelperState,
  getIdentityCreatedAtBucket,
  mapCurrentUserIdentities,
  sanitizeAccountRecoveryAuthError,
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
  const state = buildAccountRecoveryHelperState({
    identityCount: 2,
    providers: ["google", "kakao"],
  });

  assert.equal(state.canUseUserUnlinkFlow, true);
  assert.equal(state.kakaoUnlinkDisabled, true);
  assert.equal(state.canAttemptGoogleLink, false);
  assert.equal(state.googleLinkGuardRequired, true);
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
}

console.log("accountRecoveryAuth tests passed");
