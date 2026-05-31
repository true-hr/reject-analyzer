// src/lib/experience/aiInboxRepository.js
// PASSMAP 12-C1 — AI 작업기록 Inbox read-only repository.
//
// Goal:
//   Surface experience_cards saved via MCP (save_experience action),
//   ChatGPT Actions, OR PASSMAP work_trace paste import so the web user can
//   review them.
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
//     line 619 + docs/mcp-pairing.md section 3-A). raw_text MUST stay
//     excluded even as work_trace-origin rows (which do carry raw_text) are
//     now surfaced here.
//   - Filtering selects three origin classes via an OR filter:
//       (a) MCP: metadata.importMethod = "mcp_save_experience"
//       (b) ChatGPT Actions: metadata.importMethod = "chatgpt_action_save_experience"
//       (c) work_trace paste: metadata.source = "work_trace_paste_import"
//           (backward-compatible: catches old cards stamped before importMethod
//           was added to the work_trace save path).

import { supabase } from "../supabaseClient.js";

const MCP_IMPORT_METHOD = "mcp_save_experience";
const CHATGPT_ACTION_IMPORT_METHOD = "chatgpt_action_save_experience";
const WORK_TRACE_IMPORT_METHODS = [
  "manual_paste_or_txt",
  "browser_extension_current_conversation",
  "browser_extension_selection",
];
const WORK_TRACE_SOURCE = "work_trace_paste_import";
const ALLOWED_ORIGIN_FILTER = [
  `metadata->>importMethod.eq.${MCP_IMPORT_METHOD}`,
  `metadata->>importMethod.eq.${CHATGPT_ACTION_IMPORT_METHOD}`,
  ...WORK_TRACE_IMPORT_METHODS.map((method) => `metadata->>importMethod.eq.${method}`),
  `metadata->>source.eq.${WORK_TRACE_SOURCE}`,
].join(",");

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

function _isPassmapAiConversation({ cardMeta, source, sourceMeta }) {
  return (
    cardMeta.sourceMode === "ai_conversation" ||
    sourceMeta.sourceMode === "ai_conversation" ||
    source.source_type === "ai_conversation"
  );
}

