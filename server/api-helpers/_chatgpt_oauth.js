/* global Buffer, process */

import { randomBytes } from "crypto";

import {
  hashSecret,
  readBearerToken,
  getServiceRoleClient,
  verifySupabaseAccessToken,
} from "./_mcp_auth.js";

export const CHATGPT_OAUTH_SCOPE = "experience.write";
export const CHATGPT_OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
export const CHATGPT_OAUTH_CODE_TTL_MS = 10 * 60 * 1000;
export const CHATGPT_OAUTH_DEFAULT_TOKEN_TTL_SECONDS = 60 * 60;
export const CHATGPT_OAUTH_TOKEN_PREFIX = "pmgpt_";

function _s(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function _splitCsv(value) {
  return _s(value)
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function _parsePositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function _expiresAt(msFromNow, now = Date.now()) {
  return new Date(now + msFromNow).toISOString();
}

function _safeScope(scope) {
  return _s(scope)
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .join(" ");
}

export function getChatgptOAuthConfig() {
  const clientId = _s(process.env.CHATGPT_OAUTH_CLIENT_ID);
  const clientSecret = _s(process.env.CHATGPT_OAUTH_CLIENT_SECRET);
  const allowedRedirectUris = _splitCsv(process.env.CHATGPT_OAUTH_ALLOWED_REDIRECT_URIS);
  const passmapAppBaseUrl = _s(process.env.PASSMAP_APP_BASE_URL || process.env.VITE_API_BASE);
  const tokenTtlSeconds = _parsePositiveInt(
    process.env.CHATGPT_OAUTH_TOKEN_TTL_SECONDS,
    CHATGPT_OAUTH_DEFAULT_TOKEN_TTL_SECONDS
  );

  const missing = [];
  if (!clientId) missing.push("CHATGPT_OAUTH_CLIENT_ID");
  if (!clientSecret) missing.push("CHATGPT_OAUTH_CLIENT_SECRET");
  if (allowedRedirectUris.length === 0) missing.push("CHATGPT_OAUTH_ALLOWED_REDIRECT_URIS");
  if (!passmapAppBaseUrl) missing.push("PASSMAP_APP_BASE_URL");

  return {
    ok: missing.length === 0,
    missing,
    clientId,
    clientSecret,
    allowedRedirectUris,
    passmapAppBaseUrl: passmapAppBaseUrl.replace(/\/+$/, ""),
    tokenTtlSeconds,
  };
}

export function validateChatgptOAuthClient({ clientId, clientSecret, redirectUri, requireSecret = false } = {}) {
  const cfg = getChatgptOAuthConfig();
  if (!cfg.ok) {
    return { ok: false, status: 503, error: "server_error", message: "OAuth service is not configured" };
  }
  if (_s(clientId) !== cfg.clientId) {
    return { ok: false, status: 401, error: "invalid_client", message: "Invalid OAuth client" };
  }
  if (requireSecret && _s(clientSecret) !== cfg.clientSecret) {
    return { ok: false, status: 401, error: "invalid_client", message: "Invalid OAuth client" };
  }
  if (redirectUri && !cfg.allowedRedirectUris.includes(_s(redirectUri))) {
    return { ok: false, status: 400, error: "invalid_request", message: "redirect_uri is not allowed" };
  }
  return { ok: true, config: cfg };
}

export function validateChatgptOAuthScope(scope) {
  const normalized = _safeScope(scope || CHATGPT_OAUTH_SCOPE);
  if (!normalized) return { ok: true, scope: CHATGPT_OAUTH_SCOPE };
  const scopes = new Set(normalized.split(/\s+/));
  if (!scopes.has(CHATGPT_OAUTH_SCOPE) || scopes.size !== 1) {
    return { ok: false, status: 400, error: "invalid_scope", message: "Unsupported OAuth scope" };
  }
  return { ok: true, scope: CHATGPT_OAUTH_SCOPE };
}

export function generateOpaqueToken(prefix = CHATGPT_OAUTH_TOKEN_PREFIX, byteLength = 32) {
  return prefix + randomBytes(byteLength).toString("base64url");
}

export function getTokenPrefix(token) {
  const value = _s(token);
  if (!value) return null;
  return value.slice(0, Math.min(value.length, 16));
}

export function chatgptOAuthStateExpiry() {
  return _expiresAt(CHATGPT_OAUTH_STATE_TTL_MS);
}

export function chatgptOAuthCodeExpiry() {
  return _expiresAt(CHATGPT_OAUTH_CODE_TTL_MS);
}

export function chatgptOAuthAccessTokenExpiry(ttlSeconds) {
  return _expiresAt(Math.max(1, Number(ttlSeconds) || CHATGPT_OAUTH_DEFAULT_TOKEN_TTL_SECONDS) * 1000);
}

export function setOAuthCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}

export function jsonOAuthError(res, status, error, errorDescription) {
  return res.status(status).json({
    error,
    error_description: errorDescription,
  });
}

export async function readOAuthBody(req) {
  const body = req?.body;
  if (body && typeof body === "object" && !Array.isArray(body)) return body;

  const raw = typeof body === "string"
    ? body
    : Buffer.isBuffer(body)
      ? body.toString("utf8")
      : "";
  if (!raw) return {};

  const contentType = _s(req?.headers?.["content-type"] || req?.headers?.["Content-Type"]).toLowerCase();
  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(raw));
  }
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function verifyChatgptOAuthAccessToken({
  req,
  accessToken = null,
  supabase = null,
  requiredScope = CHATGPT_OAUTH_SCOPE,
  touch = true,
} = {}) {
  const db = supabase || getServiceRoleClient();
  if (!db) return { ok: false, status: 503, message: "Supabase not configured" };

  const token = _s(accessToken || readBearerToken(req));
  if (!token) return { ok: false, status: 401, message: "ChatGPT OAuth token required" };

  const tokenHash = hashSecret(token);
  if (!tokenHash) return { ok: false, status: 401, message: "ChatGPT OAuth token required" };

  try {
    const { data, error } = await db
      .from("chatgpt_oauth_access_tokens")
      .select("id, user_id, client_id, scope, expires_at, revoked_at")
      .eq("token_hash", tokenHash)
      .is("revoked_at", null)
      .limit(1)
      .maybeSingle();
    if (error || !data?.id) {
      return { ok: false, status: 401, message: "Invalid or revoked ChatGPT OAuth token" };
    }
    if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
      return { ok: false, status: 401, message: "ChatGPT OAuth token expired" };
    }

    const scopes = new Set(_safeScope(data.scope).split(/\s+/).filter(Boolean));
    if (requiredScope && !scopes.has(requiredScope)) {
      return { ok: false, status: 403, message: "ChatGPT OAuth token scope is insufficient" };
    }

    if (touch) {
      db
        .from("chatgpt_oauth_access_tokens")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", data.id)
        .then(() => undefined, () => undefined);
    }

    return {
      ok: true,
      userId: String(data.user_id),
      clientId: String(data.client_id || ""),
      scope: _safeScope(data.scope),
      authType: "chatgpt_oauth",
      tokenId: String(data.id),
    };
  } catch {
    return { ok: false, status: 401, message: "Could not verify ChatGPT OAuth token" };
  }
}

export async function verifySupabaseBearerForOAuthComplete({ req, supabase } = {}) {
  const db = supabase || getServiceRoleClient();
  const accessToken = readBearerToken(req);
  return verifySupabaseAccessToken({ accessToken, supabase: db });
}
