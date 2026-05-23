// tools/passmap-mcp-local/lib/validate.mjs
// Pure validation helpers for the local PASSMAP MCP demo.
// Intentionally dependency-free so self-test.mjs can run without npm install.

export const ALLOWED_SOURCE_PLATFORMS = new Set([
  "chatgpt",
  "gemini",
  "claude",
  "manual",
  "unknown",
]);

export const SEARCH_LIMIT_DEFAULT = 5;
export const SEARCH_LIMIT_MAX = 10;

function _strArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => (typeof v === "string" ? v.trim() : String(v ?? "").trim()))
    .filter((v) => v.length > 0);
}

function _str(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

/**
 * Validate and normalize a save_experience_candidate input.
 * Returns { ok: true, normalized } or { ok: false, errorCode, message }.
 *
 * Rules:
 *   - title: required, >= 2 chars after trim
 *   - at least one of situation / task / actions[] must be present
 *   - evidenceTexts must be an array if provided
 *   - sourcePlatform: allowed values, else 'unknown'
 *   - rawText is NEVER read from input (defense in depth: caller may not
 *     pass it accidentally and have it persisted)
 */
export function validateSavePayload(input) {
  if (!input || typeof input !== "object") {
    return { ok: false, errorCode: "INVALID_INPUT", message: "Input must be an object." };
  }

  const title = _str(input.title);
  if (title.length < 2) {
    return {
      ok: false,
      errorCode: "TITLE_TOO_SHORT",
      message: "title은 필수이며 최소 2자 이상이어야 합니다.",
    };
  }

  const situation = _str(input.situation);
  const task = _str(input.task);
  const actions = _strArray(input.actions);
  if (!situation && !task && actions.length === 0) {
    return {
      ok: false,
      errorCode: "MISSING_CORE_FIELD",
      message: "situation, task, actions 중 최소 한 개는 채워야 합니다.",
    };
  }

  const evidenceTexts = _strArray(input.evidenceTexts);
  const skills = _strArray(input.skills);
  const jobTags = _strArray(input.jobTags);
  const industryTags = _strArray(input.industryTags);
  const riskNotes = _strArray(input.riskNotes);
  const resultCandidate = _str(input.resultCandidate);

  const rawPlatform = _str(input.sourcePlatform).toLowerCase();
  const sourcePlatform = ALLOWED_SOURCE_PLATFORMS.has(rawPlatform) ? rawPlatform : "unknown";
  const sourceConversationTitle = _str(input.sourceConversationTitle);

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
      source: {
        type: "ai_conversation",
        platform: sourcePlatform,
        conversationTitle: sourceConversationTitle || null,
      },
    },
  };
}

/**
 * Validate and normalize a search_experience_candidates input.
 * Returns { ok: true, normalized } or { ok: false, ... }.
 */
export function validateSearchPayload(input = {}) {
  if (input && typeof input !== "object") {
    return { ok: false, errorCode: "INVALID_INPUT", message: "Input must be an object." };
  }
  const query = _str(input.query);
  const skills = _strArray(input.skills);
  const jobTags = _strArray(input.jobTags);
  const industryTags = _strArray(input.industryTags);
  let limit = Number(input.limit);
  if (!Number.isFinite(limit) || limit <= 0) limit = SEARCH_LIMIT_DEFAULT;
  if (limit > SEARCH_LIMIT_MAX) limit = SEARCH_LIMIT_MAX;
  return {
    ok: true,
    normalized: { query, skills, jobTags, industryTags, limit },
  };
}
