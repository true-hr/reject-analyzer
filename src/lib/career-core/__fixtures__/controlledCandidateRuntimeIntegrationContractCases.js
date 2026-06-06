const forbiddenBeforeIntegrationContract = Object.freeze([
  "auto_apply_to_career_profile",
  "default_enable_controlled_merge",
  "write_to_supabase",
  "render_to_ui_as_final_strength",
  "alter_role_fit_scoring",
  "modify_existing_career_profile_schema",
]);

const defaultOptions = Object.freeze({
  enableMergedControlledCandidates: true,
  enableControlledOwnershipSignals: true,
  enableControlledWorkRecordSignals: true,
  includeManualConfirmedCandidates: true,
  applyToCareerProfile: false,
});

const siblingOutputShape = Object.freeze({
  careerProfile: "existing_builder_output",
  controlledCandidateResult: {
    mergedStrengthSignals: [],
    mergedRiskSignals: [],
    mergedMissingEvidence: [],
    contradictedSignals: [],
    invalidCandidates: [],
    mergeStatus: "read_only_candidate",
    appliedToCareerProfile: false,
    sourceSummary: {},
  },
});

export const controlledCandidateRuntimeIntegrationContractCases = Object.freeze([
  {
    id: "separate_read_only_orchestrator_default",
    input: {
      integrationMode: "separate_read_only_orchestrator",
      options: defaultOptions,
    },
    expected: {
      recommendedIntegrationMode: "separate_read_only_orchestrator",
      shouldModifyExistingBuilders: false,
      outputShape: "sibling_controlled_candidate_result",
      outputContract: siblingOutputShape,
      appliedToCareerProfile: false,
      shouldWriteToCareerProfileMetaByDefault: false,
      forbiddenBehaviors: forbiddenBeforeIntegrationContract,
    },
  },
  {
    id: "auto_apply_forbidden_without_manual_confirmation",
    input: {
      integrationMode: "separate_read_only_orchestrator",
      options: {
        ...defaultOptions,
        includeManualConfirmedCandidates: false,
      },
      manualConfirmedCandidates: null,
    },
    expected: {
      shouldBlockFinalApply: true,
      mergeStatus: "read_only_candidate",
      appliedToCareerProfile: false,
      requiresManualConfirmationBeforeFinalApply: true,
      forbiddenBehaviors: [
        "auto_apply_to_career_profile",
        "default_enable_controlled_merge",
      ],
    },
  },
  {
    id: "manual_confirmed_still_read_only_before_ui_contract",
    input: {
      integrationMode: "separate_read_only_orchestrator",
      options: defaultOptions,
      manualConfirmedCandidates: {
        strengthSignals: [{
          signal: "prioritization",
          evidenceLevel: "manual_user_confirmed_candidate",
          sourceTraces: [{
            sourceType: "manual_user_confirmed_candidate",
            sourceText: "I personally decided prioritization.",
            sourceField: "userConfirmation",
            sourceRecordId: "manual-confirmation-1",
          }],
        }],
      },
      uiApiContractStatus: "not_defined",
    },
    expected: {
      shouldBlockFinalApply: true,
      mergeStatus: "read_only_candidate",
      appliedToCareerProfile: false,
      requiresUiApiContractBeforeFinalApply: true,
      forbiddenBehaviors: [
        "render_to_ui_as_final_strength",
        "auto_apply_to_career_profile",
        "write_to_supabase",
      ],
    },
  },
  {
    id: "contradiction_blocks_final_apply",
    input: {
      integrationMode: "separate_read_only_orchestrator",
      conflictScenario: {
        resumeProfileClaim: "ResumeProfile says user owned prioritization",
        workRecordClaim: "WorkRecord says PO handled prioritization",
      },
      controlledCandidateResult: {
        mergedStrengthSignals: [],
        mergedRiskSignals: [{
          signal: "prioritization",
          reasonCode: "contradicted_candidate_blocks_strength",
        }],
        contradictedSignals: [{
          signal: "prioritization",
          reasonCode: "po_handled_prioritization",
        }],
        mergedMissingEvidence: [{
          signal: "prioritization",
          clarificationQuestion: "Who made the final prioritization decision?",
        }],
        mergeStatus: "read_only_candidate",
        appliedToCareerProfile: false,
      },
    },
    expected: {
      shouldBlockFinalApply: true,
      shouldPreserveRiskOrContradiction: true,
      shouldPreserveClarificationQuestion: true,
      shouldModifyCareerProfileStrengthSignals: false,
      appliedToCareerProfile: false,
      forbiddenBehaviors: [
        "auto_apply_to_career_profile",
        "render_to_ui_as_final_strength",
      ],
    },
  },
  {
    id: "source_missing_invalid_candidate",
    input: {
      integrationMode: "separate_read_only_orchestrator",
      controlledCandidateResult: {
        mergedStrengthSignals: [],
        invalidCandidates: [{
          signal: "decision_support",
          reasonCode: "source_missing_strength_invalid",
        }],
        mergeStatus: "read_only_candidate",
        appliedToCareerProfile: false,
      },
    },
    expected: {
      expectsInvalidCandidates: true,
      shouldModifyCareerProfileStrengthSignals: false,
      appliedToCareerProfile: false,
      sourceMissingStrengthDisposition: "invalidCandidates",
      forbiddenBehaviors: [
        "auto_apply_to_career_profile",
        "render_to_ui_as_final_strength",
      ],
    },
  },
  {
    id: "db_write_forbidden_before_storage_contract",
    input: {
      integrationMode: "separate_read_only_orchestrator",
      storageContractStatus: "not_defined",
      options: defaultOptions,
    },
    expected: {
      shouldWriteToDatabase: false,
      shouldWriteToSupabase: false,
      requiresStorageContractBeforeWrite: true,
      appliedToCareerProfile: false,
      forbiddenBehaviors: [
        "write_to_supabase",
        "write_to_database",
        "auto_apply_to_career_profile",
      ],
    },
  },
  {
    id: "api_ui_candidate_label_required",
    input: {
      integrationMode: "separate_read_only_orchestrator",
      exposureSurface: ["api", "ui"],
      options: defaultOptions,
    },
    expected: {
      requiresCandidateLabel: true,
      apiResponseMustMarkCandidate: true,
      uiMustDistinguishCandidateFromFinal: true,
      shouldRenderAsFinalStrength: false,
      appliedToCareerProfile: false,
      forbiddenBehaviors: [
        "render_to_ui_as_final_strength",
        "ui_final_strength_copy",
        "api_final_strength_copy",
      ],
    },
  },
]);
