// src/lib/auth.js
import { supabase } from "./supabaseClient.js";

const ACCOUNT_RECOVERY_REDACTED = "[redacted]";
export const GOOGLE_LINK_CONFIRMATION_TOKEN = "ALLOW_ACCOUNT_RECOVERY_GOOGLE_LINK";
export const ACCOUNT_RECOVERY_TRANSFER_CONFIRMATION_TEXT =
  "source 데이터 이전이 완료됐고, duplicate 4건 skip 정책이 적용되었음을 확인했습니다.";
export const ACCOUNT_RECOVERY_KAKAO_UNLINK_CONFIRMATION_TEXT =
  "이 Kakao identity를 source에서 연결 해제한 뒤 target Google 계정에 다시 연결할 것을 이해했습니다.";

// GitHub Pages 서브패스(/reject-analyzer/) 유지용 redirectTo 계산
function getRedirectTo() {
  const origin = window.location.origin;
  let path = window.location.pathname || "/";
  const search = window.location.search || "";
  const hash = window.location.hash || "";

  // pathname이 "/reject-analyzer" 처럼 끝 슬래시가 없을 수도 있으니 보정
  if (!path.endsWith("/")) path += "/";

  return origin + path + search + hash;
}

function resolveRedirectTo(options) {
  if (typeof options === "string" && options.trim()) return options.trim();
  const redirectTo = String(options?.redirectTo || "").trim();
  return redirectTo || getRedirectTo();
}

export function getAccountRecoveryRedirectTo(currentHref) {
  const href = String(currentHref || (typeof window !== "undefined" ? window.location.href : "") || "");
  if (!href) return "";
  try {
    const url = new URL(href);
    url.searchParams.set("account_recovery", "1");
    return url.toString();
  } catch {
    return href.includes("account_recovery=1")
      ? href
      : `${href}${href.includes("?") ? "&" : "?"}account_recovery=1`;
  }
}

function assertClient() {
  if (!supabase?.auth) {
    throw new Error("인증 모듈이 초기화되지 않았습니다. Supabase 환경 변수(URL/ANON_KEY)를 확인해주세요.");
  }
}

function assertAuthClient(client = supabase) {
  if (!client?.auth) {
    throw new Error("인증 모듈이 초기화되지 않았습니다. Supabase 환경 변수(URL/ANON_KEY)를 확인해주세요.");
  }
  return client;
}

function sanitizeRecoveryText(value) {
  return String(value || "")
    .slice(0, 240)
    .replace(/https?:\/\/[^\s]+/gi, ACCOUNT_RECOVERY_REDACTED)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, ACCOUNT_RECOVERY_REDACTED)
    .replace(/\+?\d[\d\s().-]{7,}\d/g, ACCOUNT_RECOVERY_REDACTED)
    .replace(/\b(access|refresh|id|provider|service_role|anon)?_?token=([^&\s]+)/gi, `$1_token=${ACCOUNT_RECOVERY_REDACTED}`)
    .replace(/\b(code|state|provider_id|provider_user_id|subject|sub)=([^&\s]+)/gi, `$1=${ACCOUNT_RECOVERY_REDACTED}`)
    .replace(/\b(eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)\b/g, ACCOUNT_RECOVERY_REDACTED)
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, ACCOUNT_RECOVERY_REDACTED);
}

export function getIdentityCreatedAtBucket(createdAt, nowMs = Date.now()) {
  const createdMs = Date.parse(createdAt || "");
  if (!Number.isFinite(createdMs)) return "unknown";
  const ageDays = Math.max(0, Math.floor((nowMs - createdMs) / 86400000));
  if (ageDays < 1) return "today";
  if (ageDays < 7) return "last_7_days";
  if (ageDays < 30) return "last_30_days";
  return "older";
}

export function sanitizeAuthIdentity(identity, nowMs = Date.now()) {
  return {
    provider: String(identity?.provider || "unknown"),
    createdAtBucket: getIdentityCreatedAtBucket(identity?.created_at || identity?.createdAt, nowMs),
  };
}

export function mapCurrentUserIdentities(data, nowMs = Date.now()) {
  const identities = Array.isArray(data?.identities)
    ? data.identities
    : Array.isArray(data)
      ? data
      : [];
  const sanitizedIdentities = identities.map((identity) => sanitizeAuthIdentity(identity, nowMs));
  const providerCounts = sanitizedIdentities.reduce((acc, identity) => {
    acc[identity.provider] = (acc[identity.provider] || 0) + 1;
    return acc;
  }, {});

  return {
    identityCount: sanitizedIdentities.length,
    providers: Object.keys(providerCounts).sort(),
    providerCounts,
    identities: sanitizedIdentities,
    hasKakao: Boolean(providerCounts.kakao),
    hasGoogle: Boolean(providerCounts.google),
    canUseUserUnlinkFlow: sanitizedIdentities.length >= 2,
  };
}

