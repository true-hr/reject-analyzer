/**
 * recordToResumeCandidate.js
 *
 * 저장된 업무 기록 1개를 ResumeUpdateCandidate로 변환하는 순수 함수 모음.
 * PmMvpView.jsx에서 후보 생성·표시·사용자 수정·저장 흐름 전체에 연결되어 있음 (RES-CAND-1, 2026-04-29).
 * AI 생성 없음 — generationMethod는 raw_payload.resumeUpdateCandidate에서 복구하거나 "deterministic" 기본값 사용.
 * low confidence / "기록 기반 초안:" 후보는 사용자 직접 수정 없이 저장되지 않음 (isDraftSentence guard).
 * 반환 shape 변경 시 PmMvpView.jsx BEFORE/AFTER 표시 및 저장 guard에 영향. 변경 전 consumer 먼저 확인.
 *
 * 계약 기준: docs/record-to-resume-contract.md
 */

// ─── private helpers ──────────────────────────────────────────────────────────

function safeString(value, fallback = "") {
  const s = String(value ?? "").trim();
  return s || fallback;
}

function safeArray(value) {
  if (Array.isArray(value)) return value.filter((v) => v != null && String(v).trim() !== "");
  return [];
}

function safeRawPayload(value) {
  if (value && typeof value === "object") return value;
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch { return {}; }
  }
  return {};
}

function uniqueCompact(arr) {
  return [...new Set(safeArray(arr).map((v) => String(v).trim()).filter(Boolean))];
}

function inferTrack(raw, record) {
  const rawTrack = safeString(raw.track);
  if (rawTrack === "project" || rawTrack === "weekly") return rawTrack;

  const workType = safeString(record.work_type || record.workType || record.track);
  if (workType === "project") return "project";
  if (workType === "weekly") return "weekly";

  // 프로젝트 필드가 실제로 있으면 project로 추론
  const hasProjectFields =
    safeString(raw.projectName || record.project_name) ||
    safeString(raw.projectActions || record.task) ||
    safeString(raw.projectResult || record.result);
  if (hasProjectFields) return "project";

  return "weekly";
}

// ─── export 1 ─────────────────────────────────────────────────────────────────

/**
 * StoredWorkRecord, CalendarRecord, mock record 등에서
 * WorkRecordDraft 형태를 최대한 복구한다.
 *
 * @param {object} record - Supabase row 또는 CalendarRecord 유사 객체
 * @returns {object} WorkRecordDraft
 */
export function normalizeWorkRecordDraftFromStoredRecord(record) {
  if (!record || typeof record !== "object") {
    return {
      track: "weekly",
      recordType: "weekly",
      text: "",
      roleTags: [],
      collaborationTags: [],
      resultTags: [],
      projectName: "",
      projectGoal: "",
      projectContext: "",
      projectActions: "",
      projectResult: "",
      projectInsight: "",
      startDate: "",
      endDate: "",
      projectPeriod: "",
    };
  }

  const raw = safeRawPayload(record.raw_payload);

  const track = inferTrack(raw, record);

  const recordType = safeString(
    raw.recordType ||
    record.recordType ||
    (track === "project" ? "personal" : "weekly")
  );

  const text = safeString(
    raw.text ||
    record.description ||
    record.summary ||
    record.title
  );

  const projectName = safeString(raw.projectName || record.project_name || record.projectName);
  const projectGoal = safeString(raw.projectGoal || record.projectGoal);
  const projectContext = safeString(raw.projectContext || record.projectContext);
  const projectActions = safeString(raw.projectActions || record.task || record.projectActions);
  const projectResult = safeString(raw.projectResult || record.result || record.projectResult);
  const projectInsight = safeString(raw.projectInsight || record.projectInsight);
  const projectPeriod = safeString(raw.projectPeriod || record.projectPeriod);
  const startDate = safeString(raw.startDate || record.startDate || record.record_date);
  const endDate = safeString(raw.endDate || record.endDate);

  const roleTags = safeArray(
    Array.isArray(raw.roleTags) ? raw.roleTags :
    Array.isArray(record.roleTags) ? record.roleTags :
    Array.isArray(record.role_tags) ? record.role_tags :
    Array.isArray(record.strength_tags) ? record.strength_tags :
    Array.isArray(record.strengthTags) ? record.strengthTags :
    []
  );

  const collaborationTags = safeArray(
    Array.isArray(raw.collaborationTags) ? raw.collaborationTags :
    Array.isArray(record.collaborationTags) ? record.collaborationTags :
    Array.isArray(record.skill_tags) ? record.skill_tags :
    Array.isArray(record.skillTags) ? record.skillTags :
    Array.isArray(record.workTags) ? record.workTags :
    []
  );

  const resultTags = safeArray(
    Array.isArray(raw.resultTags) ? raw.resultTags :
    Array.isArray(record.resultTags) ? record.resultTags :
    []
  );

  return {
    track,
    recordType,
    text,
    roleTags,
    collaborationTags,
    resultTags,
    projectName,
    projectGoal,
    projectContext,
    projectActions,
    projectResult,
    projectInsight,
    startDate,
    endDate,
    projectPeriod,
  };
}

