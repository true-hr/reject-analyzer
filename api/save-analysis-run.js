// api/save-analysis-run.js
// Multi-action Vercel function.
//
// Without ?action= this endpoint behaves exactly like the original
// save-analysis-run endpoint — same Bearer auth, same Supabase tables, same
// response shape. Existing callers (src/lib/persistence/saveAnalysisRun.js)
// do NOT pass an action and therefore are unaffected by this change.
//
// MCP pairing actions are folded in here because Vercel's Hobby plan caps
// the project at 12 Serverless Functions, and adding a standalone /api/mcp.js
// would tip the deployment over that limit. The handlers themselves are
// unchanged — they share the same secret-handling and identity guarantees
// documented in docs/mcp-pairing.md.
//
// Actions
//   (none) | save_analysis_run     → original handler (POST + Bearer)
//   mcp_health                     → MCP service heartbeat (GET, no auth)
//   mcp_pairing_create             → mint a one-time pairing code (POST,
//                                    Supabase access token required)
//   mcp_pairing_exchange           → trade a pairing code for an MCP token
//                                    (POST, no auth)
//   mcp_save_experience            → reserved (12-B2)  → 501
//   mcp_search_experiences         → reserved (12-B3)  → 501
//   mcp_pairing_revoke             → reserved (12-B5)  → 501

import { createClient } from "@supabase/supabase-js";

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
  jsonError,
} from "./_mcp_auth.js";

// ─── shared helpers (unchanged from the original save-analysis-run.js) ─────

function __s(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function __jsonObject(value, fallback = {}) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : fallback;
}

function __jsonArray(value) {
  return Array.isArray(value) ? value : [];
}