export function buildAccountRecoveryHelperState(identitySummary, options = {}) {
  const identityCount = Number(identitySummary?.identityCount || 0);
  const providers = Array.isArray(identitySummary?.providers) ? identitySummary.providers : [];
  const providerCounts = identitySummary?.providerCounts || {};
  const kakaoCount = Number(providerCounts.kakao || providers.filter((provider) => provider === "kakao").length || 0);
  const googleCount = Number(providerCounts.google || providers.filter((provider) => provider === "google").length || 0);
  const hasKakao = Boolean(identitySummary?.hasKakao || kakaoCount > 0);
  const hasGoogle = Boolean(identitySummary?.hasGoogle || googleCount > 0);
  const canUseUserUnlinkFlow = identityCount >= 2;
  const canAttemptGoogleLink = Boolean(
    options.enableGoogleLinkAction &&
    options.explicitConfirmation === GOOGLE_LINK_CONFIRMATION_TOKEN
  );
  const dataTransferConfirmed = Boolean(options.dataTransferConfirmed);
  const kakaoUnlinkConfirmed = Boolean(options.kakaoUnlinkConfirmed);
  const kakaoUnlinkBlockers = [];

  if (!hasKakao) kakaoUnlinkBlockers.push("kakao_identity_missing");
  else if (kakaoCount !== 1) kakaoUnlinkBlockers.push("kakao_identity_count_invalid");
  if (!hasGoogle) kakaoUnlinkBlockers.push("google_identity_missing");
  if (!canUseUserUnlinkFlow) kakaoUnlinkBlockers.push("identity_count_too_low");
  if (!dataTransferConfirmed) kakaoUnlinkBlockers.push("transfer_confirmation_required");
  if (!kakaoUnlinkConfirmed) kakaoUnlinkBlockers.push("unlink_confirmation_required");

  const canAttemptKakaoUnlink = kakaoUnlinkBlockers.length === 0;

  return {
    identityCount,
    providers,
    kakaoCount,
    googleCount,
    canUseUserUnlinkFlow,
    canAttemptGoogleLink,
    canAttemptKakaoUnlink,
    kakaoUnlinkDisabled: !canAttemptKakaoUnlink,
    kakaoUnlinkBlockers,
    googleLinkGuardRequired: !canAttemptGoogleLink,
    googleLinkWarning:
      "target Google 계정과 같은 Google 계정을 보조 identity로 사용하면 안 됩니다.",
  };
}

export function classifyAccountRecoveryAuthError(error) {
  const message = sanitizeRecoveryText(error?.message || error?.error_description || error?.error || "").toLowerCase();
  const name = sanitizeRecoveryText(error?.name || "").toLowerCase();
  const status = String(error?.status || error?.statusCode || "");
  const combined = `${message} ${name} ${status}`;

  if (combined.includes("session") || combined.includes("jwt") || status === "401") return "session";
  if (combined.includes("redirect") || combined.includes("callback") || combined.includes("not allowed")) return "redirect";
  if (combined.includes("provider") || combined.includes("manual linking") || combined.includes("disabled")) return "provider_config";
  return "unknown";
}

export function sanitizeAccountRecoveryAuthError(error) {
  return {
    category: classifyAccountRecoveryAuthError(error),
    status: sanitizeRecoveryText(error?.status || error?.statusCode || ""),
    name: sanitizeRecoveryText(error?.name || ""),
    message: sanitizeRecoveryText(error?.message || error?.error_description || error?.error || ""),
  };
}

function createSafeAccountRecoveryError(code, error) {
  const safeError = new Error(code);
  safeError.code = code;
  safeError.diagnostic = sanitizeAccountRecoveryAuthError(error);
  return safeError;
}

export async function getCurrentUserIdentities(client = supabase) {
  const activeClient = assertAuthClient(client);
  const { data, error } = await activeClient.auth.getUserIdentities();
  if (error) throw createSafeAccountRecoveryError("account_recovery_identity_lookup_failed", error);
  return mapCurrentUserIdentities(data);
}

function identitiesFromAuthResponse(data) {
  if (Array.isArray(data?.identities)) return data.identities;
  if (Array.isArray(data)) return data;
  return [];
}

function identityProvider(identity) {
  return String(identity?.provider || "").trim().toLowerCase();
}