function _normalizeItem(row) {
  const cardMeta = row?.metadata && typeof row.metadata === "object" ? row.metadata : {};
  const source = row?.raw_sources && typeof row.raw_sources === "object" ? row.raw_sources : {};
  const sourceMeta = source?.metadata && typeof source.metadata === "object" ? source.metadata : {};
  const workRecord = row?.work_records && typeof row.work_records === "object" ? row.work_records : {};
  const isPassmapAiConversation = _isPassmapAiConversation({ cardMeta, source, sourceMeta });

  const sourcePlatform =
    isPassmapAiConversation
      ? "passmap_ai"
      : _toStringOrNull(cardMeta.sourcePlatform) ||
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
    sourceUrl: _toStringOrNull(cardMeta.sourceUrl) || _toStringOrNull(sourceMeta.sourceUrl),
    sourceTitle: _toStringOrNull(cardMeta.sourceTitle) || _toStringOrNull(sourceMeta.sourceTitle),
    captureQuality: _toStringOrNull(cardMeta.captureQuality) || _toStringOrNull(sourceMeta.captureQuality),
    messageCount: Number(cardMeta.messageCount ?? sourceMeta.messageCount ?? 0) || 0,
    analysisVersion: _toStringOrNull(cardMeta.analysisVersion) || _toStringOrNull(sourceMeta.analysisVersion),
    sourceLabel: _toStringOrNull(source?.source_label),
    createdAt: row?.created_at || null,
    updatedAt: row?.updated_at || null,
    recordDate: _toStringOrNull(workRecord?.record_date),
    workRecordId: _toStringOrNull(row?.work_record_id),
    isPassmapAiConversation,
    status: _toStringOrNull(row?.status) || "accepted",
    suggestedResumeBullet: _toStringOrNull(row?.suggested_resume_bullet),
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
const WORK_RECORD_COLUMNS = "record_date";
const CARD_COLUMNS = [
  "id",
  "title",
  "situation",
  "task",
  "actions",
  "status",
  "created_at",
  "updated_at",
  "work_record_id",
  "suggested_resume_bullet",
  "skills",
  "job_tags",
  "industry_tags",
  "risk_notes",
  "metadata",
  "source_id",
  `raw_sources!inner(${SOURCE_COLUMNS})`,
  `work_records(${WORK_RECORD_COLUMNS})`,
  `experience_evidence(${EVIDENCE_COLUMNS})`,
].join(", ");

// 12-C2-B — Inbox(accepted)와 이력서 재료함(converted) 양쪽이 공유하는 내부 헬퍼.
// archived는 의도적으로 제외한다 (보관함은 별도 단계로 다룬다).
const ALLOWED_LIST_STATUSES = new Set(["accepted", "converted"]);

async function _listAiInboxExperiencesByStatus({
  limit = 30,
  offset = 0,
  platform = "all",
  status = "accepted",
} = {}) {
  if (!supabase) {
    const err = new Error(
      "Supabase 클라이언트가 설정되어 있지 않아 AI 작업기록을 불러올 수 없습니다."
    );
    err.code = "SUPABASE_NOT_CONFIGURED";
    throw err;
  }

  const safeStatus =
    typeof status === "string" && ALLOWED_LIST_STATUSES.has(status)
      ? status
      : "accepted";
  const safeLimit = Math.max(1, Math.min(Number(limit) || 30, 100));
  const safeOffset = Math.max(0, Number(offset) || 0);
  const requestedPlatform =
    typeof platform === "string" ? platform.toLowerCase() : "all";
  const safePlatform = ALLOWED_PLATFORMS.has(requestedPlatform)
    ? requestedPlatform
    : "all";

  // converted는 사용자가 확정한 시점(updated_at)에 정렬하는 것이 자연스럽다.
  // accepted는 기존 12-C1 동작과 동일하게 created_at desc 유지.
  const orderColumn = safeStatus === "converted" ? "updated_at" : "created_at";

  let query = supabase
    .from("experience_cards")
    .select(CARD_COLUMNS)
    .eq("status", safeStatus)
    // Accept MCP-saved, ChatGPT Action-saved, and work_trace paste-import cards.
    // The source fallback keeps older work_trace rows visible before importMethod existed.
    .or(ALLOWED_ORIGIN_FILTER)
    .order(orderColumn, { ascending: false })
    .range(safeOffset, safeOffset + safeLimit - 1);

  if (safePlatform !== "all") {
    query =
      safePlatform === "manual"
        ? query.or(
            `metadata->>sourcePlatform.eq.manual,metadata->>source.eq.${WORK_TRACE_SOURCE}`
          )
        : query.eq("metadata->>sourcePlatform", safePlatform);
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

/**
 * List MCP-imported experience cards (status="accepted") for the Inbox tab.
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
  return _listAiInboxExperiencesByStatus({
    limit,
    offset,
    platform,
    status: "accepted",
  });
}

/**
 * List MCP-imported experience cards (status="converted") for the
 * "이력서 재료함" tab. 12-C2-A에서 사용자가 "이력서 재료로 확정" 처리한
 * 항목을 다시 확인할 수 있도록 제공한다. 삭제/되돌리기/편집은 이번 범위가
 * 아니며 read-only로 표시한다.
 *
 * Authorization: handled by Supabase RLS (auth.uid() = user_id). No
 * user_id is sent in the request payload.
 *
 * @param {{ limit?: number, offset?: number, platform?: string }} options
 * @returns {Promise<{ items: object[], hasMore: boolean }>}
 */
export async function listAiResumeMaterialExperiences({
  limit = 30,
  offset = 0,
  platform = "all",
} = {}) {
  return _listAiInboxExperiencesByStatus({
    limit,
    offset,
    platform,
    status: "converted",
  });
}

// 12-C2-A — 상태 변경 (archived / converted) 액션.
// 삭제는 의도적으로 제외. 권한은 RLS에 위임하며 user_id를 payload에 싣지 않는다.
const ALLOWED_STATUS_UPDATES = new Set(["archived", "converted"]);

function _hasAllowedInboxOrigin(metadata) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return false;
  }
  return (
    metadata.importMethod === MCP_IMPORT_METHOD ||
    metadata.importMethod === CHATGPT_ACTION_IMPORT_METHOD ||
    WORK_TRACE_IMPORT_METHODS.includes(metadata.importMethod) ||
    metadata.source === WORK_TRACE_SOURCE
  );
}

/**
 * Update the status of an MCP-imported experience card.
 *
 * Authorization: handled by Supabase RLS (auth.uid() = user_id). The id is
 * the only client-supplied locator; user_id is never sent. The card is
 * pre-selected and checked in JS so the PATCH request does not rely on
 * PostgREST JSON OR filters.
 *
 * @param {{ id: string, status: "archived" | "converted" }} params
 * @returns {Promise<{ id: string, status: string } | { ok: false, error: string, code: string }>}
 */
export async function updateAiInboxExperienceStatus({ id, status } = {}) {
  if (!supabase) {
    const err = new Error(
      "Supabase 클라이언트가 설정되어 있지 않아 상태를 변경할 수 없습니다."
    );
    err.code = "SUPABASE_NOT_CONFIGURED";
    throw err;
  }

  const safeId = typeof id === "string" ? id.trim() : "";
  if (!safeId) {
    const err = new Error("상태 변경 대상 id가 비어 있습니다.");
    err.code = "INBOX_STATUS_ID_REQUIRED";
    throw err;
  }

  const safeStatus = typeof status === "string" ? status.trim() : "";
  if (!ALLOWED_STATUS_UPDATES.has(safeStatus)) {
    const err = new Error(
      `허용되지 않은 상태입니다: ${safeStatus || "(빈 값)"}. archived 또는 converted만 허용됩니다.`
    );
    err.code = "INBOX_STATUS_NOT_ALLOWED";
    throw err;
  }

  const payload = {
    status: safeStatus,
    updated_at: new Date().toISOString(),
  };

  const { data: target, error: targetError } = await supabase
    .from("experience_cards")
    .select("id, status, metadata")
    .eq("id", safeId)
    .maybeSingle();

  if (targetError) {
    const err = new Error(targetError.message || "AI 작업기록 상태 변경 대상을 확인하지 못했습니다.");
    err.code = "INBOX_STATUS_TARGET_LOOKUP_FAILED";
    err.cause = targetError;
    throw err;
  }

  if (!target?.id || !_hasAllowedInboxOrigin(target.metadata)) {
    return {
      ok: false,
      error: "대상 경험 카드를 찾을 수 없거나 변경 권한이 없습니다.",
      code: "INBOX_STATUS_TARGET_NOT_FOUND",
    };
  }

  const { data, error } = await supabase
    .from("experience_cards")
    .update(payload)
    .eq("id", safeId)
    .eq("status", "accepted")
    .select("id, status")
    .maybeSingle();

  if (error) {
    const err = new Error(error.message || "AI 작업기록 상태를 변경하지 못했습니다.");
    err.code = "INBOX_STATUS_UPDATE_FAILED";
    err.cause = error;
    throw err;
  }

  if (!data?.id) {
    return {
      ok: false,
      error: "대상 경험 카드를 찾을 수 없거나 변경 권한이 없습니다.",
      code: "INBOX_STATUS_TARGET_NOT_FOUND",
    };
  }

  return {
    id: data.id,
    status: data.status || safeStatus,
  };
}

export const __TEST_ONLY__ = {
  ALLOWED_PLATFORMS,
  ALLOWED_LIST_STATUSES,
  ALLOWED_STATUS_UPDATES,
  MCP_IMPORT_METHOD,
  CHATGPT_ACTION_IMPORT_METHOD,
  WORK_TRACE_IMPORT_METHODS,
  WORK_TRACE_SOURCE,
  ALLOWED_ORIGIN_FILTER,
  CARD_COLUMNS,
  _isPassmapAiConversation,
  _hasAllowedInboxOrigin,
  _normalizeItem,
  _listAiInboxExperiencesByStatus,
};
