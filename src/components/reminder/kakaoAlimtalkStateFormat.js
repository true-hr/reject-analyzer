function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function keyOf(value) {
  return asText(value).toLowerCase();
}

function hasStatus(item, statuses) {
  return statuses.includes(keyOf(item?.status || item?.ownership_status));
}

function isKakaoProvider(item) {
  return keyOf(item?.provider) === "kakao";
}

function isKakaoContact(item) {
  return keyOf(item?.channel || item?.type) === "kakao_alimtalk";
}

function isKakaoConsent(item) {
  return keyOf(item?.channel) === "kakao_alimtalk";
}

function hasNormalizedKakaoSignal(row) {
  return row?.kakao && typeof row.kakao === "object" && !Array.isArray(row.kakao);
}

function deriveNormalizedKakaoState(kakao) {
  const identity = keyOf(kakao.identity);
  const contact = keyOf(kakao.contact);
  const consent = keyOf(kakao.consent);
  const sendEligibility = keyOf(kakao.send_eligibility);
  const signals = [identity, contact, consent, sendEligibility];

  if (
    signals.some((signal) => signal === "blocked") ||
    consent === "revoked"
  ) {
    return "blocked";
  }

  if (
    identity === "active" &&
    contact === "active" &&
    consent === "granted" &&
    sendEligibility === "ready"
  ) {
    return "send_ready";
  }

  if (
    identity === "active" &&
    consent === "granted" &&
    ["missing", "active", "unknown"].includes(contact) &&
    ["not_ready", "unknown"].includes(sendEligibility)
  ) {
    return "consent_ready";
  }

  if (
    identity === "active" &&
    ["missing", "unknown"].includes(contact) &&
    ["missing", "unknown"].includes(consent) &&
    ["not_ready", "unknown"].includes(sendEligibility)
  ) {
    return "account_ready";
  }

  if (
    ["missing", "unknown"].includes(identity) &&
    ["missing", "unknown"].includes(contact) &&
    ["missing", "unknown"].includes(consent) &&
    ["not_ready", "unknown"].includes(sendEligibility)
  ) {
    return identity === "unknown" ||
      contact === "unknown" ||
      consent === "unknown" ||
      sendEligibility === "unknown"
      ? "unknown"
      : "not_connected";
  }

  return "unknown";
}

const STATE_COPY = {
  not_connected: {
    label: "카카오 계정 연결 필요",
    description:
      "PASSMAP의 주요 리마인드는 카카오 알림톡을 중심으로 받을 수 있게 준비합니다.",
    actionLabel: "카카오 계정 연결 준비중",
    tone: "idle",
  },
  account_ready: {
    label: "카카오 계정 연결됨 · 알림톡 동의 필요",
    description:
      "카카오 계정은 확인됐지만 알림톡 수신 동의와 연락처 준비가 아직 필요합니다.",
    actionLabel: "알림톡 동의 설정 준비중",
    tone: "warning",
  },
  consent_ready: {
    label: "알림톡 수신 동의 준비됨",
    description:
      "알림톡 수신 동의는 확인됐고, 실제 발송 설정은 이후 provider 연동 단계에서 연결합니다.",
    actionLabel: "발송 설정 준비중",
    tone: "ready",
  },
  send_ready: {
    label: "카카오 알림톡 발송 준비됨",
    description:
      "계정, 연락처, 수신 동의가 갖춰졌습니다. 실제 발송 provider 연결은 아직 구현하지 않았습니다.",
    actionLabel: "발송 설정 준비중",
    tone: "ready",
  },
  blocked: {
    label: "카카오 알림톡 사용 불가",
    description:
      "계정 연결 해제, 비활성 상태, 또는 수신 동의 철회가 있어 카카오 알림톡을 사용할 수 없습니다.",
    actionLabel: "상태 확인 필요",
    tone: "blocked",
  },
  unknown: {
    label: "상태 확인 필요",
    description:
      "카카오 알림톡 연결 상태를 확인할 수 없습니다. 알림 설정 요약을 다시 불러와 주세요.",
    actionLabel: "상태 확인 준비중",
    tone: "idle",
  },
};

export function deriveKakaoAlimtalkState(row) {
  if (!row || typeof row !== "object") {
    return {
      state: "unknown",
      actionDisabled: true,
      ...STATE_COPY.unknown,
    };
  }

  if (hasNormalizedKakaoSignal(row)) {
    const state = deriveNormalizedKakaoState(row.kakao);

    return {
      state,
      actionDisabled: true,
      ...STATE_COPY[state],
    };
  }

  const providers = asArray(row.providers);
  const contacts = asArray(row.contact_channels);
  const consents = asArray(row.consents);
  const kakaoProvider = providers.find(isKakaoProvider);
  const kakaoContact = contacts.find(isKakaoContact);
  const kakaoConsent = consents.find(isKakaoConsent);

  const blocked =
    [kakaoProvider, kakaoContact, kakaoConsent].some((item) =>
      item && hasStatus(item, ["revoked", "disabled", "unlinked", "conflict", "inactive"])
    );

  let state = "not_connected";

  if (blocked) {
    state = "blocked";
  } else {
    const accountLinked = kakaoProvider && hasStatus(kakaoProvider, ["active", "linked", "verified"]);
    const contactReady = kakaoContact && hasStatus(kakaoContact, ["active", "verified"]);
    const consentReady = kakaoConsent && hasStatus(kakaoConsent, ["agreed", "granted", "active"]);

    if (accountLinked && contactReady && consentReady) {
      state = "send_ready";
    } else if (accountLinked && consentReady) {
      state = "consent_ready";
    } else if (accountLinked) {
      state = "account_ready";
    } else if (consentReady) {
      state = "consent_ready";
    }
  }

  return {
    state,
    actionDisabled: true,
    ...STATE_COPY[state],
  };
}
