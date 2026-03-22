// src/lib/analysis/buildReportPack.js
// Phase 10: reportPack translation layer.
// Read-only downstream contract from interpretationPack → report surface.
// No prose generation. No upstream changes.

const SECTION_ORDER = [
  "careerAccumulation",
  "levelPositionFit",
  "compensationMobility",
  "workStyleExecution",
  "industryContext",
  "riskSummary",
];

const FIRST_WAVE_KEYS = ["careerAccumulation", "riskSummary"];

const SECTION_TITLES = {
  careerAccumulation:   "커리어 축적도",
  levelPositionFit:     "레벨·포지션 적합도",
  compensationMobility: "보상·시장 이동성",
  workStyleExecution:   "직무 수행 방식",
  industryContext:      "산업 맥락",
  riskSummary:          "리스크 요약",
};

// ── helpers ──

function getSafeArray(value) {
  return Array.isArray(value) ? value : [];
}

function pickDisplayLabel(...candidates) {
  for (const v of candidates) {
    const s = String(v ?? "").trim();
    if (s) return s;
  }
  return null;
}

function normalizeReportSectionTitle(sectionKey) {
  return SECTION_TITLES[sectionKey] ?? sectionKey;
}

// readSectionRuntimePosture (Phase 10)
// Maps sectionKey → legacyRuntimePosture target decision.
function readSectionRuntimePosture(legacyRuntimePosture, sectionKey) {
  try {
    const targetMap = {
      careerAccumulation: "careerStory",
      riskSummary:        "topRiskNarratives",
    };
    const targetName = targetMap[sectionKey] ?? null;
    if (!targetName) return null;
    return legacyRuntimePosture?.targets?.[targetName]?.decision ?? null;
  } catch { return null; }
}

// readSectionRolloutState (Phase 10)
function readSectionRolloutState(sentenceDraftRollout, sectionKey) {
  try {
    return sentenceDraftRollout?.sections?.[sectionKey]?.rolloutState ?? null;
  } catch { return null; }
}

// isSectionConsumerReady (Phase 10)
function isSectionConsumerReady(sentenceDraftRollout, sectionKey) {
  try {
    return sentenceDraftRollout?.sections?.[sectionKey]?.rolloutState === "consumer_ready";
  } catch { return false; }
}

// pickSectionSentenceText (Phase 12-A)
// Extracts primary display text from a sectionSentences block (assembly-v1 only).
// careerAccumulation → shortSummary → narrativeLines[0]
// riskSummary        → headline → bulletLines[0]
// Returns null when block is absent, not assembly-v1, or has no usable text.
function pickSectionSentenceText(sectionSentence) {
  if (!sectionSentence || sectionSentence.generationMode !== "assembly-v1") return null;
  const fromShort    = String(sectionSentence.shortSummary  || "").trim();
  if (fromShort) return fromShort;
  const fromHeadline = String(sectionSentence.headline      || "").trim();
  if (fromHeadline) return fromHeadline;
  const fromNarrative = Array.isArray(sectionSentence.narrativeLines)
    ? String(sectionSentence.narrativeLines[0] || "").trim() : "";
  if (fromNarrative) return fromNarrative;
  const fromBullet = Array.isArray(sectionSentence.bulletLines)
    ? String(sectionSentence.bulletLines[0] || "").trim() : "";
  return fromBullet || null;
}

// pickSectionSummaryText (Phase 10)
// First-wave only. Picks first enabled draft textSeed if consumer-ready.
function pickSectionSummaryText(section, sectionKey, sentenceDraftRollout) {
  try {
    if (!FIRST_WAVE_KEYS.includes(sectionKey)) return null;
    if (!isSectionConsumerReady(sentenceDraftRollout, sectionKey)) return null;
    const drafts = getSafeArray(section?.sentenceDrafts);
    for (const draft of drafts) {
      if (!draft?.enabled) continue;
      const text = String(draft?.textSeed ?? "").trim();
      if (text) return text;
    }
    return null;
  } catch { return null; }
}

// buildSectionSurfacePolicy (Phase 10-4)
// Computes explicit surface policy for a section entry.
function buildSectionSurfacePolicy(sectionKey, sectionEntry) {
  const isFirstWave = FIRST_WAVE_KEYS.includes(sectionKey);
  const mode        = isFirstWave ? "report_first" : "hold";
  const rolloutTier = isFirstWave ? "first_wave"   : "hold";
  const reportSummaryEligible =
    isFirstWave &&
    sectionEntry?.renderMode === "sentenceDraft" &&
    typeof sectionEntry?.summaryText === "string" &&
    sectionEntry.summaryText.trim().length > 0;
  return {
    mode,
    rolloutTier,
    legacyFallbackAllowed: true,
    reportSummaryEligible,
  };
}

