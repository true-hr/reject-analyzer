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

function hasStatus(item, statuses) {
  const key = asText(item?.status || item?.ownership_status).toLowerCase();
  return statuses.includes(key);
}

function findSummaryItem(items, keyName, keyValue) {
  const target = asText(keyValue).toLowerCase();
  return asArray(items).find((item) => asText(item?.[keyName]).toLowerCase() === target);
}

function hasChannelConsent(row, channel) {
  const target = asText(channel).toLowerCase();
  return asArray(row?.consents).some((item) => {
    const channelMatches = asText(item?.channel).toLowerCase() === target;
    const statusGranted = hasStatus(item, ["agreed", "granted", "active"]);
    return channelMatches && statusGranted;
  });
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
  if (key === "granted") return "동의";
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
  if (key === "custom_days") return "선택 요일";
  return asText(cadence);
}

export function buildNotificationChannelCards(row) {
  const kakaoContact = findSummaryItem(row?.contact_channels, "channel", "kakao_alimtalk");
  const smsContact = findSummaryItem(row?.contact_channels, "channel", "sms");
  const emailContact = findSummaryItem(row?.contact_channels, "channel", "email");
  const activeWebPush = asArray(row?.web_push).some((item) => hasStatus(item, ["active"]) && asCount(item?.count) > 0);

  const kakaoConnected = kakaoContact && hasStatus(kakaoContact, ["active", "verified"]);
  const smsConnected = smsContact && hasStatus(smsContact, ["active", "verified"]);
  const smsNeedsVerification = smsContact && hasStatus(smsContact, ["unverified", "pending"]);
  const emailConnected = emailContact && hasStatus(emailContact, ["active", "verified"]);

  return [
    {
      id: "kakao_alimtalk",
      label: "카카오 알림톡",
      role: "운영 알림 주 채널",
      status: kakaoConnected
        ? hasChannelConsent(row, "kakao_alimtalk") ? "연결됨" : "동의 필요"
        : "준비중",
      actionLabel: "카카오 알림톡 연결 준비중",
      actionDisabled: true,
    },
    {
      id: "sms",
      label: "SMS / 문자",
      role: "카카오 실패 시 보조 채널",
      status: smsConnected
        ? hasChannelConsent(row, "sms") ? "연결됨" : "동의 필요"
        : smsNeedsVerification ? "인증 필요" : "미연결",
      actionLabel: "휴대폰 인증 준비중",
      actionDisabled: true,
    },
    {
      id: "email",
      label: "이메일",
      role: "보조 알림 채널",
      status: emailConnected ? "연결됨" : "미연결",
      actionLabel: "이메일 알림 준비중",
      actionDisabled: true,
    },
    {
      id: "web_push",
      label: "Web Push",
      role: "현재 브라우저/기기 보조 알림",
      status: activeWebPush ? "활성" : "미연결",
      actionLabel: "기기 알림은 아래 Web Push 설정에서 관리",
      actionDisabled: true,
    },
  ];
}

export function buildAccountLinkingCards(row) {
  const providers = asArray(row?.providers);
  return [
    { id: "google", label: "Google", actionLabel: "Google 계정 연결 상태 확인" },
    { id: "kakao", label: "Kakao", actionLabel: "카카오 계정 연결 준비중" },
    { id: "naver", label: "Naver", actionLabel: "네이버 계정 연결 준비중" },
  ].map((card) => {
    const provider = providers.find((item) => {
      const key = asText(item?.provider).toLowerCase();
      return card.id === "naver" ? key === "naver" || key === "custom:naver" : key === card.id;
    });
    return {
      ...card,
      status: provider && hasStatus(provider, ["active"]) ? "연결됨" : "준비중",
      actionDisabled: true,
    };
  });
}

export function buildReminderRuleCards(row) {
  const rules = asArray(row?.reminder_rules);
  if (rules.length === 0) {
    return [
      {
        id: "empty",
        title: "업무기록 리마인드",
        schedule: "규칙 없음",
        channelSummary: "카카오 알림톡/SMS 중심 운영 알림으로 확장 예정",
        status: "OFF",
      },
    ];
  }

  return rules.map((item, index) => {
    const enabledChannels = asArray(item?.channels)
      .filter((channel) => channel?.is_enabled !== false)
      .map((channel) => getChannelLabel(channel?.channel))
      .filter(Boolean);
    const currentChannels = enabledChannels.length > 0 ? enabledChannels.join("/") : "채널 미설정";
    const schedule = [getCadenceLabel(item?.cadence), asText(item?.time_local).slice(0, 5)]
      .filter(Boolean)
      .join(" ");
    return {
      id: item?.rule_id || `rule-${index}`,
      title: getReminderKindLabel(item?.reminder_kind),
      schedule: schedule || "시간 미설정",
      channelSummary: `현재 저장: ${currentChannels} · 운영 채널: 카카오 알림톡/SMS 준비중`,
      status: item?.is_enabled === false ? "OFF" : "ON",
    };
  });
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

export function formatSchedulerV2SummaryRow(row, index = 0) {
  const status = row?.person_status ? getStatusLabel(row.person_status) : "상태 확인 필요";
  return {
    title: `알림 프로필 · ${status}`,
    fallbackTitle: `알림 프로필 ${index + 1}`,
    providers: formatSchedulerProviderSummary(row),
    contactChannels: formatSchedulerContactSummary(row),
    consents: formatSchedulerConsentSummary(row),
    reminderRules: formatSchedulerRuleSummary(row),
    webPush: formatSchedulerWebPushSummary(row),
    notificationChannels: buildNotificationChannelCards(row),
    accountLinks: buildAccountLinkingCards(row),
    reminderRuleCards: buildReminderRuleCards(row),
  };
}
