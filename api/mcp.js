// api/mcp.js
// Single-file Vercel function for the operational PASSMAP MCP connector.
// All MCP-related HTTP traffic flows through this entry point with an
// `?action=` query so that the project stays within Vercel Hobby's
// 12-function limit (same pattern as api/p1-analysis.js).
//
// Actions implemented in this PR (12-B1):
//   GET  ?action=health             — service heartbeat, no auth
//   POST ?action=pairing_create     — Supabase access token required; mints
//                                     a one-time pairing code
//   POST ?action=pairing_exchange   — no auth; trades a pairing code for a
//                                     long-lived MCP bearer token
//
// Reserved for follow-up batches (return 501 until shipped):
//   POST ?action=save_experience       (12-B2)
//   POST ?action=search_experiences    (12-B3)
//   POST ?action=pairing_revoke        (12-B5)
//
// Security invariants
//   - user_id is NEVER taken from the request body. It comes from:
//       pairing_create   → Supabase access token → auth.getUser(...).id
//       pairing_exchange → matched user_mcp_pairings row's user_id
//   - Plaintext code/token leave the server EXACTLY once: in the response
//     that just created them. They are NEVER logged.
//   - service_role key is read from process.env only and never echoed.
//   - The DB migration (supabase/sql/20260523_user_mcp_pairings.sql) is
//     Protected — until it is applied manually, both pairing endpoints will
//     fail at the Supabase insert step. The health action stays functional.

import {
  hashSecret,
  createMcpToken,
  createPairingCode,
  pairingCodeExpiry,
  mcpTokenExpiry,
  readBearerToken,
  getServiceRoleClient,
  verifySupabaseAccessToken,
  basicRateLimit,
  clientIpKey,
  setCors,
  jsonError,
} from "./_mcp_auth.js";

const SERVICE_VERSION = "pairing-v1";

// Per-day quotas. Tunable later from env without code change if needed.
const PAIRING_CREATE_DAILY_LIMIT = 10;     // per user
const PAIRING_EXCHANGE_DAILY_LIMIT = 30;   // per IP

function _safeString(value, max = 200) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

function _normalizeClientName(value) {
  const s = _safeString(value, 80);
  return s || "unknown-client";
}

function _normalizePairingCode(value) {
  // Pairing codes are uppercase alphanumeric in our alphabet; normalize lightly.
  if (typeof value !== "string") return "";
  return value.trim().toUpperCase().slice(0, 32);
}

async function _readJsonBody(req) {
  // Vercel parses JSON bodies into req.body when the content-type is JSON.
  // Be defensive in case the runtime hands us a string.
  if (req?.body && typeof req.body === "object" && !Array.isArray(req.body)) {
    return req.body;
  }
  if (typeof req?.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (_) {
      return {};
    }
  }
  return {};
}

// --- action: health ----------------------------------------------------------

async function handleHealth(req, res) {
  if (req.method !== "GET") {
    return jsonError(res, 405, "METHOD_NOT_ALLOWED", "GET required");
  }
  return res.status(200).json({
    ok: true,
    service: "passmap-mcp",
    version: SERVICE_VERSION,
  });
}

// --- action: pairing_create --------------------------------------------------

async function handlePairingCreate(req, res) {
  if (req.method !== "POST") {
    return jsonError(res, 405, "METHOD_NOT_ALLOWED", "POST required");
  }

  const supabase = getServiceRoleClient();
  if (!supabase) {
    return jsonError(res, 503, "SUPABASE_NOT_CONFIGURED", "Service is not configured");
  }

  // 1. Verify the PASSMAP web caller's identity from the Supabase access token.
  const accessToken = readBearerToken(req);
  const identity = await verifySupabaseAccessToken({ accessToken, supabase });
  if (!identity.ok) {
    return jsonError(res, identity.status || 401, "AUTH_REQUIRED", identity.message);
  }
  const verifiedUserId = identity.userId;

  // 2. Per-user rate limit.
  const rl = await basicRateLimit({
    key: `pairing_create:user:${verifiedUserId}`,
    limit: PAIRING_CREATE_DAILY_LIMIT,
  });
  if (!rl.allow) {
    return jsonError(res, rl.status || 429, "RATE_LIMITED", rl.message);
  }

  const body = await _readJsonBody(req);
  const clientName = _normalizeClientName(body?.clientName);

  // 3. Revoke prior active pairing entries for the same (user, client_name)
  //    that are still waiting for code exchange. This keeps "one active code
  //    per client" simple, prevents stale codes piling up, and avoids the
  //    edge case where two codes could race for the same client.
  try {
    await supabase
      .from("user_mcp_pairings")
      .update({ revoked_at: new Date().toISOString() })
      .match({ user_id: verifiedUserId, client_name: clientName })
      .is("consumed_at", null)
      .is("revoked_at", null);
  } catch (_) {
    // Non-fatal: a follow-up insert still produces a usable code.
  }

  // 4. Mint a fresh code, persist its hash, return the plaintext exactly once.
  const code = createPairingCode();
  const codeHash = hashSecret(code);
  const codeExpiresAt = pairingCodeExpiry();

  try {
    const { error } = await supabase.from("user_mcp_pairings").insert({
      user_id: verifiedUserId,
      code_hash: codeHash,
      code_expires_at: codeExpiresAt,
      client_name: clientName,
    });
    if (error) {
      // Surface a generic error to the client; never leak service_role detail.
      console.error("[mcp] pairing_create insert failed:", error.message);
      return jsonError(res, 500, "PAIRING_CREATE_FAILED", "Could not issue a pairing code");
    }
  } catch (err) {
    console.error("[mcp] pairing_create unexpected:", err?.message || "unknown");
    return jsonError(res, 500, "PAIRING_CREATE_FAILED", "Could not issue a pairing code");
  }

  return res.status(200).json({
    ok: true,
    code, // plaintext returned ONCE, immediately to the authenticated caller
    expiresAt: codeExpiresAt,
    clientName,
  });
}