// buildReportSectionEntry (Phase 10)
function buildReportSectionEntry(sectionKey, section, legacyRuntimePosture, sentenceDraftRollout) {
  const isFirstWave    = FIRST_WAVE_KEYS.includes(sectionKey);
  const consumerReady  = isSectionConsumerReady(sentenceDraftRollout, sectionKey);
  const rolloutState   = readSectionRolloutState(sentenceDraftRollout, sectionKey);
  const runtimePosture = readSectionRuntimePosture(legacyRuntimePosture, sectionKey);
  const narrativeFrame = section?.narrativeFrame ?? null;
  const sentenceDrafts = getSafeArray(section?.sentenceDrafts);
  const status         = section?.status ?? null;

  // Map confidence string → number
  const confStr    = narrativeFrame?.confidence ?? null;
  const confidence = confStr === "high" ? 1 : confStr === "medium" ? 0.6 : confStr === "low" ? 0.3 : null;

  // renderMode: non-first-wave always "hold"
  let renderMode;
  if (!isFirstWave) {
    renderMode = "hold";
  } else if (consumerReady && sentenceDrafts.some((d) => d?.enabled && d?.textSeed)) {
    renderMode = "sentenceDraft";
  } else {
    renderMode = "legacyFallback";
  }

  const summaryText = isFirstWave
    ? pickSectionSummaryText(section, sectionKey, sentenceDraftRollout)
    : null;

  // sourceTrace from narrativeFrame evidencePriority
  const evidencePriority    = getSafeArray(narrativeFrame?.evidencePriority);
  const primarySourceKey    = evidencePriority[0]?.slotKey ?? null;
  const secondarySourceKeys = evidencePriority.slice(1, 3).map((e) => e?.slotKey).filter(Boolean);
  const diagnosticsSourceKeys = getSafeArray(narrativeFrame?.notes).filter((n) =>
    typeof n === "string" && (n.includes("signal") || n.includes("conflict") || n.includes("blocking"))
  );

  const entry = {
    key:            sectionKey,
    title:          normalizeReportSectionTitle(sectionKey),
    status,
    confidence,
    runtimePosture,
    rolloutState,
    consumerReady,
    renderMode,
    summaryText,
    sentenceDrafts,
    narrativeFrame,
    sourceTrace: {
      primarySourceKey,
      secondarySourceKeys,
      diagnosticsSourceKeys,
    },
  };
  // Phase 10-4: attach explicit surface policy
  entry.surfacePolicy = buildSectionSurfacePolicy(sectionKey, entry);
  return entry;
}

// buildReportPresentation (Phase 10-5)
// Builds explicit surface grouping/ordering/placement contract.
function buildReportPresentation() {
  return {
    version: "reportPresentation-v1",
    groupOrder: ["primarySummary", "deferredSections"],
    groups: {
      primarySummary: {
        key: "primarySummary",
        title: "핵심 요약",
        sectionKeys: ["careerAccumulation", "riskSummary"],
      },
      deferredSections: {
        key: "deferredSections",
        title: "후속 해석 대기",
        sectionKeys: [
          "levelPositionFit",
          "compensationMobility",
          "workStyleExecution",
          "industryContext",
        ],
      },
    },
    sectionPlacement: {
      careerAccumulation: { groupKey: "primarySummary",    surfaceIndex: 0, slotKey: "careerSummary", visibleNow: true  },
      riskSummary:        { groupKey: "primarySummary",    surfaceIndex: 1, slotKey: "riskSummary",   visibleNow: true  },
      levelPositionFit:   { groupKey: "deferredSections",  surfaceIndex: 0, slotKey: "hold",          visibleNow: false },
      compensationMobility:{ groupKey: "deferredSections", surfaceIndex: 1, slotKey: "hold",          visibleNow: false },
      workStyleExecution: { groupKey: "deferredSections",  surfaceIndex: 2, slotKey: "hold",          visibleNow: false },
      industryContext:    { groupKey: "deferredSections",  surfaceIndex: 3, slotKey: "hold",          visibleNow: false },
    },
  };
}

// pickContextLabelWithSource (Phase 11-1)
// Tags a pre-resolved label with its source provenance.
function pickContextLabelWithSource(rawLabel) {
  const label = String(rawLabel ?? "").trim();
  if (label) return { label, source: "resolved_label" };
  return { label: null, source: "missing" };
}

