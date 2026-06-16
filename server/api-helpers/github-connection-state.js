import { createHash, randomBytes } from "crypto";

export const GITHUB_CONNECTION_STATE_PURPOSE = "github_app_install";
export const GITHUB_CONNECTION_STATE_STATUS = "pending";
export const GITHUB_CONNECTION_STATE_TTL_MS = 10 * 60 * 1000;

function trimString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function generateGithubConnectionState({ randomBytesFn = randomBytes } = {}) {
  return randomBytesFn(32).toString("base64url");
}

export function hashGithubConnectionState(state) {
  const value = trimString(state);
  if (!value) throw new Error("state is required");
  return createHash("sha256").update(value).digest("hex");
}

export function normalizeGithubConnectionReturnTo(value) {
  const path = trimString(value);
  if (!path || path.length > 1024) return null;
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  if (/[\x00-\x1F\x7F]/.test(path)) return null;
  const lower = path.toLowerCase();
  if (lower.startsWith("/javascript:") || lower.startsWith("/data:")) return null;
  return path;
}

export function buildGithubConnectionStateRecord({
  userId,
  state,
  returnTo = null,
  now = Date.now,
  ttlMs = GITHUB_CONNECTION_STATE_TTL_MS,
} = {}) {
  const user_id = trimString(userId);
  if (!user_id) throw new Error("verified userId is required");
  const createdAtMs = Number(now());
  const expiresAt = new Date(createdAtMs + ttlMs).toISOString();

  return {
    user_id,
    state_hash: hashGithubConnectionState(state),
    purpose: GITHUB_CONNECTION_STATE_PURPOSE,
    status: GITHUB_CONNECTION_STATE_STATUS,
    return_to: normalizeGithubConnectionReturnTo(returnTo),
    expires_at: expiresAt,
  };
}

export function isGithubConnectionStateUnavailableError(error) {
  const code = trimString(error?.code).toUpperCase();
  if (["42P01", "PGRST205", "PGRST202"].includes(code)) return true;
  const message = trimString(error?.message).toLowerCase();
  return message.includes("github_connection_states") || message.includes("schema cache");
}

export async function createGithubConnectionState({
  supabase,
  userId,
  returnTo = null,
  now = Date.now,
  ttlMs = GITHUB_CONNECTION_STATE_TTL_MS,
  generateState = generateGithubConnectionState,
} = {}) {
  const state = generateState();
  const record = buildGithubConnectionStateRecord({ userId, state, returnTo, now, ttlMs });

  try {
    const { error } = await supabase
      .from("github_connection_states")
      .insert(record);

    if (error) {
      return {
        ok: false,
        unavailable: isGithubConnectionStateUnavailableError(error),
        error,
      };
    }

    return {
      ok: true,
      state,
      expires_at: record.expires_at,
    };
  } catch (error) {
    return {
      ok: false,
      unavailable: isGithubConnectionStateUnavailableError(error),
      error,
    };
  }
}
