const trace = (signal, sourceText, sourceIndex = 0, extra = {}) => ({
  sourceText,
  sourceField: "description",
  sourceIndex,
  reasonCode: `fixture_${signal}`,
  ...extra,
});

const baseResumeProfile = Object.freeze({
  schemaVersion: "passmap.resumeProfile.v1",
  candidateLabel: "Controlled Runtime Fixture",
  headline: {
    targetTitle: "Product planning manager",
    summary: "Product planning and operations experience.",
  },
  experiences: [
    {
      id: "controlled-runtime-exp-01",
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

const controlledOptions = ({ signals, confidenceBySignal, tracesBySignal, missingSignals = [], contradictedSignals = [] }) => ({
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
});

export const controlledRuntimeWiringCases = Object.freeze([
  {
    id: "default_disabled_no_change",
    resumeProfile: baseResumeProfile,
    options: {
      controlledOwnershipSignalOptions: controlledOptions({
        signals: ["problem_definition"],
        confidenceBySignal: { problem_definition: "explicit" },
        tracesBySignal: {
          problem_definition: [trace("problem_definition", "Defined product problems from customer pain points.")],
        },
      }),
    },
    expected: {
      controlledStrengthIncludes: [],
      controlledRiskIncludes: [],
      missingIncludes: [],
    },
  },
  {
    id: "opt_in_explicit_pm_strength_added",
    resumeProfile: baseResumeProfile,
    options: {
      enableControlledOwnershipSignals: true,
      controlledOwnershipSignalOptions: controlledOptions({
        signals: ["problem_definition"],
        confidenceBySignal: { problem_definition: "explicit" },
        tracesBySignal: {
          problem_definition: [trace("problem_definition", "Defined product problems from customer pain points.")],
        },
      }),
    },
    expected: {
      controlledStrengthIncludes: ["problem_definition"],
      controlledRiskIncludes: [],
      missingIncludes: [],
    },
  },
  {
    id: "opt_in_weak_signal_to_risk_only",
    resumeProfile: baseResumeProfile,
    options: {
      enableControlledOwnershipSignals: true,
      controlledOwnershipSignalOptions: controlledOptions({
        signals: ["requirements_definition", "post_release_monitoring"],
        confidenceBySignal: {
          requirements_definition: "inferred_weak",
          post_release_monitoring: "absent",
        },
        tracesBySignal: {
          requirements_definition: [trace("requirements_definition", "Helped organize requirements after PM review.")],
          post_release_monitoring: [],
        },
        missingSignals: ["post_release_monitoring"],
      }),
    },
    expected: {
      controlledStrengthExcludes: ["requirements_definition", "post_release_monitoring"],
      controlledRiskIncludes: ["product_ownership_unclear"],
      missingIncludes: ["post_release_monitoring"],
    },
  },
  {
    id: "opt_in_contradicted_signal_blocked",
    resumeProfile: baseResumeProfile,
    options: {
      enableControlledOwnershipSignals: true,
      controlledOwnershipSignalOptions: controlledOptions({
        signals: ["prioritization"],
        confidenceBySignal: { prioritization: "contradicted" },
        tracesBySignal: {
          prioritization: [trace("prioritization", "Prioritization was owned by the PM.", 0, { isContradicted: true })],
        },
        contradictedSignals: ["prioritization"],
      }),
    },
    expected: {
      controlledStrengthExcludes: ["prioritization"],
      controlledRiskIncludes: ["product_ownership_unclear", "prioritization"],
      missingIncludes: [],
    },
  },
  {
    id: "opt_in_source_missing_strength_blocked",
    resumeProfile: baseResumeProfile,
    options: {
      enableControlledOwnershipSignals: true,
      controlledOwnershipSignalOptions: controlledOptions({
        signals: ["cross_functional_collaboration"],
        confidenceBySignal: { cross_functional_collaboration: "explicit" },
        tracesBySignal: {
          cross_functional_collaboration: [],
        },
      }),
    },
    expected: {
      controlledStrengthExcludes: ["cross_functional_collaboration"],
      controlledRiskIncludes: ["product_ownership_unclear"],
      missingIncludes: [],
    },
  },
]);