// buildReportContextHeader (Phase 11-1)
// Assembles consumer-facing context header: labels + scopeLine.
function buildReportContextHeader({ currentJobLabel, targetJobLabel, currentIndustryLabel, targetIndustryLabel }) {
  const currentJob     = pickContextLabelWithSource(currentJobLabel);
  const targetJob      = pickContextLabelWithSource(targetJobLabel);
  const currentIndustry = pickContextLabelWithSource(currentIndustryLabel);
  const targetIndustry  = pickContextLabelWithSource(targetIndustryLabel);

  let scopeLine = null;
  if (currentJob.label && targetJob.label) {
    scopeLine = `${currentJob.label} → ${targetJob.label}`;
    if (currentIndustry.label && targetIndustry.label) {
      scopeLine += ` · ${currentIndustry.label} → ${targetIndustry.label}`;
    }
  }

  return {
    version: "reportContextHeader-v1",
    currentJob,
    targetJob,
    currentIndustry,
    targetIndustry,
    scopeLine,
  };
}

// ── main export ──

export function buildReportPack({
  interpretationPack    = null,
  legacyRuntimePosture  = null,
  sentenceDraftRollout  = null,
  currentJobLabel       = null,
  targetJobLabel        = null,
  currentIndustryLabel  = null,
  targetIndustryLabel   = null,
} = {}) {
  try {
    const sections = interpretationPack?.sections ?? {};

    const hasSentenceDrafts = Object.values(sections).some((s) =>
      Array.isArray(s?.sentenceDrafts) && s.sentenceDrafts.length > 0
    );

    const reportSections = {};
    const sectionSentences = interpretationPack?.sectionSentences ?? {};
    for (const key of SECTION_ORDER) {
      const section = sections[key] ?? null;
      reportSections[key] = buildReportSectionEntry(
        key, section, legacyRuntimePosture, sentenceDraftRollout
      );
      // Phase 12-A: sectionSentences → summaryText bridge (first-wave only)
      // When sentenceDraftRollout gating hasn't reached consumer_ready yet,
      // sectionSentences (assembly-v1) is the direct usable source.
      // Override summaryText + renderMode so surfacePolicy.reportSummaryEligible becomes true.
      // Phase 11-8 fix: removed !summaryText guard — sentenceDrafts textSeed is a short structural
      // label, not a display sentence; assembly-v1 sectionSentences must always take precedence
      // when available so the real sentence (shortSummary) reaches the consumer surface.
      if (FIRST_WAVE_KEYS.includes(key)) {
        const ssText = pickSectionSentenceText(sectionSentences[key] ?? null);
        if (ssText) {
          reportSections[key].summaryText   = ssText;
          reportSections[key].renderMode    = "sentenceDraft";
          reportSections[key].summarySource = "sectionSentences"; // Phase 11-4B: diagnostic — actual source is sectionSentences, not sentenceDrafts
          // re-evaluate surfacePolicy now that renderMode + summaryText are both set
          reportSections[key].surfacePolicy = buildSectionSurfacePolicy(key, reportSections[key]);
        }
      }
    }

    return {
      meta: {
        version:               "reportPack-v1",
        sourceMode:            "interpretation-first",
        firstWaveKeys:         [...FIRST_WAVE_KEYS],
        hasInterpretationPack: interpretationPack != null,
        hasSentenceDrafts,
      },
      display: {
        currentJobLabel:      pickDisplayLabel(currentJobLabel),
        targetJobLabel:       pickDisplayLabel(targetJobLabel),
        currentIndustryLabel: pickDisplayLabel(currentIndustryLabel),
        targetIndustryLabel:  pickDisplayLabel(targetIndustryLabel),
      },
      sectionOrder:   [...SECTION_ORDER],
      sections:       reportSections,
      presentation:   buildReportPresentation(),
      contextHeader:  buildReportContextHeader({ currentJobLabel, targetJobLabel, currentIndustryLabel, targetIndustryLabel }),
    };
  } catch {
    return {
      meta: {
        version:               "reportPack-v1",
        sourceMode:            "interpretation-first",
        firstWaveKeys:         [...FIRST_WAVE_KEYS],
        hasInterpretationPack: false,
        hasSentenceDrafts:     false,
      },
      display: {
        currentJobLabel:      null,
        targetJobLabel:       null,
        currentIndustryLabel: null,
        targetIndustryLabel:  null,
      },
      sectionOrder: [...SECTION_ORDER],
      sections:     {},
    };
  }
}
