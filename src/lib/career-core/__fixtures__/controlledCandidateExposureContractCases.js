const sourceTrace = Object.freeze({
  sourceType: "work_record_controlled_candidate",
  sourceField: "workRecords.content",
  sourceRecordId: "work-record-1",
  sourceText: "I grouped repeated customer VOC and proposed a support response standard.",
});

const manualTrace = Object.freeze({
  sourceType: "manual_user_confirmed_candidate",
  sourceField: "userConfirmation",
  sourceRecordId: "manual-confirmation-1",
  sourceText: "I confirmed that I owned the VOC classification and response standard.",
});

const baseForbiddenLabels = Object.freeze([
  "final",
  "confirmed",
  "verified",
  "finalStrengths",
  "confirmedSkills",
  "확정 역량",
  "검증 완료",
  "최종 강점",
]);

export const controlledCandidateExposureContractCases = Object.freeze([
  {
    id: "expose_candidate_only_strength",
    input: {
      exposureTarget: "api",
      controlledCandidateResult: {
        mergedStrengthSignals: [{
          signal: "customer_voc_structuring",
          evidenceLevel: "explicit_work_record",
          sourceTraces: [sourceTrace],
        }],
        mergeStatus: "read_only_candidate",
        appliedToCareerProfile: false,
      },
    },
    expected: {
      status: "candidate_only",
      requiredLabels: ["candidate_only", "manual_confirmation_required"],
      forbiddenLabels: baseForbiddenLabels,
      shouldExposeAsFinal: false,
    },
  },
  {
    id: "expose_source_backed_manual_pending",
    input: {
      exposureTarget: "ui",
      controlledCandidateResult: {
        mergedStrengthSignals: [{
          signal: "support_process_improvement",
          evidenceLevel: "explicit_work_record",
          sourceTraces: [sourceTrace],
        }],
        sourceSummary: {
          sourceTraceCount: 1,
          sourceBackedSignalCount: 1,
        },
        mergeStatus: "read_only_candidate",
        appliedToCareerProfile: false,
      },
    },
    expected: {
      status: "needs_review",
      requiredLabels: ["source_backed", "needs_review", "manual_confirmation_required"],
      forbiddenLabels: baseForbiddenLabels,
      shouldExposeAsFinal: false,
      forbiddenCopy: ["확정", "최종", "검증 완료"],
    },
  },
  {
    id: "expose_contradicted_signal_conflict",
    input: {
      exposureTarget: "ui",
      controlledCandidateResult: {
        contradictedSignals: [{
          signal: "prioritization",
          reasonCode: "ownership_conflict",
          clarificationQuestion: "Who made the final prioritization decision?",
          sourceTraces: [sourceTrace],
        }],
        mergedRiskSignals: [{
          signal: "prioritization",
          reasonCode: "conflicting_source",
          clarificationQuestion: "Was the prioritization decision yours or the PO's?",
        }],
        mergeStatus: "read_only_candidate",
        appliedToCareerProfile: false,
      },
    },
    expected: {
      status: "conflict_detected",
      requiredLabels: ["candidate_only", "conflict_detected", "needs_review"],
      forbiddenLabels: baseForbiddenLabels,
      shouldExposeAsFinal: false,
      requiresClarificationQuestion: true,
    },
  },
  {
    id: "expose_missing_evidence_as_question",
    input: {
      exposureTarget: "ui",
      controlledCandidateResult: {
        mergedMissingEvidence: [{
          signal: "quantified_impact",
          reasonCode: "missing_result_metric",
          clarificationQuestion: "What changed after the VOC response standard was introduced?",
        }],
        mergeStatus: "read_only_candidate",
        appliedToCareerProfile: false,
      },
    },
    expected: {
      status: "missing_evidence",
      requiredLabels: ["missing_evidence", "needs_review"],
      forbiddenLabels: [...baseForbiddenLabels, "defect", "weakness", "단점", "결핍"],
      shouldExposeAsFinal: false,
      requiresClarificationQuestion: true,
      displayTone: "additional_confirmation_needed",
    },
  },
  {
    id: "expose_invalid_source_blocked",
    input: {
      exposureTarget: "api",
      controlledCandidateResult: {
        invalidCandidates: [{
          signal: "decision_support",
          reasonCode: "source_missing_strength_invalid",
          sourceTraces: [],
        }],
        mergeStatus: "read_only_candidate",
        appliedToCareerProfile: false,
      },
    },
    expected: {
      status: "invalid_source",
      requiredLabels: ["invalid_source", "candidate_only"],
      forbiddenLabels: baseForbiddenLabels,
      shouldExposeAsFinal: false,
      shouldExposeStrengthCandidate: false,
    },
  },
  {
    id: "expose_manual_confirmed_still_candidate",
    input: {
      exposureTarget: "api",
      contractReadiness: {
        uiContractComplete: false,
        apiContractComplete: false,
        dbStorageContractComplete: false,
        userDisclosureComplete: false,
      },
      controlledCandidateResult: {
        mergedStrengthSignals: [{
          signal: "customer_voc_structuring",
          evidenceLevel: "manual_user_confirmed_candidate",
          sourceTraces: [manualTrace, sourceTrace],
        }],
        mergeStatus: "read_only_candidate",
        appliedToCareerProfile: false,
      },
    },
    expected: {
      status: "candidate_only",
      requiredLabels: ["candidate_only", "source_backed", "needs_review"],
      forbiddenLabels: baseForbiddenLabels,
      shouldExposeAsFinal: false,
      shouldApplyToCareerProfile: false,
      shouldPreserveSourceTrace: true,
    },
  },
  {
    id: "expose_api_response_sibling_result",
    input: {
      exposureTarget: "api",
      apiResponseShape: {
        careerProfile: {
          signals: {
            strengthSignals: [],
          },
        },
        controlledCandidateResult: {
          status: "candidate_only",
          displayLabel: "검토 필요 후보",
          appliedToCareerProfile: false,
          mergeStatus: "read_only_candidate",
          mergedStrengthSignals: [],
          mergedRiskSignals: [],
          mergedMissingEvidence: [],
          contradictedSignals: [],
          invalidCandidates: [],
          sourceSummary: {},
        },
      },
    },
    expected: {
      status: "candidate_only",
      requiredLabels: ["candidate_only", "needs_review"],
      forbiddenLabels: baseForbiddenLabels,
      shouldExposeAsFinal: false,
      requiresSiblingControlledCandidateResult: true,
      shouldAutoMergeIntoCareerProfileSignals: false,
    },
  },
  {
    id: "expose_forbid_final_strength_copy",
    input: {
      exposureTarget: "ui",
      copySurface: {
        candidateTitle: "검토 필요 후보",
        candidateDescription: "근거는 있으나 최종 확정 전입니다.",
      },
    },
    expected: {
      status: "needs_review",
      requiredLabels: ["candidate_only", "needs_review"],
      forbiddenLabels: baseForbiddenLabels,
      shouldExposeAsFinal: false,
      forbiddenCopy: [
        "확정 역량",
        "검증 완료",
        "최종 강점",
        "당신의 핵심 역량입니다",
        "기업에 바로 공개 가능",
      ],
    },
  },
]);
