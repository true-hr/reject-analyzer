const MERGE_STATUS = "read_only_candidate";

const WEAK_EVIDENCE_LEVELS = new Set([
  "inferred_weak",
  "inferred_weak_activity",
  "weak_or_missing",
  "missing_context",
  "absent",
]);

const CONTRADICTED_EVIDENCE_LEVELS = new Set([
  "contradicted",
  "contradicted_ownership",
]);

const PRIORITY_BY_LEVEL = new Map([
  ["manual_user_confirmed_candidate", 600],
  ["explicit_resume_profile", 500],
  ["explicit", 450],
  ["explicit_work_record", 400],
  ["inferred_strong_resume_profile", 300],
  ["inferred_strong", 250],
  ["inferred_strong_work_record", 200],
  ["weak_or_missing", 100],
]);

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function safeString(value) {
  return String(value ?? "").trim();
}

function signalName(candidate) {
  return safeString(candidate?.signal || candidate?.label);
}

function sourceTracesOf(candidate) {
  const traces = safeArray(candidate?.sourceTraces);
  if (candidate?.sourceTrace) traces.push(candidate.sourceTrace);
  return traces.filter((trace) => trace && typeof trace === "object");
}

function hasValidSourceTrace(trace) {
  const sourceType = safeString(trace?.sourceType);
  if (!safeString(trace?.sourceText)) return false;
  if (!safeString(trace?.sourceField)) return false;
  if (!sourceType) return false;
  if (sourceType === "work_record_controlled_candidate" && !safeString(trace?.sourceRecordId)) return false;
  return true;
}

function hasValidStrengthSource(candidate) {
  return sourceTracesOf(candidate).some(hasValidSourceTrace);
}

function uniqueTraces(traces) {
  const out = [];
  const seen = new Set();

  for (const trace of safeArray(traces)) {
    const key = [
      trace.sourceType,
      trace.sourceRecordId,
      trace.sourceField,
      trace.sourceText,
    ].map(safeString).join("::");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trace);
  }

  return out;
}

function priorityOf(candidate) {
  const sourcePriority = PRIORITY_BY_LEVEL.get(safeString(candidate?.sourceType));
  const levelPriority = PRIORITY_BY_LEVEL.get(safeString(candidate?.evidenceLevel));
  return Math.max(sourcePriority ?? 0, levelPriority ?? 0);
}

function confidenceOf(candidate) {
  return Number.isFinite(candidate?.confidence) ? candidate.confidence : 0;
}

function isWeakCandidate(candidate) {
  const level = safeString(candidate?.evidenceLevel);
  return WEAK_EVIDENCE_LEVELS.has(level) || safeString(candidate?.reasonCode).includes("weak");
}

function isContradictedCandidate(candidate) {
  return CONTRADICTED_EVIDENCE_LEVELS.has(safeString(candidate?.evidenceLevel))
    || safeString(candidate?.reasonCode).includes("contradict");
}

function normalizeCandidate(candidate, sourceType) {
  return {
    ...safeObject(candidate),
    signal: signalName(candidate),
    sourceType,
    sourceTraces: sourceTracesOf(candidate),
  };
}

function candidateSet(candidates, sourceType) {
  return safeArray(candidates).map((candidate) => normalizeCandidate(candidate, sourceType)).filter((candidate) => candidate.signal);
}

function collectInput(input) {
  const resume = safeObject(input.resumeCandidates);
  const workRecord = safeObject(input.workRecordCandidates);
  const manual = safeObject(input.manualConfirmedCandidates);

  return {
    strength: [
      ...candidateSet(resume.strengthSignals, "resume_profile_controlled_candidate"),
      ...candidateSet(workRecord.strengthSignals, "work_record_controlled_candidate"),
      ...candidateSet(manual.strengthSignals, "manual_user_confirmed_candidate"),
    ],
    risk: [
      ...candidateSet(resume.riskSignals, "resume_profile_controlled_candidate"),
      ...candidateSet(workRecord.riskSignals, "work_record_controlled_candidate"),
      ...candidateSet(manual.resolvedRisks, "manual_user_confirmed_candidate"),
    ],
    missing: [
      ...candidateSet(resume.missingEvidence, "resume_profile_controlled_candidate"),
      ...candidateSet(workRecord.missingEvidence, "work_record_controlled_candidate"),
    ],
    contradicted: [
      ...candidateSet(resume.contradictedSignals, "resume_profile_controlled_candidate"),
      ...candidateSet(workRecord.contradictedSignals, "work_record_controlled_candidate"),
    ],
    supporting: [
      ...candidateSet(resume.supportingEvidence, "resume_profile_controlled_candidate"),
      ...candidateSet(workRecord.supportingEvidence, "work_record_controlled_candidate"),
    ],
  };
}

function invalidCandidate(candidate, reasonCode) {
  return {
    signal: candidate.signal,
    reasonCode,
    sourceType: candidate.sourceType,
    evidenceLevel: candidate.evidenceLevel ?? null,
    sourceTraces: sourceTracesOf(candidate),
  };
}

function groupBySignal(candidates) {
  const groups = new Map();
  for (const candidate of candidates) {
    const group = groups.get(candidate.signal) ?? [];
    group.push(candidate);
    groups.set(candidate.signal, group);
  }
  return groups;
}

function buildStrengthSignal(signal, candidates, supportingCandidates) {
  const sorted = [...candidates].sort((a, b) => {
    const priorityDelta = priorityOf(b) - priorityOf(a);
    if (priorityDelta) return priorityDelta;
    return confidenceOf(b) - confidenceOf(a);
  });
  const primary = sorted[0];
  const sourceTraces = uniqueTraces(sorted.flatMap(sourceTracesOf));
  const supportingTraces = uniqueTraces(supportingCandidates.flatMap(sourceTracesOf));

  return {
    signal,
    evidenceLevel: primary.evidenceLevel ?? primary.sourceType,
    confidence: Math.max(...sorted.map(confidenceOf), 0),
    sourceType: primary.sourceType,
    sourceTraces,
    ...(supportingTraces.length ? { supportingTraces } : {}),
  };
}

