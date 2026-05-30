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
export const DEFAULT_SOURCE_PLATFORM = "claude";
export const EVIDENCE_TEXT_MAX_ITEMS = 3;
export const EVIDENCE_TEXT_MAX_LENGTH = 260;
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

function _trimEvidenceText(value) {
  const text = typeof value === "string" ? value.trim() : String(value ?? "").trim();
  if (!text) return "";
  if (text.length <= EVIDENCE_TEXT_MAX_LENGTH) return text;
  const sliced = text.slice(0, EVIDENCE_TEXT_MAX_LENGTH).trimEnd();
  const lastBoundary = Math.max(
    sliced.lastIndexOf("."),
    sliced.lastIndexOf("!"),
    sliced.lastIndexOf("?"),
    sliced.lastIndexOf("。"),
    sliced.lastIndexOf("다."),
    sliced.lastIndexOf("요.")
  );
  if (lastBoundary >= Math.floor(EVIDENCE_TEXT_MAX_LENGTH * 0.55)) {
    return sliced.slice(0, lastBoundary + 1).trim();
  }
  return `${sliced.replace(/[,\s;:]+$/, "")}...`;
}

function _evidenceTextArray(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const result = [];
  for (const item of value) {
    const text = _trimEvidenceText(item);
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(text);
    if (result.length >= EVIDENCE_TEXT_MAX_ITEMS) break;
  }
  return result;
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

  const evidenceTexts = _evidenceTextArray(input.evidenceTexts);
  const skills = _strArray(input.skills);
  const jobTags = _strArray(input.jobTags);
  const industryTags = _strArray(input.industryTags);
  const riskNotes = _strArray(input.riskNotes);
  const resultCandidate = _str(input.resultCandidate);

  const rawPlatform = _str(input.sourcePlatform).toLowerCase();
  const sourcePlatform = rawPlatform
    ? (_ALLOWED_SOURCE_SET.has(rawPlatform) ? rawPlatform : "unknown")
    : DEFAULT_SOURCE_PLATFORM;
  const sourceConversationTitle = _str(input.sourceConversationTitle);

  // rawText / raw_text are deliberately dropped here — they MUST NOT travel
  // over the wire to the production API.
  // evidenceTexts keeps only short user-spoken snippets, never full transcripts.
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
