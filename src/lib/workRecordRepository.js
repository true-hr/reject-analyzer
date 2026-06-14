import { supabase } from "./supabaseClient.js";

const TABLE = "work_records";

/**
 * List work records for the current authenticated user.
 * @param {{ limit?: number, offset?: number }} options
 * @returns {Promise<object[]>}
 */
export async function listWorkRecords({ limit = 50, offset = 0 } = {}) {
  if (!supabase) throw new Error("Supabase client is not configured.");
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("record_date", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * List work records for calendar/dashboard surfaces.
 * Includes raw_payload so project-action edits can merge nested MVP fields
 * without dropping unrelated keys.
 * @param {{ limit?: number, offset?: number }} options
 * @returns {Promise<object[]>}
 */
export async function listCalendarWorkRecords({ limit = 50, offset = 0 } = {}) {
  if (!supabase) throw new Error("Supabase client is not configured.");
  const { data, error } = await supabase
    .from(TABLE)
    .select(
      [
        "id",
        "record_date",
        "created_at",
        "title",
        "description",
        "task",
        "result",
        "project_name",
        "raw_payload",
        "strength_tags",
        "skill_tags",
        "work_type",
        "source",
        "google_calendar_event_id",
        "google_calendar_sync_status",
        "google_calendar_synced_at",
        "google_calendar_sync_error",
      ].join(", ")
    )
    .order("record_date", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Create a new work record. Returns the saved row.
 * @param {object} record - Fields matching work_records schema (user_id required).
 * @returns {Promise<object>}
 */
export async function createWorkRecord(record) {
  if (!supabase) throw new Error("Supabase client is not configured.");
  const { data, error } = await supabase
    .from(TABLE)
    .insert(record)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Update an existing work record by id. Returns the updated row.
 * @param {string} id - UUID of the record to update.
 * @param {object} patch - Fields to update.
 * @returns {Promise<object>}
 */
export async function updateWorkRecord(id, patch) {
  if (!supabase) throw new Error("Supabase client is not configured.");
  const { data, error } = await supabase
    .from(TABLE)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Delete a work record by id.
 * @param {string} id - UUID of the record to delete.
 * @returns {Promise<void>}
 */
export async function deleteWorkRecord(id) {
  if (!supabase) throw new Error("Supabase client is not configured.");
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── experience signals helpers ───────────────────────────────────────────────

const _VALID_USER_DECISIONS = new Set(["pending", "accepted", "edited", "rejected"]);

function _safeRawPayloadObject(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * Persist reviewed experience signals into raw_payload.experienceSignals.
 * Preserves all other raw_payload fields; never drops unrelated keys.
 * Handles raw_payload as object or JSON string.
 *
 * @param {string} id - work_records UUID
 * @param {object|string} existingRawPayload - current raw_payload value from the row
 * @param {Array}  experienceSignals  - updated signals array
 * @returns {Promise<object>} updated row
 */
export async function updateWorkRecordExperienceSignals(id, existingRawPayload = {}, experienceSignals = []) {
  const safePayload = _safeRawPayloadObject(existingRawPayload);

  const safeSignals = Array.isArray(experienceSignals)
    ? experienceSignals.map((sig) => ({
        signalType:           _safeStr(sig.signalType),
        label:                _safeStr(sig.label),
        evidenceText:         _safeStr(sig.evidenceText),
        suggestedResumeAngle: _safeStr(sig.suggestedResumeAngle),
        confidence:           _safeStr(sig.confidence),
        source:               _safeStr(sig.source) || "deterministic",
        userDecision:         _VALID_USER_DECISIONS.has(sig.userDecision) ? sig.userDecision : "pending",
        updatedAt:            new Date().toISOString(),
      }))
    : [];

  const nextRawPayload = {
    ...safePayload,
    experienceSignals: safeSignals,
  };

  return updateWorkRecord(id, { raw_payload: nextRawPayload });
}

// ─── resume candidate helpers ─────────────────────────────────────────────────

function _safeStr(v) {
  return typeof v === "string" ? v.trim() : String(v ?? "").trim();
}

function _safeArr(v) {
  return Array.isArray(v) ? v.filter((x) => x != null && String(x).trim() !== "") : [];
}

const AI_RESUME_MATERIAL_ORIGIN_FILTER = [
  "metadata->>importMethod.eq.mcp_save_experience",
  "metadata->>importMethod.eq.chatgpt_action_save_experience",
  "metadata->>importMethod.eq.manual_paste_or_txt",
  "metadata->>importMethod.eq.browser_extension_selection",
  "metadata->>source.eq.work_trace_paste_import",
].join(",");

/**
 * Merge a ResumeUpdateCandidate into work_records.raw_payload and persist.
 * Preserves all existing raw_payload fields (WorkRecordDraft inputs).
 * Writes two aliases for read-path compatibility:
 *   raw_payload.resumeUpdateCandidate  — canonical nested object
 *   raw_payload.resumeSentence         — flat alias consumed by buildResumeUpdateCandidateFromRecord
 *
 * @param {string} id - work_records UUID
 * @param {object} existingRawPayload - current raw_payload value from the row
 * @param {object} candidate - ResumeUpdateCandidate (or compatible shape)
 * @returns {Promise<object>} updated row
 */
/**
 * List accepted experience cards for the current authenticated user.
 * Returns only fields needed for resume bullet display.
 * RLS (auth.uid() = user_id) filters rows automatically.
 * @param {{ limit?: number, offset?: number }} options
 * @returns {Promise<object[]>}
 */
export async function listExperienceCards({ limit = 50, offset = 0 } = {}) {
  if (!supabase) throw new Error("Supabase client is not configured.");
  const { data, error } = await supabase
    .from("experience_cards")
    .select("id, title, suggested_resume_bullet, status, created_at, work_record_id, job_tags, industry_tags, experience_evidence(evidence_text, evidence_type)")
    .eq("status", "accepted")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * List AI-confirmed resume material experience cards for the current user.
 * Keeps accepted-card reads separate and limits results to AI work-record origins.
 * RLS (auth.uid() = user_id) filters rows automatically.
 * @param {{ limit?: number, offset?: number }} options
 * @returns {Promise<object[]>}
 */
export async function listResumeMaterialExperienceCards({ limit = 50, offset = 0 } = {}) {
  if (!supabase) throw new Error("Supabase client is not configured.");
  const { data, error } = await supabase
    .from("experience_cards")
    .select("id, title, situation, task, actions, result, suggested_resume_bullet, risk_notes, status, created_at, updated_at, work_record_id, job_tags, industry_tags, metadata, experience_evidence(evidence_text, evidence_type)")
    .eq("status", "converted")
    .or(AI_RESUME_MATERIAL_ORIGIN_FILTER)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listExperienceCardsForWorkRecordIds(workRecordIds = []) {
  if (!supabase) throw new Error("Supabase client is not configured.");
  const ids = [...new Set(
    (Array.isArray(workRecordIds) ? workRecordIds : [])
      .map((id) => String(id || "").trim())
      .filter(Boolean)
  )].slice(0, 50);
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("experience_cards")
    .select("id, work_record_id, title, situation, task, actions, result, suggested_resume_bullet, status, job_tags, industry_tags, updated_at, experience_evidence(evidence_text, evidence_type)")
    .in("work_record_id", ids)
    .neq("status", "archived")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateWorkRecordWithCandidate(id, existingRawPayload = {}, candidate = {}) {
  const safePayload =
    existingRawPayload &&
    typeof existingRawPayload === "object" &&
    !Array.isArray(existingRawPayload)
      ? existingRawPayload
      : {};

  const resumeSentence = _safeStr(candidate.resumeSentence);

  const nextCandidate = {
    resumeSentence,
    achievementBullets: _safeArr(candidate.achievementBullets),
    competencyTags:     _safeArr(candidate.competencyTags),
    collaborationTags:  _safeArr(candidate.collaborationTags),
    evidenceTags:       _safeArr(candidate.evidenceTags),
    confidenceLevel:    _safeStr(candidate.confidenceLevel) || "none",
    generationMethod:   _safeStr(candidate.generationMethod) || "deterministic",
    candidateStatus:    _safeStr(candidate.candidateStatus) || "draft",
    sourceRecordId:     candidate.sourceRecordId ?? id ?? null,
    sourceTrack:        _safeStr(candidate.sourceTrack),
    updatedAt:          new Date().toISOString(),
  };

  // raw_payload.resumeSentence: use new value if present, otherwise keep existing (never overwrite with "")
  const nextResumeSentence = resumeSentence || _safeStr(safePayload.resumeSentence) || undefined;

  const nextRawPayload = {
    ...safePayload,
    resumeUpdateCandidate: {
      ...(safePayload.resumeUpdateCandidate ?? {}),
      ...nextCandidate,
    },
    ...(nextResumeSentence !== undefined ? { resumeSentence: nextResumeSentence } : {}),
  };

  return updateWorkRecord(id, { raw_payload: nextRawPayload });
}