export async function unlinkKakaoIdentityForAccountRecovery(client = supabase) {
  const activeClient = assertAuthClient(client);
  const { data, error } = await activeClient.auth.getUserIdentities();
  if (error) throw createSafeAccountRecoveryError("account_recovery_identity_lookup_failed", error);

  const identities = identitiesFromAuthResponse(data);
  const kakaoIdentities = identities.filter((identity) => identityProvider(identity) === "kakao");
  if (kakaoIdentities.length !== 1) {
    throw createSafeAccountRecoveryError("account_recovery_kakao_identity_guard_failed", {
      name: "KakaoIdentityGuard",
      message: "Expected exactly one Kakao identity.",
    });
  }

  const unlinkResult = await activeClient.auth.unlinkIdentity(kakaoIdentities[0]);
  if (unlinkResult?.error) {
    throw createSafeAccountRecoveryError("account_recovery_kakao_unlink_failed", unlinkResult.error);
  }

  return {
    provider: "kakao",
    summary: await getCurrentUserIdentities(activeClient),
  };
}

export async function runGuardedKakaoUnlink({
  identitySummary,
  dataTransferConfirmed,
  kakaoUnlinkConfirmed,
  unlinkKakaoIdentity = unlinkKakaoIdentityForAccountRecovery,
} = {}) {
  const state = buildAccountRecoveryHelperState(identitySummary, {
    dataTransferConfirmed,
    kakaoUnlinkConfirmed,
  });

  if (!state.canAttemptKakaoUnlink) {
    return {
      started: false,
      reloaded: false,
      state,
    };
  }

  const result = await unlinkKakaoIdentity();
  return {
    started: true,
    reloaded: true,
    summary: result?.summary || null,
    state,
  };
}

export async function runGuardedAuxiliaryGoogleLink({
  identitySummary,
  confirmed,
  redirectTo = getAccountRecoveryRedirectTo(),
  linkGoogle = linkGoogleIdentity,
  reloadIdentities = getCurrentUserIdentities,
} = {}) {
  const state = buildAccountRecoveryHelperState(identitySummary, {
    enableGoogleLinkAction: true,
    explicitConfirmation: confirmed ? GOOGLE_LINK_CONFIRMATION_TOKEN : "",
  });

  if (!state.canAttemptGoogleLink) {
    return {
      started: false,
      reloaded: false,
      state,
    };
  }

  const linkResult = await linkGoogle({ redirectTo });
  const nextSummary = await reloadIdentities();

  return {
    started: true,
    reloaded: true,
    linkResult,
    summary: nextSummary,
    state,
  };
}

export async function linkGoogleIdentity(options = {}, client = supabase) {
  const activeClient = assertAuthClient(client);
  const redirectTo = resolveRedirectTo(options);

  const { data, error } = await activeClient.auth.linkIdentity({
    provider: "google",
    options: { redirectTo },
  });

  if (error) throw createSafeAccountRecoveryError("account_recovery_google_link_failed", error);

  return {
    provider: "google",
    started: Boolean(data),
  };
}

export async function signInWithGoogle(options = {}) {
  assertClient();
  const redirectTo = resolveRedirectTo(options);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  // signInWithOAuth는 보통 redirect로 앱을 떠나므로
  // 여기서는 error만 처리하고 나머지는 세션 동기화에서 잡습니다.
  if (error) throw error;

  return data;
}

export async function signInWithKakao(options = {}) {
  assertClient();
  const redirectTo = resolveRedirectTo(options);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "kakao",
    options: { redirectTo },
  });

  // signInWithOAuth는 보통 redirect로 앱을 떠나므로
  // 여기서는 error만 처리하고 나머지는 세션 동기화에서 잡습니다.
  if (error) throw error;

  return data;
}

export async function linkKakaoIdentity(options = {}) {
  assertClient();
  const redirectTo = resolveRedirectTo(options);

  const { data, error } = await supabase.auth.linkIdentity({
    provider: "kakao",
    options: { redirectTo },
  });

  if (error) throw error;

  return data;
}

export async function signInWithNaver(options = {}) {
  assertClient();
  const redirectTo = resolveRedirectTo(options);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "custom:naver",
    options: { redirectTo },
  });

  if (error) throw error;

  return data;
}

export async function signOut() {
  assertClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  if (!supabase?.auth) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data?.session || null;
}

export function onAuthStateChange(callback) {
  // callback(event, session)
  if (!supabase?.auth) return null;
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback?.(event, session || null);
  });
  return data?.subscription || null;
}
