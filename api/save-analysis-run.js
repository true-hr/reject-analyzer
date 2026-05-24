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
//   mcp_save_experience            → persist an experience candidate via the
//                                    MCP wrapper (POST, MCP token required)
//   mcp_search_experiences         → search a user's saved experience cards
//                                    via the MCP wrapper (POST, MCP token
//                                    required)
//   mcp_pairing_list               → list the caller's MCP pairings — never
//                                    returns code_hash / token_hash or
//                                    plaintext secrets (POST, Supabase
//                                    access token required)
//   mcp_pairing_revoke             → soft-revoke a single pairing the caller
//                                    owns and clear its hashes (POST,
//                                    Supabase access token required)

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
  verifyMcpToken,
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

// ─── MCP experience save / search (12-B2) ─────────────────────────────────
//
// Identity contract:
//   - Both endpoints REQUIRE a long-lived MCP bearer token issued by
//     mcp_pairing_exchange. verifyMcpToken() returns the verified user_id
//     and pairing_id; user_id is never read from the request body.
//   - The token is hashed once for lookup; no plaintext token ever reaches
//     a log line or the response body of these handlers.
//
// Storage contract for save:
//   - raw_sources.raw_text is ALWAYS stored as null. Only short, user-
//     visible evidenceTexts (passed in via the MCP wrapper) are persisted
//     into experience_evidence.evidence_text — the full conversation is
//     never copied to PASSMAP.
//   - metadata.rawTextStored = false marks rows so future audits can
//     verify the invariant in-place.

const MCP_SUMMARY_MAX = 280;
const MCP_SEARCH_FETCH_CAP = 50; // pre-filter window before JS narrowing

const _MCP_ALLOWED_SOURCE_PLATFORMS = new Set([
  "chatgpt",
  "gemini",
  "claude",
  "manual",
  "unknown",
]);

const _MCP_SEARCH_LIMIT_DEFAULT = 5;
const _MCP_SEARCH_LIMIT_MAX = 10;

function _mcpStr(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function _mcpStrArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => (typeof v === "string" ? v.trim() : String(v ?? "").trim()))
    .filter((v) => v.length > 0);
}

// Mirrors tools/passmap-mcp-local/lib/validate.mjs::validateSavePayload but is
// re-declared here on purpose — Vercel serverless functions should not import
// from tools/** (different dependency graph, packaging surface, lifecycle).
function _validateMcpSavePayload(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, errorCode: "INVALID_INPUT", message: "Input must be an object." };
  }

  const title = _mcpStr(input.title);
  if (title.length < 2) {
    return {
      ok: false,
      errorCode: "TITLE_TOO_SHORT",
      message: "title은 필수이며 최소 2자 이상이어야 합니다.",
    };
  }

  const situation = _mcpStr(input.situation);
  const task = _mcpStr(input.task);
  const actions = _mcpStrArray(input.actions);
  if (!situation && !task && actions.length === 0) {
    return {
      ok: false,
      errorCode: "MISSING_CORE_FIELD",
      message: "situation, task, actions 중 최소 한 개는 채워야 합니다.",
    };
  }

  const evidenceTexts = _mcpStrArray(input.evidenceTexts);
  const skills = _mcpStrArray(input.skills);
  const jobTags = _mcpStrArray(input.jobTags);
  const industryTags = _mcpStrArray(input.industryTags);
  const riskNotes = _mcpStrArray(input.riskNotes);
  const resultCandidate = _mcpStr(input.resultCandidate);

  const rawPlatform = _mcpStr(input.sourcePlatform).toLowerCase();
  const sourcePlatform = _MCP_ALLOWED_SOURCE_PLATFORMS.has(rawPlatform) ? rawPlatform : "unknown";
  const sourceConversationTitle = _mcpStr(input.sourceConversationTitle);

  // rawText / raw_text are deliberately ignored even if the caller sends them.

  return {
    ok: true,
    normalized: {
      title,
      situation,
      task,
      actions,
      resultCandidate,
      skills,
      jobTags,
      industryTags,
      evidenceTexts,
      riskNotes,
      sourcePlatform,
      sourceConversationTitle,
    },
  };
}

