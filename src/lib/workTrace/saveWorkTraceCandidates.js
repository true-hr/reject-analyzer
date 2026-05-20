// src/lib/workTrace/saveWorkTraceCandidates.js
// Saves user-accepted experience candidates to work_records.

import { getSession } from "@/lib/auth";
import { createWorkRecord } from "@/lib/workRecordRepository.js";
import { supabase } from "@/lib/supabaseClient.js";

const DRAFT_KEY = "work_trace_draft";

function _saveDraftLocally({ rawText, acceptedCandidates, differReasons, analysisResult }) {
  try {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        rawText,
        acceptedCandidates,
        differReasons,
        analysisResult,
        savedAt: new Date().toISOString(),
      })
    );
  } catch {
    // localStorage is best-effort; ignore quota or security errors
  }
}

export function clearWorkTraceDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {}
}

function _toArray(v) {
  if (Array.isArray(v)) return v;
  if (v == null) return [];
  return [v];
}

function _uniqueTrimmedStrings(values, limit = 10) {
  const seen = new Set();
  const result = [];
  for (const value of _toArray(values).flat()) {
    const text = String(value || "").trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(text);
    if (result.length >= limit) break;
  }
  return result;
}

function _collectCandidateTags(candidates, field, limit = 10) {
  const values = [];
  for (const candidate of Array.isArray(candidates) ? candidates : []) {
    values.push(..._toArray(candidate?.[field]));
  }
  return _uniqueTrimmedStrings(values, limit);
}

