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
  };
}