function _validateMcpSearchPayload(input) {
  if (input != null && (typeof input !== "object" || Array.isArray(input))) {
    return { ok: false, errorCode: "INVALID_INPUT", message: "Input must be an object." };
  }
  const safe = input || {};
  const query = _mcpStr(safe.query);
  const skills = _mcpStrArray(safe.skills);
  const jobTags = _mcpStrArray(safe.jobTags);
  const industryTags = _mcpStrArray(safe.industryTags);
  let limit = Number(safe.limit);
  if (!Number.isFinite(limit) || limit <= 0) limit = _MCP_SEARCH_LIMIT_DEFAULT;
  if (limit > _MCP_SEARCH_LIMIT_MAX) limit = _MCP_SEARCH_LIMIT_MAX;
  return { ok: true, normalized: { query, skills, jobTags, industryTags, limit } };
}

function _mcpBuildSummary({ situation, task, actions, resultCandidate }) {
  const parts = [];
  if (situation) parts.push(situation);
  if (task) parts.push(task);
  if (parts.length === 0 && Array.isArray(actions) && actions.length > 0) {
    parts.push(actions.slice(0, 2).join(" · "));
  }
  if (resultCandidate) parts.push(resultCandidate);
  const text = parts.join(" / ");
  if (text.length <= MCP_SUMMARY_MAX) return text;
  return text.slice(0, MCP_SUMMARY_MAX - 1) + "…";
}

function _mcpJsonArrayLike(value) {
  // experience_cards stores array-like fields as jsonb; older rows may surface
  // as null or as an object. Normalize to a plain array for the response.
  if (Array.isArray(value)) return value;
  return [];
}

function _mcpSuggestedUse(card) {
  const tags = [
    ..._mcpJsonArrayLike(card.job_tags),
    ..._mcpJsonArrayLike(card.industry_tags),
    ..._mcpJsonArrayLike(card.skills),
  ].filter((t) => typeof t === "string" && t.length > 0);
  if (tags.length === 0) {
    return "이 경험의 활용 방향은 아직 명확하지 않습니다. 직무·산업 태그를 보강해 보세요.";
  }
  const preview = tags.slice(0, 3).join(", ");
  return `이 경험은 ${preview} 관련 이력서·면접 문항에 활용할 수 있습니다.`;
}

function _mcpMatchesAllTags(itemTags, queryTags) {
  if (!Array.isArray(queryTags) || queryTags.length === 0) return true;
  const haystack = new Set(
    _mcpJsonArrayLike(itemTags)
      .map((t) => (typeof t === "string" ? t.toLowerCase() : ""))
      .filter((t) => t.length > 0)
  );
  return queryTags.every((t) => haystack.has(String(t).toLowerCase()));
}

function _mcpMatchesFreeText(card, queryLower) {
  if (!queryLower) return true;
  const evidenceTexts = Array.isArray(card.__evidenceTexts) ? card.__evidenceTexts : [];
  const buckets = [
    card.title,
    card.situation,
    card.task,
    card.suggested_resume_bullet,
    ..._mcpJsonArrayLike(card.actions),
    ..._mcpJsonArrayLike(card.skills),
    ..._mcpJsonArrayLike(card.job_tags),
    ..._mcpJsonArrayLike(card.industry_tags),
    ..._mcpJsonArrayLike(card.risk_notes),
    ...evidenceTexts,
  ];
  for (const v of buckets) {
    if (typeof v === "string" && v.toLowerCase().includes(queryLower)) return true;
  }
  return false;
}

