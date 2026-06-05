const resumeTrace = (sourceText, sourceField = "resumeProfile.experiences") => ({
  sourceType: "resume_profile_controlled_candidate",
  sourceText,
  sourceRecordId: "resume-profile-v1",
  sourceField,
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

export const controlledCandidateMergePolicyCases = Object.freeze([
  {
    id: "merge_same_signal_resume_and_workrecord",
    input: {
      resumeCandidates: {
        strengthSignals: [{
          signal: "problem_definition",
          evidenceLevel: "explicit_resume_profile",
          confidence: 0.86,
          sourceTraces: [resumeTrace("Defined the onboarding drop-off problem from funnel evidence.")],
        }],
      },
      workRecordCandidates: {
        strengthSignals: [{
          signal: "problem_definition",
          evidenceLevel: "explicit_work_record",
          confidence: 0.82,
          sourceTraces: [workRecordTrace("온보딩 이탈 원인을 퍼널 데이터와 고객 문의를 기준으로 분석했다.")],
        }],
      },
    },
    expected: {
      mergedStrengthSignals: [{
        signal: "problem_definition",
        evidenceLevel: "explicit_resume_profile",
        confidencePolicy: "preserve_highest_confidence",
        sourceTraces: [
          resumeTrace("Defined the onboarding drop-off problem from funnel evidence."),
          workRecordTrace("온보딩 이탈 원인을 퍼널 데이터와 고객 문의를 기준으로 분석했다."),
        ],
      }],
      mergedRiskSignals: [],
      mergedMissingEvidence: [],
      sourceTracePolicy: "same signal keeps both resume_profile_controlled_candidate and work_record_controlled_candidate traces",
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
          sourceTraces: [resumeTrace("Owned requirements definition for a checkout improvement project.")],
        }],
      },
      workRecordCandidates: {
        supportingEvidence: [{
          signal: "stakeholder_context",
          evidenceLevel: "explicit_work_record",
          sourceTraces: [workRecordTrace("개발팀과 CS 문의를 비교해 요구사항 배경을 정리했다.")],
        }],
      },
    },
    expected: {
      mergedStrengthSignals: [{
        signal: "requirements_definition",
        evidenceLevel: "explicit_resume_profile",
        sourceTraces: [resumeTrace("Owned requirements definition for a checkout improvement project.")],
        supportingTraces: [workRecordTrace("개발팀과 CS 문의를 비교해 요구사항 배경을 정리했다.")],
      }],
      mergedRiskSignals: [],
      mergedMissingEvidence: [],
      sourceTracePolicy: "work_record_controlled_candidate remains supportingTrace and does not overwrite ResumeProfile strength",
      shouldBlockFinalApply: false,
    },
  },
  {
    id: "merge_workrecord_weak_does_not_upgrade",
    input: {
      resumeCandidates: {
        strengthSignals: [],
      },
      workRecordCandidates: {
        riskSignals: [{
          signal: "requirements_definition",
          evidenceLevel: "weak_or_missing",
          reasonCode: "inferred_weak_activity",
          sourceTraces: [workRecordTrace("PM이 정한 요청 목록을 정리하고 전달했다.")],
        }],
      },
    },
    expected: {
      mergedStrengthSignals: [],
      mergedRiskSignals: [{
        signal: "requirements_definition",
        reasonCode: "inferred_weak_activity",
        sourceTraces: [workRecordTrace("PM이 정한 요청 목록을 정리하고 전달했다.")],
      }],
      mergedMissingEvidence: [{
        signal: "requirements_definition",
        clarificationQuestion: "본인이 직접 정의하거나 판단한 요구사항 범위는 무엇인가요?",
        sourceTraces: [workRecordTrace("PM이 정한 요청 목록을 정리하고 전달했다.")],
      }],
      sourceTracePolicy: "weak work record stays risk or missing and does not create strength",
      shouldBlockFinalApply: true,
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
          sourceTraces: [resumeTrace("Owned feature prioritization for onboarding improvements.")],
        }],
      },
      workRecordCandidates: {
        contradictedSignals: [{
          signal: "prioritization",
          evidenceLevel: "contradicted_ownership",
          reasonCode: "po_handled_prioritization",
          sourceTraces: [workRecordTrace("우선순위 결정은 PO가 담당했다.")],
        }],
      },
    },
    expected: {
      mergedStrengthSignals: [],
      mergedRiskSignals: [{
        signal: "prioritization",
        reasonCode: "po_handled_prioritization",
        sourceTraces: [
          resumeTrace("Owned feature prioritization for onboarding improvements."),
          workRecordTrace("우선순위 결정은 PO가 담당했다."),
        ],
      }],
      mergedMissingEvidence: [{
        signal: "prioritization",
        clarificationQuestion: "본인이 직접 결정한 우선순위와 PO가 결정한 범위를 어떻게 구분할 수 있나요?",
        sourceTraces: [
          resumeTrace("Owned feature prioritization for onboarding improvements."),
          workRecordTrace("우선순위 결정은 PO가 담당했다."),
        ],
      }],
      sourceTracePolicy: "conflict preserves both sides and blocks final strength apply",
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
          clarificationQuestion: "출시 이후 어떤 지표를 모니터링했나요?",
          sourceTraces: [resumeTrace("Launched the feature but follow-up metric was not stated.")],
        }],
      },
      workRecordCandidates: {
        missingEvidence: [{
          signal: "post_release_monitoring",
          reasonCode: "work_record_missing_followup",
          clarificationQuestion: "업무기록 기준으로 출시 후 확인한 결과나 다음 행동은 무엇인가요?",
          sourceTraces: [workRecordTrace("개선안을 배포했다.")],
        }],
      },
    },
    expected: {
      mergedStrengthSignals: [],
      mergedRiskSignals: [],
      mergedMissingEvidence: [{
        signal: "post_release_monitoring",
        clarificationQuestion: "출시 이후 어떤 지표를 모니터링했나요?",
        relatedQuestions: ["업무기록 기준으로 출시 후 확인한 결과나 다음 행동은 무엇인가요?"],
        sourceTraces: [
          resumeTrace("Launched the feature but follow-up metric was not stated."),
          workRecordTrace("개선안을 배포했다."),
        ],
        reasonCodes: ["resume_missing_metric_followup", "work_record_missing_followup"],
      }],
      sourceTracePolicy: "dedupe missing signal but preserve source reasons and questions",
      shouldBlockFinalApply: true,
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
      workRecordCandidates: {},
    },
    expected: {
      mergedStrengthSignals: [],
      mergedRiskSignals: [{
        signal: "decision_support",
        reasonCode: "invalid_strength_missing_source",
        sourceTraces: [resumeTrace("Invalid placeholder retained only as risk context.")],
      }],
      invalidCandidates: [{
        signal: "decision_support",
        reasonCode: "source_missing_strength_invalid",
      }],
      mergedMissingEvidence: [],
      sourceTracePolicy: "source-less strength is invalid and cannot merge into strength",
      shouldBlockFinalApply: true,
    },
  },
  {
    id: "merge_manual_confirmed_overrides_candidate",
    input: {
      manualCandidates: {
        strengthSignals: [{
          signal: "prioritization",
          evidenceLevel: "manual_user_confirmed_candidate",
          sourceTraces: [manualTrace("제가 우선순위 결정했습니다.")],
        }],
      },
      workRecordCandidates: {
        riskSignals: [{
          signal: "prioritization",
          reasonCode: "ownership_unclear",
          sourceTraces: [workRecordTrace("요청 목록을 전달했다.")],
        }],
      },
    },
    expected: {
      priorityPolicy: "manual_user_confirmed_candidate wins over explicit and inferred candidates",
      mergedStrengthSignals: [{
        signal: "prioritization",
        evidenceLevel: "manual_user_confirmed_candidate",
        sourceTraces: [manualTrace("제가 우선순위 결정했습니다.")],
        relatedEvidence: [workRecordTrace("요청 목록을 전달했다.")],
      }],
      mergedRiskSignals: [{
        signal: "prioritization",
        reasonCode: "ownership_unclear",
        resolutionState: "related_or_resolved_by_manual_confirmation",
        sourceTraces: [workRecordTrace("요청 목록을 전달했다.")],
      }],
      mergedMissingEvidence: [],
      sourceTracePolicy: "manual confirmation has priority but preserves prior risk source",
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
          sourceTraces: [resumeTrace("Analyzed conversion drop root cause in resume profile.")],
        }],
      },
      workRecordCandidates: {
        strengthSignals: [{
          signal: "root_cause_analysis",
          evidenceLevel: "explicit_work_record",
          sourceTraces: [workRecordTrace("전환율 하락 원인을 SQL 이벤트 로그로 비교 분석했다.")],
        }],
      },
      manualCandidates: {
        strengthSignals: [{
          signal: "root_cause_analysis",
          evidenceLevel: "manual_user_confirmed_candidate",
          sourceTraces: [manualTrace("제가 원인 분석 기준을 정하고 보고했습니다.")],
        }],
      },
    },
    expected: {
      priorityPolicy: "manual_user_confirmed_candidate > explicit_resume_profile > explicit_work_record",
      mergedStrengthSignals: [{
        signal: "root_cause_analysis",
        evidenceLevel: "manual_user_confirmed_candidate",
        sourceTraces: [
          manualTrace("제가 원인 분석 기준을 정하고 보고했습니다."),
          resumeTrace("Analyzed conversion drop root cause in resume profile."),
          workRecordTrace("전환율 하락 원인을 SQL 이벤트 로그로 비교 분석했다."),
        ],
      }],
      mergedRiskSignals: [],
      mergedMissingEvidence: [],
      sourceTracePolicy: "multiple source traces remain attached and no source overwrites another",
      shouldBlockFinalApply: false,
    },
  },
]);
