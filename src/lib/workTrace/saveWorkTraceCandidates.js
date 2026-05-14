// src/lib/workTrace/saveWorkTraceCandidates.js
// Saves user-accepted experience candidates to work_records.

import { getSession } from "@/lib/auth";
import { createWorkRecord } from "@/lib/workRecordRepository.js";

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

  const record = {
    user_id: session.user.id,
    title,
    record_date: today,
    source: "paste_import",
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
    },
  };

  try {
    const savedRecord = await createWorkRecord(record);
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