function riskSignal(candidate, sourceTraces, extra = {}) {
  return {
    signal: candidate.signal,
    reasonCode: candidate.reasonCode ?? candidate.evidenceLevel ?? "controlled_candidate_risk",
    evidenceLevel: candidate.evidenceLevel ?? null,
    sourceType: candidate.sourceType,
    sourceTraces: uniqueTraces(sourceTraces.length ? sourceTraces : sourceTracesOf(candidate)),
    ...extra,
  };
}

function missingKey(item) {
  return item.signal;
}

function mergeMissingEvidence(missing, invalidCandidates) {
  const groups = new Map();
  for (const item of missing) {
    if (!safeString(item.clarificationQuestion)) {
      invalidCandidates.push(invalidCandidate(item, "missing_evidence_without_clarification_question"));
      continue;
    }

    const key = missingKey(item);
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }

  return [...groups.entries()].map(([signal, items]) => {
    const primary = items[0];
    return {
      signal,
      clarificationQuestion: primary.clarificationQuestion,
      relatedQuestions: [
        ...new Set(items.slice(1).map((item) => item.clarificationQuestion).filter(Boolean)),
      ],
      reasonCodes: [
        ...new Set(items.map((item) => item.reasonCode).filter(Boolean)),
      ],
      sourceTraces: uniqueTraces(items.flatMap(sourceTracesOf)),
    };
  });
}

export function mergeControlledCandidateSignals(input = {}, options = {}) {
  const collected = collectInput(input);
  const invalidCandidates = [];
  const mergedRiskSignals = [];
  const contradictedSignals = [];
  const mergeableStrength = [];

  for (const candidate of collected.strength) {
    if (!hasValidStrengthSource(candidate)) {
      invalidCandidates.push(invalidCandidate(candidate, "source_missing_strength_invalid"));
      continue;
    }
    if (isWeakCandidate(candidate)) {
      mergedRiskSignals.push(riskSignal(candidate, sourceTracesOf(candidate), {
        reasonCode: candidate.reasonCode ?? "weak_evidence_not_strength",
      }));
      continue;
    }
    if (isContradictedCandidate(candidate)) {
      contradictedSignals.push(riskSignal(candidate, sourceTracesOf(candidate), {
        reasonCode: candidate.reasonCode ?? "contradicted_strength_candidate",
      }));
      continue;
    }
    mergeableStrength.push(candidate);
  }

  const strengthGroups = groupBySignal(mergeableStrength);
  const contradictedGroups = groupBySignal(collected.contradicted);
  const supportingGroups = groupBySignal(collected.supporting.map((candidate) => ({
    ...candidate,
    signal: safeString(candidate.supportsSignal) || candidate.signal,
  })));
  const manualSignals = new Set(mergeableStrength
    .filter((candidate) => candidate.sourceType === "manual_user_confirmed_candidate")
    .map((candidate) => candidate.signal));
  const mergedStrengthSignals = [];
  const generatedMissingEvidence = [];
  let shouldBlockFinalApply = false;

  for (const [signal, candidates] of strengthGroups.entries()) {
    const contradictions = contradictedGroups.get(signal) ?? [];
    if (contradictions.length && !manualSignals.has(signal)) {
      shouldBlockFinalApply = true;
      const conflictTraces = uniqueTraces([
        ...candidates.flatMap(sourceTracesOf),
        ...contradictions.flatMap(sourceTracesOf),
      ]);
      for (const contradiction of contradictions) {
        const separated = riskSignal(contradiction, conflictTraces, {
          reasonCode: contradiction.reasonCode ?? "contradicted_candidate_blocks_strength",
        });
        contradictedSignals.push(separated);
        mergedRiskSignals.push(separated);
      }
      generatedMissingEvidence.push({
        signal,
        clarificationQuestion: options.contradictionClarificationQuestion
          ?? `Clarify ownership and decision scope for ${signal}.`,
        reasonCode: "contradicted_candidate_requires_clarification",
        sourceTraces: conflictTraces,
      });
      continue;
    }

    mergedStrengthSignals.push(buildStrengthSignal(
      signal,
      candidates,
      supportingGroups.get(signal) ?? []
    ));
  }

  for (const candidate of collected.contradicted) {
    if (strengthGroups.has(candidate.signal) && !manualSignals.has(candidate.signal)) continue;
    const separated = riskSignal(candidate, sourceTracesOf(candidate), {
      reasonCode: candidate.reasonCode ?? "contradicted_candidate",
    });
    contradictedSignals.push(separated);
    mergedRiskSignals.push(separated);
  }

  for (const candidate of collected.risk) {
    const relatedManual = manualSignals.has(candidate.signal);
    mergedRiskSignals.push(riskSignal(candidate, sourceTracesOf(candidate), relatedManual ? {
      resolutionState: "related_or_resolved_by_manual_confirmation",
    } : {}));
  }

  const mergedMissingEvidence = mergeMissingEvidence([
    ...collected.missing,
    ...generatedMissingEvidence,
  ], invalidCandidates);

  return {
    mergedStrengthSignals,
    mergedRiskSignals,
    mergedMissingEvidence,
    contradictedSignals,
    invalidCandidates,
    mergeStatus: MERGE_STATUS,
    appliedToCareerProfile: false,
    shouldBlockFinalApply,
  };
}

export default mergeControlledCandidateSignals;