async function handleMcpSaveExperience(req, res) {
  if (req.method !== "POST") {
    return jsonError(res, 405, "METHOD_NOT_ALLOWED", "POST required");
  }

  const supabase = getServiceRoleClient();
  if (!supabase) {
    return jsonError(res, 503, "SUPABASE_NOT_CONFIGURED", "Service is not configured");
  }

  const accessToken = readBearerToken(req);
  const identity = await verifyMcpToken({ accessToken, supabase });
  if (!identity.ok) {
    return jsonError(res, identity.status || 401, "AUTH_REQUIRED", identity.message);
  }
  const verifiedUserId = identity.userId;
  const pairingId = identity.pairingId;

  const body = await _mcpReadJsonBody(req);
  const validated = _validateMcpSavePayload(body);
  if (!validated.ok) {
    return jsonError(res, 400, validated.errorCode, validated.message);
  }

  const n = validated.normalized;
  const summary = _mcpBuildSummary({
    situation: n.situation,
    task: n.task,
    actions: n.actions,
    resultCandidate: n.resultCandidate,
  });

  let rawSource;
  try {
    const { data, error } = await supabase
      .from("raw_sources")
      .insert({
        user_id: verifiedUserId,
        source_type: "ai_conversation",
        source_label: `${n.sourcePlatform || "unknown"}:${n.sourceConversationTitle || "MCP"}`,
        detected_period: null,
        raw_text: null,
        file_url: null,
        file_name: null,
        mime_type: null,
        summary: summary || null,
        processing_status: "completed",
        metadata: {
          importMethod: "mcp_save_experience",
          sourcePlatform: n.sourcePlatform,
          sourceConversationTitle: n.sourceConversationTitle || null,
          pairingId,
          rawTextStored: false,
        },
      })
      .select("id")
      .single();
    if (error || !data?.id) {
      console.error("[mcp] save_experience raw_sources insert failed:", error?.message || "unknown");
      return jsonError(res, 500, "SAVE_FAILED", "Could not save experience candidate");
    }
    rawSource = data;
  } catch (err) {
    console.error("[mcp] save_experience raw_sources unexpected:", err?.message || "unknown");
    return jsonError(res, 500, "SAVE_FAILED", "Could not save experience candidate");
  }

  let card;
  try {
    const { data, error } = await supabase
      .from("experience_cards")
      .insert({
        user_id: verifiedUserId,
        source_id: rawSource.id,
        work_record_id: null,
        title: n.title,
        situation: n.situation || null,
        task: n.task || null,
        actions: n.actions,
        result: n.resultCandidate ? { candidate: n.resultCandidate } : {},
        collaboration: {},
        skills: n.skills,
        job_tags: n.jobTags,
        industry_tags: n.industryTags,
        resume_potential: "medium",
        confidence_level: n.evidenceTexts.length > 0 ? "medium" : "low",
        suggested_resume_bullet: null,
        missing_info_questions: [],
        risk_notes: n.riskNotes,
        differ_reason: null,
        status: "accepted",
        metadata: {
          importMethod: "mcp_save_experience",
          sourcePlatform: n.sourcePlatform,
          sourceConversationTitle: n.sourceConversationTitle || null,
          pairingId,
        },
      })
      .select("id, created_at, title")
      .single();
    if (error || !data?.id) {
      console.error("[mcp] save_experience experience_cards insert failed:", error?.message || "unknown");
      return jsonError(res, 500, "SAVE_FAILED", "Could not save experience candidate");
    }
    card = data;
  } catch (err) {
    console.error("[mcp] save_experience experience_cards unexpected:", err?.message || "unknown");
    return jsonError(res, 500, "SAVE_FAILED", "Could not save experience candidate");
  }

  let evidenceCount = 0;
  if (n.evidenceTexts.length > 0) {
    try {
      const rows = n.evidenceTexts.map((evidence_text) => ({
        user_id: verifiedUserId,
        experience_card_id: card.id,
        source_id: rawSource.id,
        evidence_text,
        evidence_type: "quote",
        source_offset_start: null,
        source_offset_end: null,
        metadata: { importMethod: "mcp_save_experience" },
      }));
      const { error } = await supabase.from("experience_evidence").insert(rows);
      if (error) {
        // Card + source already exist; surface a soft warning but keep the
        // success response so the user does not lose their save. The card
        // itself can still be browsed without evidence rows.
        console.error("[mcp] save_experience evidence insert failed:", error.message);
      } else {
        evidenceCount = rows.length;
      }
    } catch (err) {
      console.error("[mcp] save_experience evidence unexpected:", err?.message || "unknown");
    }
  }

  return res.status(200).json({
    ok: true,
    experienceId: card.id,
    sourceId: rawSource.id,
    evidenceCount,
    message: "경험 후보를 PASSMAP에 저장했습니다.",
    saved: {
      id: card.id,
      title: card.title,
      summary,
      skills: n.skills,
      jobTags: n.jobTags,
      industryTags: n.industryTags,
      evidenceTexts: n.evidenceTexts,
      createdAt: card.created_at,
    },
  });
}

