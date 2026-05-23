// src/lib/workTrace/saveWorkTraceCandidates.js
// Saves user-accepted experience candidates to work_records.

import { getSession } from "@/lib/auth";
import { createWorkRecord } from "@/lib/workRecordRepository.js";
import { supabase } from "@/lib/supabaseClient.js";

const DRAFT_KEY = "work_trace_draft";

// Recognised import methods for AI-conversation work trace ingestion.
// Unknown values fall back to manual paste so a malformed caller cannot
// poison downstream metadata.
const VALID_IMPORT_METHODS = new Set([
  "manual_paste_or_txt",
  "browser_extension_selection",
]);
const DEFAULT_IMPORT_METHOD = "manual_paste_or_txt";

function _normalizeImportMethod(value) {
  return VALID_IMPORT_METHODS.has(value) ? value : DEFAULT_IMPORT_METHOD;
}

function _saveDraftLocally({ rawText, acceptedCandidates, differReasons, analysisResult, recordDate }) {
  try {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        rawText,
        acceptedCandidates,
        differReasons,
        analysisResult,
        recordDate: recordDate || null,
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

// Derives short asset tags from collaboration[] text using keyword matching.
// Outputs at most `limit` unique tags; person-name-only entries are skipped.
function _deriveCollaborationAssetTags(candidates, limit = 4) {
  const items = [];
  for (const c of Array.isArray(candidates) ? candidates : []) {
    for (const v of _toArray(c?.collaboration ?? c?.collaborators ?? [])) {
      const text = String(v ?? "").trim();
      if (text) items.push(text);
    }
  }

  const tags = new Set();
  for (const item of items) {
    const t = item.toLowerCase();
    if (t.includes("릴리즈") && t.includes("범위")) {
      tags.add("릴리즈 범위 조율");
    } else if (t.includes("변경") && t.includes("범위")) {
      tags.add("변경 범위 공유");
    } else if (t.includes("마케팅")) {
      tags.add("마케팅 협업 조율");
    } else if (t.includes("개발")) {
      tags.add("개발 협업 조율");
    } else if (t.includes("운영") || t.includes("cs") || t.includes("고객센터")) {
      tags.add("운영 기준 조율");
    } else if (t.includes("데이터")) {
      tags.add("데이터 협업 조율");
    } else if (t.includes("제품") || t.includes("요구사항")) {
      tags.add("제품 요구사항 조율");
    } else if (t.includes("조율")) {
      tags.add("이해관계자 조율");
    } else if (t.includes("논의")) {
      tags.add("협업 논의");
    } else if (t.includes("공유")) {
      tags.add("변경 사항 공유");
    } else if (t.includes("전달")) {
      tags.add("업무 내용 전달");
    }
    if (tags.size >= limit) break;
  }

  return [...tags];
}

// Derives result-based experience signals from accepted candidates.
// Reads candidate.result / results / outcomes / impact only — skips skills/job_tags/collaboration
// to prevent double-counting with strength_tags/skill_tags.
function _deriveExperienceSignalsFromResults(candidates, limit = 6) {
  const seen = new Set();
  const signals = [];
  const now = new Date().toISOString();

  for (const c of Array.isArray(candidates) ? candidates : []) {
    const resultItems = [
      ..._toArray(c?.result),
      ..._toArray(c?.results),
      ..._toArray(c?.outcomes),
      ..._toArray(c?.impact),
    ];

    for (const raw of resultItems) {
      const text = String(raw ?? "").trim().slice(0, 120);
      if (!text) continue;
      const key = text.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      signals.push({
        signalType: "result",
        label: "성과 및 변화",
        evidenceText: text,
        suggestedResumeAngle: "성과 수치 또는 변화 근거로 활용",
        confidence: c?.confidenceLevel || "medium",
        source: "work_trace_result",
        userDecision: "accepted",
        updatedAt: now,
      });
      if (signals.length >= limit) return signals;
    }
  }

  return signals;
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
  sourceMode = "work_trace",
  importMethod = DEFAULT_IMPORT_METHOD,
}) {
  if (!supabase) {
    console.warn("[workTrace] Supabase client is not configured; skip experience tables save.");
    return;
  }

  const isAiMode = sourceMode === "ai_conversation";
  const finalImportMethod = _normalizeImportMethod(importMethod);

  // 1. raw_sources — one row per paste session
  const { data: rawSource, error: rawSourceError } = await supabase
    .from("raw_sources")
    .insert({
      user_id: userId,
      work_record_id: workRecordId,
      source_type: analysisResult?.sourceType || "unknown",
      source_label: isAiMode ? "AI 대화에서 찾은 경험" : "업무 흔적 복붙",
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
        ...(isAiMode
          ? {
              sourceMode: "ai_conversation",
              importMethod: finalImportMethod,
              privacyNoticeShown: true,
            }
          : {}),
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
  recordDate,
  sourceMode = "work_trace",
  importMethod,
} = {}) {
  const mode = sourceMode === "ai_conversation" ? "ai_conversation" : "work_trace";
  const isAiMode = mode === "ai_conversation";
  const finalImportMethod = _normalizeImportMethod(importMethod);
  let session;
  try {
    session = await getSession();
  } catch {
    session = null;
  }

  if (!session?.user?.id) {
    _saveDraftLocally({ rawText, acceptedCandidates, differReasons, analysisResult, recordDate });
    return {
      ok: false,
      errorCode: "AUTH_REQUIRED",
      message: "로그인하면 확인한 경험을 저장할 수 있어요.",
    };
  }

  const today = new Date().toISOString().split("T")[0];
  const finalDate = typeof recordDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(recordDate) ? recordDate : today;
  const firstTitle = acceptedCandidates?.[0]?.title;
  const title =
    acceptedCandidates?.length === 1 && firstTitle
      ? firstTitle
      : "업무 흔적에서 찾은 경험";

  const baseAssetSkills = _collectCandidateTags(acceptedCandidates, "skills", 10);
  const assetCollaborationTags = _deriveCollaborationAssetTags(acceptedCandidates, 4);
  const assetSkills = _uniqueTrimmedStrings([...baseAssetSkills, ...assetCollaborationTags], 10);
  const assetJobTags = _collectCandidateTags(acceptedCandidates, "job_tags", 5);
  const experienceSignals = _deriveExperienceSignalsFromResults(acceptedCandidates, 6);

  const record = {
    user_id: session.user.id,
    title,
    record_date: finalDate,
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
      assetCollaborationTags,
      experienceSignals,
      ...(isAiMode
        ? {
            sourceMode: "ai_conversation",
            sourceLabel: "AI 대화에서 찾은 경험",
            importMethod: finalImportMethod,
          }
        : {}),
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
          sourceMode: mode,
          importMethod: finalImportMethod,
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
