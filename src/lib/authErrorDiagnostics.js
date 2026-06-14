const REDACTED = "[redacted]";

const SENSITIVE_VALUE_PATTERNS = [
  /\b(access|refresh|id|provider|service_role|anon)?_?token=([^&\s]+)/gi,
  /\b(code|state)=([^&\s]+)/gi,
  /\b(eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)\b/g,
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
];

function cleanText(value) {
  return String(value || "")
    .slice(0, 240)
    .replace(/https?:\/\/[^\s]+/gi, REDACTED)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, REDACTED)
    .replace(/\+?\d[\d\s().-]{7,}\d/g, REDACTED)
    .replace(/\b(endpoint|p256dh|auth|destination_hash|value_normalized)=([^&\s]+)/gi, `$1=${REDACTED}`)
    .replace(SENSITIVE_VALUE_PATTERNS[0], `$1_token=${REDACTED}`)
    .replace(SENSITIVE_VALUE_PATTERNS[1], `$1=${REDACTED}`)
    .replace(SENSITIVE_VALUE_PATTERNS[2], REDACTED)
    .replace(SENSITIVE_VALUE_PATTERNS[3], REDACTED);
}

function lower(value) {
  return cleanText(value).toLowerCase();
}

export function classifyAuthLinkError(error) {
  const message = lower(error?.message || error?.error_description || error?.error);
  const name = lower(error?.name);
  const status = String(error?.status || error?.statusCode || "");
  const combined = `${message} ${name} ${status}`;

  if (
    combined.includes("session") ||
    combined.includes("jwt") ||
    combined.includes("auth session") ||
    combined.includes("not authenticated") ||
    status === "401"
  ) {
    return "session";
  }

  if (
    combined.includes("redirect") ||
    combined.includes("callback") ||
    combined.includes("url not allowed") ||
    combined.includes("not allowed") ||
    combined.includes("site url")
  ) {
    return "redirect";
  }

  if (
    combined.includes("provider") ||
    combined.includes("unsupported") ||
    combined.includes("not enabled") ||
    combined.includes("disabled") ||
    combined.includes("manual linking")
  ) {
    return "provider_config";
  }

  return "unknown";
}

export function getAuthLinkErrorUserMessage(error) {
  const category = classifyAuthLinkError(error);
  if (category === "provider_config") return "카카오 계정 연결 설정을 확인해야 합니다.";
  if (category === "redirect") return "카카오 연결 반환 주소 설정을 확인해야 합니다.";
  if (category === "session") return "로그인 세션을 다시 확인한 뒤 시도해주세요.";
  return "카카오 계정 연결을 시작하지 못했습니다. 잠시 후 다시 시도해주세요.";
}

export function sanitizeAuthLinkError(error) {
  return {
    category: classifyAuthLinkError(error),
    status: cleanText(error?.status || error?.statusCode || ""),
    name: cleanText(error?.name || ""),
    message: cleanText(error?.message || error?.error_description || error?.error || ""),
  };
}
