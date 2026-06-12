import assert from "node:assert/strict";

import { deriveKakaoAlimtalkState } from "../kakaoAlimtalkStateFormat.js";

function renderState(model) {
  return [
    model.state,
    model.label,
    model.description,
    model.actionLabel,
    model.tone,
  ].join(" ");
}

function testNullRowReturnsUnknown() {
  const model = deriveKakaoAlimtalkState(null);

  assert.equal(model.state, "unknown");
  assert.equal(model.label, "상태 확인 필요");
  assert.equal(model.actionDisabled, true);
}

function testNoKakaoProviderNoConsentReturnsNotConnected() {
  const model = deriveKakaoAlimtalkState({
    providers: [{ provider: "google", status: "active" }],
    contact_channels: [],
    consents: [],
  });

  assert.equal(model.state, "not_connected");
  assert.equal(model.label, "카카오 계정 연결 필요");
  assert.equal(model.actionLabel, "카카오 계정 연결 준비중");
}

function testKakaoProviderOnlyReturnsAccountReady() {
  const model = deriveKakaoAlimtalkState({
    providers: [{ provider: "kakao", status: "active" }],
    contact_channels: [],
    consents: [],
  });

  assert.equal(model.state, "account_ready");
  assert.equal(model.label, "카카오 계정 연결됨 · 알림톡 동의 필요");
  assert.equal(model.actionLabel, "알림톡 동의 설정 준비중");
}

function testKakaoProviderAndConsentReturnsConsentReady() {
  const model = deriveKakaoAlimtalkState({
    providers: [{ provider: "kakao", status: "active" }],
    contact_channels: [],
    consents: [{ channel: "kakao_alimtalk", consent_type: "reminder", status: "granted" }],
  });

  assert.equal(model.state, "consent_ready");
  assert.equal(model.label, "알림톡 수신 동의 준비됨");
  assert.equal(model.actionLabel, "발송 설정 준비중");
}

function testKakaoProviderContactAndConsentReturnsSendReady() {
  const model = deriveKakaoAlimtalkState({
    providers: [{ provider: "kakao", status: "active" }],
    contact_channels: [{ channel: "kakao_alimtalk", status: "active", count: 1 }],
    consents: [{ channel: "kakao_alimtalk", consent_type: "reminder", status: "granted" }],
  });

  assert.equal(model.state, "send_ready");
  assert.equal(model.label, "카카오 알림톡 발송 준비됨");
  assert.equal(model.actionLabel, "발송 설정 준비중");
}

function testRevokedConsentReturnsBlocked() {
  const model = deriveKakaoAlimtalkState({
    providers: [{ provider: "kakao", status: "active" }],
    contact_channels: [],
    consents: [{ channel: "kakao_alimtalk", consent_type: "reminder", status: "revoked" }],
  });

  assert.equal(model.state, "blocked");
  assert.equal(model.label, "카카오 알림톡 사용 불가");
  assert.equal(model.actionLabel, "상태 확인 필요");
}

function testMalformedArraysDoNotCrash() {
  const model = deriveKakaoAlimtalkState({
    providers: "not-array",
    contact_channels: null,
    consents: {},
  });

  assert.equal(model.state, "not_connected");
  assert.equal(model.actionDisabled, true);
}

function testRawIdentifiersAndEnumsAreNotExposed() {
  const model = deriveKakaoAlimtalkState({
    providers: [
      {
        provider: "kakao",
        status: "active",
        provider_user_id: "provider-user-1",
        auth_user_id: "auth-user-1",
      },
    ],
    contact_channels: [{ channel: "kakao_alimtalk", status: "active", count: 1 }],
    consents: [{ channel: "kakao_alimtalk", consent_type: "reminder", status: "granted" }],
  });
  const rendered = renderState(model);

  assert.doesNotMatch(rendered, /kakao_alimtalk|provider_user_id|auth_user_id|provider-user-1|auth-user-1/);
  assert.equal(model.actionDisabled, true);
}

testNullRowReturnsUnknown();
testNoKakaoProviderNoConsentReturnsNotConnected();
testKakaoProviderOnlyReturnsAccountReady();
testKakaoProviderAndConsentReturnsConsentReady();
testKakaoProviderContactAndConsentReturnsSendReady();
testRevokedConsentReturnsBlocked();
testMalformedArraysDoNotCrash();
testRawIdentifiersAndEnumsAreNotExposed();

console.log("kakaoAlimtalkStateFormat tests passed");
