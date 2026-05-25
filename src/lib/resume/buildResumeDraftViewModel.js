/**
 * buildResumeDraftViewModel.js
 *
 * 이력서 보기 화면에 필요한 ResumeDraftViewModel을 만드는 순수 함수.
 * UI 연결 없음. PmMvpView.jsx 직접 수정 없음.
 * AI 생성 없음 — 원문 기반 정리만 수행.
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

function uniqueCompact(arr) {
  return [...new Set(safeArray(arr).map((v) => String(v).trim()).filter(Boolean))];
}

function takeFirst(arr, n) {
  return uniqueCompact(arr).slice(0, n);
}

function isDraftResumeSentence(sentence, confidenceLevel) {
  const s = safeString(sentence);
  return confidenceLevel === "low" || s.includes("기록 기반 초안:");
}

// ─── export ───────────────────────────────────────────────────────────────────

/**
 * @param {{
 *   result?: object,
 *   latestResumeCandidate?: object,
 *   resumeExperienceBullets?: string[],
 *   resumeSkillItems?: string[],
 *   improvementNotes?: string[],
 *   fallbackAchievementText?: string | null,
 *   aiResumeSentence?: string | null,
 *   aiResumeBullets?: object[],
 *   profile?: { name?: string, role?: string, contact?: string, portfolio?: string },
 * }} input
 * @returns {object} ResumeDraftViewModel
 */
export function buildResumeDraftViewModel(input = {}) {
  const {
    result = null,
    latestResumeCandidate = null,
    resumeExperienceBullets = [],
    resumeSkillItems = [],
    improvementNotes: rawImprovementNotes = [],
    fallbackAchievementText = null,
    aiResumeSentence = null,
    aiResumeBullets = [],
    profile: inputProfile = null,
  } = input ?? {};

  // ── profile ──────────────────────────────────────────────────────────────
  const profile = {
    name: safeString(inputProfile?.name),
    role: safeString(inputProfile?.role),
    contact: safeString(inputProfile?.contact),
    portfolio: safeString(inputProfile?.portfolio),
  };

  // ── headline ──────────────────────────────────────────────────────────────
  // buildDemoResult에는 최상위 headline/summaryTitle 없음 — 빈 값 기본.
  // P-5B 연결 시 profile.role 또는 currentCareerRoleLabel을 여기에 전달 가능.
  const headline = safeString(
    result?.headline ||
    result?.summaryTitle ||
    result?.readiness?.summaryTitle
  );

  // ── introParagraphs ───────────────────────────────────────────────────────
  // result.summary (project 요약) + result.strengthDescription (강점 설명).
  // 없는 값을 억지로 채우지 않음 — 없으면 [].
  const introParagraphs = [
    safeString(result?.summary),
    safeString(result?.strengthDescription),
  ].filter(Boolean);

  // ── candidate-derived safe values ─────────────────────────────────────────
  const candidateConfidence = safeString(latestResumeCandidate?.confidenceLevel) || "none";
  const candidateResumeSentence = safeString(latestResumeCandidate?.resumeSentence);
  const candidateIsDraft = isDraftResumeSentence(candidateResumeSentence, candidateConfidence);
  const safeCandidateSentence = candidateResumeSentence && !candidateIsDraft
    ? candidateResumeSentence
    : "";
  const candidateAchievementBullets = safeArray(latestResumeCandidate?.achievementBullets);

  // ── experiences ───────────────────────────────────────────────────────────
  // medium 이상 문장 + achievementBullets → 기존 resumeExperienceBullets 순으로 최대 4개.
  const experienceCandidates = [];
  if (safeCandidateSentence) experienceCandidates.push(safeCandidateSentence);
  for (const b of candidateAchievementBullets) {
    const s = String(b || "").trim();
    if (s) experienceCandidates.push(s);
  }
  const baseExperiences = safeArray(resumeExperienceBullets);
  const experiences = takeFirst(
    [...experienceCandidates, ...baseExperiences.filter((b) => !experienceCandidates.includes(b))],
    4,
  );

  // ── achievementHighlights ─────────────────────────────────────────────────
  // achievementBullets 우선 → safeCandidateSentence 보조 → fallbackAchievementText.
  // low confidence resumeSentence는 주요 성과로 승격하지 않음.
  const achievementPool = [];
  if (candidateAchievementBullets.length) {
    for (const b of candidateAchievementBullets) {
      const s = String(b || "").trim();
      if (s) achievementPool.push(s);
    }
  } else if (safeCandidateSentence) {
    achievementPool.push(safeCandidateSentence);
  } else if (fallbackAchievementText) {
    const s = safeString(fallbackAchievementText);
    if (s) achievementPool.push(s);
  }
  const achievementHighlights = takeFirst(achievementPool, 3);

  // ── skillTags ─────────────────────────────────────────────────────────────
  const skillTags = takeFirst(
    [
      ...(latestResumeCandidate?.competencyTags ?? []),
      ...(latestResumeCandidate?.collaborationTags ?? []),
      ...safeArray(resumeSkillItems),
    ],
    6,
  );

  // ── improvementNotes ──────────────────────────────────────────────────────
  const improvementNotes = takeFirst(safeArray(rawImprovementNotes), 4);

  // ── updatePreview ─────────────────────────────────────────────────────────
  const beforeText = safeString(
    latestResumeCandidate?.sourceText ||
    result?.sourceText,
  );

  // AI bullets take precedence over single sentence
  const hasAiBullets = Array.isArray(aiResumeBullets) && aiResumeBullets.length > 0;
  const filteredAiBullets = hasAiBullets
    ? aiResumeBullets.filter((b) => b && String(b.text || "").trim())
    : [];

  const afterSentence = safeString(
    aiResumeSentence ||
    latestResumeCandidate?.resumeSentence ||
    result?.resumeLine,
  );
  const hasAiResult = Boolean(aiResumeSentence) || hasAiBullets;
  const previewIsDraft = hasAiResult ? false : isDraftResumeSentence(afterSentence, candidateConfidence);

  const updatePreview = {
    beforeText,
    afterSentence,
    afterBullets: filteredAiBullets,
    afterTitle: filteredAiBullets.length > 0 ? "경력기술서형 초안" : "이력서 문장",
    afterHelperText: filteredAiBullets.length > 0
      ? "AI가 정리한 경력기술서형 초안입니다. 필요한 문장만 골라 이력서 초안에 저장할 수 있습니다."
      : undefined,
    isAiGenerated: hasAiBullets,
    confidenceLevel: candidateConfidence,
    generationMethod: hasAiResult ? "ai_generated" : (safeString(latestResumeCandidate?.generationMethod) || "deterministic"),
    sourceTrack: safeString(latestResumeCandidate?.sourceTrack),
    sourceRecordId: latestResumeCandidate?.sourceRecordId ?? null,
    isDraft: previewIsDraft,
    hasAiResult,
  };

  // ── meta ──────────────────────────────────────────────────────────────────
  const hasCandidate = Boolean(latestResumeCandidate);
  const hasSafeResumeSentence = Boolean(safeCandidateSentence);
  const hasAchievementEvidence = candidateAchievementBullets.length > 0;

  const meta = {
    hasCandidate,
    hasSafeResumeSentence,
    hasAchievementEvidence,
    source: hasCandidate ? "candidate" : "demo_result",
  };

  return {
    profile,
    headline,
    introParagraphs,
    experiences,
    achievementHighlights,
    skillTags,
    improvementNotes,
    updatePreview,
    meta,
  };
}
