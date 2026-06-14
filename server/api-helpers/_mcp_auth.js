// server/api-helpers/_mcp_auth.js
// Server-side helpers for the operational PASSMAP MCP connector.
//
// What lives here:
//   - hashSecret(value)         : sha256 hex (used for both code and token)
//   - createMcpToken()          : long-lived bearer token, returned ONCE
//   - createPairingCode()       : 6-char human-typeable code, returned ONCE
//   - readBearerToken(req)      : Authorization: Bearer <...>
//   - getServiceRoleClient()    : Supabase client with SUPABASE_SERVICE_ROLE_KEY
//   - verifySupabaseAccessToken : PASSMAP web user identity (for pairing_create)
//   - verifyMcpToken            : long-lived MCP token identity (for save/search)
//   - basicRateLimit            : Upstash-backed per-key daily counter
//
// Security guarantees this file is responsible for:
//   - Plaintext code or token is NEVER written to logs or returned through
//     anything other than the very first response that creates it.
//   - SUPABASE_SERVICE_ROLE_KEY is read from process.env exclusively and is
//     never serialized into responses or log lines.
//   - user_id is taken from the verified server-side identity ONLY, never
//     from request bodies.

import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "crypto";

// --- secret generation -------------------------------------------------------

export function hashSecret(value) {
  if (typeof value !== "string" || value.length === 0) return null;
  return createHash("sha256").update(value).digest("hex");
}

const PAIRING_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L
const PAIRING_CODE_LENGTH = 6;
const PAIRING_CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const MCP_TOKEN_PREFIX = "pmcp_";
const MCP_TOKEN_RANDOM_BYTES = 24; // → 32 chars base64url
const MCP_TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

export function createPairingCode() {
  let out = "";
  const buf = randomBytes(PAIRING_CODE_LENGTH * 2);
  for (let i = 0; out.length < PAIRING_CODE_LENGTH && i < buf.length; i++) {
    out += PAIRING_CODE_ALPHABET[buf[i] % PAIRING_CODE_ALPHABET.length];
  }
  return out;
}

export function createMcpToken() {
  return MCP_TOKEN_PREFIX + randomBytes(MCP_TOKEN_RANDOM_BYTES).toString("base64url");
}

export function pairingCodeExpiry(now = Date.now()) {
  return new Date(now + PAIRING_CODE_TTL_MS).toISOString();
}

export function mcpTokenExpiry(now = Date.now()) {
  return new Date(now + MCP_TOKEN_TTL_MS).toISOString();
}

// --- request helpers ---------------------------------------------------------

export function readBearerToken(req) {
  const raw =
    req?.headers?.authorization ??
    req?.headers?.Authorization ??
    "";
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") return null;
  const parts = value.trim().split(/\s+/);
  if (parts.length !== 2) return null;
  if (parts[0].toLowerCase() !== "bearer") return null;
  return parts[1].trim() || null;
}

export function getClientIp(req) {
  const xff = req?.headers?.["x-forwarded-for"];
  const xffStr = Array.isArray(xff) ? xff[0] : (typeof xff === "string" ? xff : "");
  if (xffStr) return String(xffStr).split(",")[0].trim();
  const xri = req?.headers?.["x-real-ip"];
  if (typeof xri === "string" && xri) return xri.trim();
  return String(req?.socket?.remoteAddress || "unknown");
}

// --- supabase client ---------------------------------------------------------

let _cachedClient = null;

export function getServiceRoleClient() {
  if (_cachedClient) return _cachedClient;
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim();
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    ""
  ).trim();
  if (!url || !key) return null;
  _cachedClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _cachedClient;
}

// --- identity verification ---------------------------------------------------

/**
 * Verify a Supabase access token (PASSMAP web user) and return user.id.
 * Used by pairing_create — the user must be logged into PASSMAP web to
 * request a pairing code for themselves.
 */