// --- action: pairing_exchange ------------------------------------------------

async function handlePairingExchange(req, res) {
  if (req.method !== "POST") {
    return jsonError(res, 405, "METHOD_NOT_ALLOWED", "POST required");
  }

  const supabase = getServiceRoleClient();
  if (!supabase) {
    return jsonError(res, 503, "SUPABASE_NOT_CONFIGURED", "Service is not configured");
  }

  // Per-IP rate limit BEFORE touching the DB — defends against code brute
  // forcing even when the env is otherwise misconfigured.
  const rl = await basicRateLimit({
    key: `pairing_exchange:${clientIpKey(req)}`,
    limit: PAIRING_EXCHANGE_DAILY_LIMIT,
  });
  if (!rl.allow) {
    return jsonError(res, rl.status || 429, "RATE_LIMITED", rl.message);
  }

  const body = await _readJsonBody(req);
  const code = _normalizePairingCode(body?.code);
  const clientName = _normalizeClientName(body?.clientName);

  if (!code || code.length < 4) {
    // Deliberately vague — do not reveal length / charset specifics to clients.
    return jsonError(res, 400, "INVALID_CODE", "Pairing code is missing or malformed");
  }

  const codeHash = hashSecret(code);

  // 1. Find an active row matching this code_hash.
  let pairing = null;
  try {
    const { data, error } = await supabase
      .from("user_mcp_pairings")
      .select("id, user_id, code_expires_at, consumed_at, revoked_at")
      .eq("code_hash", codeHash)
      .is("consumed_at", null)
      .is("revoked_at", null)
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("[mcp] pairing_exchange lookup failed:", error.message);
      return jsonError(res, 500, "EXCHANGE_FAILED", "Could not verify pairing code");
    }
    pairing = data;
  } catch (err) {
    console.error("[mcp] pairing_exchange unexpected:", err?.message || "unknown");
    return jsonError(res, 500, "EXCHANGE_FAILED", "Could not verify pairing code");
  }

  // 2. Generic 401 for "not found / expired" — do NOT tell the client which.
  if (!pairing) {
    return jsonError(res, 401, "INVALID_CODE", "Pairing code is invalid or expired");
  }
  if (pairing.code_expires_at && new Date(pairing.code_expires_at).getTime() < Date.now()) {
    return jsonError(res, 401, "INVALID_CODE", "Pairing code is invalid or expired");
  }

  // 3. Mint a long-lived MCP token, persist its hash, clear the code_hash.
  const token = createMcpToken();
  const tokenHash = hashSecret(token);
  const tokenExpiresAt = mcpTokenExpiry();
  const nowIso = new Date().toISOString();

  try {
    const { error } = await supabase
      .from("user_mcp_pairings")
      .update({
        token_hash: tokenHash,
        token_expires_at: tokenExpiresAt,
        consumed_at: nowIso,
        code_hash: null, // ensure the code cannot be replayed even by hash
        code_expires_at: null,
        client_name: clientName,
      })
      .eq("id", pairing.id)
      .is("consumed_at", null) // optimistic lock — refuses to overwrite a race
      .is("revoked_at", null);
    if (error) {
      console.error("[mcp] pairing_exchange update failed:", error.message);
      return jsonError(res, 500, "EXCHANGE_FAILED", "Could not exchange pairing code");
    }
  } catch (err) {
    console.error("[mcp] pairing_exchange update unexpected:", err?.message || "unknown");
    return jsonError(res, 500, "EXCHANGE_FAILED", "Could not exchange pairing code");
  }

  return res.status(200).json({
    ok: true,
    token, // plaintext returned ONCE — the wrapper must persist this securely
    tokenExpiresAt,
    clientName,
  });
}

// --- dispatcher --------------------------------------------------------------

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    setCors(res);
    return res.status(200).end();
  }
  setCors(res);

  const action = String(req?.query?.action || "").toLowerCase();

  switch (action) {
    case "health":
      return handleHealth(req, res);
    case "pairing_create":
      return handlePairingCreate(req, res);
    case "pairing_exchange":
      return handlePairingExchange(req, res);

    // Reserved — implemented in 12-B2 / B3 / B5.
    case "save_experience":
    case "search_experiences":
    case "pairing_revoke":
      return jsonError(res, 501, "NOT_IMPLEMENTED", `action '${action}' is not available yet`);

    default:
      return jsonError(res, 404, "UNKNOWN_ACTION", "Unknown or missing action");
  }
}