// ─── export 2 ─────────────────────────────────────────────────────────────────

/**
 * 저장 기록 1개를 ResumeUpdateCandidate로 변환한다.
 * AI 생성 없음. deterministic 변환.
 *
 * @param {object} record - Supabase row 또는 CalendarRecord 유사 객체
 * @returns {object} ResumeUpdateCandidate
 */
export function buildResumeUpdateCandidateFromRecord(record) {
  const raw = safeRawPayload(record?.raw_payload);
  const draft = normalizeWorkRecordDraftFromStoredRecord(record);

  const sourceRecordId = safeString(record?.id || record?.record_id) || null;
  const sourceTrack = draft.track;

  // sourceText: 원문 기록
  const sourceText =
    sourceTrack === "project" && (draft.projectActions || draft.projectResult)
      ? [draft.projectActions, draft.projectResult].filter(Boolean).join(" / ")
      : safeString(draft.text || record?.description || record?.summary || record?.title);

  // sourceSummary: 짧은 요약
  const fullSummary = safeString(record?.summary || record?.title || sourceText);
  const sourceSummary = fullSummary.length > 120 ? fullSummary.slice(0, 120).trim() + "..." : fullSummary;

  // resumeSentence 우선순위 결정 + confidenceLevel 추적
  let resumeSentence = "";
  let confidenceLevel = "low";

  // P-6-3B: canonical nested candidate object (updateWorkRecordWithCandidate 저장 경로).
  const fromRawNestedCandidate =
    raw.resumeUpdateCandidate &&
    typeof raw.resumeUpdateCandidate === "object" &&
    !Array.isArray(raw.resumeUpdateCandidate)
      ? raw.resumeUpdateCandidate
      : null;

  const fromRecordResumeSentence = safeString(record?.resumeSentence);
  const fromRecordReflectedSentence = safeString(record?.reflectedSentence);
  const fromNestedResumeSentence = safeString(fromRawNestedCandidate?.resumeSentence);
  const fromRawResumeSentence = safeString(raw.resumeSentence);
  const fromRawReflectedSentence = safeString(raw.reflectedSentence);
  const fromWorkTraceUserEditedBullet = safeString(
    raw.acceptedCandidates?.[0]?.userEditedResumeBullet
  );
  const fromWorkTraceSuggestedBullet = safeString(
    raw.acceptedCandidates?.[0]?.suggestedResumeBullet
  );
  const fromRowResult = safeString(record?.result);

  if (fromRecordResumeSentence) {
    resumeSentence = fromRecordResumeSentence;
    confidenceLevel = "medium";
  } else if (fromRecordReflectedSentence) {
    resumeSentence = fromRecordReflectedSentence;
    confidenceLevel = "medium";
  } else if (fromNestedResumeSentence) {
    // nested candidate가 flat alias보다 canonical — user_edited 메타데이터와 함께 저장됨.
    resumeSentence = fromNestedResumeSentence;
    confidenceLevel = safeString(fromRawNestedCandidate?.confidenceLevel) || "medium";
  } else if (fromRawResumeSentence) {
    resumeSentence = fromRawResumeSentence;
    confidenceLevel = "medium";
  } else if (fromRawReflectedSentence) {
    resumeSentence = fromRawReflectedSentence;
    confidenceLevel = "medium";
  } else if (fromWorkTraceUserEditedBullet) {
    resumeSentence = fromWorkTraceUserEditedBullet;
    confidenceLevel = "medium";
  } else if (fromWorkTraceSuggestedBullet) {
    resumeSentence = fromWorkTraceSuggestedBullet;
    confidenceLevel = "medium";
  } else if (fromRowResult) {
    // row.result는 projectResult 원문일 수 있음 — 확정된 이력서 문장으로 취급하지 않음
    resumeSentence = fromRowResult;
    confidenceLevel = "low";
  } else {
    // deterministic fallback — 원문에 없는 성과/해석 표현 금지. "기록 기반 초안:" 접두어로 제한.
    if (sourceTrack === "project") {
      const name = draft.projectName ? `${draft.projectName} 기록 기반 초안` : "프로젝트 기록 기반 초안";
      const action = draft.projectActions || "";
      const result = draft.projectResult || "";
      if (action && result) {
        resumeSentence = `${name}: 수행 내용 - ${action} / 결과 - ${result}`;
      } else if (action) {
        resumeSentence = `${name}: 수행 내용 - ${action}`;
      } else if (result) {
        resumeSentence = `${name}: 결과 - ${result}`;
      } else {
        resumeSentence = "";
      }
    } else {
      const base = sourceText || draft.text;
      const truncatedBase = base && base.length > 120 ? base.slice(0, 120).trim() + "…" : base;
      resumeSentence = truncatedBase ? `업무 기록 기반 초안: ${truncatedBase}` : "";
    }
    confidenceLevel = resumeSentence ? "low" : "none";
  }

  // achievementBullets
  const achievementBullets = [];
  if (draft.projectResult) achievementBullets.push(draft.projectResult);
  safeArray(draft.resultTags).forEach((tag) => {
    if (!achievementBullets.includes(tag)) achievementBullets.push(tag);
  });

  const allAcceptedCandidates = Array.isArray(raw.acceptedCandidates) ? raw.acceptedCandidates : [];
  for (const ac of allAcceptedCandidates) {
    const bullet = safeString(ac?.userEditedResumeBullet || ac?.suggestedResumeBullet);
    if (bullet && !achievementBullets.includes(bullet)) achievementBullets.push(bullet);
  }

  const workTraceSkills = uniqueCompact(
    allAcceptedCandidates.flatMap((ac) => {
      const s = ac?.skills;
      if (Array.isArray(s)) return s;
      const str = safeString(s);
      return str ? [str] : [];
    })
  );

  // competencyTags: roleTags + resultTags 기반, work_trace skills 포함
  const competencyTags = uniqueCompact([...draft.roleTags, ...draft.resultTags, ...workTraceSkills]);

  // collaborationTags
  const collaborationTags = uniqueCompact(draft.collaborationTags);

  // evidenceTags: 전체 태그에서 중복 제거
  const evidenceTags = uniqueCompact([
    ...draft.resultTags,
    ...draft.roleTags,
    ...draft.collaborationTags,
  ]);

  // generationMethod: P-6-3B — nested candidate에 저장된 값 우선 복구.
  const generationMethod =
    safeString(fromRawNestedCandidate?.generationMethod) || "deterministic";

  // P-6-3B: candidateStatus 복구 — nested candidate에서 읽음.
  const candidateStatus = safeString(fromRawNestedCandidate?.candidateStatus) || "draft";

  return {
    sourceRecordId,
    sourceTrack,
    sourceText,
    sourceSummary,
    resumeSentence,
    achievementBullets,
    competencyTags,
    collaborationTags,
    evidenceTags,
    confidenceLevel,
    generationMethod,
    candidateStatus,
    createdFrom: "stored_work_record",
    sourceRecord: record,
    workRecordDraft: draft,
  };
}
