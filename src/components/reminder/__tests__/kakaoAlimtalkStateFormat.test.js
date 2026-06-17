import assert from "node:assert/strict";

import { deriveKakaoAlimtalkState } from "../kakaoAlimtalkStateFormat.js";

function renderState(model) {
  return [
    model.state,
    model.label,
    model.description,
    model.actionLabel,
    model.tone,
    model.accountStatus,
    model.consentStatus,
    model.contactStatus,
    model.capabilityStatus,
    model.readinessStatus,
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
  assert.equal(model.label, "카카오 계정 미연결");
  assert.equal(model.actionLabel, "카카오 계정 연결");
  assert.equal(model.readinessStatus, "아직 발송 준비 안 됨");
}

function testKakaoProviderOnlyReturnsAccountReady() {
  const model = deriveKakaoAlimtalkState({
    providers: [{ provider: "kakao", status: "active" }],
    contact_channels: [],
    consents: [],
  });

  assert.equal(model.state, "not_ready");
  assert.equal(model.label, "수신 연락처 인증 필요 / 수신 동의 필요 / 발송 채널 준비 중");
  assert.equal(model.accountStatus, "연결됨");
  assert.equal(model.consentStatus, "동의 필요");
  assert.equal(model.contactStatus, "연락처 인증 필요");
  assert.equal(model.readinessStatus, "아직 발송 준비 안 됨");
}

function testKakaoProviderAndConsentReturnsConsentReady() {
  const model = deriveKakaoAlimtalkState({
    providers: [{ provider: "kakao", status: "active" }],
    contact_channels: [],
    consents: [{ channel: "kakao_alimtalk", consent_type: "reminder", status: "granted" }],
  });

  assert.equal(model.state, "not_ready");
  assert.equal(model.label, "수신 연락처 인증 필요 / 발송 채널 준비 중");
  assert.equal(model.consentStatus, "동의됨");
  assert.equal(model.contactStatus, "연락처 인증 필요");
  assert.equal(model.capabilityStatus, "알림톡 발송 기능 준비 중");
}

function testLegacyKakaoProviderContactAndConsentStaysConsentReady() {
  const model = deriveKakaoAlimtalkState({
    providers: [{ provider: "kakao", status: "active" }],
    contact_channels: [{ channel: "kakao_alimtalk", status: "active", count: 1 }],
    consents: [{ channel: "kakao_alimtalk", consent_type: "reminder", status: "granted" }],
  });

  assert.equal(model.state, "not_ready");
  assert.equal(model.label, "수신 연락처 인증 필요 / 발송 채널 준비 중");
  assert.equal(model.consentStatus, "동의됨");
  assert.equal(model.contactStatus, "연락처 인증 필요");
  assert.equal(model.capabilityStatus, "알림톡 발송 기능 준비 중");
}

function testRevokedConsentReturnsBlocked() {
  const model = deriveKakaoAlimtalkState({
    providers: [{ provider: "kakao", status: "active" }],
    contact_channels: [],
    consents: [{ channel: "kakao_alimtalk", consent_type: "reminder", status: "revoked" }],
  });

  assert.equal(model.state, "blocked");
  assert.equal(model.label, "차단됨");
  assert.equal(model.consentStatus, "철회됨");
  assert.equal(model.readinessStatus, "차단됨");
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

function testNormalizedNotConnected() {
  const model = deriveKakaoAlimtalkState({
    kakao: {
      identity: "missing",
      contact: "missing",
      consent: "missing",
      send_eligibility: "not_ready",
    },
  });

  assert.equal(model.state, "not_connected");
  assert.equal(model.actionDisabled, true);
  assert.equal(model.accountStatus, "미연결");
}

function testNormalizedAccountNeedsConsentContactAndCapability() {
  const model = deriveKakaoAlimtalkState({
    kakao: {
      identity: "active",
      contact: "missing",
      contact_basis: "missing",
      contact_verified: false,
      consent: "missing",
      capability: "missing",
      send_eligibility: "not_ready",
    },
  });

  assert.equal(model.state, "not_ready");
  assert.equal(model.label, "수신 연락처 인증 필요 / 수신 동의 필요 / 발송 채널 준비 중");
  assert.equal(
    model.description,
    "카카오 계정은 연결됐지만, 알림톡 수신 연락처 인증과 수신 동의가 필요합니다. 현재는 발송 준비 전입니다."
  );
  assert.equal(model.capabilityStatus, "알림톡 발송 기능 준비 중");
  assert.equal(model.actionDisabled, true);
}

function testNormalizedIdentityActiveButConsentAndCapabilityMissingIsNotReady() {
  const model = deriveKakaoAlimtalkState({
    kakao: {
      identity: "active",
      contact: "active",
      contact_basis: "verified_phone",
      contact_verified: true,
      consent: "missing",
      capability: "missing",
      send_eligibility: "not_ready",
    },
  });

  assert.equal(model.state, "not_ready");
  assert.equal(model.label, "수신 동의 필요 / 발송 채널 준비 중");
  assert.equal(model.contactStatus, "등록됨");
  assert.equal(model.consentStatus, "동의 필요");
  assert.equal(model.capabilityStatus, "알림톡 발송 기능 준비 중");
  assert.equal(model.actionDisabled, true);
}

function testNormalizedConsentContactReadyButCapabilityMissingIsNotReady() {
  const model = deriveKakaoAlimtalkState({
    kakao: {
      identity: "active",
      contact: "active",
      contact_basis: "verified_phone",
      contact_verified: true,
      consent: "granted",
      capability: "missing",
      send_eligibility: "not_ready",
    },
  });

  assert.equal(model.state, "not_ready");
  assert.equal(model.label, "발송 채널 준비 중");
  assert.equal(model.description, "알림톡 발송 기능은 아직 준비 중입니다.");
  assert.equal(model.readinessStatus, "아직 발송 준비 안 됨");
  assert.equal(model.actionDisabled, true);
}

function testNormalizedSendReady() {
  const model = deriveKakaoAlimtalkState({
    kakao: {
      identity: "active",
      contact: "active",
      contact_basis: "verified_phone",
      contact_verified: true,
      consent: "granted",
      capability: "ready",
      send_eligibility: "ready",
    },
  });

  assert.equal(model.state, "send_ready");
  assert.equal(model.label, "카카오 알림톡 발송 준비 완료");
  assert.equal(model.readinessStatus, "발송 준비 완료");
  assert.equal(model.actionDisabled, true);
}

function testNormalizedReadySendEligibilityWithoutCapabilityDoesNotShowReady() {
  const model = deriveKakaoAlimtalkState({
    kakao: {
      identity: "active",
      contact: "active",
      contact_basis: "verified_phone",
      contact_verified: true,
      consent: "granted",
      send_eligibility: "ready",
    },
  });

  assert.equal(model.state, "not_ready");
  assert.equal(model.readinessStatus, "아직 발송 준비 안 됨");
  assert.doesNotMatch(renderState(model), /발송 준비 완료/);
}

function testNormalizedContactBasisMissingIsNotReadyEvenWithActiveContact() {
  const model = deriveKakaoAlimtalkState({
    kakao: {
      identity: "active",
      contact: "active",
      contact_basis: "missing",
      contact_verified: true,
      consent: "granted",
      capability: "ready",
      send_eligibility: "ready",
    },
  });

  assert.equal(model.state, "not_ready");
  assert.equal(model.label, "수신 연락처 인증 필요");
  assert.equal(model.contactStatus, "연락처 인증 필요");
  assert.doesNotMatch(renderState(model), /발송 준비 완료/);
}

function testNormalizedContactVerifiedFalseIsNotReadyEvenWithActiveContact() {
  const model = deriveKakaoAlimtalkState({
    kakao: {
      identity: "active",
      contact: "active",
      contact_basis: "verified_phone",
      contact_verified: false,
      consent: "granted",
      capability: "ready",
      send_eligibility: "ready",
    },
  });

  assert.equal(model.state, "not_ready");
  assert.equal(model.label, "수신 연락처 인증 필요");
  assert.equal(model.contactStatus, "연락처 인증 필요");
  assert.doesNotMatch(renderState(model), /발송 준비 완료/);
}

function testNormalizedRevokedConsentReturnsBlocked() {
  const model = deriveKakaoAlimtalkState({
    kakao: {
      identity: "active",
      contact: "active",
      consent: "revoked",
      send_eligibility: "not_ready",
    },
  });

  assert.equal(model.state, "blocked");
  assert.equal(model.actionDisabled, true);
}

function testNormalizedBlockedSendEligibilityReturnsBlocked() {
  const model = deriveKakaoAlimtalkState({
    kakao: {
      identity: "active",
      contact: "active",
      consent: "granted",
      send_eligibility: "blocked",
    },
  });

  assert.equal(model.state, "blocked");
  assert.equal(model.actionDisabled, true);
}

function testNormalizedMalformedDoesNotCrash() {
  const model = deriveKakaoAlimtalkState({
    kakao: {
      identity: ["active"],
      contact: null,
      consent: {},
      send_eligibility: "",
    },
  });

  assert.equal(model.state, "not_ready");
  assert.equal(model.actionDisabled, true);
}

function testNormalizedObjectTakesPriorityOverArrayFallback() {
  const model = deriveKakaoAlimtalkState({
    kakao: {
      identity: "missing",
      contact: "missing",
      consent: "missing",
      send_eligibility: "not_ready",
    },
    providers: [{ provider: "kakao", status: "active" }],
    contact_channels: [{ channel: "kakao_alimtalk", status: "active", count: 1 }],
    consents: [{ channel: "kakao_alimtalk", consent_type: "reminder", status: "granted" }],
  });

  assert.equal(model.state, "not_connected");
  assert.equal(model.actionDisabled, true);
}

function testNormalizedRawIdentifiersAndEnumsAreNotExposed() {
  const model = deriveKakaoAlimtalkState({
    kakao: {
      identity: "active",
      contact: "active",
      contact_basis: "verified_phone",
      contact_verified: true,
      consent: "granted",
      capability: "ready",
      send_eligibility: "ready",
      provider_user_id: "provider-user-1",
      auth_user_id: "auth-user-1",
      destination_hash: "hash-1",
      value_normalized: "normalized-1",
    },
  });
  const rendered = renderState(model);

  assert.doesNotMatch(
    rendered,
    /kakao_alimtalk|provider_user_id|auth_user_id|provider-user-1|auth-user-1|destination_hash|value_normalized|hash-1|normalized-1/
  );
  assert.equal(model.actionDisabled, true);
}

testNullRowReturnsUnknown();
testNoKakaoProviderNoConsentReturnsNotConnected();
testKakaoProviderOnlyReturnsAccountReady();
testKakaoProviderAndConsentReturnsConsentReady();
testLegacyKakaoProviderContactAndConsentStaysConsentReady();
testRevokedConsentReturnsBlocked();
testMalformedArraysDoNotCrash();
testRawIdentifiersAndEnumsAreNotExposed();
testNormalizedNotConnected();
testNormalizedAccountNeedsConsentContactAndCapability();
testNormalizedIdentityActiveButConsentAndCapabilityMissingIsNotReady();
testNormalizedConsentContactReadyButCapabilityMissingIsNotReady();
testNormalizedSendReady();
testNormalizedReadySendEligibilityWithoutCapabilityDoesNotShowReady();
testNormalizedContactBasisMissingIsNotReadyEvenWithActiveContact();
testNormalizedContactVerifiedFalseIsNotReadyEvenWithActiveContact();
testNormalizedRevokedConsentReturnsBlocked();
testNormalizedBlockedSendEligibilityReturnsBlocked();
testNormalizedMalformedDoesNotCrash();
testNormalizedObjectTakesPriorityOverArrayFallback();
testNormalizedRawIdentifiersAndEnumsAreNotExposed();

console.log("kakaoAlimtalkStateFormat tests passed");
