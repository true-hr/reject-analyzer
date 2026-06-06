const resumeTrace = (sourceText, sourceRecordId = "resume-profile-v1") => ({
  sourceType: "resume_profile_controlled_candidate",
  sourceText,
  sourceRecordId,
  sourceField: "resumeProfile.experiences",
});

const workRecordTrace = (sourceText, sourceRecordId = "work-record-1") => ({
  sourceType: "work_record_controlled_candidate",
  sourceText,
  sourceRecordId,
  sourceField: "workRecords.content",
});

const manualTrace = (sourceText) => ({
  sourceType: "manual_user_confirmed_candidate",
  sourceText,
  sourceRecordId: "manual-confirmation-1",
  sourceField: "userConfirmation",
});

export const controlledCandidateMergeUtilityCases = Object.freeze([
  {
    id: "merge_same_signal_resume_and_workrecord",
    input: {
      resumeCandidates: {
        strengthSignals: [{
          signal: "problem_definition",
          evidenceLevel: "explicit_resume_profile",
          confidence: 0.86,
          sourceTraces: [resumeTrace("Defined onboarding drop-off from funnel evidence.")],
        }],
      },
      workRecordCandidates: {
        strengthSignals: [{
          signal: "problem_definition",
          evidenceLevel: "explicit_work_record",
          confidence: 0.82,
          sourceTraces: [workRecordTrace("Analyzed onboarding drop-off using funnel data and customer inquiries.")],
        }],
      },
    },
    expected: {
      mergedStrengthSignals: [{ signal: "problem_definition", sourceTraceCount: 2, confidence: 0.86 }],
      mergedRiskSignals: [],
      mergedMissingEvidence: [],
      contradictedSignals: [],
      invalidCandidates: [],
      shouldBlockFinalApply: false,
    },
  },
  {
    id: "merge_resume_strength_workrecord_supporting_trace",
    input: {
      resumeCandidates: {
        strengthSignals: [{
          signal: "requirements_definition",
          evidenceLevel: "explicit_resume_profile",
          confidence: 0.88,
          sourceTraces: [resumeTrace("Owned requirements definition for checkout improvement.")],
        }],
      },
      workRecordCandidates: {
        supportingEvidence: [{
          signal: "stakeholder_context",
          supportsSignal: "requirements_definition",
          evidenceLevel: "explicit_work_record",
          sourceTraces: [workRecordTrace("Compared CS inquiries with engineering constraints before requirements handoff.")],
        }],
      },
    },
    expected: {
      mergedStrengthSignals: [{ signal: "requirements_definition", sourceTraceCount: 1, supportingTraceCount: 1 }],
      mergedRiskSignals: [],
      mergedMissingEvidence: [],
      contradictedSignals: [],
      invalidCandidates: [],
      shouldBlockFinalApply: false,
    },
  },
  {
    id: "merge_workrecord_weak_does_not_upgrade",
    input: {
      workRecordCandidates: {
        strengthSignals: [{
          signal: "requirements_definition",
          evidenceLevel: "inferred_weak_activity",
          confidence: 0.3,
          reasonCode: "inferred_weak_activity",
          sourceTraces: [workRecordTrace("Organized a list of requests that PM had already defined.")],
        }],
        missingEvidence: [{
          signal: "requirements_definition",
          reasonCode: "weak_ownership_evidence",
          clarificationQuestion: "What requirement scope did you personally define or judge?",
          sourceTraces: [workRecordTrace("Organized a list of requests that PM had already defined.")],
        }],
      },
    },
    expected: {
      mergedStrengthSignals: [],
      mergedRiskSignals: [{ signal: "requirements_definition" }],
      mergedMissingEvidence: [{ signal: "requirements_definition" }],
      contradictedSignals: [],
      invalidCandidates: [],
      shouldBlockFinalApply: false,
    },
  },
  {
    id: "merge_contradicted_prioritization",
    input: {
      resumeCandidates: {
        strengthSignals: [{
          signal: "prioritization",
          evidenceLevel: "explicit_resume_profile",
          confidence: 0.84,
          sourceTraces: [resumeTrace("Owned prioritization for onboarding improvements.")],
        }],
      },
      workRecordCandidates: {
        contradictedSignals: [{
          signal: "prioritization",
          evidenceLevel: "contradicted_ownership",
          reasonCode: "po_handled_prioritization",
          sourceTraces: [workRecordTrace("The PO handled final prioritization.")],
        }],
      },
    },
    expected: {
      mergedStrengthSignals: [],
      mergedRiskSignals: [{ signal: "prioritization", sourceTraceCount: 2 }],
      mergedMissingEvidence: [{ signal: "prioritization" }],
      contradictedSignals: [{ signal: "prioritization" }],
      invalidCandidates: [],
      shouldBlockFinalApply: true,
    },
  },
  {
    id: "merge_missing_evidence_dedupe",
    input: {
      resumeCandidates: {
        missingEvidence: [{
          signal: "post_release_monitoring",
          reasonCode: "resume_missing_metric_followup",
          clarificationQuestion: "Which metric did you monitor after release?",
          sourceTraces: [resumeTrace("Feature launch was stated without follow-up metrics.")],
        }],
      },
      workRecordCandidates: {
        missingEvidence: [{
          signal: "post_release_monitoring",
          reasonCode: "work_record_missing_followup",
          clarificationQuestion: "What result or next action did the work record confirm after release?",
          sourceTraces: [workRecordTrace("Released the improvement.")],
        }],
      },
    },
    expected: {
      mergedStrengthSignals: [],
      mergedRiskSignals: [],
      mergedMissingEvidence: [{ signal: "post_release_monitoring", sourceTraceCount: 2, relatedQuestionCount: 1 }],
      contradictedSignals: [],
      invalidCandidates: [],
      shouldBlockFinalApply: false,
    },
  },
  {
    id: "merge_source_missing_strength_invalid",
    input: {
      resumeCandidates: {
        strengthSignals: [{
          signal: "decision_support",
          evidenceLevel: "explicit_resume_profile",
          confidence: 0.8,
          sourceTraces: [],
        }],
      },
    },
    expected: {
      mergedStrengthSignals: [],
      mergedRiskSignals: [],
      mergedMissingEvidence: [],
      contradictedSignals: [],
      invalidCandidates: [{ signal: "decision_support", reasonCode: "source_missing_strength_invalid" }],
      shouldBlockFinalApply: false,
    },
  },
  {
    id: "merge_manual_confirmed_overrides_candidate",
    input: {
      manualConfirmedCandidates: {
        strengthSignals: [{
          signal: "prioritization",
          evidenceLevel: "manual_user_confirmed_candidate",
          confidence: 1,
          sourceTraces: [manualTrace("I personally decided the prioritization.")],
        }],
      },
      workRecordCandidates: {
        riskSignals: [{
          signal: "prioritization",
          reasonCode: "ownership_unclear",
          sourceTraces: [workRecordTrace("Passed along the request list.")],
        }],
      },
    },
    expected: {
      mergedStrengthSignals: [{ signal: "prioritization", evidenceLevel: "manual_user_confirmed_candidate" }],
      mergedRiskSignals: [{ signal: "prioritization", resolutionState: "related_or_resolved_by_manual_confirmation" }],
      mergedMissingEvidence: [],
      contradictedSignals: [],
      invalidCandidates: [],
      shouldBlockFinalApply: false,
    },
  },
  {
    id: "merge_multiple_sources_no_overwrite",
    input: {
      resumeCandidates: {
        strengthSignals: [{
          signal: "root_cause_analysis",
          evidenceLevel: "explicit_resume_profile",
          confidence: 0.85,
          sourceTraces: [resumeTrace("Analyzed conversion drop root cause in resume profile.")],
        }],
      },
      workRecordCandidates: {
        strengthSignals: [{
          signal: "root_cause_analysis",
          evidenceLevel: "explicit_work_record",
          confidence: 0.83,
          sourceTraces: [workRecordTrace("Compared SQL event logs to diagnose conversion decline.")],
        }],
      },
      manualConfirmedCandidates: {
        strengthSignals: [{
          signal: "root_cause_analysis",
          evidenceLevel: "manual_user_confirmed_candidate",
          confidence: 1,
          sourceTraces: [manualTrace("I set the root-cause analysis criteria and reported the conclusion.")],
        }],
      },
    },
    expected: {
      mergedStrengthSignals: [{ signal: "root_cause_analysis", evidenceLevel: "manual_user_confirmed_candidate", sourceTraceCount: 3 }],
      mergedRiskSignals: [],
      mergedMissingEvidence: [],
      contradictedSignals: [],
      invalidCandidates: [],
      shouldBlockFinalApply: false,
    },
  },
]);
