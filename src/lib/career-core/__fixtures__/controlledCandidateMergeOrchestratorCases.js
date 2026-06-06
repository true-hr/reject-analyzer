const resumeTrace = (signal, sourceText, sourceIndex = 0, extra = {}) => ({
  sourceText,
  sourceField: "description",
  sourceIndex,
  reasonCode: `orchestrator_fixture_${signal}`,
  ...extra,
});

const manualTrace = (sourceText) => ({
  sourceType: "manual_user_confirmed_candidate",
  sourceText,
  sourceRecordId: "manual-confirmation-1",
  sourceField: "userConfirmation",
});

const baseResumeProfile = Object.freeze({
  schemaVersion: "passmap.resumeProfile.v1",
  candidateLabel: "Controlled Merge Orchestrator Fixture",
  headline: {
    targetTitle: "Product planning manager",
    summary: "Product planning and operations experience.",
  },
  experiences: [
    {
      id: "merge-orchestrator-exp-01",
      company: "PASSMAP Test",
      title: "Product Planning Manager",
      startDate: "2022-01",
      endDate: "2024-12",
      bullets: [
        {
          text: "Defined product problems and coordinated release scope with design and engineering.",
          evidenceType: "strong",
        },
      ],
    },
  ],
});

const pmClassification = Object.freeze({
  roleFamily: "product_planning_pm",
  ownershipLevel: "lead",
  judgmentLevel: "high",
});

const controlledOwnershipOptions = ({ signals, confidenceBySignal, tracesBySignal, missingSignals = [], contradictedSignals = [] }) => ({
  controlledOwnershipSignalOptions: {
    roleFamily: "product_planning_pm",
    signals,
    classification: pmClassification,
    confidence: {
      evidenceConfidenceBySignal: confidenceBySignal,
    },
    traceMap: {
      tracesBySignal,
      missingSignals,
      contradictedSignals,
    },
  },
});

const onboardingRecord = Object.freeze({
  id: "wr_orchestrator_pm_001",
  recordDate: "2026-06-02",
  source: "work_record",
  title: "Onboarding funnel analysis",
  content: "온보딩 이탈 원인을 퍼널 데이터와 고객 문의를 기준으로 분석하고, 개선 우선순위를 정리했다.",
});

const contradictedPrioritizationRecord = Object.freeze({
  id: "wr_orchestrator_pm_002",
  recordDate: "2026-06-03",
  source: "work_record",
  title: "Requirements meeting participation",
  content: "요구사항 정리 회의에 참여했다. 최종 요구사항 정의와 우선순위 결정은 PO가 담당했다.",
});

const supportOnlyRecord = Object.freeze({
  id: "wr_orchestrator_pm_003",
  recordDate: "2026-06-04",
  source: "work_record",
  title: "PM request handoff",
  content: "PM이 정한 개선 요청 목록을 노션에 정리하고 개발팀에 전달했다.",
});

export const controlledCandidateMergeOrchestratorCases = Object.freeze([
  {
    id: "orchestrate_resume_only_controlled_candidates",
    input: {
      resumeProfile: baseResumeProfile,
      resumeOptions: controlledOwnershipOptions({
        signals: ["problem_definition", "post_release_monitoring"],
        confidenceBySignal: {
          problem_definition: "explicit",
          post_release_monitoring: "absent",
        },
        tracesBySignal: {
          problem_definition: [resumeTrace("problem_definition", "Defined onboarding drop-off from funnel evidence.")],
          post_release_monitoring: [],
        },
        missingSignals: ["post_release_monitoring"],
      }),
    },
    expected: {
      mergedStrengthIncludes: ["problem_definition"],
      mergedMissingIncludes: ["post_release_monitoring"],
      sourceSummary: {
        hasResumeProfile: true,
        hasWorkRecords: false,
        hasManualConfirmedCandidates: false,
        resumeCandidateCount: 2,
        workRecordCandidateCount: 0,
        manualCandidateCount: 0,
      },
    },
  },
  {
    id: "orchestrate_work_records_only_controlled_candidates",
    input: {
      workRecords: [onboardingRecord],
    },
    expected: {
      mergedStrengthIncludes: ["problem_definition", "prioritization"],
      sourceSummary: {
        hasResumeProfile: false,
        hasWorkRecords: true,
        hasManualConfirmedCandidates: false,
        resumeCandidateCount: 0,
        workRecordCandidateCount: 2,
        manualCandidateCount: 0,
      },
    },
  },
  {
    id: "orchestrate_resume_and_work_records_same_signal",
    input: {
      resumeProfile: baseResumeProfile,
      resumeOptions: controlledOwnershipOptions({
        signals: ["problem_definition"],
        confidenceBySignal: { problem_definition: "explicit" },
        tracesBySignal: {
          problem_definition: [resumeTrace("problem_definition", "Defined onboarding drop-off from funnel evidence.")],
        },
      }),
      workRecords: [onboardingRecord],
    },
    expected: {
      mergedStrengthIncludes: ["problem_definition", "prioritization"],
      dedupedSignal: "problem_definition",
      minSourceTraceCountBySignal: {
        problem_definition: 2,
      },
      sourceSummary: {
        hasResumeProfile: true,
        hasWorkRecords: true,
        hasManualConfirmedCandidates: false,
        resumeCandidateCount: 1,
        workRecordCandidateCount: 2,
        manualCandidateCount: 0,
      },
    },
  },
  {
    id: "orchestrate_contradicted_work_record_blocks_candidate",
    input: {
      resumeProfile: baseResumeProfile,
      resumeOptions: controlledOwnershipOptions({
        signals: ["prioritization"],
        confidenceBySignal: { prioritization: "explicit" },
        tracesBySignal: {
          prioritization: [resumeTrace("prioritization", "Owned prioritization for onboarding improvements.")],
        },
      }),
      workRecords: [contradictedPrioritizationRecord],
    },
    expected: {
      mergedStrengthExcludes: ["prioritization"],
      contradictedIncludes: ["prioritization"],
      mergedMissingIncludes: ["prioritization", "user_role", "judgment_criteria"],
      shouldBlockFinalApply: true,
      sourceSummary: {
        hasResumeProfile: true,
        hasWorkRecords: true,
        hasManualConfirmedCandidates: false,
        resumeCandidateCount: 1,
        workRecordCandidateCount: 4,
        manualCandidateCount: 0,
      },
    },
  },
  {
    id: "orchestrate_manual_confirmed_priority",
    input: {
      workRecords: [supportOnlyRecord],
      manualConfirmedCandidates: {
        strengthSignals: [{
          signal: "prioritization",
          evidenceLevel: "manual_user_confirmed_candidate",
          confidence: 1,
          sourceTraces: [manualTrace("I personally decided the improvement prioritization.")],
        }],
      },
    },
    expected: {
      mergedStrengthIncludes: ["prioritization"],
      manualPrioritySignal: "prioritization",
      relatedRiskIncludes: ["product_ownership_unclear", "insufficient_ownership_evidence"],
      mergedMissingIncludes: ["user_role", "judgment_criteria"],
      sourceSummary: {
        hasResumeProfile: false,
        hasWorkRecords: true,
        hasManualConfirmedCandidates: true,
        resumeCandidateCount: 0,
        workRecordCandidateCount: 4,
        manualCandidateCount: 1,
      },
    },
  },
]);
