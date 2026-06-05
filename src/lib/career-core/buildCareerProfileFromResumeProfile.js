import { analyzeCareerTimeline } from "./analyzeCareerTimeline.js";
import { buildCareerFitSummary } from "./buildCareerFitSummary.js";
import { buildControlledCareerProfileSignals } from "./buildControlledCareerProfileSignals.js";
import { createCareerSignal } from "./careerSignalModel.js";
import { normalizeCareerProfile } from "./careerProfileModel.js";
import { extractCareerSignalsFromResumeProfile } from "./extractCareerSignalsFromResumeProfile.js";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function hasValidSourceTraces(signal) {
  const traces = safeArray(signal?.sourceTraces);
  return traces.length > 0 && traces.every((trace) => String(trace?.sourceText ?? "").trim());
}

function signalsOf(items = []) {
  return safeArray(items).map((item) => item.signal).filter(Boolean);
}

function isEligibleControlledStrength(signal, controlledOutput) {
  return ["explicit", "inferred_strong"].includes(signal?.evidenceConfidence)
    && hasValidSourceTraces(signal)
    && signal?.canApplyToCareerProfile === true
    && controlledOutput?.appliedToCareerProfile === false
    && !signalsOf(controlledOutput?.contradictedSignals).includes(signal.signal);
}

function controlledSignalSource(signal) {
  const trace = safeArray(signal?.sourceTraces)[0];
  return {
    type: "controlled_career_profile_signal",
    refId: String(signal?.signal ?? ""),
    field: String(trace?.sourceField ?? "sourceTraces"),
  };
}

function toControlledCareerSignal(signal, type) {
  return {
    ...createCareerSignal({
      type,
      label: signal?.signal,
      source: controlledSignalSource(signal),
      evidenceText: safeArray(signal?.sourceTraces).map((trace) => trace.sourceText).filter(Boolean).join("\n"),
      confidence: type === "strength_hint" ? 0.85 : 0.8,
      weight: type === "strength_hint" ? 0.8 : 0.7,
    }),
    controlledSignalCandidate: true,
    evidenceConfidence: signal?.evidenceConfidence ?? null,
    reasonCode: signal?.reasonCode ?? null,
    roleFamily: signal?.roleFamily ?? null,
    ownershipLevel: signal?.ownershipLevel ?? null,
    judgmentLevel: signal?.judgmentLevel ?? null,
    sourceTraces: safeArray(signal?.sourceTraces),
  };
}

function uniqueByLabel(signals) {
  const seen = new Set();
  const out = [];

  for (const signal of safeArray(signals)) {
    const key = [signal.type, signal.label, signal.source?.refId, signal.evidenceText].join("::");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(signal);
  }

  return out;
}

function buildControlledSignalCandidates(resumeProfile, options) {
  if (options?.enableControlledOwnershipSignals !== true) {
    return {
      strengthSignals: [],
      riskSignals: [],
      missingEvidence: [],
      controlledOutput: null,
    };
  }

  const controlledOutput = buildControlledCareerProfileSignals(
    resumeProfile,
    options?.controlledOwnershipSignalOptions ?? {}
  );
  const strengthSignals = safeArray(controlledOutput?.candidateStrengthSignals)
    .filter((signal) => isEligibleControlledStrength(signal, controlledOutput))
    .map((signal) => toControlledCareerSignal(signal, "strength_hint"));
  const riskSignals = [
    ...safeArray(controlledOutput?.candidateRiskSignals),
    ...safeArray(controlledOutput?.contradictedSignals),
  ].map((signal) => toControlledCareerSignal(signal, "risk_hint"));
  const missingEvidence = safeArray(controlledOutput?.missingEvidence)
    .filter((item) => item?.clarificationQuestion);

  return {
    strengthSignals,
    riskSignals: uniqueByLabel(riskSignals),
    missingEvidence,
    controlledOutput,
  };
}

export function buildCareerProfileFromResumeProfile(resumeProfile, options = {}) {
  const analysis = analyzeCareerTimeline(resumeProfile?.experiences ?? [], options);
  const signalResult = extractCareerSignalsFromResumeProfile(resumeProfile, analysis);
  const controlledCandidates = buildControlledSignalCandidates(resumeProfile, options);

  const careerProfile = normalizeCareerProfile({
    timeline: analysis.timeline,
    summary: analysis.summary,
    signals: {
      roleFamilies: signalResult.roleFamilies,
      industryDomains: signalResult.industryDomains,
      strengthSignals: [...signalResult.strengthSignals, ...controlledCandidates.strengthSignals],
      riskSignals: [...signalResult.riskSignals, ...controlledCandidates.riskSignals],
      skillSignals: signalResult.skillSignals,
      toolSignals: signalResult.toolSignals,
    },
    meta: {
      source: "resume_profile",
      resumeProfileSchemaVersion: resumeProfile?.schemaVersion ?? null,
      currentMonth: analysis.meta.currentMonth,
      signalSummary: signalResult.summary,
      warnings: analysis.meta.warnings,
      ...(options?.enableControlledOwnershipSignals === true ? {
        controlledSignalCandidates: {
          integrationStatus: controlledCandidates.controlledOutput?.integrationStatus ?? null,
          appliedToCareerProfile: false,
          missingEvidence: controlledCandidates.missingEvidence,
        },
      } : {}),
    },
  });

  if (!options?.target) return careerProfile;

  return normalizeCareerProfile({
    ...careerProfile,
    fit: buildCareerFitSummary(careerProfile, options.target),
  });
}
