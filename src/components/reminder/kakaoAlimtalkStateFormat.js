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

function readKakaoStatus(value, fallback = "missing") {
  const key = keyOf(value);
  if (!key) return fallback;
  return key;
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

function buildStatusModel({
  identity = "missing",
  contact = "missing",
  consent = "missing",
  capability = "missing",
  sendEligibility = "not_ready",
}) {
  const normalized = {
    identity: readKakaoStatus(identity),
    contact: readKakaoStatus(contact),
    consent: readKakaoStatus(consent),
    capability: readKakaoStatus(capability),
    sendEligibility: readKakaoStatus(sendEligibility, "not_ready"),
  };
  const blocked =
    normalized.identity === "blocked" ||
    normalized.contact === "blocked" ||
    normalized.consent === "revoked" ||
    normalized.capability === "blocked" ||
    normalized.sendEligibility === "blocked";
  const ready =
    normalized.identity === "active" &&
    normalized.contact === "active" &&
    normalized.consent === "granted" &&
    normalized.capability === "ready" &&
    normalized.sendEligibility === "ready";
  const unknown =
    !["missing", "active", "blocked"].includes(normalized.identity) ||
    !["missing", "active", "blocked"].includes(normalized.contact) ||
    !["missing", "granted", "revoked"].includes(normalized.consent) ||
    !["missing", "not_ready", "ready", "blocked"].includes(normalized.capability) ||
    !["not_ready", "ready", "blocked"].includes(normalized.sendEligibility);

  let state = "not_connected";
  if (blocked) {
    state = "blocked";
  } else if (ready) {
    state = "send_ready";
  } else if (unknown) {
    state = "unknown";
  } else if (normalized.identity === "active") {
    state = "not_ready";
  }

  const accountStatus = normalized.identity === "active" ? "연결됨" : "미연결";
  const consentStatus =
    normalized.consent === "granted"
      ? "동의됨"
      : normalized.consent === "revoked"
        ? "철회됨"
        : normalized.consent === "missing"
          ? "동의 필요"
          : "확인 불가";
  const contactStatus =
    normalized.contact === "active"
      ? "등록됨"
      : normalized.contact === "blocked"
        ? "차단/사용 불가"
        : normalized.contact === "missing"
          ? "연락처 필요"
          : "확인 불가";
  const capabilityStatus =
    normalized.capability === "ready"
      ? "서비스 발송 준비됨"
      : normalized.capability === "blocked"
        ? "차단됨"
        : normalized.capability === "missing" || normalized.capability === "not_ready"
          ? "알림톡 발송 기능 준비 중"
          : "확인 불가";
  const readinessStatus = blocked
    ? "차단됨"
    : ready
      ? "발송 준비 완료"
      : "아직 발송 준비 안 됨";

  let label = "상태 확인 필요";
  let description = "카카오 알림톡 연결 상태를 확인할 수 없습니다. 알림 설정 요약을 다시 불러와 주세요.";

  if (state === "not_connected") {
    label = "카카오 계정 미연결";
    description = "카카오 계정을 연결하면 이후 알림톡 수신 설정을 진행할 수 있습니다.";
  } else if (state === "blocked") {
    label = "차단됨";
    description =
      normalized.consent === "revoked"
        ? "알림톡 수신 동의가 철회되어 현재는 카카오 알림톡을 사용할 수 없습니다."
        : "카카오 알림톡 사용이 차단되었거나 사용할 수 없는 상태입니다.";
  } else if (state === "send_ready") {
    label = "카카오 알림톡 발송 준비 완료";
    description = "계정 연결, 연락처, 수신 동의, 서비스 발송 준비가 모두 확인됐습니다.";
  } else if (state === "not_ready") {
    const needs = [];
    if (normalized.consent === "missing") needs.push("동의 필요");
    if (normalized.contact === "missing") needs.push("연락처 필요");
    if (normalized.capability !== "ready") needs.push("발송 준비 안 됨");
    label = needs.length > 0 ? needs.join(" / ") : "발송 준비 안 됨";

    if (normalized.consent === "missing" && normalized.contact === "missing") {
      description =
        "카카오 계정은 연결됐지만, 알림톡 수신 동의와 연락처 등록이 필요합니다. 현재는 발송 준비 전입니다.";
    } else if (normalized.consent === "missing") {
      description = "알림톡 수신 동의가 필요합니다.";
    } else if (normalized.contact === "missing") {
      description = "알림톡 수신에 사용할 연락처 확인이 필요합니다.";
    } else if (normalized.capability === "missing" || normalized.capability === "not_ready") {
      description = "알림톡 발송 기능은 아직 준비 중입니다.";
    } else {
      description = "카카오 알림톡 발송 준비가 아직 끝나지 않았습니다.";
    }
  }

  return {
    state,
    label,
    description,
    actionLabel: state === "not_connected" ? "카카오 계정 연결" : "알림톡 수신 설정 준비 중",
    tone: state === "send_ready" ? "ready" : state === "blocked" ? "blocked" : state === "not_ready" ? "warning" : "idle",
    actionDisabled: true,
    accountStatus,
    consentStatus,
    contactStatus,
    capabilityStatus,
    readinessStatus,
    rawStatus: normalized,
  };
}

export function deriveKakaoAlimtalkState(row) {
  if (!row || typeof row !== "object") {
    return buildStatusModel({
      identity: "unknown",
      contact: "unknown",
      consent: "unknown",
      capability: "unknown",
      sendEligibility: "unknown",
    });
  }

  if (hasNormalizedKakaoSignal(row)) {
    return buildStatusModel({
      identity: row.kakao.identity,
      contact: row.kakao.contact,
      consent: row.kakao.consent,
      capability: row.kakao.capability,
      sendEligibility: row.kakao.send_eligibility,
    });
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

  if (blocked) {
    return buildStatusModel({
      identity: kakaoProvider && hasStatus(kakaoProvider, ["unlinked", "conflict", "inactive"]) ? "blocked" : "missing",
      contact: kakaoContact && hasStatus(kakaoContact, ["revoked", "disabled", "inactive"]) ? "blocked" : "missing",
      consent: kakaoConsent && hasStatus(kakaoConsent, ["revoked"]) ? "revoked" : "missing",
      capability: "missing",
      sendEligibility: "blocked",
    });
  }

  const accountLinked = kakaoProvider && hasStatus(kakaoProvider, ["active", "linked", "verified"]);
  const contactReady = kakaoContact && hasStatus(kakaoContact, ["active", "verified"]);
  const consentReady = kakaoConsent && hasStatus(kakaoConsent, ["agreed", "granted", "active"]);

  return buildStatusModel({
    identity: accountLinked ? "active" : "missing",
    contact: contactReady ? "active" : "missing",
    consent: consentReady ? "granted" : "missing",
    capability: "missing",
    sendEligibility: "not_ready",
  });
}