function __numOrNull(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function __getBearerToken(req) {
  const raw =
    req?.headers?.authorization ??
    req?.headers?.Authorization ??
    "";
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parts = __s(value).split(/\s+/);
  if (parts.length !== 2) return null;
  if (parts[0].toLowerCase() !== "bearer") return null;
  return __s(parts[1]) || null;
}

function __authRequired(res, message = "Authorization Bearer token required") {
  return res.status(401).json({
    ok: false,
    error: {
      code: "AUTH_REQUIRED",
      message,
    },
  });
}

function __setCorsHeaders(res) {
  // GET added so that mcp_health (a GET) is covered too; existing POST clients
  // are unaffected since the value is union of methods.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}

// ─── original handler — preserved verbatim (POST + Bearer + service_role) ──

async function handleSaveAnalysisRun(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const accessToken = __getBearerToken(req);
    if (!accessToken) {
      return __authRequired(res);
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
    const verifiedUser = authData?.user ?? null;
    const verifiedUserId = __s(verifiedUser?.id);
    if (authError || !verifiedUserId) {
      return __authRequired(res, "Invalid or expired Authorization token");
    }

    const { input, run } = req.body || {};
    const inputSafe = __jsonObject(input);
    const runSafe = __jsonObject(run);

    const inputRowData = {
      user_id: verifiedUserId,
      jd_text: __s(inputSafe?.jdText) || "",
      resume_text: __s(inputSafe?.resumeText) || "",
      company_name: __s(inputSafe?.companyName) || null,
      target_role: __s(inputSafe?.targetRole) || null,
      industry: __s(inputSafe?.industry) || null,
      stage: __s(inputSafe?.stage) || null,
      meta_json: __jsonObject(inputSafe?.metaJson),
    };

    const { data: inputRow, error: inputError } = await supabase
      .from("analysis_inputs")
      .insert(inputRowData)
      .select()
      .single();

    if (inputError) throw inputError;

    const { data: runRow, error: runError } = await supabase
      .from("analysis_runs")
      .insert({
        input_id: inputRow.id,
        user_id: verifiedUserId,
        engine_version: __s(runSafe?.engineVersion),
        status: __s(runSafe?.status) || "success",
        score: __numOrNull(runSafe?.score),
        candidate_type: __s(runSafe?.candidateType) || null,
        top_risks_json: __jsonArray(runSafe?.topRisks),
        result_json: __jsonObject(runSafe?.resultJson),
      })
      .select()
      .single();

    if (runError) throw runError;

    return res.status(200).json({
      ok: true,
      inputId: inputRow.id,
      runId: runRow.id,
    });
  } catch (err) {
    console.error("save-analysis-run error", err);
    return res.status(500).json({
      ok: false,
      error: String(err?.message || err || "save failed"),
    });
  }
}

// ─── MCP action handlers (moved from the now-removed api/mcp.js) ───────────
//
// Security invariants (unchanged from the original api/mcp.js):
//   - user_id is NEVER read from request bodies.
//   - Plaintext code / token leave the server EXACTLY once.
//   - SUPABASE_SERVICE_ROLE_KEY is read from process.env only.

const MCP_SERVICE_VERSION = "pairing-v1";
const MCP_PAIRING_CREATE_DAILY_LIMIT = 10;     // per user
const MCP_PAIRING_EXCHANGE_DAILY_LIMIT = 30;   // per IP

function _mcpSafeString(value, max = 200) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

function _mcpNormalizeClientName(value) {
  const s = _mcpSafeString(value, 80);
  return s || "unknown-client";
}

function _mcpNormalizePairingCode(value) {
  if (typeof value !== "string") return "";
  return value.trim().toUpperCase().slice(0, 32);
}

async function _mcpReadJsonBody(req) {
  if (req?.body && typeof req.body === "object" && !Array.isArray(req.body)) {
    return req.body;
  }
  if (typeof req?.body === "string") {
    try { return JSON.parse(req.body); } catch (_) { return {}; }
  }
  return {};
}

async function handleMcpHealth(req, res) {
  if (req.method !== "GET") {
    return jsonError(res, 405, "METHOD_NOT_ALLOWED", "GET required");
  }
  return res.status(200).json({
    ok: true,
    service: "passmap-mcp",
    version: MCP_SERVICE_VERSION,
  });
}

async function handleMcpPairingCreate(req, res) {
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

  // 2. Per-user daily rate limit.
  const rl = await basicRateLimit({
    key: `pairing_create:user:${verifiedUserId}`,
    limit: MCP_PAIRING_CREATE_DAILY_LIMIT,
  });
  if (!rl.allow) {
    return jsonError(res, rl.status || 429, "RATE_LIMITED", rl.message);
  }

  const body = await _mcpReadJsonBody(req);
  const clientName = _mcpNormalizeClientName(body?.clientName);

  // 3. Revoke prior active pairing entries for the same (user, client_name)
  //    that are still waiting for code exchange.
  try {
    await supabase
      .from("user_mcp_pairings")
      .update({ revoked_at: new Date().toISOString() })
      .match({ user_id: verifiedUserId, client_name: clientName })
      .is("consumed_at", null)
      .is("revoked_at", null);
  } catch (_) {
    // Non-fatal — the follow-up insert still produces a usable code.
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

async function handleMcpPairingExchange(req, res) {
  if (req.method !== "POST") {
    return jsonError(res, 405, "METHOD_NOT_ALLOWED", "POST required");
  }

  const supabase = getServiceRoleClient();
  if (!supabase) {
    return jsonError(res, 503, "SUPABASE_NOT_CONFIGURED", "Service is not configured");
  }

  // Per-IP rate limit BEFORE touching the DB — defends against code brute force.
  const rl = await basicRateLimit({
    key: `pairing_exchange:${clientIpKey(req)}`,
    limit: MCP_PAIRING_EXCHANGE_DAILY_LIMIT,
  });
  if (!rl.allow) {
    return jsonError(res, rl.status || 429, "RATE_LIMITED", rl.message);
  }

  const body = await _mcpReadJsonBody(req);
  const code = _mcpNormalizePairingCode(body?.code);
  const clientName = _mcpNormalizeClientName(body?.clientName);

  if (!code || code.length < 4) {
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

  // 2. Generic 401 for "not found / expired" — do NOT distinguish the cases.
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

// ─── dispatcher ────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    __setCorsHeaders(res);
    return res.status(200).end();
  }
  __setCorsHeaders(res);

  const action = String(req?.query?.action || "").toLowerCase();

  switch (action) {
    case "":
    case "save_analysis_run":
      return handleSaveAnalysisRun(req, res);

    case "mcp_health":
      return handleMcpHealth(req, res);
    case "mcp_pairing_create":
      return handleMcpPairingCreate(req, res);
    case "mcp_pairing_exchange":
      return handleMcpPairingExchange(req, res);

    // Reserved — implemented in 12-B2 / B3 / B5.
    case "mcp_save_experience":
    case "mcp_search_experiences":
    case "mcp_pairing_revoke":
      return jsonError(res, 501, "NOT_IMPLEMENTED", `action '${action}' is not available yet`);

    default:
      return jsonError(res, 404, "UNKNOWN_ACTION", "Unknown or missing action");
  }
}
