const REDACTED = "[redacted]";
const ACCOUNT_RECOVERY_PARAM = "account_recovery";
const REQUIRED_CONFIRMATION_TEXT =
  "source 데이터 이전이 완료됐고, 이 Kakao identity를 source에서 연결 해제한 뒤 target Google 계정에 다시 연결할 것을 이해했습니다.";

const SENSITIVE_PATTERNS = [
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
  /\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  /\+?\d[\d\s().-]{7,}\d/g,
  /\b(access|refresh|id|provider|service_role|anon)?_?token=([^&\s]+)/gi,
  /\b(provider_id|provider_user_id|sub|subject|email|phone)=([^&\s]+)/gi,
];

function cleanText(value) {
  let next = String(value || "").slice(0, 240);
  next = next.replace(/https?:\/\/[^\s]+/gi, REDACTED);
  next = next.replace(SENSITIVE_PATTERNS[0], REDACTED);
  next = next.replace(SENSITIVE_PATTERNS[1], REDACTED);
  next = next.replace(SENSITIVE_PATTERNS[2], REDACTED);
  next = next.replace(SENSITIVE_PATTERNS[3], REDACTED);
  next = next.replace(SENSITIVE_PATTERNS[4], `$1_token=${REDACTED}`);
  next = next.replace(SENSITIVE_PATTERNS[5], `$1=${REDACTED}`);
  return next;
}

function identitiesFromResponse(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.identities)) return response.identities;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.identities)) return response.data.identities;
  return [];
}

function providerOf(identity) {
  return String(identity?.provider || "").trim().toLowerCase();
}

export function isAccountRecoveryHelperEnabled(search) {
  if (typeof search !== "string") {
    if (typeof window === "undefined") return false;
    search = window.location?.search || "";
  }
  return new URLSearchParams(search).get(ACCOUNT_RECOVERY_PARAM) === "1";
}

export function buildSanitizedIdentitySummary(identities) {
  const providerCounts = new Map();
  identitiesFromResponse(identities).forEach((identity) => {
    const provider = providerOf(identity);
    if (!provider) return;
    providerCounts.set(provider, (providerCounts.get(provider) || 0) + 1);
  });

  const providers = Array.from(providerCounts.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([provider, count]) => ({ provider, count }));

  const identityCount = providers.reduce((sum, item) => sum + item.count, 0);
  return {
    identityCount,
    providers,
    hasKakao: (providerCounts.get("kakao") || 0) > 0,
    hasGoogle: (providerCounts.get("google") || 0) > 0,
    kakaoCount: providerCounts.get("kakao") || 0,
    googleCount: providerCounts.get("google") || 0,
  };
}

export function getGuardedKakaoUnlinkEligibility(summary, options = {}) {
  const transferCompleted = Boolean(options.transferCompleted);
  const confirmationChecked = Boolean(options.confirmationChecked);
  const blockers = [];

  if (!summary?.hasKakao) blockers.push("kakao_identity_missing");
  if (!summary?.hasGoogle) blockers.push("aux_google_missing");
  if ((summary?.identityCount || 0) < 2) blockers.push("identity_count_too_low");
  if (!transferCompleted) blockers.push("transfer_confirmation_required");
  if (!confirmationChecked) blockers.push("unlink_confirmation_required");

  return {
    canUnlink: blockers.length === 0,
    blockers,
  };
}

export function sanitizeKakaoUnlinkError(error) {
  const status = cleanText(error?.status || error?.statusCode || "");
  const name = cleanText(error?.name || "");
  const message = cleanText(error?.message || error?.error_description || error?.error || "");
  const lowered = `${name} ${message} ${status}`.toLowerCase();
  let category = "unknown";

  if (lowered.includes("session") || lowered.includes("jwt") || lowered.includes("401")) {
    category = "session";
  } else if (lowered.includes("provider") || lowered.includes("identity")) {
    category = "identity";
  } else if (lowered.includes("network") || lowered.includes("fetch")) {
    category = "network";
  }

  return { category, status, name, message };
}

async function loadIdentitySummary(authClient) {
  const response = await authClient.getUserIdentities();
  if (response?.error) throw response.error;
  const identities = identitiesFromResponse(response);
  return { identities, summary: buildSanitizedIdentitySummary(identities) };
}

export async function unlinkKakaoIdentityForAccountRecovery(authClient) {
  if (!authClient?.getUserIdentities || !authClient?.unlinkIdentity) {
    throw new Error("Auth client is not available.");
  }

  const before = await loadIdentitySummary(authClient);
  const kakaoIdentities = before.identities.filter((identity) => providerOf(identity) === "kakao");

  if (kakaoIdentities.length !== 1) {
    return {
      ok: false,
      status: "blocked",
      error: {
        category: "identity",
        status: "",
        name: "KakaoIdentityGuard",
        message: "Expected exactly one Kakao identity.",
      },
      before: before.summary,
      after: before.summary,
    };
  }

  const { error } = await authClient.unlinkIdentity(kakaoIdentities[0]);
  if (error) {
    return {
      ok: false,
      status: "error",
      error: sanitizeKakaoUnlinkError(error),
      before: before.summary,
      after: before.summary,
    };
  }

  const after = await loadIdentitySummary(authClient);
  return {
    ok: true,
    status: "success",
    before: before.summary,
    after: after.summary,
  };
}

export { REQUIRED_CONFIRMATION_TEXT };
