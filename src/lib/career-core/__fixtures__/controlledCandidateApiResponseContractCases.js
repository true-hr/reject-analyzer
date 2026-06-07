const forbiddenFinalFields = Object.freeze([
  "final" + "Strengths",
  "confirmed" + "Skills",
  "verified" + "Strengths",
]);

const baseCareerProfile = Object.freeze({
  id: "career-profile-api-contract-fixture",
  ownerUserId: "user-1",
  signals: {
    strengthSignals: [],
    riskSignals: [],
  },
});

const sourceTrace = Object.freeze({
  sourceType: "work_record_controlled_candidate",
  sourceField: "workRecords.content",
  sourceRecordId: "work-record-1",
  sourceText: "Grouped repeated VOC and proposed a response standard.",
});

function candidateResult(overrides = {}) {
  return {
    status: "candidate_only",
    displayLabel: "검토 필요 후보",
    appliedToCareerProfile: false,
    mergeStatus: "read_only_candidate",
    exposureLabels: ["candidate_only", "needs_review"],
    mergedStrengthSignals: [],
    mergedRiskSignals: [],
    mergedMissingEvidence: [],
    contradictedSignals: [],
    invalidCandidates: [],
    sourceSummary: {},
    exposureMeta: {
      candidateOnly: true,
      finalDisplayAllowed: false,
      manualConfirmationRequired: true,
      hasConflict: false,
      hasMissingEvidence: false,
      hasInvalidSource: false,
    },
    ...overrides,
    exposureMeta: {
      candidateOnly: true,
      finalDisplayAllowed: false,
      manualConfirmationRequired: true,
      hasConflict: false,
      hasMissingEvidence: false,
      hasInvalidSource: false,
      ...(overrides.exposureMeta ?? {}),
    },
  };
}

function successResponse(resultOverrides = {}) {
  return {
    ok: true,
    mode: "preview_only",
    careerProfile: baseCareerProfile,
    controlledCandidateResult: candidateResult(resultOverrides),
    warnings: [],
  };
}

function errorResponse(code, message, details = []) {
  return {
    ok: false,
    error: {
      code,
      message,
      details,
    },
  };
}

export const controlledCandidateApiResponseContractCases = Object.freeze([
  {
    id: "api_preview_success_candidate_only",
    input: {
      session: { userId: "user-1" },
      request: {
        resumeProfile: { ownerUserId: "user-1" },
        workRecords: [{ id: "work-record-1", ownerUserId: "user-1" }],
        options: {
          includeResumeProfileCandidates: true,
          includeWorkRecordCandidates: true,
          includeManualConfirmedCandidates: false,
        },
      },
    },
    expected: {
      ok: true,
      mode: "preview_only",
      status: "candidate_only",
      appliedToCareerProfile: false,
      forbiddenFields: forbiddenFinalFields,
      response: successResponse({
        exposureLabels: ["candidate_only", "needs_review", "source_backed", "manual_confirmation_required"],
        mergedStrengthSignals: [{
          signal: "customer_voc_structuring",
          evidenceLevel: "explicit_work_record",
          sourceTraces: [sourceTrace],
        }],
        sourceSummary: {
          sourceTraceCount: 1,
          sourceBackedSignalCount: 1,
        },
      }),
    },
  },
  {
    id: "api_preview_reject_apply_to_career_profile",
    input: {
      session: { userId: "user-1" },
      request: {
        options: {
          applyToCareerProfile: true,
        },
      },
    },
    expected: {
      ok: false,
      errorCode: "FORBIDDEN_FINAL_APPLY",
      response: errorResponse("FORBIDDEN_FINAL_APPLY", "Controlled candidates cannot be applied from preview."),
    },
  },
  {
    id: "api_preview_reject_db_write",
    input: {
      session: { userId: "user-1" },
      request: {
        options: {
          writeToDatabase: true,
        },
      },
    },
    expected: {
      ok: false,
      allowedErrorCodes: ["INVALID_INPUT", "FORBIDDEN_STORAGE_WRITE"],
      response: errorResponse("FORBIDDEN_STORAGE_WRITE", "Preview responses must not write controlled candidates to storage."),
    },
  },
  {
    id: "api_preview_unauthenticated",
    input: {
      session: null,
      request: {
        workRecords: [{ id: "work-record-1", ownerUserId: "user-1" }],
      },
    },
    expected: {
      ok: false,
      errorCode: "UNAUTHENTICATED",
      response: errorResponse("UNAUTHENTICATED", "Authentication is required for controlled candidate preview."),
    },
  },
  {
    id: "api_preview_forbidden_resource",
    input: {
      session: { userId: "user-1" },
      request: {
        resumeProfile: { ownerUserId: "user-2" },
        workRecords: [{ id: "work-record-2", ownerUserId: "user-2" }],
      },
    },
    expected: {
      ok: false,
      errorCode: "FORBIDDEN_RESOURCE",
      response: errorResponse("FORBIDDEN_RESOURCE", "Requested resume or work records are outside the session owner scope."),
    },
  },
  {
    id: "api_preview_conflict_response",
    input: {
      session: { userId: "user-1" },
      request: {
        workRecords: [{ id: "work-record-1", ownerUserId: "user-1" }],
      },
    },
    expected: {
      ok: true,
      mode: "preview_only",
      requiredLabels: ["conflict_detected"],
      finalDisplayAllowed: false,
      response: successResponse({
        exposureLabels: ["candidate_only", "needs_review", "conflict_detected"],
        contradictedSignals: [{
          signal: "prioritization_ownership",
          reasonCode: "ownership_conflict",
          clarificationQuestion: "Who made the final prioritization decision?",
          sourceTraces: [sourceTrace],
        }],
        mergedRiskSignals: [{
          signal: "prioritization_ownership",
          reasonCode: "conflicting_source",
          clarificationQuestion: "Was the decision yours or another team member's?",
        }],
        exposureMeta: {
          hasConflict: true,
        },
      }),
    },
  },
  {
    id: "api_preview_missing_evidence_response",
    input: {
      session: { userId: "user-1" },
      request: {
        workRecords: [{ id: "work-record-1", ownerUserId: "user-1" }],
      },
    },
    expected: {
      ok: true,
      mode: "preview_only",
      requiredLabels: ["missing_evidence"],
      preservesClarificationQuestion: true,
      response: successResponse({
        exposureLabels: ["candidate_only", "needs_review", "missing_evidence"],
        mergedMissingEvidence: [{
          signal: "quantified_impact",
          reasonCode: "missing_result_metric",
          clarificationQuestion: "What changed after the response standard was introduced?",
          displayGroup: "needs_clarification",
          displayLabel: "추가 확인 필요",
        }],
        exposureMeta: {
          hasMissingEvidence: true,
        },
      }),
    },
  },
  {
    id: "api_preview_forbid_final_fields",
    input: {
      session: { userId: "user-1" },
      request: {
        manualConfirmedCandidates: {
          strengthSignals: [{
            signal: "enterprise_customer_retention",
            sourceTraces: [sourceTrace],
          }],
        },
        options: {
          includeManualConfirmedCandidates: true,
        },
      },
    },
    expected: {
      ok: true,
      mode: "preview_only",
      forbiddenFields: forbiddenFinalFields,
      shouldAutoMergeIntoCareerProfileSignals: false,
      response: successResponse({
        exposureLabels: ["candidate_only", "needs_review", "source_backed"],
        mergedStrengthSignals: [{
          signal: "enterprise_customer_retention",
          evidenceLevel: "manual_user_confirmed_candidate",
          sourceTraces: [sourceTrace],
        }],
      }),
    },
  },
]);
