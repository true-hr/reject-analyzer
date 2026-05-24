// tools/passmap-mcp-prod-wrapper/lib/validate.mjs
// Dependency-free input validation for the PASSMAP prod stdio MCP wrapper.
//
// Mirrors tools/passmap-mcp-local/lib/validate.mjs and the server-side
// _validateMcpSavePayload / _validateMcpSearchPayload in
// api/save-analysis-run.js. The shapes are intentionally duplicated here:
// the wrapper validates locally so we can reject obvious bad input before
// burning an HTTPS round-trip and a Vercel function invocation, but the
// production API revalidates everything independently.
//
// rawText is NOT in the schema and is never sent to the API. Even if a
// caller stuffs `rawText` / `raw_text` into the payload, the API will
// ignore it (12-B2 rawText-not-stored invariant).

export const ALLOWED_SOURCE_PLATFORMS = ["chatgpt", "gemini", "claude", "manual", "unknown"];
export const SEARCH_LIMIT_DEFAULT = 5;
export const SEARCH_LIMIT_MAX = 10;

const _ALLOWED_SOURCE_SET = new Set(ALLOWED_SOURCE_PLATFORMS);

function _str(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function _strArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => (typeof v === "string" ? v.trim() : String(v ?? "").trim()))
    .filter((v) => v.length > 0);
}

export function validateSavePayload(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
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
  const sourcePlatform = _ALLOWED_SOURCE_SET.has(rawPlatform) ? rawPlatform : "unknown";
  const sourceConversationTitle = _str(input.sourceConversationTitle);

  // rawText / raw_text are deliberately dropped here — they MUST NOT travel
  // over the wire to the production API.
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

export function validateSearchPayload(input = {}) {
  if (input != null && (typeof input !== "object" || Array.isArray(input))) {
    return { ok: false, errorCode: "INVALID_INPUT", message: "Input must be an object." };
  }
  const safe = input || {};
  const query = _str(safe.query);
  const skills = _strArray(safe.skills);
  const jobTags = _strArray(safe.jobTags);
  const industryTags = _strArray(safe.industryTags);
  let limit = Number(safe.limit);
  if (!Number.isFinite(limit) || limit <= 0) limit = SEARCH_LIMIT_DEFAULT;
  if (limit > SEARCH_LIMIT_MAX) limit = SEARCH_LIMIT_MAX;
  return { ok: true, normalized: { query, skills, jobTags, industryTags, limit } };
}