export async function verifySupabaseAccessToken({ accessToken, supabase }) {
  if (!supabase) return { ok: false, status: 503, message: "Supabase not configured" };
  if (!accessToken) return { ok: false, status: 401, message: "Authorization Bearer token required" };
  try {
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data?.user?.id) {
      return { ok: false, status: 401, message: "Invalid or expired Supabase token" };
    }
    return { ok: true, userId: String(data.user.id) };
  } catch (_) {
    return { ok: false, status: 401, message: "Could not verify Supabase token" };
  }
}

/**
 * Verify a long-lived MCP bearer token by hash lookup. Returns the matched
 * pairing's user_id when active (not revoked, not expired).
 * Used by save/search endpoints (12-B2 / 12-B3 — not in this PR).
 */
export async function verifyMcpToken({ accessToken, supabase, touch = true }) {
  if (!supabase) return { ok: false, status: 503, message: "Supabase not configured" };
  if (!accessToken) return { ok: false, status: 401, message: "MCP token required" };
  const tokenHash = hashSecret(accessToken);
  if (!tokenHash) return { ok: false, status: 401, message: "MCP token required" };
  try {
    const { data, error } = await supabase
      .from("user_mcp_pairings")
      .select("id, user_id, token_expires_at, revoked_at")
      .eq("token_hash", tokenHash)
      .is("revoked_at", null)
      .limit(1)
      .maybeSingle();
    if (error || !data) {
      return { ok: false, status: 401, message: "Invalid or revoked MCP token" };
    }
    if (data.token_expires_at && new Date(data.token_expires_at).getTime() < Date.now()) {
      return { ok: false, status: 401, message: "MCP token expired" };
    }
    if (touch) {
      // Fire-and-forget; never block on the touch.
      supabase
        .from("user_mcp_pairings")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", data.id)
        .then(() => undefined, () => undefined);
    }
    return { ok: true, userId: String(data.user_id), pairingId: String(data.id) };
  } catch (_) {
    return { ok: false, status: 401, message: "Could not verify MCP token" };
  }
}

// --- rate limit (Upstash REST, mirrors server/api-helpers/_security.js shape) -

const RATE_LIMIT_TTL_SEC = 86400;

function upstashConfig() {
  const base = (process.env.UPSTASH_REDIS_REST_URL || "").trim().replace(/\/$/, "");
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || "").trim();
  if (!base || !token) return null;
  return { base, token };
}

async function upstashPost(cfg, ...parts) {
  const path = parts.map(encodeURIComponent).join("/");
  const resp = await fetch(`${cfg.base}/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.token}` },
  });
  const data = await resp.json().catch(() => null);
  return data?.result ?? null;
}

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Increment a daily counter for `key` and block when over `limit`.
 * Returns { allow: boolean, count, status?, message? }.
 * When Upstash env is missing the call is allowed (fail-open) so that
 * pairing endpoints stay usable in non-production environments — the
 * caller is expected to log a warning so this is visible in prod.
 */
export async function basicRateLimit({ key, limit }) {
  const cfg = upstashConfig();
  if (!cfg) {
    return { allow: true, count: 0, mode: "no-upstash" };
  }
  try {
    const fullKey = `mcp_rl:${key}:${todayUtc()}`;
    const count = await upstashPost(cfg, "incr", fullKey);
    if (count === 1) {
      await upstashPost(cfg, "expire", fullKey, String(RATE_LIMIT_TTL_SEC));
    }
    const n = typeof count === "number" ? count : 1;
    if (n > limit) {
      return {
        allow: false,
        count: n,
        status: 429,
        message: "Too many MCP pairing requests today. Try again tomorrow.",
      };
    }
    return { allow: true, count: n, mode: "upstash" };
  } catch (_) {
    return { allow: true, count: 0, mode: "upstash-error" };
  }
}

/**
 * Per-IP daily counter used by the unauthenticated pairing_exchange route.
 */
export function clientIpKey(req) {
  const ip = getClientIp(req);
  return "ip:" + createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

// --- generic response helpers (kept here so api/mcp.js stays thin) ----------

export function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}

export function jsonError(res, status, code, message) {
  // Deliberately terse — do NOT echo plaintext secrets or user input back.
  res.status(status).json({ ok: false, error: { code, message } });
}
