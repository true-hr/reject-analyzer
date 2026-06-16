const REDACTED = "[redacted]";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeProvider(provider) {
  const key = String(provider || "").trim().toLowerCase();
  if (key === "custom:kakao") return "kakao";
  return key;
}

function sanitizeText(value) {
  return String(value || "")
    .slice(0, 240)
    .replace(/https?:\/\/[^\s]+/gi, REDACTED)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, REDACTED)
    .replace(/\+?\d[\d\s().-]{7,}\d/g, REDACTED)
    .replace(/\b(access|refresh|id|provider|service_role|anon)?_?token=([^&\s]+)/gi, `$1_token=${REDACTED}`)
    .replace(/\b(code|state|provider_id|provider_user_id|subject|sub)=([^&\s]+)/gi, `$1=${REDACTED}`)
    .replace(/\b(eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)\b/g, REDACTED)
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, REDACTED);
}

export function hasKakaoAuthIdentity(identitySummary) {
  if (identitySummary?.hasKakao) return true;
  if (Number(identitySummary?.providerCounts?.kakao || 0) > 0) return true;
  if (Number(identitySummary?.kakaoCount || 0) > 0) return true;

  return asArray(identitySummary?.providers).some((item) => {
    if (typeof item === "string") return normalizeProvider(item) === "kakao";
    return normalizeProvider(item?.provider) === "kakao" && Number(item?.count || 1) > 0;
  });
}

export function hasActiveSchedulerKakaoIdentity(summaryRows) {
  const row = Array.isArray(summaryRows) ? summaryRows[0] : summaryRows;
  if (!row) return false;
  if (String(row?.kakao?.identity || "").toLowerCase() === "active") return true;

  return asArray(row?.providers).some((item) => (
    normalizeProvider(item?.provider) === "kakao" &&
    String(item?.status || "").toLowerCase() === "active"
  ));
}

export function shouldSyncKakaoLinkReturnIdentity(options = {}) {
  if (!options.hasReturnSignal) {
    return { shouldSync: false, reason: "return_signal_missing" };
  }
  if (!hasKakaoAuthIdentity(options.authIdentitySummary)) {
    return { shouldSync: false, reason: "auth_kakao_missing" };
  }
  if (hasActiveSchedulerKakaoIdentity(options.summaryRows)) {
    return { shouldSync: false, reason: "scheduler_kakao_already_active" };
  }
  return { shouldSync: true, reason: "scheduler_kakao_missing_after_auth_link" };
}

export async function syncKakaoLinkReturnIdentityIfNeeded(options = {}) {
  const currentRows = asArray(options.summaryRows);

  if (!options.hasReturnSignal) {
    return { status: "skipped", reason: "return_signal_missing", rows: currentRows };
  }

  if (typeof options.getSession === "function") {
    await options.getSession();
  }

  const authIdentitySummary = typeof options.loadAuthIdentitySummary === "function"
    ? await options.loadAuthIdentitySummary()
    : null;
  const decision = shouldSyncKakaoLinkReturnIdentity({
    hasReturnSignal: true,
    authIdentitySummary,
    summaryRows: currentRows,
  });

  if (!decision.shouldSync) {
    return {
      status: "skipped",
      reason: decision.reason,
      rows: currentRows,
      authIdentitySummary,
    };
  }

  if (typeof options.syncCurrentPersonAuthIdentities !== "function") {
    throw new Error("kakao_link_sync_rpc_missing");
  }
  if (typeof options.fetchSchedulerV2NotificationSummary !== "function") {
    throw new Error("kakao_link_summary_reload_missing");
  }

  await options.syncCurrentPersonAuthIdentities();
  const nextRows = await options.fetchSchedulerV2NotificationSummary();
  return {
    status: "synced",
    reason: decision.reason,
    rows: asArray(nextRows),
    authIdentitySummary,
  };
}

export function sanitizeKakaoLinkReturnSyncError(error) {
  return {
    status: sanitizeText(error?.status || error?.statusCode || ""),
    name: sanitizeText(error?.name || ""),
    message: sanitizeText(error?.message || error?.error_description || error?.error || ""),
  };
}
