import { buildCareerProfileFromResumeProfile } from "./buildCareerProfileFromResumeProfile.js";
import { buildCareerProfileFromWorkRecords } from "./buildCareerProfileFromWorkRecords.js";
import { mergeControlledCandidateSignals } from "./mergeControlledCandidateSignals.js";

const RESUME_SOURCE_TYPE = "resume_profile_controlled_candidate";
const WORK_RECORD_SOURCE_TYPE = "work_record_controlled_candidate";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function safeString(value) {
  return String(value ?? "").trim();
}

function hasResumeProfile(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function hasWorkRecords(value) {
  return Array.isArray(value) && value.length > 0;
}

function signalName(candidate) {
  return safeString(candidate?.signal || candidate?.label);
}

function sourceTracesOf(candidate) {
  const traces = [...safeArray(candidate?.sourceTraces)];
  if (candidate?.sourceTrace) traces.push(candidate.sourceTrace);
  return traces.filter((trace) => trace && typeof trace === "object" && !Array.isArray(trace));
}

function normalizeTrace(trace, sourceType) {
  const normalized = {
    ...safeObject(trace),
    sourceType,
  };

  if (!safeString(normalized.sourceField)) {
    normalized.sourceField = sourceType === WORK_RECORD_SOURCE_TYPE ? "content" : "sourceTraces";
  }

  return normalized;
}

function evidenceLevelFor(candidate, sourceType) {
  const existingLevel = safeString(candidate?.evidenceLevel);
  if (existingLevel) return existingLevel;

  const confidence = safeString(candidate?.evidenceConfidence);
  if (sourceType === RESUME_SOURCE_TYPE && confidence === "explicit") return "explicit_resume_profile";
  if (sourceType === RESUME_SOURCE_TYPE && confidence === "inferred_strong") return "inferred_strong_resume_profile";
  if (sourceType === RESUME_SOURCE_TYPE && confidence) return confidence;

  return sourceType;
}

function normalizeCandidate(candidate, sourceType) {
  return {
    ...safeObject(candidate),
    signal: signalName(candidate),
    sourceType,
    evidenceLevel: evidenceLevelFor(candidate, sourceType),
    sourceTraces: sourceTracesOf(candidate).map((trace) => normalizeTrace(trace, sourceType)),
  };
}

function normalizeMissingEvidence(item, sourceType) {
  return {
    ...safeObject(item),
    signal: signalName(item),
    sourceType,
    sourceTraces: sourceTracesOf(item).map((trace) => normalizeTrace(trace, sourceType)),
  };
}

function isControlledResumeSignal(signal) {
  return signal?.controlledSignalCandidate === true;
}

function isControlledWorkRecordSignal(signal) {
  return signal?.controlledWorkRecordSignalCandidate === true;
}

function isContradictedCandidate(candidate) {
  const evidenceLevel = safeString(candidate?.evidenceLevel);
  const evidenceConfidence = safeString(candidate?.evidenceConfidence);
  const reasonCode = safeString(candidate?.reasonCode);

  return evidenceLevel.includes("contradict")
    || evidenceConfidence.includes("contradict")
    || reasonCode.includes("contradict");
}

function traceTextOf(candidate) {
  return sourceTracesOf(candidate).map((trace) => safeString(trace.sourceText)).join(" ");
}

function expandedContradictedCandidates(candidate) {
  if (!isContradictedCandidate(candidate)) return [candidate];

  const expanded = [candidate];
  const text = traceTextOf(candidate);
  if (candidate.signal === "contradicted_ownership" && /우선순위|priorit/i.test(text)) {
    expanded.push({
      ...candidate,
      signal: "prioritization",
    });
  }

  return expanded;
}

function splitRiskAndContradicted(candidates, sourceType) {
  const riskSignals = [];
  const contradictedSignals = [];

  for (const candidate of candidates.map((item) => normalizeCandidate(item, sourceType))) {
    if (!candidate.signal) continue;
    if (isContradictedCandidate(candidate)) {
      contradictedSignals.push(...expandedContradictedCandidates(candidate));
    } else {
      riskSignals.push(candidate);
    }
  }

  return { riskSignals, contradictedSignals };
}

function extractResumeCandidates(profile) {
  const signals = safeObject(profile?.signals);
  const meta = safeObject(profile?.meta);
  const split = splitRiskAndContradicted(
    safeArray(signals.riskSignals).filter(isControlledResumeSignal),
    RESUME_SOURCE_TYPE
  );

  return {
    strengthSignals: safeArray(signals.strengthSignals)
      .filter(isControlledResumeSignal)
      .map((candidate) => normalizeCandidate(candidate, RESUME_SOURCE_TYPE))
      .filter((candidate) => candidate.signal),
    riskSignals: split.riskSignals,
    missingEvidence: safeArray(meta.controlledSignalCandidates?.missingEvidence)
      .map((item) => normalizeMissingEvidence(item, RESUME_SOURCE_TYPE))
      .filter((item) => item.signal),
    contradictedSignals: split.contradictedSignals,
  };
}

function extractWorkRecordCandidates(profile) {
  const signals = safeObject(profile?.signals);
  const meta = safeObject(profile?.meta);
  const split = splitRiskAndContradicted(
    safeArray(signals.riskSignals).filter(isControlledWorkRecordSignal),
    WORK_RECORD_SOURCE_TYPE
  );

  return {
    strengthSignals: safeArray(signals.strengthSignals)
      .filter(isControlledWorkRecordSignal)
      .map((candidate) => normalizeCandidate(candidate, WORK_RECORD_SOURCE_TYPE))
      .filter((candidate) => candidate.signal),
    riskSignals: split.riskSignals,
    missingEvidence: safeArray(meta.controlledWorkRecordSignalCandidates?.missingEvidence)
      .map((item) => normalizeMissingEvidence(item, WORK_RECORD_SOURCE_TYPE))
      .filter((item) => item.signal),
    contradictedSignals: split.contradictedSignals,
  };
}

function countCandidates(candidates) {
  return safeArray(candidates.strengthSignals).length
    + safeArray(candidates.riskSignals).length
    + safeArray(candidates.missingEvidence).length
    + safeArray(candidates.contradictedSignals).length;
}

function countManualCandidates(manualConfirmedCandidates) {
  const manual = safeObject(manualConfirmedCandidates);
  return safeArray(manual.strengthSignals).length + safeArray(manual.resolvedRisks).length;
}

export function buildMergedControlledCandidateResult(input = {}, options = {}) {
  const {
    resumeProfile,
    workRecords,
    manualConfirmedCandidates,
    resumeOptions,
    workRecordOptions,
  } = safeObject(input);

  const resumeCandidates = hasResumeProfile(resumeProfile)
    ? extractResumeCandidates(buildCareerProfileFromResumeProfile(resumeProfile, {
      ...safeObject(resumeOptions),
      enableControlledOwnershipSignals: true,
    }))
    : {};
  const workRecordCandidates = hasWorkRecords(workRecords)
    ? extractWorkRecordCandidates(buildCareerProfileFromWorkRecords(workRecords, {
      ...safeObject(workRecordOptions),
      enableControlledWorkRecordSignals: true,
    }))
    : {};
  const manualCandidates = safeObject(manualConfirmedCandidates);

  const mergeResult = mergeControlledCandidateSignals({
    resumeCandidates,
    workRecordCandidates,
    manualConfirmedCandidates: manualCandidates,
  }, safeObject(options.mergeOptions));

  return {
    ...mergeResult,
    sourceSummary: {
      hasResumeProfile: hasResumeProfile(resumeProfile),
      hasWorkRecords: hasWorkRecords(workRecords),
      hasManualConfirmedCandidates: countManualCandidates(manualCandidates) > 0,
      resumeCandidateCount: countCandidates(resumeCandidates),
      workRecordCandidateCount: countCandidates(workRecordCandidates),
      manualCandidateCount: countManualCandidates(manualCandidates),
    },
  };
}

export default buildMergedControlledCandidateResult;
