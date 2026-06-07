import { buildMergedControlledCandidateResult } from "./buildMergedControlledCandidateResult.js";
import { createEmptyCareerProfile } from "./careerProfileModel.js";

const CANDIDATE_DISPLAY_LABEL = "검토 필요 후보";
const MISSING_EVIDENCE_DISPLAY_GROUP = "needs_clarification";
const PREVIEW_MODE = "preview_only";

const ALLOWED_BODY_FIELDS = new Set([
  "resumeProfile",
  "workRecords",
  "manualConfirmedCandidates",
  "options",
]);

const ALLOWED_OPTION_FIELDS = new Set([
  "includeResumeProfileCandidates",
  "includeWorkRecordCandidates",
  "includeManualConfirmedCandidates",
]);

const FINAL_APPLY_FIELDS = new Set([
  "applyToCareerProfile",
  "publishToCompany",
  "exposeAsFinal",
  "updateCareerProfile",
]);

const STORAGE_WRITE_FIELDS = new Set([
  "writeToDatabase",
  "writeToSupabase",
]);

const FORBIDDEN_FINAL_OUTPUT_FIELDS = new Set([
  "finalStrengths",
  "confirmedSkills",
  "verifiedStrengths",
]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
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

function makeApiError(status, code, message, details = []) {
  return {
    status,
    body: {
      ok: false,
      error: {
        code,
        message,
        details,
      },
    },
  };
}

function findForbiddenField(value, fields) {
  if (!value || typeof value !== "object") return null;

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findForbiddenField(item, fields);
      if (found) return found;
    }
    return null;
  }

  for (const [key, child] of Object.entries(value)) {
    if (fields.has(key)) return key;
    const found = findForbiddenField(child, fields);
    if (found) return found;
  }

  return null;
}

function validatePreviewRequestBody(body) {
  if (!isPlainObject(body)) {
    return makeApiError(400, "INVALID_INPUT", "Request body must be an object.");
  }

  for (const key of Object.keys(body)) {
    if (!ALLOWED_BODY_FIELDS.has(key)) {
      return makeApiError(400, "INVALID_INPUT", `Unsupported request field: ${key}.`, [{ field: key }]);
    }
  }

  const options = body.options ?? {};
  if (!isPlainObject(options)) {
    return makeApiError(400, "INVALID_INPUT", "options must be an object.");
  }

  const finalApplyField = findForbiddenField(body, FINAL_APPLY_FIELDS);
  if (finalApplyField) {
    return makeApiError(400, "FORBIDDEN_FINAL_APPLY", "Controlled candidate preview cannot apply or publish final profile data.", [{
      field: finalApplyField,
    }]);
  }

  const storageWriteField = findForbiddenField(body, STORAGE_WRITE_FIELDS);
  if (storageWriteField) {
    return makeApiError(400, "FORBIDDEN_STORAGE_WRITE", "Controlled candidate preview must not write to storage.", [{
      field: storageWriteField,
    }]);
  }

  const finalOutputField = findForbiddenField(body, FORBIDDEN_FINAL_OUTPUT_FIELDS);
  if (finalOutputField) {
    return makeApiError(400, "INVALID_INPUT", "Controlled candidate preview must not accept final-strength fields.", [{
      field: finalOutputField,
    }]);
  }

  for (const key of Object.keys(options)) {
    if (!ALLOWED_OPTION_FIELDS.has(key)) {
      return makeApiError(400, "INVALID_INPUT", `Unsupported preview option: ${key}.`, [{ field: `options.${key}` }]);
    }
  }

  if (body.resumeProfile !== undefined && !isPlainObject(body.resumeProfile)) {
    return makeApiError(400, "INVALID_INPUT", "resumeProfile must be an object.");
  }

  if (body.workRecords !== undefined && !Array.isArray(body.workRecords)) {
    return makeApiError(400, "INVALID_INPUT", "workRecords must be an array.");
  }

  if (body.manualConfirmedCandidates !== undefined && !isPlainObject(body.manualConfirmedCandidates)) {
    return makeApiError(400, "INVALID_INPUT", "manualConfirmedCandidates must be an object.");
  }

  return null;
}

function buildPreviewMergeInput(body) {
  const options = body.options ?? {};
  const includeResumeProfileCandidates = options.includeResumeProfileCandidates !== false;
  const includeWorkRecordCandidates = options.includeWorkRecordCandidates !== false;
  const includeManualConfirmedCandidates = options.includeManualConfirmedCandidates === true;

  return {
    resumeProfile: includeResumeProfileCandidates ? body.resumeProfile : undefined,
    workRecords: includeWorkRecordCandidates ? body.workRecords : undefined,
    manualConfirmedCandidates: includeManualConfirmedCandidates ? body.manualConfirmedCandidates : undefined,
  };
}

function hasAuthenticatedSession(session) {
  return Boolean(session && typeof session === "object" && String(session.userId ?? session.user?.id ?? "").trim());
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
export function handleControlledCandidatePreviewApiRequest(request = {}, options = {}) {
  const method = String(request.method ?? "").toUpperCase();
  if (method !== "POST") {
    return makeApiError(405, "METHOD_NOT_ALLOWED", "Only POST is allowed for controlled candidate preview.");
  }

  if (!hasAuthenticatedSession(request.session)) {
    return makeApiError(401, "UNAUTHENTICATED", "Authentication is required.", []);
  }

  const body = request.body ?? {};
  const validationError = validatePreviewRequestBody(body);
  if (validationError) return validationError;

  const buildMerged = options.buildMergedControlledCandidateResult ?? buildMergedControlledCandidateResult;
  const careerProfile = options.createCareerProfile?.() ?? createEmptyCareerProfile();
  const controlledCandidateResult = buildMerged(buildPreviewMergeInput(body), {
    mergeOptions: options.mergeOptions,
  });
  const mapped = mapControlledCandidateExposureResponse({
    careerProfile,
    controlledCandidateResult,
  });

  return {
    status: 200,
    body: {
      ok: true,
      mode: PREVIEW_MODE,
      careerProfile: mapped.careerProfile,
      controlledCandidateResult: mapped.controlledCandidateResult,
      warnings: [],
    },
  };
}
