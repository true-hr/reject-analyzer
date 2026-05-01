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

// ─── resume candidate helpers ─────────────────────────────────────────────────

function _safeStr(v) {
  return typeof v === "string" ? v.trim() : String(v ?? "").trim();
}

function _safeArr(v) {
  return Array.isArray(v) ? v.filter((x) => x != null && String(x).trim() !== "") : [];
}

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
