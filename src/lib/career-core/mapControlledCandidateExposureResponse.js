const CANDIDATE_DISPLAY_LABEL = "검토 필요 후보";
const MISSING_EVIDENCE_DISPLAY_GROUP = "needs_clarification";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function cloneValue(value) {
  if (value === undefined) return value;
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function hasManualConfirmation(signal) {
  if (!signal || typeof signal !== "object") return false;

  const evidenceLevel = String(signal.evidenceLevel ?? "");
  if (evidenceLevel.includes("manual_user")) return true;

  return asArray(signal.sourceTraces).some((trace) => {
    const sourceType = String(trace?.sourceType ?? "");
    return sourceType.includes("manual_user");
  });
}

function hasSourceTrace(signal) {
  return asArray(signal?.sourceTraces).length > 0;
}

function mapMissingEvidenceItem(item) {
  return {
    ...item,
    displayGroup: item.displayGroup ?? MISSING_EVIDENCE_DISPLAY_GROUP,
    displayLabel: item.displayLabel ?? "추가 확인 필요",
  };
}

function toInvalidMissingEvidence(item) {
  return {
    ...item,
    reasonCode: item.reasonCode ?? "missing_clarification_question",
    invalidReason: "missing_clarification_question",
    displayGroup: "invalid_source",
  };
}

function summarizeSources(controlledCandidateResult, sourceBackedStrengths) {
  const providedSummary = controlledCandidateResult.sourceSummary;
  if (providedSummary && typeof providedSummary === "object" && !Array.isArray(providedSummary)) {
    return cloneValue(providedSummary);
  }

  const sourceTraceCount = sourceBackedStrengths.reduce((count, signal) => {
    return count + asArray(signal.sourceTraces).length;
  }, 0);

  if (sourceTraceCount === 0) return {};

  return {
    sourceTraceCount,
    sourceBackedSignalCount: sourceBackedStrengths.length,
  };
}

export function mapControlledCandidateExposureResponse(input = {}, options = {}) {
  const careerProfile = cloneValue(input.careerProfile);
  const controlledCandidateResult = input.controlledCandidateResult ?? {};

  const mergedStrengthSignals = cloneValue(asArray(controlledCandidateResult.mergedStrengthSignals));
  const mergedRiskSignals = cloneValue(asArray(controlledCandidateResult.mergedRiskSignals));
  const contradictedSignals = cloneValue(asArray(controlledCandidateResult.contradictedSignals));
  const rawMissingEvidence = cloneValue(asArray(controlledCandidateResult.mergedMissingEvidence));
  const rawInvalidCandidates = cloneValue(asArray(controlledCandidateResult.invalidCandidates));

  const displayableMissingEvidence = rawMissingEvidence
    .filter((item) => String(item?.clarificationQuestion ?? "").trim())
    .map(mapMissingEvidenceItem);
  const missingWithoutQuestion = rawMissingEvidence
    .filter((item) => !String(item?.clarificationQuestion ?? "").trim())
    .map(toInvalidMissingEvidence);
  const invalidCandidates = [...rawInvalidCandidates, ...missingWithoutQuestion];

  const sourceBackedStrengths = mergedStrengthSignals.filter(hasSourceTrace);
  const hasStrengthCandidate = mergedStrengthSignals.length > 0;
  const hasManualConfirmedSignal = mergedStrengthSignals.some(hasManualConfirmation);
  const hasConflict = contradictedSignals.length > 0;
  const hasMissingEvidence = displayableMissingEvidence.length > 0;
  const hasInvalidSource = invalidCandidates.length > 0;

  const exposureLabels = new Set(["candidate_only", "needs_review"]);
  if (hasStrengthCandidate) exposureLabels.add("source_backed");
  if (!hasManualConfirmedSignal || options.requireManualConfirmation === true) {
    exposureLabels.add("manual_confirmation_required");
  }
  if (hasConflict) exposureLabels.add("conflict_detected");
  if (hasMissingEvidence) exposureLabels.add("missing_evidence");
  if (hasInvalidSource) exposureLabels.add("invalid_source");

  return {
    careerProfile,
    controlledCandidateResult: {
      status: "candidate_only",
      displayLabel: CANDIDATE_DISPLAY_LABEL,
      appliedToCareerProfile: false,
      mergeStatus: "read_only_candidate",
      exposureLabels: [...exposureLabels],
      mergedStrengthSignals,
      mergedRiskSignals,
      mergedMissingEvidence: displayableMissingEvidence,
      contradictedSignals,
      invalidCandidates,
      sourceSummary: summarizeSources(controlledCandidateResult, sourceBackedStrengths),
      exposureMeta: {
        candidateOnly: true,
        finalDisplayAllowed: false,
        manualConfirmationRequired: exposureLabels.has("manual_confirmation_required"),
        hasConflict,
        hasMissingEvidence,
        hasInvalidSource,
      },
    },
  };
}