// @MX:ANCHOR: [AUTO] Secondary save path — raw_sources / experience_cards / experience_evidence
// @MX:REASON: Called after primary work_records insert; failure must not bubble up to caller
async function _saveExperienceTables({
  userId,
  workRecordId,
  rawText,
  analysisResult,
  acceptedCandidates,
  differReasons,
}) {
  if (!supabase) {
    console.warn("[workTrace] Supabase client is not configured; skip experience tables save.");
    return;
  }

  // 1. raw_sources — one row per paste session
  const { data: rawSource, error: rawSourceError } = await supabase
    .from("raw_sources")
    .insert({
      user_id: userId,
      work_record_id: workRecordId,
      source_type: analysisResult?.sourceType || "unknown",
      source_label: "업무 흔적 복붙",
      detected_period: analysisResult?.detectedPeriod || null,
      raw_text: rawText || null,
      summary: analysisResult?.summary || null,
      processing_status: "processed",
      metadata: {
        source: "work_trace_paste_import",
        version: "work_trace_v1",
        allCandidateCount: analysisResult?.candidates?.length ?? 0,
        acceptedCount: acceptedCandidates?.length ?? 0,
        savedAt: new Date().toISOString(),
      },
    })
    .select()
    .single();

  if (rawSourceError) throw new Error(`raw_sources insert failed: ${rawSourceError.message}`);

  // 2. experience_cards — one row per accepted candidate
  const evidenceBatch = [];

  for (let idx = 0; idx < acceptedCandidates.length; idx++) {
    const candidate = acceptedCandidates[idx];
    // candidateIndex: use embedded original index if present, otherwise array position
    const candidateIndex = candidate.originalIndex ?? candidate.index ?? idx;
    const differReason = differReasons?.[candidateIndex] ?? null;

    const { data: createdCard, error: cardError } = await supabase
      .from("experience_cards")
      .insert({
        user_id: userId,
        source_id: rawSource.id,
        work_record_id: workRecordId,
        title: candidate.title || "제목 없는 경험",
        situation: candidate.situation || candidate.problem || null,
        task: candidate.task || candidate.role || null,
        actions: _toArray(candidate.actions),
        result: _toArray(candidate.result),
        collaboration: _toArray(candidate.collaboration),
        skills: _toArray(candidate.skills),
        job_tags: _toArray(candidate.job_tags),
        industry_tags: _toArray(candidate.industry_tags),
        resume_potential: candidate.resumePotential || "medium",
        confidence_level: candidate.confidenceLevel || "medium",
        suggested_resume_bullet: candidate.suggestedResumeBullet || null,
        missing_info_questions: _toArray(candidate.missingInfoQuestions ?? candidate.followUpQuestions),
        risk_notes: _toArray(candidate.riskNotes),
        differ_reason: differReason,
        status: "accepted",
        metadata: {
          source: "work_trace_paste_import",
          candidateIndex,
          acceptedAt: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (cardError) throw new Error(`experience_cards insert failed: ${cardError.message}`);

    // collect evidence rows for bulk insert below
    const evidenceTexts = _toArray(candidate.evidenceTexts);
    for (let eIdx = 0; eIdx < evidenceTexts.length; eIdx++) {
      evidenceBatch.push({
        user_id: userId,
        experience_card_id: createdCard.id,
        source_id: rawSource.id,
        evidence_text: evidenceTexts[eIdx],
        evidence_type: "source_text",
        metadata: {
          source: "work_trace_paste_import",
          candidateIndex,
          evidenceIndex: eIdx,
        },
      });
    }
  }

  // 3. experience_evidence — bulk insert all evidence rows
  if (evidenceBatch.length > 0) {
    const { error: evidenceError } = await supabase
      .from("experience_evidence")
      .insert(evidenceBatch);
    if (evidenceError) throw new Error(`experience_evidence insert failed: ${evidenceError.message}`);
  }
}

/**
 * Save user-accepted experience candidates to work_records.
 *
 * @param {{
 *   rawText: string,
 *   analysisResult: object,
 *   acceptedCandidates: object[],
 *   differReasons: object,
 * }} params
 * @returns {Promise<{
 *   ok: boolean,
 *   savedRecord?: object,
 *   savedCount?: number,
 *   errorCode?: string,
 *   message?: string,
 * }>}
 */
export async function saveAcceptedWorkTraceCandidates({
  rawText,
  analysisResult,
  acceptedCandidates,
  differReasons,
} = {}) {
  let session;
  try {
    session = await getSession();
  } catch {
    session = null;
  }

  if (!session?.user?.id) {
    _saveDraftLocally({ rawText, acceptedCandidates, differReasons, analysisResult });
    return {
      ok: false,
      errorCode: "AUTH_REQUIRED",
      message: "로그인하면 확인한 경험을 저장할 수 있어요.",
    };
  }

  const today = new Date().toISOString().split("T")[0];
  const firstTitle = acceptedCandidates?.[0]?.title;
  const title =
    acceptedCandidates?.length === 1 && firstTitle
      ? firstTitle
      : "업무 흔적에서 찾은 경험";

  const assetSkills = _collectCandidateTags(acceptedCandidates, "skills", 10);
  const assetJobTags = _collectCandidateTags(acceptedCandidates, "job_tags", 5);

  const record = {
    user_id: session.user.id,
    title,
    record_date: today,
    source: "paste_import",
    strength_tags: assetSkills,
    skill_tags: assetJobTags,
    raw_payload: {
      source: "work_trace_paste_import",
      version: "work_trace_v1",
      rawText,
      sourceType: analysisResult?.sourceType,
      detectedPeriod: analysisResult?.detectedPeriod,
      summary: analysisResult?.summary,
      acceptedCandidates,
      differReasons,
      allCandidateCount: analysisResult?.candidates?.length ?? 0,
      acceptedCount: acceptedCandidates?.length ?? 0,
      savedAt: new Date().toISOString(),
      assetSkills,
      assetJobTags,
    },
  };

  try {
    const savedRecord = await createWorkRecord(record);

    if (savedRecord?.id) {
      try {
        await _saveExperienceTables({
          userId: session.user.id,
          workRecordId: savedRecord.id,
          rawText,
          analysisResult,
          acceptedCandidates,
          differReasons,
        });
      } catch (experienceSaveError) {
        console.warn("[workTrace] experience tables save failed", experienceSaveError);
      }
    } else {
      console.warn("[workTrace] savedRecord.id missing; skip experience tables save.");
    }

    clearWorkTraceDraft();
    return { ok: true, savedRecord, savedCount: acceptedCandidates?.length ?? 0 };
  } catch {
    return {
      ok: false,
      errorCode: "SAVE_FAILED",
      message: "경험 저장 중 오류가 발생했어요.",
    };
  }
}
