// src/lib/mcp/mcpPairingClient.js
// Thin client for the PASSMAP MCP pairing management endpoints (12-B5-A).
//
// Endpoints
//   POST ${VITE_API_BASE}/api/save-analysis-run?action=mcp_pairing_create
//   POST ${VITE_API_BASE}/api/save-analysis-run?action=mcp_pairing_list
//   POST ${VITE_API_BASE}/api/save-analysis-run?action=mcp_pairing_revoke
//
// Security invariants (mirrored from CLAUDE.md "Operating URL Policy" and
// docs/mcp-pairing.md):
//   - API base MUST be the absolute Vercel host. GitHub Pages serves only
//     the static frontend and has no /api/* routes — calling a relative
//     /api/... path here would 404 in production.
//   - Authorization comes from getSession() (Supabase access token).
//   - body.user_id / body.userId are NEVER sent — the server derives the
//     user from the verified access token.
//   - This module never logs token values and never handles pmcp_ MCP
//     tokens (pairing_exchange is not called from the web).

import { getSession } from "../auth.js";

const SAVE_ANALYSIS_RUN_PATH = "/api/save-analysis-run";

function _resolveApiBase() {
  const raw = (import.meta.env.VITE_API_BASE || "").toString().trim();
  if (!raw) {
    const err = new Error(
      "VITE_API_BASE 환경변수가 설정되어 있지 않습니다. PASSMAP API 호출을 진행할 수 없습니다."
    );
    err.code = "VITE_API_BASE_MISSING";
    throw err;
  }
  if (!/^https?:\/\//i.test(raw)) {
    const err = new Error(
      "VITE_API_BASE는 절대 URL이어야 합니다 (https://reject-analyzer.vercel.app)."
    );
    err.code = "VITE_API_BASE_INVALID";
    throw err;
  }
  return raw.replace(/\/+$/, "");
}

async function _resolveAccessToken() {
  let session = null;
  try {
    session = await getSession();
  } catch (_) {
    session = null;
  }
  const token =
    session && typeof session.access_token === "string"
      ? session.access_token.trim()
      : "";
  if (!token) {
    const err = new Error("로그인 후 MCP 연결을 관리할 수 있습니다.");
    err.code = "AUTH_REQUIRED";
    throw err;
  }
  return token;
}

function _safeJsonAsync(resp) {
  return resp.json().catch(() => null);
}

function _pickErrorMessage(data, status, fallbackMessage) {
  if (data && typeof data === "object") {
    const err = data.error;
    if (err && typeof err === "object") {
      if (typeof err.message === "string" && err.message) return err.message;
    } else if (typeof err === "string" && err) {
      return err;
    }
    if (typeof data.message === "string" && data.message) return data.message;
  }
  return `${fallbackMessage} (HTTP ${status})`;
}

async function _postAction(action, body, { fallbackMessage }) {
  const apiBase = _resolveApiBase();
  const accessToken = await _resolveAccessToken();
  const url = `${apiBase}${SAVE_ANALYSIS_RUN_PATH}?action=${encodeURIComponent(action)}`;

  let resp;
  try {
    resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body ?? {}),
    });
  } catch (networkErr) {
    const err = new Error("PASSMAP API에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.");
    err.code = "NETWORK_ERROR";
    err.cause = networkErr;
    throw err;
  }

  const data = await _safeJsonAsync(resp);
  if (!resp.ok || !data || data.ok !== true) {
    const message = _pickErrorMessage(data, resp.status, fallbackMessage);
    const code =
      (data && data.error && typeof data.error === "object" && data.error.code) ||
      (data && data.errorCode) ||
      "REQUEST_FAILED";
    const err = new Error(message);
    err.code = code;
    err.httpStatus = resp.status;
    throw err;
  }
  return data;
}

// ── public API ──────────────────────────────────────────────────────────

/**
 * List the caller's MCP pairings.
 * Returns: { ok: true, items: Array<{
 *   id, clientName, status, createdAt, connectedAt, lastUsedAt,
 *   tokenExpiresAt, revokedAt, codeExpiresAt
 * }> }
 *
 * code_hash / token_hash / plaintext token are never present in the
 * response (server side does not select them).
 */
export async function listMcpPairings() {
  const data = await _postAction(
    "mcp_pairing_list",
    {},
    { fallbackMessage: "MCP 연결 목록을 불러오지 못했습니다." }
  );
  const items = Array.isArray(data.items) ? data.items : [];
  return { ok: true, items };
}

/**
 * Mint a new one-time pairing code. Returns the 6-char plaintext code
 * once. The code is auto-revoked after 10 minutes or upon exchange.
 *
 * NOTE: this does NOT return an MCP token. pairing_exchange is performed
 * by the wrapper, not by the web panel.
 */
export async function createMcpPairing({ clientName = "Claude Desktop" } = {}) {
  const data = await _postAction(
    "mcp_pairing_create",
    { clientName },
    { fallbackMessage: "연결 코드를 발급하지 못했습니다." }
  );
  return {
    ok: true,
    code: typeof data.code === "string" ? data.code : "",
    expiresAt: data.expiresAt || null,
    clientName: data.clientName || clientName,
  };
}

/**
 * Soft-revoke a pairing the caller owns.
 * Idempotent at the API level (already-revoked rows still return ok).
 */
export async function revokeMcpPairing({ pairingId } = {}) {
  if (!pairingId || typeof pairingId !== "string") {
    const err = new Error("폐기할 연결 ID가 올바르지 않습니다.");
    err.code = "INVALID_PAIRING_ID";
    throw err;
  }
  const data = await _postAction(
    "mcp_pairing_revoke",
    { pairingId },
    { fallbackMessage: "MCP 연결을 폐기하지 못했습니다." }
  );
  return {
    ok: true,
    pairingId: data.pairingId || pairingId,
    alreadyRevoked: Boolean(data.alreadyRevoked),
  };
}