async function handleMcpSearchExperiences(req, res) {
  if (req.method !== "POST") {
    return jsonError(res, 405, "METHOD_NOT_ALLOWED", "POST required");
  }

  const supabase = getServiceRoleClient();
  if (!supabase) {
    return jsonError(res, 503, "SUPABASE_NOT_CONFIGURED", "Service is not configured");
  }

  const accessToken = readBearerToken(req);
  const identity = await verifyMcpToken({ accessToken, supabase });
  if (!identity.ok) {
    return jsonError(res, identity.status || 401, "AUTH_REQUIRED", identity.message);
  }
  const verifiedUserId = identity.userId;

  const body = await _mcpReadJsonBody(req);
  const validated = _validateMcpSearchPayload(body);
  if (!validated.ok) {
    return jsonError(res, 400, validated.errorCode, validated.message);
  }
  const { query, skills, jobTags, industryTags, limit } = validated.normalized;

  // 1. Load a recency-bounded window for this user. raw_text is never read.
  let cards;
  try {
    const { data, error } = await supabase
      .from("experience_cards")
      .select(
        "id, title, situation, task, actions, skills, job_tags, industry_tags, " +
          "suggested_resume_bullet, risk_notes, status, created_at"
      )
      .eq("user_id", verifiedUserId)
      .order("created_at", { ascending: false })
      .limit(MCP_SEARCH_FETCH_CAP);
    if (error) {
      console.error("[mcp] search_experiences cards failed:", error.message);
      return jsonError(res, 500, "SEARCH_FAILED", "Could not search experiences");
    }
    cards = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("[mcp] search_experiences cards unexpected:", err?.message || "unknown");
    return jsonError(res, 500, "SEARCH_FAILED", "Could not search experiences");
  }

  // 2. Pull evidence for the fetched cards in one shot (filtered by user_id
  //    as a belt-and-suspenders check on top of the experience_card_id FK).
  const cardIds = cards.map((c) => c.id);
  const evidenceByCard = new Map();
  if (cardIds.length > 0) {
    try {
      const { data, error } = await supabase
        .from("experience_evidence")
        .select("experience_card_id, evidence_text")
        .eq("user_id", verifiedUserId)
        .in("experience_card_id", cardIds);
      if (error) {
        console.error("[mcp] search_experiences evidence failed:", error.message);
      } else if (Array.isArray(data)) {
        for (const row of data) {
          const cid = row?.experience_card_id;
          const text = typeof row?.evidence_text === "string" ? row.evidence_text : "";
          if (!cid || !text) continue;
          const list = evidenceByCard.get(cid) || [];
          list.push(text);
          evidenceByCard.set(cid, list);
        }
      }
    } catch (err) {
      console.error("[mcp] search_experiences evidence unexpected:", err?.message || "unknown");
    }
  }

  // 3. Filter in JS to keep the SQL simple and safe (no pg_trgm dependency).
  const queryLower = query ? query.toLowerCase() : "";
  const matched = [];
  for (const card of cards) {
    card.__evidenceTexts = evidenceByCard.get(card.id) || [];
    if (!_mcpMatchesFreeText(card, queryLower)) continue;
    if (!_mcpMatchesAllTags(card.skills, skills)) continue;
    if (!_mcpMatchesAllTags(card.job_tags, jobTags)) continue;
    if (!_mcpMatchesAllTags(card.industry_tags, industryTags)) continue;
    matched.push(card);
    if (matched.length >= limit) break;
  }

  const items = matched.map((card) => ({
    id: card.id,
    title: card.title,
    summary: _mcpBuildSummary({
      situation: card.situation,
      task: card.task,
      actions: _mcpJsonArrayLike(card.actions),
      resultCandidate: "",
    }),
    skills: _mcpJsonArrayLike(card.skills),
    jobTags: _mcpJsonArrayLike(card.job_tags),
    industryTags: _mcpJsonArrayLike(card.industry_tags),
    suggestedUse: _mcpSuggestedUse(card),
    evidenceTexts: card.__evidenceTexts,
    createdAt: card.created_at,
  }));

  return res.status(200).json({
    ok: true,
    count: items.length,
    items,
  });
}

