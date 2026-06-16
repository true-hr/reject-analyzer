import { createHash, randomBytes } from "crypto";

export const GITHUB_CONNECTION_STATE_PURPOSE = "github_app_install";
export const GITHUB_CONNECTION_STATE_STATUS = "pending";
export const GITHUB_CONNECTION_STATE_TTL_MS = 10 * 60 * 1000;
const GITHUB_CONNECTION_CALLBACK_STATE_PATTERN = /^[A-Za-z0-9_-]+$/;
const GITHUB_CONNECTION_CALLBACK_STATE_MIN_LENGTH = 40;
const GITHUB_CONNECTION_CALLBACK_STATE_MAX_LENGTH = 256;

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

export function normalizeGithubConnectionCallbackState(value) {
  const state = trimString(value);
  if (!state) return null;
  if (state.length < GITHUB_CONNECTION_CALLBACK_STATE_MIN_LENGTH) return null;
  if (state.length > GITHUB_CONNECTION_CALLBACK_STATE_MAX_LENGTH) return null;
  if (!GITHUB_CONNECTION_CALLBACK_STATE_PATTERN.test(state)) return null;
  return state;
}

export function normalizeGithubInstallationIdForCallback(value) {
  const id = trimString(value);
  if (!id) return null;
  if (!/^\d{1,20}$/.test(id)) return null;
  return id;
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

export async function readGithubConnectionStateByHash({ supabase, stateHash } = {}) {
  try {
    const { data, error } = await supabase
      .from("github_connection_states")
      .select("id, user_id, state_hash, purpose, status, return_to, expires_at")
      .eq("state_hash", stateHash)
      .eq("purpose", GITHUB_CONNECTION_STATE_PURPOSE)
      .limit(1)
      .maybeSingle();

    if (error) {
      return {
        ok: false,
        unavailable: isGithubConnectionStateUnavailableError(error),
        error,
      };
    }
    return { ok: true, row: data || null };
  } catch (error) {
    return {
      ok: false,
      unavailable: isGithubConnectionStateUnavailableError(error),
      error,
    };
  }
}

export async function consumeGithubConnectionState({
  supabase,
  row,
  userId,
  stateHash,
  now = Date.now,
  status = "consumed",
} = {}) {
  const nowIso = new Date(Number(now())).toISOString();
  const patch = status === "expired"
    ? { status: "expired", updated_at: nowIso }
    : { status: "consumed", consumed_at: nowIso, updated_at: nowIso };

  try {
    const { data, error } = await supabase
      .from("github_connection_states")
      .update(patch)
      .eq("id", row.id)
      .eq("user_id", userId)
      .eq("state_hash", stateHash)
      .eq("status", GITHUB_CONNECTION_STATE_STATUS)
      .eq("purpose", GITHUB_CONNECTION_STATE_PURPOSE)
      .select("id")
      .maybeSingle();

    if (error) {
      return {
        ok: false,
        unavailable: isGithubConnectionStateUnavailableError(error),
        error,
      };
    }
    if (!data?.id) return { ok: false, notPending: true };
    return { ok: true, status: patch.status, consumed_at: patch.consumed_at || null };
  } catch (error) {
    return {
      ok: false,
      unavailable: isGithubConnectionStateUnavailableError(error),
      error,
    };
  }
}

export async function buildGithubConnectionStateValidationResult({
  supabase,
  userId,
  state,
  now = Date.now,
} = {}) {
  const normalizedState = normalizeGithubConnectionCallbackState(state);
  if (!trimString(state)) return { ok: false, code: "github_connection_state_required" };
  if (!normalizedState) return { ok: false, code: "github_connection_state_invalid" };

  const stateHash = hashGithubConnectionState(normalizedState);
  const readResult = await readGithubConnectionStateByHash({ supabase, stateHash });
  if (!readResult.ok) return { ok: false, code: "github_connection_state_unavailable", unavailable: true };

  const row = readResult.row;
  if (!row || row.user_id !== userId) return { ok: false, code: "github_connection_state_invalid" };
  if (row.status !== GITHUB_CONNECTION_STATE_STATUS) {
    return { ok: false, code: "github_connection_state_not_pending" };
  }

  if (Date.parse(row.expires_at) <= Number(now())) {
    const expiredResult = await consumeGithubConnectionState({
      supabase,
      row,
      userId,
      stateHash,
      now,
      status: "expired",
    });
    if (!expiredResult.ok) {
      if (expiredResult.notPending) return { ok: false, code: "github_connection_state_not_pending" };
      return { ok: false, code: "github_connection_state_unavailable", unavailable: true };
    }
    return { ok: false, code: "github_connection_state_expired" };
  }

  const consumedResult = await consumeGithubConnectionState({
    supabase,
    row,
    userId,
    stateHash,
    now,
    status: "consumed",
  });
  if (!consumedResult.ok) {
    if (consumedResult.notPending) return { ok: false, code: "github_connection_state_not_pending" };
    return { ok: false, code: "github_connection_state_unavailable", unavailable: true };
  }

  return {
    ok: true,
    return_to: normalizeGithubConnectionReturnTo(row.return_to),
    consumed_at: consumedResult.consumed_at,
  };
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
