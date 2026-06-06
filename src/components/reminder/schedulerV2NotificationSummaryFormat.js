function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function asCount(value) {
  const count = Number(value || 0);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

function findByKey(items, keyName, keyValue) {
  return asArray(items).find((item) => asText(item?.[keyName]).toLowerCase() === keyValue);
}

function countByStatus(items, status) {
  return asArray(items)
    .filter((item) => asText(item?.status).toLowerCase() === status)
    .reduce((sum, item) => sum + asCount(item?.count || 1), 0);
}

function formatSummaryItems(items, formatter, emptyText) {
  const lines = asArray(items).map(formatter).filter(Boolean);
  return lines.length > 0 ? lines.join(", ") : emptyText;
}

export function getSchedulerProviderLabel(provider) {
  const key = asText(provider).toLowerCase();
  if (key === "google") return "Google";
  if (key === "kakao") return "Kakao";
  if (key === "naver" || key === "custom:naver") return "Naver";
  return asText(provider, "알 수 없는 계정");
}

function getStatusLabel(status) {
  const key = asText(status).toLowerCase();
  if (key === "active") return "활성";
  if (key === "inactive") return "비활성";
  if (key === "unverified") return "인증 필요";
  if (key === "verified") return "인증됨";
  if (key === "agreed") return "동의";
  if (key === "revoked") return "철회";
  if (key === "pending") return "대기";
  return asText(status, "상태 확인 필요");
}

function getChannelLabel(channel) {
  const key = asText(channel).toLowerCase();
  if (key === "email") return "이메일";
  if (key === "sms") return "문자";
  if (key === "kakao_alimtalk") return "카카오 알림톡";
  if (key === "web_push") return "Web Push";
  return asText(channel, "알림 채널");
}

function getConsentTypeLabel(consentType) {
  const key = asText(consentType).toLowerCase();
  if (key === "reminder") return "리마인드";
  if (key === "marketing") return "마케팅";
  return asText(consentType, "수신");
}

function getReminderKindLabel(reminderKind) {
  const key = asText(reminderKind).toLowerCase();
  if (key === "experience_recall") return "업무기록 리마인드";
  return asText(reminderKind, "리마인드");
}

function getCadenceLabel(cadence) {
  const key = asText(cadence).toLowerCase();
  if (key === "weekdays") return "평일";
  if (key === "daily") return "매일";
  if (key === "weekly") return "매주";
  return asText(cadence);
}

export function formatSchedulerProviderSummary(row) {
  return formatSummaryItems(
    row?.providers,
    (item) => `${getSchedulerProviderLabel(item?.provider)} ${getStatusLabel(item?.status)}`,
    "연결 계정 없음"
  );
}

export function formatSchedulerContactSummary(row) {
  return formatSummaryItems(
    row?.contact_channels,
    (item) => `${getChannelLabel(item?.channel)} ${getStatusLabel(item?.status)} ${asCount(item?.count)}개`,
    "알림 채널 없음"
  );
}

export function formatSchedulerConsentSummary(row) {
  return formatSummaryItems(
    row?.consents,
    (item) => `${getChannelLabel(item?.channel)} ${getConsentTypeLabel(item?.consent_type)} ${getStatusLabel(item?.status)}`,
    "수신 동의 없음"
  );
}

export function formatSchedulerRuleSummary(row) {
  return formatSummaryItems(
    row?.reminder_rules,
    (item) => {
      const channels = asArray(item?.channels)
        .filter((channel) => channel?.is_enabled !== false)
        .map((channel) => getChannelLabel(channel?.channel))
        .filter(Boolean)
        .join("/");
      const time = [getCadenceLabel(item?.cadence), asText(item?.time_local).slice(0, 5)]
        .filter(Boolean)
        .join(" ");
      const enabled = item?.is_enabled === false ? "OFF" : "ON";
      return [
        getReminderKindLabel(item?.reminder_kind),
        time,
        channels,
        enabled,
      ].filter(Boolean).join(" · ");
    },
    "리마인드 규칙 없음"
  );
}

export function formatSchedulerWebPushSummary(row) {
  return formatSummaryItems(
    row?.web_push,
    (item) => `${getStatusLabel(item?.ownership_status)} ${asCount(item?.count)}개`,
    "Web Push 없음"
  );
}

function getKakaoChannelCard(row) {
  const consent = findByKey(row?.consents, "channel", "kakao_alimtalk");
  const status = asText(consent?.status).toLowerCase();
  if (status === "agreed") {
    return {
      key: "kakao",
      label: "카카오 알림톡",
      status: "동의됨",
      description: "리마인드 수신 동의가 확인됐습니다. 실제 카카오 발송 연결은 다음 단계에서 준비됩니다.",
      actionLabel: "카카오 알림톡 연결 준비중",
      tone: "amber",
      disabled: true,
    };
  }
  return {
    key: "kakao",
    label: "카카오 알림톡",
    status: "동의 필요",
    description: "카카오 알림톡으로 리마인드를 받으려면 수신 동의와 채널 연결이 필요합니다.",
    actionLabel: "카카오 알림톡 연결 준비중",
    tone: "slate",
    disabled: true,
  };
}

function getSmsChannelCard(row) {
  const activeCount = countByStatus(row?.contact_channels?.filter?.((item) => asText(item?.channel).toLowerCase() === "sms"), "active");
  const verifiedCount = countByStatus(row?.contact_channels?.filter?.((item) => asText(item?.channel).toLowerCase() === "sms"), "verified");
  const unverifiedCount = countByStatus(row?.contact_channels?.filter?.((item) => asText(item?.channel).toLowerCase() === "sms"), "unverified");
  if (activeCount + verifiedCount > 0) {
    return {
      key: "sms",
      label: "문자",
      status: `연결됨 ${activeCount + verifiedCount}개`,
      description: "SMS fallback 채널로 사용할 휴대폰 번호가 연결되어 있습니다.",
      actionLabel: "휴대폰 인증 관리 준비중",
      tone: "emerald",
      disabled: true,
    };
  }
  if (unverifiedCount > 0) {
    return {
      key: "sms",
      label: "문자",
      status: "인증 필요",
      description: "휴대폰 번호 인증 후 SMS fallback을 사용할 수 있습니다.",
      actionLabel: "휴대폰 인증 준비중",
      tone: "amber",
      disabled: true,
    };
  }
  return {
    key: "sms",
    label: "문자",
    status: "없음",
    description: "아직 SMS fallback으로 사용할 휴대폰 번호가 연결되지 않았습니다.",
    actionLabel: "휴대폰 인증 준비중",
    tone: "slate",
    disabled: true,
  };
}

function getEmailChannelCard(row) {
  const emailItems = asArray(row?.contact_channels).filter((item) => asText(item?.channel).toLowerCase() === "email");
  const activeCount = countByStatus(emailItems, "active") + countByStatus(emailItems, "verified");
  const unverifiedCount = countByStatus(emailItems, "unverified");
  if (activeCount > 0) {
    return {
      key: "email",
      label: "이메일",
      status: `연결됨 ${activeCount}개`,
      description: "이메일 알림 채널이 연결되어 있습니다.",
      actionLabel: "이메일 관리 준비중",
      tone: "emerald",
      disabled: true,
    };
  }
  if (unverifiedCount > 0) {
    return {
      key: "email",
      label: "이메일",
      status: "인증 필요",
      description: "이메일 인증 후 알림 채널로 사용할 수 있습니다.",
      actionLabel: "이메일 인증 준비중",
      tone: "amber",
      disabled: true,
    };
  }
  return {
    key: "email",
    label: "이메일",
    status: "없음",
    description: "아직 알림을 받을 이메일 채널이 연결되지 않았습니다.",
    actionLabel: "이메일 연결 준비중",
    tone: "slate",
    disabled: true,
  };
}

function getWebPushChannelCard(row) {
  const activeCount = asArray(row?.web_push)
    .filter((item) => asText(item?.ownership_status).toLowerCase() === "active")
    .reduce((sum, item) => sum + asCount(item?.count || 1), 0);
  if (activeCount > 0) {
    return {
      key: "web_push",
      label: "Web Push",
      status: `활성 ${activeCount}개`,
      description: "현재 브라우저/기기 알림이 연결되어 있습니다.",
      actionLabel: "기기 알림은 위 Web Push 설정에서 관리",
      tone: "emerald",
      disabled: true,
    };
  }
  return {
    key: "web_push",
    label: "Web Push",
    status: "없음",
    description: "브라우저 알림은 위 Web Push 설정에서 먼저 연결할 수 있습니다.",
    actionLabel: "위 Web Push 설정 사용",
    tone: "slate",
    disabled: true,
  };
}

export function formatSchedulerChannelCards(row) {
  return [
    getKakaoChannelCard(row),
    getSmsChannelCard(row),
    getEmailChannelCard(row),
    getWebPushChannelCard(row),
  ];
}

export function formatSchedulerV2SummaryRow(row, index = 0) {
  const status = row?.person_status ? getStatusLabel(row.person_status) : "상태 확인 필요";
  const reminderRules = formatSchedulerRuleSummary(row);
  return {
    title: `알림 프로필 · ${status}`,
    fallbackTitle: `알림 프로필 ${index + 1}`,
    providers: formatSchedulerProviderSummary(row),
    contactChannels: formatSchedulerContactSummary(row),
    consents: formatSchedulerConsentSummary(row),
    reminderRules,
    webPush: formatSchedulerWebPushSummary(row),
    channelCards: formatSchedulerChannelCards(row),
    reminderActionLabel: "알림 규칙 추가 준비중",
    hasReminderRules: asArray(row?.reminder_rules).length > 0,
  };
}
