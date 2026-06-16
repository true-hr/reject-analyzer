import assert from "node:assert/strict";
import {
  buildSanitizedIdentitySummary,
  getGuardedKakaoUnlinkEligibility,
  isAccountRecoveryHelperEnabled,
  REQUIRED_CONFIRMATION_TEXT,
  REQUIRED_TRANSFER_CONFIRMATION_TEXT,
  sanitizeKakaoUnlinkError,
  unlinkKakaoIdentityForAccountRecovery,
} from "../accountRecoveryKakaoUnlink.js";

function identity(provider, extra = {}) {
  return {
    provider,
    id: ["11111111", "1111", "1111", "1111", "111111111111"].join("-"),
    provider_id: ["provider", "subject", "123"].join("-"),
    email: ["source", "example.com"].join("@"),
    ...extra,
  };
}

{
  assert.equal(isAccountRecoveryHelperEnabled("?account_recovery=1"), true);
  assert.equal(isAccountRecoveryHelperEnabled("?x=1"), false);
  assert.equal(
    REQUIRED_TRANSFER_CONFIRMATION_TEXT,
    "source 데이터 이전이 완료됐고, duplicate 4건 skip 정책이 적용되었음을 확인했습니다."
  );
  assert.equal(
    REQUIRED_CONFIRMATION_TEXT,
    "이 Kakao identity를 source에서 연결 해제한 뒤 target Google 계정에 다시 연결할 것을 이해했습니다."
  );
}

{
  const summary = buildSanitizedIdentitySummary([identity("google")]);
  const eligibility = getGuardedKakaoUnlinkEligibility(summary, {
    transferCompleted: true,
    confirmationChecked: true,
  });
  assert.equal(eligibility.canUnlink, false);
  assert.ok(eligibility.blockers.includes("kakao_identity_missing"));
  assert.ok(eligibility.blockers.includes("identity_count_too_low"));
}

{
  const summary = buildSanitizedIdentitySummary([identity("google"), identity("naver")]);
  const eligibility = getGuardedKakaoUnlinkEligibility(summary, {
    transferCompleted: true,
    confirmationChecked: true,
  });
  assert.equal(eligibility.canUnlink, false);
  assert.ok(eligibility.blockers.includes("kakao_identity_missing"));
}

{
  const summary = buildSanitizedIdentitySummary([identity("google"), identity("kakao")]);
  assert.equal(
    getGuardedKakaoUnlinkEligibility(summary, {
      transferCompleted: false,
      confirmationChecked: true,
    }).canUnlink,
    false
  );
  assert.equal(
    getGuardedKakaoUnlinkEligibility(summary, {
      transferCompleted: true,
      confirmationChecked: false,
    }).canUnlink,
    false
  );
  assert.equal(
    getGuardedKakaoUnlinkEligibility(summary, {
      transferCompleted: true,
      confirmationChecked: true,
      currentLoginProvider: "kakao",
    }).canUnlink,
    true
  );
}

{
  const summary = buildSanitizedIdentitySummary([identity("google"), identity("kakao"), identity("kakao")]);
  const eligibility = getGuardedKakaoUnlinkEligibility(summary, {
    transferCompleted: true,
    confirmationChecked: true,
  });
  assert.equal(eligibility.canUnlink, false);
  assert.ok(eligibility.blockers.includes("kakao_identity_count_invalid"));
}

{
  const calls = [];
  const authClient = {
    async getUserIdentities() {
      calls.push("reload");
      if (calls.filter((call) => call === "reload").length === 1) {
        return { data: { identities: [identity("google"), identity("kakao")] } };
      }
      return { data: { identities: [identity("google")] } };
    },
    async unlinkIdentity(target) {
      calls.push(["unlink", target.provider]);
      return { error: null };
    },
  };

  const result = await unlinkKakaoIdentityForAccountRecovery(authClient);
  assert.equal(result.ok, true);
  assert.deepEqual(calls, ["reload", ["unlink", "kakao"], "reload"]);
  assert.equal(result.before.identityCount, 2);
  assert.equal(result.after.identityCount, 1);
  assert.equal(result.after.hasKakao, false);
}

{
  const authClient = {
    admin: {
      deleteUser() {
        throw new Error("admin delete must not be called");
      },
    },
    async getUserIdentities() {
      return { data: { identities: [identity("google"), identity("kakao")] } };
    },
    async unlinkIdentity(target) {
      assert.equal(target.provider, "kakao");
      return { error: null };
    },
  };
  await unlinkKakaoIdentityForAccountRecovery(authClient);
}

{
  const error = new Error(
    [
      "failed access_token=",
      "se",
      "cret ",
      ["22222222", "2222", "2222", "2222", "222222222222"].join("-"),
      " ",
      ["source", "example.com"].join("@"),
      " +821012345678 provider_id=",
      ["raw", "subject"].join("-"),
    ].join("")
  );
  const diagnostic = sanitizeKakaoUnlinkError(error);
  const serialized = JSON.stringify(diagnostic);
  assert.doesNotMatch(serialized, /secret|22222222|source@example|821012345678|raw-subject/);
}

{
  const authClient = {
    async getUserIdentities() {
      return { data: { identities: [identity("google")] } };
    },
    async unlinkIdentity() {
      throw new Error("unlinkIdentity should not be called without kakao");
    },
  };
  const result = await unlinkKakaoIdentityForAccountRecovery(authClient);
  assert.equal(result.ok, false);
  assert.equal(result.status, "blocked");
  assert.doesNotMatch(JSON.stringify(result), /11111111|source@example|provider-subject/);
}

console.log("accountRecoveryKakaoUnlink tests passed");