// ─── MCP pairing list / revoke (12-B5-A) ──────────────────────────────────
//
// Identity contract (both actions):
//   - Authorization: Bearer <Supabase access token> for the PASSMAP web
//     user who owns the pairing rows. MCP tokens are NOT accepted — a user
//     who has lost their token must still be able to revoke it.
//   - body.user_id / body.userId are ignored on purpose; the only trusted
//     user identifier is identity.userId from verifySupabaseAccessToken.
//   - Hashes (code_hash, token_hash) and plaintext secrets are never read
//     back to the client.

const _MCP_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function _mcpPairingStatus(row, nowMs) {
  if (row?.revoked_at) return "revoked";
  const tokenExpMs = row?.token_expires_at ? new Date(row.token_expires_at).getTime() : null;
  if (tokenExpMs !== null && Number.isFinite(tokenExpMs) && tokenExpMs < nowMs) return "expired";
  if (row?.consumed_at) return "active";
  const codeExpMs = row?.code_expires_at ? new Date(row.code_expires_at).getTime() : null;
  if (codeExpMs !== null && Number.isFinite(codeExpMs) && codeExpMs > nowMs) return "pending";
  return "inactive";
}

async function handleMcpPairingList(req, res) {
  if (req.method !== "POST") {
    return jsonError(res, 405, "METHOD_NOT_ALLOWED", "POST required");
  }

  const supabase = getServiceRoleClient();
  if (!supabase) {
    return jsonError(res, 503, "SUPABASE_NOT_CONFIGURED", "Service is not configured");
  }

  const accessToken = readBearerToken(req);
  const identity = await verifySupabaseAccessToken({ accessToken, supabase });
  if (!identity.ok) {
    return jsonError(res, identity.status || 401, "AUTH_REQUIRED", identity.message);
  }
  const verifiedUserId = identity.userId;

  let rows;
  try {
    // NOTE: code_hash / token_hash are deliberately NOT selected — they
    // must never appear in the response, even by accident.
    const { data, error } = await supabase
      .from("user_mcp_pairings")
      .select(
        "id, client_name, created_at, consumed_at, last_used_at, " +
          "revoked_at, token_expires_at, code_expires_at"
      )
      .eq("user_id", verifiedUserId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[mcp] pairing_list select failed:", error.message);
      return jsonError(res, 500, "LIST_FAILED", "Could not list pairings");
    }
    rows = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("[mcp] pairing_list unexpected:", err?.message || "unknown");
    return jsonError(res, 500, "LIST_FAILED", "Could not list pairings");
  }

  const nowMs = Date.now();
  const items = rows.map((row) => ({
    id: row.id,
    clientName: row.client_name || null,
    status: _mcpPairingStatus(row, nowMs),
    createdAt: row.created_at || null,
    connectedAt: row.consumed_at || null,
    lastUsedAt: row.last_used_at || null,
    tokenExpiresAt: row.token_expires_at || null,
    revokedAt: row.revoked_at || null,
    codeExpiresAt: row.code_expires_at || null,
  }));

  return res.status(200).json({ ok: true, items });
}

