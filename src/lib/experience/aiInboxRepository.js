// src/lib/experience/aiInboxRepository.js
// PASSMAP 12-C1 — AI 작업기록 Inbox read-only repository.
//
// Goal:
//   Surface experience_cards saved via the MCP save_experience action
//   (Claude Code / ChatGPT / Gemini / Claude / Manual / Unknown) so the
//   PASSMAP web user can review them.
//
// Invariants (must be preserved by any future patch):
//   - We query Supabase directly using the authenticated anon client.
//     Row-level security (auth.uid() = user_id, see
//     supabase/sql/20260515_experience_cards_schema.sql lines 79-97,
//     162-182, 229-249) is the only authorization gate. We must therefore
//     never read these tables with a service-role key from the browser.
//   - body / select payloads NEVER carry user_id or userId. The owner is
//     derived from the Supabase access token by Postgres via auth.uid().
//   - raw_sources.raw_text is NEVER included in the select column list.
//     MCP-imported rows always carry raw_text = null (api/save-analysis-run.js
//     line 619 + docs/mcp-pairing.md section 3-A) but historical
//     work_trace-origin rows in raw_sources DO carry raw_text, and we are
//     intentionally only surfacing MCP-origin rows here.
//   - Filtering is restricted to MCP-origin rows by matching the canonical
//     metadata.importMethod = "mcp_save_experience" tag that the MCP save
//     handler stamps on both raw_sources and experience_cards
//     (api/save-analysis-run.js lines 626, 670).

import { supabase } from "../supabaseClient.js";

const MCP_IMPORT_METHOD = "mcp_save_experience";

const ALLOWED_PLATFORMS = new Set([
  "all",
  "chatgpt",
  "gemini",
  "claude",
  "manual",
  "unknown",
]);

function _toArray(value) {
  return Array.isArray(value) ? value : [];
}

function _toStringOrNull(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s.length > 0 ? s : null;
}

function _normalizeItem(row) {
  const cardMeta = row?.metadata && typeof row.metadata === "object" ? row.metadata : {};
  const source = row?.raw_sources && typeof row.raw_sources === "object" ? row.raw_sources : {};
  const sourceMeta = source?.metadata && typeof source.metadata === "object" ? source.metadata : {};

  const sourcePlatform =
    _toStringOrNull(cardMeta.sourcePlatform) ||
    _toStringOrNull(sourceMeta.sourcePlatform) ||
    "unknown";

  const sourceConversationTitle =
    _toStringOrNull(cardMeta.sourceConversationTitle) ||
    _toStringOrNull(sourceMeta.sourceConversationTitle);

  const evidenceTexts = _toArray(row?.experience_evidence)
    .map((ev) => _toStringOrNull(ev?.evidence_text))
    .filter(Boolean);

  return {
    id: row?.id || "",
    title: _toStringOrNull(row?.title) || "제목 없는 경험",
    sourcePlatform: sourcePlatform.toLowerCase(),
    sourceConversationTitle,
    sourceLabel: _toStringOrNull(source?.source_label),
    createdAt: row?.created_at || null,
    status: _toStringOrNull(row?.status) || "accepted",
    summary: _toStringOrNull(source?.summary),
    situation: _toStringOrNull(row?.situation),
    task: _toStringOrNull(row?.task),
    actions: _toArray(row?.actions),
    skills: _toArray(row?.skills),
    jobTags: _toArray(row?.job_tags),
    industryTags: _toArray(row?.industry_tags),
    riskNotes: _toArray(row?.risk_notes),
    evidenceTexts,
  };
}

// SELECT column lists — kept narrow on purpose so raw_sources.raw_text is
// not pulled into the browser. Do NOT add raw_text here.
const SOURCE_COLUMNS = "id, source_label, summary, metadata, source_type, created_at";
const EVIDENCE_COLUMNS = "evidence_text, evidence_type";
const CARD_COLUMNS = [
  "id",
  "title",
  "situation",
  "task",
  "actions",
  "status",
  "created_at",
  "skills",
  "job_tags",
  "industry_tags",
  "risk_notes",
  "metadata",
  "source_id",
  `raw_sources!inner(${SOURCE_COLUMNS})`,
  `experience_evidence(${EVIDENCE_COLUMNS})`,
].join(", ");

/**
 * List MCP-imported experience cards for the current authenticated user.
 *
 * Authorization: handled by Supabase RLS (auth.uid() = user_id). No
 * user_id is sent in the request payload.
 *
 * @param {{ limit?: number, offset?: number, platform?: string }} options
 * @returns {Promise<{ items: object[], hasMore: boolean }>}
 */
export async function listAiInboxExperiences({
  limit = 30,
  offset = 0,
  platform = "all",
} = {}) {
  if (!supabase) {
    const err = new Error(
      "Supabase 클라이언트가 설정되어 있지 않아 AI 작업기록 Inbox를 불러올 수 없습니다."
    );
    err.code = "SUPABASE_NOT_CONFIGURED";
    throw err;
  }

  const safeLimit = Math.max(1, Math.min(Number(limit) || 30, 100));
  const safeOffset = Math.max(0, Number(offset) || 0);
  const requestedPlatform =
    typeof platform === "string" ? platform.toLowerCase() : "all";
  const safePlatform = ALLOWED_PLATFORMS.has(requestedPlatform)
    ? requestedPlatform
    : "all";

  let query = supabase
    .from("experience_cards")
    .select(CARD_COLUMNS)
    .eq("status", "accepted")
    // metadata.importMethod equality on jsonb text. PostgREST supports
    // the metadata->>importMethod=eq.<v> shorthand via .eq("metadata->>importMethod", v).
    .eq("metadata->>importMethod", MCP_IMPORT_METHOD)
    .order("created_at", { ascending: false })
    .range(safeOffset, safeOffset + safeLimit - 1);

  if (safePlatform !== "all") {
    query = query.eq("metadata->>sourcePlatform", safePlatform);
  }

  const { data, error } = await query;
  if (error) {
    const err = new Error(error.message || "AI 작업기록을 불러오지 못했습니다.");
    err.code = "INBOX_LIST_FAILED";
    err.cause = error;
    throw err;
  }

  const rows = Array.isArray(data) ? data : [];
  const items = rows.map(_normalizeItem);
  const hasMore = items.length === safeLimit;
  return { items, hasMore };
}

export const __TEST_ONLY__ = {
  ALLOWED_PLATFORMS,
  MCP_IMPORT_METHOD,
  CARD_COLUMNS,
  _normalizeItem,
};
