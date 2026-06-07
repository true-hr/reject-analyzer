const workRecordTrace = Object.freeze({
  sourceType: "work_record_controlled_candidate",
  sourceField: "workRecords.content",
  sourceRecordId: "work-record-1",
  sourceText: "Grouped repeated VOC and proposed a response standard.",
});

const manualTrace = Object.freeze({
  sourceType: "manual_user_confirmed_candidate",
  sourceField: "userConfirmation",
  sourceRecordId: "manual-confirmation-1",
  sourceText: "User confirmed ownership of VOC classification.",
});

function careerProfile(strengthSignals = []) {
  return {
    id: "career-profile-fixture",
    signals: {
      strengthSignals,
      riskSignals: [],
    },
    meta: {
      source: "fixture",
    },
  };
}

export const controlledCandidateExposureResponseCases = Object.freeze([
  {
    id: "map_candidate_only_strength",
    input: {
      careerProfile: careerProfile(),
      controlledCandidateResult: {
        mergedStrengthSignals: [{
          signal: "customer_voc_structuring",
          evidenceLevel: "explicit_work_record",
          sourceTraces: [workRecordTrace],
        }],
      },
    },
    expected: {
      status: "candidate_only",
      requiredLabels: ["candidate_only", "needs_review", "source_backed", "manual_confirmation_required"],
      finalDisplayAllowed: false,
      appliedToCareerProfile: false,
    },
  },
  {
    id: "map_conflict_detected",
    input: {
      careerProfile: careerProfile(),
      controlledCandidateResult: {
        contradictedSignals: [{
          signal: "prioritization_ownership",
          reasonCode: "ownership_conflict",
          clarificationQuestion: "Who made the final prioritization decision?",
          sourceTraces: [workRecordTrace],
        }],
        mergedRiskSignals: [{
          signal: "prioritization_ownership",
          reasonCode: "conflicting_source",
          clarificationQuestion: "Was the decision yours or another team member's?",
        }],
      },
    },
    expected: {
      requiredLabels: ["conflict_detected"],
      finalDisplayAllowed: false,
      preservesContradictedSignals: true,
    },
  },
  {
    id: "map_missing_evidence",
    input: {
      careerProfile: careerProfile(),
      controlledCandidateResult: {
        mergedMissingEvidence: [{
          signal: "quantified_impact",
          reasonCode: "missing_result_metric",
          clarificationQuestion: "What changed after the response standard was introduced?",
        }],
      },
    },
    expected: {
      requiredLabels: ["missing_evidence"],
      missingEvidenceDisplayGroup: "needs_clarification",
      requiresClarificationQuestion: true,
      forbiddenTone: ["defect", "weakness", "fault", "failure"],
    },
  },
  {
    id: "map_invalid_source",
    input: {
      careerProfile: careerProfile(),
      controlledCandidateResult: {
        invalidCandidates: [{
          signal: "decision_support",
          reasonCode: "source_missing_strength_invalid",
          sourceTraces: [],
        }],
      },
    },
    expected: {
      requiredLabels: ["invalid_source"],
      shouldExposeInvalidAsStrength: false,
    },
  },
  {
    id: "map_manual_confirmed_still_candidate",
    input: {
      careerProfile: careerProfile(),
      controlledCandidateResult: {
        mergedStrengthSignals: [{
          signal: "customer_voc_structuring",
          evidenceLevel: "manual_user_confirmed_candidate",
          sourceTraces: [manualTrace, workRecordTrace],
        }],
      },
    },
    expected: {
      status: "candidate_only",
      finalDisplayAllowed: false,
      preservesSourceTrace: true,
    },
  },
  {
    id: "map_api_sibling_shape",
    input: {
      careerProfile: careerProfile(),
      controlledCandidateResult: {
        mergedStrengthSignals: [{
          signal: "support_process_improvement",
          evidenceLevel: "explicit_work_record",
          sourceTraces: [workRecordTrace],
        }],
      },
    },
    expected: {
      hasCareerProfileSibling: true,
      hasControlledCandidateResultSibling: true,
      shouldAutoMergeIntoCareerProfileSignals: false,
    },
  },
  {
    id: "map_forbidden_copy_not_generated",
    input: {
      careerProfile: careerProfile(),
      controlledCandidateResult: {
        mergedStrengthSignals: [{
          signal: "enterprise_customer_retention",
          evidenceLevel: "explicit_work_record",
          sourceTraces: [workRecordTrace],
        }],
      },
    },
    expected: {
      forbiddenCopy: [
        "final" + "Strengths",
        "confirmed" + "Skills",
        "verified" + "Strengths",
        "확정" + " 역량",
        "검증" + " 완료",
        "최종" + " 강점",
        "기업에 바로" + " 공개 가능",
      ],
    },
  },
  {
    id: "map_empty_candidate_result",
    input: {
      careerProfile: careerProfile(),
      controlledCandidateResult: {},
    },
    expected: {
      allowedStatuses: ["candidate_only", "no_candidates"],
      appliedToCareerProfile: false,
      shouldMutateCareerProfile: false,
    },
  },
]);