async function handleMcpPairingRevoke(req, res) {
  if (req.method !== "POST") {
    return jsonError(res, 405, "METHOD_NOT_ALLOWED", "POST required");
  }

  const supabase = getServiceRoleClient();
  if (!supabase) {
    return jsonError(res, 503, "SUPABASE_NOT_CONFIGURED", "Service is not configured");
  }

  const accessToken = readBearerToken(req);
  const identity = await verifySupabaseAccessToken({ accessToken, supabase });
  if (!identity.ok) {
    return jsonError(res, identity.status || 401, "AUTH_REQUIRED", identity.message);
  }
  const verifiedUserId = identity.userId;

  const body = await _mcpReadJsonBody(req);
  // body.user_id / body.userId are intentionally NOT read — trusted user
  // id comes only from the verified Supabase token above.
  const pairingId = _mcpStr(body?.pairingId);
  if (!pairingId || !_MCP_UUID_RE.test(pairingId)) {
    return jsonError(res, 400, "INVALID_PAIRING_ID", "pairingId must be a UUID string");
  }

  // 1. Ownership check. Forces the row to belong to verifiedUserId before
  //    any mutation runs — protects against IDOR.
  let existing;
  try {
    const { data, error } = await supabase
      .from("user_mcp_pairings")
      .select("id, revoked_at")
      .eq("id", pairingId)
      .eq("user_id", verifiedUserId)
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("[mcp] pairing_revoke lookup failed:", error.message);
      return jsonError(res, 500, "REVOKE_FAILED", "Could not revoke pairing");
    }
    existing = data;
  } catch (err) {
    console.error("[mcp] pairing_revoke lookup unexpected:", err?.message || "unknown");
    return jsonError(res, 500, "REVOKE_FAILED", "Could not revoke pairing");
  }

  if (!existing) {
    return jsonError(res, 404, "PAIRING_NOT_FOUND", "Pairing not found for the current user");
  }

  // 2. Idempotent: if already revoked, do not overwrite the original
  //    revoked_at — just confirm ok.
  if (existing.revoked_at) {
    return res.status(200).json({
      ok: true,
      revoked: true,
      pairingId,
      alreadyRevoked: true,
    });
  }

  // 3. Soft-revoke and clear ALL hashes / expiries so the token (and any
  //    still-pending code) can never authenticate again. Constrained by
  //    id + user_id so a stale request cannot affect another user's row.
  try {
    const { error } = await supabase
      .from("user_mcp_pairings")
      .update({
        revoked_at: new Date().toISOString(),
        code_hash: null,
        code_expires_at: null,
        token_hash: null,
        token_expires_at: null,
      })
      .eq("id", pairingId)
      .eq("user_id", verifiedUserId);
    if (error) {
      console.error("[mcp] pairing_revoke update failed:", error.message);
      return jsonError(res, 500, "REVOKE_FAILED", "Could not revoke pairing");
    }
  } catch (err) {
    console.error("[mcp] pairing_revoke update unexpected:", err?.message || "unknown");
    return jsonError(res, 500, "REVOKE_FAILED", "Could not revoke pairing");
  }

  return res.status(200).json({ ok: true, revoked: true, pairingId });
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
    case "mcp_save_experience":
      return handleMcpSaveExperience(req, res);
    case "mcp_search_experiences":
      return handleMcpSearchExperiences(req, res);
    case "mcp_pairing_list":
      return handleMcpPairingList(req, res);
    case "mcp_pairing_revoke":
      return handleMcpPairingRevoke(req, res);

    default:
      return jsonError(res, 404, "UNKNOWN_ACTION", "Unknown or missing action");
  }
}
