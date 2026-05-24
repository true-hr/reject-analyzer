// tools/passmap-mcp-prod-wrapper/lib/apiClient.mjs
// HTTPS client for the PASSMAP production MCP endpoints.
//
// Endpoints (see api/save-analysis-run.js, 12-B2):
//   POST ${API_BASE}/api/save-analysis-run?action=mcp_save_experience
//   POST ${API_BASE}/api/save-analysis-run?action=mcp_search_experiences
//
// Auth: Authorization: Bearer ${PASSMAP_MCP_TOKEN}
//
// URL policy (CLAUDE.md "Operating URL Policy"):
//   - PASSMAP_API_BASE MUST point at the Vercel API host.
//   - GitHub Pages (https://true-hr.github.io/reject-analyzer/) serves only
//     the static frontend bundle and has no /api/* routes.
//   - A malformed override falls back to the canonical Vercel host rather
//     than producing an invalid URL.
//
// Secret hygiene:
//   - The token plaintext is never logged or echoed. apiBase + a boolean
//     "tokenPresent" is the only diagnostic this module emits.
//   - Network errors and non-2xx HTTP responses are returned as structured
//     { ok: false, errorCode, message } envelopes; nothing about
//     Authorization headers is included in the output.

import { validateSavePayload, validateSearchPayload } from "./validate.mjs";

const DEFAULT_API_BASE = "https://reject-analyzer.vercel.app";
const SAVE_ACTION = "mcp_save_experience";
const SEARCH_ACTION = "mcp_search_experiences";
const REQUEST_TIMEOUT_MS = 30000;

// Reject PASSMAP_API_BASE overrides that point at the GitHub Pages frontend
// instead of the Vercel API host. GitHub Pages serves only the static
// bundle — there is no /api/* there — so an override like
// `https://true-hr.github.io/reject-analyzer` would make every tool call
// 404. The Pages base path `/reject-analyzer` is also rejected on any
// host as defense in depth.
function _evaluateApiBaseOverride(rawBase) {
  let parsed;
  try {
    parsed = new URL(rawBase);
  } catch (_) {
    return { apiBase: DEFAULT_API_BASE, apiBaseSource: "ignored-malformed" };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { apiBase: DEFAULT_API_BASE, apiBaseSource: "ignored-malformed" };
  }
  const hostname = (parsed.hostname || "").toLowerCase();
  if (hostname === "github.io" || hostname.endsWith(".github.io")) {
    return { apiBase: DEFAULT_API_BASE, apiBaseSource: "ignored-github-pages" };
  }
  const pathLower = (parsed.pathname || "").toLowerCase();
  if (pathLower === "/reject-analyzer" || pathLower.startsWith("/reject-analyzer/")) {
    return { apiBase: DEFAULT_API_BASE, apiBaseSource: "ignored-github-pages" };
  }
  return { apiBase: rawBase.replace(/\/+$/, ""), apiBaseSource: "env" };
}

export function getConfig() {
  const rawBase = (process.env.PASSMAP_API_BASE || "").trim();
  let apiBase = DEFAULT_API_BASE;
  let apiBaseSource = "default";
  if (rawBase) {
    const evaluated = _evaluateApiBaseOverride(rawBase);
    apiBase = evaluated.apiBase;
    apiBaseSource = evaluated.apiBaseSource;
  }
  const tokenPresent = Boolean((process.env.PASSMAP_MCP_TOKEN || "").trim());
  return { apiBase, apiBaseSource, tokenPresent };
}

export function buildActionUrl(action) {
  const { apiBase } = getConfig();
  return `${apiBase}/api/save-analysis-run?action=${encodeURIComponent(action)}`;
}

function _missingTokenError() {
  return {
    ok: false,
    errorCode: "PASSMAP_MCP_TOKEN_MISSING",
    message:
      "PASSMAP_MCP_TOKEN 환경변수가 필요합니다. PASSMAP에서 pairing code를 발급한 뒤 token으로 교환해 설정하세요.",
  };
}

function _wrapNetworkError(err) {
  const msg = String(err?.message || err || "");
  if (err?.name === "AbortError" || /aborted/i.test(msg)) {
    return {
      ok: false,
      errorCode: "REQUEST_TIMEOUT",
      message: `PASSMAP API 응답이 ${REQUEST_TIMEOUT_MS / 1000}초 안에 도착하지 않았습니다.`,
    };
  }
  return {
    ok: false,
    errorCode: "NETWORK_ERROR",
    message: `PASSMAP API에 연결하지 못했습니다: ${msg || "unknown"}`,
  };
}

function _wrapApiResult({ status, ok, data }, fallbackErrorCode) {
  if (ok && data && data.ok === true) return data;

  const apiError =
    data && typeof data.error === "object" && data.error ? data.error : null;
  const errorCode =
    apiError?.code ||
    (data && data.errorCode) ||
    fallbackErrorCode ||
    "API_ERROR";
  const message =
    apiError?.message ||
    (data && data.message) ||
    `PASSMAP API 요청이 실패했습니다 (HTTP ${status}).`;
  return {
    ok: false,
    errorCode,
    message,
    httpStatus: status,
  };
}

async function _safeReadJson(resp) {
  try {
    return await resp.json();
  } catch (_) {
    return null;
  }
}

// @MX:ANCHOR: [AUTO] callPassmapApi — central HTTPS forwarder for MCP wrapper
// @MX:REASON: All save/search calls funnel through here; token-missing short-circuits
// without network IO; structured envelope guarantees no Authorization header
// leaks into the returned payload.
export async function callPassmapApi(action, body) {
  const token = (process.env.PASSMAP_MCP_TOKEN || "").trim();
  if (!token) return _missingTokenError();

  const url = buildActionUrl(action);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body ?? {}),
      signal: controller.signal,
    });
    const data = await _safeReadJson(resp);
    return _wrapApiResult(
      { status: resp.status, ok: resp.ok, data },
      action === SAVE_ACTION ? "SAVE_FAILED" : "SEARCH_FAILED"
    );
  } catch (err) {
    return _wrapNetworkError(err);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function saveExperienceCandidate(input) {
  // Local pre-validation: catch obvious bad input without burning a Vercel
  // invocation. The production API revalidates regardless.
  const v = validateSavePayload(input);
  if (!v.ok) {
    return { ok: false, errorCode: v.errorCode, message: v.message };
  }
  return callPassmapApi(SAVE_ACTION, v.normalized);
}

export async function searchExperienceCandidates(input) {
  const v = validateSearchPayload(input || {});
  if (!v.ok) {
    return { ok: false, errorCode: v.errorCode, message: v.message };
  }
  return callPassmapApi(SEARCH_ACTION, v.normalized);
}

export const _internals = {
  DEFAULT_API_BASE,
  SAVE_ACTION,
  SEARCH_ACTION,
  REQUEST_TIMEOUT_MS,
};
